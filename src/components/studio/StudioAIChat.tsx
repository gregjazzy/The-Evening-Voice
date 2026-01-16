'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX,
  Sparkles,
  Lightbulb,
  ThumbsUp,
  HelpCircle,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { 
  useStudioProgressStore,
  type CreationType,
  type GuideStep,
  IMAGE_MAGIC_KEYS,
  VIDEO_MAGIC_KEYS,
} from '@/store/useStudioProgressStore'
import { useTTS } from '@/hooks/useTTS'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'ai' | 'child'
  content: string
  timestamp: Date
  type?: 'question' | 'encouragement' | 'help' | 'celebration'
}

interface StudioAIChatProps {
  type: CreationType
  onSuggestion?: (suggestion: string) => void
  className?: string
}

// Messages de l'IA selon l'étape et le niveau
const getAIMessage = (
  step: GuideStep | null,
  type: CreationType,
  level: number,
  aiName: string
): { content: string; type: Message['type'] } => {
  const magicKeys = type === 'image' ? IMAGE_MAGIC_KEYS : VIDEO_MAGIC_KEYS
  
  if (!step) {
    return {
      content: `Salut ! Je suis ${aiName}, ton amie ! 🌟\n\nQu'est-ce que tu veux créer aujourd'hui ? Une ${type === 'image' ? 'image' : 'vidéo'} magique ?`,
      type: 'question',
    }
  }

  switch (step) {
    case 'describe':
      if (level === 1) {
        return {
          content: `Raconte-moi ce que tu imagines ! 💭\n\nPar exemple : "Un dragon qui vole au-dessus d'un château" ou "Une fée dans une forêt magique"`,
          type: 'question',
        }
      }
      return {
        content: `Qu'est-ce que tu veux créer ? Décris-moi ton idée ! ✨`,
        type: 'question',
      }

    case 'choose_style':
      const styleKey = magicKeys.find(k => k.id === 'style')
      return {
        content: `Super idée ! 🎨\n\nMaintenant, ${styleKey?.question}\n\nChoisis un style qui te plaît !`,
        type: 'question',
      }

    case 'choose_mood':
      const moodKey = magicKeys.find(k => k.id === 'mood')
      return {
        content: `J'adore ! 💫\n\n${moodKey?.question}\n\nL'ambiance, c'est l'émotion qu'on ressent en voyant ta création !`,
        type: 'question',
      }

    case 'choose_extra':
      if (type === 'image') {
        return {
          content: `On y est presque ! ✨\n\nEst-ce qu'il y a des détails que tu voudrais ajouter ? Des couleurs spéciales, une lumière particulière ?`,
          type: 'question',
        }
      }
      return {
        content: `Excellent choix ! 🎬\n\nComment tu veux que ça bouge ? Lentement et doucement, ou avec de l'action ?`,
        type: 'question',
      }

    case 'review_prompt':
      return {
        content: `Regarde le prompt que j'ai préparé ! 📋\n\nC'est ça qu'on va envoyer pour créer ta ${type === 'image' ? 'image' : 'vidéo'}. Tu peux le modifier si tu veux !`,
        type: 'help',
      }

    case 'open_safari':
      if (level >= 4) {
        return {
          content: `Tu es prête ! 🚀\n\nClique sur le bouton pour aller sur ${type === 'image' ? 'Midjourney' : 'Runway'}. Tu sais comment faire maintenant !`,
          type: 'encouragement',
        }
      }
      return {
        content: `Maintenant on va sur Safari ! 🚀\n\nRegarde bien, je vais te montrer comment faire...`,
        type: 'help',
      }

    case 'paste_prompt':
      if (level >= 3) {
        return {
          content: `Colle ton prompt avec Cmd+V ! 📋\n\nTu te souviens ? C'est comme quand on colle une image !`,
          type: 'help',
        }
      }
      return {
        content: `Je colle le prompt pour toi ! 📋\n\nRegarde bien où je le mets pour la prochaine fois...`,
        type: 'help',
      }

    case 'generate':
      return {
        content: `C'est parti ! 🎨\n\nMaintenant on attend que la magie opère... ✨`,
        type: 'encouragement',
      }

    case 'import':
      return {
        content: `Waouh, c'est magnifique ! 🎉\n\nMaintenant, importe ta création pour la garder !`,
        type: 'celebration',
      }

    default:
      return {
        content: `Je suis là si tu as besoin d'aide ! 💜`,
        type: 'help',
      }
  }
}

// Messages d'encouragement aléatoires
const ENCOURAGEMENTS = [
  "Tu fais du super travail ! 🌟",
  "J'adore ton idée ! 💜",
  "Tu deviens vraiment forte ! 💪",
  "Continue comme ça ! ✨",
  "Tu es très créative ! 🎨",
  "Waouh, quelle imagination ! 🌈",
]

// Messages d'aide
const HELP_MESSAGES = [
  "Pas de souci, je suis là pour t'aider ! 💜",
  "C'est normal de ne pas savoir du premier coup ! 🌟",
  "On apprend ensemble, c'est ça qui est chouette ! ✨",
  "Prends ton temps, il n'y a pas de pression ! 🌈",
]

export function StudioAIChat({ type, onSuggestion, className }: StudioAIChatProps) {
  const { aiName } = useAppStore()
  const { 
    currentStep, 
    getLevel, 
    needsHelp,
    requestHelp,
  } = useStudioProgressStore()
  
  const level = getLevel(type)
  const tts = useTTS('fr')
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Nom de l'IA (ou défaut)
  const friendName = aiName || 'Mon amie'

  // Ajouter un message de l'IA quand l'étape change
  useEffect(() => {
    const aiMessage = getAIMessage(currentStep, type, level, friendName)
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'ai',
      content: aiMessage.content,
      timestamp: new Date(),
      type: aiMessage.type,
    }
    
    setMessages(prev => [...prev, newMessage])
    
    // Lire à voix haute si activé
    if (voiceEnabled && tts.isAvailable) {
      tts.speak(aiMessage.content)
    }
  }, [currentStep, type, level, friendName])

  // Scroll vers le bas quand nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Gérer l'aide demandée
  useEffect(() => {
    if (needsHelp) {
      const helpMessage = HELP_MESSAGES[Math.floor(Math.random() * HELP_MESSAGES.length)]
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'ai',
        content: helpMessage + "\n\nQu'est-ce qui te bloque ? Je peux t'expliquer ou te montrer !",
        timestamp: new Date(),
        type: 'help',
      }
      setMessages(prev => [...prev, newMessage])
      
      if (voiceEnabled && tts.isAvailable) {
        tts.speak(newMessage.content)
      }
    }
  }, [needsHelp])

  const handleSend = () => {
    if (!inputValue.trim()) return

    // Ajouter le message de l'enfant
    const childMessage: Message = {
      id: Date.now().toString(),
      role: 'child',
      content: inputValue,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, childMessage])
    
    // Transmettre la suggestion au parent
    onSuggestion?.(inputValue)
    
    // Réponse encourageante de l'IA
    setTimeout(() => {
      const encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: encouragement,
        timestamp: new Date(),
        type: 'encouragement',
      }
      setMessages(prev => [...prev, aiResponse])
      
      if (voiceEnabled && tts.isAvailable) {
        tts.speak(encouragement)
      }
    }, 500)

    setInputValue('')
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled)
    if (voiceEnabled) {
      tts.stop()
    }
  }

  return (
    <motion.div
      className={cn(
        'glass rounded-2xl flex flex-col h-full',
        className
      )}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-midnight-700/50">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aurora-500 to-dream-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white">{friendName}</h3>
          <p className="text-xs text-aurora-300">Ton amie créative ✨</p>
        </div>
        <button
          onClick={toggleVoice}
          className={cn(
            'p-2 rounded-lg transition-colors',
            voiceEnabled 
              ? 'bg-aurora-500/20 text-aurora-300' 
              : 'bg-midnight-800/50 text-midnight-400'
          )}
          title={voiceEnabled ? 'Désactiver la voix' : 'Activer la voix'}
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex gap-3',
                message.role === 'child' && 'justify-end'
              )}
            >
              {message.role === 'ai' && (
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  message.type === 'celebration' && 'bg-dream-500/30',
                  message.type === 'encouragement' && 'bg-aurora-500/30',
                  message.type === 'help' && 'bg-stardust-500/30',
                  message.type === 'question' && 'bg-aurora-500/30',
                  !message.type && 'bg-midnight-700',
                )}>
                  {message.type === 'celebration' && '🎉'}
                  {message.type === 'encouragement' && <ThumbsUp className="w-4 h-4 text-aurora-400" />}
                  {message.type === 'help' && <HelpCircle className="w-4 h-4 text-stardust-400" />}
                  {message.type === 'question' && <Lightbulb className="w-4 h-4 text-aurora-400" />}
                  {!message.type && <Sparkles className="w-4 h-4 text-aurora-400" />}
                </div>
              )}
              
              <div className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3',
                message.role === 'ai' && 'bg-midnight-800/70 text-white',
                message.role === 'child' && 'bg-aurora-500/20 text-white',
              )}>
                <p className="text-sm whitespace-pre-line">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-midnight-700/50">
        <div className="flex gap-2">
          <button
            onClick={() => setIsListening(!isListening)}
            className={cn(
              'p-3 rounded-xl transition-colors',
              isListening
                ? 'bg-red-500/20 text-red-400 animate-pulse'
                : 'bg-midnight-800/50 text-midnight-400 hover:text-white'
            )}
            title={isListening ? 'Arrêter' : 'Parler'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Écris ta réponse..."
            className="flex-1 bg-midnight-800/50 rounded-xl px-4 py-3 text-white placeholder:text-midnight-500 text-sm focus:ring-2 focus:ring-aurora-500/30 focus:outline-none"
          />
          
          <motion.button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={cn(
              'p-3 rounded-xl transition-colors',
              inputValue.trim()
                ? 'bg-aurora-500 text-white hover:bg-aurora-600'
                : 'bg-midnight-800/50 text-midnight-600 cursor-not-allowed'
            )}
            whileHover={inputValue.trim() ? { scale: 1.05 } : {}}
            whileTap={inputValue.trim() ? { scale: 0.95 } : {}}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
