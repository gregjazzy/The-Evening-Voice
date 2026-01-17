'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, AlertTriangle, Info, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
type ToastType = 'success' | 'error' | 'warning' | 'info' | 'magic'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
  magic: (title: string, message?: string) => void
}

// Context
const ToastContext = createContext<ToastContextType | null>(null)

// Hook
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message, duration: 3000 })
  }, [addToast])

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message, duration: 5000 })
  }, [addToast])

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message, duration: 4000 })
  }, [addToast])

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message, duration: 3000 })
  }, [addToast])

  const magic = useCallback((title: string, message?: string) => {
    addToast({ type: 'magic', title, message, duration: 4000 })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info, magic }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

// Container
function ToastContainer({ 
  toasts, 
  removeToast 
}: { 
  toasts: Toast[]
  removeToast: (id: string) => void 
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Single Toast Item
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, toast.duration || 3000)

    return () => clearTimeout(timer)
  }, [toast, onRemove])

  const icons: Record<ToastType, React.ReactNode> = {
    success: <Check className="w-5 h-5" />,
    error: <X className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    magic: <Sparkles className="w-5 h-5" />,
  }

  const styles: Record<ToastType, string> = {
    success: 'bg-dream-600/90 border-dream-400/50 text-white',
    error: 'bg-rose-600/90 border-rose-400/50 text-white',
    warning: 'bg-stardust-600/90 border-stardust-400/50 text-midnight-900',
    info: 'bg-midnight-700/90 border-midnight-500/50 text-white',
    magic: 'bg-gradient-to-r from-aurora-600/90 to-aurora-500/90 border-aurora-400/50 text-white',
  }

  const iconBg: Record<ToastType, string> = {
    success: 'bg-dream-500/30',
    error: 'bg-rose-500/30',
    warning: 'bg-stardust-500/30',
    info: 'bg-midnight-500/30',
    magic: 'bg-white/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'relative overflow-hidden rounded-xl border backdrop-blur-lg shadow-lg',
        'flex items-start gap-3 p-4 min-w-[280px]',
        styles[toast.type]
      )}
    >
      {/* Icône */}
      <div className={cn('p-2 rounded-lg', iconBg[toast.type])}>
        {icons[toast.type]}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{toast.title}</p>
        {toast.message && (
          <p className="text-xs mt-0.5 opacity-90">{toast.message}</p>
        )}
      </div>

      {/* Bouton fermer */}
      <button
        onClick={() => onRemove(toast.id)}
        className="p-1 rounded-lg hover:bg-white/20 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Barre de progression */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-white/30"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: (toast.duration || 3000) / 1000, ease: 'linear' }}
      />

      {/* Effet magic sparkle */}
      {toast.type === 'magic' && (
        <motion.span
          className="absolute top-2 right-10 text-lg"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          ✨
        </motion.span>
      )}
    </motion.div>
  )
}

export default ToastProvider
