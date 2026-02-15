/**
 * API Route - Extract a video frame via FFmpeg (server-side)
 * FFmpeg decodes at full quality (no GPU post-processing loss like Safari canvas)
 * and applies a professional unsharp mask filter.
 *
 * Input JSON: { videoUrl, timestamp, userId, profileId?, mode: 'upload' | 'dataurl' }
 * Output JSON: { publicUrl } (upload mode) or { dataUrl } (dataurl mode)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'child_process'
import { readFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

// Path to ffmpeg binary from ffmpeg-static
let ffmpegPath: string
try {
  ffmpegPath = require('ffmpeg-static')
} catch {
  ffmpegPath = 'ffmpeg' // fallback to system ffmpeg
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Whitelist of allowed video URL domains
const ALLOWED_DOMAINS = [
  '.r2.dev',
  '.supabase.co',
  '.supabase.in',
  'pub-', // Cloudflare R2 public buckets
]

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    return ALLOWED_DOMAINS.some((domain) => parsed.hostname.includes(domain))
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const tmpFile = join(tmpdir(), `frame-${randomUUID()}.png`)

  try {
    const body = await request.json()
    const { videoUrl, timestamp, userId, profileId, mode } = body as {
      videoUrl: string
      timestamp: number
      userId: string
      profileId?: string
      mode: 'upload' | 'dataurl'
    }

    // Validation
    if (!videoUrl || timestamp == null || !userId || !mode) {
      return NextResponse.json(
        { error: 'videoUrl, timestamp, userId, and mode are required' },
        { status: 400 }
      )
    }

    if (!isAllowedUrl(videoUrl)) {
      return NextResponse.json(
        { error: 'Video URL domain not allowed' },
        { status: 403 }
      )
    }

    if (mode !== 'upload' && mode !== 'dataurl') {
      return NextResponse.json(
        { error: 'mode must be "upload" or "dataurl"' },
        { status: 400 }
      )
    }

    // FFmpeg: extract single frame with unsharp mask
    // -ss before -i = fast seeking (no need to download entire video)
    // -vframes 1 = single frame
    // unsharp=5:5:0.8:5:5:0.4 = professional sharpening (luma + chroma)
    const args = [
      '-ss', String(timestamp),
      '-i', videoUrl,
      '-vframes', '1',
      '-filter:v', 'unsharp=5:5:0.8:5:5:0.4',
      '-y',
      '-f', 'image2',
      tmpFile,
    ]

    console.log('🎬 FFmpeg extracting frame at', timestamp, 's from', videoUrl.substring(0, 80) + '...')

    execFileSync(ffmpegPath, args, {
      timeout: 25_000,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    if (!existsSync(tmpFile)) {
      throw new Error('FFmpeg did not produce output file')
    }

    const pngBuffer = readFileSync(tmpFile)
    console.log('✅ FFmpeg frame extracted:', Math.round(pngBuffer.length / 1024), 'KB')

    if (mode === 'dataurl') {
      const base64 = pngBuffer.toString('base64')
      return NextResponse.json({
        dataUrl: `data:image/png;base64,${base64}`,
      })
    }

    // mode === 'upload': upload to Supabase Storage
    const ts = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const fileName = `${ts}-${random}.png`
    const filePath = `${userId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, pngBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath)
    const publicUrl = urlData.publicUrl

    // Create asset entry
    const { error: assetError } = await supabase
      .from('assets')
      .insert({
        profile_id: profileId || null,
        type: 'image',
        source: 'video-capture-ffmpeg',
        url: publicUrl,
        file_name: fileName,
        file_size: pngBuffer.length,
        mime_type: 'image/png',
      })

    if (assetError) {
      console.warn('⚠️ Asset insert warning:', assetError.message)
    }

    console.log('✅ Frame uploaded to Supabase:', publicUrl)
    return NextResponse.json({ publicUrl, fileName })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('❌ FFmpeg frame extraction error:', message)
    return NextResponse.json(
      { error: `Frame extraction failed: ${message}` },
      { status: 500 }
    )
  } finally {
    // Cleanup temp file
    try {
      if (existsSync(tmpFile)) unlinkSync(tmpFile)
    } catch { /* ignore cleanup errors */ }
  }
}
