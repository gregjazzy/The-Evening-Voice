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
  // Trouver l'histoire Mygale avec ses pages
  const { data: story, error } = await supabase
    .from('stories')
    .select('*, story_pages(*)')
    .ilike('title', '%mygale%')
    .single();
  
  if (error) {
    console.log('❌ Erreur:', error.message);
    return;
  }
  
  console.log('📖 Histoire "Mygale"');
  console.log('   ID:', story.id);
  console.log('   Créée:', new Date(story.created_at).toLocaleString('fr-FR'));
  console.log('   Modifiée:', new Date(story.updated_at).toLocaleString('fr-FR'));
  console.log('   Status:', story.status);
  console.log('   Metadata:', JSON.stringify(story.metadata, null, 2));
  
  console.log('\n📄 PAGES (contenu complet):');
  
  const pages = story.story_pages?.sort((a, b) => a.page_number - b.page_number) || [];
  
  for (const page of pages) {
    console.log(`\n   === Page ${page.page_number} ===`);
    console.log('   ID:', page.id);
    console.log('   Titre:', page.title || '(pas de titre)');
    
    // Text blocks - contenu complet
    console.log('\n   TEXT_BLOCKS (raw):');
    console.log('   ', JSON.stringify(page.text_blocks, null, 2));
    
    // Extraire le contenu texte
    const textContent = page.text_blocks?.[0]?.content || '';
    console.log('\n   CONTENU TEXTE:');
    console.log('   "' + textContent + '"');
    console.log('   (longueur:', textContent.length, 'caractères)');
    
    // Media layers
    console.log('\n   MEDIA_LAYERS (raw):');
    console.log('   ', JSON.stringify(page.media_layers, null, 2));
    
    // Background
    console.log('\n   BACKGROUND:');
    console.log('   Image URL:', page.background_image_url || 'null');
    console.log('   Video URL:', page.background_video_url || 'null');
  }
}

main().catch(console.error);
