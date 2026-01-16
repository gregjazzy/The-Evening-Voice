'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLayoutStore, type TextBlock, type MediaLayer, type OpacityKeyframe } from '@/store/useLayoutStore'
import { cn } from '@/lib/utils'
import { Move, RotateCw, Maximize2, Play, Pause } from 'lucide-react'

// Fonction pour interpoler l'opacité basée sur les keyframes
function interpolateOpacity(keyframes: OpacityKeyframe[], currentTime: number, baseOpacity: number): number {
  if (!keyframes || keyframes.length === 0) return baseOpacity
  
  const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time)
  
  // Si avant le premier keyframe
  if (currentTime <= sortedKeyframes[0].time) {
    return sortedKeyframes[0].value
  }
  
  // Si après le dernier keyframe
  if (currentTime >= sortedKeyframes[sortedKeyframes.length - 1].time) {
    return sortedKeyframes[sortedKeyframes.length - 1].value
  }
  
  // Trouver les deux keyframes encadrant
  for (let i = 0; i < sortedKeyframes.length - 1; i++) {
    const kf1 = sortedKeyframes[i]
    const kf2 = sortedKeyframes[i + 1]
    
    if (currentTime >= kf1.time && currentTime <= kf2.time) {
      // Interpolation linéaire (on peut améliorer avec easing)
      const progress = (currentTime - kf1.time) / (kf2.time - kf1.time)
      
      // Appliquer l'easing
      let easedProgress = progress
      switch (kf2.easing) {
        case 'ease-in':
          easedProgress = progress * progress
          break
        case 'ease-out':
          easedProgress = 1 - (1 - progress) * (1 - progress)
          break
        case 'ease-in-out':
          easedProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2
          break
        default:
          easedProgress = progress
      }
      
      return kf1.value + (kf2.value - kf1.value) * easedProgress
    }
  }
  
  return baseOpacity
}

// Composant pour afficher une vidéo avec effets
interface VideoLayerProps {
  layer: MediaLayer
  isSelected: boolean
  onSelect: () => void
  isPlaying: boolean
}

function VideoLayerComponent({ layer, isSelected, onSelect, isPlaying }: VideoLayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [computedOpacity, setComputedOpacity] = useState(layer.opacity)
  const { updateMediaLayer, setIsDragging } = useLayoutStore()
  const [isDragging, setLocalDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; layerX: number; layerY: number }>()
  
  // Mettre à jour l'opacité basée sur les keyframes
  useEffect(() => {
    if (!layer.videoEffects?.opacityKeyframes?.length) {
      setComputedOpacity(layer.opacity)
      return
    }
    
    const newOpacity = interpolateOpacity(
      layer.videoEffects.opacityKeyframes,
      currentTime,
      layer.opacity
    )
    setComputedOpacity(newOpacity)
  }, [currentTime, layer.videoEffects?.opacityKeyframes, layer.opacity])
  
  // Gérer la lecture/pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }, [isPlaying])
  
  // Mettre à jour le temps courant
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }
    
    video.addEventListener('timeupdate', handleTimeUpdate)
    return () => video.removeEventListener('timeupdate', handleTimeUpdate)
  }, [])
  
  // Drag handling
  const handleDragStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
    setLocalDragging(true)
    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      layerX: layer.x,
      layerY: layer.y,
    }
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current) return
      const deltaX = ((moveEvent.clientX - dragRef.current.startX) / 6.4) // Ajuster selon le zoom
      const deltaY = ((moveEvent.clientY - dragRef.current.startY) / 3.6)
      updateMediaLayer(layer.id, {
        x: Math.max(0, Math.min(100 - layer.width, dragRef.current.layerX + deltaX)),
        y: Math.max(0, Math.min(100 - layer.height, dragRef.current.layerY + deltaY)),
      })
    }
    
    const handleMouseUp = () => {
      setLocalDragging(false)
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }
  
  return (
    <div
      className={cn(
        'absolute cursor-move transition-shadow',
        isSelected && 'ring-2 ring-aurora-500 ring-offset-2 ring-offset-transparent'
      )}
      style={{
        left: `${layer.x}%`,
        top: `${layer.y}%`,
        width: `${layer.width}%`,
        height: `${layer.height}%`,
        opacity: computedOpacity,
        zIndex: layer.zIndex + 10,
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onMouseDown={handleDragStart}
    >
      <video
        ref={videoRef}
        src={layer.url}
        className="w-full h-full object-cover rounded-lg"
        loop={layer.videoEffects?.loop ?? true}
        muted={layer.videoEffects?.muted ?? true}
        playsInline
      />
      
      {/* Indicateur de sélection */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-aurora-500 text-white text-[10px] font-medium">
          {Math.round(computedOpacity * 100)}%
        </div>
      )}
    </div>
  )
}

interface DraggableTextBlockProps {
  block: TextBlock
  isSelected: boolean
  onSelect: () => void
}

function DraggableTextBlock({ block, isSelected, onSelect }: DraggableTextBlockProps) {
  const { updateTextBlock, setIsDragging } = useLayoutStore()
  const [isDragging, setLocalDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; blockX: number; blockY: number }>()
  const resizeRef = useRef<{ startX: number; startWidth: number }>()

  const handleDragStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
    setLocalDragging(true)
    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      blockX: block.x,
      blockY: block.y,
    }
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current) return
      const deltaX = moveEvent.clientX - dragRef.current.startX
      const deltaY = moveEvent.clientY - dragRef.current.startY
      updateTextBlock(block.id, {
        x: dragRef.current.blockX + deltaX,
        y: dragRef.current.blockY + deltaY,
      })
    }
    
    const handleMouseUp = () => {
      setLocalDragging(false)
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    resizeRef.current = {
      startX: e.clientX,
      startWidth: block.width,
    }
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeRef.current) return
      const deltaX = moveEvent.clientX - resizeRef.current.startX
      updateTextBlock(block.id, {
        width: Math.max(100, resizeRef.current.startWidth + deltaX),
      })
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <motion.div
      className={cn(
        'absolute cursor-move select-none',
        isSelected && 'ring-2 ring-aurora-500 ring-offset-2 ring-offset-transparent'
      )}
      style={{
        left: block.x,
        top: block.y,
        width: block.width,
        transform: `rotate(${block.rotation}deg)`,
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onMouseDown={handleDragStart}
      animate={{
        scale: isDragging ? 1.02 : 1,
      }}
    >
      {/* Contenu du texte */}
      <div
        className={cn(
          'p-4 rounded-lg transition-all',
          block.shadow && 'drop-shadow-lg'
        )}
        style={{
          fontFamily: block.fontFamily,
          fontSize: block.fontSize,
          color: block.color,
          textAlign: block.textAlign,
          opacity: block.opacity,
          textShadow: block.shadow ? '2px 2px 8px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {block.content}
      </div>

      {/* Contrôles de sélection */}
      {isSelected && (
        <>
          {/* Handle de déplacement */}
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 p-1.5 rounded-full bg-aurora-500 text-white cursor-move"
            onMouseDown={handleDragStart}
          >
            <Move className="w-3 h-3" />
          </div>

          {/* Handle de redimensionnement */}
          <div
            className="absolute top-1/2 -right-3 -translate-y-1/2 p-1.5 rounded-full bg-dream-500 text-white cursor-e-resize"
            onMouseDown={handleResizeStart}
          >
            <Maximize2 className="w-3 h-3" />
          </div>
        </>
      )}
    </motion.div>
  )
}

export function LayoutCanvas() {
  const {
    currentPage,
    selectedElement,
    showGrid,
    zoomLevel,
    setSelectedElement,
  } = useLayoutStore()

  const canvasRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)

  const handleCanvasClick = () => {
    setSelectedElement(null)
  }

  if (!currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center text-midnight-400">
        <p>Sélectionne ou crée une page pour commencer</p>
      </div>
    )
  }

  const videoLayers = currentPage.mediaLayers.filter(l => l.type === 'video')
  const imageLayers = currentPage.mediaLayers.filter(l => l.type === 'image')

  return (
    <div className="flex-1 flex flex-col gap-2">
      {/* Contrôles de lecture */}
      {videoLayers.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl transition-colors',
              isPlaying 
                ? 'bg-aurora-500/20 text-aurora-300' 
                : 'bg-midnight-800/50 text-midnight-300'
            )}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause' : 'Lecture'}
          </button>
          <span className="text-xs text-midnight-500">
            {videoLayers.length} vidéo{videoLayers.length > 1 ? 's' : ''}
          </span>
        </div>
      )}
      
      {/* Canvas principal */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-midnight-950 rounded-2xl"
        onClick={handleCanvasClick}
        style={{
          backgroundImage: showGrid 
            ? 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)'
            : 'none',
          backgroundSize: '20px 20px',
        }}
      >
        {/* Zone de composition (ratio 16:9) */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-midnight-900 rounded-xl overflow-hidden shadow-2xl"
          style={{
            width: `${(16 * 40 * zoomLevel) / 100}px`,
            height: `${(9 * 40 * zoomLevel) / 100}px`,
            transform: `translate(-50%, -50%) scale(${zoomLevel / 100})`,
          }}
        >
          {/* Background Image */}
          {currentPage.backgroundImage && (
            <img
              src={currentPage.backgroundImage}
              alt="Background"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Background Video */}
          {currentPage.backgroundVideo && (
            <video
              src={currentPage.backgroundVideo}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay={isPlaying}
              loop
              muted
            />
          )}

          {/* Overlay pour améliorer la lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

          {/* Image Layers */}
          {imageLayers.map((layer) => (
            <div
              key={layer.id}
              className={cn(
                'absolute cursor-move',
                selectedElement === layer.id && 'ring-2 ring-dream-500'
              )}
              style={{
                left: `${layer.x}%`,
                top: `${layer.y}%`,
                width: `${layer.width}%`,
                height: `${layer.height}%`,
                opacity: layer.opacity,
                zIndex: layer.zIndex,
              }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedElement(layer.id)
              }}
            >
              <img src={layer.url} alt="" className="w-full h-full object-cover rounded-lg" />
            </div>
          ))}

          {/* Video Layers avec effets d'opacité */}
          {videoLayers.map((layer) => (
            <VideoLayerComponent
              key={layer.id}
              layer={layer}
              isSelected={selectedElement === layer.id}
              onSelect={() => setSelectedElement(layer.id)}
              isPlaying={isPlaying}
            />
          ))}

          {/* Text Blocks */}
          {currentPage.textBlocks.map((block) => (
            <DraggableTextBlock
              key={block.id}
              block={block}
              isSelected={selectedElement === block.id}
              onSelect={() => setSelectedElement(block.id)}
            />
          ))}

          {/* Numéro de page */}
          <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/30 text-white/70 text-sm font-medium pointer-events-none">
            {currentPage.pageNumber}
          </div>
        </div>
      </div>
    </div>
  )
}

