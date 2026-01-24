/**
 * API Route pour générer des URLs signées pour upload direct vers R2
 * Évite la limite de taille de Netlify (10 Mo)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPresignedUploadUrl, isR2Configured } from '@/lib/r2/client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * POST - Générer une URL signée pour upload
 */
export async function POST(request: NextRequest) {
  console.log('🔐 POST /api/upload/presign - Demande URL signée')
  
  try {
    // Vérifier que R2 est configuré
    if (!isR2Configured()) {
      console.error('❌ R2 non configuré')
      return NextResponse.json(
        { error: 'R2 non configuré' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { fileName, contentType, userId, profileId, storyId, source = 'upload', fileSize } = body

    if (!fileName || !contentType || !userId) {
      return NextResponse.json(
        { error: 'fileName, contentType et userId requis' },
        { status: 400 }
      )
    }

    // Vérifier le type
    if (!contentType.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Type de fichier invalide (vidéo attendue)' },
        { status: 400 }
      )
    }

    // Générer un nom unique
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const ext = fileName.split('.').pop()?.toLowerCase() || 'mp4'
    const uniqueFileName = `${timestamp}-${random}.${ext}`

    console.log('📝 Génération URL signée pour:', uniqueFileName)

    // Générer l'URL signée
    const { uploadUrl, key, publicUrl } = await getPresignedUploadUrl(
      uniqueFileName,
      contentType,
      userId
    )

    // Créer l'entrée dans la table assets (en attente de confirmation)
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert({
        profile_id: profileId,
        story_id: storyId || null,
        type: 'video',
        source,
        url: publicUrl,
        file_name: uniqueFileName,
        file_size: fileSize || 0,
        mime_type: contentType,
        generation_params: { r2_key: key, status: 'uploading' },
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

    console.log('✅ URL signée générée, assetId:', asset.id)

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      assetId: asset.id,
      key,
      fileName: uniqueFileName,
    })

  } catch (error) {
    console.error('❌ Erreur génération URL signée:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
