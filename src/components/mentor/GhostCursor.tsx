'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMentorStore } from '@/store/useMentorStore'
import { MousePointer2 } from 'lucide-react'

export function GhostCursor() {
  const { mentorCursor, controlActive, role } = useMentorStore()
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Cacher le curseur après inactivité
  useEffect(() => {
    if (mentorCursor.visible) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        useMentorStore.getState()._setMentorCursor({ visible: false })
      }, 3000)
    }

    return () => clearTimeout(timeoutRef.current)
  }, [mentorCursor.x, mentorCursor.y, mentorCursor.visible])

  // Ne pas afficher pour le mentor ou si pas de contrôle actif
  if (role === 'mentor' || !controlActive) return null

  return (
    <AnimatePresence>
      {mentorCursor.visible && (
        <motion.div
          className="fixed pointer-events-none z-[9999]"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: mentorCursor.x,
            y: mentorCursor.y,
          }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ 
            type: 'spring',
            stiffness: 500,
            damping: 30,
            mass: 0.5,
          }}
          style={{
            left: 0,
            top: 0,
          }}
        >
          {/* Curseur principal */}
          <div className="relative">
            <MousePointer2 
              className="w-6 h-6 text-aurora-400 drop-shadow-lg"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(233, 121, 249, 0.8))',
              }}
            />
            
            {/* Halo lumineux */}
            <motion.div
              className="absolute -inset-4 rounded-full bg-aurora-500/20"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.3, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            
            {/* Label */}
            <motion.div
              className="absolute left-6 top-0 px-2 py-1 rounded-lg bg-aurora-600/90 text-white text-xs font-medium whitespace-nowrap"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              👨‍🏫 Mentor
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

