'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  WifiOff,
  Wand2,
  Palette,
  Sun,
  Zap,
  Settings,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { VoiceSelector } from '@/components/ui/VoiceSelector'
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

// ============================================
// FALLBACKS HORS-LIGNE / ERREUR IA
// ============================================

// Messages de fallback variés quand l'IA ne répond pas
const FALLBACK_MESSAGES = [
  (msg: string) => `Oh, j'ai eu un petit bug ! 😅 Mais "${msg}" ça sonne super bien ! Continue ! ✨`,
  (msg: string) => `Hmm, ma magie a fait une pause ! 🔮 Mais ton idée "${msg}" est géniale, je suis sûre ! 🌟`,
  (msg: string) => `Oups, petite déconnexion magique ! ✨ Mais je vois que tu parles de "${msg}", c'est super créatif ! 💜`,
  (msg: string) => `Ma baguette magique a glitché ! 🪄 Pas grave, ton idée est sûrement super ! Continue d'imaginer ! 🌈`,
  (msg: string) => `Attends, je me reconnecte... Ah zut ! 😊 En attendant, fais-moi confiance : "${msg}" c'est une chouette idée !`,
  (msg: string) => `Les étoiles sont un peu fatiguées ! ⭐ Mais je suis sûre que ce que tu imagines est magnifique ! 💫`,
  (msg: string) => `Oh là là, j'ai perdu le fil une seconde ! 🧵 Mais continue, tu fais du super travail avec "${msg}" ! 🎨`,
  (msg: string) => `Petit moment de rêverie de ma part ! 💭 Mais ton idée m'a l'air géniale, continue ! ✨`,
  (msg: string) => `Hop, petit souci technique ! 🔧 Mais ça ne m'empêche pas de t'encourager : tu as de super idées ! 🌟`,
  (msg: string) => `Ma connexion magique fait des siennes ! 🌙 Mais je sens que "${msg}" va donner quelque chose de beau ! 💜`,
]

// Messages spécifiques pour le mode hors-ligne
const OFFLINE_MESSAGES = {
  greeting: `Je suis en mode hors-ligne ! 🌙 Mais pas de souci, tu peux continuer à créer, je t'aide avec ce que je sais ! ✨`,
  help: `Même sans internet, je peux te guider ! Utilise les boutons magiques en dessous pour avancer. 🪄`,
  encouragement: [
    "Tu te débrouilles super bien même hors-ligne ! 🌟",
    "Pas besoin d'internet pour avoir de bonnes idées ! 💡",
    "Ta créativité n'a pas besoin de wifi ! 🎨",
    "Continue d'imaginer, c'est ça le plus important ! ✨",
  ],
}

// Aide prédéfinie pour le mode hors-ligne (boutons rapides)
const OFFLINE_QUICK_HELP = {
  image: [
    { id: 'subject', label: 'Quoi dessiner ?', icon: Wand2, response: "Commence par décrire CE QUE tu veux voir : un personnage, un animal, un lieu... Par exemple : 'Un dragon', 'Une princesse', 'Une forêt magique' 🎨" },
    { id: 'style', label: 'Quel style ?', icon: Palette, response: "Le style, c'est comment ça va ressembler ! Tu peux choisir : dessin animé, photo réaliste, aquarelle, pixel art, ou magique/féérique ✨" },
    { id: 'mood', label: "Quelle ambiance ?", icon: Sun, response: "L'ambiance donne l'émotion ! Est-ce que c'est : le jour/la nuit, joyeux/mystérieux, lumineux/sombre ? 🌈" },
    { id: 'details', label: 'Des détails ?', icon: Zap, response: "Les détails rendent tout unique ! Pense aux couleurs (doré, bleu), à la taille (géant, minuscule), à des éléments spéciaux (brillant, arc-en-ciel) 💎" },
  ],
  video: [
    { id: 'subject', label: 'Quoi animer ?', icon: Wand2, response: "Décris ce qui va bouger ! Un personnage qui danse, un objet qui vole, un paysage qui change... 🎬" },
    { id: 'style', label: 'Quel style ?', icon: Palette, response: "Pour une vidéo, le style peut être : réaliste, dessin animé, magique, ou même abstrait ! ✨" },
    { id: 'movement', label: 'Comment ça bouge ?', icon: Zap, response: "Décris le mouvement : est-ce que ça court, ça vole, ça tourne ? Est-ce lent et doux ou rapide et dynamique ? 🏃‍♀️" },
    { id: 'mood', label: 'Quelle ambiance ?', icon: Sun, response: "L'ambiance de ta vidéo : joyeuse, mystérieuse, épique, calme... Ça change tout ! 🌟" },
  ],
}

// Fonction pour obtenir un message de fallback aléatoire
function getRandomFallbackMessage(userMessage: string): string {
  const index = Math.floor(Math.random() * FALLBACK_MESSAGES.length)
  return FALLBACK_MESSAGES[index](userMessage.slice(0, 30))
}

// Fonction pour obtenir un encouragement offline aléatoire  
function getOfflineEncouragement(): string {
  const index = Math.floor(Math.random() * OFFLINE_MESSAGES.encouragement.length)
  return OFFLINE_MESSAGES.encouragement[index]
}

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
  const { aiVoice } = useAppStore()
  const tts = useTTS('fr', aiVoice || undefined)
  
  // Détecter ce qui manque pour guider l'enfant
  // Synchronisé avec PromptBuilder.tsx
  const showStyleButtons = level < 4    // Boutons visibles niveaux 1-3
  const showAmbianceButtons = level < 4 // Boutons visibles niveaux 1-3
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [showQuickHelp, setShowQuickHelp] = useState(false)
  const [showVoiceSelector, setShowVoiceSelector] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastStepRef = useRef<string | null>(null)

  // Nom de l'IA (ou défaut)
  const friendName = aiName || 'Mon amie'

  // ============================================
  // DÉTECTION DU MODE HORS-LIGNE
  // ============================================
  useEffect(() => {
    // Check initial state
    setIsOffline(!navigator.onLine)

    const handleOnline = () => {
      setIsOffline(false)
      // Message de retour en ligne
      const onlineMessage: Message = {
        id: Date.now().toString(),
        role: 'ai',
        content: `Je suis de retour ! 🎉 La connexion est revenue, on peut continuer ensemble ! ✨`,
        timestamp: new Date(),
        type: 'celebration',
      }
      setMessages(prev => [...prev, onlineMessage])
      if (voiceEnabled && tts.isAvailable) {
        tts.speak(onlineMessage.content)
      }
    }

    const handleOffline = () => {
      setIsOffline(true)
      // Message de passage en mode hors-ligne
      const offlineMessage: Message = {
        id: Date.now().toString(),
        role: 'ai',
        content: OFFLINE_MESSAGES.greeting,
        timestamp: new Date(),
        type: 'help',
      }
      setMessages(prev => [...prev, offlineMessage])
      setShowQuickHelp(true) // Afficher les boutons d'aide
      if (voiceEnabled && tts.isAvailable) {
        tts.speak(offlineMessage.content)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [voiceEnabled, tts])

  // ============================================
  // AIDE RAPIDE HORS-LIGNE
  // ============================================
  const handleQuickHelp = useCallback((helpId: string) => {
    const quickHelp = OFFLINE_QUICK_HELP[type].find(h => h.id === helpId)
    if (!quickHelp) return

    // Message de l'utilisateur (la question)
    const userQuestion: Message = {
      id: Date.now().toString(),
      role: 'child',
      content: quickHelp.label,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userQuestion])

    // Réponse prédéfinie
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: quickHelp.response,
        timestamp: new Date(),
        type: 'help',
      }
      setMessages(prev => [...prev, aiResponse])
      
      if (voiceEnabled && tts.isAvailable) {
        tts.speak(quickHelp.response)
      }
    }, 500)
  }, [type, voiceEnabled, tts])

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
          userName: useAppStore.getState().userName, // Prénom de l'enfant
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
      
      // Utiliser des messages de fallback VARIÉS pour que l'enfant ne remarque pas
      const fallbackContent = isOffline 
        ? getOfflineEncouragement()
        : getRandomFallbackMessage(userMessage)
      
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: fallbackContent,
        timestamp: new Date(),
        type: 'encouragement',
      }
      setMessages(prev => [...prev, fallbackMessage])
      
      // Afficher les boutons d'aide rapide en cas d'erreur
      if (!showQuickHelp) {
        setShowQuickHelp(true)
      }
      
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
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
          isOffline 
            ? "bg-gradient-to-br from-amber-500 to-orange-500"
            : "bg-gradient-to-br from-aurora-500 to-dream-500"
        )}>
          {isOffline ? (
            <WifiOff className="w-5 h-5 text-white" />
          ) : (
            <Sparkles className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white">{friendName}</h3>
          <p className={cn(
            "text-xs",
            isOffline ? "text-amber-300" : "text-aurora-300"
          )}>
            {isOffline ? "Mode hors-ligne 🌙" : "Ton amie créative ✨"}
          </p>
        </div>
        {/* Bouton paramètres voix */}
        <button
          onClick={() => setShowVoiceSelector(!showVoiceSelector)}
          className={cn(
            'p-2 rounded-lg transition-colors',
            showVoiceSelector
              ? 'bg-aurora-500/20 text-aurora-300'
              : 'bg-midnight-800/50 text-midnight-400 hover:text-white'
          )}
          title="Changer la voix"
        >
          <Settings className="w-4 h-4" />
        </button>
        
        {/* Bouton activer/désactiver voix */}
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

      {/* Panel sélecteur de voix */}
      <AnimatePresence>
        {showVoiceSelector && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-midnight-700/50 overflow-hidden"
          >
            <VoiceSelector className="rounded-none border-0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bannière mode hors-ligne */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/30 px-4 py-2"
          >
            <p className="text-xs text-amber-200 text-center">
              📡 Pas de connexion internet • Utilise les boutons d'aide magique ci-dessous !
            </p>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Boutons d'aide rapide (mode hors-ligne ou erreur IA) */}
      <AnimatePresence>
        {showQuickHelp && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-midnight-700/50"
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-aurora-300 font-medium">
                  ✨ Aide magique
                </p>
                <button
                  onClick={() => setShowQuickHelp(false)}
                  className="text-xs text-midnight-500 hover:text-midnight-300"
                >
                  Masquer
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {OFFLINE_QUICK_HELP[type].map((help) => {
                  const IconComponent = help.icon
                  return (
                    <motion.button
                      key={help.id}
                      onClick={() => handleQuickHelp(help.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-midnight-800/50 hover:bg-aurora-500/20 text-midnight-300 hover:text-white transition-colors text-left"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <IconComponent className="w-4 h-4 text-aurora-400 flex-shrink-0" />
                      <span className="text-xs">{help.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-4 border-t border-midnight-700/50">
        {/* Bouton pour afficher l'aide si masquée */}
        {!showQuickHelp && (isOffline || messages.some(m => m.type === 'encouragement' && m.content.includes('souci'))) && (
          <button
            onClick={() => setShowQuickHelp(true)}
            className="w-full mb-2 py-1.5 text-xs text-aurora-400 hover:text-aurora-300 transition-colors"
          >
            ✨ Afficher l'aide magique
          </button>
        )}
        
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
            placeholder={isOffline ? "Écris ou utilise l'aide magique..." : "Écris ta réponse..."}
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
