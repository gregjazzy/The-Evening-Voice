'use client'

/**
 * Séquence d'accueil interactive avec l'IA-Amie
 * L'enfant découvre et nomme son compagnon à travers une conversation magique
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Heart, Volume2, VolumeX } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

interface AIWelcomeSequenceProps {
  isOpen: boolean
  onComplete: () => void
}

// Messages de la conversation
const CONVERSATION_STEPS = [
  {
    type: 'ai',
    messages: [
      "✨ *Une douce lumière apparaît...*",
      "Bonjour ! Oh, comme je suis contente de te rencontrer !",
      "Je suis ton amie magique, et je suis là pour t'aider à créer les plus belles histoires du monde ! 📚✨",
    ],
    delay: 800,
  },
  {
    type: 'ai',
    messages: [
      "Mais tu sais quoi ? Je n'ai pas encore de prénom...",
      "Est-ce que tu voudrais bien m'en donner un ? 🎀",
    ],
    delay: 600,
  },
  {
    type: 'input',
    prompt: "Comment veux-tu m'appeler ?",
    placeholder: "Entre mon nouveau prénom...",
    suggestions: ['Étoile', 'Lune', 'Féerie', 'Céleste', 'Aurore', 'Iris'],
  },
  {
    type: 'ai',
    messages: [
      // Les messages ici seront dynamiques avec le nom choisi
      "Oh ! C'est un prénom magnifique ! 💖",
      "Je m'appelle {name} maintenant, et je suis TELLEMENT heureuse !",
    ],
    delay: 700,
  },
  {
    type: 'ai',
    messages: [
      "Ensemble, on va écrire des histoires incroyables ! 🌟",
      "Tu peux me parler quand tu veux, je serai toujours là pour t'aider.",
      "Allez, on commence cette aventure ? 🚀",
    ],
    delay: 600,
    isFinal: true,
  },
]

export function AIWelcomeSequence({ isOpen, onComplete }: AIWelcomeSequenceProps) {
  const { setAiName } = useAppStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [displayedMessages, setDisplayedMessages] = useState<Array<{ type: 'ai' | 'user'; text: string }>>([])
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [chosenName, setChosenName] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayedMessages, isTyping])

  // Focus sur l'input quand il apparaît
  useEffect(() => {
    if (showInput) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [showInput])

  // Afficher les messages progressivement
  useEffect(() => {
    if (!isOpen) return

    const step = CONVERSATION_STEPS[currentStep]
    if (!step) return

    if (step.type === 'ai') {
      const messages = step.messages.map(msg => 
        msg.replace('{name}', chosenName)
      )

      if (currentMessageIndex < messages.length) {
        setIsTyping(true)

        // Simuler le typing
        const typingDuration = messages[currentMessageIndex].length * 20 + 500

        const typingTimeout = setTimeout(() => {
          setDisplayedMessages(prev => [...prev, { type: 'ai', text: messages[currentMessageIndex] }])
          setIsTyping(false)
          
          // Lecture vocale (si activée)
          if (isSpeaking && 'speechSynthesis' in window) {
            const cleanText = messages[currentMessageIndex].replace(/[✨💖🌟🚀📚🎀*]/g, '')
            const utterance = new SpeechSynthesisUtterance(cleanText)
            utterance.lang = 'fr-FR'
            utterance.rate = 0.9
            utterance.pitch = 1.2
            speechSynthesis.speak(utterance)
          }
          
          // Prochain message
          setTimeout(() => {
            setCurrentMessageIndex(prev => prev + 1)
          }, step.delay)
        }, typingDuration)

        return () => clearTimeout(typingTimeout)
      } else {
        // Tous les messages de cette étape sont affichés
        if (step.isFinal) {
          // Fin de la conversation
          setTimeout(() => {
            onComplete()
          }, 2000)
        } else {
          // Passer à l'étape suivante
          setTimeout(() => {
            setCurrentStep(prev => prev + 1)
            setCurrentMessageIndex(0)
          }, 500)
        }
      }
    } else if (step.type === 'input') {
      setShowInput(true)
    }
  }, [isOpen, currentStep, currentMessageIndex, chosenName, isSpeaking, onComplete])

  // Gérer la soumission du nom
  const handleSubmitName = () => {
    if (!inputValue.trim()) return

    const name = inputValue.trim()
    setChosenName(name)
    setAiName(name)
    setDisplayedMessages(prev => [...prev, { type: 'user', text: name }])
    setShowInput(false)
    setInputValue('')

    // Passer à l'étape suivante après un court délai
    setTimeout(() => {
      setCurrentStep(prev => prev + 1)
      setCurrentMessageIndex(0)
    }, 500)
  }

  // Gérer le clic sur une suggestion
  const handleSuggestionClick = (name: string) => {
    setInputValue(name)
  }

  if (!isOpen) return null

  const currentStepData = CONVERSATION_STEPS[currentStep]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse at center, #1a1832 0%, #0d0c1a 70%, #000 100%)',
      }}
    >
      {/* Étoiles de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Conteneur principal */}
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-lg"
      >
        {/* Avatar de l'IA */}
        <motion.div
          className="absolute -top-16 left-1/2 -translate-x-1/2 z-10"
          animate={{
            y: [0, -5, 0],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <div className="relative">
            <motion.div
              className="w-24 h-24 rounded-full bg-gradient-to-br from-aurora-400 to-aurora-600 flex items-center justify-center shadow-lg shadow-aurora-500/50"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(233, 121, 249, 0.5)',
                  '0 0 40px rgba(233, 121, 249, 0.8)',
                  '0 0 20px rgba(233, 121, 249, 0.5)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-4xl">✨</span>
            </motion.div>
            
            {/* Indicateur de parole */}
            {isTyping && (
              <motion.div
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-dream-500 flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <span className="text-sm">💬</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Zone de chat */}
        <div className="bg-midnight-900/90 backdrop-blur-xl rounded-3xl border border-aurora-500/30 overflow-hidden shadow-2xl shadow-aurora-500/20 pt-12">
          {/* Bouton son */}
          <motion.button
            onClick={() => setIsSpeaking(!isSpeaking)}
            className="absolute top-4 right-4 p-2 rounded-full bg-midnight-800/50 text-midnight-400 hover:text-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </motion.button>

          {/* Messages */}
          <div className="p-6 h-[300px] overflow-y-auto space-y-4">
            <AnimatePresence mode="popLayout">
              {displayedMessages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                      msg.type === 'user'
                        ? 'bg-aurora-600 text-white rounded-br-md'
                        : 'bg-midnight-800/80 text-midnight-100 rounded-bl-md border border-aurora-500/20'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Indicateur de typing */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-midnight-800/80 border border-aurora-500/20">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-aurora-400"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Zone d'input */}
          <AnimatePresence>
            {showInput && currentStepData?.type === 'input' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-4 border-t border-aurora-500/20 bg-midnight-800/50"
              >
                {/* Suggestions */}
                <div className="flex flex-wrap gap-2 mb-3 justify-center">
                  {currentStepData.suggestions?.map((name) => (
                    <motion.button
                      key={name}
                      onClick={() => handleSuggestionClick(name)}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                        inputValue === name
                          ? 'bg-aurora-500 text-white shadow-lg shadow-aurora-500/30'
                          : 'bg-midnight-700/50 text-midnight-300 hover:bg-midnight-700 hover:text-white border border-midnight-600'
                      }`}
                    >
                      ✨ {name}
                    </motion.button>
                  ))}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitName()}
                    placeholder={currentStepData.placeholder}
                    maxLength={20}
                    className="flex-1 px-4 py-3 text-white placeholder-midnight-400 bg-midnight-800 border border-aurora-500/30 rounded-xl focus:border-aurora-500 focus:ring-2 focus:ring-aurora-500/20 outline-none transition-all"
                  />
                  <motion.button
                    onClick={handleSubmitName}
                    disabled={!inputValue.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all ${
                      inputValue.trim()
                        ? 'bg-gradient-to-r from-aurora-500 to-stardust-500 text-white shadow-lg shadow-aurora-500/30'
                        : 'bg-midnight-700 text-midnight-500 cursor-not-allowed'
                    }`}
                  >
                    <Heart className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message final */}
          {currentStep === CONVERSATION_STEPS.length - 1 && !isTyping && currentMessageIndex >= CONVERSATION_STEPS[currentStep].messages.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 border-t border-aurora-500/20 bg-midnight-800/50 text-center"
            >
              <motion.button
                onClick={onComplete}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-aurora-500 to-dream-500 text-white font-semibold shadow-lg shadow-aurora-500/30"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Commencer l'aventure !
                </span>
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default AIWelcomeSequence
