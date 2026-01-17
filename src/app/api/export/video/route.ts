/**
 * API Route pour exporter un livre-disque en vidéo HD/4K
 * 
 * Utilise Mux pour l'encodage professionnel
 * 
 * POST /api/export/video
 * - Crée une nouvelle vidéo à partir des scènes
 * 
 * GET /api/export/video?assetId=xxx
 * - Vérifie le statut d'une vidéo en cours de création
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  createVideoFromScenes, 
  getVideoStatus, 
  isMuxConfigured,
  type VideoExportInput 
} from '@/lib/mux/client'

/**
 * POST - Créer une vidéo à partir du livre-disque
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier que Mux est configuré
    if (!isMuxConfigured()) {
      return NextResponse.json(
        { 
          error: 'Mux non configuré',
          message: 'Ajoutez MUX_TOKEN_ID et MUX_TOKEN_SECRET dans .env.local'
        },
        { status: 500 }
      )
    }

    // Récupérer les données du livre-disque
    const body = await request.json()
    const { 
      title,
      scenes,
      narrationUrl,
      musicUrl,
      resolution = '1080p'
    } = body as VideoExportInput & { musicUrl?: string }

    // Validation
    if (!title) {
      return NextResponse.json(
        { error: 'Titre manquant' },
        { status: 400 }
      )
    }

    if (!scenes || scenes.length === 0) {
      return NextResponse.json(
        { error: 'Aucune scène fournie' },
        { status: 400 }
      )
    }

    // Vérifier que chaque scène a une URL média
    for (const scene of scenes) {
      if (!scene.mediaUrl) {
        return NextResponse.json(
          { error: 'Une scène n\'a pas d\'URL média' },
          { status: 400 }
        )
      }
    }

    console.log(`🎬 Export vidéo démarré: "${title}" (${scenes.length} scènes, ${resolution})`)

    // Créer la vidéo via Mux
    const result = await createVideoFromScenes({
      title,
      scenes,
      narrationUrl,
      resolution: resolution as '1080p' | '4k',
    })

    console.log(`✅ Asset Mux créé: ${result.assetId}`)

    return NextResponse.json({
      success: true,
      assetId: result.assetId,
      playbackId: result.playbackId,
      status: result.status,
      videoUrl: result.videoUrl,
      mp4Url: result.mp4Url,
      thumbnailUrl: result.thumbnailUrl,
      message: result.status === 'ready' 
        ? 'Vidéo prête !' 
        : 'Vidéo en cours de création...'
    })

  } catch (error) {
    console.error('Erreur export vidéo:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création de la vidéo',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Vérifier le statut d'une vidéo
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get('assetId')

    if (!assetId) {
      return NextResponse.json(
        { error: 'assetId manquant' },
        { status: 400 }
      )
    }

    // Vérifier que Mux est configuré
    if (!isMuxConfigured()) {
      return NextResponse.json(
        { error: 'Mux non configuré' },
        { status: 500 }
      )
    }

    const status = await getVideoStatus(assetId)

    return NextResponse.json({
      assetId,
      ...status,
      message: status.status === 'ready' 
        ? 'Vidéo prête au téléchargement !'
        : status.status === 'errored'
        ? 'Erreur lors de la création'
        : 'Encodage en cours...'
    })

  } catch (error) {
    console.error('Erreur vérification statut:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut' },
      { status: 500 }
    )
  }
}
