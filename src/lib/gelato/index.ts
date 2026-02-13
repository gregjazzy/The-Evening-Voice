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
  GelatoPaperType,
  GelatoLamination,
  GelatoCoverType,
  GelatoPaperOption,
  GelatoLaminationOption,
} from './types'
export {
  GELATO_PRODUCT_MAPPING,
  GELATO_PAPER_OPTIONS,
  GELATO_LAMINATION_OPTIONS,
  buildGelatoProductUid,
} from './types'
