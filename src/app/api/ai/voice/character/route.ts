/**
 * API Route - Génération de voix de personnage avec ElevenLabs (via fal.ai)
 * Génère l'audio d'une phrase avec la voix d'un personnage spécifique
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateVoiceElevenLabs, isFalAvailable } from '@/lib/ai/fal'
import { getCharacterById, getDefaultNarratorId } from '@/lib/ai/voice-catalog'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      text, 
      characterId,  // ID du personnage (ex: "princess-fr", "dragon-en")
      voiceId,      // Ou ID de voix directement (pour custom)
      locale = 'fr' 
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
    
    // Déterminer la voix à utiliser
    let selectedVoiceId = voiceId
    let character = null
    
    if (characterId) {
      // Chercher le personnage
      character = getCharacterById(characterId, locale as 'fr' | 'en' | 'ru')
      if (character) {
        selectedVoiceId = character.elevenLabsId
      }
    }
    
    // Fallback sur le narrateur par défaut
    if (!selectedVoiceId) {
      selectedVoiceId = getDefaultNarratorId(locale as 'fr' | 'en' | 'ru')
    }
    
    console.log('🎭 Génération voix personnage:', {
      characterId,
      characterName: character?.name || 'Custom',
      voiceId: selectedVoiceId,
      textLength: text.length,
    })

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
      characterId: characterId || null,
      characterName: character?.name || null,
    })

  } catch (error) {
    console.error('Erreur API voix personnage:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la voix' },
      { status: 500 }
    )
  }
}
