/**
 * API Route pour uploader des vidéos vers Cloudflare R2
 * Les vidéos sont trop lourdes pour Supabase → on utilise R2 (bande passante gratuite)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { uploadToR2, deleteFromR2, isR2Configured } from '@/lib/r2/client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Limite de taille : 200 Mo
const MAX_SIZE = 200 * 1024 * 1024

/**
 * POST - Upload une vidéo
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier que R2 est configuré
    if (!isR2Configured()) {
      return NextResponse.json(
        { error: 'R2 non configuré. Voir .env.local' },
        { status: 500 }
      )
    }

    // Récupérer le form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null
    const profileId = formData.get('profileId') as string | null
    const storyId = formData.get('storyId') as string | null
    const source = (formData.get('source') as string) || 'upload'

    if (!file) {
      return NextResponse.json(
        { error: 'Fichier manquant' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId manquant' },
        { status: 400 }
      )
    }

    // Vérifier la taille
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${MAX_SIZE / 1024 / 1024} Mo)` },
        { status: 400 }
      )
    }

    // Vérifier le type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Type de fichier invalide (vidéo attendue)' },
        { status: 400 }
      )
    }

    // Générer un nom unique avec extension valide
    const parts = file.name.split('.')
    const potentialExt = parts.length > 1 ? parts.pop()?.toLowerCase() : null
    const validVideoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv']
    const ext = (potentialExt && validVideoExtensions.includes(potentialExt)) ? potentialExt : 'mp4'
    
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const fileName = `${timestamp}-${random}.${ext}`

    // Convertir en buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload vers R2
    const { url, key } = await uploadToR2(buffer, fileName, file.type, userId)

    // Créer l'entrée dans la table assets
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert({
        profile_id: profileId,
        story_id: storyId || null,
        type: 'video',
        source,
        url,
        file_name: fileName,
        file_size: file.size,
        mime_type: file.type,
        // Stocker la clé R2 dans generation_params pour pouvoir supprimer
        generation_params: { r2_key: key },
      })
      .select()
      .single()

    if (assetError) {
      // Rollback : supprimer de R2
      try {
        await deleteFromR2(key)
      } catch (e) {
        console.error('Erreur rollback R2:', e)
      }
      
      return NextResponse.json(
        { error: `Erreur création asset: ${assetError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url,
      assetId: asset.id,
      fileName,
      fileSize: file.size,
      mimeType: file.type,
    })

  } catch (error) {
    console.error('Erreur upload vidéo:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Supprimer une vidéo
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get('assetId')

    if (!assetId) {
      return NextResponse.json(
        { error: 'assetId manquant' },
        { status: 400 }
      )
    }

    // Récupérer l'asset
    const { data: asset, error: fetchError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single()

    if (fetchError || !asset) {
      return NextResponse.json(
        { error: 'Asset non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer de R2
    const r2Key = asset.generation_params?.r2_key
    if (r2Key) {
      try {
        await deleteFromR2(r2Key)
      } catch (e) {
        console.error('Erreur suppression R2:', e)
        // Continue quand même pour supprimer l'entrée DB
      }
    }

    // Supprimer de la DB
    const { error: deleteError } = await supabase
      .from('assets')
      .delete()
      .eq('id', assetId)

    if (deleteError) {
      return NextResponse.json(
        { error: `Erreur suppression: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur suppression vidéo:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
