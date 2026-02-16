/**
 * API Route - Suppression d'histoire côté serveur
 * Utilise le service role key → bypass RLS (comme /api/story/save)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { storyId, profileId } = body

    if (!storyId || !profileId) {
      return NextResponse.json(
        { error: 'storyId et profileId requis' },
        { status: 400 }
      )
    }

    console.log(`🗑️ Suppression story ${storyId} pour profile ${profileId}`)

    // Supprimer les pages d'abord (foreign key)
    const { error: pagesError } = await supabaseAdmin
      .from('story_pages')
      .delete()
      .eq('story_id', storyId)

    if (pagesError) {
      console.error('❌ Erreur suppression pages:', pagesError)
      return NextResponse.json({ error: pagesError.message }, { status: 500 })
    }

    // Supprimer l'histoire
    const { error: storyError } = await supabaseAdmin
      .from('stories')
      .delete()
      .eq('id', storyId)
      .eq('profile_id', profileId)

    if (storyError) {
      console.error('❌ Erreur suppression story:', storyError)
      return NextResponse.json({ error: storyError.message }, { status: 500 })
    }

    console.log(`✅ Story ${storyId} supprimée`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erreur API delete story:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
