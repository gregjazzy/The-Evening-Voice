/**
 * API Route proxy pour upload vidéo vers R2
 * Le fichier transite par le serveur Next.js → pas de CORS
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { uploadToR2, isR2Configured } from '@/lib/r2/client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  console.log('📤 POST /api/upload/r2-proxy - Upload vidéo via proxy')

  try {
    if (!isR2Configured()) {
      return NextResponse.json({ error: 'R2 non configuré' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string
    const profileId = formData.get('profileId') as string
    const storyId = formData.get('storyId') as string | null
    const source = (formData.get('source') as string) || 'upload'
    const contentType = (formData.get('contentType') as string) || 'video/mp4'

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'file et userId requis' },
        { status: 400 }
      )
    }

    // Générer un nom unique
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const originalName = file.name || 'video.mp4'
    const ext = originalName.split('.').pop()?.toLowerCase() || 'mp4'
    const uniqueFileName = `${timestamp}-${random}.${ext}`

    console.log(`📤 Upload proxy: ${uniqueFileName} (${(file.size / 1024 / 1024).toFixed(1)} MB)`)

    // Lire le fichier en Buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload vers R2 côté serveur
    const { url: publicUrl, key } = await uploadToR2(buffer, uniqueFileName, contentType, userId)

    console.log('📤 Upload R2 OK:', publicUrl.substring(0, 80))

    // Créer l'entrée dans la table assets
    const assetType = contentType.startsWith('image/') ? 'image' : 'video'
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert({
        profile_id: profileId,
        story_id: storyId || null,
        type: assetType,
        source,
        url: publicUrl,
        file_name: uniqueFileName,
        file_size: file.size,
        mime_type: contentType,
        generation_params: { r2_key: key, status: 'uploaded' },
      })
      .select()
      .single()

    if (assetError) {
      console.error('❌ Erreur création asset:', assetError)
      return NextResponse.json(
        { error: `Erreur création asset: ${assetError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Vidéo uploadée via proxy, assetId:', asset.id)

    return NextResponse.json({
      publicUrl,
      assetId: asset.id,
      fileName: uniqueFileName,
      key,
    })

  } catch (error) {
    console.error('❌ Erreur upload proxy:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
