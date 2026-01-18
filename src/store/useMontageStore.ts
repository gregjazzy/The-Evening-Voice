import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// =============================================================================
// TYPES - Système de timeline basé sur le TEMPS (secondes)
// =============================================================================

/**
 * Position temporelle d'un élément sur la timeline
 */
export interface TimeRange {
  startTime: number      // Début en secondes
  endTime: number        // Fin en secondes
  fadeIn?: number        // Durée fondu entrée (secondes)
  fadeOut?: number       // Durée fondu sortie (secondes)
}

/**
 * Une phrase avec son timing
 */
export interface PhraseTiming {
  id: string
  text: string              // Contenu de la phrase
  index: number             // Position dans le texte (0, 1, 2...)
  timeRange: TimeRange      // Position sur la TIMELINE (modifiable par l'utilisateur)
  audioTimeRange?: TimeRange // Timing ORIGINAL dans le fichier audio (immuable, pour lecture)
}

/**
 * Source de la voix
 */
export type VoiceSource = 'recorded' | 'tts'

/**
 * Piste de narration (voix)
 */
export interface NarrationTrack {
  id: string
  audioUrl?: string      // URL de l'audio (enregistré ou TTS)
  source: VoiceSource
  ttsVoice?: string      // Voix ElevenLabs si TTS
  duration: number       // Durée totale en secondes
  phrases: PhraseTiming[] // Timing de chaque phrase
  isSynced: boolean
}

/**
 * Type de média
 */
export type MediaType = 'video' | 'image'

/**
 * Un média (vidéo ou image) sur la timeline
 */
export interface MediaTrack {
  id: string
  type: MediaType
  url: string
  name: string
  timeRange: TimeRange   // Position sur la timeline
  position: {            // Position dans le canvas (%)
    x: number
    y: number
    width: number
    height: number
  }
  zIndex: number
  loop?: boolean         // Pour vidéos
  muted?: boolean        // Pour vidéos
  // Options visuelles
  opacity?: number       // 0-1 (défaut: 1)
  fadeIn?: number        // Durée fondu entrée (secondes)
  fadeOut?: number       // Durée fondu sortie (secondes)
  filter?: {             // Filtres CSS optionnels
    blur?: number        // Flou en pixels
    brightness?: number  // 0-200 (100 = normal)
    saturate?: number    // 0-200 (100 = normal)
  }
}

/**
 * Type de son
 */
export type SoundType = 'sfx' | 'ambiance'

/**
 * Un son (effet sonore) sur la timeline
 */
export interface SoundTrack {
  id: string
  url: string
  name: string
  type: SoundType
  timeRange: TimeRange
  volume: number         // 0-1
  loop: boolean
}

/**
 * Type de musique
 */
export type MusicType = 'background' | 'theme' | 'loop'

/**
 * Une piste musique sur la timeline
 */
export interface MusicTrack {
  id: string
  url: string
  name: string
  type: MusicType
  timeRange: TimeRange
  volume: number         // 0-1
  loop: boolean
  fadeIn?: number        // Fondu entrée en secondes
  fadeOut?: number       // Fondu sortie en secondes
}

/**
 * Type de décoration
 */
export type DecorationType = 'sticker' | 'emoji' | 'shape' | 'animation'

/**
 * Une décoration/sticker sur la timeline
 */
export interface DecorationTrack {
  id: string
  type: DecorationType
  assetUrl?: string      // URL du sticker/image
  emoji?: string         // Émoji si type=emoji
  name: string
  timeRange: TimeRange
  position: {            // Position dans le canvas (%)
    x: number
    y: number
    width: number
    height: number
    rotation?: number    // Rotation en degrés
  }
  animation?: {
    type: 'bounce' | 'pulse' | 'spin' | 'float' | 'shake'
    duration: number     // Durée d'un cycle
    delay?: number       // Délai avant animation
  }
  zIndex: number
  // Options visuelles
  opacity?: number       // 0-1 (défaut: 1)
  fadeIn?: number        // Durée fondu entrée (secondes)
  fadeOut?: number       // Durée fondu sortie (secondes)
  scale?: number         // Échelle (défaut: 1)
  glow?: {               // Effet de lueur
    enabled: boolean
    color?: string       // Couleur de la lueur
    intensity?: number   // 0-100
  }
}

/**
 * Un état de lumière sur la timeline
 */
export interface LightTrack {
  id: string
  timeRange: TimeRange
  color: string          // Hex
  intensity: number      // 0-100
  // Options de transition
  fadeIn?: number        // Durée fondu entrée (secondes)
  fadeOut?: number       // Durée fondu sortie (secondes)
  pulse?: {              // Animation de pulsation
    enabled: boolean
    speed?: number       // Vitesse 0-100
    minIntensity?: number // Intensité min (défaut: intensity * 0.5)
  }
}

/**
 * Type d'effet de texte
 */
export type TextEffectType = 'highlight' | 'glow' | 'shake' | 'scale' | 'fadeIn'

/**
 * Un effet de texte sur la timeline
 */
export interface TextEffectTrack {
  id: string
  type: TextEffectType
  phraseIndex: number    // Quelle phrase est affectée (-1 = toutes)
  timeRange: TimeRange
  color?: string
  intensity?: number     // 0-100
  // Options visuelles
  opacity?: number       // 0-1 (défaut: 1)
  fadeIn?: number        // Durée fondu entrée (secondes)
  fadeOut?: number       // Durée fondu sortie (secondes)
}

/**
 * Type d'animation - Effets plein écran ou localisés
 */
export type AnimationType = 
  // === EFFETS PLEIN ÉCRAN (ambiance) ===
  | 'falling-stars'      // Étoiles qui tombent du ciel
  | 'floating-hearts'    // Cœurs qui flottent partout
  | 'sparkles'           // Étincelles éparpillées
  | 'bubbles'            // Bulles flottantes
  | 'snow'               // Neige qui tombe
  | 'leaves'             // Feuilles d'automne
  | 'fireflies'          // Lucioles dans la nuit
  | 'confetti'           // Confettis de fête
  | 'rain'               // Pluie
  | 'clouds'             // Nuages qui passent
  | 'magic-dust'         // Poussière magique
  | 'butterflies'        // Papillons volants
  | 'flower-petals'      // Pétales de fleurs
  | 'feathers'           // Plumes qui tombent
  | 'fairy-dust'         // Poussière de fée (dorée)
  // === EFFETS LOCALISÉS (avec préfixe localized-) ===
  | 'localized-sparkle'          // Étoiles baguette magique
  | 'localized-heart-explosion'  // Explosion de cœurs
  | 'localized-star-burst'       // Explosion d'étoiles
  | 'localized-magic-trail'      // Traînée d'étincelles
  | 'localized-floating-hearts'  // Cœurs qui s'envolent
  | 'localized-magic-swirl'      // Tourbillon magique
  | 'localized-pixie-dust'       // Poussière de fée
  | 'localized-golden-sparkles'  // Étincelles dorées
  | 'localized-rainbow-burst'    // Arc-en-ciel
  | 'localized-fairy-circle'     // Cercle de fées
  | 'localized-wishing-stars'    // Étoiles de vœux
  | 'localized-kiss-hearts'      // Bisous/cœurs
  | 'localized-magic-portal'     // Portail magique
  | 'localized-enchanted-glow'   // Lueur enchantée
  | 'localized-shimmer'          // Scintillements

/**
 * Catégorie d'animation pour l'UI
 */
export type AnimationCategory = 'fullscreen' | 'localized'

/**
 * Une animation sur la timeline (plein écran ou localisée)
 */
export interface AnimationTrack {
  id: string
  type: AnimationType
  name: string
  category: AnimationCategory  // Plein écran ou localisé
  timeRange: TimeRange
  intensity: number      // Densité/vitesse 0-100
  color?: string         // Couleur principale (optionnel)
  secondaryColor?: string // Couleur secondaire pour dégradés
  size?: 'small' | 'medium' | 'large'  // Taille des particules
  direction?: 'up' | 'down' | 'left' | 'right' | 'radial' | 'random'
  speed?: number         // Vitesse 0-100 (défaut: 50)
  
  // Position pour effets localisés (en % du canvas)
  position?: {
    x: number            // 0-100 (centre de l'effet)
    y: number            // 0-100 (centre de l'effet)
    radius?: number      // Rayon de l'effet (défaut: 20%)
  }
  
  // Options visuelles
  opacity?: number       // 0-1 (défaut: 1)
  fadeIn?: number        // Durée fondu entrée (secondes)
  fadeOut?: number       // Durée fondu sortie (secondes)
  blend?: 'normal' | 'screen' | 'overlay' | 'soft-light'  // Mode de fusion
  glow?: boolean         // Ajouter un effet de lueur
}

/**
 * Une scène (moment) dans le montage
 */
export interface MontageScene {
  id: string
  bookPageId: string     // Référence vers la page du livre
  title: string
  
  // Texte découpé en phrases
  text: string
  phrases: string[]      // Texte splitté en phrases
  
  // Durée totale de la scène (définie par la voix)
  duration: number       // En secondes
  
  // Zones intro/outro (avant et après la narration)
  introDuration: number  // Durée de l'intro en secondes (défaut: 0)
  outroDuration: number  // Durée de l'outro en secondes (défaut: 0)
  narrationZoneDuration?: number  // Durée de la zone narration (si > narration.duration, permet d'étendre)
  
  // Pistes (rubans)
  narration: NarrationTrack
  mediaTracks: MediaTrack[]      // Vidéos et images
  musicTracks: MusicTrack[]      // Musique de fond
  soundTracks: SoundTrack[]      // Effets sonores
  lightTracks: LightTrack[]      // Lumières HomeKit
  decorationTracks: DecorationTrack[]  // Stickers et décorations
  animationTracks: AnimationTrack[]    // Animations de fond (particules)
  textEffectTracks: TextEffectTrack[]  // Effets sur le texte
}

/**
 * Projet de montage complet
 */
export interface MontageProject {
  id: string
  storyId: string
  title: string
  scenes: MontageScene[]
  createdAt: Date
  updatedAt: Date
  isComplete: boolean
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Génère un UUID valide
 */
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

/**
 * Nettoie le texte des balises HTML
 */
function stripHtml(html: string): string {
  if (!html) return ''
  let text = html
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
  return text
}

/**
 * Découpe un texte en phrases
 */
function splitIntoPhrases(text: string): string[] {
  // Séparer par ponctuation de fin de phrase, en gardant la ponctuation
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  return sentences.map(s => s.trim()).filter(s => s.length > 0)
}

/**
 * Crée un TimeRange par défaut
 */
function createDefaultTimeRange(startTime: number = 0, duration: number = 5): TimeRange {
  return {
    startTime,
    endTime: startTime + duration,
    fadeIn: 0.5,
    fadeOut: 0.5,
  }
}

// =============================================================================
// STORE
// =============================================================================

interface MontageState {
  // Projet en cours
  currentProject: MontageProject | null
  currentSceneIndex: number
  
  // Liste des projets
  projects: MontageProject[]
  
  // État de l'éditeur
  selectedTrackId: string | null
  selectedTrackType: 'media' | 'music' | 'sound' | 'light' | 'decoration' | 'animation' | 'effect' | null
  isPlaying: boolean
  currentPlaybackTime: number
  
  // Mode sync (jeu de rythme)
  isSyncing: boolean
  syncPhraseIndex: number
  syncStartTime: number | null  // Timestamp début audio
  
  // Vue
  viewMode: 'cards' | 'timeline'
  
  // === ACTIONS PROJET ===
  createProject: (storyId: string, title: string, pages: { id: string; title: string; text: string }[]) => MontageProject
  loadProject: (projectId: string) => void
  closeProject: () => void
  updateProject: (updates: Partial<MontageProject>) => void
  deleteProject: (projectId: string) => void
  
  // === ACTIONS SCÈNE ===
  setCurrentScene: (index: number) => void
  getCurrentScene: () => MontageScene | null
  updateCurrentScene: (updates: Partial<MontageScene>) => void
  
  // === ACTIONS NARRATION ===
  setNarrationAudio: (audioUrl: string, source: VoiceSource, duration: number, ttsVoice?: string) => void
  clearNarrationAudio: () => void
  
  // === ACTIONS SYNC PHRASES (Jeu de rythme) ===
  startPhraseSync: (audioStartTime: number) => void
  markPhraseStart: (currentAudioTime: number) => void
  stopPhraseSync: () => void
  setPhraseTimings: (timings: PhraseTiming[]) => void
  updatePhraseTiming: (phraseId: string, updates: Partial<PhraseTiming>) => void
  
  // === ACTIONS MÉDIAS ===
  addMediaTrack: (track: Omit<MediaTrack, 'id'>) => void
  updateMediaTrack: (trackId: string, updates: Partial<MediaTrack>) => void
  deleteMediaTrack: (trackId: string) => void
  
  // === ACTIONS MUSIQUE ===
  addMusicTrack: (track: Omit<MusicTrack, 'id'>) => void
  updateMusicTrack: (trackId: string, updates: Partial<MusicTrack>) => void
  deleteMusicTrack: (trackId: string) => void
  
  // === ACTIONS SONS ===
  addSoundTrack: (track: Omit<SoundTrack, 'id'>) => void
  updateSoundTrack: (trackId: string, updates: Partial<SoundTrack>) => void
  deleteSoundTrack: (trackId: string) => void
  
  // === ACTIONS LUMIÈRES ===
  addLightTrack: (track: Omit<LightTrack, 'id'>) => void
  updateLightTrack: (trackId: string, updates: Partial<LightTrack>) => void
  deleteLightTrack: (trackId: string) => void
  
  // === ACTIONS DÉCORATIONS ===
  addDecorationTrack: (track: Omit<DecorationTrack, 'id'>) => void
  updateDecorationTrack: (trackId: string, updates: Partial<DecorationTrack>) => void
  deleteDecorationTrack: (trackId: string) => void
  
  // === ACTIONS ANIMATIONS ===
  addAnimationTrack: (track: Omit<AnimationTrack, 'id'>) => void
  updateAnimationTrack: (trackId: string, updates: Partial<AnimationTrack>) => void
  deleteAnimationTrack: (trackId: string) => void
  
  // === ACTIONS EFFETS TEXTE ===
  addTextEffect: (effect: Omit<TextEffectTrack, 'id'>) => void
  updateTextEffect: (effectId: string, updates: Partial<TextEffectTrack>) => void
  deleteTextEffect: (effectId: string) => void
  
  // === ACTIONS INTRO/OUTRO/NARRATION ZONE ===
  setIntroDuration: (duration: number) => void
  setOutroDuration: (duration: number) => void
  setNarrationZoneDuration: (duration: number) => void
  
  // === ACTIONS UI ===
  setSelectedTrack: (id: string | null, type: 'media' | 'music' | 'sound' | 'light' | 'decoration' | 'animation' | 'effect' | null) => void
  clearSelection: () => void
  setIsPlaying: (playing: boolean) => void
  setPlaybackTime: (time: number) => void
  setViewMode: (mode: 'cards' | 'timeline') => void
  
  // === HELPERS ===
  getSceneDuration: () => number
  getActivePhrase: (time: number) => PhraseTiming | null
}

export const useMontageStore = create<MontageState>()(
  persist(
    (set, get) => ({
      // État initial
      currentProject: null,
      currentSceneIndex: 0,
      projects: [],
      selectedTrackId: null,
      selectedTrackType: null,
      isPlaying: false,
      currentPlaybackTime: 0,
      isSyncing: false,
      syncPhraseIndex: 0,
      syncStartTime: null,
      viewMode: 'cards',

      // === ACTIONS PROJET ===
      createProject: (storyId, title, pages) => {
        const scenes: MontageScene[] = pages.map((page) => {
          const cleanText = stripHtml(page.text)
          const phrases = splitIntoPhrases(cleanText)
          
          return {
            id: generateId(),
            bookPageId: page.id,
            title: page.title || `Scène ${pages.indexOf(page) + 1}`,
            text: cleanText,
            phrases,
            duration: 0, // Sera défini quand l'audio sera ajouté
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
              isSynced: false,
            },
            mediaTracks: [],
            musicTracks: [],
            soundTracks: [],
            lightTracks: [],
            decorationTracks: [],
            animationTracks: [],
            textEffectTracks: [],
            introDuration: 0,
            outroDuration: 0,
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
            updatedAt: new Date() 
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
        }))
      },

      // === ACTIONS SCÈNE ===
      setCurrentScene: (index) => {
        const project = get().currentProject
        if (project && index >= 0 && index < project.scenes.length) {
          set({ currentSceneIndex: index, currentPlaybackTime: 0 })
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

      // === ACTIONS NARRATION ===
      setNarrationAudio: (audioUrl, source, duration, ttsVoice) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        
        get().updateCurrentScene({
          duration,
          narration: {
            ...scene.narration,
            audioUrl,
            source,
            duration,
            ttsVoice,
            isSynced: false, // Besoin de resynchroniser
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
            isSynced: false,
            phrases: scene.phrases.map((text, index) => ({
              id: generateId(),
              text,
              index,
              timeRange: { startTime: 0, endTime: 0 },
            })),
          },
        })
      },

      // === ACTIONS SYNC PHRASES ===
      startPhraseSync: (audioStartTime) => {
        set({ 
          isSyncing: true, 
          syncPhraseIndex: 0,
          syncStartTime: audioStartTime,
        })
      },

      markPhraseStart: (currentAudioTime) => {
        const { currentProject, currentSceneIndex, syncPhraseIndex, isSyncing, syncStartTime } = get()
        if (!currentProject || !isSyncing || syncStartTime === null) return

        const scene = currentProject.scenes[currentSceneIndex]
        if (!scene || syncPhraseIndex >= scene.phrases.length) {
          // Fin de la sync
          set({ isSyncing: false, syncStartTime: null })
          return
        }

        // Calculer le temps relatif depuis le début de l'audio
        const relativeTime = (currentAudioTime - syncStartTime) / 1000 // Convertir en secondes

        // Mettre à jour le timing de la phrase courante
        const updatedPhrases = [...scene.narration.phrases]
        
        // Définir le startTime de la phrase courante
        updatedPhrases[syncPhraseIndex] = {
          ...updatedPhrases[syncPhraseIndex],
          timeRange: {
            ...updatedPhrases[syncPhraseIndex].timeRange,
            startTime: relativeTime,
          },
        }
        
        // Définir le endTime de la phrase précédente
        if (syncPhraseIndex > 0) {
          updatedPhrases[syncPhraseIndex - 1] = {
            ...updatedPhrases[syncPhraseIndex - 1],
            timeRange: {
              ...updatedPhrases[syncPhraseIndex - 1].timeRange,
              endTime: relativeTime,
            },
          }
        }

        // Si c'est la dernière phrase, définir son endTime à la durée totale
        const isLastPhrase = syncPhraseIndex === scene.phrases.length - 1
        if (isLastPhrase) {
          updatedPhrases[syncPhraseIndex].timeRange.endTime = scene.narration.duration
        }

        get().updateCurrentScene({
          narration: {
            ...scene.narration,
            phrases: updatedPhrases,
            isSynced: isLastPhrase,
          },
        })

        if (isLastPhrase) {
          set({ isSyncing: false, syncStartTime: null, syncPhraseIndex: 0 })
        } else {
          set({ syncPhraseIndex: syncPhraseIndex + 1 })
        }
      },

      stopPhraseSync: () => {
        set({ isSyncing: false, syncPhraseIndex: 0, syncStartTime: null })
      },

      setPhraseTimings: (timings) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        
        get().updateCurrentScene({
          narration: {
            ...scene.narration,
            phrases: timings,
            isSynced: true,
          },
        })
      },

      updatePhraseTiming: (phraseId, updates) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        
        const updatedPhrases = scene.narration.phrases.map((phrase) => 
          phrase.id === phraseId 
            ? { ...phrase, ...updates }
            : phrase
        )
        
        get().updateCurrentScene({
          narration: {
            ...scene.narration,
            phrases: updatedPhrases,
          },
        })
      },

      // === ACTIONS MÉDIAS ===
      addMediaTrack: (track) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        
        const newTrack: MediaTrack = {
          ...track,
          id: generateId(),
        }
        
        get().updateCurrentScene({
          mediaTracks: [...scene.mediaTracks, newTrack],
        })
        
        set({ selectedTrackId: newTrack.id, selectedTrackType: 'media' })
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
        
        if (get().selectedTrackId === trackId) {
          set({ selectedTrackId: null, selectedTrackType: null })
        }
      },

      // === ACTIONS MUSIQUE ===
      addMusicTrack: (track) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        
        const newTrack: MusicTrack = {
          ...track,
          id: generateId(),
        }
        
        get().updateCurrentScene({
          musicTracks: [...(scene.musicTracks || []), newTrack],
        })
        
        set({ selectedTrackId: newTrack.id, selectedTrackType: 'music' })
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
        
        if (get().selectedTrackId === trackId) {
          set({ selectedTrackId: null, selectedTrackType: null })
        }
      },

      // === ACTIONS SONS ===
      addSoundTrack: (track) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        
        const newTrack: SoundTrack = {
          ...track,
          id: generateId(),
        }
        
        get().updateCurrentScene({
          soundTracks: [...(scene.soundTracks || []), newTrack],
        })
        
        set({ selectedTrackId: newTrack.id, selectedTrackType: 'sound' })
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
        
        if (get().selectedTrackId === trackId) {
          set({ selectedTrackId: null, selectedTrackType: null })
        }
      },

      // === ACTIONS LUMIÈRES ===
      addLightTrack: (track) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        
        const newTrack: LightTrack = {
            ...track, 
            id: generateId(),
        }
        
        get().updateCurrentScene({
          lightTracks: [...scene.lightTracks, newTrack],
        })
        
        set({ selectedTrackId: newTrack.id, selectedTrackType: 'light' })
      },

      updateLightTrack: (trackId, updates) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        
        get().updateCurrentScene({
          lightTracks: scene.lightTracks.map((t) =>
            t.id === trackId ? { ...t, ...updates } : t
          ),
        })
      },

      deleteLightTrack: (trackId) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        
        get().updateCurrentScene({
          lightTracks: scene.lightTracks.filter((t) => t.id !== trackId),
        })
        
        if (get().selectedTrackId === trackId) {
          set({ selectedTrackId: null, selectedTrackType: null })
        }
      },

      // === ACTIONS DÉCORATIONS ===
      addDecorationTrack: (track) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        
        const newTrack: DecorationTrack = {
          ...track,
          id: generateId(),
        }
        
        get().updateCurrentScene({
          decorationTracks: [...(scene.decorationTracks || []), newTrack],
        })
        
        set({ selectedTrackId: newTrack.id, selectedTrackType: 'decoration' })
      },

      updateDecorationTrack: (trackId, updates) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        
        get().updateCurrentScene({
          decorationTracks: (scene.decorationTracks || []).map((t) =>
            t.id === trackId ? { ...t, ...updates } : t
          ),
        })
      },

      deleteDecorationTrack: (trackId) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        
        get().updateCurrentScene({
          decorationTracks: (scene.decorationTracks || []).filter((t) => t.id !== trackId),
        })
        
        if (get().selectedTrackId === trackId) {
          set({ selectedTrackId: null, selectedTrackType: null })
        }
      },

      // === ACTIONS ANIMATIONS ===
      addAnimationTrack: (track) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        
        const newTrack: AnimationTrack = {
          ...track,
          id: generateId(),
        }
        
        get().updateCurrentScene({
          animationTracks: [...(scene.animationTracks || []), newTrack],
        })
        
        set({ selectedTrackId: newTrack.id, selectedTrackType: 'animation' })
      },

      updateAnimationTrack: (trackId, updates) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        
        get().updateCurrentScene({
          animationTracks: (scene.animationTracks || []).map((t) =>
            t.id === trackId ? { ...t, ...updates } : t
          ),
        })
      },

      deleteAnimationTrack: (trackId) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        
        get().updateCurrentScene({
          animationTracks: (scene.animationTracks || []).filter((t) => t.id !== trackId),
        })
        
        if (get().selectedTrackId === trackId) {
          set({ selectedTrackId: null, selectedTrackType: null })
        }
      },

      // === ACTIONS EFFETS TEXTE ===
      addTextEffect: (effect) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        
        const newEffect: TextEffectTrack = {
          ...effect,
          id: generateId(),
        }
        
        get().updateCurrentScene({
          textEffectTracks: [...(scene.textEffectTracks || []), newEffect],
        })
        
        set({ selectedTrackId: newEffect.id, selectedTrackType: 'effect' })
      },

      updateTextEffect: (effectId, updates) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        
        get().updateCurrentScene({
          textEffectTracks: (scene.textEffectTracks || []).map((e) =>
            e.id === effectId ? { ...e, ...updates } : e
          ),
        })
      },

      deleteTextEffect: (effectId) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        
        get().updateCurrentScene({
          textEffectTracks: (scene.textEffectTracks || []).filter((e) => e.id !== effectId),
        })
        
        if (get().selectedTrackId === effectId) {
          set({ selectedTrackId: null, selectedTrackType: null })
        }
      },

      // === ACTIONS INTRO/OUTRO ===
      setIntroDuration: (duration) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        get().updateCurrentScene({ introDuration: Math.max(0, duration) })
      },
      
      setOutroDuration: (duration) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        get().updateCurrentScene({ outroDuration: Math.max(0, duration) })
      },
      
      setNarrationZoneDuration: (duration) => {
        const scene = get().getCurrentScene()
        if (!scene) return
        // Minimum = durée de l'audio narration
        const minDuration = scene.narration?.duration || 0
        get().updateCurrentScene({ narrationZoneDuration: Math.max(minDuration, duration) })
      },

      // === ACTIONS UI ===
      setSelectedTrack: (id, type) => set({ selectedTrackId: id, selectedTrackType: type }),
      clearSelection: () => set({ selectedTrackId: null, selectedTrackType: null }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setPlaybackTime: (time) => set({ currentPlaybackTime: time }),
      setViewMode: (mode) => set({ viewMode: mode }),

      // === HELPERS ===
      getSceneDuration: () => {
        const scene = get().getCurrentScene()
        // Durée totale = intro + narration + outro
        const introDuration = scene?.introDuration || 0
        const outroDuration = scene?.outroDuration || 0
        const narrationDuration = scene?.narration?.duration || scene?.duration || 0
        return introDuration + narrationDuration + outroDuration
      },

      getActivePhrase: (time) => {
        const scene = get().getCurrentScene()
        if (!scene || !scene.narration.isSynced) return null
        
        return scene.narration.phrases.find(
          (phrase) => time >= phrase.timeRange.startTime && time < phrase.timeRange.endTime
        ) || null
      },
    }),
    {
      name: 'lavoixdusoir-montage-v3', // Nouvelle version avec migration
      partialize: (state) => ({
        projects: state.projects,
      }),
      // Migration des anciennes données
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as { projects?: MontageProject[] }
        
        if (state.projects) {
          // Migrer les phrases vers le format absolu avec audioTimeRange
          const migratedProjects = state.projects.map((project) => ({
            ...project,
            scenes: project.scenes.map((scene) => {
              if (scene.narration?.phrases && scene.narration.phrases.length > 0) {
                const introDuration = scene.introDuration || 0
                const migratedPhrases = scene.narration.phrases.map((phrase) => {
                  // Si audioTimeRange n'existe pas, c'est l'ancien format
                  if (!phrase.audioTimeRange) {
                    console.log(`🔄 [localStorage] Migration phrase vers format absolu`)
                    return {
                      ...phrase,
                      audioTimeRange: {
                        startTime: phrase.timeRange.startTime,
                        endTime: phrase.timeRange.endTime,
                      },
                      timeRange: {
                        startTime: introDuration + phrase.timeRange.startTime,
                        endTime: introDuration + phrase.timeRange.endTime,
                      },
                    }
                  }
                  return phrase
                })
                return {
                  ...scene,
                  narration: {
                    ...scene.narration,
                    phrases: migratedPhrases,
                  },
                }
              }
              return scene
            }),
          }))
          
          return { projects: migratedProjects }
        }
        
        return persistedState as MontageState
      },
      version: 3,
    }
  )
)
