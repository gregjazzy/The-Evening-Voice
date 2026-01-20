/**
 * API Route: Upscale d'image pour impression
 * POST /api/ai/upscale
 * 
 * Utilise Real-ESRGAN via fal.ai pour améliorer la résolution des images
 * avant l'impression du livre via Gelato.
 * 
 * Coût: ~$0.01 par image
 */

import { NextResponse } from 'next/server'
import { upscaleImageForPrint } from '@/lib/ai/fal'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { imageUrl, scale = 2 } = body

    // Validation
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      )
    }

    // Valider le scale (2 ou 4)
    const validScale = scale === 4 ? 4 : 2

    console.log(`🔍 Upscaling image x${validScale}:`, imageUrl.substring(0, 50) + '...')

    // Upscale via fal.ai Real-ESRGAN
    const result = await upscaleImageForPrint({
      imageUrl,
      scale: validScale as 2 | 4,
    })

    console.log(`✅ Image upscaled: ${result.width}x${result.height}px`)

    return NextResponse.json({
      success: true,
      url: result.imageUrl,
      width: result.width,
      height: result.height,
      scale: validScale,
    })

  } catch (error) {
    console.error('Upscale error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upscale failed' },
      { status: 500 }
    )
  }
}
