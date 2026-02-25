/**
 * API Route: Calculate shipping cost for cart
 * POST /api/gelato/shipping
 *
 * Uses flat-rate shipping based on destination country.
 * Gelato draft orders don't include shipping pricing, so we use
 * conservative flat rates based on actual Gelato shipping costs.
 *
 * These rates are charged at cost (no margin) per the business rules.
 */

import { NextResponse } from 'next/server'

// Flat shipping rates in EUR by destination zone
// Based on observed Gelato shipping costs for standard delivery
const SHIPPING_RATES: Record<string, number> = {
  // Zone 1: France
  FR: 4.99,
  // Zone 2: EU & Switzerland
  BE: 5.99,
  CH: 6.99,
  DE: 5.99,
  ES: 5.99,
  IT: 5.99,
  NL: 5.99,
  AT: 5.99,
  PT: 5.99,
  LU: 5.99,
  IE: 6.99,
  // Zone 3: UK, Nordics
  GB: 7.99,
  DK: 6.99,
  SE: 6.99,
  NO: 7.99,
  FI: 6.99,
  // Zone 4: International
  US: 8.99,
  CA: 8.99,
}
const DEFAULT_RATE = 8.99

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { shippingAddress } = body as {
      items: unknown[]
      shippingAddress: { country: string }
    }

    if (!shippingAddress?.country) {
      return NextResponse.json(
        { error: 'Missing shippingAddress.country' },
        { status: 400 }
      )
    }

    const country = shippingAddress.country.toUpperCase()
    const shippingCost = SHIPPING_RATES[country] ?? DEFAULT_RATE

    console.log(`📦 Shipping calc: ${country} = ${shippingCost}€ (flat rate)`)

    return NextResponse.json({
      success: true,
      shippingCost,
      currency: 'EUR',
    })

  } catch (error) {
    console.error('Shipping calculation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to calculate shipping' },
      { status: 500 }
    )
  }
}
