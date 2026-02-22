'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMontageStore, type PhraseTiming } from '@/store/useMontageStore'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { cn } from '@/lib/utils'
import {
  Mic,
  Square,
  Loader2,
  AlertTriangle,
  Check,
  X,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react'
import { useTranslations } from '@/lib/i18n/context'

interface GuidedRecordingProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (timings: PhraseTiming[], audioUrl: string, duration: number) => void
}

function getSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/wav'
  const formats = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/wav']
  for (const format of formats) {
    if (MediaRecorder.isTypeSupported(format)) return format
  }
  return ''
}

type Phase = 
  | 'warning'      // Alerte initiale
  | 'ready'        // Prêt à enregistrer
  | 'recording'    // En cours d'enregistrement
  | 'processing'   // Envoi à AssemblyAI
  | 'preview'      // Prévisualisation des timings
  | 'confirm'      // Confirmation finale (alerte 2)
  | 'complete'     // Terminé

export function GuidedRecording({ isOpen, onClose, onComplete }: GuidedRecordingProps) {
  const t = useTranslations('layout')
  const { getCurrentScene, currentSceneIndex } = useMontageStore()
  const { upload } = useMediaUpload()
  
  const [phase, setPhase] = useState<Phase>('warning')
  const [recordingTime, setRecordingTime] = useState(0)
  const [timings, setTimings] = useState<PhraseTiming[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioDuration, setAudioDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transcription, setTranscription] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const scene = getCurrentScene()
  const phrases = scene?.phrases || []
  
  // Récupérer l'intro duration pour positionner les phrases en absolu sur la timeline
  const introDuration = scene?.introDuration || 0
  
  // Vérifier s'il y a des animations existantes
  const hasExistingAnimations = scene?.tracks?.some(t => 
    t.type === 'animation' || t.type === 'effect' || t.type === 'light'
  ) || false

  // Reset quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setPhase('warning')
      setRecordingTime(0)
      setTimings([])
      setAudioUrl(null)
      setAudioBlob(null)
      setAudioDuration(0)
      setIsPlaying(false)
      setError(null)
      setTranscription(null)
    }
  }, [isOpen, currentSceneIndex])

  // Pré-initialiser le micro dès la phase "ready" pour éviter le délai de ~3s au démarrage
  useEffect(() => {
    if (isOpen && phase === 'ready' && !streamRef.current) {
      navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }
      }).then(stream => {
        streamRef.current = stream
        console.log('🎤 Micro pré-initialisé (warm-up)')
      }).catch(err => {
        console.error('Erreur pré-init micro:', err)
        setError(t('guidedRecording.micAccessError'))
      })
    }
  }, [isOpen, phase])

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  // Démarrer l'enregistrement
  const startRecording = async () => {
    setError(null)
    try {
      // Réutiliser le stream pré-initialisé ou en créer un nouveau
      let stream = streamRef.current
      if (!stream || !stream.active) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }
        })
        streamRef.current = stream
      }
      
      const mimeType = getSupportedAudioMimeType()
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {}
      
      mediaRecorderRef.current = new MediaRecorder(stream, options)
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      
      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm'
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        // Ne pas stopper le stream ici - on le garde chaud pour un éventuel ré-enregistrement
        // Le cleanup se fait au démontage du composant
        
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob)
          setAudioBlob(blob)
          setAudioUrl(url)
          
          // Calculer la durée
          const tempAudio = new Audio(url)
          tempAudio.onloadedmetadata = () => {
            setAudioDuration(tempAudio.duration)
            processWithAssemblyAI(blob, tempAudio.duration)
          }
        }
      }
      
      mediaRecorderRef.current.start(100)
      setPhase('recording')
      setRecordingTime(0)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)
      
    } catch (err) {
      console.error('Erreur micro:', err)
      setError(t('guidedRecording.micAccessError'))
    }
  }

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setPhase('processing')
  }, [])

  // Envoyer à AssemblyAI
  const processWithAssemblyAI = async (blob: Blob, duration: number) => {
    setPhase('processing')
    setError(null)
    
    try {
      console.log('🎤 Envoi à AssemblyAI...')
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')
      formData.append('phrases', JSON.stringify(phrases))
      
      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur de transcription')
      }
      
      const data = await response.json()
      console.log('✅ AssemblyAI OK:', data)
      
      if (data.transcription) {
        setTranscription(data.transcription)
      }
      
      if (data.success && data.timings) {
        // Utiliser les timings d'AssemblyAI
        // timeRange = position ABSOLUE sur la timeline (introDuration + temps audio)
        // audioTimeRange = timing ORIGINAL dans le fichier audio (immuable)
        const phraseTimings: PhraseTiming[] = data.timings.map((t: { text: string; startTime: number; endTime: number }, index: number) => ({
          id: crypto.randomUUID(),
          text: phrases[index] || t.text,
          index,
          timeRange: {
            startTime: introDuration + t.startTime,
            endTime: introDuration + t.endTime,
          },
          audioTimeRange: {
            startTime: t.startTime,
            endTime: t.endTime,
          },
        }))
        setTimings(phraseTimings)
        setAudioDuration(data.duration || duration)
      } else {
        // Fallback: distribution uniforme
        // Positions ABSOLUES sur la timeline (après l'intro)
        const fallbackTimings: PhraseTiming[] = phrases.map((text, index) => {
          const audioStart = (duration / phrases.length) * index
          const audioEnd = (duration / phrases.length) * (index + 1)
          return {
            id: crypto.randomUUID(),
            text,
            index,
            timeRange: { 
              startTime: introDuration + audioStart, 
              endTime: introDuration + audioEnd 
            },
            audioTimeRange: { 
              startTime: audioStart, 
              endTime: audioEnd 
            },
          }
        })
        setTimings(fallbackTimings)
      }
      
      setPhase('preview')
      
    } catch (err) {
      console.error('❌ Erreur AssemblyAI:', err)
      setError(err instanceof Error ? err.message : 'Erreur de transcription')
      
      // Fallback en cas d'erreur - positions ABSOLUES sur la timeline
      const phraseTimings: PhraseTiming[] = phrases.map((text, index) => {
        const audioStart = (duration / phrases.length) * index
        const audioEnd = (duration / phrases.length) * (index + 1)
        return {
          id: crypto.randomUUID(),
          text,
          index,
          timeRange: { 
            startTime: introDuration + audioStart, 
            endTime: introDuration + audioEnd 
          },
          audioTimeRange: { 
            startTime: audioStart, 
            endTime: audioEnd 
          },
        }
      })
      setTimings(phraseTimings)
      setPhase('preview')
    }
  }

  // Lecture audio
  const togglePlay = () => {
    if (!audioUrl) return
    
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl)
      audioRef.current.onended = () => setIsPlaying(false)
    }
    
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  // Recommencer
  const restart = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setPhase('ready')
    setAudioUrl(null)
    setAudioBlob(null)
    setTimings([])
    setRecordingTime(0)
    setError(null)
    setTranscription(null)
  }

  // Validation finale
  const handleValidate = async () => {
    if (!audioBlob || !audioUrl) return
    
    setPhase('complete')
    
    let finalAudioUrl = audioUrl
    
    // Upload de l'audio
    try {
      const result = await upload(audioBlob, { type: 'audio', source: 'upload' })
      if (result?.url) {
        finalAudioUrl = result.url
        setAudioUrl(result.url)
      }
    } catch (err) {
      console.warn('Upload failed, using local URL:', err)
      // On garde l'URL locale (blob URL)
    }
    
    // Compléter avec les timings ET l'audio
    onComplete(timings, finalAudioUrl, audioDuration)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-lg bg-night-900 rounded-2xl border border-white/10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Mic className="w-5 h-5 text-aurora-400" />
              {t('guidedRecording.syncRecording')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenu */}
          <div className="p-6">
            {/* PHASE 1: Alerte initiale */}
            {phase === 'warning' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-500/20 border border-amber-500/30">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-300 mb-1">{t('guidedRecording.warning')}</h3>
                      <p className="text-sm text-amber-200/80">
                        {hasExistingAnimations ? (
                          t('guidedRecording.warningWithAnimations')
                        ) : (
                          t('guidedRecording.warningWithoutAnimations', { count: phrases.length })
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {t('guidedRecording.cancel')}
                  </button>
                  <button
                    onClick={() => setPhase('ready')}
                    className="flex-1 px-4 py-3 rounded-xl bg-aurora-500 hover:bg-aurora-600 transition-colors font-medium"
                  >
                    {t('guidedRecording.understood')}
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 2: Prêt à enregistrer */}
            {phase === 'ready' && (
              <div className="space-y-4 text-center">
                <p className="text-white/70">
                  {t('guidedRecording.readPhrases', { count: phrases.length })}
                </p>
                
                <div className="max-h-64 overflow-y-auto p-4 rounded-xl bg-gradient-to-b from-slate-900/80 to-slate-800/80 border border-white/10 text-left space-y-3">
                  {phrases.map((phrase, i) => (
                    <div key={i} className="flex gap-3 items-start p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <span className="text-aurora-400 font-bold text-lg min-w-[2rem] text-right">{i + 1}.</span>
                      <p className="text-lg text-white/90 leading-relaxed font-medium">{phrase}</p>
                    </div>
                  ))}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startRecording}
                  className="w-full px-6 py-4 rounded-xl bg-rose-500 hover:bg-rose-600 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Mic className="w-5 h-5" />
                  {t('guidedRecording.startRecording')}
                </motion.button>
              </div>
            )}

            {/* PHASE 3: En cours d'enregistrement */}
            {phase === 'recording' && (
              <div className="space-y-4 text-center">
                {/* Header compact avec micro et timer */}
                <div className="flex items-center justify-center gap-4">
                  <div className="relative w-14 h-14">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-rose-500/30"
                    />
                    <div className="absolute inset-1 rounded-full bg-rose-500 flex items-center justify-center">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-mono text-rose-400">{formatTime(recordingTime)}</p>
                    <p className="text-white/50 text-xs">{t('guidedRecording.recording')}</p>
                  </div>
                </div>
                
                {/* Zone téléprompter - grande et lisible */}
                <div className="relative">
                  <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-slate-900 to-transparent z-10 pointer-events-none rounded-t-xl" />
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-900 to-transparent z-10 pointer-events-none rounded-b-xl" />
                  
                  <div className="max-h-72 overflow-y-auto p-6 rounded-xl bg-gradient-to-b from-slate-900/90 to-slate-800/90 border-2 border-rose-500/30 text-center">
                    {phrases.map((phrase, i) => (
                      <p key={i} className="text-xl md:text-2xl text-white leading-loose font-medium py-2 border-b border-white/5 last:border-0">
                        {phrase}
                      </p>
                    ))}
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={stopRecording}
                  className="w-full px-6 py-4 rounded-xl bg-white/20 hover:bg-white/30 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Square className="w-5 h-5 fill-current" />
                  {t('guidedRecording.stopRecording')}
                </motion.button>
              </div>
            )}

            {/* PHASE 4: Traitement AssemblyAI */}
            {phase === 'processing' && (
              <div className="space-y-4 text-center py-8">
                <Loader2 className="w-12 h-12 text-aurora-400 animate-spin mx-auto" />
                <div>
                  <p className="font-medium">{t('guidedRecording.syncing')}</p>
                  <p className="text-sm text-white/50 mt-1">
                    {t('guidedRecording.analyzingVoice')}
                  </p>
                </div>
              </div>
            )}

            {/* PHASE 5: Prévisualisation */}
            {phase === 'preview' && (
              <div className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-amber-500/20 text-amber-300 text-sm">
                    ⚠️ {error} - Distribution uniforme appliquée
                  </div>
                )}
                
                {transcription && (
                  <div className="p-3 rounded-lg bg-white/5 text-sm">
                    <p className="text-white/50 text-xs mb-1">{t('guidedRecording.detectedTranscription')}</p>
                    <p className="text-white/80 italic">"{transcription}"</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <button
                    onClick={togglePlay}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? 'Pause' : t('guidedRecording.listen')}
                  </button>
                  <span className="text-sm text-white/50">{t('trackProperties.duration')} {formatTime(audioDuration)}</span>
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {timings.map((timing) => (
                    <div
                      key={timing.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                    >
                      <span className="text-xs font-mono text-aurora-400 w-20">
                        {formatTime(timing.timeRange.startTime)} - {formatTime(timing.timeRange.endTime)}
                      </span>
                      <span className="text-sm flex-1 truncate">{timing.text}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={restart}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t('guidedRecording.restart')}
                  </button>
                  <button
                    onClick={() => setPhase('confirm')}
                    className="flex-1 px-4 py-3 rounded-xl bg-aurora-500 hover:bg-aurora-600 transition-colors font-medium"
                  >
                    {t('guidedRecording.validate')}
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 6: Confirmation finale (Alerte 2) */}
            {phase === 'confirm' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-500/20 border border-amber-500/30">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-300 mb-1">{t('guidedRecording.confirmation')}</h3>
                      <p className="text-sm text-amber-200/80">
                        {hasExistingAnimations ? (
                          t('guidedRecording.confirmWithAnimations', { count: phrases.length })
                        ) : (
                          t('guidedRecording.confirmWithoutAnimations', { count: phrases.length })
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setPhase('preview')}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {t('guidedRecording.back')}
                  </button>
                  <button
                    onClick={handleValidate}
                    className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    {t('guidedRecording.apply')}
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 7: Terminé */}
            {phase === 'complete' && (
              <div className="space-y-4 text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-emerald-300">{t('guidedRecording.syncApplied')}</p>
                  <p className="text-sm text-white/50 mt-1">
                    {t('guidedRecording.phrasesSynced', { count: phrases.length })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
