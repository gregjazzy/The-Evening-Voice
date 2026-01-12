/**
 * Serveur de Signaling WebSocket pour "La Voix du Soir"
 * Gère la connexion entre Mentor et Enfants via Socket.io
 */

const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
  },
});

// État des sessions
const sessions = new Map(); // sessionId -> { mentor, children, state }
const users = new Map(); // socketId -> { role, sessionId, name }

io.on('connection', (socket) => {
  console.log(`🔌 Nouvelle connexion: ${socket.id}`);

  // === AUTHENTIFICATION ===
  socket.on('auth:join', ({ role, sessionId, name }) => {
    console.log(`👤 ${name} rejoint en tant que ${role} (session: ${sessionId})`);
    
    users.set(socket.id, { role, sessionId, name });
    socket.join(sessionId);

    // Initialiser ou rejoindre la session
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        mentor: null,
        children: [],
        state: {
          currentMode: 'diary',
          controlActive: false,
          mentorCursor: { x: 0, y: 0 },
        },
      });
    }

    const session = sessions.get(sessionId);

    if (role === 'mentor') {
      session.mentor = socket.id;
      // Notifier les enfants
      socket.to(sessionId).emit('mentor:joined', { name });
    } else {
      session.children.push(socket.id);
      // Notifier le mentor
      if (session.mentor) {
        io.to(session.mentor).emit('child:joined', { 
          socketId: socket.id, 
          name 
        });
      }
    }

    // Envoyer l'état actuel au nouvel arrivant
    socket.emit('session:state', session.state);
  });

  // === DEMANDE DE CONTRÔLE ===
  socket.on('control:request', () => {
    const user = users.get(socket.id);
    if (!user || user.role !== 'mentor') return;

    const session = sessions.get(user.sessionId);
    if (!session) return;

    console.log(`🎮 Mentor demande le contrôle (session: ${user.sessionId})`);
    
    // Envoyer la demande aux enfants
    session.children.forEach((childId) => {
      io.to(childId).emit('control:request', {
        mentorName: user.name,
      });
    });
  });

  socket.on('control:accept', () => {
    const user = users.get(socket.id);
    if (!user || user.role !== 'child') return;

    const session = sessions.get(user.sessionId);
    if (!session) return;

    console.log(`✅ Enfant ${user.name} accepte le contrôle`);
    
    session.state.controlActive = true;
    
    // Notifier tout le monde
    io.to(user.sessionId).emit('control:granted', {
      childName: user.name,
    });
  });

  socket.on('control:reject', () => {
    const user = users.get(socket.id);
    if (!user) return;

    const session = sessions.get(user.sessionId);
    if (!session) return;

    console.log(`❌ Enfant ${user.name} refuse le contrôle`);
    
    if (session.mentor) {
      io.to(session.mentor).emit('control:rejected', {
        childName: user.name,
      });
    }
  });

  socket.on('control:release', () => {
    const user = users.get(socket.id);
    if (!user || user.role !== 'mentor') return;

    const session = sessions.get(user.sessionId);
    if (!session) return;

    console.log(`🔓 Mentor relâche le contrôle`);
    
    session.state.controlActive = false;
    io.to(user.sessionId).emit('control:released');
  });

  // === SYNCHRONISATION D'ÉVÉNEMENTS ===
  
  // Mouvement du curseur mentor
  socket.on('cursor:move', ({ x, y }) => {
    const user = users.get(socket.id);
    if (!user || user.role !== 'mentor') return;

    const session = sessions.get(user.sessionId);
    if (!session || !session.state.controlActive) return;

    session.state.mentorCursor = { x, y };
    socket.to(user.sessionId).emit('cursor:update', { x, y });
  });

  // Clic du mentor
  socket.on('click:execute', ({ target, x, y }) => {
    const user = users.get(socket.id);
    if (!user || user.role !== 'mentor') return;

    const session = sessions.get(user.sessionId);
    if (!session || !session.state.controlActive) return;

    console.log(`🖱️ Mentor clique sur ${target} (${x}, ${y})`);
    socket.to(user.sessionId).emit('click:mirror', { target, x, y });
  });

  // Saisie clavier du mentor
  socket.on('keyboard:input', ({ target, value, key }) => {
    const user = users.get(socket.id);
    if (!user || user.role !== 'mentor') return;

    const session = sessions.get(user.sessionId);
    if (!session || !session.state.controlActive) return;

    socket.to(user.sessionId).emit('keyboard:mirror', { target, value, key });
  });

  // Changement de mode (Diary, Book, Studio, etc.)
  socket.on('mode:change', ({ mode }) => {
    const user = users.get(socket.id);
    if (!user || user.role !== 'mentor') return;

    const session = sessions.get(user.sessionId);
    if (!session || !session.state.controlActive) return;

    console.log(`📱 Mentor change vers le mode: ${mode}`);
    session.state.currentMode = mode;
    socket.to(user.sessionId).emit('mode:sync', { mode });
  });

  // Synchronisation de l'état complet du projet
  socket.on('state:sync', ({ state }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const session = sessions.get(user.sessionId);
    if (!session) return;

    // Merge l'état
    session.state = { ...session.state, ...state };
    socket.to(user.sessionId).emit('state:update', state);
  });

  // === WEBRTC SIGNALING ===
  
  socket.on('webrtc:offer', ({ targetId, offer }) => {
    console.log(`📡 WebRTC offer de ${socket.id} vers ${targetId}`);
    io.to(targetId).emit('webrtc:offer', {
      fromId: socket.id,
      offer,
    });
  });

  socket.on('webrtc:answer', ({ targetId, answer }) => {
    console.log(`📡 WebRTC answer de ${socket.id} vers ${targetId}`);
    io.to(targetId).emit('webrtc:answer', {
      fromId: socket.id,
      answer,
    });
  });

  socket.on('webrtc:ice-candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('webrtc:ice-candidate', {
      fromId: socket.id,
      candidate,
    });
  });

  // === MISSIONS FLASH (Tutoriels) ===
  socket.on('mission:send', ({ missionId, title, description }) => {
    const user = users.get(socket.id);
    if (!user || user.role !== 'mentor') return;

    console.log(`🎯 Mentor envoie mission: ${title}`);
    socket.to(user.sessionId).emit('mission:receive', {
      missionId,
      title,
      description,
    });
  });

  // === DÉCONNEXION ===
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (!user) return;

    console.log(`👋 ${user.name} (${user.role}) déconnecté`);

    const session = sessions.get(user.sessionId);
    if (session) {
      if (user.role === 'mentor') {
        session.mentor = null;
        session.state.controlActive = false;
        io.to(user.sessionId).emit('mentor:left');
      } else {
        session.children = session.children.filter((id) => id !== socket.id);
        if (session.mentor) {
          io.to(session.mentor).emit('child:left', { name: user.name });
        }
      }

      // Nettoyer la session si vide
      if (!session.mentor && session.children.length === 0) {
        sessions.delete(user.sessionId);
      }
    }

    users.delete(socket.id);
  });
});

const PORT = process.env.SIGNALING_PORT || 3001;
server.listen(PORT, () => {
  console.log(`
  ✨ ══════════════════════════════════════════════ ✨
  │                                                  │
  │   🌙 La Voix du Soir - Signaling Server 🌙       │
  │                                                  │
  │   Port: ${PORT}                                     │
  │   Status: En écoute...                           │
  │                                                  │
  ✨ ══════════════════════════════════════════════ ✨
  `);
});

