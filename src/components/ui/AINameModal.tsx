'use client'

/**
 * Modal pour choisir/modifier le nom de l'IA-Amie
 * S'affiche à la première connexion ou via les paramètres
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Heart, Star, Wand2, Check } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

interface AINameModalProps {
  isOpen: boolean
  onClose: () => void
  isFirstTime?: boolean // true = première connexion, false = modification
}

// Suggestions de noms magiques
const NAME_SUGGESTIONS = [
  { name: 'Étoile', emoji: '⭐' },
  { name: 'Lune', emoji: '🌙' },
  { name: 'Féerie', emoji: '🧚' },
  { name: 'Magie', emoji: '✨' },
  { name: 'Céleste', emoji: '🌟' },
  { name: 'Aurore', emoji: '🌅' },
  { name: 'Iris', emoji: '🌈' },
  { name: 'Perle', emoji: '🦪' },
]

export function AINameModal({ isOpen, onClose, isFirstTime = false }: AINameModalProps) {
  const { aiName, setAiName } = useAppStore()
  const [inputName, setInputName] = useState(aiName || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mettre à jour l'input si aiName change
  useEffect(() => {
    if (aiName) {
      setInputName(aiName)
    }
  }, [aiName])

  const handleSubmit = async () => {
    if (!inputName.trim()) return
    
    setIsSubmitting(true)
    
    // Petit délai pour l'animation
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setAiName(inputName.trim())
    setIsSubmitting(false)
    onClose()
  }

  const handleSuggestionClick = (name: string) => {
    setInputName(name)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => {
          // Ne pas fermer si c'est la première fois
          if (!isFirstTime && e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-gradient-to-br from-midnight-900 via-midnight-800 to-midnight-900 rounded-3xl border border-aurora-500/30 shadow-2xl shadow-aurora-500/20 overflow-hidden"
        >
          {/* Header avec animation */}
          <div className="relative p-6 pb-4 text-center">
            {/* Particules décoratives */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-4 left-8 text-2xl"
              >
                ✨
              </motion.div>
              <motion.div
                animate={{ 
                  y: [0, 10, 0],
                  rotate: [0, -5, 5, 0]
                }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                className="absolute top-6 right-10 text-xl"
              >
                🌟
              </motion.div>
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                className="absolute bottom-2 left-1/4 text-lg"
              >
                💫
              </motion.div>
            </div>

            {/* Icône principale */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-aurora-500 to-stardust-500 shadow-lg shadow-aurora-500/40"
            >
              <Wand2 className="w-10 h-10 text-white" />
            </motion.div>

            {/* Titre */}
            <h2 className="text-2xl font-bold text-white mb-2">
              {isFirstTime ? (
                <>Comment veux-tu appeler<br />ton amie magique ? 🎀</>
              ) : (
                <>Changer le nom de<br />ton amie magique</>
              )}
            </h2>
            
            <p className="text-midnight-300 text-sm">
              {isFirstTime 
                ? "Elle t'aidera à écrire de belles histoires !"
                : "Tu peux choisir un nouveau nom quand tu veux"
              }
            </p>
          </div>

          {/* Corps */}
          <div className="px-6 pb-6 space-y-5">
            {/* Input */}
            <div className="relative">
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="Entre un joli prénom..."
                maxLength={20}
                className="w-full px-5 py-4 text-lg text-center text-white placeholder-midnight-400 bg-midnight-800/50 border-2 border-aurora-500/30 rounded-2xl focus:border-aurora-500 focus:ring-4 focus:ring-aurora-500/20 transition-all outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputName.trim()) {
                    handleSubmit()
                  }
                }}
              />
              {inputName && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <Sparkles className="w-5 h-5 text-aurora-400" />
                </motion.div>
              )}
            </div>

            {/* Suggestions */}
            <div>
              <p className="text-xs text-midnight-400 mb-2 text-center">
                💡 Ou choisis une idée :
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {NAME_SUGGESTIONS.map((suggestion) => (
                  <motion.button
                    key={suggestion.name}
                    onClick={() => handleSuggestionClick(suggestion.name)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                      inputName === suggestion.name
                        ? 'bg-aurora-500/30 border-aurora-500 text-aurora-300'
                        : 'bg-midnight-800/50 border-midnight-600 text-midnight-300 hover:border-aurora-500/50 hover:text-white'
                    }`}
                  >
                    {suggestion.emoji} {suggestion.name}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Bouton de validation */}
            <motion.button
              onClick={handleSubmit}
              disabled={!inputName.trim() || isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                inputName.trim()
                  ? 'bg-gradient-to-r from-aurora-500 to-stardust-500 text-white shadow-lg shadow-aurora-500/30 hover:shadow-aurora-500/50'
                  : 'bg-midnight-700 text-midnight-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
              ) : (
                <>
                  <Heart className="w-5 h-5" />
                  {isFirstTime ? "C'est parti !" : "Valider"}
                </>
              )}
            </motion.button>

            {/* Bouton annuler (seulement si pas première fois) */}
            {!isFirstTime && (
              <button
                onClick={onClose}
                className="w-full py-2 text-midnight-400 hover:text-white transition-colors text-sm"
              >
                Annuler
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AINameModal
