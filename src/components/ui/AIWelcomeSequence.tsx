'use client'

/**
 * Séquence d'accueil interactive avec l'IA-Amie
 * L'enfant découvre et nomme son compagnon à travers une conversation magique
 * Puis choisit la voix de son ami(e)
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Heart, Volume2, VolumeX, Star, Check, Play, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useLocale } from '@/lib/i18n/context'
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
  gender: 'feminine' | 'masculine' | 'unknown'
}

// Voix premium par langue (seules voix proposées à l'enfant)
const PREMIUM_VOICES_BY_LANG: Record<string, string[]> = {
  fr: ['Audrey', 'Amélie', 'Thomas'],
  en: ['Samantha', 'Karen', 'Daniel'],
  ru: ['Milena', 'Yuri'],
}

// Toutes les voix premium (pour détection)
const ALL_PREMIUM_VOICES = Object.values(PREMIUM_VOICES_BY_LANG).flat()

// Voix classées par genre par langue (pour filtrer selon le prénom de l'IA)
const FEMININE_VOICES_BY_LANG: Record<string, string[]> = {
  fr: ['Audrey', 'Amélie'],
  en: ['Samantha', 'Karen'],
  ru: ['Milena'],
}
const MASCULINE_VOICES_BY_LANG: Record<string, string[]> = {
  fr: ['Thomas'],
  en: ['Daniel'],
  ru: ['Yuri'],
}

// Toutes les voix par genre (pour détection du genre d'une voix)
const ALL_FEMININE_VOICES = Object.values(FEMININE_VOICES_BY_LANG).flat()
const ALL_MASCULINE_VOICES = Object.values(MASCULINE_VOICES_BY_LANG).flat()

// Prénoms connus pour détecter le genre (liste non exhaustive mais couvre les plus courants)
const FEMININE_NAMES = [
  // Suggestions de l'app
  'étoile', 'féerie', 'céleste', 'aurore', 'iris', 'marie', 'luna',
  // Prénoms courants féminins
  'emma', 'jade', 'chloé', 'louise', 'alice', 'léa', 'lina', 'rose', 'anna', 'julia', 'léonie', 'zoé', 'clara', 'inès', 'camille',
  'manon', 'sarah', 'eva', 'charlotte', 'agathe', 'romane', 'lucie', 'margot', 'nina', 'victoire', 'lola', 'elena', 'amélie',
  'elsa', 'valentine', 'juliette', 'maëlle', 'clémence', 'apolline', 'océane', 'marguerite', 'constance', 'adèle', 'anaïs',
  'pauline', 'mathilde', 'eloïse', 'lena', 'capucine', 'mila', 'garance', 'diane', 'célestine', 'joséphine', 'héloïse',
  // Prénoms fantaisie féminins
  'stellia', 'lunaria', 'aurora', 'éclat', 'lumière', 'perle', 'fleur', 'fée', 'magie', 'émeraude', 'saphir'
]

const MASCULINE_NAMES = [
  // Suggestions de l'app
  'cosmos', 'merlin', 'phoenix', 'orion', 'atlas', 'max',
  // Prénoms courants masculins
  'léo', 'noah', 'lucas', 'louis', 'gabriel', 'raphaël', 'jules', 'hugo', 'arthur', 'adam', 'nathan', 'aaron', 'paul', 'tom',
  'théo', 'ethan', 'mathis', 'sacha', 'maxime', 'victor', 'alexandre', 'antoine', 'baptiste', 'clément', 'valentin', 'quentin',
  'romain', 'julien', 'pierre', 'martin', 'thomas', 'nicolas', 'vincent', 'charles', 'olivier', 'benjamin', 'guillaume',
  'matthieu', 'simon', 'laurent', 'david', 'jean', 'jacques', 'marc', 'philippe', 'michel', 'robert', 'henri',
  // Prénoms fantaisie masculins
  'titan', 'éclipse', 'étoilé', 'dragon', 'griffon', 'chevalier', 'wizard'
]

// Détecte le genre probable d'un prénom
function detectNameGender(name: string): 'feminine' | 'masculine' | 'unknown' {
  const normalizedName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const cleanName = name.toLowerCase()
  
  // Vérifier dans les listes connues
  if (FEMININE_NAMES.some(n => cleanName.includes(n) || n.includes(cleanName))) {
    return 'feminine'
  }
  if (MASCULINE_NAMES.some(n => cleanName.includes(n) || n.includes(cleanName))) {
    return 'masculine'
  }
  
  // Heuristiques basées sur les terminaisons françaises
  if (normalizedName.endsWith('a') || normalizedName.endsWith('e') || normalizedName.endsWith('ie') || 
      normalizedName.endsWith('ine') || normalizedName.endsWith('elle') || normalizedName.endsWith('ette')) {
    return 'feminine'
  }
  if (normalizedName.endsWith('o') || normalizedName.endsWith('us') || normalizedName.endsWith('as') ||
      normalizedName.endsWith('ien') || normalizedName.endsWith('ard') || normalizedName.endsWith('aud')) {
    return 'masculine'
  }
  
  return 'unknown'
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
      "Bonjour, comme je suis contente de te rencontrer !",
      "Je suis là pour t'aider à utiliser l'intelligence artificielle et à créer les plus belles histoires du monde ! 📚✨",
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
    suggestions: ['Chloé', 'Léo', 'Emma', 'Noah', 'Jade', 'Lucas'],
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
    // Prénoms mixtes pour laisser le choix à l'enfant
    suggestions: ['Étoile', 'Céleste', 'Merlin', 'Aurore', 'Phoenix', 'Marie'],
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
  const { profile } = useAuthStore()
  const locale = useLocale()
  const langCode = locale === 'ru' ? 'ru' : locale === 'en' ? 'en' : 'fr'
  // Extraire le prénom depuis le profil (premier mot du nom complet)
  const profileFirstName = profile?.name?.split(' ')[0] || ''
  const [currentStep, setCurrentStep] = useState(0)
  const [displayedMessages, setDisplayedMessages] = useState<Array<{ type: 'ai' | 'user'; text: string }>>([])
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [chosenName, setChosenName] = useState(voiceOnlyMode ? aiName : '')
  const [chosenChildName, setChosenChildName] = useState(voiceOnlyMode ? userName : profileFirstName)
  const [currentInputType, setCurrentInputType] = useState<InputType | null>(null)
  const [showInput, setShowInput] = useState(false)
  const [showVoiceSelector, setShowVoiceSelector] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(true)
  const [availableVoices, setAvailableVoices] = useState<VoiceInfo[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  const [testingVoice, setTestingVoice] = useState<string | null>(null)
  const [voicesReady, setVoicesReady] = useState(false)
  const [noVoicesForLanguage, setNoVoicesForLanguage] = useState(false)
  const [aiNameGender, setAiNameGender] = useState<'feminine' | 'masculine' | 'unknown'>('unknown')
  const [hasStarted, setHasStarted] = useState(false) // Nécessite une interaction pour débloquer l'audio
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Ref pour stocker la voix sélectionnée (évite les race conditions React)
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null)
  
  // Positions des étoiles mémorisées (évite les saccades à chaque frappe)
  const starPositions = useMemo(() => 
    Array.from({ length: 30 }).map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
    })), []
  )

  // Si le prénom est déjà connu (inscription), sauter les étapes de demande du prénom
  const steps = useMemo(() => {
    if (voiceOnlyMode) return VOICE_ONLY_STEPS
    if (profileFirstName) {
      return CONVERSATION_STEPS.filter(
        s => s.id !== 'ask-child-name' && s.id !== 'child-name-input' && s.id !== 'child-name-response'
      )
    }
    return CONVERSATION_STEPS
  }, [voiceOnlyMode, profileFirstName])
  
  // Filtrer les voix selon le genre du prénom de l'IA
  // Ne montrer QUE les voix premium correspondant au genre
  const filteredVoices = useMemo(() => {
    // availableVoices contient déjà uniquement les voix premium de la langue
    if (aiNameGender === 'unknown') {
      // Genre inconnu → montrer toutes les voix premium de la langue
      return availableVoices
    }

    // Filtrer par genre
    const filtered = availableVoices.filter(v => v.gender === aiNameGender)

    // Si aucune voix du genre trouvée, montrer toutes les premium
    if (filtered.length === 0) {
      return availableVoices
    }

    console.log('🎭 Voix filtrées pour', aiNameGender, ':', filtered.map(v => v.name).join(', '))
    return filtered
  }, [availableVoices, aiNameGender])
  
  // Démarrer la séquence (débloque l'autoplay audio)
  const handleStart = () => {
    // FORCER le chargement et stockage de la voix Audrey AVANT de démarrer
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices()
      console.log('🎤 handleStart: Voix FR disponibles:', voices.filter(v => v.lang.startsWith('fr')).map(v => v.name))
      
      // Chercher la première voix premium de la langue
      const premiumNames = PREMIUM_VOICES_BY_LANG[langCode] || PREMIUM_VOICES_BY_LANG.fr
      let foundVoice: SpeechSynthesisVoice | null = null
      for (const pName of premiumNames) {
        const match = voices.find(v => v.lang.startsWith(langCode) && v.name.includes(pName))
        if (match) { foundVoice = match; break }
      }

      if (foundVoice) {
        selectedVoiceRef.current = foundVoice
        console.log('🎤 handleStart: ✅ Voix premium stockée:', foundVoice.name)
      } else {
        console.log('🎤 handleStart: ❌ Aucune voix premium trouvée pour', langCode)
      }
      
      // Jouer un son silencieux pour débloquer l'audio sur Safari/Chrome
      const utterance = new SpeechSynthesisUtterance('')
      utterance.volume = 0
      // Utiliser la voix sélectionnée même pour le son silencieux
      if (selectedVoiceRef.current) {
        utterance.voice = selectedVoiceRef.current
      }
      speechSynthesis.speak(utterance)
    }
    
    setHasStarted(true)
  }

  // Charger les voix disponibles - DOIT être prêt AVANT de commencer à parler
  useEffect(() => {
    if (!isOpen) return
    
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices()

        // Les voix ne sont peut-être pas encore chargées
        if (voices.length === 0) {
          console.log('🎤 Attente du chargement des voix...')
          return
        }

        // Vérifier s'il existe des voix pour cette langue
        const langVoices = voices.filter(v => v.lang.startsWith(langCode))
        console.log('🎤 Recherche voix parmi', langVoices.length, `voix ${langCode}:`, langVoices.map(v => v.name).join(', '))

        if (langVoices.length === 0) {
          // Aucune voix pour cette langue sur ce navigateur
          console.warn(`⚠️ Aucune voix disponible pour "${langCode}" sur ce navigateur (${voices.length} voix au total)`)
          setNoVoicesForLanguage(true)
          setAvailableVoices([])
          setVoicesReady(true) // Ne pas bloquer — continuer sans TTS
          return
        }
        setNoVoicesForLanguage(false)

        // Chercher la première voix premium de la langue IMMÉDIATEMENT
        const langPremiumNames = PREMIUM_VOICES_BY_LANG[langCode] || PREMIUM_VOICES_BY_LANG.fr

        let bestVoiceRaw: SpeechSynthesisVoice | null = null
        for (const pName of langPremiumNames) {
          const match = voices.find(v => v.lang.startsWith(langCode) && v.name.includes(pName))
          if (match) { bestVoiceRaw = match; break }
        }

        if (bestVoiceRaw) {
          selectedVoiceRef.current = bestVoiceRaw
          console.log('🎤 ✅ Voix premium trouvée et stockée dans ref:', bestVoiceRaw.name)
        } else {
          console.log('🎤 ⚠️ Aucune voix premium trouvée pour', langCode)
        }

        // Fonction pour détecter le genre d'une voix
        const getVoiceGender = (voiceName: string): 'feminine' | 'masculine' | 'unknown' => {
          if (ALL_FEMININE_VOICES.some(fv => voiceName.includes(fv))) return 'feminine'
          if (ALL_MASCULINE_VOICES.some(mv => voiceName.includes(mv))) return 'masculine'
          return 'unknown'
        }

        const premiumNames = PREMIUM_VOICES_BY_LANG[langCode] || PREMIUM_VOICES_BY_LANG.fr
        const premiumVoices = langVoices
          .map(v => ({
            name: v.name,
            lang: v.lang,
            isPremium: ALL_PREMIUM_VOICES.some(p => v.name.includes(p)),
            isRecommended: premiumNames.some(r => v.name.includes(r)),
            gender: getVoiceGender(v.name),
          }))
          // Ne garder que les voix premium
          .filter(v => v.isPremium)
          // Trier : recommandées d'abord
          .sort((a, b) => {
            if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1
            return 0
          })

        setAvailableVoices(premiumVoices)

        if (premiumVoices.length === 0) {
          // Des voix existent pour la langue mais aucune premium
          // Marquer comme "pas de voix" pour l'utilisateur (on ne montre pas les non-premium)
          console.log('🎤 ⚠️ Voix pour la langue mais aucune premium — skip sélection voix')
          setNoVoicesForLanguage(true)
        }

        // Sélectionner la première voix premium par défaut (dans l'ordre de priorité)
        if (premiumVoices.length > 0) {
          const voiceToSelect = premiumVoices[0].name
          setSelectedVoice(voiceToSelect)
          console.log('🎤 Voix sélectionnée:', voiceToSelect)

          // Stocker dans la ref si pas encore fait
          if (!selectedVoiceRef.current) {
            const fallbackVoice = voices.find(v => v.name === voiceToSelect)
            if (fallbackVoice) {
              selectedVoiceRef.current = fallbackVoice
              console.log('🎤 Voix fallback stockée dans ref:', fallbackVoice.name)
            }
          }
        }

        setVoicesReady(true)
        console.log('🎤 Voix prête:', premiumVoices[0]?.name || 'aucune premium', '| Ref:', selectedVoiceRef.current?.name)
      }
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [isOpen])

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
  
  // Quand le genre de l'IA change, adapter la voix sélectionnée
  useEffect(() => {
    if (aiNameGender === 'unknown') return
    
    // Vérifier si la voix actuelle correspond au genre
    const currentVoiceInfo = availableVoices.find(v => v.name === selectedVoice)
    if (currentVoiceInfo && currentVoiceInfo.gender !== aiNameGender && currentVoiceInfo.gender !== 'unknown') {
      // La voix actuelle ne correspond pas au genre, sélectionner la première voix filtrée
      const firstMatchingVoice = filteredVoices[0]
      if (firstMatchingVoice) {
        setSelectedVoice(firstMatchingVoice.name)
        console.log('🎭 Voix adaptée au genre', aiNameGender, ':', firstMatchingVoice.name)
      }
    }
  }, [aiNameGender, availableVoices, filteredVoices, selectedVoice])

  // Afficher les messages progressivement - ATTEND que les voix soient prêtes ET que l'utilisateur ait cliqué
  useEffect(() => {
    console.log('🔄 useEffect messages - step:', currentStep, '| msgIdx:', currentMessageIndex, '| hasStarted:', hasStarted, '| voicesReady:', voicesReady)
    
    if (!isOpen) return
    
    // Attendre que l'utilisateur ait cliqué sur "Commencer" (débloque l'autoplay audio)
    if (!hasStarted) {
      return
    }
    
    // Attendre que les voix soient chargées avant de commencer à parler
    if (!voicesReady) {
      console.log('🎤 En attente des voix avant de commencer...')
      return
    }

    const step = steps[currentStep]
    console.log('🔄 Step actuelle:', step?.id, '| type:', step?.type)
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
            
            // UTILISER LA REF DIRECTEMENT (pas de recherche, pas de délai)
            if (selectedVoiceRef.current) {
              utterance.voice = selectedVoiceRef.current
              console.log('🔊 Lecture avec voix REF:', selectedVoiceRef.current.name)
            } else {
              // Fallback: chercher Audrey dans les voix
              const voices = window.speechSynthesis.getVoices()
              const audreyVoice = voices.find(v => v.name.includes('Audrey') && v.lang.startsWith('fr'))
              if (audreyVoice) {
                utterance.voice = audreyVoice
                selectedVoiceRef.current = audreyVoice // Stocker pour la prochaine fois
                console.log('🔊 Lecture avec voix trouvée:', audreyVoice.name)
              } else {
                console.log('🔊 ATTENTION: Aucune voix Audrey trouvée, utilisation voix par défaut')
              }
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
  }, [isOpen, currentStep, currentMessageIndex, chosenName, chosenChildName, aiName, userName, isSpeaking, onComplete, selectedVoice, steps, voicesReady, hasStarted])

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
    console.log('📝 handleSubmitName:', name, '| type:', currentInputType, '| currentStep:', currentStep)
    
    if (currentInputType === 'child-name') {
      // Prénom de l'enfant
      setChosenChildName(name)
      setUserName(name)
    } else {
      // Nom de l'IA - détecter le genre pour filtrer les voix
      setChosenName(name)
      setAiName(name)
      
      // Détecter le genre du prénom pour adapter les voix proposées
      const detectedGender = detectNameGender(name)
      setAiNameGender(detectedGender)
      console.log('🎭 Genre détecté pour', name, ':', detectedGender)
    }
    
    setDisplayedMessages(prev => [...prev, { type: 'user', text: name }])
    setShowInput(false)
    setInputValue('')
    setCurrentInputType(null)

    setTimeout(() => {
      console.log('📝 Passage à l\'étape suivante:', currentStep + 1)
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
      {/* Étoiles de fond (positions mémorisées pour éviter les saccades) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {starPositions.map((star, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
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
          {hasStarted && (
            <motion.button
              onClick={() => setIsSpeaking(!isSpeaking)}
              className="absolute top-4 right-4 p-2 rounded-full bg-midnight-800/50 text-midnight-400 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </motion.button>
          )}

          {/* Écran de démarrage - nécessite un clic pour débloquer l'audio */}
          {!hasStarted && (
            <div className="p-6 h-[300px] flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-midnight-300 text-sm mb-2">
                  ✨ Une présence magique t'attend...
                </p>
                <p className="text-midnight-400 text-xs mb-6">
                  {voicesReady ? "Clique pour commencer l'aventure" : "Préparation de la voix..."}
                </p>
                <motion.button
                  onClick={handleStart}
                  disabled={!voicesReady}
                  whileHover={voicesReady ? { scale: 1.05 } : {}}
                  whileTap={voicesReady ? { scale: 0.95 } : {}}
                  className={`px-8 py-4 rounded-2xl font-semibold shadow-lg flex items-center gap-3 mx-auto transition-all ${
                    voicesReady 
                      ? 'bg-gradient-to-r from-aurora-500 to-dream-500 text-white shadow-aurora-500/30 cursor-pointer' 
                      : 'bg-midnight-700 text-midnight-400 cursor-wait'
                  }`}
                >
                  <Sparkles className={`w-5 h-5 ${!voicesReady ? 'animate-pulse' : ''}`} />
                  {voicesReady ? "Commencer l'aventure" : "Chargement..."}
                </motion.button>
                {voicesReady && selectedVoice && (
                  <p className="text-aurora-400 text-xs mt-4">
                    🎤 Voix : {selectedVoice.split(' ')[0]}
                  </p>
                )}
              </motion.div>
            </div>
          )}

          {/* Messages */}
          {hasStarted && (
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
          )}

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
                  🎤 {aiNameGender === 'feminine' 
                    ? `Voix féminines pour ${chosenName}` 
                    : aiNameGender === 'masculine' 
                      ? `Voix masculines pour ${chosenName}`
                      : 'Voix disponibles sur ton navigateur'}
                </p>
                
                <div className="space-y-2 max-h-[200px] overflow-y-auto mb-4">
                  {noVoicesForLanguage ? (
                    <div className="flex flex-col items-center gap-2 py-4 px-3 text-center">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      <p className="text-sm text-amber-300">
                        {langCode === 'en' ? 'No voices available for this language on your browser'
                          : langCode === 'ru' ? 'На вашем браузере нет голосов для этого языка'
                          : 'Aucune voix disponible pour cette langue sur ton navigateur'}
                      </p>
                      <p className="text-xs text-midnight-400">
                        {langCode === 'en' ? 'Try using Chrome or Safari for better voice support'
                          : langCode === 'ru' ? 'Попробуйте использовать Chrome или Safari'
                          : 'Essaie avec Chrome ou Safari pour plus de voix'}
                      </p>
                    </div>
                  ) : filteredVoices.length === 0 ? (
                    <p className="text-sm text-midnight-500 text-center py-4">
                      {langCode === 'en' ? 'Loading voices...'
                        : langCode === 'ru' ? 'Загрузка голосов...'
                        : 'Chargement des voix...'}
                    </p>
                  ) : (
                    filteredVoices.map((voice) => (
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
                  onClick={noVoicesForLanguage ? () => {
                    // Pas de voix à sélectionner, passer directement
                    setShowVoiceSelector(false)
                    setTimeout(() => {
                      setCurrentStep(prev => prev + 1)
                      setCurrentMessageIndex(0)
                    }, 500)
                  } : handleSelectVoice}
                  disabled={!selectedVoice && !noVoicesForLanguage}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'w-full py-3 rounded-xl font-medium transition-all',
                    selectedVoice || noVoicesForLanguage
                      ? 'bg-gradient-to-r from-aurora-500 to-stardust-500 text-white shadow-lg shadow-aurora-500/30'
                      : 'bg-midnight-700 text-midnight-500 cursor-not-allowed'
                  )}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Volume2 className="w-5 h-5" />
                    {noVoicesForLanguage
                      ? (langCode === 'en' ? 'Continue without voice' : langCode === 'ru' ? 'Продолжить без голоса' : 'Continuer sans voix')
                      : (langCode === 'en' ? 'I like this voice!' : langCode === 'ru' ? 'Мне нравится этот голос!' : 'C\'est cette voix !')
                    }
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
