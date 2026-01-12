/**
 * Service ElevenLabs - Génération de voix/narration
 * Pour lire les histoires avec des voix magiques
 */

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

// Voix disponibles pour les enfants (douces et engageantes)
export const AVAILABLE_VOICES = {
  luna: {
    id: process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB', // Adam (example)
    name: 'Luna',
    description: 'Voix douce et magique de Luna',
  },
  narrator: {
    id: 'EXAVITQu4vr4xnSDxMaL', // Bella (example)
    name: 'Narrateur',
    description: 'Voix de conte de fées',
  },
  fairy: {
    id: 'MF3mGyEYCl7XYWbV9V6O', // Elli (example)
    name: 'Fée',
    description: 'Voix légère et féerique',
  },
  dragon: {
    id: 'TxGEqnHWrfWFTfGW9XjX', // Josh (example)
    name: 'Dragon',
    description: 'Voix grave et amicale',
  },
}

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
}

/**
 * Génère un fichier audio à partir du texte
 */
export async function generateVoice(params: GenerateVoiceParams): Promise<GenerateVoiceResponse> {
  const {
    text,
    voiceType = 'luna',
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
    }
  } catch (error) {
    console.error('Erreur génération voix:', error)
    throw error
  }
}

/**
 * Génère la narration d'une page complète
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
 * Génère une réponse vocale de Luna
 */
export async function generateLunaVoice(text: string): Promise<GenerateVoiceResponse> {
  return generateVoice({
    text,
    voiceType: 'luna',
    stability: 0.4, // Plus expressif
    similarityBoost: 0.7,
    style: 0.7, // Plus de personnalité
    speakerBoost: true,
  })
}

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

