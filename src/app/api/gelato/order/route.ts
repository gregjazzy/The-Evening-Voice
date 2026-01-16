/**
 * API Route: Créer une commande Gelato
 * POST /api/gelato/order
 */

import { NextResponse } from 'next/server'
import { GelatoClient, generateOrderReference } from '@/lib/gelato'
import { GELATO_PRODUCT_MAPPING } from '@/lib/gelato'
import type { GelatoShippingAddress } from '@/lib/gelato'

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
    const { 
      format, 
      coverType, 
      pageCount,
      pdfUrl,           // URL du PDF du livre
      coverPdfUrl,      // URL du PDF de la couverture (optionnel)
      shippingAddress,  // Adresse de livraison
      customerEmail,
      customerId,
    } = body

    // Valider les paramètres requis
    if (!format || !coverType || !pageCount || !pdfUrl || !shippingAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Valider l'adresse
    const requiredAddressFields = ['firstName', 'lastName', 'addressLine1', 'city', 'postCode', 'country', 'email']
    for (const field of requiredAddressFields) {
      if (!shippingAddress[field]) {
        return NextResponse.json(
          { error: `Missing shipping address field: ${field}` },
          { status: 400 }
        )
      }
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

    // Générer les références
    const orderReference = generateOrderReference()
    const itemReference = `ITEM-${Date.now()}`

    // Préparer les fichiers
    const files = [
      { type: 'default' as const, url: pdfUrl },
    ]
    
    if (coverPdfUrl) {
      files.push({ type: 'cover' as const, url: coverPdfUrl })
    }

    // Créer la commande
    const orderResponse = await client.createOrder({
      orderType: IS_TEST_MODE ? 'draft' : 'order',
      orderReferenceId: orderReference,
      customerReferenceId: customerId || customerEmail || 'anonymous',
      currency: 'EUR',
      items: [
        {
          itemReferenceId: itemReference,
          productUid,
          files,
          quantity: 1,
          pageCount,
        },
      ],
      shippingAddress: shippingAddress as GelatoShippingAddress,
      metadata: {
        source: 'lavoixdusoir',
        testMode: IS_TEST_MODE.toString(),
      },
    })

    return NextResponse.json({
      success: true,
      order: {
        id: orderResponse.id,
        referenceId: orderResponse.orderReferenceId,
        status: orderResponse.fulfillmentStatus,
        createdAt: orderResponse.createdAt,
        isTestMode: IS_TEST_MODE,
      },
    })

  } catch (error) {
    console.error('Gelato order error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/gelato/order?id=xxx
 * Récupérer le statut d'une commande
 */
export async function GET(request: Request) {
  try {
    if (!GELATO_API_KEY) {
      return NextResponse.json(
        { error: 'Gelato API key not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('id')

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing order id' },
        { status: 400 }
      )
    }

    const client = new GelatoClient(GELATO_API_KEY, IS_TEST_MODE)
    const order = await client.getOrder(orderId)

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        referenceId: order.orderReferenceId,
        status: order.fulfillmentStatus,
        shipments: order.shipments,
        receipts: order.receipts,
        updatedAt: order.updatedAt,
      },
    })

  } catch (error) {
    console.error('Gelato get order error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get order' },
      { status: 500 }
    )
  }
}
