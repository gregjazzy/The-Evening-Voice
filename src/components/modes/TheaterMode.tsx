'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  Wifi,
  WifiOff,
  Book,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Home
} from 'lucide-react'
import { useLayoutStore, type BookPage } from '@/store/useLayoutStore'
import { useMentorStore } from '@/store/useMentorStore'
import { useHomeKit } from '@/hooks/useHomeKit'
import { cn } from '@/lib/utils'

export function TheaterMode() {
  const { books, currentBook } = useLayoutStore()
  const { isConnected: mentorConnected, controlActive } = useMentorStore()
  const homeKit = useHomeKit()

  // États du théâtre
  const [selectedBook, setSelectedBook] = useState<typeof books[0] | null>(null)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [transitionDuration, setTransitionDuration] = useState(5)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})
  const hideControlsTimer = useRef<NodeJS.Timeout>()

  const completedBooks = books.filter((b) => b.isComplete)
  const currentPage = selectedBook?.pages[currentPageIndex]

  // Auto-hide des contrôles
  useEffect(() => {
    if (isFullscreen && showControls) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
    return () => clearTimeout(hideControlsTimer.current)
  }, [isFullscreen, showControls])

  // Synchroniser HomeKit avec la page
  useEffect(() => {
    if (currentPage && homeKit.isConnected) {
      homeKit.syncWithAmbiance(currentPage.ambiance, currentPage.lightIntensity)
    }
  }, [currentPage?.id, homeKit.isConnected])

  // Gérer la lecture audio
  useEffect(() => {
    if (!currentPage || !isPlaying) return

    // Jouer les pistes audio
    currentPage.audioTracks.forEach((track) => {
      if (!audioRefs.current[track.id]) {
        const audio = new Audio(track.url)
        audio.volume = (track.volume * volume) / 100
        audio.loop = track.loop
        audioRefs.current[track.id] = audio
      }
      
      const audio = audioRefs.current[track.id]
      audio.volume = isMuted ? 0 : (track.volume * volume) / 100
      audio.play()
    })

    return () => {
      // Arrêter les audios de cette page
      currentPage.audioTracks.forEach((track) => {
        audioRefs.current[track.id]?.pause()
      })
    }
  }, [currentPage?.id, isPlaying, volume, isMuted])

  // Auto-avance
  useEffect(() => {
    if (!isPlaying || !autoAdvance || !selectedBook) return

    const timer = setTimeout(() => {
      if (currentPageIndex < selectedBook.pages.length - 1) {
        setCurrentPageIndex((prev) => prev + 1)
      } else {
        setIsPlaying(false)
      }
    }, transitionDuration * 1000)

    return () => clearTimeout(timer)
  }, [isPlaying, autoAdvance, currentPageIndex, selectedBook, transitionDuration])

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
  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1)
    }
  }

  const goToNextPage = () => {
    if (selectedBook && currentPageIndex < selectedBook.pages.length - 1) {
      setCurrentPageIndex((prev) => prev + 1)
    }
  }

  const handleStartShow = (book: typeof books[0]) => {
    setSelectedBook(book)
    setCurrentPageIndex(0)
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
    setSelectedBook(null)
    setIsFullscreen(false)
    document.exitFullscreen?.()
    
    // Remettre les lumières à la normale
    if (homeKit.isConnected) {
      homeKit.syncWithAmbiance('jour', 80)
    }
  }

  // Préchargement des assets
  useEffect(() => {
    if (!selectedBook) return

    selectedBook.pages.forEach((page) => {
      // Précharger les images
      if (page.backgroundImage) {
        const img = new Image()
        img.src = page.backgroundImage
      }
      // Précharger les vidéos
      if (page.backgroundVideo) {
        const video = document.createElement('video')
        video.preload = 'auto'
        video.src = page.backgroundVideo
      }
    })
  }, [selectedBook?.id])

  // Vue Bibliothèque
  if (!selectedBook) {
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
              Tes histoires prêtes pour le spectacle ✨
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

        {/* Bibliothèque */}
        <div className="flex-1">
          {completedBooks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {completedBooks.map((book, index) => (
                <motion.button
                  key={book.id}
                  onClick={() => handleStartShow(book)}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden glass hover:ring-2 hover:ring-aurora-500 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  {/* Couverture */}
                  {book.coverImage || book.pages[0]?.backgroundImage ? (
                    <img
                      src={book.coverImage || book.pages[0]?.backgroundImage}
                      alt={book.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-aurora-600 to-dream-700" />
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Infos */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-display text-lg text-white mb-1">
                      {book.title}
                    </h3>
                    <p className="text-sm text-midnight-300">
                      {book.pages.length} pages • {book.author}
                    </p>
                  </div>

                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 rounded-full bg-aurora-500/90 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Book className="w-24 h-24 text-midnight-700 mb-6" />
              <h2 className="font-display text-2xl text-white mb-2">
                La bibliothèque est vide
              </h2>
              <p className="text-midnight-400 max-w-md">
                Termine un livre dans le mode Montage pour le retrouver ici.
                Chaque livre terminé devient un spectacle magique ! ✨
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Vue Spectacle (Plein écran)
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50"
      onMouseMove={() => {
        setShowControls(true)
        clearTimeout(hideControlsTimer.current)
      }}
    >
      {/* Page en cours */}
      <AnimatePresence mode="wait">
        {currentPage && (
          <motion.div
            key={currentPage.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            {/* Background Video */}
            {currentPage.backgroundVideo && (
              <video
                src={currentPage.backgroundVideo}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
              />
            )}

            {/* Background Image */}
            {currentPage.backgroundImage && !currentPage.backgroundVideo && (
              <img
                src={currentPage.backgroundImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

            {/* Textes */}
            {currentPage.textBlocks.map((block) => (
              <motion.div
                key={block.id}
                className="absolute"
                style={{
                  left: block.x,
                  top: block.y,
                  width: block.width,
                  fontFamily: block.fontFamily,
                  fontSize: block.fontSize,
                  color: block.color,
                  textAlign: block.textAlign,
                  opacity: block.opacity,
                  transform: `rotate(${block.rotation}deg)`,
                  textShadow: block.shadow ? '2px 2px 8px rgba(0,0,0,0.7)' : 'none',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: block.opacity, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {block.content}
              </motion.div>
            ))}

            {/* Numéro de page */}
            <div className="absolute bottom-8 right-8 text-white/50 font-display text-lg">
              {currentPage.pageNumber} / {selectedBook.pages.length}
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
            {/* Barre de progression */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-aurora-500"
                  animate={{
                    width: `${((currentPageIndex + 1) / selectedBook.pages.length) * 100}%`,
                  }}
                />
              </div>
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
                  onClick={goToPreviousPage}
                  disabled={currentPageIndex === 0}
                  className={cn(
                    'p-3 rounded-full transition-colors',
                    currentPageIndex === 0
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
                  onClick={goToNextPage}
                  disabled={currentPageIndex === selectedBook.pages.length - 1}
                  className={cn(
                    'p-3 rounded-full transition-colors',
                    currentPageIndex === selectedBook.pages.length - 1
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

              {/* Durée transition */}
              {autoAdvance && (
                <div>
                  <label className="text-sm text-midnight-300 mb-1 block">
                    Durée par page : {transitionDuration}s
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    value={transitionDuration}
                    onChange={(e) => setTransitionDuration(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}

              {/* Contrôle des lumières */}
              {homeKit.isConnected && (
                <div>
                  <label className="text-sm text-midnight-300 mb-2 block">
                    Intensité lumineuse
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentPage?.lightIntensity || 80}
                    onChange={(e) => {
                      homeKit.setLightBrightness('all', parseInt(e.target.value))
                    }}
                    className="w-full"
                  />
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
}
