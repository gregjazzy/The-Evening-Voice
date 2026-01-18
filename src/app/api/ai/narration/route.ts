/**
 * API Route - Génération de narration (ElevenLabs via fal.ai)
 * 
 * POST /api/ai/narration
 * 
 * Génère une narration audio via ElevenLabs (fal.ai).
 * Si fal.ai échoue ou n'est pas configuré, retourne les infos
 * pour que le client utilise Apple Voice (TTS système).
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateVoiceElevenLabs, isFalAvailable } from '@/lib/ai/fal'
import { getNarrationVoices, type VoiceType } from '@/lib/ai/elevenlabs'

// Voix par défaut selon le type
const DEFAULT_VOICES: Record<string, string> = {
  narrator: 'kwhMCf63M8O3rCfnQ3oQ', // La Conteuse (FR)
  young_girl: 'FvmvwvObRqIHojkEGh5N',
  young_boy: '5Qfm4RqcAer0xoyWtoHC',
  grandma: 'M9RTtrzRACmbUzsEMq8p',
  grandpa: '1wg2wOjdEWKA7yQD8Kca',
}

interface NarrationRequestBody {
  text: string
  voiceType?: VoiceType
  voiceId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: NarrationRequestBody = await request.json()
    const { text, voiceType = 'narrator', voiceId } = body

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le texte est requis' },
        { status: 400 }
      )
    }

    // Limiter la longueur du texte (sécurité + coût)
    const maxLength = 5000
    if (text.length > maxLength) {
      return NextResponse.json(
        { error: `Le texte est trop long (max ${maxLength} caractères)` },
        { status: 400 }
      )
    }

    // Si fal.ai n'est pas configuré, fallback Apple Voice
    if (!isFalAvailable()) {
      console.log('⚠️ fal.ai non configuré, fallback Apple Voice')
      return NextResponse.json({
        source: 'apple_fallback',
        audioBase64: null,
        text,
        voiceType,
        estimatedDuration: Math.ceil(text.length / 15), // ~15 chars/sec
      })
    }

    // Sélectionner la voix
    const selectedVoiceId = voiceId || DEFAULT_VOICES[voiceType] || DEFAULT_VOICES.narrator

    console.log('🎤 Génération narration ElevenLabs via fal.ai:', { voiceType, voiceId: selectedVoiceId })

    try {
      const result = await generateVoiceElevenLabs({
        text,
        voiceId: selectedVoiceId,
      })

      return NextResponse.json({
        source: 'elevenlabs',
        audioUrl: result.audioUrl,
        audioMimeType: 'audio/mpeg',
        text,
        voiceType,
        estimatedDuration: Math.ceil(text.length / 15),
      })
    } catch (genError) {
      console.error('❌ Erreur génération ElevenLabs:', genError)
      // Fallback Apple Voice
      return NextResponse.json({
        source: 'apple_fallback',
        audioBase64: null,
        text,
        voiceType,
        estimatedDuration: Math.ceil(text.length / 15),
      })
    }

  } catch (error) {
    console.error('Erreur API narration:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la génération de la narration',
        source: 'apple_fallback',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai/narration
 * 
 * Retourne la liste des voix disponibles pour la narration
 */
export async function GET() {
  try {
    const voices = getNarrationVoices()
    return NextResponse.json({ voices })
  } catch (error) {
    console.error('Erreur récupération voix:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des voix' },
      { status: 500 }
    )
  }
}
