/**
 * Gestion des connexions WebRTC peer-to-peer
 * - Streaming d'écran
 * - Vidéo/Audio (webcam)
 * - Canal de données pour le contrôle (clics, clavier)
 */

import { SignalingService, SignalMessage } from './signaling'

export interface RemoteControlEvent {
  type: 'click' | 'key' | 'mouse-move'
  x?: number
  y?: number
  key?: string
  modifiers?: string[]
}

export class PeerConnection {
  private pc: RTCPeerConnection | null = null
  private signaling: SignalingService
  private remotePeerId: string
  private dataChannel: RTCDataChannel | null = null
  
  // Callbacks
  private onRemoteScreen?: (stream: MediaStream) => void
  private onRemoteVideo?: (stream: MediaStream) => void
  private onControlEvent?: (event: RemoteControlEvent) => void
  private onConnectionStateChange?: (state: RTCPeerConnectionState) => void

  constructor(signaling: SignalingService, remotePeerId: string) {
    this.signaling = signaling
    this.remotePeerId = remotePeerId
  }

  /**
   * Initialiser la connexion WebRTC
   */
  async init(callbacks: {
    onRemoteScreen?: (stream: MediaStream) => void
    onRemoteVideo?: (stream: MediaStream) => void
    onControlEvent?: (event: RemoteControlEvent) => void
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  }) {
    this.onRemoteScreen = callbacks.onRemoteScreen
    this.onRemoteVideo = callbacks.onRemoteVideo
    this.onControlEvent = callbacks.onControlEvent
    this.onConnectionStateChange = callbacks.onConnectionStateChange

    // Configuration ICE (serveurs STUN/TURN pour traverser les NAT)
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // Serveur TURN gratuit (backup si STUN ne marche pas)
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
      ],
    }

    this.pc = new RTCPeerConnection(config)

    // Gérer les candidats ICE
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.sendSignal(this.remotePeerId, 'ice-candidate', {
          candidate: event.candidate.toJSON(),
        })
      }
    }

    // Gérer les flux entrants
    this.pc.ontrack = (event) => {
      const stream = event.streams[0]
      const track = event.track
      
      // Distinguer écran vs webcam par le label ou l'ID
      if (track.kind === 'video') {
        if (stream.id.includes('screen') || track.label.includes('screen')) {
          this.onRemoteScreen?.(stream)
        } else {
          this.onRemoteVideo?.(stream)
        }
      }
    }

    // État de la connexion
    this.pc.onconnectionstatechange = () => {
      this.onConnectionStateChange?.(this.pc?.connectionState || 'closed')
    }

    // Canal de données pour le contrôle
    this.pc.ondatachannel = (event) => {
      this.setupDataChannel(event.channel)
    }
  }

  /**
   * Configurer le canal de données
   */
  private setupDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel
    
    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as RemoteControlEvent
        this.onControlEvent?.(data)
      } catch (e) {
        console.error('Erreur parsing control event:', e)
      }
    }
  }

  /**
   * Créer une offre (côté mentor qui initie)
   */
  async createOffer() {
    if (!this.pc) return

    // Créer le canal de données pour le contrôle
    const channel = this.pc.createDataChannel('control', { ordered: true })
    this.setupDataChannel(channel)

    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)

    await this.signaling.sendSignal(this.remotePeerId, 'offer', {
      sdp: offer.sdp,
      type: offer.type,
    })
  }

  /**
   * Recevoir une offre (côté enfant)
   */
  async handleOffer(offer: RTCSessionDescriptionInit) {
    if (!this.pc) return

    await this.pc.setRemoteDescription(new RTCSessionDescription(offer))
    
    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)

    await this.signaling.sendSignal(this.remotePeerId, 'answer', {
      sdp: answer.sdp,
      type: answer.type,
    })
  }

  /**
   * Recevoir une réponse (côté mentor)
   */
  async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.pc) return
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer))
  }

  /**
   * Ajouter un candidat ICE
   */
  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.pc) return
    await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
  }

  /**
   * Ajouter le flux d'écran (côté enfant)
   */
  async addScreenStream(stream: MediaStream) {
    if (!this.pc) return
    
    stream.getTracks().forEach((track) => {
      this.pc?.addTrack(track, stream)
    })
  }

  /**
   * Ajouter le flux webcam/audio
   */
  async addCameraStream(stream: MediaStream) {
    if (!this.pc) return
    
    stream.getTracks().forEach((track) => {
      this.pc?.addTrack(track, stream)
    })
  }

  /**
   * Envoyer un événement de contrôle (côté mentor)
   */
  sendControlEvent(event: RemoteControlEvent) {
    if (this.dataChannel?.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(event))
    }
  }

  /**
   * Fermer la connexion
   */
  close() {
    this.dataChannel?.close()
    this.pc?.close()
    this.pc = null
    this.dataChannel = null
  }

  getConnectionState(): RTCPeerConnectionState {
    return this.pc?.connectionState || 'closed'
  }
}

