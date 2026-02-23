/**
 * API Route - Génération d'images via fal.ai
 * 
 * Modèles supportés :
 * - Nano Banana Pro : Génération standard (défaut)
 * - PuLID : Génération avec personnage de référence (si referenceImageUrl fourni)
 * 
 * Architecture polling pour éviter le timeout Netlify (10s) :
 * - POST : Soumet le job à fal.ai, retourne { jobId, status: 'pending' } immédiatement
 * - GET : Vérifie le status d'un job, retourne l'image quand prête
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  generateImageFlux,
  generateImageRedux,
  checkImageJobStatus,
  checkReduxJobStatus,
  isFalAvailable
} from '@/lib/ai/fal'

// GET - Vérifier le status d'un job
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
        const imgResponse = await fetch(image.url)
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
      status: result.status, // 'pending' ou 'processing'
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

// POST - Soumettre un nouveau job de génération
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      description,  // Idée principale (fallback)
      prompt: fullPrompt, // Prompt complet généré par le kit (prioritaire)
      style = 'magique', 
      ambiance = 'jour',
      aspectRatio,
      model = 'nano-banana', // Modèle par défaut: Nano Banana Pro
      // Nouveaux paramètres pour PuLID (consistance personnage)
      referenceImageUrl,  // Si fourni, utilise PuLID
      characterDescription,  // "le dragon bleu"
    } = body
    
    // Format par défaut : 3:4 portrait (pour impression livre)
    const finalAspectRatio = aspectRatio || '3:4'

    // Utiliser le prompt complet si disponible, sinon la description
    const promptText = fullPrompt || description

    if (!promptText || promptText.length < 3) {
      return NextResponse.json(
        { error: 'Description requise (minimum 3 caractères)' },
        { status: 400 }
      )
    }

    if (!isFalAvailable()) {
      return NextResponse.json(
        { error: 'Clé API fal.ai non configurée' },
        { status: 500 }
      )
    }

    // 🔄 Si une image de référence est fournie, utiliser Flux Redux
    // Fonctionne avec TOUT : humains, animaux, créatures, objets
    if (referenceImageUrl) {
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

    // 🍌 Sinon, utiliser Nano Banana Pro (comportement par défaut)
    // Prompt envoyé tel quel — pas de transformation
    const prompt = promptText

    console.log(`🎨 Soumission job ${model.toUpperCase()}:`, prompt.substring(0, 150) + '...')

    // Soumettre le job (retourne immédiatement avec jobId)
    const result = await generateImageFlux({
      prompt,
      aspectRatio: finalAspectRatio as '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2',
      numImages: 1,
      model: model as 'flux' | 'recraft' | 'nano-banana',
      resolution: '2K',
    })

    // Retourner le jobId pour que le client puisse poll
    if (result.jobId) {
      console.log(`📋 Job soumis: ${result.jobId}`)
      return NextResponse.json({
        status: 'pending',
        jobId: result.jobId,
        model: result.model || model,
      })
    }

    // Cas où le résultat est retourné directement (modèles autres que nano-banana)
    if (result.images && result.images.length > 0) {
      const image = result.images[0]
      console.log(`✅ Image générée directement: ${image.width}x${image.height}`)

      let imageUrl = image.url
      try {
        const imgResponse = await fetch(image.url)
        if (imgResponse.ok) {
          const buffer = Buffer.from(await imgResponse.arrayBuffer())
          const contentType = imgResponse.headers.get('content-type') || 'image/png'
          imageUrl = `data:${contentType};base64,${buffer.toString('base64')}`
        }
      } catch {
        console.warn('⚠️ Proxy image échoué, URL directe utilisée')
      }

      return NextResponse.json({
        status: 'completed',
        imageUrl,
        width: image.width,
        height: image.height,
        model,
      })
    }

    return NextResponse.json(
      { error: 'Résultat inattendu de la génération' },
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

