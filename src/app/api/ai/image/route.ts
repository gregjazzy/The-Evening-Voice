/**
 * API Route - Génération d'images avec Nano Banana Pro (Google Gemini 3 Pro Image via fal.ai)
 * 
 * Avantages de Nano Banana Pro :
 * - Meilleure compréhension du langage naturel (français inclus)
 * - Résolution native 2K
 * - Meilleure interprétation des descriptions complexes
 * 
 * Coût optimisé : 2K ($0.15) + upscale x2 ($0.01) = $0.16 pour ~500 DPI
 * (vs 4K natif à $0.30 pour le même résultat)
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateImageFlux, adaptChildPrompt, isFalAvailable, upscaleImageForPrint } from '@/lib/ai/fal'

// POST - Générer une image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      description,  // Idée principale (fallback)
      prompt: fullPrompt, // Prompt complet généré par le kit (prioritaire)
      style = 'magique', 
      ambiance = 'jour',
      aspectRatio,
      forVideo = false, // Si true, format vidéo (16:9), sinon format livre (3:4)
      model = 'nano-banana', // Modèle par défaut: Nano Banana Pro
      skipUpscale = false, // Pour les vidéos, pas besoin d'upscale
    } = body
    
    // Format par défaut selon l'usage
    // - Image livre : 3:4 portrait (pour impression)
    // - Image pour vidéo : 16:9 paysage (standard vidéo)
    const finalAspectRatio = aspectRatio || (forVideo ? '16:9' : '3:4')

    // Utiliser le prompt complet si disponible, sinon la description
    const promptText = fullPrompt || description

    if (!promptText) {
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

    // 🍌 Nano Banana Pro comprend le français nativement !
    // Pas besoin de traduire en anglais.
    // Si on a le prompt complet, on l'utilise directement
    // Sinon on adapte la description simple
    const prompt = fullPrompt 
      ? promptText 
      : adaptChildPrompt(promptText, style, ambiance)

    console.log(`🎨 Génération image avec ${model.toUpperCase()}:`, prompt.substring(0, 150) + '...')

    // Générer l'image en 2K
    const result = await generateImageFlux({
      prompt,
      aspectRatio: finalAspectRatio as '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2',
      numImages: 1,
      model: model as 'flux' | 'recraft' | 'nano-banana',
      resolution: '2K',
    })

    let finalImageUrl = result.images[0]?.url
    let finalWidth = result.images[0]?.width
    let finalHeight = result.images[0]?.height
    let wasUpscaled = false

    // 🔍 Upscale pour qualité impression livre (300+ DPI sur A5)
    // Uniquement pour les images livres, pas les vidéos
    // Coût: +$0.01 pour doubler la résolution
    const shouldUpscale = !forVideo && !skipUpscale && finalImageUrl

    if (shouldUpscale) {
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
        console.warn('⚠️ Upscaling échoué, utilisation de l\'image 2K:', upscaleError)
        // Continue avec l'image 2K si l'upscaling échoue
      }
    } else {
      console.log(`✅ Image générée (sans upscale): ${finalImageUrl?.substring(0, 80)}...`)
    }

    return NextResponse.json({
      status: 'completed',
      imageUrl: finalImageUrl,
      width: finalWidth,
      height: finalHeight,
      upscaled: wasUpscaled,
      prompt: result.prompt,
      seed: result.seed,
      model: model,
    })
  } catch (error) {
    console.error('Erreur API image:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de l\'image' },
      { status: 500 }
    )
  }
}

