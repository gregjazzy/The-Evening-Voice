/**
 * API Route - Génération de vidéos avec Kling 2.1 (via fal.ai)
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateVideoKling, generateVideoFromImage, isFalAvailable } from '@/lib/ai/fal'

// Prompts d'ambiance pour les vidéos
const ambiancePrompts: Record<string, string> = {
  jour: 'gentle sunlight rays, soft clouds moving, peaceful daytime scene',
  nuit: 'twinkling stars, soft moonlight glow, peaceful night atmosphere',
  orage: 'dramatic lightning flashes, rain drops, stormy clouds',
  brume: 'slowly drifting mist, mysterious fog, soft movement',
  feerique: 'magical sparkles floating, fairy dust, enchanted glow',
  mystere: 'mysterious shadows moving, dramatic atmosphere',
  foret: 'leaves gently swaying, sunlight through trees, forest ambiance',
  ocean: 'gentle waves, water reflection, peaceful ocean movement',
}

// POST - Générer une vidéo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      imageUrl, 
      prompt,
      ambiance = 'jour',
      duration = '5',
    } = body

    if (!isFalAvailable()) {
      return NextResponse.json(
        { error: 'Clé API fal.ai non configurée' },
        { status: 500 }
      )
    }

    // Construire le prompt
    const videoPrompt = prompt || ambiancePrompts[ambiance] || 'gentle magical movement'

    console.log('🎬 Génération vidéo Kling 2.1:', videoPrompt.substring(0, 100) + '...')

    let result

    if (imageUrl) {
      // Image-to-video
      result = await generateVideoFromImage(imageUrl, videoPrompt, duration as '5' | '10')
    } else {
      // Text-to-video
      result = await generateVideoKling({
        prompt: videoPrompt,
        duration: duration as '5' | '10',
      })
    }

    return NextResponse.json({
      status: 'completed',
      videoUrl: result.videoUrl,
      duration: result.duration,
      service: 'kling',
    })
  } catch (error) {
    console.error('Erreur API video:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération vidéo' },
      { status: 500 }
    )
  }
}

