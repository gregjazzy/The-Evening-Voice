/**
 * API Route - Transfert serveur-à-serveur (fal.ai → stockage permanent)
 * Évite le round-trip navigateur : download + re-upload.
 *
 * Images/Audio → Supabase Storage
 * Vidéos → Cloudflare R2
 *
 * POST { url, userId, profileId, storyId?, source?, type? }
 * → Retourne { publicUrl, assetId }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { uploadToR2, isR2Configured } from '@/lib/r2/client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function generateFileName(type: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = type === 'video' ? 'mp4' : type === 'audio' ? 'webm' : 'png'
  return `${timestamp}-${random}.${ext}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, userId, profileId, storyId, source = 'gemini', type = 'image' } = body

    if (!url || !userId) {
      return NextResponse.json({ error: 'Missing url or userId' }, { status: 400 })
    }

    // 1. Télécharger depuis l'URL (serveur-à-serveur, pas de CORS)
    const response = await fetch(url)
    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch: ${response.status}` }, { status: 502 })
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get('content-type') || (type === 'video' ? 'video/mp4' : 'image/png')
    const fileName = generateFileName(type)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    let publicUrl: string

    if (type === 'video') {
      // 2a. Vidéos → R2
      if (!isR2Configured()) {
        return NextResponse.json({ error: 'R2 non configuré' }, { status: 500 })
      }
      const { url: r2Url } = await uploadToR2(buffer, fileName, contentType, userId)
      publicUrl = r2Url
    } else {
      // 2b. Images/Audio → Supabase Storage
      const bucket = type === 'audio' ? 'audio' : 'images'
      const filePath = `${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, buffer, {
          contentType,
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError)
        return NextResponse.json({ error: 'Storage upload failed' }, { status: 500 })
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
      publicUrl = urlData.publicUrl
    }

    // 3. Créer l'entrée dans la table assets
    const { data: asset, error: insertError } = await supabase
      .from('assets')
      .insert({
        profile_id: profileId || null,
        story_id: storyId || null,
        type,
        source,
        url: publicUrl,
        file_name: fileName,
        file_size: buffer.length,
        mime_type: contentType,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('❌ Asset insert error:', insertError)
      return NextResponse.json({ error: 'Asset creation failed' }, { status: 500 })
    }

    return NextResponse.json({
      publicUrl,
      assetId: asset.id,
      fileSize: buffer.length,
    })
  } catch (error) {
    console.error('❌ from-url error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
