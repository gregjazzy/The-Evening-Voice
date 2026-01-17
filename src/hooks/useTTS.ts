/**
 * Hook React pour le Text-to-Speech
 * - Electron : utilise le TTS macOS natif (meilleure qualité)
 * - Web : utilise l'API Web Speech Synthesis du navigateur
 */

'use client'

import { useState, useCallback, useEffect } from 'react'

interface UseTTSReturn {
  speak: (text: string) => Promise<void>
  stop: () => Promise<void>
  isSpeaking: boolean
  isAvailable: boolean
}

// Vérifier si on est dans Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron

// Vérifier si Web Speech API est disponible
const hasWebSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window

// Voix préférées par langue pour Web Speech
const WEB_VOICES: Record<string, string[]> = {
  fr: ['Audrey', 'Amélie', 'Thomas', 'Google français'],
  en: ['Samantha', 'Karen', 'Google US English', 'Google UK English Female'],
  ru: ['Milena', 'Yuri', 'Google русский'],
}

// Paramètres de voix par langue (rate, pitch)
const VOICE_SETTINGS: Record<string, { rate: number; pitch: number }> = {
  fr: { rate: 1.15, pitch: 1.1 },   // Français plus rapide
  en: { rate: 1.05, pitch: 1.1 },   // Anglais normal
  ru: { rate: 1.0, pitch: 1.05 },   // Russe normal
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

// Helper pour trouver la meilleure voix
function findBestVoice(locale: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  const preferredNames = WEB_VOICES[locale] || WEB_VOICES.fr
  
  // Chercher une voix préférée
  let selectedVoice = voices.find(v => 
    preferredNames.some(name => v.name.includes(name))
  )
  
  // Fallback : voix de la langue
  if (!selectedVoice) {
    const langCode = locale === 'fr' ? 'fr' : locale === 'ru' ? 'ru' : 'en'
    selectedVoice = voices.find(v => v.lang.startsWith(langCode))
  }
  
  // Fallback ultime : première voix
  if (!selectedVoice && voices.length > 0) {
    selectedVoice = voices[0]
  }
  
  return selectedVoice || null
}

export function useTTS(locale: 'fr' | 'en' | 'ru' = 'fr'): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [webVoice, setWebVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [voicesReady, setVoicesReady] = useState(false)

  // Charger les voix disponibles pour Web Speech
  useEffect(() => {
    if (!hasWebSpeech || isElectron) return

    const loadVoices = () => {
      const selectedVoice = findBestVoice(locale)
      setWebVoice(selectedVoice)
      if (selectedVoice) {
        setVoicesReady(true)
        console.log('🎤 Voix TTS chargée:', selectedVoice.name)
      }
    }

    // Les voix peuvent être chargées de manière asynchrone
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [locale])

  const speak = useCallback(async (text: string) => {
    // Nettoyer le texte (supprimer emojis)
    const cleanText = cleanTextForTTS(text)
    if (!cleanText) return // Ne rien lire si le texte est vide après nettoyage

    // Mode Electron : TTS macOS natif
    if (isElectron && window.electronAPI?.tts) {
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
    if (hasWebSpeech) {
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
        }
        
        // Définir la langue explicitement (important si pas de voix)
        utterance.lang = locale === 'fr' ? 'fr-FR' : locale === 'ru' ? 'ru-RU' : 'en-US'
        
        // Paramètres adaptés par langue
        const settings = VOICE_SETTINGS[locale] || VOICE_SETTINGS.fr
        utterance.rate = settings.rate
        utterance.pitch = settings.pitch
        utterance.volume = 1
        
        utterance.onstart = () => {
          console.log('🔊 TTS démarré:', cleanText.slice(0, 50) + '...')
          setIsSpeaking(true)
        }
        utterance.onend = () => {
          console.log('🔇 TTS terminé')
          setIsSpeaking(false)
        }
        utterance.onerror = (e) => {
          // Ignorer 'canceled' si c'est juste une interruption normale
          if (e.error !== 'canceled') {
            console.error('❌ Erreur TTS:', e.error)
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
    if (isElectron && window.electronAPI?.tts) {
      try {
        await window.electronAPI.tts.stop()
        setIsSpeaking(false)
      } catch (error) {
        console.error('Erreur stop TTS:', error)
      }
      return
    }

    // Mode Web
    if (hasWebSpeech) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  return {
    speak,
    stop,
    isSpeaking,
    isAvailable: isElectron || hasWebSpeech,
  }
}

// Note: Les types ElectronAPI sont définis dans src/lib/electron/hooks.ts

export default useTTS

