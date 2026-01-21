import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client pour le navigateur (côté client) - utilise les cookies pour partager la session avec le middleware
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

// Fonction helper pour créer un client avec token d'accès
export const createSupabaseClient = (accessToken?: string) => {
  if (accessToken) {
    // Pour les cas où on a besoin d'un token spécifique
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    })
  }
  return supabase
}

// Types pour les tables principales
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Story = Database['public']['Tables']['stories']['Row']
export type StoryPage = Database['public']['Tables']['story_pages']['Row']
export type Asset = Database['public']['Tables']['assets']['Row']
export type DiaryEntry = Database['public']['Tables']['diary_entries']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type GenerationJob = Database['public']['Tables']['generation_jobs']['Row']
export type MentorSession = Database['public']['Tables']['mentor_sessions']['Row']

// Export du client par défaut
export default supabase

