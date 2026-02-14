/**
 * Hook pour synchroniser les projets de montage avec Supabase
 * 
 * Synchronise automatiquement :
 * - Scènes et leur contenu textuel
 * - Phrases et leurs timings
 * - Médias (images, vidéos) avec positions temporelles
 * - Sons et musique
 * - Lumières
 * - Narration et timings de synchronisation
 */

'use client'

import { useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/useAuthStore'
import { useMontageStore, type MontageProject, type MontageScene } from '@/store/useMontageStore'

// Debounce pour éviter trop de requêtes
const SYNC_DEBOUNCE_MS = 2000

export function useMontageSync() {
  const { profile } = useAuthStore()
  // IMPORTANT: Utiliser un selector pour que Zustand déclenche les re-renders !
  const currentProject = useMontageStore((state) => state.currentProject)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSyncedRef = useRef<string | null>(null)

  // Charger les projets depuis Supabase au démarrage
  const loadFromSupabase = useCallback(async () => {
    if (!profile?.id) return

    try {
      const { data, error } = await supabase
        .from('montage_projects')
        .select('*')
        .eq('profile_id', profile.id)
        .order('updated_at', { ascending: false })

      if (error) {
        // Ignorer si la table n'existe pas encore
        if (error.message.includes('montage_projects') || error.code === '42P01') {
          console.log('⚠️ Table montage_projects non créée - synchronisation désactivée')
          return
        }
        console.error('❌ Erreur chargement projets montage:', error)
        return
      }

      if (data && data.length > 0) {
        // Type pour les données Supabase
        interface DbMontageProject {
          id: string
          story_id: string
          title: string
          scenes: MontageScene[] | { scenes: MontageScene[] }
          is_complete: boolean
          created_at: string
          updated_at: string
        }
        
        // Normaliser une scène avec toutes les propriétés par défaut
        const normalizeScene = (scene: Partial<MontageScene>): MontageScene => ({
          id: scene.id || crypto.randomUUID(),
          bookPageId: (scene as any).bookPageId || scene.id || '',
          title: scene.title || 'Scène',
          text: scene.text || '',
          phrases: scene.phrases || (scene.text ? scene.text.split(/[.!?]+/).filter(p => p.trim()).map(p => p.trim()) : []),
          duration: scene.duration || 0,
          introDuration: scene.introDuration || 0,
          outroDuration: scene.outroDuration || 0,
          narration: {
            id: scene.narration?.id || crypto.randomUUID(),
            audioUrl: scene.narration?.audioUrl || undefined,
            source: scene.narration?.source || 'recorded',
            duration: scene.narration?.duration || 0,
            isSynced: scene.narration?.isSynced || false,
            phrases: scene.narration?.phrases || [],
          },
          mediaTracks: scene.mediaTracks || [],
          musicTracks: (scene as any).musicTracks || [],
          soundTracks: scene.soundTracks || [],
          lightTracks: scene.lightTracks || [],
          decorationTracks: (scene as any).decorationTracks || [],
          animationTracks: (scene as any).animationTracks || [],
          textEffectTracks: scene.textEffectTracks || (scene as any).textEffects || [],
        })
        
        // Convertir les données Supabase en format store
        const typedData = data as unknown as DbMontageProject[]
        const loadedProjects: MontageProject[] = typedData.map((row) => ({
          id: row.id,
          storyId: row.story_id,
          title: row.title,
          scenes: (Array.isArray(row.scenes) ? row.scenes : (row.scenes as any)?.scenes || []).map(normalizeScene),
          isComplete: row.is_complete || false,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        }))

        // Fusionner avec les projets locaux (priorité au plus récent)
        const { projects: localProjects } = useMontageStore.getState()
        const mergedProjects = mergeProjects(localProjects, loadedProjects)
        
        useMontageStore.setState({ projects: mergedProjects })
        console.log('✅ Projets montage chargés depuis Supabase:', mergedProjects.length)
      }
    } catch (err) {
      console.error('❌ Erreur sync montage:', err)
    }
  }, [profile?.id])

  // Sauvegarder un projet vers Supabase
  const saveToSupabase = useCallback(async (project: MontageProject) => {
    if (!profile?.id) return false

    try {
      // Log les données avant envoi
      const scene0 = project.scenes[0]
      console.log('📤 Envoi vers Supabase:', {
        projectId: project.id,
        scenesCount: project.scenes.length,
        hasAudio: !!scene0?.narration?.audioUrl,
        isSynced: scene0?.narration?.isSynced,
        phrasesCount: scene0?.narration?.phrases?.length || 0,
      })

      const projectData = {
        id: project.id,
        profile_id: profile.id,
        story_id: project.storyId,
        title: project.title,
        scenes: project.scenes,
        is_complete: project.isComplete,
        updated_at: new Date().toISOString(),
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase
        .from('montage_projects')
        .upsert(projectData as any, { onConflict: 'id' })

      if (error) {
        // Ignorer si la table n'existe pas encore
        if (error.message.includes('montage_projects') || error.code === '42P01') {
          console.log('⚠️ Table montage_projects non créée - sauvegarde locale uniquement')
          return true // Pas d'erreur, juste pas de sync
        }
        console.error('❌ Erreur sauvegarde projet montage:', error)
        return false
      }

      console.log('✅ Projet montage synchronisé vers Supabase:', project.title)
      lastSyncedRef.current = JSON.stringify({
        id: project.id,
        scenes: project.scenes,
        isComplete: project.isComplete,
      })
      return true
    } catch (err) {
      console.error('❌ Erreur sync montage:', err)
      return false
    }
  }, [profile?.id])

  // Supprimer un projet de Supabase
  const deleteFromSupabase = useCallback(async (projectId: string) => {
    if (!profile?.id) return

    try {
      const { error } = await supabase
        .from('montage_projects')
        .delete()
        .eq('id', projectId)
        .eq('profile_id', profile.id)

      if (error) {
        console.error('❌ Erreur suppression projet montage:', error)
        return false
      }

      console.log('✅ Projet montage supprimé de Supabase')
      return true
    } catch (err) {
      console.error('❌ Erreur suppression montage:', err)
      return false
    }
  }, [profile?.id])

  // Synchronisation automatique avec debounce
  useEffect(() => {
    if (!currentProject || !profile?.id) return

    // Créer une signature du projet pour détecter les changements
    const projectSignature = JSON.stringify({
      id: currentProject.id,
      scenes: currentProject.scenes,
      isComplete: currentProject.isComplete,
    })

    // Ne pas sync si rien n'a changé
    if (projectSignature === lastSyncedRef.current) return

    // Debounce la synchronisation
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = setTimeout(async () => {
      await saveToSupabase(currentProject)
      lastSyncedRef.current = projectSignature
    }, SYNC_DEBOUNCE_MS)

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [currentProject, profile?.id, saveToSupabase])

  // Charger au montage du composant
  useEffect(() => {
    loadFromSupabase()
  }, [loadFromSupabase])

  // Forcer une synchronisation immédiate (sans debounce)
  const forceSave = useCallback(async () => {
    const { currentProject } = useMontageStore.getState()
    if (!currentProject) {
      console.log('⚠️ forceSave: pas de projet courant')
      return false
    }
    
    console.log('🚀 forceSave: synchronisation IMMÉDIATE')
    
    // Annuler le debounce en cours
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
      syncTimeoutRef.current = null
    }
    
    return await saveToSupabase(currentProject)
  }, [saveToSupabase])

  return {
    loadFromSupabase,
    saveToSupabase,
    deleteFromSupabase,
    forceSave,
  }
}

/**
 * Fusionne les projets locaux et distants
 * Priorité au plus récent pour chaque projet
 */
function mergeProjects(
  local: MontageProject[],
  remote: MontageProject[]
): MontageProject[] {
  const merged = new Map<string, MontageProject>()

  // Ajouter les projets distants
  for (const project of remote) {
    merged.set(project.id, project)
  }

  // Fusionner avec les projets locaux (priorité au plus récent)
  for (const localProject of local) {
    const remoteProject = merged.get(localProject.id)
    
    if (!remoteProject) {
      // Projet uniquement local -> garder
      merged.set(localProject.id, localProject)
    } else {
      // Projet existe des deux côtés -> garder le plus récent
      const localTime = new Date(localProject.updatedAt).getTime()
      const remoteTime = new Date(remoteProject.updatedAt).getTime()
      
      if (localTime > remoteTime) {
        merged.set(localProject.id, localProject)
      }
    }
  }

  return Array.from(merged.values())
}
