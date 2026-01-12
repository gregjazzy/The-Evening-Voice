const { app, BrowserWindow, ipcMain, desktopCapturer, screen, systemPreferences, session } = require('electron')
const path = require('path')
const { exec } = require('child_process')

// Garder une référence globale de la fenêtre
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
      // Permissions pour WebRTC
      webSecurity: true,
    },
  })

  // Gérer les permissions (caméra, micro, écran)
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'mediaKeySystem', 'geolocation', 'notifications', 'fullscreen']
    if (allowedPermissions.includes(permission)) {
      callback(true)
    } else {
      callback(false)
    }
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

  // En dev, charger localhost
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    // En production, charger le build Next.js
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Vérifier les permissions d'accessibilité (nécessaire pour le contrôle)
async function checkAccessibilityPermissions() {
  if (process.platform === 'darwin') {
    const trusted = systemPreferences.isTrustedAccessibilityClient(false)
    if (!trusted) {
      // Demander la permission
      systemPreferences.isTrustedAccessibilityClient(true)
      return false
    }
    return true
  }
  return true
}

// Vérifier les permissions de capture d'écran
async function checkScreenCapturePermissions() {
  if (process.platform === 'darwin') {
    const status = systemPreferences.getMediaAccessStatus('screen')
    return status === 'granted'
  }
  return true
}

// Capturer l'écran (méthode alternative pour le contrôle)
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

// Simuler un clic souris via AppleScript
function simulateClick(x, y) {
  // Utiliser cliclick si disponible, sinon AppleScript
  exec(`cliclick c:${Math.round(x)},${Math.round(y)}`, (error) => {
    if (error) {
      // Fallback: AppleScript via Python
      const pythonScript = `
from Quartz.CoreGraphics import *
import time

def click(x, y):
    event = CGEventCreateMouseEvent(None, kCGEventLeftMouseDown, (x, y), kCGMouseButtonLeft)
    CGEventPost(kCGHIDEventTap, event)
    time.sleep(0.05)
    event = CGEventCreateMouseEvent(None, kCGEventLeftMouseUp, (x, y), kCGMouseButtonLeft)
    CGEventPost(kCGHIDEventTap, event)

click(${Math.round(x)}, ${Math.round(y)})
`
      exec(`python3 -c "${pythonScript}"`, (err) => {
        if (err) console.error('Click error:', err)
      })
    }
  })
}

// Simuler une frappe clavier via AppleScript
function simulateKeypress(key, modifiers = []) {
  let modifierStr = ''
  if (modifiers.includes('cmd')) modifierStr += 'command down, '
  if (modifiers.includes('shift')) modifierStr += 'shift down, '
  if (modifiers.includes('alt')) modifierStr += 'option down, '
  if (modifiers.includes('ctrl')) modifierStr += 'control down, '
  
  modifierStr = modifierStr.slice(0, -2) // Enlever la dernière virgule
  
  // Caractères spéciaux
  const specialKeys = {
    'Enter': 'return',
    'Backspace': 'delete',
    'Tab': 'tab',
    'Escape': 'escape',
    'ArrowUp': 'up arrow',
    'ArrowDown': 'down arrow',
    'ArrowLeft': 'left arrow',
    'ArrowRight': 'right arrow',
    ' ': 'space',
  }
  
  const keyToPress = specialKeys[key] || key
  
  let script
  if (specialKeys[key]) {
    script = modifierStr 
      ? `tell application "System Events" to key code ${getKeyCode(keyToPress)} using {${modifierStr}}`
      : `tell application "System Events" to key code ${getKeyCode(keyToPress)}`
  } else {
    script = modifierStr 
      ? `tell application "System Events" to keystroke "${key}" using {${modifierStr}}`
      : `tell application "System Events" to keystroke "${key}"`
  }
  
  exec(`osascript -e '${script}'`, (error) => {
    if (error) console.error('Keypress error:', error)
  })
}

// Codes des touches spéciales
function getKeyCode(key) {
  const codes = {
    'return': 36,
    'delete': 51,
    'tab': 48,
    'escape': 53,
    'up arrow': 126,
    'down arrow': 125,
    'left arrow': 123,
    'right arrow': 124,
    'space': 49,
  }
  return codes[key] || 0
}

// IPC Handlers
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

ipcMain.on('simulate-click', (event, { x, y }) => {
  simulateClick(x, y)
})

ipcMain.on('simulate-key', (event, { key, modifiers }) => {
  simulateKeypress(key, modifiers)
})

// ============================================
// TTS - Text to Speech macOS natif
// ============================================

const TTS_VOICES = {
  fr: { voice: 'Audrey (Enhanced)', pitch: '', rate: 200 },  // Plus rapide
  en: { voice: 'Samantha', pitch: '[[pbas 50]]', rate: 185 },
  ru: { voice: 'Milena (Enhanced)', pitch: '', rate: 175 },
}

// Parler avec la voix Luna
ipcMain.handle('tts-speak', async (event, { text, locale }) => {
  const config = TTS_VOICES[locale] || TTS_VOICES.fr
  
  // Nettoyer les emojis et caractères spéciaux
  const cleanText = text
    // Supprimer les emojis
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{1F000}-\u{1F02F}]/gu, '')
    .replace(/[\u{1F0A0}-\u{1F0FF}]/gu, '')
    // Échapper les caractères spéciaux pour shell
    .replace(/'/g, "'\\''")
    .replace(/\n/g, ' ')
    // Nettoyer les espaces multiples
    .replace(/\s+/g, ' ')
    .trim()
  
  if (!cleanText) return true // Ne rien lire si vide
  
  const escapedText = cleanText
  
  // Ajouter le pitch si configuré
  const textWithPitch = config.pitch 
    ? `${config.pitch} ${escapedText}`
    : escapedText
  
  const command = `say -v '${config.voice}' -r ${config.rate} '${textWithPitch}'`
  
  return new Promise((resolve, reject) => {
    exec(command, (error) => {
      if (error) {
        console.error('TTS Error:', error)
        reject(error)
      } else {
        resolve(true)
      }
    })
  })
})

// Arrêter la lecture en cours
ipcMain.handle('tts-stop', async () => {
  return new Promise((resolve) => {
    exec('killall say 2>/dev/null || true', () => {
      resolve(true)
    })
  })
})

// Vérifier si une voix est disponible
ipcMain.handle('tts-check-voice', async (event, voiceName) => {
  return new Promise((resolve) => {
    exec("say -v '?'", (error, stdout) => {
      if (error) {
        resolve(false)
      } else {
        resolve(stdout.includes(voiceName))
      }
    })
  })
})

// App lifecycle
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

// Gérer les événements de certificat pour le développement local
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (url.startsWith('https://localhost')) {
    event.preventDefault()
    callback(true)
  } else {
    callback(false)
  }
})
