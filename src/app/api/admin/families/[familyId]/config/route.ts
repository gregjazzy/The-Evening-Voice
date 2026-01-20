import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PATCH - Mettre à jour la configuration (clés API, voix)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  try {
    const supabase = createClient();
    const { familyId } = params;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    // Vérifier accès : Super admin OU parent de cette famille
    const { data: superAdmin } = await (supabase as any)
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    const isSuperAdmin = !!superAdmin;
    
    if (!isSuperAdmin) {
      // Vérifier si l'utilisateur est un parent de cette famille
      const { data: membership } = await (supabase as any)
        .from('family_members')
        .select('role')
        .eq('family_id', familyId)
        .eq('user_id', user.id)
        .single();
      
      if (!membership || membership.role !== 'parent') {
        return NextResponse.json({ error: 'Accès refusé - Admin ou Parent requis' }, { status: 403 });
      }
    }
    
    const body = await request.json();
    const {
      elevenlabs_key,
      midjourney_key,
      runway_key,
      gemini_key,
      default_narration_voice_fr,
      default_narration_voice_en,
      default_narration_voice_ru,
      default_ai_voice,
    } = body;
    
    // Construire les updates (ne pas écraser avec undefined)
    const updates: Record<string, unknown> = {};
    
    if (elevenlabs_key !== undefined) updates.elevenlabs_key = elevenlabs_key || null;
    if (midjourney_key !== undefined) updates.midjourney_key = midjourney_key || null;
    if (runway_key !== undefined) updates.runway_key = runway_key || null;
    if (gemini_key !== undefined) updates.gemini_key = gemini_key || null;
    if (default_narration_voice_fr !== undefined) updates.default_narration_voice_fr = default_narration_voice_fr;
    if (default_narration_voice_en !== undefined) updates.default_narration_voice_en = default_narration_voice_en;
    if (default_narration_voice_ru !== undefined) updates.default_narration_voice_ru = default_narration_voice_ru;
    if (default_ai_voice !== undefined) updates.default_ai_voice = default_ai_voice;
    
    // Vérifier si la config existe
    const { data: existingConfig } = await (supabase as any)
      .from('family_config')
      .select('id')
      .eq('family_id', familyId)
      .single();
    
    let config;
    
    if (existingConfig) {
      // Update
      const { data, error } = await (supabase as any)
        .from('family_config')
        .update(updates)
        .eq('family_id', familyId)
        .select()
        .single();
      
      if (error) throw error;
      config = data;
    } else {
      // Insert
      const { data, error } = await (supabase as any)
        .from('family_config')
        .insert({
          family_id: familyId,
          ...updates,
        })
        .select()
        .single();
      
      if (error) throw error;
      config = data;
    }
    
    return NextResponse.json({ 
      config,
      message: 'Configuration mise à jour'
    });
    
  } catch (error) {
    console.error('Erreur update config:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Valider une clé API
export async function POST(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  try {
    const supabase = createClient();
    const { familyId } = params;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    // Vérifier accès : Super admin OU parent de cette famille
    const { data: superAdmin } = await (supabase as any)
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    const isSuperAdmin = !!superAdmin;
    
    if (!isSuperAdmin) {
      const { data: membership } = await (supabase as any)
        .from('family_members')
        .select('role')
        .eq('family_id', familyId)
        .eq('user_id', user.id)
        .single();
      
      if (!membership || membership.role !== 'parent') {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
    }
    
    const body = await request.json();
    const { key_type, key_value } = body;
    
    if (!key_type || !key_value) {
      return NextResponse.json(
        { error: 'Type et valeur requis' },
        { status: 400 }
      );
    }
    
    // Valider selon le type
    let isValid = false;
    let message = '';
    
    switch (key_type) {
      case 'elevenlabs':
        try {
          const response = await fetch('https://api.elevenlabs.io/v1/user', {
            headers: { 'xi-api-key': key_value }
          });
          isValid = response.ok;
          message = isValid ? 'Clé ElevenLabs valide' : 'Clé ElevenLabs invalide';
        } catch {
          message = 'Erreur de connexion à ElevenLabs';
        }
        break;
        
      case 'gemini':
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models?key=${key_value}`
          );
          isValid = response.ok;
          message = isValid ? 'Clé Gemini valide' : 'Clé Gemini invalide';
        } catch {
          message = 'Erreur de connexion à Gemini';
        }
        break;
        
      case 'midjourney':
        // ImagineAPI n'a pas d'endpoint de validation simple
        // On vérifie juste le format
        isValid = key_value.length > 20;
        message = isValid ? 'Format Midjourney OK (validation API impossible)' : 'Format invalide';
        break;
        
      case 'runway':
        // Runway n'a pas d'endpoint de validation simple
        isValid = key_value.startsWith('key_') || key_value.length > 30;
        message = isValid ? 'Format Runway OK (validation API impossible)' : 'Format invalide';
        break;
        
      default:
        message = 'Type de clé inconnu';
    }
    
    return NextResponse.json({ isValid, message });
    
  } catch (error) {
    console.error('Erreur validation clé:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
