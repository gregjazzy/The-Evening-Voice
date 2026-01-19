/**
 * Catalogue unifié des voix ElevenLabs pour La Voix du Soir
 * 
 * Ce fichier contient :
 * 1. Les voix de base ElevenLabs (Rachel, Adam, etc.)
 * 2. Les personnages fantasy mappés sur ces voix
 * 3. Les helpers pour récupérer les infos
 */

// =============================================================================
// TYPES
// =============================================================================

export type VoiceType = 'narrator' | 'preset' | 'custom' | 'recorded'

export interface CharacterVoice {
  id: string                    // ID unique du personnage (ex: "princess")
  name: string                  // Nom affiché (ex: "Princesse")
  emoji: string                 // Emoji pour l'UI
  elevenLabsId: string          // ID ElevenLabs réel
  description: string           // Description courte
  color: string                 // Couleur hex pour l'UI
}

// =============================================================================
// CATALOGUE DES PERSONNAGES PAR LANGUE
// =============================================================================

/**
 * 🇫🇷 PERSONNAGES FRANÇAIS
 */
export const FRENCH_CHARACTERS: CharacterVoice[] = [
  // FÉMININS
  {
    id: 'princess',
    name: 'Princesse',
    emoji: '👸',
    elevenLabsId: 'EXAVITQu4vr4xnSDxMaL', // Bella - douce, jeune
    description: 'Voix douce et mélodieuse',
    color: '#FFB6C1',
  },
  {
    id: 'witch',
    name: 'Sorcière',
    emoji: '🧙‍♀️',
    elevenLabsId: 'pMsXgVXv3BLzUgSXRplE', // Serena - mystérieuse
    description: 'Voix mystérieuse et envoûtante',
    color: '#9370DB',
  },
  {
    id: 'fairy',
    name: 'Fée',
    emoji: '🧚',
    elevenLabsId: 'MF3mGyEYCl7XYWbV9V6O', // Elli - claire, enjouée
    description: 'Voix légère et pétillante',
    color: '#87CEEB',
  },
  {
    id: 'queen',
    name: 'Reine',
    emoji: '👑',
    elevenLabsId: 'XB0fDUnXU5powFXDhCwa', // Charlotte - élégante
    description: 'Voix royale et majestueuse',
    color: '#FFD700',
  },
  {
    id: 'girl',
    name: 'Petite fille',
    emoji: '👧',
    elevenLabsId: 'MF3mGyEYCl7XYWbV9V6O', // Elli - jeune
    description: 'Voix enjouée d\'enfant',
    color: '#98FB98',
  },
  
  // MASCULINS
  {
    id: 'king',
    name: 'Roi',
    emoji: '🤴',
    elevenLabsId: 'pNInz6obpgDQGcFmaJgB', // Adam - profond, narratif
    description: 'Voix grave et majestueuse',
    color: '#DAA520',
  },
  {
    id: 'wizard',
    name: 'Magicien',
    emoji: '🧙',
    elevenLabsId: 'yoZ06aMxZJJ28mfd3POQ', // Sam - grave, sage
    description: 'Voix sage et mystérieuse',
    color: '#4169E1',
  },
  {
    id: 'dragon',
    name: 'Dragon',
    emoji: '🐉',
    elevenLabsId: 'VR6AewLTigWG4xSOukaG', // Arnold - grave, puissant
    description: 'Voix grave et grondante',
    color: '#DC143C',
  },
  {
    id: 'knight',
    name: 'Chevalier',
    emoji: '🛡️',
    elevenLabsId: 'TxGEqnHWrfWFTfGW9XjX', // Josh - jeune, dynamique
    description: 'Voix brave et courageuse',
    color: '#708090',
  },
  {
    id: 'boy',
    name: 'Petit garçon',
    emoji: '👦',
    elevenLabsId: 'TxGEqnHWrfWFTfGW9XjX', // Josh - jeune
    description: 'Voix enjouée d\'enfant',
    color: '#32CD32',
  },
  
  // CRÉATURES
  {
    id: 'robot',
    name: 'Robot',
    emoji: '🤖',
    elevenLabsId: 'pNInz6obpgDQGcFmaJgB', // Adam (on ajoutera des effets)
    description: 'Voix métallique et saccadée',
    color: '#C0C0C0',
  },
  {
    id: 'monster',
    name: 'Monstre',
    emoji: '👹',
    elevenLabsId: 'VR6AewLTigWG4xSOukaG', // Arnold - grave
    description: 'Voix effrayante mais rigolote',
    color: '#8B4513',
  },
]

/**
 * 🇬🇧 PERSONNAGES ANGLAIS
 */
export const ENGLISH_CHARACTERS: CharacterVoice[] = [
  {
    id: 'princess',
    name: 'Princess',
    emoji: '👸',
    elevenLabsId: 'EXAVITQu4vr4xnSDxMaL', // Bella
    description: 'Soft and melodious voice',
    color: '#FFB6C1',
  },
  {
    id: 'witch',
    name: 'Witch',
    emoji: '🧙‍♀️',
    elevenLabsId: 'pMsXgVXv3BLzUgSXRplE', // Serena
    description: 'Mysterious and creaky voice',
    color: '#9370DB',
  },
  {
    id: 'king',
    name: 'King',
    emoji: '👑',
    elevenLabsId: 'pNInz6obpgDQGcFmaJgB', // Adam
    description: 'Deep and majestic voice',
    color: '#FFD700',
  },
  {
    id: 'dragon',
    name: 'Dragon',
    emoji: '🐉',
    elevenLabsId: 'VR6AewLTigWG4xSOukaG', // Arnold
    description: 'Deep and rumbling voice',
    color: '#DC143C',
  },
  {
    id: 'wizard',
    name: 'Wizard',
    emoji: '🧙',
    elevenLabsId: 'yoZ06aMxZJJ28mfd3POQ', // Sam
    description: 'Wise and mysterious voice',
    color: '#4169E1',
  },
  {
    id: 'knight',
    name: 'Knight',
    emoji: '🛡️',
    elevenLabsId: 'TxGEqnHWrfWFTfGW9XjX', // Josh
    description: 'Brave and courageous voice',
    color: '#708090',
  },
]

/**
 * 🇷🇺 PERSONNAGES RUSSES
 */
export const RUSSIAN_CHARACTERS: CharacterVoice[] = [
  {
    id: 'princess',
    name: 'Принцесса',
    emoji: '👸',
    elevenLabsId: 'EXAVITQu4vr4xnSDxMaL', // Bella
    description: 'Нежный и мелодичный голос',
    color: '#FFB6C1',
  },
  {
    id: 'wizard',
    name: 'Колдун',
    emoji: '🧙',
    elevenLabsId: 'yoZ06aMxZJJ28mfd3POQ', // Sam
    description: 'Загадочный голос',
    color: '#4169E1',
  },
  {
    id: 'king',
    name: 'Царь',
    emoji: '👑',
    elevenLabsId: 'pNInz6obpgDQGcFmaJgB', // Adam
    description: 'Величественный голос',
    color: '#FFD700',
  },
  {
    id: 'dragon',
    name: 'Дракон',
    emoji: '🐉',
    elevenLabsId: 'VR6AewLTigWG4xSOukaG', // Arnold
    description: 'Рокочущий голос',
    color: '#DC143C',
  },
]

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Obtient les personnages pour une langue
 */
export function getAllCharacters(locale: 'fr' | 'en' | 'ru' = 'fr'): CharacterVoice[] {
  switch (locale) {
    case 'fr': return FRENCH_CHARACTERS
    case 'en': return ENGLISH_CHARACTERS
    case 'ru': return RUSSIAN_CHARACTERS
    default: return FRENCH_CHARACTERS
  }
}

/**
 * Trouve un personnage par ID
 */
export function getCharacterById(
  characterId: string,
  locale: 'fr' | 'en' | 'ru' = 'fr'
): CharacterVoice | null {
  const characters = getAllCharacters(locale)
  return characters.find(c => c.id === characterId) || null
}

/**
 * Récupère l'ID ElevenLabs pour un personnage
 */
export function getElevenLabsIdForCharacter(
  characterId: string,
  locale: 'fr' | 'en' | 'ru' = 'fr'
): string | null {
  const character = getCharacterById(characterId, locale)
  return character?.elevenLabsId || null
}

/**
 * Obtient l'ID ElevenLabs du narrateur par défaut
 */
export function getDefaultNarratorId(locale: 'fr' | 'en' | 'ru' = 'fr'): string {
  // Rachel pour tous - voix calme et narrative
  return '21m00Tcm4TlvDq8ikWAM'
}

// =============================================================================
// COMPATIBILITÉ AVEC L'ANCIEN CODE
// =============================================================================

// Pour la rétrocompatibilité avec character-voices.ts
export type CharacterVoiceMapping = CharacterVoice

export const CHARACTER_TO_VOICE = FRENCH_CHARACTERS

// Fonction helper pour la rétrocompatibilité
export function getCharacterVoices(locale: 'fr' | 'en' | 'ru' = 'fr'): CharacterVoice[] {
  return getAllCharacters(locale)
}
