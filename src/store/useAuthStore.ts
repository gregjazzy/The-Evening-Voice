/**
 * Store d'authentification avec Supabase
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase/client'
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
  signInWithMagicCode: (code: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      isLoading: true,
      isInitialized: false,

      initialize: async () => {
        try {
          // Récupérer la session actuelle
          const { data: { session } } = await db.auth.getSession()
          
          if (session?.user) {
            // Récupérer le profil
            const { data: profile } = await db
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single()
            
            set({
              user: session.user,
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

          // Écouter les changements d'auth
          db.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              const { data: profile } = await db
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single()
              
              set({
                user: session.user,
                session,
                profile,
              })
            } else if (event === 'SIGNED_OUT') {
              set({
                user: null,
                session: null,
                profile: null,
              })
            }
          })
        } catch (error) {
          console.error('Erreur initialisation auth:', error)
          set({ isLoading: false, isInitialized: true })
        }
      },

      signUp: async (email, password, name, role) => {
        set({ isLoading: true })
        
        try {
          // Créer l'utilisateur
          const { data: authData, error: authError } = await db.auth.signUp({
            email,
            password,
            options: {
              data: { name, role }
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

          // Créer le profil
          const { error: profileError } = await db
            .from('profiles')
            .insert({
              user_id: authData.user.id,
              name,
              role,
            })

          if (profileError) {
            console.error('Erreur création profil:', profileError)
            // Ne pas bloquer si le profil existe déjà
          }

          // Récupérer le profil créé
          const { data: profile } = await db
            .from('profiles')
            .select('*')
            .eq('user_id', authData.user.id)
            .single()

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
            let { data: profile } = await db
              .from('profiles')
              .select('*')
              .eq('user_id', data.user.id)
              .single()

            // Créer le profil s'il n'existe pas
            if (!profile) {
              const userMeta = data.user.user_metadata
              const { data: newProfile } = await db
                .from('profiles')
                .insert({
                  user_id: data.user.id,
                  name: userMeta?.name || data.user.email?.split('@')[0] || 'Utilisateur',
                  role: userMeta?.role || 'child',
                })
                .select()
                .single()
              
              profile = newProfile
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

      signInWithMagicCode: async (code) => {
        set({ isLoading: true })
        
        try {
          // Chercher un profil avec ce code magique (stocké dans metadata)
          const { data: profile, error: profileError } = await db
            .from('profiles')
            .select('*')
            .contains('badges', [{ type: 'magic_code', value: code }])
            .single()

          if (profileError || !profile) {
            set({ isLoading: false })
            return { error: 'Code magique invalide' }
          }

          // Pour le MVP, on peut simuler une connexion
          // En production, il faudrait un système de tokens
          set({ isLoading: false })
          return { error: 'Fonctionnalité en développement' }
        } catch (error: any) {
          set({ isLoading: false })
          return { error: error.message || 'Erreur inconnue' }
        }
      },

      signOut: async () => {
        await db.auth.signOut()
        set({
          user: null,
          session: null,
          profile: null,
        })
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

        const { data: profile } = await db
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (profile) {
          set({ profile })
        }
      },
    }),
    {
      name: 'lavoixdusoir-auth',
      partialize: (state) => ({
        // Ne persister que certaines données
        profile: state.profile,
      }),
    }
  )
)

