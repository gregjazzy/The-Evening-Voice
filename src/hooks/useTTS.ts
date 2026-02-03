/**
 * Hook React pour le Text-to-Speech
 * - Electron : utilise le TTS macOS natif (meilleure qualité)
 * - Web : utilise l'API Web Speech Synthesis du navigateur
 * - Supporte la sélection de voix personnalisée avec mémorisation
 */

'use client'

import { useState, useCallback, useEffect } from 'react'

export interface VoiceOption {
  name: string
  lang: string
  isRecommended: boolean
  quality: 'premium' | 'standard' | 'basic'
}

interface UseTTSReturn {
  speak: (text: string) => Promise<void>
  stop: () => Promise<void>
  isSpeaking: boolean
  isAvailable: boolean
  // Nouveau : gestion des voix
  availableVoices: VoiceOption[]
  currentVoice: VoiceOption | null
  setVoice: (voiceName: string) => void
}

// Helpers pour vérifier l'environnement (appelés dynamiquement, pas au chargement du module)
const getIsElectron = () => typeof window !== 'undefined' && !!window.electronAPI?.isElectron
const getHasWebSpeech = () => typeof window !== 'undefined' && 'speechSynthesis' in window

// Voix RECOMMANDÉES par langue selon l'environnement
// Chrome/Web : Google d'abord (toujours disponible)
// Electron/macOS : Apple d'abord (meilleure qualité, native)

const RECOMMENDED_VOICES_WEB: Record<string, string[]> = {
  fr: ['Audrey', 'Amélie', 'Thomas', 'Marie', 'Google français'],
  en: ['Samantha', 'Karen', 'Daniel', 'Google US English', 'Google UK English Female'],
  ru: ['Milena', 'Yuri', 'Google русский'],
}

const RECOMMENDED_VOICES_ELECTRON: Record<string, string[]> = {
  fr: ['Audrey', 'Amélie', 'Thomas', 'Marie', 'Google français'],
  en: ['Samantha', 'Karen', 'Daniel', 'Google US English', 'Google UK English Female'],
  ru: ['Milena', 'Yuri', 'Google русский'],
}

// Fonction pour obtenir les voix recommandées selon l'environnement
const getRecommendedVoices = () => {
  return getIsElectron() ? RECOMMENDED_VOICES_ELECTRON : RECOMMENDED_VOICES_WEB
}

// Voix premium (haute qualité, souvent téléchargées)
const PREMIUM_VOICES = ['Audrey', 'Amélie', 'Thomas', 'Samantha', 'Karen', 'Daniel', 'Milena']

// Paramètres de voix par langue (rate, pitch) - Adaptés pour enfants 6-10 ans
const VOICE_SETTINGS: Record<string, { rate: number; pitch: number }> = {
  fr: { rate: 0.92, pitch: 1.1 },   // Français légèrement plus lent pour enfants
  en: { rate: 0.92, pitch: 1.1 },   // Anglais légèrement plus lent pour enfants
  ru: { rate: 0.90, pitch: 1.05 },  // Russe un peu plus lent
}

// Classifier la qualité d'une voix
function getVoiceQuality(voiceName: string): 'premium' | 'standard' | 'basic' {
  if (PREMIUM_VOICES.some(p => voiceName.includes(p))) return 'premium'
  if (voiceName.includes('Google') || voiceName.includes('Microsoft')) return 'standard'
  return 'basic'
}

// Vérifier si une voix est recommandée pour une langue
function isVoiceRecommended(voiceName: string, locale: string): boolean {
  const voices = getRecommendedVoices()
  const recommended = voices[locale] || voices.fr
  return recommended.some(r => voiceName.includes(r))
}

// Nettoyer le texte pour le TTS (supprimer emojis et caractères spéciaux)
function cleanTextForTTS(text: string): string {
  // Regex pour supprimer les emojis (compatible ES5)
  const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]+|[\u2600-\u27BF]|[\uFE00-\uFE0F]|[\u2300-\u23FF]|[\u2B50-\u2B55]/g
  
  return text
    // Supprimer les emojis via la regex
    .replace(emojiRegex, '')
    // Supprimer les étoiles et symboles courants (fallback)
    .replace(/[✨⭐🌟💫🌙☀️🌈💜🎨🎭🎉🎊]/g, '')
    // Nettoyer les espaces multiples
    .replace(/\s+/g, ' ')
    .trim()
}

// Helper pour trouver la meilleure voix (ou une voix spécifique)
// Exporté pour être utilisé par ClientLayout (fallback quand la voix sauvegardée n'est pas disponible)
export function findBestVoice(locale: string, preferredVoiceName?: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  
  // 1. Si une voix spécifique est demandée, la chercher
  if (preferredVoiceName) {
    const preferred = voices.find(v => v.name === preferredVoiceName)
    if (preferred) return preferred
  }
  
  // 2. Chercher parmi les voix recommandées DANS L'ORDRE de préférence (selon environnement)
  const voices_config = getRecommendedVoices()
  const recommendedNames = voices_config[locale] || voices_config.fr
  let selectedVoice: SpeechSynthesisVoice | undefined
  
  // Parcourir NOS préférences dans l'ordre (adapté à l'environnement)
  for (const preferredName of recommendedNames) {
    const found = voices.find(v => v.name.includes(preferredName))
    if (found) {
      selectedVoice = found
      break
    }
  }
  
  // 3. Fallback : n'importe quelle voix de la langue
  if (!selectedVoice) {
    const langCode = locale === 'fr' ? 'fr' : locale === 'ru' ? 'ru' : 'en'
    selectedVoice = voices.find(v => v.lang.startsWith(langCode))
  }
  
  // 4. Fallback ultime : première voix disponible
  if (!selectedVoice && voices.length > 0) {
    selectedVoice = voices[0]
  }
  
  return selectedVoice || null
}

// Obtenir toutes les voix disponibles pour une langue
function getAvailableVoices(locale: string): VoiceOption[] {
  const voices = window.speechSynthesis.getVoices()
  const langCode = locale === 'fr' ? 'fr' : locale === 'ru' ? 'ru' : 'en'
  
  return voices
    .filter(v => v.lang.startsWith(langCode))
    .map(v => ({
      name: v.name,
      lang: v.lang,
      isRecommended: isVoiceRecommended(v.name, locale),
      quality: getVoiceQuality(v.name),
    }))
    // Trier : recommandées d'abord, puis par qualité
    .sort((a, b) => {
      if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1
      const qualityOrder = { premium: 0, standard: 1, basic: 2 }
      return qualityOrder[a.quality] - qualityOrder[b.quality]
    })
}

export function useTTS(locale: 'fr' | 'en' | 'ru' = 'fr', preferredVoiceName?: string): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [webVoice, setWebVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [voicesReady, setVoicesReady] = useState(false)
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([])
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | undefined>(preferredVoiceName)

  // Charger les voix disponibles pour Web Speech
  useEffect(() => {
    if (!getHasWebSpeech() || getIsElectron()) return

    const loadVoices = () => {
      // Obtenir toutes les voix disponibles
      const voices = getAvailableVoices(locale)
      setAvailableVoices(voices)
      
      // Sélectionner la meilleure voix (ou la préférée)
      const selectedVoice = findBestVoice(locale, selectedVoiceName)
      setWebVoice(selectedVoice)
      
      if (selectedVoice) {
        setVoicesReady(true)
        const isRecommended = isVoiceRecommended(selectedVoice.name, locale)
        console.log(`🎤 Voix TTS: ${selectedVoice.name} ${isRecommended ? '⭐ (recommandée)' : ''}`)
      }
    }

    // Les voix peuvent être chargées de manière asynchrone
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [locale, selectedVoiceName])

  // Fonction pour changer de voix
  const setVoice = useCallback((voiceName: string) => {
    setSelectedVoiceName(voiceName)
    const newVoice = findBestVoice(locale, voiceName)
    if (newVoice) {
      setWebVoice(newVoice)
      console.log('🎤 Voix changée:', newVoice.name)
    }
  }, [locale])

  // Voix actuelle en format VoiceOption
  const currentVoice: VoiceOption | null = webVoice ? {
    name: webVoice.name,
    lang: webVoice.lang,
    isRecommended: isVoiceRecommended(webVoice.name, locale),
    quality: getVoiceQuality(webVoice.name),
  } : null

  const speak = useCallback(async (text: string) => {
    // Nettoyer le texte (supprimer emojis)
    const cleanText = cleanTextForTTS(text)
    if (!cleanText) return // Ne rien lire si le texte est vide après nettoyage

    // Mode Electron : TTS macOS natif
    if (getIsElectron() && window.electronAPI?.tts) {
      try {
        setIsSpeaking(true)
        await window.electronAPI.tts.speak(cleanText, locale)
      } catch (error) {
        console.error('Erreur TTS Electron:', error)
      } finally {
        setIsSpeaking(false)
      }
      return
    }

    // Mode Web : Web Speech API
    if (getHasWebSpeech()) {
      try {
        // Arrêter toute lecture en cours SEULEMENT si elle parle vraiment
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel()
          // Petit délai pour laisser le temps à cancel() de prendre effet
          await new Promise(resolve => setTimeout(resolve, 50))
        }
        
        const utterance = new SpeechSynthesisUtterance(cleanText)
        
        // Essayer de trouver une voix à chaque fois (au cas où pas encore chargée)
        let voiceToUse = webVoice
        if (!voiceToUse) {
          voiceToUse = findBestVoice(locale)
          if (voiceToUse) {
            setWebVoice(voiceToUse)
            setVoicesReady(true)
            console.log('🎤 Voix TTS chargée (lazy):', voiceToUse.name)
          }
        }
        
        if (voiceToUse) {
          utterance.voice = voiceToUse
          console.log('🎤 Utilisation voix:', voiceToUse.name, '| Lang:', voiceToUse.lang)
        } else {
          console.warn('⚠️ Aucune voix trouvée, utilisation voix par défaut')
        }
        
        // Définir la langue explicitement (important si pas de voix)
        utterance.lang = locale === 'fr' ? 'fr-FR' : locale === 'ru' ? 'ru-RU' : 'en-US'
        
        // Paramètres adaptés par langue
        const settings = VOICE_SETTINGS[locale] || VOICE_SETTINGS.fr
        utterance.rate = settings.rate
        utterance.pitch = settings.pitch
        utterance.volume = 1
        
        utterance.onstart = () => {
          console.log('🔊 TTS démarré avec voix:', voiceToUse?.name || 'défaut')
          setIsSpeaking(true)
        }
        utterance.onend = () => {
          console.log('🔇 TTS terminé')
          setIsSpeaking(false)
        }
        utterance.onerror = (e) => {
          console.error('❌ Erreur TTS:', e.error, '| Voix:', voiceToUse?.name)
          // Essayer avec la voix par défaut si la voix sélectionnée échoue
          if (voiceToUse && e.error !== 'canceled') {
            console.log('🔄 Tentative avec voix par défaut...')
            const fallbackUtterance = new SpeechSynthesisUtterance(cleanText)
            fallbackUtterance.lang = locale === 'fr' ? 'fr-FR' : locale === 'ru' ? 'ru-RU' : 'en-US'
            fallbackUtterance.onstart = () => setIsSpeaking(true)
            fallbackUtterance.onend = () => setIsSpeaking(false)
            fallbackUtterance.onerror = () => setIsSpeaking(false)
            window.speechSynthesis.speak(fallbackUtterance)
            return
          }
          setIsSpeaking(false)
        }
        
        window.speechSynthesis.speak(utterance)
      } catch (error) {
        console.error('Erreur Web Speech:', error)
        setIsSpeaking(false)
      }
      return
    }

    console.warn('TTS non disponible')
  }, [locale, webVoice])

  const stop = useCallback(async () => {
    // Mode Electron
    if (getIsElectron() && window.electronAPI?.tts) {
      try {
        await window.electronAPI.tts.stop()
        setIsSpeaking(false)
      } catch (error) {
        console.error('Erreur stop TTS:', error)
      }
      return
    }

    // Mode Web
    if (getHasWebSpeech()) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  return {
    speak,
    stop,
    isSpeaking,
    isAvailable: getIsElectron() || getHasWebSpeech(),
    // Gestion des voix
    availableVoices,
    currentVoice,
    setVoice,
  }
}

// Note: Les types ElectronAPI sont définis dans src/lib/electron/hooks.ts

export default useTTS

