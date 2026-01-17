'use client'

import { useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AnimationType } from '@/store/useMontageStore'

// =============================================================================
// TYPES
// =============================================================================

interface AnimationEffectProps {
  type: AnimationType
  isActive: boolean
  color?: string
  intensity?: number // 0-100
  size?: 'small' | 'medium' | 'large'
  position?: { x: number; y: number } // Pour les animations localisées (0-100%)
  speed?: number // 0-100
  opacity?: number // 0-1
  fadeIn?: number // seconds
  fadeOut?: number // seconds
  duration?: number // Total duration for fade calculations
  currentTime?: number // Current playback time
  startTime?: number // When the animation starts
  endTime?: number // When the animation ends
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  delay: number
  duration: number
  rotation: number
  opacity: number
}

// =============================================================================
// CONFIGURATION DES PARTICULES
// =============================================================================

const PARTICLE_COUNTS = {
  small: 8,
  medium: 15,
  large: 25,
}

const PARTICLE_SIZES = {
  small: { min: 8, max: 14 },
  medium: { min: 12, max: 20 },
  large: { min: 16, max: 28 },
}

// =============================================================================
// GÉNÉRATEUR DE PARTICULES
// =============================================================================

function generateParticles(
  count: number,
  sizeRange: { min: number; max: number },
  isLocalized: boolean,
  position?: { x: number; y: number }
): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: isLocalized && position 
      ? position.x + (Math.random() - 0.5) * 30 
      : Math.random() * 100,
    y: isLocalized && position 
      ? position.y + (Math.random() - 0.5) * 30 
      : Math.random() * 100,
    size: sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min),
    delay: Math.random() * 2,
    duration: 1.5 + Math.random() * 2,
    rotation: Math.random() * 360,
    opacity: 0.6 + Math.random() * 0.4,
  }))
}

// =============================================================================
// COMPOSANTS D'ANIMATION
// =============================================================================

// Étoile SVG
function Star({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

// Cœur SVG
function Heart({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )
}

// Étincelle SVG
function Sparkle({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  )
}

// Bulle
function Bubble({ size, color }: { size: number; color: string }) {
  return (
    <div 
      style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, white, ${color})`,
        opacity: 0.7,
      }} 
    />
  )
}

// Flocon
function Snowflake({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
  )
}

// =============================================================================
// ANIMATIONS PLEIN ÉCRAN
// =============================================================================

function FallingAnimation({ 
  particles, 
  color, 
  renderParticle,
  speed = 50,
}: { 
  particles: Particle[]
  color: string
  renderParticle: (size: number, color: string) => React.ReactNode
  speed?: number
}) {
  const speedFactor = speed / 50 // 1 = normal, <1 = plus lent, >1 = plus rapide

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{ left: `${p.x}%`, top: -20 }}
          animate={{
            y: ['0vh', '110vh'],
            x: [0, Math.sin(p.id) * 30],
            rotate: [0, p.rotation],
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{
            duration: p.duration / speedFactor,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {renderParticle(p.size, color)}
        </motion.div>
      ))}
    </div>
  )
}

function FloatingAnimation({ 
  particles, 
  color, 
  renderParticle,
  speed = 50,
}: { 
  particles: Particle[]
  color: string
  renderParticle: (size: number, color: string) => React.ReactNode
  speed?: number
}) {
  const speedFactor = speed / 50

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{ left: `${p.x}%`, bottom: -20 }}
          animate={{
            y: ['0vh', '-110vh'],
            x: [0, Math.sin(p.id * 2) * 40, 0],
            rotate: [0, p.rotation / 2, -p.rotation / 2, 0],
            scale: [0.8, 1, 0.8],
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{
            duration: (p.duration + 1) / speedFactor,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {renderParticle(p.size, color)}
        </motion.div>
      ))}
    </div>
  )
}

function SparklesAnimation({ 
  particles, 
  color,
  speed = 50,
}: { 
  particles: Particle[]
  color: string
  speed?: number
}) {
  const speedFactor = speed / 50

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: [0, 180],
          }}
          transition={{
            duration: 1.5 / speedFactor,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Sparkle size={p.size} color={color} />
        </motion.div>
      ))}
    </div>
  )
}

// =============================================================================
// ANIMATIONS LOCALISÉES (EFFETS MAGIQUES)
// =============================================================================

function LocalizedSparkle({ 
  position, 
  color, 
  intensity = 50,
  size = 'medium',
}: { 
  position: { x: number; y: number }
  color: string
  intensity?: number
  size?: 'small' | 'medium' | 'large'
}) {
  const count = Math.floor((PARTICLE_COUNTS[size] * intensity) / 50)
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360
        const distance = 20 + Math.random() * 40
        const particleSize = PARTICLE_SIZES[size].min + Math.random() * 8
        
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ 
              left: `${position.x}%`, 
              top: `${position.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              x: [0, Math.cos(angle * Math.PI / 180) * distance],
              y: [0, Math.sin(angle * Math.PI / 180) * distance],
              scale: [0, 1.2, 0],
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 1 + Math.random() * 0.5,
              delay: Math.random() * 0.5,
              repeat: Infinity,
              repeatDelay: Math.random() * 0.3,
            }}
          >
            <Sparkle size={particleSize} color={color} />
          </motion.div>
        )
      })}
    </div>
  )
}

function LocalizedHearts({ 
  position, 
  color, 
  intensity = 50,
  size = 'medium',
  direction = 'up',
}: { 
  position: { x: number; y: number }
  color: string
  intensity?: number
  size?: 'small' | 'medium' | 'large'
  direction?: 'up' | 'random'
}) {
  const count = Math.floor((PARTICLE_COUNTS[size] * intensity) / 50)
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => {
        const offsetX = (Math.random() - 0.5) * 20
        const particleSize = PARTICLE_SIZES[size].min + Math.random() * 6
        
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ 
              left: `${position.x + offsetX}%`, 
              top: `${position.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              y: [0, -80 - Math.random() * 40],
              x: [0, (Math.random() - 0.5) * 30],
              scale: [0.3, 1, 0.5],
              opacity: [0, 1, 0],
              rotate: [0, (Math.random() - 0.5) * 30],
            }}
            transition={{
              duration: 2 + Math.random(),
              delay: i * 0.2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          >
            <Heart size={particleSize} color={color} />
          </motion.div>
        )
      })}
    </div>
  )
}

function LocalizedStarBurst({ 
  position, 
  color, 
  intensity = 50,
  size = 'medium',
}: { 
  position: { x: number; y: number }
  color: string
  intensity?: number
  size?: 'small' | 'medium' | 'large'
}) {
  const count = Math.floor((PARTICLE_COUNTS[size] * intensity) / 50)
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360 + Math.random() * 20
        const distance = 30 + Math.random() * 50
        const particleSize = PARTICLE_SIZES[size].min + Math.random() * 8
        
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ 
              left: `${position.x}%`, 
              top: `${position.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              x: [0, Math.cos(angle * Math.PI / 180) * distance, Math.cos(angle * Math.PI / 180) * distance * 1.2],
              y: [0, Math.sin(angle * Math.PI / 180) * distance, Math.sin(angle * Math.PI / 180) * distance * 1.5],
              scale: [0, 1, 0.3],
              opacity: [1, 1, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.05,
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
          >
            <Star size={particleSize} color={color} />
          </motion.div>
        )
      })}
    </div>
  )
}

function LocalizedMagicSwirl({ 
  position, 
  color, 
  intensity = 50,
  size = 'medium',
}: { 
  position: { x: number; y: number }
  color: string
  intensity?: number
  size?: 'small' | 'medium' | 'large'
}) {
  const count = Math.floor((12 * intensity) / 50)
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => {
        const particleSize = PARTICLE_SIZES[size].min + Math.random() * 4
        const startAngle = i * (360 / count)
        
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ 
              left: `${position.x}%`, 
              top: `${position.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              x: [
                Math.cos(startAngle * Math.PI / 180) * 5,
                Math.cos((startAngle + 180) * Math.PI / 180) * 25,
                Math.cos((startAngle + 360) * Math.PI / 180) * 40,
              ],
              y: [
                Math.sin(startAngle * Math.PI / 180) * 5,
                Math.sin((startAngle + 180) * Math.PI / 180) * 25,
                Math.sin((startAngle + 360) * Math.PI / 180) * 40,
              ],
              scale: [0.5, 1, 0],
              opacity: [0.5, 1, 0],
            }}
            transition={{
              duration: 2,
              delay: i * 0.1,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          >
            <Sparkle size={particleSize} color={color} />
          </motion.div>
        )
      })}
    </div>
  )
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export function AnimationEffect({ 
  type, 
  isActive, 
  color = '#FFD700', 
  intensity = 50,
  size = 'medium',
  position,
  speed = 50,
  opacity = 1,
  fadeIn = 0,
  fadeOut = 0,
  currentTime = 0,
  startTime = 0,
  endTime = Infinity,
}: AnimationEffectProps) {
  const particles = useMemo(() => {
    const count = PARTICLE_COUNTS[size]
    const sizeRange = PARTICLE_SIZES[size]
    const isLocalized = type.startsWith('localized-')
    return generateParticles(count, sizeRange, isLocalized, position)
  }, [size, type, position])

  if (!isActive) return null

  // Calculer l'opacité effective avec les fondus
  let effectiveOpacity = opacity
  
  // Fade in
  if (fadeIn > 0 && currentTime < startTime + fadeIn) {
    const fadeProgress = (currentTime - startTime) / fadeIn
    effectiveOpacity *= Math.max(0, Math.min(1, fadeProgress))
  }
  
  // Fade out
  if (fadeOut > 0 && currentTime > endTime - fadeOut) {
    const fadeProgress = (endTime - currentTime) / fadeOut
    effectiveOpacity *= Math.max(0, Math.min(1, fadeProgress))
  }

  // Wrapper avec l'opacité
  const wrapWithOpacity = (content: React.ReactNode) => (
    <div style={{ opacity: effectiveOpacity }} className="absolute inset-0">
      {content}
    </div>
  )

  // Animations plein écran
  switch (type) {
    case 'falling-stars':
      return wrapWithOpacity(
        <FallingAnimation 
          particles={particles} 
          color={color} 
          speed={speed}
          renderParticle={(s, c) => <Star size={s} color={c} />} 
        />
      )
    
    case 'floating-hearts':
      return wrapWithOpacity(
        <FloatingAnimation 
          particles={particles} 
          color={color}
          speed={speed}
          renderParticle={(s, c) => <Heart size={s} color={c} />} 
        />
      )
    
    case 'sparkles':
      return wrapWithOpacity(<SparklesAnimation particles={particles} color={color} speed={speed} />)
    
    case 'bubbles':
      return wrapWithOpacity(
        <FloatingAnimation 
          particles={particles} 
          color={color}
          speed={speed}
          renderParticle={(s, c) => <Bubble size={s} color={c} />} 
        />
      )
    
    case 'snow':
      return wrapWithOpacity(
        <FallingAnimation 
          particles={particles} 
          color={color || '#FFFFFF'}
          speed={speed}
          renderParticle={(s, c) => <Snowflake size={s} color={c} />} 
        />
      )
    
    case 'confetti':
      return wrapWithOpacity(
        <FallingAnimation 
          particles={particles} 
          color={color}
          speed={speed}
          renderParticle={(s) => (
            <div 
              style={{ 
                width: s * 0.4, 
                height: s, 
                background: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'][Math.floor(Math.random() * 5)],
                borderRadius: 2,
              }} 
            />
          )} 
        />
      )
    
    case 'fireflies':
      return wrapWithOpacity(<SparklesAnimation particles={particles} color={color || '#FFFF00'} speed={speed} />)
    
    case 'magic-dust':
    case 'fairy-dust':
      return wrapWithOpacity(<SparklesAnimation particles={particles} color={color || '#FFD700'} speed={speed} />)

    // Animations localisées
    case 'localized-sparkle':
    case 'localized-golden-sparkles':
    case 'localized-pixie-dust':
      return position ? wrapWithOpacity(
        <LocalizedSparkle position={position} color={color} intensity={intensity} size={size} />
      ) : null
    
    case 'localized-heart-explosion':
    case 'localized-floating-hearts':
    case 'localized-kiss-hearts':
      return position ? wrapWithOpacity(
        <LocalizedHearts position={position} color={color} intensity={intensity} size={size} />
      ) : null
    
    case 'localized-star-burst':
    case 'localized-wishing-stars':
      return position ? wrapWithOpacity(
        <LocalizedStarBurst position={position} color={color} intensity={intensity} size={size} />
      ) : null
    
    case 'localized-magic-swirl':
    case 'localized-magic-trail':
    case 'localized-magic-portal':
      return position ? wrapWithOpacity(
        <LocalizedMagicSwirl position={position} color={color} intensity={intensity} size={size} />
      ) : null
    
    case 'localized-rainbow-burst':
      return position ? wrapWithOpacity(
        <LocalizedStarBurst position={position} color="#FF69B4" intensity={intensity} size={size} />
      ) : null
    
    case 'localized-fairy-circle':
    case 'localized-enchanted-glow':
    case 'localized-shimmer':
      return position ? wrapWithOpacity(
        <LocalizedSparkle position={position} color={color} intensity={intensity} size={size} />
      ) : null

    default:
      // Animation générique pour les types non implémentés
      return wrapWithOpacity(<SparklesAnimation particles={particles} color={color} speed={speed} />)
  }
}

export default AnimationEffect
