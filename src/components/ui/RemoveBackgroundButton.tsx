'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eraser, Loader2 } from 'lucide-react'
import { removeBackground, isBackgroundRemovalSupported } from '@/lib/background-removal'
import { cn } from '@/lib/utils'

interface RemoveBackgroundButtonProps {
  imageUrl: string
  onResult: (result: { url: string; blob: Blob; file: File }) => void
  onError?: (error: Error) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'icon' | 'button'
  disabled?: boolean
}

/**
 * Bouton de suppression du fond d'image
 * Utilise @imgly/background-removal (100% côté client)
 */
export function RemoveBackgroundButton({
  imageUrl,
  onResult,
  onError,
  className,
  size = 'md',
  variant = 'icon',
  disabled = false,
}: RemoveBackgroundButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const isSupported = isBackgroundRemovalSupported()

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (isProcessing || disabled || !isSupported) return
    
    setIsProcessing(true)
    setProgress(0)
    
    try {
      const result = await removeBackground(imageUrl, {
        onProgress: (p) => setProgress(p),
      })
      onResult(result)
    } catch (error) {
      console.error('Erreur détourage:', error)
      onError?.(error instanceof Error ? error : new Error('Erreur de détourage'))
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  if (!isSupported) {
    return null
  }

  const sizeClasses = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  if (variant === 'button') {
    return (
      <motion.button
        onClick={handleClick}
        disabled={isProcessing || disabled}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-all relative overflow-hidden',
          isProcessing 
            ? 'bg-aurora-500/30 text-aurora-300 cursor-wait'
            : 'bg-aurora-500/20 text-aurora-400 hover:bg-aurora-500/40 hover:text-aurora-300',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        whileHover={isProcessing ? {} : { scale: 1.02 }}
        whileTap={isProcessing ? {} : { scale: 0.98 }}
      >
        {isProcessing ? (
          <>
            <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
            <span className="text-sm">Détourage... {progress}%</span>
            <div 
              className="absolute bottom-0 left-0 h-1 bg-aurora-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </>
        ) : (
          <>
            <Eraser className={iconSizes[size]} />
            <span className="text-sm">Enlever le fond</span>
          </>
        )}
      </motion.button>
    )
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={isProcessing || disabled}
      className={cn(
        'rounded-full transition-all relative overflow-hidden',
        sizeClasses[size],
        isProcessing 
          ? 'bg-aurora-500/30 text-aurora-300 cursor-wait'
          : 'bg-aurora-500/20 text-aurora-400 hover:bg-aurora-500 hover:text-white',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      whileHover={isProcessing ? {} : { scale: 1.1 }}
      whileTap={isProcessing ? {} : { scale: 0.9 }}
      title={isProcessing ? `Détourage en cours... ${progress}%` : 'Enlever le fond'}
    >
      {isProcessing ? (
        <>
          <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
          <div 
            className="absolute bottom-0 left-0 h-0.5 bg-aurora-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </>
      ) : (
        <Eraser className={iconSizes[size]} />
      )}
    </motion.button>
  )
}
