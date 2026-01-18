import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Détails d'une famille
export async function GET(
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
    
    // Vérifier accès (super admin ou membre de la famille)
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    const isSuperAdmin = !!superAdmin;
    
    if (!isSuperAdmin) {
      // Vérifier si membre de la famille
      const { data: membership } = await supabase
        .from('family_members')
        .select('role')
        .eq('family_id', familyId)
        .eq('user_id', user.id)
        .single();
      
      if (!membership) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
    }
    
    // Récupérer la famille
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();
    
    if (familyError) throw familyError;
    
    // Récupérer la config
    const { data: config } = await supabase
      .from('family_config')
      .select('*')
      .eq('family_id', familyId)
      .single();
    
    // Récupérer les membres
    const { data: members } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true });
    
    // Pour les non-super-admins, masquer les clés API
    const safeConfig = isSuperAdmin ? config : {
      ...config,
      elevenlabs_key: config?.elevenlabs_key ? '••••••••' : null,
      midjourney_key: config?.midjourney_key ? '••••••••' : null,
      runway_key: config?.runway_key ? '••••••••' : null,
      gemini_key: config?.gemini_key ? '••••••••' : null,
    };
    
    return NextResponse.json({
      family,
      config: safeConfig,
      members: members || [],
    });
    
  } catch (error) {
    console.error('Erreur détails famille:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour une famille
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
    
    // Super admin only pour modifier la famille
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!superAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    
    const body = await request.json();
    const { name, is_active } = body;
    
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (is_active !== undefined) updates.is_active = is_active;
    
    const { data: family, error } = await supabase
      .from('families')
      .update(updates)
      .eq('id', familyId)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ family });
    
  } catch (error) {
    console.error('Erreur update famille:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une famille
export async function DELETE(
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
    
    // Super admin only
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!superAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    
    // Soft delete - désactiver plutôt que supprimer
    const { error } = await supabase
      .from('families')
      .update({ is_active: false })
      .eq('id', familyId);
    
    if (error) throw error;
    
    return NextResponse.json({ message: 'Famille désactivée' });
    
  } catch (error) {
    console.error('Erreur suppression famille:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
