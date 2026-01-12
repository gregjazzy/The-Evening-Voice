/**
 * Hook principal pour les sessions de contrôle à distance
 * Combine : Supabase signaling + WebRTC + Vidéo + Contrôle
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { SignalingService, PeerConnection, PeerInfo, SignalMessage, RemoteControlEvent } from '@/lib/webrtc'
import { useAuthStore } from '@/store/useAuthStore'
import { v4 as uuidv4 } from 'uuid'

interface RemoteSessionState {
  // État connexion
  isConnected: boolean
  connectionState: RTCPeerConnectionState | 'disconnected'
  
  // Peers
  availablePeers: PeerInfo[]
  connectedPeer: PeerInfo | null
  
  // Streams
  remoteScreenStream: MediaStream | null
  remoteVideoStream: MediaStream | null
  localVideoStream: MediaStream | null
  
  // Erreurs
  error: string | null
}

export function useRemoteSession() {
  const { profile } = useAuthStore()
  const role = profile?.role === 'mentor' || profile?.role === 'parent' ? 'mentor' : 'child'
  const name = profile?.name || (role === 'mentor' ? 'Mentor' : 'Enfant')

  const [state, setState] = useState<RemoteSessionState>({
    isConnected: false,
    connectionState: 'disconnected',
    availablePeers: [],
    connectedPeer: null,
    remoteScreenStream: null,
    remoteVideoStream: null,
    localVideoStream: null,
    error: null,
  })

  const signalingRef = useRef<SignalingService | null>(null)
  const peerConnectionRef = useRef<PeerConnection | null>(null)
  const clientIdRef = useRef<string>(uuidv4())

  /**
   * Se connecter au service de signaling
   */
  const connect = useCallback(async () => {
    try {
      const signaling = new SignalingService(clientIdRef.current, role, name)
      signalingRef.current = signaling

      await signaling.connect({
        onPeerJoined: (peer) => {
          // N'ajouter que les peers du rôle opposé
          if ((role === 'mentor' && peer.role === 'child') ||
              (role === 'child' && peer.role === 'mentor')) {
            setState((prev) => ({
              ...prev,
              availablePeers: [...prev.availablePeers.filter(p => p.clientId !== peer.clientId), peer],
            }))
          }
        },
        onPeerLeft: (peerId) => {
          setState((prev) => ({
            ...prev,
            availablePeers: prev.availablePeers.filter((p) => p.clientId !== peerId),
            connectedPeer: prev.connectedPeer?.clientId === peerId ? null : prev.connectedPeer,
          }))
        },
        onSignal: (message) => handleSignalMessage(message),
      })

      setState((prev) => ({ ...prev, isConnected: true, error: null }))
    } catch (error) {
      setState((prev) => ({ 
        ...prev, 
        error: 'Erreur de connexion au service',
        isConnected: false,
      }))
    }
  }, [role, name])

  /**
   * Gérer les messages de signaling
   */
  const handleSignalMessage = useCallback(async (message: SignalMessage) => {
    const pc = peerConnectionRef.current

    switch (message.type) {
      case 'offer':
        // Côté enfant : recevoir une demande de connexion du mentor
        if (role === 'child' && signalingRef.current) {
          const newPc = new PeerConnection(signalingRef.current, message.from)
          peerConnectionRef.current = newPc

          await newPc.init({
            onRemoteVideo: (stream) => {
              setState((prev) => ({ ...prev, remoteVideoStream: stream }))
            },
            onControlEvent: handleControlEvent,
            onConnectionStateChange: (state) => {
              setState((prev) => ({ ...prev, connectionState: state }))
            },
          })

          await newPc.handleOffer(message.payload)

          // Partager l'écran automatiquement
          await shareScreen()
          // Partager la webcam
          await shareCamera()

          setState((prev) => ({
            ...prev,
            connectedPeer: prev.availablePeers.find((p) => p.clientId === message.from) || null,
          }))
        }
        break

      case 'answer':
        // Côté mentor : recevoir la réponse de l'enfant
        await pc?.handleAnswer(message.payload)
        break

      case 'ice-candidate':
        await pc?.handleIceCandidate(message.payload.candidate)
        break
    }
  }, [role])

  /**
   * Gérer les événements de contrôle (côté enfant)
   */
  const handleControlEvent = useCallback((event: RemoteControlEvent) => {
    if (!window.electronAPI) return

    switch (event.type) {
      case 'click':
        if (event.x !== undefined && event.y !== undefined) {
          window.electronAPI.simulateClick(event.x, event.y)
        }
        break
      case 'key':
        if (event.key) {
          window.electronAPI.simulateKey(event.key, event.modifiers)
        }
        break
    }
  }, [])

  /**
   * Connecter à un peer spécifique (côté mentor)
   */
  const connectToPeer = useCallback(async (peer: PeerInfo) => {
    if (!signalingRef.current) return

    const pc = new PeerConnection(signalingRef.current, peer.clientId)
    peerConnectionRef.current = pc

    await pc.init({
      onRemoteScreen: (stream) => {
        setState((prev) => ({ ...prev, remoteScreenStream: stream }))
      },
      onRemoteVideo: (stream) => {
        setState((prev) => ({ ...prev, remoteVideoStream: stream }))
      },
      onConnectionStateChange: (state) => {
        setState((prev) => ({ ...prev, connectionState: state }))
      },
    })

    // Partager sa webcam
    await shareCamera()

    // Créer l'offre
    await pc.createOffer()

    setState((prev) => ({ ...prev, connectedPeer: peer }))
  }, [])

  /**
   * Partager l'écran (côté enfant)
   */
  const shareScreen = useCallback(async () => {
    if (!peerConnectionRef.current) return

    try {
      // En Electron, utiliser desktopCapturer
      if (window.electronAPI && window.desktopCapturer) {
        const sources = await window.desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: 1920, height: 1080 },
        })

        if (sources.length > 0) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              // @ts-ignore - Electron specific
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: sources[0].id,
                maxWidth: 1920,
                maxHeight: 1080,
                maxFrameRate: 15,
              },
            },
          })

          await peerConnectionRef.current.addScreenStream(stream)
        }
      } else {
        // Fallback navigateur
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 15 },
          audio: false,
        })
        await peerConnectionRef.current.addScreenStream(stream)
      }
    } catch (error) {
      console.error('Erreur partage écran:', error)
      setState((prev) => ({ ...prev, error: 'Impossible de partager l\'écran' }))
    }
  }, [])

  /**
   * Partager la webcam
   */
  const shareCamera = useCallback(async () => {
    if (!peerConnectionRef.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, frameRate: 15 },
        audio: true,
      })

      setState((prev) => ({ ...prev, localVideoStream: stream }))
      await peerConnectionRef.current.addCameraStream(stream)
    } catch (error) {
      console.error('Erreur webcam:', error)
      // Pas critique, on continue sans webcam
    }
  }, [])

  /**
   * Envoyer un événement de contrôle (côté mentor)
   */
  const sendClick = useCallback((x: number, y: number) => {
    peerConnectionRef.current?.sendControlEvent({ type: 'click', x, y })
  }, [])

  const sendKey = useCallback((key: string, modifiers?: string[]) => {
    peerConnectionRef.current?.sendControlEvent({ type: 'key', key, modifiers })
  }, [])

  /**
   * Déconnecter
   */
  const disconnect = useCallback(async () => {
    // Arrêter les streams locaux
    state.localVideoStream?.getTracks().forEach((t) => t.stop())

    // Fermer la connexion peer
    peerConnectionRef.current?.close()
    peerConnectionRef.current = null

    // Déconnecter du signaling
    await signalingRef.current?.disconnect()
    signalingRef.current = null

    setState({
      isConnected: false,
      connectionState: 'disconnected',
      availablePeers: [],
      connectedPeer: null,
      remoteScreenStream: null,
      remoteVideoStream: null,
      localVideoStream: null,
      error: null,
    })
  }, [state.localVideoStream])

  // Se connecter automatiquement au montage
  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, []) // Intentionnellement vide pour ne s'exécuter qu'une fois

  return {
    ...state,
    role,
    connect,
    disconnect,
    connectToPeer,
    sendClick,
    sendKey,
  }
}

