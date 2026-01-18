/**
 * Hook React pour la narration des histoires
 * 
 * Stratégie :
 * - ElevenLabs pour la qualité premium (voix de conte de fées)
 * - Fallback automatique sur Apple Voice si ElevenLabs échoue
 * 
 * Usage :
 * ```tsx
 * const { generateNarration, playNarration, isGenerating, isPlaying } = useNarration()
 * 
 * // Générer la narration d'une page
 * const narration = await generateNarration("Il était une fois...", "narrator")
 * 
 * // Jouer la narration
 * await playNarration(narration)
 * ```
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import { useTTS } from './useTTS'
import type { VoiceType } from '@/lib/ai/elevenlabs'

// Résultat de la narration (version client)
interface NarrationResult {
  audioUrl: string | null
  source: 'elevenlabs' | 'apple_fallback'
  text: string
  voiceType: VoiceType
  estimatedDuration: number
}

interface UseNarrationReturn {
  /** Génère la narration (ElevenLabs ou prépare pour Apple Voice) */
  generateNarration: (text: string, voiceType?: VoiceType) => Promise<NarrationResult>
  /** Joue une narration générée */
  playNarration: (narration: NarrationResult) => Promise<void>
  /** Arrête la lecture en cours */
  stopNarration: () => void
  /** Est en train de générer */
  isGenerating: boolean
  /** Est en train de lire */
  isPlaying: boolean
  /** Source de la dernière narration */
  currentSource: 'elevenlabs' | 'apple_fallback' | null
  /** Erreur éventuelle */
  error: string | null
}

export function useNarration(locale: 'fr' | 'en' | 'ru' = 'fr', preferredVoice?: string): UseNarrationReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSource, setCurrentSource] = useState<'elevenlabs' | 'apple_fallback' | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Ref pour l'audio ElevenLabs
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // TTS Apple pour le fallback (utilise la voix préférée de l'utilisateur)
  const tts = useTTS(locale, preferredVoice)

  /**
   * Génère la narration via l'API
   */
  const generateNarration = useCallback(async (
    text: string,
    voiceType: VoiceType = 'narrator'
  ): Promise<NarrationResult> => {
    setIsGenerating(true)
    setError(null)

    try {
      // Appeler l'API route qui gère ElevenLabs + fallback
      const response = await fetch('/api/ai/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceType }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la génération de la narration')
      }

      const apiResult = await response.json()
      setCurrentSource(apiResult.source)

      // Si ElevenLabs, convertir le base64 en blob URL
      let audioUrl: string | null = null
      if (apiResult.source === 'elevenlabs' && apiResult.audioBase64) {
        const binaryString = atob(apiResult.audioBase64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: apiResult.audioMimeType || 'audio/mpeg' })
        audioUrl = URL.createObjectURL(blob)
      }

      return {
        audioUrl,
        source: apiResult.source,
        text: apiResult.text,
        voiceType: apiResult.voiceType,
        estimatedDuration: apiResult.estimatedDuration,
      }
    } catch (err) {
      console.error('Erreur génération narration:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')

      // En cas d'erreur totale, retourner un fallback Apple Voice
      return {
        audioUrl: null,
        source: 'apple_fallback',
        text: text.replace(/\n+/g, '. ').replace(/\s+/g, ' ').trim(),
        voiceType,
        estimatedDuration: Math.ceil(text.split(/\s+/).length / 150 * 60),
      }
    } finally {
      setIsGenerating(false)
    }
  }, [])

  /**
   * Joue une narration générée
   */
  const playNarration = useCallback(async (narration: NarrationResult): Promise<void> => {
    setIsPlaying(true)
    setError(null)

    try {
      if (narration.source === 'elevenlabs' && narration.audioUrl) {
        // Jouer l'audio ElevenLabs
        return new Promise((resolve, reject) => {
          const audio = new Audio(narration.audioUrl!)
          audioRef.current = audio

          audio.onended = () => {
            setIsPlaying(false)
            resolve()
          }

          audio.onerror = (e) => {
            setIsPlaying(false)
            reject(new Error('Erreur lecture audio'))
          }

          audio.play().catch(reject)
        })
      } else {
        // Fallback : Apple Voice via useTTS
        await tts.speak(narration.text)
        setIsPlaying(false)
      }
    } catch (err) {
      console.error('Erreur lecture narration:', err)
      setError(err instanceof Error ? err.message : 'Erreur lecture')
      setIsPlaying(false)
      throw err
    }
  }, [tts])

  /**
   * Arrête la lecture en cours
   */
  const stopNarration = useCallback(() => {
    // Arrêter audio ElevenLabs
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }

    // Arrêter Apple Voice
    tts.stop()

    setIsPlaying(false)
  }, [tts])

  return {
    generateNarration,
    playNarration,
    stopNarration,
    isGenerating,
    isPlaying,
    currentSource,
    error,
  }
}

export default useNarration
