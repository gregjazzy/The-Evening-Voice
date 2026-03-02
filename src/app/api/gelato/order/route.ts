/**
 * API Route: Créer une commande Gelato
 * POST /api/gelato/order
 *
 * Supporte deux modes :
 * - Legacy : un seul livre (format, coverType, paperType, etc.)
 * - Multi-items : un tableau `items[]` contenant livres et dérivés
 */

import { NextResponse } from 'next/server'
import { GelatoClient, generateOrderReference, buildGelatoProductUid } from '@/lib/gelato'
import type { GelatoShippingAddress, GelatoPaperType, GelatoLamination, GelatoOrderItem } from '@/lib/gelato'

const GELATO_API_KEY = process.env.GELATO_API_KEY
const IS_TEST_MODE = process.env.GELATO_TEST_MODE === 'true'

// Types pour le mode multi-items
interface CartItemForGelato {
  type: string
  productUid: string
  quantity?: number
  imageUrls: string[]
  coloringBookPdfUrl?: string
  bookData?: {
    format: string
    coverType: string
    paperType: string
    lamination: string
    pageCount: number
    pdfUrl: string
  }
}

export async function POST(request: Request) {
  try {
    // 🔒 Vérifier l'appel interne (webhook uniquement)
    const internalSecret = request.headers.get('x-internal-secret')
    if (internalSecret !== process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!GELATO_API_KEY) {
      return NextResponse.json(
        { error: 'Gelato API key not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()

    // Detect mode: multi-items vs legacy single book
    if (body.items && Array.isArray(body.items)) {
      return handleMultiItemOrder(body)
    } else {
      return handleLegacySingleBookOrder(body)
    }

  } catch (error) {
    console.error('Gelato order error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    )
  }
}

// ============================================================================
// MULTI-ITEM ORDER (new cart flow)
// ============================================================================

async function handleMultiItemOrder(body: {
  items: CartItemForGelato[]
  shippingAddress: GelatoShippingAddress
  customerEmail?: string
  customerId?: string
}) {
  const { items, shippingAddress, customerEmail, customerId } = body

  if (!items.length || !shippingAddress) {
    return NextResponse.json(
      { error: 'Missing items or shippingAddress' },
      { status: 400 }
    )
  }

  // Validate address
  const requiredFields = ['firstName', 'lastName', 'addressLine1', 'city', 'postCode', 'country', 'email']
  for (const field of requiredFields) {
    if (!(shippingAddress as any)[field]) {
      return NextResponse.json(
        { error: `Missing shipping address field: ${field}` },
        { status: 400 }
      )
    }
  }

  const client = new GelatoClient(GELATO_API_KEY!, IS_TEST_MODE)
  const orderReference = generateOrderReference()

  // Build Gelato order items
  const gelatoItems: GelatoOrderItem[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const itemRef = `ITEM-${i}-${Date.now()}`

    if (item.type === 'book' && item.bookData) {
      // Book item — build productUid from book options
      const productUid = buildGelatoProductUid(
        item.bookData.format,
        item.bookData.coverType as any,
        (item.bookData.paperType || '170-gsm-coated-silk') as GelatoPaperType,
        (item.bookData.lamination || 'matt-lamination') as GelatoLamination,
      )

      gelatoItems.push({
        itemReferenceId: itemRef,
        productUid,
        files: [{ type: 'default', url: item.bookData.pdfUrl }],
        quantity: item.quantity || 1,
        pageCount: item.bookData.pageCount,
      })
    } else if (item.productUid && item.productUid !== 'DYNAMIC') {
      // Derivative item (mug, poster) — upscale image then send to Gelato
      if (!item.imageUrls?.length) {
        console.warn(`Skipping derivative ${item.type}: no image URL`)
        continue
      }

      let imageUrl = item.imageUrls[0]

      // Upscale automatique pour impression haute qualité
      try {
        console.log(`🔍 Upscaling derivative image for ${item.type}...`)
        const { upscaleImageForPrint } = await import('@/lib/ai/fal')
        const upscaled = await upscaleImageForPrint({ imageUrl, scale: 2 })

        if (upscaled.imageUrl) {
          // Re-upload sur Supabase pour URL permanente
          const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/images/upscale-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'image/png',
            },
            body: Buffer.from(await (await fetch(upscaled.imageUrl)).arrayBuffer()),
          })

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            const filePath = uploadData.Key || uploadData.path
            if (filePath) {
              imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${filePath}`
              console.log(`✅ Derivative image upscaled & uploaded: ${upscaled.width}x${upscaled.height}px`)
            }
          } else {
            // Fallback: utiliser l'URL fal.ai temporaire (mieux que rien)
            imageUrl = upscaled.imageUrl
            console.log(`⚠️ Upload failed, using temp fal.ai URL for ${item.type}`)
          }
        }
      } catch (error) {
        console.warn(`⚠️ Upscale failed for ${item.type}, using original image:`, error)
      }

      gelatoItems.push({
        itemReferenceId: itemRef,
        productUid: item.productUid,
        files: [{ type: 'default', url: imageUrl }],
        quantity: item.quantity || 1,
      })
    } else if (item.type === 'coloring-book') {
      // Coloring book is now a digital product — skip Gelato
      console.log(`📥 Skipping coloring-book item (digital product)`)
      continue
    } else {
      // Unknown type — skip
      console.warn(`Skipping item type ${item.type}: not supported for Gelato`)
    }
  }

  if (gelatoItems.length === 0) {
    return NextResponse.json(
      { error: 'No valid items for Gelato order' },
      { status: 400 }
    )
  }

  console.log(`🛒 Creating Gelato multi-item order: ${gelatoItems.length} items`)

  const orderResponse = await client.createOrder({
    orderType: IS_TEST_MODE ? 'draft' : 'order',
    orderReferenceId: orderReference,
    customerReferenceId: customerId || customerEmail || 'anonymous',
    currency: 'EUR',
    items: gelatoItems,
    shippingAddress,
    metadata: {
      source: 'lavoixdusoir',
      testMode: IS_TEST_MODE.toString(),
      itemCount: String(gelatoItems.length),
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
      itemCount: gelatoItems.length,
    },
  })
}

// ============================================================================
// LEGACY SINGLE BOOK ORDER (backward compatible)
// ============================================================================

async function handleLegacySingleBookOrder(body: Record<string, any>) {
  const {
    format,
    coverType,
    paperType = '170-gsm-coated-silk' as GelatoPaperType,
    lamination = 'matt-lamination' as GelatoLamination,
    pageCount,
    pdfUrl,
    coverPdfUrl,
    shippingAddress,
    customerEmail,
    customerId,
  } = body

  if (!format || !coverType || !pageCount || !pdfUrl || !shippingAddress) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    )
  }

  const requiredAddressFields = ['firstName', 'lastName', 'addressLine1', 'city', 'postCode', 'country', 'email']
  for (const field of requiredAddressFields) {
    if (!shippingAddress[field]) {
      return NextResponse.json(
        { error: `Missing shipping address field: ${field}` },
        { status: 400 }
      )
    }
  }

  const productUid = buildGelatoProductUid(format, coverType, paperType, lamination)
  const client = new GelatoClient(GELATO_API_KEY!, IS_TEST_MODE)
  const orderReference = generateOrderReference()
  const itemReference = `ITEM-${Date.now()}`

  const files: Array<{ type: 'default' | 'cover' | 'back' | 'inside'; url: string }> = [
    { type: 'default', url: pdfUrl },
  ]

  if (coverPdfUrl) {
    files.push({ type: 'cover', url: coverPdfUrl })
  }

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
}

/**
 * GET /api/gelato/order?id=xxx
 * Récupérer le statut d'une commande
 */
export async function GET(request: Request) {
  try {
    const internalSecret = request.headers.get('x-internal-secret')
    if (internalSecret !== process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
