/**
 * API Route - Remboursement de crédits en cas d'échec de génération
 * POST /api/ai/refund
 *
 * Sécurisé : vérifie que l'utilisateur est authentifié et que le profileId
 * lui appartient avant d'accorder un remboursement.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

// Service role pour les opérations de crédit
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Max refund pour éviter les abus
const MAX_REFUND_AMOUNT = 3

export async function POST(request: NextRequest) {
  try {
    // 🔒 Vérifier l'authentification
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { profileId, amount, reason } = await request.json()

    if (!profileId || !amount || !reason) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Vérifier que la raison est un remboursement légitime
    if (!reason.startsWith('refund_')) {
      return NextResponse.json({ error: 'Raison invalide' }, { status: 400 })
    }

    // Limiter le montant du remboursement
    if (amount > MAX_REFUND_AMOUNT || amount < 1) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    }

    // 🔒 Vérifier que le profileId appartient à l'utilisateur authentifié
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('id')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profil non autorisé' }, { status: 403 })
    }

    console.log(`💸 Remboursement ${amount} crédit(s) pour ${profileId} (${reason})`)

    const { data: newBalance, error } = await supabaseAdmin.rpc('add_credits', {
      p_profile_id: profileId,
      p_amount: amount,
      p_reason: reason,
      p_reference_id: null,
    })

    if (error) {
      console.error('Erreur remboursement:', error)
      return NextResponse.json({ error: 'Erreur remboursement' }, { status: 500 })
    }

    console.log(`✅ Remboursement OK. Nouveau solde: ${newBalance}`)

    return NextResponse.json({ success: true, newBalance })
  } catch (error) {
    console.error('❌ Erreur API refund:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
