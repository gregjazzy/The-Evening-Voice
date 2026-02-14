import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const STORY_ID = '0eacc6f8-1ffe-4416-97e3-73327c5e64a7'
const GOOD_MONTAGE_ID = '01d49fed-2b5a-4574-a387-86cd53f3ac04'
const EMPTY_MONTAGE_ID = '52e2e19a-1de5-4450-b687-bbf5b2bb9591'

async function main() {
  // 1. Delete the empty montage
  console.log('🗑️  Suppression du montage vide...')
  const { error: delError } = await supabase
    .from('montage_projects')
    .delete()
    .eq('id', EMPTY_MONTAGE_ID)

  if (delError) {
    console.error('❌ Erreur suppression:', delError)
  } else {
    console.log('✅ Montage vide supprimé')
  }

  // 2. Fix the format of the good montage (unwrap { scenes: [...] } to direct array)
  console.log('\n🔧 Correction du format du montage...')
  const { data, error: fetchError } = await supabase
    .from('montage_projects')
    .select('id, scenes')
    .eq('id', GOOD_MONTAGE_ID)
    .single()

  if (fetchError || !data) {
    console.error('❌ Erreur lecture:', fetchError)
    return
  }

  const rawScenes = data.scenes
  const actualScenes = Array.isArray(rawScenes) ? rawScenes : rawScenes?.scenes

  if (!Array.isArray(actualScenes)) {
    console.error('❌ Impossible de trouver les scènes')
    return
  }

  console.log(`   ${actualScenes.length} scènes trouvées`)

  // Save as direct array
  const { error: updateError } = await supabase
    .from('montage_projects')
    .update({
      scenes: actualScenes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', GOOD_MONTAGE_ID)

  if (updateError) {
    console.error('❌ Erreur mise à jour:', updateError)
  } else {
    console.log('✅ Format corrigé (array direct)')
  }

  // 3. Verify
  const { data: verify } = await supabase
    .from('montage_projects')
    .select('id, scenes')
    .eq('id', GOOD_MONTAGE_ID)
    .single()

  if (verify) {
    const scenes = verify.scenes
    console.log('\n✅ Vérification:')
    console.log('   is array:', Array.isArray(scenes))
    console.log('   count:', scenes?.length)
    const s = scenes?.[1]
    if (s) {
      console.log('   Scene 2 musicTracks:', s.musicTracks?.length)
      console.log('   Scene 2 narration:', s.narration?.audioUrl ? 'OK' : 'none')
    }
  }
}

main().catch(console.error)
