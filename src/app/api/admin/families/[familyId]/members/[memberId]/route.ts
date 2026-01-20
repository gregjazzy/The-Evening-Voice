import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PATCH - Modifier un membre
export async function PATCH(
  request: NextRequest,
  { params }: { params: { familyId: string; memberId: string } }
) {
  try {
    const supabase = createClient();
    const { familyId, memberId } = params;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    // Vérifier accès
    const { data: superAdmin } = await (supabase as any)
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!superAdmin) {
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
    const { name, role, avatar_emoji } = body;
    
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (avatar_emoji !== undefined) updates.avatar_emoji = avatar_emoji;
    
    const { data: member, error } = await (supabase as any)
      .from('family_members')
      .update(updates)
      .eq('id', memberId)
      .eq('family_id', familyId)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ member });
    
  } catch (error) {
    console.error('Erreur update membre:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un membre
export async function DELETE(
  request: NextRequest,
  { params }: { params: { familyId: string; memberId: string } }
) {
  try {
    const supabase = createClient();
    const { familyId, memberId } = params;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    // Vérifier accès
    const { data: superAdmin } = await (supabase as any)
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!superAdmin) {
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
    
    // Ne pas permettre la suppression du dernier parent
    const { data: parentCount } = await (supabase as any)
      .from('family_members')
      .select('id', { count: 'exact' })
      .eq('family_id', familyId)
      .eq('role', 'parent');
    
    const { data: memberToDelete } = await (supabase as any)
      .from('family_members')
      .select('role')
      .eq('id', memberId)
      .single();
    
    if (memberToDelete?.role === 'parent' && (parentCount?.length || 0) <= 1) {
      return NextResponse.json(
        { error: 'Impossible de supprimer le dernier parent' },
        { status: 400 }
      );
    }
    
    const { error } = await (supabase as any)
      .from('family_members')
      .delete()
      .eq('id', memberId)
      .eq('family_id', familyId);
    
    if (error) throw error;
    
    return NextResponse.json({ message: 'Membre supprimé' });
    
  } catch (error) {
    console.error('Erreur suppression membre:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Renvoyer l'invitation
export async function POST(
  request: NextRequest,
  { params }: { params: { familyId: string; memberId: string } }
) {
  try {
    const supabase = createClient();
    const { familyId, memberId } = params;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    // Vérifier accès
    const { data: superAdmin } = await (supabase as any)
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!superAdmin) {
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
    
    // Récupérer le membre
    const { data: member } = await (supabase as any)
      .from('family_members')
      .select('*')
      .eq('id', memberId)
      .single();
    
    if (!member) {
      return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 });
    }
    
    if (member.invitation_status === 'accepted') {
      return NextResponse.json(
        { error: 'Ce membre a déjà accepté son invitation' },
        { status: 400 }
      );
    }
    
    // Renvoyer l'invitation
    try {
      await supabase.auth.admin.inviteUserByEmail(member.email, {
        data: {
          family_id: familyId,
          member_id: memberId,
          name: member.name,
          role: member.role,
        },
      });
    } catch (inviteErr) {
      console.warn('Erreur invitation:', inviteErr);
    }
    
    // Mettre à jour le timestamp
    await (supabase as any)
      .from('family_members')
      .update({
        invitation_sent_at: new Date().toISOString(),
        invitation_status: 'pending',
      })
      .eq('id', memberId);
    
    return NextResponse.json({
      message: `Invitation renvoyée à ${member.email}`
    });
    
  } catch (error) {
    console.error('Erreur renvoi invitation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
