'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  useLayoutStore, 
  type MediaLayer, 
  type OpacityKeyframe,
  type VideoEffects 
} from '@/store/useLayoutStore'
import { cn } from '@/lib/utils'
import {
  Video,
  Upload,
  Trash2,
  Play,
  Pause,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Move,
  Settings,
  Volume2,
  VolumeX,
  Repeat,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react'

// Presets de fade
const FADE_PRESETS = [
  { 
    id: 'fade-in', 
    name: 'Fondu entrant', 
    icon: '↗️',
    keyframes: [
      { time: 0, value: 0, easing: 'ease-out' as const },
      { time: 1, value: 1, easing: 'linear' as const },
    ]
  },
  { 
    id: 'fade-out', 
    name: 'Fondu sortant', 
    icon: '↘️',
    keyframes: (duration: number) => [
      { time: 0, value: 1, easing: 'linear' as const },
      { time: duration - 1, value: 1, easing: 'ease-in' as const },
      { time: duration, value: 0, easing: 'linear' as const },
    ]
  },
  { 
    id: 'fade-in-out', 
    name: 'Fondu entrant/sortant', 
    icon: '↔️',
    keyframes: (duration: number) => [
      { time: 0, value: 0, easing: 'ease-out' as const },
      { time: 1, value: 1, easing: 'linear' as const },
      { time: duration - 1, value: 1, easing: 'ease-in' as const },
      { time: duration, value: 0, easing: 'linear' as const },
    ]
  },
  { 
    id: 'pulse', 
    name: 'Pulsation', 
    icon: '💫',
    keyframes: (duration: number) => {
      const keyframes: OpacityKeyframe[] = []
      for (let t = 0; t <= duration; t += 2) {
        keyframes.push({ time: t, value: 1, easing: 'ease-in-out' as const })
        if (t + 1 <= duration) {
          keyframes.push({ time: t + 1, value: 0.5, easing: 'ease-in-out' as const })
        }
      }
      return keyframes
    }
  },
]

interface OpacityTimelineProps {
  layer: MediaLayer
  onAddKeyframe: (keyframe: OpacityKeyframe) => void
  onUpdateKeyframe: (index: number, updates: Partial<OpacityKeyframe>) => void
  onDeleteKeyframe: (index: number) => void
}

// Mini-timeline pour les keyframes d'opacité
function OpacityTimeline({ layer, onAddKeyframe, onUpdateKeyframe, onDeleteKeyframe }: OpacityTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [selectedKeyframe, setSelectedKeyframe] = useState<number | null>(null)
  
  const duration = layer.duration || 10 // Durée par défaut 10s
  const keyframes = layer.videoEffects?.opacityKeyframes || []
  
  // Convertir position X en temps
  const positionToTime = useCallback((clientX: number) => {
    if (!timelineRef.current) return 0
    const rect = timelineRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    return (x / rect.width) * duration
  }, [duration])
  
  // Convertir temps en position X (%)
  const timeToPosition = useCallback((time: number) => {
    return (time / duration) * 100
  }, [duration])
  
  // Ajouter un keyframe au clic sur la timeline
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (draggingIndex !== null) return
    
    const time = positionToTime(e.clientX)
    // Vérifier qu'il n'y a pas déjà un keyframe proche
    const existingNearby = keyframes.find(kf => Math.abs(kf.time - time) < 0.5)
    if (!existingNearby) {
      onAddKeyframe({ time, value: 1, easing: 'linear' })
    }
  }
  
  // Drag d'un keyframe
  const handleKeyframeDrag = useCallback((e: MouseEvent) => {
    if (draggingIndex === null) return
    const newTime = Math.max(0, Math.min(positionToTime(e.clientX), duration))
    onUpdateKeyframe(draggingIndex, { time: newTime })
  }, [draggingIndex, positionToTime, duration, onUpdateKeyframe])
  
  const handleKeyframeDragEnd = useCallback(() => {
    setDraggingIndex(null)
    document.removeEventListener('mousemove', handleKeyframeDrag)
    document.removeEventListener('mouseup', handleKeyframeDragEnd)
  }, [handleKeyframeDrag])
  
  const startKeyframeDrag = (index: number) => (e: React.MouseEvent) => {
    e.stopPropagation()
    setDraggingIndex(index)
    setSelectedKeyframe(index)
    document.addEventListener('mousemove', handleKeyframeDrag)
    document.addEventListener('mouseup', handleKeyframeDragEnd)
  }
  
  // Cleanup
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleKeyframeDrag)
      document.removeEventListener('mouseup', handleKeyframeDragEnd)
    }
  }, [handleKeyframeDrag, handleKeyframeDragEnd])
  
  // Générer le chemin SVG pour la courbe d'opacité
  const generateOpacityCurve = () => {
    if (keyframes.length === 0) return `M 0 50 L 100 50` // Ligne plate à 100% d'opacité
    
    const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time)
    const points: string[] = []
    
    // Point de départ
    if (sortedKeyframes[0].time > 0) {
      points.push(`M 0 ${100 - (sortedKeyframes[0].value * 100)}`)
      points.push(`L ${timeToPosition(sortedKeyframes[0].time)} ${100 - (sortedKeyframes[0].value * 100)}`)
    } else {
      points.push(`M 0 ${100 - (sortedKeyframes[0].value * 100)}`)
    }
    
    // Points intermédiaires
    for (let i = 1; i < sortedKeyframes.length; i++) {
      const kf = sortedKeyframes[i]
      points.push(`L ${timeToPosition(kf.time)} ${100 - (kf.value * 100)}`)
    }
    
    // Point final
    const lastKf = sortedKeyframes[sortedKeyframes.length - 1]
    if (lastKf.time < duration) {
      points.push(`L 100 ${100 - (lastKf.value * 100)}`)
    }
    
    return points.join(' ')
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-midnight-400">
        <span>0s</span>
        <span className="text-aurora-400">Clique pour ajouter un point</span>
        <span>{duration.toFixed(1)}s</span>
      </div>
      
      {/* Timeline */}
      <div
        ref={timelineRef}
        className="relative h-24 bg-midnight-900/80 rounded-lg cursor-crosshair overflow-hidden border border-midnight-700"
        onClick={handleTimelineClick}
      >
        {/* Grille de fond */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '10% 25%',
          }}
        />
        
        {/* Axe Y labels */}
        <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-between text-[8px] text-midnight-500 py-1">
          <span>100%</span>
          <span>50%</span>
          <span>0%</span>
        </div>
        
        {/* Courbe d'opacité */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Zone sous la courbe */}
          <path
            d={`${generateOpacityCurve()} L 100 100 L 0 100 Z`}
            fill="url(#opacityGradient)"
            opacity={0.3}
          />
          {/* Courbe elle-même */}
          <path
            d={generateOpacityCurve()}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth={2}
          />
          {/* Gradients */}
          <defs>
            <linearGradient id="opacityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E979F9" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#E979F9" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E979F9" />
              <stop offset="100%" stopColor="#6366AA" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Keyframes */}
        {keyframes.map((kf, index) => (
          <motion.div
            key={index}
            className={cn(
              'absolute w-4 h-4 -translate-x-1/2 cursor-grab active:cursor-grabbing z-10',
              selectedKeyframe === index ? 'z-20' : ''
            )}
            style={{
              left: `${timeToPosition(kf.time)}%`,
              top: `${100 - (kf.value * 100)}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onMouseDown={startKeyframeDrag(index)}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedKeyframe(index)
            }}
            whileHover={{ scale: 1.3 }}
          >
            <div className={cn(
              'w-full h-full rounded-full border-2 shadow-lg',
              selectedKeyframe === index 
                ? 'bg-aurora-400 border-white shadow-aurora-500/50' 
                : 'bg-dream-500 border-dream-300 shadow-dream-500/30'
            )} />
          </motion.div>
        ))}
      </div>
      
      {/* Contrôles du keyframe sélectionné */}
      <AnimatePresence>
        {selectedKeyframe !== null && keyframes[selectedKeyframe] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-midnight-400">Point #{selectedKeyframe + 1}</span>
              <button
                onClick={() => {
                  onDeleteKeyframe(selectedKeyframe)
                  setSelectedKeyframe(null)
                }}
                className="p-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Temps */}
              <div>
                <label className="text-[10px] text-midnight-500 uppercase">Temps</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    max={duration}
                    value={keyframes[selectedKeyframe].time.toFixed(1)}
                    onChange={(e) => onUpdateKeyframe(selectedKeyframe, { time: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded bg-midnight-800 text-sm text-center"
                  />
                  <span className="text-xs text-midnight-500">s</span>
                </div>
              </div>
              
              {/* Opacité */}
              <div>
                <label className="text-[10px] text-midnight-500 uppercase">Opacité</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step={5}
                    min={0}
                    max={100}
                    value={Math.round(keyframes[selectedKeyframe].value * 100)}
                    onChange={(e) => onUpdateKeyframe(selectedKeyframe, { value: (parseFloat(e.target.value) || 0) / 100 })}
                    className="w-full px-2 py-1 rounded bg-midnight-800 text-sm text-center"
                  />
                  <span className="text-xs text-midnight-500">%</span>
                </div>
              </div>
            </div>
            
            {/* Easing */}
            <div>
              <label className="text-[10px] text-midnight-500 uppercase">Transition</label>
              <div className="flex gap-1 mt-1">
                {(['linear', 'ease-in', 'ease-out', 'ease-in-out'] as const).map((easing) => (
                  <button
                    key={easing}
                    onClick={() => onUpdateKeyframe(selectedKeyframe, { easing })}
                    className={cn(
                      'flex-1 py-1 rounded text-[10px] transition-colors',
                      keyframes[selectedKeyframe].easing === easing
                        ? 'bg-aurora-500/30 text-aurora-300'
                        : 'bg-midnight-800 text-midnight-400 hover:text-white'
                    )}
                  >
                    {easing.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Panneau principal des effets vidéo
export function VideoEffectsPanel() {
  const {
    currentPage,
    selectedElement,
    addMediaLayer,
    updateMediaLayer,
    deleteMediaLayer,
    addOpacityKeyframe,
    updateOpacityKeyframe,
    deleteOpacityKeyframe,
    setVideoEffects,
    setSelectedElement,
  } = useLayoutStore()
  
  const [expandedLayerId, setExpandedLayerId] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  
  if (!currentPage) return null
  
  const videoLayers = currentPage.mediaLayers.filter(l => l.type === 'video')
  const selectedLayer = videoLayers.find(l => l.id === selectedElement)
  
  // Upload vidéo
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const url = URL.createObjectURL(file)
    
    // Obtenir la durée de la vidéo
    const video = document.createElement('video')
    video.src = url
    video.onloadedmetadata = () => {
      addMediaLayer('video', url, file.name, video.duration)
    }
    video.onerror = () => {
      // Fallback si on ne peut pas lire les métadonnées
      addMediaLayer('video', url, file.name, 10)
    }
    
    // Reset input
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
  }
  
  // Appliquer un preset
  const applyPreset = (layer: MediaLayer, presetId: string) => {
    const preset = FADE_PRESETS.find(p => p.id === presetId)
    if (!preset) return
    
    const duration = layer.duration || 10
    const keyframes = typeof preset.keyframes === 'function' 
      ? preset.keyframes(duration)
      : preset.keyframes
    
    setVideoEffects(layer.id, { opacityKeyframes: keyframes })
  }
  
  return (
    <div className="space-y-4">
      {/* Bouton d'ajout de vidéo */}
      <div>
        <label className="block cursor-pointer">
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoUpload}
          />
          <div className="p-4 rounded-xl border-2 border-dashed border-midnight-600 hover:border-dream-500/50 hover:bg-dream-500/5 transition-all text-center">
            <Video className="w-8 h-8 mx-auto mb-2 text-dream-400" />
            <p className="text-sm text-midnight-300">Ajouter une vidéo</p>
            <p className="text-xs text-midnight-500 mt-1">Glisser ou cliquer</p>
          </div>
        </label>
      </div>
      
      {/* Liste des vidéos */}
      {videoLayers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs text-midnight-400 uppercase tracking-wider">
            Vidéos ({videoLayers.length})
          </h3>
          
          {videoLayers.map((layer) => {
            const isExpanded = expandedLayerId === layer.id
            const isSelected = selectedElement === layer.id
            
            return (
              <motion.div
                key={layer.id}
                className={cn(
                  'glass rounded-xl overflow-hidden transition-all',
                  isSelected && 'ring-2 ring-aurora-500'
                )}
                layout
              >
                {/* Header */}
                <div 
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-midnight-800/30"
                  onClick={() => setSelectedElement(layer.id)}
                >
                  {/* Miniature */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-midnight-900 flex-shrink-0">
                    <video
                      src={layer.url}
                      className="w-full h-full object-cover"
                      muted
                    />
                  </div>
                  
                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {layer.name || 'Vidéo'}
                    </p>
                    <p className="text-xs text-midnight-400">
                      {layer.duration ? `${layer.duration.toFixed(1)}s` : 'Durée inconnue'}
                      {layer.videoEffects?.opacityKeyframes?.length 
                        ? ` • ${layer.videoEffects.opacityKeyframes.length} keyframes`
                        : ''}
                    </p>
                  </div>
                  
                  {/* Actions rapides */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedLayerId(isExpanded ? null : layer.id)
                      }}
                      className="p-2 rounded-lg hover:bg-midnight-700/50"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteMediaLayer(layer.id)
                      }}
                      className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Panel étendu */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-midnight-700/50"
                    >
                      <div className="p-4 space-y-4">
                        {/* Opacité de base */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-midnight-400 uppercase flex items-center gap-2">
                              <Eye className="w-3 h-3" />
                              Opacité de base
                            </label>
                            <span className="text-xs text-aurora-400">
                              {Math.round(layer.opacity * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={layer.opacity * 100}
                            onChange={(e) => updateMediaLayer(layer.id, { opacity: parseInt(e.target.value) / 100 })}
                            className="w-full accent-aurora-500"
                          />
                        </div>
                        
                        {/* Options vidéo */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setVideoEffects(layer.id, { loop: !layer.videoEffects?.loop })}
                            className={cn(
                              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs transition-colors',
                              layer.videoEffects?.loop
                                ? 'bg-dream-500/30 text-dream-300'
                                : 'bg-midnight-800/50 text-midnight-400'
                            )}
                          >
                            <Repeat className="w-3 h-3" />
                            Boucle
                          </button>
                          <button
                            onClick={() => setVideoEffects(layer.id, { muted: !layer.videoEffects?.muted })}
                            className={cn(
                              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs transition-colors',
                              layer.videoEffects?.muted
                                ? 'bg-midnight-800/50 text-midnight-400'
                                : 'bg-aurora-500/30 text-aurora-300'
                            )}
                          >
                            {layer.videoEffects?.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                            Son
                          </button>
                        </div>
                        
                        {/* Presets de fade */}
                        <div>
                          <label className="text-xs text-midnight-400 uppercase flex items-center gap-2 mb-2">
                            <Sparkles className="w-3 h-3" />
                            Effets rapides
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {FADE_PRESETS.map((preset) => (
                              <button
                                key={preset.id}
                                onClick={() => applyPreset(layer, preset.id)}
                                className="flex items-center gap-2 p-2 rounded-lg bg-midnight-800/50 hover:bg-midnight-700/50 text-xs transition-colors"
                              >
                                <span>{preset.icon}</span>
                                <span className="truncate">{preset.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Timeline d'opacité */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-midnight-400 uppercase flex items-center gap-2">
                              <Settings className="w-3 h-3" />
                              Timeline d'opacité
                            </label>
                            <button
                              onClick={() => setVideoEffects(layer.id, { opacityKeyframes: [] })}
                              className="text-[10px] text-rose-400 hover:text-rose-300"
                            >
                              Effacer tout
                            </button>
                          </div>
                          <OpacityTimeline
                            layer={layer}
                            onAddKeyframe={(kf) => addOpacityKeyframe(layer.id, kf)}
                            onUpdateKeyframe={(idx, updates) => updateOpacityKeyframe(layer.id, idx, updates)}
                            onDeleteKeyframe={(idx) => deleteOpacityKeyframe(layer.id, idx)}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
      
      {/* Message si pas de vidéo */}
      {videoLayers.length === 0 && (
        <div className="text-center py-6 text-midnight-500">
          <Video className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune vidéo</p>
          <p className="text-xs mt-1">Ajoute des vidéos pour créer des effets</p>
        </div>
      )}
    </div>
  )
}
