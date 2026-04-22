/**
 * API Route - Envoi de demande de commande par email
 *
 * Bypass Stripe : la demande est envoyée directement à l'email d'admin
 * (paiement géré manuellement hors de l'app).
 *
 * Flow :
 * - Reçoit le panier + adresse de livraison
 * - Stocke la commande dans Supabase avec status='pending_manual'
 * - Envoie un email récapitulatif à l'admin via Resend
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_EMAIL = process.env.ORDER_NOTIFICATION_EMAIL || 'gregjazzy@gmail.com'

type OrderKind = 'book' | 'studio-credits' | 'narration-credits'

interface CartItem {
  type: string
  label?: string
  quantity?: number
  bookData?: {
    storyTitle?: string
    storyId?: string
    format?: string
    coverType?: string
    paperType?: string
    lamination?: string
    pageCount?: number
    pdfUrl?: string
    gelatoQuote?: { productPrice: number; shippingPrice: number }
  }
  creditsData?: {
    packId?: string
    credits?: number
    priceCents?: number
  }
}

interface ShippingAddress {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
}

function formatEur(cents: number): string {
  return (cents / 100).toFixed(2) + '€'
}

function buildEmailHtml(params: {
  customerName: string
  customerEmail: string
  profileId: string
  cartItems: CartItem[]
  shippingAddress: ShippingAddress
  shippingCostCents: number
  totalCents: number
  orderId: string
}): string {
  const { customerName, customerEmail, profileId, cartItems, shippingAddress, shippingCostCents, totalCents, orderId } = params

  const itemsHtml = cartItems.map((item) => {
    const qty = item.quantity || 1
    const bd = item.bookData
    const cd = item.creditsData
    const productCents = bd?.gelatoQuote ? Math.round(bd.gelatoQuote.productPrice * 100) : 0
    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;vertical-align:top;">
          <strong>${item.label || item.type}</strong> ${qty > 1 ? `× ${qty}` : ''}
          ${bd ? `
            <div style="font-size:13px;color:#555;margin-top:4px;">
              📖 <em>${bd.storyTitle || ''}</em><br>
              Format : ${bd.format || ''}<br>
              Couverture : ${bd.coverType || ''}<br>
              Pages : ${bd.pageCount ?? '?'}<br>
              ${bd.paperType ? `Papier : ${bd.paperType}<br>` : ''}
              ${bd.lamination ? `Pelliculage : ${bd.lamination}<br>` : ''}
              ${bd.pdfUrl ? `<a href="${bd.pdfUrl}" target="_blank">📄 Télécharger le PDF du livre</a><br>` : ''}
              ${bd.storyId ? `Story ID : <code>${bd.storyId}</code><br>` : ''}
              ${productCents ? `<small>Coût Gelato produit : ${formatEur(productCents)}</small>` : ''}
            </div>
          ` : ''}
          ${cd ? `
            <div style="font-size:13px;color:#555;margin-top:4px;">
              🎫 ${cd.credits || 0} crédits${cd.packId ? ` (pack <code>${cd.packId}</code>)` : ''}<br>
              ⚠️ À créditer manuellement sur le profil après paiement.
            </div>
          ` : ''}
        </td>
      </tr>
    `
  }).join('')

  const addressHtml = shippingAddress?.address ? `
    <h3 style="margin-bottom:6px;color:#222;">Adresse de livraison</h3>
    <p style="margin:0;line-height:1.5;color:#444;">
      ${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}<br>
      ${shippingAddress.address}<br>
      ${shippingAddress.postalCode || ''} ${shippingAddress.city || ''}<br>
      ${shippingAddress.country || ''}<br>
      ${shippingAddress.phone ? `📞 ${shippingAddress.phone}` : ''}
    </p>
  ` : ''

  return `
<!DOCTYPE html>
<html>
  <body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f5f5f5;padding:20px;margin:0;">
    <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px;color:white;">
        <h1 style="margin:0;font-size:22px;">📦 Nouvelle commande de livre</h1>
        <p style="margin:8px 0 0;opacity:0.9;font-size:14px;">Référence interne : ${orderId}</p>
      </div>

      <div style="padding:24px;">
        <h3 style="margin-top:0;color:#222;">Client</h3>
        <p style="margin:0 0 16px;color:#444;line-height:1.5;">
          <strong>${customerName}</strong><br>
          📧 <a href="mailto:${customerEmail}">${customerEmail}</a><br>
          <small style="color:#888;">Profile ID : <code>${profileId}</code></small>
        </p>

        ${addressHtml}

        <h3 style="margin-top:24px;color:#222;">Détail de la commande</h3>
        <table style="width:100%;border-collapse:collapse;background:#fafafa;border-radius:8px;overflow:hidden;">
          ${itemsHtml}
        </table>

        <table style="width:100%;margin-top:16px;font-size:14px;">
          <tr>
            <td style="padding:4px 12px;color:#555;">Sous-total produits</td>
            <td style="padding:4px 12px;text-align:right;color:#222;">${formatEur(totalCents - shippingCostCents)}</td>
          </tr>
          <tr>
            <td style="padding:4px 12px;color:#555;">Frais de port</td>
            <td style="padding:4px 12px;text-align:right;color:#222;">${formatEur(shippingCostCents)}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-top:2px solid #ddd;font-weight:bold;color:#222;font-size:16px;">Total à facturer</td>
            <td style="padding:8px 12px;border-top:2px solid #ddd;text-align:right;font-weight:bold;color:#6366f1;font-size:16px;">${formatEur(totalCents)}</td>
          </tr>
        </table>

        <div style="margin-top:24px;padding:12px;background:#fef3c7;border-radius:8px;font-size:13px;color:#78350f;">
          ⚠️ Action requise : contacter le client pour finaliser le paiement et lancer la commande Gelato.
        </div>
      </div>
    </div>
  </body>
</html>
  `.trim()
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('user_id', user.id)
      .single()

    const profile = profileRow as { id: string; name: string | null } | null
    if (!profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    }

    const body = await request.json()
    const {
      cartItems,
      shippingAddress,
      shippingCostCents = 0,
    } = body as {
      cartItems: CartItem[]
      shippingAddress: ShippingAddress
      shippingCostCents?: number
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'Panier vide' }, { status: 400 })
    }

    let totalCents = shippingCostCents
    for (const item of cartItems) {
      const qty = item.quantity || 1
      if (item.type === 'book') {
        totalCents += 4999 * qty
      } else if (item.creditsData?.priceCents) {
        totalCents += item.creditsData.priceCents * qty
      }
    }

    const { data: orderRow, error: orderError } = await supabaseAdmin
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
          fulfillmentMode: 'manual',
        },
      })
      .select('id')
      .single()

    const order = orderRow as { id: string } | null
    if (orderError || !order) {
      console.error('❌ Erreur création commande:', orderError)
      return NextResponse.json({ error: 'Erreur création commande' }, { status: 500 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('⚠️ RESEND_API_KEY non configurée — commande créée sans email')
      return NextResponse.json({
        success: true,
        orderId: order.id,
        warning: 'Email non envoyé (clé API absente)',
      })
    }

    const resend = new Resend(apiKey)
    const html = buildEmailHtml({
      customerName: profile.name || 'Sans nom',
      customerEmail: user.email || 'inconnu',
      profileId: profile.id,
      cartItems,
      shippingAddress,
      shippingCostCents,
      totalCents,
      orderId: order.id,
    })

    const { error: emailError } = await resend.emails.send({
      from: 'Story Orders <onboarding@resend.dev>',
      to: ADMIN_EMAIL,
      replyTo: user.email || undefined,
      subject: `📦 Commande livre — ${profile.name || 'Sans nom'} (${formatEur(totalCents)})`,
      html,
    })

    if (emailError) {
      console.error('❌ Erreur envoi email Resend:', emailError)
      return NextResponse.json({
        success: true,
        orderId: order.id,
        warning: 'Email non envoyé (erreur Resend)',
      })
    }

    console.log(`✅ Commande ${order.id} envoyée par email à ${ADMIN_EMAIL}`)
    return NextResponse.json({ success: true, orderId: order.id })
  } catch (error) {
    console.error('❌ Erreur API order/send:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
