/**
 * Types pour l'API Gelato
 * Documentation: https://dashboard.gelato.com/docs/
 */

// ============================================================================
// PRODUITS
// ============================================================================

export interface GelatoProduct {
  productUid: string
  title: string
  description?: string
  category: string
  previewUrl?: string
}

export interface GelatoProductPrice {
  productUid: string
  currency: string
  price: number
  quantity: number
}

// Formats de livres photo Gelato (tailles réelles du catalogue)
// 20x20cm (8x8"), 21x28cm (8x11"), 28x28cm (11x11")
export type GelatoPhotoBookSize =
  | 'photobook-hardcover-200x200'
  | 'photobook-hardcover-210x280'
  | 'photobook-hardcover-280x210'
  | 'photobook-hardcover-280x280'
  | 'photobook-softcover-200x200'
  | 'photobook-softcover-210x280'
  | 'photobook-softcover-280x210'
  | 'photobook-softcover-280x280'

// ============================================================================
// OPTIONS GELATO CONFIGURABLES
// ============================================================================

export type GelatoPaperType = '170-gsm-coated-silk' | '200-gsm-coated-silk' | '170-gsm-uncoated' | '200-gsm-uncoated'
export type GelatoLamination = 'matt-lamination' | 'glossy-lamination'
export type GelatoCoverType = 'softcover' | 'hardcover'

export interface GelatoPaperOption {
  id: GelatoPaperType
  nameFr: string
  nameEn: string
  weightGsm: number
  finish: 'silk' | 'uncoated'
  icon: string
  description: { fr: string; en: string; ru: string }
}

export interface GelatoLaminationOption {
  id: GelatoLamination
  nameFr: string
  nameEn: string
  icon: string
}

export const GELATO_PAPER_OPTIONS: GelatoPaperOption[] = [
  {
    id: '170-gsm-coated-silk',
    nameFr: 'Satiné 170g',
    nameEn: 'Silk 170gsm',
    weightGsm: 170,
    finish: 'silk',
    icon: '✨',
    description: { fr: 'Papier satiné classique, belles couleurs', en: 'Classic silk paper, beautiful colors', ru: 'Классическая шёлковая бумага' },
  },
  {
    id: '200-gsm-coated-silk',
    nameFr: 'Satiné 200g Premium',
    nameEn: 'Silk 200gsm Premium',
    weightGsm: 200,
    finish: 'silk',
    icon: '💎',
    description: { fr: 'Papier satiné épais, toucher premium', en: 'Thick silk paper, premium feel', ru: 'Толстая шёлковая бумага, премиум' },
  },
  {
    id: '170-gsm-uncoated',
    nameFr: 'Mat 170g',
    nameEn: 'Matte 170gsm',
    weightGsm: 170,
    finish: 'uncoated',
    icon: '📄',
    description: { fr: 'Papier mat naturel, aspect livre', en: 'Natural matte paper, book feel', ru: 'Натуральная матовая бумага' },
  },
  {
    id: '200-gsm-uncoated',
    nameFr: 'Mat 200g Premium',
    nameEn: 'Matte 200gsm Premium',
    weightGsm: 200,
    finish: 'uncoated',
    icon: '📜',
    description: { fr: 'Papier mat épais, toucher noble', en: 'Thick matte paper, noble feel', ru: 'Толстая матовая бумага, благородная' },
  },
]

export const GELATO_LAMINATION_OPTIONS: GelatoLaminationOption[] = [
  { id: 'matt-lamination', nameFr: 'Pelliculage mat', nameEn: 'Matte lamination', icon: '🌙' },
  { id: 'glossy-lamination', nameFr: 'Pelliculage brillant', nameEn: 'Glossy lamination', icon: '✨' },
]

// Mapping taille → segment pf Gelato (catalogue réel)
// square-21 = 20x20cm (8×8"), square-18 = 28x28cm (11×11"), portrait-a5 = 21x28cm (8×11")
const FORMAT_PF_SEGMENT: Record<string, string> = {
  'square-21': '200x200-mm-8x8',
  'square-18': '280x280-mm-11x11',
  'portrait-a5': '210x280-mm-8x11',
  'portrait-a4': '210x280-mm-8x11',  // alias → même produit que portrait-a5
  'landscape-a5': '280x210-mm-11x8',
}

// Construire dynamiquement le product UID Gelato
export function buildGelatoProductUid(
  format: string,
  cover: GelatoCoverType,
  paper: GelatoPaperType,
  lamination: GelatoLamination,
): string {
  const pf = FORMAT_PF_SEGMENT[format] || '200x200-mm-8x8'
  const bt = cover === 'hardcover' ? 'perfect-hardcover' : 'glued-softcover'
  return `photobook_pf_${pf}_pt_${paper}_cl_4-4_ccl_4-0_bt_${bt}_ct_${lamination}_prt_1-0`
}

// @deprecated Use buildGelatoProductUid() instead
export const GELATO_PRODUCT_MAPPING: Record<string, { softcover: string; hardcover: string }> = {
  'square-21': {
    softcover: 'photobook_pf_200x200-mm-8x8_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_glued-softcover_ct_matt-lamination_prt_1-0',
    hardcover: 'photobook_pf_200x200-mm-8x8_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_perfect-hardcover_ct_matt-lamination_prt_1-0',
  },
  'square-18': {
    softcover: 'photobook_pf_280x280-mm-11x11_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_glued-softcover_ct_matt-lamination_prt_1-0',
    hardcover: 'photobook_pf_280x280-mm-11x11_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_perfect-hardcover_ct_matt-lamination_prt_1-0',
  },
  'portrait-a5': {
    softcover: 'photobook_pf_210x280-mm-8x11_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_glued-softcover_ct_matt-lamination_prt_1-0',
    hardcover: 'photobook_pf_210x280-mm-8x11_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_perfect-hardcover_ct_matt-lamination_prt_1-0',
  },
  'portrait-a4': {
    softcover: 'photobook_pf_210x280-mm-8x11_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_glued-softcover_ct_matt-lamination_prt_1-0',
    hardcover: 'photobook_pf_210x280-mm-8x11_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_perfect-hardcover_ct_matt-lamination_prt_1-0',
  },
  'landscape-a5': {
    softcover: 'photobook_pf_280x210-mm-11x8_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_glued-softcover_ct_matt-lamination_prt_1-0',
    hardcover: 'photobook_pf_280x210-mm-11x8_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_perfect-hardcover_ct_matt-lamination_prt_1-0',
  },
}

// ============================================================================
// COMMANDES
// ============================================================================

export interface GelatoOrderItem {
  itemReferenceId: string
  productUid: string
  files: GelatoFile[]
  quantity: number
  pageCount?: number  // Pour les livres photo
}

export interface GelatoFile {
  type: 'default' | 'cover' | 'back' | 'inside'
  url: string
}

export interface GelatoShippingAddress {
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string
  city: string
  postCode: string
  state?: string
  country: string  // ISO 3166-1 alpha-2 (ex: "FR", "US")
  email: string
  phone?: string
}

export interface GelatoOrderRequest {
  orderType: 'order' | 'draft'
  orderReferenceId: string
  customerReferenceId: string
  currency: string
  items: GelatoOrderItem[]
  shippingAddress: GelatoShippingAddress
  metadata?: Record<string, string>
}

export interface GelatoOrderResponse {
  id: string
  orderReferenceId: string
  orderType: string
  fulfillmentStatus: GelatoFulfillmentStatus
  financialStatus: string
  channel: string
  storeId: string | null
  currency: string
  items: GelatoOrderItemResponse[]
  shipments: GelatoShipment[]
  receipts: GelatoReceipt[]
  createdAt: string
  updatedAt: string
}

export type GelatoFulfillmentStatus = 
  | 'created'
  | 'passed_to_production'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'canceled'
  | 'failed'

export interface GelatoOrderItemResponse {
  itemReferenceId: string
  productUid: string
  quantity: number
  fulfillmentStatus: GelatoFulfillmentStatus
}

export interface GelatoShipment {
  id: string
  shipmentItems: Array<{ itemReferenceId: string; quantity: number }>
  fulfillmentCountry: string
  carrier: string
  trackingCode?: string
  trackingUrl?: string
}

export interface GelatoReceipt {
  id: string
  currency: string
  items: Array<{
    itemReferenceId: string
    productUid: string
    quantity: number
    amount: number
  }>
  shipping: number
  tax: number
  total: number
}

// ============================================================================
// DEVIS / QUOTES
// ============================================================================

export interface GelatoQuoteRequest {
  products: Array<{
    productUid: string
    pageCount?: number
    quantity: number
  }>
  shippingAddress: {
    country: string
    state?: string
  }
  currency?: string
}

export interface GelatoQuoteResponse {
  quotes: GelatoQuote[]
}

export interface GelatoQuote {
  productUid: string
  pageCount?: number
  quantity: number
  productPrice: number
  shippingPrice: number
  currency: string
  fulfillmentCountry: string
  estimatedShippingDays: {
    min: number
    max: number
  }
}

// ============================================================================
// ERRORS
// ============================================================================

export interface GelatoError {
  code: string
  message: string
  details?: Record<string, unknown>
}
