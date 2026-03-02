/**
 * API Route: Stripe Webhook handler
 * POST /api/stripe/webhook
 *
 * Handles:
 * - checkout.session.completed → book order (place Gelato) or credits (increment balance)
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Use service role for webhook operations (no user session)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`📩 Stripe webhook: ${event.type}`)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const metadata = session.metadata || {}

    try {
      if (metadata.order_type === 'book') {
        await handleBookOrder(session, metadata)
      } else if (metadata.order_type === 'credits') {
        await handleCreditsOrder(session, metadata)
      } else if (metadata.order_type === 'narration_credits') {
        await handleNarrationCreditsOrder(session, metadata)
      } else if (metadata.order_type === 'cart') {
        await handleCartOrder(session, metadata)
      }
    } catch (error) {
      console.error('Webhook handler error:', error)
      // Return 200 anyway to avoid Stripe retries for handled events
    }
  }

  return NextResponse.json({ received: true })
}

async function handleBookOrder(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
) {
  const profileId = metadata.profile_id
  const shippingAddress = JSON.parse(metadata.shipping_address || '{}')
  const gelatoQuote = JSON.parse(metadata.gelato_quote || '{}')

  console.log(`📚 Book order paid — profile: ${profileId}`)

  // 1. Create order record
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      profile_id: profileId,
      stripe_session_id: session.id,
      order_type: 'book',
      status: 'paid',
      book_data: {
        story_title: metadata.story_title,
        format: metadata.format,
        cover_type: metadata.cover_type,
        paper_type: metadata.paper_type,
        lamination: metadata.lamination,
        page_count: parseInt(metadata.page_count),
        pdf_url: metadata.pdf_url,
        pdf_file_path: metadata.pdf_file_path,
        shipping_address: shippingAddress,
        gelato_quote: gelatoQuote,
      },
      amount_total: session.amount_total || 0,
      currency: session.currency || 'eur',
    })
    .select()
    .single()

  if (orderError) {
    console.error('Failed to create order record:', orderError)
    return
  }

  // 2. Place Gelato order
  try {
    const gelatoResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/gelato/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.STRIPE_WEBHOOK_SECRET!,
      },
      body: JSON.stringify({
        format: metadata.format,
        coverType: metadata.cover_type,
        paperType: metadata.paper_type,
        lamination: metadata.lamination,
        pageCount: parseInt(metadata.page_count),
        pdfUrl: metadata.pdf_url,
        shippingAddress,
        customerEmail: shippingAddress.email,
      }),
    })

    const gelatoData = await gelatoResponse.json()

    if (gelatoData.success && gelatoData.order) {
      // Update order with Gelato order ID
      await supabase
        .from('orders')
        .update({
          gelato_order_id: gelatoData.order.id,
          status: 'fulfilled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)

      console.log(`✅ Gelato order placed: ${gelatoData.order.id}`)
    } else {
      console.error('Gelato order failed:', gelatoData.error)
      await supabase
        .from('orders')
        .update({
          status: 'failed',
          book_data: { ...order.book_data, gelato_error: gelatoData.error },
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)
    }
  } catch (error) {
    console.error('Gelato API call failed:', error)
  }
}

async function handleCreditsOrder(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
) {
  const profileId = metadata.profile_id
  const creditsAmount = parseInt(metadata.credits_amount)

  console.log(`✨ Credits order paid — profile: ${profileId}, credits: ${creditsAmount}`)

  // 1. Create order record
  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      profile_id: profileId,
      stripe_session_id: session.id,
      order_type: 'credits',
      status: 'fulfilled',
      credits_amount: creditsAmount,
      amount_total: session.amount_total || 0,
      currency: session.currency || 'eur',
    })

  if (orderError) {
    console.error('Failed to create credits order record:', orderError)
  }

  // 2. Add credits to profile using RPC
  const { data, error } = await supabase.rpc('add_credits', {
    p_profile_id: profileId,
    p_amount: creditsAmount,
    p_reason: 'purchase',
    p_reference_id: session.id,
  })

  if (error) {
    console.error('Failed to add credits:', error)
  } else {
    console.log(`✅ Credits added. New balance: ${data}`)
  }
}

async function handleNarrationCreditsOrder(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
) {
  const profileId = metadata.profile_id
  const creditsAmount = parseInt(metadata.credits_amount)

  console.log(`🎙️ Narration credits order paid — profile: ${profileId}, chars: ${creditsAmount}`)

  // 1. Create order record
  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      profile_id: profileId,
      stripe_session_id: session.id,
      order_type: 'narration_credits',
      status: 'fulfilled',
      credits_amount: creditsAmount,
      amount_total: session.amount_total || 0,
      currency: session.currency || 'eur',
    })

  if (orderError) {
    console.error('Failed to create narration credits order record:', orderError)
  }

  // 2. Add narration credits to profile using RPC
  const { data, error } = await supabase.rpc('add_narration_credits', {
    p_profile_id: profileId,
    p_amount: creditsAmount,
    p_reason: 'purchase',
    p_reference_id: session.id,
  })

  if (error) {
    console.error('Failed to add narration credits:', error)
  } else {
    console.log(`✅ Narration credits added. New balance: ${data}`)
  }
}

async function handleCartOrder(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
) {
  const pendingOrderId = metadata.pending_order_id
  const profileId = metadata.profile_id

  console.log(`🛒 Cart order paid — order: ${pendingOrderId}, profile: ${profileId}`)

  // 1. Retrieve pending order with full cart data from Supabase
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', pendingOrderId)
    .single()

  if (fetchError || !order) {
    console.error('Failed to fetch pending order:', fetchError)
    return
  }

  // 2. Update order to paid
  await supabase
    .from('orders')
    .update({
      stripe_session_id: session.id,
      status: 'paid',
      amount_total: session.amount_total || 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pendingOrderId)

  const cartData = order.cart_data as {
    items: Array<{
      type: string
      productUid: string
      label: string
      imageUrls: string[]
      bookData?: {
        format: string
        coverType: string
        paperType: string
        lamination: string
        pageCount: number
        pdfUrl: string
        pdfFilePath: string
      }
    }>
    shippingAddress: Record<string, string>
    shippingCostCents: number
  }

  if (!cartData?.items?.length) {
    console.error('Cart data is empty or invalid')
    return
  }

  // Separate physical items (need Gelato) from digital items (instant delivery)
  const DIGITAL_TYPES = ['coloring-book']
  const physicalItems = cartData.items.filter(item => !DIGITAL_TYPES.includes(item.type))
  const digitalItems = cartData.items.filter(item => DIGITAL_TYPES.includes(item.type))

  if (digitalItems.length > 0) {
    console.log(`📥 Digital items: ${digitalItems.map(i => i.type).join(', ')} — instant delivery`)
  }

  // 3. Place Gelato order only for physical items
  if (physicalItems.length > 0) {
    try {
      const gelatoResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/gelato/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.STRIPE_WEBHOOK_SECRET!,
        },
        body: JSON.stringify({
          items: physicalItems,
          shippingAddress: cartData.shippingAddress,
          customerEmail: cartData.shippingAddress?.email,
        }),
      })

      const gelatoData = await gelatoResponse.json()

      if (gelatoData.success && gelatoData.order) {
        await supabase
          .from('orders')
          .update({
            gelato_order_id: gelatoData.order.id,
            status: 'fulfilled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', pendingOrderId)

        console.log(`✅ Cart Gelato order placed: ${gelatoData.order.id} (${gelatoData.order.itemCount} items)`)
      } else {
        console.error('Cart Gelato order failed:', gelatoData.error)
        await supabase
          .from('orders')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', pendingOrderId)
      }
    } catch (error) {
      console.error('Cart Gelato API call failed:', error)
    }
  } else {
    // All digital — mark as fulfilled immediately
    await supabase
      .from('orders')
      .update({
        status: 'fulfilled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', pendingOrderId)

    console.log(`✅ Digital-only cart order fulfilled: ${pendingOrderId}`)
  }
}
