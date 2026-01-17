'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStudioStore } from '@/store/useStudioStore'
import { Lightbulb, X, Sparkles, GripHorizontal } from 'lucide-react'

export function StudioMissionFlash() {
  const { showMissionFlash, currentMissionFlash, dismissMissionFlash } = useStudioStore()
  const [isDragging, setIsDragging] = useState(false)

  return (
    <AnimatePresence>
      {showMissionFlash && currentMissionFlash && (
        <motion.div
          className="fixed bottom-6 left-1/2 z-[9990] max-w-md cursor-grab active:cursor-grabbing"
          initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
          animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          drag
          dragMomentum={false}
          dragElastic={0.1}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          whileDrag={{ scale: 1.02, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
        >
          <div className={`glass rounded-2xl p-5 border shadow-glow transition-colors ${isDragging ? 'border-aurora-400/50' : 'border-aurora-500/30'}`}>
            {/* Header avec poignée de drag */}
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
                  <p className="text-xs text-aurora-400 uppercase tracking-wider flex items-center gap-1">
                    Mission Flash
                    <GripHorizontal className="w-3 h-3 text-midnight-500" />
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

