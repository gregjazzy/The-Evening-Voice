/**
 * API Route - Génération d'images avec Flux 1 Pro (via fal.ai)
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateImageFlux, adaptChildPrompt, isFalAvailable } from '@/lib/ai/fal'

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

    return NextResponse.json({
      status: 'completed',
      imageUrl: result.images[0]?.url,
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

