/**
 * API Route - Sauvegarde/chargement de la progression des défis
 * Utilise le service role pour bypass les RLS policies.
 *
 * GET: charge la progression depuis profiles.challenge_progress
 * POST: sauvegarde la progression dans profiles.challenge_progress
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Ensure the column exists (runs once, idempotent)
let columnChecked = false
async function ensureColumn() {
  if (columnChecked) return
  try {
    // Try to select the column — if it fails, the column doesn't exist
    const { error } = await supabaseAdmin
      .from('profiles')
      .select('challenge_progress')
      .limit(1)

    if (error && error.message.includes('challenge_progress')) {
      // Column doesn't exist — we can't add it via supabase-js
      // Log a warning so the admin knows to add it
      console.warn(
        '⚠️  Column profiles.challenge_progress does not exist.',
        'Run this SQL in the Supabase dashboard:',
        'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS challenge_progress jsonb DEFAULT null;'
      )
    }
  } catch {
    // Ignore
  }
  columnChecked = true
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'missing userId' }, { status: 400 })
    }

    await ensureColumn()

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('challenge_progress')
      .eq('user_id', userId)
      .single()

    if (error) {
      // Column might not exist yet — return empty progress
      return NextResponse.json({ bestScores: {}, totalAttempts: 0 })
    }

    const progress = data?.challenge_progress ?? { bestScores: {}, totalAttempts: 0 }
    return NextResponse.json(progress)
  } catch (error) {
    console.error('Erreur GET challenge-progress:', error)
    return NextResponse.json({ bestScores: {}, totalAttempts: 0 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, bestScores, totalAttempts } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'missing userId' }, { status: 400 })
    }

    await ensureColumn()

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        challenge_progress: { bestScores, totalAttempts },
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Erreur POST challenge-progress:', error)
      return NextResponse.json({ error: 'save_failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur POST challenge-progress:', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
