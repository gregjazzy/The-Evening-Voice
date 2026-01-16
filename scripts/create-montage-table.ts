import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function createMontageTable() {
  console.log('🔧 Création de la table montage_projects...\n')

  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS montage_projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        pages JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_complete BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_montage_projects_profile_id ON montage_projects(profile_id);
      CREATE INDEX IF NOT EXISTS idx_montage_projects_story_id ON montage_projects(story_id);

      ALTER TABLE montage_projects ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Users can manage own montage projects" ON montage_projects;
      CREATE POLICY "Users can manage own montage projects"
        ON montage_projects FOR ALL
        USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
    `
  })

  if (error) {
    console.log('⚠️  RPC non disponible, essai direct...')
    
    // Essayer avec une requête directe via l'API REST n'est pas possible pour CREATE TABLE
    // L'utilisateur doit exécuter le SQL dans le dashboard Supabase
    console.log('\n📋 Exécute ce SQL dans le Dashboard Supabase (SQL Editor):')
    console.log('═'.repeat(60))
    console.log(`
CREATE TABLE IF NOT EXISTS montage_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_montage_projects_profile_id ON montage_projects(profile_id);
CREATE INDEX IF NOT EXISTS idx_montage_projects_story_id ON montage_projects(story_id);

ALTER TABLE montage_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own montage projects"
  ON montage_projects FOR ALL
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
`)
    console.log('═'.repeat(60))
  } else {
    console.log('✅ Table montage_projects créée avec succès!')
  }
}

createMontageTable()
