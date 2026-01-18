'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useMontageStore, type PhraseTiming, type PhraseStyle } from '@/store/useMontageStore'
import { cn } from '@/lib/utils'
import { AnimationEffect } from './AnimationEffects'
import {
  Move,
  Maximize2,
  Minimize2,
  RotateCcw,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

interface DraggableElement {
  id: string
  type: 'media' | 'decoration' | 'animation'
  position: { x: number; y: number; width: number; height: number; rotation?: number }
}

// =============================================================================
// COMPOSANT D'AFFICHAGE DE PHRASE AVEC STYLE
// =============================================================================

function PhraseDisplay({ phrase }: { phrase: PhraseTiming }) {
  // Style par défaut
  const style: PhraseStyle = {
    position: phrase.style?.position || 'bottom',
    fontSize: phrase.style?.fontSize || 'large',
    color: phrase.style?.color || '#FFFFFF',
    backgroundColor: phrase.style?.backgroundColor,
    animation: phrase.style?.animation || 'fade',
    customPosition: phrase.style?.customPosition,
  }
  
  // Classes de position
  const positionClasses = {
    top: 'top-0 left-0 right-0 pt-6 pb-12',
    center: 'top-1/2 left-0 right-0 -translate-y-1/2',
    bottom: 'bottom-0 left-0 right-0 pb-6 pt-12',
    custom: '',
  }
  
  // Tailles de police
  const fontSizeClasses = {
    small: 'text-base md:text-lg',
    medium: 'text-lg md:text-xl',
    large: 'text-2xl md:text-3xl',
    xlarge: 'text-3xl md:text-4xl',
  }
  
  // Animations
  const animations = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    },
    slide: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
    },
    zoom: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
    },
    typewriter: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
    },
  }
  
  const anim = animations[style.animation || 'fade']
  
  // Style pour position personnalisée
  const customStyle = style.position === 'custom' && style.customPosition ? {
    left: `${style.customPosition.x}%`,
    top: `${style.customPosition.y}%`,
    transform: 'translate(-50%, -50%)',
  } : {}
  
  // Gradient de fond selon la position
  const gradientClass = style.position === 'top' 
    ? 'bg-gradient-to-b from-black/80 to-transparent'
    : style.position === 'bottom'
    ? 'bg-gradient-to-t from-black/80 to-transparent'
    : ''
  
  return (
    <div 
      className={cn(
        'absolute z-40 px-6',
        style.position !== 'custom' && positionClasses[style.position],
        style.position !== 'custom' && gradientClass
      )}
      style={style.position === 'custom' ? customStyle : undefined}
    >
      <motion.p
        key={phrase.id}
        initial={anim.initial}
        animate={anim.animate}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'font-medium text-center drop-shadow-lg',
          fontSizeClasses[style.fontSize]
        )}
        style={{
          color: style.color,
          backgroundColor: style.backgroundColor || 'transparent',
          padding: style.backgroundColor ? '0.5rem 1rem' : undefined,
          borderRadius: style.backgroundColor ? '0.5rem' : undefined,
          textShadow: '0 2px 10px rgba(0,0,0,0.8)',
        }}
      >
        {phrase.text}
      </motion.p>
    </div>
  )
}

// =============================================================================
// COMPOSANT DE PRÉVISUALISATION
// =============================================================================

export function PreviewCanvas() {
  const {
    getCurrentScene,
    currentPlaybackTime,
    isPlaying,
    updateMediaTrack,
    updateDecorationTrack,
    updateAnimationTrack,
    selectedTrackId,
    selectedTrackType,
    setSelectedTrack,
    clearSelection,
  } = useMontageStore()

  const scene = getCurrentScene()
  const currentTime = currentPlaybackTime ?? 0
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [originalPosition, setOriginalPosition] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [showGrid, setShowGrid] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

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

  if (!scene) {
    return (
      <div className="glass rounded-xl p-6 flex items-center justify-center h-64">
        <p className="text-midnight-400">Sélectionne une scène pour voir la prévisualisation</p>
      </div>
    )
  }

  // Filtrer les éléments visibles au temps actuel
  const visibleMedia = (scene.mediaTracks || []).filter(
    (t) => currentTime >= t.timeRange.startTime && currentTime <= t.timeRange.endTime
  )
  const visibleDecorations = (scene.decorationTracks || []).filter(
    (t) => currentTime >= t.timeRange.startTime && currentTime <= t.timeRange.endTime
  )
  const visibleAnimations = (scene.animationTracks || []).filter(
    (t) => currentTime >= t.timeRange.startTime && currentTime <= t.timeRange.endTime
  )
  const visibleLights = (scene.lightTracks || []).filter(
    (t) => currentTime >= t.timeRange.startTime && currentTime <= t.timeRange.endTime
  )

  // Trouver la phrase active
  const activePhrase = scene.narration?.phrases?.find(
    (p) => currentTime >= p.timeRange.startTime && currentTime <= p.timeRange.endTime
  )

  // Calculer l'overlay de lumière
  const lightOverlay = visibleLights.length > 0
    ? visibleLights.reduce(
        (acc, light) => ({
          color: light.color,
          intensity: Math.max(acc.intensity, light.intensity),
        }),
        { color: '#000000', intensity: 0 }
      )
    : null

  // Handlers pour le drag & drop
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string, elementType: 'media' | 'decoration' | 'animation', position: any) => {
      e.stopPropagation()
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
      setOriginalPosition(position)
      setSelectedTrack(elementId, elementType)
    },
    [setSelectedTrack]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !canvasRef.current || !selectedTrackId) return

      const canvas = canvasRef.current.getBoundingClientRect()
      const deltaX = ((e.clientX - dragStart.x) / canvas.width) * 100
      const deltaY = ((e.clientY - dragStart.y) / canvas.height) * 100

      const newPosition = {
        ...originalPosition,
        x: Math.max(0, Math.min(100 - originalPosition.width, originalPosition.x + deltaX)),
        y: Math.max(0, Math.min(100 - originalPosition.height, originalPosition.y + deltaY)),
      }

      if (selectedTrackType === 'media') {
        updateMediaTrack(selectedTrackId, { position: newPosition })
      } else if (selectedTrackType === 'decoration') {
        updateDecorationTrack(selectedTrackId, { position: newPosition })
      } else if (selectedTrackType === 'animation') {
        updateAnimationTrack(selectedTrackId, { position: newPosition })
      }
    },
    [isDragging, dragStart, originalPosition, selectedTrackId, selectedTrackType, updateMediaTrack, updateDecorationTrack, updateAnimationTrack]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  // Resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, elementId: string, elementType: 'media' | 'decoration' | 'animation', position: any, corner: string) => {
      e.stopPropagation()
      setIsResizing(true)
      setDragStart({ x: e.clientX, y: e.clientY })
      setOriginalPosition(position)
      setSelectedTrack(elementId, elementType)
    },
    [setSelectedTrack]
  )

  const previewContent = (
    <div className={cn(
      'glass rounded-xl overflow-hidden flex flex-col h-full',
      isFullscreen && 'fixed inset-0 z-[9999] bg-midnight-900 rounded-none'
    )}>
      {/* Header */}
      <div className="p-3 border-b border-midnight-700/50 flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Eye className="w-4 h-4 text-aurora-400" />
          Prévisualisation
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              showGrid ? 'bg-aurora-500/30 text-aurora-300' : 'text-midnight-400 hover:text-white'
            )}
            title="Afficher la grille"
          >
            <Move className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-md text-midnight-400 hover:text-white transition-colors"
            title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Canvas de prévisualisation */}
      <div
        ref={canvasRef}
        className="relative flex-1 bg-gradient-to-br from-midnight-900 to-midnight-950 aspect-video overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => clearSelection()}
      >
        {/* Grille d'aide au positionnement */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none z-50">
            {/* Lignes verticales */}
            {[25, 50, 75].map((pct) => (
              <div
                key={`v-${pct}`}
                className="absolute top-0 bottom-0 w-px bg-aurora-400/20"
                style={{ left: `${pct}%` }}
              />
            ))}
            {/* Lignes horizontales */}
            {[25, 50, 75].map((pct) => (
              <div
                key={`h-${pct}`}
                className="absolute left-0 right-0 h-px bg-aurora-400/20"
                style={{ top: `${pct}%` }}
              />
            ))}
            {/* Centre */}
            <div className="absolute top-1/2 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 border border-aurora-400/40 rounded-full" />
          </div>
        )}

        {/* Overlay de lumière */}
        {lightOverlay && lightOverlay.intensity > 0 && (
          <div
            className="absolute inset-0 pointer-events-none z-40 transition-colors duration-500"
            style={{
              backgroundColor: lightOverlay.color,
              opacity: lightOverlay.intensity / 200,
              mixBlendMode: 'overlay',
            }}
          />
        )}

        {/* Médias (images/vidéos) */}
        {visibleMedia.map((media) => (
          <div
            key={media.id}
            className={cn(
              'absolute cursor-move transition-shadow',
              selectedTrackId === media.id && selectedTrackType === 'media' && 'ring-2 ring-blue-400 shadow-lg'
            )}
            style={{
              left: `${media.position.x}%`,
              top: `${media.position.y}%`,
              width: `${media.position.width}%`,
              height: `${media.position.height}%`,
              zIndex: media.zIndex || 10,
              opacity: media.opacity ?? 1,
            }}
            onMouseDown={(e) => handleMouseDown(e, media.id, 'media', media.position)}
          >
            {media.type === 'image' ? (
              <img
                src={media.url}
                alt={media.name}
                className="w-full h-full object-cover rounded-lg"
                draggable={false}
              />
            ) : (
              <video
                src={media.url}
                className="w-full h-full object-cover rounded-lg"
                muted={media.muted}
                loop={media.loop}
                autoPlay={isPlaying}
              />
            )}
            
            {/* Poignées de redimensionnement */}
            {selectedTrackId === media.id && selectedTrackType === 'media' && (
              <>
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-400 rounded-full cursor-nw-resize" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full cursor-ne-resize" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-400 rounded-full cursor-sw-resize" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-400 rounded-full cursor-se-resize" />
              </>
            )}
          </div>
        ))}

        {/* Décorations (stickers, emojis) */}
        {visibleDecorations.map((deco) => (
          <div
            key={deco.id}
            className={cn(
              'absolute cursor-move flex items-center justify-center transition-shadow',
              selectedTrackId === deco.id && selectedTrackType === 'decoration' && 'ring-2 ring-pink-400 shadow-lg rounded-lg'
            )}
            style={{
              left: `${deco.position.x}%`,
              top: `${deco.position.y}%`,
              width: `${deco.position.width}%`,
              height: `${deco.position.height}%`,
              transform: deco.position.rotation ? `rotate(${deco.position.rotation}deg)` : undefined,
              zIndex: deco.zIndex || 20,
              opacity: deco.opacity ?? 1,
            }}
            onMouseDown={(e) => handleMouseDown(e, deco.id, 'decoration', deco.position)}
          >
            {deco.type === 'emoji' && deco.emoji && (
              <span 
                className="select-none"
                style={{ 
                  fontSize: `min(${deco.position.width * 2}vw, ${deco.position.height * 2}vh)`,
                  filter: deco.glow?.enabled ? `drop-shadow(0 0 ${deco.glow.intensity || 10}px ${deco.glow.color || '#fff'})` : undefined,
                }}
              >
                {deco.emoji}
              </span>
            )}
            {deco.type === 'sticker' && deco.assetUrl && (
              <img
                src={deco.assetUrl}
                alt={deco.name}
                className="w-full h-full object-contain"
                draggable={false}
              />
            )}

            {/* Animation CSS */}
            <style jsx>{`
              @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
              @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
              }
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              @keyframes float {
                0%, 100% { transform: translateY(0) translateX(0); }
                25% { transform: translateY(-5px) translateX(5px); }
                50% { transform: translateY(0) translateX(10px); }
                75% { transform: translateY(5px) translateX(5px); }
              }
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
              }
            `}</style>

            {/* Poignées */}
            {selectedTrackId === deco.id && selectedTrackType === 'decoration' && (
              <>
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-pink-400 rounded-full cursor-nw-resize" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full cursor-ne-resize" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-pink-400 rounded-full cursor-sw-resize" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-pink-400 rounded-full cursor-se-resize" />
              </>
            )}
          </div>
        ))}

        {/* Indicateurs de position pour animations localisées (déplaçables) */}
        {visibleAnimations
          .filter((anim) => anim.type.startsWith('localized-') && anim.position)
          .map((anim) => (
            <div
              key={`indicator-${anim.id}`}
              className={cn(
                'absolute cursor-move transition-shadow rounded-full z-50',
                selectedTrackId === anim.id && selectedTrackType === 'animation' && 'ring-2 ring-cyan-400'
              )}
              style={{
                left: `${(anim.position?.x || 50) - 3}%`,
                top: `${(anim.position?.y || 50) - 3}%`,
                width: '6%',
                height: '6%',
              }}
              onMouseDown={(e) => handleMouseDown(e, anim.id, 'animation', {
                x: (anim.position?.x || 50) - 3,
                y: (anim.position?.y || 50) - 3,
                width: 6,
                height: 6,
              })}
            >
              {/* Indicateur de position (cercle pointillé) */}
              <div 
                className="absolute inset-0 rounded-full border-2 border-dashed flex items-center justify-center"
                style={{ 
                  borderColor: anim.color || '#00FFFF',
                  backgroundColor: `${anim.color || '#00FFFF'}20`,
                }}
              >
                <span className="text-sm">
                  {anim.type.includes('heart') && '💕'}
                  {anim.type.includes('star') && '🌟'}
                  {anim.type.includes('sparkle') && '✨'}
                  {anim.type.includes('magic') && '🪄'}
                  {anim.type.includes('rainbow') && '🌈'}
                  {anim.type.includes('fairy') && '🧚'}
                  {anim.type.includes('kiss') && '😘'}
                  {anim.type.includes('portal') && '🔮'}
                  {anim.type.includes('glow') && '💡'}
                  {anim.type.includes('shimmer') && '✨'}
                  {anim.type.includes('pixie') && '💫'}
                  {anim.type.includes('golden') && '⭐'}
                  {anim.type.includes('wishing') && '🌠'}
                  {anim.type.includes('swirl') && '🌀'}
                </span>
              </div>
            </div>
          ))}

        {/* Animations - Vraies animations avec particules */}
        {visibleAnimations.map((anim) => (
          <AnimationEffect
            key={anim.id}
            type={anim.type}
            isActive={true}
            color={anim.color}
            intensity={anim.intensity}
            size={anim.size}
            position={anim.position}
            speed={anim.speed}
            opacity={anim.opacity}
            fadeIn={anim.fadeIn}
            fadeOut={anim.fadeOut}
            currentTime={currentTime}
            startTime={anim.timeRange.startTime}
            endTime={anim.timeRange.endTime}
          />
        ))}

        {/* Texte de la phrase active (avec style personnalisé) */}
        {activePhrase ? (
          <PhraseDisplay phrase={activePhrase} />
        ) : (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-40">
            <p className="text-xl text-midnight-400 text-center italic">
              {scene.phrases?.[0] || 'Aucun texte'}
            </p>
          </div>
        )}

        {/* Instructions quand rien n'est sélectionné */}
        {!isPlaying && visibleMedia.length === 0 && visibleDecorations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-midnight-400 px-6 py-4 bg-midnight-900/80 rounded-xl">
              <p className="text-sm mb-2">📍 Ajoute des éléments depuis la timeline</p>
              <p className="text-xs">Tu pourras les positionner ici par glisser-déposer</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer avec infos */}
      <div className="p-2 border-t border-midnight-700/50 flex items-center justify-between text-xs text-midnight-400">
        <span>
          {visibleMedia.length} média{visibleMedia.length !== 1 ? 's' : ''} •{' '}
          {visibleDecorations.length} déco •{' '}
          {visibleAnimations.length} anim
        </span>
        <span>
          Temps: {currentTime.toFixed(1)}s
        </span>
      </div>
    </div>
  )

  // En plein écran, rendre via un portal directement dans le body
  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(previewContent, document.body)
  }

  return previewContent
}
