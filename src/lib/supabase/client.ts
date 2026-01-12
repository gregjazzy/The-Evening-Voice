import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client pour le navigateur (côté client)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Fonction helper pour créer un client avec token d'accès
export const createSupabaseClient = (accessToken?: string) => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  })
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

