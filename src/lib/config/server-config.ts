/**
 * Utilitaires côté serveur pour récupérer la configuration
 */

import { createClient } from '@/lib/supabase/server';

export interface FamilyApiConfig {
  family_id: string | null;
  // Nouvelles clés
  fal_key: string | null;        // Images (Flux), Vidéos (Kling), Voix (ElevenLabs)
  gemini_key: string | null;     // Chat IA
  assemblyai_key: string | null; // Transcription voix
  // Voix par défaut
  default_narration_voice_fr: string | null;
  default_narration_voice_en: string | null;
  default_narration_voice_ru: string | null;
  default_ai_voice: string | null;
}

interface FamilyConfigRow {
  family_id: string;
  family_name: string;
  family_code: string;
  user_role: string;
  fal_key: string | null;
  gemini_key: string | null;
  assemblyai_key: string | null;
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
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: familyConfig } = await (supabase as any)
      .rpc('get_user_family_config', { p_user_id: user.id }) as { data: FamilyConfigRow[] | null };
    
    if (familyConfig && familyConfig.length > 0) {
      const fc = familyConfig[0];
      return {
        family_id: fc.family_id,
        fal_key: fc.fal_key,
        gemini_key: fc.gemini_key,
        assemblyai_key: fc.assemblyai_key,
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
  keyType: 'fal' | 'gemini' | 'assemblyai'
): Promise<string | null> {
  const familyConfig = await getUserFamilyConfig();
  
  const keyMap: Record<string, keyof FamilyApiConfig> = {
    fal: 'fal_key',
    gemini: 'gemini_key',
    assemblyai: 'assemblyai_key',
  };
  
  const envMap: Record<string, string | undefined> = {
    fal: process.env.FAL_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    assemblyai: process.env.ASSEMBLYAI_API_KEY,
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
