/**
 * API Route - Recherche d'email par nom de profil
 * Permet le login par prénom + nom au lieu de l'email
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client Supabase avec service role pour accéder à auth.users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'name_required' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()

    // Chercher le profil par nom (case-insensitive)
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, name')
      .ilike('name', trimmedName)

    if (profileError) {
      console.error('Erreur recherche profil:', profileError)
      return NextResponse.json(
        { error: 'lookup_failed' },
        { status: 500 }
      )
    }

    // Si pas trouvé, essayer des variantes (le trigger peut stocker "titi.toto" au lieu de "Titi Toto")
    let matchedProfiles = profiles || []
    if (matchedProfiles.length === 0) {
      // Générer les variantes : "Titi Toto" → "titi.toto", "titi-toto", "titi_toto"
      const lower = trimmedName.toLowerCase()
      const variants = [
        lower.replace(/\s+/g, '.'),
        lower.replace(/\s+/g, '-'),
        lower.replace(/\s+/g, '_'),
        lower,
      ]
      for (const variant of variants) {
        const { data: altProfiles } = await supabaseAdmin
          .from('profiles')
          .select('user_id, name')
          .ilike('name', variant)
        if (altProfiles && altProfiles.length > 0) {
          matchedProfiles = altProfiles
          // Fix: mettre à jour le nom avec le bon format "Prénom Nom"
          if (altProfiles.length === 1) {
            await supabaseAdmin
              .from('profiles')
              .update({ name: trimmedName })
              .eq('user_id', altProfiles[0].user_id)
          }
          break
        }
      }
    }

    if (matchedProfiles.length === 0) {
      return NextResponse.json(
        { error: 'not_found' },
        { status: 404 }
      )
    }

    if (matchedProfiles.length > 1) {
      return NextResponse.json(
        { error: 'multiple_matches' },
        { status: 409 }
      )
    }

    const profile = matchedProfiles[0]

    // Récupérer l'email depuis auth.users via l'API admin
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      profile.user_id
    )

    if (userError || !userData?.user?.email) {
      console.error('Erreur récupération user:', userError)
      return NextResponse.json(
        { error: 'lookup_failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({ email: userData.user.email })
  } catch (error) {
    console.error('Erreur lookup:', error)
    return NextResponse.json(
      { error: 'lookup_failed' },
      { status: 500 }
    )
  }
}
