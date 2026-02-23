/**
 * API Route - Sauvegarde de projet montage côté serveur
 * Utilise le service role key → bypass RLS, pas de timeout
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
    const { project, profileId } = body

    if (!project || !profileId) {
      return NextResponse.json(
        { error: 'project et profileId requis' },
        { status: 400 }
      )
    }

    const projectData = {
      id: project.id,
      profile_id: profileId,
      story_id: project.storyId || null,
      title: project.title,
      scenes: project.scenes,
      is_complete: project.isComplete || false,
      created_at: project.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabaseAdmin
      .from('montage_projects')
      .upsert(projectData)

    if (error) {
      console.error('❌ Erreur sauvegarde montage:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ Montage "${project.title}" sauvegardé (${project.scenes?.length || 0} scènes)`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erreur API save montage:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
