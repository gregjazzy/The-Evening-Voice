const { contextBridge, ipcRenderer } = require('electron')

// ============================================
// SÉCURITÉ - Session de contrôle
// ============================================

// ID de session actif (défini quand le mentor se connecte)
let currentSessionId = null

// ============================================
// APIs EXPOSÉES AU RENDERER
// ============================================

contextBridge.exposeInMainWorld('electronAPI', {
  // === PERMISSIONS ===
  checkPermissions: () => ipcRenderer.invoke('check-permissions'),
  
  // === CAPTURE D'ÉCRAN ===
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  getScreenSize: () => ipcRenderer.invoke('get-screen-size'),
  getScreenSources: () => ipcRenderer.invoke('get-screen-sources'),
  
  // === CONTRÔLE À DISTANCE (SÉCURISÉ) ===
  
  // Démarrer une session de contrôle (appelé quand un mentor se connecte)
  startControlSession: (sessionId, mentorId) => {
    if (typeof sessionId !== 'string' || typeof mentorId !== 'string') {
      console.error('❌ Session invalide')
      return Promise.resolve({ success: false })
    }
    currentSessionId = sessionId
    return ipcRenderer.invoke('start-control-session', { sessionId, mentorId })
  },
  
  // Arrêter la session de contrôle
  stopControlSession: () => {
    currentSessionId = null
    return ipcRenderer.invoke('stop-control-session')
  },
  
  // Simuler un clic (avec validation de session)
  simulateClick: (x, y) => {
    if (!currentSessionId) {
      console.error('❌ Clic rejeté: pas de session de contrôle active')
      return
    }
    ipcRenderer.send('simulate-click', { x, y, sessionId: currentSessionId })
  },
  
  // Simuler une touche (avec validation de session)
  simulateKey: (key, modifiers) => {
    if (!currentSessionId) {
      console.error('❌ Touche rejetée: pas de session de contrôle active')
      return
    }
    ipcRenderer.send('simulate-key', { key, modifiers, sessionId: currentSessionId })
  },
  
  // Vérifier si une session de contrôle est active
  hasActiveControlSession: () => currentSessionId !== null,
  
  // === INFOS SYSTÈME ===
  isElectron: true,
  platform: process.platform,
  
  // === TTS (Text to Speech) ===
  tts: {
    speak: (text, locale = 'fr') => ipcRenderer.invoke('tts-speak', { text, locale }),
    stop: () => ipcRenderer.invoke('tts-stop'),
    checkVoice: (voiceName) => ipcRenderer.invoke('tts-check-voice', voiceName),
  },
})

// API pour WebRTC
contextBridge.exposeInMainWorld('desktopCapturer', {
  getSources: async (options) => {
    return await ipcRenderer.invoke('get-screen-sources')
  },
})

console.log('🔒 La Voix du Soir - Electron Preload (SÉCURISÉ)')
console.log('   Contrôle à distance avec validation de session')
