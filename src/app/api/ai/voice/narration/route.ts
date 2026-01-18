/**
 * API Route - Génération de narration avec ElevenLabs (via fal.ai)
 * Retourne l'audio pour la narration
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateVoiceElevenLabs, isFalAvailable } from '@/lib/ai/fal'
import { getDefaultNarrationVoice } from '@/lib/config/server-config'

// Voix par défaut si aucune n'est spécifiée
const DEFAULT_VOICE_ID = 'kwhMCf63M8O3rCfnQ3oQ' // La Conteuse (FR)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voiceId, locale = 'fr' } = body

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
    
    // Récupérer la voix par défaut de la famille si aucune n'est spécifiée
    let selectedVoiceId = voiceId
    if (!selectedVoiceId) {
      const familyVoice = await getDefaultNarrationVoice(locale)
      selectedVoiceId = familyVoice || DEFAULT_VOICE_ID
    }
    
    console.log('🎤 Génération narration ElevenLabs via fal.ai, voix:', selectedVoiceId)

    // Générer la voix avec ElevenLabs via fal.ai
    const result = await generateVoiceElevenLabs({
      text,
      voiceId: selectedVoiceId,
    })

    // Estimation de la durée (environ 150 mots/minute)
    const wordCount = text.split(/\s+/).length
    const estimatedDuration = (wordCount / 150) * 60

    return NextResponse.json({
      audioUrl: result.audioUrl,
      duration: estimatedDuration,
      voiceId: selectedVoiceId,
    })

  } catch (error) {
    console.error('Erreur API narration:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la narration' },
      { status: 500 }
    )
  }
}
