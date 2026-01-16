/**
 * Module Gelato - Impression de livres à la demande
 */

export { GelatoClient, translateFulfillmentStatus, getStatusEmoji, generateOrderReference } from './client'
export type {
  GelatoProduct,
  GelatoProductPrice,
  GelatoPhotoBookSize,
  GelatoOrderItem,
  GelatoFile,
  GelatoShippingAddress,
  GelatoOrderRequest,
  GelatoOrderResponse,
  GelatoFulfillmentStatus,
  GelatoQuoteRequest,
  GelatoQuoteResponse,
  GelatoQuote,
  GelatoError,
} from './types'
export { GELATO_PRODUCT_MAPPING } from './types'
