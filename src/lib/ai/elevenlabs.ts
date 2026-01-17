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

// 🇫🇷 VOIX FRANÇAISES (7)
export const FRENCH_VOICES: Record<string, ElevenLabsVoice> = {
  // Voix féminines
  amelie: {
    id: process.env.ELEVENLABS_FR_AMELIE || 'XrExE9yKIg1WjnnlVkGX',
    name: 'Amélie',
    description: 'Voix douce et chaleureuse, parfaite pour les contes',
    emoji: '🌸',
    gender: 'female',
    age: 'adult',
    style: 'warm',
  },
  fee: {
    id: process.env.ELEVENLABS_FR_FEE || 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Fée Clochette',
    description: 'Voix légère et féerique, pleine de magie',
    emoji: '🧚',
    gender: 'female',
    age: 'young',
    style: 'playful',
  },
  mamie: {
    id: process.env.ELEVENLABS_FR_MAMIE || 'jsCqWAovK2LkecY7zXl4',
    name: 'Mamie Rose',
    description: 'Voix bienveillante de grand-mère',
    emoji: '👵',
    gender: 'female',
    age: 'elderly',
    style: 'gentle',
  },
  // Voix masculines
  conteur: {
    id: process.env.ELEVENLABS_FR_CONTEUR || 'EXAVITQu4vr4xnSDxMaL',
    name: 'Le Conteur',
    description: 'Voix narrative classique, captivante',
    emoji: '📖',
    gender: 'male',
    age: 'adult',
    style: 'dramatic',
  },
  magicien: {
    id: process.env.ELEVENLABS_FR_MAGICIEN || 'VR6AewLTigWG4xSOukaG',
    name: 'Le Magicien',
    description: 'Voix mystérieuse et envoûtante',
    emoji: '🧙',
    gender: 'male',
    age: 'adult',
    style: 'mysterious',
  },
  dragon: {
    id: process.env.ELEVENLABS_FR_DRAGON || 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Dragon Gentil',
    description: 'Voix grave mais amicale',
    emoji: '🐉',
    gender: 'male',
    age: 'adult',
    style: 'warm',
  },
  papy: {
    id: process.env.ELEVENLABS_FR_PAPY || 'pNInz6obpgDQGcFmaJgB',
    name: 'Papy Marcel',
    description: 'Voix sage et rassurante de grand-père',
    emoji: '👴',
    gender: 'male',
    age: 'elderly',
    style: 'gentle',
  },
}

// 🇬🇧 VOIX ANGLAISES (7)
export const ENGLISH_VOICES: Record<string, ElevenLabsVoice> = {
  // Female voices
  aria: {
    id: process.env.ELEVENLABS_EN_ARIA || 'XB0fDUnXU5powFXDhCwa',
    name: 'Aria',
    description: 'Warm and expressive storyteller',
    emoji: '🌟',
    gender: 'female',
    age: 'adult',
    style: 'warm',
  },
  fairy: {
    id: process.env.ELEVENLABS_EN_FAIRY || 'jBpfuIE2acCO8z3wKNLl',
    name: 'Fairy Bell',
    description: 'Light and magical fairy voice',
    emoji: '🧚',
    gender: 'female',
    age: 'young',
    style: 'playful',
  },
  grandma: {
    id: process.env.ELEVENLABS_EN_GRANDMA || 'ThT5KcBeYPX3keUQqHPh',
    name: 'Grandma Pearl',
    description: 'Kind and gentle grandmother voice',
    emoji: '👵',
    gender: 'female',
    age: 'elderly',
    style: 'gentle',
  },
  // Male voices
  storyteller: {
    id: process.env.ELEVENLABS_EN_STORYTELLER || 'N2lVS1w4EtoT3dr4eOWO',
    name: 'The Storyteller',
    description: 'Classic narrative voice, captivating',
    emoji: '📖',
    gender: 'male',
    age: 'adult',
    style: 'dramatic',
  },
  wizard: {
    id: process.env.ELEVENLABS_EN_WIZARD || 'CYw3kZ02Hs0563khs1Fj',
    name: 'The Wizard',
    description: 'Mysterious and enchanting voice',
    emoji: '🧙',
    gender: 'male',
    age: 'adult',
    style: 'mysterious',
  },
  dragon: {
    id: process.env.ELEVENLABS_EN_DRAGON || 'IKne3meq5aSn9XLyUdCD',
    name: 'Friendly Dragon',
    description: 'Deep but friendly voice',
    emoji: '🐉',
    gender: 'male',
    age: 'adult',
    style: 'warm',
  },
  grandpa: {
    id: process.env.ELEVENLABS_EN_GRANDPA || 'GBv7mTt0atIp3Br8iCZE',
    name: 'Grandpa Joe',
    description: 'Wise and reassuring grandfather voice',
    emoji: '👴',
    gender: 'male',
    age: 'elderly',
    style: 'gentle',
  },
}

// 🇷🇺 VOIX RUSSES (7)
export const RUSSIAN_VOICES: Record<string, ElevenLabsVoice> = {
  // Женские голоса
  natasha: {
    id: process.env.ELEVENLABS_RU_NATASHA || 'XrExE9yKIg1WjnnlVkGX',
    name: 'Наташа',
    description: 'Тёплый и душевный голос',
    emoji: '🌸',
    gender: 'female',
    age: 'adult',
    style: 'warm',
  },
  feya: {
    id: process.env.ELEVENLABS_RU_FEYA || 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Фея',
    description: 'Лёгкий и волшебный голос',
    emoji: '🧚',
    gender: 'female',
    age: 'young',
    style: 'playful',
  },
  babushka: {
    id: process.env.ELEVENLABS_RU_BABUSHKA || 'jsCqWAovK2LkecY7zXl4',
    name: 'Бабушка',
    description: 'Добрый голос бабушки',
    emoji: '👵',
    gender: 'female',
    age: 'elderly',
    style: 'gentle',
  },
  // Мужские голоса
  skazochnik: {
    id: process.env.ELEVENLABS_RU_SKAZOCHNIK || 'EXAVITQu4vr4xnSDxMaL',
    name: 'Сказочник',
    description: 'Классический голос рассказчика',
    emoji: '📖',
    gender: 'male',
    age: 'adult',
    style: 'dramatic',
  },
  koldun: {
    id: process.env.ELEVENLABS_RU_KOLDUN || 'VR6AewLTigWG4xSOukaG',
    name: 'Колдун',
    description: 'Таинственный и завораживающий',
    emoji: '🧙',
    gender: 'male',
    age: 'adult',
    style: 'mysterious',
  },
  drakon: {
    id: process.env.ELEVENLABS_RU_DRAKON || 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Дракон',
    description: 'Глубокий, но дружелюбный голос',
    emoji: '🐉',
    gender: 'male',
    age: 'adult',
    style: 'warm',
  },
  dedushka: {
    id: process.env.ELEVENLABS_RU_DEDUSHKA || 'pNInz6obpgDQGcFmaJgB',
    name: 'Дедушка',
    description: 'Мудрый и успокаивающий голос',
    emoji: '👴',
    gender: 'male',
    age: 'elderly',
    style: 'gentle',
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

