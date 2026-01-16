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

// Formats de livres photo Gelato
export type GelatoPhotoBookSize = 
  | 'photobook-hardcover-a4-portrait'
  | 'photobook-hardcover-a4-landscape'
  | 'photobook-hardcover-a5-portrait'
  | 'photobook-hardcover-a5-landscape'
  | 'photobook-hardcover-square-210x210'
  | 'photobook-hardcover-square-180x180'
  | 'photobook-softcover-a4-portrait'
  | 'photobook-softcover-a4-landscape'
  | 'photobook-softcover-a5-portrait'
  | 'photobook-softcover-a5-landscape'
  | 'photobook-softcover-square-210x210'
  | 'photobook-softcover-square-180x180'

// Mapping de nos formats vers Gelato
export const GELATO_PRODUCT_MAPPING: Record<string, { softcover: string; hardcover: string }> = {
  'square-21': {
    softcover: 'photobook_pf_210x210-mm-8x8_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_glued-softcover_ct_matt-lamination_prt_1-0',
    hardcover: 'photobook_pf_210x210-mm-8x8_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_perfect-hardcover_ct_matt-lamination_prt_1-0',
  },
  'square-18': {
    softcover: 'photobook_pf_180x180-mm-7x7_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_glued-softcover_ct_matt-lamination_prt_1-0',
    hardcover: 'photobook_pf_180x180-mm-7x7_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_perfect-hardcover_ct_matt-lamination_prt_1-0',
  },
  'portrait-a5': {
    softcover: 'photobook_pf_a5_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_glued-softcover_ct_matt-lamination_prt_1-0',
    hardcover: 'photobook_pf_a5_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_perfect-hardcover_ct_matt-lamination_prt_1-0',
  },
  'portrait-a4': {
    softcover: 'photobook_pf_a4_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_glued-softcover_ct_matt-lamination_prt_1-0',
    hardcover: 'photobook_pf_a4_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_perfect-hardcover_ct_matt-lamination_prt_1-0',
  },
  'landscape-a5': {
    softcover: 'photobook_pf_a5-landscape_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_glued-softcover_ct_matt-lamination_prt_1-0',
    hardcover: 'photobook_pf_a5-landscape_pt_170-gsm-coated-silk_cl_4-4_ccl_4-0_bt_perfect-hardcover_ct_matt-lamination_prt_1-0',
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
