/**
 * Utilitaires côté serveur pour récupérer la configuration
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export interface FamilyApiConfig {
  family_id: string | null;
  elevenlabs_key: string | null;
  midjourney_key: string | null;
  runway_key: string | null;
  gemini_key: string | null;
  default_narration_voice_fr: string | null;
  default_narration_voice_en: string | null;
  default_narration_voice_ru: string | null;
  default_ai_voice: string | null;
}

/**
 * Récupère la configuration API pour l'utilisateur courant dans une API route
 */
export async function getUserFamilyConfig(): Promise<FamilyApiConfig | null> {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data: familyConfig } = await supabase
      .rpc('get_user_family_config', { p_user_id: user.id });
    
    if (familyConfig && familyConfig.length > 0) {
      const fc = familyConfig[0];
      return {
        family_id: fc.family_id,
        elevenlabs_key: fc.elevenlabs_key,
        midjourney_key: fc.midjourney_key,
        runway_key: fc.runway_key,
        gemini_key: fc.gemini_key,
        default_narration_voice_fr: fc.default_narration_voice_fr,
        default_narration_voice_en: fc.default_narration_voice_en,
        default_narration_voice_ru: fc.default_narration_voice_ru,
        default_ai_voice: fc.default_ai_voice,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erreur récupération config famille:', error);
    return null;
  }
}

/**
 * Récupère une clé API avec fallback sur les variables d'environnement
 */
export async function getApiKeyForRequest(
  keyType: 'elevenlabs' | 'midjourney' | 'runway' | 'gemini'
): Promise<string | null> {
  const familyConfig = await getUserFamilyConfig();
  
  const keyMap: Record<string, keyof FamilyApiConfig> = {
    elevenlabs: 'elevenlabs_key',
    midjourney: 'midjourney_key',
    runway: 'runway_key',
    gemini: 'gemini_key',
  };
  
  const envMap: Record<string, string | undefined> = {
    elevenlabs: process.env.ELEVENLABS_API_KEY,
    midjourney: process.env.MIDJOURNEY_API_KEY || process.env.IMAGINE_API_KEY,
    runway: process.env.RUNWAY_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
  };
  
  // Priorité à la config famille
  const configKey = familyConfig?.[keyMap[keyType]] as string | null;
  if (configKey) return configKey;
  
  // Fallback sur l'environnement
  return envMap[keyType] || null;
}

/**
 * Récupère la voix de narration par défaut selon la locale
 */
export async function getDefaultNarrationVoice(locale: string): Promise<string | null> {
  const familyConfig = await getUserFamilyConfig();
  if (!familyConfig) return null;
  
  const voiceMap: Record<string, keyof FamilyApiConfig> = {
    fr: 'default_narration_voice_fr',
    en: 'default_narration_voice_en',
    ru: 'default_narration_voice_ru',
  };
  
  const lang = locale.split('-')[0];
  const voiceKey = voiceMap[lang] || 'default_narration_voice_fr';
  
  return familyConfig[voiceKey] as string | null;
}
