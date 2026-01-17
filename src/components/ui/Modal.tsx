'use client'

import { useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  className?: string
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  icon,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Fermer avec Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (closeOnEscape && e.key === 'Escape') {
      onClose()
    }
  }, [closeOnEscape, onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  // Fermer en cliquant sur l'overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      onClose()
    }
  }

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-[90vw] max-h-[90vh]',
  }

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }

  const contentVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
      y: 20,
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2,
      }
    }
  }

  // Render via Portal
  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-midnight-950/80 backdrop-blur-sm"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={handleOverlayClick}
        >
          <motion.div
            ref={contentRef}
            className={cn(
              'relative w-full glass-premium rounded-2xl overflow-hidden',
              sizes[size],
              className
            )}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between p-4 lg:p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  {icon && (
                    <div className="p-2 rounded-xl bg-aurora-500/10 text-aurora-400">
                      {icon}
                    </div>
                  )}
                  <div>
                    {title && (
                      <h2 
                        id="modal-title" 
                        className="text-lg lg:text-xl font-display font-semibold text-white"
                      >
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="text-sm text-midnight-300 mt-0.5">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {showCloseButton && (
                  <motion.button
                    onClick={onClose}
                    className="p-2 rounded-xl text-midnight-400 hover:text-white hover:bg-white/10 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-4 lg:p-6 max-h-[70vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

/**
 * Modal de confirmation
 */
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'info',
  isLoading = false,
}: ConfirmModalProps) {
  const icons = {
    danger: '⚠️',
    warning: '⚡',
    info: 'ℹ️',
  }

  const buttonStyles = {
    danger: 'bg-rose-600 hover:bg-rose-500 text-white',
    warning: 'bg-stardust-600 hover:bg-stardust-500 text-midnight-900',
    info: 'bg-aurora-600 hover:bg-aurora-500 text-white',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="text-center">
        <motion.span 
          className="text-4xl block mb-4"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5 }}
        >
          {icons[variant]}
        </motion.span>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-midnight-300 text-sm mb-6">{message}</p>
        
        <div className="flex gap-3 justify-center">
          <motion.button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-midnight-700 text-midnight-200 hover:bg-midnight-600 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
          >
            {cancelText}
          </motion.button>
          <motion.button
            onClick={onConfirm}
            className={cn(
              'px-4 py-2 rounded-xl transition-colors',
              buttonStyles[variant]
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  ⏳
                </motion.span>
                Chargement...
              </span>
            ) : (
              confirmText
            )}
          </motion.button>
        </div>
      </div>
    </Modal>
  )
}

export default Modal
