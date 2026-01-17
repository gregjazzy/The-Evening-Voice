/**
 * Store pour le système de guidage visuel
 * Permet à l'IA-Amie de faire clignoter/briller des éléments de l'interface
 * pour guider l'enfant
 */

import { create } from 'zustand'

// =============================================================================
// TYPES
// =============================================================================

export type HighlightableElement = 
  // Navigation
  | 'nav-ecriture'
  | 'nav-studio'
  | 'nav-montage'
  | 'nav-theatre'
  | 'nav-publier'
  // Écriture (BookMode)
  | 'book-add-image'
  | 'book-add-background'
  | 'book-decorations'
  | 'book-pages'
  | 'book-text-area'
  | 'book-save'
  | 'book-color'
  | 'book-lines'
  // Studio
  | 'studio-prompt-input'
  | 'studio-copy-button'
  | 'studio-import-zone'
  | 'studio-gallery'
  | 'studio-type-image'
  | 'studio-type-video'
  | 'studio-chat'
  | 'studio-guide'
  // Montage
  | 'montage-timeline'
  | 'montage-add-media'
  | 'montage-add-music'
  | 'montage-add-sound'
  | 'montage-add-effect'
  | 'montage-add-light'
  | 'montage-add-decoration'
  | 'montage-preview'
  | 'montage-narration'
  | 'montage-scenes'
  // Théâtre
  | 'theatre-play'
  | 'theatre-library'
  | 'theatre-lights'
  | 'theatre-export'
  // Publier
  | 'publish-format'
  | 'publish-cover'
  | 'publish-preview'
  | 'publish-order'

export interface HighlightConfig {
  elementId: HighlightableElement
  duration?: number // En millisecondes, défaut 5000
  color?: string // Couleur du glow, défaut doré
  intensity?: 'soft' | 'medium' | 'strong' // Intensité du clignotement
  message?: string // Message à afficher près de l'élément
}

interface HighlightState {
  // État
  activeHighlights: Map<HighlightableElement, HighlightConfig>
  highlightQueue: HighlightConfig[]
  
  // Actions
  highlight: (config: HighlightConfig | HighlightableElement) => void
  highlightMultiple: (configs: (HighlightConfig | HighlightableElement)[]) => void
  stopHighlight: (elementId: HighlightableElement) => void
  stopAllHighlights: () => void
  isHighlighted: (elementId: HighlightableElement) => boolean
  getHighlightConfig: (elementId: HighlightableElement) => HighlightConfig | undefined
}

// =============================================================================
// MAPPING ÉLÉMENTS → DESCRIPTIONS (pour l'IA)
// =============================================================================

export const ELEMENT_DESCRIPTIONS: Record<HighlightableElement, { 
  label: string
  description: string
  mode: string
}> = {
  // Navigation
  'nav-ecriture': { label: 'Écriture', description: 'Le mode pour écrire ton histoire', mode: 'navigation' },
  'nav-studio': { label: 'Studio', description: 'Le mode pour créer des images avec Midjourney', mode: 'navigation' },
  'nav-montage': { label: 'Montage', description: 'Le mode pour assembler ton histoire avec sons et musique', mode: 'navigation' },
  'nav-theatre': { label: 'Théâtre', description: 'Le mode pour regarder ton histoire terminée', mode: 'navigation' },
  'nav-publier': { label: 'Publier', description: 'Le mode pour imprimer ton livre', mode: 'navigation' },
  
  // Écriture
  'book-add-image': { label: 'Ajouter image', description: 'Le bouton pour ajouter une image sur ta page', mode: 'ecriture' },
  'book-add-background': { label: 'Fond de page', description: 'Le bouton pour changer le fond de ta page', mode: 'ecriture' },
  'book-decorations': { label: 'Décorations', description: 'Le bouton pour ajouter des étoiles, cœurs et autres décorations', mode: 'ecriture' },
  'book-pages': { label: 'Pages', description: 'Les flèches pour naviguer entre les pages', mode: 'ecriture' },
  'book-text-area': { label: 'Zone de texte', description: 'L\'endroit où tu écris ton histoire', mode: 'ecriture' },
  'book-save': { label: 'Sauvegarder', description: 'Le bouton pour sauvegarder ton travail', mode: 'ecriture' },
  'book-color': { label: 'Couleur livre', description: 'Le bouton pour changer la couleur de ton livre', mode: 'ecriture' },
  'book-lines': { label: 'Lignes', description: 'Le bouton pour afficher ou cacher les lignes', mode: 'ecriture' },
  
  // Studio
  'studio-prompt-input': { label: 'Zone de prompt', description: 'L\'endroit où tu décris l\'image que tu veux créer', mode: 'studio' },
  'studio-copy-button': { label: 'Copier', description: 'Le bouton pour copier ton prompt', mode: 'studio' },
  'studio-import-zone': { label: 'Zone d\'import', description: 'L\'endroit pour glisser tes images créées sur Midjourney', mode: 'studio' },
  'studio-gallery': { label: 'Galerie', description: 'L\'endroit où tu vois toutes tes images importées', mode: 'studio' },
  'studio-type-image': { label: 'Créer image', description: 'Le bouton pour créer une image', mode: 'studio' },
  'studio-type-video': { label: 'Créer vidéo', description: 'Le bouton pour créer une vidéo', mode: 'studio' },
  'studio-chat': { label: 'Chat IA', description: 'L\'endroit où tu parles avec moi pour avoir de l\'aide', mode: 'studio' },
  'studio-guide': { label: 'Guide', description: 'Les étapes à suivre pour créer ton image', mode: 'studio' },
  
  // Montage
  'montage-timeline': { label: 'Timeline', description: 'La ligne du temps où tu places tes éléments', mode: 'montage' },
  'montage-add-media': { label: 'Ajouter média', description: 'Le bouton pour ajouter une image ou vidéo', mode: 'montage' },
  'montage-add-music': { label: 'Ajouter musique', description: 'Le bouton pour ajouter de la musique de fond', mode: 'montage' },
  'montage-add-sound': { label: 'Ajouter son', description: 'Le bouton pour ajouter des effets sonores', mode: 'montage' },
  'montage-add-effect': { label: 'Ajouter effet', description: 'Le bouton pour ajouter des effets visuels magiques', mode: 'montage' },
  'montage-add-light': { label: 'Ajouter lumière', description: 'Le bouton pour contrôler les lumières de ta chambre', mode: 'montage' },
  'montage-add-decoration': { label: 'Ajouter décoration', description: 'Le bouton pour ajouter des décorations animées', mode: 'montage' },
  'montage-preview': { label: 'Aperçu', description: 'L\'écran où tu vois le résultat', mode: 'montage' },
  'montage-narration': { label: 'Narration', description: 'Le bouton pour ajouter la voix qui lit l\'histoire', mode: 'montage' },
  'montage-scenes': { label: 'Scènes', description: 'La liste de toutes les pages de ton histoire', mode: 'montage' },
  
  // Théâtre
  'theatre-play': { label: 'Lecture', description: 'Le bouton pour lancer ton histoire', mode: 'theatre' },
  'theatre-library': { label: 'Bibliothèque', description: 'La liste de toutes tes histoires terminées', mode: 'theatre' },
  'theatre-lights': { label: 'Lumières', description: 'Les contrôles pour les lumières connectées', mode: 'theatre' },
  'theatre-export': { label: 'Exporter', description: 'Le bouton pour télécharger ta vidéo', mode: 'theatre' },
  
  // Publier
  'publish-format': { label: 'Format', description: 'Le choix du format de ton livre imprimé', mode: 'publier' },
  'publish-cover': { label: 'Couverture', description: 'L\'endroit pour créer ta couverture', mode: 'publier' },
  'publish-preview': { label: 'Aperçu', description: 'L\'aperçu de ton livre avant impression', mode: 'publier' },
  'publish-order': { label: 'Commander', description: 'Le bouton pour commander ton livre imprimé', mode: 'publier' },
}

// =============================================================================
// STORE
// =============================================================================

export const useHighlightStore = create<HighlightState>((set, get) => ({
  activeHighlights: new Map(),
  highlightQueue: [],
  
  highlight: (configOrId) => {
    const config: HighlightConfig = typeof configOrId === 'string' 
      ? { elementId: configOrId }
      : configOrId
    
    const fullConfig: HighlightConfig = {
      duration: 5000,
      color: '#FFD700', // Doré par défaut
      intensity: 'medium',
      ...config,
    }
    
    set((state) => {
      const newHighlights = new Map(state.activeHighlights)
      newHighlights.set(fullConfig.elementId, fullConfig)
      return { activeHighlights: newHighlights }
    })
    
    // Auto-stop après la durée
    if (fullConfig.duration && fullConfig.duration > 0) {
      setTimeout(() => {
        get().stopHighlight(fullConfig.elementId)
      }, fullConfig.duration)
    }
  },
  
  highlightMultiple: (configs) => {
    configs.forEach((config, index) => {
      // Décaler légèrement chaque highlight pour un effet séquentiel
      setTimeout(() => {
        get().highlight(config)
      }, index * 200)
    })
  },
  
  stopHighlight: (elementId) => {
    set((state) => {
      const newHighlights = new Map(state.activeHighlights)
      newHighlights.delete(elementId)
      return { activeHighlights: newHighlights }
    })
  },
  
  stopAllHighlights: () => {
    set({ activeHighlights: new Map() })
  },
  
  isHighlighted: (elementId) => {
    return get().activeHighlights.has(elementId)
  },
  
  getHighlightConfig: (elementId) => {
    return get().activeHighlights.get(elementId)
  },
}))

// =============================================================================
// HELPER : Parser les commandes de highlight dans les réponses IA
// =============================================================================

/**
 * Parse une réponse de l'IA pour extraire les commandes de highlight
 * Format attendu : [HIGHLIGHT:element-id] ou [HIGHLIGHT:element-id:color:intensity]
 */
export function parseHighlightCommands(text: string): {
  cleanText: string
  highlights: HighlightConfig[]
} {
  const highlights: HighlightConfig[] = []
  
  // Pattern : [HIGHLIGHT:element-id] ou [HIGHLIGHT:element-id:color:intensity]
  const pattern = /\[HIGHLIGHT:([a-z-]+)(?::([#a-zA-Z0-9]+))?(?::(soft|medium|strong))?\]/g
  
  let match
  while ((match = pattern.exec(text)) !== null) {
    const elementId = match[1] as HighlightableElement
    const color = match[2] || '#FFD700'
    const intensity = (match[3] as 'soft' | 'medium' | 'strong') || 'medium'
    
    // Vérifier que l'élément existe
    if (elementId in ELEMENT_DESCRIPTIONS) {
      highlights.push({ elementId, color, intensity })
    }
  }
  
  // Nettoyer le texte des commandes
  const cleanText = text.replace(pattern, '').trim()
  
  return { cleanText, highlights }
}

/**
 * Génère la description de l'interface pour le prompt système de l'IA
 */
export function generateInterfaceKnowledge(currentMode: string): string {
  const relevantElements = Object.entries(ELEMENT_DESCRIPTIONS)
    .filter(([_, info]) => info.mode === currentMode || info.mode === 'navigation')
    .map(([id, info]) => `- ${info.label} (${id}): ${info.description}`)
    .join('\n')
  
  return `
## ÉLÉMENTS DE L'INTERFACE QUE TU PEUX FAIRE BRILLER

Si l'enfant ne trouve pas quelque chose, tu peux faire clignoter un élément en ajoutant [HIGHLIGHT:element-id] dans ta réponse.
Par exemple : "Regarde, j'ai fait briller le bouton ! [HIGHLIGHT:montage-add-music]"

Éléments disponibles dans le mode actuel (${currentMode}) :
${relevantElements}

IMPORTANT : Utilise les highlights avec parcimonie, seulement quand l'enfant semble perdu.
`
}
