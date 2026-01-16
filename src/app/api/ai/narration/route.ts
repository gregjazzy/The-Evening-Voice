/**
 * API Route - Génération de narration
 * 
 * POST /api/ai/narration
 * 
 * Génère une narration audio via ElevenLabs.
 * Si ElevenLabs échoue ou n'est pas configuré, retourne les infos
 * pour que le client utilise Apple Voice (TTS système).
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  generateNarrationWithFallback,
  getNarrationVoices,
  type VoiceType,
} from '@/lib/ai/elevenlabs'

interface NarrationRequestBody {
  text: string
  voiceType?: VoiceType
}

export async function POST(request: NextRequest) {
  try {
    const body: NarrationRequestBody = await request.json()
    const { text, voiceType = 'narrator' } = body

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le texte est requis' },
        { status: 400 }
      )
    }

    // Limiter la longueur du texte (sécurité + coût)
    const maxLength = 5000 // ~5000 caractères max par requête
    if (text.length > maxLength) {
      return NextResponse.json(
        { error: `Le texte est trop long (max ${maxLength} caractères)` },
        { status: 400 }
      )
    }

    // Générer la narration avec fallback automatique
    const result = await generateNarrationWithFallback(text, voiceType)

    // Si ElevenLabs a généré un audio, on doit le convertir en base64
    // car on ne peut pas retourner un Blob directement
    if (result.source === 'elevenlabs' && result.audioBlob) {
      const arrayBuffer = await result.audioBlob.arrayBuffer()
      const base64Audio = Buffer.from(arrayBuffer).toString('base64')
      
      return NextResponse.json({
        source: 'elevenlabs',
        audioBase64: base64Audio,
        audioMimeType: 'audio/mpeg',
        text: result.text,
        voiceType: result.voiceType,
        estimatedDuration: result.estimatedDuration,
      })
    }

    // Fallback Apple Voice - retourner les infos pour le client
    return NextResponse.json({
      source: 'apple_fallback',
      audioBase64: null,
      text: result.text,
      voiceType: result.voiceType,
      estimatedDuration: result.estimatedDuration,
    })

  } catch (error) {
    console.error('Erreur API narration:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la génération de la narration',
        source: 'apple_fallback', // Fallback en cas d'erreur
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
