/**
 * Store pour le Studio — suivi des creations
 *
 * Simplifie : pas de niveaux, pas de badges, pas de progression pedagogique.
 * L'enfant cree librement, on compte juste les creations pour Supabase sync.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================================================
// TYPES
// ============================================================================

export type CreationType = 'image' | 'video'

export type StudioLevel = 1 | 2 | 3 | 4 | 5

// Kept for import compatibility — no longer used for progression
export const LEVEL_NAMES: Record<StudioLevel, string> = {
  1: '', 2: '', 3: '', 4: '', 5: '',
}

export const LEVEL_EMOJIS: Record<StudioLevel, string> = {
  1: '', 2: '', 3: '', 4: '', 5: '',
}

export const CREATIONS_PER_LEVEL: Record<StudioLevel, number> = {
  1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
}

export type GuideStep =
  | 'describe'
  | 'choose_image'
  | 'choose_style'
  | 'choose_mood'
  | 'choose_light'
  | 'choose_format'
  | 'choose_movement'
  | 'choose_camera'
  | 'choose_extra'
  | 'review_prompt'
  | 'open_safari'
  | 'paste_prompt'
  | 'generate'
  | 'import'

export interface GuideStepConfig {
  id: GuideStep
  label: string
  emoji: string
  description: string
  childDoesFromLevel: StudioLevel
}

// Steps config — all childDoesFromLevel: 1 (child always does everything)
export const IMAGE_GUIDE_STEPS: GuideStepConfig[] = [
  { id: 'describe', label: 'Describe', emoji: '', description: '', childDoesFromLevel: 1 },
  { id: 'choose_style', label: 'Style', emoji: '', description: '', childDoesFromLevel: 1 },
  { id: 'choose_mood', label: 'Mood', emoji: '', description: '', childDoesFromLevel: 1 },
  { id: 'choose_extra', label: 'Extra', emoji: '', description: '', childDoesFromLevel: 1 },
  { id: 'choose_light', label: 'Light', emoji: '', description: '', childDoesFromLevel: 1 },
  { id: 'choose_format', label: 'Format', emoji: '', description: '', childDoesFromLevel: 1 },
  { id: 'review_prompt', label: 'Review', emoji: '', description: '', childDoesFromLevel: 1 },
  { id: 'open_safari', label: 'Safari', emoji: '', description: '', childDoesFromLevel: 1 },
  { id: 'paste_prompt', label: 'Paste', emoji: '', description: '', childDoesFromLevel: 1 },
  { id: 'generate', label: 'Generate', emoji: '', description: '', childDoesFromLevel: 1 },
  { id: 'import', label: 'Import', emoji: '', description: '', childDoesFromLevel: 1 },
]

export const VIDEO_GUIDE_STEPS: GuideStepConfig[] = [
  { id: 'choose_image', label: 'Image', emoji: '', description: '', childDoesFromLevel: 1 },
  { id: 'describe', label: 'Describe', emoji: '', description: '', childDoesFromLevel: 1 },
  { id: 'choose_movement', label: 'Movement', emoji: '', description: '', childDoesFromLevel: 1 },
  { id: 'choose_camera', label: 'Camera', emoji: '', description: '', childDoesFromLevel: 1 },
  { id: 'choose_extra', label: 'Extra', emoji: '', description: '', childDoesFromLevel: 1 },
  { id: 'review_prompt', label: 'Review', emoji: '', description: '', childDoesFromLevel: 1 },
  { id: 'open_safari', label: 'Safari', emoji: '', description: '', childDoesFromLevel: 1 },
  { id: 'paste_prompt', label: 'Paste', emoji: '', description: '', childDoesFromLevel: 1 },
  { id: 'generate', label: 'Generate', emoji: '', description: '', childDoesFromLevel: 1 },
  { id: 'import', label: 'Import', emoji: '', description: '', childDoesFromLevel: 1 },
]

export interface MagicKey {
  id: string
  name: string
  emoji: string
  question: string
  impact: number
}

// Kept for import compatibility — empty
export const IMAGE_MAGIC_KEYS: MagicKey[] = []
export const VIDEO_MAGIC_KEYS: MagicKey[] = []

export interface StudioBadge {
  id: string
  name: string
  emoji: string
  description: string
  unlockedAt?: Date
}

export interface StudioCreation {
  id: string
  type: CreationType
  prompt: string
  resultUrl?: string
  createdAt: Date
  level: StudioLevel
  withHelp: boolean
  bonusStars: number
}

// ============================================================================
// STATE
// ============================================================================

export type AIReaction = {
  id: string
  type: 'gibberish' | 'inappropriate' | 'success' | 'encouragement' | 'user_input'
  fieldName: string
  message: string
  userMessage?: string
  timestamp: number
}

interface StudioProgressState {
  // Creation counts (kept for Supabase sync compatibility)
  imageLevel: StudioLevel
  imageCreationsInLevel: number
  imageTotalCreations: number

  videoLevel: StudioLevel
  videoCreationsInLevel: number
  videoTotalCreations: number

  // Current creation state
  currentCreationType: CreationType | null
  currentStep: GuideStep | null
  completedSteps: GuideStep[]
  needsHelp: boolean

  aiReaction: AIReaction | null

  creations: StudioCreation[]
  badges: StudioBadge[]

  // Actions
  startCreation: (type: CreationType) => void
  completeStep: (step: GuideStep) => void
  uncompleteStep: (step: GuideStep) => void
  resetCurrentCreation: () => void
  requestHelp: () => void
  sendAIReaction: (reaction: Omit<AIReaction, 'id' | 'timestamp'>) => void
  clearAIReaction: () => void

  finishCreation: (creation: Omit<StudioCreation, 'id' | 'createdAt' | 'level'>) => void

  // Getters
  getLevel: (type: CreationType) => StudioLevel
  getLevelName: (type: CreationType) => string
  getLevelEmoji: (type: CreationType) => string
  getCreationsInLevel: (type: CreationType) => number
  getCreationsNeeded: (type: CreationType) => number
  getProgress: (type: CreationType) => number
  getGuideSteps: (type: CreationType) => GuideStepConfig[]
  getMagicKeys: (type: CreationType) => MagicKey[]
  isStepDoneByChild: (type: CreationType, step: GuideStep) => boolean
  hasBadge: (badgeId: string) => boolean
}

// ============================================================================
// STORE
// ============================================================================

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export const useStudioProgressStore = create<StudioProgressState>()(
  persist(
    (set, get) => ({
      // All levels fixed at 5 (max) — no progression
      imageLevel: 5 as StudioLevel,
      imageCreationsInLevel: 0,
      imageTotalCreations: 0,

      videoLevel: 5 as StudioLevel,
      videoCreationsInLevel: 0,
      videoTotalCreations: 0,

      currentCreationType: null,
      currentStep: null,
      completedSteps: [],
      needsHelp: false,
      aiReaction: null,

      creations: [],
      badges: [],

      // === ACTIONS ===

      startCreation: (type) => {
        set({
          currentCreationType: type,
          currentStep: 'describe',
          completedSteps: [],
          needsHelp: false,
        })
      },

      completeStep: (step) => {
        const { completedSteps, currentCreationType } = get()
        if (completedSteps.includes(step)) return

        const newCompletedSteps = [...completedSteps, step]

        const guideSteps = currentCreationType === 'image' ? IMAGE_GUIDE_STEPS : VIDEO_GUIDE_STEPS
        const currentIndex = guideSteps.findIndex(s => s.id === step)
        const nextStep = guideSteps[currentIndex + 1]?.id || null

        set({
          completedSteps: newCompletedSteps,
          currentStep: nextStep,
        })
      },

      uncompleteStep: (step) => {
        const { completedSteps } = get()
        if (!completedSteps.includes(step)) return

        set({
          completedSteps: completedSteps.filter(s => s !== step),
          currentStep: step,
        })
      },

      resetCurrentCreation: () => {
        set({
          currentCreationType: null,
          currentStep: null,
          completedSteps: [],
          needsHelp: false,
          aiReaction: null,
        })
      },

      requestHelp: () => {
        set({ needsHelp: true })
      },

      sendAIReaction: (reaction) => {
        set({
          aiReaction: {
            ...reaction,
            id: generateId(),
            timestamp: Date.now(),
          }
        })
      },

      clearAIReaction: () => {
        set({ aiReaction: null })
      },

      finishCreation: (creationData) => {
        const state = get()
        const type = creationData.type
        const totalCreationsKey = type === 'image' ? 'imageTotalCreations' : 'videoTotalCreations'
        const newTotalCreations = (type === 'image' ? state.imageTotalCreations : state.videoTotalCreations) + 1

        const newCreation: StudioCreation = {
          ...creationData,
          id: generateId(),
          createdAt: new Date(),
          level: 5 as StudioLevel,
        }

        set({
          [totalCreationsKey]: newTotalCreations,
          creations: [...state.creations, newCreation],
          // Reset current creation
          currentCreationType: null,
          currentStep: null,
          completedSteps: [],
          needsHelp: false,
        })
      },

      // === GETTERS — all return max/unlocked values ===

      getLevel: () => 5 as StudioLevel,
      getLevelName: () => '',
      getLevelEmoji: () => '',

      getCreationsInLevel: (type) => {
        const state = get()
        return type === 'image' ? state.imageCreationsInLevel : state.videoCreationsInLevel
      },

      getCreationsNeeded: () => 0,
      getProgress: () => 100,

      getGuideSteps: (type) => {
        return type === 'image' ? IMAGE_GUIDE_STEPS : VIDEO_GUIDE_STEPS
      },

      getMagicKeys: () => [],

      // Always true — child does all steps
      isStepDoneByChild: () => true,

      hasBadge: () => false,
    }),
    {
      name: 'lavoixdusoir-studio-progress',
      partialize: (state) => ({
        imageLevel: state.imageLevel,
        imageCreationsInLevel: state.imageCreationsInLevel,
        imageTotalCreations: state.imageTotalCreations,
        videoLevel: state.videoLevel,
        videoCreationsInLevel: state.videoCreationsInLevel,
        videoTotalCreations: state.videoTotalCreations,
        creations: state.creations,
        badges: state.badges,
      }),
    }
  )
)
