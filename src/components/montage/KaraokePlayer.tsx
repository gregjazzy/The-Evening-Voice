'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMontageStore, type MontageScene, type PhraseTiming } from '@/store/useMontageStore'
import { cn } from '@/lib/utils'
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2 } from 'lucide-react'
import { createPortal } from 'react-dom'

// =============================================================================
// TYPES
// =============================================================================

interface KaraokePlayerProps {
  isOpen: boolean
  onClose: () => void
  scene: MontageScene
}

// =============================================================================
// COMPOSANT PRINCIPAL - LECTEUR KARAOKÉ
// =============================================================================

export function KaraokePlayer({ isOpen, onClose, scene }: KaraokePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [activePhraseIndex, setActivePhraseIndex] = useState(-1)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animationRef = useRef<number | null>(null)

  const duration = scene.duration || 0
  const phrases = scene.narration.phrases

  // Trouver la phrase active en fonction du temps
  const findActivePhrase = useCallback((time: number): number => {
    for (let i = 0; i < phrases.length; i++) {
      const phrase = phrases[i]
      if (time >= phrase.timeRange.startTime && time < phrase.timeRange.endTime) {
        return i
      }
    }
    return -1
  }, [phrases])

  // Mettre à jour le temps de lecture
  const updatePlaybackTime = useCallback(() => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime
      setCurrentTime(time)
      setActivePhraseIndex(findActivePhrase(time))

      if (!audioRef.current.paused && !audioRef.current.ended) {
        animationRef.current = requestAnimationFrame(updatePlaybackTime)
      }
    }
  }, [findActivePhrase])

  // Play/Pause
  const togglePlayback = useCallback(() => {
    if (!audioRef.current) {
      if (!scene.narration.audioUrl) return
      audioRef.current = new Audio(scene.narration.audioUrl)
      audioRef.current.onended = () => {
        setIsPlaying(false)
        setCurrentTime(0)
        setActivePhraseIndex(-1)
      }
    }

    if (isPlaying) {
      audioRef.current.pause()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    } else {
      audioRef.current.play()
      animationRef.current = requestAnimationFrame(updatePlaybackTime)
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying, scene.narration.audioUrl, updatePlaybackTime])

  // Seek
  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
      setActivePhraseIndex(findActivePhrase(time))
    }
  }, [findActivePhrase])

  // Mute
  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
    }
    setIsMuted(!isMuted)
  }, [isMuted])

  // Skip to previous/next phrase
  const skipToPrevPhrase = useCallback(() => {
    if (activePhraseIndex > 0) {
      seekTo(phrases[activePhraseIndex - 1].timeRange.startTime)
    } else {
      seekTo(0)
    }
  }, [activePhraseIndex, phrases, seekTo])

  const skipToNextPhrase = useCallback(() => {
    if (activePhraseIndex < phrases.length - 1) {
      seekTo(phrases[activePhraseIndex + 1].timeRange.startTime)
    }
  }, [activePhraseIndex, phrases, seekTo])

  // Reset quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setCurrentTime(0)
      setIsPlaying(false)
      setActivePhraseIndex(-1)
    }
  }, [isOpen])

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Reset audio quand la scène change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }, [scene.id])

  // Formater le temps
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/90"
          onClick={onClose}
        />

        {/* Player */}
        <motion.div
          className="relative w-full max-w-4xl mx-4 aspect-video bg-gradient-to-br from-midnight-900 via-midnight-950 to-black rounded-2xl overflow-hidden"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* Zone média (images/vidéos) */}
          <div className="absolute inset-0">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-aurora-500/10 via-transparent to-dream-500/10" />

            {/* Médias de la scène */}
            {scene.mediaTracks.map((media) => {
              // Vérifier si le média est visible au temps actuel
              const isVisible = currentTime >= media.timeRange.startTime && currentTime < media.timeRange.endTime

              if (!isVisible) return null

              // Calculer l'opacité pour les fondus
              let opacity = 1
              if (media.timeRange.fadeIn && currentTime < media.timeRange.startTime + media.timeRange.fadeIn) {
                opacity = (currentTime - media.timeRange.startTime) / media.timeRange.fadeIn
              }
              if (media.timeRange.fadeOut && currentTime > media.timeRange.endTime - media.timeRange.fadeOut) {
                opacity = (media.timeRange.endTime - currentTime) / media.timeRange.fadeOut
              }

              return (
                <motion.div
                  key={media.id}
                  className="absolute"
                  style={{
                    left: `${media.position.x}%`,
                    top: `${media.position.y}%`,
                    width: `${media.position.width}%`,
                    height: `${media.position.height}%`,
                    opacity,
                    zIndex: media.zIndex,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity }}
                  exit={{ opacity: 0 }}
                >
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt={media.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <video
                      src={media.url}
                      className="w-full h-full object-cover rounded-lg"
                      autoPlay={isPlaying}
                      loop={media.loop}
                      muted
                    />
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Zone texte karaoké */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
            <AnimatePresence mode="wait">
              {/* Phrase précédente (estompée) */}
              {activePhraseIndex > 0 && (
                <motion.p
                  key={`prev-${activePhraseIndex}`}
                  className="text-center text-midnight-500 text-lg mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                >
                  {phrases[activePhraseIndex - 1]?.text}
                </motion.p>
              )}

              {/* Phrase active */}
              {activePhraseIndex >= 0 && phrases[activePhraseIndex] && (
                <motion.p
                  key={`active-${activePhraseIndex}`}
                  className="text-center text-white text-2xl md:text-3xl font-medium"
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 20 }}
                >
                  <span className="inline-block px-4 py-2 bg-aurora-500/30 rounded-lg">
                    {phrases[activePhraseIndex].text}
                  </span>
                </motion.p>
              )}

              {/* Phrase suivante (aperçu) */}
              {activePhraseIndex >= 0 && activePhraseIndex < phrases.length - 1 && (
                <motion.p
                  key={`next-${activePhraseIndex}`}
                  className="text-center text-midnight-600 text-lg mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                >
                  {phrases[activePhraseIndex + 1]?.text}
                </motion.p>
              )}

              {/* Message si pas encore commencé */}
              {activePhraseIndex < 0 && !isPlaying && (
                <motion.p
                  className="text-center text-midnight-400 text-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Appuie sur Play pour commencer 🎬
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Contrôles */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            {/* Titre */}
            <div className="px-4 py-2 rounded-lg bg-black/50 text-white">
              <p className="font-medium">{scene.title}</p>
            </div>

            {/* Bouton fermer */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barre de contrôle en bas */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
            {/* Barre de progression */}
            <div 
              className="relative h-1 bg-midnight-700 rounded-full mb-4 cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const percent = (e.clientX - rect.left) / rect.width
                seekTo(percent * duration)
              }}
            >
              {/* Progress */}
              <div
                className="absolute inset-y-0 left-0 bg-aurora-500 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />

              {/* Marks des phrases */}
              {phrases.map((phrase, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-white/30 rounded-full"
                  style={{ left: `${(phrase.timeRange.startTime / duration) * 100}%` }}
                />
              ))}

              {/* Curseur */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${(currentTime / duration) * 100}% - 6px)` }}
              />
            </div>

            {/* Contrôles */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Play/Pause */}
                <button
                  onClick={togglePlayback}
                  className="p-3 rounded-full bg-aurora-500 text-white hover:bg-aurora-400 transition-colors"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>

                {/* Prev/Next */}
                <button
                  onClick={skipToPrevPhrase}
                  className="p-2 rounded-lg text-white/70 hover:text-white transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={skipToNextPhrase}
                  className="p-2 rounded-lg text-white/70 hover:text-white transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                {/* Temps */}
                <span className="text-white/70 text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Mute */}
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-lg text-white/70 hover:text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
