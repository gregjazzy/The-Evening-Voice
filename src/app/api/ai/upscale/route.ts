/**
 * API Route: Upscale d'image pour impression
 * POST /api/ai/upscale
 * 
 * Utilise Real-ESRGAN via fal.ai pour améliorer la résolution des images
 * avant l'impression du livre via Gelato.
 * 
 * Accepte soit une URL, soit une image en base64
 * 
 * Coût: ~$0.01 par image
 */

import { NextResponse } from 'next/server'
import { upscaleImageForPrint } from '@/lib/ai/fal'
import { createClient } from '@supabase/supabase-js'

// Créer un client Supabase pour upload temporaire
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { imageUrl, imageBase64, scale = 2 } = body

    // Validation
    if (!imageUrl && !imageBase64) {
      return NextResponse.json(
        { error: 'imageUrl or imageBase64 is required' },
        { status: 400 }
      )
    }

    // Valider le scale (2 ou 4)
    const validScale = scale === 4 ? 4 : 2

    let urlToUpscale = imageUrl

    // Si on a du base64, l'uploader temporairement sur Supabase
    if (imageBase64 && !imageUrl) {
      console.log('📤 Uploading base64 image to Supabase for upscaling...')
      
      // Convertir base64 en buffer
      const buffer = Buffer.from(imageBase64, 'base64')
      
      // Nom de fichier temporaire unique
      const tempFileName = `temp-upscale/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
      
      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assets')
        .upload(tempFileName, buffer, {
          contentType: 'image/jpeg',
          upsert: true,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload image for upscaling' },
          { status: 500 }
        )
      }

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('assets')
        .getPublicUrl(tempFileName)

      urlToUpscale = urlData.publicUrl
      console.log('📤 Uploaded to:', urlToUpscale)
    }

    console.log(`🔍 Upscaling image x${validScale}:`, urlToUpscale.substring(0, 50) + '...')

    // Upscale via fal.ai Real-ESRGAN
    const result = await upscaleImageForPrint({
      imageUrl: urlToUpscale,
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
