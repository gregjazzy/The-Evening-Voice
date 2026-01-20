/**
 * Store pour la progression pédagogique du Studio
 * 
 * Gère :
 * - Progression Images (fal.ai Flux) : 5 niveaux
 * - Progression Vidéos (fal.ai Kling) : 5 niveaux
 * - Créations comptées
 * - Badges obtenus
 * - Étape en cours pour le guide
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================================================
// TYPES
// ============================================================================

export type CreationType = 'image' | 'video'

export type StudioLevel = 1 | 2 | 3 | 4 | 5

export const LEVEL_NAMES: Record<StudioLevel, string> = {
  1: 'Je découvre',
  2: 'Je participe', 
  3: "Je m'entraîne",
  4: 'Je sais faire',
  5: 'Experte',
}

export const LEVEL_EMOJIS: Record<StudioLevel, string> = {
  1: '🌱',
  2: '🌿',
  3: '⭐',
  4: '🌟',
  5: '👑',
}

// Nombre de créations pour passer au niveau suivant
// Équilibre entre formation solide et progression motivante pour un enfant de 8 ans
export const CREATIONS_PER_LEVEL: Record<StudioLevel, number> = {
  1: 5,   // 5 créations pour passer au niveau 2 (découverte guidée)
  2: 8,   // 8 créations pour passer au niveau 3 (maîtrise du contenu)
  3: 10,  // 10 créations pour passer au niveau 4 (enrichissement naturel)
  4: 12,  // 12 créations pour passer au niveau 5 (autonomie technique)
  5: 0,   // Niveau max - Expert 👑
}
// Total : 35 créations pour devenir expert (~3-4 semaines à 1-2 créations/jour)

// Étapes du guide selon le niveau
export type GuideStep = 
  | 'describe'        // Décrire son idée (images) ou action (vidéos)
  | 'choose_image'    // Choisir une image de base (vidéos uniquement)
  | 'choose_style'    // Choisir le style
  | 'choose_mood'     // Choisir l'ambiance
  | 'choose_light'    // Choisir la lumière
  | 'choose_format'   // Choisir le format (images)
  | 'choose_movement' // Choisir le mouvement (vidéos)
  | 'choose_camera'   // Mouvement de caméra (vidéos, niveaux 3+)
  | 'choose_extra'    // Options supplémentaires (détails bonus)
  | 'review_prompt'   // Voir le prompt
  | 'open_safari'     // Ouvrir Safari
  | 'paste_prompt'    // Coller le prompt
  | 'generate'        // Lancer la génération
  | 'import'          // Importer la création

export interface GuideStepConfig {
  id: GuideStep
  label: string
  emoji: string
  description: string
  // À partir de quel niveau cette étape est faite par l'enfant (sinon IA)
  childDoesFromLevel: StudioLevel
}

// Configuration des étapes pour Images
export const IMAGE_GUIDE_STEPS: GuideStepConfig[] = [
  { id: 'describe', label: 'Décrire mon idée', emoji: '💭', description: 'Raconte ce que tu veux créer', childDoesFromLevel: 1 },
  { id: 'choose_style', label: 'Choisir le style', emoji: '🎨', description: 'Dessin, photo, magique...', childDoesFromLevel: 1 },
  { id: 'choose_mood', label: 'Choisir l\'ambiance', emoji: '🌙', description: 'Jour, nuit, féérique...', childDoesFromLevel: 1 },
  { id: 'choose_light', label: 'Choisir la lumière', emoji: '☀️', description: 'Soleil, lune, bougie...', childDoesFromLevel: 1 },
  { id: 'choose_format', label: 'Choisir le format', emoji: '📐', description: 'Portrait, paysage, carré', childDoesFromLevel: 1 },
  { id: 'choose_extra', label: 'Ajouter des détails', emoji: '✨', description: 'Couleurs, textures... (optionnel)', childDoesFromLevel: 3 },
  { id: 'review_prompt', label: 'Voir mon prompt', emoji: '📋', description: 'Vérifier avant d\'envoyer', childDoesFromLevel: 2 },
  { id: 'open_safari', label: 'Aller sur Safari', emoji: '🚀', description: 'Ouvrir fal.ai', childDoesFromLevel: 3 },
  { id: 'paste_prompt', label: 'Coller le prompt', emoji: '📋', description: 'Cmd+V dans fal.ai', childDoesFromLevel: 3 },
  { id: 'generate', label: 'Créer l\'image', emoji: '🎨', description: 'Lancer la génération', childDoesFromLevel: 1 },
  { id: 'import', label: 'Importer', emoji: '📥', description: 'Récupérer ta création', childDoesFromLevel: 1 },
]

// Configuration des étapes pour Vidéos (image-to-video)
export const VIDEO_GUIDE_STEPS: GuideStepConfig[] = [
  { id: 'choose_image', label: 'Choisir une image', emoji: '🖼️', description: 'Sélectionne une image de ta galerie', childDoesFromLevel: 1 },
  { id: 'describe', label: 'Décrire l\'action', emoji: '🎬', description: 'Qu\'est-ce qui se passe ?', childDoesFromLevel: 1 },
  { id: 'choose_movement', label: 'Choisir le mouvement', emoji: '💫', description: 'Lent, rapide, doux...', childDoesFromLevel: 1 },
  { id: 'choose_camera', label: 'Mouvement caméra', emoji: '🎥', description: 'Zoom, travelling... (optionnel)', childDoesFromLevel: 3 },
  { id: 'choose_extra', label: 'Ajouter des effets', emoji: '✨', description: 'Effets spéciaux (optionnel)', childDoesFromLevel: 3 },
  { id: 'review_prompt', label: 'Voir mon prompt', emoji: '📋', description: 'Vérifier avant d\'envoyer', childDoesFromLevel: 2 },
  { id: 'open_safari', label: 'Aller sur Safari', emoji: '🚀', description: 'Ouvrir fal.ai', childDoesFromLevel: 3 },
  { id: 'paste_prompt', label: 'Coller le prompt', emoji: '📋', description: 'Cmd+V dans fal.ai', childDoesFromLevel: 3 },
  { id: 'generate', label: 'Créer la vidéo', emoji: '🎬', description: 'Lancer la génération', childDoesFromLevel: 1 },
  { id: 'import', label: 'Importer', emoji: '📥', description: 'Récupérer ta création', childDoesFromLevel: 1 },
]

// Les 5 Clés Magiques pour Images
export interface MagicKey {
  id: string
  name: string
  emoji: string
  question: string
  impact: number // Pourcentage d'impact sur le résultat
}

export const IMAGE_MAGIC_KEYS: MagicKey[] = [
  { id: 'style', name: 'Style', emoji: '🎨', question: 'Dessin, photo, ou magique ?', impact: 40 },
  { id: 'hero', name: 'Héros', emoji: '🦸', question: 'Qui ou quoi ? Décris-le !', impact: 25 },
  { id: 'mood', name: 'Ambiance', emoji: '💫', question: 'Quelle émotion ? Quelle lumière ?', impact: 15 },
  { id: 'world', name: 'Monde', emoji: '🌍', question: 'Où ça se passe ?', impact: 10 },
  { id: 'magic', name: 'Magie', emoji: '✨', question: 'Quel détail unique ?', impact: 10 },
]

export const VIDEO_MAGIC_KEYS: MagicKey[] = [
  { id: 'style', name: 'Style', emoji: '🎨', question: 'Réaliste ou animé ?', impact: 30 },
  { id: 'action', name: 'Action', emoji: '🎬', question: 'Qu\'est-ce qui bouge ?', impact: 30 },
  { id: 'mood', name: 'Ambiance', emoji: '💫', question: 'Quelle émotion ?', impact: 15 },
  { id: 'rhythm', name: 'Rythme', emoji: '⏱️', question: 'Lent et doux ou rapide ?', impact: 15 },
  { id: 'effect', name: 'Effet', emoji: '✨', question: 'Quel effet spécial ?', impact: 10 },
]

// Badge
export interface StudioBadge {
  id: string
  name: string
  emoji: string
  description: string
  unlockedAt?: Date
}

// Création enregistrée
export interface StudioCreation {
  id: string
  type: CreationType
  prompt: string
  resultUrl?: string
  createdAt: Date
  level: StudioLevel
  withHelp: boolean // Si l'IA a aidé
  bonusStars: number // Étoiles bonus (0-4)
}

// ============================================================================
// STATE
// ============================================================================

// Type de réaction de l'IA quand un champ est validé
export type AIReaction = {
  id: string
  type: 'gibberish' | 'inappropriate' | 'success' | 'encouragement' | 'user_input'
  fieldName: string
  message: string
  userMessage?: string // Le texte tapé par l'enfant (pour l'afficher dans le chat)
  timestamp: number
}

interface StudioProgressState {
  // Progression par type
  imageLevel: StudioLevel
  imageCreationsInLevel: number
  imageTotalCreations: number
  
  videoLevel: StudioLevel
  videoCreationsInLevel: number
  videoTotalCreations: number
  
  // État actuel de création
  currentCreationType: CreationType | null
  currentStep: GuideStep | null
  completedSteps: GuideStep[]
  needsHelp: boolean
  
  // Réactions de l'IA (pour communiquer avec le chat)
  aiReaction: AIReaction | null
  
  // Historique
  creations: StudioCreation[]
  
  // Badges
  badges: StudioBadge[]
  
  // Actions
  startCreation: (type: CreationType) => void
  completeStep: (step: GuideStep) => void
  uncompleteStep: (step: GuideStep) => void // Invalider une étape (quand l'enfant efface)
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
  getProgress: (type: CreationType) => number // 0-100
  getGuideSteps: (type: CreationType) => GuideStepConfig[]
  getMagicKeys: (type: CreationType) => MagicKey[]
  isStepDoneByChild: (type: CreationType, step: GuideStep) => boolean
  hasBadge: (badgeId: string) => boolean
}

// ============================================================================
// STORE
// ============================================================================

const generateId = () => Math.random().toString(36).substring(2, 15)

export const useStudioProgressStore = create<StudioProgressState>()(
  persist(
    (set, get) => ({
      // État initial
      imageLevel: 1,
      imageCreationsInLevel: 0,
      imageTotalCreations: 0,
      
      videoLevel: 1,
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
        
        // Trouver la prochaine étape
        const guideSteps = currentCreationType === 'image' ? IMAGE_GUIDE_STEPS : VIDEO_GUIDE_STEPS
        const currentIndex = guideSteps.findIndex(s => s.id === step)
        const nextStep = guideSteps[currentIndex + 1]?.id || null
        
        set({
          completedSteps: newCompletedSteps,
          currentStep: nextStep,
        })
      },
      
      // Invalider une étape (quand l'enfant efface son travail)
      uncompleteStep: (step) => {
        const { completedSteps } = get()
        if (!completedSteps.includes(step)) return
        
        const newCompletedSteps = completedSteps.filter(s => s !== step)
        
        set({
          completedSteps: newCompletedSteps,
          currentStep: step, // Revenir à cette étape
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
        const currentLevel = type === 'image' ? state.imageLevel : state.videoLevel
        
        const newCreation: StudioCreation = {
          ...creationData,
          id: generateId(),
          createdAt: new Date(),
          level: currentLevel,
        }
        
        // Mettre à jour les compteurs
        const levelKey = type === 'image' ? 'imageLevel' : 'videoLevel'
        const creationsInLevelKey = type === 'image' ? 'imageCreationsInLevel' : 'videoCreationsInLevel'
        const totalCreationsKey = type === 'image' ? 'imageTotalCreations' : 'videoTotalCreations'
        
        let newCreationsInLevel = (type === 'image' ? state.imageCreationsInLevel : state.videoCreationsInLevel) + 1
        let newLevel = currentLevel
        let newTotalCreations = (type === 'image' ? state.imageTotalCreations : state.videoTotalCreations) + 1
        
        // Vérifier si on passe au niveau suivant
        const creationsNeeded = CREATIONS_PER_LEVEL[currentLevel]
        if (creationsNeeded > 0 && newCreationsInLevel >= creationsNeeded && currentLevel < 5) {
          newLevel = (currentLevel + 1) as StudioLevel
          newCreationsInLevel = 0
        }
        
        // Vérifier les badges
        const newBadges = [...state.badges]
        
        // Badge première création
        if (newTotalCreations === 1 && type === 'image' && !state.badges.find(b => b.id === 'first_image')) {
          newBadges.push({
            id: 'first_image',
            name: 'Première Image',
            emoji: '🖼️',
            description: 'Tu as créé ta première image !',
            unlockedAt: new Date(),
          })
        }
        
        if (newTotalCreations === 1 && type === 'video' && !state.badges.find(b => b.id === 'first_video')) {
          newBadges.push({
            id: 'first_video',
            name: 'Première Vidéo',
            emoji: '🎬',
            description: 'Tu as créé ta première vidéo !',
            unlockedAt: new Date(),
          })
        }
        
        // Badge niveau 5 (Experte)
        if (newLevel === 5 && currentLevel < 5) {
          const badgeId = type === 'image' ? 'expert_image' : 'expert_video'
          if (!state.badges.find(b => b.id === badgeId)) {
            newBadges.push({
              id: badgeId,
              name: type === 'image' ? 'Experte Images' : 'Experte Vidéos',
              emoji: '👑',
              description: type === 'image' 
                ? 'Tu maîtrises la création d\'images !' 
                : 'Tu maîtrises la création de vidéos !',
              unlockedAt: new Date(),
            })
          }
        }
        
        // Badge Maître du Studio (les deux expertises)
        const hasImageExpert = newBadges.find(b => b.id === 'expert_image')
        const hasVideoExpert = newBadges.find(b => b.id === 'expert_video')
        if (hasImageExpert && hasVideoExpert && !state.badges.find(b => b.id === 'studio_master')) {
          newBadges.push({
            id: 'studio_master',
            name: 'Maître du Studio',
            emoji: '🏆',
            description: 'Tu es experte en images ET en vidéos !',
            unlockedAt: new Date(),
          })
        }
        
        set({
          [levelKey]: newLevel,
          [creationsInLevelKey]: newCreationsInLevel,
          [totalCreationsKey]: newTotalCreations,
          creations: [...state.creations, newCreation],
          badges: newBadges,
          // Reset création en cours
          currentCreationType: null,
          currentStep: null,
          completedSteps: [],
          needsHelp: false,
        })
      },
      
      // === GETTERS ===
      
      getLevel: (type) => {
        const state = get()
        return type === 'image' ? state.imageLevel : state.videoLevel
      },
      
      getLevelName: (type) => {
        const level = get().getLevel(type)
        return LEVEL_NAMES[level]
      },
      
      getLevelEmoji: (type) => {
        const level = get().getLevel(type)
        return LEVEL_EMOJIS[level]
      },
      
      getCreationsInLevel: (type) => {
        const state = get()
        return type === 'image' ? state.imageCreationsInLevel : state.videoCreationsInLevel
      },
      
      getCreationsNeeded: (type) => {
        const level = get().getLevel(type)
        return CREATIONS_PER_LEVEL[level]
      },
      
      getProgress: (type) => {
        const state = get()
        const creationsInLevel = state.getCreationsInLevel(type)
        const creationsNeeded = state.getCreationsNeeded(type)
        if (creationsNeeded === 0) return 100 // Niveau max
        return Math.round((creationsInLevel / creationsNeeded) * 100)
      },
      
      getGuideSteps: (type) => {
        return type === 'image' ? IMAGE_GUIDE_STEPS : VIDEO_GUIDE_STEPS
      },
      
      getMagicKeys: (type) => {
        return type === 'image' ? IMAGE_MAGIC_KEYS : VIDEO_MAGIC_KEYS
      },
      
      isStepDoneByChild: (type, step) => {
        const level = get().getLevel(type)
        const guideSteps = type === 'image' ? IMAGE_GUIDE_STEPS : VIDEO_GUIDE_STEPS
        const stepConfig = guideSteps.find(s => s.id === step)
        if (!stepConfig) return false
        return level >= stepConfig.childDoesFromLevel
      },
      
      hasBadge: (badgeId) => {
        return get().badges.some(b => b.id === badgeId)
      },
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
