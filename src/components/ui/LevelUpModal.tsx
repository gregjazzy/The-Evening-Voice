'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { Sparkles, Rocket, Crown, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LevelUpContent {
  level: number
  title: string
  subtitle: string
  message: string
  highlight?: string
}

interface LevelUpModalProps {
  isOpen: boolean
  onClose: () => void
  content: LevelUpContent | null
}

const levelIcons: Record<number, React.ReactNode> = {
  2: <Star className="w-8 h-8" />,
  3: <Rocket className="w-8 h-8" />,
  4: <Sparkles className="w-8 h-8" />,
  5: <Crown className="w-8 h-8" />,
}

const levelColors: Record<number, string> = {
  2: 'from-blue-500 to-cyan-500',
  3: 'from-aurora-500 to-emerald-500',
  4: 'from-violet-500 to-purple-500',
  5: 'from-amber-400 to-orange-500',
}

export function LevelUpModal({ isOpen, onClose, content }: LevelUpModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!mounted || !content) return null

  const icon = levelIcons[content.level] || <Star className="w-8 h-8" />
  const gradientColor = levelColors[content.level] || 'from-aurora-500 to-dream-500'

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Overlay avec blur */}
          <motion.div 
            className="absolute inset-0 bg-midnight-950/90 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Contenu */}
          <motion.div
            className="relative w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 25,
              delay: 0.1 
            }}
          >
            {/* Carte principale */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-midnight-800 to-midnight-900 border border-white/10 shadow-2xl">
              
              {/* Glow effect en arrière-plan */}
              <div 
                className={cn(
                  "absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full opacity-20 blur-3xl bg-gradient-to-r",
                  gradientColor
                )}
              />

              {/* Contenu */}
              <div className="relative p-8 text-center">
                
                {/* Icône avec cercle */}
                <motion.div
                  className={cn(
                    "mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gradient-to-r shadow-lg",
                    gradientColor
                  )}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 200, 
                    damping: 15,
                    delay: 0.2 
                  }}
                >
                  <div className="text-white">
                    {icon}
                  </div>
                </motion.div>

                {/* Titre */}
                <motion.h2
                  className="text-2xl font-display font-bold text-white mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {content.title}
                </motion.h2>

                {/* Sous-titre */}
                <motion.p
                  className={cn(
                    "text-sm font-medium mb-6 bg-gradient-to-r bg-clip-text text-transparent",
                    gradientColor
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  {content.subtitle}
                </motion.p>

                {/* Message principal */}
                <motion.p
                  className="text-midnight-200 leading-relaxed mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {content.message}
                </motion.p>

                {/* Message clé (highlight) */}
                {content.highlight && (
                  <motion.div
                    className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                  >
                    <p className="text-white/90 text-sm font-medium">
                      {content.highlight}
                    </p>
                  </motion.div>
                )}

                {/* Bouton */}
                <motion.button
                  onClick={onClose}
                  className={cn(
                    "mt-8 px-8 py-3 rounded-xl font-medium text-white transition-all",
                    "bg-gradient-to-r shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
                    gradientColor
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continuer
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default LevelUpModal
