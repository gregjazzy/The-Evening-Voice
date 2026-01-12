'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Monitor, Users, Wifi, WifiOff, MousePointer, Keyboard,
  Phone, PhoneOff, Maximize2, Minimize2, RefreshCw, Video
} from 'lucide-react'
import { useRemoteSession } from '@/hooks/useRemoteSession'
import { VideoOverlay } from './VideoOverlay'
import { cn } from '@/lib/utils'
import { useIsElectron } from '@/lib/electron/hooks'
import type { PeerInfo } from '@/lib/webrtc'

/**
 * Panel de contrôle à distance complet pour le mentor
 * - Liste des enfants connectés
 * - Vue de leur écran
 * - Contrôle souris/clavier
 * - Vidéo bidirectionnelle
 */
export function RemoteControlPanel() {
  const isElectron = useIsElectron()
  const {
    isConnected,
    connectionState,
    availablePeers,
    connectedPeer,
    remoteScreenStream,
    remoteVideoStream,
    localVideoStream,
    error,
    role,
    connectToPeer,
    disconnect,
    sendClick,
    sendKey,
  } = useRemoteSession()

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isControlling, setIsControlling] = useState(false)
  const screenRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Attacher le stream d'écran
  useEffect(() => {
    if (screenRef.current && remoteScreenStream) {
      screenRef.current.srcObject = remoteScreenStream
    }
  }, [remoteScreenStream])

  // Gérer les clics sur l'écran distant
  const handleScreenClick = useCallback((e: React.MouseEvent<HTMLVideoElement>) => {
    if (!isControlling || !screenRef.current) return

    const rect = screenRef.current.getBoundingClientRect()
    const video = screenRef.current

    // Calculer les coordonnées relatives à la vidéo
    const scaleX = video.videoWidth / rect.width
    const scaleY = video.videoHeight / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    sendClick(x, y)
  }, [isControlling, sendClick])

  // Gérer les touches clavier
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isControlling) return

    e.preventDefault()
    
    const modifiers: string[] = []
    if (e.metaKey) modifiers.push('cmd')
    if (e.shiftKey) modifiers.push('shift')
    if (e.altKey) modifiers.push('alt')
    if (e.ctrlKey) modifiers.push('ctrl')

    sendKey(e.key, modifiers)
  }, [isControlling, sendKey])

  // Écouter le clavier quand le contrôle est actif
  useEffect(() => {
    if (isControlling) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isControlling, handleKeyDown])

  // Message si pas mentor
  if (role !== 'mentor') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Monitor className="w-16 h-16 text-aurora-400 mb-4" />
        <h2 className="text-2xl font-display text-white mb-2">
          Mode Mentor Requis
        </h2>
        <p className="text-aurora-300">
          Cette fonctionnalité est réservée aux mentors.
        </p>
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
        "w-72 border-r border-aurora-800/50 p-4 flex flex-col bg-gray-950/50",
        isFullscreen && "hidden"
      )}>
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-aurora-400" />
          <h3 className="font-semibold text-white">Enfants en ligne</h3>
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-400 ml-auto" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400 ml-auto" />
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-500/50 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Liste des enfants */}
        {availablePeers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-aurora-900/30 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-aurora-500" />
            </div>
            <p className="text-aurora-400 text-sm mb-2">
              En attente des connexions...
            </p>
            <p className="text-aurora-500 text-xs">
              Les enfants doivent ouvrir<br />l'app La Voix du Soir
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {availablePeers.map((peer) => (
              <ChildCard
                key={peer.clientId}
                peer={peer}
                isSelected={connectedPeer?.clientId === peer.clientId}
                onConnect={() => connectToPeer(peer)}
              />
            ))}
          </div>
        )}

        {/* Bouton déconnexion */}
        {connectedPeer && (
          <button
            onClick={disconnect}
            className="mt-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-900/30 border border-red-500/50 text-red-300 hover:bg-red-900/50 transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
            Terminer la session
          </button>
        )}
      </div>

      {/* Zone principale - Écran distant */}
      <div className="flex-1 flex flex-col" ref={containerRef}>
        {/* Toolbar */}
        <div className="flex items-center gap-4 p-4 border-b border-aurora-800/50 bg-gray-950/50">
          {connectedPeer ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-white font-medium">
                  Écran de {connectedPeer.name}
                </span>
              </div>
              
              <button
                onClick={() => setIsControlling(!isControlling)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                  isControlling
                    ? "bg-green-600 text-white shadow-lg shadow-green-500/30"
                    : "bg-aurora-800/50 text-aurora-300 hover:bg-aurora-700/50"
                )}
              >
                <MousePointer className="w-4 h-4" />
                {isControlling ? "Contrôle Actif" : "Prendre le Contrôle"}
              </button>

              {isControlling && (
                <div className="flex items-center gap-2 text-green-400 text-sm animate-pulse">
                  <Keyboard className="w-4 h-4" />
                  Clavier actif
                </div>
              )}

              <div className="ml-auto flex items-center gap-2">
                <span className="text-aurora-400 text-sm">
                  {connectionState === 'connected' ? '🟢 Connecté' : '🟡 ' + connectionState}
                </span>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-lg bg-aurora-800/50 hover:bg-aurora-700/50 text-aurora-300"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </>
          ) : (
            <span className="text-aurora-400">
              Sélectionne un enfant pour voir son écran
            </span>
          )}
        </div>

        {/* Écran distant */}
        <div className="flex-1 flex items-center justify-center p-4 bg-black/30">
          {remoteScreenStream ? (
            <video
              ref={screenRef}
              autoPlay
              playsInline
              onClick={handleScreenClick}
              className={cn(
                "max-w-full max-h-full rounded-lg shadow-2xl",
                isControlling && "cursor-crosshair"
              )}
              style={{
                boxShadow: isControlling 
                  ? '0 0 30px rgba(34, 197, 94, 0.3)' 
                  : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              }}
            />
          ) : (
            <div className="text-center text-aurora-400">
              <Monitor className="w-24 h-24 mx-auto mb-4 opacity-30" />
              <p className="text-lg">
                {connectedPeer 
                  ? "Connexion en cours..."
                  : "Sélectionne un enfant dans la liste"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Vidéos webcam */}
      <AnimatePresence>
        {localVideoStream && (
          <VideoOverlay
            stream={localVideoStream}
            name="Toi"
            isSelf
          />
        )}
        {remoteVideoStream && connectedPeer && (
          <VideoOverlay
            stream={remoteVideoStream}
            name={connectedPeer.name}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Carte d'un enfant dans la liste
 */
function ChildCard({ 
  peer, 
  isSelected, 
  onConnect 
}: { 
  peer: PeerInfo
  isSelected: boolean
  onConnect: () => void 
}) {
  return (
    <motion.button
      onClick={onConnect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left",
        isSelected
          ? "bg-aurora-600/30 border-2 border-aurora-500 shadow-lg shadow-aurora-500/20"
          : "bg-aurora-900/30 border border-aurora-800/50 hover:border-aurora-600/50"
      )}
    >
      {/* Avatar */}
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-aurora-500 flex items-center justify-center text-xl font-medium text-white">
          {peer.name.charAt(0).toUpperCase()}
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-gray-900" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{peer.name}</p>
        <p className="text-aurora-400 text-xs">
          {isSelected ? '🎮 Session active' : '🟢 En ligne'}
        </p>
      </div>

      {/* Action */}
      {!isSelected && (
        <div className="flex items-center gap-1 text-aurora-400">
          <Video className="w-4 h-4" />
          <span className="text-xs">Connecter</span>
        </div>
      )}
    </motion.button>
  )
}

