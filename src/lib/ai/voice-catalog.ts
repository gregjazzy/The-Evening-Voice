/**
 * Catalogue des voix ElevenLabs pour La Voix du Soir
 * 
 * Ce fichier contient uniquement les voix de narrateurs de qualité.
 * Les personnages fantaisie (dragon, sorcière, etc.) ont été retirés
 * car ils ne fonctionnent pas de manière fiable.
 */

// =============================================================================
// TYPES
// =============================================================================

export type VoiceType = 'narrator' | 'preset' | 'custom' | 'recorded'

export interface CharacterVoice {
  id: string                    // ID unique du personnage (ex: "narratrice")
  name: string                  // Nom affiché (ex: "La Conteuse")
  emoji: string                 // Emoji pour l'UI
  elevenLabsId: string          // ID ElevenLabs réel
  description: string           // Description courte
  color: string                 // Couleur hex pour l'UI
}

// =============================================================================
// NOTE: Personnages fantaisie retirés
// =============================================================================
// Les voix de personnages fantaisie (dragon, sorcière, princesse, etc.)
// ont été retirées car :
// 1. ElevenLabs Voice Cloning via fal.ai ne fonctionne pas pour ces voix
// 2. MiniMax Voice Design a une limite de 1000 caractères par appel
// 3. La qualité des voix "fantaisie" n'est pas au niveau attendu
//
// Alternative future : explorer ElevenLabs Voice Library pour des voix
// de personnages déjà conçues et de qualité professionnelle.
// =============================================================================

// =============================================================================
// HELPERS (pour compatibilité avec l'ancien code)
// =============================================================================

/**
 * Retourne un tableau vide - les personnages fantaisie ont été retirés
 * @deprecated Les personnages de contes ont été retirés
 */
export function getCharacterVoices(_locale: 'fr' | 'en' | 'ru' = 'fr'): CharacterVoice[] {
  return []
}

/**
 * Retourne null - les personnages fantaisie ont été retirés
 * @deprecated Les personnages de contes ont été retirés
 */
export function getCharacterById(
  _characterId: string,
  _locale: 'fr' | 'en' | 'ru' = 'fr'
): CharacterVoice | null {
  return null
}

/**
 * Retourne null - les personnages fantaisie ont été retirés
 * @deprecated Les personnages de contes ont été retirés
 */
export function getElevenLabsIdForCharacter(
  _characterId: string,
  _locale: 'fr' | 'en' | 'ru' = 'fr'
): string | null {
  return null
}

/**
 * Obtient l'ID ElevenLabs du narrateur par défaut
 * Utilise les voix définies dans elevenlabs.ts
 */
export function getDefaultNarratorId(locale: 'fr' | 'en' | 'ru' = 'fr'): string {
  // IDs des narrateurs par défaut (depuis elevenlabs.ts)
  const defaultNarrators: Record<string, string> = {
    fr: 'kwhMCf63M8O3rCfnQ3oQ', // La Conteuse
    en: 'EXAVITQu4vr4xnSDxMaL', // Bella (narrator)
    ru: 'jsCqWAovK2LkecY7zXl4', // Narrateur russe
  }
  return defaultNarrators[locale] || defaultNarrators.fr
}

// =============================================================================
// COMPATIBILITÉ AVEC L'ANCIEN CODE
// =============================================================================

export type CharacterVoiceMapping = CharacterVoice

// Tableau vide pour la rétrocompatibilité
export const CHARACTER_TO_VOICE: CharacterVoice[] = []

// Alias pour getAllCharacters (retourne vide)
export function getAllCharacters(_locale: 'fr' | 'en' | 'ru' = 'fr'): CharacterVoice[] {
  return []
}
