/**
 * Hooks pour interagir avec Electron
 */

import { useState, useEffect, useCallback } from 'react'

// Types pour l'API Electron (SÉCURISÉE)
interface ElectronAPI {
  checkPermissions: () => Promise<boolean>
  captureScreen: () => Promise<string | null>
  getScreenSize: () => Promise<{ width: number; height: number }>
  getScreenSources: () => Promise<Array<{ id: string; name: string; thumbnail: string }>>
  
  // Contrôle à distance SÉCURISÉ (requiert session active)
  startControlSession: (sessionId: string, mentorId: string) => Promise<{ success: boolean }>
  stopControlSession: () => Promise<{ success: boolean }>
  hasActiveControlSession: () => boolean
  simulateClick: (x: number, y: number) => void
  simulateKey: (key: string, modifiers?: string[]) => void
  
  isElectron: boolean
  platform: string
  
  // TTS natif macOS
  tts?: {
    speak: (text: string, locale: string) => Promise<void>
    stop: () => Promise<void>
    checkVoice: (voiceName: string) => Promise<boolean>
  }
}

interface DesktopCapturer {
  getSources: (options: {
    types: string[]
    thumbnailSize?: { width: number; height: number }
  }) => Promise<Array<{
    id: string
    name: string
    thumbnail: { toDataURL: () => string }
  }>>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
    desktopCapturer?: DesktopCapturer
  }
}

/**
 * Vérifie si l'app tourne dans Electron
 */
export function useIsElectron(): boolean {
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    setIsElectron(!!window.electronAPI?.isElectron)
  }, [])

  return isElectron
}

/**
 * Hook pour les permissions d'accessibilité
 */
export function useAccessibilityPermissions() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)

  const checkPermissions = useCallback(async () => {
    if (!window.electronAPI) return false
    
    setChecking(true)
    try {
      const result = await window.electronAPI.checkPermissions()
      setHasPermission(result)
      return result
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    if (window.electronAPI) {
      checkPermissions()
    }
  }, [checkPermissions])

  return { hasPermission, checking, checkPermissions }
}

/**
 * Hook pour la capture d'écran
 */
export function useScreenCapture() {
  const [capturing, setCapturing] = useState(false)
  const [lastCapture, setLastCapture] = useState<string | null>(null)

  const capture = useCallback(async () => {
    if (!window.electronAPI) return null
    
    setCapturing(true)
    try {
      const imageData = await window.electronAPI.captureScreen()
      setLastCapture(imageData)
      return imageData
    } finally {
      setCapturing(false)
    }
  }, [])

  // Capture continue (pour le streaming)
  const startContinuousCapture = useCallback((intervalMs = 100) => {
    const interval = setInterval(async () => {
      await capture()
    }, intervalMs)
    
    return () => clearInterval(interval)
  }, [capture])

  return { capture, capturing, lastCapture, startContinuousCapture }
}

/**
 * Hook pour le contrôle à distance
 */
export function useRemoteControl() {
  const click = useCallback((x: number, y: number) => {
    if (!window.electronAPI) return
    window.electronAPI.simulateClick(x, y)
  }, [])

  const keypress = useCallback((key: string, modifiers?: string[]) => {
    if (!window.electronAPI) return
    window.electronAPI.simulateKey(key, modifiers)
  }, [])

  const setMode = useCallback((mode: 'mentor' | 'child') => {
    if (!window.electronAPI) return
    window.electronAPI.setAppMode(mode)
  }, [])

  return { click, keypress, setMode }
}

/**
 * Hook pour la connexion WebSocket mentor/enfant
 */
export function useMentorConnection(serverUrl: string = 'ws://localhost:3002') {
  const [connected, setConnected] = useState(false)
  const [children, setChildren] = useState<Array<{ id: string; name: string }>>([])
  const [currentScreen, setCurrentScreen] = useState<string | null>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)

  // Connexion au serveur
  const connect = useCallback((role: 'mentor' | 'child', name: string) => {
    const socket = new WebSocket(serverUrl)
    
    socket.onopen = () => {
      setConnected(true)
      socket.send(JSON.stringify({
        type: 'register',
        clientType: role,
        name,
      }))
    }
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'child_connected':
          setChildren(prev => [...prev, { id: data.childId, name: data.childName }])
          break
          
        case 'child_disconnected':
          setChildren(prev => prev.filter(c => c.id !== data.childId))
          break
          
        case 'screen_update':
          setCurrentScreen(data.imageData)
          break
          
        case 'send_screen':
          // L'enfant doit envoyer son écran
          captureAndSend(socket)
          break
      }
    }
    
    socket.onclose = () => {
      setConnected(false)
    }
    
    setWs(socket)
    return socket
  }, [serverUrl])

  // Capturer et envoyer l'écran (côté enfant)
  const captureAndSend = async (socket: WebSocket) => {
    if (!window.electronAPI) return
    
    const imageData = await window.electronAPI.captureScreen()
    if (imageData && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'screen_data',
        imageData,
      }))
    }
  }

  // Demander l'écran d'un enfant (côté mentor)
  const requestScreen = useCallback((childId: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'request_screen',
        childId,
      }))
    }
  }, [ws])

  // Envoyer un clic à distance
  const sendClick = useCallback((childId: string, x: number, y: number) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'remote_click',
        childId,
        x,
        y,
      }))
    }
  }, [ws])

  // Envoyer une touche à distance
  const sendKey = useCallback((childId: string, key: string, modifiers?: string[]) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'remote_key',
        childId,
        key,
        modifiers,
      }))
    }
  }, [ws])

  // Déconnexion
  const disconnect = useCallback(() => {
    if (ws) {
      ws.close()
      setWs(null)
    }
  }, [ws])

  return {
    connected,
    children,
    currentScreen,
    connect,
    disconnect,
    requestScreen,
    sendClick,
    sendKey,
  }
}

