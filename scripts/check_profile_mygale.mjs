import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  // Trouver le profile_id de l'histoire Mygale
  const { data: story } = await supabase
    .from('stories')
    .select('*, profiles(*)')
    .ilike('title', '%mygale%')
    .single();
  
  console.log('📖 Histoire Mygale:');
  console.log(`   Profile ID: ${story?.profile_id}`);
  console.log(`   Profile name: ${story?.profiles?.name}`);
  
  // Lister les images dans ce profil
  const { data: images } = await supabase.storage
    .from('images')
    .list(story?.profile_id, { limit: 50 });
  
  console.log(`\n🖼️ Images dans le bucket pour ce profil:`);
  console.log(`   ${images?.length || 0} fichiers`);
  images?.forEach(img => {
    console.log(`   - ${img.name} (${Math.round((img.metadata?.size || 0) / 1024)}KB)`);
  });
  
  // Générer les URLs publiques
  if (images?.length > 0) {
    console.log('\n📎 URLs des images:');
    for (const img of images) {
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(`${story?.profile_id}/${img.name}`);
      console.log(`   ${urlData?.publicUrl}`);
    }
  }
  
  // Vérifier les autres histoires de ce profil
  const { data: otherStories } = await supabase
    .from('stories')
    .select('id, title, created_at')
    .eq('profile_id', story?.profile_id)
    .order('created_at', { ascending: false });
  
  console.log(`\n📚 Autres histoires du même profil:`);
  otherStories?.forEach(s => {
    console.log(`   - "${s.title}" (${new Date(s.created_at).toLocaleDateString('fr-FR')})`);
  });
}

main().catch(console.error);
