/**
 * API Route - Génération d'images
 *
 * Backend principal : Google Gemini API (direct, pas de polling)
 * Fallback : fal.ai pour les cas spéciaux (Redux img2img)
 *
 * Flow Gemini :
 * - POST : Appelle Gemini → retourne { status: 'completed', imageUrl } directement
 * - Pas de polling nécessaire (base64 dans la réponse)
 *
 * Flow fal.ai (Redux / img2img uniquement) :
 * - POST : Soumet le job → retourne { jobId, status: 'pending' }
 * - GET : Vérifie le status d'un job fal.ai
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateImageGemini, isGeminiImageAvailable } from '@/lib/ai/gemini-image'
import {
  generateImageRedux,
  checkImageJobStatus,
  checkReduxJobStatus,
  isFalAvailable
} from '@/lib/ai/fal'

// Supabase service client for credit operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Vérifier le status d'un job fal.ai (polling legacy pour Redux/img2img)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const model = searchParams.get('model') || 'nano-banana'

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId requis' },
        { status: 400 }
      )
    }

    if (!isFalAvailable()) {
      return NextResponse.json(
        { error: 'Clé API fal.ai non configurée' },
        { status: 500 }
      )
    }

    console.log(`🔍 Checking job status: ${jobId} (model: ${model})`)

    // Utiliser le bon checker selon le modèle
    const result = model === 'flux-img2img'
      ? await checkReduxJobStatus(jobId)
      : await checkImageJobStatus(jobId, model)

    if (result.status === 'completed' && result.images && result.images.length > 0) {
      const image = result.images[0]

      // Proxy : convertir l'URL fal.media en data URL pour éviter les problèmes réseau/CORS côté client
      let imageUrl = image.url
      try {
        const proxyController = new AbortController()
        const proxyTimeout = setTimeout(() => proxyController.abort(), 8000)
        const imgResponse = await fetch(image.url, { signal: proxyController.signal })
        clearTimeout(proxyTimeout)
        if (imgResponse.ok) {
          const buffer = Buffer.from(await imgResponse.arrayBuffer())
          const contentType = imgResponse.headers.get('content-type') || 'image/png'
          imageUrl = `data:${contentType};base64,${buffer.toString('base64')}`
        }
      } catch (proxyErr) {
        console.warn('⚠️ Proxy image échoué, URL directe utilisée:', proxyErr)
      }

      return NextResponse.json({
        status: 'completed',
        imageUrl,
        width: image.width,
        height: image.height,
        model,
      })
    }

    if (result.status === 'failed') {
      return NextResponse.json({
        status: 'failed',
        error: 'La génération a échoué',
      })
    }

    // Encore en cours
    return NextResponse.json({
      status: result.status,
      jobId,
      model,
    })
  } catch (error: unknown) {
    console.error('Erreur vérification job:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la vérification du job'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// POST - Générer une image
export async function POST(request: NextRequest) {
  let profileId: string | undefined
  let creditDeducted = false
  let newBalance: number | undefined

  try {
    const body = await request.json()
    const {
      description,
      prompt: fullPrompt,
      style = 'magique',
      ambiance = 'jour',
      aspectRatio,
      resolution,
      model = 'nano-banana',
      // Paramètres pour Redux (consistance personnage) — reste sur fal.ai
      referenceImageUrl,
      characterDescription,
      // Credit system
      profileId: bodyProfileId,
    } = body

    profileId = bodyProfileId
    const finalAspectRatio = aspectRatio || '3:4'
    const promptText = fullPrompt || description

    if (!promptText || promptText.length < 3) {
      return NextResponse.json(
        { error: 'Description requise (minimum 3 caractères)' },
        { status: 400 }
      )
    }

    // 💰 Credit check & deduction
    if (profileId) {
      const { data: creditResult, error: creditError } = await supabase.rpc('deduct_credits', {
        p_profile_id: profileId,
        p_amount: 1,
      })

      if (creditError) {
        console.error('Credit deduction error:', creditError)
        return NextResponse.json(
          { error: 'Erreur système de crédits', code: 'CREDIT_ERROR' },
          { status: 500 }
        )
      }

      const result = creditResult?.[0]
      if (!result?.success) {
        return NextResponse.json(
          { error: 'Crédits insuffisants', code: 'INSUFFICIENT_CREDITS' },
          { status: 402 }
        )
      }

      newBalance = result.new_balance
      creditDeducted = true
      console.log(`💰 Credit deducted. New balance: ${newBalance}`)
    }

    // 🔄 Image de référence → Flux Redux via fal.ai (pas encore supporté par Gemini direct)
    if (referenceImageUrl) {
      if (!isFalAvailable()) {
        return NextResponse.json(
          { error: 'Clé API fal.ai non configurée (nécessaire pour img2img)' },
          { status: 500 }
        )
      }

      console.log(`🔄 Mode Flux Redux activé - personnage/style de référence`)

      const result = await generateImageRedux({
        prompt: promptText,
        referenceImageUrl,
        characterDescription,
        aspectRatio: finalAspectRatio as '3:4' | '9:16' | '4:3' | '16:9' | '1:1' | '2:3' | '3:2',
      })

      if (result.jobId) {
        console.log(`📋 Flux Redux job soumis: ${result.jobId}`)
        return NextResponse.json({
          status: 'pending',
          jobId: result.jobId,
          model: 'flux-img2img',
          newBalance,
        })
      }
    }

    // 🎨 Génération standard → Google Gemini 3 Pro Image (direct, même modèle que nano-banana)
    if (!isGeminiImageAvailable()) {
      return NextResponse.json(
        { error: 'Clé API Google Gemini non configurée' },
        { status: 500 }
      )
    }

    const finalResolution = resolution || '2K'
    const prompt = promptText

    console.log(`🎨 Gemini 3 Pro Image (direct) - ${finalResolution}:`, prompt.substring(0, 150) + '...')

    const result = await generateImageGemini({
      prompt,
      aspectRatio: finalAspectRatio as '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2',
      resolution: finalResolution as '1K' | '2K' | '4K',
    })

    if (result.status === 'completed' && result.imageUrl) {
      console.log(`✅ Image Gemini générée: ${result.width}x${result.height}`)
      return NextResponse.json({
        status: 'completed',
        imageUrl: result.imageUrl,
        width: result.width,
        height: result.height,
        model: 'gemini',
        newBalance,
      })
    }

    // Échec Gemini → rembourser le crédit
    if (creditDeducted && profileId) {
      console.log('💸 Remboursement crédit (échec Gemini)')
      await supabase.rpc('add_credits', { p_profile_id: profileId, p_amount: 1, p_reason: 'refund_failed_generation', p_reference_id: null })
      newBalance = (newBalance ?? 0) + 1
    }
    return NextResponse.json(
      { error: result.error || 'Échec de la génération Gemini', newBalance },
      { status: 500 }
    )
  } catch (error: unknown) {
    // Rembourser en cas d'erreur inattendue
    if (creditDeducted && profileId) {
      console.log('💸 Remboursement crédit (erreur inattendue)')
      try {
        await supabase.rpc('add_credits', { p_profile_id: profileId, p_amount: 1, p_reason: 'refund_error', p_reference_id: null })
      } catch { /* best effort refund */ }
    }
    console.error('Erreur API image:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la génération de l\'image'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
