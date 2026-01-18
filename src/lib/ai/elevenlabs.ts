/**
 * Service ElevenLabs - Génération de voix/narration
 * Pour lire les histoires avec des voix magiques
 * 
 * IMPORTANT: 
 * - Les Voice IDs sont configurables via variables d'environnement
 * - Si ElevenLabs échoue, fallback sur Apple Voice (TTS système)
 * - 7 voix par langue (FR, EN, RU) pour la narration des histoires
 */

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

// ============================================
// VOIX ELEVENLABS PAR LANGUE (7 par langue)
// ============================================

export interface ElevenLabsVoice {
  id: string
  name: string
  description: string
  emoji: string
  gender: 'female' | 'male'
  age: 'young' | 'adult' | 'elderly'
  style: 'warm' | 'dramatic' | 'gentle' | 'playful' | 'mysterious'
}

// 🇫🇷 VOIX FRANÇAISES (5 configurées)
export const FRENCH_VOICES: Record<string, ElevenLabsVoice> = {
  // Voix féminines
  narratrice: {
    id: process.env.ELEVENLABS_FR_NARRATOR || 'kwhMCf63M8O3rCfnQ3oQ',
    name: 'La Conteuse',
    description: 'Voix douce et chaleureuse, parfaite pour les contes',
    emoji: '📖',
    gender: 'female',
    age: 'adult',
    style: 'warm',
  },
  jeuneFille: {
    id: process.env.ELEVENLABS_FR_YOUNG_GIRL || 'FvmvwvObRqIHojkEGh5N',
    name: 'Petite Étoile',
    description: 'Voix légère et enjouée de jeune fille',
    emoji: '⭐',
    gender: 'female',
    age: 'young',
    style: 'playful',
  },
  mamie: {
    id: process.env.ELEVENLABS_FR_GRANDMA || 'M9RTtrzRACmbUzsEMq8p',
    name: 'Mamie Rose',
    description: 'Voix bienveillante de grand-mère',
    emoji: '👵',
    gender: 'female',
    age: 'elderly',
    style: 'gentle',
  },
  // Voix masculines
  jeuneGarcon: {
    id: process.env.ELEVENLABS_FR_YOUNG_BOY || '5Qfm4RqcAer0xoyWtoHC',
    name: 'Petit Lucas',
    description: 'Voix enjouée de jeune garçon',
    emoji: '🧒',
    gender: 'male',
    age: 'young',
    style: 'playful',
  },
  papy: {
    id: process.env.ELEVENLABS_FR_GRANDPA || '1wg2wOjdEWKA7yQD8Kca',
    name: 'Papy Marcel',
    description: 'Voix sage et rassurante de grand-père',
    emoji: '👴',
    gender: 'male',
    age: 'elderly',
    style: 'gentle',
  },
}

// 🇬🇧 VOIX ANGLAISES (6 configurées)
export const ENGLISH_VOICES: Record<string, ElevenLabsVoice> = {
  // Female voices
  narrator: {
    id: process.env.ELEVENLABS_EN_NARRATOR || 'RILOU7YmBhvwJGDGjNmP',
    name: 'The Storyteller',
    description: 'Warm and expressive storyteller',
    emoji: '📖',
    gender: 'female',
    age: 'adult',
    style: 'warm',
  },
  youngGirl: {
    id: process.env.ELEVENLABS_EN_YOUNG_GIRL || 'rCmVtv8cYU60uhlsOo1M',
    name: 'Little Star',
    description: 'Light and playful young girl voice',
    emoji: '⭐',
    gender: 'female',
    age: 'young',
    style: 'playful',
  },
  grandma: {
    id: process.env.ELEVENLABS_EN_GRANDMA || 'kkPJzQOWz2Oz9cUaEaQd',
    name: 'Grandma Pearl',
    description: 'Kind and gentle grandmother voice',
    emoji: '👵',
    gender: 'female',
    age: 'elderly',
    style: 'gentle',
  },
  // Male voices
  narratorMale: {
    id: process.env.ELEVENLABS_EN_NARRATOR_MALE || 'G17SuINrv2H9FC6nvetn',
    name: 'The Narrator',
    description: 'Classic narrative voice, captivating',
    emoji: '🎭',
    gender: 'male',
    age: 'adult',
    style: 'dramatic',
  },
  villain: {
    id: process.env.ELEVENLABS_EN_VILLAIN || 'ttNi9wVM8M97tsxE7PFZ',
    name: 'The Villain',
    description: 'Mysterious and dramatic voice',
    emoji: '🦹',
    gender: 'male',
    age: 'adult',
    style: 'mysterious',
  },
  grandpa: {
    id: process.env.ELEVENLABS_EN_GRANDPA || '0lp4RIz96WD1RUtvEu3Q',
    name: 'Grandpa Joe',
    description: 'Wise and reassuring grandfather voice',
    emoji: '👴',
    gender: 'male',
    age: 'elderly',
    style: 'gentle',
  },
}

// 🇷🇺 VOIX RUSSES (4 configurées)
export const RUSSIAN_VOICES: Record<string, ElevenLabsVoice> = {
  // Женские голоса
  narrator: {
    id: process.env.ELEVENLABS_RU_NARRATOR || 'GN4wbsbejSnGSa1AzjH5',
    name: 'Наташа',
    description: 'Тёплый и душевный голос',
    emoji: '📖',
    gender: 'female',
    age: 'adult',
    style: 'warm',
  },
  youngGirl: {
    id: process.env.ELEVENLABS_RU_YOUNG_GIRL || 'EDpEYNf6XIeKYRzYcx4I',
    name: 'Звёздочка',
    description: 'Лёгкий и игривый голос',
    emoji: '⭐',
    gender: 'female',
    age: 'young',
    style: 'playful',
  },
  // Мужские голоса
  narratorMale: {
    id: process.env.ELEVENLABS_RU_NARRATOR_MALE || 're2r5d74PqDzicySNW0I',
    name: 'Сказочник',
    description: 'Классический голос рассказчика',
    emoji: '🎭',
    gender: 'male',
    age: 'adult',
    style: 'dramatic',
  },
  mysterious: {
    id: process.env.ELEVENLABS_RU_MYSTERIOUS || 'wAGzRVkxKEs8La0lmdrE',
    name: 'Колдун',
    description: 'Таинственный и завораживающий',
    emoji: '🧙',
    gender: 'male',
    age: 'adult',
    style: 'mysterious',
  },
}

// Mapping par locale
export const VOICES_BY_LOCALE: Record<string, Record<string, ElevenLabsVoice>> = {
  fr: FRENCH_VOICES,
  en: ENGLISH_VOICES,
  ru: RUSSIAN_VOICES,
}

// Obtenir les voix pour une langue
export function getVoicesForLocale(locale: 'fr' | 'en' | 'ru'): ElevenLabsVoice[] {
  const voices = VOICES_BY_LOCALE[locale] || FRENCH_VOICES
  return Object.values(voices)
}

// Obtenir une voix par ID
export function getVoiceById(voiceId: string, locale: 'fr' | 'en' | 'ru' = 'fr'): ElevenLabsVoice | null {
  const voices = VOICES_BY_LOCALE[locale] || FRENCH_VOICES
  return Object.values(voices).find(v => v.id === voiceId) || null
}

// Obtenir une voix par clé
export function getVoiceByKey(key: string, locale: 'fr' | 'en' | 'ru' = 'fr'): ElevenLabsVoice | null {
  const voices = VOICES_BY_LOCALE[locale] || FRENCH_VOICES
  return voices[key] || null
}

// ============================================
// LEGACY: Ancien format (compatibilité)
// ============================================

export const AVAILABLE_VOICES = {
  narrator: FRENCH_VOICES.conteur,
  fairy: FRENCH_VOICES.fee,
  dragon: FRENCH_VOICES.dragon,
  default: FRENCH_VOICES.amelie,
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
  apiKey?: string // Clé API optionnelle (priorité sur env var)
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
    apiKey: providedApiKey,
  } = params

  const apiKey = providedApiKey || process.env.ELEVENLABS_API_KEY
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
  voiceType: VoiceType = 'narrator',
  apiKey?: string
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
    apiKey,
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
  voiceType: VoiceType = 'narrator',
  apiKey?: string
): Promise<NarrationResult> {
  // Nettoyer le texte
  const cleanedText = text
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim()

  const estimatedDuration = estimateAudioDuration(cleanedText)

  // Essayer ElevenLabs si disponible (avec clé fournie ou env var)
  const hasApiKey = apiKey || process.env.ELEVENLABS_API_KEY
  if (hasApiKey) {
    try {
      const result = await generatePageNarration(cleanedText, voiceType, apiKey)
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

