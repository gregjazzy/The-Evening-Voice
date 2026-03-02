/**
 * API Route: Create Stripe Checkout session for cart order (multi-items)
 * POST /api/stripe/checkout/cart
 *
 * Stores full cart data in Supabase (avoids Stripe's 500-char metadata limit),
 * then creates a Stripe session referencing the pending order ID.
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { calculateBookPrice, DERIVATIVE_PRICES, type DerivativeType } from '@/lib/stripe-config'

export const dynamic = 'force-dynamic'

// Service role client for inserting pending orders
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Auth check
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
    const { cartItems, shippingAddress, shippingCostCents, digitalOnly } = body

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'Panier vide' }, { status: 400 })
    }

    // Digital-only carts only need an email, not a full address
    if (!digitalOnly && !shippingAddress) {
      return NextResponse.json({ error: 'Adresse de livraison requise' }, { status: 400 })
    }

    // Build Stripe line items + calculate total server-side
    const lineItems: Array<{
      price_data: {
        currency: string
        product_data: { name: string; description?: string }
        unit_amount: number
      }
      quantity: number
    }> = []

    let totalCents = 0

    for (const item of cartItems) {
      let amountCents: number

      if (item.type === 'book' && item.bookData?.gelatoQuote) {
        // Book: recalculate price server-side from Gelato quote
        const gelatoCost = item.bookData.gelatoQuote.productPrice + item.bookData.gelatoQuote.shippingPrice
        const coverType = item.bookData.coverType === 'hardcover' ? 'hardcover' : 'softcover'
        amountCents = calculateBookPrice(coverType, gelatoCost)
      } else if (item.type in DERIVATIVE_PRICES) {
        // Derivative: use fixed price from config
        amountCents = DERIVATIVE_PRICES[item.type as DerivativeType]
      } else {
        return NextResponse.json({ error: `Type de produit invalide: ${item.type}` }, { status: 400 })
      }

      const qty = item.quantity || 1
      totalCents += amountCents * qty

      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.label || item.type,
            description: item.type === 'book'
              ? `${item.bookData?.format} • ${item.bookData?.coverType} • ${item.bookData?.pageCount} pages`
              : undefined,
          },
          unit_amount: amountCents,
        },
        quantity: qty,
      })
    }

    // Add shipping if applicable
    if (shippingCostCents > 0) {
      totalCents += shippingCostCents
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Livraison',
            description: 'Frais de livraison',
          },
          unit_amount: shippingCostCents,
        },
        quantity: 1,
      })
    }

    // 1. Create pending order in Supabase with full cart data
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        profile_id: profile.id,
        order_type: 'cart',
        status: 'pending',
        amount_total: totalCents,
        currency: 'eur',
        cart_data: {
          items: cartItems,
          shippingAddress,
          shippingCostCents,
        },
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('Error creating pending order:', orderError)
      return NextResponse.json({ error: 'Erreur création commande' }, { status: 500 })
    }

    console.log(`🛒 Cart order created: ${order.id} — ${cartItems.length} items — ${(totalCents/100).toFixed(2)}€`)

    // 2. Create Stripe session referencing the pending order
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email || shippingAddress?.email,
      line_items: lineItems,
      metadata: {
        order_type: 'cart',
        pending_order_id: order.id,
        profile_id: profile.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}?checkout=cancelled`,
    })

    return NextResponse.json({ url: session.url, orderId: order.id, price: totalCents })
  } catch (error) {
    console.error('Erreur Stripe checkout cart:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur création session Stripe' },
      { status: 500 }
    )
  }
}
