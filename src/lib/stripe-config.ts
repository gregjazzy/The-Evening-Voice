// Shared Stripe configuration — safe to import in both client and server

// ============================================================================
// CREDIT PACKS
// ============================================================================

export const CREDIT_PACKS = [
  {
    id: 'pack-60',
    credits: 60,
    price: 1999, // in cents (19,99€)
    label: '60 crédits',
    labelEn: '60 credits',
  },
] as const

export const FREE_CREDITS_ON_SIGNUP = 5

export type CreditPackId = typeof CREDIT_PACKS[number]['id']

export function getCreditPack(packId: string) {
  return CREDIT_PACKS.find(p => p.id === packId)
}

// ============================================================================
// NARRATION CREDIT PACKS (ElevenLabs, billed per character)
// ============================================================================

export const NARRATION_CREDIT_PACKS = [
  { id: 'narration-1', credits: 6720, price: 499, label: '1 histoire narrée', labelEn: '1 narrated story' },
  { id: 'narration-5', credits: 33600, price: 1999, label: '5 histoires narrées', labelEn: '5 narrated stories' },
  { id: 'narration-15', credits: 100800, price: 4999, label: '15 histoires narrées', labelEn: '15 narrated stories' },
] as const

export type NarrationCreditPackId = typeof NARRATION_CREDIT_PACKS[number]['id']

export function getNarrationCreditPack(packId: string) {
  return NARRATION_CREDIT_PACKS.find(p => p.id === packId)
}

// ============================================================================
// BOOK PRICING
// ============================================================================

// Prix unique pour tous les livres (en cents)
// Les frais de port Gelato sont facturés séparément via une ligne dédiée.
export const BOOK_FLAT_PRICE_CENTS = 4999 // 49,99€

/**
 * Prix de vente d'un livre : 49,99€ flat, peu importe format/cover.
 * Les frais de port sont facturés séparément.
 *
 * Signature inchangée pour compatibilité avec les appelants existants.
 * Les arguments sont ignorés.
 */
export function calculateBookPrice(
  _coverType: 'softcover' | 'hardcover',
  _currentGelatoCost: number
): number {
  return BOOK_FLAT_PRICE_CENTS
}

// ============================================================================
// DERIVATIVE PRODUCT PRICING (marge ×2 sur coût Gelato, livraison facturée séparément)
// ============================================================================

export const DERIVATIVE_PRICES = {
  mug: 1499,              // 14.99€ (coût Gelato: 7.11€)
  poster: 1499,           // 14.99€ (coût Gelato: 7.63€)
  'coloring-book': 499,   // 4.99€ (digital PDF, coût IA: ~0.10€)
} as const

export type DerivativeType = keyof typeof DERIVATIVE_PRICES
