'use client'

/**
 * Séquence d'accueil interactive avec l'IA-Amie
 * L'enfant découvre et nomme son compagnon à travers une conversation magique
 * Puis choisit la voix de son ami(e)
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Heart, Volume2, VolumeX, Star, Check, Play } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

interface AIWelcomeSequenceProps {
  isOpen: boolean
  onComplete: () => void
  /** Mode voix seulement (quand on change de navigateur) */
  voiceOnlyMode?: boolean
}

interface VoiceInfo {
  name: string
  lang: string
  isPremium: boolean
  isRecommended: boolean
}

// Voix premium connues (haute qualité)
const PREMIUM_VOICES = ['Audrey', 'Amélie', 'Thomas', 'Samantha', 'Karen', 'Daniel', 'Milena', 'Google']

// Voix recommandées par langue
const RECOMMENDED_VOICES: Record<string, string[]> = {
  fr: ['Audrey', 'Amélie', 'Thomas', 'Google français'],
  en: ['Samantha', 'Karen', 'Daniel', 'Google US English'],
  ru: ['Milena', 'Yuri', 'Google русский'],
}

// Types pour les étapes
interface AIStep {
  id: string
  type: 'ai'
  messages: string[]
  delay: number
  isFinal?: boolean
}

interface InputStep {
  id: string
  type: 'input'
  prompt: string
  placeholder: string
  suggestions: string[]
}

interface VoiceStep {
  id: string
  type: 'voice'
  prompt: string
}

type ConversationStep = AIStep | InputStep | VoiceStep

// Types d'input
type InputType = 'ai-name' | 'child-name'

interface InputStepExtended extends InputStep {
  inputType: InputType
}

// Messages de la conversation
const CONVERSATION_STEPS: ConversationStep[] = [
  {
    id: 'intro',
    type: 'ai',
    messages: [
      "✨ *Une douce lumière apparaît...*",
      "Bonjour ! Oh, comme je suis contente de te rencontrer !",
      "Je suis ton amie magique, et je suis là pour t'aider à créer les plus belles histoires du monde ! 📚✨",
    ],
    delay: 800,
  },
  {
    id: 'ask-child-name',
    type: 'ai',
    messages: [
      "Dis-moi, comment tu t'appelles ? 🌟",
    ],
    delay: 600,
  },
  {
    id: 'child-name-input',
    type: 'input',
    inputType: 'child-name',
    prompt: "Quel est ton prénom ?",
    placeholder: "Entre ton prénom...",
    suggestions: ['Luna', 'Léo', 'Emma', 'Noah', 'Jade', 'Lucas'],
  } as InputStepExtended,
  {
    id: 'child-name-response',
    type: 'ai',
    messages: [
      "Oh ! {childName}, c'est un très joli prénom ! 💫",
      "Enchantée {childName} !",
    ],
    delay: 700,
  },
  {
    id: 'ask-ai-name',
    type: 'ai',
    messages: [
      "Mais tu sais quoi {childName} ? Je n'ai pas encore de prénom moi...",
      "Est-ce que tu voudrais bien m'en donner un ? 🎀",
    ],
    delay: 600,
  },
  {
    id: 'ai-name-input',
    type: 'input',
    inputType: 'ai-name',
    prompt: "Comment veux-tu m'appeler ?",
    placeholder: "Entre mon nouveau prénom...",
    suggestions: ['Étoile', 'Féerie', 'Céleste', 'Aurore', 'Iris', 'Marie'],
  } as InputStepExtended,
  {
    id: 'ai-name-response',
    type: 'ai',
    messages: [
      "Oh ! C'est un prénom magnifique ! 💖",
      "Je m'appelle {name} maintenant, et je suis TELLEMENT heureuse !",
      "Merci {childName} !",
    ],
    delay: 700,
  },
  {
    id: 'ask-voice',
    type: 'ai',
    messages: [
      "Maintenant {childName}, j'aimerais savoir... 🎤",
      "Quelle voix tu préfères pour moi ? Écoute et choisis celle qui te plaît !",
    ],
    delay: 600,
  },
  {
    id: 'voice-select',
    type: 'voice',
    prompt: "Choisis ma voix !",
  },
  {
    id: 'voice-response',
    type: 'ai',
    messages: [
      "J'adore cette voix ! 🎵",
      "Maintenant je peux te parler avec ma nouvelle voix !",
    ],
    delay: 600,
  },
  {
    id: 'final',
    type: 'ai',
    messages: [
      "Ensemble {childName}, on va écrire des histoires incroyables ! 🌟",
      "Tu peux me parler quand tu veux, je serai toujours là pour t'aider.",
      "Allez {childName}, on commence cette aventure ? 🚀",
    ],
    delay: 600,
    isFinal: true,
  },
]

// Version pour le mode voix seulement
const VOICE_ONLY_STEPS: ConversationStep[] = [
  {
    id: 'voice-intro',
    type: 'ai',
    messages: [
      "Coucou {name} ! 👋",
      "Je vois que tu utilises un nouveau navigateur !",
      "On doit choisir ma voix à nouveau. 🎤",
    ],
    delay: 600,
  },
  {
    id: 'voice-select',
    type: 'voice',
    prompt: "Choisis ma voix !",
  },
  {
    id: 'voice-done',
    type: 'ai',
    messages: [
      "Parfait ! Me revoilà avec ma voix ! 🎵",
      "On peut continuer notre aventure ! 🚀",
    ],
    delay: 600,
    isFinal: true,
  },
]

export function AIWelcomeSequence({ isOpen, onComplete, voiceOnlyMode = false }: AIWelcomeSequenceProps) {
  const { setAiName, setAiVoice, aiName, userName, setUserName } = useAppStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [displayedMessages, setDisplayedMessages] = useState<Array<{ type: 'ai' | 'user'; text: string }>>([])
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [chosenName, setChosenName] = useState(voiceOnlyMode ? aiName : '')
  const [chosenChildName, setChosenChildName] = useState(voiceOnlyMode ? userName : '')
  const [currentInputType, setCurrentInputType] = useState<InputType | null>(null)
  const [showInput, setShowInput] = useState(false)
  const [showVoiceSelector, setShowVoiceSelector] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(true)
  const [availableVoices, setAvailableVoices] = useState<VoiceInfo[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  const [testingVoice, setTestingVoice] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const steps = voiceOnlyMode ? VOICE_ONLY_STEPS : CONVERSATION_STEPS

  // Charger les voix disponibles
  useEffect(() => {
    if (!isOpen) return
    
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices()
        const frenchVoices = voices
          .filter(v => v.lang.startsWith('fr'))
          .map(v => ({
            name: v.name,
            lang: v.lang,
            isPremium: PREMIUM_VOICES.some(p => v.name.includes(p)),
            isRecommended: RECOMMENDED_VOICES.fr.some(r => v.name.includes(r)),
          }))
          // Trier : Premium d'abord, puis recommandées
          .sort((a, b) => {
            if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1
            if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1
            return 0
          })
        
        setAvailableVoices(frenchVoices)
        
        // Sélectionner la première voix par défaut
        if (frenchVoices.length > 0 && !selectedVoice) {
          setSelectedVoice(frenchVoices[0].name)
        }
      }
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [isOpen, selectedVoice])

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

    const step = steps[currentStep]
    if (!step) return

    if (step.type === 'ai') {
      const aiStep = step as AIStep
      const messages = aiStep.messages.map(msg => 
        msg
          .replace(/{name}/g, chosenName || aiName || '')
          .replace(/{childName}/g, chosenChildName || userName || '')
      )

      if (currentMessageIndex < messages.length) {
        setIsTyping(true)

        const typingDuration = messages[currentMessageIndex].length * 20 + 500

        const typingTimeout = setTimeout(() => {
          setDisplayedMessages(prev => [...prev, { type: 'ai', text: messages[currentMessageIndex] }])
          setIsTyping(false)
          
          // Lecture vocale (si activée)
          if (isSpeaking && 'speechSynthesis' in window) {
            const cleanText = messages[currentMessageIndex].replace(/[✨💖🌟🚀📚🎀🎤🎵👋*]/g, '')
            const utterance = new SpeechSynthesisUtterance(cleanText)
            utterance.lang = 'fr-FR'
            utterance.rate = 0.9
            utterance.pitch = 1.2
            
            // Utiliser la voix sélectionnée si disponible
            if (selectedVoice) {
              const voices = window.speechSynthesis.getVoices()
              const voice = voices.find(v => v.name === selectedVoice)
              if (voice) utterance.voice = voice
            }
            
            speechSynthesis.speak(utterance)
          }
          
          setTimeout(() => {
            setCurrentMessageIndex(prev => prev + 1)
          }, aiStep.delay)
        }, typingDuration)

        return () => clearTimeout(typingTimeout)
      } else {
        if (aiStep.isFinal) {
          setTimeout(() => {
            onComplete()
          }, 2000)
        } else {
          setTimeout(() => {
            setCurrentStep(prev => prev + 1)
            setCurrentMessageIndex(0)
          }, 500)
        }
      }
    } else if (step.type === 'input') {
      const inputStep = step as InputStepExtended
      setCurrentInputType(inputStep.inputType || 'ai-name')
      setShowInput(true)
    } else if (step.type === 'voice') {
      setShowVoiceSelector(true)
    }
  }, [isOpen, currentStep, currentMessageIndex, chosenName, chosenChildName, aiName, userName, isSpeaking, onComplete, selectedVoice, steps])

  // Tester une voix
  const handleTestVoice = (voiceName: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setTestingVoice(voiceName)
      
      const testText = `Bonjour ! Je suis ${chosenName || aiName || 'ton amie'}, et voici ma voix !`
      const utterance = new SpeechSynthesisUtterance(testText)
      utterance.lang = 'fr-FR'
      utterance.rate = 0.95
      utterance.pitch = 1.1
      
      const voices = window.speechSynthesis.getVoices()
      const voice = voices.find(v => v.name === voiceName)
      if (voice) utterance.voice = voice
      
      utterance.onend = () => setTestingVoice(null)
      utterance.onerror = () => setTestingVoice(null)
      
      window.speechSynthesis.speak(utterance)
    }
  }

  // Sélectionner une voix et passer à l'étape suivante
  const handleSelectVoice = () => {
    if (!selectedVoice) return
    
    setAiVoice(selectedVoice)
    setDisplayedMessages(prev => [...prev, { type: 'user', text: `🎤 ${selectedVoice.split(' ')[0]}` }])
    setShowVoiceSelector(false)
    
    setTimeout(() => {
      setCurrentStep(prev => prev + 1)
      setCurrentMessageIndex(0)
    }, 500)
  }

  // Gérer la soumission du nom (enfant ou IA)
  const handleSubmitName = () => {
    if (!inputValue.trim()) return

    const name = inputValue.trim()
    
    if (currentInputType === 'child-name') {
      // Prénom de l'enfant
      setChosenChildName(name)
      setUserName(name)
    } else {
      // Nom de l'IA
      setChosenName(name)
      setAiName(name)
    }
    
    setDisplayedMessages(prev => [...prev, { type: 'user', text: name }])
    setShowInput(false)
    setInputValue('')
    setCurrentInputType(null)

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

  const currentStepData = steps[currentStep]

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
          animate={{ y: [0, -5, 0] }}
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
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Zone d'input pour le nom */}
          <AnimatePresence>
            {showInput && currentStepData?.type === 'input' && (() => {
              const inputStep = currentStepData as InputStep
              return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-4 border-t border-aurora-500/20 bg-midnight-800/50"
              >
                <div className="flex flex-wrap gap-2 mb-3 justify-center">
                  {inputStep.suggestions.map((name: string) => (
                    <motion.button
                      key={name}
                      onClick={() => handleSuggestionClick(name)}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-full transition-all',
                        inputValue === name
                          ? 'bg-aurora-500 text-white shadow-lg shadow-aurora-500/30'
                          : 'bg-midnight-700/50 text-midnight-300 hover:bg-midnight-700 hover:text-white border border-midnight-600'
                      )}
                    >
                      ✨ {name}
                    </motion.button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitName()}
                    placeholder={inputStep.placeholder}
                    maxLength={20}
                    className="flex-1 px-4 py-3 text-white placeholder-midnight-400 bg-midnight-800 border border-aurora-500/30 rounded-xl focus:ring-2 focus:border-aurora-500 focus:ring-aurora-500/20 outline-none transition-all"
                  />
                  <motion.button
                    onClick={handleSubmitName}
                    disabled={!inputValue.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'px-4 py-3 rounded-xl flex items-center gap-2 transition-all',
                      inputValue.trim()
                        ? 'bg-gradient-to-r from-aurora-500 to-stardust-500 text-white shadow-lg shadow-aurora-500/30'
                        : 'bg-midnight-700 text-midnight-500 cursor-not-allowed'
                    )}
                  >
                    <Heart className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
              )
            })()}
          </AnimatePresence>

          {/* Zone de sélection de voix */}
          <AnimatePresence>
            {showVoiceSelector && currentStepData?.type === 'voice' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-4 border-t border-aurora-500/20 bg-midnight-800/50"
              >
                <p className="text-xs text-midnight-400 mb-3 text-center">
                  🎤 Voix disponibles sur ton navigateur
                </p>
                
                <div className="space-y-2 max-h-[200px] overflow-y-auto mb-4">
                  {availableVoices.length === 0 ? (
                    <p className="text-sm text-midnight-500 text-center py-4">
                      Chargement des voix...
                    </p>
                  ) : (
                    availableVoices.map((voice) => (
                      <motion.button
                        key={voice.name}
                        onClick={() => setSelectedVoice(voice.name)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={cn(
                          'w-full p-3 rounded-xl flex items-center gap-3 transition-all',
                          selectedVoice === voice.name
                            ? 'bg-aurora-500/20 border-2 border-aurora-500'
                            : 'bg-midnight-700/50 border border-midnight-600 hover:border-aurora-500/50'
                        )}
                      >
                        {/* Indicateur de sélection */}
                        <div className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                          selectedVoice === voice.name
                            ? 'border-aurora-500 bg-aurora-500'
                            : 'border-midnight-500'
                        )}>
                          {selectedVoice === voice.name && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        
                        {/* Nom de la voix */}
                        <div className="flex-1 text-left">
                          <p className="text-sm text-white font-medium">
                            {voice.name.split(' ')[0]}
                          </p>
                          <p className="text-xs text-midnight-400">{voice.lang}</p>
                        </div>
                        
                        {/* Badge Premium */}
                        {voice.isPremium && (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1">
                            <Star className="w-3 h-3" /> Premium
                          </span>
                        )}
                        
                        {/* Bouton tester */}
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTestVoice(voice.name)
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            testingVoice === voice.name
                              ? 'bg-aurora-500 text-white'
                              : 'bg-midnight-600 text-midnight-300 hover:text-white'
                          )}
                        >
                          <Play className={cn('w-4 h-4', testingVoice === voice.name && 'animate-pulse')} />
                        </motion.button>
                      </motion.button>
                    ))
                  )}
                </div>
                
                {/* Bouton valider */}
                <motion.button
                  onClick={handleSelectVoice}
                  disabled={!selectedVoice}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'w-full py-3 rounded-xl font-medium transition-all',
                    selectedVoice
                      ? 'bg-gradient-to-r from-aurora-500 to-stardust-500 text-white shadow-lg shadow-aurora-500/30'
                      : 'bg-midnight-700 text-midnight-500 cursor-not-allowed'
                  )}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Volume2 className="w-5 h-5" />
                    C'est cette voix !
                  </span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message final */}
          {currentStepData?.type === 'ai' && (currentStepData as AIStep).isFinal && !isTyping && currentMessageIndex >= (currentStepData as AIStep).messages.length && (
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
