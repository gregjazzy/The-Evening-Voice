/**
 * API Route - Génération de vidéos avec Kling 2.5 Turbo Pro (via fal.ai)
 * - Text-to-video : $0.35/5s (pas besoin d'image)
 * - Image-to-video : si imageUrl fournie
 * 
 * Utilise un système de polling pour éviter les timeouts serveur
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateVideoKling, checkVideoJobStatus, isFalAvailable } from '@/lib/ai/fal'

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

// POST - Soumettre un job de génération vidéo
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

    console.log('🎬 Soumission vidéo Kling:', videoPrompt.substring(0, 100) + '...')

    // Soumettre le job (retourne immédiatement avec un jobId)
    const result = await generateVideoKling({
      prompt: videoPrompt,
      imageUrl,
      duration: duration as '5' | '10',
    })

    console.log('📤 Job vidéo soumis:', result.jobId)

    return NextResponse.json({
      status: 'pending',
      jobId: result.jobId,
      hasImage: !!imageUrl,
      service: 'kling',
    })
  } catch (error) {
    console.error('❌ Erreur API video:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération vidéo' },
      { status: 500 }
    )
  }
}

// GET - Vérifier le statut d'un job vidéo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const hasImage = searchParams.get('hasImage') === 'true'

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

    console.log('🔍 Vérification status job vidéo:', jobId)

    const result = await checkVideoJobStatus(jobId, hasImage)

    console.log('📊 Status:', result.status, result.videoUrl ? '✅ URL reçue' : '')

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Erreur vérification status vidéo:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut' },
      { status: 500 }
    )
  }
}
