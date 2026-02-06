/**
 * Hook pour synchroniser les préférences utilisateur entre localStorage et Supabase
 * 
 * - Charge les préférences depuis Supabase après connexion
 * - Sauvegarde les préférences dans Supabase quand elles changent
 * - Garde localStorage comme cache pour la performance
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'

export function useSyncUserPreferences() {
  const { profile, updateProfile, isInitialized } = useAuthStore()
  
  // IMPORTANT: Utiliser des selectors individuels pour que Zustand
  // déclenche les re-renders quand ces valeurs changent !
  const aiName = useAppStore((state) => state.aiName)
  const setAiName = useAppStore((state) => state.setAiName)
  const aiVoice = useAppStore((state) => state.aiVoice)
  const setAiVoice = useAppStore((state) => state.setAiVoice)
  const userName = useAppStore((state) => state.userName)
  const setUserName = useAppStore((state) => state.setUserName)
  
  // État pour savoir si les préférences ont été chargées depuis Supabase
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  
  // Ref pour éviter les boucles infinies lors du chargement initial
  const hasLoadedFromSupabase = useRef(false)
  const isSaving = useRef(false)
  
  // Charger les préférences depuis Supabase au démarrage
  useEffect(() => {
    if (!isInitialized || hasLoadedFromSupabase.current) {
      return
    }

    // Si pas de profil, NE PAS marquer comme chargé — attendre que le profil arrive
    // Sinon on risque de montrer l'onboarding alors que l'utilisateur a déjà un aiName en base
    if (!profile) {
      return
    }

    console.log('📥 Chargement des préférences depuis Supabase...')
    hasLoadedFromSupabase.current = true

    // Charger le nom de l'IA depuis Supabase (priorité sur localStorage)
    // Supabase est la source de vérité : écraser la valeur localStorage
    const supabaseAiName = profile.ai_name || ''
    if (supabaseAiName !== aiName) {
      console.log('📥 Nom IA depuis Supabase:', supabaseAiName || '(vide)')
      setAiName(supabaseAiName)
    }

    // Charger la voix depuis Supabase
    const supabaseVoice = profile.preferred_voice_id || ''
    if (supabaseVoice !== aiVoice) {
      console.log('📥 Voix depuis Supabase:', supabaseVoice || '(vide)')
      setAiVoice(supabaseVoice)
    }

    // Charger le nom de l'enfant (c'est le champ 'name' dans profiles)
    if (profile.name && profile.name !== userName) {
      console.log('📥 Prénom enfant depuis Supabase:', profile.name)
      setUserName(profile.name)
    }

    // Marquer les préférences comme chargées
    setPreferencesLoaded(true)
    console.log('✅ Préférences chargées depuis Supabase')
  }, [isInitialized, profile, setAiName, setAiVoice, setUserName]) // eslint-disable-line react-hooks/exhaustive-deps
  // Note: aiName, aiVoice, userName exclus des deps volontairement pour éviter
  // une boucle (on les lit une fois, puis on les écrase avec les valeurs Supabase)
  
  // Sauvegarder vers Supabase (debounced)
  const saveToSupabase = useCallback(async (updates: {
    ai_name?: string
    preferred_voice_id?: string
    name?: string
  }) => {
    if (!profile || isSaving.current) return
    
    isSaving.current = true
    console.log('📤 Sauvegarde des préférences vers Supabase:', updates)
    
    try {
      const { error } = await updateProfile(updates)
      if (error) {
        console.error('❌ Erreur sauvegarde Supabase:', error)
      } else {
        console.log('✅ Préférences sauvegardées dans Supabase')
      }
    } catch (err) {
      console.error('❌ Erreur sauvegarde:', err)
    } finally {
      isSaving.current = false
    }
  }, [profile, updateProfile])
  
  // Sauvegarder le nom de l'IA quand il change
  useEffect(() => {
    if (!hasLoadedFromSupabase.current || !profile || !aiName) return

    // IMPORTANT: Ne PAS écraser Supabase si le profil est nouveau (ai_name null)
    // Cela évite de synchroniser une valeur localStorage d'un ancien compte
    // vers un nouveau compte, ce qui empêcherait l'onboarding de se déclencher
    if (!profile.ai_name) {
      console.log('⚠️ Nouveau profil détecté - pas de sync localStorage → Supabase pour ai_name')
      return
    }

    // Ne sauvegarder que si différent de ce qui est en base
    if (aiName !== profile.ai_name) {
      saveToSupabase({ ai_name: aiName })
    }
  }, [aiName, profile, saveToSupabase])
  
  // Sauvegarder la voix quand elle change
  useEffect(() => {
    if (!hasLoadedFromSupabase.current || !profile || !aiVoice) return
    
    // Ne sauvegarder que si différent de ce qui est en base
    if (aiVoice !== profile.preferred_voice_id) {
      saveToSupabase({ preferred_voice_id: aiVoice })
    }
  }, [aiVoice, profile, saveToSupabase])
  
  // Sauvegarder le nom de l'enfant quand il change
  useEffect(() => {
    if (!hasLoadedFromSupabase.current || !profile || !userName) return
    
    // Ne sauvegarder que si différent de ce qui est en base
    if (userName !== profile.name) {
      saveToSupabase({ name: userName })
    }
  }, [userName, profile, saveToSupabase])
  
  // Reset quand l'utilisateur se déconnecte
  useEffect(() => {
    if (!profile && hasLoadedFromSupabase.current) {
      console.log('🔄 Déconnexion - reset du flag de chargement')
      hasLoadedFromSupabase.current = false
      setPreferencesLoaded(false)
    }
  }, [profile])
  
  return { preferencesLoaded }
}
