/**
 * Catalogue des produits dérivés Gelato
 * Prix vérifiés via draft orders le 24/02/2026 (livraison France)
 */

// ============================================================================
// TYPES
// ============================================================================

export type DerivativeProductType = 'mug' | 'poster' | 'coloring-book'

export interface DerivativeProduct {
  type: DerivativeProductType
  gelatoProductUid: string  // 'DYNAMIC' pour le coloriage (même UID softcover)
  costEur: number           // Coût Gelato produit seul (hors livraison)
  sellingPriceCents: number // Prix de vente en cents (coût × 2, arrondi au .99)
  requiresCredit: boolean   // true si nécessite un crédit IA
  creditCost: number        // Nombre de crédits nécessaires
  maxIllustrations: number  // 1 pour mug/poster, -1 pour coloriage (toutes)
  isDigital: boolean        // true = téléchargement PDF, pas de livraison physique
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
    costEur: 7.11,
    sellingPriceCents: 1499,
    requiresCredit: false,
    creditCost: 0,
    maxIllustrations: 1,
    isDigital: false,
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
    costEur: 7.63,
    sellingPriceCents: 1499,
    requiresCredit: false,
    creditCost: 0,
    maxIllustrations: 1,
    isDigital: false,
    icon: 'Frame',
    nameFr: 'Poster 30×40cm',
    nameEn: 'Poster 30×40cm',
    nameRu: 'Постер 30×40см',
    descriptionFr: 'Poster mat haute qualité pour la chambre',
    descriptionEn: 'High quality matte poster for the bedroom',
    descriptionRu: 'Матовый постер высокого качества',
  },
  {
    type: 'coloring-book',
    gelatoProductUid: 'DIGITAL',
    costEur: 0.10,
    sellingPriceCents: 499,
    requiresCredit: false,
    creditCost: 0,
    maxIllustrations: -1,
    isDigital: true,
    icon: 'Palette',
    nameFr: 'Pack coloriages',
    nameEn: 'Coloring pack',
    nameRu: 'Набор раскрасок',
    descriptionFr: 'PDF avec toutes tes illustrations en coloriage',
    descriptionEn: 'PDF with all your illustrations as coloring pages',
    descriptionRu: 'PDF со всеми иллюстрациями в виде раскрасок',
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
