/**
 * API Route - Création/mise à jour du profil avec service role
 * Utilisé à l'inscription pour garantir le bon nom dans le profil,
 * même si un trigger Supabase a créé le profil avec un nom incorrect.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, name, role } = await request.json()

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'missing_fields' },
        { status: 400 }
      )
    }

    // Vérifier si le profil existe déjà
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (existing && existing.length > 0) {
      // Update le profil existant
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ name, role })
        .eq('user_id', userId)

      if (error) {
        console.error('Erreur update profil:', error)
        return NextResponse.json({ error: 'update_failed' }, { status: 500 })
      }
    } else {
      // Créer le profil
      const { error } = await supabaseAdmin
        .from('profiles')
        .insert({ user_id: userId, name, role })

      if (error) {
        console.error('Erreur insert profil:', error)
        return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur update-profile:', error)
    return NextResponse.json(
      { error: 'server_error' },
      { status: 500 }
    )
  }
}
