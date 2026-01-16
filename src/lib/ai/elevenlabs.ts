/**
 * Service ElevenLabs - Génération de voix/narration
 * Pour lire les histoires avec des voix magiques
 * 
 * IMPORTANT: 
 * - Les Voice IDs sont configurables via variables d'environnement
 * - Si ElevenLabs échoue, fallback sur Apple Voice (TTS système)
 */

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

// Voix disponibles pour la narration des histoires
// Les IDs sont lus depuis les variables d'environnement pour faciliter les changements
export const AVAILABLE_VOICES = {
  narrator: {
    id: process.env.ELEVENLABS_VOICE_NARRATOR || 'EXAVITQu4vr4xnSDxMaL',
    name: 'Conteur',
    description: 'Voix de conte de fées',
    emoji: '📖',
  },
  fairy: {
    id: process.env.ELEVENLABS_VOICE_FAIRY || 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Fée',
    description: 'Voix légère et féerique',
    emoji: '🧚',
  },
  dragon: {
    id: process.env.ELEVENLABS_VOICE_DRAGON || 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Dragon',
    description: 'Voix grave et amicale',
    emoji: '🐉',
  },
  default: {
    id: process.env.ELEVENLABS_VOICE_DEFAULT || 'pNInz6obpgDQGcFmaJgB',
    name: 'Narrateur par défaut',
    description: 'Voix douce et engageante',
    emoji: '✨',
  },
}

// Legacy: Garder ai_friend comme alias de default
export const VOICE_AI_FRIEND = AVAILABLE_VOICES.default

export type VoiceType = keyof typeof AVAILABLE_VOICES

interface GenerateVoiceParams {
  text: string
  voiceType?: VoiceType
  voiceId?: string
  stability?: number
  similarityBoost?: number
  style?: number
  speakerBoost?: boolean
}

interface GenerateVoiceResponse {
  audioUrl: string
  audioBlob: Blob
  duration?: number
  source: 'elevenlabs' | 'apple_fallback'
}

/**
 * Génère un fichier audio à partir du texte via ElevenLabs
 * @throws Error si ElevenLabs échoue (utiliser generateNarrationWithFallback pour le fallback)
 */
export async function generateVoice(params: GenerateVoiceParams): Promise<GenerateVoiceResponse> {
  const {
    text,
    voiceType = 'default',
    voiceId,
    stability = 0.5,
    similarityBoost = 0.75,
    style = 0.5,
    speakerBoost = true,
  } = params

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error('Clé API ElevenLabs non configurée')
  }

  const selectedVoiceId = voiceId || AVAILABLE_VOICES[voiceType].id

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${selectedVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
          use_speaker_boost: speakerBoost,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Erreur ElevenLabs: ${error.detail?.message || response.statusText}`)
    }

    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)

    return {
      audioUrl,
      audioBlob,
      source: 'elevenlabs',
    }
  } catch (error) {
    console.error('Erreur génération voix ElevenLabs:', error)
    throw error
  }
}

/**
 * Vérifie si ElevenLabs est configuré et disponible
 */
export function isElevenLabsAvailable(): boolean {
  return !!process.env.ELEVENLABS_API_KEY
}

/**
 * Génère la narration d'une page complète (ElevenLabs uniquement)
 */
export async function generatePageNarration(
  pageText: string,
  voiceType: VoiceType = 'narrator'
): Promise<GenerateVoiceResponse> {
  // Nettoyer le texte pour la lecture
  const cleanedText = pageText
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim()

  return generateVoice({
    text: cleanedText,
    voiceType,
    stability: 0.6, // Plus stable pour la narration
    similarityBoost: 0.8,
    style: 0.4, // Style modéré pour le conte
  })
}

/**
 * Génère une réponse vocale (deprecated - utiliser Apple Voice pour l'IA-Amie)
 * @deprecated Utiliser useTTS() pour l'IA-Amie (Apple Voice, instantané)
 */
export async function generateAIFriendVoice(text: string): Promise<GenerateVoiceResponse> {
  console.warn('generateAIFriendVoice est deprecated. Utiliser useTTS() pour l\'IA-Amie.')
  return generateVoice({
    text,
    voiceType: 'default',
    stability: 0.4,
    similarityBoost: 0.7,
    style: 0.7,
    speakerBoost: true,
  })
}

// Legacy alias pour rétrocompatibilité
export const generateLunaVoice = generateAIFriendVoice

/**
 * Estime la durée de l'audio (approximatif)
 */
export function estimateAudioDuration(text: string): number {
  // En moyenne, 150 mots par minute pour la narration
  const words = text.split(/\s+/).length
  return Math.ceil((words / 150) * 60) // en secondes
}

/**
 * Récupère les voix disponibles
 */
export async function getAvailableVoices(): Promise<typeof AVAILABLE_VOICES> {
  return AVAILABLE_VOICES
}

/**
 * Vérifie le quota restant
 */
export async function checkQuota(): Promise<{ charactersRemaining: number; tier: string }> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error('Clé API ElevenLabs non configurée')
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/user/subscription`, {
      headers: {
        'xi-api-key': apiKey,
      },
    })

    if (!response.ok) {
      throw new Error('Erreur récupération quota')
    }

    const data = await response.json()
    return {
      charactersRemaining: data.character_limit - data.character_count,
      tier: data.tier,
    }
  } catch (error) {
    console.error('Erreur vérification quota:', error)
    return { charactersRemaining: 0, tier: 'unknown' }
  }
}

// ============================================================================
// NARRATION AVEC FALLBACK APPLE VOICE
// ============================================================================

export interface NarrationResult {
  /** URL de l'audio généré (blob URL ou null si Apple Voice) */
  audioUrl: string | null
  /** Blob audio (si ElevenLabs) */
  audioBlob: Blob | null
  /** Source de la voix utilisée */
  source: 'elevenlabs' | 'apple_fallback'
  /** Texte à lire (pour Apple Voice fallback) */
  text: string
  /** Type de voix utilisé */
  voiceType: VoiceType
  /** Durée estimée en secondes */
  estimatedDuration: number
}

/**
 * Génère la narration d'une histoire avec fallback automatique sur Apple Voice
 * 
 * - Essaie d'abord ElevenLabs (qualité premium)
 * - Si échec (pas de clé API, erreur réseau, etc.) → Apple Voice
 * 
 * @param text Le texte à narrer
 * @param voiceType Le type de voix ElevenLabs souhaité
 * @returns NarrationResult avec audioUrl ou instructions pour Apple Voice
 */
export async function generateNarrationWithFallback(
  text: string,
  voiceType: VoiceType = 'narrator'
): Promise<NarrationResult> {
  // Nettoyer le texte
  const cleanedText = text
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim()

  const estimatedDuration = estimateAudioDuration(cleanedText)

  // Essayer ElevenLabs si disponible
  if (isElevenLabsAvailable()) {
    try {
      const result = await generatePageNarration(cleanedText, voiceType)
      return {
        audioUrl: result.audioUrl,
        audioBlob: result.audioBlob,
        source: 'elevenlabs',
        text: cleanedText,
        voiceType,
        estimatedDuration,
      }
    } catch (error) {
      console.warn('ElevenLabs a échoué, fallback sur Apple Voice:', error)
      // Continue vers le fallback
    }
  }

  // Fallback : Apple Voice (TTS système)
  // On retourne les infos nécessaires pour que le client utilise useTTS()
  console.log('Utilisation du fallback Apple Voice pour la narration')
  return {
    audioUrl: null,
    audioBlob: null,
    source: 'apple_fallback',
    text: cleanedText,
    voiceType,
    estimatedDuration,
  }
}

/**
 * Liste des voix disponibles pour la narration (pour l'UI)
 */
export function getNarrationVoices(): Array<{
  id: VoiceType
  name: string
  description: string
  emoji: string
}> {
  return Object.entries(AVAILABLE_VOICES).map(([id, voice]) => ({
    id: id as VoiceType,
    name: voice.name,
    description: voice.description,
    emoji: voice.emoji,
  }))
}

