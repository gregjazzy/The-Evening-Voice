/**
 * API Route: Create Stripe Checkout session for book order
 * POST /api/stripe/checkout/book
 *
 * Prix calculé côté serveur à partir du vrai coût Gelato.
 * Le client ne peut PAS influencer le prix.
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { calculateBookPrice } from '@/lib/stripe-config'

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
    const {
      storyTitle,
      format,
      coverType,
      paperType,
      lamination,
      pageCount,
      pdfUrl,
      pdfFilePath,
      shippingAddress,
      gelatoQuote,
    } = body

    if (!storyTitle || !format || !coverType || !gelatoQuote) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Prix calculé côté serveur : basé sur le coût Gelato réel + formule de marge
    const gelatoCost = gelatoQuote.productPrice + gelatoQuote.shippingPrice
    const type = coverType === 'hardcover' ? 'hardcover' : 'softcover'
    const amountInCents = calculateBookPrice(type, gelatoCost)

    console.log(`📖 Book pricing: Gelato=${gelatoCost.toFixed(2)}€ → Selling=${(amountInCents/100).toFixed(2)}€ (${type})`)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email || shippingAddress?.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Livre : ${storyTitle}`,
              description: `${format} • ${coverType} • ${pageCount} pages`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        order_type: 'book',
        profile_id: profile.id,
        story_title: storyTitle,
        format,
        cover_type: coverType,
        paper_type: paperType,
        lamination,
        page_count: String(pageCount),
        pdf_url: pdfUrl || '',
        pdf_file_path: pdfFilePath || '',
        shipping_address: JSON.stringify(shippingAddress),
        gelato_quote: JSON.stringify(gelatoQuote),
        gelato_cost: String(gelatoCost),
        selling_price: String(amountInCents),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}?checkout=cancelled`,
    })

    return NextResponse.json({ url: session.url, price: amountInCents })
  } catch (error) {
    console.error('Erreur Stripe checkout book:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur création session Stripe' },
      { status: 500 }
    )
  }
}
