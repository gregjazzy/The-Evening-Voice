import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export interface ChildCreations {
  member: {
    id: string;
    name: string;
    avatar_emoji: string;
    email: string;
  };
  stories: {
    id: string;
    title: string;
    status: string;
    total_pages: number;
    cover_image_url: string | null;
    created_at: string;
    updated_at: string;
  }[];
  montages: {
    id: string;
    title: string;
    scenes_count: number;
    created_at: string;
    updated_at: string;
  }[];
  lastActivity: string | null;
}

// GET - Récupérer les créations des enfants de la famille
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
    
    // Récupérer tous les membres enfants de la famille
    const { data: childMembers, error: membersError } = await (supabase as any)
      .from('family_members')
      .select('id, name, avatar_emoji, email, user_id')
      .eq('family_id', familyId)
      .eq('role', 'child')
      .eq('invitation_status', 'accepted');
    
    if (membersError) throw membersError;
    
    const results: ChildCreations[] = [];
    
    for (const member of childMembers || []) {
      if (!member.user_id) {
        // Membre sans compte actif
        results.push({
          member: {
            id: member.id,
            name: member.name,
            avatar_emoji: member.avatar_emoji,
            email: member.email,
          },
          stories: [],
          montages: [],
          lastActivity: null,
        });
        continue;
      }
      
      // Récupérer le profil de l'enfant
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('id')
        .eq('user_id', member.user_id)
        .single();
      
      let stories: ChildCreations['stories'] = [];
      let montages: ChildCreations['montages'] = [];
      
      if (profile) {
        // Récupérer les histoires
        const { data: storiesData } = await (supabase as any)
          .from('stories')
          .select('id, title, status, total_pages, cover_image_url, created_at, updated_at')
          .eq('profile_id', profile.id)
          .order('updated_at', { ascending: false })
          .limit(10);
        
        stories = storiesData || [];
        
        // Récupérer les montages
        const { data: montagesData } = await (supabase as any)
          .from('montage_projects')
          .select('id, title, scenes, created_at, updated_at')
          .eq('user_id', member.user_id)
          .order('updated_at', { ascending: false })
          .limit(10);
        
        montages = (montagesData || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          scenes_count: Array.isArray(m.scenes) ? m.scenes.length : 0,
          created_at: m.created_at,
          updated_at: m.updated_at,
        }));
      }
      
      // Calculer la dernière activité
      const allDates = [
        ...stories.map(s => s.updated_at),
        ...montages.map(m => m.updated_at),
      ].filter(Boolean);
      
      const lastActivity = allDates.length > 0
        ? allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
        : null;
      
      results.push({
        member: {
          id: member.id,
          name: member.name,
          avatar_emoji: member.avatar_emoji,
          email: member.email,
        },
        stories,
        montages,
        lastActivity,
      });
    }
    
    return NextResponse.json({ creations: results });
    
  } catch (error) {
    console.error('Erreur récupération créations:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
