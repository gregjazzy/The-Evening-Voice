import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from './useAuthStore'

// =============================================================================
// TYPES - Livre audio enrichi (page par page)
// =============================================================================

/**
 * Position temporelle d'un élément
 */
export interface TimeRange {
  startTime: number
  endTime: number
  fadeIn?: number
  fadeOut?: number
}

/**
 * Une phrase (pour affichage du texte, pas pour le timing audio)
 */
export interface PhraseTiming {
  id: string
  text: string
  index: number
  timeRange: TimeRange
  audioTimeRange?: TimeRange
}

/**
 * Source de la voix
 */
export type VoiceSource = 'recorded' | 'tts'

/**
 * Piste de narration (voix du parent)
 */
export interface NarrationTrack {
  id: string
  audioUrl?: string
  source: VoiceSource
  duration: number
  phrases: PhraseTiming[]
  volume?: number
}

/**
 * Type de média
 */
export type MediaType = 'video' | 'image'

/**
 * Un média (vidéo ou image) sur la page
 */
export interface MediaTrack {
  id: string
  type: MediaType
  url: string
  name: string
  timeRange: TimeRange
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  zIndex: number
  loop?: boolean
  muted?: boolean
  opacity?: number
  playbackRate?: number  // 0.1 à 1.0 (ralenti vidéo)
  fadeIn?: number
  fadeOut?: number
  filter?: {
    blur?: number
    brightness?: number
    saturate?: number
  }
}

/**
 * Type de son
 */
export type SoundType = 'sfx' | 'ambiance'

/**
 * Un effet sonore
 */
export interface SoundTrack {
  id: string
  url: string
  name: string
  type: SoundType
  timeRange: TimeRange
  volume: number
  loop: boolean
}

/**
 * Type de musique
 */
export type MusicType = 'background' | 'theme' | 'loop'

/**
 * Une piste musique de fond
 */
export interface MusicTrack {
  id: string
  url: string
  name: string
  type: MusicType
  timeRange: TimeRange
  volume: number
  loop: boolean
  fadeIn?: number
  fadeOut?: number
}

/**
 * Une page/scène du livre
 */
export interface MontageScene {
  id: string
  bookPageId: string
  title: string
  text: string
  phrases: string[]
  duration: number
  narration: NarrationTrack
  mediaTracks: MediaTrack[]
  musicTracks: MusicTrack[]
  soundTracks: SoundTrack[]
  displayDuration?: number  // Durée d'affichage en secondes (pour pages sans narration)
}

/**
 * Projet de montage (livre audio)
 */
export interface MontageProject {
  id: string
  storyId: string
  title: string
  scenes: MontageScene[]
  createdAt: Date
  updatedAt: Date
  isComplete: boolean
  defaultMusicVolume: number  // 0-100, défaut 30
}

// =============================================================================
// HELPERS
// =============================================================================

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

function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&hellip;/g, '...')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitIntoPhrases(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  return sentences.map(s => s.trim()).filter(s => s.length > 0)
}

// =============================================================================
// STORE
// =============================================================================

interface MontageState {
  currentProject: MontageProject | null
  currentSceneIndex: number
  projects: MontageProject[]

  // === ACTIONS PROJET ===
  createProject: (storyId: string, title: string, pages: { id: string; title: string; text: string; images?: { url: string; type?: 'image' | 'video' }[]; backgroundMedia?: { url: string; type?: 'image' | 'video' } }[]) => MontageProject
  loadProject: (projectId: string) => void
  closeProject: () => void
  updateProject: (updates: Partial<MontageProject>) => void
  deleteProject: (projectId: string) => void

  // === ACTIONS SCÈNE ===
  setCurrentScene: (index: number) => void
  getCurrentScene: () => MontageScene | null
  updateCurrentScene: (updates: Partial<MontageScene>) => void
  insertScene: (afterIndex: number) => void
  deleteScene: (index: number) => void

  // === ACTIONS NARRATION ===
  setNarrationAudio: (audioUrl: string, source: VoiceSource, duration: number) => void
  clearNarrationAudio: () => void
  updateNarrationVolume: (volume: number) => void

  // === ACTIONS MÉDIAS ===
  addMediaTrack: (track: Omit<MediaTrack, 'id'>) => void
  updateMediaTrack: (trackId: string, updates: Partial<MediaTrack>) => void
  deleteMediaTrack: (trackId: string) => void

  // === ACTIONS MUSIQUE ===
  addMusicTrack: (track: Omit<MusicTrack, 'id'>) => void
  updateMusicTrack: (trackId: string, updates: Partial<MusicTrack>) => void
  deleteMusicTrack: (trackId: string) => void
  applyMusicToScenes: (from: 'all' | 'fromHere') => void

  // === ACTIONS SONS ===
  addSoundTrack: (track: Omit<SoundTrack, 'id'>) => void
  updateSoundTrack: (trackId: string, updates: Partial<SoundTrack>) => void
  deleteSoundTrack: (trackId: string) => void
}

export const useMontageStore = create<MontageState>()(
  (set, get) => ({
    currentProject: null,
    currentSceneIndex: 0,
    projects: [],

    // === ACTIONS PROJET ===
    createProject: (storyId, title, pages) => {
      const scenes: MontageScene[] = pages.map((page) => {
        const cleanText = stripHtml(page.text)
        const phrases = splitIntoPhrases(cleanText)

        const mediaTracks: MediaTrack[] = []

        if (page.backgroundMedia?.url) {
          mediaTracks.push({
            id: generateId(),
            type: (page.backgroundMedia.type as MediaType) || 'image',
            url: page.backgroundMedia.url,
            name: 'Fond de page',
            timeRange: { startTime: 0, endTime: 10 },
            position: { x: 0, y: 0, width: 100, height: 100 },
            zIndex: 1,
            opacity: 1,
          })
        }

        if (page.images) {
          page.images.forEach((img, i) => {
            mediaTracks.push({
              id: generateId(),
              type: (img.type as MediaType) || 'image',
              url: img.url,
              name: `Image ${i + 1}`,
              timeRange: { startTime: 0, endTime: 10 },
              position: { x: 10, y: 10, width: 80, height: 80 },
              zIndex: 10 + i,
              opacity: 1,
            })
          })
        }

        return {
          id: generateId(),
          bookPageId: page.id,
          title: page.title || `Scène ${pages.indexOf(page) + 1}`,
          text: cleanText,
          phrases,
          duration: 0,
          narration: {
            id: generateId(),
            source: 'recorded',
            duration: 0,
            phrases: phrases.map((text, index) => ({
              id: generateId(),
              text,
              index,
              timeRange: { startTime: 0, endTime: 0 },
            })),
          },
          mediaTracks,
          musicTracks: [],
          soundTracks: [],
        }
      })

      const newProject: MontageProject = {
        id: generateId(),
        storyId,
        title,
        scenes,
        createdAt: new Date(),
        updatedAt: new Date(),
        isComplete: false,
        defaultMusicVolume: 30,
      }

      set((state) => ({
        projects: [...state.projects, newProject],
        currentProject: newProject,
        currentSceneIndex: 0,
      }))

      return newProject
    },

    loadProject: (projectId) => {
      const project = get().projects.find((p) => p.id === projectId)
      if (project) {
        set({ currentProject: project, currentSceneIndex: 0 })
      }
    },

    closeProject: () => {
      set({ currentProject: null, currentSceneIndex: 0 })
    },

    updateProject: (updates) => {
      set((state) => {
        if (!state.currentProject) return state
        const updatedProject = {
          ...state.currentProject,
          ...updates,
          updatedAt: new Date(),
        }
        return {
          currentProject: updatedProject,
          projects: state.projects.map((p) =>
            p.id === updatedProject.id ? updatedProject : p
          ),
        }
      })
    },

    deleteProject: (projectId) => {
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
        currentSceneIndex: state.currentProject?.id === projectId ? 0 : state.currentSceneIndex,
      }))

      const profileId = useAuthStore.getState().profile?.id
      if (profileId) {
        supabase
          .from('montage_projects')
          .delete()
          .eq('id', projectId)
          .eq('profile_id', profileId)
          .then(({ error }) => {
            if (error) console.error('Erreur suppression montage Supabase:', error)
          })
      }
    },

    // === ACTIONS SCÈNE ===
    setCurrentScene: (index) => {
      const project = get().currentProject
      if (project && index >= 0 && index < project.scenes.length) {
        set({ currentSceneIndex: index })
      }
    },

    getCurrentScene: () => {
      const { currentProject, currentSceneIndex } = get()
      if (!currentProject) return null
      return currentProject.scenes[currentSceneIndex] || null
    },

    updateCurrentScene: (updates) => {
      set((state) => {
        if (!state.currentProject) return state
        const updatedScenes = [...state.currentProject.scenes]
        updatedScenes[state.currentSceneIndex] = {
          ...updatedScenes[state.currentSceneIndex],
          ...updates,
        }
        const updatedProject = {
          ...state.currentProject,
          scenes: updatedScenes,
          updatedAt: new Date(),
        }
        return {
          currentProject: updatedProject,
          projects: state.projects.map((p) =>
            p.id === updatedProject.id ? updatedProject : p
          ),
        }
      })
    },

    insertScene: (afterIndex) => {
      set((state) => {
        if (!state.currentProject) return state
        const newScene: MontageScene = {
          id: generateId(),
          bookPageId: '',
          title: '',
          text: '',
          phrases: [],
          duration: 0,
          narration: {
            id: generateId(),
            source: 'recorded',
            duration: 0,
            phrases: [],
          },
          mediaTracks: [],
          musicTracks: [],
          soundTracks: [],
          displayDuration: 5,
        }
        const scenes = [...state.currentProject.scenes]
        const insertAt = Math.min(afterIndex + 1, scenes.length)
        scenes.splice(insertAt, 0, newScene)
        const updatedProject = { ...state.currentProject, scenes, updatedAt: new Date() }
        return {
          currentProject: updatedProject,
          currentSceneIndex: insertAt,
          projects: state.projects.map((p) => p.id === updatedProject.id ? updatedProject : p),
        }
      })
    },

    deleteScene: (index) => {
      set((state) => {
        if (!state.currentProject || state.currentProject.scenes.length <= 1) return state
        const scenes = state.currentProject.scenes.filter((_, i) => i !== index)
        let newIndex = state.currentSceneIndex
        if (newIndex >= scenes.length) newIndex = scenes.length - 1
        else if (index < newIndex) newIndex--
        const updatedProject = { ...state.currentProject, scenes, updatedAt: new Date() }
        return {
          currentProject: updatedProject,
          currentSceneIndex: newIndex,
          projects: state.projects.map((p) => p.id === updatedProject.id ? updatedProject : p),
        }
      })
    },

    // === ACTIONS NARRATION ===
    setNarrationAudio: (audioUrl, source, duration) => {
      const scene = get().getCurrentScene()
      if (!scene) return

      get().updateCurrentScene({
        duration,
        narration: {
          ...scene.narration,
          audioUrl,
          source,
          duration,
        },
      })
    },

    clearNarrationAudio: () => {
      const scene = get().getCurrentScene()
      if (!scene) return

      get().updateCurrentScene({
        duration: 0,
        narration: {
          ...scene.narration,
          audioUrl: undefined,
          duration: 0,
          phrases: scene.phrases.map((text, index) => ({
            id: generateId(),
            text,
            index,
            timeRange: { startTime: 0, endTime: 0 },
          })),
        },
      })
    },

    updateNarrationVolume: (volume) => {
      const scene = get().getCurrentScene()
      if (!scene) return

      get().updateCurrentScene({
        narration: {
          ...scene.narration,
          volume: Math.max(0, Math.min(1, volume)),
        },
      })
    },

    // === ACTIONS MÉDIAS ===
    addMediaTrack: (track) => {
      const scene = get().getCurrentScene()
      if (!scene) return

      get().updateCurrentScene({
        mediaTracks: [...scene.mediaTracks, { ...track, id: generateId() }],
      })
    },

    updateMediaTrack: (trackId, updates) => {
      const scene = get().getCurrentScene()
      if (!scene) return

      get().updateCurrentScene({
        mediaTracks: scene.mediaTracks.map((t) =>
          t.id === trackId ? { ...t, ...updates } : t
        ),
      })
    },

    deleteMediaTrack: (trackId) => {
      const scene = get().getCurrentScene()
      if (!scene) return

      get().updateCurrentScene({
        mediaTracks: scene.mediaTracks.filter((t) => t.id !== trackId),
      })
    },

    // === ACTIONS MUSIQUE ===
    addMusicTrack: (track) => {
      const scene = get().getCurrentScene()
      if (!scene) return

      get().updateCurrentScene({
        musicTracks: [...(scene.musicTracks || []), { ...track, id: generateId() }],
      })
    },

    updateMusicTrack: (trackId, updates) => {
      const scene = get().getCurrentScene()
      if (!scene) return

      get().updateCurrentScene({
        musicTracks: (scene.musicTracks || []).map((t) =>
          t.id === trackId ? { ...t, ...updates } : t
        ),
      })
    },

    deleteMusicTrack: (trackId) => {
      const scene = get().getCurrentScene()
      if (!scene) return

      get().updateCurrentScene({
        musicTracks: (scene.musicTracks || []).filter((t) => t.id !== trackId),
      })
    },

    applyMusicToScenes: (from) => {
      set((state) => {
        if (!state.currentProject) return state
        const currentScene = state.currentProject.scenes[state.currentSceneIndex]
        const musicTrack = currentScene?.musicTracks?.[0]
        if (!musicTrack) return state

        const startIndex = from === 'all' ? 0 : state.currentSceneIndex
        const updatedScenes = state.currentProject.scenes.map((scene, i) => {
          if (i < startIndex) return scene
          return { ...scene, musicTracks: [{ ...musicTrack, id: generateId() }] }
        })
        const updatedProject = { ...state.currentProject, scenes: updatedScenes, updatedAt: new Date() }
        return {
          currentProject: updatedProject,
          projects: state.projects.map((p) => p.id === updatedProject.id ? updatedProject : p),
        }
      })
    },

    // === ACTIONS SONS ===
    addSoundTrack: (track) => {
      const scene = get().getCurrentScene()
      if (!scene) return

      get().updateCurrentScene({
        soundTracks: [...(scene.soundTracks || []), { ...track, id: generateId() }],
      })
    },

    updateSoundTrack: (trackId, updates) => {
      const scene = get().getCurrentScene()
      if (!scene) return

      get().updateCurrentScene({
        soundTracks: scene.soundTracks.map((t) =>
          t.id === trackId ? { ...t, ...updates } : t
        ),
      })
    },

    deleteSoundTrack: (trackId) => {
      const scene = get().getCurrentScene()
      if (!scene) return

      get().updateCurrentScene({
        soundTracks: scene.soundTracks.filter((t) => t.id !== trackId),
      })
    },
  })
)
