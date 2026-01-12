'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import SimplePeer from 'simple-peer'
import { useMentorStore } from '@/store/useMentorStore'

interface PeerConnection {
  peerId: string
  peer: SimplePeer.Instance
}

export function useWebRTC() {
  const { socket, role, screenStream, _setRemoteStream } = useMentorStore()
  const peersRef = useRef<PeerConnection[]>([])
  const [peers, setPeers] = useState<PeerConnection[]>([])

  // Créer un peer pour initier la connexion
  const createPeer = useCallback((targetId: string, stream?: MediaStream) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      },
    })

    peer.on('signal', (signal) => {
      socket?.emit('webrtc:offer', {
        targetId,
        offer: signal,
      })
    })

    peer.on('stream', (remoteStream) => {
      console.log('📺 Stream reçu du peer')
      _setRemoteStream(remoteStream)
    })

    peer.on('error', (err) => {
      console.error('Erreur WebRTC:', err)
    })

    return peer
  }, [socket, _setRemoteStream])

  // Créer un peer pour répondre à une connexion
  const addPeer = useCallback((incomingSignal: SimplePeer.SignalData, callerId: string, stream?: MediaStream) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      },
    })

    peer.on('signal', (signal) => {
      socket?.emit('webrtc:answer', {
        targetId: callerId,
        answer: signal,
      })
    })

    peer.on('stream', (remoteStream) => {
      console.log('📺 Stream reçu du peer')
      _setRemoteStream(remoteStream)
    })

    peer.signal(incomingSignal)

    return peer
  }, [socket, _setRemoteStream])

  // Initier la connexion vers un peer
  const initiateConnection = useCallback((targetId: string) => {
    const stream = screenStream || undefined
    const peer = createPeer(targetId, stream)
    
    peersRef.current.push({ peerId: targetId, peer })
    setPeers([...peersRef.current])
  }, [createPeer, screenStream])

  // Gérer les événements WebRTC
  useEffect(() => {
    const handleOffer = (event: CustomEvent) => {
      const { fromId, offer } = event.detail
      console.log('📡 Offer reçue de', fromId)
      
      const stream = screenStream || undefined
      const peer = addPeer(offer, fromId, stream)
      
      peersRef.current.push({ peerId: fromId, peer })
      setPeers([...peersRef.current])
    }

    const handleAnswer = (event: CustomEvent) => {
      const { fromId, answer } = event.detail
      console.log('📡 Answer reçue de', fromId)
      
      const peerObj = peersRef.current.find(p => p.peerId === fromId)
      peerObj?.peer.signal(answer)
    }

    const handleIceCandidate = (event: CustomEvent) => {
      const { fromId, candidate } = event.detail
      const peerObj = peersRef.current.find(p => p.peerId === fromId)
      if (peerObj && candidate) {
        peerObj.peer.signal(candidate)
      }
    }

    window.addEventListener('webrtc:offer', handleOffer as EventListener)
    window.addEventListener('webrtc:answer', handleAnswer as EventListener)
    window.addEventListener('webrtc:ice-candidate', handleIceCandidate as EventListener)

    return () => {
      window.removeEventListener('webrtc:offer', handleOffer as EventListener)
      window.removeEventListener('webrtc:answer', handleAnswer as EventListener)
      window.removeEventListener('webrtc:ice-candidate', handleIceCandidate as EventListener)
    }
  }, [addPeer, screenStream])

  // Nettoyer les connexions
  const cleanup = useCallback(() => {
    peersRef.current.forEach(({ peer }) => {
      peer.destroy()
    })
    peersRef.current = []
    setPeers([])
    _setRemoteStream(null)
  }, [_setRemoteStream])

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    peers,
    initiateConnection,
    cleanup,
  }
}

