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

// Fonction utilitaire pour sauvegarder une histoire (hors hook)
async function saveStoryToSupabase(story: Story, profileId: string, userName: string) {
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
    created_at: story.createdAt.toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: story.isComplete ? new Date().toISOString() : null,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: storyError } = await supabase.from('stories').upsert(storyData as any)

  if (storyError) {
    console.error('Erreur sauvegarde story:', storyError)
    return false
  }

  // Sauvegarder les pages
  for (const page of story.pages) {
    const pageData = {
      id: page.id,
      story_id: story.id,
      page_number: page.order + 1,
      title: page.title,
      text_blocks: [{ content: page.content }],
      media_layers: page.images || [],
      metadata: { 
        chapterId: page.chapterId,
        backgroundMedia: page.backgroundMedia,
        decorations: page.decorations || [],
      },
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: pageError } = await supabase.from('story_pages').upsert(pageData as any)

    if (pageError) {
      console.error('Erreur sauvegarde page:', pageError)
    }
  }
  return true
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

  // ============================================
  // CHARGEMENT INITIAL DES DONNÉES
  // ============================================

  const loadFromSupabase = useCallback(async () => {
    if (!profile?.id || isLoadingRef.current || hasLoadedRef.current) return

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

      // Charger les stories avec leurs pages
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
        const loadedStories: Story[] = typedStoriesData.map((s) => ({
          id: s.id,
          title: s.title,
          structure: (s.metadata?.structure as StoryStructure) || 'free',
          currentStep: s.current_page - 1,
          pages: (s.story_pages || [])
            .sort((a: any, b: any) => a.page_number - b.page_number)
            .map((p: any) => ({
              id: p.id,
              stepIndex: p.page_number - 1,
              content: p.text_blocks?.[0]?.content || '',
              images: p.media_layers || [],
              backgroundMedia: p.metadata?.backgroundMedia,
              decorations: p.metadata?.decorations || [],
              order: p.page_number - 1,
              chapterId: p.metadata?.chapterId,
              title: p.title,
            })),
          chapters: s.metadata?.chapters || [],
          createdAt: new Date(s.created_at),
          updatedAt: new Date(s.updated_at),
          isComplete: s.status === 'completed',
        }))
        
        // Récupérer les histoires actuelles du localStorage
        const currentStories = useAppStore.getState().stories
        
        if (loadedStories.length > 0) {
          // Supabase a des données → utiliser Supabase
          useAppStore.setState({ stories: loadedStories, currentStory: null })
          console.log(`   ✅ ${loadedStories.length} histoires chargées depuis Supabase`)
        } else if (currentStories.length > 0) {
          // Supabase est vide mais localStorage a des données → sauvegarder vers Supabase
          console.log(`   ⬆️ ${currentStories.length} histoires locales à synchroniser vers Supabase...`)
          // Sauvegarder chaque histoire vers Supabase
          for (const story of currentStories) {
            await saveStoryToSupabase(story, profile.id, userName || 'Anonyme')
          }
          console.log(`   ✅ ${currentStories.length} histoires synchronisées vers Supabase`)
        } else {
          console.log('   ℹ️ Aucune histoire (ni local, ni Supabase)')
        }
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
      created_at: entry.date.toISOString(),
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
      created_at: message.timestamp.toISOString(),
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
  useEffect(() => {
    if (!profile?.id || !hasLoadedRef.current) return
    
    const storiesKey = JSON.stringify(stories.map(s => ({ id: s.id, updatedAt: s.updatedAt })))
    if (storiesKey !== prevStoriesRef.current && prevStoriesRef.current !== '') {
      // Une histoire a changé, la sauvegarder
      const changedStory = stories.find(s => {
        const prev = JSON.parse(prevStoriesRef.current || '[]')
        const prevStory = prev.find((p: any) => p.id === s.id)
        return !prevStory || new Date(prevStory.updatedAt).getTime() !== s.updatedAt.getTime()
      })
      if (changedStory) {
        debouncedSaveStory(changedStory)
      }
    }
    prevStoriesRef.current = storiesKey
  }, [stories, profile?.id, debouncedSaveStory])

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
