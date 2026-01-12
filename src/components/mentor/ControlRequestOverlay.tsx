'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useMentorStore } from '@/store/useMentorStore'
import { Shield, ShieldCheck, ShieldX, Sparkles } from 'lucide-react'

export function ControlRequestOverlay() {
  const { 
    controlRequested, 
    acceptControl, 
    rejectControl, 
    role 
  } = useMentorStore()

  // Ne montrer que pour les enfants
  if (role !== 'child') return null

  return (
    <AnimatePresence>
      {controlRequested && (
        <motion.div
          className="fixed inset-0 z-[9998] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-midnight-950/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative glass rounded-3xl p-8 max-w-md mx-4 text-center"
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {/* Icône animée */}
            <motion.div
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-aurora-500/30 to-dream-500/30 flex items-center justify-center"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(233, 121, 249, 0.3)',
                  '0 0 40px rgba(233, 121, 249, 0.5)',
                  '0 0 20px rgba(233, 121, 249, 0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Shield className="w-10 h-10 text-aurora-400" />
            </motion.div>

            {/* Titre */}
            <h2 className="font-display text-2xl text-white mb-3">
              Ton mentor veut t'aider ! 
              <motion.span
                className="inline-block ml-2"
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                ✨
              </motion.span>
            </h2>

            {/* Description */}
            <p className="text-midnight-300 mb-8 leading-relaxed">
              Ton mentor souhaite prendre le contrôle de l'écran pour te montrer quelque chose. 
              <br />
              <span className="text-aurora-300">On lui ouvre la porte ?</span>
            </p>

            {/* Boutons */}
            <div className="flex gap-4 justify-center">
              <motion.button
                onClick={rejectControl}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-midnight-800/50 text-midnight-300 hover:bg-midnight-700/50 hover:text-white transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ShieldX className="w-5 h-5" />
                Pas maintenant
              </motion.button>

              <motion.button
                onClick={acceptControl}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-aurora-600 to-dream-600 text-white font-semibold shadow-glow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShieldCheck className="w-5 h-5" />
                Oui, j'accepte !
              </motion.button>
            </div>

            {/* Note de sécurité */}
            <p className="mt-6 text-xs text-midnight-400 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              Tu peux reprendre le contrôle à tout moment
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

