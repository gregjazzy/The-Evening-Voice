/**
 * Service TTS utilisant les voix natives macOS
 * Gratuit et illimité - pas de latence réseau
 */

// Configuration des voix par langue
export const LUNA_VOICES = {
  fr: {
    voice: 'Audrey (Enhanced)',
    pitch: '', // Pas de modification
    rate: 175, // Vitesse normale
  },
  en: {
    voice: 'Samantha',
    pitch: '[[pbas 50]]', // Plus aigu pour voix enfantine
    rate: 180,
  },
  ru: {
    voice: 'Milena (Enhanced)',
    pitch: '',
    rate: 170,
  },
} as const

export type SupportedLocale = keyof typeof LUNA_VOICES

/**
 * Génère la commande say pour macOS
 */
export function buildSayCommand(text: string, locale: SupportedLocale): string {
  const config = LUNA_VOICES[locale]
  
  // Échapper les caractères spéciaux pour le shell
  const escapedText = text
    .replace(/'/g, "'\\''") // Échapper les apostrophes
    .replace(/"/g, '\\"')   // Échapper les guillemets
  
  // Ajouter le pitch si configuré
  const textWithPitch = config.pitch 
    ? `${config.pitch} ${escapedText}`
    : escapedText
  
  return `say -v '${config.voice}' -r ${config.rate} '${textWithPitch}'`
}

/**
 * Parle le texte via macOS TTS (Electron main process)
 * À appeler depuis le main process d'Electron
 */
export async function speakWithMacOS(
  text: string, 
  locale: SupportedLocale
): Promise<void> {
  // Cette fonction sera appelée via IPC depuis le renderer
  // L'implémentation réelle est dans electron/main.js
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execAsync = promisify(exec)
  
  const command = buildSayCommand(text, locale)
  
  try {
    await execAsync(command)
  } catch (error) {
    console.error('Erreur TTS macOS:', error)
    throw error
  }
}

/**
 * Arrête la lecture en cours
 */
export async function stopSpeaking(): Promise<void> {
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execAsync = promisify(exec)
  
  try {
    // Tue tous les processus 'say' en cours
    await execAsync('killall say 2>/dev/null || true')
  } catch {
    // Ignore les erreurs si aucun processus n'est en cours
  }
}

/**
 * Vérifie si une voix est disponible sur le système
 */
export async function isVoiceAvailable(voiceName: string): Promise<boolean> {
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execAsync = promisify(exec)
  
  try {
    const { stdout } = await execAsync("say -v '?'")
    return stdout.includes(voiceName)
  } catch {
    return false
  }
}

/**
 * Liste toutes les voix disponibles pour une langue
 */
export async function getAvailableVoices(langCode: string): Promise<string[]> {
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execAsync = promisify(exec)
  
  try {
    const { stdout } = await execAsync(`say -v '?' | grep ${langCode}`)
    return stdout
      .split('\n')
      .filter(Boolean)
      .map(line => line.split(/\s+/)[0])
  } catch {
    return []
  }
}

