/**
 * API Route - Sauvegarde générique côté serveur
 * Utilise le service role key → bypass RLS, fiable à 100%
 *
 * Types supportés : diary, chat, studio-progress, profile-context, profile-ainame
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
    const { type, profileId, data } = body

    if (!type || !profileId) {
      return NextResponse.json({ error: 'type et profileId requis' }, { status: 400 })
    }

    switch (type) {
      case 'diary': {
        const { error } = await supabaseAdmin.from('diary_entries').upsert({
          id: data.id,
          profile_id: profileId,
          content: data.content,
          mood: data.mood,
          memory_image_url: data.memoryImage || null,
          audio_url: data.audioUrl || null,
          created_at: data.createdAt,
          updated_at: new Date().toISOString(),
        })
        if (error) {
          console.error('❌ Erreur sauvegarde diary:', error.message)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ success: true })
      }

      case 'chat': {
        const { error } = await supabaseAdmin.from('chat_messages').upsert({
          id: data.id,
          profile_id: profileId,
          role: data.role,
          content: data.content,
          context_type: 'diary',
          created_at: data.createdAt,
        })
        if (error) {
          console.error('❌ Erreur sauvegarde chat:', error.message)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ success: true })
      }

      case 'studio-progress': {
        const { error } = await supabaseAdmin.from('studio_progress').upsert({
          profile_id: profileId,
          image_level: data.imageLevel,
          image_creations_in_level: data.imageCreationsInLevel,
          image_total_creations: data.imageTotalCreations,
          video_level: data.videoLevel,
          video_creations_in_level: data.videoCreationsInLevel,
          video_total_creations: data.videoTotalCreations,
          creations: data.creations,
          badges: data.badges,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'profile_id' })
        if (error) {
          console.error('❌ Erreur sauvegarde studio-progress:', error.message)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ success: true })
      }

      case 'profile-context': {
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ emotional_context: data.context })
          .eq('id', profileId)
        if (error) {
          console.error('❌ Erreur sauvegarde emotional_context:', error.message)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ success: true })
      }

      case 'profile-ainame': {
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ ai_name: data.name })
          .eq('id', profileId)
        if (error) {
          console.error('❌ Erreur sauvegarde ai_name:', error.message)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: `Type inconnu: ${type}` }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ Erreur API sync:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
