'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, Eye, Shield, Video, VideoOff } from 'lucide-react'
import { useRemoteSession } from '@/hooks/useRemoteSession'
import { VideoOverlay } from './VideoOverlay'
import { useIsElectron } from '@/lib/electron/hooks'

/**
 * Composant pour les enfants
 * - Affiche l'état de connexion
 * - Montre quand le mentor regarde/contrôle
 * - Affiche la vidéo du mentor
 */
export function ChildRemoteStatus() {
  const isElectron = useIsElectron()
  const {
    isConnected,
    connectionState,
    connectedPeer,
    remoteVideoStream,
    localVideoStream,
    role,
  } = useRemoteSession()

  // Ne rien afficher si mentor ou pas dans Electron
  if (role === 'mentor' || !isElectron) return null

  const isBeingWatched = connectedPeer !== null && connectionState === 'connected'

  return (
    <>
      {/* Indicateur de connexion discret en bas à gauche */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 left-4 z-40"
      >
        <div className={`
          flex items-center gap-2 px-4 py-2 rounded-full text-sm backdrop-blur-sm
          ${isConnected 
            ? 'bg-green-600/20 border border-green-500/30 text-green-400'
            : 'bg-amber-600/20 border border-amber-500/30 text-amber-400'
          }
        `}>
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>Connectée au service</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Connexion...</span>
            </>
          )}
        </div>
      </motion.div>

      {/* Notification quand le mentor regarde */}
      <AnimatePresence>
        {isBeingWatched && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-gradient-to-r from-aurora-900/95 to-purple-900/95 border border-aurora-500/50 shadow-2xl backdrop-blur-sm">
              {/* Icône animée */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-aurora-600/30 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-aurora-300" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 rounded-full border-2 border-aurora-400/50"
                />
              </div>

              {/* Texte */}
              <div>
                <p className="text-white font-semibold text-lg">
                  Le Mentor t'aide ! ✨
                </p>
                <p className="text-aurora-300 text-sm">
                  {connectedPeer?.name || 'Mentor'} peut voir et guider ton écran
                </p>
              </div>

              {/* Indicateur vidéo */}
              {remoteVideoStream && (
                <div className="flex items-center gap-1 text-green-400 text-sm ml-4">
                  <Video className="w-4 h-4" />
                  <span>Vidéo active</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vidéo du mentor (petite fenêtre) */}
      <AnimatePresence>
        {remoteVideoStream && connectedPeer && (
          <VideoOverlay
            stream={remoteVideoStream}
            name={connectedPeer.name}
          />
        )}
        {/* Aperçu de sa propre vidéo (plus petit) */}
        {localVideoStream && isBeingWatched && (
          <VideoOverlay
            stream={localVideoStream}
            name="Toi"
            isSelf
          />
        )}
      </AnimatePresence>
    </>
  )
}

