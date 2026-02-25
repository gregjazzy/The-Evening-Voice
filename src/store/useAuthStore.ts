/**
 * Store d'authentification avec Supabase
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase/client'
import { flushPendingStorySave } from '@/hooks/useSupabaseSync'
import type { User, Session, SupabaseClient } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase/client'

// Cast pour contourner les problèmes de typage Supabase
const db = supabase as unknown as SupabaseClient<any, any, any>

export type UserRole = 'child' | 'mentor' | 'parent'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  isInitialized: boolean
  
  // Actions
  initialize: () => Promise<void>
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

// Flag pour éviter les initialisations concurrentes (hors du store car doit persister entre les renders)
let isInitializing = false

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      isLoading: true,
      isInitialized: false,

      initialize: async () => {
        // Éviter les appels concurrents
        if (isInitializing || get().isInitialized) {
          return
        }
        isInitializing = true
        
        try {
          // getUser() vérifie le token côté serveur (contrairement à getSession qui lit le cookie local)
          const { data: { user: authUser }, error: userError } = await db.auth.getUser()

          if (userError) {
            if (userError.message?.includes('AbortError') || userError.name === 'AbortError') {
              console.warn('⚠️ Auth check aborted (normal lors du rechargement)')
            } else {
              console.error('Erreur getUser:', userError)
            }
            set({ user: null, session: null, profile: null, isLoading: false, isInitialized: true })
            isInitializing = false
            return
          }

          if (authUser) {
            // Récupérer la session (pour le token, refresh, etc.)
            const { data: { session } } = await db.auth.getSession()

            // Récupérer le profil
            const { data: profiles } = await db
              .from('profiles')
              .select('*')
              .eq('user_id', authUser.id)
              .limit(1)
            const profile = profiles?.[0] || null

            if (!profile) {
              // User authentifié mais sans profil → session orpheline, déconnecter
              console.warn('⚠️ User authentifié sans profil, déconnexion:', authUser.id)
              await db.auth.signOut()
              set({ user: null, session: null, profile: null, isLoading: false, isInitialized: true })
              isInitializing = false
              return
            }

            set({
              user: authUser,
              session,
              profile,
              isLoading: false,
              isInitialized: true,
            })
          } else {
            set({
              user: null,
              session: null,
              profile: null,
              isLoading: false,
              isInitialized: true,
            })
          }
          
          isInitializing = false

          // Écouter les changements d'auth (une seule fois)
          db.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              const { data: profiles } = await db
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .limit(1)

              set({
                user: session.user,
                session,
                profile: profiles?.[0] || null,
              })
            } else if (event === 'TOKEN_REFRESHED' && session) {
              // Mettre à jour le token dans le store (utilisé par useMediaUpload)
              set({ session })
            } else if (event === 'SIGNED_OUT') {
              set({
                user: null,
                session: null,
                profile: null,
              })
            }
          })
        } catch (error: any) {
          isInitializing = false
          
          // Ignorer les AbortError (problème connu de Supabase auth-js avec les Web Locks)
          if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
            console.warn('⚠️ Auth initialization aborted (normal lors du rechargement)')
            set({ isLoading: false, isInitialized: true })
            return
          }
          console.error('Erreur initialisation auth:', error)
          set({ isLoading: false, isInitialized: true })
        }
      },

      signUp: async (email, password, name, role) => {
        set({ isLoading: true })

        // IMPORTANT: Vider le localStorage AVANT l'inscription
        // pour éviter que des données d'un ancien compte polluent le nouveau
        if (typeof window !== 'undefined') {
          localStorage.removeItem('lavoixdusoir-storage')
          localStorage.removeItem('lavoixdusoir-studio')
          localStorage.removeItem('lavoixdusoir-montage-v3')
          localStorage.removeItem('lavoixdusoir-studio-progress')
          localStorage.removeItem('lavoixdusoir-challenge-progress')
          console.log('🧹 localStorage vidé avant inscription')
        }

        try {
          // Créer l'utilisateur
          const { data: authData, error: authError } = await db.auth.signUp({
            email,
            password,
            options: {
              data: { name, role },
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
          })

          if (authError) {
            set({ isLoading: false })
            return { error: authError.message }
          }

          if (!authData.user) {
            set({ isLoading: false })
            return { error: 'Erreur lors de la création du compte' }
          }

          // Si pas de session, l'email n'est pas encore confirmé
          // Ne pas mettre le user dans le store (sinon redirect automatique)
          if (!authData.session) {
            set({ isLoading: false })
            // Créer le profil via l'API serveur (service role, pas besoin de session)
            try {
              await fetch('/api/auth/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: authData.user.id, name, role }),
              })
            } catch (e) {
              console.error('❌ Création profil échouée:', e)
            }
            return { error: null }
          }

          // Session existe (email auto-confirmé ou déjà confirmé)
          // Vérifier si le trigger Supabase a déjà créé un profil
          const { data: existingProfiles } = await db
            .from('profiles')
            .select('*')
            .eq('user_id', authData.user.id)
            .limit(1)

          let profile = existingProfiles?.[0] || null

          if (profile) {
            // Le trigger a créé le profil — forcer le bon nom via l'API serveur
            if (profile.name !== name) {
              try {
                await fetch('/api/auth/update-profile', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: authData.user!.id, name, role }),
                })
              } catch (e) {
                console.error('❌ Update profil échoué:', e)
              }
              profile = { ...profile, name, role }
            }
          } else {
            // Pas de trigger — créer le profil via l'API serveur
            try {
              await fetch('/api/auth/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: authData.user!.id, name, role }),
              })
            } catch (e) {
              console.error('❌ Création profil échouée, fallback client:', e)
            }
            const { data: refreshed } = await db
              .from('profiles')
              .select('*')
              .eq('user_id', authData.user.id)
              .limit(1)
            profile = refreshed?.[0] || null
          }

          set({
            user: authData.user,
            session: authData.session,
            profile,
            isLoading: false,
          })

          return { error: null }
        } catch (error: any) {
          set({ isLoading: false })
          return { error: error.message || 'Erreur inconnue' }
        }
      },

      signIn: async (email, password) => {
        set({ isLoading: true })
        
        try {
          const { data, error } = await db.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            set({ isLoading: false })
            return { error: error.message }
          }

          if (data.user) {
            // Récupérer le profil (limit 1 pour gérer les doublons éventuels)
            const { data: profiles } = await db
              .from('profiles')
              .select('*')
              .eq('user_id', data.user.id)
              .limit(1)
            let profile = profiles?.[0] || null

            // Créer le profil seulement s'il n'existe vraiment pas
            if (!profile) {
              const userMeta = data.user.user_metadata
              const fullName = (userMeta?.first_name && userMeta?.last_name)
                ? `${userMeta.first_name} ${userMeta.last_name}`
                : userMeta?.name || data.user.email?.split('@')[0] || 'Utilisateur'
              const { data: newProfiles } = await db
                .from('profiles')
                .insert({
                  user_id: data.user.id,
                  name: fullName,
                  role: userMeta?.role || 'child',
                })
                .select()
                .limit(1)

              profile = newProfiles?.[0] || null
            }

            set({
              user: data.user,
              session: data.session,
              profile,
              isLoading: false,
            })
          }

          return { error: null }
        } catch (error: any) {
          set({ isLoading: false })
          return { error: error.message || 'Erreur inconnue' }
        }
      },

      signOut: async () => {
        console.log('🚪 Déconnexion en cours...')

        // Sauvegarder immédiatement toute histoire en attente AVANT de couper la session
        flushPendingStorySave()

        try {
          const { error } = await db.auth.signOut()
          if (error) {
            console.error('❌ Erreur Supabase signOut:', error)
            // Continuer quand même la déconnexion locale
          }
        } catch (err) {
          console.error('❌ Exception signOut:', err)
          // Continuer quand même la déconnexion locale
        }
        
        // IMPORTANT: Vider le localStorage pour éviter le mélange de données entre comptes
        if (typeof window !== 'undefined') {
          // Supprimer les données des stores persistés
          localStorage.removeItem('lavoixdusoir-storage') // useAppStore (histoires, chat, etc.)
          localStorage.removeItem('lavoixdusoir-studio') // useStudioStore (assets, kits)
          localStorage.removeItem('lavoixdusoir-montage-v3') // useMontageStore (projets montage)
          localStorage.removeItem('lavoixdusoir-studio-progress') // useStudioProgressStore
          localStorage.removeItem('lavoixdusoir-challenge-progress') // useChallengeProgressStore
          localStorage.removeItem('lavoixdusoir-current-profile-id') // ID du profil connecté
          console.log('🧹 LocalStorage vidé à la déconnexion')

          // Force-clear all Supabase auth cookies (sb-*) to prevent middleware seeing stale session
          document.cookie.split(';').forEach(cookie => {
            const name = cookie.split('=')[0].trim()
            if (name.startsWith('sb-')) {
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
            }
          })
          console.log('🍪 Cookies Supabase nettoyés')
        }
        
        // Toujours réinitialiser le state local (même si Supabase échoue)
        set({
          user: null,
          session: null,
          profile: null,
        })
        
        console.log('✅ Déconnexion terminée')
      },

      updateProfile: async (updates) => {
        const { profile } = get()
        if (!profile) return { error: 'Pas de profil' }

        try {
          const { error } = await db
            .from('profiles')
            .update(updates)
            .eq('id', profile.id)

          if (error) {
            return { error: error.message }
          }

          // Mettre à jour le state local
          set({ profile: { ...profile, ...updates } as Profile })
          return { error: null }
        } catch (error: any) {
          return { error: error.message || 'Erreur inconnue' }
        }
      },

      refreshProfile: async () => {
        const { user } = get()
        if (!user) return

        const { data: profiles } = await db
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .limit(1)

        if (profiles?.[0]) {
          set({ profile: profiles[0] })
        }
      },
    }),
    {
      name: 'lavoixdusoir-auth',
      partialize: () => ({
        // NE RIEN PERSISTER - le profil doit TOUJOURS venir de Supabase
        // Cela évite les problèmes de cache avec des noms incorrects
      }),
    }
  )
)

