import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

// Supabase service client for credit operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ElevenLabs non configuré' }, { status: 500 })
  }

  const { text, voiceId, profileId } = await req.json()

  if (!text || !voiceId) {
    return NextResponse.json({ error: 'text et voiceId requis' }, { status: 400 })
  }

  // Limite de sécurité (ElevenLabs facture au caractère)
  if (text.length > 5000) {
    return NextResponse.json({ error: 'Texte trop long (max 5000 caractères)' }, { status: 400 })
  }

  const charCount = text.length
  let creditDeducted = false
  let newNarrationBalance: number | undefined

  // 💰 Narration credit check & deduction
  if (profileId) {
    const { data: creditResult, error: creditError } = await supabase.rpc('deduct_narration_credits', {
      p_profile_id: profileId,
      p_amount: charCount,
    })

    if (creditError) {
      console.error('Narration credit deduction error:', creditError)
      return NextResponse.json(
        { error: 'Erreur système de crédits narration', code: 'NARRATION_CREDIT_ERROR' },
        { status: 500 }
      )
    }

    const result = creditResult?.[0]
    if (!result?.success) {
      return NextResponse.json(
        {
          error: 'Crédits narration insuffisants',
          code: 'INSUFFICIENT_NARRATION_CREDITS',
          required: charCount,
          balance: result?.new_balance ?? 0,
        },
        { status: 402 }
      )
    }

    newNarrationBalance = result.new_balance
    creditDeducted = true
    console.log(`🎙️ Narration credit deducted: ${charCount} chars. New balance: ${newNarrationBalance}`)
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
      // Refund on ElevenLabs error
      if (creditDeducted && profileId) {
        console.log('💸 Remboursement crédits narration (échec ElevenLabs)')
        await supabase.rpc('add_narration_credits', {
          p_profile_id: profileId,
          p_amount: charCount,
          p_reason: 'refund_failed_narration',
          p_reference_id: null,
        })
        newNarrationBalance = (newNarrationBalance ?? 0) + charCount
      }

      const error = await response.json().catch(() => ({ detail: { message: response.statusText } }))
      return NextResponse.json(
        { error: error.detail?.message || 'Erreur ElevenLabs', newNarrationBalance },
        { status: response.status }
      )
    }

    const audioBuffer = await response.arrayBuffer()

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.byteLength),
        'X-Narration-Balance': String(newNarrationBalance ?? ''),
      },
    })
  } catch (error) {
    // Refund on unexpected error
    if (creditDeducted && profileId) {
      console.log('💸 Remboursement crédits narration (erreur inattendue)')
      try {
        await supabase.rpc('add_narration_credits', {
          p_profile_id: profileId,
          p_amount: charCount,
          p_reason: 'refund_error',
          p_reference_id: null,
        })
      } catch { /* best effort refund */ }
    }
    console.error('Erreur génération narration:', error)
    return NextResponse.json({ error: 'Erreur génération' }, { status: 500 })
  }
}
