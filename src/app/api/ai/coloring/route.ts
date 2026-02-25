/**
 * API Route: Convert story illustrations to coloring book pages
 * POST /api/ai/coloring
 *
 * Takes illustration URLs, converts each to black & white line art
 * via Gemini, assembles into a PDF, uploads to Supabase Storage.
 * Costs 1 AI credit.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { PDFDocument } from 'pdf-lib'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const GEMINI_MODEL = 'gemini-3-pro-image-preview'

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Get profile
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('id, credit_balance')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    }

    const body = await request.json()
    const { imageUrls, storyTitle } = body as {
      imageUrls: string[]
      storyTitle?: string
    }

    if (!imageUrls?.length) {
      return NextResponse.json({ error: 'Aucune illustration fournie' }, { status: 400 })
    }

    // Check credits (costs 1)
    if ((profile.credit_balance || 0) < 1) {
      return NextResponse.json({ error: 'Crédits insuffisants' }, { status: 402 })
    }

    // Deduct 1 credit
    const { data: creditResult } = await supabaseAdmin.rpc('deduct_credits', {
      p_profile_id: profile.id,
      p_amount: 1,
    })

    const deductionSuccess = Array.isArray(creditResult) ? creditResult[0]?.success : creditResult?.success
    if (!deductionSuccess) {
      return NextResponse.json({ error: 'Échec déduction crédit' }, { status: 402 })
    }

    const newBalance = Array.isArray(creditResult) ? creditResult[0]?.new_balance : creditResult?.new_balance

    console.log(`🎨 Coloring book: ${imageUrls.length} illustrations, profile ${profile.id}`)

    // Convert each illustration to line art
    const coloringPages: Buffer[] = []

    for (let i = 0; i < imageUrls.length; i++) {
      console.log(`  Converting ${i + 1}/${imageUrls.length}...`)

      try {
        const lineArt = await convertToLineArt(imageUrls[i])
        if (lineArt) {
          coloringPages.push(lineArt)
        }
      } catch (err) {
        console.warn(`  Failed to convert image ${i + 1}:`, err)
        // Continue with remaining images
      }
    }

    if (coloringPages.length === 0) {
      // Refund credit if all conversions failed
      await supabaseAdmin.rpc('add_credits', {
        p_profile_id: profile.id,
        p_amount: 1,
        p_reason: 'refund',
        p_reference_id: 'coloring-failed',
      })
      return NextResponse.json({ error: 'Aucune page de coloriage générée' }, { status: 500 })
    }

    // Assemble into PDF
    const pdfBytes = await assemblePdf(coloringPages)

    // Upload to Supabase Storage
    const timestamp = Date.now()
    const sanitizedTitle = storyTitle
      ? storyTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50)
      : 'coloriage'
    const filePath = `${user.id}/coloriage-${sanitizedTitle}-${timestamp}.pdf`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('pdfs')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('Coloring PDF upload error:', uploadError)
      return NextResponse.json({ error: 'Échec upload PDF' }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('pdfs')
      .getPublicUrl(filePath)

    console.log(`✅ Coloring book PDF: ${coloringPages.length} pages, ${filePath}`)

    return NextResponse.json({
      success: true,
      pdfUrl: urlData.publicUrl,
      filePath,
      pageCount: coloringPages.length,
      newBalance,
    })

  } catch (error) {
    console.error('Coloring book error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur génération coloriage' },
      { status: 500 }
    )
  }
}

/**
 * Convert a single illustration to black & white line art using Gemini
 */
async function convertToLineArt(imageUrl: string): Promise<Buffer | null> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY not configured')

  // Fetch the image and convert to base64
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`)

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
  const base64Image = imageBuffer.toString('base64')
  const mimeType = imageResponse.headers.get('content-type') || 'image/png'

  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  const body = {
    contents: [{
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Image,
          },
        },
        {
          text: `Convert this illustration into a clean black and white coloring page for children.
Rules:
- Only black outlines on a pure white background
- Clean, smooth, thick lines suitable for children to color
- Preserve all the main shapes, characters, and objects from the original
- Remove all colors, shading, gradients, and textures
- Keep the composition and layout identical to the original
- Make lines thick enough for small children to color within (minimum 2px)
- No gray tones, no half-tones — only pure black (#000000) lines on white (#FFFFFF)
- Output should look like a professional coloring book page`,
        },
      ],
    }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
      imageConfig: {
        aspectRatio: '1:1',
        imageSize: '2K',
      },
    },
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const candidate = data.candidates?.[0]
    if (!candidate?.content?.parts) return null

    const imagePart = candidate.content.parts.find(
      (part: { inlineData?: { data: string } }) => part.inlineData?.data
    )

    if (!imagePart?.inlineData?.data) return null

    return Buffer.from(imagePart.inlineData.data, 'base64')
  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
}

/**
 * Assemble PNG images into a PDF (one image per page, A4 format)
 */
async function assemblePdf(pages: Buffer[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()

  for (const pageData of pages) {
    const image = await pdfDoc.embedPng(pageData).catch(async () => {
      // If PNG embedding fails, try JPEG
      return pdfDoc.embedJpg(pageData)
    })

    // A4 page size in points (210mm × 297mm)
    const pageWidth = 595.28
    const pageHeight = 841.89

    const page = pdfDoc.addPage([pageWidth, pageHeight])

    // Scale image to fit page with margins (20pt each side)
    const margin = 40
    const maxWidth = pageWidth - margin * 2
    const maxHeight = pageHeight - margin * 2

    const scale = Math.min(maxWidth / image.width, maxHeight / image.height)
    const scaledWidth = image.width * scale
    const scaledHeight = image.height * scale

    // Center on page
    const x = (pageWidth - scaledWidth) / 2
    const y = (pageHeight - scaledHeight) / 2

    page.drawImage(image, {
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    })
  }

  return pdfDoc.save()
}
