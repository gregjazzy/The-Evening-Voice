import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Liste des membres d'une famille
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
    
    // Vérifier accès
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!superAdmin) {
      // Vérifier si membre parent de la famille
      const { data: membership } = await supabase
        .from('family_members')
        .select('role')
        .eq('family_id', familyId)
        .eq('user_id', user.id)
        .single();
      
      if (!membership || membership.role !== 'parent') {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
    }
    
    const { data: members, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    return NextResponse.json({ members: members || [] });
    
  } catch (error) {
    console.error('Erreur liste membres:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Ajouter un membre (et envoyer invitation)
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
    
    // Vérifier accès (super admin ou parent de la famille)
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    const isSuperAdmin = !!superAdmin;
    
    if (!isSuperAdmin) {
      const { data: membership } = await supabase
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
    const { name, email, role = 'child', avatar_emoji = '👤', send_invitation = true } = body;
    
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nom et email requis' },
        { status: 400 }
      );
    }
    
    // Vérifier si le membre existe déjà
    const { data: existingMember } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_id', familyId)
      .eq('email', email)
      .single();
    
    if (existingMember) {
      return NextResponse.json(
        { error: 'Ce membre existe déjà dans cette famille' },
        { status: 400 }
      );
    }
    
    // Créer le membre
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .insert({
        family_id: familyId,
        name,
        email,
        role,
        avatar_emoji,
        invitation_status: 'pending',
        invitation_sent_at: send_invitation ? new Date().toISOString() : null,
      })
      .select()
      .single();
    
    if (memberError) throw memberError;
    
    // Envoyer l'invitation par email si demandé
    if (send_invitation) {
      try {
        // Utiliser Supabase Auth pour inviter
        const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
          data: {
            family_id: familyId,
            member_id: member.id,
            name: name,
            role: role,
          },
        });
        
        if (inviteError) {
          console.warn('Erreur envoi invitation (non bloquant):', inviteError);
        }
      } catch (inviteErr) {
        console.warn('Erreur invitation:', inviteErr);
        // Ne pas bloquer si l'invitation échoue
      }
    }
    
    return NextResponse.json({
      member,
      message: send_invitation 
        ? `Invitation envoyée à ${email}` 
        : `Membre "${name}" ajouté`
    });
    
  } catch (error) {
    console.error('Erreur ajout membre:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
