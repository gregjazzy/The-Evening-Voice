import { NextRequest, NextResponse } from 'next/server'

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ElevenLabs non configuré' }, { status: 500 })
  }

  const { text, voiceId } = await req.json()

  if (!text || !voiceId) {
    return NextResponse.json({ error: 'text et voiceId requis' }, { status: 400 })
  }

  // Limite de sécurité (ElevenLabs facture au caractère)
  if (text.length > 5000) {
    return NextResponse.json({ error: 'Texte trop long (max 5000 caractères)' }, { status: 400 })
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.4,
          use_speaker_boost: true,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: { message: response.statusText } }))
      return NextResponse.json(
        { error: error.detail?.message || 'Erreur ElevenLabs' },
        { status: response.status }
      )
    }

    const audioBuffer = await response.arrayBuffer()

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.byteLength),
      },
    })
  } catch (error) {
    console.error('Erreur génération narration:', error)
    return NextResponse.json({ error: 'Erreur génération' }, { status: 500 })
  }
}
