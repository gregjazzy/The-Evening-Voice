'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMontageStore, type PhraseTiming } from '@/store/useMontageStore'
import { cn } from '@/lib/utils'
import { X, Play, Pause, RotateCcw, Check, Music, Volume2 } from 'lucide-react'
import { createPortal } from 'react-dom'

// =============================================================================
// TYPES
// =============================================================================

interface RhythmGameProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (timings: PhraseTiming[]) => void
}

// =============================================================================
// COMPOSANT PRINCIPAL - JEU DE RYTHME PHRASE PAR PHRASE
// =============================================================================

export function RhythmGame({ isOpen, onClose, onComplete }: RhythmGameProps) {
  const { getCurrentScene, currentSceneIndex } = useMontageStore()
  const scene = getCurrentScene()

  const [phase, setPhase] = useState<'ready' | 'playing' | 'complete'>('ready')
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [recordedTimings, setRecordedTimings] = useState<PhraseTiming[]>([])
  const [audioProgress, setAudioProgress] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startTimeRef = useRef<number>(0)
  const animationRef = useRef<number | null>(null)

  const phrases = scene?.phrases || []
  const audioUrl = scene?.narration.audioUrl
  const audioDuration = scene?.narration.duration || 0

  // Reset quand la scène change ou le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setPhase('ready')
      setCurrentPhraseIndex(0)
      setRecordedTimings([])
      setAudioProgress(0)
      setShowSuccess(false)

      // Initialiser les timings avec les données existantes ou vides
      if (scene) {
        const initialTimings: PhraseTiming[] = phrases.map((text, index) => ({
          id: scene.narration.phrases[index]?.id || crypto.randomUUID(),
          text,
          index,
          timeRange: {
            startTime: 0,
            endTime: 0,
          },
        }))
        setRecordedTimings(initialTimings)
      }
    }
  }, [isOpen, currentSceneIndex, scene, phrases])

  // Cleanup audio
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

  // Démarrer le jeu
  const startGame = useCallback(() => {
    if (!audioUrl) return

    setPhase('playing')
    setCurrentPhraseIndex(0)

    // La première phrase commence automatiquement à 0
    setRecordedTimings((prev) => {
      const newTimings = [...prev]
      if (newTimings.length > 0) {
        newTimings[0] = {
          ...newTimings[0],
          timeRange: {
            ...newTimings[0].timeRange,
            startTime: 0, // La première phrase commence à 0
          },
        }
      }
      return newTimings
    })

    // Créer l'audio
    audioRef.current = new Audio(audioUrl)
    
    audioRef.current.onloadedmetadata = () => {
      startTimeRef.current = Date.now()
      audioRef.current?.play()

      // Mettre à jour la progression
      const updateProgress = () => {
        if (audioRef.current) {
          setAudioProgress(audioRef.current.currentTime / (audioRef.current.duration || 1))
          if (!audioRef.current.paused && !audioRef.current.ended) {
            animationRef.current = requestAnimationFrame(updateProgress)
          }
        }
      }
      animationRef.current = requestAnimationFrame(updateProgress)
    }

    audioRef.current.onended = () => {
      finishGame()
    }

    audioRef.current.onerror = (e) => {
      console.error('Erreur audio:', e)
      setPhase('ready')
    }
  }, [audioUrl])

  // Terminer le jeu (doit être défini AVANT markPhraseEnd)
  const finishGame = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    const totalDuration = audioRef.current?.duration || audioDuration

    // Finaliser les timings
    setRecordedTimings((prev) => {
      const newTimings = [...prev]
      
      // S'assurer que la dernière phrase a un endTime
      const lastIndex = newTimings.length - 1
      if (lastIndex >= 0 && newTimings[lastIndex].timeRange.endTime === 0) {
        newTimings[lastIndex] = {
          ...newTimings[lastIndex],
          timeRange: {
            ...newTimings[lastIndex].timeRange,
            endTime: totalDuration,
          },
        }
      }

      // Si certaines phrases n'ont pas été marquées, distribuer le temps restant
      let lastEndTime = 0
      for (let i = 0; i < newTimings.length; i++) {
        if (newTimings[i].timeRange.startTime === 0 && i > 0) {
          // Cette phrase n'a pas été marquée, utiliser la fin de la précédente
          newTimings[i].timeRange.startTime = lastEndTime
        }
        if (newTimings[i].timeRange.endTime === 0) {
          // Estimer la fin basée sur la phrase suivante ou la durée totale
          const nextStart = newTimings[i + 1]?.timeRange.startTime || totalDuration
          newTimings[i].timeRange.endTime = nextStart
        }
        lastEndTime = newTimings[i].timeRange.endTime
      }

      return newTimings
    })

    setPhase('complete')
    setShowSuccess(true)

    // Auto-fermer après animation
    setTimeout(() => {
      audioRef.current?.pause()
    }, 500)
  }, [audioDuration])

  // Enregistrer la fin d'une phrase (quand l'utilisateur tape)
  // Le tap marque : fin de la phrase courante ET début de la suivante
  const markPhraseEnd = useCallback(() => {
    if (phase !== 'playing' || currentPhraseIndex >= phrases.length) return

    const currentTime = audioRef.current?.currentTime || 0

    setRecordedTimings((prev) => {
      const newTimings = [...prev]

      // Définir le endTime de la phrase courante
      newTimings[currentPhraseIndex] = {
        ...newTimings[currentPhraseIndex],
        timeRange: {
          ...newTimings[currentPhraseIndex].timeRange,
          endTime: currentTime,
        },
      }

      // Définir le startTime de la phrase suivante
      if (currentPhraseIndex < phrases.length - 1) {
        newTimings[currentPhraseIndex + 1] = {
          ...newTimings[currentPhraseIndex + 1],
          timeRange: {
            ...newTimings[currentPhraseIndex + 1].timeRange,
            startTime: currentTime,
          },
        }
      }

      return newTimings
    })

    // Passer à la phrase suivante
    if (currentPhraseIndex < phrases.length - 1) {
      setCurrentPhraseIndex((i) => i + 1)
    } else {
      // C'était la dernière phrase
      finishGame()
    }
  }, [phase, currentPhraseIndex, phrases.length, finishGame])

  // Gérer les touches clavier
  useEffect(() => {
    if (!isOpen || phase !== 'playing') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        markPhraseEnd()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, phase, markPhraseEnd])

  // Recommencer
  const restart = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    setPhase('ready')
    setCurrentPhraseIndex(0)
    setAudioProgress(0)
    setShowSuccess(false)
  }

  // Valider et sauvegarder
  const handleComplete = () => {
    onComplete(recordedTimings)
  }

  if (!isOpen) return null

  // Utiliser un portal pour être au-dessus de tout
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
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-2xl mx-4 bg-gradient-to-br from-midnight-900 via-midnight-950 to-black rounded-3xl border border-aurora-500/30 shadow-2xl overflow-hidden"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* En-tête */}
          <div className="p-6 border-b border-midnight-700/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display text-aurora-300 flex items-center gap-2">
                  <Music className="w-6 h-6" />
                  Jeu de Rythme
                </h2>
                <p className="text-sm text-midnight-400 mt-1">
                  Tape ESPACE à la fin de chaque phrase !
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-midnight-800 text-midnight-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6">
            {/* Phase Ready */}
            {phase === 'ready' && (
              <div className="text-center space-y-6">
                <div className="w-24 h-24 mx-auto rounded-full bg-aurora-500/20 flex items-center justify-center">
                  <Volume2 className="w-12 h-12 text-aurora-400" />
                </div>

                <div>
                  <p className="text-lg text-white mb-2">
                    {phrases.length} phrases à synchroniser
                  </p>
                  <p className="text-sm text-midnight-400">
                    L'audio va jouer. Tape ESPACE quand tu entends la <strong>fin</strong> de chaque phrase.
                    <br />
                    <span className="text-aurora-400">La première phrase démarre automatiquement !</span>
                  </p>
                </div>

                <motion.button
                  onClick={startGame}
                  className="px-8 py-4 rounded-xl bg-aurora-500 text-white font-bold text-lg hover:bg-aurora-400 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-6 h-6 inline mr-2" />
                  C'est parti !
                </motion.button>
              </div>
            )}

            {/* Phase Playing */}
            {phase === 'playing' && (
              <div className="space-y-6">
                {/* Barre de progression audio */}
                <div className="relative h-2 bg-midnight-800 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-aurora-500"
                    style={{ width: `${audioProgress * 100}%` }}
                  />
                </div>

                {/* Liste des phrases */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {phrases.map((phrase, index) => {
                    const isCurrent = index === currentPhraseIndex
                    const isDone = index < currentPhraseIndex
                    const timing = recordedTimings[index]

                    return (
                      <motion.div
                        key={index}
                        className={cn(
                          'p-4 rounded-xl transition-all',
                          isCurrent && 'bg-aurora-500/30 ring-2 ring-aurora-500 scale-[1.02]',
                          isDone && 'bg-emerald-500/20',
                          !isCurrent && !isDone && 'bg-midnight-800/30 opacity-50'
                        )}
                        animate={isCurrent ? { scale: [1, 1.02, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1 }}
                      >
                        <div className="flex items-center gap-3">
                          {/* Indicateur */}
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                            isCurrent && 'bg-aurora-500 text-white',
                            isDone && 'bg-emerald-500 text-white',
                            !isCurrent && !isDone && 'bg-midnight-700 text-midnight-500'
                          )}>
                            {isDone ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <span className="text-sm font-bold">{index + 1}</span>
                            )}
                          </div>

                          {/* Phrase */}
                          <div className="flex-1">
                            <p className={cn(
                              'text-base',
                              isCurrent && 'text-white font-medium',
                              isDone && 'text-emerald-300',
                              !isCurrent && !isDone && 'text-midnight-500'
                            )}>
                              {phrase}
                            </p>
                            {isDone && timing && (
                              <p className="text-xs text-emerald-400/70 mt-1">
                                ✓ {timing.timeRange.startTime.toFixed(1)}s - {timing.timeRange.endTime.toFixed(1)}s
                              </p>
                            )}
                          </div>

                          {/* Indicateur TAP */}
                          {isCurrent && (
                            <motion.div
                              className="px-3 py-1 rounded-full bg-aurora-500 text-white text-sm font-bold"
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ repeat: Infinity, duration: 0.5 }}
                            >
                              TAP!
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Zone de tap (pour mobile) */}
                <motion.button
                  onClick={markPhraseEnd}
                  className="w-full py-8 rounded-xl bg-aurora-500/20 text-aurora-300 text-xl font-bold hover:bg-aurora-500/30 transition-colors"
                  whileTap={{ scale: 0.95, backgroundColor: 'rgba(0, 255, 127, 0.3)' }}
                >
                  👆 TAPE À LA FIN DE LA PHRASE
                </motion.button>
              </div>
            )}

            {/* Phase Complete */}
            {phase === 'complete' && (
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-24 h-24 mx-auto rounded-full bg-emerald-500/30 flex items-center justify-center"
                >
                  <Check className="w-12 h-12 text-emerald-400" />
                </motion.div>

                <div>
                  <h3 className="text-xl font-bold text-emerald-300">
                    🎉 Bravo !
                  </h3>
                  <p className="text-midnight-400 mt-2">
                    {phrases.length} phrases synchronisées
                  </p>
                </div>

                {/* Résumé des timings */}
                <div className="max-h-40 overflow-y-auto text-left bg-midnight-800/30 rounded-xl p-4 space-y-1">
                  {recordedTimings.map((timing, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-midnight-300 truncate flex-1 mr-2">{timing.text.slice(0, 30)}...</span>
                      <span className="text-emerald-400 font-mono shrink-0">
                        {timing.timeRange.startTime.toFixed(1)}s
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={restart}
                    className="px-6 py-3 rounded-xl bg-midnight-800 text-white hover:bg-midnight-700 transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Recommencer
                  </button>
                  <motion.button
                    onClick={handleComplete}
                    className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-colors flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Check className="w-4 h-4" />
                    Valider
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
