const { contextBridge, ipcRenderer } = require('electron')

// Exposer des APIs sécurisées au renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Vérifier les permissions d'accessibilité et capture d'écran
  checkPermissions: () => ipcRenderer.invoke('check-permissions'),
  
  // Capturer l'écran (pour le contrôle à distance)
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  
  // Obtenir la taille de l'écran
  getScreenSize: () => ipcRenderer.invoke('get-screen-size'),
  
  // Obtenir les sources d'écran pour WebRTC
  getScreenSources: () => ipcRenderer.invoke('get-screen-sources'),
  
  // Simuler un clic (utilisé par le mentor sur l'écran de l'enfant)
  simulateClick: (x, y) => ipcRenderer.send('simulate-click', { x, y }),
  
  // Simuler une touche
  simulateKey: (key, modifiers) => ipcRenderer.send('simulate-key', { key, modifiers }),
  
  // Vérifier si on est dans Electron
  isElectron: true,
  
  // Obtenir la plateforme
  platform: process.platform,
  
  // TTS - Text to Speech (voix Luna)
  tts: {
    speak: (text, locale = 'fr') => ipcRenderer.invoke('tts-speak', { text, locale }),
    stop: () => ipcRenderer.invoke('tts-stop'),
    checkVoice: (voiceName) => ipcRenderer.invoke('tts-check-voice', voiceName),
  },
})

// Exposer l'API de capture d'écran pour WebRTC
contextBridge.exposeInMainWorld('desktopCapturer', {
  getSources: async (options) => {
    return await ipcRenderer.invoke('get-screen-sources')
  },
})

console.log('🚀 La Voix du Soir - Electron Preload chargé')
console.log('   Mode Bureau avec contrôle à distance activé')
