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
  Loader2,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useStudioStore } from '@/store/useStudioStore'
import { 
  useStudioProgressStore,
  type CreationType,
  type GuideStep,
  IMAGE_MAGIC_KEYS,
  VIDEO_MAGIC_KEYS,
} from '@/store/useStudioProgressStore'
import { useTTS } from '@/hooks/useTTS'
import { cn } from '@/lib/utils'

// Mots-clés pour détection (copie de PromptBuilder pour cohérence)
const STYLE_KEYWORDS = ['dessin', 'photo', 'magique', 'anime', 'aquarelle', 'pixel', 'réaliste', 'cartoon', '3d']
const AMBIANCE_KEYWORDS = ['jour', 'nuit', 'orage', 'brume', 'féérique', 'mystère', 'sombre', 'lumineux', 'matin', 'soir']
const DETAIL_KEYWORDS = ['rouge', 'bleu', 'vert', 'doré', 'brillant', 'grand', 'petit', 'géant']
// Mots-clés spécifiques aux vidéos
const VIDEO_MOVEMENT_KEYWORDS = ['bouge', 'anime', 'danse', 'court', 'vole', 'tombe', 'saute', 'marche', 'tourne']
const VIDEO_RHYTHM_KEYWORDS = ['lent', 'rapide', 'doucement', 'vite', 'dynamique', 'calme', 'fluide']

function detectMissingElements(
  text: string, 
  hasStyleButton: boolean, 
  hasAmbianceButton: boolean,
  creationType: 'image' | 'video' = 'image'
): string[] {
  const lowerText = text.toLowerCase()
  const missing: string[] = []
  
  // Si pas de boutons (niveau 3+), on détecte dans le texte
  if (!hasStyleButton) {
    const hasStyle = STYLE_KEYWORDS.some(kw => lowerText.includes(kw))
    if (!hasStyle) missing.push('style (dessin, photo, magique...)')
  }
  
  if (!hasAmbianceButton) {
    const hasAmbiance = AMBIANCE_KEYWORDS.some(kw => lowerText.includes(kw))
    if (!hasAmbiance) missing.push('ambiance (jour, nuit, orage...)')
  }
  
  const hasDetails = DETAIL_KEYWORDS.some(kw => lowerText.includes(kw))
  if (!hasDetails && text.length > 20) missing.push('détails (couleurs, tailles...)')
  
  // Spécifique aux vidéos
  if (creationType === 'video') {
    const hasMovement = VIDEO_MOVEMENT_KEYWORDS.some(kw => lowerText.includes(kw))
    if (!hasMovement && text.length > 10) missing.push('mouvement (ce qui bouge, comment ça bouge)')
    
    const hasRhythm = VIDEO_RHYTHM_KEYWORDS.some(kw => lowerText.includes(kw))
    if (!hasRhythm && text.length > 30) missing.push('rythme (lent, rapide, fluide...)')
  }
  
  return missing
}

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
  const { currentKit } = useStudioStore()
  const { 
    currentStep, 
    getLevel, 
    needsHelp,
    requestHelp,
    completedSteps,
  } = useStudioProgressStore()
  
  const level = getLevel(type)
  const tts = useTTS('fr')
  
  // Détecter ce qui manque pour guider l'enfant
  const showStyleButtons = level < 3
  const showAmbianceButtons = level < 3
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastStepRef = useRef<string | null>(null)

  // Nom de l'IA (ou défaut)
  const friendName = aiName || 'Mon amie'

  // Réinitialiser les messages quand le type change
  useEffect(() => {
    setMessages([])
    lastStepRef.current = null
  }, [type])

  // Ajouter un message de l'IA quand l'étape change
  useEffect(() => {
    // Créer une clé unique pour éviter les doublons
    const stepKey = `${type}-${currentStep}-${level}`
    
    // Éviter de réajouter le même message
    if (lastStepRef.current === stepKey) {
      return
    }
    lastStepRef.current = stepKey
    
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

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')

    // Ajouter le message de l'enfant
    const childMessage: Message = {
      id: Date.now().toString(),
      role: 'child',
      content: userMessage,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, childMessage])
    
    // Transmettre la suggestion au parent (pour le prompt builder)
    onSuggestion?.(userMessage)
    
    // Appeler l'API de chat pour une vraie réponse
    setIsLoading(true)
    
    try {
      // Construire l'historique pour l'API
      const chatHistory = messages.slice(-10).map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content,
      }))
      
      // Calculer les éléments manquants pour guider l'IA
      const kitText = (currentKit?.subject || '') + ' ' + (currentKit?.subjectDetails || '')
      const missingElements = detectMissingElements(kitText, showStyleButtons, showAmbianceButtons, type)
      
      // Ajouter les éléments manquants selon les boutons (niveau 1-2)
      if (showStyleButtons && !currentKit?.style && !missingElements.includes('style')) {
        missingElements.push('style')
      }
      if (showAmbianceButtons && !currentKit?.ambiance && !missingElements.includes('ambiance')) {
        missingElements.push('ambiance')
      }
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: 'studio',
          chatHistory,
          aiName: friendName,
          studioContext: {
            type,
            currentStep,
            level,
            // NOUVEAU : état du kit pour que l'IA sache ce qui manque
            kit: currentKit ? {
              subject: currentKit.subject,
              subjectDetails: currentKit.subjectDetails,
              style: currentKit.style,
              ambiance: currentKit.ambiance,
              light: currentKit.light,
            } : null,
            missingElements,
            completedSteps,
          },
        }),
      })
      
      if (!response.ok) {
        throw new Error('Erreur API')
      }
      
      const data = await response.json()
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.text || data.response || "Je n'ai pas compris, tu peux répéter ? 💜",
        timestamp: new Date(),
        type: 'question',
      }
      setMessages(prev => [...prev, aiResponse])
      
      if (voiceEnabled && tts.isAvailable) {
        tts.speak(aiResponse.content)
      }
    } catch (error) {
      console.error('Erreur chat IA:', error)
      // Fallback avec un message d'encouragement si l'API échoue
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `Oups, j'ai eu un petit souci ! 😅 Mais je t'ai bien entendu dire "${userMessage}". C'est une super idée ! Continue ! ✨`,
        timestamp: new Date(),
        type: 'encouragement',
      }
      setMessages(prev => [...prev, fallbackMessage])
      
      if (voiceEnabled && tts.isAvailable) {
        tts.speak(fallbackMessage.content)
      }
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
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
          
          {/* Indicateur de chargement */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-aurora-500/30">
                <Loader2 className="w-4 h-4 text-aurora-400 animate-spin" />
              </div>
              <div className="bg-midnight-800/70 rounded-2xl px-4 py-3">
                <p className="text-sm text-midnight-300">Je réfléchis... ✨</p>
              </div>
            </motion.div>
          )}
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
            disabled={!inputValue.trim() || isLoading}
            className={cn(
              'p-3 rounded-xl transition-colors',
              inputValue.trim() && !isLoading
                ? 'bg-aurora-500 text-white hover:bg-aurora-600'
                : 'bg-midnight-800/50 text-midnight-600 cursor-not-allowed'
            )}
            whileHover={inputValue.trim() && !isLoading ? { scale: 1.05 } : {}}
            whileTap={inputValue.trim() && !isLoading ? { scale: 0.95 } : {}}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
