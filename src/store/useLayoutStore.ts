import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types pour le Layout
export interface TextBlock {
  id: string
  content: string
  x: number
  y: number
  width: number
  fontSize: number
  fontFamily: string
  color: string
  textAlign: 'left' | 'center' | 'right'
  opacity: number
  rotation: number
  shadow: boolean
}

// Keyframe pour animation d'opacité
export interface OpacityKeyframe {
  time: number      // Temps en secondes (relatif à la durée de la vidéo ou de la page)
  value: number     // Opacité 0-1
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

// Effets vidéo disponibles
export interface VideoEffects {
  opacityKeyframes: OpacityKeyframe[]   // Timeline d'opacité (fade in/out)
  playbackSpeed?: number                 // Vitesse de lecture (0.5 - 2)
  startOffset?: number                   // Début de la vidéo (en secondes)
  endOffset?: number                     // Fin de la vidéo (en secondes)
  loop?: boolean                         // Boucle
  muted?: boolean                        // Son coupé
}

export interface MediaLayer {
  id: string
  type: 'image' | 'video'
  url: string
  x: number
  y: number
  width: number
  height: number
  opacity: number                // Opacité de base (si pas de keyframes)
  zIndex: number
  // Nouveaux champs pour les vidéos
  name?: string                  // Nom du fichier/layer
  duration?: number              // Durée de la vidéo en secondes
  videoEffects?: VideoEffects    // Effets appliqués à la vidéo
}

export interface AudioTrack {
  id: string
  type: 'narration' | 'music' | 'ambient'
  url: string
  volume: number
  startTime: number
  duration: number
  loop: boolean
}

export interface BookPage {
  id: string
  pageNumber: number
  title: string
  backgroundImage?: string
  backgroundVideo?: string
  textBlocks: TextBlock[]
  mediaLayers: MediaLayer[]
  audioTracks: AudioTrack[]
  ambiance: string // Pour la domotique
  lightColor: string
  lightIntensity: number
  isSealed: boolean
  createdAt: Date
  sealedAt?: Date
}

export interface Book {
  id: string
  title: string
  author: string
  coverImage?: string
  pages: BookPage[]
  createdAt: Date
  completedAt?: Date
  isComplete: boolean
}

// Polices disponibles
export const luxuryFonts = [
  { id: 'cormorant', name: 'Cormorant Garamond', category: 'serif' },
  { id: 'playfair', name: 'Playfair Display', category: 'serif' },
  { id: 'cinzel', name: 'Cinzel', category: 'serif' },
  { id: 'dancing', name: 'Dancing Script', category: 'script' },
  { id: 'parisienne', name: 'Parisienne', category: 'script' },
  { id: 'great-vibes', name: 'Great Vibes', category: 'script' },
  { id: 'nunito', name: 'Nunito', category: 'sans-serif' },
  { id: 'quicksand', name: 'Quicksand', category: 'sans-serif' },
]

// Mapping ambiance -> couleurs lumière
export const ambianceLightMap: Record<string, { color: string; intensity: number }> = {
  jour: { color: '#FFE4B5', intensity: 80 },
  nuit: { color: '#1E3A5F', intensity: 40 },
  orage: { color: '#4A4A6A', intensity: 30 },
  brume: { color: '#B8C4CE', intensity: 50 },
  feerique: { color: '#E6B8FF', intensity: 60 },
  mystere: { color: '#2D1B4E', intensity: 35 },
  foret: { color: '#228B22', intensity: 45 },
  ocean: { color: '#006994', intensity: 55 },
  desert: { color: '#EDC9AF', intensity: 70 },
  espace: { color: '#0B0B3B', intensity: 25 },
}

interface LayoutState {
  // Livre en cours
  currentBook: Book | null
  currentPage: BookPage | null
  
  // Bibliothèque
  books: Book[]
  
  // État de l'éditeur
  selectedElement: string | null
  isDragging: boolean
  showGrid: boolean
  zoomLevel: number
  
  // Actions Livre
  createBook: (title: string, author: string) => void
  updateBook: (updates: Partial<Book>) => void
  completeBook: () => void
  deleteBook: (bookId: string) => void
  
  // Actions Page
  createPage: (title?: string) => void
  updatePage: (updates: Partial<BookPage>) => void
  sealPage: () => void
  deletePage: (pageId: string) => void
  setCurrentPage: (pageId: string) => void
  
  // Actions TextBlock
  addTextBlock: (content: string) => void
  updateTextBlock: (blockId: string, updates: Partial<TextBlock>) => void
  deleteTextBlock: (blockId: string) => void
  
  // Actions MediaLayer
  addMediaLayer: (type: 'image' | 'video', url: string, name?: string, duration?: number) => void
  updateMediaLayer: (layerId: string, updates: Partial<MediaLayer>) => void
  deleteMediaLayer: (layerId: string) => void
  
  // Actions Effets Vidéo
  addOpacityKeyframe: (layerId: string, keyframe: OpacityKeyframe) => void
  updateOpacityKeyframe: (layerId: string, keyframeIndex: number, updates: Partial<OpacityKeyframe>) => void
  deleteOpacityKeyframe: (layerId: string, keyframeIndex: number) => void
  setVideoEffects: (layerId: string, effects: Partial<VideoEffects>) => void
  
  // Actions Audio
  addAudioTrack: (type: AudioTrack['type'], url: string) => void
  updateAudioTrack: (trackId: string, updates: Partial<AudioTrack>) => void
  deleteAudioTrack: (trackId: string) => void
  
  // Actions UI
  setSelectedElement: (id: string | null) => void
  setIsDragging: (dragging: boolean) => void
  setShowGrid: (show: boolean) => void
  setZoomLevel: (level: number) => void
  
  // Import depuis Studio
  importFromStudio: (assetUrl: string, assetType: 'image' | 'video' | 'audio') => void
}

const generateId = () => Math.random().toString(36).substring(2, 15)

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      // État initial
      currentBook: null,
      currentPage: null,
      books: [],
      selectedElement: null,
      isDragging: false,
      showGrid: true,
      zoomLevel: 100,

      // === ACTIONS LIVRE ===
      createBook: (title, author) => {
        const newBook: Book = {
          id: generateId(),
          title,
          author,
          pages: [],
          createdAt: new Date(),
          isComplete: false,
        }
        set((state) => ({
          books: [...state.books, newBook],
          currentBook: newBook,
          currentPage: null,
        }))
      },

      updateBook: (updates) => {
        set((state) => {
          if (!state.currentBook) return state
          const updatedBook = { ...state.currentBook, ...updates }
          return {
            currentBook: updatedBook,
            books: state.books.map((b) => 
              b.id === updatedBook.id ? updatedBook : b
            ),
          }
        })
      },

      completeBook: () => {
        set((state) => {
          if (!state.currentBook) return state
          const completedBook = {
            ...state.currentBook,
            isComplete: true,
            completedAt: new Date(),
          }
          return {
            currentBook: completedBook,
            books: state.books.map((b) =>
              b.id === completedBook.id ? completedBook : b
            ),
          }
        })
      },

      deleteBook: (bookId) => {
        set((state) => ({
          books: state.books.filter((b) => b.id !== bookId),
          currentBook: state.currentBook?.id === bookId ? null : state.currentBook,
        }))
      },

      // === ACTIONS PAGE ===
      createPage: (title) => {
        const { currentBook } = get()
        if (!currentBook) return

        const newPage: BookPage = {
          id: generateId(),
          pageNumber: currentBook.pages.length + 1,
          title: title || `Page ${currentBook.pages.length + 1}`,
          textBlocks: [],
          mediaLayers: [],
          audioTracks: [],
          ambiance: 'jour',
          lightColor: '#FFE4B5',
          lightIntensity: 80,
          isSealed: false,
          createdAt: new Date(),
        }

        set((state) => {
          const updatedBook = {
            ...state.currentBook!,
            pages: [...state.currentBook!.pages, newPage],
          }
          return {
            currentBook: updatedBook,
            currentPage: newPage,
            books: state.books.map((b) =>
              b.id === updatedBook.id ? updatedBook : b
            ),
          }
        })
      },

      updatePage: (updates) => {
        set((state) => {
          if (!state.currentBook || !state.currentPage) return state
          
          // Si on change l'ambiance, mettre à jour les lumières
          let lightUpdates = {}
          if (updates.ambiance) {
            const lightSettings = ambianceLightMap[updates.ambiance]
            if (lightSettings) {
              lightUpdates = {
                lightColor: lightSettings.color,
                lightIntensity: lightSettings.intensity,
              }
            }
          }
          
          const updatedPage = { ...state.currentPage, ...updates, ...lightUpdates }
          const updatedPages = state.currentBook.pages.map((p) =>
            p.id === updatedPage.id ? updatedPage : p
          )
          const updatedBook = { ...state.currentBook, pages: updatedPages }
          
          return {
            currentPage: updatedPage,
            currentBook: updatedBook,
            books: state.books.map((b) =>
              b.id === updatedBook.id ? updatedBook : b
            ),
          }
        })
      },

      sealPage: () => {
        const { updatePage } = get()
        updatePage({ isSealed: true, sealedAt: new Date() })
      },

      deletePage: (pageId) => {
        set((state) => {
          if (!state.currentBook) return state
          const updatedPages = state.currentBook.pages.filter((p) => p.id !== pageId)
          // Renuméroter les pages
          updatedPages.forEach((p, i) => { p.pageNumber = i + 1 })
          const updatedBook = { ...state.currentBook, pages: updatedPages }
          return {
            currentBook: updatedBook,
            currentPage: state.currentPage?.id === pageId ? null : state.currentPage,
            books: state.books.map((b) =>
              b.id === updatedBook.id ? updatedBook : b
            ),
          }
        })
      },

      setCurrentPage: (pageId) => {
        const { currentBook } = get()
        if (!currentBook) return
        const page = currentBook.pages.find((p) => p.id === pageId)
        if (page) {
          set({ currentPage: page })
        }
      },

      // === ACTIONS TEXTBLOCK ===
      addTextBlock: (content) => {
        const { currentPage, updatePage } = get()
        if (!currentPage) return

        const newBlock: TextBlock = {
          id: generateId(),
          content,
          x: 50,
          y: 50,
          width: 300,
          fontSize: 24,
          fontFamily: 'Cormorant Garamond',
          color: '#FFFFFF',
          textAlign: 'center',
          opacity: 1,
          rotation: 0,
          shadow: true,
        }

        updatePage({
          textBlocks: [...currentPage.textBlocks, newBlock],
        })
        set({ selectedElement: newBlock.id })
      },

      updateTextBlock: (blockId, updates) => {
        const { currentPage, updatePage } = get()
        if (!currentPage) return

        const updatedBlocks = currentPage.textBlocks.map((b) =>
          b.id === blockId ? { ...b, ...updates } : b
        )
        updatePage({ textBlocks: updatedBlocks })
      },

      deleteTextBlock: (blockId) => {
        const { currentPage, updatePage } = get()
        if (!currentPage) return

        updatePage({
          textBlocks: currentPage.textBlocks.filter((b) => b.id !== blockId),
        })
        set({ selectedElement: null })
      },

      // === ACTIONS MEDIALAYER ===
      addMediaLayer: (type, url, name, duration) => {
        const { currentPage, updatePage } = get()
        if (!currentPage) return

        const newLayer: MediaLayer = {
          id: generateId(),
          type,
          url,
          name: name || `${type}-${Date.now()}`,
          x: 10,
          y: 10,
          width: 40,
          height: 40,
          opacity: 1,
          zIndex: currentPage.mediaLayers.length,
          ...(type === 'video' && {
            duration,
            videoEffects: {
              opacityKeyframes: [],
              playbackSpeed: 1,
              loop: true,
              muted: true,
            },
          }),
        }

        updatePage({
          mediaLayers: [...currentPage.mediaLayers, newLayer],
        })
        
        // Sélectionner automatiquement le nouveau layer
        set({ selectedElement: newLayer.id })
      },

      updateMediaLayer: (layerId, updates) => {
        const { currentPage, updatePage } = get()
        if (!currentPage) return

        const updatedLayers = currentPage.mediaLayers.map((l) =>
          l.id === layerId ? { ...l, ...updates } : l
        )
        updatePage({ mediaLayers: updatedLayers })
      },

      deleteMediaLayer: (layerId) => {
        const { currentPage, updatePage, selectedElement } = get()
        if (!currentPage) return

        updatePage({
          mediaLayers: currentPage.mediaLayers.filter((l) => l.id !== layerId),
        })
        
        // Désélectionner si c'était l'élément sélectionné
        if (selectedElement === layerId) {
          set({ selectedElement: null })
        }
      },

      // === ACTIONS EFFETS VIDÉO ===
      addOpacityKeyframe: (layerId, keyframe) => {
        const { currentPage, updatePage } = get()
        if (!currentPage) return

        const updatedLayers = currentPage.mediaLayers.map((l) => {
          if (l.id !== layerId || l.type !== 'video') return l
          
          const currentKeyframes = l.videoEffects?.opacityKeyframes || []
          // Trier les keyframes par temps
          const newKeyframes = [...currentKeyframes, keyframe].sort((a, b) => a.time - b.time)
          
          return {
            ...l,
            videoEffects: {
              ...l.videoEffects,
              opacityKeyframes: newKeyframes,
            },
          }
        })
        updatePage({ mediaLayers: updatedLayers })
      },

      updateOpacityKeyframe: (layerId, keyframeIndex, updates) => {
        const { currentPage, updatePage } = get()
        if (!currentPage) return

        const updatedLayers = currentPage.mediaLayers.map((l) => {
          if (l.id !== layerId || l.type !== 'video' || !l.videoEffects) return l
          
          const newKeyframes = [...l.videoEffects.opacityKeyframes]
          if (newKeyframes[keyframeIndex]) {
            newKeyframes[keyframeIndex] = { ...newKeyframes[keyframeIndex], ...updates }
          }
          // Re-trier si le temps a changé
          newKeyframes.sort((a, b) => a.time - b.time)
          
          return {
            ...l,
            videoEffects: {
              ...l.videoEffects,
              opacityKeyframes: newKeyframes,
            },
          }
        })
        updatePage({ mediaLayers: updatedLayers })
      },

      deleteOpacityKeyframe: (layerId, keyframeIndex) => {
        const { currentPage, updatePage } = get()
        if (!currentPage) return

        const updatedLayers = currentPage.mediaLayers.map((l) => {
          if (l.id !== layerId || l.type !== 'video' || !l.videoEffects) return l
          
          const newKeyframes = l.videoEffects.opacityKeyframes.filter((_, i) => i !== keyframeIndex)
          
          return {
            ...l,
            videoEffects: {
              ...l.videoEffects,
              opacityKeyframes: newKeyframes,
            },
          }
        })
        updatePage({ mediaLayers: updatedLayers })
      },

      setVideoEffects: (layerId, effects) => {
        const { currentPage, updatePage } = get()
        if (!currentPage) return

        const updatedLayers = currentPage.mediaLayers.map((l): MediaLayer => {
          if (l.id !== layerId || l.type !== 'video') return l
          
          // Assurer que opacityKeyframes a toujours une valeur
          const currentEffects = l.videoEffects || { opacityKeyframes: [] }
          const mergedEffects = {
            ...currentEffects,
            ...effects,
          }
          return {
            ...l,
            videoEffects: {
              ...mergedEffects,
              opacityKeyframes: mergedEffects.opacityKeyframes || [],
            },
          }
        })
        updatePage({ mediaLayers: updatedLayers })
      },

      // === ACTIONS AUDIO ===
      addAudioTrack: (type, url) => {
        const { currentPage, updatePage } = get()
        if (!currentPage) return

        const newTrack: AudioTrack = {
          id: generateId(),
          type,
          url,
          volume: type === 'music' ? 0.3 : type === 'ambient' ? 0.2 : 0.8,
          startTime: 0,
          duration: 0,
          loop: type !== 'narration',
        }

        updatePage({
          audioTracks: [...currentPage.audioTracks, newTrack],
        })
      },

      updateAudioTrack: (trackId, updates) => {
        const { currentPage, updatePage } = get()
        if (!currentPage) return

        const updatedTracks = currentPage.audioTracks.map((t) =>
          t.id === trackId ? { ...t, ...updates } : t
        )
        updatePage({ audioTracks: updatedTracks })
      },

      deleteAudioTrack: (trackId) => {
        const { currentPage, updatePage } = get()
        if (!currentPage) return

        updatePage({
          audioTracks: currentPage.audioTracks.filter((t) => t.id !== trackId),
        })
      },

      // === ACTIONS UI ===
      setSelectedElement: (id) => set({ selectedElement: id }),
      setIsDragging: (dragging) => set({ isDragging: dragging }),
      setShowGrid: (show) => set({ showGrid: show }),
      setZoomLevel: (level) => set({ zoomLevel: level }),

      // === IMPORT DEPUIS STUDIO ===
      importFromStudio: (assetUrl, assetType) => {
        const { currentPage, addMediaLayer, addAudioTrack, updatePage } = get()
        if (!currentPage) return

        if (assetType === 'image') {
          // Définir comme fond ou ajouter comme layer
          if (!currentPage.backgroundImage) {
            updatePage({ backgroundImage: assetUrl })
          } else {
            addMediaLayer('image', assetUrl)
          }
        } else if (assetType === 'video') {
          updatePage({ backgroundVideo: assetUrl })
        } else if (assetType === 'audio') {
          addAudioTrack('narration', assetUrl)
        }
      },
    }),
    {
      name: 'lavoixdusoir-layout',
      partialize: (state) => ({
        books: state.books,
      }),
    }
  )
)

