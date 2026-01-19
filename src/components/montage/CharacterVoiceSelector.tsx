'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Play, 
  Square,
  Check, 
  Loader2,
  Mic,
  StopCircle,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  getVoicesForLocale, 
  type ElevenLabsVoice,
} from '@/lib/ai/elevenlabs'
import { useMontageStore, type PhraseTiming } from '@/store/useMontageStore'
import { useMediaUpload } from '@/hooks/useMediaUpload'

// =============================================================================
// TYPES
// =============================================================================

interface CharacterVoiceSelectorProps {
  isOpen: boolean
  onClose: () => void
  phrase: PhraseTiming
  locale?: 'fr' | 'en' | 'ru'
}

// Samples audio pré-enregistrés
const VOICE_SAMPLES: Record<string, Record<string, string>> = {
  fr: {
    narratrice: '/sound/voices/fr/narratrice.mp3',
    jeuneFille: '/sound/voices/fr/jeuneFille.mp3',
    mamie: '/sound/voices/fr/mamie.mp3',
    jeuneGarcon: '/sound/voices/fr/jeuneGarcon.mp3',
    papy: '/sound/voices/fr/papy.mp3',
  },
  en: {
    narrator: '/sound/voices/en/narrator.mp3',
    youngGirl: '/sound/voices/en/youngGirl.mp3',
    grandma: '/sound/voices/en/grandma.mp3',
    narratorMale: '/sound/voices/en/narratorMale.mp3',
    villain: '/sound/voices/en/villain.mp3',
    grandpa: '/sound/voices/en/grandpa.mp3',
  },
  ru: {
    narrator: '/sound/voices/ru/narrator.mp3',
    youngGirl: '/sound/voices/ru/youngGirl.mp3',
    narratorMale: '/sound/voices/ru/narratorMale.mp3',
    mysterious: '/sound/voices/ru/mysterious.mp3',
  },
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export function CharacterVoiceSelector({
  isOpen,
  onClose,
  phrase,
  locale = 'fr',
}: CharacterVoiceSelectorProps) {
  const { updatePhraseVoice } = useMontageStore()
  const { upload, isUploading } = useMediaUpload()
  
  // État local
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(
    phrase.voiceId || null
  )
  
  // État enregistrement "Ma voix"
  const [isRecording, setIsRecording] = useState(false)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isPlayingRecording, setIsPlayingRecording] = useState(false)
  const [isSavingRecording, setIsSavingRecording] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  // Obtenir les voix disponibles pour la langue
  const voices = getVoicesForLocale(locale)
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (recordedAudioRef.current) {
        recordedAudioRef.current.pause()
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
      }
    }
  }, [])
  
  // Reset recording state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRecordedAudioUrl(null)
      setRecordedBlob(null)
      setRecordingTime(0)
      setIsRecording(false)
      setIsPlayingRecording(false)
    }
  }, [isOpen])
  
  // Trouver la clé d'une voix par son ID
  const getVoiceKey = (voice: ElevenLabsVoice): string | null => {
    const voicesObj = locale === 'fr' 
      ? require('@/lib/ai/elevenlabs').FRENCH_VOICES
      : locale === 'en'
      ? require('@/lib/ai/elevenlabs').ENGLISH_VOICES
      : require('@/lib/ai/elevenlabs').RUSSIAN_VOICES
    
    for (const [key, v] of Object.entries(voicesObj)) {
      if ((v as ElevenLabsVoice).id === voice.id) return key
    }
    return null
  }
  
  // Obtenir l'URL du sample
  const getSampleUrl = (voice: ElevenLabsVoice): string | null => {
    const key = getVoiceKey(voice)
    if (!key) return null
    return VOICE_SAMPLES[locale]?.[key] || null
  }
  
  // Arrêter tout audio en cours
  const stopPreview = useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current.currentTime = 0
    }
    if (recordedAudioRef.current) {
      recordedAudioRef.current.pause()
      recordedAudioRef.current.currentTime = 0
    }
    setPreviewingId(null)
    setIsPlayingRecording(false)
  }, [])
  
  // =========================================================================
  // ENREGISTREMENT "MA VOIX"
  // =========================================================================
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        setRecordedBlob(audioBlob)
        setRecordedAudioUrl(audioUrl)
        
        // Arrêter le stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Erreur accès micro:', error)
      alert('Impossible d\'accéder au microphone. Vérifie les permissions.')
    }
  }
  
  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    
    setIsRecording(false)
  }
  
  const playRecording = () => {
    if (!recordedAudioUrl) return
    
    stopPreview()
    
    const audio = new Audio(recordedAudioUrl)
    recordedAudioRef.current = audio
    
    audio.onended = () => setIsPlayingRecording(false)
    audio.onerror = () => setIsPlayingRecording(false)
    
    setIsPlayingRecording(true)
    audio.play().catch(() => setIsPlayingRecording(false))
  }
  
  const deleteRecording = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl)
    }
    setRecordedAudioUrl(null)
    setRecordedBlob(null)
    setRecordingTime(0)
  }
  
  const saveRecording = async () => {
    if (!recordedBlob) return
    
    setIsSavingRecording(true)
    
    try {
      // Upload vers Supabase
      const file = new File([recordedBlob], `phrase-${phrase.id}.webm`, { type: 'audio/webm' })
      const result = await upload(file, { type: 'audio', source: 'upload' })
      
      if (!result || !result.url) throw new Error('Échec upload')
      
      // Mettre à jour la phrase
      updatePhraseVoice(phrase.id, {
        voiceId: 'my-voice',
        voiceType: 'recorded',
        characterName: 'Ma voix',
        characterEmoji: '🎤',
        customAudioUrl: result.url,
      })
      
      onClose()
      
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      alert('Erreur lors de la sauvegarde. Réessaie.')
    } finally {
      setIsSavingRecording(false)
    }
  }
  
  // =========================================================================
  // VOIX IA (ElevenLabs)
  // =========================================================================
  
  const handlePreview = useCallback(async (voice: ElevenLabsVoice) => {
    stopPreview()
    
    if (previewingId === voice.id) return
    
    setPreviewingId(voice.id)
    
    const sampleUrl = getSampleUrl(voice)
    if (!sampleUrl) {
      setPreviewingId(null)
      return
    }
    
    try {
      const audio = new Audio(sampleUrl)
      previewAudioRef.current = audio
      
      audio.onended = () => setPreviewingId(null)
      audio.onerror = () => setPreviewingId(null)
      
      await audio.play()
    } catch (error) {
      console.error('Erreur preview:', error)
      setPreviewingId(null)
    }
  }, [previewingId, stopPreview])
  
  const handleSelectVoice = useCallback(async (voice: ElevenLabsVoice) => {
    setSelectedVoiceId(voice.id)
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/ai/voice/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: phrase.text,
          voiceId: voice.id,
          locale,
        }),
      })
      
      if (!response.ok) throw new Error('Erreur génération')
      
      const data = await response.json()
      
      updatePhraseVoice(phrase.id, {
        voiceId: voice.id,
        voiceType: 'preset',
        characterName: voice.name,
        characterEmoji: voice.emoji,
        customAudioUrl: data.audioUrl,
      })
      
      onClose()
      
    } catch (error) {
      console.error('Erreur sélection voix:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [phrase, locale, updatePhraseVoice, onClose])
  
  const handleClose = useCallback(() => {
    stopPreview()
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl)
    }
    onClose()
  }, [stopPreview, recordedAudioUrl, onClose])
  
  // Formater le temps
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  if (!isOpen) return null
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md glass rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-midnight-700/50">
            <div>
              <h2 className="text-lg font-semibold text-white">
                🎤 Choisir une voix
              </h2>
              <p className="text-sm text-midnight-400 mt-1">
                Pour : "{phrase.text.slice(0, 40)}{phrase.text.length > 40 ? '...' : ''}"
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-midnight-700/50 text-midnight-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            
            {/* =============================================== */}
            {/* SECTION: MA VOIX (enregistrement) */}
            {/* =============================================== */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-dream-300 mb-3 flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Ma voix
              </h3>
              
              <div className="bg-midnight-800/50 rounded-xl p-4 border border-midnight-700/50">
                {/* 📖 PHRASE À LIRE - toujours visible */}
                <div className="mb-4 p-3 bg-midnight-900/50 rounded-lg border border-dream-500/30">
                  <p className="text-xs text-dream-400 mb-1 flex items-center gap-1">
                    📖 Phrase à lire :
                  </p>
                  <p className="text-white text-base leading-relaxed">
                    "{phrase.text}"
                  </p>
                </div>
                
                {/* Pas encore enregistré */}
                {!recordedAudioUrl && !isRecording && (
                  <div className="text-center">
                    <p className="text-xs text-midnight-400 mb-3">
                      Lis cette phrase à voix haute !
                    </p>
                    <motion.button
                      onClick={startRecording}
                      className="px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium flex items-center justify-center gap-2 mx-auto"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Mic className="w-5 h-5" />
                      Enregistrer
                    </motion.button>
                  </div>
                )}
                
                {/* En cours d'enregistrement */}
                {isRecording && (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-lg font-mono text-white">
                        {formatTime(recordingTime)}
                      </span>
                    </div>
                    <p className="text-xs text-aurora-400 mb-3 animate-pulse">
                      🎙️ Lis la phrase ci-dessus...
                    </p>
                    <motion.button
                      onClick={stopRecording}
                      className="px-4 py-3 rounded-xl bg-red-500 text-white font-medium flex items-center justify-center gap-2 mx-auto"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <StopCircle className="w-5 h-5" />
                      Arrêter
                    </motion.button>
                  </div>
                )}
                
                {/* Enregistrement terminé */}
                {recordedAudioUrl && !isRecording && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-white">
                        ✅ Enregistrement ({formatTime(recordingTime)})
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={isPlayingRecording ? stopPreview : playRecording}
                          className={cn(
                            'p-2 rounded-lg transition-all',
                            isPlayingRecording
                              ? 'bg-aurora-500 text-white'
                              : 'bg-midnight-700/50 text-midnight-400 hover:text-white'
                          )}
                          title="Écouter"
                        >
                          {isPlayingRecording ? (
                            <Square className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={deleteRecording}
                          className="p-2 rounded-lg bg-midnight-700/50 text-red-400 hover:text-red-300"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <motion.button
                        onClick={startRecording}
                        className="flex-1 px-3 py-2 rounded-lg bg-midnight-700 text-midnight-300 text-sm flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Refaire
                      </motion.button>
                      <motion.button
                        onClick={saveRecording}
                        disabled={isSavingRecording || isUploading}
                        className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-dream-500 to-aurora-500 text-white text-sm font-medium flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isSavingRecording || isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Utiliser
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* =============================================== */}
            {/* SECTION: VOIX IA */}
            {/* =============================================== */}
            <div>
              <h3 className="text-sm font-medium text-aurora-300 mb-3">
                ✨ Voix IA
              </h3>
              
              <div className="space-y-2">
                {voices.map((voice) => {
                  const isSelected = selectedVoiceId === voice.id
                  const isPreviewing = previewingId === voice.id
                  const hasSample = !!getSampleUrl(voice)
                  
                  return (
                    <div
                      key={voice.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl transition-all',
                        isSelected
                          ? 'bg-aurora-500/20 border border-aurora-500/30'
                          : 'bg-midnight-800/50 hover:bg-midnight-700/50 border border-transparent'
                      )}
                    >
                      {/* Emoji */}
                      <span className="text-2xl">{voice.emoji}</span>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {voice.name}
                          </span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-aurora-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-midnight-400 truncate">
                          {voice.description}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {hasSample && (
                          <button
                            onClick={() => handlePreview(voice)}
                            disabled={isGenerating}
                            className={cn(
                              'p-2 rounded-lg transition-all',
                              isPreviewing
                                ? 'bg-aurora-500 text-white'
                                : 'bg-midnight-700/50 text-midnight-400 hover:text-white'
                            )}
                            title="Écouter un extrait"
                          >
                            {isPreviewing ? (
                              <Square className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleSelectVoice(voice)}
                          disabled={isGenerating}
                          className={cn(
                            'px-3 py-2 rounded-lg text-xs font-medium transition-all',
                            isSelected
                              ? 'bg-aurora-500 text-white'
                              : 'bg-midnight-700 text-midnight-300 hover:bg-midnight-600'
                          )}
                        >
                          {isGenerating && selectedVoiceId === voice.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isSelected ? (
                            'Sélectionné'
                          ) : (
                            'Choisir'
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-midnight-700/50">
            <p className="text-[10px] text-midnight-500 text-center">
              🎤 Ma voix ou ✨ Voix IA premium ElevenLabs
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default CharacterVoiceSelector
