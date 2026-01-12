'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useStudioStore } from '@/store/useStudioStore'
import { Lightbulb, X, Sparkles } from 'lucide-react'

export function StudioMissionFlash() {
  const { showMissionFlash, currentMissionFlash, dismissMissionFlash } = useStudioStore()

  return (
    <AnimatePresence>
      {showMissionFlash && currentMissionFlash && (
        <motion.div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9990] max-w-md"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <div className="glass rounded-2xl p-5 border border-aurora-500/30 shadow-glow">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-aurora-500 to-aurora-700 flex items-center justify-center"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Lightbulb className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <p className="text-xs text-aurora-400 uppercase tracking-wider">
                    Mission Flash
                  </p>
                  <h3 className="font-semibold text-white">
                    {currentMissionFlash.title}
                  </h3>
                </div>
              </div>
              
              <button
                onClick={dismissMissionFlash}
                className="p-1.5 rounded-lg hover:bg-midnight-800/50 text-midnight-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-midnight-300 leading-relaxed">
              {currentMissionFlash.description}
            </p>

            {/* Action */}
            <motion.button
              onClick={dismissMissionFlash}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-aurora-600 to-aurora-700 text-white font-medium text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="w-4 h-4" />
              Compris !
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

