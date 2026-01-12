'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Monitor, MousePointer, Keyboard, Users, Wifi, WifiOff,
  Maximize2, Minimize2, RefreshCw, AlertCircle
} from 'lucide-react'
import { useIsElectron, useMentorConnection, useAccessibilityPermissions } from '@/lib/electron/hooks'
import { cn } from '@/lib/utils'

interface Child {
  id: string
  name: string
}

export function RemoteDesktop() {
  const isElectron = useIsElectron()
  const { hasPermission, checkPermissions } = useAccessibilityPermissions()
  const {
    connected,
    children,
    currentScreen,
    connect,
    disconnect,
    requestScreen,
    sendClick,
    sendKey,
  } = useMentorConnection()

  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isControlling, setIsControlling] = useState(false)
  const screenRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Rafraîchir l'écran en continu quand un enfant est sélectionné
  useEffect(() => {
    if (!selectedChild || !connected) return

    const interval = setInterval(() => {
      requestScreen(selectedChild.id)
    }, 100) // 10 FPS

    return () => clearInterval(interval)
  }, [selectedChild, connected, requestScreen])

  // Gérer les clics sur l'écran distant
  const handleScreenClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedChild || !isControlling || !imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const scaleX = 1920 / rect.width // Supposer 1920x1080
    const scaleY = 1080 / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    sendClick(selectedChild.id, x, y)
  }, [selectedChild, isControlling, sendClick])

  // Gérer les touches clavier
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedChild || !isControlling) return

    e.preventDefault()
    
    const modifiers: string[] = []
    if (e.metaKey) modifiers.push('cmd')
    if (e.shiftKey) modifiers.push('shift')
    if (e.altKey) modifiers.push('alt')
    if (e.ctrlKey) modifiers.push('ctrl')

    sendKey(selectedChild.id, e.key, modifiers)
  }, [selectedChild, isControlling, sendKey])

  // Activer/désactiver l'écoute clavier
  useEffect(() => {
    if (isControlling) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isControlling, handleKeyDown])

  // Se connecter automatiquement comme mentor
  useEffect(() => {
    if (isElectron && !connected) {
      connect('mentor', 'Mentor')
    }
  }, [isElectron, connected, connect])

  // Si pas dans Electron, afficher un message
  if (!isElectron) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Monitor className="w-16 h-16 text-aurora-400 mb-4" />
        <h2 className="text-2xl font-display text-white mb-2">
          Mode Bureau Requis
        </h2>
        <p className="text-aurora-300 max-w-md">
          Pour contrôler les ordinateurs à distance, lance l'application 
          <strong className="text-aurora-400"> La Voix du Soir.app</strong> 
          {' '}au lieu du navigateur.
        </p>
      </div>
    )
  }

  // Si pas les permissions
  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle className="w-16 h-16 text-amber-400 mb-4" />
        <h2 className="text-2xl font-display text-white mb-2">
          Permissions Requises
        </h2>
        <p className="text-aurora-300 max-w-md mb-4">
          Pour contrôler les ordinateurs à distance, autorise l'accès dans 
          <strong className="text-amber-400"> Réglages Système → Confidentialité → Accessibilité</strong>
        </p>
        <button
          onClick={checkPermissions}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Vérifier à nouveau
        </button>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex h-full",
      isFullscreen && "fixed inset-0 z-50 bg-gray-950"
    )}>
      {/* Liste des enfants connectés */}
      <div className={cn(
        "w-64 border-r border-aurora-800/50 p-4 flex flex-col",
        isFullscreen && "hidden"
      )}>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-aurora-400" />
          <h3 className="font-semibold text-white">Enfants Connectés</h3>
          {connected ? (
            <Wifi className="w-4 h-4 text-green-400 ml-auto" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400 ml-auto" />
          )}
        </div>

        {children.length === 0 ? (
          <p className="text-aurora-400 text-sm">
            En attente des connexions...
            <br /><br />
            Les filles doivent ouvrir l'app La Voix du Soir sur leur Mac.
          </p>
        ) : (
          <div className="space-y-2">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className={cn(
                  "w-full p-3 rounded-xl flex items-center gap-3 transition-all",
                  selectedChild?.id === child.id
                    ? "bg-aurora-600/30 border border-aurora-500"
                    : "bg-aurora-900/30 border border-aurora-800/50 hover:border-aurora-600/50"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-aurora-500 flex items-center justify-center text-lg">
                  {child.name.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">{child.name}</p>
                  <p className="text-aurora-400 text-xs">En ligne</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Écran distant */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-4 p-4 border-b border-aurora-800/50">
          {selectedChild && (
            <>
              <span className="text-white font-medium">
                Écran de {selectedChild.name}
              </span>
              
              <button
                onClick={() => setIsControlling(!isControlling)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                  isControlling
                    ? "bg-green-600 text-white"
                    : "bg-aurora-800/50 text-aurora-300 hover:bg-aurora-700/50"
                )}
              >
                <MousePointer className="w-4 h-4" />
                {isControlling ? "Contrôle Actif" : "Prendre le Contrôle"}
              </button>

              {isControlling && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <Keyboard className="w-4 h-4" />
                  Clavier actif
                </div>
              )}

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="ml-auto p-2 rounded-lg bg-aurora-800/50 hover:bg-aurora-700/50 text-aurora-300"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Zone d'affichage de l'écran */}
        <div 
          ref={screenRef}
          className="flex-1 flex items-center justify-center p-4 bg-black/50"
          onClick={handleScreenClick}
          style={{ cursor: isControlling ? 'crosshair' : 'default' }}
        >
          {selectedChild && currentScreen ? (
            <img
              ref={imageRef}
              src={currentScreen}
              alt={`Écran de ${selectedChild.name}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              draggable={false}
            />
          ) : (
            <div className="text-center text-aurora-400">
              <Monitor className="w-24 h-24 mx-auto mb-4 opacity-50" />
              <p>
                {selectedChild 
                  ? "Chargement de l'écran..."
                  : "Sélectionne un enfant pour voir son écran"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

