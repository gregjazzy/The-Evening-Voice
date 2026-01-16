/**
 * API Route: Obtenir un devis Gelato
 * POST /api/gelato/quote
 */

import { NextResponse } from 'next/server'
import { GelatoClient } from '@/lib/gelato'
import { GELATO_PRODUCT_MAPPING } from '@/lib/gelato'

const GELATO_API_KEY = process.env.GELATO_API_KEY
const IS_TEST_MODE = process.env.GELATO_TEST_MODE === 'true'

export async function POST(request: Request) {
  try {
    // Vérifier la clé API
    if (!GELATO_API_KEY) {
      return NextResponse.json(
        { error: 'Gelato API key not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { format, coverType, pageCount, country = 'FR', currency = 'EUR' } = body

    // Valider les paramètres
    if (!format || !coverType || !pageCount) {
      return NextResponse.json(
        { error: 'Missing required parameters: format, coverType, pageCount' },
        { status: 400 }
      )
    }

    // Obtenir le productUid Gelato
    const formatMapping = GELATO_PRODUCT_MAPPING[format]
    if (!formatMapping) {
      return NextResponse.json(
        { error: `Unknown format: ${format}` },
        { status: 400 }
      )
    }

    const productUid = coverType === 'hardcover' 
      ? formatMapping.hardcover 
      : formatMapping.softcover

    // Créer le client Gelato
    const client = new GelatoClient(GELATO_API_KEY, IS_TEST_MODE)

    // Obtenir le devis
    const quoteResponse = await client.getQuote({
      products: [
        {
          productUid,
          pageCount,
          quantity: 1,
        },
      ],
      shippingAddress: {
        country,
      },
      currency,
    })

    // Retourner le devis
    if (quoteResponse.quotes && quoteResponse.quotes.length > 0) {
      const quote = quoteResponse.quotes[0]
      return NextResponse.json({
        success: true,
        quote: {
          productPrice: quote.productPrice,
          shippingPrice: quote.shippingPrice,
          totalPrice: quote.productPrice + quote.shippingPrice,
          currency: quote.currency,
          estimatedDelivery: quote.estimatedShippingDays,
          fulfillmentCountry: quote.fulfillmentCountry,
        },
      })
    }

    return NextResponse.json(
      { error: 'No quote available for this configuration' },
      { status: 404 }
    )

  } catch (error) {
    console.error('Gelato quote error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get quote' },
      { status: 500 }
    )
  }
}
