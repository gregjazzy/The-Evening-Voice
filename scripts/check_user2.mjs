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
    .eq('id', userId)
    .single();
  
  if (error) {
    console.log('❌ Profil non trouvé par ID:', error.message);
  } else {
    console.log('✅ Profil trouvé:');
    console.log(JSON.stringify(profile, null, 2));
  }
  
  // Lister tous les profils
  const { data: allProfiles } = await supabase.from('profiles').select('id, username, email, role');
  console.log('\n📋 Tous les profils:');
  allProfiles.forEach(p => {
    console.log(`   ${p.id} | ${p.username || '-'} | ${p.email || '-'} | ${p.role || '-'}`);
  });
}

checkProfile().catch(console.error);
