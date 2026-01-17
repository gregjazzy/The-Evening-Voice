'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAdminStore, FamilyConfig, UserFamilyInfo } from '@/store/useAdminStore';

interface AppConfig {
  // Clés API
  elevenlabsKey: string | null;
  midjourneyKey: string | null;
  runwayKey: string | null;
  geminiKey: string | null;
  
  // Voix par défaut
  defaultNarrationVoice: {
    fr: string | null;
    en: string | null;
    ru: string | null;
  };
  defaultAiVoice: string | null;
  
  // Info famille
  familyId: string | null;
  familyName: string | null;
  userRole: 'parent' | 'child' | 'guest' | null;
  
  // Statut
  isLoaded: boolean;
  isSuperAdmin: boolean;
}

const defaultConfig: AppConfig = {
  elevenlabsKey: null,
  midjourneyKey: null,
  runwayKey: null,
  geminiKey: null,
  defaultNarrationVoice: { fr: null, en: null, ru: null },
  defaultAiVoice: null,
  familyId: null,
  familyName: null,
  userRole: null,
  isLoaded: false,
  isSuperAdmin: false,
};

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { setIsSuperAdmin, setUserFamilyInfo } = useAdminStore();
  
  const supabase = createClientComponentClient();
  
  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Utilisateur non connecté - utiliser les clés d'environnement par défaut
        setConfig({
          ...defaultConfig,
          elevenlabsKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || null,
          geminiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || null,
          isLoaded: true,
        });
        setIsLoading(false);
        return;
      }
      
      // Vérifier si super admin
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      const isSuperAdmin = !!superAdmin;
      setIsSuperAdmin(isSuperAdmin);
      
      // Récupérer la config de la famille de l'utilisateur
      const { data: familyConfig, error: configError } = await supabase
        .rpc('get_user_family_config', { p_user_id: user.id });
      
      if (configError) {
        console.warn('Pas de config famille trouvée:', configError);
        // Fallback sur les variables d'environnement
        setConfig({
          ...defaultConfig,
          elevenlabsKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || null,
          geminiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || null,
          isLoaded: true,
          isSuperAdmin,
        });
      } else if (familyConfig && familyConfig.length > 0) {
        const fc = familyConfig[0];
        
        const userFamilyInfo: UserFamilyInfo = {
          family_id: fc.family_id,
          family_name: fc.family_name,
          family_code: fc.family_code,
          user_role: fc.user_role,
          config: {
            id: '',
            family_id: fc.family_id,
            elevenlabs_key: fc.elevenlabs_key,
            midjourney_key: fc.midjourney_key,
            runway_key: fc.runway_key,
            gemini_key: fc.gemini_key,
            default_narration_voice_fr: fc.default_narration_voice_fr,
            default_narration_voice_en: fc.default_narration_voice_en,
            default_narration_voice_ru: fc.default_narration_voice_ru,
            default_ai_voice: fc.default_ai_voice,
          } as FamilyConfig,
        };
        
        setUserFamilyInfo(userFamilyInfo);
        
        setConfig({
          elevenlabsKey: fc.elevenlabs_key || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || null,
          midjourneyKey: fc.midjourney_key || null,
          runwayKey: fc.runway_key || null,
          geminiKey: fc.gemini_key || process.env.NEXT_PUBLIC_GEMINI_API_KEY || null,
          defaultNarrationVoice: {
            fr: fc.default_narration_voice_fr,
            en: fc.default_narration_voice_en,
            ru: fc.default_narration_voice_ru,
          },
          defaultAiVoice: fc.default_ai_voice,
          familyId: fc.family_id,
          familyName: fc.family_name,
          userRole: fc.user_role,
          isLoaded: true,
          isSuperAdmin,
        });
      } else {
        // Pas de famille - utiliser les defaults
        setConfig({
          ...defaultConfig,
          elevenlabsKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || null,
          geminiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || null,
          isLoaded: true,
          isSuperAdmin,
        });
      }
      
    } catch (err) {
      console.error('Erreur chargement config:', err);
      setError('Erreur de chargement de la configuration');
      // Fallback
      setConfig({
        ...defaultConfig,
        elevenlabsKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || null,
        geminiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || null,
        isLoaded: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, setIsSuperAdmin, setUserFamilyInfo]);
  
  useEffect(() => {
    loadConfig();
    
    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadConfig();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [loadConfig, supabase.auth]);
  
  return {
    config,
    isLoading,
    error,
    reload: loadConfig,
  };
}

// Hook simplifié pour juste récupérer une clé
export function useApiKey(keyType: 'elevenlabs' | 'midjourney' | 'runway' | 'gemini') {
  const { config, isLoading } = useAppConfig();
  
  const keyMap = {
    elevenlabs: config.elevenlabsKey,
    midjourney: config.midjourneyKey,
    runway: config.runwayKey,
    gemini: config.geminiKey,
  };
  
  return {
    key: keyMap[keyType],
    isLoading,
    isConfigured: !!keyMap[keyType],
  };
}
