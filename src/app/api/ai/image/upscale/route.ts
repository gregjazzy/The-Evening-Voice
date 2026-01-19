/**
 * API Route - Upscaling d'images pour qualité impression
 * Utilise Real-ESRGAN via fal.ai (x2)
 */

import { NextRequest, NextResponse } from 'next/server'
import { upscaleImageForPrint, isFalAvailable } from '@/lib/ai/fal'

// Résolution minimale pour impression A5 à 300 DPI
const MIN_PRINT_WIDTH = 1748
const MIN_PRINT_HEIGHT = 2480

// POST - Upscaler une image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageUrl } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL d\'image requise' },
        { status: 400 }
      )
    }

    if (!isFalAvailable()) {
      return NextResponse.json(
        { error: 'Clé API fal.ai non configurée' },
        { status: 500 }
      )
    }

    console.log('🔍 Upscaling image importée pour qualité impression...')

    // Upscaler l'image (x2)
    const result = await upscaleImageForPrint({
      imageUrl,
      scale: 2,
    })

    console.log(`✅ Image upscalée: ${result.width}x${result.height}`)

    return NextResponse.json({
      status: 'completed',
      imageUrl: result.imageUrl,
      width: result.width,
      height: result.height,
    })
  } catch (error) {
    console.error('Erreur API upscale:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'upscaling de l\'image' },
      { status: 500 }
    )
  }
}

// GET - Vérifier si une image a besoin d'être upscalée
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const width = parseInt(searchParams.get('width') || '0')
  const height = parseInt(searchParams.get('height') || '0')

  const needsUpscale = width < MIN_PRINT_WIDTH || height < MIN_PRINT_HEIGHT

  return NextResponse.json({
    needsUpscale,
    currentSize: { width, height },
    minRequiredSize: { width: MIN_PRINT_WIDTH, height: MIN_PRINT_HEIGHT },
    message: needsUpscale 
      ? `Image trop petite pour impression (${width}x${height}). Minimum requis: ${MIN_PRINT_WIDTH}x${MIN_PRINT_HEIGHT}`
      : 'Image de qualité suffisante pour impression'
  })
}
