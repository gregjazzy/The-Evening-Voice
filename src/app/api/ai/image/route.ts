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
import { generateImageGemini, isGeminiImageAvailable } from '@/lib/ai/gemini-image'
import {
  generateImageRedux,
  checkImageJobStatus,
  checkReduxJobStatus,
  isFalAvailable
} from '@/lib/ai/fal'

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
    } = body

    const finalAspectRatio = aspectRatio || '3:4'
    const promptText = fullPrompt || description

    if (!promptText || promptText.length < 3) {
      return NextResponse.json(
        { error: 'Description requise (minimum 3 caractères)' },
        { status: 400 }
      )
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
      })
    }

    // Échec Gemini
    return NextResponse.json(
      { error: result.error || 'Échec de la génération Gemini' },
      { status: 500 }
    )
  } catch (error: unknown) {
    console.error('Erreur API image:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la génération de l\'image'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
