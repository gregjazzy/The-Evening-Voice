import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkProfile() {
  const userId = '05f4d344-16db-4e7d-a2de-45544827de6c';
  
  // Chercher profil par ID
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId);
  
  console.log('🔍 Recherche profil par ID', userId);
  console.log('   Résultat:', profile);
  console.log('   Erreur:', error);
  
  // Lister tous les profils
  const { data: allProfiles, error: allErr } = await supabase.from('profiles').select('id, username, email, role');
  
  if (allErr) {
    console.log('\n❌ Erreur liste profils:', allErr.message);
  } else if (allProfiles && allProfiles.length > 0) {
    console.log('\n📋 Tous les profils:');
    allProfiles.forEach(p => {
      console.log('   ' + p.id + ' | ' + (p.username || '-') + ' | ' + (p.email || '-') + ' | ' + (p.role || '-'));
    });
  } else {
    console.log('\n⚠️ Aucun profil trouvé dans la table profiles');
  }
}

checkProfile().catch(console.error);
