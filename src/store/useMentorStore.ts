import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'

export type UserRole = 'mentor' | 'child'

export interface ConnectedUser {
  socketId: string
  name: string
  role: UserRole
}

export interface MentorCursor {
  x: number
  y: number
  visible: boolean
}

export interface Mission {
  id: string
  title: string
  description: string
  completed: boolean
}

interface MentorState {
  // Connexion
  socket: Socket | null
  isConnected: boolean
  sessionId: string | null
  role: UserRole | null
  userName: string

  // Utilisateurs connectés
  connectedUsers: ConnectedUser[]
  
  // Contrôle à distance
  controlActive: boolean
  controlRequested: boolean
  mentorCursor: MentorCursor
  
  // Missions
  activeMission: Mission | null
  
  // Partage d'écran
  screenStream: MediaStream | null
  remoteStream: MediaStream | null
  isScreenSharing: boolean

  // Actions de connexion
  connect: (sessionId: string, role: UserRole, userName: string) => void
  disconnect: () => void

  // Actions de contrôle
  requestControl: () => void
  acceptControl: () => void
  rejectControl: () => void
  releaseControl: () => void

  // Actions d'événements
  sendCursorMove: (x: number, y: number) => void
  sendClick: (target: string, x: number, y: number) => void
  sendKeyboardInput: (target: string, value: string, key: string) => void
  sendModeChange: (mode: string) => void

  // Actions de missions
  sendMission: (mission: Omit<Mission, 'completed'>) => void
  completeMission: () => void

  // Actions de partage d'écran
  startScreenShare: () => Promise<MediaStream | void>
  stopScreenShare: () => void

  // Setters internes
  _setControlActive: (active: boolean) => void
  _setControlRequested: (requested: boolean) => void
  _setMentorCursor: (cursor: Partial<MentorCursor>) => void
  _setActiveMission: (mission: Mission | null) => void
  _addConnectedUser: (user: ConnectedUser) => void
  _removeConnectedUser: (socketId: string) => void
  _setRemoteStream: (stream: MediaStream | null) => void
}

const SIGNALING_URL = process.env.NEXT_PUBLIC_SIGNALING_URL || 'http://localhost:3001'

export const useMentorStore = create<MentorState>((set, get) => ({
  // État initial
  socket: null,
  isConnected: false,
  sessionId: null,
  role: null,
  userName: '',
  connectedUsers: [],
  controlActive: false,
  controlRequested: false,
  mentorCursor: { x: 0, y: 0, visible: false },
  activeMission: null,
  screenStream: null,
  remoteStream: null,
  isScreenSharing: false,

  // === CONNEXION ===
  connect: (sessionId, role, userName) => {
    const socket = io(SIGNALING_URL, {
      transports: ['websocket'],
      autoConnect: true,
    })

    socket.on('connect', () => {
      console.log('🔌 Connecté au serveur de signaling')
      socket.emit('auth:join', { role, sessionId, name: userName })
      
      set({
        socket,
        isConnected: true,
        sessionId,
        role,
        userName,
      })
    })

    socket.on('disconnect', () => {
      console.log('❌ Déconnecté du serveur')
      set({ isConnected: false })
    })

    // Événements de session
    socket.on('mentor:joined', ({ name }) => {
      console.log(`👨‍🏫 Mentor ${name} a rejoint`)
      get()._addConnectedUser({ socketId: 'mentor', name, role: 'mentor' })
    })

    socket.on('mentor:left', () => {
      console.log('👋 Mentor parti')
      get()._removeConnectedUser('mentor')
      set({ controlActive: false, controlRequested: false })
    })

    socket.on('child:joined', ({ socketId, name }) => {
      console.log(`👧 Enfant ${name} a rejoint`)
      get()._addConnectedUser({ socketId, name, role: 'child' })
    })

    socket.on('child:left', ({ name }) => {
      console.log(`👋 Enfant ${name} parti`)
      const users = get().connectedUsers.filter(u => u.name !== name)
      set({ connectedUsers: users })
    })

    // Événements de contrôle
    socket.on('control:request', ({ mentorName }) => {
      console.log(`🎮 ${mentorName} demande le contrôle`)
      set({ controlRequested: true })
    })

    socket.on('control:granted', () => {
      console.log('✅ Contrôle accordé')
      set({ controlActive: true, controlRequested: false })
    })

    socket.on('control:rejected', () => {
      console.log('❌ Contrôle refusé')
      set({ controlRequested: false })
    })

    socket.on('control:released', () => {
      console.log('🔓 Contrôle relâché')
      set({ controlActive: false })
    })

    // Événements de synchronisation
    socket.on('cursor:update', ({ x, y }) => {
      set({ mentorCursor: { x, y, visible: true } })
    })

    socket.on('click:mirror', ({ target, x, y }) => {
      // Exécuter le clic miroir
      const element = document.querySelector(target) as HTMLElement
      if (element) {
        element.click()
      } else {
        // Clic à la position
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
        })
        document.elementFromPoint(x, y)?.dispatchEvent(clickEvent)
      }
    })

    socket.on('keyboard:mirror', ({ target, value, key }) => {
      const element = document.querySelector(target) as HTMLInputElement | HTMLTextAreaElement
      if (element) {
        element.value = value
        element.dispatchEvent(new Event('input', { bubbles: true }))
        if (key === 'Enter') {
          element.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', bubbles: true }))
        }
      }
    })

    socket.on('mode:sync', ({ mode }) => {
      // Import dynamique pour éviter les dépendances circulaires
      import('./useAppStore').then(({ useAppStore }) => {
        useAppStore.getState().setCurrentMode(mode)
      })
    })

    // Missions
    socket.on('mission:receive', ({ missionId, title, description }) => {
      set({
        activeMission: {
          id: missionId,
          title,
          description,
          completed: false,
        },
      })
    })

    // WebRTC Signaling
    socket.on('webrtc:offer', async ({ fromId, offer }) => {
      // Géré par le composant WebRTC
      window.dispatchEvent(new CustomEvent('webrtc:offer', { 
        detail: { fromId, offer } 
      }))
    })

    socket.on('webrtc:answer', ({ fromId, answer }) => {
      window.dispatchEvent(new CustomEvent('webrtc:answer', { 
        detail: { fromId, answer } 
      }))
    })

    socket.on('webrtc:ice-candidate', ({ fromId, candidate }) => {
      window.dispatchEvent(new CustomEvent('webrtc:ice-candidate', { 
        detail: { fromId, candidate } 
      }))
    })
  },

  disconnect: () => {
    const { socket, screenStream } = get()
    
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop())
    }
    
    socket?.disconnect()
    
    set({
      socket: null,
      isConnected: false,
      sessionId: null,
      role: null,
      connectedUsers: [],
      controlActive: false,
      controlRequested: false,
      screenStream: null,
      remoteStream: null,
      isScreenSharing: false,
    })
  },

  // === CONTRÔLE ===
  requestControl: () => {
    const { socket, role } = get()
    if (socket && role === 'mentor') {
      socket.emit('control:request')
    }
  },

  acceptControl: () => {
    const { socket, role } = get()
    if (socket && role === 'child') {
      socket.emit('control:accept')
    }
  },

  rejectControl: () => {
    const { socket, role } = get()
    if (socket && role === 'child') {
      socket.emit('control:reject')
      set({ controlRequested: false })
    }
  },

  releaseControl: () => {
    const { socket, role } = get()
    if (socket && role === 'mentor') {
      socket.emit('control:release')
    }
  },

  // === ÉVÉNEMENTS ===
  sendCursorMove: (x, y) => {
    const { socket, controlActive, role } = get()
    if (socket && controlActive && role === 'mentor') {
      socket.emit('cursor:move', { x, y })
    }
  },

  sendClick: (target, x, y) => {
    const { socket, controlActive, role } = get()
    if (socket && controlActive && role === 'mentor') {
      socket.emit('click:execute', { target, x, y })
    }
  },

  sendKeyboardInput: (target, value, key) => {
    const { socket, controlActive, role } = get()
    if (socket && controlActive && role === 'mentor') {
      socket.emit('keyboard:input', { target, value, key })
    }
  },

  sendModeChange: (mode) => {
    const { socket, controlActive, role } = get()
    if (socket && controlActive && role === 'mentor') {
      socket.emit('mode:change', { mode })
    }
  },

  // === MISSIONS ===
  sendMission: (mission) => {
    const { socket, role } = get()
    if (socket && role === 'mentor') {
      socket.emit('mission:send', {
        missionId: mission.id,
        title: mission.title,
        description: mission.description,
      })
    }
  },

  completeMission: () => {
    set({ activeMission: null })
  },

  // === PARTAGE D'ÉCRAN ===
  startScreenShare: async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      })

      set({ screenStream: stream, isScreenSharing: true })

      // Arrêter quand l'utilisateur arrête le partage
      stream.getVideoTracks()[0].onended = () => {
        get().stopScreenShare()
      }

      return stream
    } catch (error) {
      console.error('Erreur partage d\'écran:', error)
      throw error
    }
  },

  stopScreenShare: () => {
    const { screenStream } = get()
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop())
    }
    set({ screenStream: null, isScreenSharing: false })
  },

  // === SETTERS INTERNES ===
  _setControlActive: (active) => set({ controlActive: active }),
  _setControlRequested: (requested) => set({ controlRequested: requested }),
  _setMentorCursor: (cursor) => set((state) => ({
    mentorCursor: { ...state.mentorCursor, ...cursor },
  })),
  _setActiveMission: (mission) => set({ activeMission: mission }),
  _addConnectedUser: (user) => set((state) => ({
    connectedUsers: [...state.connectedUsers.filter(u => u.socketId !== user.socketId), user],
  })),
  _removeConnectedUser: (socketId) => set((state) => ({
    connectedUsers: state.connectedUsers.filter(u => u.socketId !== socketId),
  })),
  _setRemoteStream: (stream) => set({ remoteStream: stream }),
}))

