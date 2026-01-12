'use client'

import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useLayoutStore, type TextBlock } from '@/store/useLayoutStore'
import { cn } from '@/lib/utils'
import { Move, RotateCw, Maximize2 } from 'lucide-react'

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

  return (
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
            autoPlay
            loop
            muted
          />
        )}

        {/* Overlay pour améliorer la lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Media Layers */}
        {currentPage.mediaLayers.map((layer) => (
          <div
            key={layer.id}
            className="absolute"
            style={{
              left: `${layer.x}%`,
              top: `${layer.y}%`,
              width: `${layer.width}%`,
              height: `${layer.height}%`,
              opacity: layer.opacity,
              zIndex: layer.zIndex,
            }}
          >
            {layer.type === 'image' ? (
              <img src={layer.url} alt="" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <video src={layer.url} className="w-full h-full object-cover rounded-lg" autoPlay loop muted />
            )}
          </div>
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
        <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/30 text-white/70 text-sm font-medium">
          {currentPage.pageNumber}
        </div>
      </div>
    </div>
  )
}

