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
import { notify } from '@/store/useNotificationStore'
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


// Référence module-level pour le flush avant déconnexion
let _pendingStoryForFlush: { story: Story; profileId: string; userName: string } | null = null

/**
 * Flush immédiat de la sauvegarde en attente (appelé avant signOut)
 * Utilise sendBeacon + API service-role pour ne pas dépendre de la session
 */
export function flushPendingStorySave(): void {
  if (!_pendingStoryForFlush) return

  const { story, profileId, userName } = _pendingStoryForFlush
  const data = JSON.stringify({ story, profileId, userName })

  console.log('🚨 Flush avant déconnexion:', story.title)

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon('/api/story/save', data)
  } else if (typeof fetch !== 'undefined') {
    fetch('/api/story/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data,
      keepalive: true,
    }).catch(console.error)
  }

  _pendingStoryForFlush = null
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

// Détecte les URLs temporaires (blob: ou fal.ai CDN) dans les pages
function warnTemporaryUrls(story: Story) {
  const warnings: string[] = []
  for (const page of story.pages) {
    const urls: string[] = []
    if (page.backgroundMedia?.url) urls.push(page.backgroundMedia.url)
    for (const img of page.images || []) {
      if (img.url) urls.push(img.url)
    }
    for (const url of urls) {
      if (url.startsWith('blob:')) {
        warnings.push(`Page ${page.stepIndex + 1}: URL blob: détectée (perdue au refresh)`)
      } else if (url.includes('fal.media') || url.includes('fal.ai')) {
        warnings.push(`Page ${page.stepIndex + 1}: URL fal.ai temporaire détectée`)
      }
    }
  }
  if (warnings.length > 0) {
    console.warn('⚠️ URLs temporaires dans l\'histoire:', warnings)
  }
  return warnings
}

// Lock pour éviter les sauvegardes concurrentes par histoire
const storySaveLocks = new Map<string, boolean>()
const pendingSaves = new Map<string, { story: Story; profileId: string; userName: string }>()

// Retry helper avec backoff exponentiel
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  delays: number[] = [1000, 3000]
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < maxRetries) {
        const delay = delays[attempt] || delays[delays.length - 1]
        console.log(`🔄 Retry ${attempt + 1}/${maxRetries} dans ${delay}ms...`)
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }
  throw lastError
}

/**
 * Vérifie que la session Supabase est valide et tente un rafraîchissement si nécessaire.
 * Retourne true si la session est OK, false sinon.
 * Cela évite les sauvegardes silencieusement perdues quand le token a expiré
 * (cause: AbortError lors du auto-refresh de GoTrueClient).
 */
async function ensureValidSession(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    // Ignorer les AbortError silencieusement (problème connu Supabase auth-js avec Web Locks)
    if (error) {
      const isAbortError = error.name === 'AbortError' || 
                          error.message?.includes('aborted') ||
                          error.message?.includes('signal is aborted')
      if (isAbortError) {
        console.warn('⚠️ Session check aborted (normal lors du rechargement/concurrence)')
        return false // Retourner false pour éviter la sauvegarde avec session invalide
      }
    }
    
    if (error || !session) {
      console.warn('⚠️ Session invalide ou expirée, tentative de refresh...')
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        
        // Ignorer les AbortError lors du refresh aussi
        if (refreshError) {
          const isAbortError = refreshError.name === 'AbortError' || 
                              refreshError.message?.includes('aborted') ||
                              refreshError.message?.includes('signal is aborted')
          if (isAbortError) {
            console.warn('⚠️ Refresh session aborted (normal lors du rechargement/concurrence)')
            return false
          }
        }
        
        if (refreshError || !refreshData.session) {
          console.error('❌ Impossible de rafraîchir la session:', refreshError?.message || 'pas de session')
          notify.error('Session expirée', 'Impossible de sauvegarder. Recharge la page ou reconnecte-toi.')
          return false
        }
        console.log('✅ Session rafraîchie avec succès')
        return true
      } catch (refreshErr: any) {
        // Capturer les AbortError qui peuvent être lancées comme exceptions
        const isAbortError = refreshErr?.name === 'AbortError' || 
                            refreshErr?.message?.includes('aborted') ||
                            refreshErr?.message?.includes('signal is aborted')
        if (isAbortError) {
          console.warn('⚠️ Refresh session aborted (exception)')
          return false
        }
        throw refreshErr // Re-lancer les autres erreurs
      }
    }
    // Vérifier si le token expire dans moins de 60 secondes
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
    const now = Date.now()
    if (expiresAt > 0 && expiresAt - now < 60_000) {
      console.log('⏰ Token expire bientôt, refresh proactif...')
      try {
        const { error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          // Ignorer les AbortError lors du refresh proactif aussi
          const isAbortError = refreshError.name === 'AbortError' || 
                              refreshError.message?.includes('aborted') ||
                              refreshError.message?.includes('signal is aborted')
          if (isAbortError) {
            console.warn('⚠️ Refresh proactif aborted (normal)')
          } else {
            console.warn('⚠️ Refresh proactif échoué:', refreshError.message)
          }
          // On continue quand même — le token est encore valide pour quelques secondes
        } else {
          console.log('✅ Token rafraîchi proactivement')
        }
      } catch (refreshErr: any) {
        // Ignorer les AbortError lors du refresh proactif
        const isAbortError = refreshErr?.name === 'AbortError' || 
                            refreshErr?.message?.includes('aborted') ||
                            refreshErr?.message?.includes('signal is aborted')
        if (!isAbortError) {
          console.warn('⚠️ Refresh proactif exception:', refreshErr)
        }
      }
    }
    return true
  } catch (err: any) {
    // Filtrer les AbortError dans le catch global aussi
    const isAbortError = err?.name === 'AbortError' || 
                        err?.message?.includes('aborted') ||
                        err?.message?.includes('signal is aborted')
    if (isAbortError) {
      console.warn('⚠️ Session check aborted (catch global)')
      return false
    }
    console.error('❌ Erreur lors de la vérification de session:', err)
    return false
  }
}

// Fonction utilitaire pour sauvegarder une histoire (hors hook)
async function saveStoryToSupabase(story: Story, profileId: string, userName: string) {
  // Vérifier que la session est valide AVANT de commencer la sauvegarde
  const sessionOk = await ensureValidSession()
  if (!sessionOk) {
    console.error(`❌ Sauvegarde annulée pour "${story.title}" : session invalide`)
    // Mettre en pending pour retry lors du prochain changement
    pendingSaves.set(story.id, { story, profileId, userName })
    return false
  }

  // Vérifier si une sauvegarde est déjà en cours pour cette histoire
  if (storySaveLocks.get(story.id)) {
    console.log(`⏳ Sauvegarde déjà en cours pour "${story.title}", mise en file d'attente`)
    pendingSaves.set(story.id, { story, profileId, userName })
    return true
  }

  // Détecter les URLs temporaires (log warning mais ne bloque pas la sauvegarde)
  warnTemporaryUrls(story)

  // Acquérir le lock
  storySaveLocks.set(story.id, true)
  console.log(`🔒 Lock acquis pour "${story.title}"`)

  try {
    // Sauvegarder avec retry automatique
    const saved = await withRetry(async () => {
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
          bookFormat: story.bookFormat || 'portrait-a5',
          chapters: story.chapters || [],
        },
        created_at: toISOStringSafe(story.createdAt),
        updated_at: toISOStringSafe(story.updatedAt),
        completed_at: story.isComplete ? new Date().toISOString() : null,
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: storyError } = await supabase.from('stories').upsert(storyData as any)

      if (storyError) {
        throw new Error(`Erreur sauvegarde story: ${storyError.message}`)
      }

      // Préparer toutes les pages
      const pagesData = story.pages.map((page, i) => {
        const pageData = {
          id: page.id,
          story_id: story.id,
          page_number: i + 1,
          title: page.title,
          text_blocks: [{
            content: page.content || '',
            style: page.style || null,
          }],
          media_layers: {
            images: page.images || [],
            decorations: page.decorations || [],
            textBoxes: page.textBoxes || [],
            chapterId: page.chapterId,
            pageType: page.pageType || 'content',
            backgroundMedia: page.backgroundMedia || null,
          },
          background_image_url: page.backgroundMedia?.type === 'image' ? page.backgroundMedia.url : null,
          background_video_url: page.backgroundMedia?.type === 'video' ? page.backgroundMedia.url : null,
        }
        console.log(`   📄 Page ${i + 1} (${pageData.media_layers.pageType}): "${(page.content || '').substring(0, 30)}..." - ${page.images?.length || 0} images, ${page.decorations?.length || 0} décos`)
        return pageData
      })

      console.log(`📄 UPSERT ${pagesData.length} pages pour story ${story.id}`)

      // UPSERT toutes les pages (safe : pas de fenêtre sans données)
      if (pagesData.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: upsertError } = await supabase
          .from('story_pages')
          .upsert(pagesData as any, { onConflict: 'id' })

        if (upsertError) {
          // Détecter spécifiquement les erreurs RLS
          if (upsertError.message?.includes('row-level security') || upsertError.code === '42501') {
            console.error('🚨 ERREUR RLS: La policy "Users can manage own pages" manque sur story_pages !')
            console.error('🚨 Exécutez: CREATE POLICY "Users can manage own pages" ON story_pages FOR ALL USING (story_id IN (SELECT id FROM stories WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));')
          }
          throw new Error(`Erreur upsert pages: ${upsertError.message}`)
        }
      }

      // Supprimer SEULEMENT les pages qui n'existent plus dans l'histoire
      const currentPageIds = story.pages.map(p => p.id).filter(Boolean)
      if (currentPageIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: deleteError } = await supabase
          .from('story_pages')
          .delete()
          .eq('story_id', story.id)
          .not('id', 'in', `(${currentPageIds.join(',')})`) as any

        if (deleteError) {
          // Non-fatal : les anciennes pages restent mais ne cassent rien
          console.warn('⚠️ Nettoyage anciennes pages échoué:', deleteError.message)
        }
      }

      // Vérification : relire les pages depuis Supabase pour confirmer
      const { data: verifyData, error: verifyError } = await supabase
        .from('story_pages')
        .select('id, page_number, media_layers')
        .eq('story_id', story.id)
        .order('page_number')

      if (verifyError) {
        console.error('⚠️ Vérification post-save échouée:', verifyError.message)
      } else {
        const savedCount = verifyData?.length || 0
        const expectedCount = story.pages.length
        if (savedCount !== expectedCount) {
          console.error(`❌ INCOHÉRENCE: ${expectedCount} pages envoyées mais ${savedCount} en base !`)
          notify.error('Erreur de sauvegarde', `Seulement ${savedCount}/${expectedCount} pages sauvegardées. Réessaie de sauvegarder.`)
        } else {
          // Vérifier que media_layers contient bien les images/décos
          for (const dbPage of verifyData!) {
            const localPage = story.pages.find((_, i) => i + 1 === dbPage.page_number)
            if (!localPage) continue
            const ml = dbPage.media_layers as any
            const dbImages = ml?.images?.length || 0
            const dbDecos = ml?.decorations?.length || 0
            const localImages = localPage.images?.length || 0
            const localDecos = localPage.decorations?.length || 0
            if (dbImages !== localImages || dbDecos !== localDecos) {
              console.error(`❌ INCOHÉRENCE page ${dbPage.page_number}: local=${localImages}img/${localDecos}déco, DB=${dbImages}img/${dbDecos}déco`)
            }
          }
          console.log(`✅ Vérification OK: ${savedCount} pages confirmées en base`)
        }
      }

      return true
    }).catch((err) => {
      console.error('❌ Sauvegarde échouée après retries:', err)
      notify.error('Erreur de sauvegarde', `L'histoire "${story.title}" n'a pas pu être sauvegardée après plusieurs tentatives. Vérifie ta connexion.`)
      return false
    })

    if (saved) {
      console.log(`✅ Histoire "${story.title}" sauvegardée (${story.pages.length} pages)`)
      // Vider le pending flush puisque la sauvegarde a réussi
      if (_pendingStoryForFlush?.story.id === story.id) {
        _pendingStoryForFlush = null
      }
    }
    return saved
  } finally {
    // Libérer le lock
    storySaveLocks.delete(story.id)
    console.log(`🔓 Lock libéré pour "${story.title}"`)

    // Relancer la sauvegarde si des données sont en attente
    const pending = pendingSaves.get(story.id)
    if (pending) {
      pendingSaves.delete(story.id)
      console.log(`🔄 Relance sauvegarde en attente pour "${pending.story.title}"`)
      saveStoryToSupabase(pending.story, pending.profileId, pending.userName)
    }
  }
}

/**
 * Hook principal de synchronisation
 */
export function useSupabaseSync() {
  const { user, profile } = useAuthStore()
  
  // IMPORTANT: Utiliser des selectors individuels pour que Zustand
  // déclenche les re-renders quand ces valeurs changent !
  const diaryEntries = useAppStore((state) => state.diaryEntries)
  const chatHistory = useAppStore((state) => state.chatHistory)
  const stories = useAppStore((state) => state.stories)
  const userName = useAppStore((state) => state.userName)
  const aiName = useAppStore((state) => state.aiName)
  const emotionalContext = useAppStore((state) => state.emotionalContext)

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
      
      // Charger les stories depuis Supabase
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })

      if (!storiesError && storiesData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typedStoriesData = storiesData as any[]

        // Charger les pages SÉPARÉMENT (le JOIN PostgREST peut échouer avec certaines configs RLS)
        const storyIds = typedStoriesData.map((s: any) => s.id)
        let allPagesData: any[] = []
        if (storyIds.length > 0) {
          const { data: pagesData, error: pagesError } = await supabase
            .from('story_pages')
            .select('*')
            .in('story_id', storyIds)
            .order('page_number')

          if (pagesError) {
            console.error('❌ Erreur chargement story_pages:', pagesError.message, pagesError.code)
            if (pagesError.message?.includes('row-level security') || pagesError.code === '42501') {
              console.error('🚨 ERREUR RLS sur story_pages ! La policy est manquante ou incorrecte.')
              notify.error(
                'Erreur de chargement des pages',
                'Les pages sont bloquées par les permissions Supabase (RLS). Contactez l\'administrateur.'
              )
            }
          } else {
            allPagesData = pagesData || []
            console.log(`   📄 ${allPagesData.length} pages chargées séparément`)
          }
        }

        // Attacher les pages à chaque story
        for (const s of typedStoriesData) {
          s.story_pages = allPagesData.filter((p: any) => p.story_id === s.id)
          console.log(`   🔍 Story "${s.title}": ${s.story_pages.length} pages (total_pages=${s.total_pages})`)
        }

        const supabaseStories: Story[] = typedStoriesData.map((s) => ({
          id: s.id,
          title: s.title,
          structure: (s.metadata?.structure as StoryStructure) || 'free',
          bookFormat: s.metadata?.bookFormat || 'portrait-a5', // Format du livre
          currentStep: s.current_page - 1,
          pages: (s.story_pages || [])
            .sort((a: any, b: any) => a.page_number - b.page_number)
            .map((p: any) => {
              // media_layers peut être un objet {images, decorations, chapterId, pageType, backgroundMedia} ou un array legacy
              const mediaLayers = p.media_layers || {}
              const isNewFormat = mediaLayers && !Array.isArray(mediaLayers) && (mediaLayers.images !== undefined)
              
              // Reconstruire backgroundMedia : priorité à media_layers.backgroundMedia (complet avec opacité, etc.)
              // Sinon fallback sur les colonnes séparées (compatibilité)
              let backgroundMedia = undefined
              if (isNewFormat && mediaLayers.backgroundMedia) {
                backgroundMedia = mediaLayers.backgroundMedia
              } else if (p.background_image_url) {
                backgroundMedia = { type: 'image', url: p.background_image_url, opacity: 1 }
              } else if (p.background_video_url) {
                backgroundMedia = { type: 'video', url: p.background_video_url, opacity: 1 }
              }
              
              return {
                id: p.id,
                stepIndex: p.page_number - 1,
                // Type de page (front-cover, back-cover, content)
                pageType: isNewFormat ? (mediaLayers.pageType || 'content') : 'content',
                content: p.text_blocks?.[0]?.content || '',
                // Style de texte de la page (police, alignement, taille, etc.)
                style: p.text_blocks?.[0]?.style || undefined,
                // Médias (images et vidéos sur la page)
                images: isNewFormat ? (mediaLayers.images || []) : (Array.isArray(mediaLayers) ? mediaLayers : []),
                // Fond de page (image ou vidéo avec opacité)
                backgroundMedia,
                // Décorations (stickers, ornements)
                decorations: isNewFormat ? (mediaLayers.decorations || []) : [],
                // Zones de texte flottantes
                textBoxes: isNewFormat ? (mediaLayers.textBoxes || []) : [],
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
        
        // Diagnostic : log détaillé de ce qui vient de Supabase
        for (const story of supabaseStories) {
          console.log(`   📖 Story "${story.title}" (${story.id}): ${story.pages.length} pages`)
          for (const page of story.pages) {
            const imgCount = page.images?.length || 0
            const decoCount = page.decorations?.length || 0
            const tbCount = page.textBoxes?.length || 0
            const hasBg = !!page.backgroundMedia
            if (imgCount > 0 || decoCount > 0 || tbCount > 0 || hasBg) {
              console.log(`      📄 Page ${page.stepIndex + 1}: ${imgCount} images, ${decoCount} décos, ${tbCount} textBoxes, bg=${hasBg}`)
            }
          }
        }

        // Nettoyer les URLs cassées (blob: URLs sont mortes après refresh)
        let cleanedCount = 0
        const cleanedStories = supabaseStories.map(story => ({
          ...story,
          pages: story.pages.map(page => {
            let cleaned = { ...page }
            // Supprimer backgroundMedia avec blob: URL
            if (cleaned.backgroundMedia?.url?.startsWith('blob:')) {
              cleaned = { ...cleaned, backgroundMedia: undefined }
              cleanedCount++
            }
            // Filtrer les images avec blob: URL
            if (cleaned.images?.some((img: any) => img.url?.startsWith('blob:'))) {
              cleaned = { ...cleaned, images: cleaned.images.filter((img: any) => !img.url?.startsWith('blob:')) }
              cleanedCount++
            }
            return cleaned
          }),
        }))
        if (cleanedCount > 0) {
          console.warn(`   🧹 ${cleanedCount} URLs blob: supprimées (invalides après refresh)`)
        }

        // Diagnostic : comparer les données en mémoire avec celles de Supabase
        const currentStories = useAppStore.getState().stories
        if (currentStories.length > 0) {
          for (const memStory of currentStories) {
            const dbStory = cleanedStories.find(s => s.id === memStory.id)
            if (!dbStory) continue
            for (const memPage of memStory.pages) {
              const dbPage = dbStory.pages.find(p => p.id === memPage.id)
              if (!dbPage) continue
              const memImg = memPage.images?.length || 0
              const dbImg = dbPage.images?.length || 0
              const memDeco = memPage.decorations?.length || 0
              const dbDeco = dbPage.decorations?.length || 0
              if (memImg > dbImg || memDeco > dbDeco) {
                console.error(`   🚨 PERTE DE DONNÉES DÉTECTÉE page ${memPage.stepIndex + 1} de "${memStory.title}":`)
                console.error(`      Mémoire: ${memImg} images, ${memDeco} décos`)
                console.error(`      Supabase: ${dbImg} images, ${dbDeco} décos`)
                console.error(`      → Les données en mémoire sont PLUS RICHES que Supabase !`)
                console.error(`      → Cela signifie que la sauvegarde précédente a échoué ou été écrasée.`)
              }
            }
          }
        }

        // SIMPLE : Supabase remplace tout, pas de fusion
        // Préserver currentStory si elle existe toujours après le rechargement
        const prevCurrentStory = useAppStore.getState().currentStory
        // Fallback: restaurer depuis l'ID persisté en localStorage (survie au changement de locale)
        const persistedStoryId = !prevCurrentStory
          ? (JSON.parse(localStorage.getItem('lavoixdusoir-storage') || '{}')?.state?.currentStoryId ?? null)
          : null
        const refreshedCurrentStory = prevCurrentStory
          ? cleanedStories.find(s => s.id === prevCurrentStory.id) || null
          : persistedStoryId
            ? cleanedStories.find(s => s.id === persistedStoryId) || null
            : null
        useAppStore.setState({
          stories: cleanedStories,
          currentStory: refreshedCurrentStory,
        })
        console.log(`   ✅ ${cleanedStories.length} histoires chargées depuis Supabase (source unique)`)
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
        
        // Filtrer les assets avec blob: URL (ne devraient pas exister en DB mais sécurité)
        const validAssets = loadedAssets.filter(a => !a.url.startsWith('blob:'))
        if (validAssets.length < loadedAssets.length) {
          console.warn(`   🧹 ${loadedAssets.length - validAssets.length} assets avec blob: URL ignorés`)
        }

        // SIMPLE : Supabase remplace tout, pas de fusion
        useStudioStore.setState({ importedAssets: validAssets })
        console.log(`   ✅ ${validAssets.length} assets chargés depuis Supabase (source unique)`)
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

  // Charger au login (ou reconnexion)
  useEffect(() => {
    if (profile?.id) {
      // Toujours recharger quand le profile change (reconnexion)
      if (lastProfileIdRef.current !== profile.id) {
        hasLoadedRef.current = false
      }
      if (!hasLoadedRef.current) {
        loadFromSupabase()
      }
    }
  }, [profile?.id, loadFromSupabase])

  // Reset complet quand déconnexion
  useEffect(() => {
    if (!user) {
      hasLoadedRef.current = false
      lastProfileIdRef.current = null
      // IMPORTANT: Réinitialiser les refs de tracking pour éviter les faux positifs après re-login
      prevStoriesRef.current = ''
      prevStoriesCountRef.current = -1
      prevDiaryCountRef.current = 0
      prevChatCountRef.current = 0
      prevEmotionalContextRef.current = ''
      prevAiNameRef.current = ''
      pendingStoryRef.current = null
      _pendingStoryForFlush = null
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
    const success = await saveStoryToSupabase(story, profile.id, userName || 'Anonyme')
    // Nettoyer les refs de sauvegarde pendante après succès
    if (success) {
      if (pendingStoryRef.current?.id === story.id) {
        pendingStoryRef.current = null
      }
    }
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
  // Réduit à 500ms pour sauvegarder plus rapidement le contenu
  const debouncedSaveStory = useDebouncedCallback(saveStory, 500)
  const debouncedSaveEmotionalContext = useDebouncedCallback(saveEmotionalContext, 5000)
  const debouncedSaveAiName = useDebouncedCallback(saveAiName, 1000)
  
  // Référence pour la dernière histoire modifiée (pour sauvegarde avant fermeture)
  const pendingStoryRef = useRef<Story | null>(null)

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
    // IMPORTANT: Ne pas tracker les histoires AVANT que le chargement initial soit terminé !
    // Sinon on risque de sauvegarder des données vides/incorrectes vers Supabase
    if (!profile?.id || !hasLoadedRef.current) return
    
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
      pendingStoryRef.current = null // Pas besoin de re-sauvegarder
      _pendingStoryForFlush = null
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
        // Diagnostic détaillé : log EXACT de ce qui va être sauvegardé
        const totalImgs = changedStory.pages.reduce((sum, p) => sum + (p.images?.length || 0), 0)
        const totalDecos = changedStory.pages.reduce((sum, p) => sum + (p.decorations?.length || 0), 0)
        const totalTbs = changedStory.pages.reduce((sum, p) => sum + (p.textBoxes?.length || 0), 0)
        const totalBg = changedStory.pages.filter(p => !!p.backgroundMedia).length
        console.log(`📝 Histoire modifiée, sauvegarde debounced: "${changedStory.title}"`,
          `- ${changedStory.pages.length} pages`,
          `- ${totalImgs} imgs, ${totalDecos} décos, ${totalTbs} tbs, ${totalBg} bgs`)
        if (totalImgs === 0 && totalDecos === 0 && totalBg === 0) {
          console.log('   ℹ️ Aucun média dans cette sauvegarde (normal si seul le texte a changé)')
        }
        pendingStoryRef.current = changedStory // Garder en mémoire pour beforeunload
        _pendingStoryForFlush = { story: changedStory, profileId: profile!.id, userName: userName || 'Anonyme' }
        debouncedSaveStory(changedStory)
      }
    }
    
    prevStoriesRef.current = storiesKey
    prevStoriesCountRef.current = stories.length
  }, [stories, profile?.id, debouncedSaveStory, saveStory])

  // ============================================
  // SAUVEGARDE AVANT FERMETURE DE LA PAGE
  // Utilise sendBeacon pour garantir l'envoi même pendant la fermeture
  // ============================================
  useEffect(() => {
    if (!profile?.id) return
    
    const handleBeforeUnload = () => {
      // Utiliser sendBeacon pour une sauvegarde fiable même pendant la fermeture
      if (pendingStoryRef.current) {
        const story = pendingStoryRef.current
        console.log('🚨 Sauvegarde d\'urgence (sendBeacon):', story.title)
        
        const data = JSON.stringify({
          story,
          profileId: profile.id,
          userName: userName || 'Anonyme',
        })
        
        // sendBeacon garantit l'envoi même si la page se ferme (97%+ des navigateurs)
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/story/save', data)
        } else {
          // Fallback pour très vieux navigateurs (IE, etc.)
          // Sync XHR est déprécié mais c'est le seul moyen pour les vieux navigateurs
          const xhr = new XMLHttpRequest()
          xhr.open('POST', '/api/story/save', false) // false = synchrone
          xhr.setRequestHeader('Content-Type', 'application/json')
          xhr.send(data)
        }
        
        pendingStoryRef.current = null
      }
    }
    
    // Écouter aussi visibilitychange pour sauvegarder quand l'onglet perd le focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && pendingStoryRef.current) {
        const story = pendingStoryRef.current
        console.log('💾 Sauvegarde auto (onglet masqué):', story.title)
        
        // Utiliser sendBeacon aussi pour visibilitychange (plus fiable)
        const data = JSON.stringify({
          story,
          profileId: profile.id,
          userName: userName || 'Anonyme',
        })
        
        navigator.sendBeacon('/api/story/save', data)
        pendingStoryRef.current = null
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Support Electron : écouter l'événement de fermeture de l'app
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const electronAPI = (window as any).electronAPI
    if (electronAPI?.onAppWillQuit) {
      electronAPI.onAppWillQuit(() => {
        if (pendingStoryRef.current) {
          const story = pendingStoryRef.current
          console.log('🚨 Sauvegarde Electron avant fermeture:', story.title)
          
          const data = JSON.stringify({
            story,
            profileId: profile.id,
            userName: userName || 'Anonyme',
          })
          
          if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/story/save', data)
          }
          pendingStoryRef.current = null
        }
      })
    }
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [profile?.id, userName])

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

// ============================================
// DIAGNOSTIC : Fonction de debug pour la console navigateur
// Appeler window.__debugStorySync() dans la console pour voir l'état
// ============================================
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__debugStorySync = async () => {
    const appState = useAppStore.getState()
    const stories = appState.stories

    console.log('=== DEBUG STORY SYNC ===')
    console.log(`Stories en mémoire: ${stories.length}`)

    for (const story of stories) {
      console.log(`\n📖 "${story.title}" (${story.id})`)
      console.log(`   updatedAt: ${story.updatedAt}`)
      console.log(`   Pages: ${story.pages.length}`)

      for (const page of story.pages) {
        const imgs = page.images?.length || 0
        const decos = page.decorations?.length || 0
        const tbs = page.textBoxes?.length || 0
        const bg = page.backgroundMedia ? `${page.backgroundMedia.type}:${page.backgroundMedia.url?.substring(0, 50)}` : 'none'
        console.log(`   📄 Page ${page.stepIndex + 1} (${page.id}): ${imgs} imgs, ${decos} décos, ${tbs} tbs, bg=${bg}, content="${(page.content || '').substring(0, 40)}"`)
      }

      // Comparer avec Supabase
      console.log(`   --- Lecture directe Supabase ---`)
      const { data: dbPages, error } = await supabase
        .from('story_pages')
        .select('id, page_number, media_layers, text_blocks')
        .eq('story_id', story.id)
        .order('page_number')

      if (error) {
        console.error(`   ❌ Erreur lecture Supabase: ${error.message} (code: ${error.code})`)
        if (error.message?.includes('row-level security') || error.code === '42501') {
          console.error('   🚨 ERREUR RLS ! La policy story_pages est manquante ou incorrecte.')
        }
      } else if (!dbPages || dbPages.length === 0) {
        console.error(`   🚨 0 pages dans Supabase ! (mais ${story.pages.length} en mémoire)`)
      } else {
        console.log(`   ${dbPages.length} pages dans Supabase`)
        for (const dbPage of dbPages) {
          const ml = dbPage.media_layers as any
          const mlType = ml ? (Array.isArray(ml) ? 'array' : 'object') : 'null'
          const dbImgs = ml?.images?.length ?? 0
          const dbDecos = ml?.decorations?.length ?? 0
          const dbContent = (dbPage.text_blocks as any)?.[0]?.content || ''
          console.log(`   📄 DB Page ${dbPage.page_number} (${dbPage.id}): ml=${mlType}, ${dbImgs} imgs, ${dbDecos} décos, content="${dbContent.substring(0, 40)}"`)
        }
      }
    }
    console.log('\n=== FIN DEBUG ===')
  }
}

export default useSupabaseSync
