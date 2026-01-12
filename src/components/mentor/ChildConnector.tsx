'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, Eye, Shield, Monitor } from 'lucide-react'
import { useIsElectron, useAccessibilityPermissions } from '@/lib/electron/hooks'
import { useAuthStore } from '@/store/useAuthStore'

interface ChildConnectorProps {
  mentorServerUrl?: string
}

/**
 * Composant pour les enfants : se connecte automatiquement au mentor
 * et partage l'écran quand demandé
 */
export function ChildConnector({ mentorServerUrl = 'ws://192.168.1.1:3002' }: ChildConnectorProps) {
  const isElectron = useIsElectron()
  const { profile } = useAuthStore()
  const { hasPermission } = useAccessibilityPermissions()
  
  const [connected, setConnected] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [mentorName, setMentorName] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fonction pour capturer et envoyer l'écran
  const captureAndSend = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    if (!window.electronAPI) return

    const imageData = await window.electronAPI.captureScreen()
    if (imageData) {
      wsRef.current.send(JSON.stringify({
        type: 'screen_data',
        imageData,
      }))
    }
  }, [])

  // Connexion au serveur mentor
  useEffect(() => {
    if (!isElectron || profile?.role !== 'child') return

    const connect = () => {
      const ws = new WebSocket(mentorServerUrl)
      
      ws.onopen = () => {
        setConnected(true)
        ws.send(JSON.stringify({
          type: 'register',
          clientType: 'child',
          name: profile?.name || 'Enfant',
        }))
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'send_screen':
            // Le mentor demande l'écran → capturer et envoyer
            setSharing(true)
            captureAndSend()
            break

          case 'remote_click':
            // Le mentor clique
            if (window.electronAPI) {
              window.electronAPI.simulateClick(data.x, data.y)
            }
            break

          case 'remote_key':
            // Le mentor tape
            if (window.electronAPI) {
              window.electronAPI.simulateKey(data.key, data.modifiers)
            }
            break

          case 'mentor_connected':
            setMentorName(data.name)
            break

          case 'mentor_disconnected':
            setMentorName(null)
            setSharing(false)
            break
        }
      }

      ws.onclose = () => {
        setConnected(false)
        setSharing(false)
        // Reconnecter après 3 secondes
        setTimeout(connect, 3000)
      }

      ws.onerror = () => {
        setConnected(false)
      }

      wsRef.current = ws
    }

    connect()

    // Nettoyer à la déconnexion
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isElectron, profile, mentorServerUrl, captureAndSend])

  // Streaming continu quand le partage est actif
  useEffect(() => {
    if (sharing) {
      intervalRef.current = setInterval(captureAndSend, 100) // 10 FPS
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [sharing, captureAndSend])

  // Ne rien afficher si pas Electron ou pas enfant
  if (!isElectron || profile?.role !== 'child') return null

  return (
    <AnimatePresence>
      {/* Indicateur de connexion discret */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 left-4 z-50"
      >
        <div className={`
          flex items-center gap-2 px-3 py-2 rounded-full text-sm
          ${connected 
            ? 'bg-green-600/20 border border-green-500/30 text-green-400'
            : 'bg-amber-600/20 border border-amber-500/30 text-amber-400'
          }
        `}>
          {connected ? (
            <>
              <Wifi className="w-4 h-4" />
              {sharing ? (
                <>
                  <Eye className="w-4 h-4 animate-pulse" />
                  <span>Mentor connecté</span>
                </>
              ) : (
                <span>Connectée</span>
              )}
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Connexion...</span>
            </>
          )}
        </div>
      </motion.div>

      {/* Notification quand le partage commence */}
      {sharing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-aurora-900/90 border border-aurora-500/50 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-aurora-600/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-aurora-300" />
            </div>
            <div>
              <p className="text-white font-medium">Le Mentor t'aide ! 💫</p>
              <p className="text-aurora-400 text-sm">Il peut voir et guider ton écran</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

