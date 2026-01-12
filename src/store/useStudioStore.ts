import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types pour le Studio
export type CreationType = 'image' | 'voice' | 'video'
export type StyleType = 'dessin' | 'photo' | 'magique' | 'anime' | 'aquarelle' | 'pixel'
export type AmbianceType = 'jour' | 'nuit' | 'orage' | 'brume' | 'feerique' | 'mystere'
export type LightType = 'soleil' | 'lune' | 'bougie' | 'neon' | 'aurore'

export interface PromptKit {
  id: string
  creationType: CreationType
  subject: string
  subjectDetails: string
  style: StyleType | null
  ambiance: AmbianceType | null
  light: LightType | null
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
  url: string
  name: string
  source: 'midjourney' | 'elevenlabs' | 'runway' | 'gemini' | 'upload'
  promptUsed?: string
  importedAt: Date
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
  addImportedAsset: (asset: Omit<ImportedAsset, 'id' | 'importedAt'>) => void
  removeImportedAsset: (id: string) => void
  
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
    parts.push('--ar 16:9 --v 6')
    return parts.join(', ')
  },
  
  elevenlabs: (kit: PromptKit) => {
    return kit.subject + (kit.additionalNotes ? `. ${kit.additionalNotes}` : '')
  },
  
  runway: (kit: PromptKit) => {
    const parts = [kit.subject]
    if (kit.ambiance) parts.push(`ambiance ${kit.ambiance}`)
    if (kit.additionalNotes) parts.push(kit.additionalNotes)
    return parts.join(', ') + ' --motion smooth --duration 4s'
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
  midjourney: 'https://www.midjourney.com/imagine',
  elevenlabs: 'https://elevenlabs.io/app/speech-synthesis',
  runway: 'https://app.runwayml.com/video-tools/teams/personal/ai-tools/generate'
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
      },

      removeImportedAsset: (id) => {
        set((state) => ({
          importedAssets: state.importedAssets.filter((a) => a.id !== id),
        }))
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
        
        if (!currentKit.subject || currentKit.subject.length < 5) {
          missing.push('sujet')
        }
        if (!currentKit.style) {
          missing.push('style')
        }
        if (currentKit.creationType === 'image' && !currentKit.ambiance) {
          missing.push('ambiance')
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

