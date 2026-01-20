import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types pour le Studio
export type CreationType = 'image' | 'voice' | 'video'
export type StyleType = 'dessin' | 'photo' | 'magique' | 'anime' | 'aquarelle' | 'pixel'
export type AmbianceType = 'jour' | 'nuit' | 'orage' | 'brume' | 'feerique' | 'mystere'
export type LightType = 'soleil' | 'lune' | 'bougie' | 'neon' | 'aurore'
// Format d'image pour impression livre ou vidéo
export type FormatType = 'portrait' | 'paysage' | 'carre'
// Mouvement pour vidéos
export type MovementType = 'lent' | 'rapide' | 'doux' | 'dynamique' | 'immobile'
// Mouvement de caméra pour vidéos (niveaux 3+)
export type CameraType = 'fixe' | 'zoom_in' | 'zoom_out' | 'pan_gauche' | 'pan_droite' | 'travelling'

export interface PromptKit {
  id: string
  creationType: CreationType
  subject: string
  subjectDetails: string
  style: StyleType | null
  ambiance: AmbianceType | null
  light: LightType | null
  format: FormatType | null  // Format d'image (portrait livre, paysage vidéo, carré)
  movement: MovementType | null  // Mouvement pour vidéos
  // Champs spécifiques vidéo
  sourceImageUrl: string | null  // URL de l'image de base (pour vidéos)
  sourceImageId: string | null   // ID de l'asset source (pour vidéos)
  action: string                 // Scénario : qu'est-ce qui se passe dans la vidéo
  camera: CameraType | null      // Mouvement de caméra (niveaux 3+)
  effects: string                // Effets spéciaux (optionnel)
  sounds: string[]
  additionalNotes: string
  generatedPrompt: string
  isComplete: boolean
  isValidatedByMentor: boolean
  createdAt: Date
}

export interface ImportedAsset {
  id: string
  type: 'image' | 'audio' | 'video'
  file: File | null
  url: string                    // URL temporaire (blob:) pour preview local
  cloudUrl?: string              // URL cloud permanente (Supabase/R2)
  assetId?: string               // ID dans la table assets
  name: string
  source: 'midjourney' | 'elevenlabs' | 'runway' | 'gemini' | 'upload'
  promptUsed?: string
  importedAt: Date
  isUploading?: boolean
  uploadError?: string
  projectId?: string             // ID du projet associé (pour filtrer par projet)
}

export interface SafariBridge {
  id: string
  tool: 'gemini' | 'midjourney' | 'elevenlabs' | 'runway'
  prompt: string
  status: 'preparing' | 'ready' | 'opened' | 'completed'
  openedAt?: Date
}

interface StudioState {
  // Prompt Kit en cours
  currentKit: PromptKit | null
  savedKits: PromptKit[]
  
  // Assets importés
  importedAssets: ImportedAsset[]
  
  // Safari Bridges
  activeBridges: SafariBridge[]
  
  // État de l'interface
  selectedTool: 'image' | 'voice' | 'video' | null
  isPromptAssistantOpen: boolean
  showMissionFlash: boolean
  currentMissionFlash: { title: string; description: string } | null

  // Actions Kit
  createNewKit: (type: CreationType) => void
  updateKit: (updates: Partial<PromptKit>) => void
  saveKit: () => void
  clearKit: () => void
  validateKitByMentor: () => void
  
  // Actions Assets
  addImportedAsset: (asset: Omit<ImportedAsset, 'id' | 'importedAt'>) => string
  updateAsset: (id: string, updates: Partial<ImportedAsset>) => void
  removeImportedAsset: (id: string) => void
  getProjectAssets: (projectId: string | undefined) => ImportedAsset[]
  
  // Actions Bridge
  prepareBridge: (tool: SafariBridge['tool']) => string
  openBridge: (bridgeId: string) => void
  completeBridge: (bridgeId: string) => void
  
  // Actions UI
  setSelectedTool: (tool: 'image' | 'voice' | 'video' | null) => void
  setPromptAssistantOpen: (open: boolean) => void
  triggerMissionFlash: (title: string, description: string) => void
  dismissMissionFlash: () => void
  
  // Génération de prompt
  generatePrompt: () => string
  checkKitCompleteness: () => { complete: boolean; missing: string[] }
}

const generateId = () => Math.random().toString(36).substring(2, 15)

// Templates de prompt par outil
const promptTemplates = {
  midjourney: (kit: PromptKit) => {
    const parts = []
    if (kit.subject) parts.push(kit.subject)
    if (kit.subjectDetails) parts.push(kit.subjectDetails)
    if (kit.style) {
      const styleMap: Record<StyleType, string> = {
        dessin: 'hand-drawn illustration style',
        photo: 'photorealistic',
        magique: 'magical fantasy art, ethereal glow',
        anime: 'anime style, Studio Ghibli inspired',
        aquarelle: 'watercolor painting style',
        pixel: 'pixel art, retro game style'
      }
      parts.push(styleMap[kit.style])
    }
    if (kit.ambiance) {
      const ambianceMap: Record<AmbianceType, string> = {
        jour: 'daytime, bright atmosphere',
        nuit: 'nighttime, starry sky',
        orage: 'stormy weather, dramatic clouds',
        brume: 'misty, fog, mysterious atmosphere',
        feerique: 'fairy tale setting, enchanted',
        mystere: 'mysterious, shadowy, intriguing'
      }
      parts.push(ambianceMap[kit.ambiance])
    }
    if (kit.light) {
      const lightMap: Record<LightType, string> = {
        soleil: 'golden sunlight',
        lune: 'moonlit, silver glow',
        bougie: 'candlelight, warm orange glow',
        neon: 'neon lights, cyberpunk',
        aurore: 'aurora borealis, northern lights'
      }
      parts.push(lightMap[kit.light])
    }
    if (kit.additionalNotes) parts.push(kit.additionalNotes)
    return parts.join(', ')
  },
  
  elevenlabs: (kit: PromptKit) => {
    return kit.subject + (kit.additionalNotes ? `. ${kit.additionalNotes}` : '')
  },
  
  runway: (kit: PromptKit) => {
    const parts = []
    
    // Action/Scénario (ce qui se passe dans la vidéo)
    if (kit.action) parts.push(kit.action)
    
    // Type de mouvement
    if (kit.movement) {
      const movementMap: Record<MovementType, string> = {
        lent: 'slow gentle movement',
        rapide: 'fast dynamic movement',
        doux: 'soft smooth movement',
        dynamique: 'energetic movement',
        immobile: 'subtle breathing motion, almost still'
      }
      parts.push(movementMap[kit.movement])
    }
    
    // Mouvement de caméra (niveaux avancés)
    if (kit.camera) {
      const cameraMap: Record<CameraType, string> = {
        fixe: 'static camera',
        zoom_in: 'slow zoom in',
        zoom_out: 'slow zoom out',
        pan_gauche: 'pan left',
        pan_droite: 'pan right',
        travelling: 'tracking shot'
      }
      parts.push(cameraMap[kit.camera])
    }
    
    // Effets spéciaux
    if (kit.effects) {
      const effectsMap: Record<string, string> = {
        sparkles: 'magical sparkles and particles',
        glow: 'soft glowing halo effect',
        smoke: 'gentle smoke and mist',
        stars: 'twinkling stars',
        fire: 'warm flames and embers',
        snow: 'falling snowflakes',
        magic: 'magical fairy dust particles',
      }
      if (effectsMap[kit.effects]) {
        parts.push(effectsMap[kit.effects])
      }
    }
    
    // Notes additionnelles
    if (kit.additionalNotes) parts.push(kit.additionalNotes)
    
    return parts.join(', ')
  },
  
  gemini: (kit: PromptKit) => {
    return `Aide-moi à améliorer cette idée pour créer une image: "${kit.subject}". 
Style souhaité: ${kit.style || 'non défini'}. 
Ambiance: ${kit.ambiance || 'non définie'}. 
Donne-moi des suggestions créatives pour enrichir la description.`
  }
}

// URLs des outils externes
export const toolUrls = {
  gemini: 'https://gemini.google.com/app',
  midjourney: 'https://fal.ai/models/fal-ai/flux-pro/v1.1/playground', // Images via fal.ai
  elevenlabs: 'https://elevenlabs.io/app/speech-synthesis',
  runway: 'https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/text-to-video/playground' // Vidéos via fal.ai
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      // État initial
      currentKit: null,
      savedKits: [],
      importedAssets: [],
      activeBridges: [],
      selectedTool: null,
      isPromptAssistantOpen: false,
      showMissionFlash: false,
      currentMissionFlash: null,

      // === ACTIONS KIT ===
      createNewKit: (type) => {
        const newKit: PromptKit = {
          id: generateId(),
          creationType: type,
          subject: '',
          subjectDetails: '',
          style: null,
          ambiance: null,
          light: null,
          format: null, // Format par défaut selon le type (image→portrait, vidéo→paysage)
          movement: null, // Mouvement pour vidéos
          // Champs spécifiques vidéo
          sourceImageUrl: null,
          sourceImageId: null,
          action: '',
          camera: null,
          effects: '',
          sounds: [],
          additionalNotes: '',
          generatedPrompt: '',
          isComplete: false,
          isValidatedByMentor: false,
          createdAt: new Date(),
        }
        set({ currentKit: newKit, selectedTool: type })
      },

      updateKit: (updates) => {
        set((state) => {
          if (!state.currentKit) return state
          const updatedKit = { ...state.currentKit, ...updates }
          // Régénérer le prompt
          updatedKit.generatedPrompt = get().generatePrompt()
          // Vérifier la complétude
          const { complete } = get().checkKitCompleteness()
          updatedKit.isComplete = complete
          return { currentKit: updatedKit }
        })
      },

      saveKit: () => {
        const { currentKit } = get()
        if (!currentKit) return
        
        set((state) => ({
          savedKits: [...state.savedKits, currentKit],
          currentKit: null,
          selectedTool: null,
        }))
      },

      clearKit: () => {
        set({ currentKit: null, selectedTool: null })
      },

      validateKitByMentor: () => {
        set((state) => {
          if (!state.currentKit) return state
          return {
            currentKit: { ...state.currentKit, isValidatedByMentor: true }
          }
        })
      },

      // === ACTIONS ASSETS ===
      addImportedAsset: (asset) => {
        const newAsset: ImportedAsset = {
          ...asset,
          id: generateId(),
          importedAt: new Date(),
        }
        set((state) => ({
          importedAssets: [...state.importedAssets, newAsset],
        }))
        return newAsset.id
      },

      updateAsset: (id, updates) => {
        set((state) => ({
          importedAssets: state.importedAssets.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }))
      },

      removeImportedAsset: (id) => {
        set((state) => ({
          importedAssets: state.importedAssets.filter((a) => a.id !== id),
        }))
      },

      getProjectAssets: (projectId) => {
        const { importedAssets } = get()
        if (!projectId) return importedAssets // Si pas de projet, retourner tout
        return importedAssets.filter((a) => a.projectId === projectId)
      },

      // === ACTIONS BRIDGE ===
      prepareBridge: (tool) => {
        const { currentKit } = get()
        if (!currentKit) return ''

        let prompt = ''
        switch (tool) {
          case 'midjourney':
            prompt = promptTemplates.midjourney(currentKit)
            break
          case 'elevenlabs':
            prompt = promptTemplates.elevenlabs(currentKit)
            break
          case 'runway':
            prompt = promptTemplates.runway(currentKit)
            break
          case 'gemini':
            prompt = promptTemplates.gemini(currentKit)
            break
        }

        const bridge: SafariBridge = {
          id: generateId(),
          tool,
          prompt,
          status: 'ready',
        }

        set((state) => ({
          activeBridges: [...state.activeBridges, bridge],
        }))

        return bridge.id
      },

      openBridge: (bridgeId) => {
        set((state) => ({
          activeBridges: state.activeBridges.map((b) =>
            b.id === bridgeId
              ? { ...b, status: 'opened' as const, openedAt: new Date() }
              : b
          ),
        }))
      },

      completeBridge: (bridgeId) => {
        set((state) => ({
          activeBridges: state.activeBridges.map((b) =>
            b.id === bridgeId ? { ...b, status: 'completed' as const } : b
          ),
        }))
      },

      // === ACTIONS UI ===
      setSelectedTool: (tool) => set({ selectedTool: tool }),
      
      setPromptAssistantOpen: (open) => set({ isPromptAssistantOpen: open }),

      triggerMissionFlash: (title, description) => {
        set({
          showMissionFlash: true,
          currentMissionFlash: { title, description },
        })
      },

      dismissMissionFlash: () => {
        set({ showMissionFlash: false, currentMissionFlash: null })
      },

      // === GÉNÉRATION DE PROMPT ===
      generatePrompt: () => {
        const { currentKit } = get()
        if (!currentKit) return ''
        
        if (currentKit.creationType === 'image') {
          return promptTemplates.midjourney(currentKit)
        } else if (currentKit.creationType === 'voice') {
          return promptTemplates.elevenlabs(currentKit)
        } else {
          return promptTemplates.runway(currentKit)
        }
      },

      checkKitCompleteness: () => {
        const { currentKit } = get()
        if (!currentKit) return { complete: false, missing: ['kit'] }
        
        const missing: string[] = []
        
        // === IMAGES ===
        if (currentKit.creationType === 'image') {
          // Sujet requis (minimum 15 caractères pour une vraie description)
          if (!currentKit.subject || currentKit.subject.length < 15) {
            missing.push('description')
          }
          
          // Style requis
          if (!currentKit.style) {
            missing.push('style')
          }
          
          // Ambiance requise
          if (!currentKit.ambiance) {
            missing.push('ambiance')
          }
          
          // Lumière requise (important pour apprendre le prompting)
          if (!currentKit.light) {
            missing.push('lumière')
          }
          
          // Format requis pour les images
          if (!currentKit.format) {
            missing.push('format')
          }
        }
        
        // === VIDÉOS ===
        if (currentKit.creationType === 'video') {
          // Image de base requise (l'enfant doit d'abord créer une image)
          if (!currentKit.sourceImageUrl) {
            missing.push('image de base')
          }
          
          // Action/Scénario requis (qu'est-ce qui se passe)
          if (!currentKit.action || currentKit.action.length < 10) {
            missing.push('action')
          }
          
          // Mouvement requis (comment ça bouge)
          if (!currentKit.movement) {
            missing.push('mouvement')
          }
        }
        
        return {
          complete: missing.length === 0,
          missing,
        }
      },
    }),
    {
      name: 'lavoixdusoir-studio',
      partialize: (state) => ({
        savedKits: state.savedKits,
        importedAssets: state.importedAssets,
      }),
    }
  )
)

