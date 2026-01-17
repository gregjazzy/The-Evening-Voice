'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'magic' | 'dots' | 'stars'
  className?: string
  text?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default',
  className,
  text
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <div className="typing-indicator flex gap-1">
          <span />
          <span />
          <span />
        </div>
        {text && (
          <span className={cn('text-midnight-300', textSizeClasses[size])}>
            {text}
          </span>
        )}
      </div>
    )
  }

  if (variant === 'stars') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <div className={cn('relative', sizeClasses[size])}>
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span
              key={i}
              className="absolute text-stardust-300"
              style={{
                fontSize: size === 'lg' ? '20px' : size === 'md' ? '14px' : '10px',
                left: '50%',
                top: '50%',
              }}
              animate={{
                x: [0, Math.cos(i * 72 * Math.PI / 180) * 20, 0],
                y: [0, Math.sin(i * 72 * Math.PI / 180) * 20, 0],
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            >
              ✨
            </motion.span>
          ))}
        </div>
        {text && (
          <span className={cn('text-midnight-300 animate-magic-loading', textSizeClasses[size])}>
            {text}
          </span>
        )}
      </div>
    )
  }

  if (variant === 'magic') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <div className={cn('relative', sizeClasses[size])}>
          {/* Cercle extérieur */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-aurora-500/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          {/* Cercle intérieur avec gradient */}
          <motion.div
            className="absolute inset-1 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, #e879f9 50%, transparent 100%)',
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          {/* Centre lumineux */}
          <motion.div
            className="absolute inset-3 rounded-full bg-aurora-500/20"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        {text && (
          <span className={cn('text-aurora-300', textSizeClasses[size])}>
            {text}
          </span>
        )}
      </div>
    )
  }

  // Default spinner
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <motion.div
        className={cn(
          'rounded-full border-2 border-midnight-600 border-t-aurora-500',
          sizeClasses[size]
        )}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && (
        <span className={cn('text-midnight-300', textSizeClasses[size])}>
          {text}
        </span>
      )}
    </div>
  )
}

/**
 * Indicateur de typing pour l'IA
 */
export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 px-4 py-3', className)}>
      <div className="flex items-center gap-1">
        <motion.span
          className="text-lg"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          ✨
        </motion.span>
      </div>
      <div className="typing-indicator flex gap-1">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}

/**
 * Skeleton pour le chargement de contenu
 */
interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circle' | 'rect' | 'card'
}

export function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
  const baseClasses = 'skeleton animate-pulse'
  
  const variantClasses = {
    text: 'h-4 rounded',
    circle: 'rounded-full aspect-square',
    rect: 'rounded-lg',
    card: 'rounded-xl h-32',
  }

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)} />
  )
}

/**
 * Écran de chargement complet
 */
interface LoadingScreenProps {
  message?: string
}

export function LoadingScreen({ message = 'Chargement magique...' }: LoadingScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-midnight-950 via-midnight-900 to-midnight-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Fond étoilé */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Logo animé */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Cercle magique */}
        <div className="relative w-24 h-24 mb-6">
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-aurora-500/20 to-aurora-700/20"
            animate={{
              boxShadow: [
                '0 0 30px rgba(233, 121, 249, 0.3)',
                '0 0 60px rgba(233, 121, 249, 0.5)',
                '0 0 30px rgba(233, 121, 249, 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-aurora-400/50"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-4 rounded-full border border-stardust-400/30"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-4xl"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ✨
          </motion.div>
        </div>

        {/* Texte */}
        <motion.p
          className="text-lg font-display text-aurora-300 tracking-wide"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {message}
        </motion.p>

        {/* Barre de progression */}
        <motion.div
          className="mt-4 w-48 h-1 rounded-full bg-midnight-800 overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-aurora-500 to-stardust-400 progress-magic"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default LoadingSpinner
