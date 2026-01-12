/**
 * Hook React pour la synchronisation temps réel
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { RealtimeSync, type RealtimeEvent, type CursorPosition } from '@/lib/supabase/realtime'
import { useAppStore } from '@/store/useAppStore'

interface UseRealtimeSyncOptions {
  sessionCode: string
  userId: string
  userName: string
  onCursorMove?: (cursor: CursorPosition) => void
  onModeChange?: (mode: string) => void
  onControlRequest?: (fromUserId: string) => void
}

interface UseRealtimeSyncReturn {
  isConnected: boolean
  otherCursors: CursorPosition[]
  presences: Record<string, any>
  sendCursor: (x: number, y: number) => void
  sendModeChange: (mode: string) => void
  sendEvent: (type: RealtimeEvent['type'], payload: any) => void
  disconnect: () => void
}

export function useRealtimeSync(options: UseRealtimeSyncOptions): UseRealtimeSyncReturn {
  const { sessionCode, userId, userName, onCursorMove, onModeChange, onControlRequest } = options
  const { setCurrentMode } = useAppStore()
  
  const [isConnected, setIsConnected] = useState(false)
  const [otherCursors, setOtherCursors] = useState<CursorPosition[]>([])
  const [presences, setPresences] = useState<Record<string, any>>({})
  
  const syncRef = useRef<RealtimeSync | null>(null)
  const cursorTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({})

  // Connexion au canal temps réel
  useEffect(() => {
    if (!sessionCode || !userId) return

    const sync = new RealtimeSync(sessionCode, userId, userName)
    syncRef.current = sync

    sync.connect({
      onPageUpdate: (page) => {
        console.log('Page mise à jour:', page)
        // Les stores se mettront à jour automatiquement
      },
      
      onSessionUpdate: (session) => {
        console.log('Session mise à jour:', session)
        // Gérer les changements de contrôle
      },
      
      onCursorMove: (cursor) => {
        if (cursor.userId !== userId) {
          // Mettre à jour le curseur de cet utilisateur
          setOtherCursors(prev => {
            const filtered = prev.filter(c => c.userId !== cursor.userId)
            return [...filtered, cursor]
          })
          
          // Supprimer le curseur après 3 secondes d'inactivité
          if (cursorTimeoutRef.current[cursor.userId]) {
            clearTimeout(cursorTimeoutRef.current[cursor.userId])
          }
          cursorTimeoutRef.current[cursor.userId] = setTimeout(() => {
            setOtherCursors(prev => prev.filter(c => c.userId !== cursor.userId))
          }, 3000)
          
          onCursorMove?.(cursor)
        }
      },
      
      onEvent: (event) => {
        switch (event.type) {
          case 'mode_change':
            if (event.senderId !== userId) {
              setCurrentMode(event.payload.mode)
              onModeChange?.(event.payload.mode)
            }
            break
          case 'control_request':
            if (event.payload.targetUserId === userId) {
              onControlRequest?.(event.senderId)
            }
            break
        }
      },
    }).then(() => {
      setIsConnected(true)
      // Mettre à jour les présences
      setPresences(sync.getPresences())
    })

    return () => {
      sync.disconnect()
      setIsConnected(false)
    }
  }, [sessionCode, userId, userName, setCurrentMode, onCursorMove, onModeChange, onControlRequest])

  // Envoyer la position du curseur
  const sendCursor = useCallback((x: number, y: number) => {
    syncRef.current?.sendCursorPosition(x, y)
  }, [])

  // Envoyer un changement de mode
  const sendModeChange = useCallback((mode: string) => {
    syncRef.current?.sendModeChange(mode)
  }, [])

  // Envoyer un événement personnalisé
  const sendEvent = useCallback((type: RealtimeEvent['type'], payload: any) => {
    syncRef.current?.sendEvent(type, payload)
  }, [])

  // Déconnexion
  const disconnect = useCallback(() => {
    syncRef.current?.disconnect()
    setIsConnected(false)
  }, [])

  return {
    isConnected,
    otherCursors,
    presences,
    sendCursor,
    sendModeChange,
    sendEvent,
    disconnect,
  }
}

