const { app, BrowserWindow, ipcMain, desktopCapturer, screen, systemPreferences, session } = require('electron')
const path = require('path')
const { execFile, spawn } = require('child_process')

// ============================================
// SÉCURITÉ - Constantes et validation
// ============================================

// Session de contrôle active (pour valider les commandes)
let activeControlSession = null

// Whitelist des touches autorisées
const ALLOWED_KEYS = new Set([
  // Lettres
  ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  // Chiffres
  ...'0123456789'.split(''),
  // Ponctuation basique (safe)
  '.', ',', '!', '?', '-', '_', ' ',
  // Touches spéciales
  'Enter', 'Backspace', 'Tab', 'Escape',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Delete', 'Home', 'End', 'PageUp', 'PageDown',
])

// Whitelist des modificateurs autorisés
const ALLOWED_MODIFIERS = new Set(['cmd', 'shift', 'alt', 'ctrl'])

// Validation stricte d'un nombre (coordonnées)
function isValidCoordinate(value) {
  return typeof value === 'number' && 
         Number.isFinite(value) && 
         value >= 0 && 
         value <= 10000 // Max raisonnable pour un écran
}

// Validation stricte d'une touche
function isValidKey(key) {
  if (typeof key !== 'string') return false
  if (key.length === 0 || key.length > 20) return false
  return ALLOWED_KEYS.has(key)
}

// Validation des modificateurs
function validateModifiers(modifiers) {
  if (!Array.isArray(modifiers)) return []
  return modifiers.filter(m => typeof m === 'string' && ALLOWED_MODIFIERS.has(m))
}

// Échappement strict pour AppleScript (éviter injection)
function escapeForAppleScript(str) {
  if (typeof str !== 'string') return ''
  // N'autoriser que les caractères alphanumériques de base
  return str.replace(/[^a-zA-Z0-9 ]/g, '')
}

// Échappement strict pour le shell (TTS)
function escapeForShell(str) {
  if (typeof str !== 'string') return ''
  // Supprimer tout ce qui n'est pas alphanumeric, espace, ponctuation basique
  return str
    .replace(/[^\w\s.,!?àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ'-]/g, ' ')
    .replace(/'/g, "'\\''") // Échapper les apostrophes pour shell
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1000) // Limite de longueur
}

// ============================================
// FENÊTRE PRINCIPALE
// ============================================

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
    backgroundColor: '#0f0a1a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
  })

  // Gérer les permissions (caméra, micro, écran)
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'mediaKeySystem', 'geolocation', 'notifications', 'fullscreen']
    callback(allowedPermissions.includes(permission))
  })

  // Gérer la permission de capture d'écran
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      if (sources.length > 0) {
        callback({ video: sources[0], audio: 'loopback' })
      } else {
        callback({})
      }
    })
  })

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ============================================
// PERMISSIONS
// ============================================

async function checkAccessibilityPermissions() {
  if (process.platform === 'darwin') {
    const trusted = systemPreferences.isTrustedAccessibilityClient(false)
    if (!trusted) {
      systemPreferences.isTrustedAccessibilityClient(true)
      return false
    }
    return true
  }
  return true
}

async function checkScreenCapturePermissions() {
  if (process.platform === 'darwin') {
    const status = systemPreferences.getMediaAccessStatus('screen')
    return status === 'granted'
  }
  return true
}

async function captureScreen() {
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 1920, height: 1080 },
  })
  
  if (sources.length > 0) {
    return sources[0].thumbnail.toDataURL()
  }
  return null
}

// ============================================
// CONTRÔLE À DISTANCE SÉCURISÉ
// ============================================

// Simuler un clic souris - VERSION SÉCURISÉE
function simulateClickSecure(x, y) {
  // Validation stricte
  if (!isValidCoordinate(x) || !isValidCoordinate(y)) {
    console.error('❌ Coordonnées invalides rejetées:', { x, y })
    return false
  }

  // Arrondir pour éviter les flottants
  const safeX = Math.round(x)
  const safeY = Math.round(y)

  // Utiliser execFile au lieu de exec (plus sûr - pas d'interprétation shell)
  // Essayer cliclick d'abord
  execFile('cliclick', ['c:' + safeX + ',' + safeY], (error) => {
    if (error) {
      // Fallback : utiliser osascript avec des arguments séparés (pas de concaténation de commande)
      const appleScript = `
        tell application "System Events"
          click at {${safeX}, ${safeY}}
        end tell
      `
      // Utiliser spawn avec arguments séparés pour éviter l'injection
      const child = spawn('osascript', ['-e', appleScript])
      child.on('error', (err) => console.error('Click error:', err))
    }
  })

  return true
}

// Simuler une frappe clavier - VERSION SÉCURISÉE
function simulateKeypressSecure(key, modifiers = []) {
  // Validation stricte de la touche
  if (!isValidKey(key)) {
    console.error('❌ Touche non autorisée rejetée:', key)
    return false
  }

  // Valider et filtrer les modificateurs
  const safeModifiers = validateModifiers(modifiers)
  
  // Construire la commande de modificateurs
  let modifierStr = ''
  if (safeModifiers.includes('cmd')) modifierStr += 'command down, '
  if (safeModifiers.includes('shift')) modifierStr += 'shift down, '
  if (safeModifiers.includes('alt')) modifierStr += 'option down, '
  if (safeModifiers.includes('ctrl')) modifierStr += 'control down, '
  modifierStr = modifierStr.slice(0, -2)
  
  // Mapping des touches spéciales vers les codes
  const KEY_CODES = {
    'Enter': 36, 'Backspace': 51, 'Tab': 48, 'Escape': 53,
    'ArrowUp': 126, 'ArrowDown': 125, 'ArrowLeft': 123, 'ArrowRight': 124,
    'Delete': 117, 'Home': 115, 'End': 119, 'PageUp': 116, 'PageDown': 121,
    ' ': 49,
  }
  
  let appleScript
  const keyCode = KEY_CODES[key]
  
  if (keyCode !== undefined) {
    // Touche spéciale avec code
    appleScript = modifierStr 
      ? `tell application "System Events" to key code ${keyCode} using {${modifierStr}}`
      : `tell application "System Events" to key code ${keyCode}`
  } else {
    // Caractère simple - échapper
    const safeKey = escapeForAppleScript(key)
    if (!safeKey) {
      console.error('❌ Caractère non autorisé après échappement:', key)
      return false
    }
    appleScript = modifierStr 
      ? `tell application "System Events" to keystroke "${safeKey}" using {${modifierStr}}`
      : `tell application "System Events" to keystroke "${safeKey}"`
  }

  // Utiliser spawn avec argument séparé (pas de concaténation shell)
  const child = spawn('osascript', ['-e', appleScript])
  child.on('error', (err) => console.error('Keypress error:', err))
  
  return true
}

// ============================================
// TTS SÉCURISÉ
// ============================================

const TTS_VOICES = {
  fr: { voice: 'Audrey (Enhanced)', rate: 200 },
  en: { voice: 'Samantha', rate: 185 },
  ru: { voice: 'Milena (Enhanced)', rate: 175 },
}

// Liste blanche des voix autorisées
const ALLOWED_VOICES = new Set(Object.values(TTS_VOICES).map(v => v.voice))

async function speakSecure(text, locale) {
  const config = TTS_VOICES[locale] || TTS_VOICES.fr
  
  // Échapper et nettoyer le texte
  const safeText = escapeForShell(text)
  if (!safeText) {
    return true // Texte vide après nettoyage
  }

  // Vérifier que la voix est dans la whitelist
  if (!ALLOWED_VOICES.has(config.voice)) {
    console.error('❌ Voix non autorisée:', config.voice)
    return false
  }

  // Valider le rate (nombre entre 1 et 500)
  const safeRate = Math.min(500, Math.max(1, Math.round(config.rate)))

  return new Promise((resolve, reject) => {
    // Utiliser spawn avec arguments séparés (pas de concaténation shell)
    const child = spawn('say', [
      '-v', config.voice,
      '-r', String(safeRate),
      safeText
    ])
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(true)
      } else {
        reject(new Error(`TTS exited with code ${code}`))
      }
    })
    
    child.on('error', (err) => {
      console.error('TTS Error:', err)
      reject(err)
    })
  })
}

async function stopTTS() {
  return new Promise((resolve) => {
    // Utiliser spawn sans shell
    const child = spawn('killall', ['say'])
    child.on('close', () => resolve(true))
    child.on('error', () => resolve(true)) // Ignorer les erreurs (processus non trouvé)
  })
}

// ============================================
// SESSION DE CONTRÔLE
// ============================================

// Démarrer une session de contrôle (appelé par le renderer quand un mentor se connecte)
ipcMain.handle('start-control-session', (event, { sessionId, mentorId }) => {
  if (typeof sessionId !== 'string' || typeof mentorId !== 'string') {
    return { success: false, error: 'Invalid session data' }
  }
  
  activeControlSession = {
    sessionId: sessionId.slice(0, 100), // Limite de longueur
    mentorId: mentorId.slice(0, 100),
    startedAt: Date.now(),
  }
  
  console.log('✅ Session de contrôle démarrée:', activeControlSession.sessionId)
  return { success: true }
})

// Arrêter la session de contrôle
ipcMain.handle('stop-control-session', () => {
  console.log('🛑 Session de contrôle arrêtée')
  activeControlSession = null
  return { success: true }
})

// Vérifier si une commande de contrôle est autorisée
function isControlAllowed(sessionId) {
  if (!activeControlSession) {
    console.error('❌ Commande rejetée: pas de session active')
    return false
  }
  
  if (activeControlSession.sessionId !== sessionId) {
    console.error('❌ Commande rejetée: session ID invalide')
    return false
  }
  
  // Session expire après 1 heure
  const ONE_HOUR = 60 * 60 * 1000
  if (Date.now() - activeControlSession.startedAt > ONE_HOUR) {
    console.error('❌ Commande rejetée: session expirée')
    activeControlSession = null
    return false
  }
  
  return true
}

// ============================================
// IPC HANDLERS
// ============================================

ipcMain.handle('check-permissions', async () => {
  const accessibility = await checkAccessibilityPermissions()
  const screenCapture = await checkScreenCapturePermissions()
  return { accessibility, screenCapture }
})

ipcMain.handle('capture-screen', captureScreen)

ipcMain.handle('get-screen-size', () => {
  const primaryDisplay = screen.getPrimaryDisplay()
  return primaryDisplay.size
})

ipcMain.handle('get-screen-sources', async () => {
  const sources = await desktopCapturer.getSources({ 
    types: ['screen'],
    thumbnailSize: { width: 320, height: 180 }
  })
  return sources.map(source => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail.toDataURL()
  }))
})

// Clic sécurisé avec validation de session
ipcMain.on('simulate-click', (event, { x, y, sessionId }) => {
  if (!isControlAllowed(sessionId)) return
  simulateClickSecure(x, y)
})

// Touche sécurisée avec validation de session
ipcMain.on('simulate-key', (event, { key, modifiers, sessionId }) => {
  if (!isControlAllowed(sessionId)) return
  simulateKeypressSecure(key, modifiers)
})

// TTS sécurisé
ipcMain.handle('tts-speak', async (event, { text, locale }) => {
  return await speakSecure(text, locale)
})

ipcMain.handle('tts-stop', stopTTS)

ipcMain.handle('tts-check-voice', async (event, voiceName) => {
  // Validation : voiceName doit être dans la whitelist
  if (!ALLOWED_VOICES.has(voiceName)) {
    return false
  }
  
  return new Promise((resolve) => {
    const child = spawn('say', ['-v', '?'])
    let output = ''
    
    child.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    child.on('close', () => {
      resolve(output.includes(voiceName))
    })
    
    child.on('error', () => resolve(false))
  })
})

// ============================================
// APP LIFECYCLE
// ============================================

app.whenReady().then(async () => {
  await checkAccessibilityPermissions()
  createWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (url.startsWith('https://localhost')) {
    event.preventDefault()
    callback(true)
  } else {
    callback(false)
  }
})

console.log('🔒 La Voix du Soir - Electron Main (SÉCURISÉ)')
