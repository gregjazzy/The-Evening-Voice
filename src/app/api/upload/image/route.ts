/**
 * API Route - Upload image côté serveur vers Supabase Storage
 * Utilise le service role key → pas de problème de token
 * Utilisé par la capture de frame vidéo
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string
    const profileId = formData.get('profileId') as string | null
    const source = (formData.get('source') as string) || 'upload'

    if (!file || !userId) {
      return NextResponse.json({ error: 'file et userId requis' }, { status: 400 })
    }

    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const ext = file.name?.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${timestamp}-${random}.${ext}`
    const filePath = `${userId}/${fileName}`
    const contentType = file.type || 'image/jpeg'

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath)
    const publicUrl = urlData.publicUrl

    // Créer l'entrée dans la table assets
    const { error: assetError } = await supabase
      .from('assets')
      .insert({
        profile_id: profileId || null,
        type: 'image',
        source,
        url: publicUrl,
        file_name: fileName,
        file_size: buffer.length,
        mime_type: contentType,
      })

    if (assetError) {
      console.warn('⚠️ Asset insert warning:', assetError.message)
      // On continue quand même — l'image est uploadée
    }

    return NextResponse.json({ publicUrl, fileName })
  } catch (error) {
    console.error('❌ Image upload error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
