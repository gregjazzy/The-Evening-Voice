/**
 * API Route - Génération de voix (ElevenLabs via fal.ai)
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateVoiceElevenLabs, isFalAvailable } from '@/lib/ai/fal'
import { AVAILABLE_VOICES } from '@/lib/ai/elevenlabs'

// Voix par défaut selon le type
const DEFAULT_VOICES: Record<string, string> = {
  narrator: 'kwhMCf63M8O3rCfnQ3oQ', // La Conteuse (FR)
  ai_friend: 'FvmvwvObRqIHojkEGh5N', // Jeune française
  young_girl: 'FvmvwvObRqIHojkEGh5N',
  young_boy: '5Qfm4RqcAer0xoyWtoHC',
  grandma: 'M9RTtrzRACmbUzsEMq8p',
  grandpa: '1wg2wOjdEWKA7yQD8Kca',
}

// POST - Générer de l'audio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      text, 
      type = 'narration',
      voiceType = 'narrator',
      voiceId 
    } = body

    if (!text) {
      return NextResponse.json(
        { error: 'Texte requis' },
        { status: 400 }
      )
    }

    if (!isFalAvailable()) {
      return NextResponse.json(
        { error: 'Clé API fal.ai non configurée' },
        { status: 500 }
      )
    }

    // Sélectionner la voix
    const selectedVoiceId = voiceId || DEFAULT_VOICES[voiceType] || DEFAULT_VOICES.narrator

    console.log('🎤 Génération voix ElevenLabs via fal.ai:', { type, voiceType, voiceId: selectedVoiceId })

    const result = await generateVoiceElevenLabs({
      text,
      voiceId: selectedVoiceId,
    })

    return NextResponse.json({
      audioUrl: result.audioUrl,
      mimeType: 'audio/mpeg',
    })
  } catch (error) {
    console.error('Erreur API voice:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération audio' },
      { status: 500 }
    )
  }
}

// GET - Récupérer les voix disponibles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'quota') {
      // Avec fal.ai, le quota est géré différemment
      return NextResponse.json({
        character_count: 0,
        character_limit: 100000,
        can_generate: true,
      })
    }

    // Par défaut, retourner les voix disponibles
    return NextResponse.json({
      voices: AVAILABLE_VOICES,
    })
  } catch (error) {
    console.error('Erreur récupération voix:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des voix' },
      { status: 500 }
    )
  }
}

