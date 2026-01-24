import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Variables Supabase non trouvées');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkUser() {
  console.log('🔍 Recherche de gregjazzy@gmail.com...\n');
  
  // 1. Chercher dans auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.log('❌ Erreur auth.users:', authError.message);
  } else {
    const user = authUsers.users.find(u => u.email === 'gregjazzy@gmail.com');
    if (user) {
      console.log('✅ Trouvé dans auth.users:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Créé:', user.created_at);
      console.log('   Confirmé:', user.email_confirmed_at ? 'Oui' : 'Non');
    } else {
      console.log('❌ Non trouvé dans auth.users');
      console.log('   Total users:', authUsers.users.length);
      console.log('   Emails:', authUsers.users.map(u => u.email).join(', '));
    }
  }
  
  console.log('');
  
  // 2. Chercher dans profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*');
  
  if (profileError) {
    console.log('❌ Erreur profiles:', profileError.message);
  } else {
    const profile = profiles.find(p => p.email === 'gregjazzy@gmail.com');
    if (profile) {
      console.log('✅ Trouvé dans profiles:');
      console.log('   ID:', profile.id);
      console.log('   Username:', profile.username);
      console.log('   Role:', profile.role);
    } else {
      console.log('❌ Non trouvé dans profiles (par email)');
      console.log('   Total profiles:', profiles.length);
      console.log('   Usernames:', profiles.map(p => p.username || p.id).join(', '));
    }
  }
}

checkUser().catch(console.error);
