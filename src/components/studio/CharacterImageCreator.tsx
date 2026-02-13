/**
 * CharacterImageCreator - Créer une nouvelle image avec le même personnage
 * 
 * Flux UX simplifié pour enfants :
 * 1. "Créer une nouvelle image avec ce personnage"
 * 2. "Que fait ton personnage maintenant ?"
 * 3. Génération vidéo (invisible pour l'enfant)
 * 4. "Choisis l'image que tu préfères" (vidéo qui défile)
 * 5. "📸 Garder cette image" → capture de frame
 */

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Camera, Loader2, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { useTranslations } from '@/lib/i18n/context'

interface CharacterImageCreatorProps {
  isOpen: boolean
  onClose: () => void
  referenceImageUrl: string
  onImageCreated: (imageUrl: string) => void
}

type Step = 'describe' | 'generating' | 'preview'

export function CharacterImageCreator({
  isOpen,
  onClose,
  referenceImageUrl,
  onImageCreated,
}: CharacterImageCreatorProps) {
  const t = useTranslations('studio')
  const [step, setStep] = useState<Step>('describe')
  const [description, setDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isCapturing, setIsCapturing] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { upload } = useMediaUpload()

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('describe')
      setDescription('')
      setVideoUrl(null)
      setError(null)
      setIsPlaying(true)
      setIsCapturing(false)
    }
  }, [isOpen])

  // Générer la vidéo depuis l'image de référence
  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return
    
    setIsGenerating(true)
    setStep('generating')
    setError(null)
    
    try {
      console.log('🎬 Génération vidéo avec personnage:', {
        description,
        referenceImage: referenceImageUrl.substring(0, 50),
      })
      
      // Appeler l'API de génération vidéo avec l'image de référence
      const response = await fetch('/api/ai/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: description,
          imageUrl: referenceImageUrl,
          duration: '5', // 5 secondes
          aspectRatio: '1:1', // Carré pour plus de flexibilité
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur de génération')
      }
      
      const data = await response.json()
      console.log('✅ Vidéo générée:', data.videoUrl)
      
      setVideoUrl(data.videoUrl)
      setStep('preview')
      
    } catch (err) {
      console.error('❌ Erreur génération vidéo:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setStep('describe')
    } finally {
      setIsGenerating(false)
    }
  }, [description, referenceImageUrl])

  // Capturer le frame actuel de la vidéo
  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return
    
    setIsCapturing(true)
    
    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      
      // Mettre en pause pour capturer
      video.pause()
      setIsPlaying(false)
      
      // Configurer le canvas avec la taille de la vidéo
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Dessiner le frame actuel
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Impossible de créer le contexte canvas')
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convertir en blob PNG haute qualité
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Échec conversion')),
          'image/png',
          1.0
        )
      })
      
      console.log('📸 Frame capturé:', canvas.width, 'x', canvas.height)
      
      // Upload vers Supabase via le hook
      const result = await upload(blob, { 
        type: 'image', 
        source: 'luma',  // Source = vidéo IA
      })
      
      if (!result) {
        throw new Error('Erreur upload image')
      }
      
      console.log('✅ Image uploadée:', result.url)
      
      // Notifier le parent
      onImageCreated(result.url)
      onClose()
      
    } catch (err) {
      console.error('❌ Erreur capture:', err)
      setError(err instanceof Error ? err.message : 'Erreur de capture')
    } finally {
      setIsCapturing(false)
    }
  }, [onImageCreated, onClose, upload])

  // Contrôles vidéo
  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const seekFrame = (direction: 'prev' | 'next') => {
    if (!videoRef.current) return
    videoRef.current.pause()
    setIsPlaying(false)
    
    // Avancer/reculer d'environ 1/30 de seconde (1 frame à 30fps)
    const frameTime = 1 / 30
    const newTime = direction === 'next' 
      ? Math.min(videoRef.current.currentTime + frameTime, duration)
      : Math.max(videoRef.current.currentTime - frameTime, 0)
    
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative bg-gradient-to-br from-midnight-900 via-midnight-800 to-midnight-900 rounded-3xl p-6 max-w-lg w-full mx-4 shadow-2xl border border-midnight-700"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-aurora-500/20">
                <Sparkles className="w-6 h-6 text-aurora-400" />
              </div>
              <div>
                <h2 className="text-xl font-display text-white">
                  {step === 'describe' && t('characterCreator.newImage')}
                  {step === 'generating' && t('characterCreator.creationInProgress')}
                  {step === 'preview' && t('characterCreator.chooseImage')}
                </h2>
                <p className="text-sm text-midnight-300">
                  {step === 'describe' && t('characterCreator.sameCharacter')}
                  {step === 'generating' && t('characterCreator.magicMoment')}
                  {step === 'preview' && t('characterCreator.scrollAndCapture')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-midnight-700 transition-colors"
            >
              <X className="w-5 h-5 text-midnight-400" />
            </button>
          </div>

          {/* Contenu selon l'étape */}
          <AnimatePresence mode="wait">
            {/* Étape 1: Description */}
            {step === 'describe' && (
              <motion.div
                key="describe"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Image de référence miniature */}
                <div className="flex items-center gap-4 p-3 rounded-xl bg-midnight-700/50">
                  <img 
                    src={referenceImageUrl} 
                    alt="Personnage" 
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <p className="text-sm text-midnight-300">
                    {t('characterCreator.characterDoesNew')}
                  </p>
                </div>

                {/* Question */}
                <div>
                  <label className="block text-lg font-medium text-white mb-3">
                    {t('characterCreator.whatDoesCharacterDo')}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('characterCreator.placeholder')}
                    className="w-full h-24 px-4 py-3 rounded-xl bg-midnight-800 border border-midnight-600 text-white placeholder:text-midnight-400 focus:outline-none focus:ring-2 focus:ring-aurora-500/50 resize-none"
                    autoFocus
                  />
                </div>

                {/* Erreur */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {/* Bouton */}
                <button
                  onClick={handleGenerate}
                  disabled={!description.trim() || isGenerating}
                  className={cn(
                    "w-full py-4 rounded-xl font-medium text-lg transition-all flex items-center justify-center gap-2",
                    description.trim()
                      ? "bg-gradient-to-r from-aurora-500 to-stardust-500 text-white hover:shadow-lg hover:shadow-aurora-500/25"
                      : "bg-midnight-700 text-midnight-400 cursor-not-allowed"
                  )}
                >
                  <Sparkles className="w-5 h-5" />
                  {t('characterCreator.createImage')}
                </button>
              </motion.div>
            )}

            {/* Étape 2: Génération */}
            {step === 'generating' && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 text-center"
              >
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-aurora-500/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full bg-aurora-500/30 animate-pulse" />
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-aurora-400 to-stardust-500 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                </div>
                <p className="text-white text-lg font-medium mb-2">
                  {t('characterCreator.creatingImage')}
                </p>
                <p className="text-midnight-400 text-sm">
                  {t('characterCreator.fewSeconds')}
                </p>
              </motion.div>
            )}

            {/* Étape 3: Prévisualisation vidéo */}
            {step === 'preview' && videoUrl && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Vidéo */}
                <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    loop
                    muted
                    playsInline
                    autoPlay
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                  />
                  
                  {/* Overlay contrôles */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    {/* Barre de progression */}
                    <input
                      type="range"
                      min={0}
                      max={duration || 1}
                      step={0.01}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-2 mb-2 rounded-full appearance-none bg-white/20 cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-aurora-400
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:shadow-lg"
                    />
                    
                    {/* Boutons de contrôle */}
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => seekFrame('prev')}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        title={t('characterCreator.prevFrame')}
                      >
                        <ChevronLeft className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={togglePlay}
                        className="p-3 rounded-full bg-white/30 hover:bg-white/40 transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6 text-white" />
                        ) : (
                          <Play className="w-6 h-6 text-white" />
                        )}
                      </button>
                      <button
                        onClick={() => seekFrame('next')}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        title={t('characterCreator.nextFrame')}
                      >
                        <ChevronRight className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <p className="text-center text-midnight-300 text-sm">
                  {t('characterCreator.scrollToFind')}
                </p>

                {/* Erreur */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {/* Bouton capture */}
                <button
                  onClick={handleCapture}
                  disabled={isCapturing}
                  className="w-full py-4 rounded-xl font-medium text-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCapturing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('characterCreator.capturing')}
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      {t('characterCreator.keepImage')}
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Canvas caché pour la capture */}
          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
