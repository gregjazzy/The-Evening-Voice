import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET - Liste toutes les familles (super admin only)
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Vérifier que l'utilisateur est super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!superAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    
    // Récupérer toutes les familles avec le nombre de membres
    const { data: families, error } = await supabase
      .from('families')
      .select(`
        *,
        family_members(count),
        family_config(
          elevenlabs_key,
          midjourney_key,
          runway_key,
          gemini_key
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Formater la réponse
    const formattedFamilies = families?.map(f => ({
      ...f,
      member_count: f.family_members?.[0]?.count || 0,
      has_elevenlabs: !!f.family_config?.[0]?.elevenlabs_key,
      has_midjourney: !!f.family_config?.[0]?.midjourney_key,
      has_runway: !!f.family_config?.[0]?.runway_key,
      has_gemini: !!f.family_config?.[0]?.gemini_key,
      family_members: undefined,
      family_config: undefined,
    }));
    
    return NextResponse.json({ families: formattedFamilies });
    
  } catch (error) {
    console.error('Erreur liste familles:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle famille
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Vérifier super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!superAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    
    const body = await request.json();
    const { name, owner_email } = body;
    
    if (!name || !owner_email) {
      return NextResponse.json(
        { error: 'Nom et email requis' },
        { status: 400 }
      );
    }
    
    // Générer le code famille
    const { data: codeResult } = await supabase
      .rpc('generate_family_code', { family_name: name });
    
    const familyCode = codeResult || `${name.toUpperCase().slice(0, 8)}-${Date.now()}`;
    
    // Créer la famille
    const { data: family, error: familyError } = await supabase
      .from('families')
      .insert({
        name,
        code: familyCode,
        owner_email,
      })
      .select()
      .single();
    
    if (familyError) throw familyError;
    
    // Créer la config par défaut
    const { error: configError } = await supabase
      .from('family_config')
      .insert({
        family_id: family.id,
      });
    
    if (configError) throw configError;
    
    return NextResponse.json({ 
      family,
      message: `Famille "${name}" créée avec le code ${familyCode}` 
    });
    
  } catch (error) {
    console.error('Erreur création famille:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
