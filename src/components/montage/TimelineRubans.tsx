'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { 
  useMontageStore, 
  type TimeRange,
  type MediaTrack,
  type MusicTrack,
  type SoundTrack,
  type LightTrack,
  type DecorationTrack,
  type AnimationTrack,
  type TextEffectTrack,
  type PhraseTiming
} from '@/store/useMontageStore'
import { cn } from '@/lib/utils'
import { playSynthSound } from '@/lib/audio/synth-sounds'
import {
  Video,
  Image,
  Volume2,
  Lightbulb,
  Type,
  Trash2,
  Play,
  Pause,
  GripVertical,
  Music,
  Sparkles,
  Wind,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Fullscreen
} from 'lucide-react'
import { AddElementModal } from './AddElementModal'
import { Highlightable } from '@/components/ui/Highlightable'
import { type HighlightableElement } from '@/store/useHighlightStore'

// =============================================================================
// UTILITAIRES
// =============================================================================

// Convertir un code hex en nom de couleur lisible
const COLOR_NAMES: Record<string, string> = {
  '#FFB347': 'Chaleureux',
  '#87CEEB': 'Frais',
  '#DA70D6': 'Magique',
  '#FF6B6B': 'Coucher de soleil',
  '#228B22': 'Forêt',
  '#191970': 'Nuit',
  '#FFD700': 'Doré',
  '#FFEFD5': 'Doux',
  '#FFFFFF': 'Blanc',
  '#FF0000': 'Rouge',
  '#00FF00': 'Vert',
  '#0000FF': 'Bleu',
  '#FFFF00': 'Jaune',
  '#FF00FF': 'Rose',
  '#00FFFF': 'Cyan',
  '#FFA500': 'Orange',
  '#800080': 'Violet',
  '#FFC0CB': 'Rose pâle',
  '#ADD8E6': 'Bleu clair',
  '#90EE90': 'Vert clair',
  '#F0E68C': 'Kaki',
  '#E6E6FA': 'Lavande',
  '#FFFACD': 'Citron',
  '#D2691E': 'Chocolat',
  '#4682B4': 'Acier',
}

function getColorName(hex: string): string {
  // Normaliser le hex en majuscules
  const normalizedHex = hex.toUpperCase()
  
  // Chercher une correspondance exacte
  if (COLOR_NAMES[normalizedHex]) {
    return COLOR_NAMES[normalizedHex]
  }
  
  // Trouver la couleur la plus proche
  const r = parseInt(normalizedHex.slice(1, 3), 16)
  const g = parseInt(normalizedHex.slice(3, 5), 16)
  const b = parseInt(normalizedHex.slice(5, 7), 16)
  
  let closestName = hex
  let closestDistance = Infinity
  
  for (const [colorHex, name] of Object.entries(COLOR_NAMES)) {
    const cr = parseInt(colorHex.slice(1, 3), 16)
    const cg = parseInt(colorHex.slice(3, 5), 16)
    const cb = parseInt(colorHex.slice(5, 7), 16)
    
    const distance = Math.sqrt(
      Math.pow(r - cr, 2) + Math.pow(g - cg, 2) + Math.pow(b - cb, 2)
    )
    
    if (distance < closestDistance) {
      closestDistance = distance
      closestName = name
    }
  }
  
  // Si la distance est trop grande, retourner une description basée sur la teinte
  if (closestDistance > 100) {
    if (r > g && r > b) return 'Rougeâtre'
    if (g > r && g > b) return 'Verdâtre'
    if (b > r && b > g) return 'Bleuâtre'
    if (r > 200 && g > 200 && b < 100) return 'Jaune'
    if (r > 200 && g < 100 && b > 200) return 'Magenta'
    if (r < 100 && g > 200 && b > 200) return 'Cyan'
    return 'Personnalisé'
  }
  
  return closestName
}

// =============================================================================
// TYPES
// =============================================================================

interface RubanProps {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  timeRange: TimeRange
  duration: number
  pixelsPerSecond: number
  isSelected: boolean
  lane?: number // Sous-ligne (0 par défaut)
  onSelect: () => void
  onTimeRangeChange: (timeRange: TimeRange) => void
  onDelete: () => void
}

// =============================================================================
// ZONE INTRO / OUTRO (REDIMENSIONNABLE)
// =============================================================================

interface IntroOutroZoneProps {
  type: 'intro' | 'outro'
  duration: number
  pixelsPerSecond: number
  startOffset: number  // Position de départ en secondes
  onDurationChange: (newDuration: number) => void
}

function IntroOutroZone({
  type,
  duration,
  pixelsPerSecond,
  startOffset,
  onDurationChange,
}: IntroOutroZoneProps) {
  const zoneRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartX = useRef(0)
  const originalDuration = useRef(duration)

  // Position en pixels
  const leftPx = startOffset * pixelsPerSecond
  const widthPx = duration * pixelsPerSecond

  // Resize handler
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    resizeStartX.current = e.clientX
    originalDuration.current = duration
  }

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartX.current
      const deltaTime = deltaX / pixelsPerSecond
      
      // Pour l'intro, on redimensionne depuis la droite
      // Pour l'outro, on redimensionne depuis la gauche
      let newDuration: number
      if (type === 'intro') {
        newDuration = Math.max(0, originalDuration.current + deltaTime)
      } else {
        // Pour outro, le delta est inversé (on tire vers la gauche pour agrandir)
        newDuration = Math.max(0, originalDuration.current - deltaTime)
      }
      
      onDurationChange(Math.round(newDuration * 10) / 10) // Arrondir à 0.1s
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, pixelsPerSecond, type, onDurationChange])

  // Ne pas afficher si durée = 0 - on affiche juste un petit bouton + dans le label
  if (duration === 0) {
    return null  // Géré par le label de la piste Structure
  }

  return (
    <div
      ref={zoneRef}
      className={cn(
        'absolute h-full flex items-center px-2 rounded-md text-xs transition-shadow group',
        type === 'intro' 
          ? 'bg-emerald-500/30 text-emerald-200 border-r-2 border-emerald-500' 
          : 'bg-violet-500/30 text-violet-200 border-l-2 border-violet-500',
        isResizing && 'ring-2 ring-white'
      )}
      style={{
        left: leftPx,
        width: Math.max(40, widthPx),
        minWidth: 40,
      }}
    >
      {/* Emoji et label */}
      <span className="truncate font-medium">
        {type === 'intro' ? '🎬 Intro' : '🎬 Outro'}
      </span>
      <span className="ml-1 text-[10px] opacity-70">
        {duration.toFixed(1)}s
      </span>

      {/* Handle de redimensionnement */}
      <div
        className={cn(
          'absolute top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity',
          'hover:bg-white/30 flex items-center justify-center',
          type === 'intro' ? 'right-0' : 'left-0'
        )}
        onMouseDown={handleResizeStart}
      >
        <GripVertical className="w-2 h-2 text-white/70 rotate-90" />
      </div>

      {/* Bouton supprimer (réduire à 0) */}
      <button
        onClick={() => onDurationChange(0)}
        className="absolute -top-1 -right-1 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-400"
        title="Supprimer"
      >
        <Trash2 className="w-2.5 h-2.5" />
      </button>
    </div>
  )
}

// =============================================================================
// RUBAN DRAGGABLE
// =============================================================================

function Ruban({
  id,
  label,
  icon,
  color,
  timeRange,
  duration,
  pixelsPerSecond,
  isSelected,
  lane = 0,
  onSelect,
  onTimeRangeChange,
  onDelete,
}: RubanProps) {
  const rubanRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)
  const dragStartX = useRef(0)
  const originalTimeRange = useRef(timeRange)

  // Position verticale basée sur la lane
  const topPosition = lane * (LANE_HEIGHT + LANE_GAP)

  // Calculer les positions en pixels
  const leftPx = timeRange.startTime * pixelsPerSecond
  const widthPx = (timeRange.endTime - timeRange.startTime) * pixelsPerSecond

  // Gestion du drag principal (déplacement)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isResizingLeft || isResizingRight) return
    e.preventDefault()
    setIsDragging(true)
    dragStartX.current = e.clientX
    originalTimeRange.current = timeRange
    onSelect()
  }

  // Gestion du resize gauche
  const handleResizeLeftStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizingLeft(true)
    dragStartX.current = e.clientX
    originalTimeRange.current = timeRange
    onSelect()
  }

  // Gestion du resize droit
  const handleResizeRightStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizingRight(true)
    dragStartX.current = e.clientX
    originalTimeRange.current = timeRange
    onSelect()
  }

  // Mouse move handler
  useEffect(() => {
    if (!isDragging && !isResizingLeft && !isResizingRight) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX.current
      // Convertir le déplacement en pixels vers le temps
      const deltaTime = deltaX / pixelsPerSecond

      if (isDragging) {
        // Déplacement du ruban entier
        const newStartTime = Math.max(0, Math.min(
          duration - (originalTimeRange.current.endTime - originalTimeRange.current.startTime),
          originalTimeRange.current.startTime + deltaTime
        ))
        const segmentDuration = originalTimeRange.current.endTime - originalTimeRange.current.startTime
        onTimeRangeChange({
          ...timeRange,
          startTime: newStartTime,
          endTime: newStartTime + segmentDuration,
        })
      } else if (isResizingLeft) {
        // Resize côté gauche
        const newStartTime = Math.max(0, Math.min(
          timeRange.endTime - 0.5, // Minimum 0.5s
          originalTimeRange.current.startTime + deltaTime
        ))
        onTimeRangeChange({
          ...timeRange,
          startTime: newStartTime,
        })
      } else if (isResizingRight) {
        // Resize côté droit
        const newEndTime = Math.max(
          timeRange.startTime + 0.5, // Minimum 0.5s
          Math.min(duration, originalTimeRange.current.endTime + deltaTime)
        )
        onTimeRangeChange({
          ...timeRange,
          endTime: newEndTime,
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizingLeft(false)
      setIsResizingRight(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizingLeft, isResizingRight, duration, pixelsPerSecond, timeRange, onTimeRangeChange])

  return (
    <div
      ref={rubanRef}
      className={cn(
        'absolute rounded-md cursor-grab transition-shadow flex items-center overflow-hidden',
        isSelected && 'ring-2 ring-white shadow-lg',
        isDragging && 'cursor-grabbing opacity-80',
        color
      )}
      style={{
        left: leftPx,
        top: topPosition,
        width: Math.max(40, widthPx),
        height: LANE_HEIGHT - 4,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {/* Handle gauche (resize) */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 flex items-center justify-center"
        onMouseDown={handleResizeLeftStart}
      >
        <div className="w-0.5 h-4 bg-white/50 rounded" />
      </div>

      {/* Contenu */}
      <div className="flex-1 flex items-center gap-1.5 px-3 text-white text-xs font-medium truncate">
        {icon}
        <span className="truncate">{label}</span>
      </div>

      {/* Bouton supprimer */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute right-1 p-1 rounded bg-rose-500/50 hover:bg-rose-500 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}

      {/* Handle droit (resize) */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 flex items-center justify-center"
        onMouseDown={handleResizeRightStart}
      >
        <div className="w-0.5 h-4 bg-white/50 rounded" />
      </div>
    </div>
  )
}

// =============================================================================
// PISTE DE RUBANS (AVEC SOUS-LIGNES AUTOMATIQUES)
// =============================================================================

// Calcule les lanes pour éviter les chevauchements
export function calculateLanes(timeRanges: { id: string; startTime: number; endTime: number }[]): Map<string, number> {
  const lanes = new Map<string, number>()
  const laneEndTimes: number[] = [] // Temps de fin de chaque lane
  
  // Trier par temps de début
  const sorted = [...timeRanges].sort((a, b) => a.startTime - b.startTime)
  
  for (const item of sorted) {
    // Trouver la première lane disponible (où l'élément précédent est terminé)
    let laneIndex = laneEndTimes.findIndex(endTime => endTime <= item.startTime)
    
    if (laneIndex === -1) {
      // Aucune lane disponible, en créer une nouvelle
      laneIndex = laneEndTimes.length
      laneEndTimes.push(item.endTime)
    } else {
      // Mettre à jour le temps de fin de cette lane
      laneEndTimes[laneIndex] = item.endTime
    }
    
    lanes.set(item.id, laneIndex)
  }
  
  return lanes
}

// Compte le nombre de lanes nécessaires
export function countLanes(timeRanges: { id: string; startTime: number; endTime: number }[]): number {
  if (timeRanges.length === 0) return 1
  const lanes = calculateLanes(timeRanges)
  return Math.max(1, Math.max(...Array.from(lanes.values())) + 1)
}

const LANE_HEIGHT = 28 // Hauteur d'une sous-ligne en pixels
const LANE_GAP = 2 // Espacement entre les sous-lignes

interface TrackRowScrollableProps {
  label: string
  icon: React.ReactNode
  color: string
  buttonColor: string
  timelineWidth: number
  laneCount?: number // Nombre de sous-lignes (1 par défaut)
  onAdd?: () => void
  highlightId?: HighlightableElement // ID pour le guidage visuel
  children: React.ReactNode
}

function TrackRowScrollable({ label, icon, color, buttonColor, timelineWidth, laneCount = 1, onAdd, highlightId, children }: TrackRowScrollableProps) {
  const totalHeight = Math.max(1, laneCount) * LANE_HEIGHT + (Math.max(0, laneCount - 1) * LANE_GAP)
  
  const addButton = onAdd ? (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onAdd()
      }}
      className={cn(
        'p-1 rounded-md transition-all hover:scale-110 shrink-0',
        buttonColor
      )}
      title={`Ajouter ${label.toLowerCase()}`}
    >
      <Plus className="w-3 h-3" />
    </button>
  ) : null
  
  return (
    <div className="flex items-start" style={{ minHeight: totalHeight + 4 }}>
      {/* Label de la piste + bouton add */}
      <div className="shrink-0 flex items-center gap-1 pt-0.5" style={{ width: LABEL_WIDTH }}>
        <div className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium flex-1 min-w-0',
          color
        )}>
          {icon}
          <span className="truncate">{label}</span>
        </div>
        
        {/* Bouton + (avec ou sans highlight) */}
        {highlightId && addButton ? (
          <Highlightable id={highlightId}>
            {addButton}
          </Highlightable>
        ) : addButton}
      </div>

      {/* Zone des rubans - hauteur adaptée au nombre de lanes */}
      <div 
        className="relative bg-midnight-800/30 rounded-md"
        style={{ width: timelineWidth, minWidth: timelineWidth, height: totalHeight }}
      >
        {children}
      </div>
    </div>
  )
}

// =============================================================================
// RULER SCROLLABLE (RÈGLE TEMPORELLE AVEC SCROLL)
// =============================================================================

const LABEL_WIDTH = 110 // Largeur fixe des labels de piste (pour "Lumières")

interface TimeRulerScrollableProps {
  duration: number
  currentTime: number
  pixelsPerSecond: number
  rulerScrollRef: React.RefObject<HTMLDivElement>
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void
  onSeek: (time: number) => void
}

function TimeRulerScrollable({ duration, currentTime, pixelsPerSecond, rulerScrollRef, onScroll, onSeek }: TimeRulerScrollableProps) {
  // Handler pour cliquer sur la règle et repositionner la tête de lecture
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left + (rulerScrollRef.current?.scrollLeft || 0)
    const newTime = Math.max(0, Math.min(duration, clickX / pixelsPerSecond))
    onSeek(newTime)
  }

  // Calculer l'intervalle des marques en fonction du zoom
  const getMarkInterval = () => {
    if (pixelsPerSecond >= 100) return 1   // 1s par marque si très zoomé
    if (pixelsPerSecond >= 50) return 2    // 2s
    if (pixelsPerSecond >= 30) return 5    // 5s
    return 10                               // 10s si dézoomé
  }
  
  const markInterval = getMarkInterval()
  const marks: number[] = []
  for (let t = 0; t <= duration; t += markInterval) {
    marks.push(t)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const timelineWidth = duration * pixelsPerSecond
  const playheadPosition = currentTime * pixelsPerSecond

  return (
    <div className="flex h-6 bg-midnight-800/50 border-b border-midnight-700/30">
      {/* Espace vide pour aligner avec les labels */}
      <div className="shrink-0" style={{ width: LABEL_WIDTH }} />
      
      {/* Zone scrollable de la règle - cliquer pour repositionner */}
      <div 
        ref={rulerScrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-midnight-600"
        onScroll={onScroll}
      >
        <div 
          className="relative h-full cursor-pointer hover:bg-midnight-700/20 transition-colors" 
          style={{ width: timelineWidth }}
          onClick={handleRulerClick}
          title="Clique pour repositionner la tête de lecture"
        >
          {/* Marques de temps */}
          {marks.map((t) => (
            <div
              key={t}
              className="absolute top-0 bottom-0 flex flex-col items-center"
              style={{ left: t * pixelsPerSecond }}
            >
              <div className="w-px h-2 bg-midnight-600" />
              <span className="text-[10px] text-midnight-500 whitespace-nowrap">{formatTime(t)}</span>
            </div>
          ))}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-aurora-400 z-10"
            style={{ left: playheadPosition }}
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-aurora-400 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// RUBAN DE PHRASE (DRAGGABLE)
// =============================================================================

interface PhraseRubanProps {
  phrase: PhraseTiming
  pixelsPerSecond: number
  duration: number
  introOffset: number
  isActive: boolean
  onTimeRangeChange: (timeRange: TimeRange) => void
}

function PhraseRuban({
  phrase,
  pixelsPerSecond,
  duration,
  introOffset,
  isActive,
  onTimeRangeChange,
}: PhraseRubanProps) {
  const rubanRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)
  const dragStartX = useRef(0)
  const originalTimeRange = useRef(phrase.timeRange)

  // Position en pixels (avec offset intro)
  const leftPx = (phrase.timeRange.startTime + introOffset) * pixelsPerSecond
  const widthPx = (phrase.timeRange.endTime - phrase.timeRange.startTime) * pixelsPerSecond

  // Gestion du drag principal (déplacement)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isResizingLeft || isResizingRight) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    dragStartX.current = e.clientX
    originalTimeRange.current = phrase.timeRange
  }

  // Gestion du resize gauche
  const handleResizeLeftStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizingLeft(true)
    dragStartX.current = e.clientX
    originalTimeRange.current = phrase.timeRange
  }

  // Gestion du resize droit
  const handleResizeRightStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizingRight(true)
    dragStartX.current = e.clientX
    originalTimeRange.current = phrase.timeRange
  }

  // Mouse move handler
  useEffect(() => {
    if (!isDragging && !isResizingLeft && !isResizingRight) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX.current
      const deltaTime = deltaX / pixelsPerSecond

      if (isDragging) {
        // Déplacement du ruban entier
        const segmentDuration = originalTimeRange.current.endTime - originalTimeRange.current.startTime
        const newStartTime = Math.max(0, Math.min(
          duration - segmentDuration,
          originalTimeRange.current.startTime + deltaTime
        ))
        onTimeRangeChange({
          startTime: newStartTime,
          endTime: newStartTime + segmentDuration,
        })
      } else if (isResizingLeft) {
        // Resize côté gauche (minimum 0.3s de durée)
        const newStartTime = Math.max(0, Math.min(
          phrase.timeRange.endTime - 0.3,
          originalTimeRange.current.startTime + deltaTime
        ))
        onTimeRangeChange({
          startTime: newStartTime,
          endTime: phrase.timeRange.endTime,
        })
      } else if (isResizingRight) {
        // Resize côté droit (minimum 0.3s de durée)
        const newEndTime = Math.max(
          phrase.timeRange.startTime + 0.3,
          Math.min(duration, originalTimeRange.current.endTime + deltaTime)
        )
        onTimeRangeChange({
          startTime: phrase.timeRange.startTime,
          endTime: newEndTime,
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizingLeft(false)
      setIsResizingRight(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizingLeft, isResizingRight, pixelsPerSecond, duration, phrase.timeRange, onTimeRangeChange])

  return (
    <div
      ref={rubanRef}
      className={cn(
        'absolute h-full flex items-center px-2 rounded-md text-xs cursor-grab transition-shadow group',
        isActive 
          ? 'bg-amber-500/60 text-white font-medium ring-2 ring-amber-400' 
          : 'bg-amber-500/30 text-amber-200 hover:bg-amber-500/40',
        isDragging && 'cursor-grabbing opacity-80 ring-2 ring-white'
      )}
      style={{
        left: leftPx,
        width: Math.max(40, widthPx),
        minWidth: 40,
      }}
      onMouseDown={handleMouseDown}
      title={`${phrase.text}\n⏱ ${phrase.timeRange.startTime.toFixed(1)}s → ${phrase.timeRange.endTime.toFixed(1)}s`}
    >
      {/* Handle resize gauche */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 rounded-l-md"
        onMouseDown={handleResizeLeftStart}
      />
      
      {/* Contenu */}
      <span className="truncate flex-1 select-none">{phrase.text}</span>
      
      {/* Handle resize droit */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 rounded-r-md"
        onMouseDown={handleResizeRightStart}
      />
    </div>
  )
}

// =============================================================================
// PISTE DES PHRASES (VERSION PIXELS - DRAGGABLE)
// =============================================================================

function PhrasesTrackScrollable({ 
  phrases, 
  pixelsPerSecond,
  timelineWidth,
  activePhraseIndex,
  introOffset = 0,
  maxDuration,
  onPhraseTimeRangeChange,
}: { 
  phrases: PhraseTiming[]
  pixelsPerSecond: number
  timelineWidth: number
  activePhraseIndex: number
  introOffset?: number
  maxDuration: number  // Durée max (narration + outro)
  onPhraseTimeRangeChange: (phraseId: string, timeRange: TimeRange) => void
}) {
  return (
    <div className="flex items-center h-8">
      {/* Label */}
      <div 
        className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-amber-500/30 text-amber-300"
        style={{ width: LABEL_WIDTH - 8 }}
      >
        <Type className="w-3.5 h-3.5" />
        <span className="truncate">Phrases</span>
      </div>
      
      {/* Zone des rubans (scrollable via le container parent) */}
      <div className="flex-1 h-full relative" style={{ minWidth: timelineWidth }}>
        {phrases.map((phrase, index) => (
          <PhraseRuban
            key={phrase.id}
            phrase={phrase}
            pixelsPerSecond={pixelsPerSecond}
            duration={maxDuration}
            introOffset={introOffset}
            isActive={index === activePhraseIndex}
            onTimeRangeChange={(timeRange) => onPhraseTimeRangeChange(phrase.id, timeRange)}
          />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// TYPES MODAL
// =============================================================================

type ModalElementType = 'media' | 'music' | 'sound' | 'light' | 'decoration' | 'animation' | 'effect'

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export function TimelineRubans() {
  const {
    currentProject,
    currentSceneIndex,
    getCurrentScene,
    selectedTrackId,
    selectedTrackType,
    setSelectedTrack,
    clearSelection,
    isPlaying,
    currentPlaybackTime,
    setIsPlaying,
    setPlaybackTime,
    updateMediaTrack,
    deleteMediaTrack,
    updateMusicTrack,
    deleteMusicTrack,
    updateSoundTrack,
    deleteSoundTrack,
    updateLightTrack,
    deleteLightTrack,
    updateDecorationTrack,
    deleteDecorationTrack,
    updateAnimationTrack,
    deleteAnimationTrack,
    updateTextEffect,
    deleteTextEffect,
    getActivePhrase,
    setIntroDuration,
    setOutroDuration,
    updatePhraseTiming,
  } = useMontageStore()

  const scene = getCurrentScene()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const playedSoundsRef = useRef<Set<string>>(new Set()) // Sons déjà joués
  const lastTimeRef = useRef<number>(0)
  
  // État du modal d'ajout
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<ModalElementType>('media')
  
  // État plein écran
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // État du zoom (pixels par seconde) - 60px/s = 10s visible sur ~600px
  const [pixelsPerSecond, setPixelsPerSecond] = useState(60)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const rulerScrollRef = useRef<HTMLDivElement>(null)
  
  // Synchroniser le scroll entre la règle et les pistes
  const handleTracksScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (rulerScrollRef.current && !isPlaying) {
      rulerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }, [isPlaying])
  
  const handleRulerScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current && !isPlaying) {
      scrollContainerRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }, [isPlaying])
  
  // Repositionner la tête de lecture (seek)
  const handleSeek = useCallback((time: number) => {
    setPlaybackTime(time)
    // Si l'audio est chargé, synchroniser sa position aussi
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }, [setPlaybackTime])
  
  // Ouvrir le modal pour un type d'élément
  const openAddModal = useCallback((type: ModalElementType) => {
    setModalType(type)
    setModalOpen(true)
  }, [])

  // Durées intro/outro/narration
  const introDuration = scene?.introDuration || 0
  const outroDuration = scene?.outroDuration || 0
  const narrationDuration = scene?.narration?.duration || scene?.duration || 10
  
  // Durée totale de la scène (intro + narration + outro)
  const duration = introDuration + narrationDuration + outroDuration
  
  // Largeur totale de la timeline en pixels
  const timelineWidth = duration * pixelsPerSecond
  
  // Zoom handlers
  const zoomIn = useCallback(() => {
    setPixelsPerSecond(prev => Math.min(prev * 1.5, 200)) // Max 200px/s
  }, [])
  
  const zoomOut = useCallback(() => {
    setPixelsPerSecond(prev => Math.max(prev / 1.5, 20)) // Min 20px/s
  }, [])
  
  const zoomFit = useCallback(() => {
    // Adapter le zoom pour que toute la timeline soit visible
    if (scrollContainerRef.current && duration > 0) {
      const containerWidth = scrollContainerRef.current.clientWidth - 100 // Enlever la marge des labels
      setPixelsPerSecond(Math.max(20, Math.min(200, containerWidth / duration)))
    }
  }, [duration])
  
  // Auto-scroll pour suivre le playhead (synchronisé entre règle et pistes)
  useEffect(() => {
    if (isPlaying && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const playheadPosition = currentPlaybackTime * pixelsPerSecond
      const containerWidth = container.clientWidth - 100
      const scrollLeft = container.scrollLeft
      
      // Si le playhead sort de la zone visible, scroller
      if (playheadPosition > scrollLeft + containerWidth - 50 || playheadPosition < scrollLeft + 50) {
        const newScrollLeft = Math.max(0, playheadPosition - containerWidth / 2)
        container.scrollLeft = newScrollLeft
        // Synchroniser la règle aussi
        if (rulerScrollRef.current) {
          rulerScrollRef.current.scrollLeft = newScrollLeft
        }
      }
    }
  }, [currentPlaybackTime, isPlaying, pixelsPerSecond])

  // Phrase active
  const activePhrase = scene ? getActivePhrase(currentPlaybackTime) : null
  const activePhraseIndex = activePhrase ? activePhrase.index : -1

  // Refs pour les sons actifs (pour pouvoir les arrêter)
  const activeSoundRefs = useRef<Map<string, HTMLAudioElement>>(new Map())

  // Vérifier et jouer les sons qui doivent démarrer
  const checkAndPlaySounds = useCallback((currentTime: number, previousTime: number) => {
    if (!scene?.soundTracks) return
    
    scene.soundTracks.forEach((sound) => {
      const soundKey = `${sound.id}-${sound.timeRange.startTime}`
      
      // Le son doit démarrer si on vient de passer son startTime
      if (
        currentTime >= sound.timeRange.startTime &&
        previousTime < sound.timeRange.startTime &&
        !playedSoundsRef.current.has(soundKey)
      ) {
        // Marquer comme joué
        playedSoundsRef.current.add(soundKey)
        
        // Jouer le vrai fichier audio MP3
        try {
          const audio = new Audio(sound.url)
          audio.volume = sound.volume ?? 0.7
          
          // Si c'est en boucle
          if (sound.loop) {
            audio.loop = true
          }
          
          // Stocker la référence pour pouvoir l'arrêter plus tard
          activeSoundRefs.current.set(soundKey, audio)
          
          // Nettoyer quand le son est terminé
          audio.onended = () => {
            activeSoundRefs.current.delete(soundKey)
          }
          
          audio.play().then(() => {
            console.log('🔊 Son joué:', sound.name, 'à', currentTime.toFixed(2) + 's')
          }).catch((err) => {
            console.warn('⚠️ Erreur lecture son:', sound.name, err)
            // Fallback: essayer le son synthétique
            const soundId = sound.url.split('/').pop()?.replace('.mp3', '') || ''
            playSynthSound(soundId, sound.volume ?? 0.7)
          })
        } catch (err) {
          console.warn('⚠️ Erreur création audio:', sound.name, err)
        }
      }
      
      // Arrêter le son si on a dépassé son endTime
      if (currentTime >= sound.timeRange.endTime) {
        const activeAudio = activeSoundRefs.current.get(soundKey)
        if (activeAudio && !activeAudio.paused) {
          activeAudio.pause()
          activeSoundRefs.current.delete(soundKey)
        }
      }
    })
  }, [scene?.soundTracks])

  // Playback
  const togglePlayback = useCallback(() => {
    if (!scene?.narration.audioUrl) return

    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
      // Arrêter tous les sons actifs
      activeSoundRefs.current.forEach((audio) => {
        audio.pause()
      })
      activeSoundRefs.current.clear()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    } else {
      // Reset les sons joués si on recommence du début
      if (currentPlaybackTime < 0.1) {
        playedSoundsRef.current.clear()
      }
      
      if (!audioRef.current) {
        audioRef.current = new Audio(scene.narration?.audioUrl || '')
        audioRef.current.onended = () => {
          setIsPlaying(false)
          setPlaybackTime(0)
          playedSoundsRef.current.clear() // Reset pour la prochaine lecture
        }
      }
      audioRef.current.currentTime = currentPlaybackTime
      lastTimeRef.current = currentPlaybackTime
      audioRef.current.play()
      setIsPlaying(true)

      // Mettre à jour le temps de lecture et vérifier les sons
      const updateTime = () => {
        if (audioRef.current) {
          const newTime = audioRef.current.currentTime
          
          // Vérifier si des sons doivent être joués
          checkAndPlaySounds(newTime, lastTimeRef.current)
          lastTimeRef.current = newTime
          
          setPlaybackTime(newTime)
          animationRef.current = requestAnimationFrame(updateTime)
        }
      }
      animationRef.current = requestAnimationFrame(updateTime)
    }
  }, [scene, isPlaying, currentPlaybackTime, setIsPlaying, setPlaybackTime, checkAndPlaySounds])

  // Cleanup
  useEffect(() => {
    return () => {
      // Arrêter la narration
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      // Arrêter tous les sons actifs
      activeSoundRefs.current.forEach((audio) => {
        audio.pause()
      })
      activeSoundRefs.current.clear()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])
  
  // Écouter la touche Échap pour quitter le plein écran
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  // Reset audio quand la scène change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPlaybackTime(0)
    setIsPlaying(false)
  }, [currentSceneIndex, setPlaybackTime, setIsPlaying])

  if (!scene) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <p className="text-midnight-400">Sélectionne une scène pour voir la timeline</p>
      </div>
    )
  }

  const timelineContent = (
    <div className={cn(
      "glass rounded-xl overflow-hidden flex flex-col h-full",
      isFullscreen && "fixed inset-0 z-[9999] bg-midnight-900 rounded-none"
    )}>
      {/* En-tête avec contrôles */}
      <div className="p-3 border-b border-midnight-700/50 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-midnight-500" />
          Timeline - Scène {currentSceneIndex + 1}
          {isFullscreen && <span className="text-xs text-midnight-500 ml-2">(Plein écran)</span>}
        </h3>

        <div className="flex items-center gap-4">
          {/* Contrôles de zoom */}
          <div className="flex items-center gap-1 bg-midnight-800/50 rounded-lg p-1">
            <button
              onClick={zoomOut}
              className="p-1.5 rounded hover:bg-midnight-700/50 text-midnight-400 hover:text-white transition-colors"
              title="Zoom arrière"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={zoomFit}
              className="p-1.5 rounded hover:bg-midnight-700/50 text-midnight-400 hover:text-white transition-colors"
              title="Ajuster à l'écran"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={zoomIn}
              className="p-1.5 rounded hover:bg-midnight-700/50 text-midnight-400 hover:text-white transition-colors"
              title="Zoom avant"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Bouton plein écran */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              isFullscreen 
                ? 'bg-aurora-500/30 text-aurora-300 hover:bg-aurora-500/40' 
                : 'bg-midnight-800/50 text-midnight-400 hover:text-white hover:bg-midnight-700/50'
            )}
            title={isFullscreen ? "Quitter le plein écran (Échap)" : "Timeline plein écran"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Fullscreen className="w-4 h-4" />}
          </button>

          {/* Contrôles de lecture */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlayback}
              disabled={!scene.narration?.audioUrl}
              className={cn(
                'p-2 rounded-lg transition-colors',
                scene.narration?.audioUrl
                  ? 'bg-aurora-500/20 text-aurora-300 hover:bg-aurora-500/30'
                  : 'bg-midnight-800/50 text-midnight-600 cursor-not-allowed'
              )}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <span className="text-xs text-midnight-400 font-mono">
              {Math.floor(currentPlaybackTime / 60)}:{Math.floor(currentPlaybackTime % 60).toString().padStart(2, '0')} 
              {' / '}
              {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Règle temporelle avec scroll horizontal - clique pour repositionner */}
      <TimeRulerScrollable 
        duration={duration} 
        currentTime={currentPlaybackTime} 
        pixelsPerSecond={pixelsPerSecond}
        rulerScrollRef={rulerScrollRef}
        onScroll={handleRulerScroll}
        onSeek={handleSeek}
      />

      {/* Pistes avec scroll horizontal synchronisé */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 min-h-0 p-3 space-y-1 overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-midnight-600 relative"
        onClick={(e) => {
          // Repositionner la tête de lecture si on clique sur le fond (pas sur un élément)
          if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-track-background]')) {
            const rect = e.currentTarget.getBoundingClientRect()
            const clickX = e.clientX - rect.left - LABEL_WIDTH + e.currentTarget.scrollLeft
            if (clickX > 0) {
              const newTime = Math.max(0, Math.min(duration, clickX / pixelsPerSecond))
              handleSeek(newTime)
            }
          }
          clearSelection()
        }}
        onScroll={handleTracksScroll}
      >
        {/* Playhead vertical qui traverse toutes les pistes */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-aurora-400 z-50 pointer-events-none shadow-lg shadow-aurora-400/50"
          style={{ 
            left: LABEL_WIDTH + (currentPlaybackTime * pixelsPerSecond) - (scrollContainerRef.current?.scrollLeft || 0),
            transition: isPlaying ? 'none' : 'left 0.1s ease-out'
          }}
        >
          <div className="absolute top-0 -left-1.5 w-3 h-3 bg-aurora-400 rounded-full shadow-lg shadow-aurora-400/50" />
        </div>
        {/* Piste Structure (Intro / Narration / Outro) */}
        <div className="flex items-center h-8">
          {/* Label avec boutons d'ajout */}
          <div 
            className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-emerald-500/30 to-violet-500/30 text-white"
            style={{ width: LABEL_WIDTH - 8 }}
          >
            <Play className="w-3 h-3 text-emerald-300" />
            <span className="truncate flex-1">Structure</span>
            {/* Boutons d'ajout intro/outro */}
            <div className="flex gap-0.5">
              {introDuration === 0 && (
                <button
                  onClick={() => setIntroDuration(3)}
                  className="p-0.5 rounded bg-emerald-500/50 hover:bg-emerald-500 text-white transition-colors"
                  title="Ajouter intro (3s)"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              )}
              {outroDuration === 0 && (
                <button
                  onClick={() => setOutroDuration(3)}
                  className="p-0.5 rounded bg-violet-500/50 hover:bg-violet-500 text-white transition-colors"
                  title="Ajouter outro (3s)"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
          
          {/* Zone des rubans */}
          <div className="flex-1 h-full relative" style={{ minWidth: timelineWidth }}>
            {/* Zone Intro */}
            <IntroOutroZone
              type="intro"
              duration={introDuration}
              pixelsPerSecond={pixelsPerSecond}
              startOffset={0}
              onDurationChange={setIntroDuration}
            />
            
            {/* Zone Narration (indicatif, non éditable) */}
            {narrationDuration > 0 && (
              <div
                className="absolute h-full flex items-center px-2 rounded-md text-xs bg-amber-500/20 text-amber-200 border-x border-amber-500/30"
                style={{
                  left: introDuration * pixelsPerSecond,
                  width: narrationDuration * pixelsPerSecond,
                  minWidth: 40,
                }}
              >
                <span className="truncate">📖 Narration ({narrationDuration.toFixed(1)}s)</span>
              </div>
            )}
            
            {/* Zone Outro */}
            <IntroOutroZone
              type="outro"
              duration={outroDuration}
              pixelsPerSecond={pixelsPerSecond}
              startOffset={introDuration + narrationDuration}
              onDurationChange={setOutroDuration}
            />
          </div>
        </div>

        {/* Piste des phrases (draggable pour ajouter des espaces) */}
        {scene.narration?.isSynced && (scene.narration?.phrases?.length || 0) > 0 && (
          <PhrasesTrackScrollable
            phrases={scene.narration?.phrases || []}
            pixelsPerSecond={pixelsPerSecond}
            timelineWidth={timelineWidth}
            activePhraseIndex={activePhraseIndex}
            introOffset={introDuration}
            maxDuration={narrationDuration + outroDuration}
            onPhraseTimeRangeChange={(phraseId, timeRange) => 
              updatePhraseTiming(phraseId, { timeRange })
            }
          />
        )}

        {/* Piste Vidéo/Images */}
        {(() => {
          const tracks = scene.mediaTracks || []
          const lanes = calculateLanes(tracks.map(t => ({ id: t.id, startTime: t.timeRange.startTime, endTime: t.timeRange.endTime })))
          const laneCount = countLanes(tracks.map(t => ({ id: t.id, startTime: t.timeRange.startTime, endTime: t.timeRange.endTime })))
          return (
            <TrackRowScrollable
              label="Médias"
              icon={<Video className="w-3.5 h-3.5" />}
              color="bg-blue-500/30 text-blue-300"
              buttonColor="bg-blue-500/50 hover:bg-blue-500 text-blue-200"
              timelineWidth={timelineWidth}
              laneCount={laneCount}
              onAdd={() => openAddModal('media')}
              highlightId="montage-add-media"
            >
              {tracks.map((track) => (
                <Ruban
                  key={track.id}
                  id={track.id}
                  label={track.name}
                  icon={track.type === 'video' ? <Video className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                  color="bg-blue-500"
                  timeRange={track.timeRange}
                  duration={duration}
                  pixelsPerSecond={pixelsPerSecond}
                  isSelected={selectedTrackId === track.id && selectedTrackType === 'media'}
                  lane={lanes.get(track.id) || 0}
                  onSelect={() => setSelectedTrack(track.id, 'media')}
                  onTimeRangeChange={(tr) => updateMediaTrack(track.id, { timeRange: tr })}
                  onDelete={() => deleteMediaTrack(track.id)}
                />
              ))}
            </TrackRowScrollable>
          )
        })()}

        {/* Piste Musique */}
        {(() => {
          const tracks = (scene as any).musicTracks || []
          const lanes = calculateLanes(tracks.map((t: MusicTrack) => ({ id: t.id, startTime: t.timeRange.startTime, endTime: t.timeRange.endTime })))
          const laneCount = countLanes(tracks.map((t: MusicTrack) => ({ id: t.id, startTime: t.timeRange.startTime, endTime: t.timeRange.endTime })))
          return (
            <TrackRowScrollable
              label="Musique"
              icon={<Music className="w-3.5 h-3.5" />}
              color="bg-emerald-500/30 text-emerald-300"
              buttonColor="bg-emerald-500/50 hover:bg-emerald-500 text-emerald-200"
              timelineWidth={timelineWidth}
              laneCount={laneCount}
              onAdd={() => openAddModal('music')}
              highlightId="montage-add-music"
            >
              {tracks.map((track: MusicTrack) => (
                <Ruban
                  key={track.id}
                  id={track.id}
                  label={track.name}
                  icon={<Music className="w-3 h-3" />}
                  color="bg-emerald-500"
                  timeRange={track.timeRange}
                  duration={duration}
                  pixelsPerSecond={pixelsPerSecond}
                  isSelected={selectedTrackId === track.id && selectedTrackType === 'music'}
                  lane={lanes.get(track.id) || 0}
                  onSelect={() => setSelectedTrack(track.id, 'music')}
                  onTimeRangeChange={(tr) => updateMusicTrack(track.id, { timeRange: tr })}
                  onDelete={() => deleteMusicTrack(track.id)}
                />
              ))}
            </TrackRowScrollable>
          )
        })()}

        {/* Piste Sons (effets sonores) */}
        {/* Piste Sons */}
        {(() => {
          const tracks = scene.soundTracks || []
          const lanes = calculateLanes(tracks.map(t => ({ id: t.id, startTime: t.timeRange.startTime, endTime: t.timeRange.endTime })))
          const laneCount = countLanes(tracks.map(t => ({ id: t.id, startTime: t.timeRange.startTime, endTime: t.timeRange.endTime })))
          return (
            <TrackRowScrollable
              label="Sons"
              icon={<Volume2 className="w-3.5 h-3.5" />}
              color="bg-pink-500/30 text-pink-300"
              buttonColor="bg-pink-500/50 hover:bg-pink-500 text-pink-200"
              timelineWidth={timelineWidth}
              laneCount={laneCount}
              onAdd={() => openAddModal('sound')}
              highlightId="montage-add-sound"
            >
              {tracks.map((track) => (
                <Ruban
                  key={track.id}
                  id={track.id}
                  label={track.name}
                  icon={<Volume2 className="w-3 h-3" />}
                  color="bg-pink-500"
                  timeRange={track.timeRange}
                  duration={duration}
                  pixelsPerSecond={pixelsPerSecond}
                  isSelected={selectedTrackId === track.id && selectedTrackType === 'sound'}
                  lane={lanes.get(track.id) || 0}
                  onSelect={() => setSelectedTrack(track.id, 'sound')}
                  onTimeRangeChange={(tr) => updateSoundTrack(track.id, { timeRange: tr })}
                  onDelete={() => deleteSoundTrack(track.id)}
                />
              ))}
            </TrackRowScrollable>
          )
        })()}

        {/* Piste Lumières */}
        {(() => {
          const tracks = scene.lightTracks || []
          const lanes = calculateLanes(tracks.map(t => ({ id: t.id, startTime: t.timeRange.startTime, endTime: t.timeRange.endTime })))
          const laneCount = countLanes(tracks.map(t => ({ id: t.id, startTime: t.timeRange.startTime, endTime: t.timeRange.endTime })))
          return (
            <TrackRowScrollable
              label="Lumières"
              icon={<Lightbulb className="w-3.5 h-3.5" />}
              color="bg-yellow-500/30 text-yellow-300"
              buttonColor="bg-yellow-500/50 hover:bg-yellow-500 text-yellow-200"
              timelineWidth={timelineWidth}
              laneCount={laneCount}
              onAdd={() => openAddModal('light')}
              highlightId="montage-add-light"
            >
              {tracks.map((track) => (
                <Ruban
                  key={track.id}
                  id={track.id}
                  label={`${getColorName(track.color)} ${track.intensity}%`}
                  icon={<Lightbulb className="w-3 h-3" />}
                  color="bg-yellow-500"
                  timeRange={track.timeRange}
                  duration={duration}
                  pixelsPerSecond={pixelsPerSecond}
                  isSelected={selectedTrackId === track.id && selectedTrackType === 'light'}
                  lane={lanes.get(track.id) || 0}
                  onSelect={() => setSelectedTrack(track.id, 'light')}
                  onTimeRangeChange={(tr) => updateLightTrack(track.id, { timeRange: tr })}
                  onDelete={() => deleteLightTrack(track.id)}
                />
              ))}
            </TrackRowScrollable>
          )
        })()}

        {/* Piste Décorations */}
        {(() => {
          const tracks = (scene as any).decorationTracks || []
          const lanes = calculateLanes(tracks.map((t: DecorationTrack) => ({ id: t.id, startTime: t.timeRange.startTime, endTime: t.timeRange.endTime })))
          const laneCount = countLanes(tracks.map((t: DecorationTrack) => ({ id: t.id, startTime: t.timeRange.startTime, endTime: t.timeRange.endTime })))
          return (
            <TrackRowScrollable
              label="Déco"
              icon={<Sparkles className="w-3.5 h-3.5" />}
              color="bg-orange-500/30 text-orange-300"
              buttonColor="bg-orange-500/50 hover:bg-orange-500 text-orange-200"
              timelineWidth={timelineWidth}
              laneCount={laneCount}
              onAdd={() => openAddModal('decoration')}
              highlightId="montage-add-decoration"
            >
              {tracks.map((track: DecorationTrack) => (
                <Ruban
                  key={track.id}
                  id={track.id}
                  label={track.name}
                  icon={<Sparkles className="w-3 h-3" />}
                  color="bg-orange-500"
                  timeRange={track.timeRange}
                  duration={duration}
                  pixelsPerSecond={pixelsPerSecond}
                  isSelected={selectedTrackId === track.id && selectedTrackType === 'decoration'}
                  lane={lanes.get(track.id) || 0}
                  onSelect={() => setSelectedTrack(track.id, 'decoration')}
                  onTimeRangeChange={(tr) => updateDecorationTrack(track.id, { timeRange: tr })}
                  onDelete={() => deleteDecorationTrack(track.id)}
                />
              ))}
            </TrackRowScrollable>
          )
        })()}

        {/* Piste Animations */}
        {(() => {
          const tracks = (scene as any).animationTracks || []
          const lanes = calculateLanes(tracks.map((t: AnimationTrack) => ({ id: t.id, startTime: t.timeRange.startTime, endTime: t.timeRange.endTime })))
          const laneCount = countLanes(tracks.map((t: AnimationTrack) => ({ id: t.id, startTime: t.timeRange.startTime, endTime: t.timeRange.endTime })))
          return (
            <TrackRowScrollable
              label="Anim"
              icon={<Wind className="w-3.5 h-3.5" />}
              color="bg-cyan-500/30 text-cyan-300"
              buttonColor="bg-cyan-500/50 hover:bg-cyan-500 text-cyan-200"
              timelineWidth={timelineWidth}
              laneCount={laneCount}
              onAdd={() => openAddModal('animation')}
              highlightId="montage-add-effect"
            >
              {tracks.map((track: AnimationTrack) => (
                <Ruban
                  key={track.id}
                  id={track.id}
                  label={track.name}
                  icon={<Wind className="w-3 h-3" />}
                  color="bg-cyan-500"
                  timeRange={track.timeRange}
                  duration={duration}
                  pixelsPerSecond={pixelsPerSecond}
                  isSelected={selectedTrackId === track.id && selectedTrackType === 'animation'}
                  lane={lanes.get(track.id) || 0}
                  onSelect={() => setSelectedTrack(track.id, 'animation')}
                  onTimeRangeChange={(tr) => updateAnimationTrack(track.id, { timeRange: tr })}
                  onDelete={() => deleteAnimationTrack(track.id)}
                />
              ))}
            </TrackRowScrollable>
          )
        })()}

        {/* Piste Effets texte */}
        {(() => {
          const tracks = scene.textEffectTracks || []
          const lanes = calculateLanes(tracks.map(t => ({ id: t.id, startTime: t.timeRange.startTime, endTime: t.timeRange.endTime })))
          const laneCount = countLanes(tracks.map(t => ({ id: t.id, startTime: t.timeRange.startTime, endTime: t.timeRange.endTime })))
          return (
            <TrackRowScrollable
              label="Effets"
              icon={<Type className="w-3.5 h-3.5" />}
              color="bg-purple-500/30 text-purple-300"
              buttonColor="bg-purple-500/50 hover:bg-purple-500 text-purple-200"
              timelineWidth={timelineWidth}
              laneCount={laneCount}
              onAdd={() => openAddModal('effect')}
            >
              {tracks.map((effect) => (
                <Ruban
                  key={effect.id}
                  id={effect.id}
                  label={effect.type}
                  icon={<Type className="w-3 h-3" />}
                  color="bg-purple-500"
                  timeRange={effect.timeRange}
                  duration={duration}
                  pixelsPerSecond={pixelsPerSecond}
                  isSelected={selectedTrackId === effect.id && selectedTrackType === 'effect'}
                  lane={lanes.get(effect.id) || 0}
                  onSelect={() => setSelectedTrack(effect.id, 'effect')}
                  onTimeRangeChange={(tr) => updateTextEffect(effect.id, { timeRange: tr })}
                  onDelete={() => deleteTextEffect(effect.id)}
                />
              ))}
            </TrackRowScrollable>
          )
        })()}
      </div>

      {/* Info */}
      <div className="px-3 pb-3">
        <p className="text-xs text-midnight-500 text-center">
          👆 Glisse les rubans pour ajuster le timing • Tire les bords pour redimensionner
        </p>
      </div>
      
      {/* Modal d'ajout d'éléments */}
      <AddElementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        elementType={modalType}
      />
    </div>
  )

  // En plein écran, rendre via un portal directement dans le body
  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(timelineContent, document.body)
  }

  return timelineContent
}
