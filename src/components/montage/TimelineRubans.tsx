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
  Fullscreen,
  RotateCcw
} from 'lucide-react'
import { AddElementModal } from './AddElementModal'
import { Highlightable } from '@/components/ui/Highlightable'
import { type HighlightableElement } from '@/store/useHighlightStore'
import { useTranslations } from '@/lib/i18n/context'

// =============================================================================
// CONSTANTES
// =============================================================================

// Buffer de temps supplémentaire affiché à la fin de la timeline (en secondes)
// Permet de placer des éléments au-delà de la durée actuelle et déclenche l'auto-extension
const BUFFER_DURATION = 10

// =============================================================================
// UTILITAIRES
// =============================================================================

// Known color hex codes (used for closest-match lookup)
const COLOR_HEX_KEYS = [
  '#FFB347', '#87CEEB', '#DA70D6', '#FF6B6B', '#228B22', '#191970',
  '#FFD700', '#FFEFD5', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB',
  '#ADD8E6', '#90EE90', '#F0E68C', '#E6E6FA', '#FFFACD', '#D2691E', '#4682B4',
]

function getColorName(hex: string, t: (key: string) => string): string {
  // Normaliser le hex en majuscules
  const normalizedHex = hex.toUpperCase()

  // Chercher une correspondance exacte via translations
  const exactName = t(`timeline.colors.${normalizedHex}`)
  if (exactName && exactName !== `timeline.colors.${normalizedHex}`) {
    return exactName
  }

  // Trouver la couleur la plus proche
  const r = parseInt(normalizedHex.slice(1, 3), 16)
  const g = parseInt(normalizedHex.slice(3, 5), 16)
  const b = parseInt(normalizedHex.slice(5, 7), 16)

  let closestKey = hex
  let closestDistance = Infinity

  for (const colorHex of COLOR_HEX_KEYS) {
    const cr = parseInt(colorHex.slice(1, 3), 16)
    const cg = parseInt(colorHex.slice(3, 5), 16)
    const cb = parseInt(colorHex.slice(5, 7), 16)

    const distance = Math.sqrt(
      Math.pow(r - cr, 2) + Math.pow(g - cg, 2) + Math.pow(b - cb, 2)
    )

    if (distance < closestDistance) {
      closestDistance = distance
      closestKey = colorHex
    }
  }

  // Si la distance est trop grande, retourner une description basée sur la teinte
  if (closestDistance > 100) {
    if (r > g && r > b) return t('timeline.colorDetection.reddish')
    if (g > r && g > b) return t('timeline.colorDetection.greenish')
    if (b > r && b > g) return t('timeline.colorDetection.bluish')
    if (r > 200 && g > 200 && b < 100) return t('timeline.colorDetection.yellow')
    if (r > 200 && g < 100 && b > 200) return t('timeline.colorDetection.magenta')
    if (r < 100 && g > 200 && b > 200) return t('timeline.colorDetection.cyan')
    return t('timeline.colorDetection.custom')
  }

  const closestName = t(`timeline.colors.${closestKey}`)
  return (closestName && closestName !== `timeline.colors.${closestKey}`) ? closestName : hex
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
  maxDuration: number // Durée max incluant le buffer (pour permettre le placement au-delà)
  pixelsPerSecond: number
  isSelected: boolean
  lane?: number // Sous-ligne (0 par défaut)
  onSelect: () => void
  onTimeRangeChange: (timeRange: TimeRange) => void
  onDelete: () => void
  onAutoExtend?: (newEndTime: number) => void // Appelé quand un élément dépasse la durée actuelle
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
  const t = useTranslations('layout')
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
        {type === 'intro' ? t('timeline.intro') : t('timeline.outro')}
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
        title={t('timeline.delete')}
      >
        <Trash2 className="w-2.5 h-2.5" />
      </button>
    </div>
  )
}

// =============================================================================
// ZONE NARRATION (REDIMENSIONNABLE)
// =============================================================================

interface NarrationZoneProps {
  duration: number
  minDuration: number  // Durée minimum (durée de l'audio)
  pixelsPerSecond: number
  startOffset: number  // Position de départ en secondes (après intro)
  onDurationChange: (newDuration: number) => void
}

function NarrationZone({
  duration,
  minDuration,
  pixelsPerSecond,
  startOffset,
  onDurationChange,
}: NarrationZoneProps) {
  const t = useTranslations('layout')
  const zoneRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartX = useRef(0)
  const originalDuration = useRef(duration)

  // Position en pixels
  const leftPx = startOffset * pixelsPerSecond
  const widthPx = duration * pixelsPerSecond

  // Resize handler (côté droit uniquement)
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
      
      // Minimum = durée de l'audio, pas de maximum
      const newDuration = Math.max(minDuration, originalDuration.current + deltaTime)
      
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
  }, [isResizing, pixelsPerSecond, minDuration, onDurationChange])

  return (
    <div
      ref={zoneRef}
      className={cn(
        'absolute h-full flex items-center px-2 rounded-md text-xs transition-shadow group',
        'bg-amber-500/20 text-amber-200 border-x border-amber-500/30',
        isResizing && 'ring-2 ring-amber-400'
      )}
      style={{
        left: leftPx,
        width: Math.max(40, widthPx),
        minWidth: 40,
      }}
    >
      {/* Emoji et label */}
      <span className="truncate font-medium">
        {t('timeline.narration')}
      </span>
      <span className="ml-1 text-[10px] opacity-70">
        {duration.toFixed(1)}s
      </span>

      {/* Handle de redimensionnement (côté droit) */}
      <div
        className={cn(
          'absolute top-0 bottom-0 right-0 w-3 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity',
          'hover:bg-amber-400/30 flex items-center justify-center'
        )}
        onMouseDown={handleResizeStart}
        title={t('timeline.dragToExtend')}
      >
        <GripVertical className="w-2 h-2 text-amber-300/70 rotate-90" />
      </div>

      {/* Bouton reset (revenir à durée audio) si étendu */}
      {duration > minDuration && (
        <button
          onClick={() => onDurationChange(minDuration)}
          className="absolute -top-1 -right-1 p-0.5 rounded-full bg-amber-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-400"
          title={t('timeline.resetAudioDuration')}
        >
          <RotateCcw className="w-2.5 h-2.5" />
        </button>
      )}
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
  maxDuration,
  pixelsPerSecond,
  isSelected,
  lane = 0,
  onSelect,
  onTimeRangeChange,
  onDelete,
  onAutoExtend,
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
        // Déplacement du ruban entier - utiliser maxDuration pour permettre le placement au-delà
        const segmentDuration = originalTimeRange.current.endTime - originalTimeRange.current.startTime
        const newStartTime = Math.max(0, Math.min(
          maxDuration - segmentDuration,
          originalTimeRange.current.startTime + deltaTime
        ))
        const newEndTime = newStartTime + segmentDuration
        
        onTimeRangeChange({
          ...timeRange,
          startTime: newStartTime,
          endTime: newEndTime,
        })
        
        // Auto-extension si on dépasse la durée actuelle
        if (newEndTime > duration && onAutoExtend) {
          onAutoExtend(newEndTime)
        }
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
        // Resize côté droit - utiliser maxDuration pour permettre l'extension
        const newEndTime = Math.max(
          timeRange.startTime + 0.5, // Minimum 0.5s
          Math.min(maxDuration, originalTimeRange.current.endTime + deltaTime)
        )
        onTimeRangeChange({
          ...timeRange,
          endTime: newEndTime,
        })
        
        // Auto-extension si on dépasse la durée actuelle
        if (newEndTime > duration && onAutoExtend) {
          onAutoExtend(newEndTime)
        }
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
  }, [isDragging, isResizingLeft, isResizingRight, duration, maxDuration, pixelsPerSecond, timeRange, onTimeRangeChange, onAutoExtend])

  return (
    <div
      ref={rubanRef}
      className={cn(
        'absolute rounded-md cursor-grab transition-shadow flex items-center overflow-hidden',
        isSelected && 'ring-2 ring-white shadow-lg z-20',
        isDragging && 'cursor-grabbing opacity-80 z-30',
        color
      )}
      style={{
        left: leftPx,
        top: topPosition,
        width: Math.max(40, widthPx),
        height: LANE_HEIGHT - 4,
        zIndex: isSelected ? 20 : isDragging ? 30 : 10, // Z-index explicite pour éviter les problèmes de clic
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
  const t = useTranslations('layout')
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
      title={t('timeline.addTrack', { label })}
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
  totalDuration: number // Durée totale incluant le buffer
  currentTime: number
  pixelsPerSecond: number
  rulerScrollRef: React.RefObject<HTMLDivElement>
  playheadRef?: React.RefObject<HTMLDivElement>
  isPlaying?: boolean
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void
  onSeek: (time: number) => void
}

function TimeRulerScrollable({ duration, totalDuration, currentTime, pixelsPerSecond, rulerScrollRef, playheadRef, isPlaying, onScroll, onSeek }: TimeRulerScrollableProps) {
  const t = useTranslations('layout')
  // Handler pour cliquer sur la règle et repositionner la tête de lecture
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left + (rulerScrollRef.current?.scrollLeft || 0)
    // On peut cliquer jusqu'à totalDuration (inclut le buffer)
    const newTime = Math.max(0, Math.min(totalDuration, clickX / pixelsPerSecond))
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
  // Afficher les marques jusqu'à totalDuration (inclut le buffer)
  for (let m = 0; m <= totalDuration; m += markInterval) {
    marks.push(m)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const timelineWidth = totalDuration * pixelsPerSecond
  const playheadPosition = currentTime * pixelsPerSecond
  const bufferStartPx = duration * pixelsPerSecond

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
          title={t('timeline.seekTooltip')}
        >
          {/* Zone de buffer (grisée, après la durée actuelle) */}
          <div 
            className="absolute top-0 bottom-0 bg-midnight-700/30 border-l border-dashed border-midnight-500/50"
            style={{ 
              left: bufferStartPx,
              width: timelineWidth - bufferStartPx,
            }}
            title={t('timeline.bufferZoneTooltip')}
          />
          
          {/* Marques de temps */}
          {marks.map((m) => (
            <div
              key={m}
              className="absolute top-0 bottom-0 flex flex-col items-center"
              style={{ left: m * pixelsPerSecond }}
            >
              <div className={cn(
                "w-px h-2",
                m > duration ? "bg-midnight-600/50" : "bg-midnight-600"
              )} />
              <span className={cn(
                "text-[10px] whitespace-nowrap",
                m > duration ? "text-midnight-600" : "text-midnight-500"
              )}>{formatTime(m)}</span>
            </div>
          ))}

          {/* Playhead - mis à jour via DOM direct pendant la lecture */}
          <div
            ref={playheadRef}
            className="absolute top-0 bottom-0 w-0.5 bg-aurora-400 z-10"
            style={{ 
              left: playheadPosition,
              transition: isPlaying ? 'none' : 'left 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
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
  maxDuration: number  // Durée max de la timeline
  isActive: boolean
  minStartTime: number  // Borne min (fin de la phrase précédente) pour garder l'ordre
  maxEndTime: number    // Borne max (début de la phrase suivante) pour garder l'ordre
  onTimeRangeChange: (timeRange: TimeRange) => void
  onSelect: () => void  // Sélectionner la narration pour ouvrir le panneau de volume
  onDoubleClick: () => void  // Double-clic pour ouvrir le sélecteur de voix
}

function PhraseRuban({
  phrase,
  pixelsPerSecond,
  maxDuration,
  isActive,
  minStartTime,
  maxEndTime,
  onTimeRangeChange,
  onSelect,
  onDoubleClick,
}: PhraseRubanProps) {
  const rubanRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)
  const dragStartX = useRef(0)
  const originalTimeRange = useRef(phrase.timeRange)

  // Position en pixels (positions ABSOLUES sur la timeline)
  const leftPx = phrase.timeRange.startTime * pixelsPerSecond
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
        // Déplacement du ruban entier (contraint entre la phrase précédente et la suivante)
        const segmentDuration = originalTimeRange.current.endTime - originalTimeRange.current.startTime
        const newStartTime = Math.max(minStartTime, Math.min(
          maxEndTime - segmentDuration,
          originalTimeRange.current.startTime + deltaTime
        ))
        onTimeRangeChange({
          startTime: newStartTime,
          endTime: newStartTime + segmentDuration,
        })
      } else if (isResizingLeft) {
        // Resize côté gauche (contraint par la phrase précédente, minimum 0.3s)
        const newStartTime = Math.max(minStartTime, Math.min(
          phrase.timeRange.endTime - 0.3,
          originalTimeRange.current.startTime + deltaTime
        ))
        onTimeRangeChange({
          startTime: newStartTime,
          endTime: phrase.timeRange.endTime,
        })
      } else if (isResizingRight) {
        // Resize côté droit (contraint par la phrase suivante, minimum 0.3s)
        const newEndTime = Math.max(
          phrase.timeRange.startTime + 0.3,
          Math.min(maxEndTime, originalTimeRange.current.endTime + deltaTime)
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
  }, [isDragging, isResizingLeft, isResizingRight, pixelsPerSecond, maxDuration, minStartTime, maxEndTime, phrase.timeRange, onTimeRangeChange])

  // Couleur basée sur le personnage ou défaut
  const bgColor = phrase.characterColor 
    ? `${phrase.characterColor}${isActive ? '99' : '4D'}` // 60% ou 30% opacity
    : undefined

  return (
    <div
      ref={rubanRef}
      className={cn(
        'absolute h-full flex items-center px-2 rounded-md text-xs cursor-grab transition-shadow group',
        !phrase.characterColor && (isActive 
          ? 'bg-amber-500/60 text-white font-medium ring-2 ring-amber-400' 
          : 'bg-amber-500/30 text-amber-200 hover:bg-amber-500/40'),
        phrase.characterColor && (isActive ? 'ring-2 ring-white' : ''),
        isDragging && 'cursor-grabbing opacity-80 ring-2 ring-white'
      )}
      style={{
        left: leftPx,
        width: Math.max(40, widthPx),
        minWidth: 40,
        ...(bgColor && { backgroundColor: bgColor }),
        ...(phrase.characterColor && { color: 'white' }),
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation()
        // Sélectionner seulement si ce n'était pas un drag
        if (!isDragging && !isResizingLeft && !isResizingRight) {
          onSelect()
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        // Double-clic pour changer la voix
        onDoubleClick()
      }}
      title={`${phrase.text}\n⏱ ${phrase.timeRange.startTime.toFixed(1)}s → ${phrase.timeRange.endTime.toFixed(1)}s`}
    >
      {/* Handle resize gauche */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 rounded-l-md"
        onMouseDown={handleResizeLeftStart}
      />
      
      {/* Emoji du personnage (si défini) */}
      {phrase.characterEmoji && (
        <span className="mr-1 text-sm">{phrase.characterEmoji}</span>
      )}
      
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
  maxDuration,
  onPhraseTimeRangeChange,
  onSelectPhrase,
  onDoubleClickPhrase,
}: { 
  phrases: PhraseTiming[]
  pixelsPerSecond: number
  timelineWidth: number
  activePhraseIndex: number
  maxDuration: number  // Durée max de la timeline
  onPhraseTimeRangeChange: (phraseId: string, timeRange: TimeRange) => void
  onSelectPhrase: (phraseId: string) => void  // Ouvrir le panneau de style de la phrase
  onDoubleClickPhrase: (phraseId: string) => void  // Double-clic pour changer la voix
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
      
      {/* Zone des rubans (scrollable via le container parent) - positions ABSOLUES */}
      <div className="flex-1 h-full relative" style={{ minWidth: timelineWidth }}>
        {phrases.map((phrase, index) => {
          // Bornes pour garder l'ordre des phrases : ne pas dépasser la phrase précédente/suivante
          const prevPhrase = index > 0 ? phrases[index - 1] : null
          const nextPhrase = index < phrases.length - 1 ? phrases[index + 1] : null
          const minStartTime = prevPhrase ? prevPhrase.timeRange.endTime : 0
          const maxEndTime = nextPhrase ? nextPhrase.timeRange.startTime : maxDuration

          return (
            <PhraseRuban
              key={phrase.id}
              phrase={phrase}
              pixelsPerSecond={pixelsPerSecond}
              maxDuration={maxDuration}
              isActive={index === activePhraseIndex}
              minStartTime={minStartTime}
              maxEndTime={maxEndTime}
              onTimeRangeChange={(timeRange) => onPhraseTimeRangeChange(phrase.id, timeRange)}
              onSelect={() => onSelectPhrase(phrase.id)}
              onDoubleClick={() => onDoubleClickPhrase(phrase.id)}
            />
          )
        })}
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
  const t = useTranslations('layout')
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
    setNarrationZoneDuration,
    updatePhraseTiming,
  } = useMontageStore()

  const scene = getCurrentScene()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const playedSoundsRef = useRef<Set<string>>(new Set()) // Sons déjà joués
  const lastTimeRef = useRef<number>(0)
  const lastStateUpdateRef = useRef<number>(0) // Pour throttle les updates du state
  
  // Refs pour les playheads (mise à jour DOM directe pour fluidité)
  const playheadMainRef = useRef<HTMLDivElement>(null)
  const playheadRulerRef = useRef<HTMLDivElement>(null)
  
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
    const scrollLeft = e.currentTarget.scrollLeft
    if (rulerScrollRef.current && !isPlaying) {
      rulerScrollRef.current.scrollLeft = scrollLeft
    }
  }, [isPlaying])
  
  const handleRulerScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft
    if (scrollContainerRef.current && !isPlaying) {
      scrollContainerRef.current.scrollLeft = scrollLeft
    }
  }, [isPlaying])
  
  // Ouvrir le modal pour un type d'élément
  const openAddModal = useCallback((type: ModalElementType) => {
    setModalType(type)
    setModalOpen(true)
  }, [])

  // Durées intro/outro/narration
  const introDuration = scene?.introDuration || 0
  const outroDuration = scene?.outroDuration || 0
  // Utiliser narrationZoneDuration si défini (permet d'étendre la zone), sinon durée de l'audio
  const audioNarrationDuration = scene?.narration?.duration || scene?.duration || 10
  const narrationDuration = scene?.narrationZoneDuration || audioNarrationDuration
  
  // Durée totale de la scène (intro + narration + outro)
  const duration = introDuration + narrationDuration + outroDuration
  
  // Ref pour tracker la phrase actuellement jouée
  const currentPhraseRef = useRef<string | null>(null)
  const playbackStartTimeRef = useRef<number>(0)
  
  // Refs pour les sons et musiques actifs (pour pouvoir les arrêter)
  const activeSoundRefs = useRef<Map<string, HTMLAudioElement>>(new Map())
  const activeMusicRefs = useRef<Map<string, HTMLAudioElement>>(new Map())

  // Calculer le volume avec fade in/out
  const calculateFadedVolume = useCallback((
    currentTime: number,
    startTime: number,
    endTime: number,
    baseVolume: number,
    fadeIn: number = 0,
    fadeOut: number = 0
  ): number => {
    const positionInTrack = currentTime - startTime
    const trackDuration = endTime - startTime
    
    let volumeMultiplier = 1
    
    // Fade In : du début jusqu'à fadeIn secondes après le début
    if (fadeIn > 0 && positionInTrack < fadeIn) {
      volumeMultiplier = Math.min(1, positionInTrack / fadeIn)
    }
    
    // Fade Out : à partir de (durée - fadeOut) jusqu'à la fin
    if (fadeOut > 0 && positionInTrack > (trackDuration - fadeOut)) {
      const fadeOutPosition = positionInTrack - (trackDuration - fadeOut)
      volumeMultiplier = Math.max(0, 1 - (fadeOutPosition / fadeOut))
    }
    
    return baseVolume * volumeMultiplier
  }, [])

  // Vérifier et jouer les sons qui doivent démarrer
  const checkAndPlaySounds = useCallback((currentTime: number, previousTime: number) => {
    if (!scene?.soundTracks || scene.soundTracks.length === 0) return
    
    scene.soundTracks.forEach((sound) => {
      const soundKey = `${sound.id}-${sound.timeRange.startTime}`
      const isInSoundRange = currentTime >= sound.timeRange.startTime && currentTime < sound.timeRange.endTime
      const justCrossedStart = currentTime >= sound.timeRange.startTime && previousTime < sound.timeRange.startTime
      const alreadyPlayed = playedSoundsRef.current.has(soundKey)
      const isCurrentlyPlaying = activeSoundRefs.current.has(soundKey)
      
      // Le son doit démarrer si:
      // 1. On vient de passer son startTime (justCrossedStart)
      // 2. OU on est dans sa plage et il n'a pas été joué/n'est pas en cours (pour le cas du seek)
      const shouldStart = !alreadyPlayed && !isCurrentlyPlaying && (justCrossedStart || isInSoundRange)
      
      if (shouldStart && sound.url) {
        // Marquer comme joué
        playedSoundsRef.current.add(soundKey)
        
        // Calculer où commencer dans le son (si on a seeké au milieu)
        const offsetInSound = isInSoundRange && !justCrossedStart 
          ? currentTime - sound.timeRange.startTime 
          : 0
        
        // Jouer le vrai fichier audio MP3
        try {
          const audio = new Audio(sound.url)
          
          // Volume initial avec fade
          const baseVolume = sound.volume ?? 0.7
          const fadeIn = sound.timeRange.fadeIn ?? 0
          const fadeOut = sound.timeRange.fadeOut ?? 0
          const initialVolume = calculateFadedVolume(
            currentTime, 
            sound.timeRange.startTime, 
            sound.timeRange.endTime, 
            baseVolume, 
            fadeIn, 
            fadeOut
          )
          audio.volume = initialVolume
          
          // Si on a seeké au milieu du son, commencer à la bonne position
          if (offsetInSound > 0) {
            audio.currentTime = offsetInSound
          }
          
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
            console.log('🔊 Son joué:', sound.name, 'à', currentTime.toFixed(2) + 's', 'volume:', Math.round(initialVolume * 100) + '%', fadeIn > 0 ? `(fadeIn: ${fadeIn}s)` : '', offsetInSound > 0 ? `(offset: ${offsetInSound.toFixed(2)}s)` : '')
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
      
      // Synchroniser le volume en temps réel avec fades (si le son est actif)
      const activeAudio = activeSoundRefs.current.get(soundKey)
      if (activeAudio && !activeAudio.paused) {
        const baseVolume = sound.volume ?? 0.7
        const fadeIn = sound.timeRange.fadeIn ?? 0
        const fadeOut = sound.timeRange.fadeOut ?? 0
        const targetVolume = calculateFadedVolume(
          currentTime, 
          sound.timeRange.startTime, 
          sound.timeRange.endTime, 
          baseVolume, 
          fadeIn, 
          fadeOut
        )
        
        // Mettre à jour le volume (avec fades)
        if (Math.abs(activeAudio.volume - targetVolume) > 0.01) {
          activeAudio.volume = targetVolume
        }
      }
      
      // Arrêter le son si on a dépassé son endTime
      if (currentTime >= sound.timeRange.endTime) {
        if (activeAudio && !activeAudio.paused) {
          activeAudio.pause()
          activeSoundRefs.current.delete(soundKey)
        }
      }
    })
  }, [scene?.soundTracks, calculateFadedVolume])

  // Vérifier et jouer les musiques qui doivent démarrer
  const checkAndPlayMusic = useCallback((currentTime: number, previousTime: number) => {
    const musicTracks = (scene as any)?.musicTracks as MusicTrack[] | undefined
    if (!musicTracks || musicTracks.length === 0) return
    
    musicTracks.forEach((music) => {
      const musicKey = `music-${music.id}`
      const isInMusicRange = currentTime >= music.timeRange.startTime && currentTime < music.timeRange.endTime
      const justCrossedStart = currentTime >= music.timeRange.startTime && previousTime < music.timeRange.startTime
      const isCurrentlyPlaying = activeMusicRefs.current.has(musicKey) && !activeMusicRefs.current.get(musicKey)?.paused
      
      // Démarrer la musique si on entre dans sa plage
      if (isInMusicRange && !isCurrentlyPlaying && music.url) {
        const offsetInMusic = currentTime - music.timeRange.startTime
        
        try {
          // Réutiliser l'audio existant si possible
          let audio = activeMusicRefs.current.get(musicKey)
          if (!audio) {
            audio = new Audio(music.url)
            activeMusicRefs.current.set(musicKey, audio)
          }
          
          // Volume initial avec fade
          const baseVolume = music.volume ?? 0.5
          const fadeIn = music.timeRange.fadeIn ?? 0
          const fadeOut = music.timeRange.fadeOut ?? 0
          const initialVolume = calculateFadedVolume(
            currentTime, 
            music.timeRange.startTime, 
            music.timeRange.endTime, 
            baseVolume, 
            fadeIn, 
            fadeOut
          )
          audio.volume = initialVolume
          audio.loop = music.loop ?? false
          
          // Positionner au bon endroit si on a seeké
          if (offsetInMusic > 0.1) {
            audio.currentTime = offsetInMusic
          }
          
          audio.play().then(() => {
            console.log('🎵 Musique jouée:', music.name, 'à', currentTime.toFixed(2) + 's', 'vol:', Math.round(initialVolume * 100) + '%', fadeIn > 0 ? `(fadeIn: ${fadeIn}s)` : '')
          }).catch((err) => {
            console.warn('⚠️ Erreur lecture musique:', music.name, err)
          })
        } catch (err) {
          console.warn('⚠️ Erreur création audio musique:', music.name, err)
        }
      }
      
      // Synchroniser le volume avec fades en temps réel
      if (isInMusicRange) {
        const activeAudio = activeMusicRefs.current.get(musicKey)
        if (activeAudio && !activeAudio.paused) {
          const baseVolume = music.volume ?? 0.5
          const fadeIn = music.timeRange.fadeIn ?? 0
          const fadeOut = music.timeRange.fadeOut ?? 0
          const targetVolume = calculateFadedVolume(
            currentTime, 
            music.timeRange.startTime, 
            music.timeRange.endTime, 
            baseVolume, 
            fadeIn, 
            fadeOut
          )
          
          // Mettre à jour le volume (avec fades)
          if (Math.abs(activeAudio.volume - targetVolume) > 0.01) {
            activeAudio.volume = targetVolume
          }
        }
      }
      
      // Mettre en pause si on sort de la plage
      if (!isInMusicRange) {
        const activeAudio = activeMusicRefs.current.get(musicKey)
        if (activeAudio && !activeAudio.paused) {
          activeAudio.pause()
        }
      }
    })
  }, [scene, calculateFadedVolume])
  
  // Synchroniser les volumes des sons/musiques actifs avec le store
  // (quand on change le volume dans le panneau de propriétés)
  useEffect(() => {
    // Mettre à jour le volume des sons actifs
    if (scene?.soundTracks) {
      scene.soundTracks.forEach((sound) => {
        const soundKey = `${sound.id}-${sound.timeRange.startTime}`
        const activeAudio = activeSoundRefs.current.get(soundKey)
        if (activeAudio) {
          activeAudio.volume = sound.volume ?? 0.7
        }
      })
    }
    
    // Mettre à jour le volume des musiques actives
    const musicTracks = (scene as any)?.musicTracks as MusicTrack[] | undefined
    if (musicTracks) {
      musicTracks.forEach((music) => {
        const musicKey = `music-${music.id}`
        const activeAudio = activeMusicRefs.current.get(musicKey)
        if (activeAudio) {
          activeAudio.volume = music.volume ?? 0.5
        }
      })
    }
    
    // Mettre à jour le volume de la narration (voix)
    if (audioRef.current && scene?.narration) {
      audioRef.current.volume = scene.narration.volume ?? 1
    }
  }, [scene?.soundTracks, (scene as any)?.musicTracks, scene?.narration?.volume])
  
  // Trouver quelle phrase jouer à un moment donné sur la timeline
  // Les phrases ont maintenant des positions ABSOLUES sur la timeline
  const findPhraseAtTime = useCallback((timelineTime: number) => {
    const phrases = scene?.narration?.phrases || []
    
    return phrases.find(p => 
      timelineTime >= p.timeRange.startTime && 
      timelineTime < p.timeRange.endTime
    ) || null
  }, [scene?.narration?.phrases])
  
  // Repositionner la tête de lecture (seek)
  const handleSeek = useCallback((time: number) => {
    setPlaybackTime(time)
    
    // Réinitialiser les sons qui sont APRÈS la nouvelle position (pour qu'ils puissent rejouer)
    if (scene?.soundTracks) {
      scene.soundTracks.forEach((sound) => {
        const soundKey = `${sound.id}-${sound.timeRange.startTime}`
        // Si on seek avant le début du son, le réinitialiser pour qu'il puisse rejouer
        if (time < sound.timeRange.startTime) {
          playedSoundsRef.current.delete(soundKey)
        }
        // Aussi réinitialiser si on seek AU DÉBUT du son (pour rejouer immédiatement)
        if (time <= sound.timeRange.startTime + 0.1) {
          playedSoundsRef.current.delete(soundKey)
        }
      })
    }
    
    // Arrêter les sons actifs qui ne sont plus dans leur plage
    activeSoundRefs.current.forEach((audio, soundKey) => {
      const soundId = soundKey.split('-')[0]
      const sound = scene?.soundTracks?.find(s => s.id === soundId)
      if (sound && (time < sound.timeRange.startTime || time >= sound.timeRange.endTime)) {
        audio.pause()
        activeSoundRefs.current.delete(soundKey)
      }
    })
    
    // Si on est en lecture, redémarrer depuis la nouvelle position
    if (isPlaying) {
      // Arrêter la lecture actuelle
      audioRef.current?.pause()
      currentPhraseRef.current = null
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      
      // Redémarrer depuis la nouvelle position
      playbackStartTimeRef.current = performance.now()
      lastTimeRef.current = time
      
      // Trouver si on est sur une phrase et jouer son audio
      const activePhrase = findPhraseAtTime(time)
      if (activePhrase && audioRef.current) {
        const audioRange = activePhrase.audioTimeRange || activePhrase.timeRange
        // Offset dans la phrase = temps actuel - début de la phrase sur la timeline
        const phraseOffset = time - activePhrase.timeRange.startTime
        audioRef.current.currentTime = Math.max(0, audioRange.startTime + phraseOffset)
        // Appliquer le volume de la phrase (combiné avec le volume global de narration)
        const narrationVolume = scene?.narration?.volume ?? 1
        const phraseVolume = activePhrase.volume ?? 1
        audioRef.current.volume = Math.min(1, narrationVolume * phraseVolume)
        audioRef.current.play().catch(() => {})
        currentPhraseRef.current = activePhrase.id
      }
      
      // Relancer l'animation de mise à jour
      const updateTime = () => {
        const elapsed = (performance.now() - playbackStartTimeRef.current) / 1000
        const timelineTime = lastTimeRef.current + elapsed
        
        if (timelineTime >= duration) {
      setIsPlaying(false)
          setPlaybackTime(0)
          playedSoundsRef.current.clear()
          currentPhraseRef.current = null
          audioRef.current?.pause()
          return
        }
        
        const phrase = findPhraseAtTime(timelineTime)
        
        if (phrase && audioRef.current) {
          if (currentPhraseRef.current !== phrase.id) {
            currentPhraseRef.current = phrase.id
            const audioRange = phrase.audioTimeRange || phrase.timeRange
            // Offset dans la phrase = temps actuel - début de la phrase
            const phraseOffset = timelineTime - phrase.timeRange.startTime
            audioRef.current.currentTime = Math.max(0, audioRange.startTime + phraseOffset)
            audioRef.current.play().catch(() => {})
          }
          // Vérifier si on a dépassé la fin de la phrase
          if (timelineTime >= phrase.timeRange.endTime) {
            audioRef.current.pause()
            currentPhraseRef.current = null
          }
        } else if (!phrase && audioRef.current) {
          audioRef.current.pause()
          currentPhraseRef.current = null
        }
        
        checkAndPlaySounds(timelineTime, lastTimeRef.current + elapsed - (1/60))
        checkAndPlayMusic(timelineTime, lastTimeRef.current + elapsed - (1/60))
        
        // Mise à jour directe du DOM pour le playhead (sans compensation du scroll car il est dans le conteneur scrollable)
        const playheadLeft = LABEL_WIDTH + (timelineTime * pixelsPerSecond)
        
        if (playheadMainRef.current) {
          playheadMainRef.current.style.left = `${playheadLeft}px`
        }
        if (playheadRulerRef.current) {
          playheadRulerRef.current.style.left = `${timelineTime * pixelsPerSecond}px`
        }
        
        const now = performance.now()
        if (now - lastStateUpdateRef.current > 100) {
          lastStateUpdateRef.current = now
          setPlaybackTime(timelineTime)
        }
        
        animationRef.current = requestAnimationFrame(updateTime)
      }
      animationRef.current = requestAnimationFrame(updateTime)
    }
  }, [setPlaybackTime, isPlaying, setIsPlaying, findPhraseAtTime, duration, checkAndPlaySounds, checkAndPlayMusic, pixelsPerSecond])
  
  // Durée totale AVEC le buffer (pour l'affichage et le placement d'éléments)
  const durationWithBuffer = duration + BUFFER_DURATION
  
  // Largeur totale de la timeline en pixels (inclut le buffer)
  const timelineWidth = durationWithBuffer * pixelsPerSecond
  
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
  
  // Auto-extension de la timeline quand un élément dépasse la durée actuelle
  const handleAutoExtend = useCallback((newEndTime: number) => {
    // Calculer de combien on doit étendre l'outro
    const currentEnd = introDuration + narrationDuration + outroDuration
    if (newEndTime > currentEnd) {
      const extraTime = newEndTime - currentEnd
      // Arrondir à 0.5s près pour éviter les micro-ajustements
      const newOutroDuration = outroDuration + Math.ceil(extraTime * 2) / 2
      setOutroDuration(newOutroDuration)
    }
  }, [introDuration, narrationDuration, outroDuration, setOutroDuration])
  
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

  // Phrase active - maintenant les timeRange sont ABSOLUS sur la timeline
  const activePhrase = scene ? getActivePhrase(currentPlaybackTime) : null
  const activePhraseIndex = activePhrase ? activePhrase.index : -1

  // Playback basé sur les segments de phrases
  const togglePlayback = useCallback(() => {
    if (!scene?.narration?.audioUrl) return

    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
      currentPhraseRef.current = null
      // Arrêter tous les sons actifs
      activeSoundRefs.current.forEach((audio) => {
        audio.pause()
      })
      activeSoundRefs.current.clear()
      // Arrêter toutes les musiques actives
      activeMusicRefs.current.forEach((audio) => {
        audio.pause()
      })
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
      }
      
      // Appliquer le volume de la narration
      audioRef.current.volume = scene.narration?.volume ?? 1
      
      // Démarrer le playhead depuis la position actuelle
      playbackStartTimeRef.current = performance.now()
      lastTimeRef.current = currentPlaybackTime
      currentPhraseRef.current = null
      
      setIsPlaying(true)

      // Lecture basée sur le temps réel de la timeline
      const updateTime = () => {
        const elapsed = (performance.now() - playbackStartTimeRef.current) / 1000
        const timelineTime = lastTimeRef.current + elapsed
        
        // Vérifier si on a dépassé la fin de la timeline
        if (timelineTime >= duration) {
          setIsPlaying(false)
          setPlaybackTime(0)
          playedSoundsRef.current.clear()
          currentPhraseRef.current = null
        if (audioRef.current) {
            audioRef.current.pause()
          }
          return
        }
        
        // Trouver la phrase active à ce moment
        const activePhrase = findPhraseAtTime(timelineTime)
        
        if (activePhrase && audioRef.current) {
          // Si on entre dans une nouvelle phrase, jouer son segment audio
          if (currentPhraseRef.current !== activePhrase.id) {
            currentPhraseRef.current = activePhrase.id
            
            // Si la phrase a un audio personnalisé (voix de personnage), l'utiliser
            if (activePhrase.customAudioUrl) {
              // Créer un nouvel audio pour la phrase avec voix personnalisée
              const customAudio = new Audio(activePhrase.customAudioUrl)
              const narrationVolume = scene?.narration?.volume ?? 1
              const phraseVolume = activePhrase.volume ?? 1
              customAudio.volume = Math.min(1, narrationVolume * phraseVolume)
              customAudio.play().catch(() => {})
              
              // Stocker la référence pour pouvoir l'arrêter
              const prevAudioRef = audioRef.current
              audioRef.current = customAudio
              
              // Quand l'audio personnalisé se termine, revenir à l'audio original
              customAudio.onended = () => {
                if (audioRef.current === customAudio) {
                  audioRef.current = prevAudioRef
                  currentPhraseRef.current = null
                }
              }
            } else {
              // Utiliser l'audio original avec audioTimeRange
              const audioRange = activePhrase.audioTimeRange || activePhrase.timeRange
              
              // Offset dans la phrase = temps actuel - début de la phrase sur la timeline
              const phraseOffset = timelineTime - activePhrase.timeRange.startTime
              
              // Calculer où commencer dans l'audio original
              const audioStartTime = audioRange.startTime + phraseOffset
              
              // Appliquer le volume de la phrase (combiné avec le volume global de narration)
              const narrationVolume = scene?.narration?.volume ?? 1
              const phraseVolume = activePhrase.volume ?? 1
              audioRef.current.volume = Math.min(1, narrationVolume * phraseVolume)
              
              audioRef.current.currentTime = Math.max(0, audioStartTime)
              audioRef.current.play().catch(() => {})
            }
          }
          
          // Vérifier si on a dépassé la fin de la phrase
          if (timelineTime >= activePhrase.timeRange.endTime) {
            audioRef.current.pause()
            currentPhraseRef.current = null
          }
        } else if (!activePhrase && audioRef.current) {
          // Pas de phrase active, mettre l'audio en pause
          audioRef.current.pause()
          currentPhraseRef.current = null
        }
        
        // Vérifier si des sons/musiques doivent être joués
        checkAndPlaySounds(timelineTime, lastTimeRef.current + elapsed - (1/60))
        checkAndPlayMusic(timelineTime, lastTimeRef.current + elapsed - (1/60))
        
        // Mise à jour DIRECTE du DOM pour le playhead (sans compensation du scroll car il est dans le conteneur scrollable)
        const playheadLeft = LABEL_WIDTH + (timelineTime * pixelsPerSecond)
          
        if (playheadMainRef.current) {
          playheadMainRef.current.style.left = `${playheadLeft}px`
        }
        if (playheadRulerRef.current) {
          playheadRulerRef.current.style.left = `${timelineTime * pixelsPerSecond}px`
        }
          
          // Throttle: mettre à jour le state React seulement toutes les 100ms
          const now = performance.now()
          if (now - lastStateUpdateRef.current > 100) {
            lastStateUpdateRef.current = now
          setPlaybackTime(timelineTime)
          }
          
          animationRef.current = requestAnimationFrame(updateTime)
      }
      animationRef.current = requestAnimationFrame(updateTime)
    }
  }, [scene, isPlaying, currentPlaybackTime, setIsPlaying, setPlaybackTime, checkAndPlaySounds, checkAndPlayMusic, pixelsPerSecond, duration, findPhraseAtTime])

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
      // Arrêter toutes les musiques actives
      activeMusicRefs.current.forEach((audio) => {
        audio.pause()
      })
      activeMusicRefs.current.clear()
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
        <p className="text-midnight-400">{t('timeline.selectScene')}</p>
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
          {t('timeline.sceneHeader', { index: currentSceneIndex + 1 })}
          {isFullscreen && <span className="text-xs text-midnight-500 ml-2">({t('timeline.fullscreenLabel')})</span>}
        </h3>

        <div className="flex items-center gap-4">
          {/* Contrôles de zoom */}
          <div className="flex items-center gap-1 bg-midnight-800/50 rounded-lg p-1">
            <button
              onClick={zoomOut}
              className="p-1.5 rounded hover:bg-midnight-700/50 text-midnight-400 hover:text-white transition-colors"
              title={t('timeline.zoom.out')}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={zoomFit}
              className="p-1.5 rounded hover:bg-midnight-700/50 text-midnight-400 hover:text-white transition-colors"
              title={t('timeline.zoom.fit')}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={zoomIn}
              className="p-1.5 rounded hover:bg-midnight-700/50 text-midnight-400 hover:text-white transition-colors"
              title={t('timeline.zoom.in')}
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
            title={isFullscreen ? t('timeline.exitFullscreen') : t('timeline.fullscreen')}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Fullscreen className="w-4 h-4" />}
          </button>

          {/* Contrôles de lecture */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlayback}
              disabled={!scene?.narration?.audioUrl}
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
        totalDuration={durationWithBuffer}
        currentTime={currentPlaybackTime} 
        pixelsPerSecond={pixelsPerSecond}
        rulerScrollRef={rulerScrollRef}
        playheadRef={playheadRulerRef}
        isPlaying={isPlaying}
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
              // Permettre de cliquer jusqu'au buffer
              const newTime = Math.max(0, Math.min(durationWithBuffer, clickX / pixelsPerSecond))
              handleSeek(newTime)
            }
          }
          clearSelection()
        }}
        onScroll={handleTracksScroll}
      >
        {/* Playhead vertical qui traverse toutes les pistes */}
        <div 
          ref={playheadMainRef}
          className="absolute top-0 bottom-0 w-0.5 bg-aurora-400 z-50 pointer-events-none shadow-lg shadow-aurora-400/50"
          style={{ 
            left: LABEL_WIDTH + (currentPlaybackTime * pixelsPerSecond),
            transition: isPlaying ? 'none' : 'left 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
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
            <span className="truncate flex-1">{t('timeline.tracks.structure')}</span>
            {/* Boutons d'ajout intro/outro */}
            <div className="flex gap-0.5">
              {introDuration === 0 && (
                <button
                  onClick={() => setIntroDuration(3)}
                  className="p-0.5 rounded bg-emerald-500/50 hover:bg-emerald-500 text-white transition-colors"
                  title={t('timeline.addIntro')}
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              )}
              {outroDuration === 0 && (
                <button
                  onClick={() => setOutroDuration(3)}
                  className="p-0.5 rounded bg-violet-500/50 hover:bg-violet-500 text-white transition-colors"
                  title={t('timeline.addOutro')}
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
            
            {/* Zone Narration (redimensionnable à droite) */}
            {narrationDuration > 0 && (
              <NarrationZone
                duration={narrationDuration}
                minDuration={audioNarrationDuration}
                pixelsPerSecond={pixelsPerSecond}
                startOffset={introDuration}
                onDurationChange={setNarrationZoneDuration}
              />
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

        {/* Piste des phrases (positions ABSOLUES - peuvent être n'importe où sur la timeline) */}
        {scene.narration?.isSynced && (scene.narration?.phrases?.length || 0) > 0 && (
          <PhrasesTrackScrollable
            phrases={scene.narration?.phrases || []}
            pixelsPerSecond={pixelsPerSecond}
            timelineWidth={timelineWidth}
            activePhraseIndex={activePhraseIndex}
            maxDuration={durationWithBuffer}
            onPhraseTimeRangeChange={(phraseId, timeRange) => 
              updatePhraseTiming(phraseId, { timeRange })
            }
            onSelectPhrase={(phraseId) => setSelectedTrack(phraseId, 'phrase')}
            onDoubleClickPhrase={(phraseId) => setSelectedTrack(phraseId, 'phrase')}
          />
        )}

        {/* Piste Vidéo/Images */}
        {(() => {
          const tracks = scene.mediaTracks || []
          const lanes = calculateLanes(tracks.map(t => ({ id: t.id, startTime: t.timeRange.startTime, endTime: t.timeRange.endTime })))
          const laneCount = countLanes(tracks.map(t => ({ id: t.id, startTime: t.timeRange.startTime, endTime: t.timeRange.endTime })))
          return (
            <TrackRowScrollable
              label={t('timeline.tracks.medias')}
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
                  maxDuration={durationWithBuffer}
                  pixelsPerSecond={pixelsPerSecond}
                  isSelected={selectedTrackId === track.id && selectedTrackType === 'media'}
                  lane={lanes.get(track.id) || 0}
                  onSelect={() => setSelectedTrack(track.id, 'media')}
                  onTimeRangeChange={(tr) => updateMediaTrack(track.id, { timeRange: tr })}
                  onDelete={() => deleteMediaTrack(track.id)}
                  onAutoExtend={handleAutoExtend}
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
              label={t('timeline.tracks.musique')}
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
                  maxDuration={durationWithBuffer}
                  pixelsPerSecond={pixelsPerSecond}
                  isSelected={selectedTrackId === track.id && selectedTrackType === 'music'}
                  lane={lanes.get(track.id) || 0}
                  onSelect={() => setSelectedTrack(track.id, 'music')}
                  onTimeRangeChange={(tr) => updateMusicTrack(track.id, { timeRange: tr })}
                  onDelete={() => deleteMusicTrack(track.id)}
                  onAutoExtend={handleAutoExtend}
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
              label={t('timeline.tracks.sons')}
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
                  maxDuration={durationWithBuffer}
                  pixelsPerSecond={pixelsPerSecond}
                  isSelected={selectedTrackId === track.id && selectedTrackType === 'sound'}
                  lane={lanes.get(track.id) || 0}
                  onSelect={() => setSelectedTrack(track.id, 'sound')}
                  onTimeRangeChange={(tr) => updateSoundTrack(track.id, { timeRange: tr })}
                  onDelete={() => deleteSoundTrack(track.id)}
                  onAutoExtend={handleAutoExtend}
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
              label={t('timeline.tracks.lumieres')}
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
                  label={`${getColorName(track.color, t)} ${track.intensity}%`}
                  icon={<Lightbulb className="w-3 h-3" />}
                  color="bg-yellow-500"
                  timeRange={track.timeRange}
                  duration={duration}
                  maxDuration={durationWithBuffer}
                  pixelsPerSecond={pixelsPerSecond}
                  isSelected={selectedTrackId === track.id && selectedTrackType === 'light'}
                  lane={lanes.get(track.id) || 0}
                  onSelect={() => setSelectedTrack(track.id, 'light')}
                  onTimeRangeChange={(tr) => updateLightTrack(track.id, { timeRange: tr })}
                  onDelete={() => deleteLightTrack(track.id)}
                  onAutoExtend={handleAutoExtend}
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
              label={t('timeline.tracks.deco')}
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
                  maxDuration={durationWithBuffer}
                  pixelsPerSecond={pixelsPerSecond}
                  isSelected={selectedTrackId === track.id && selectedTrackType === 'decoration'}
                  lane={lanes.get(track.id) || 0}
                  onSelect={() => setSelectedTrack(track.id, 'decoration')}
                  onTimeRangeChange={(tr) => updateDecorationTrack(track.id, { timeRange: tr })}
                  onDelete={() => deleteDecorationTrack(track.id)}
                  onAutoExtend={handleAutoExtend}
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
              label={t('timeline.tracks.anim')}
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
                  maxDuration={durationWithBuffer}
                  pixelsPerSecond={pixelsPerSecond}
                  isSelected={selectedTrackId === track.id && selectedTrackType === 'animation'}
                  lane={lanes.get(track.id) || 0}
                  onSelect={() => setSelectedTrack(track.id, 'animation')}
                  onTimeRangeChange={(tr) => updateAnimationTrack(track.id, { timeRange: tr })}
                  onDelete={() => deleteAnimationTrack(track.id)}
                  onAutoExtend={handleAutoExtend}
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
              label={t('timeline.tracks.effets')}
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
                  maxDuration={durationWithBuffer}
                  pixelsPerSecond={pixelsPerSecond}
                  isSelected={selectedTrackId === effect.id && selectedTrackType === 'effect'}
                  lane={lanes.get(effect.id) || 0}
                  onSelect={() => setSelectedTrack(effect.id, 'effect')}
                  onTimeRangeChange={(tr) => updateTextEffect(effect.id, { timeRange: tr })}
                  onDelete={() => deleteTextEffect(effect.id)}
                  onAutoExtend={handleAutoExtend}
                />
              ))}
            </TrackRowScrollable>
          )
        })()}
      </div>

      {/* Info */}
      <div className="px-3 pb-3">
        <p className="text-xs text-midnight-500 text-center">
          {t('timeline.dragHint')}
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
