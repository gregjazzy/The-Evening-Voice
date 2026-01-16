/**
 * Client API Gelato pour l'impression de livres
 * Documentation: https://dashboard.gelato.com/docs/
 */

import type {
  GelatoOrderRequest,
  GelatoOrderResponse,
  GelatoQuoteRequest,
  GelatoQuoteResponse,
  GelatoError,
  GelatoFulfillmentStatus,
} from './types'

// ============================================================================
// CONFIGURATION
// ============================================================================

const GELATO_API_BASE = 'https://order.gelatoapis.com/v4'
const GELATO_PRODUCT_API = 'https://product.gelatoapis.com/v3'

// ============================================================================
// CLIENT CLASS
// ============================================================================

export class GelatoClient {
  private apiKey: string
  private isTestMode: boolean

  constructor(apiKey: string, isTestMode = false) {
    this.apiKey = apiKey
    this.isTestMode = isTestMode
  }

  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(`Gelato API Error: ${error.message || response.statusText}`)
    }

    return response.json()
  }

  // ==========================================================================
  // QUOTES / DEVIS
  // ==========================================================================

  /**
   * Obtenir un devis pour un livre
   */
  async getQuote(request: GelatoQuoteRequest): Promise<GelatoQuoteResponse> {
    return this.request<GelatoQuoteResponse>(`${GELATO_API_BASE}/quotes`, {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Obtenir le prix d'un produit spécifique
   */
  async getProductPrice(
    productUid: string,
    country: string,
    currency = 'EUR'
  ): Promise<{ price: number; currency: string }> {
    const url = `${GELATO_PRODUCT_API}/products/${productUid}/prices?country=${country}&currency=${currency}`
    const response = await this.request<{ prices: Array<{ price: number; currency: string }> }>(url)
    
    if (response.prices && response.prices.length > 0) {
      return response.prices[0]
    }
    
    throw new Error('No price found for this product')
  }

  // ==========================================================================
  // ORDERS / COMMANDES
  // ==========================================================================

  /**
   * Créer une commande
   */
  async createOrder(request: GelatoOrderRequest): Promise<GelatoOrderResponse> {
    // En mode test, on crée un draft au lieu d'une vraie commande
    const orderRequest = this.isTestMode
      ? { ...request, orderType: 'draft' as const }
      : request

    return this.request<GelatoOrderResponse>(`${GELATO_API_BASE}/orders`, {
      method: 'POST',
      body: JSON.stringify(orderRequest),
    })
  }

  /**
   * Récupérer le statut d'une commande
   */
  async getOrder(orderId: string): Promise<GelatoOrderResponse> {
    return this.request<GelatoOrderResponse>(`${GELATO_API_BASE}/orders/${orderId}`)
  }

  /**
   * Annuler une commande (si possible)
   */
  async cancelOrder(orderId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`${GELATO_API_BASE}/orders/${orderId}/cancel`, {
      method: 'POST',
    })
  }

  // ==========================================================================
  // PRODUCTS / CATALOGUE
  // ==========================================================================

  /**
   * Vérifier si un produit existe et est disponible
   */
  async checkProduct(productUid: string): Promise<boolean> {
    try {
      await this.request(`${GELATO_PRODUCT_API}/products/${productUid}`)
      return true
    } catch {
      return false
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Traduire le statut Gelato en français
 */
export function translateFulfillmentStatus(status: GelatoFulfillmentStatus): string {
  const translations: Record<GelatoFulfillmentStatus, string> = {
    created: 'Commande créée',
    passed_to_production: 'En cours de traitement',
    in_production: 'En production',
    shipped: 'Expédié',
    delivered: 'Livré',
    canceled: 'Annulé',
    failed: 'Échec',
  }
  return translations[status] || status
}

/**
 * Obtenir l'emoji pour un statut
 */
export function getStatusEmoji(status: GelatoFulfillmentStatus): string {
  const emojis: Record<GelatoFulfillmentStatus, string> = {
    created: '📝',
    passed_to_production: '⏳',
    in_production: '🏭',
    shipped: '📦',
    delivered: '✅',
    canceled: '❌',
    failed: '⚠️',
  }
  return emojis[status] || '❓'
}

/**
 * Générer un ID de référence unique pour une commande
 */
export function generateOrderReference(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `LVDS-${timestamp}-${random}`.toUpperCase()
}
