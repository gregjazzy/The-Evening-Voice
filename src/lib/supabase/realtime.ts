/**
 * Service de synchronisation temps réel avec Supabase
 * Permet la collaboration entre les filles et le mentor
 */

import { supabase } from './client'
import { RealtimeChannel, RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

type StoryPage = Database['public']['Tables']['story_pages']['Row']
type MentorSession = Database['public']['Tables']['mentor_sessions']['Row']

// Cast pour contourner les problèmes de typage génériques Supabase
const db = supabase as unknown as SupabaseClient<any, any, any>

// Types pour les événements temps réel
export interface RealtimeEvent {
  type: 'page_update' | 'cursor_move' | 'mode_change' | 'control_request' | 'control_response'
  payload: any
  senderId: string
  timestamp: number
}

export interface CursorPosition {
  x: number
  y: number
  userId: string
  userName: string
  color: string
}

// Callbacks
type PageUpdateCallback = (page: StoryPage) => void
type SessionUpdateCallback = (session: MentorSession) => void
type CursorCallback = (cursor: CursorPosition) => void
type EventCallback = (event: RealtimeEvent) => void

// Classe pour gérer la synchronisation temps réel
export class RealtimeSync {
  private channel: RealtimeChannel | null = null
  private sessionCode: string
  private userId: string
  private userName: string
  private callbacks: {
    onPageUpdate?: PageUpdateCallback
    onSessionUpdate?: SessionUpdateCallback
    onCursorMove?: CursorCallback
    onEvent?: EventCallback
  } = {}

  constructor(sessionCode: string, userId: string, userName: string) {
    this.sessionCode = sessionCode
    this.userId = userId
    this.userName = userName
  }

  /**
   * Connecte au canal temps réel de la session
   */
  async connect(callbacks: {
    onPageUpdate?: PageUpdateCallback
    onSessionUpdate?: SessionUpdateCallback
    onCursorMove?: CursorCallback
    onEvent?: EventCallback
  }): Promise<void> {
    this.callbacks = callbacks

    // Créer le canal pour cette session
    this.channel = supabase.channel(`session:${this.sessionCode}`, {
      config: {
        broadcast: { self: false },
        presence: { key: this.userId },
      },
    })

    // Écouter les changements de pages
    this.channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'story_pages',
      },
      (payload: RealtimePostgresChangesPayload<StoryPage>) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          this.callbacks.onPageUpdate?.(payload.new as StoryPage)
        }
      }
    )

    // Écouter les changements de session mentor
    this.channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'mentor_sessions',
        filter: `session_code=eq.${this.sessionCode}`,
      },
      (payload: RealtimePostgresChangesPayload<MentorSession>) => {
        if (payload.eventType === 'UPDATE') {
          this.callbacks.onSessionUpdate?.(payload.new as MentorSession)
        }
      }
    )

    // Écouter les broadcasts (curseurs, événements)
    this.channel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
      this.callbacks.onCursorMove?.(payload as CursorPosition)
    })

    this.channel.on('broadcast', { event: 'event' }, ({ payload }) => {
      this.callbacks.onEvent?.(payload as RealtimeEvent)
    })

    // Gérer la présence
    this.channel.on('presence', { event: 'sync' }, () => {
      const state = this.channel?.presenceState()
      console.log('Présence sync:', state)
    })

    this.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('Utilisateur rejoint:', key, newPresences)
    })

    this.channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('Utilisateur parti:', key, leftPresences)
    })

    // S'abonner
    await this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Tracker la présence
        await this.channel?.track({
          id: this.userId,
          name: this.userName,
          online_at: new Date().toISOString(),
        })
      }
    })
  }

  /**
   * Envoie une mise à jour de curseur
   */
  async sendCursorPosition(x: number, y: number, color: string = '#E979F9'): Promise<void> {
    if (!this.channel) return

    await this.channel.send({
      type: 'broadcast',
      event: 'cursor',
      payload: {
        x,
        y,
        userId: this.userId,
        userName: this.userName,
        color,
      } as CursorPosition,
    })
  }

  /**
   * Envoie un événement personnalisé
   */
  async sendEvent(type: RealtimeEvent['type'], payload: any): Promise<void> {
    if (!this.channel) return

    await this.channel.send({
      type: 'broadcast',
      event: 'event',
      payload: {
        type,
        payload,
        senderId: this.userId,
        timestamp: Date.now(),
      } as RealtimeEvent,
    })
  }

  /**
   * Envoie un changement de mode
   */
  async sendModeChange(mode: string): Promise<void> {
    await this.sendEvent('mode_change', { mode })
  }

  /**
   * Récupère les utilisateurs présents
   */
  getPresences(): Record<string, any> {
    return this.channel?.presenceState() || {}
  }

  /**
   * Déconnecte du canal
   */
  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.untrack()
      await supabase.removeChannel(this.channel)
      this.channel = null
    }
  }
}

// ============================================
// FONCTIONS UTILITAIRES POUR LES DONNÉES
// ============================================

/**
 * Sauvegarde une page en base de données
 */
export async function savePage(page: Partial<StoryPage> & { id: string }): Promise<StoryPage | null> {
  const { data, error } = await db
    .from('story_pages')
    .upsert(page)
    .select()
    .single()

  if (error) {
    console.error('Erreur sauvegarde page:', error)
    return null
  }

  return data as StoryPage
}

/**
 * Crée une session mentor
 */
export async function createMentorSession(
  mentorId: string
): Promise<{ session: MentorSession; code: string } | null> {
  // Générer un code unique
  const code = Math.random().toString(36).substring(2, 10).toUpperCase()

  const { data, error } = await db
    .from('mentor_sessions')
    .insert({
      session_code: code,
      mentor_id: mentorId,
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    console.error('Erreur création session:', error)
    return null
  }

  return { session: data as MentorSession, code }
}

/**
 * Rejoint une session mentor
 */
export async function joinMentorSession(
  code: string,
  childId: string
): Promise<MentorSession | null> {
  // Récupérer la session
  const { data: session, error: fetchError } = await db
    .from('mentor_sessions')
    .select()
    .eq('session_code', code)
    .eq('status', 'active')
    .single()

  if (fetchError || !session) {
    console.error('Session non trouvée:', fetchError)
    return null
  }

  // Ajouter l'enfant à la liste
  const connectedChildren = session.connected_children || []
  const { data, error } = await db
    .from('mentor_sessions')
    .update({
      connected_children: [...connectedChildren, childId],
    })
    .eq('id', session.id)
    .select()
    .single()

  if (error) {
    console.error('Erreur rejoindre session:', error)
    return null
  }

  return data as MentorSession
}

/**
 * Met à jour le statut de contrôle
 */
export async function updateControlStatus(
  sessionId: string,
  controlActive: boolean,
  controlledChildId?: string
): Promise<void> {
  await db
    .from('mentor_sessions')
    .update({
      control_active: controlActive,
      controlled_child_id: controlledChildId || null,
    })
    .eq('id', sessionId)
}

