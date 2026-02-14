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
import { useLocale, useTranslations } from '@/lib/i18n/context'
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
import { LevelUpModal, type LevelUpContent } from '@/components/ui/LevelUpModal'

// Mots-clés pour détection multi-langue (FR + EN + RU)
const STYLE_KEYWORDS = ['dessin', 'photo', 'magique', 'anime', 'aquarelle', 'pixel', 'réaliste', 'cartoon', '3d', 'drawing', 'magical', 'watercolor', 'realistic', 'рисунок', 'фото', 'волшебный', 'аниме', 'акварель', 'пиксель']
const AMBIANCE_KEYWORDS = ['jour', 'nuit', 'orage', 'brume', 'féérique', 'mystère', 'sombre', 'lumineux', 'matin', 'soir', 'day', 'night', 'storm', 'mist', 'fairy', 'mystery', 'dark', 'bright', 'morning', 'evening', 'день', 'ночь', 'гроза', 'туман', 'сказочный', 'тайна', 'тёмный', 'светлый']
const DETAIL_KEYWORDS = ['rouge', 'bleu', 'vert', 'doré', 'brillant', 'grand', 'petit', 'géant', 'red', 'blue', 'green', 'golden', 'shiny', 'big', 'small', 'giant', 'красный', 'синий', 'зелёный', 'золотой', 'блестящий', 'большой', 'маленький']
// Mots-clés spécifiques aux vidéos (multi-langue)
const VIDEO_MOVEMENT_KEYWORDS = ['bouge', 'anime', 'danse', 'court', 'vole', 'tombe', 'saute', 'marche', 'tourne', 'moves', 'dances', 'runs', 'flies', 'falls', 'jumps', 'walks', 'spins', 'двигается', 'танцует', 'бежит', 'летит', 'падает', 'прыгает']
const VIDEO_RHYTHM_KEYWORDS = ['lent', 'rapide', 'doucement', 'vite', 'dynamique', 'calme', 'fluide', 'slow', 'fast', 'gently', 'dynamic', 'calm', 'fluid', 'медленно', 'быстро', 'плавно', 'динамично', 'спокойно']

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

// Messages de l'IA selon l'étape et le niveau (internationalisé via t())
const getAIMessage = (
  step: GuideStep | null,
  type: CreationType,
  level: number,
  aiName: string,
  t: (key: string, params?: Record<string, string>) => string
): { content: string; type: Message['type'] } => {
  const magicKeys = type === 'image' ? IMAGE_MAGIC_KEYS : VIDEO_MAGIC_KEYS
  const typeLabel = type === 'image' ? 'image' : 'video'

  if (!step) {
    return {
      content: t('chat.greeting', { name: aiName }),
      type: 'question',
    }
  }

  switch (step) {
    case 'choose_image':
      return { content: t('chat.steps.chooseImage'), type: 'question' }

    case 'describe':
      if (type === 'video') {
        return { content: t('chat.steps.describeVideo'), type: 'question' }
      }
      if (level === 1) {
        return { content: t('chat.steps.describeBeginner'), type: 'question' }
      }
      return { content: t('chat.steps.describeAdvanced'), type: 'question' }

    case 'choose_style':
      return {
        content: t('chat.steps.chooseStyle'),
        type: 'question',
      }

    case 'choose_mood':
      return {
        content: t('chat.steps.chooseMood'),
        type: 'question',
      }

    case 'choose_light':
      return { content: t('chat.steps.chooseLight', { type: typeLabel }), type: 'question' }

    case 'choose_format':
      return { content: t('chat.steps.chooseFormat'), type: 'question' }

    case 'choose_movement':
      return { content: t('chat.steps.chooseMovement'), type: 'question' }

    case 'choose_camera':
      return { content: t('chat.steps.chooseCamera'), type: 'question' }

    case 'choose_extra':
      return {
        content: type === 'image' ? t('chat.steps.chooseExtraImage') : t('chat.steps.chooseExtraVideo'),
        type: 'question',
      }

    case 'review_prompt':
      if (level >= 4) {
        return { content: t('chat.steps.reviewLevel4'), type: 'encouragement' }
      }
      if (level >= 2) {
        return { content: t('chat.steps.reviewLevel2', { type: typeLabel }), type: 'help' }
      }
      return { content: t('chat.steps.reviewDefault', { type: typeLabel }), type: 'help' }

    case 'open_safari':
      if (level >= 5) return { content: t('chat.steps.safariLevel5'), type: 'encouragement' }
      if (level >= 4) return { content: t('chat.steps.safariLevel4'), type: 'encouragement' }
      if (level === 3) return { content: t('chat.steps.safariLevel3'), type: 'help' }
      return { content: t('chat.steps.safariDefault'), type: 'help' }

    case 'paste_prompt':
      if (level >= 3) return { content: t('chat.steps.pasteLevel3'), type: 'help' }
      return { content: t('chat.steps.pasteDefault'), type: 'help' }

    case 'generate':
      return { content: t('chat.steps.generate'), type: 'encouragement' }

    case 'import':
      if (level >= 5) return { content: t('chat.steps.importLevel5'), type: 'celebration' }
      if (level >= 3) return { content: t('chat.steps.importLevel3'), type: 'celebration' }
      return { content: t('chat.steps.importDefault'), type: 'celebration' }

    default:
      return { content: t('chat.steps.fallback'), type: 'help' }
  }
}

// Helper functions that use t() — called from within the component
function getEncouragements(t: (key: string) => string): string[] {
  return [
    t('chat.encouragement1'), t('chat.encouragement2'), t('chat.encouragement3'),
    t('chat.encouragement4'), t('chat.encouragement5'), t('chat.encouragement6'),
  ]
}

function getHelpMessages(t: (key: string) => string): string[] {
  return [t('chat.help1'), t('chat.help2'), t('chat.help3'), t('chat.help4')]
}

function getRandomFallbackMessageI18n(userMessage: string, t: (key: string, params?: Record<string, string>) => string): string {
  const msg = userMessage.slice(0, 30)
  const fallbacks = [
    t('chat.fallback1', { msg }), t('chat.fallback2', { msg }), t('chat.fallback3', { msg }),
    t('chat.fallback4', { msg }), t('chat.fallback5', { msg }), t('chat.fallback6', { msg }),
    t('chat.fallback7', { msg }), t('chat.fallback8', { msg }), t('chat.fallback9', { msg }),
    t('chat.fallback10', { msg }),
  ]
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}

function getOfflineEncouragementI18n(t: (key: string) => string): string {
  const encouragements = [
    t('chat.offlineEncouragement1'), t('chat.offlineEncouragement2'),
    t('chat.offlineEncouragement3'), t('chat.offlineEncouragement4'),
  ]
  return encouragements[Math.floor(Math.random() * encouragements.length)]
}

function getQuickHelp(type: 'image' | 'video', t: (key: string) => string) {
  if (type === 'image') {
    return [
      { id: 'subject', label: t('chat.quickHelp.image.subject.label'), icon: Wand2, response: t('chat.quickHelp.image.subject.response') },
      { id: 'style', label: t('chat.quickHelp.image.style.label'), icon: Palette, response: t('chat.quickHelp.image.style.response') },
      { id: 'mood', label: t('chat.quickHelp.image.mood.label'), icon: Sun, response: t('chat.quickHelp.image.mood.response') },
      { id: 'details', label: t('chat.quickHelp.image.details.label'), icon: Zap, response: t('chat.quickHelp.image.details.response') },
    ]
  }
  return [
    { id: 'subject', label: t('chat.quickHelp.video.subject.label'), icon: Wand2, response: t('chat.quickHelp.video.subject.response') },
    { id: 'style', label: t('chat.quickHelp.video.style.label'), icon: Palette, response: t('chat.quickHelp.video.style.response') },
    { id: 'movement', label: t('chat.quickHelp.video.movement.label'), icon: Zap, response: t('chat.quickHelp.video.movement.response') },
    { id: 'mood', label: t('chat.quickHelp.video.mood.label'), icon: Sun, response: t('chat.quickHelp.video.mood.response') },
  ]
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
  const locale = useLocale()
  const t = useTranslations('studio')
  const tts = useTTS(locale, aiVoice || undefined)
  
  // Tracker le niveau précédent pour détecter les transitions
  const previousLevelRef = useRef<number>(level)
  
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
  
  // Modale de progression de niveau
  const [levelUpModal, setLevelUpModal] = useState<{ isOpen: boolean; content: LevelUpContent | null }>({
    isOpen: false,
    content: null,
  })
  
  // Tracker les blocages répétés (mêmes éléments manquants plusieurs fois)
  const [consecutiveStruggles, setConsecutiveStruggles] = useState(0)
  const lastMissingElementsRef = useRef<string[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastStepRef = useRef<string | null>(null)
  const justValidatedFieldRef = useRef(false) // Pour éviter le double message après validation

  // Nom de l'IA (ou défaut internationalisé)
  const friendName = aiName || t('chat.defaultName')

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
        content: t('chat.backOnline'),
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
        content: t('chat.offlineGreeting'),
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
    const quickHelpItems = getQuickHelp(type, t)
    const quickHelp = quickHelpItems.find(h => h.id === helpId)
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
  }, [type, voiceEnabled, tts, t])

  // Ajouter un message de l'IA quand l'étape change
  // Premier message = immédiat, les suivants = avec délai de 3 secondes
  // IMPORTANT: type-reset et step-message dans UN SEUL effect pour éviter
  // que React Strict Mode double-fire le speak (reset lastStepRef + re-send)
  const stepMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isFirstMessage = useRef(true)
  const prevTypeRef = useRef<string | null>(null)

  useEffect(() => {
    // Détecter un vrai changement de type (image ↔ video)
    if (prevTypeRef.current !== null && prevTypeRef.current !== type) {
      setMessages([])
      isFirstMessage.current = true
      lastStepRef.current = null
    }
    prevTypeRef.current = type

    // Pas de message automatique si toutes les étapes sont terminées (currentStep = null)
    if (!currentStep) return

    // Créer une clé unique pour éviter les doublons
    const stepKey = `${type}-${currentStep}-${level}`

    // Éviter de réajouter le même message
    if (lastStepRef.current === stepKey) return

    // Si on vient de valider un champ et qu'on est TOUJOURS sur la même étape,
    // ne pas envoyer de message (l'IA a déjà répondu à la validation).
    // Mais si l'étape a changé, laisser passer le message de la nouvelle étape.
    if (justValidatedFieldRef.current) {
      justValidatedFieldRef.current = false
      // Ne bloquer que si c'est le même step (re-trigger), pas un nouveau step
      const prevStep = lastStepRef.current?.split('-')[1] // extraire le step du "type-step-level"
      if (prevStep === currentStep) {
        lastStepRef.current = stepKey
        return
      }
    }

    // Annuler le message précédent si l'étape change vite
    if (stepMessageTimeoutRef.current) {
      clearTimeout(stepMessageTimeoutRef.current)
    }

    const sendMessage = () => {
      // Double-check pour éviter les doublons
      if (lastStepRef.current === stepKey) return
      lastStepRef.current = stepKey

      const aiMessage = getAIMessage(currentStep, type, level, friendName, t)

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
    }

    // Premier message = immédiat, les suivants = délai de 3 secondes
    if (isFirstMessage.current) {
      isFirstMessage.current = false
      sendMessage()
    } else {
      // Attendre 3 secondes avant de parler de la nouvelle étape
      // Ça laisse le temps à l'enfant de finir ce qu'il fait
      stepMessageTimeoutRef.current = setTimeout(sendMessage, 3000)
    }

    return () => {
      if (stepMessageTimeoutRef.current) {
        clearTimeout(stepMessageTimeoutRef.current)
      }
    }
  }, [currentStep, type, level, friendName])

  // Scroll vers le bas quand nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Gérer l'aide demandée
  useEffect(() => {
    if (needsHelp) {
      const helpMessages = getHelpMessages(t)
      const helpMessage = helpMessages[Math.floor(Math.random() * helpMessages.length)]
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'ai',
        content: helpMessage + "\n\n" + t('chat.helpSuffix'),
        timestamp: new Date(),
        type: 'help',
      }
      setMessages(prev => [...prev, newMessage])
      
      if (voiceEnabled && tts.isAvailable) {
        tts.speak(newMessage.content)
      }
    }
  }, [needsHelp])
  
  // ============================================
  // MODALE DE TRANSITION DE NIVEAU (conscience de l'apprentissage)
  // ============================================
  useEffect(() => {
    // Détecter si le niveau a changé
    if (level !== previousLevelRef.current) {
      const oldLevel = previousLevelRef.current
      previousLevelRef.current = level
      
      // Ne pas afficher de modale si c'est le premier rendu
      if (oldLevel === level) return
      
      // Contenu de la modale selon le niveau
      let content: LevelUpContent | null = null
      const creationType = type === 'image' ? 'images' : 'videos'

      if (level === 2) {
        content = {
          level: 2,
          title: t('chat.levelUp.level2.title'),
          subtitle: t('chat.levelUp.level2.subtitle'),
          message: t('chat.levelUp.level2.message', { type: creationType }),
          highlight: t('chat.levelUp.level2.highlight'),
        }
      } else if (level === 3) {
        const key = type === 'image' ? 'level3image' : 'level3video'
        content = {
          level: 3,
          title: t(`chat.levelUp.${key}.title`),
          subtitle: t(`chat.levelUp.${key}.subtitle`),
          message: t(`chat.levelUp.${key}.message`),
          highlight: t(`chat.levelUp.${key}.highlight`),
        }
      } else if (level === 4) {
        const key = type === 'image' ? 'level4image' : 'level4video'
        content = {
          level: 4,
          title: t(`chat.levelUp.${key}.title`),
          subtitle: t(`chat.levelUp.${key}.subtitle`),
          message: t(`chat.levelUp.${key}.message`),
          highlight: t(`chat.levelUp.${key}.highlight`),
        }
      } else if (level === 5) {
        content = {
          level: 5,
          title: t('chat.levelUp.level5.title'),
          subtitle: t('chat.levelUp.level5.subtitle'),
          message: t('chat.levelUp.level5.message', { type: creationType }),
          highlight: t('chat.levelUp.level5.highlight'),
        }
      }
      
      if (content) {
        setLevelUpModal({ isOpen: true, content })
        
        // Lire le message à voix haute
        if (voiceEnabled && tts.isAvailable) {
          const voiceText = `${content.title}. ${content.message} ${content.highlight || ''}`
          tts.speak(voiceText)
        }
      }
    }
  }, [level, type, voiceEnabled, tts])
  
  // Écouter les réactions de l'IA (validation des champs)
  const { aiReaction, clearAIReaction } = useStudioProgressStore()
  const lastReactionIdRef = useRef<string | null>(null)
  
  useEffect(() => {
    if (!aiReaction || aiReaction.id === lastReactionIdRef.current) return
    
    lastReactionIdRef.current = aiReaction.id
    
    // Si c'est un input utilisateur, l'afficher dans le chat et demander à l'IA de répondre
    if (aiReaction.type === 'user_input' && aiReaction.userMessage) {
      // Afficher le message de l'enfant dans le chat
      const childMessage: Message = {
        id: `child-${aiReaction.id}`,
        role: 'child',
        content: aiReaction.userMessage,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, childMessage])
      
      const fieldName = aiReaction.fieldName
      
      // Envoyer à l'IA pour analyse
      const analyzeInput = async () => {
        setIsLoading(true)
        try {
          const chatHistory = messages.slice(-10).map(m => ({
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: m.content,
          }))
          
          // Déterminer l'étape suivante pour que l'IA l'annonce
          const nextStepMessages: Record<string, string> = {
            subject: t('chat.nextStep.subject'),
            action: t('chat.nextStep.action'),
            details: t('chat.nextStep.details'),
            notes: t('chat.nextStep.notes'),
          }
          
          const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: t('chat.validation.prompt', { type: type === 'image' ? 'image' : 'video', text: aiReaction.userMessage || '', nextStep: nextStepMessages[fieldName] || t('chat.nextStep.details') }),
              context: 'studio',
              locale, // Langue de l'interface
              chatHistory,
              aiName: friendName,
              userName: useAppStore.getState().userName,
              studioContext: {
                type,
                currentStep,
                level,
                fieldName,
                isFieldValidation: true,
                nextStep: nextStepMessages[fieldName],
              },
            }),
          })
          
          if (!response.ok) throw new Error('Erreur API')
          
          const data = await response.json()
          
          const aiResponse: Message = {
            id: `ai-response-${aiReaction.id}`,
            role: 'ai',
            content: data.text || data.response || t('chat.validation.approved'),
            timestamp: new Date(),
            type: data.isAppropriate === false ? 'help' : 'question',
          }
          setMessages(prev => [...prev, aiResponse])
          
          // VALIDER SEULEMENT SI L'IA APPROUVE
          if (data.isAppropriate !== false) {
            // Marquer qu'on vient de valider (évite le double message)
            justValidatedFieldRef.current = true
            
            // Valider le champ via le store
            useStudioProgressStore.getState().completeStep(
              fieldName === 'subject' || fieldName === 'action' ? 'describe' :
              fieldName === 'details' || fieldName === 'notes' ? 'choose_extra' : 'describe'
            )
          }
          
          if (voiceEnabled && tts.isAvailable) {
            tts.speak(aiResponse.content)
          }
        } catch (error) {
          console.error('Erreur analyse IA:', error)
          // Fallback simple - on valide quand même en cas d'erreur
          const fallbackMessage: Message = {
            id: `fallback-${aiReaction.id}`,
            role: 'ai',
            content: t('chat.noted'),
            timestamp: new Date(),
            type: 'encouragement',
          }
          setMessages(prev => [...prev, fallbackMessage])
          
          // Marquer qu'on vient de valider (évite le double message)
          justValidatedFieldRef.current = true
          
          // Valider en cas d'erreur (fail-open)
          useStudioProgressStore.getState().completeStep(
            fieldName === 'subject' || fieldName === 'action' ? 'describe' :
            fieldName === 'details' || fieldName === 'notes' ? 'choose_extra' : 'describe'
          )
        } finally {
          setIsLoading(false)
        }
      }
      
      analyzeInput()
      
      // Nettoyer
      setTimeout(() => clearAIReaction(), 100)
      return
    }
    
    // Autres types de réactions (ancien comportement)
    let messageType: Message['type'] = 'encouragement'
    if (aiReaction.type === 'gibberish' || aiReaction.type === 'inappropriate') {
      messageType = 'help'
    } else if (aiReaction.type === 'success') {
      messageType = 'encouragement'
    }
    
    const newMessage: Message = {
      id: `reaction-${aiReaction.id}`,
      role: 'ai',
      content: aiReaction.message,
      timestamp: new Date(),
      type: messageType,
    }
    
    setMessages(prev => [...prev, newMessage])
    
    // Lire à voix haute si activé
    if (voiceEnabled && tts.isAvailable) {
      tts.speak(aiReaction.message)
    }
    
    // Nettoyer la réaction après l'avoir traitée
    setTimeout(() => {
      clearAIReaction()
    }, 100)
  }, [aiReaction, voiceEnabled, tts, clearAIReaction, messages, friendName, type, currentStep, level])

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
      
      // Tracker les blocages répétés (mêmes éléments manquent plusieurs fois de suite)
      let struggles = consecutiveStruggles
      if (missingElements.length > 0) {
        const sameAsBefore = missingElements.length === lastMissingElementsRef.current.length &&
          missingElements.every(e => lastMissingElementsRef.current.includes(e))
        if (sameAsBefore) {
          struggles = consecutiveStruggles + 1
          setConsecutiveStruggles(struggles)
        } else {
          struggles = 1
          setConsecutiveStruggles(1)
        }
        lastMissingElementsRef.current = [...missingElements]
      } else {
        // Plus rien ne manque, reset
        setConsecutiveStruggles(0)
        lastMissingElementsRef.current = []
      }
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: 'studio',
          locale, // Langue de l'interface
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
            // Nombre de fois où l'enfant bloque sur les mêmes éléments
            consecutiveStruggles: struggles,
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
        content: data.text || data.response || t('chat.notUnderstood'),
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
        ? getOfflineEncouragementI18n(t)
        : getRandomFallbackMessageI18n(userMessage, t)
      
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
        'glass rounded-2xl flex flex-col h-full max-h-full overflow-hidden',
        className
      )}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {/* Header - compact */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-midnight-700/50">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
          isOffline 
            ? "bg-gradient-to-br from-amber-500 to-orange-500"
            : "bg-gradient-to-br from-aurora-500 to-dream-500"
        )}>
          {isOffline ? (
            <WifiOff className="w-4 h-4 text-white" />
          ) : (
            <Sparkles className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm truncate">{friendName}</h3>
          <p className={cn(
            "text-xs truncate",
            isOffline ? "text-amber-300" : "text-aurora-300"
          )}>
            {isOffline ? t('chat.offlineMode') : t('chat.creativeCompanion')}
          </p>
        </div>
        {/* Bouton paramètres voix */}
        <button
          onClick={() => setShowVoiceSelector(!showVoiceSelector)}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            showVoiceSelector
              ? 'bg-aurora-500/20 text-aurora-300'
              : 'bg-midnight-800/50 text-midnight-400 hover:text-white'
          )}
          title={t('chat.changeVoice')}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
        
        {/* Bouton activer/désactiver voix */}
        <button
          onClick={toggleVoice}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            voiceEnabled 
              ? 'bg-aurora-500/20 text-aurora-300' 
              : 'bg-midnight-800/50 text-midnight-400'
          )}
          title={voiceEnabled ? t('chat.disableVoice') : t('chat.enableVoice')}
        >
          {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
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
              {t('chat.offlineBanner')}
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
                <p className="text-sm text-midnight-300">{t('chat.thinking')}</p>
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
            className="flex-shrink-0 border-t border-midnight-700/50"
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-aurora-300 font-medium">
                  {t('chat.magicHelp')}
                </p>
                <button
                  onClick={() => setShowQuickHelp(false)}
                  className="text-xs text-midnight-500 hover:text-midnight-300"
                >
                  {t('chat.hide')}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {getQuickHelp(type, t).map((help) => {
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
      <div className="flex-shrink-0 p-3 border-t border-midnight-700/50">
        {/* Bouton pour afficher l'aide si masquée */}
        {!showQuickHelp && (isOffline || messages.some(m => m.type === 'encouragement' && m.content.includes('souci'))) && (
          <button
            onClick={() => setShowQuickHelp(true)}
            className="w-full mb-2 py-1.5 text-xs text-aurora-400 hover:text-aurora-300 transition-colors"
          >
            {t('chat.showMagicHelp')}
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
            title={isListening ? t('chat.stop') : t('chat.speak')}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isOffline ? t('chat.placeholderOffline') : t('chat.placeholder')}
            className="flex-1 bg-midnight-800/50 rounded-xl px-4 py-3 text-white placeholder:text-midnight-500 text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500/30"
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
      
      {/* Modale de progression de niveau */}
      <LevelUpModal
        isOpen={levelUpModal.isOpen}
        onClose={() => setLevelUpModal({ isOpen: false, content: null })}
        content={levelUpModal.content}
      />
    </motion.div>
  )
}
