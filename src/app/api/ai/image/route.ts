/**
 * API Route - Génération d'images avec Nano Banana Pro (Google Gemini 3 Pro Image via fal.ai)
 * 
 * Avantages de Nano Banana Pro :
 * - Meilleure compréhension du langage naturel (français inclus)
 * - Résolution native 2K
 * - Meilleure interprétation des descriptions complexes
 * 
 * Note : L'upscale pour impression se fait à la PUBLICATION, pas ici.
 * Ça évite les timeouts et accélère la génération créative.
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateImageFlux, adaptChildPrompt, isFalAvailable } from '@/lib/ai/fal'

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
      model = 'nano-banana', // Modèle par défaut: Nano Banana Pro
    } = body
    
    // Format par défaut : 3:4 portrait (pour impression livre)
    const finalAspectRatio = aspectRatio || '3:4'

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

    const finalImageUrl = result.images[0]?.url
    const finalWidth = result.images[0]?.width
    const finalHeight = result.images[0]?.height

    // ⚠️ L'upscale se fait à la PUBLICATION, pas ici
    // Ça évite les timeouts et accélère la génération
    console.log(`✅ Image générée: ${finalWidth}x${finalHeight} - ${finalImageUrl?.substring(0, 80)}...`)

    return NextResponse.json({
      status: 'completed',
      imageUrl: finalImageUrl,
      width: finalWidth,
      height: finalHeight,
      prompt: result.prompt,
      seed: result.seed,
      model: model,
    })
  } catch (error: unknown) {
    console.error('Erreur API image:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la génération de l\'image'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

