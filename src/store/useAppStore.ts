import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase/client'
import type { 
  PromptingLevel, 
  PromptingProgress,
  PromptAnalysis,
  ProgressionEvent,
  MagicKey,
  StoryStructure,
  // Types pour l'écriture (5 Questions Magiques)
  WritingLevel,
  WritingPromptingProgress,
  WritingMessageAnalysis,
  WritingProgressionEvent,
  WritingQuestion,
} from '@/lib/ai/prompting-pedagogy'
import { 
  getInitialProgress, 
  updateProgression,
  analyzePrompt as analyzePromptFn,
  STORY_TEMPLATES,
  // Fonctions pour l'écriture
  getInitialWritingProgress,
  updateWritingProgression,
  analyzeWritingMessage as analyzeWritingMessageFn,
  completeStory as completeStoryFn,
} from '@/lib/ai/prompting-pedagogy'

// Fonction pour récupérer le profileId depuis le localStorage de l'auth store
function getProfileIdFromStorage(): string | null {
  try {
    const authData = localStorage.getItem('lavoixdusoir-auth')
    console.log('🔍 Auth data from localStorage:', authData ? 'found' : 'not found')
    if (authData) {
      const parsed = JSON.parse(authData)
      console.log('🔍 Parsed auth:', JSON.stringify(parsed, null, 2))
      const profileId = parsed?.state?.profile?.id || null
      console.log('🔍 Profile ID:', profileId)
      return profileId
    }
  } catch (e) {
    console.error('Erreur lecture profileId:', e)
  }
  return null
}

// Fonction pour sauvegarder une histoire dans Supabase immédiatement
async function saveStoryToSupabaseNow(story: Story) {
  const profileId = getProfileIdFromStorage()
  if (!profileId) {
    console.warn('⚠️ Pas de profileId, histoire non sauvegardée dans Supabase')
    return
  }
  
  try {
    const storyData = {
      id: story.id,
      profile_id: profileId,
      title: story.title,
      author: 'Auteur',
      status: story.isComplete ? 'completed' : 'in_progress',
      total_pages: story.pages.length,
      current_page: story.currentStep + 1,
      metadata: {
        structure: story.structure,
        chapters: story.chapters || [],
      },
      created_at: story.createdAt instanceof Date ? story.createdAt.toISOString() : story.createdAt,
      updated_at: story.updatedAt instanceof Date ? story.updatedAt.toISOString() : story.updatedAt,
    }
    
    const { error } = await (supabase as any).from('stories').upsert(storyData)
    
    if (error) {
      console.error('❌ Erreur sauvegarde histoire Supabase:', error)
    } else {
      console.log('✅ Histoire sauvegardée dans Supabase:', story.title)
    }
  } catch (err) {
    console.error('❌ Exception sauvegarde histoire:', err)
  }
}

// Fonction pour supprimer une histoire de Supabase
async function deleteStoryFromSupabase(storyId: string) {
  const profileId = getProfileIdFromStorage()
  if (!profileId) {
    console.warn('⚠️ Pas de profileId, suppression Supabase ignorée')
    return
  }
  
  try {
    // Supprimer d'abord les pages de l'histoire
    const { error: pagesError } = await (supabase as any)
      .from('story_pages')
      .delete()
      .eq('story_id', storyId)
    
    if (pagesError) {
      console.error('❌ Erreur suppression pages Supabase:', pagesError)
    }
    
    // Puis supprimer l'histoire elle-même
    const { error: storyError } = await (supabase as any)
      .from('stories')
      .delete()
      .eq('id', storyId)
      .eq('profile_id', profileId) // Sécurité: ne supprimer que ses propres histoires
    
    if (storyError) {
      console.error('❌ Erreur suppression histoire Supabase:', storyError)
    } else {
      console.log('✅ Histoire supprimée de Supabase:', storyId)
    }
  } catch (err) {
    console.error('❌ Exception suppression histoire:', err)
  }
}

// Types pour les différents modes
export type AppMode = 'book' | 'studio' | 'layout' | 'theater' | 'mentor' | 'publish' | 'challenge'

export interface DiaryEntry {
  id: string
  date: Date
  content: string
  mood?: 'happy' | 'sad' | 'excited' | 'calm' | 'dreamy'
  memoryImage?: string
  audioUrl?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  relatedDiaryId?: string
}

export interface StoryChapter {
  id: string
  title: string
  content: string
  images: string[]
  audioUrl?: string
  order: number
}

// Chapitres personnalisés pour structurer l'histoire
export interface StoryCustomChapter {
  id: string
  title: string
  type: 'intro' | 'development' | 'climax' | 'conclusion' | 'custom'
  color: string
}

// Nouveau type pour les histoires structurées
export interface Story {
  id: string
  title: string
  structure: StoryStructure
  currentStep: number
  pages: StoryPage[]
  chapters?: StoryCustomChapter[] // Chapitres personnalisés
  createdAt: Date
  updatedAt: Date
  isComplete: boolean
}

// Type de média supporté
export type MediaType = 'image' | 'video'

// Interface pour un média individuel sur la page (nouveau format multi-médias)
export interface PageMedia {
  id: string
  url: string
  type: MediaType  // 'image' ou 'video'
  position: {
    x: number
    y: number
    width: number
    height: number
    rotation: number
  }
  style: string
  frame: string
  zIndex: number
}

// Alias pour rétrocompatibilité
export type PageImage = PageMedia

// Fond de page (image ou vidéo avec opacité)
export interface BackgroundMedia {
  url: string
  type: 'image' | 'video'
  opacity: number
  x?: number
  y?: number
  scale?: number
}

// Décoration sur une page (sticker luxueux)
export interface PageDecoration {
  id: string
  decorationId: string
  position: { x: number; y: number }
  scale: number
  rotation: number
  color?: string
  opacity?: number
  glow?: boolean
  flipX?: boolean
  flipY?: boolean
}

export interface StoryPage {
  id: string
  stepIndex: number
  content: string
  // Nouveau format multi-médias (images et vidéos)
  images?: PageMedia[]
  // Fond de page (image ou vidéo avec opacité)
  backgroundMedia?: BackgroundMedia
  // Décorations premium (stickers luxueux)
  decorations?: PageDecoration[]
  // Legacy fields (rétrocompatibilité)
  image?: string
  imagePosition?: {
    x: number
    y: number
    width: number
    height: number
    rotation: number
  }
  imageStyle?: string
  frameStyle?: string
  order: number
  chapterId?: string // Référence au chapitre personnalisé
  title?: string // Titre optionnel de la page
}

export interface Project {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  chapters: StoryChapter[]
  assets: {
    images: string[]
    audios: string[]
    videos: string[]
  }
}

interface AppState {
  // Mode actuel
  currentMode: AppMode
  setCurrentMode: (mode: AppMode) => void

  // Diary (Journal)
  diaryEntries: DiaryEntry[]
  currentDiaryEntry: DiaryEntry | null
  addDiaryEntry: (entry: Omit<DiaryEntry, 'id' | 'date'>) => void
  updateDiaryEntry: (id: string, updates: Partial<DiaryEntry>) => void
  setCurrentDiaryEntry: (entry: DiaryEntry | null) => void

  // Chat avec l'IA
  chatHistory: ChatMessage[]
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearChatHistory: () => void

  // Histoires structurées (nouveau)
  stories: Story[]
  currentStory: Story | null
  createStory: (title: string, structure: StoryStructure) => Story
  updateStoryPage: (storyId: string, pageIndex: number, content: string, image?: string) => void
  updateStoryPages: (storyId: string, pages: StoryPage[]) => void
  setCurrentStory: (story: Story | null) => void
  deleteStory: (storyId: string) => void
  goToNextStep: (storyId: string) => void
  goToPrevStep: (storyId: string) => void
  completeStory: (storyId: string) => void
  // Gestion des chapitres
  addStoryChapter: (storyId: string, chapter: StoryCustomChapter) => void
  deleteStoryChapter: (storyId: string, chapterId: string) => void
  updateStoryChapters: (storyId: string, chapters: StoryCustomChapter[]) => void

  // Projet en cours (Book) - legacy
  currentProject: Project | null
  projects: Project[]
  createProject: (title: string) => void
  updateProject: (updates: Partial<Project>) => void
  addChapter: (chapter: Omit<StoryChapter, 'id' | 'order'>) => void

  // Assets générés (Studio)
  generatedAssets: {
    images: Array<{ url: string; prompt: string; createdAt: Date; analysis?: PromptAnalysis }>
    audios: Array<{ url: string; text: string; voice: string; createdAt: Date }>
    videos: Array<{ url: string; prompt: string; createdAt: Date }>
  }
  addGeneratedImage: (url: string, prompt: string) => { analysis: PromptAnalysis; events: ProgressionEvent[] }
  addGeneratedAudio: (url: string, text: string, voice: string) => void
  addGeneratedVideo: (url: string, prompt: string) => void

  // Préférences utilisateur
  userName: string
  setUserName: (name: string) => void
  
  // Nom personnalisable de l'IA (choisi par l'enfant)
  aiName: string
  setAiName: (name: string) => void
  
  // Voix de l'IA (mémorisée pour chaque utilisateur)
  aiVoice: string // Nom de la voix (ex: "Audrey", "Thomas")
  setAiVoice: (voiceName: string) => void
  
  // Voix ElevenLabs pour la narration des histoires
  narrationVoiceId: string // ID de la voix ElevenLabs
  setNarrationVoiceId: (voiceId: string) => void
  
  // Contexte émotionnel (pour que l'IA se souvienne)
  emotionalContext: string[]
  addEmotionalContext: (context: string) => void

  // Progression du prompting (5 Clés Magiques - IMAGES)
  promptingProgress: PromptingProgress
  updatePromptingProgress: (analysis: PromptAnalysis) => ProgressionEvent[]
  resetPromptingProgress: () => void
  
  // Progression du prompting (5 Questions Magiques - ÉCRITURE)
  writingProgress: WritingPromptingProgress
  updateWritingProgress: (message: string) => { analysis: WritingMessageAnalysis; events: WritingProgressionEvent[] }
  completeCurrentStory: () => WritingProgressionEvent[]
  resetWritingProgress: () => void
  
  // Étoiles gagnées (feedback visuel)
  pendingStarAnimation: boolean
  setPendingStarAnimation: (pending: boolean) => void
  
  // Derniers événements de progression (pour les notifications)
  lastProgressionEvents: ProgressionEvent[]
  lastWritingProgressionEvents: WritingProgressionEvent[]
  clearProgressionEvents: () => void
}

const generateId = () => Math.random().toString(36).substring(2, 15)

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Mode initial
      currentMode: 'book',
      setCurrentMode: (mode) => set({ currentMode: mode }),

      // Diary
      diaryEntries: [],
      currentDiaryEntry: null,
      addDiaryEntry: (entry) => {
        const newEntry: DiaryEntry = {
          ...entry,
          id: generateId(),
          date: new Date(),
        }
        set((state) => ({
          diaryEntries: [...state.diaryEntries, newEntry],
          currentDiaryEntry: newEntry,
        }))
      },
      updateDiaryEntry: (id, updates) => {
        set((state) => ({
          diaryEntries: state.diaryEntries.map((entry) =>
            entry.id === id ? { ...entry, ...updates } : entry
          ),
          currentDiaryEntry:
            state.currentDiaryEntry?.id === id
              ? { ...state.currentDiaryEntry, ...updates }
              : state.currentDiaryEntry,
        }))
      },
      setCurrentDiaryEntry: (entry) => set({ currentDiaryEntry: entry }),

      // Chat
      chatHistory: [],
      addChatMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateId(),
          timestamp: new Date(),
        }
        set((state) => ({
          chatHistory: [...state.chatHistory, newMessage],
        }))
      },
      clearChatHistory: () => set({ chatHistory: [] }),

      // Histoires structurées
      stories: [],
      currentStory: null,
      createStory: (title, structure) => {
        const template = STORY_TEMPLATES[structure]
        const pages: StoryPage[] = template.steps.map((step, index) => ({
          id: generateId(),
          stepIndex: index,
          content: '',
          order: index,
        }))
        
        // Pour le mode libre, créer une page vide
        if (structure === 'free') {
          pages.push({
            id: generateId(),
            stepIndex: 0,
            content: '',
            order: 0,
          })
        }
        
        const newStory: Story = {
          id: generateId(),
          title,
          structure,
          currentStep: 0,
          pages,
          createdAt: new Date(),
          updatedAt: new Date(),
          isComplete: false,
        }
        
        set((state) => ({
          stories: [...state.stories, newStory],
          currentStory: newStory,
        }))
        
        // Sauvegarder immédiatement dans Supabase
        saveStoryToSupabaseNow(newStory)
        
        return newStory
      },
      updateStoryPage: (storyId, pageIndex, content, image) => {
        set((state) => {
          const story = state.stories.find(s => s.id === storyId)
          if (!story) return state
          
          const updatedPages = [...story.pages]
          if (updatedPages[pageIndex]) {
            updatedPages[pageIndex] = {
              ...updatedPages[pageIndex],
              content,
              image: image || updatedPages[pageIndex].image,
            }
          }
          
          const updatedStory = {
            ...story,
            pages: updatedPages,
            updatedAt: new Date(),
          }
          
          return {
            stories: state.stories.map(s => s.id === storyId ? updatedStory : s),
            currentStory: state.currentStory?.id === storyId ? updatedStory : state.currentStory,
          }
        })
      },
      setCurrentStory: (story) => set({ currentStory: story }),
      deleteStory: (storyId) => {
        // Supprimer localement
        set((state) => ({
          stories: state.stories.filter(s => s.id !== storyId),
          currentStory: state.currentStory?.id === storyId ? null : state.currentStory,
        }))
        
        // Supprimer aussi dans Supabase
        deleteStoryFromSupabase(storyId)
      },
      goToNextStep: (storyId) => {
        set((state) => {
          const story = state.stories.find(s => s.id === storyId)
          if (!story) return state
          
          const template = STORY_TEMPLATES[story.structure]
          const maxStep = template.steps.length - 1
          const newStep = Math.min(story.currentStep + 1, maxStep)
          
          const updatedStory = {
            ...story,
            currentStep: newStep,
            updatedAt: new Date(),
          }
          
          return {
            stories: state.stories.map(s => s.id === storyId ? updatedStory : s),
            currentStory: state.currentStory?.id === storyId ? updatedStory : state.currentStory,
          }
        })
      },
      goToPrevStep: (storyId) => {
        set((state) => {
          const story = state.stories.find(s => s.id === storyId)
          if (!story) return state
          
          const newStep = Math.max(story.currentStep - 1, 0)
          
          const updatedStory = {
            ...story,
            currentStep: newStep,
            updatedAt: new Date(),
          }
          
          return {
            stories: state.stories.map(s => s.id === storyId ? updatedStory : s),
            currentStory: state.currentStory?.id === storyId ? updatedStory : state.currentStory,
          }
        })
      },
      completeStory: (storyId) => {
        set((state) => {
          const story = state.stories.find(s => s.id === storyId)
          if (!story) return state
          
          const updatedStory = {
            ...story,
            isComplete: true,
            updatedAt: new Date(),
          }
          
          return {
            stories: state.stories.map(s => s.id === storyId ? updatedStory : s),
            currentStory: state.currentStory?.id === storyId ? updatedStory : state.currentStory,
          }
        })
      },
      
      // Gestion des chapitres
      addStoryChapter: (storyId, chapter) => {
        set((state) => {
          const story = state.stories.find(s => s.id === storyId)
          if (!story) return state
          
          const updatedStory = {
            ...story,
            chapters: [...(story.chapters || []), chapter],
            updatedAt: new Date(),
          }
          
          return {
            stories: state.stories.map(s => s.id === storyId ? updatedStory : s),
            currentStory: state.currentStory?.id === storyId ? updatedStory : state.currentStory,
          }
        })
      },
      deleteStoryChapter: (storyId, chapterId) => {
        set((state) => {
          const story = state.stories.find(s => s.id === storyId)
          if (!story) return state
          
          // Supprimer le chapitre et désassigner les pages
          const updatedStory = {
            ...story,
            chapters: (story.chapters || []).filter(c => c.id !== chapterId),
            pages: story.pages.map(p => p.chapterId === chapterId ? { ...p, chapterId: undefined } : p),
            updatedAt: new Date(),
          }
          
          return {
            stories: state.stories.map(s => s.id === storyId ? updatedStory : s),
            currentStory: state.currentStory?.id === storyId ? updatedStory : state.currentStory,
          }
        })
      },
      updateStoryChapters: (storyId, chapters) => {
        set((state) => {
          const story = state.stories.find(s => s.id === storyId)
          if (!story) return state
          
          const updatedStory = {
            ...story,
            chapters,
            updatedAt: new Date(),
          }
          
          return {
            stories: state.stories.map(s => s.id === storyId ? updatedStory : s),
            currentStory: state.currentStory?.id === storyId ? updatedStory : state.currentStory,
          }
        })
      },
      updateStoryPages: (storyId, pages) => {
        set((state) => {
          const story = state.stories.find(s => s.id === storyId)
          if (!story) return state
          
          const updatedStory = {
            ...story,
            pages,
            updatedAt: new Date(),
          }
          
          return {
            stories: state.stories.map(s => s.id === storyId ? updatedStory : s),
            currentStory: state.currentStory?.id === storyId ? updatedStory : state.currentStory,
          }
        })
      },

      // Projets (legacy)
      currentProject: null,
      projects: [],
      createProject: (title) => {
        const newProject: Project = {
          id: generateId(),
          title,
          createdAt: new Date(),
          updatedAt: new Date(),
          chapters: [],
          assets: { images: [], audios: [], videos: [] },
        }
        set((state) => ({
          projects: [...state.projects, newProject],
          currentProject: newProject,
        }))
      },
      updateProject: (updates) => {
        set((state) => ({
          currentProject: state.currentProject
            ? { ...state.currentProject, ...updates, updatedAt: new Date() }
            : null,
        }))
      },
      addChapter: (chapter) => {
        set((state) => {
          if (!state.currentProject) return state
          const newChapter: StoryChapter = {
            ...chapter,
            id: generateId(),
            order: state.currentProject.chapters.length,
          }
          return {
            currentProject: {
              ...state.currentProject,
              chapters: [...state.currentProject.chapters, newChapter],
              updatedAt: new Date(),
            },
          }
        })
      },

      // Assets avec analyse de prompt
      generatedAssets: { images: [], audios: [], videos: [] },
      addGeneratedImage: (url, prompt) => {
        // Analyser le prompt
        const analysis = analyzePromptFn(prompt)
        
        // Mettre à jour la progression
        const events = get().updatePromptingProgress(analysis)
        
        // Vérifier si on a gagné une étoile
        const hasStarEvent = events.some(e => e.type === 'star_earned')
        if (hasStarEvent) {
          set({ pendingStarAnimation: true })
        }
        
        // Ajouter l'image avec son analyse
        set((state) => ({
          generatedAssets: {
            ...state.generatedAssets,
            images: [
              ...state.generatedAssets.images,
              { url, prompt, createdAt: new Date(), analysis },
            ],
          },
          lastProgressionEvents: events,
        }))
        
        return { analysis, events }
      },
      addGeneratedAudio: (url, text, voice) => {
        set((state) => ({
          generatedAssets: {
            ...state.generatedAssets,
            audios: [
              ...state.generatedAssets.audios,
              { url, text, voice, createdAt: new Date() },
            ],
          },
        }))
      },
      addGeneratedVideo: (url, prompt) => {
        set((state) => ({
          generatedAssets: {
            ...state.generatedAssets,
            videos: [
              ...state.generatedAssets.videos,
              { url, prompt, createdAt: new Date() },
            ],
          },
        }))
      },

      // Préférences
      userName: '',
      setUserName: (name) => set({ userName: name }),
      
      // Nom de l'IA (personnalisable, vide par défaut = l'enfant choisit à la première connexion)
      aiName: '',
      setAiName: (name) => set({ aiName: name }),
      
      // Voix de l'IA (mémorisée, Audrey Premium par défaut)
      aiVoice: 'Audrey',
      setAiVoice: (voiceName) => set({ aiVoice: voiceName }),
      
      // Voix ElevenLabs pour la narration (vide = voix par défaut selon la langue)
      narrationVoiceId: '',
      setNarrationVoiceId: (voiceId) => set({ narrationVoiceId: voiceId }),

      // Contexte émotionnel
      emotionalContext: [],
      addEmotionalContext: (context) => {
        set((state) => ({
          emotionalContext: [...state.emotionalContext.slice(-9), context],
        }))
      },

      // Progression du prompting (5 Clés Magiques - IMAGES)
      promptingProgress: getInitialProgress(),
      updatePromptingProgress: (analysis) => {
        const currentProgress = get().promptingProgress
        const { newProgress, events } = updateProgression(currentProgress, analysis)
        
        set({ promptingProgress: newProgress })
        
        return events
      },
      resetPromptingProgress: () => {
        set({ promptingProgress: getInitialProgress() })
      },
      
      // Progression du prompting (5 Questions Magiques - ÉCRITURE)
      writingProgress: getInitialWritingProgress(),
      updateWritingProgress: (message: string) => {
        const analysis = analyzeWritingMessageFn(message)
        const currentProgress = get().writingProgress
        const { newProgress, events } = updateWritingProgression(currentProgress, analysis)
        
        set({ 
          writingProgress: newProgress,
          lastWritingProgressionEvents: events,
        })
        
        // Vérifier si on a un level up pour l'animation
        const hasLevelUp = events.some(e => e.type === 'level_up')
        if (hasLevelUp) {
          set({ pendingStarAnimation: true })
        }
        
        return { analysis, events }
      },
      completeCurrentStory: () => {
        const currentProgress = get().writingProgress
        const { newProgress, events } = completeStoryFn(currentProgress)
        
        set({ 
          writingProgress: newProgress,
          lastWritingProgressionEvents: events,
        })
        
        return events
      },
      resetWritingProgress: () => {
        set({ writingProgress: getInitialWritingProgress() })
      },
      
      // Animation étoile
      pendingStarAnimation: false,
      setPendingStarAnimation: (pending) => set({ pendingStarAnimation: pending }),
      
      // Événements de progression
      lastProgressionEvents: [],
      lastWritingProgressionEvents: [],
      clearProgressionEvents: () => set({ lastProgressionEvents: [], lastWritingProgressionEvents: [] }),
    }),
    {
      name: 'lavoixdusoir-storage',
      partialize: (state) => ({
        diaryEntries: state.diaryEntries,
        chatHistory: state.chatHistory,
        stories: state.stories,
        currentStory: state.currentStory,
        projects: state.projects,
        currentProject: state.currentProject,
        generatedAssets: state.generatedAssets,
        userName: state.userName,
        aiName: state.aiName, // Nom personnalisé de l'IA - persisté pour chaque utilisateur
        aiVoice: state.aiVoice, // Voix de l'IA - persistée pour chaque utilisateur
        narrationVoiceId: state.narrationVoiceId, // Voix ElevenLabs pour narration
        emotionalContext: state.emotionalContext,
        promptingProgress: state.promptingProgress,
        writingProgress: state.writingProgress,
      }),
    }
  )
)
