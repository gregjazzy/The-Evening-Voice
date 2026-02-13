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

async function checkMygale() {
  console.log('🔍 Recherche de l\'histoire "mygale"...\n');
  
  // Chercher toutes les histoires avec "mygale" dans le titre
  const { data: stories, error: storiesError } = await supabase
    .from('stories')
    .select('*')
    .ilike('title', '%mygale%');
  
  if (storiesError) {
    console.log('❌ Erreur stories:', storiesError.message);
  } else if (!stories || stories.length === 0) {
    console.log('❌ Aucune histoire "mygale" trouvée directement');
    
    // Lister toutes les histoires récentes
    const { data: allStories } = await supabase
      .from('stories')
      .select('id, title, created_at, profile_id')
      .order('created_at', { ascending: false })
      .limit(15);
    
    console.log('\n📚 15 dernières histoires:');
    allStories?.forEach(s => {
      console.log(`   - "${s.title}" (${new Date(s.created_at).toLocaleDateString('fr-FR')}) - ID: ${s.id.substring(0,8)}...`);
    });
    return;
  }
  
  for (const story of stories) {
    await displayStory(story);
  }
}

async function displayStory(story) {
  console.log(`\n📖 "${story.title}"`);
  console.log(`   ID: ${story.id}`);
  console.log(`   Créée: ${new Date(story.created_at).toLocaleString('fr-FR')}`);
  console.log(`   Modifiée: ${new Date(story.updated_at).toLocaleString('fr-FR')}`);
  console.log(`   Structure: ${story.structure}`);
  console.log(`   Format: ${story.book_format}`);
  
  // Chercher les pages de cette histoire
  const { data: pages, error: pagesError } = await supabase
    .from('story_pages')
    .select('*')
    .eq('story_id', story.id)
    .order('page_number', { ascending: true });
  
  if (pagesError) {
    console.log(`   ❌ Erreur pages: ${pagesError.message}`);
  } else if (!pages || pages.length === 0) {
    console.log(`   ⚠️ Aucune page trouvée dans story_pages`);
  } else {
    console.log(`\n   📄 ${pages.length} pages:`);
    pages.forEach((p, i) => {
      console.log(`\n      Page ${p.page_number}:`);
      console.log(`         ID: ${p.id}`);
      console.log(`         Titre: ${p.title || '(sans titre)'}`);
      
      // Text blocks
      const textBlocks = Array.isArray(p.text_blocks) ? p.text_blocks : [];
      console.log(`         Text blocks: ${textBlocks.length}`);
      textBlocks.forEach((tb, j) => {
        const preview = tb.content?.substring(0, 50).replace(/\n/g, ' ') || '';
        console.log(`            - Block ${j}: "${preview}..."`);
      });
      
      // Media layers
      const mediaLayers = Array.isArray(p.media_layers) ? p.media_layers : [];
      console.log(`         Media layers: ${mediaLayers.length}`);
      mediaLayers.forEach((ml, j) => {
        console.log(`            - Media ${j}: type=${ml.type}, url=${ml.url?.substring(0, 80)}...`);
      });
      
      // Afficher le JSON brut des champs d'images
      console.log(`         [RAW] media_layers: ${JSON.stringify(p.media_layers)?.substring(0, 200)}`);
      console.log(`         [RAW] background_image_url: ${p.background_image_url || 'null'}`);
      console.log(`         [RAW] background_video_url: ${p.background_video_url || 'null'}`);
      
      // Background
      console.log(`         Background image: ${p.background_image_url ? 'Oui' : 'Non'}`);
      if (p.background_image_url) {
        console.log(`            URL: ${p.background_image_url.substring(0, 100)}...`);
      }
      console.log(`         Background video: ${p.background_video_url ? 'Oui' : 'Non'}`);
      
      // Audio tracks
      const audioTracks = Array.isArray(p.audio_tracks) ? p.audio_tracks : [];
      console.log(`         Audio tracks: ${audioTracks.length}`);
    });
  }
  
  // Vérifier aussi dans la table assets
  const { data: assets, error: assetsError } = await supabase
    .from('assets')
    .select('*')
    .eq('story_id', story.id);
  
  if (assetsError) {
    console.log(`\n   ❌ Erreur assets: ${assetsError.message}`);
  } else {
    console.log(`\n   🖼️ Assets liés: ${assets?.length || 0}`);
    assets?.forEach((a, i) => {
      console.log(`      - ${a.type}: ${a.url?.substring(0, 80)}...`);
    });
  }
}

async function checkStorage() {
  console.log('\n\n🗄️ Vérification du Storage Supabase...\n');
  
  // Lister les buckets
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.log('❌ Erreur buckets:', bucketsError.message);
    return;
  }
  
  console.log(`📦 ${buckets.length} buckets trouvés:`);
  for (const bucket of buckets) {
    console.log(`\n   Bucket: ${bucket.name}`);
    
    // Lister les fichiers dans le bucket
    const { data: files, error: filesError } = await supabase.storage
      .from(bucket.name)
      .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
    
    if (filesError) {
      console.log(`      ❌ Erreur: ${filesError.message}`);
    } else {
      console.log(`      ${files?.length || 0} fichiers/dossiers`);
      
      // Chercher récursivement dans les dossiers
      for (const item of files || []) {
        if (item.id === null) {
          // C'est un dossier
          console.log(`      📁 ${item.name}/`);
          const { data: subFiles } = await supabase.storage
            .from(bucket.name)
            .list(item.name, { limit: 50 });
          
          subFiles?.forEach(sf => {
            const size = sf.metadata?.size ? `(${Math.round(sf.metadata.size / 1024)}KB)` : '';
            console.log(`         - ${sf.name} ${size}`);
          });
        } else {
          const size = item.metadata?.size ? `(${Math.round(item.metadata.size / 1024)}KB)` : '';
          console.log(`      - ${item.name} ${size}`);
        }
      }
    }
  }
}

async function main() {
  await checkMygale();
  await checkStorage();
}

main().catch(console.error);
