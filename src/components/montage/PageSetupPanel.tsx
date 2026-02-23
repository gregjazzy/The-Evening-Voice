'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMontageStore } from '@/store/useMontageStore'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { MediaPicker } from '@/components/editor/MediaPicker'
import { SoundPicker } from './SoundPicker'
import { getVoicesForLocale, type ElevenLabsVoice } from '@/lib/ai/elevenlabs'
import { useTranslations, useLocale } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import {
  Mic,
  Play,
  Pause,
  Trash2,
  Loader2,
  Music,
  Volume2,
  Plus,
  X,
  Square,
  Clock,
  ImagePlus,
  RefreshCw,
  Image,
  Video,
  Gauge,
  Sparkles,
  ChevronDown,
  Type,
} from 'lucide-react'
import type { MediaType } from '@/store/useMontageStore'
import type { Sound } from '@/lib/sounds'

// ─── Detect supported audio format ───
function getSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/wav'
  const formats = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/wav']
  for (const format of formats) {
    if (MediaRecorder.isTypeSupported(format)) return format
  }
  return ''
}

export function PageSetupPanel() {
  const {
    currentProject,
    getCurrentScene,
    setNarrationAudio,
    clearNarrationAudio,
    addMusicTrack,
    deleteMusicTrack,
    addSoundTrack,
    deleteSoundTrack,
    updateCurrentScene,
    addMediaTrack,
    updateMediaTrack,
    deleteMediaTrack,
    updateNarrationVolume,
    applyMusicToScenes,
  } = useMontageStore()

  const { upload, isUploading, progress } = useMediaUpload()
  const t = useTranslations('layout')
  const locale = useLocale()
  const scene = getCurrentScene()

  // ═══════════════════════════════════════
  // MÉDIA (image / vidéo) — via MediaPicker
  // ═══════════════════════════════════════
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const currentMedia = scene?.mediaTracks?.[0]

  const handleMediaSelect = (url: string, type: 'image' | 'video' | 'audio') => {
    if (type === 'audio') return // on ne gère que image/vidéo ici
    const mediaType = type as MediaType
    if (currentMedia) {
      updateMediaTrack(currentMedia.id, { url, type: mediaType, name: url.split('/').pop() || 'Média' })
    } else {
      addMediaTrack({
        type: mediaType,
        url,
        name: url.split('/').pop() || 'Média',
        timeRange: { startTime: 0, endTime: 10 },
        position: { x: 0, y: 0, width: 100, height: 100 },
        zIndex: 1,
        opacity: 1,
      })
    }
    setShowMediaPicker(false)
  }

  // ═══════════════════════════════════════
  // NARRATION
  // ═══════════════════════════════════════
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')

  // ElevenLabs TTS
  const [showVoicePicker, setShowVoicePicker] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<ElevenLabsVoice | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null)
  const [voicePreviewVolume, setVoicePreviewVolume] = useState(80)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  const voices = getVoicesForLocale(locale)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Pre-init microphone
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }
    }).then(stream => {
      streamRef.current = stream
    }).catch(() => {})
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
      audioRef.current?.pause()
      previewAudioRef.current?.pause()
    }
  }, [])

  // Reset upload status
  useEffect(() => {
    if (uploadStatus === 'success' || uploadStatus === 'error') {
      const t = setTimeout(() => setUploadStatus('idle'), 3000)
      return () => clearTimeout(t)
    }
  }, [uploadStatus])

  // Reset audio player when scene changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setIsPlaying(false)
    }
  }, [scene?.id])

  const startRecording = async () => {
    setPermissionDenied(false)
    try {
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

      mediaRecorderRef.current.onstop = async () => {
        const mime = mediaRecorderRef.current?.mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: mime })
        if (audioBlob.size === 0) return

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
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000)
    } catch {
      setPermissionDenied(true)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRecording(false)
  }

  const playRecording = async () => {
    if (!scene?.narration?.audioUrl) return
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
    audioRef.current?.pause()
    audioRef.current = null
    clearNarrationAudio()
    setIsPlaying(false)
  }

  // ─── ElevenLabs : écouter un extrait de voix ───
  const previewVoice = (voice: ElevenLabsVoice) => {
    // Arrêter la preview en cours
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }
    if (previewingVoiceId === voice.id) {
      setPreviewingVoiceId(null)
      return
    }
    const audio = new Audio(voice.sampleUrl)
    audio.volume = voicePreviewVolume / 100
    audio.onended = () => setPreviewingVoiceId(null)
    previewAudioRef.current = audio
    setPreviewingVoiceId(voice.id)
    audio.play().catch(() => setPreviewingVoiceId(null))
  }

  // ─── ElevenLabs : générer la narration ───
  const generateNarration = async (voice: ElevenLabsVoice) => {
    if (!scene?.text) {
      setGenerateError(t('montageEditor.pageSetup.narration.noText'))
      return
    }
    setIsGenerating(true)
    setGenerateError(null)
    try {
      const res = await fetch('/api/ai/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scene.text, voiceId: voice.id }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur' }))
        throw new Error(err.error || 'Erreur génération')
      }
      const audioBlob = await res.blob()
      // Upload vers Supabase/R2
      setUploadStatus('uploading')
      try {
        const result = await upload(audioBlob, { type: 'audio', source: 'upload' })
        if (result) {
          // Obtenir la durée
          const tempAudio = new Audio(result.url)
          tempAudio.onloadedmetadata = () => {
            setNarrationAudio(result.url, 'tts', tempAudio.duration)
            setUploadStatus('success')
          }
          // Fallback si onloadedmetadata ne fire pas
          tempAudio.onerror = () => {
            setNarrationAudio(result.url, 'tts', 10)
            setUploadStatus('success')
          }
        }
      } catch {
        // Fallback local blob URL
        const blobUrl = URL.createObjectURL(audioBlob)
        const tempAudio = new Audio(blobUrl)
        tempAudio.onloadedmetadata = () => {
          setNarrationAudio(blobUrl, 'tts', tempAudio.duration)
        }
        setUploadStatus('error')
      }
      setShowVoicePicker(false)
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setIsGenerating(false)
    }
  }

  // ═══════════════════════════════════════
  // MUSIQUE
  // ═══════════════════════════════════════
  const [showMusicPicker, setShowMusicPicker] = useState(false)
  const musicTrack = scene?.musicTracks?.[0]

  const handleAddMusic = (sound: Sound) => {
    // Supprimer l'ancienne musique si présente
    if (musicTrack) deleteMusicTrack(musicTrack.id)
    addMusicTrack({
      url: sound.file,
      name: sound.name,
      type: 'background',
      timeRange: { startTime: 0, endTime: 9999 },
      volume: 0.3,
      loop: true,
      fadeIn: 1,
      fadeOut: 1,
    })
    setShowMusicPicker(false)
  }

  const handleMusicVolumeChange = (vol: number) => {
    if (!musicTrack || !scene) return
    updateCurrentScene({
      musicTracks: scene.musicTracks.map(t =>
        t.id === musicTrack.id ? { ...t, volume: vol / 100 } : t
      )
    })
  }

  // ═══════════════════════════════════════
  // EFFETS SONORES
  // ═══════════════════════════════════════
  const [showSoundPicker, setShowSoundPicker] = useState(false)
  const soundTracks = scene?.soundTracks || []
  const maxSounds = 3

  const handleAddSound = (sound: Sound) => {
    addSoundTrack({
      url: sound.file,
      name: sound.name,
      type: 'sfx',
      timeRange: { startTime: 0, endTime: 3 },
      volume: 0.7,
      loop: false,
    })
    setShowSoundPicker(false)
  }

  const handleSoundTimeChange = (soundId: string, field: 'startTime' | 'endTime', value: number) => {
    if (!scene) return
    updateCurrentScene({
      soundTracks: scene.soundTracks.map(s =>
        s.id === soundId
          ? { ...s, timeRange: { ...s.timeRange, [field]: Math.max(0, value) } }
          : s
      )
    })
  }

  const handleSoundVolumeChange = (soundId: string, vol: number) => {
    if (!scene) return
    updateCurrentScene({
      soundTracks: scene.soundTracks.map(s =>
        s.id === soundId ? { ...s, volume: vol / 100 } : s
      )
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!scene) return null

  // ─── Mise à jour du texte (avec recalcul des phrases) ───
  const handleTextChange = (newText: string) => {
    const phrases = newText.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()).filter(s => s.length > 0) || (newText.trim() ? [newText.trim()] : [])
    updateCurrentScene({ text: newText, phrases })
  }

  return (
    <div className="space-y-3">
      {/* ═══ SECTION TEXTE ═══ */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <Type className="w-4 h-4 text-amber-400" />
          {t('montageEditor.pageSetup.text.title')}
        </h3>
        <textarea
          value={scene.text || ''}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={t('montageEditor.pageSetup.text.placeholder')}
          rows={3}
          className="w-full px-3 py-2 rounded-xl bg-midnight-800/50 text-sm text-white/90 leading-relaxed border border-midnight-700 focus:border-aurora-500 outline-none resize-none placeholder:text-midnight-500"
        />
      </div>

      {/* ═══ SECTION MÉDIA ═══ */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <ImagePlus className="w-4 h-4 text-sky-400" />
          {t('montageEditor.pageSetup.media.title')}
        </h3>

        {currentMedia ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-sky-500/10 border border-sky-500/30">
              {currentMedia.type === 'video' ? (
                <Video className="w-4 h-4 text-sky-400 shrink-0" />
              ) : (
                <Image className="w-4 h-4 text-sky-400 shrink-0" />
              )}
              <span className="text-sm text-sky-300 flex-1 truncate">{currentMedia.name || 'Média'}</span>
              <button
                onClick={() => setShowMediaPicker(true)}
                className="p-1.5 rounded-lg text-sky-400 hover:bg-sky-500/20"
                title={t('montageEditor.pageSetup.media.replace')}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => deleteMediaTrack(currentMedia.id)}
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20"
                title={t('montageEditor.pageSetup.media.delete')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Vitesse de lecture — uniquement pour les vidéos */}
            {currentMedia.type === 'video' && (
              <div className="flex items-center gap-3 px-1">
                <Gauge className="w-4 h-4 text-sky-400 shrink-0" />
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={Math.round((currentMedia.playbackRate ?? 1) * 100)}
                  onChange={(e) => {
                    const rate = parseInt(e.target.value) / 100
                    updateMediaTrack(currentMedia.id, { playbackRate: rate })
                  }}
                  className="flex-1"
                />
                <span className="text-xs text-sky-300 w-10 text-right font-mono">
                  {((currentMedia.playbackRate ?? 1) * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowMediaPicker(true)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-midnight-800/50 text-midnight-300 hover:text-white hover:bg-midnight-700/50 transition-colors border border-dashed border-midnight-600"
          >
            <ImagePlus className="w-4 h-4" />
            <span className="text-sm">{t('montageEditor.pageSetup.media.choose')}</span>
          </button>
        )}
      </div>

      {/* MediaPicker modal */}
      <MediaPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
        allowedTypes="all"
        storyId={currentProject?.storyId}
      />

      {/* ═══ SECTION NARRATION ═══ */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <Mic className="w-4 h-4 text-aurora-400" />
          {t('montageEditor.pageSetup.narration.title')}
        </h3>

        {permissionDenied && (
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300 text-xs">
            {t('montageEditor.pageSetup.narration.micPermission')}
          </div>
        )}
        {uploadStatus === 'uploading' && (
          <div className="p-2 rounded-lg bg-aurora-500/20 text-aurora-300 text-xs flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            {t('montageEditor.pageSetup.narration.uploading')} {progress > 0 && `${progress}%`}
          </div>
        )}

        {!scene.narration?.audioUrl ? (
          /* Pas encore de narration — 2 options */
          <div className="space-y-2">
            {/* Option 1 : Enregistrer sa voix */}
            <motion.button
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                'w-full flex items-center justify-center gap-3 p-3 rounded-xl transition-all',
                isRecording
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse'
                  : 'bg-aurora-500/10 text-aurora-300 border border-aurora-500/30 hover:bg-aurora-500/20'
              )}
              whileTap={{ scale: 0.97 }}
            >
              {isRecording ? (
                <>
                  <Square className="w-5 h-5" />
                  <span>{t('montageEditor.pageSetup.narration.stop', { time: formatTime(recordingTime) })}</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span>{t('montageEditor.pageSetup.narration.record')}</span>
                </>
              )}
            </motion.button>

            {/* Téléprompteur — visible uniquement pendant l'enregistrement */}
            <AnimatePresence>
              {isRecording && scene.text && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 rounded-xl bg-midnight-900/80 border border-rose-500/20 max-h-40 overflow-y-auto">
                    <p className="text-sm text-white/90 leading-relaxed">{scene.text}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Option 2 : Générer avec une voix ElevenLabs */}
            {!isRecording && (
              <>
                <button
                  onClick={() => setShowVoicePicker(!showVoicePicker)}
                  disabled={!scene.text}
                  className={cn(
                    'w-full flex items-center justify-center gap-3 p-3 rounded-xl transition-all border',
                    !scene.text
                      ? 'bg-midnight-800/30 text-midnight-600 border-midnight-700 cursor-not-allowed'
                      : showVoicePicker
                      ? 'bg-violet-500/20 text-violet-300 border-violet-500/50'
                      : 'bg-violet-500/10 text-violet-300 border-violet-500/30 hover:bg-violet-500/20'
                  )}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>{t('montageEditor.pageSetup.narration.chooseVoice')}</span>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', showVoicePicker && 'rotate-180')} />
                </button>

                {/* Voice picker panel */}
                <AnimatePresence>
                  {showVoicePicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1.5 pt-1">
                        {generateError && (
                          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300 text-xs">
                            {generateError}
                          </div>
                        )}

                        {/* Volume preview */}
                        <div className="flex items-center gap-2 px-1 pb-1">
                          <Volume2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={voicePreviewVolume}
                            onChange={(e) => {
                              const vol = parseInt(e.target.value)
                              setVoicePreviewVolume(vol)
                              if (previewAudioRef.current) previewAudioRef.current.volume = vol / 100
                            }}
                            className="flex-1"
                          />
                          <span className="text-[10px] text-midnight-400 w-7 text-right">{voicePreviewVolume}%</span>
                        </div>

                        {voices.map((voice) => (
                          <div
                            key={voice.id}
                            className={cn(
                              'flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer border',
                              selectedVoice?.id === voice.id
                                ? 'bg-violet-500/20 border-violet-500/40'
                                : 'bg-midnight-800/30 border-transparent hover:bg-midnight-800/50'
                            )}
                            onClick={() => setSelectedVoice(voice)}
                          >
                            <span className="text-lg shrink-0">{voice.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{voice.name}</p>
                              <p className="text-[10px] text-midnight-400 truncate">{voice.description}</p>
                            </div>
                            {/* Bouton écouter */}
                            <button
                              onClick={(e) => { e.stopPropagation(); previewVoice(voice) }}
                              className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors',
                                previewingVoiceId === voice.id
                                  ? 'bg-violet-500 text-white'
                                  : 'bg-midnight-700 text-midnight-300 hover:text-white'
                              )}
                            >
                              {previewingVoiceId === voice.id
                                ? <Pause className="w-3 h-3" />
                                : <Play className="w-3 h-3 ml-0.5" />
                              }
                            </button>
                          </div>
                        ))}

                        {/* Bouton générer */}
                        <button
                          onClick={() => selectedVoice && generateNarration(selectedVoice)}
                          disabled={!selectedVoice || isGenerating}
                          className={cn(
                            'w-full flex items-center justify-center gap-2 p-3 rounded-xl transition-all mt-2',
                            !selectedVoice
                              ? 'bg-midnight-800/30 text-midnight-600 cursor-not-allowed'
                              : 'bg-violet-500 text-white hover:bg-violet-600'
                          )}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>{t('montageEditor.pageSetup.narration.generating')}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>
                                {selectedVoice
                                  ? t('montageEditor.pageSetup.narration.generateWith', { name: selectedVoice.name })
                                  : t('montageEditor.pageSetup.narration.chooseFirst')
                                }
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        ) : (
          /* Narration existante */
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <button
                onClick={playRecording}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors',
                  isPlaying ? 'bg-emerald-500 text-white' : 'bg-emerald-500/30 text-emerald-300'
                )}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div className="flex-1">
                <p className="text-sm text-emerald-300 font-medium">
                  {scene.narration.source === 'tts' ? t('montageEditor.pageSetup.narration.sourceGenerated') : t('montageEditor.pageSetup.narration.sourceRecorded')}
                </p>
                <p className="text-xs text-midnight-400">{scene.narration.duration.toFixed(1)}s</p>
              </div>
              <button onClick={deleteRecording} className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/20">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {/* Volume narration */}
            <div className="flex items-center gap-3 px-1">
              <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round((scene.narration.volume ?? 1) * 100)}
                onChange={(e) => updateNarrationVolume(parseInt(e.target.value) / 100)}
                className="flex-1"
              />
              <span className="text-xs text-midnight-400 w-8 text-right">
                {Math.round((scene.narration.volume ?? 1) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ═══ DURÉE D'AFFICHAGE (pages sans narration uniquement) ═══ */}
      {!scene.narration?.audioUrl && (
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-midnight-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-midnight-300">{t('montageEditor.pageSetup.duration.label')}</p>
              <p className="text-[10px] text-midnight-500">{t('montageEditor.pageSetup.duration.sublabel')}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="60"
                step="1"
                value={scene.displayDuration || 5}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(60, parseInt(e.target.value) || 5))
                  updateCurrentScene({ displayDuration: val })
                }}
                className="w-14 px-2 py-1 rounded-lg bg-midnight-800/80 text-sm text-center border border-midnight-700 focus:border-aurora-500 outline-none"
              />
              <span className="text-xs text-midnight-500">{t('montageEditor.pageSetup.duration.unit')}</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SECTION MUSIQUE ═══ */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <Music className="w-4 h-4 text-dream-400" />
          {t('montageEditor.pageSetup.music.title')}
        </h3>

        {musicTrack ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-dream-500/10 border border-dream-500/30">
              <div className="flex-1">
                <p className="text-sm text-dream-300 font-medium">{musicTrack.name || 'Musique'}</p>
              </div>
              <button
                onClick={() => deleteMusicTrack(musicTrack.id)}
                className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/20"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {/* Volume slider */}
            <div className="flex items-center gap-3 px-1">
              <Volume2 className="w-4 h-4 text-midnight-400 shrink-0" />
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round((musicTrack.volume ?? 0.3) * 100)}
                onChange={(e) => handleMusicVolumeChange(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-midnight-400 w-8 text-right">
                {Math.round((musicTrack.volume ?? 0.3) * 100)}%
              </span>
            </div>
            {/* Appliquer à d'autres pages */}
            <div className="flex gap-2">
              <button
                onClick={() => applyMusicToScenes('fromHere')}
                className="flex-1 text-xs text-dream-400 hover:text-dream-300 py-1.5 rounded-lg hover:bg-dream-500/10 transition-colors border border-dream-500/20"
              >
                {t('montageEditor.pageSetup.music.applyFromHere')}
              </button>
              <button
                onClick={() => applyMusicToScenes('all')}
                className="flex-1 text-xs text-dream-400 hover:text-dream-300 py-1.5 rounded-lg hover:bg-dream-500/10 transition-colors border border-dream-500/20"
              >
                {t('montageEditor.pageSetup.music.applyAll')}
              </button>
            </div>
          </div>
        ) : (
          <>
            {!showMusicPicker ? (
              <button
                onClick={() => setShowMusicPicker(true)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-midnight-800/50 text-midnight-300 hover:text-white hover:bg-midnight-700/50 transition-colors border border-dashed border-midnight-600"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">{t('montageEditor.pageSetup.music.add')}</span>
              </button>
            ) : null}
          </>
        )}

        <AnimatePresence>
          {showMusicPicker && (
            <SoundPicker
              type="music"
              onSelect={handleAddMusic}
              onClose={() => setShowMusicPicker(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ═══ SECTION EFFETS SONORES ═══ */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-pink-400" />
            {t('montageEditor.pageSetup.effects.title')}
          </h3>
          <span className="text-xs text-midnight-500">{soundTracks.length}/{maxSounds}</span>
        </div>

        {/* Liste des effets */}
        {soundTracks.map((sound) => (
          <div key={sound.id} className="p-3 rounded-xl bg-pink-500/5 border border-pink-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm flex-1 truncate">{sound.name || 'Effet'}</span>
              <button
                onClick={() => deleteSoundTrack(sound.id)}
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Timing */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-midnight-500 uppercase">{t('montageEditor.pageSetup.effects.start')}</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={sound.timeRange.startTime}
                  onChange={(e) => handleSoundTimeChange(sound.id, 'startTime', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 rounded-lg bg-midnight-800/80 text-sm border border-midnight-700 focus:border-aurora-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-midnight-500 uppercase">{t('montageEditor.pageSetup.effects.end')}</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={sound.timeRange.endTime}
                  onChange={(e) => handleSoundTimeChange(sound.id, 'endTime', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 rounded-lg bg-midnight-800/80 text-sm border border-midnight-700 focus:border-aurora-500 outline-none"
                />
              </div>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Volume2 className="w-3 h-3 text-midnight-500 shrink-0" />
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round((sound.volume ?? 0.7) * 100)}
                onChange={(e) => handleSoundVolumeChange(sound.id, parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-[10px] text-midnight-400 w-7 text-right">
                {Math.round((sound.volume ?? 0.7) * 100)}%
              </span>
            </div>
          </div>
        ))}

        {/* Bouton ajouter */}
        {soundTracks.length < maxSounds && (
          <>
            {!showSoundPicker ? (
              <button
                onClick={() => setShowSoundPicker(true)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-midnight-800/50 text-midnight-300 hover:text-white hover:bg-midnight-700/50 transition-colors border border-dashed border-midnight-600"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">{t('montageEditor.pageSetup.effects.add')}</span>
              </button>
            ) : null}
          </>
        )}

        <AnimatePresence>
          {showSoundPicker && (
            <SoundPicker
              type="effect"
              onSelect={handleAddSound}
              onClose={() => setShowSoundPicker(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
