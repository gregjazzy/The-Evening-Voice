'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useMentorStore } from '@/store/useMentorStore'
import { Target, CheckCircle, X, Sparkles } from 'lucide-react'

export function MissionOverlay() {
  const { activeMission, completeMission, role } = useMentorStore()

  // Ne montrer que pour les enfants
  if (role !== 'child') return null

  return (
    <AnimatePresence>
      {activeMission && (
        <motion.div
          className="fixed bottom-6 right-6 z-[9990] max-w-sm"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <div className="glass rounded-2xl p-5 border border-stardust-500/30 shadow-glow">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-stardust-500 to-stardust-700 flex items-center justify-center"
                  animate={{
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Target className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <p className="text-xs text-stardust-400 uppercase tracking-wider">
                    Mission Flash
                  </p>
                  <h3 className="font-semibold text-white">
                    {activeMission.title}
                  </h3>
                </div>
              </div>
              
              <button
                onClick={completeMission}
                className="p-1.5 rounded-lg hover:bg-midnight-800/50 text-midnight-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-midnight-300 mb-4 leading-relaxed">
              {activeMission.description}
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <motion.button
                onClick={completeMission}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-dream-600 to-dream-700 text-white font-medium text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CheckCircle className="w-4 h-4" />
                Mission accomplie !
              </motion.button>
            </div>

            {/* Sparkle decoration */}
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-6 h-6 text-stardust-400" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

