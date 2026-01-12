/**
 * API Route - Génération de voix (ElevenLabs)
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  generateVoice, 
  generatePageNarration,
  generateLunaVoice,
  checkQuota,
  AVAILABLE_VOICES 
} from '@/lib/ai/elevenlabs'

// POST - Générer de l'audio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      text, 
      type = 'narration', // 'narration' | 'luna' | 'custom'
      voiceType = 'narrator',
      voiceId 
    } = body

    if (!text) {
      return NextResponse.json(
        { error: 'Texte requis' },
        { status: 400 }
      )
    }

    let result
    switch (type) {
      case 'luna':
        result = await generateLunaVoice(text)
        break
      case 'narration':
        result = await generatePageNarration(text, voiceType)
        break
      case 'custom':
        result = await generateVoice({ text, voiceType, voiceId })
        break
      default:
        result = await generatePageNarration(text, voiceType)
    }

    // Convertir le blob en base64 pour le transport
    const buffer = await result.audioBlob.arrayBuffer()
    const base64Audio = Buffer.from(buffer).toString('base64')

    return NextResponse.json({
      audioUrl: result.audioUrl,
      audioData: base64Audio,
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

// GET - Récupérer les voix disponibles et le quota
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'quota') {
      const quota = await checkQuota()
      return NextResponse.json(quota)
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

