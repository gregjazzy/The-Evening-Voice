/**
 * API Route - Génération d'images avec Flux 1 Pro (via fal.ai)
 * Inclut upscaling automatique pour qualité impression (Real-ESRGAN x2)
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateImageFlux, adaptChildPrompt, isFalAvailable, upscaleImageForPrint } from '@/lib/ai/fal'

// POST - Générer une image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      description, 
      style = 'magique', 
      ambiance = 'jour',
      aspectRatio,
      forVideo = false, // Si true, format vidéo (16:9), sinon format livre (3:4)
    } = body
    
    // Format par défaut selon l'usage
    // - Image livre : 3:4 portrait (pour impression)
    // - Image pour vidéo : 16:9 paysage (standard vidéo)
    const finalAspectRatio = aspectRatio || (forVideo ? '16:9' : '3:4')

    if (!description) {
      return NextResponse.json(
        { error: 'Description requise' },
        { status: 400 }
      )
    }

    if (!isFalAvailable()) {
      return NextResponse.json(
        { error: 'Clé API fal.ai non configurée' },
        { status: 500 }
      )
    }

    // Adapter le prompt enfantin
    const prompt = adaptChildPrompt(description, style, ambiance)

    console.log('🎨 Génération image Flux 1 Pro:', prompt.substring(0, 100) + '...')

    // Générer l'image avec Flux 1 Pro
    const result = await generateImageFlux({
      prompt,
      aspectRatio: finalAspectRatio as '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2',
      numImages: 1,
    })

    let finalImageUrl = result.images[0]?.url
    let finalWidth = result.images[0]?.width
    let finalHeight = result.images[0]?.height
    let wasUpscaled = false

    // Upscaling automatique pour qualité impression (x2)
    // ~1152x1536 → ~2304x3072 (suffisant pour A5 à 300 DPI)
    if (finalImageUrl) {
      try {
        console.log('🔍 Upscaling image pour qualité impression (x2)...')
        const upscaled = await upscaleImageForPrint({
          imageUrl: finalImageUrl,
          scale: 2,
        })
        finalImageUrl = upscaled.imageUrl
        finalWidth = upscaled.width
        finalHeight = upscaled.height
        wasUpscaled = true
        console.log(`✅ Image upscalée: ${finalWidth}x${finalHeight}`)
      } catch (upscaleError) {
        console.warn('⚠️ Upscaling échoué, utilisation de l\'image originale:', upscaleError)
        // Continue avec l'image originale si l'upscaling échoue
      }
    }

    return NextResponse.json({
      status: 'completed',
      imageUrl: finalImageUrl,
      width: finalWidth,
      height: finalHeight,
      upscaled: wasUpscaled,
      prompt: result.prompt,
      seed: result.seed,
    })
  } catch (error) {
    console.error('Erreur API image:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de l\'image' },
      { status: 500 }
    )
  }
}

