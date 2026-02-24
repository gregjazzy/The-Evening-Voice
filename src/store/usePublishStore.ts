import { create } from 'zustand'
import type { Story } from './useAppStore'
import { exportToPDF, checkImageQuality, type ImageQualityResult } from '@/lib/export/pdf'
import type { GelatoPaperType, GelatoLamination } from '@/lib/gelato'
import { GELATO_PAPER_OPTIONS, GELATO_LAMINATION_OPTIONS } from '@/lib/gelato'

// ============================================================================
// FORMATS DE LIVRE DISPONIBLES
// ============================================================================

export type BookFormat =
  | 'square-21'      // Carré 20x20 cm (Gelato 8x8") - Idéal livres enfants
  | 'square-18'      // Carré 28x28 cm (Gelato 11x11") - Grand format
  | 'portrait-a5'    // Portrait 21x28 cm (Gelato 8x11")
  | 'portrait-a4'    // Portrait 21x28 cm (alias, même produit Gelato que portrait-a5)
  | 'landscape-a5'   // Paysage 28x21 cm (Gelato 8x11" horizontal)

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
    name: 'Square 20cm',
    nameFr: 'Carré 20cm (8×8")',
    widthMm: 200,
    heightMm: 200,
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
    name: 'Square 28cm',
    nameFr: 'Carré 28cm (11×11")',
    widthMm: 280,
    heightMm: 280,
    bleedMm: 3,
    safeZoneMm: 5,
    spineMarginMm: 10,
    minPages: 20,
    maxPages: 80,
    priceEstimate: '20-35€',
    recommended: false,
    icon: '📗',
  },
  {
    id: 'portrait-a5',
    name: 'Portrait 21×28cm',
    nameFr: 'Portrait 21×28cm (8×11")',
    widthMm: 210,
    heightMm: 280,
    bleedMm: 3,
    safeZoneMm: 5,
    spineMarginMm: 12,
    minPages: 24,
    maxPages: 200,
    priceEstimate: '15-25€',
    recommended: false,
    icon: '📘',
  },
  {
    id: 'landscape-a5',
    name: 'Landscape 28×21cm',
    nameFr: 'Paysage 28×21cm (11×8")',
    widthMm: 280,
    heightMm: 210,
    bleedMm: 3,
    safeZoneMm: 5,
    spineMarginMm: 12,
    minPages: 24,
    maxPages: 100,
    priceEstimate: '15-25€',
    recommended: false,
    icon: '📓',
  },
]

/**
 * Find a BookFormatConfig by format ID, handling aliases
 * (e.g. 'portrait-a4' → 'portrait-a5', same Gelato product).
 * Always returns a valid config (falls back to first format).
 */
export function findBookFormat(formatId: BookFormat | string): BookFormatConfig {
  const resolved = formatId === 'portrait-a4' ? 'portrait-a5' : formatId
  return BOOK_FORMATS.find(f => f.id === resolved) || BOOK_FORMATS[0]
}

// ============================================================================
// TYPES DE COUVERTURE
// ============================================================================

export type CoverType = 'hardcover' | 'softcover'

export interface CoverConfig {
  type: CoverType
  nameFr: string
  nameEn: string
  priceMultiplier: number
  icon: string
}

export const COVER_TYPES: CoverConfig[] = [
  {
    type: 'hardcover',
    nameFr: 'Couverture rigide',
    nameEn: 'Hardcover',
    priceMultiplier: 1.5,
    icon: '📚',
  },
  {
    type: 'softcover',
    nameFr: 'Couverture souple',
    nameEn: 'Softcover',
    priceMultiplier: 1,
    icon: '📖',
  },
]

// Re-export Gelato options for convenience
export { GELATO_PAPER_OPTIONS, GELATO_LAMINATION_OPTIONS } from '@/lib/gelato'
export type { GelatoPaperType, GelatoLamination } from '@/lib/gelato'

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

export type PublishStep = 'shop-home' | 'select-story' | 'choose-format' | 'quality-check' | 'order'

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
  
  // Options papier & finition (Gelato)
  paperType: GelatoPaperType
  setPaperType: (paper: GelatoPaperType) => void
  lamination: GelatoLamination
  setLamination: (lamination: GelatoLamination) => void
  
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
  pdfFilePath: string | null  // Chemin du fichier sur Supabase
  isUploadingPdf: boolean
  uploadPdfProgress: number
  exportToPdf: (story: Story, format: BookFormatConfig, cover: BookCover) => Promise<string | null>
  uploadPdfToSupabase: (pdfBlob: Blob, story: Story, userId: string) => Promise<string | null>
  
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
  currentStep: 'shop-home',
  selectedStory: null,
  selectedFormat: 'square-21',
  coverType: 'softcover',
  paperType: '170-gsm-coated-silk' as GelatoPaperType,
  lamination: 'matt-lamination' as GelatoLamination,
  cover: DEFAULT_COVER,
  qualityChecks: [],
  imageQualityInfos: [],
  isCheckingQuality: false,
  isExporting: false,
  exportProgress: 0,
  pdfUrl: null,
  pdfFilePath: null,
  isUploadingPdf: false,
  uploadPdfProgress: 0,
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
    // Pré-remplir le format depuis l'histoire si disponible
    selectedFormat: story?.bookFormat || 'square-21',
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
  
  setPaperType: (paper) => {
    set({ paperType: paper })
    get().calculatePrice()
  },

  setLamination: (lam) => {
    set({ lamination: lam })
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
    
    // 3. Vérifier la résolution des images (VRAIE vérification DPI)
    let lowDpiCount = 0
    for (const [pageIndex, page] of story.pages.entries()) {
      // Vérifier les images sur la page
      if (page.images) {
        for (const img of page.images) {
          try {
            // Calculer la taille d'impression de l'image
            const printWidthMm = (format.widthMm * (img.position.width / 100))
            const printHeightMm = (format.heightMm * (img.position.height / 100))
            
            // Vérifier la qualité de l'image
            const quality = await checkImageQuality(
              img.url,
              printWidthMm,
              printHeightMm
            )
            
            imageInfos.push({
              pageIndex,
              imageId: img.id,
              url: img.url,
              currentDpi: quality.currentDpi,
              requiredDpi: 300,
              isOk: quality.isOk,
              widthPx: quality.widthPx,
              heightPx: quality.heightPx,
              printWidthMm,
              printHeightMm,
            })
            
            if (!quality.isOk) {
              lowDpiCount++
            }
          } catch (error) {
            console.warn(`Impossible de vérifier l'image ${img.id}:`, error)
            imageInfos.push({
              pageIndex,
              imageId: img.id,
              url: img.url,
              currentDpi: null,
              requiredDpi: 300,
              isOk: true, // Optimiste si on ne peut pas vérifier
            })
          }
        }
      }
      
      // Vérifier le fond de page
      if (page.backgroundMedia?.url) {
        try {
          const quality = await checkImageQuality(
            page.backgroundMedia.url,
            format.widthMm,
            format.heightMm
          )
          
          if (!quality.isOk) {
            lowDpiCount++
            imageInfos.push({
              pageIndex,
              imageId: `bg-${pageIndex}`,
              url: page.backgroundMedia.url,
              currentDpi: quality.currentDpi,
              requiredDpi: 300,
              isOk: false,
              widthPx: quality.widthPx,
              heightPx: quality.heightPx,
              printWidthMm: format.widthMm,
              printHeightMm: format.heightMm,
            })
          }
        } catch (error) {
          console.warn(`Impossible de vérifier le fond de page ${pageIndex}:`, error)
        }
      }
    }
    
    // Ajouter le résultat de la vérification DPI
    if (lowDpiCount > 0) {
      checks.push({
        id: 'low-dpi',
        type: 'warning',
        message: `${lowDpiCount} image(s) en basse résolution (< 300 DPI)`,
      })
    } else if (imageInfos.length > 0) {
      checks.push({
        id: 'dpi-ok',
        type: 'success',
        message: `${imageInfos.length} image(s) vérifiée(s) - Qualité OK`,
      })
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
    set({ isExporting: true, exportProgress: 0, pdfUrl: null, pdfFilePath: null })
    
    try {
      const result = await exportToPDF(story, format, cover, {
        onProgress: (progress) => {
          // La génération PDF utilise 70% de la barre de progression
          set({ exportProgress: Math.round(progress * 0.7) })
        },
        includeBleed: true, // Avec fond perdu pour impression pro
      })
      
      set({ exportProgress: 70 })
      console.log(`✅ PDF généré: ${result.pageCount} pages, ${Math.round(result.fileSize / 1024)}KB`)
      
      // Créer un URL local temporaire pour le téléchargement direct
      set({ pdfUrl: result.url, isExporting: false, exportProgress: 100 })
      
      return result.url
    } catch (error) {
      console.error('Erreur export PDF:', error)
      set({ isExporting: false, exportProgress: 0 })
      return null
    }
  },
  
  uploadPdfToSupabase: async (pdfBlob: Blob, story: Story, userId: string) => {
    set({ isUploadingPdf: true, uploadPdfProgress: 0 })
    
    try {
      const formData = new FormData()
      formData.append('file', pdfBlob, `${story.title || 'livre'}.pdf`)
      formData.append('userId', userId)
      formData.append('storyId', story.id)
      formData.append('storyTitle', story.title || 'livre')
      
      set({ uploadPdfProgress: 30 })
      
      const response = await fetch('/api/upload/pdf', {
        method: 'POST',
        body: formData,
      })
      
      set({ uploadPdfProgress: 80 })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur upload PDF')
      }
      
      const result = await response.json()
      
      set({ 
        pdfUrl: result.pdfUrl,
        pdfFilePath: result.filePath,
        isUploadingPdf: false,
        uploadPdfProgress: 100,
      })
      
      console.log(`✅ PDF uploadé: ${result.pdfUrl}`)
      return result.pdfUrl
      
    } catch (error) {
      console.error('Erreur upload PDF:', error)
      set({ isUploadingPdf: false, uploadPdfProgress: 0 })
      return null
    }
  },
  
  calculatePrice: () => {
    const { selectedStory, selectedFormat, coverType, paperType } = get()

    if (!selectedStory) {
      set({ estimatedPrice: null })
      return
    }

    const format = findBookFormat(selectedFormat)
    const coverConfig = COVER_TYPES.find(c => c.type === coverType)
    const paperOption = GELATO_PAPER_OPTIONS.find(p => p.id === paperType)

    if (!format || !coverConfig || !paperOption) {
      set({ estimatedPrice: null })
      return
    }

    // Multiplicateur papier basé sur le grammage
    const paperMultiplier = paperOption.weightGsm >= 200 ? 1.3 : 1

    // Base price calculation (simplified)
    const pageCount = selectedStory.pages.length
    const basePricePerPage = 0.5 // €0.50 par page
    const basePrice = 5 // Prix de base

    const price = (
      basePrice +
      (pageCount * basePricePerPage) *
      coverConfig.priceMultiplier *
      paperMultiplier
    )

    set({ estimatedPrice: Math.round(price * 100) / 100 })
  },
  
  // Gelato Quote
  fetchGelatoQuote: async () => {
    const { selectedStory, selectedFormat, coverType, paperType, lamination } = get()

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
          paperType,
          lamination,
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
    const { selectedStory, selectedFormat, coverType, paperType, lamination, shippingAddress, pdfUrl } = get()
    
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
          paperType,
          lamination,
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
    currentStep: 'shop-home',
    selectedStory: null,
    selectedFormat: 'square-21',
    coverType: 'softcover',
    paperType: '170-gsm-coated-silk' as GelatoPaperType,
    lamination: 'matt-lamination' as GelatoLamination,
    cover: DEFAULT_COVER,
    qualityChecks: [],
    imageQualityInfos: [],
    isCheckingQuality: false,
    isExporting: false,
    exportProgress: 0,
    pdfUrl: null,
    pdfFilePath: null,
    isUploadingPdf: false,
    uploadPdfProgress: 0,
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
