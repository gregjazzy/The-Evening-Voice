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
  Maximize,
  Minimize,
  Settings,
  Lightbulb,
  WifiOff,
  Book,
  Sparkles,
  Home,
  Film,
  X,
  Download,
  Loader2,
  CheckCircle2,
  Video
} from 'lucide-react'
import { useMontageStore, type MontageProject, type MontageScene } from '@/store/useMontageStore'
import { useMentorStore } from '@/store/useMentorStore'
import { useHomeKit } from '@/hooks/useHomeKit'
import { cn } from '@/lib/utils'

export function TheaterMode() {
  // Pour le portal - s'assurer que le DOM est monté
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  // ✅ Utilise maintenant useMontageStore au lieu de useLayoutStore
  const { projects } = useMontageStore()
  const { isConnected: mentorConnected, controlActive } = useMentorStore()
  const homeKit = useHomeKit()

  // États du théâtre
  const [selectedProject, setSelectedProject] = useState<MontageProject | null>(null)
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0)
  
  // États pour l'export vidéo
  const [isExporting, setIsExporting] = useState(false)
  const [exportingProjectId, setExportingProjectId] = useState<string | null>(null)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportResult, setExportResult] = useState<{
    mp4Url: string
    playbackId: string
  } | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})
  const narrationRef = useRef<HTMLAudioElement | null>(null)
  const hideControlsTimer = useRef<NodeJS.Timeout>()
  const playbackTimer = useRef<NodeJS.Timeout>()

  // Projets terminés (ou tous pour le moment, on peut filtrer par isComplete)
  const completedProjects = projects.filter((p) => p.scenes.length > 0)
  const currentScene = selectedProject?.scenes[currentSceneIndex]

  // Calculer la durée totale de la scène (intro + narration + outro)
  const getSceneDuration = (scene: MontageScene) => {
    return (scene.introDuration || 0) + (scene.narration?.duration || scene.duration || 10) + (scene.outroDuration || 0)
  }

  // Auto-hide des contrôles
  useEffect(() => {
    if (isFullscreen && showControls) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
    return () => clearTimeout(hideControlsTimer.current)
  }, [isFullscreen, showControls])

  // Synchroniser HomeKit avec la scène
  useEffect(() => {
    if (currentScene && homeKit.isConnected) {
      // Utiliser les lightTracks si disponibles
      const lightTrack = currentScene.lightTracks?.[0]
      if (lightTrack) {
        homeKit.setLightColor('all', lightTrack.color)
        homeKit.setLightBrightness('all', lightTrack.intensity)
      } else {
        // Fallback : ambiance par défaut
        homeKit.syncWithAmbiance('jour', 80)
      }
    }
  }, [currentScene?.id, homeKit.isConnected])

  // Gérer la lecture audio (narration + musique + sons)
  useEffect(() => {
    if (!currentScene || !isPlaying) return

    // Jouer la narration
    if (currentScene.narration?.audioUrl) {
      if (!narrationRef.current) {
        narrationRef.current = new Audio(currentScene.narration.audioUrl)
      }
      narrationRef.current.volume = isMuted ? 0 : volume / 100
      narrationRef.current.play().catch(console.error)
    }

    // Jouer les pistes musique
    currentScene.musicTracks?.forEach((track) => {
      if (!audioRefs.current[track.id]) {
        const audio = new Audio(track.url)
        audio.volume = (track.volume * volume) / 100
        audio.loop = track.loop
        audioRefs.current[track.id] = audio
      }
      
      const audio = audioRefs.current[track.id]
      audio.volume = isMuted ? 0 : (track.volume * volume) / 100
      audio.play().catch(console.error)
    })

    // Jouer les effets sonores
    currentScene.soundTracks?.forEach((track) => {
      if (!audioRefs.current[track.id]) {
        const audio = new Audio(track.url)
        audio.volume = (track.volume * volume) / 100
        audio.loop = track.loop
        audioRefs.current[track.id] = audio
      }
      
      const audio = audioRefs.current[track.id]
      audio.volume = isMuted ? 0 : (track.volume * volume) / 100
      audio.play().catch(console.error)
    })

    return () => {
      // Arrêter les audios de cette scène
      narrationRef.current?.pause()
      currentScene.musicTracks?.forEach((track) => {
        audioRefs.current[track.id]?.pause()
      })
      currentScene.soundTracks?.forEach((track) => {
        audioRefs.current[track.id]?.pause()
      })
    }
  }, [currentScene?.id, isPlaying, volume, isMuted])

  // Auto-avance et playback timer
  useEffect(() => {
    if (!isPlaying || !autoAdvance || !selectedProject || !currentScene) return

    const sceneDuration = getSceneDuration(currentScene)

    // Timer pour le temps de lecture
    playbackTimer.current = setInterval(() => {
      setCurrentPlaybackTime((prev) => {
        if (prev >= sceneDuration) {
          // Passer à la scène suivante
          if (currentSceneIndex < selectedProject.scenes.length - 1) {
            setCurrentSceneIndex((i) => i + 1)
            return 0
          } else {
            // Fin du spectacle
            setIsPlaying(false)
            return prev
          }
        }
        return prev + 0.1
      })
    }, 100)

    return () => {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current)
      }
    }
  }, [isPlaying, autoAdvance, currentSceneIndex, selectedProject, currentScene])

  // Reset playback time quand on change de scène
  useEffect(() => {
    setCurrentPlaybackTime(0)
  }, [currentSceneIndex])

  // Plein écran
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Erreur fullscreen:', error)
    }
  }, [])

  // Navigation
  const goToPreviousScene = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex((prev) => prev - 1)
    }
  }

  const goToNextScene = () => {
    if (selectedProject && currentSceneIndex < selectedProject.scenes.length - 1) {
      setCurrentSceneIndex((prev) => prev + 1)
    }
  }

  const handleStartShow = (project: MontageProject) => {
    setSelectedProject(project)
    setCurrentSceneIndex(0)
    setCurrentPlaybackTime(0)
    setIsPlaying(true)
    setIsFullscreen(true)
    toggleFullscreen()
    
    // Connecter HomeKit si disponible
    if (!homeKit.isConnected) {
      homeKit.connect()
    }
  }

  const handleExitShow = () => {
    setIsPlaying(false)
    setSelectedProject(null)
    setIsFullscreen(false)
    setCurrentPlaybackTime(0)
    
    // Sortir du plein écran seulement si on est en plein écran
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        // Ignorer l'erreur si le document n'est pas actif
      })
    }
    
    // Arrêter tous les audios
    narrationRef.current?.pause()
    narrationRef.current = null
    Object.values(audioRefs.current).forEach(audio => audio.pause())
    audioRefs.current = {}
    
    // Remettre les lumières à la normale
    if (homeKit.isConnected) {
      homeKit.syncWithAmbiance('jour', 80)
    }
  }

  // Préchargement des assets
  useEffect(() => {
    if (!selectedProject) return

    selectedProject.scenes.forEach((scene) => {
      // Précharger les médias
      scene.mediaTracks?.forEach((media) => {
        if (media.type === 'image') {
          const img = new Image()
          img.src = media.url
        } else if (media.type === 'video') {
          const video = document.createElement('video')
          video.preload = 'auto'
          video.src = media.url
        }
      })
      
      // Précharger l'audio de narration
      if (scene.narration?.audioUrl) {
        const audio = new Audio()
        audio.preload = 'auto'
        audio.src = scene.narration.audioUrl
      }
    })
  }, [selectedProject?.id])

  // Trouver la phrase active selon le temps de lecture
  const getActivePhrase = () => {
    if (!currentScene?.narration?.isSynced) return null
    
    const introDuration = currentScene.introDuration || 0
    const relativeTime = currentPlaybackTime - introDuration
    
    if (relativeTime < 0) return null
    
    return currentScene.narration.phrases.find(
      (phrase) => relativeTime >= phrase.timeRange.startTime && relativeTime < phrase.timeRange.endTime
    )
  }

  // Export vidéo HD/4K via Mux
  const handleExportVideo = async (project: MontageProject, e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher de lancer le spectacle
    
    setIsExporting(true)
    setExportingProjectId(project.id)
    setExportProgress(10)
    setExportError(null)
    setExportResult(null)
    
    try {
      // Préparer les scènes pour l'export
      const scenes = project.scenes.map((scene) => {
        // Trouver le premier média de la scène
        const firstMedia = scene.mediaTracks?.[0]
        return {
          mediaUrl: firstMedia?.url || '',
          duration: scene.duration || 10,
          text: scene.text,
        }
      }).filter(s => s.mediaUrl) // Filtrer les scènes sans média
      
      if (scenes.length === 0) {
        throw new Error('Aucune scène avec média trouvée')
      }
      
      // Récupérer l'URL de narration (première scène avec narration)
      const narrationUrl = project.scenes.find(s => s.narration?.audioUrl)?.narration?.audioUrl
      
      setExportProgress(30)
      
      // Appeler l'API d'export
      const response = await fetch('/api/export/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.title,
          scenes,
          narrationUrl,
          resolution: '1080p',
        }),
      })
      
      setExportProgress(60)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur export')
      }
      
      const result = await response.json()
      setExportProgress(80)
      
      // Polling pour vérifier quand la vidéo est prête
      if (result.status === 'preparing') {
        let attempts = 0
        const maxAttempts = 60 // 5 minutes max
        
        const checkStatus = async () => {
          const statusResponse = await fetch(`/api/export/video?assetId=${result.assetId}`)
          const statusData = await statusResponse.json()
          
          if (statusData.status === 'ready') {
            setExportProgress(100)
            setExportResult({
              mp4Url: statusData.mp4Url,
              playbackId: result.playbackId,
            })
            setIsExporting(false)
          } else if (statusData.status === 'errored') {
            throw new Error('Erreur lors de l\'encodage')
          } else if (attempts < maxAttempts) {
            attempts++
            setExportProgress(80 + Math.min(attempts, 18))
            setTimeout(checkStatus, 5000)
          } else {
            throw new Error('Timeout - la vidéo prend trop de temps')
          }
        }
        
        checkStatus()
      } else {
        setExportProgress(100)
        setExportResult({
          mp4Url: result.mp4Url,
          playbackId: result.playbackId,
        })
        setIsExporting(false)
      }
      
    } catch (error) {
      console.error('Erreur export vidéo:', error)
      setExportError(error instanceof Error ? error.message : 'Erreur inconnue')
      setIsExporting(false)
      setExportProgress(0)
    }
  }
  
  // Télécharger la vidéo
  const handleDownloadVideo = () => {
    if (exportResult?.mp4Url) {
      const link = document.createElement('a')
      link.href = exportResult.mp4Url
      link.download = 'mon-livre-disque.mp4'
      link.click()
    }
  }

  // Vue Bibliothèque
  if (!selectedProject) {
    return (
      <div className="h-full flex flex-col">
        {/* En-tête */}
        <motion.header 
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="font-display text-3xl text-aurora-300 flex items-center gap-3">
              <Theater className="w-8 h-8" />
              Le Théâtre des Merveilles
            </h1>
            <p className="text-midnight-300 mt-1">
              Tes livres-disques prêts pour le spectacle ✨
            </p>
          </div>

          {/* Status HomeKit */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => homeKit.isConnected ? homeKit.disconnect() : homeKit.connect()}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl transition-colors',
                homeKit.isConnected 
                  ? 'bg-dream-500/20 text-dream-300' 
                  : 'bg-midnight-800/50 text-midnight-400 hover:text-white'
              )}
            >
              {homeKit.isConnected ? (
                <>
                  <Lightbulb className="w-4 h-4" />
                  Lumières connectées
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  Connecter HomeKit
                </>
              )}
            </button>
          </div>
        </motion.header>

        {/* Bibliothèque des projets */}
        <div className="flex-1">
          {completedProjects.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {completedProjects.map((project, index) => {
                // Trouver une image de couverture (premier média de la première scène)
                const firstMedia = project.scenes[0]?.mediaTracks?.[0]
                const coverImage = firstMedia?.type === 'image' ? firstMedia.url : undefined
                
                return (
                  <motion.button
                    key={project.id}
                    onClick={() => handleStartShow(project)}
                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden glass hover:ring-2 hover:ring-aurora-500 transition-all"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                  >
                    {/* Couverture */}
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={project.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-aurora-600 to-dream-700 flex items-center justify-center">
                        <Film className="w-16 h-16 text-white/30" />
                      </div>
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Badge "Complet" si terminé */}
                    {project.isComplete && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-dream-500/80 text-white text-xs font-medium">
                        ✓ Complet
                      </div>
                    )}

                    {/* Bouton Export Vidéo */}
                    <button
                      onClick={(e) => handleExportVideo(project, e)}
                      disabled={isExporting && exportingProjectId === project.id}
                      className={cn(
                        'absolute top-3 left-3 p-2 rounded-full transition-all',
                        'bg-black/50 hover:bg-aurora-500 text-white/70 hover:text-white',
                        'opacity-0 group-hover:opacity-100',
                        isExporting && exportingProjectId === project.id && 'opacity-100 bg-aurora-500'
                      )}
                      title="Exporter en vidéo HD"
                    >
                      {isExporting && exportingProjectId === project.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Video className="w-4 h-4" />
                      )}
                    </button>

                    {/* Infos */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-display text-lg text-white mb-1">
                        {project.title}
                      </h3>
                      <p className="text-sm text-midnight-300">
                        {project.scenes.length} scène{project.scenes.length > 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-aurora-500/90 flex items-center justify-center">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Book className="w-24 h-24 text-midnight-700 mb-6" />
              <h2 className="font-display text-2xl text-white mb-2">
                La bibliothèque est vide
              </h2>
              <p className="text-midnight-400 max-w-md">
                Crée un projet dans le mode <strong>Montage</strong> pour le retrouver ici.
                Chaque livre-disque terminé devient un spectacle magique ! ✨
              </p>
            </div>
          )}
        </div>
        
        {/* Modal Export Vidéo */}
        <AnimatePresence>
          {(isExporting || exportResult || exportError) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => {
                if (!isExporting) {
                  setExportResult(null)
                  setExportError(null)
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-card p-8 max-w-md w-full mx-4"
              >
                {/* En cours d'export */}
                {isExporting && (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-aurora-500/20 flex items-center justify-center mx-auto mb-6">
                      <Loader2 className="w-10 h-10 text-aurora-400 animate-spin" />
                    </div>
                    <h3 className="text-xl font-display text-white mb-2">
                      Export en cours...
                    </h3>
                    <p className="text-midnight-400 mb-6">
                      Création de ta vidéo HD 🎬
                    </p>
                    <div className="h-2 bg-midnight-800 rounded-full overflow-hidden mb-2">
                      <motion.div
                        className="h-full bg-gradient-to-r from-aurora-500 to-dream-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${exportProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-sm text-midnight-400">{exportProgress}%</p>
                  </div>
                )}
                
                {/* Export réussi */}
                {exportResult && !isExporting && (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-display text-white mb-2">
                      Vidéo prête ! 🎉
                    </h3>
                    <p className="text-midnight-400 mb-6">
                      Ta vidéo HD est prête à être téléchargée
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={handleDownloadVideo}
                        className="w-full py-3 px-4 bg-aurora-600 hover:bg-aurora-500 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Télécharger MP4
                      </button>
                      <button
                        onClick={() => {
                          setExportResult(null)
                          setExportingProjectId(null)
                        }}
                        className="w-full py-3 px-4 bg-midnight-800 hover:bg-midnight-700 text-white rounded-xl transition-colors"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Erreur */}
                {exportError && !isExporting && (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-6">
                      <X className="w-10 h-10 text-rose-400" />
                    </div>
                    <h3 className="text-xl font-display text-white mb-2">
                      Oups ! 😕
                    </h3>
                    <p className="text-midnight-400 mb-2">
                      Une erreur s'est produite
                    </p>
                    <p className="text-sm text-rose-400 mb-6">
                      {exportError}
                    </p>
                    <button
                      onClick={() => {
                        setExportError(null)
                        setExportingProjectId(null)
                      }}
                      className="w-full py-3 px-4 bg-midnight-800 hover:bg-midnight-700 text-white rounded-xl transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Vue Spectacle (Plein écran) - rendu via Portal pour passer au-dessus de tout
  const activePhrase = getActivePhrase()
  const sceneDuration = currentScene ? getSceneDuration(currentScene) : 10

  // Rendu via Portal pour s'assurer que le spectacle est au-dessus de tout (y compris la sidebar)
  const spectacleContent = (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-[9999]"
      onMouseMove={() => {
        setShowControls(true)
        clearTimeout(hideControlsTimer.current)
      }}
    >
      {/* Bouton fermer toujours visible (X en haut à droite) */}
      <button
        onClick={handleExitShow}
        className="absolute top-4 right-4 z-[10000] w-12 h-12 rounded-full bg-black/60 hover:bg-red-600/80 text-white/80 hover:text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/20 hover:border-red-500/50 shadow-lg"
        title="Réduire le spectacle"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Scène en cours */}
      <AnimatePresence mode="wait">
        {currentScene && (
          <motion.div
            key={currentScene.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            {/* Médias de fond (images/vidéos) */}
            {currentScene.mediaTracks?.map((media) => (
              <div key={media.id} className="absolute inset-0">
                {media.type === 'video' ? (
                  <video
                    src={media.url}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    loop={media.loop}
                    muted={media.muted !== false}
                    style={{ opacity: media.opacity ?? 1 }}
                  />
                ) : (
                  <img
                    src={media.url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ opacity: media.opacity ?? 1 }}
                  />
                )}
              </div>
            ))}

            {/* Si pas de média, afficher un fond par défaut */}
            {(!currentScene.mediaTracks || currentScene.mediaTracks.length === 0) && (
              <div className="absolute inset-0 bg-gradient-to-br from-midnight-900 to-aurora-900" />
            )}

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

            {/* Texte de la scène - Mode Karaoké si synchronisé */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="max-w-4xl text-center">
                {currentScene.narration?.isSynced ? (
                  // Mode karaoké : affiche la phrase active
                  <motion.div
                    key={activePhrase?.id || 'intro'}
                    className="text-4xl md:text-5xl lg:text-6xl font-display text-white leading-relaxed"
                    style={{ textShadow: '2px 2px 20px rgba(0,0,0,0.8)' }}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 1.05 }}
                    transition={{ duration: 0.5 }}
                  >
                    {activePhrase?.text || (currentPlaybackTime < (currentScene.introDuration || 0) ? currentScene.title : '')}
                  </motion.div>
                ) : (
                  // Mode normal : affiche tout le texte
                  <motion.div
                    className="text-2xl md:text-3xl lg:text-4xl font-display text-white leading-relaxed"
                    style={{ textShadow: '2px 2px 20px rgba(0,0,0,0.8)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {currentScene.text}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Animations (si présentes) */}
            {currentScene.animationTracks?.map((animation) => (
              <div 
                key={animation.id}
                className="absolute inset-0 pointer-events-none"
                style={{
                  opacity: animation.opacity ?? 0.7,
                }}
              >
                {/* Les animations seraient rendues ici via un composant dédié */}
                {/* Pour l'instant, on affiche un placeholder */}
              </div>
            ))}

            {/* Numéro de scène */}
            <div className="absolute bottom-8 right-8 text-white/50 font-display text-lg">
              {currentSceneIndex + 1} / {selectedProject.scenes.length}
            </div>

            {/* Titre de la scène (en haut) */}
            <div className="absolute top-8 left-8 text-white/70 font-display text-xl">
              {currentScene.title}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contrôles */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/90 to-transparent"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            {/* Barre de progression de la scène */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-white/50 text-sm w-12 text-right">
                {Math.floor(currentPlaybackTime / 60)}:{String(Math.floor(currentPlaybackTime % 60)).padStart(2, '0')}
              </span>
              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-aurora-500"
                  animate={{
                    width: `${(currentPlaybackTime / sceneDuration) * 100}%`,
                  }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <span className="text-white/50 text-sm w-12">
                {Math.floor(sceneDuration / 60)}:{String(Math.floor(sceneDuration % 60)).padStart(2, '0')}
              </span>
            </div>

            {/* Barre de progression globale (scènes) */}
            <div className="flex items-center gap-2 mb-6">
              {selectedProject.scenes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSceneIndex(index)}
                  className={cn(
                    'flex-1 h-1 rounded-full transition-colors',
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
                Quitter
              </button>

              {/* Centre - Navigation */}
              <div className="flex items-center gap-4">
                <button
                  onClick={goToPreviousScene}
                  disabled={currentSceneIndex === 0}
                  className={cn(
                    'p-3 rounded-full transition-colors',
                    currentSceneIndex === 0
                      ? 'text-white/30 cursor-not-allowed'
                      : 'text-white hover:bg-white/10'
                  )}
                >
                  <SkipBack className="w-6 h-6" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 rounded-full bg-aurora-500 text-white flex items-center justify-center hover:bg-aurora-600 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </button>

                <button
                  onClick={goToNextScene}
                  disabled={currentSceneIndex === selectedProject.scenes.length - 1}
                  className={cn(
                    'p-3 rounded-full transition-colors',
                    currentSceneIndex === selectedProject.scenes.length - 1
                      ? 'text-white/30 cursor-not-allowed'
                      : 'text-white hover:bg-white/10'
                  )}
                >
                  <SkipForward className="w-6 h-6" />
                </button>
              </div>

              {/* Droite - Volume & Settings */}
              <div className="flex items-center gap-4">
                {/* Volume */}
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

                {/* HomeKit Status */}
                {homeKit.isConnected && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-dream-500/30 text-dream-300 text-sm">
                    <Lightbulb className="w-4 h-4" />
                    Lumières sync
                  </div>
                )}

                {/* Settings */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-lg text-white hover:bg-white/10"
                >
                  <Settings className="w-5 h-5" />
                </button>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg text-white hover:bg-white/10"
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5" />
                  ) : (
                    <Maximize className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panneau Settings */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="absolute top-4 right-4 w-72 glass rounded-2xl p-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Paramètres du spectacle
            </h3>

            <div className="space-y-4">
              {/* Auto-avance */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-midnight-300">Avance automatique</span>
                <button
                  onClick={() => setAutoAdvance(!autoAdvance)}
                  className={cn(
                    'w-12 h-6 rounded-full transition-colors relative',
                    autoAdvance ? 'bg-aurora-500' : 'bg-midnight-700'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform',
                    autoAdvance ? 'translate-x-6' : 'translate-x-0.5'
                  )} />
                </button>
              </div>

              {/* Contrôle des lumières */}
              {homeKit.isConnected && currentScene && (
                <div>
                  <label className="text-sm text-midnight-300 mb-2 block">
                    Intensité lumineuse
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentScene.lightTracks?.[0]?.intensity || 80}
                    onChange={(e) => {
                      homeKit.setLightBrightness('all', parseInt(e.target.value))
                    }}
                    className="w-full"
                  />
                </div>
              )}

              {/* Infos sur la scène */}
              {currentScene && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-midnight-400">
                    Scène {currentSceneIndex + 1} sur {selectedProject.scenes.length}
                  </p>
                  {currentScene.narration?.isSynced && (
                    <p className="text-xs text-dream-300 mt-1">
                      ✓ Karaoké synchronisé
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicateur mentor */}
      {mentorConnected && controlActive && (
        <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-aurora-500/30 text-aurora-300 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Mentor aux commandes
        </div>
      )}
    </div>
  )

  // Utiliser un Portal pour rendre au niveau du body (au-dessus de la sidebar)
  if (!isMounted) return null
  
  return createPortal(spectacleContent, document.body)
}
