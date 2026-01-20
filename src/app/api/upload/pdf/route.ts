/**
 * API Route: Upload PDF vers Supabase Storage
 * POST /api/upload/pdf
 * 
 * Cette API permet d'uploader un PDF généré vers Supabase Storage
 * pour qu'il soit accessible publiquement par Gelato lors de l'impression.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client Supabase avec service role pour l'upload
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    // Vérifier la configuration
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    // Créer le client avec service role (pour bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Parser le FormData
    const formData = await request.formData()
    const file = formData.get('file') as Blob | null
    const userId = formData.get('userId') as string | null
    const storyId = formData.get('storyId') as string | null
    const storyTitle = formData.get('storyTitle') as string | null

    // Validation
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID required' },
        { status: 400 }
      )
    }

    // Vérifier le type MIME
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      )
    }

    // Vérifier la taille (max 50MB)
    const MAX_SIZE = 50 * 1024 * 1024 // 50MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large (max 50MB)' },
        { status: 400 }
      )
    }

    // Convertir le Blob en Buffer pour l'upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Générer le chemin du fichier
    // Format: {userId}/{storyId}.pdf
    const timestamp = Date.now()
    const sanitizedTitle = storyTitle 
      ? storyTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50)
      : 'livre'
    const fileName = `${sanitizedTitle}-${timestamp}.pdf`
    const filePath = `${userId}/${fileName}`

    console.log(`📄 Uploading PDF: ${filePath} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true, // Remplacer si existe déjà
      })

    if (uploadError) {
      console.error('PDF upload error:', uploadError)
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('pdfs')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    console.log(`✅ PDF uploaded successfully: ${publicUrl}`)

    return NextResponse.json({
      success: true,
      pdfUrl: publicUrl,
      filePath,
      fileSize: file.size,
      fileName,
    })

  } catch (error) {
    console.error('PDF upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/upload/pdf?filePath=xxx
 * Supprimer un PDF
 */
export async function DELETE(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('filePath')

    if (!filePath) {
      return NextResponse.json(
        { error: 'filePath required' },
        { status: 400 }
      )
    }

    const { error } = await supabase.storage
      .from('pdfs')
      .remove([filePath])

    if (error) {
      return NextResponse.json(
        { error: `Delete failed: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('PDF delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
