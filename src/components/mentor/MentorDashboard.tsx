'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMentorStore } from '@/store/useMentorStore'
import { useWebRTC } from '@/hooks/useWebRTC'
import {
  Monitor,
  MonitorOff,
  Hand,
  HandMetal,
  Users,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Send,
  BookOpen,
  Lightbulb,
  Target,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Missions prédéfinies
const predefinedMissions = [
  {
    id: 'mission-prompt',
    title: '📝 Écrire un prompt',
    description: 'Apprends à décrire une image avec Sujet + Style + Lumière + Ambiance',
  },
  {
    id: 'mission-gemini',
    title: '🔍 Utiliser Gemini',
    description: 'Ouvre Safari et pose une question à Gemini pour trouver des idées',
  },
  {
    id: 'mission-studio',
    title: '🎨 Créer avec fal.ai',
    description: 'Utilise ton prompt pour générer une image magique',
  },
  {
    id: 'mission-story',
    title: '✍️ Écrire un chapitre',
    description: 'Écris la suite de ton histoire avec au moins 5 phrases',
  },
]

export function MentorDashboard() {
  const {
    isConnected,
    sessionId,
    connectedUsers,
    controlActive,
    remoteStream,
    isScreenSharing,
    requestControl,
    releaseControl,
    startScreenShare,
    stopScreenShare,
    sendMission,
    disconnect,
  } = useMentorStore()

  const { initiateConnection, peers } = useWebRTC()
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showMissions, setShowMissions] = useState(false)

  // Afficher le stream vidéo distant
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  // Liste des enfants connectés
  const children = connectedUsers.filter(u => u.role === 'child')

  const handleStartScreenShare = async () => {
    try {
      await startScreenShare()
      // Initier la connexion WebRTC avec les enfants
      children.forEach(child => {
        initiateConnection(child.socketId)
      })
    } catch (error) {
      console.error('Erreur partage écran:', error)
    }
  }

  const handleSendMission = (mission: typeof predefinedMissions[0]) => {
    sendMission(mission)
    setShowMissions(false)
  }

  return (
    <div className="h-full flex flex-col gap-6">
      {/* En-tête */}
      <motion.header 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="font-display text-3xl text-aurora-300 mb-1 flex items-center gap-3">
            <Monitor className="w-8 h-8" />
            Dashboard Mentor
          </h1>
          <p className="text-midnight-300 flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-dream-400" />
                Connecté à la session {sessionId}
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-rose-400" />
                Non connecté
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => disconnect()}
            className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.header>

      <div className="flex-1 flex gap-6">
        {/* Zone vidéo principale */}
        <motion.section 
          className={cn(
            "flex-1 glass rounded-3xl overflow-hidden relative",
            isFullscreen && "fixed inset-4 z-50"
          )}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Écran de l'enfant */}
          <div className="absolute inset-0 bg-midnight-950 flex items-center justify-center">
            {remoteStream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isMuted}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center">
                <MonitorOff className="w-16 h-16 text-midnight-600 mx-auto mb-4" />
                <p className="text-midnight-400">
                  En attente du partage d'écran...
                </p>
                <p className="text-sm text-midnight-500 mt-2">
                  L'enfant doit accepter le partage pour voir son écran
                </p>
              </div>
            )}
          </div>

          {/* Contrôles vidéo */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-midnight-900/80 backdrop-blur-sm">
            <motion.button
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "p-3 rounded-xl transition-colors",
                isMuted ? "bg-rose-500/30 text-rose-300" : "bg-midnight-800 text-white hover:bg-midnight-700"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </motion.button>

            <motion.button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-3 rounded-xl bg-midnight-800 text-white hover:bg-midnight-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </motion.button>
          </div>

          {/* Indicateur de contrôle actif */}
          <AnimatePresence>
            {controlActive && (
              <motion.div
                className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-full bg-aurora-500/30 text-aurora-300 text-sm font-medium"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <span className="w-2 h-2 rounded-full bg-aurora-400 animate-pulse" />
                Contrôle actif
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Panneau de contrôle */}
        <motion.aside 
          className="w-80 flex flex-col gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Utilisateurs connectés */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm uppercase tracking-wider text-midnight-400 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Connectés ({children.length})
            </h3>
            
            {children.length === 0 ? (
              <p className="text-sm text-midnight-500 text-center py-4">
                En attente des élèves...
              </p>
            ) : (
              <div className="space-y-2">
                {children.map((child) => (
                  <motion.div
                    key={child.socketId}
                    className="flex items-center gap-3 p-3 rounded-xl bg-midnight-800/30"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-aurora-500 to-dream-500 flex items-center justify-center text-white text-sm font-bold">
                      {child.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{child.name}</p>
                      <p className="text-xs text-dream-400">En ligne</p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-dream-400" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Contrôle à distance */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm uppercase tracking-wider text-midnight-400 mb-3 flex items-center gap-2">
              <Hand className="w-4 h-4" />
              Contrôle à distance
            </h3>

            <div className="space-y-3">
              {/* Bouton de contrôle */}
              {controlActive ? (
                <motion.button
                  onClick={releaseControl}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <HandMetal className="w-5 h-5" />
                  Relâcher le contrôle
                </motion.button>
              ) : (
                <motion.button
                  onClick={requestControl}
                  disabled={children.length === 0}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 p-4 rounded-xl font-semibold transition-all",
                    children.length === 0
                      ? "bg-midnight-800/50 text-midnight-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-aurora-600 to-aurora-700 text-white shadow-glow"
                  )}
                  whileHover={children.length > 0 ? { scale: 1.02 } : {}}
                  whileTap={children.length > 0 ? { scale: 0.98 } : {}}
                >
                  <Hand className="w-5 h-5" />
                  Prendre le contrôle
                </motion.button>
              )}

              {/* Partage d'écran */}
              <motion.button
                onClick={isScreenSharing ? stopScreenShare : handleStartScreenShare}
                className={cn(
                  "w-full flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all",
                  isScreenSharing
                    ? "bg-dream-600/30 text-dream-300"
                    : "bg-midnight-800/50 text-midnight-300 hover:bg-midnight-700/50"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isScreenSharing ? (
                  <>
                    <VideoOff className="w-5 h-5" />
                    Arrêter le partage
                  </>
                ) : (
                  <>
                    <Video className="w-5 h-5" />
                    Partager mon écran
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Missions Flash */}
          <div className="glass rounded-2xl p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm uppercase tracking-wider text-midnight-400 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Missions Flash
              </h3>
              <motion.button
                onClick={() => setShowMissions(!showMissions)}
                className="text-aurora-400 text-xs hover:text-aurora-300"
                whileHover={{ scale: 1.05 }}
              >
                {showMissions ? 'Fermer' : '+ Nouvelle'}
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              {showMissions ? (
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {predefinedMissions.map((mission) => (
                    <motion.button
                      key={mission.id}
                      onClick={() => handleSendMission(mission)}
                      className="w-full text-left p-3 rounded-xl bg-midnight-800/30 hover:bg-midnight-700/30 transition-colors"
                      whileHover={{ x: 5 }}
                    >
                      <p className="font-medium text-sm">{mission.title}</p>
                      <p className="text-xs text-midnight-400 mt-1">{mission.description}</p>
                    </motion.button>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  className="text-center py-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Lightbulb className="w-10 h-10 text-stardust-500/50 mx-auto mb-3" />
                  <p className="text-sm text-midnight-400">
                    Envoie une mission pour guider l'apprentissage
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>
      </div>
    </div>
  )
}

