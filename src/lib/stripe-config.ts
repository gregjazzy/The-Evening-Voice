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
// BOOK PRICING
// ============================================================================

// Prix fixes de base (en cents)
export const BOOK_BASE_PRICES = {
  softcover: 3499, // 34,99€
  hardcover: 4999, // 49,99€
} as const

// Coûts de référence Gelato (produit + livraison) au 24/02/2026
// Utilisés pour ajuster le prix si Gelato augmente
export const GELATO_REFERENCE_COSTS = {
  softcover: 16.65, // max des softcovers (21×28: €11.96 + €4.69)
  hardcover: 24.97, // max des hardcovers (28×28: €20.17 + €4.80)
} as const

/**
 * Calcule le prix de vente d'un livre en fonction du coût Gelato actuel.
 * Si Gelato augmente de X%, notre prix augmente de X%.
 * Si Gelato baisse, on garde le prix fixe.
 *
 * @param coverType - 'softcover' ou 'hardcover'
 * @param currentGelatoCost - coût actuel Gelato (produit + livraison) en euros
 * @returns prix de vente en cents, arrondi au .99€
 */
export function calculateBookPrice(
  coverType: 'softcover' | 'hardcover',
  currentGelatoCost: number
): number {
  const basePrice = BOOK_BASE_PRICES[coverType]
  const referenceCost = GELATO_REFERENCE_COSTS[coverType]

  const ratio = Math.max(1, currentGelatoCost / referenceCost)
  const adjustedPrice = basePrice * ratio

  // Arrondir au .99€ supérieur (en cents)
  const euros = Math.ceil(adjustedPrice / 100)
  return euros * 100 - 1 // ex: 35€ → 3499 (34.99€), 51€ → 5099 (50.99€)
}

// ============================================================================
// DERIVATIVE PRODUCT PRICING (marge ×2.5 sur coût produit, pas de marge sur livraison)
// ============================================================================

export const DERIVATIVE_PRICES = {
  mug: 1299,              // 12.99€
  poster: 2699,           // 26.99€
  cards: 999,             // 9.99€
  'coloring-book': 3499,  // 34.99€
} as const

export type DerivativeType = keyof typeof DERIVATIVE_PRICES
