/**
 * Catalogue des produits dérivés Gelato
 * Prix vérifiés via draft orders le 24/02/2026 (livraison France)
 */

// ============================================================================
// TYPES
// ============================================================================

export type DerivativeProductType = 'mug' | 'poster' | 'cards' | 'coloring-book'

export interface DerivativeProduct {
  type: DerivativeProductType
  gelatoProductUid: string  // 'DYNAMIC' pour le coloriage (même UID softcover)
  costEur: number           // Coût Gelato produit seul (hors livraison)
  sellingPriceCents: number // Prix de vente en cents (coût × 2.5, arrondi au .99)
  requiresCredit: boolean   // true pour le livre de coloriage (conversion IA)
  creditCost: number        // Nombre de crédits nécessaires
  maxIllustrations: number  // 1 pour mug/poster, 10 pour cartes, -1 pour coloriage (toutes)
  icon: string              // Nom d'icône Lucide
  nameFr: string
  nameEn: string
  nameRu: string
  descriptionFr: string
  descriptionEn: string
  descriptionRu: string
}

// ============================================================================
// CATALOGUE
// ============================================================================

export const DERIVATIVE_PRODUCTS: DerivativeProduct[] = [
  {
    type: 'mug',
    gelatoProductUid: 'mug_product_msz_11-oz_mmat_ceramic-white_cl_4-0',
    costEur: 5.13,
    sellingPriceCents: 1299,
    requiresCredit: false,
    creditCost: 0,
    maxIllustrations: 1,
    icon: 'Coffee',
    nameFr: 'Mug personnalisé',
    nameEn: 'Custom mug',
    nameRu: 'Кружка',
    descriptionFr: 'Mug blanc 11oz avec ton illustration préférée',
    descriptionEn: 'White 11oz mug with your favorite illustration',
    descriptionRu: 'Белая кружка 11oz с любимой иллюстрацией',
  },
  {
    type: 'poster',
    gelatoProductUid: 'flat_product_pf_300x400-mm_pt_200-gsm-uncoated_cl_4-0_ct_none_prt_none_sft_none_set_none_ver',
    costEur: 10.69,
    sellingPriceCents: 2699,
    requiresCredit: false,
    creditCost: 0,
    maxIllustrations: 1,
    icon: 'Frame',
    nameFr: 'Poster 30×40cm',
    nameEn: 'Poster 30×40cm',
    nameRu: 'Постер 30×40см',
    descriptionFr: 'Poster mat haute qualité pour la chambre',
    descriptionEn: 'High quality matte poster for the bedroom',
    descriptionRu: 'Матовый постер высокого качества',
  },
  {
    type: 'cards',
    gelatoProductUid: 'pack_of_cards_qt_10_pcs_pf_a6_upt_350-gsm-130lb-coated-silk_cl_4-4_ct_none_prt_none_sft_none_set_none_ver',
    costEur: 3.92,
    sellingPriceCents: 999,
    requiresCredit: false,
    creditCost: 0,
    maxIllustrations: 10,
    icon: 'Mail',
    nameFr: 'Pack 10 cartes',
    nameEn: 'Pack of 10 cards',
    nameRu: 'Набор 10 открыток',
    descriptionFr: '10 cartes A6 avec tes plus belles illustrations',
    descriptionEn: '10 A6 cards with your best illustrations',
    descriptionRu: '10 открыток A6 с лучшими иллюстрациями',
  },
  {
    type: 'coloring-book',
    gelatoProductUid: 'DYNAMIC',
    costEur: 11.00,
    sellingPriceCents: 3499,
    requiresCredit: true,
    creditCost: 1,
    maxIllustrations: -1,
    icon: 'Palette',
    nameFr: 'Livre de coloriage',
    nameEn: 'Coloring book',
    nameRu: 'Раскраска',
    descriptionFr: 'Toutes les illustrations converties en coloriage par l\'IA',
    descriptionEn: 'All illustrations converted to coloring pages by AI',
    descriptionRu: 'Все иллюстрации в раскраски с помощью ИИ',
  },
]

// ============================================================================
// HELPERS
// ============================================================================

export function getDerivativeProduct(type: DerivativeProductType): DerivativeProduct | undefined {
  return DERIVATIVE_PRODUCTS.find(p => p.type === type)
}

export function getDerivativeDisplayName(type: DerivativeProductType, locale: string): string {
  const product = getDerivativeProduct(type)
  if (!product) return type
  if (locale === 'en') return product.nameEn
  if (locale === 'ru') return product.nameRu
  return product.nameFr
}
