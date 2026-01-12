'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useDragControls } from 'framer-motion'
import { Video, VideoOff, Mic, MicOff, Maximize2, Minimize2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoOverlayProps {
  stream: MediaStream | null
  name: string
  isSelf?: boolean
  onClose?: () => void
}

/**
 * Petite fenêtre vidéo draggable (PIP)
 */
export function VideoOverlay({ stream, name, isSelf = false, onClose }: VideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const dragControls = useDragControls()
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMuted, setIsMuted] = useState(isSelf) // Se mute soi-même par défaut
  const [isVideoOff, setIsVideoOff] = useState(false)

  // Attacher le stream à la vidéo
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // Toggle vidéo
  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOff(!videoTrack.enabled)
      }
    }
  }

  // Toggle audio
  const toggleMute = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  if (!stream) return null

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        'fixed z-50 rounded-2xl overflow-hidden shadow-2xl',
        'bg-gray-900 border-2 border-aurora-500/50',
        isMinimized ? 'w-16 h-16' : 'w-48 h-36'
      )}
      style={{
        bottom: isSelf ? 100 : 250,
        right: 20,
      }}
    >
      {/* Vidéo */}
      {!isMinimized && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf || isMuted}
          className={cn(
            'w-full h-full object-cover',
            isVideoOff && 'hidden'
          )}
        />
      )}

      {/* Placeholder si vidéo off ou minimisé */}
      {(isVideoOff || isMinimized) && (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-aurora-900 to-gray-900">
          <div className="text-2xl">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Nom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="text-white text-xs font-medium truncate">
          {isSelf ? 'Toi' : name}
        </p>
      </div>

      {/* Contrôles */}
      {!isMinimized && (
        <div className="absolute top-1 right-1 flex gap-1">
          {isSelf && (
            <>
              <button
                onClick={toggleVideo}
                className="p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                {isVideoOff ? (
                  <VideoOff className="w-3 h-3 text-red-400" />
                ) : (
                  <Video className="w-3 h-3 text-white" />
                )}
              </button>
              <button
                onClick={toggleMute}
                className="p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                {isMuted ? (
                  <MicOff className="w-3 h-3 text-red-400" />
                ) : (
                  <Mic className="w-3 h-3 text-white" />
                )}
              </button>
            </>
          )}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <Minimize2 className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      {/* Bouton agrandir si minimisé */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors"
        >
          <Maximize2 className="w-4 h-4 text-white" />
        </button>
      )}

      {/* Handle pour drag */}
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="absolute top-0 left-0 right-0 h-6 cursor-move"
      />
    </motion.div>
  )
}

