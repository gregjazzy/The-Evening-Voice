/**
 * Service de signaling WebRTC via Supabase Realtime
 * Permet aux Macs de se trouver et d'établir une connexion directe
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export interface PeerInfo {
  clientId: string
  name: string
  role: 'mentor' | 'child'
  online: boolean
}

export interface SignalMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'screen-request' | 'control'
  from: string
  to: string
  payload: any
}

export class SignalingService {
  private channel: RealtimeChannel | null = null
  private clientId: string
  private role: 'mentor' | 'child'
  private name: string
  private onPeerJoined?: (peer: PeerInfo) => void
  private onPeerLeft?: (peerId: string) => void
  private onSignal?: (message: SignalMessage) => void

  constructor(clientId: string, role: 'mentor' | 'child', name: string) {
    this.clientId = clientId
    this.role = role
    this.name = name
  }

  /**
   * Se connecter au canal de signaling
   */
  async connect(callbacks: {
    onPeerJoined?: (peer: PeerInfo) => void
    onPeerLeft?: (peerId: string) => void
    onSignal?: (message: SignalMessage) => void
  }) {
    this.onPeerJoined = callbacks.onPeerJoined
    this.onPeerLeft = callbacks.onPeerLeft
    this.onSignal = callbacks.onSignal

    // Canal pour la présence (qui est en ligne)
    this.channel = supabase.channel('remote-control', {
      config: {
        presence: { key: this.clientId },
        broadcast: { self: false },
      },
    })

    // Écouter les changements de présence
    this.channel.on('presence', { event: 'sync' }, () => {
      const state = this.channel?.presenceState() || {}
      
      Object.entries(state).forEach(([key, presences]) => {
        if (key !== this.clientId && presences.length > 0) {
          const presence = presences[0] as any
          this.onPeerJoined?.({
            clientId: key,
            name: presence.name,
            role: presence.role,
            online: true,
          })
        }
      })
    })

    this.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      if (key !== this.clientId && newPresences.length > 0) {
        const presence = newPresences[0] as any
        this.onPeerJoined?.({
          clientId: key,
          name: presence.name,
          role: presence.role,
          online: true,
        })
      }
    })

    this.channel.on('presence', { event: 'leave' }, ({ key }) => {
      if (key !== this.clientId) {
        this.onPeerLeft?.(key)
      }
    })

    // Écouter les messages de signaling (offers, answers, ice candidates)
    this.channel.on('broadcast', { event: 'signal' }, ({ payload }) => {
      const message = payload as SignalMessage
      if (message.to === this.clientId) {
        this.onSignal?.(message)
      }
    })

    // S'abonner et tracker sa présence
    await this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await this.channel?.track({
          name: this.name,
          role: this.role,
          online_at: new Date().toISOString(),
        })
      }
    })
  }

  /**
   * Envoyer un message de signaling à un peer
   */
  async sendSignal(to: string, type: SignalMessage['type'], payload: any) {
    await this.channel?.send({
      type: 'broadcast',
      event: 'signal',
      payload: {
        type,
        from: this.clientId,
        to,
        payload,
      },
    })
  }

  /**
   * Se déconnecter
   */
  async disconnect() {
    await this.channel?.untrack()
    await this.channel?.unsubscribe()
    this.channel = null
  }

  getClientId() {
    return this.clientId
  }
}

