import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkData() {
  console.log('🔍 Vérification complète de Supabase...\n')

  // Vérifier les tables
  const tables = ['profiles', 'stories', 'story_pages', 'assets', 'diary_entries', 'chat_messages', 'montage_projects']
  console.log('📋 Tables:')
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      console.log(`   ❌ ${table}: MANQUANTE - ${error.message}`)
    } else {
      console.log(`   ✅ ${table}: OK`)
    }
  }

  // Profils
  const { data: profiles } = await supabase.from('profiles').select('*')
  console.log('\n👤 Profils:')
  if (profiles?.length) {
    profiles.forEach(p => console.log(`   - ${p.name} (${p.role}) - ID: ${p.id}`))
  } else {
    console.log('   Aucun profil')
  }

  // Histoires
  const { data: stories } = await supabase
    .from('stories')
    .select('id, title, profile_id, status')
  
  console.log('\n📚 Histoires:')
  if (stories?.length) {
    stories.forEach(s => console.log(`   - "${s.title}" (${s.status})`))
  } else {
    console.log('   Aucune histoire')
  }

  // Pages
  const { data: pages } = await supabase.from('story_pages').select('id, story_id, page_number')
  console.log('\n📄 Pages:')
  if (pages?.length) {
    console.log(`   ${pages.length} pages`)
  } else {
    console.log('   Aucune page')
  }

  // Montages
  const { data: montages, error: montageError } = await supabase
    .from('montage_projects')
    .select('id, title, profile_id')
  
  console.log('\n🎬 Montages:')
  if (montageError) {
    console.log(`   ❌ Table manquante: ${montageError.message}`)
  } else if (montages?.length) {
    montages.forEach(m => console.log(`   - "${m.title}"`))
  } else {
    console.log('   Aucun montage')
  }

  console.log('\n' + '═'.repeat(50))
}

checkData()
