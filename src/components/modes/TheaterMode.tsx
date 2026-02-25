'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Theater,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Book,
  Film,
  X,
  Home,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react'
import { useMontageStore, type MontageProject } from '@/store/useMontageStore'
import { ModeIntroModal, useFirstVisit } from '@/components/ui/ModeIntroModal'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n/context'
import { useVideoExport } from '@/hooks/useVideoExport'

export function TheaterMode() {
  const { isFirstVisit, markAsSeen } = useFirstVisit('theater')
  const t = useTranslations('theater')

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => { setIsMounted(true) }, [])

  const { projects } = useMontageStore()
  const {
    isExporting,
    progress: exportProgress,
    currentScene: exportCurrentScene,
    totalScenes: exportTotalScenes,
    startExport,
    cancelExport,
  } = useVideoExport()

  // États du théâtre
  const [selectedProject, setSelectedProject] = useState<MontageProject | null>(null)
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const narrationRef = useRef<HTMLAudioElement | null>(null)
  const musicRef = useRef<HTMLAudioElement | null>(null)
  const currentMusicUrlRef = useRef<string | null>(null)
  const soundRefs = useRef<Map<string, HTMLAudioElement>>(new Map())
  const soundTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const rafRef = useRef<number | null>(null)
  const pageStartTime = useRef<number>(0)
  const hideControlsTimer = useRef<NodeJS.Timeout>()

  const completedProjects = projects.filter((p) => p.scenes.length > 0)
  const currentScene = selectedProject?.scenes[currentSceneIndex]
  const sceneCount = selectedProject?.scenes.length || 0

  // ─── Audio cleanup (stable — uses refs only) ───
  const cleanupAudio = useCallback(() => {
    narrationRef.current?.pause()
    narrationRef.current = null
    musicRef.current?.pause()
    musicRef.current = null
    currentMusicUrlRef.current = null
    soundRefs.current.forEach(audio => audio.pause())
    soundRefs.current.clear()
    soundTimers.current.forEach(timer => clearTimeout(timer))
    soundTimers.current.clear()
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }, [])

  // Refs pour les valeurs lues dans l'effet sans déclencher de re-run
  const volumeRef = useRef(volume)
  const isMutedRef = useRef(isMuted)
  const autoAdvanceRef = useRef(autoAdvance)
  useEffect(() => { volumeRef.current = volume }, [volume])
  useEffect(() => { isMutedRef.current = isMuted }, [isMuted])
  useEffect(() => { autoAdvanceRef.current = autoAdvance }, [autoAdvance])

  // Constantes de timing
  const NARRATION_DELAY = 3    // secondes avant que la voix commence
  const LINGER_AFTER = 5       // secondes après la fin de la voix
  const DEFAULT_DISPLAY = 5    // secondes par défaut pour pages sans narration
  const MUSIC_FADE_MS = 1500   // durée fade in/out musique en ms

  // ─── Fade out musique ───
  const fadeOutMusic = useCallback(() => {
    const music = musicRef.current
    if (music && music.volume > 0) {
      const startVol = music.volume
      const steps = 20
      const stepMs = MUSIC_FADE_MS / steps
      let step = 0
      const fade = setInterval(() => {
        step++
        music.volume = Math.max(0, startVol * (1 - step / steps))
        if (step >= steps) {
          clearInterval(fade)
          music.pause()
        }
      }, stepMs)
    } else {
      music?.pause()
    }
    musicRef.current = null
    currentMusicUrlRef.current = null
  }, [])

  // ─── Cleanup narration + sons (sans toucher à la musique) ───
  const cleanupNarrationAndSounds = useCallback(() => {
    narrationRef.current?.pause()
    narrationRef.current = null
    soundRefs.current.forEach(a => a.pause())
    soundRefs.current.clear()
    soundTimers.current.forEach(timer => clearTimeout(timer))
    soundTimers.current.clear()
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }, [])

  // ─── Effet principal : scene change + play/pause ───
  // Tout est inline pour garantir le cleanup correct
  useEffect(() => {
    // Cleanup narration + sons (la musique est gérée séparément)
    cleanupNarrationAndSounds()
    setCurrentTime(0)

    const scene = selectedProject?.scenes[currentSceneIndex]
    if (!isPlaying || !scene) {
      // Si on arrête la lecture, fade out la musique aussi
      if (!isPlaying) fadeOutMusic()
      return
    }

    const vol = isMutedRef.current ? 0 : volumeRef.current / 100
    const hasNarration = !!scene.narration?.audioUrl

    // Helper pour avancer à la page suivante
    const advanceToNext = () => {
      const totalScenes = selectedProject?.scenes.length || 0
      if (autoAdvanceRef.current && currentSceneIndex < totalScenes - 1) {
        soundTimers.current.set('__advance', setTimeout(() => setCurrentSceneIndex(i => i + 1), LINGER_AFTER * 1000))
      } else if (currentSceneIndex >= totalScenes - 1) {
        soundTimers.current.set('__advance', setTimeout(() => setIsPlaying(false), LINGER_AFTER * 1000))
      }
    }

    // Narration — démarrage avec délai de 3s
    if (hasNarration) {
      const narration = new Audio(scene.narration.audioUrl!)
      narration.volume = vol * (scene.narration.volume ?? 1)
      narrationRef.current = narration

      narration.onended = () => advanceToNext()

      // Lancer la voix après le délai
      const narrationTimer = setTimeout(() => {
        narration.play().catch(console.warn)
      }, NARRATION_DELAY * 1000)
      soundTimers.current.set('__narration-delay', narrationTimer)
    } else {
      // Pas de narration → auto-avance après displayDuration
      const displayMs = (scene.displayDuration || DEFAULT_DISPLAY) * 1000
      soundTimers.current.set('__advance', setTimeout(() => {
        const totalScenes = selectedProject?.scenes.length || 0
        if (autoAdvanceRef.current && currentSceneIndex < totalScenes - 1) {
          setCurrentSceneIndex(i => i + 1)
        } else if (currentSceneIndex >= totalScenes - 1) {
          setIsPlaying(false)
        }
      }, displayMs))
    }

    // ─── Musique de fond — continuité si même URL ───
    const musicTrack = scene.musicTracks?.[0]
    const newMusicUrl = musicTrack?.url || null
    const currentMusicUrl = currentMusicUrlRef.current

    if (newMusicUrl === currentMusicUrl && musicRef.current) {
      // Même musique → on la laisse jouer, juste ajuster le volume si besoin
      const defaultVol = (selectedProject?.defaultMusicVolume ?? 30) / 100
      const targetVol = vol * (musicTrack!.volume ?? defaultVol)
      musicRef.current.volume = targetVol
    } else {
      // Musique différente ou plus de musique → fade out l'ancienne
      if (musicRef.current) fadeOutMusic()

      // Démarrer la nouvelle musique avec fade-in
      if (musicTrack?.url) {
        const music = new Audio(musicTrack.url)
        const defaultVol = (selectedProject?.defaultMusicVolume ?? 30) / 100
        const targetVol = vol * (musicTrack.volume ?? defaultVol)
        music.volume = 0
        music.loop = musicTrack.loop !== false
        musicRef.current = music
        currentMusicUrlRef.current = musicTrack.url
        music.play().catch(console.warn)
        // Fade in
        const steps = 30
        const stepMs = MUSIC_FADE_MS / steps
        let step = 0
        const fadeIn = setInterval(() => {
          step++
          if (musicRef.current === music) {
            music.volume = Math.min(targetVol, targetVol * (step / steps))
          }
          if (step >= steps) clearInterval(fadeIn)
        }, stepMs)
        soundTimers.current.set('__music-fade-in', fadeIn as unknown as NodeJS.Timeout)
      }
    }

    // Effets sonores (timer-based)
    scene.soundTracks?.forEach((sound) => {
      const startAt = sound.timeRange?.startTime || 0
      const endAt = sound.timeRange?.endTime
      const soundVol = vol * (sound.volume ?? 0.7)

      const startTimer = setTimeout(() => {
        const audio = new Audio(sound.url)
        audio.volume = soundVol
        if (sound.loop) audio.loop = true
        soundRefs.current.set(sound.id, audio)
        audio.play().catch(console.warn)

        if (endAt && endAt > startAt) {
          const stopTimer = setTimeout(() => {
            audio.pause()
            soundRefs.current.delete(sound.id)
          }, (endAt - startAt) * 1000)
          soundTimers.current.set(`${sound.id}-stop`, stopTimer)
        }
      }, startAt * 1000)

      soundTimers.current.set(sound.id, startTimer)
    })

    // RAF pour le temps courant
    pageStartTime.current = performance.now()
    const tick = () => {
      const elapsed = (performance.now() - pageStartTime.current) / 1000
      setCurrentTime(elapsed)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    // Cleanup au changement de scène (la musique est gérée dans le corps de l'effet)
    return () => {
      cleanupNarrationAndSounds()
    }
  }, [currentSceneIndex, isPlaying, selectedProject?.id])

  // ─── Volume update (réagit aussi aux changements de volume par piste) ───
  const sceneMusicVolume = currentScene?.musicTracks?.[0]?.volume
  const sceneNarrationVolume = currentScene?.narration?.volume
  useEffect(() => {
    const vol = isMuted ? 0 : volume / 100
    if (narrationRef.current) {
      narrationRef.current.volume = vol * (sceneNarrationVolume ?? 1)
    }
    if (musicRef.current) {
      const defaultVol = (selectedProject?.defaultMusicVolume ?? 30) / 100
      musicRef.current.volume = vol * (sceneMusicVolume ?? defaultVol)
    }
    soundRefs.current.forEach(audio => {
      audio.volume = vol * 0.7
    })
  }, [volume, isMuted, sceneMusicVolume, sceneNarrationVolume])

  // ─── Auto-hide contrôles ───
  useEffect(() => {
    if (showControls && isPlaying) {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 4000)
      return () => clearTimeout(hideControlsTimer.current)
    }
  }, [showControls, isPlaying])

  // ─── Préchargement ───
  useEffect(() => {
    if (!selectedProject) return
    selectedProject.scenes.forEach((scene) => {
      scene.mediaTracks?.forEach((media) => {
        if (media.type === 'image') {
          const img = new Image()
          img.src = media.url
        }
      })
      if (scene.narration?.audioUrl) {
        const audio = new Audio()
        audio.preload = 'auto'
        audio.src = scene.narration.audioUrl
      }
    })
  }, [selectedProject?.id])

  // ─── Navigation ───
  const handleStartShow = (project: MontageProject) => {
    setSelectedProject(project)
    setCurrentSceneIndex(0)
    setCurrentTime(0)
    setIsPlaying(true)
    setShowControls(true)
    // Fullscreen
    containerRef.current?.requestFullscreen?.().catch(() => {})
  }

  const handleExitShow = () => {
    setIsPlaying(false)
    cleanupAudio()
    setSelectedProject(null)
    setCurrentTime(0)
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }

  const goToPreviousScene = () => {
    if (currentSceneIndex > 0) setCurrentSceneIndex(i => i - 1)
  }

  const goToNextScene = () => {
    if (currentSceneIndex < sceneCount - 1) setCurrentSceneIndex(i => i + 1)
  }

  // ─── Keyboard ───
  useEffect(() => {
    if (!selectedProject) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleExitShow()
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p) }
      if (e.key === 'ArrowRight') goToNextScene()
      if (e.key === 'ArrowLeft') goToPreviousScene()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedProject, currentSceneIndex, sceneCount])

  // ═══════════════════════════════════════════
  // VUE BIBLIOTHÈQUE
  // ═══════════════════════════════════════════
  if (!selectedProject) {
    return (
      <div className="h-full flex flex-col">
        <motion.header
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="font-display text-3xl text-aurora-300 flex items-center gap-3">
              <Theater className="w-8 h-8" />
              {t('title')}
            </h1>
            <p className="text-midnight-300 mt-1">{t('subtitle')}</p>
          </div>
        </motion.header>

        <div className="flex-1">
          {completedProjects.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {completedProjects.map((project, index) => {
                const firstMedia = project.scenes[0]?.mediaTracks?.[0]
                const coverImage = firstMedia?.type === 'image' ? firstMedia.url : undefined

                return (
                  <motion.div
                    key={project.id}
                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden glass hover:ring-2 hover:ring-aurora-500 transition-all"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                  >
                    <button
                      onClick={() => handleStartShow(project)}
                      className="absolute inset-0 w-full h-full"
                    >
                      {coverImage ? (
                        <img src={coverImage} alt={project.title} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-aurora-600 to-dream-700 flex items-center justify-center">
                          <Film className="w-16 h-16 text-white/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                        <h3 className="font-display text-lg text-white mb-1">{project.title}</h3>
                        <p className="text-sm text-midnight-300">
                          {project.scenes.length} {project.scenes.length > 1 ? 'pages' : 'page'}
                        </p>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 rounded-full bg-aurora-500/90 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                      </div>
                    </button>
                    {/* Export video button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startExport(project)
                      }}
                      disabled={isExporting}
                      className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-aurora-500/80 text-white/70 hover:text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/20 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Exporter en vidéo"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Book className="w-24 h-24 text-midnight-700 mb-6" />
              <h2 className="font-display text-2xl text-white mb-2">{t('library.empty')}</h2>
              <p className="text-midnight-400 max-w-md" dangerouslySetInnerHTML={{ __html: t('library.emptyDescription') }} />
            </div>
          )}
        </div>

        {/* Export progress overlay */}
        {isExporting && (
          <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Film className="w-12 h-12 text-aurora-500 mx-auto animate-pulse" />
              <p className="text-white text-xl">Export en cours...</p>
              <p className="text-midnight-400">Scène {exportCurrentScene}/{exportTotalScenes}</p>
              <div className="w-64 h-2 bg-midnight-800 rounded-full overflow-hidden mx-auto">
                <div
                  className="h-full bg-aurora-500 transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <p className="text-midnight-500 text-sm">{Math.round(exportProgress)}%</p>
              <button
                onClick={cancelExport}
                className="text-red-400 hover:text-red-300 text-sm mt-2 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        <ModeIntroModal mode="theater" isOpen={isFirstVisit} onClose={markAsSeen} />
      </div>
    )
  }

  // ═══════════════════════════════════════════
  // VUE LECTURE (plein écran via Portal)
  // ═══════════════════════════════════════════
  if (!isMounted) return null

  const spectacle = (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-[9999]"
      onMouseMove={() => {
        setShowControls(true)
      }}
    >
      {/* Bouton fermer */}
      <button
        onClick={handleExitShow}
        className="absolute top-4 right-4 z-[10001] w-12 h-12 rounded-full bg-black/60 hover:bg-red-600/80 text-white/80 hover:text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/20"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Page en cours — fade out → noir → fade in */}
      <AnimatePresence mode="wait">
        {currentScene && (
          <motion.div
            key={currentScene.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 1.5, delay: 0.8 } }}
            exit={{ opacity: 0, transition: { duration: 1.5 } }}
          >
            {/* Illustration plein écran — fond flou + image entière */}
            {(() => {
              const media = (currentScene.mediaTracks || [])[0]
              if (!media) return null
              return (
                <>
                  {/* Fond flou (même image, zoomée et floutée) */}
                  {media.type === 'image' && (
                    <img
                      src={media.url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl brightness-50"
                    />
                  )}
                  {/* Image principale (entière, centrée) */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {media.type === 'video' ? (
                      <video
                        src={media.url}
                        className="max-w-full max-h-full object-contain"
                        autoPlay
                        loop={false}
                        muted
                        playsInline
                        onPlay={(e) => {
                          if (media.playbackRate) {
                            (e.target as HTMLVideoElement).playbackRate = media.playbackRate
                          }
                        }}
                      />
                    ) : (
                      <img src={media.url} alt="" className="max-w-full max-h-full object-contain" />
                    )}
                  </div>
                </>
              )
            })()}

            {/* Fond par défaut si pas de média */}
            {(!currentScene.mediaTracks || currentScene.mediaTracks.length === 0) && (
              <div className="absolute inset-0 bg-gradient-to-br from-midnight-900 to-aurora-900" />
            )}

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 z-10" />

            {/* Texte de la page */}
            <div className="absolute inset-0 flex items-end justify-center p-8 pb-32 z-20">
              <motion.div
                className="max-w-3xl text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                {currentScene.text && (() => {
                  const phrases = currentScene.text!.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()).filter(Boolean) || [currentScene.text!]
                  const narrationDuration = currentScene.narration?.duration || 0
                  const displayDuration = currentScene.displayDuration || DEFAULT_DISPLAY

                  const hasNarration = narrationDuration > 0
                  const totalDuration = hasNarration ? narrationDuration : displayDuration
                  const elapsed = hasNarration ? currentTime - NARRATION_DELAY : currentTime

                  // En pause → dernière phrase visible
                  // En lecture → phrase proportionnelle au temps écoulé
                  const progress = Math.max(0, Math.min(1, elapsed / totalDuration))
                  const visibleCount = !isPlaying
                    ? phrases.length
                    : Math.max(1, Math.ceil(progress * phrases.length))
                  const currentPhrase = phrases[Math.min(visibleCount, phrases.length) - 1]

                  return currentPhrase ? (
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={visibleCount}
                        className="text-xl md:text-2xl lg:text-3xl text-white leading-relaxed"
                        style={{ textShadow: '2px 2px 20px rgba(0,0,0,0.8)' }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                      >
                        {currentPhrase}
                      </motion.p>
                    </AnimatePresence>
                  ) : null
                })()}
              </motion.div>
            </div>

            {/* Numéro de page */}
            <div className="absolute bottom-8 right-8 text-white/40 font-display text-lg z-20">
              {currentSceneIndex + 1} / {sceneCount}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zones de navigation tactile (gauche / droite) */}
      <div className="absolute inset-y-0 left-0 w-1/5 z-30 cursor-pointer flex items-center justify-start pl-4"
        onClick={goToPreviousScene}
      >
        <div className="opacity-0 hover:opacity-60 transition-opacity">
          <ChevronLeft className="w-10 h-10 text-white" />
        </div>
      </div>
      <div className="absolute inset-y-0 right-0 w-1/5 z-30 cursor-pointer flex items-center justify-end pr-4"
        onClick={goToNextScene}
      >
        <div className="opacity-0 hover:opacity-60 transition-opacity">
          <ChevronRight className="w-10 h-10 text-white" />
        </div>
      </div>

      {/* Contrôles bas */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-40"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
          >
            {/* Barre de progression des pages */}
            <div className="flex items-center gap-2 mb-4">
              {selectedProject.scenes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSceneIndex(index)}
                  className={cn(
                    'flex-1 h-1.5 rounded-full transition-colors',
                    index === currentSceneIndex
                      ? 'bg-aurora-500'
                      : index < currentSceneIndex
                      ? 'bg-aurora-500/50'
                      : 'bg-white/20'
                  )}
                />
              ))}
            </div>

            {/* Contrôles principaux */}
            <div className="flex items-center justify-between">
              {/* Gauche - Quitter */}
              <button
                onClick={handleExitShow}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <Home className="w-5 h-5" />
                {t('controls.quit')}
              </button>

              {/* Centre - Navigation */}
              <div className="flex items-center gap-4">
                <button
                  onClick={goToPreviousScene}
                  disabled={currentSceneIndex === 0}
                  className={cn(
                    'p-3 rounded-full transition-colors',
                    currentSceneIndex === 0 ? 'text-white/30 cursor-not-allowed' : 'text-white hover:bg-white/10'
                  )}
                >
                  <SkipBack className="w-6 h-6" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-14 h-14 rounded-full bg-aurora-500 text-white flex items-center justify-center hover:bg-aurora-600 transition-colors"
                >
                  {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                </button>

                <button
                  onClick={goToNextScene}
                  disabled={currentSceneIndex >= sceneCount - 1}
                  className={cn(
                    'p-3 rounded-full transition-colors',
                    currentSceneIndex >= sceneCount - 1 ? 'text-white/30 cursor-not-allowed' : 'text-white hover:bg-white/10'
                  )}
                >
                  <SkipForward className="w-6 h-6" />
                </button>
              </div>

              {/* Droite - Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-lg text-white hover:bg-white/10"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseInt(e.target.value))
                    setIsMuted(false)
                  }}
                  className="w-24"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ModeIntroModal mode="theater" isOpen={isFirstVisit} onClose={markAsSeen} />
    </div>
  )

  return createPortal(spectacle, document.body)
}
