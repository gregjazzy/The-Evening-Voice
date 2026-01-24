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
  
  // Lister tous les profils (sans spécifier les colonnes)
  const { data: allProfiles, error: allErr } = await supabase.from('profiles').select('*');
  
  if (allErr) {
    console.log('❌ Erreur:', allErr.message);
  } else if (allProfiles && allProfiles.length > 0) {
    console.log('📋 Structure de la table profiles (premier enregistrement):');
    console.log('   Colonnes:', Object.keys(allProfiles[0]).join(', '));
    
    console.log('\n📋 Tous les profils:');
    allProfiles.forEach(p => {
      console.log('---');
      console.log(JSON.stringify(p, null, 2));
    });
    
    // Chercher si notre user ID existe
    const match = allProfiles.find(p => p.id === userId);
    console.log('\n🔍 Profil pour', userId, ':', match ? 'TROUVÉ' : 'NON TROUVÉ');
  } else {
    console.log('⚠️ Aucun profil dans la table');
  }
}

checkProfile().catch(console.error);
