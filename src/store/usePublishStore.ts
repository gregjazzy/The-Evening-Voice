import { create } from 'zustand'
import type { Story } from './useAppStore'

// ============================================================================
// FORMATS DE LIVRE DISPONIBLES
// ============================================================================

export type BookFormat = 
  | 'square-21'      // Carré 21x21 cm - Idéal livres enfants
  | 'square-18'      // Carré 18x18 cm - Compact
  | 'portrait-a5'    // A5 Portrait (14.8x21 cm)
  | 'portrait-a4'    // A4 Portrait (21x29.7 cm)
  | 'landscape-a5'   // A5 Paysage (21x14.8 cm)

export interface BookFormatConfig {
  id: BookFormat
  name: string
  nameFr: string
  widthMm: number
  heightMm: number
  bleedMm: number           // Fond perdu (généralement 3mm)
  safeZoneMm: number        // Zone de sécurité intérieure (généralement 5mm)
  spineMarginMm: number     // Marge côté reliure (plus grande)
  minPages: number          // Minimum de pages
  maxPages: number          // Maximum de pages
  priceEstimate: string     // Estimation prix
  recommended: boolean      // Format recommandé
  icon: string              // Emoji
}

export const BOOK_FORMATS: BookFormatConfig[] = [
  {
    id: 'square-21',
    name: 'Square 21cm',
    nameFr: 'Carré 21cm',
    widthMm: 210,
    heightMm: 210,
    bleedMm: 3,
    safeZoneMm: 5,
    spineMarginMm: 10,
    minPages: 20,
    maxPages: 120,
    priceEstimate: '15-25€',
    recommended: true,
    icon: '📕',
  },
  {
    id: 'square-18',
    name: 'Square 18cm',
    nameFr: 'Carré 18cm',
    widthMm: 180,
    heightMm: 180,
    bleedMm: 3,
    safeZoneMm: 5,
    spineMarginMm: 10,
    minPages: 20,
    maxPages: 80,
    priceEstimate: '12-20€',
    recommended: false,
    icon: '📗',
  },
  {
    id: 'portrait-a5',
    name: 'A5 Portrait',
    nameFr: 'A5 Portrait',
    widthMm: 148,
    heightMm: 210,
    bleedMm: 3,
    safeZoneMm: 5,
    spineMarginMm: 12,
    minPages: 24,
    maxPages: 200,
    priceEstimate: '10-18€',
    recommended: false,
    icon: '📘',
  },
  {
    id: 'portrait-a4',
    name: 'A4 Portrait',
    nameFr: 'A4 Portrait',
    widthMm: 210,
    heightMm: 297,
    bleedMm: 3,
    safeZoneMm: 5,
    spineMarginMm: 15,
    minPages: 20,
    maxPages: 100,
    priceEstimate: '20-35€',
    recommended: false,
    icon: '📙',
  },
  {
    id: 'landscape-a5',
    name: 'A5 Landscape',
    nameFr: 'A5 Paysage',
    widthMm: 210,
    heightMm: 148,
    bleedMm: 3,
    safeZoneMm: 5,
    spineMarginMm: 12,
    minPages: 24,
    maxPages: 100,
    priceEstimate: '12-22€',
    recommended: false,
    icon: '📓',
  },
]

// ============================================================================
// TYPES DE COUVERTURE
// ============================================================================

export type CoverType = 'hardcover' | 'softcover'

export interface CoverConfig {
  type: CoverType
  nameFr: string
  priceMultiplier: number
  icon: string
}

export const COVER_TYPES: CoverConfig[] = [
  {
    type: 'hardcover',
    nameFr: 'Couverture rigide',
    priceMultiplier: 1.5,
    icon: '📚',
  },
  {
    type: 'softcover',
    nameFr: 'Couverture souple',
    priceMultiplier: 1,
    icon: '📖',
  },
]

// ============================================================================
// QUALITÉ D'IMPRESSION
// ============================================================================

export interface PrintQuality {
  id: 'standard' | 'premium'
  nameFr: string
  dpi: number
  paper: string
  priceMultiplier: number
}

export const PRINT_QUALITIES: PrintQuality[] = [
  {
    id: 'standard',
    nameFr: 'Standard',
    dpi: 300,
    paper: 'Papier mat 150g',
    priceMultiplier: 1,
  },
  {
    id: 'premium',
    nameFr: 'Premium',
    dpi: 300,
    paper: 'Papier satiné 200g',
    priceMultiplier: 1.3,
  },
]

// ============================================================================
// ÉTAT DE VÉRIFICATION QUALITÉ
// ============================================================================

export interface QualityCheck {
  id: string
  type: 'error' | 'warning' | 'success'
  message: string
  page?: number
  element?: string
}

export interface ImageQualityInfo {
  pageIndex: number
  imageId: string
  url: string
  currentDpi: number | null  // null si non calculable
  requiredDpi: number
  isOk: boolean
  widthPx?: number
  heightPx?: number
  printWidthMm?: number
  printHeightMm?: number
}

// ============================================================================
// COUVERTURE DU LIVRE
// ============================================================================

export interface BookCover {
  // Première de couverture
  frontTitle: string
  frontSubtitle?: string
  frontImage?: string
  frontBackgroundColor: string
  
  // Quatrième de couverture (dos)
  backText?: string
  backImage?: string
  backBackgroundColor: string
  
  // Dos du livre (tranche)
  spineText?: string
  spineBackgroundColor: string
  
  // Auteur
  authorName: string
}

// ============================================================================
// GELATO QUOTE
// ============================================================================

export interface GelatoQuoteResult {
  productPrice: number
  shippingPrice: number
  totalPrice: number
  currency: string
  estimatedDelivery: {
    min: number
    max: number
  }
  fulfillmentCountry: string
}

// ============================================================================
// SHIPPING ADDRESS
// ============================================================================

export interface ShippingAddress {
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string
  city: string
  postCode: string
  state?: string
  country: string
  email: string
  phone?: string
}

// ============================================================================
// ÉTAT DU STORE
// ============================================================================

export type PublishStep = 'select-story' | 'choose-format' | 'design-cover' | 'preview' | 'quality-check' | 'order'

interface PublishState {
  // Étape courante
  currentStep: PublishStep
  setCurrentStep: (step: PublishStep) => void
  
  // Histoire sélectionnée
  selectedStory: Story | null
  setSelectedStory: (story: Story | null) => void
  
  // Format choisi
  selectedFormat: BookFormat
  setSelectedFormat: (format: BookFormat) => void
  
  // Type de couverture
  coverType: CoverType
  setCoverType: (type: CoverType) => void
  
  // Qualité d'impression
  printQuality: 'standard' | 'premium'
  setPrintQuality: (quality: 'standard' | 'premium') => void
  
  // Design de couverture
  cover: BookCover
  updateCover: (updates: Partial<BookCover>) => void
  
  // Vérifications qualité
  qualityChecks: QualityCheck[]
  imageQualityInfos: ImageQualityInfo[]
  isCheckingQuality: boolean
  runQualityCheck: (story: Story, format: BookFormatConfig) => Promise<void>
  
  // Export PDF
  isExporting: boolean
  exportProgress: number
  pdfUrl: string | null
  exportToPdf: (story: Story, format: BookFormatConfig, cover: BookCover) => Promise<string | null>
  
  // Prix estimé (local)
  estimatedPrice: number | null
  calculatePrice: () => void
  
  // Gelato Quote (prix réels)
  gelatoQuote: GelatoQuoteResult | null
  isLoadingQuote: boolean
  quoteError: string | null
  fetchGelatoQuote: () => Promise<void>
  
  // Adresse de livraison
  shippingAddress: ShippingAddress
  updateShippingAddress: (updates: Partial<ShippingAddress>) => void
  
  // Commande Gelato
  isOrdering: boolean
  orderResult: { id: string; referenceId: string; status: string } | null
  orderError: string | null
  placeGelatoOrder: () => Promise<boolean>
  
  // Reset
  reset: () => void
}

const DEFAULT_COVER: BookCover = {
  frontTitle: '',
  frontSubtitle: '',
  frontImage: undefined,
  frontBackgroundColor: '#1a1a2e',
  backText: '',
  backImage: undefined,
  backBackgroundColor: '#1a1a2e',
  spineText: '',
  spineBackgroundColor: '#1a1a2e',
  authorName: '',
}

const DEFAULT_SHIPPING_ADDRESS: ShippingAddress = {
  firstName: '',
  lastName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  postCode: '',
  state: '',
  country: 'FR',
  email: '',
  phone: '',
}

export const usePublishStore = create<PublishState>((set, get) => ({
  // État initial
  currentStep: 'select-story',
  selectedStory: null,
  selectedFormat: 'square-21',
  coverType: 'softcover',
  printQuality: 'standard',
  cover: DEFAULT_COVER,
  qualityChecks: [],
  imageQualityInfos: [],
  isCheckingQuality: false,
  isExporting: false,
  exportProgress: 0,
  pdfUrl: null,
  estimatedPrice: null,
  gelatoQuote: null,
  isLoadingQuote: false,
  quoteError: null,
  shippingAddress: DEFAULT_SHIPPING_ADDRESS,
  isOrdering: false,
  orderResult: null,
  orderError: null,
  
  // Actions
  setCurrentStep: (step) => set({ currentStep: step }),
  
  setSelectedStory: (story) => set({ 
    selectedStory: story,
    cover: story ? {
      ...DEFAULT_COVER,
      frontTitle: story.title,
    } : DEFAULT_COVER,
  }),
  
  setSelectedFormat: (format) => {
    set({ selectedFormat: format })
    get().calculatePrice()
  },
  
  setCoverType: (type) => {
    set({ coverType: type })
    get().calculatePrice()
  },
  
  setPrintQuality: (quality) => {
    set({ printQuality: quality })
    get().calculatePrice()
  },
  
  updateCover: (updates) => set((state) => ({
    cover: { ...state.cover, ...updates },
  })),
  
  runQualityCheck: async (story, format) => {
    set({ isCheckingQuality: true, qualityChecks: [], imageQualityInfos: [] })
    
    const checks: QualityCheck[] = []
    const imageInfos: ImageQualityInfo[] = []
    
    // 1. Vérifier le nombre de pages
    const pageCount = story.pages.length
    if (pageCount < format.minPages) {
      checks.push({
        id: 'min-pages',
        type: 'error',
        message: `Minimum ${format.minPages} pages requis (actuellement ${pageCount})`,
      })
    } else if (pageCount > format.maxPages) {
      checks.push({
        id: 'max-pages',
        type: 'error',
        message: `Maximum ${format.maxPages} pages (actuellement ${pageCount})`,
      })
    } else {
      checks.push({
        id: 'page-count',
        type: 'success',
        message: `${pageCount} pages - OK`,
      })
    }
    
    // 2. Vérifier que chaque page a du contenu
    story.pages.forEach((page, index) => {
      const hasText = page.content && page.content.trim().length > 0
      const hasImages = page.images && page.images.length > 0
      const hasBackground = !!page.backgroundMedia
      
      if (!hasText && !hasImages && !hasBackground) {
        checks.push({
          id: `empty-page-${index}`,
          type: 'warning',
          message: `Page ${index + 1} est vide`,
          page: index + 1,
        })
      }
    })
    
    // 3. Vérifier la résolution des images (simulation - en vrai il faudrait charger les images)
    for (const [pageIndex, page] of story.pages.entries()) {
      if (page.images) {
        for (const img of page.images) {
          // Pour l'instant on met un placeholder - en vrai on chargerait l'image
          imageInfos.push({
            pageIndex,
            imageId: img.id,
            url: img.url,
            currentDpi: null, // Sera calculé lors du chargement réel
            requiredDpi: 300,
            isOk: true, // Optimiste par défaut
          })
        }
      }
    }
    
    // 4. Vérifier le titre
    if (!story.title || story.title.trim().length === 0) {
      checks.push({
        id: 'no-title',
        type: 'error',
        message: 'Le livre n\'a pas de titre',
      })
    } else {
      checks.push({
        id: 'title-ok',
        type: 'success',
        message: `Titre: "${story.title}"`,
      })
    }
    
    // Finaliser
    const hasErrors = checks.some(c => c.type === 'error')
    const hasWarnings = checks.some(c => c.type === 'warning')
    
    if (!hasErrors && !hasWarnings) {
      checks.push({
        id: 'all-good',
        type: 'success',
        message: '✨ Tout est prêt pour l\'impression !',
      })
    }
    
    set({ 
      qualityChecks: checks, 
      imageQualityInfos: imageInfos,
      isCheckingQuality: false,
    })
  },
  
  exportToPdf: async (story, format, cover) => {
    set({ isExporting: true, exportProgress: 0 })
    
    try {
      // Simulation de l'export (sera remplacé par le vrai export)
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(r => setTimeout(r, 200))
        set({ exportProgress: i })
      }
      
      // TODO: Implémenter le vrai export PDF avec jsPDF ou react-pdf
      const mockPdfUrl = '#'
      
      set({ pdfUrl: mockPdfUrl, isExporting: false, exportProgress: 100 })
      return mockPdfUrl
    } catch (error) {
      console.error('Erreur export PDF:', error)
      set({ isExporting: false, exportProgress: 0 })
      return null
    }
  },
  
  calculatePrice: () => {
    const { selectedStory, selectedFormat, coverType, printQuality } = get()
    
    if (!selectedStory) {
      set({ estimatedPrice: null })
      return
    }
    
    const format = BOOK_FORMATS.find(f => f.id === selectedFormat)
    const coverConfig = COVER_TYPES.find(c => c.type === coverType)
    const qualityConfig = PRINT_QUALITIES.find(q => q.id === printQuality)
    
    if (!format || !coverConfig || !qualityConfig) {
      set({ estimatedPrice: null })
      return
    }
    
    // Base price calculation (simplified)
    const pageCount = selectedStory.pages.length
    const basePricePerPage = 0.5 // €0.50 par page
    const basePrice = 5 // Prix de base
    
    const price = (
      basePrice +
      (pageCount * basePricePerPage) *
      coverConfig.priceMultiplier *
      qualityConfig.priceMultiplier
    )
    
    set({ estimatedPrice: Math.round(price * 100) / 100 })
  },
  
  // Gelato Quote
  fetchGelatoQuote: async () => {
    const { selectedStory, selectedFormat, coverType } = get()
    
    if (!selectedStory) {
      set({ quoteError: 'Aucune histoire sélectionnée' })
      return
    }
    
    set({ isLoadingQuote: true, quoteError: null })
    
    try {
      const response = await fetch('/api/gelato/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: selectedFormat,
          coverType,
          pageCount: selectedStory.pages.length,
          country: get().shippingAddress.country || 'FR',
          currency: 'EUR',
        }),
      })
      
      const data = await response.json()
      
      if (data.success && data.quote) {
        set({ 
          gelatoQuote: data.quote,
          isLoadingQuote: false,
        })
      } else {
        set({ 
          quoteError: data.error || 'Impossible d\'obtenir le devis',
          isLoadingQuote: false,
        })
      }
    } catch (error) {
      set({ 
        quoteError: error instanceof Error ? error.message : 'Erreur réseau',
        isLoadingQuote: false,
      })
    }
  },
  
  // Shipping address
  updateShippingAddress: (updates) => set((state) => ({
    shippingAddress: { ...state.shippingAddress, ...updates },
  })),
  
  // Gelato Order
  placeGelatoOrder: async () => {
    const { selectedStory, selectedFormat, coverType, shippingAddress, pdfUrl } = get()
    
    if (!selectedStory || !pdfUrl) {
      set({ orderError: 'PDF requis pour commander' })
      return false
    }
    
    // Valider l'adresse
    if (!shippingAddress.firstName || !shippingAddress.lastName || 
        !shippingAddress.addressLine1 || !shippingAddress.city || 
        !shippingAddress.postCode || !shippingAddress.email) {
      set({ orderError: 'Adresse de livraison incomplète' })
      return false
    }
    
    set({ isOrdering: true, orderError: null })
    
    try {
      const response = await fetch('/api/gelato/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: selectedFormat,
          coverType,
          pageCount: selectedStory.pages.length,
          pdfUrl,
          shippingAddress,
          customerEmail: shippingAddress.email,
        }),
      })
      
      const data = await response.json()
      
      if (data.success && data.order) {
        set({ 
          orderResult: data.order,
          isOrdering: false,
        })
        return true
      } else {
        set({ 
          orderError: data.error || 'Erreur lors de la commande',
          isOrdering: false,
        })
        return false
      }
    } catch (error) {
      set({ 
        orderError: error instanceof Error ? error.message : 'Erreur réseau',
        isOrdering: false,
      })
      return false
    }
  },
  
  reset: () => set({
    currentStep: 'select-story',
    selectedStory: null,
    selectedFormat: 'square-21',
    coverType: 'softcover',
    printQuality: 'standard',
    cover: DEFAULT_COVER,
    qualityChecks: [],
    imageQualityInfos: [],
    isCheckingQuality: false,
    isExporting: false,
    exportProgress: 0,
    pdfUrl: null,
    estimatedPrice: null,
    gelatoQuote: null,
    isLoadingQuote: false,
    quoteError: null,
    shippingAddress: DEFAULT_SHIPPING_ADDRESS,
    isOrdering: false,
    orderResult: null,
    orderError: null,
  }),
}))
