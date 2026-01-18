/**
 * Service centralisé pour récupérer les clés API
 * Priorité : Config famille (Supabase) > Variables d'environnement > null
 */

import { supabase } from '@/lib/supabase/client';

export interface ApiKeys {
  fal: string | null;        // Images (Flux), Vidéos (Kling), Voix (ElevenLabs)
  gemini: string | null;     // Chat IA
  assemblyai: string | null; // Transcription voix
}

// Cache local pour éviter des requêtes répétées
let cachedKeys: ApiKeys | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Récupère les clés API avec priorité à la config famille
 * Utilisé côté client
 */
export async function getApiKeys(): Promise<ApiKeys> {
  // Vérifier le cache
  if (cachedKeys && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedKeys;
  }
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Essayer de récupérer la config famille
      const { data: familyConfig } = await supabase
        .rpc('get_user_family_config', { p_user_id: user.id });
      
      if (familyConfig && familyConfig.length > 0) {
        const fc = familyConfig[0];
        cachedKeys = {
          fal: fc.fal_key || process.env.NEXT_PUBLIC_FAL_API_KEY || null,
          gemini: fc.gemini_key || process.env.NEXT_PUBLIC_GEMINI_API_KEY || null,
          assemblyai: fc.assemblyai_key || null,
        };
        cacheTimestamp = Date.now();
        return cachedKeys;
      }
    }
  } catch (error) {
    console.warn('Erreur récupération config famille:', error);
  }
  
  // Fallback sur les variables d'environnement
  cachedKeys = {
    fal: process.env.NEXT_PUBLIC_FAL_API_KEY || null,
    gemini: process.env.NEXT_PUBLIC_GEMINI_API_KEY || null,
    assemblyai: null,
  };
  cacheTimestamp = Date.now();
  
  return cachedKeys;
}

/**
 * Récupère une clé spécifique
 */
export async function getApiKey(keyType: keyof ApiKeys): Promise<string | null> {
  const keys = await getApiKeys();
  return keys[keyType];
}

/**
 * Invalide le cache (utile après mise à jour des clés)
 */
export function invalidateApiKeysCache(): void {
  cachedKeys = null;
  cacheTimestamp = 0;
}

/**
 * Version serveur - pour les API routes
 * Lit depuis les headers de la requête ou les variables d'environnement
 */
export function getServerApiKey(
  keyType: 'fal' | 'gemini' | 'assemblyai',
  familyConfig?: Record<string, string | null>
): string | null {
  // Si config famille fournie, l'utiliser en priorité
  if (familyConfig) {
    const keyMap: Record<string, string> = {
      fal: 'fal_key',
      gemini: 'gemini_key',
      assemblyai: 'assemblyai_key',
    };
    
    const configKey = familyConfig[keyMap[keyType]];
    if (configKey) return configKey;
  }
  
  // Fallback sur les variables d'environnement serveur
  const envMap: Record<string, string | undefined> = {
    fal: process.env.FAL_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    assemblyai: process.env.ASSEMBLYAI_API_KEY,
  };
  
  return envMap[keyType] || null;
}
