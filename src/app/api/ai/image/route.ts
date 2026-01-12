/**
 * API Route - Génération d'images
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  generateImage, 
  checkGenerationStatus, 
  adaptChildPrompt 
} from '@/lib/ai/midjourney'

// POST - Lancer une génération
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      description, 
      style = 'magique', 
      ambiance = 'jour',
      aspectRatio = '16:9'
    } = body

    if (!description) {
      return NextResponse.json(
        { error: 'Description requise' },
        { status: 400 }
      )
    }

    // Adapter le prompt enfantin
    const prompt = adaptChildPrompt(description, style, ambiance)

    // Lancer la génération
    const job = await generateImage({
      prompt,
      aspectRatio,
      style: style === 'dessin' ? 'cute' : 'expressive',
    })

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      prompt, // Retourner le prompt pour transparence
    })
  } catch (error) {
    console.error('Erreur API image:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de l\'image' },
      { status: 500 }
    )
  }
}

// GET - Vérifier le statut
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId requis' },
        { status: 400 }
      )
    }

    const status = await checkGenerationStatus(jobId)
    return NextResponse.json(status)
  } catch (error) {
    console.error('Erreur vérification statut:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut' },
      { status: 500 }
    )
  }
}

