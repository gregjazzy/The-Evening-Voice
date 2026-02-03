'use client'

import { useNotificationStore } from '@/store/useNotificationStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const icons = {
  success: <Check className="w-5 h-5" />,
  error: <X className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
}

const styles = {
  success: 'bg-dream-600/90 border-dream-400/50 text-white',
  error: 'bg-rose-600/90 border-rose-400/50 text-white',
  warning: 'bg-stardust-600/90 border-stardust-400/50 text-midnight-900',
  info: 'bg-midnight-700/90 border-midnight-500/50 text-white',
}

const iconBg = {
  success: 'bg-dream-500/30',
  error: 'bg-rose-500/30',
  warning: 'bg-stardust-500/30',
  info: 'bg-midnight-500/30',
}

export function GlobalNotifications() {
  const { notifications, removeNotification } = useNotificationStore()
  
  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={cn(
              'relative overflow-hidden rounded-xl border backdrop-blur-lg shadow-lg',
              'flex items-start gap-3 p-4 min-w-[280px]',
              styles[notification.type]
            )}
          >
            {/* Icône */}
            <div className={cn('p-2 rounded-lg', iconBg[notification.type])}>
              {icons[notification.type]}
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{notification.title}</p>
              {notification.message && (
                <p className="text-xs mt-0.5 opacity-90">{notification.message}</p>
              )}
            </div>

            {/* Bouton fermer */}
            <button
              onClick={() => removeNotification(notification.id)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Barre de progression */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-white/30"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: notification.duration / 1000, ease: 'linear' }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
