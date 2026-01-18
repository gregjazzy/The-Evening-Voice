'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHighlightStore, type HighlightableElement } from '@/store/useHighlightStore'
import { cn } from '@/lib/utils'

interface HighlightableProps {
  id: HighlightableElement
  children: React.ReactNode
  className?: string
  /** Si true, le wrapper prend toute la taille du parent */
  fill?: boolean
  /** Callback quand l'élément est cliqué pendant qu'il brille */
  onHighlightClick?: () => void
}

/**
 * Wrapper qui permet à un élément d'être mis en surbrillance par l'IA
 * 
 * @example
 * <Highlightable id="montage-add-music">
 *   <Button>Ajouter musique</Button>
 * </Highlightable>
 */
export function Highlightable({ 
  id, 
  children, 
  className,
  fill = false,
  onHighlightClick,
}: HighlightableProps) {
  // Sélection RÉACTIVE du Map - le composant se re-render quand activeHighlights change
  const activeHighlights = useHighlightStore(state => state.activeHighlights)
  const stopHighlight = useHighlightStore(state => state.stopHighlight)
  
  // Calculer highlighted et config à partir du Map réactif
  const highlighted = activeHighlights.has(id)
  const config = activeHighlights.get(id)
  
  const [showPulse, setShowPulse] = useState(false)
  
  useEffect(() => {
    if (highlighted) {
      setShowPulse(true)
    } else {
      setShowPulse(false)
    }
  }, [highlighted])

  const handleClick = () => {
    if (highlighted) {
      stopHighlight(id)
      onHighlightClick?.()
    }
  }

  // Intensité de l'animation
  const intensityConfig = {
    soft: { scale: [1, 1.02, 1], opacity: [0.3, 0.5, 0.3] },
    medium: { scale: [1, 1.05, 1], opacity: [0.4, 0.7, 0.4] },
    strong: { scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] },
  }
  
  const intensity = config?.intensity || 'medium'
  const color = config?.color || '#FFD700'

  return (
    <div 
      className={cn(
        'relative overflow-visible',
        fill && 'w-full h-full',
        highlighted && 'z-[9999]', // Élever le z-index quand highlighté
        className
      )}
      onClick={handleClick}
    >
      {/* Contenu original */}
      <div className={cn('relative z-10', fill && 'w-full h-full')}>
        {children}
      </div>
      
      {/* Effet de surbrillance */}
      <AnimatePresence>
        {showPulse && (
          <>
            {/* Glow externe pulsant */}
            <motion.div
              className="absolute inset-[-4px] rounded-xl pointer-events-none z-[9998]"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: intensityConfig[intensity].opacity,
                scale: intensityConfig[intensity].scale,
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                boxShadow: `0 0 20px 8px ${color}, 0 0 40px 16px ${color}40, inset 0 0 20px ${color}20`,
                background: `radial-gradient(circle at center, ${color}10 0%, transparent 70%)`,
              }}
            />
            
            {/* Bordure lumineuse */}
            <motion.div
              className="absolute inset-[-2px] rounded-xl pointer-events-none z-[9998]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                border: `3px solid ${color}`,
                boxShadow: `inset 0 0 10px ${color}40, 0 0 15px ${color}`,
              }}
            />
            
            {/* Particules brillantes */}
            <SparkleParticles color={color} />
            
            {/* Indicateur "Clique ici !" */}
            <motion.div
              className="absolute -top-10 left-1/2 -translate-x-1/2 z-[10000] whitespace-nowrap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <motion.div
                className="px-3 py-1.5 rounded-full text-xs font-bold shadow-xl"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  background: color,
                  color: '#000',
                  boxShadow: `0 4px 20px ${color}80`,
                }}
              >
                ✨ Ici !
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Particules brillantes autour de l'élément
 */
function SparkleParticles({ color }: { color: string }) {
  const particles = Array.from({ length: 6 }, (_, i) => i)
  
  return (
    <div className="absolute inset-[-10px] pointer-events-none overflow-visible z-[9997]">
      {particles.map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: color,
            boxShadow: `0 0 6px ${color}`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: [0, (Math.random() - 0.5) * 30],
            y: [0, (Math.random() - 0.5) * 30],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

/**
 * Hook pour déclencher un highlight depuis n'importe quel composant
 */
export function useHighlight() {
  const { highlight, highlightMultiple, stopHighlight, stopAllHighlights } = useHighlightStore()
  
  return {
    highlight,
    highlightMultiple,
    stopHighlight,
    stopAllHighlights,
  }
}
