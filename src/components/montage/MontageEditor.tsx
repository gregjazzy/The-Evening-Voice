'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMontageStore, type PhraseTiming, type MontageScene } from '@/store/useMontageStore'
import { useAppStore } from '@/store/useAppStore'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { TimelineRubans } from './TimelineRubans'
import { RhythmGame } from './RhythmGame'
import { KaraokePlayer } from './KaraokePlayer'
import { PreviewCanvas } from './PreviewCanvas'
import { TrackPropertiesPanel } from './TrackPropertiesPanel'
import { cn } from '@/lib/utils'
import {
  Film,
  ChevronLeft,
  ChevronRight,
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
  Video,
  Grid3X3,
  Layers,
  PanelLeftClose,
  PanelLeft
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
  const { upload, isUploading, progress } = useMediaUpload()
  
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [showRhythmGame, setShowRhythmGame] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  
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

  const handleRhythmGameComplete = (timings: PhraseTiming[]) => {
    setPhraseTimings(timings)
    setShowRhythmGame(false)
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

        {/* Interface d'enregistrement */}
        {!scene.narration.audioUrl ? (
          <div className="grid grid-cols-2 gap-3">
            {/* Enregistrer sa voix */}
            <motion.button
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl transition-all',
                isRecording
                  ? 'bg-rose-500/30 ring-2 ring-rose-500'
                  : 'bg-midnight-800/50 hover:bg-midnight-700/50'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                isRecording ? 'bg-rose-500 animate-pulse' : 'bg-aurora-500/30'
              )}>
                <Mic className={cn('w-6 h-6', isRecording ? 'text-white' : 'text-aurora-300')} />
              </div>
              {isRecording ? (
                <>
                  <span className="text-sm font-medium text-rose-300">🔴 {formatTime(recordingTime)}</span>
                  <span className="text-xs text-rose-400">Arrêter</span>
                </>
              ) : (
                <>
                  <span className="text-sm">Ma voix</span>
                  <span className="text-xs text-midnight-400">Enregistrer</span>
                </>
              )}
            </motion.button>

            {/* TTS (placeholder) */}
            <motion.button
              disabled={isRecording}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-midnight-800/50 hover:bg-midnight-700/50 disabled:opacity-50"
              whileHover={{ scale: isRecording ? 1 : 1.02 }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-dream-500/30">
                <Wand2 className="w-6 h-6 text-dream-300" />
              </div>
              <span className="text-sm">Luna raconte</span>
              <span className="text-xs text-midnight-400">TTS (bientôt)</span>
            </motion.button>
          </div>
        ) : (
          /* Lecteur audio */
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
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
              <motion.button
                onClick={() => setShowRhythmGame(true)}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-aurora-500/20 to-dream-500/20 text-aurora-300 hover:from-aurora-500/30 hover:to-dream-500/30 flex items-center justify-center gap-3"
                whileHover={{ scale: 1.01 }}
              >
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Jeu de rythme !</span>
                <span className="text-xs opacity-70">🎮</span>
              </motion.button>
            )}

            {scene.narration.isSynced && (
              <button
                onClick={() => setShowRhythmGame(true)}
                className="w-full p-2 rounded-lg text-midnight-400 hover:text-aurora-300 hover:bg-midnight-800/50 text-sm"
              >
                🔄 Resynchroniser
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal RhythmGame */}
      <RhythmGame
        isOpen={showRhythmGame}
        onClose={() => setShowRhythmGame(false)}
        onComplete={handleRhythmGameComplete}
      />
    </>
  )
}

// =============================================================================
// MEDIA PANEL - Ajout d'images/vidéos
// =============================================================================

function MediaPanel() {
  const { getCurrentScene, addMediaTrack } = useMontageStore()
  const { upload, isUploading } = useMediaUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scene = getCurrentScene()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !scene) return

    try {
      const result = await upload(file, { 
        type: file.type.startsWith('video') ? 'video' : 'image',
        source: 'upload'
      })

      if (result) {
        addMediaTrack({
          type: file.type.startsWith('video') ? 'video' : 'image',
          url: result.url,
          name: file.name,
          timeRange: {
            startTime: 0,
            endTime: scene.duration || 10,
            fadeIn: 0.5,
            fadeOut: 0.5,
          },
          position: { x: 0, y: 0, width: 100, height: 100 },
          zIndex: scene.mediaTracks.length,
          loop: file.type.startsWith('video'),
          muted: true,
        })
      }
    } catch (err) {
      console.error('Erreur upload média:', err)
    }

    e.target.value = ''
  }

  if (!scene) return null

  return (
    <div className="glass rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Image className="w-5 h-5 text-blue-400" />
          Médias
        </h3>
        <span className="text-xs text-midnight-500">{scene.mediaTracks.length} éléments</span>
      </div>

      {/* Liste des médias */}
      {scene.mediaTracks.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {scene.mediaTracks.map((media) => (
            <div
              key={media.id}
              className="aspect-square rounded-lg bg-midnight-800 overflow-hidden relative group"
            >
              {media.type === 'image' ? (
                <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
              ) : (
                <video src={media.url} className="w-full h-full object-cover" muted />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {media.type === 'video' ? <Video className="w-6 h-6 text-white" /> : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bouton ajouter */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full p-4 rounded-xl border-2 border-dashed border-midnight-700 hover:border-blue-500/50 hover:bg-blue-500/10 transition-colors flex flex-col items-center gap-2"
      >
        {isUploading ? (
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        ) : (
          <Plus className="w-6 h-6 text-blue-400" />
        )}
        <span className="text-sm text-midnight-400">
          {isUploading ? 'Upload...' : 'Ajouter image/vidéo'}
        </span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export function MontageEditor() {
  const { currentProject, currentSceneIndex, getCurrentScene, setCurrentScene, viewMode, setViewMode } = useMontageStore()
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
        <div>
          <h1 className="font-display text-2xl text-aurora-300 flex items-center gap-3">
            <Film className="w-7 h-7" />
            Montage
          </h1>
          <p className="text-midnight-300">{currentProject.title}</p>
        </div>

        <div className="flex items-center gap-4">
          <SceneSelector />
          
          {/* Toggle vue */}
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
            {/* Colonne scènes */}
            <div className="col-span-3 flex flex-col gap-2 overflow-y-auto">
              <h3 className="text-sm text-midnight-400 font-medium mb-2">Scènes</h3>
              {currentProject.scenes.map((s, index) => (
                <SceneCard
                  key={s.id}
                  scene={s}
                  index={index}
                  isActive={index === currentSceneIndex}
                  onClick={() => setCurrentScene(index)}
                />
              ))}
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

            {/* Colonne médias */}
            <div className="col-span-4 flex flex-col gap-4 overflow-y-auto">
              <MediaPanel />
            </div>
          </div>
        ) : (
          /* VUE TIMELINE */
          <div className="h-full flex flex-col gap-4">
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
            
            {/* Panneau de propriétés (quand un élément est sélectionné) */}
            <div className="absolute top-4 right-4 z-20">
              <TrackPropertiesPanel />
            </div>
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
