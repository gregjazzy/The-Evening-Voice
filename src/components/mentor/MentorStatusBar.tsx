'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useMentorStore } from '@/store/useMentorStore'
import { Shield, Wifi, Hand, X } from 'lucide-react'

/**
 * Barre de statut affichée quand le contrôle mentor est actif
 * Permet à l'enfant de reprendre le contrôle à tout moment
 */
export function MentorStatusBar() {
  const { controlActive, role, releaseControl, disconnect } = useMentorStore()

  // Afficher seulement pour l'enfant quand le contrôle est actif
  if (role !== 'child' || !controlActive) return null

  const handleTakeBack = () => {
    // Simuler un refus de contrôle pour reprendre la main
    const store = useMentorStore.getState()
    store.socket?.emit('control:release')
    store._setControlActive(false)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9997]"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
      >
        <div className="flex items-center gap-3 px-5 py-3 rounded-full glass border border-aurora-500/30 shadow-glow">
          {/* Indicateur de statut */}
          <div className="flex items-center gap-2">
            <motion.div
              className="w-3 h-3 rounded-full bg-aurora-500"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-sm text-aurora-300 font-medium">
              Mentor aux commandes
            </span>
          </div>

          <div className="w-px h-6 bg-white/10" />

          {/* Bouton reprendre le contrôle */}
          <motion.button
            onClick={handleTakeBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Hand className="w-4 h-4" />
            Reprendre
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

