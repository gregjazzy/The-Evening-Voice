/**
 * Hook de synchronisation Supabase
 * 
 * Synchronise les données du store Zustand avec Supabase :
 * - Charge les données au login
 * - Sauvegarde automatiquement les changements
 * - Gère les conflits (dernière modification gagne)
 */

'use client'

import { useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppStore, type DiaryEntry, type ChatMessage, type Story, type StoryPage } from '@/store/useAppStore'
import { useMontageStore, type MontageProject } from '@/store/useMontageStore'
import { useStudioProgressStore, type StudioBadge, type StudioCreation } from '@/store/useStudioProgressStore'
import { useStudioStore, type ImportedAsset } from '@/store/useStudioStore'
import type { StoryStructure } from '@/lib/ai/prompting-pedagogy'

// Types Supabase pour ce fichier (contourner les problèmes de typage)
type DbDiaryEntry = {
  id: string
  created_at: string
  content: string
  mood: string | null
  memory_image_url: string | null
  audio_url: string | null
}

type DbChatMessage = {
  id: string
  created_at: string
  role: string
  content: string
}

type DbStory = {
  id: string
  title: string
  author: string
  status: string
  story_pages: DbStoryPage[]
}

type DbStoryPage = {
  id: string
  page_number: number
  title: string | null
  text_blocks: unknown
}

type DbMontageProject = {
  id: string
  profile_id: string
  story_id: string | null
  title: string
  scenes: unknown
  is_complete: boolean
  created_at: string
  updated_at: string
}

type DbStudioProgress = {
  id: string
  profile_id: string
  image_level: number
  image_creations_in_level: number
  image_total_creations: number
  video_level: number
  video_creations_in_level: number
  video_total_creations: number
  creations: unknown
  badges: unknown
}

type DbAsset = {
  id: string
  profile_id: string | null
  story_id: string | null
  type: 'image' | 'audio' | 'video'
  source: 'midjourney' | 'elevenlabs' | 'runway' | 'luma' | 'gemini' | 'upload' | 'dalle'
  url: string
  thumbnail_url: string | null
  prompt_used: string | null
  file_name: string | null
  file_size: number | null
  mime_type: string | null
  created_at: string
}

// Helper pour convertir une date en string ISO (gère Date et string)
function toISOStringSafe(date: Date | string | undefined | null): string {
  if (!date) return new Date().toISOString()
  if (typeof date === 'string') return date
  if (date instanceof Date) return date.toISOString()
  return new Date().toISOString()
}


// Debounce pour éviter trop de requêtes
function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  return useCallback(
    ((...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    }) as T,
    [callback, delay]
  )
}

// Fonction utilitaire pour sauvegarder un projet de montage (hors hook)
async function saveMontageProjectToSupabase(project: MontageProject, profileId: string) {
  const projectData = {
    id: project.id,
    profile_id: profileId,
    story_id: project.storyId || null,
    title: project.title,
    scenes: project.scenes,
    is_complete: project.isComplete,
    created_at: toISOStringSafe(project.createdAt),
    updated_at: toISOStringSafe(project.updatedAt),
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from('montage_projects').upsert(projectData as any)

  if (error) {
    console.error('Erreur sauvegarde montage project:', error)
    return false
  }
  return true
}

// Fonction utilitaire pour sauvegarder la progression Studio (hors hook)
async function saveStudioProgressToSupabase(
  profileId: string,
  data: {
    imageLevel: number
    imageCreationsInLevel: number
    imageTotalCreations: number
    videoLevel: number
    videoCreationsInLevel: number
    videoTotalCreations: number
    creations: StudioCreation[]
    badges: StudioBadge[]
  }
) {
  const progressData = {
    profile_id: profileId,
    image_level: data.imageLevel,
    image_creations_in_level: data.imageCreationsInLevel,
    image_total_creations: data.imageTotalCreations,
    video_level: data.videoLevel,
    video_creations_in_level: data.videoCreationsInLevel,
    video_total_creations: data.videoTotalCreations,
    creations: data.creations,
    badges: data.badges,
    updated_at: new Date().toISOString(),
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from('studio_progress').upsert(progressData as any, {
    onConflict: 'profile_id',
  })

  if (error) {
    console.error('Erreur sauvegarde studio progress:', error)
    return false
  }
  return true
}

// Lock pour éviter les sauvegardes concurrentes par histoire
const storySaveLocks = new Map<string, boolean>()

// Fonction utilitaire pour sauvegarder une histoire (hors hook)
async function saveStoryToSupabase(story: Story, profileId: string, userName: string) {
  // Vérifier si une sauvegarde est déjà en cours pour cette histoire
  if (storySaveLocks.get(story.id)) {
    console.log(`⏳ Sauvegarde déjà en cours pour "${story.title}", ignoré`)
    return true // Retourne true car une sauvegarde est en cours
  }
  
  // Acquérir le lock
  storySaveLocks.set(story.id, true)
  console.log(`🔒 Lock acquis pour "${story.title}"`)
  
  try {
    // Sauvegarder l'histoire
    const storyData = {
      id: story.id,
      profile_id: profileId,
      title: story.title,
      author: userName || 'Anonyme',
      status: story.isComplete ? 'completed' : 'in_progress',
      total_pages: story.pages.length,
      current_page: story.currentStep + 1,
      metadata: {
        structure: story.structure,
        chapters: story.chapters || [],
      },
      created_at: toISOStringSafe(story.createdAt),
      updated_at: toISOStringSafe(story.updatedAt),
      completed_at: story.isComplete ? new Date().toISOString() : null,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: storyError } = await supabase.from('stories').upsert(storyData as any)

    if (storyError) {
      console.error('Erreur sauvegarde story:', storyError)
      return false
    }

    // Supprimer les anciennes pages puis insérer les nouvelles
    // (évite les conflits sur la contrainte UNIQUE story_id,page_number)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deleteData, error: deleteError, count: deleteCount } = await supabase
      .from('story_pages')
      .delete()
      .eq('story_id', story.id)
      .select() as any

    console.log(`🗑️ DELETE pages pour story ${story.id}:`, { 
      deleted: deleteData?.length || 0, 
      error: deleteError 
    })

    if (deleteError) {
      console.error('Erreur suppression pages:', deleteError)
      return false
    }

    // Préparer toutes les pages avec page_number unique basé sur l'index
    const pagesData = story.pages.map((page, i) => ({
      id: page.id,
      story_id: story.id,
      page_number: i + 1, // Toujours utiliser l'index pour garantir l'unicité
      title: page.title,
      text_blocks: [{ content: page.content || '' }],
      media_layers: {
        images: page.images || [],
        decorations: page.decorations || [],
        chapterId: page.chapterId,
      },
      background_image_url: page.backgroundMedia?.type === 'image' ? page.backgroundMedia.url : null,
      background_video_url: page.backgroundMedia?.type === 'video' ? page.backgroundMedia.url : null,
    }))
    
    // Vérifier les doublons de page_number
    const pageNumbers = pagesData.map(p => p.page_number)
    const uniquePageNumbers = new Set(pageNumbers)
    if (pageNumbers.length !== uniquePageNumbers.size) {
      console.error('❌ DOUBLONS DÉTECTÉS dans page_number:', pageNumbers)
    }
    console.log(`📄 INSERT ${pagesData.length} pages:`, pageNumbers)

    // Insérer toutes les pages d'un coup
    if (pagesData.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await supabase
        .from('story_pages')
        .insert(pagesData as any)

      if (insertError) {
        console.error('Erreur insertion pages:', insertError)
        return false
      }
    }

    console.log(`✅ Histoire "${story.title}" sauvegardée (${story.pages.length} pages)`)
    return true
  } finally {
    // Libérer le lock
    storySaveLocks.delete(story.id)
    console.log(`🔓 Lock libéré pour "${story.title}"`)
  }
}

/**
 * Hook principal de synchronisation
 */
export function useSupabaseSync() {
  const { user, profile } = useAuthStore()
  const {
    // Données à synchroniser
    diaryEntries,
    chatHistory,
    stories,
    userName,
    aiName, // Nom personnalisé de l'IA
    emotionalContext,
    // Setters (à créer si nécessaire)
  } = useAppStore()

  const isLoadingRef = useRef(false)
  const hasLoadedRef = useRef(false)
  const lastProfileIdRef = useRef<string | null>(null)

  // ============================================
  // CHARGEMENT INITIAL DES DONNÉES
  // ============================================

  const loadFromSupabase = useCallback(async () => {
    if (!profile?.id || isLoadingRef.current || hasLoadedRef.current) return

    // ========================================
    // DÉTECTION CHANGEMENT DE COMPTE
    // Si l'utilisateur change de compte, on vide TOUT le localStorage
    // ========================================
    const storedProfileId = typeof window !== 'undefined' 
      ? localStorage.getItem('lavoixdusoir-current-profile-id') 
      : null
    
    if (storedProfileId && storedProfileId !== profile.id) {
      console.log('🔄 Changement de compte détecté ! Nettoyage du localStorage...')
      if (typeof window !== 'undefined') {
        localStorage.removeItem('lavoixdusoir-storage')
        localStorage.removeItem('lavoixdusoir-studio')
        localStorage.removeItem('lavoixdusoir-montage-v3')
        localStorage.removeItem('lavoixdusoir-studio-progress')
      }
    }
    
    // Stocker le profile_id actuel
    if (typeof window !== 'undefined') {
      localStorage.setItem('lavoixdusoir-current-profile-id', profile.id)
    }
    lastProfileIdRef.current = profile.id

    isLoadingRef.current = true
    console.log('📥 Chargement des données depuis Supabase...')

    try {
      // Charger les diary entries
      const { data: diaryData, error: diaryError } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })

      if (!diaryError && diaryData) {
        const typedDiaryData = diaryData as unknown as DbDiaryEntry[]
        const entries: DiaryEntry[] = typedDiaryData.map((d) => ({
          id: d.id,
          date: new Date(d.created_at),
          content: d.content,
          mood: d.mood as DiaryEntry['mood'],
          memoryImage: d.memory_image_url || undefined,
          audioUrl: d.audio_url || undefined,
        }))
        // TOUJOURS écraser le localStorage avec Supabase quand connecté
        useAppStore.setState({ diaryEntries: entries })
        console.log(`   ✅ ${entries.length} entrées de journal chargées (Supabase prioritaire)`)
      }

      // Charger les chat messages
      const { data: chatData, error: chatError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: true })
        .limit(100)

      if (!chatError && chatData) {
        const typedChatData = chatData as unknown as DbChatMessage[]
        const messages: ChatMessage[] = typedChatData.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at),
        }))
        // TOUJOURS écraser le localStorage avec Supabase quand connecté
        useAppStore.setState({ chatHistory: messages })
        console.log(`   ✅ ${messages.length} messages chat chargés (Supabase prioritaire)`)
      }

      // ========================================
      // SUPABASE = SEULE SOURCE DE VÉRITÉ
      // Plus de fusion avec localStorage !
      // ========================================
      
      // Charger les stories avec leurs pages depuis Supabase
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select(`
          *,
          story_pages (*)
        `)
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })

      if (!storiesError && storiesData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typedStoriesData = storiesData as any[]
        const supabaseStories: Story[] = typedStoriesData.map((s) => ({
          id: s.id,
          title: s.title,
          structure: (s.metadata?.structure as StoryStructure) || 'free',
          currentStep: s.current_page - 1,
          pages: (s.story_pages || [])
            .sort((a: any, b: any) => a.page_number - b.page_number)
            .map((p: any) => {
              // media_layers peut être un objet {images, decorations, chapterId} ou un array legacy
              const mediaLayers = p.media_layers || {}
              const isNewFormat = mediaLayers && !Array.isArray(mediaLayers) && mediaLayers.images
              
              // Reconstruire backgroundMedia depuis les colonnes séparées
              let backgroundMedia = undefined
              if (p.background_image_url) {
                backgroundMedia = { type: 'image', url: p.background_image_url }
              } else if (p.background_video_url) {
                backgroundMedia = { type: 'video', url: p.background_video_url }
              }
              
              return {
                id: p.id,
                stepIndex: p.page_number - 1,
                content: p.text_blocks?.[0]?.content || '',
                images: isNewFormat ? mediaLayers.images : (Array.isArray(mediaLayers) ? mediaLayers : []),
                backgroundMedia,
                decorations: isNewFormat ? (mediaLayers.decorations || []) : [],
                order: p.page_number - 1,
                chapterId: isNewFormat ? mediaLayers.chapterId : undefined,
                title: p.title,
              }
            }),
          chapters: s.metadata?.chapters || [],
          createdAt: new Date(s.created_at),
          updatedAt: new Date(s.updated_at),
          isComplete: s.status === 'completed',
        }))
        
        // SIMPLE : Supabase remplace tout, pas de fusion
        useAppStore.setState({ 
          stories: supabaseStories, 
          currentStory: null // Reset pour éviter les références cassées
        })
        console.log(`   ✅ ${supabaseStories.length} histoires chargées depuis Supabase (source unique)`)
      } else if (storiesError) {
        console.error('Erreur chargement stories:', storiesError)
        // En cas d'erreur, vider pour éviter les données obsolètes
        useAppStore.setState({ stories: [], currentStory: null })
        console.log(`   ⚠️ Erreur Supabase, histoires vidées`)
      } else {
        // Pas d'histoires dans Supabase
        useAppStore.setState({ stories: [], currentStory: null })
        console.log('   ℹ️ Aucune histoire dans Supabase')
      }

      // Charger les préférences depuis le profil
      if (profile.name) {
        useAppStore.setState({ userName: profile.name })
      }
      // Charger le nom personnalisé de l'IA (priorité Supabase)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profileAny = profile as any
      if (profileAny.ai_name) {
        useAppStore.setState({ aiName: profileAny.ai_name })
        console.log(`   ✅ Nom de l'IA chargé: ${profileAny.ai_name}`)
      }
      if (profile.emotional_context) {
        useAppStore.setState({ emotionalContext: profile.emotional_context as string[] })
      }

      // Charger les projets de montage depuis Supabase
      const { data: montageData, error: montageError } = await supabase
        .from('montage_projects')
        .select('*')
        .eq('profile_id', profile.id)
        .order('updated_at', { ascending: false })

      if (!montageError && montageData) {
        const typedMontageData = montageData as unknown as DbMontageProject[]
        let needsMigrationSave = false
        
        const supabaseProjects = typedMontageData.map((p) => {
          // Migration: convertir les anciennes données de phrases en nouveau format
          const scenes = (p.scenes as MontageProject['scenes']).map((scene) => {
            if (scene.narration?.phrases && scene.narration.phrases.length > 0) {
              const introDuration = scene.introDuration || 0
              const migratedPhrases = scene.narration.phrases.map((phrase) => {
                // Si audioTimeRange n'existe pas, c'est l'ancien format
                if (!phrase.audioTimeRange) {
                  needsMigrationSave = true
                  console.log(`   🔄 Migration phrase "${phrase.text?.substring(0, 20)}..." vers format absolu`)
                  return {
                    ...phrase,
                    // audioTimeRange = timing original dans l'audio (inchangé)
                    audioTimeRange: {
                      startTime: phrase.timeRange.startTime,
                      endTime: phrase.timeRange.endTime,
                    },
                    // timeRange = position ABSOLUE sur la timeline (ajouter intro)
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
          })
          
          return {
            id: p.id,
            storyId: p.story_id || '',
            title: p.title,
            scenes,
            isComplete: p.is_complete,
            createdAt: new Date(p.created_at),
            updatedAt: new Date(p.updated_at),
          }
        }) as MontageProject[]
        
        // SIMPLE : Supabase remplace tout, pas de fusion
        useMontageStore.setState({ projects: supabaseProjects })
        console.log(`   ✅ ${supabaseProjects.length} projets de montage chargés depuis Supabase (source unique)`)
        
        // Sauvegarder les migrations si nécessaire
        if (needsMigrationSave) {
          console.log(`   🔄 Sauvegarde des migrations...`)
          for (const project of supabaseProjects) {
            await saveMontageProjectToSupabase(project, profile.id)
          }
        }
      } else if (montageError) {
        console.error('Erreur chargement montage projects:', montageError)
        useMontageStore.setState({ projects: [] })
        console.log(`   ⚠️ Erreur Supabase, projets vidés`)
      } else {
        // Pas de projets dans Supabase
        useMontageStore.setState({ projects: [] })
        console.log('   ℹ️ Aucun projet de montage dans Supabase')
          }
          console.log(`   ✅ Projets locaux synchronisés vers Supabase`)
        }
      }

      // Charger la progression Studio
      // Utiliser maybeSingle() pour éviter l'erreur 406 quand pas de données
      const { data: progressData, error: progressError } = await supabase
        .from('studio_progress')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle()

      if (!progressError && progressData) {
        const typedProgressData = progressData as unknown as DbStudioProgress
        useStudioProgressStore.setState({
          imageLevel: typedProgressData.image_level as 1 | 2 | 3 | 4 | 5,
          imageCreationsInLevel: typedProgressData.image_creations_in_level,
          imageTotalCreations: typedProgressData.image_total_creations,
          videoLevel: typedProgressData.video_level as 1 | 2 | 3 | 4 | 5,
          videoCreationsInLevel: typedProgressData.video_creations_in_level,
          videoTotalCreations: typedProgressData.video_total_creations,
          creations: (typedProgressData.creations as StudioCreation[]) || [],
          badges: (typedProgressData.badges as StudioBadge[]) || [],
        })
        console.log(`   ✅ Progression Studio chargée (Image: Niv.${typedProgressData.image_level}, Video: Niv.${typedProgressData.video_level})`)
      } else {
        // Synchroniser la progression locale vers Supabase si nécessaire
        const localProgress = useStudioProgressStore.getState()
        if (localProgress.imageTotalCreations > 0 || localProgress.videoTotalCreations > 0) {
          console.log(`   ⬆️ Progression Studio locale à synchroniser...`)
          await saveStudioProgressToSupabase(profile.id, {
            imageLevel: localProgress.imageLevel,
            imageCreationsInLevel: localProgress.imageCreationsInLevel,
            imageTotalCreations: localProgress.imageTotalCreations,
            videoLevel: localProgress.videoLevel,
            videoCreationsInLevel: localProgress.videoCreationsInLevel,
            videoTotalCreations: localProgress.videoTotalCreations,
            creations: localProgress.creations,
            badges: localProgress.badges,
          })
          console.log(`   ✅ Progression Studio synchronisée vers Supabase`)
        }
      }

      // ============================================
      // CHARGER LES ASSETS IMPORTÉS
      // ============================================
      console.log('   📦 Chargement des assets importés...')
      
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
      
      if (!assetsError && assetsData && assetsData.length > 0) {
        const typedAssetsData = assetsData as unknown as DbAsset[]
        
        // Convertir les assets Supabase vers le format ImportedAsset
        const loadedAssets: ImportedAsset[] = typedAssetsData.map(asset => ({
          id: asset.id,
          type: asset.type === 'audio' ? 'audio' : asset.type === 'video' ? 'video' : 'image',
          file: null, // Le fichier original n'est pas stocké
          url: asset.url, // URL Supabase = URL permanente
          cloudUrl: asset.url, // Même URL car c'est déjà l'URL cloud
          assetId: asset.id,
          name: asset.file_name || asset.prompt_used?.substring(0, 30) || `${asset.type}-${asset.id.substring(0, 8)}`,
          source: asset.source === 'dalle' ? 'upload' : asset.source as ImportedAsset['source'],
          promptUsed: asset.prompt_used || undefined,
          importedAt: new Date(asset.created_at),
          isUploading: false,
          projectId: asset.story_id || undefined,
        }))
        
        // SIMPLE : Supabase remplace tout, pas de fusion
        useStudioStore.setState({ importedAssets: loadedAssets })
        console.log(`   ✅ ${loadedAssets.length} assets chargés depuis Supabase (source unique)`)
      } else if (assetsError) {
        console.warn('   ⚠️ Erreur chargement assets:', assetsError.message)
        useStudioStore.setState({ importedAssets: [] })
      } else {
        useStudioStore.setState({ importedAssets: [] })
        console.log('   ℹ️ Aucun asset dans Supabase')
      }

      hasLoadedRef.current = true
      console.log('📥 Chargement terminé !')

    } catch (error) {
      console.error('Erreur chargement Supabase:', error)
    } finally {
      isLoadingRef.current = false
    }
  }, [profile?.id])

  // Charger au login
  useEffect(() => {
    if (profile?.id && !hasLoadedRef.current) {
      loadFromSupabase()
    }
  }, [profile?.id, loadFromSupabase])

  // Reset quand déconnexion
  useEffect(() => {
    if (!user) {
      hasLoadedRef.current = false
    }
  }, [user])

  // ============================================
  // SAUVEGARDE DES DONNÉES
  // ============================================

  // Sauvegarder une entrée de journal
  const saveDiaryEntry = useCallback(async (entry: DiaryEntry) => {
    if (!profile?.id) return

    const diaryData = {
      id: entry.id,
      profile_id: profile.id,
      content: entry.content,
      mood: entry.mood,
      memory_image_url: entry.memoryImage,
      audio_url: entry.audioUrl,
      created_at: toISOStringSafe(entry.date),
      updated_at: new Date().toISOString(),
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('diary_entries').upsert(diaryData as any)

    if (error) {
      console.error('Erreur sauvegarde diary:', error)
    }
  }, [profile?.id])

  // Sauvegarder un message chat
  const saveChatMessage = useCallback(async (message: ChatMessage) => {
    if (!profile?.id) return

    const chatData = {
      id: message.id,
      profile_id: profile.id,
      role: message.role,
      content: message.content,
      context_type: 'diary',
      created_at: toISOStringSafe(message.timestamp),
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('chat_messages').upsert(chatData as any)

    if (error) {
      console.error('Erreur sauvegarde chat:', error)
    }
  }, [profile?.id])

  // Sauvegarder une histoire
  const saveStory = useCallback(async (story: Story) => {
    if (!profile?.id) return
    await saveStoryToSupabase(story, profile.id, userName || 'Anonyme')
  }, [profile?.id, userName])

  // Sauvegarder le contexte émotionnel
  const saveEmotionalContext = useCallback(async (context: string[]) => {
    if (!profile?.id) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase as any
    const { error } = await client
      .from('profiles')
      .update({ emotional_context: context })
      .eq('id', profile.id)

    if (error) {
      console.error('Erreur sauvegarde emotional_context:', error)
    }
  }, [profile?.id])

  // Sauvegarder le nom personnalisé de l'IA
  const saveAiName = useCallback(async (name: string) => {
    if (!profile?.id) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase as any
    const { error } = await client
      .from('profiles')
      .update({ ai_name: name })
      .eq('id', profile.id)

    if (error) {
      console.error('Erreur sauvegarde ai_name:', error)
    } else {
      console.log(`   ✅ Nom de l'IA sauvegardé: ${name}`)
    }
  }, [profile?.id])

  // Versions debounced pour éviter trop de requêtes
  const debouncedSaveStory = useDebouncedCallback(saveStory, 2000)
  const debouncedSaveEmotionalContext = useDebouncedCallback(saveEmotionalContext, 5000)
  const debouncedSaveAiName = useDebouncedCallback(saveAiName, 1000)

  // ============================================
  // ÉCOUTE DES CHANGEMENTS DU STORE
  // ============================================

  // Sauvegarder les nouvelles entrées de journal
  const prevDiaryCountRef = useRef(diaryEntries.length)
  useEffect(() => {
    if (!profile?.id || !hasLoadedRef.current) return
    
    if (diaryEntries.length > prevDiaryCountRef.current) {
      // Nouvelle entrée ajoutée
      const newEntry = diaryEntries[diaryEntries.length - 1]
      saveDiaryEntry(newEntry)
    }
    prevDiaryCountRef.current = diaryEntries.length
  }, [diaryEntries.length, profile?.id, saveDiaryEntry])

  // Sauvegarder les nouveaux messages chat
  const prevChatCountRef = useRef(chatHistory.length)
  useEffect(() => {
    if (!profile?.id || !hasLoadedRef.current) return
    
    if (chatHistory.length > prevChatCountRef.current) {
      const newMessage = chatHistory[chatHistory.length - 1]
      saveChatMessage(newMessage)
    }
    prevChatCountRef.current = chatHistory.length
  }, [chatHistory.length, profile?.id, saveChatMessage])

  // Sauvegarder les histoires quand elles changent
  const prevStoriesRef = useRef<string>('')
  const prevStoriesCountRef = useRef<number>(-1) // -1 = pas encore initialisé
  useEffect(() => {
    if (!profile?.id) return
    
    const storiesKey = JSON.stringify(stories.map(s => ({ id: s.id, updatedAt: s.updatedAt })))
    
    // Première exécution : initialiser les refs sans sauvegarder
    if (prevStoriesCountRef.current === -1) {
      prevStoriesRef.current = storiesKey
      prevStoriesCountRef.current = stories.length
      console.log('📝 Init stories tracking:', stories.length, 'histoires')
      return
    }
    
    // Détecter une NOUVELLE histoire (sauvegarde immédiate, pas de debounce)
    if (stories.length > prevStoriesCountRef.current) {
      const newStory = stories[stories.length - 1]
      console.log('📝 Nouvelle histoire créée, sauvegarde immédiate:', newStory.title)
      saveStory(newStory) // Sauvegarde immédiate !
    }
    // Détecter une histoire MODIFIÉE (sauvegarde debounced)
    else if (storiesKey !== prevStoriesRef.current) {
      const changedStory = stories.find(s => {
        const prev = JSON.parse(prevStoriesRef.current || '[]')
        const prevStory = prev.find((p: any) => p.id === s.id)
        const prevTime = prevStory ? new Date(prevStory.updatedAt).getTime() : 0
        const currentTime = s.updatedAt ? new Date(s.updatedAt).getTime() : 0
        return !prevStory || prevTime !== currentTime
      })
      if (changedStory) {
        console.log('📝 Histoire modifiée, sauvegarde debounced:', changedStory.title)
        debouncedSaveStory(changedStory)
      }
    }
    
    prevStoriesRef.current = storiesKey
    prevStoriesCountRef.current = stories.length
  }, [stories, profile?.id, debouncedSaveStory, saveStory])

  // Sauvegarder le contexte émotionnel
  const prevEmotionalContextRef = useRef<string>('')
  useEffect(() => {
    if (!profile?.id || !hasLoadedRef.current) return
    
    const contextKey = JSON.stringify(emotionalContext)
    if (contextKey !== prevEmotionalContextRef.current && prevEmotionalContextRef.current !== '') {
      debouncedSaveEmotionalContext(emotionalContext)
    }
    prevEmotionalContextRef.current = contextKey
  }, [emotionalContext, profile?.id, debouncedSaveEmotionalContext])

  // Sauvegarder le nom de l'IA quand il change
  const prevAiNameRef = useRef<string>('')
  useEffect(() => {
    if (!profile?.id || !hasLoadedRef.current) return
    
    // Sauvegarder seulement si le nom a changé et n'est pas vide
    if (aiName && aiName !== prevAiNameRef.current && prevAiNameRef.current !== '') {
      debouncedSaveAiName(aiName)
    }
    prevAiNameRef.current = aiName || ''
  }, [aiName, profile?.id, debouncedSaveAiName])

  // ============================================
  // SYNCHRONISATION MONTAGE PROJECTS
  // ============================================

  const saveMontageProject = useCallback(async (project: MontageProject) => {
    if (!profile?.id) return
    await saveMontageProjectToSupabase(project, profile.id)
  }, [profile?.id])

  const debouncedSaveMontageProject = useDebouncedCallback(saveMontageProject, 2000)

  // Écouter les changements dans les projets de montage
  useEffect(() => {
    if (!profile?.id || !hasLoadedRef.current) return

    const unsubscribe = useMontageStore.subscribe(
      (state, prevState) => {
        // Détecter les projets qui ont changé
        const currentProjectsJson = JSON.stringify(state.projects.map(p => ({ id: p.id, updatedAt: p.updatedAt })))
        const prevProjectsJson = JSON.stringify(prevState.projects.map(p => ({ id: p.id, updatedAt: p.updatedAt })))
        
        if (currentProjectsJson !== prevProjectsJson) {
          // Trouver le projet qui a changé
          for (const project of state.projects) {
            const prevProject = prevState.projects.find(p => p.id === project.id)
            if (!prevProject || project.updatedAt.getTime() !== prevProject.updatedAt.getTime()) {
              debouncedSaveMontageProject(project)
              console.log(`   📤 Projet montage "${project.title}" en cours de sauvegarde...`)
            }
          }
        }
      }
    )

    return () => unsubscribe()
  }, [profile?.id, debouncedSaveMontageProject])

  // ============================================
  // SYNCHRONISATION STUDIO PROGRESS
  // ============================================

  const saveStudioProgress = useCallback(async () => {
    if (!profile?.id) return
    const state = useStudioProgressStore.getState()
    await saveStudioProgressToSupabase(profile.id, {
      imageLevel: state.imageLevel,
      imageCreationsInLevel: state.imageCreationsInLevel,
      imageTotalCreations: state.imageTotalCreations,
      videoLevel: state.videoLevel,
      videoCreationsInLevel: state.videoCreationsInLevel,
      videoTotalCreations: state.videoTotalCreations,
      creations: state.creations,
      badges: state.badges,
    })
  }, [profile?.id])

  const debouncedSaveStudioProgress = useDebouncedCallback(saveStudioProgress, 2000)

  // Écouter les changements dans la progression Studio
  useEffect(() => {
    if (!profile?.id || !hasLoadedRef.current) return

    const unsubscribe = useStudioProgressStore.subscribe(
      (state, prevState) => {
        // Détecter les changements significatifs
        const hasChanged = 
          state.imageLevel !== prevState.imageLevel ||
          state.videoLevel !== prevState.videoLevel ||
          state.imageTotalCreations !== prevState.imageTotalCreations ||
          state.videoTotalCreations !== prevState.videoTotalCreations ||
          state.badges.length !== prevState.badges.length

        if (hasChanged) {
          debouncedSaveStudioProgress()
          console.log(`   📤 Progression Studio en cours de sauvegarde...`)
        }
      }
    )

    return () => unsubscribe()
  }, [profile?.id, debouncedSaveStudioProgress])

  return {
    isLoading: isLoadingRef.current,
    hasLoaded: hasLoadedRef.current,
    reload: () => {
      hasLoadedRef.current = false
      loadFromSupabase()
    },
  }
}

export default useSupabaseSync
