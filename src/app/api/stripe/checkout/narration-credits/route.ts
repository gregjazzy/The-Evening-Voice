/**
 * API Route: Create Stripe Checkout session for narration credit purchase
 * POST /api/stripe/checkout/narration-credits
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe, getNarrationCreditPack } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Get profile
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('id, name')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    }

    const body = await request.json()
    const { packId } = body

    const pack = getNarrationCreditPack(packId)
    if (!pack) {
      return NextResponse.json({ error: 'Pack de crédits narration invalide' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: pack.label,
              description: `${pack.credits} caractères de narration IA`,
            },
            unit_amount: pack.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        order_type: 'narration_credits',
        profile_id: profile.id,
        pack_id: pack.id,
        credits_amount: String(pack.credits),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}?checkout=success&type=narration_credits&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}?checkout=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Erreur Stripe checkout narration credits:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur création session Stripe' },
      { status: 500 }
    )
  }
}
