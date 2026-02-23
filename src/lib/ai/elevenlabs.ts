/**
 * ElevenLabs - Voix pour la narration des histoires
 * Définitions des voix par langue (FR, EN, RU)
 */

// ============================================
// TYPES
// ============================================

export interface ElevenLabsVoice {
  id: string
  name: string
  description: string
  emoji: string
  gender: 'female' | 'male'
  sampleUrl: string  // Extrait pré-enregistré
}

// ============================================
// 🇫🇷 VOIX FRANÇAISES
// ============================================

export const FRENCH_VOICES: ElevenLabsVoice[] = [
  {
    id: 'kwhMCf63M8O3rCfnQ3oQ',
    name: 'La Conteuse',
    description: 'Voix douce et chaleureuse',
    emoji: '📖',
    gender: 'female',
    sampleUrl: '/sound/voices/fr/narratrice.mp3',
  },
  {
    id: 'FvmvwvObRqIHojkEGh5N',
    name: 'Petite Étoile',
    description: 'Voix légère et enjouée',
    emoji: '⭐',
    gender: 'female',
    sampleUrl: '/sound/voices/fr/jeuneFille.mp3',
  },
  {
    id: 'M9RTtrzRACmbUzsEMq8p',
    name: 'Mamie Rose',
    description: 'Voix bienveillante de grand-mère',
    emoji: '👵',
    gender: 'female',
    sampleUrl: '/sound/voices/fr/mamie.mp3',
  },
  {
    id: '5Qfm4RqcAer0xoyWtoHC',
    name: 'Petit Lucas',
    description: 'Voix enjouée de jeune garçon',
    emoji: '🧒',
    gender: 'male',
    sampleUrl: '/sound/voices/fr/jeuneGarcon.mp3',
  },
  {
    id: '1wg2wOjdEWKA7yQD8Kca',
    name: 'Papy Marcel',
    description: 'Voix sage et rassurante',
    emoji: '👴',
    gender: 'male',
    sampleUrl: '/sound/voices/fr/papy.mp3',
  },
]

// ============================================
// 🇬🇧 VOIX ANGLAISES
// ============================================

export const ENGLISH_VOICES: ElevenLabsVoice[] = [
  {
    id: 'RILOU7YmBhvwJGDGjNmP',
    name: 'The Storyteller',
    description: 'Warm and expressive',
    emoji: '📖',
    gender: 'female',
    sampleUrl: '/sound/voices/en/narrator.mp3',
  },
  {
    id: 'rCmVtv8cYU60uhlsOo1M',
    name: 'Little Star',
    description: 'Light and playful',
    emoji: '⭐',
    gender: 'female',
    sampleUrl: '/sound/voices/en/youngGirl.mp3',
  },
  {
    id: 'kkPJzQOWz2Oz9cUaEaQd',
    name: 'Grandma Pearl',
    description: 'Kind and gentle',
    emoji: '👵',
    gender: 'female',
    sampleUrl: '/sound/voices/en/grandma.mp3',
  },
  {
    id: 'G17SuINrv2H9FC6nvetn',
    name: 'The Narrator',
    description: 'Classic narrative voice',
    emoji: '🎭',
    gender: 'male',
    sampleUrl: '/sound/voices/en/narratorMale.mp3',
  },
  {
    id: '0lp4RIz96WD1RUtvEu3Q',
    name: 'Grandpa Joe',
    description: 'Wise and reassuring',
    emoji: '👴',
    gender: 'male',
    sampleUrl: '/sound/voices/en/grandpa.mp3',
  },
]

// ============================================
// 🇷🇺 VOIX RUSSES
// ============================================

export const RUSSIAN_VOICES: ElevenLabsVoice[] = [
  {
    id: 'GN4wbsbejSnGSa1AzjH5',
    name: 'Наташа',
    description: 'Тёплый и душевный голос',
    emoji: '📖',
    gender: 'female',
    sampleUrl: '/sound/voices/ru/narrator.mp3',
  },
  {
    id: 'EDpEYNf6XIeKYRzYcx4I',
    name: 'Звёздочка',
    description: 'Лёгкий и игривый голос',
    emoji: '⭐',
    gender: 'female',
    sampleUrl: '/sound/voices/ru/youngGirl.mp3',
  },
  {
    id: 're2r5d74PqDzicySNW0I',
    name: 'Сказочник',
    description: 'Классический голос рассказчика',
    emoji: '🎭',
    gender: 'male',
    sampleUrl: '/sound/voices/ru/narratorMale.mp3',
  },
  {
    id: 'wAGzRVkxKEs8La0lmdrE',
    name: 'Колдун',
    description: 'Таинственный и завораживающий',
    emoji: '🧙',
    gender: 'male',
    sampleUrl: '/sound/voices/ru/mysterious.mp3',
  },
]

// ============================================
// HELPERS
// ============================================

const VOICES_BY_LOCALE: Record<string, ElevenLabsVoice[]> = {
  fr: FRENCH_VOICES,
  en: ENGLISH_VOICES,
  ru: RUSSIAN_VOICES,
}

export function getVoicesForLocale(locale: string): ElevenLabsVoice[] {
  return VOICES_BY_LOCALE[locale] || FRENCH_VOICES
}

export function getVoiceById(voiceId: string, locale: string = 'fr'): ElevenLabsVoice | null {
  const voices = getVoicesForLocale(locale)
  return voices.find(v => v.id === voiceId) || null
}
