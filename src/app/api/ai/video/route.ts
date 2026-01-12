/**
 * API Route - Génération de vidéos (Runway/Luma)
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  generateBackgroundVideo,
  checkRunwayStatus,
  checkLumaStatus 
} from '@/lib/ai/video'

// POST - Lancer une génération vidéo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      imageUrl, 
      ambiance = 'jour',
    } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL de l\'image requise' },
        { status: 400 }
      )
    }

    // Note: Cette fonction est synchrone et attend la fin
    // Pour une meilleure UX, on devrait utiliser un système de jobs
    const result = await generateBackgroundVideo(imageUrl, ambiance)

    return NextResponse.json({
      videoUrl: result.videoUrl,
      service: result.service,
    })
  } catch (error) {
    console.error('Erreur API video:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération vidéo' },
      { status: 500 }
    )
  }
}

// GET - Vérifier le statut d'une génération
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const service = searchParams.get('service') as 'runway' | 'luma'

    if (!jobId || !service) {
      return NextResponse.json(
        { error: 'jobId et service requis' },
        { status: 400 }
      )
    }

    const checkStatus = service === 'runway' ? checkRunwayStatus : checkLumaStatus
    const status = await checkStatus(jobId)

    return NextResponse.json(status)
  } catch (error) {
    console.error('Erreur vérification statut:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut' },
      { status: 500 }
    )
  }
}

