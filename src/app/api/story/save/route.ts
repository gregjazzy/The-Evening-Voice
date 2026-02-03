/**
 * API Route - Sauvegarde rapide d'histoire
 * Utilisé par sendBeacon pour sauvegarder avant fermeture de page
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client Supabase avec service role pour bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { story, profileId, userName } = body

    if (!story || !profileId) {
      return NextResponse.json(
        { error: 'story et profileId requis' },
        { status: 400 }
      )
    }

    console.log('🚨 Sauvegarde d\'urgence via beacon:', story.title)

    // Sauvegarder l'histoire
    const storyData = {
      id: story.id,
      profile_id: profileId,
      title: story.title,
      author: userName || 'Anonyme',
      status: story.isComplete ? 'completed' : 'in_progress',
      total_pages: story.pages?.length || 0,
      current_page: (story.currentStep || 0) + 1,
      metadata: {
        structure: story.structure,
        bookFormat: story.bookFormat || 'portrait-a5',
        chapters: story.chapters || [],
      },
      updated_at: new Date().toISOString(),
    }

    const { error: storyError } = await supabaseAdmin
      .from('stories')
      .upsert(storyData)

    if (storyError) {
      console.error('❌ Erreur sauvegarde story:', storyError)
      return NextResponse.json({ error: storyError.message }, { status: 500 })
    }

    // Upsert les pages (safe : pas de fenêtre sans données)
    if (story.pages && story.pages.length > 0) {
      const pagesData = story.pages.map((page: any, i: number) => ({
        id: page.id,
        story_id: story.id,
        page_number: i + 1,
        title: page.title,
        text_blocks: [{ content: page.content || '', style: page.style || null }],
        media_layers: {
          images: page.images || [],
          decorations: page.decorations || [],
          textBoxes: page.textBoxes || [],
          chapterId: page.chapterId,
          pageType: page.pageType || 'content',
          backgroundMedia: page.backgroundMedia || null,
        },
        background_image_url: page.backgroundMedia?.type === 'image' ? page.backgroundMedia.url : null,
        background_video_url: page.backgroundMedia?.type === 'video' ? page.backgroundMedia.url : null,
      }))

      const { error: upsertError } = await supabaseAdmin
        .from('story_pages')
        .upsert(pagesData, { onConflict: 'id' })

      if (upsertError) {
        console.error('❌ Erreur upsert pages:', upsertError)
        return NextResponse.json({ error: upsertError.message }, { status: 500 })
      }

      // Supprimer les pages supprimées (qui ne sont plus dans l'histoire)
      const currentPageIds = story.pages.map((p: any) => p.id).filter(Boolean)
      if (currentPageIds.length > 0) {
        await supabaseAdmin
          .from('story_pages')
          .delete()
          .eq('story_id', story.id)
          .not('id', 'in', `(${currentPageIds.join(',')})`)
      }
    }

    console.log('✅ Sauvegarde d\'urgence terminée:', story.title)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erreur API save story:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
