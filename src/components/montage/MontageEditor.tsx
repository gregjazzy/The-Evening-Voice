'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMontageStore, type PhraseTiming, type MontageScene } from '@/store/useMontageStore'
import { useAppStore } from '@/store/useAppStore'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { useTTS } from '@/hooks/useTTS'
import { useHighlightStore } from '@/store/useHighlightStore'
import { Highlightable } from '@/components/ui/Highlightable'
import { NarrationVoiceSelector } from '@/components/ui/NarrationVoiceSelector'
import { useLocale } from '@/lib/i18n/context'
import { TimelineRubans } from './TimelineRubans'
import { GuidedRecording } from './GuidedRecording'
import { KaraokePlayer } from './KaraokePlayer'
import { PreviewCanvas } from './PreviewCanvas'
import { TrackPropertiesPanel } from './TrackPropertiesPanel'
import { cn } from '@/lib/utils'
import {
  Film,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Mic,
  Sparkles,
  Eye,
  EyeOff,
  BookOpen,
  Wand2,
  Trash2,
  Download,
  Lightbulb,
  Layout,
  Loader2,
  Plus,
  Check,
  Image,
  Volume2,
  VolumeX,
  Grid3X3,
  Layers,
  PanelLeftClose,
  PanelLeft,
  ArrowLeft,
  Home,
  X
} from 'lucide-react'

// =============================================================================
// COMPOSANTS UTILITAIRES
// =============================================================================

/**
 * Détecte le meilleur format audio supporté
 */
function getSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/wav'
  
  const formats = [
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg',
    'audio/wav'
  ]
  
  for (const format of formats) {
    if (MediaRecorder.isTypeSupported(format)) {
      return format
    }
  }
  
  return ''
}

// =============================================================================
// SCENE CARD - Carte d'une scène (vue simple)
// =============================================================================

interface SceneCardProps {
  scene: MontageScene
  index: number
  isActive: boolean
  onClick: () => void
}

function SceneCard({ scene, index, isActive, onClick }: SceneCardProps) {
  const hasAudio = !!scene.narration.audioUrl
  const isSynced = scene.narration.isSynced
  const hasMedia = scene.mediaTracks.length > 0

  // Calculer le statut
  const getStatus = () => {
    if (!hasAudio) return { text: 'Voix', color: 'text-rose-400', bg: 'bg-rose-500/20' }
    if (!isSynced) return { text: 'Sync', color: 'text-amber-400', bg: 'bg-amber-500/20' }
    if (!hasMedia) return { text: 'Média', color: 'text-blue-400', bg: 'bg-blue-500/20' }
    return { text: '✓', color: 'text-emerald-400', bg: 'bg-emerald-500/20' }
  }

  const status = getStatus()

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative p-4 rounded-xl border-2 transition-all w-full text-left',
        isActive
          ? 'border-aurora-500 bg-aurora-500/10 shadow-lg shadow-aurora-500/20'
          : 'border-midnight-700 bg-midnight-800/50 hover:border-midnight-600 hover:bg-midnight-800'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Numéro */}
      <div className={cn(
        'absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
        isActive ? 'bg-aurora-500 text-white' : 'bg-midnight-700 text-midnight-400'
      )}>
        {index + 1}
      </div>

      {/* Statut */}
      <div className={cn(
        'absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-medium',
        status.bg, status.color
      )}>
        {status.text}
      </div>

      {/* Titre */}
      <h4 className="font-medium text-sm mb-2 pr-6 truncate">
        {scene.title || `Scène ${index + 1}`}
      </h4>

      {/* Première phrase */}
      <p className="text-xs text-midnight-400 line-clamp-2">
        {scene.phrases[0] || scene.text.slice(0, 60)}...
      </p>

      {/* Indicateurs */}
      <div className="flex items-center gap-2 mt-3">
        {hasAudio && <Mic className={cn('w-3 h-3', isSynced ? 'text-emerald-400' : 'text-amber-400')} />}
        {hasMedia && <Image className="w-3 h-3 text-blue-400" />}
        {scene.soundTracks.length > 0 && <Volume2 className="w-3 h-3 text-pink-400" />}
        {scene.lightTracks.length > 0 && <Lightbulb className="w-3 h-3 text-yellow-400" />}
      </div>
    </motion.button>
  )
}

// =============================================================================
// SCENE SELECTOR - Sélecteur de scènes en haut
// =============================================================================

function SceneSelector() {
  const { currentProject, currentSceneIndex, setCurrentScene } = useMontageStore()

  if (!currentProject) return null

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setCurrentScene(currentSceneIndex - 1)}
        disabled={currentSceneIndex === 0}
        className={cn(
          'p-2 rounded-lg transition-colors',
          currentSceneIndex === 0
            ? 'text-midnight-600 cursor-not-allowed'
            : 'text-midnight-400 hover:text-white hover:bg-midnight-800/50'
        )}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex gap-1">
        {currentProject.scenes.map((scene, index) => {
          const hasAudio = !!scene.narration.audioUrl
          const isSynced = scene.narration.isSynced
          
          return (
            <button
              key={scene.id}
              onClick={() => setCurrentScene(index)}
              className={cn(
                'w-8 h-8 rounded-lg text-sm font-medium transition-all relative',
                index === currentSceneIndex
                  ? 'bg-aurora-500/30 text-aurora-300 ring-2 ring-aurora-500'
                  : 'bg-midnight-800/50 text-midnight-400 hover:text-white hover:bg-midnight-700/50'
              )}
            >
              {index + 1}
              {hasAudio && (
                <span className={cn(
                  'absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-midnight-900',
                  isSynced ? 'bg-emerald-500' : 'bg-amber-500'
                )} />
              )}
            </button>
          )
        })}
      </div>

      <button
        onClick={() => setCurrentScene(currentSceneIndex + 1)}
        disabled={currentSceneIndex === currentProject.scenes.length - 1}
        className={cn(
          'p-2 rounded-lg transition-colors',
          currentSceneIndex === currentProject.scenes.length - 1
            ? 'text-midnight-600 cursor-not-allowed'
            : 'text-midnight-400 hover:text-white hover:bg-midnight-800/50'
        )}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}

// =============================================================================
// NARRATION PANEL - Enregistrement/TTS de la voix
// =============================================================================

function NarrationPanel() {
  const { getCurrentScene, setNarrationAudio, clearNarrationAudio, setPhraseTimings } = useMontageStore()
  const { narrationVoiceId } = useAppStore()
  const { upload, isUploading, progress } = useMediaUpload()
  const locale = useLocale()
  
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [showGuidedRecording, setShowGuidedRecording] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  
  // États pour la voix IA
  const [showVoiceSelector, setShowVoiceSelector] = useState(false)
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false)
  const [ttsError, setTtsError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const scene = getCurrentScene()

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  // Réinitialiser le statut d'upload
  useEffect(() => {
    if (uploadStatus === 'success' || uploadStatus === 'error') {
      const timer = setTimeout(() => setUploadStatus('idle'), 3000)
      return () => clearTimeout(timer)
    }
  }, [uploadStatus])

  // Démarrer l'enregistrement
  const startRecording = async () => {
    setPermissionDenied(false)
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }
      })
      
      const mimeType = getSupportedAudioMimeType()
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {}
      
      mediaRecorderRef.current = new MediaRecorder(stream, options)
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      
      mediaRecorderRef.current.onstop = async () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        stream.getTracks().forEach(track => track.stop())
        
        if (audioBlob.size === 0) return
        
        // Calculer la durée
        const tempAudio = new Audio(URL.createObjectURL(audioBlob))
        tempAudio.onloadedmetadata = async () => {
          const duration = tempAudio.duration
          
          setUploadStatus('uploading')
          
          try {
            const result = await upload(audioBlob, { type: 'audio', source: 'upload' })
            if (result) {
              setNarrationAudio(result.url, 'recorded', duration)
              setUploadStatus('success')
            }
          } catch {
            // Fallback: base64 local
            const reader = new FileReader()
            reader.onloadend = () => {
              setNarrationAudio(reader.result as string, 'recorded', duration)
            }
            reader.readAsDataURL(audioBlob)
            setUploadStatus('error')
          }
        }
      }
      
      mediaRecorderRef.current.start(100)
      setIsRecording(true)
      setRecordingTime(0)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)
      
    } catch (err) {
      console.error('Erreur micro:', err)
      setPermissionDenied(true)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setIsRecording(false)
  }

  const playRecording = async () => {
    if (!scene?.narration.audioUrl) return
    
    if (!audioRef.current) {
      audioRef.current = new Audio(scene.narration.audioUrl)
      audioRef.current.onended = () => setIsPlaying(false)
    }
    
    if (isPlaying) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    } else {
      await audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    clearNarrationAudio()
    setIsPlaying(false)
  }

  const handleGuidedRecordingComplete = (timings: PhraseTiming[], audioUrl: string, duration: number) => {
    // Sauvegarder l'audio dans la scène
    setNarrationAudio(audioUrl, 'recorded', duration)
    // Sauvegarder les timings des phrases
    setPhraseTimings(timings)
    setShowGuidedRecording(false)
  }

  // Générer la narration avec une voix IA (ElevenLabs)
  // Process harmonisé : ElevenLabs + AssemblyAI pour timestamps précis
  const generateTTSNarration = async () => {
    if (!scene?.text) return
    
    setIsGeneratingTTS(true)
    setTtsError(null)
    setShowVoiceSelector(false)
    
    try {
      // Appeler l'API pour générer l'audio avec timestamps AssemblyAI
      const response = await fetch('/api/ai/voice/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scene.text,
          voiceId: narrationVoiceId || undefined,
          locale: locale,
          phrases: scene.phrases, // Passer les phrases pour l'alignement
          withTimestamps: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur génération audio')
      }

      const data = await response.json()
      
      // L'API retourne directement une URL audio (fal.ai héberge le fichier)
      const audioUrl = data.audioUrl
      
      if (!audioUrl) {
        throw new Error('Pas d\'URL audio dans la réponse')
      }
      
      const introDuration = scene?.introDuration || 0
      let phraseTimings: PhraseTiming[] = []
      
      // Utiliser les timings AssemblyAI si disponibles
      if (data.timings && data.timings.length > 0) {
        console.log('✅ Timestamps AssemblyAI reçus:', data.timings.length, 'phrases')
        
        phraseTimings = data.timings.map((t: { text: string; index: number; startTime: number; endTime: number }) => ({
          id: `phrase-${t.index}`,
          text: scene.phrases[t.index] || t.text,
          index: t.index,
          timeRange: {
            startTime: introDuration + t.startTime,
            endTime: introDuration + t.endTime,
          },
          audioTimeRange: {
            startTime: t.startTime,
            endTime: t.endTime,
          },
        }))
      } else {
        // Fallback: calculer les timings basé sur la durée et le nombre de mots
        console.log('⚠️ Fallback: timestamps estimés')
        const phrasesWithIndex = scene.phrases.map((text, index) => ({ text, index }))
        phraseTimings = createEstimatedPhraseTimings(phrasesWithIndex, data.duration)
      }
      
      // Sauvegarder dans le store
      setNarrationAudio(audioUrl, 'tts', data.duration)
      setPhraseTimings(phraseTimings)
      
      console.log('✅ Narration générée:', {
        duration: data.duration,
        phrases: phraseTimings.length,
        hasAccurateTimings: data.hasAccurateTimings,
      })
      
    } catch (error) {
      console.error('Erreur TTS:', error)
      setTtsError(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setIsGeneratingTTS(false)
    }
  }
  
  // Convertir base64 en Blob
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }
  
  // Créer les PhraseTiming à partir des timestamps de mots
  const createPhraseTimingsFromWords = (
    phrases: Array<{ text: string; index: number }>,
    wordTimestamps: Array<{ word: string; start: number; end: number }>,
    totalDuration: number
  ): PhraseTiming[] => {
    const introDuration = scene?.introDuration || 0
    let wordIndex = 0
    
    return phrases.map((phrase, index) => {
      const words = phrase.text.split(/\s+/)
      const startWord = wordTimestamps[wordIndex]
      const endWordIndex = Math.min(wordIndex + words.length - 1, wordTimestamps.length - 1)
      const endWord = wordTimestamps[endWordIndex]
      
      const timing: PhraseTiming = {
        id: `phrase-${index}`,
        text: phrase.text,
        index: phrase.index,
        timeRange: {
          startTime: introDuration + (startWord?.start || 0),
          endTime: introDuration + (endWord?.end || startWord?.start || 0) + 0.5,
        },
        audioTimeRange: {
          startTime: startWord?.start || 0,
          endTime: endWord?.end || 0,
        },
      }
      
      wordIndex += words.length
      return timing
    })
  }
  
  // Créer des timings estimés basés sur la durée
  const createEstimatedPhraseTimings = (
    phrases: Array<{ text: string; index: number }>,
    totalDuration: number
  ): PhraseTiming[] => {
    const introDuration = scene?.introDuration || 0
    const totalWords = phrases.reduce((sum, p) => sum + p.text.split(/\s+/).length, 0)
    const wordsPerSecond = totalWords / totalDuration
    
    let currentTime = 0
    
    return phrases.map((phrase, index) => {
      const words = phrase.text.split(/\s+/).length
      const phraseDuration = words / wordsPerSecond
      
      const timing: PhraseTiming = {
        id: `phrase-${index}`,
        text: phrase.text,
        index: phrase.index,
        timeRange: {
          startTime: introDuration + currentTime,
          endTime: introDuration + currentTime + phraseDuration,
        },
        audioTimeRange: {
          startTime: currentTime,
          endTime: currentTime + phraseDuration,
        },
      }
      
      currentTime += phraseDuration
      return timing
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!scene) return null

  return (
    <>
      <div className="glass rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center gap-2">
            <Mic className="w-5 h-5 text-aurora-400" />
            Narration
          </h3>
          {scene.narration.isSynced && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs flex items-center gap-1">
              <Check className="w-3 h-3" />
              {scene.phrases.length} phrases
            </span>
          )}
        </div>

        {/* Messages d'état */}
        {permissionDenied && (
          <div className="p-3 rounded-lg bg-rose-500/20 text-rose-300 text-sm">
            🎤 Autorise l'accès au micro pour enregistrer !
          </div>
        )}
        {uploadStatus === 'uploading' && (
          <div className="p-3 rounded-lg bg-aurora-500/20 text-aurora-300 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Upload... {progress > 0 && `${progress}%`}
          </div>
        )}
        {isGeneratingTTS && (
          <div className="p-3 rounded-lg bg-dream-500/20 text-dream-300 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            ✨ Génération de la voix magique en cours...
          </div>
        )}
        {ttsError && (
          <div className="p-3 rounded-lg bg-rose-500/20 text-rose-300 text-sm">
            ❌ {ttsError}
          </div>
        )}

        {/* Interface d'enregistrement */}
        {!scene.narration.audioUrl ? (
          <Highlightable id="montage-record-voice">
            <div className="grid grid-cols-2 gap-3">
              {/* Enregistrer sa voix avec synchronisation AssemblyAI */}
              <motion.button
                onClick={() => setShowGuidedRecording(true)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-midnight-800/50 hover:bg-midnight-700/50 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-aurora-500/30">
                  <Mic className="w-6 h-6 text-aurora-300" />
                </div>
                <span className="text-sm">Ma voix</span>
                <span className="text-xs text-midnight-400">Sync auto</span>
              </motion.button>

              {/* TTS - Voix IA */}
              <Highlightable id="montage-narration">
                <motion.button
                  onClick={() => setShowVoiceSelector(true)}
                  disabled={isGeneratingTTS}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-midnight-800/50 hover:bg-midnight-700/50 disabled:opacity-50 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-dream-500/30">
                    {isGeneratingTTS ? (
                      <Loader2 className="w-6 h-6 text-dream-300 animate-spin" />
                    ) : (
                      <Wand2 className="w-6 h-6 text-dream-300" />
                    )}
                  </div>
                  <span className="text-sm">IA raconte</span>
                  <span className="text-xs text-midnight-400">
                    {isGeneratingTTS ? 'Génération...' : 'Voix magique'}
                  </span>
                </motion.button>
              </Highlightable>
            </div>
          </Highlightable>
        ) : (
          /* Lecteur audio */
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <Highlightable id="montage-play">
                <motion.button
                  onClick={playRecording}
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                    isPlaying ? 'bg-emerald-500 text-white' : 'bg-emerald-500/30 text-emerald-300'
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </motion.button>
              </Highlightable>
              
              <div className="flex-1">
                <p className="font-medium text-emerald-300">🎤 Voix enregistrée</p>
                <p className="text-xs text-midnight-400">
                  {scene.narration.duration.toFixed(1)}s • 
                  {scene.narration.isSynced 
                    ? ` ${scene.narration.phrases.length} phrases sync`
                    : ' À synchroniser'
                  }
                </p>
              </div>
              
              <button
                onClick={deleteRecording}
                className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Bouton sync */}
            {!scene.narration.isSynced && (
              <Highlightable id="montage-sync-text">
                <motion.button
                  onClick={() => setShowGuidedRecording(true)}
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-aurora-500/20 to-dream-500/20 text-aurora-300 hover:from-aurora-500/30 hover:to-dream-500/30 flex items-center justify-center gap-3"
                  whileHover={{ scale: 1.01 }}
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="font-medium">Ré-enregistrer avec sync auto</span>
                </motion.button>
              </Highlightable>
            )}

            {scene.narration.isSynced && (
              <button
                onClick={() => setShowGuidedRecording(true)}
                className="w-full p-2 rounded-lg text-midnight-400 hover:text-aurora-300 hover:bg-midnight-800/50 text-sm"
              >
                🔄 Ré-enregistrer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal GuidedRecording avec AssemblyAI */}
      <GuidedRecording
        isOpen={showGuidedRecording}
        onClose={() => setShowGuidedRecording(false)}
        onComplete={handleGuidedRecordingComplete}
      />

      {/* Modal sélection voix IA */}
      <AnimatePresence>
        {showVoiceSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowVoiceSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-midnight-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dream-500 to-aurora-500 flex items-center justify-center">
                      <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-white">Voix IA</h2>
                      <p className="text-xs text-midnight-400">Choisis qui raconte ton histoire</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowVoiceSelector(false)}
                    className="p-2 rounded-lg hover:bg-midnight-700/50 text-midnight-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sélecteur de voix */}
                <div className="p-4">
                  <NarrationVoiceSelector locale={locale} />
                </div>

                {/* Bouton générer */}
                <div className="p-4 border-t border-midnight-700/50">
                  <motion.button
                    onClick={generateTTSNarration}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-dream-500 to-aurora-500 text-white font-medium flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Sparkles className="w-5 h-5" />
                    Générer la narration
                  </motion.button>
                  <p className="text-[10px] text-midnight-500 text-center mt-2">
                    ⚡ La génération peut prendre quelques secondes
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// =============================================================================
// SCENE STATUS PANEL - État de la scène
// =============================================================================

function SceneStatusPanel({ onGoToTimeline }: { onGoToTimeline: () => void }) {
  const { getCurrentScene } = useMontageStore()
  const scene = getCurrentScene()

  if (!scene) return null

  const hasAudio = !!scene.narration.audioUrl
  const isSynced = scene.narration.isSynced
  
  // Compte des éléments
  const mediasCount = scene.mediaTracks.length
  const soundsCount = scene.soundTracks.length
  const musicCount = scene.musicTracks?.length || 0
  const lightsCount = scene.lightTracks.length
  const decorationsCount = scene.decorationTracks?.length || 0
  const animationsCount = scene.animationTracks?.length || 0
  const textEffectsCount = scene.textEffectTracks?.length || 0
  
  const totalElements = mediasCount + soundsCount + musicCount + lightsCount + decorationsCount + animationsCount + textEffectsCount

  // Calcul du progrès
  const steps = [
    { done: hasAudio, label: 'Voix' },
    { done: isSynced, label: 'Sync' },
  ]
  const completedSteps = steps.filter(s => s.done).length

  return (
    <div className="glass rounded-xl p-4 space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          📊 État de la scène
        </h3>
        <span className={cn(
          'px-2 py-0.5 rounded-full text-xs font-medium',
          completedSteps === steps.length 
            ? 'bg-emerald-500/20 text-emerald-300' 
            : 'bg-amber-500/20 text-amber-300'
        )}>
          {completedSteps === steps.length ? '✅ Prêt' : `${completedSteps}/${steps.length}`}
        </span>
      </div>

      {/* Étapes principales */}
      <div className="space-y-2">
        {/* Voix */}
        <div className={cn(
          'flex items-center gap-3 p-3 rounded-lg',
          hasAudio ? 'bg-emerald-500/10' : 'bg-midnight-800/50'
        )}>
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            hasAudio ? 'bg-emerald-500/30 text-emerald-300' : 'bg-midnight-700 text-midnight-500'
          )}>
            {hasAudio ? <Check className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </div>
          <div className="flex-1">
            <p className={cn('font-medium text-sm', hasAudio ? 'text-emerald-300' : 'text-midnight-400')}>
              Voix
            </p>
            <p className="text-xs text-midnight-500">
              {hasAudio 
                ? `${scene.narration.duration.toFixed(1)}s enregistré`
                : 'Enregistre ta voix ci-dessous'
              }
            </p>
          </div>
        </div>

        {/* Synchronisation */}
        <div className={cn(
          'flex items-center gap-3 p-3 rounded-lg',
          isSynced ? 'bg-emerald-500/10' : hasAudio ? 'bg-amber-500/10' : 'bg-midnight-800/30'
        )}>
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            isSynced 
              ? 'bg-emerald-500/30 text-emerald-300' 
              : hasAudio 
                ? 'bg-amber-500/30 text-amber-300' 
                : 'bg-midnight-700/50 text-midnight-600'
          )}>
            {isSynced ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          </div>
          <div className="flex-1">
            <p className={cn(
              'font-medium text-sm', 
              isSynced ? 'text-emerald-300' : hasAudio ? 'text-amber-300' : 'text-midnight-500'
            )}>
              Synchronisation
            </p>
            <p className="text-xs text-midnight-500">
              {isSynced 
                ? `${scene.narration.phrases.length} phrases sync`
                : hasAudio 
                  ? 'Synchronisation en cours...'
                  : 'Enregistre d\'abord la voix'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Résumé des éléments */}
      <div className="pt-3 border-t border-midnight-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-midnight-400">Éléments dans la timeline</span>
          <span className="text-xs text-midnight-500">{totalElements} total</span>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: <Image className="w-4 h-4" />, count: mediasCount, label: 'Médias', color: 'text-blue-400' },
            { icon: <Volume2 className="w-4 h-4" />, count: soundsCount + musicCount, label: 'Sons', color: 'text-pink-400' },
            { icon: <Lightbulb className="w-4 h-4" />, count: lightsCount, label: 'Lumières', color: 'text-yellow-400' },
            { icon: <Sparkles className="w-4 h-4" />, count: animationsCount + decorationsCount, label: 'Effets', color: 'text-purple-400' },
          ].map((item, i) => (
            <div 
              key={i}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg',
                item.count > 0 ? 'bg-midnight-800/50' : 'bg-midnight-800/20'
              )}
            >
              <span className={item.count > 0 ? item.color : 'text-midnight-600'}>{item.icon}</span>
              <span className={cn(
                'text-lg font-bold',
                item.count > 0 ? 'text-white' : 'text-midnight-600'
              )}>
                {item.count}
              </span>
              <span className="text-xs text-midnight-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bouton Timeline */}
      <Highlightable id="montage-timeline">
        <motion.button
          onClick={onGoToTimeline}
          disabled={!isSynced}
          className={cn(
            'w-full p-4 rounded-xl flex items-center justify-center gap-3 transition-colors',
            isSynced
              ? 'bg-gradient-to-r from-aurora-500/20 to-dream-500/20 text-aurora-300 hover:from-aurora-500/30 hover:to-dream-500/30'
              : 'bg-midnight-800/30 text-midnight-500 cursor-not-allowed'
          )}
          whileHover={isSynced ? { scale: 1.01 } : {}}
        >
          <Layers className="w-5 h-5" />
          <span className="font-medium">
            {isSynced ? 'Aller à la Timeline →' : 'Synchronise d\'abord la voix'}
          </span>
        </motion.button>
      </Highlightable>
    </div>
  )
}

// =============================================================================
// HOOK RECONNAISSANCE VOCALE
// =============================================================================

interface UseSpeechRecognitionReturn {
  isListening: boolean
  isSupported: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

function useSpeechRecognition(locale: string = 'fr'): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef<any>(null)
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsSupported(false)
      return
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }
    
    setIsSupported(true)
    
    if (hasInitialized.current) return
    hasInitialized.current = true

    try {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'ru-RU'

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript)
        }
      }

      recognitionRef.current.onerror = () => setIsListening(false)
      recognitionRef.current.onend = () => setIsListening(false)
    } catch {
      setIsSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
    }
  }, [locale])

  const startListening = async () => {
    if (recognitionRef.current && !isListening) {
      // Dans Electron, demander la permission du microphone d'abord
      if (typeof window !== 'undefined' && (window as any).electronAPI?.requestMicrophoneAccess) {
        try {
          const granted = await (window as any).electronAPI.requestMicrophoneAccess()
          if (!granted) {
            console.error('Permission microphone refusée')
            return
          }
        } catch (err) {
          console.error('Erreur permission microphone:', err)
        }
      }
      
      setTranscript('')
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.error('Erreur démarrage reconnaissance vocale:', err)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const resetTranscript = () => setTranscript('')

  return { isListening, isSupported, transcript, startListening, stopListening, resetTranscript }
}

// =============================================================================
// CHAT IA INTÉGRÉ POUR LE MONTAGE
// =============================================================================

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

function MontageAIChat() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true) // Vocal activé par défaut
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { aiName, aiVoice } = useAppStore()
  const { highlightMultiple } = useHighlightStore()
  
  const displayName = aiName || 'Mon aide'
  
  // TTS avec la voix choisie
  const { speak, stop, isSpeaking, isAvailable: isTTSAvailable } = useTTS('fr', aiVoice || undefined)
  
  // Reconnaissance vocale pour parler à l'IA
  const { 
    isListening, 
    isSupported: isSpeechSupported, 
    transcript, 
    startListening, 
    stopListening, 
    resetTranscript 
  } = useSpeechRecognition('fr')
  
  // Envoyer le transcript quand on arrête de parler
  useEffect(() => {
    if (!isListening && transcript) {
      setMessage(transcript)
      resetTranscript()
    }
  }, [isListening, transcript, resetTranscript])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Message d'accueil (avec voix)
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMsg = `Salut ! Je suis ${displayName} ! Besoin d'aide pour ton montage ? Demande-moi !`
      setMessages([{
        role: 'assistant',
        content: welcomeMsg
      }])
      // Lire le message d'accueil
      if (autoSpeak && isTTSAvailable) {
        setTimeout(() => speak(welcomeMsg), 500)
      }
    }
  }, [messages.length, displayName, autoSpeak, isTTSAvailable, speak])

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return

    const userMessage = message.trim()
    setMessage('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: 'montage',
          currentMode: 'montage',
          aiName,
          userName: useAppStore.getState().userName, // Prénom de l'enfant
          chatHistory: messages.slice(-10),
        }),
      })

      const data = await response.json()

      if (data.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }])
        
        // Déclencher les highlights si présents dans la réponse
        if (data.highlights && data.highlights.length > 0) {
          highlightMultiple(data.highlights)
        }
        
        // Lire la réponse à voix haute
        if (autoSpeak && isTTSAvailable) {
          speak(data.text)
        }
      }
    } catch (error) {
      console.error('Erreur chat IA:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Oups, petit problème ! Réessaie !" 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Version réduite
  if (isCollapsed) {
    return (
      <motion.button
        onClick={() => setIsCollapsed(false)}
        className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-aurora-500/20 to-stardust-500/20 border border-aurora-500/30 hover:from-aurora-500/30 hover:to-stardust-500/30 transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-aurora-500 to-stardust-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-aurora-300 font-medium text-sm">{displayName}</span>
        <ChevronDown className="w-4 h-4 text-aurora-400 ml-auto" />
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col bg-midnight-900/50 rounded-xl border border-aurora-500/20 overflow-hidden min-h-0"
    >
      {/* Header */}
      <div className="p-3 border-b border-midnight-700/50 flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-aurora-500 to-stardust-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white text-sm truncate">{displayName}</p>
          <p className="text-[10px] text-midnight-400">Aide montage</p>
        </div>
        
        {/* Toggle vocal */}
        {isTTSAvailable && (
          <button
            onClick={() => {
              if (isSpeaking) stop()
              setAutoSpeak(!autoSpeak)
            }}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              autoSpeak
                ? 'bg-aurora-500/20 text-aurora-300'
                : 'bg-midnight-800/50 text-midnight-400 hover:text-white'
            )}
            title={autoSpeak ? 'Désactiver la voix' : 'Activer la voix'}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        )}
        
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 rounded-lg text-midnight-400 hover:text-white hover:bg-midnight-800 transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'max-w-[90%] p-2 rounded-lg text-xs',
              msg.role === 'user'
                ? 'ml-auto bg-aurora-600 text-white rounded-br-sm'
                : 'bg-midnight-800/80 text-midnight-100 rounded-bl-sm border border-aurora-500/20'
            )}
          >
            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-1 p-2 bg-midnight-800/80 rounded-lg rounded-bl-sm w-fit">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-aurora-400"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form 
        onSubmit={(e) => { e.preventDefault(); sendMessage() }}
        className="p-2 border-t border-midnight-700/50 flex flex-col gap-2 flex-shrink-0"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isListening ? 'Écoute...' : 'Ta question...'}
            className="flex-1 px-2 py-1.5 text-xs text-white placeholder-midnight-500 bg-midnight-800 border border-midnight-700 rounded-lg focus:outline-none focus:border-aurora-500"
          />
          
          {/* Bouton micro pour parler */}
          {isSpeechSupported && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-midnight-800 text-midnight-400 hover:text-aurora-300 hover:bg-midnight-700'
              )}
              title={isListening ? 'Arrêter' : 'Parler'}
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
          
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              message.trim() && !isLoading
                ? 'bg-aurora-500 text-white hover:bg-aurora-600'
                : 'bg-midnight-800 text-midnight-600'
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </motion.div>
  )
}

// =============================================================================
// AIDE IA FLOTTANTE POUR LA TIMELINE
// =============================================================================

function TimelineAIHelp() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { aiName, aiVoice } = useAppStore()
  const { highlightMultiple } = useHighlightStore()
  
  const displayName = aiName || 'Mon aide'
  
  // Position du panneau (draggable)
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, panelX: 0, panelY: 0 })
  const panelRef = useRef<HTMLDivElement>(null)
  
  // TTS
  const { speak, stop, isSpeaking, isAvailable: isTTSAvailable } = useTTS('fr', aiVoice || undefined)
  const [autoSpeak, setAutoSpeak] = useState(true)
  
  // Reconnaissance vocale
  const { 
    isListening, 
    isSupported: isSpeechSupported, 
    transcript, 
    startListening, 
    stopListening, 
    resetTranscript 
  } = useSpeechRecognition('fr')
  
  // Gestion du drag
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panelX: panelPosition.x,
      panelY: panelPosition.y
    }
  }
  
  useEffect(() => {
    if (!isDragging) return
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.x
      const deltaY = e.clientY - dragStartRef.current.y
      setPanelPosition({
        x: dragStartRef.current.panelX + deltaX,
        y: dragStartRef.current.panelY + deltaY
      })
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])
  
  // Reset position quand on ferme
  useEffect(() => {
    if (!isOpen) {
      setPanelPosition({ x: 0, y: 0 })
    }
  }, [isOpen])
  
  useEffect(() => {
    if (!isListening && transcript) {
      setMessage(transcript)
      resetTranscript()
    }
  }, [isListening, transcript, resetTranscript])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Message d'accueil quand on ouvre
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMsg = `Salut ! Je suis ${displayName} ! Tu es dans la Timeline ! C'est ici que tu décores ton histoire. Qu'est-ce que tu veux savoir ?`
      setMessages([{ role: 'assistant', content: welcomeMsg }])
      if (autoSpeak && isTTSAvailable) {
        setTimeout(() => speak(welcomeMsg), 300)
      }
    }
  }, [isOpen, messages.length, displayName, autoSpeak, isTTSAvailable, speak])

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return

    const userMessage = message.trim()
    setMessage('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: 'montage',
          currentMode: 'montage-timeline', // Mode spécifique Timeline
          aiName,
          userName: useAppStore.getState().userName,
          chatHistory: messages.slice(-10),
        }),
      })

      const data = await response.json()

      if (data.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }])
        
        if (data.highlights && data.highlights.length > 0) {
          highlightMultiple(data.highlights)
        }
        
        if (autoSpeak && isTTSAvailable) {
          speak(data.text)
        }
      }
    } catch (error) {
      console.error('Erreur chat IA:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: "Oups, petit problème ! Réessaie !" }])
    } finally {
      setIsLoading(false)
    }
  }

  const content = (
    <>
      {/* Bouton flottant - fixe en bas à droite */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed z-[10001] p-4 rounded-full shadow-xl transition-colors bottom-6 right-6',
          isOpen
            ? 'bg-midnight-800 text-midnight-400'
            : 'bg-gradient-to-br from-aurora-500 to-stardust-500 text-white'
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={isOpen ? {} : { 
          boxShadow: ['0 0 0 0 rgba(139, 92, 246, 0)', '0 0 0 10px rgba(139, 92, 246, 0.3)', '0 0 0 0 rgba(139, 92, 246, 0)']
        }}
        transition={isOpen ? {} : { duration: 2, repeat: Infinity }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </motion.button>

      {/* Panneau de chat - draggable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed z-[10001] w-80 max-h-[60vh] flex flex-col bg-midnight-900/95 backdrop-blur-xl rounded-2xl border border-aurora-500/30 shadow-2xl overflow-hidden"
            style={{
              bottom: `calc(6rem - ${panelPosition.y}px)`,
              right: `calc(1.5rem - ${panelPosition.x}px)`,
            }}
          >
            {/* Header - Draggable */}
            <div 
              className={cn(
                "p-3 border-b border-midnight-700/50 flex items-center gap-2",
                isDragging ? "cursor-grabbing" : "cursor-grab"
              )}
              onMouseDown={handleDragStart}
            >
              {/* Icône grip pour indiquer le drag */}
              <div className="flex flex-col gap-0.5 mr-1">
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-midnight-500" />
                  <div className="w-1 h-1 rounded-full bg-midnight-500" />
                </div>
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-midnight-500" />
                  <div className="w-1 h-1 rounded-full bg-midnight-500" />
                </div>
              </div>
              
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-aurora-500 to-stardust-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white text-sm">{displayName}</p>
                <p className="text-[10px] text-midnight-400">Aide Timeline • Glisse pour déplacer</p>
              </div>
              
              {isTTSAvailable && (
                <button
                  onClick={(e) => { e.stopPropagation(); if (isSpeaking) stop(); setAutoSpeak(!autoSpeak) }}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    autoSpeak ? 'bg-aurora-500/20 text-aurora-300' : 'bg-midnight-800/50 text-midnight-400'
                  )}
                >
                  {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm min-h-[200px]">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'max-w-[90%] p-2 rounded-lg',
                    msg.role === 'user'
                      ? 'ml-auto bg-aurora-600 text-white rounded-br-sm'
                      : 'bg-midnight-800/80 text-midnight-100 rounded-bl-sm border border-aurora-500/20'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-1 p-2 bg-midnight-800/80 rounded-lg w-fit">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-aurora-400"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="p-2 border-t border-midnight-700/50 flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isListening ? 'Écoute...' : 'Ta question...'}
                  className="flex-1 px-2 py-1.5 text-xs text-white placeholder-midnight-500 bg-midnight-800 border border-midnight-700 rounded-lg focus:outline-none focus:border-aurora-500"
                />
                
                {isSpeechSupported && (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-midnight-800 text-midnight-400 hover:text-aurora-300'
                    )}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    message.trim() && !isLoading
                      ? 'bg-aurora-500 text-white' 
                      : 'bg-midnight-800 text-midnight-600'
                  )}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
  
  // Toujours rendre via un portal pour être au-dessus de tout (y compris Timeline plein écran)
  if (typeof document !== 'undefined') {
    return createPortal(content, document.body)
  }
  
  return null
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export function MontageEditor() {
  const { currentProject, currentSceneIndex, getCurrentScene, setCurrentScene, viewMode, setViewMode, closeProject } = useMontageStore()
  const { stories } = useAppStore()
  const { projects, loadProject, deleteProject, createProject } = useMontageStore()
  
  const [showPlayer, setShowPlayer] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const scene = getCurrentScene()

  // Si pas de projet, écran de sélection
  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <motion.div
          className="glass rounded-3xl p-8 max-w-3xl w-full"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-aurora-500/30 to-dream-500/30 flex items-center justify-center">
              <Film className="w-10 h-10 text-aurora-400" />
            </div>
            <h2 className="font-display text-2xl text-white mb-2">Mode Montage</h2>
            <p className="text-midnight-300">Transforme ton histoire en livre-disque magique ! ✨</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Projets existants */}
            <div className="space-y-4">
              <h3 className="text-sm text-midnight-400 uppercase tracking-wider flex items-center gap-2">
                <Film className="w-4 h-4" />
                Continuer un montage
              </h3>
              
              {projects.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {projects.map((project) => (
                    <motion.div key={project.id} className="group relative" whileHover={{ scale: 1.02 }}>
                      <button
                        onClick={() => loadProject(project.id)}
                        className="w-full p-4 rounded-xl bg-aurora-500/10 hover:bg-aurora-500/20 text-left border border-aurora-500/20"
                      >
                        <p className="font-medium text-aurora-300">{project.title}</p>
                        <p className="text-xs text-midnight-400 mt-1">
                          {project.scenes.length} scènes • {project.isComplete ? '✅ Terminé' : '🔧 En cours'}
                        </p>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('Supprimer ce montage ?')) deleteProject(project.id)
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-500/20 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-midnight-800/30 text-center">
                  <Film className="w-8 h-8 mx-auto mb-2 text-midnight-600" />
                  <p className="text-sm text-midnight-500">Aucun montage</p>
                </div>
              )}
            </div>

            {/* Nouvelles histoires */}
            <div className="space-y-4">
              <h3 className="text-sm text-midnight-400 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Nouveau montage
              </h3>
              
              {stories.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stories.map((story) => {
                    const existing = projects.find(p => p.storyId === story.id)
                    
                    return (
                      <motion.button
                        key={story.id}
                        onClick={() => {
                          if (existing) {
                            loadProject(existing.id)
                          } else {
                            // TOUJOURS récupérer depuis localStorage (Supabase sync bugué)
                            let pagesWithContent: Array<{id: string, content?: string, order?: number}> = []
                            try {
                              const localData = JSON.parse(localStorage.getItem('lavoixdusoir-storage') || '{}')
                              const localStory = localData.state?.stories?.find((s: { id: string }) => s.id === story.id)
                              if (localStory?.pages?.length > 0) {
                                pagesWithContent = localStory.pages
                                console.log('📖 Pages récupérées depuis localStorage:', pagesWithContent.length)
                              }
                            } catch (e) { 
                              console.error('Erreur localStorage:', e)
                            }
                            
                            // Fallback sur story.pages si localStorage vide
                            if (pagesWithContent.length === 0) {
                              pagesWithContent = story.pages
                              console.log('📖 Fallback sur story.pages:', pagesWithContent.length)
                            }
                            
                            const pages = pagesWithContent
                              .map((p, idx) => ({
                                id: p.id,
                                title: `Scène ${(p.order ?? idx) + 1}`,
                                text: p.content || '',
                              }))
                              .filter(p => p.text.trim().length > 0) // Filtrer les pages vides
                            
                            // Ne pas créer si aucune page avec du contenu
                            if (pages.length === 0) {
                              console.error('❌ Impossible de créer le projet : aucune page avec du contenu')
                              alert('Cette histoire n\'a pas encore de contenu. Écris d\'abord dans l\'onglet Écriture !')
                              return
                            }
                            
                            console.log('🎬 Création projet avec pages:', pages.map(p => ({ id: p.id.slice(0,8), textLen: p.text.length })))
                            createProject(story.id, story.title, pages)
                          }
                        }}
                        className={cn(
                          'w-full p-4 rounded-xl text-left border',
                          existing
                            ? 'bg-dream-500/10 hover:bg-dream-500/20 border-dream-500/20'
                            : 'bg-midnight-800/50 hover:bg-midnight-700/50 border-midnight-700/30'
                        )}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{story.title}</p>
                            <p className="text-xs text-midnight-400">{story.pages.length} pages</p>
                          </div>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs',
                            existing ? 'bg-dream-500/20 text-dream-300' : 'bg-emerald-500/20 text-emerald-300'
                          )}>
                            {existing ? 'Existant' : '+ Créer'}
                          </span>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-midnight-800/30 text-center">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-midnight-600" />
                  <p className="text-sm text-midnight-500">Crée d'abord une histoire</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* En-tête */}
      <motion.header
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          {/* Bouton Retour - visible en mode Timeline */}
          {viewMode === 'timeline' ? (
            <motion.button
              onClick={() => setViewMode('cards')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-midnight-800/50 text-midnight-300 hover:text-white hover:bg-midnight-700/50 transition-colors"
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Retour</span>
            </motion.button>
          ) : (
            <motion.button
              onClick={closeProject}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-midnight-800/50 text-midnight-300 hover:text-white hover:bg-midnight-700/50 transition-colors"
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.95 }}
              title="Fermer le projet"
            >
              <Home className="w-5 h-5" />
            </motion.button>
          )}
          
          <div>
            <h1 className="font-display text-2xl text-aurora-300 flex items-center gap-3">
              <Film className="w-7 h-7" />
              Montage
            </h1>
            <p className="text-midnight-300">{currentProject.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <SceneSelector />
          
          {/* Toggle vue */}
          <Highlightable id="montage-view-cards">
            <div className="flex rounded-lg bg-midnight-800/50 p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors',
                  viewMode === 'cards' ? 'bg-aurora-500/30 text-aurora-300' : 'text-midnight-400 hover:text-white'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
                Cartes
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors',
                  viewMode === 'timeline' ? 'bg-aurora-500/30 text-aurora-300' : 'text-midnight-400 hover:text-white'
                )}
              >
                <Layers className="w-4 h-4" />
                Timeline
              </button>
            </div>
          </Highlightable>

          <button 
            onClick={() => setShowPlayer(true)}
            disabled={!scene?.narration.isSynced}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl transition-colors',
              scene?.narration.isSynced
                ? 'bg-aurora-500/20 text-aurora-300 hover:bg-aurora-500/30'
                : 'bg-midnight-800/50 text-midnight-500 cursor-not-allowed'
            )}
          >
            <Eye className="w-4 h-4" />
            Lire
          </button>
        </div>
      </motion.header>

      {/* Contenu principal */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'cards' ? (
          /* VUE CARTES */
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Colonne scènes + Chat IA */}
            <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
              {/* Liste des scènes */}
              <Highlightable id="montage-scenes">
                <div className="flex-shrink-0">
                  <h3 className="text-sm text-midnight-400 font-medium mb-2">Scènes</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {currentProject.scenes.map((s, index) => (
                      index === 0 ? (
                        <Highlightable key={s.id} id="montage-scene-card">
                          <SceneCard
                            scene={s}
                            index={index}
                            isActive={index === currentSceneIndex}
                            onClick={() => setCurrentScene(index)}
                          />
                        </Highlightable>
                      ) : (
                        <SceneCard
                          key={s.id}
                          scene={s}
                          index={index}
                          isActive={index === currentSceneIndex}
                          onClick={() => setCurrentScene(index)}
                        />
                      )
                    ))}
                  </div>
                </div>
              </Highlightable>
              
              {/* Chat IA intégré */}
              <Highlightable id="montage-ai-chat">
                <MontageAIChat />
              </Highlightable>
            </div>

            {/* Colonne narration + texte */}
            <div className="col-span-5 flex flex-col gap-4 overflow-y-auto">
              {scene && (
                <>
                  {/* Texte de la scène */}
                  <div className="glass rounded-xl p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-amber-400" />
                      Texte - Scène {currentSceneIndex + 1}
                    </h3>
                    <div className="space-y-2">
                      {(scene.phrases || []).map((phrase, i) => (
                        <div
                          key={i}
                          className={cn(
                            'p-3 rounded-lg text-sm',
                            scene.narration.isSynced && scene.narration.phrases[i]
                              ? 'bg-emerald-500/10 border border-emerald-500/30'
                              : 'bg-midnight-800/50'
                          )}
                        >
                          <span className="text-midnight-500 mr-2">{i + 1}.</span>
                          {phrase}
                        </div>
                      ))}
                    </div>
                  </div>

                  <NarrationPanel />
                </>
              )}
            </div>

            {/* Colonne état de la scène */}
            <div className="col-span-4 flex flex-col gap-4 overflow-y-auto">
              <SceneStatusPanel onGoToTimeline={() => setViewMode('timeline')} />
            </div>
          </div>
        ) : (
          /* VUE TIMELINE */
          <div className="h-full flex flex-col gap-4 relative">
            {/* Résumé de la scène */}
            {scene && (
              <div className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center gap-2">
                    Scène {currentSceneIndex + 1}: {scene.title}
                  </h3>
                  <span className="text-sm text-midnight-400">
                    {scene.duration > 0 ? `${scene.duration.toFixed(1)}s` : 'Durée non définie'}
                  </span>
                </div>
                <p className="text-sm text-midnight-400 line-clamp-2">{scene.text}</p>
              </div>
            )}

            {/* Prévisualisation + Timeline */}
            <div className={cn(
              "grid gap-4",
              showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
            )}>
              {/* Canvas de prévisualisation (rétractable) */}
              <AnimatePresence mode="wait">
                {showPreview ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    {/* Bouton pour réduire */}
                    <button
                      onClick={() => setShowPreview(false)}
                      className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-midnight-800 border border-midnight-600 text-midnight-400 hover:text-white hover:border-midnight-500 transition-colors shadow-lg"
                      title="Réduire la prévisualisation"
                    >
                      <PanelLeftClose className="w-4 h-4" />
                    </button>
                    <PreviewCanvas />
                  </motion.div>
                ) : (
                  <motion.button
                    key="preview-collapsed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-midnight-800/50 border border-midnight-700 text-midnight-400 hover:text-white hover:border-midnight-600 transition-colors self-start"
                    title="Afficher la prévisualisation"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Prévisualisation</span>
                    <PanelLeft className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
              
              {/* Timeline des rubans */}
              <TimelineRubans />
            </div>
            
            {/* Panneau de propriétés déplaçable (quand un élément est sélectionné) */}
            <TrackPropertiesPanel />
            
            {/* Bouton d'aide IA flottant */}
            <TimelineAIHelp />
          </div>
        )}
      </div>

      {/* Modal Karaoke Player */}
      {scene && (
        <KaraokePlayer
          isOpen={showPlayer}
          onClose={() => setShowPlayer(false)}
          scene={scene}
        />
      )}
    </div>
  )
}
