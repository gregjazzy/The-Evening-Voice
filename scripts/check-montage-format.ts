import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  const { data: rows, error } = await supabase
    .from('montage_projects')
    .select('id, title, scenes')
    .eq('story_id', '0eacc6f8-1ffe-4416-97e3-73327c5e64a7')

  if (error) { console.error('Error:', error); return }

  console.log('Found', rows?.length, 'montage projects')
  for (const row of rows || []) {
    console.log(`\n=== Montage: ${row.id} (${row.title}) ===`)
    const rawScenes = row.scenes
    const isWrapped = !Array.isArray(rawScenes) && rawScenes?.scenes
    console.log('Format: ', isWrapped ? '{ scenes: [...] }' : 'direct array')
    const actualScenes = Array.isArray(rawScenes) ? rawScenes : rawScenes?.scenes
    console.log('Scenes count:', actualScenes?.length)
    const s = actualScenes?.[1]
    if (s) {
      console.log('  Scene 2 musicTracks:', s.musicTracks?.length ?? 'none')
      console.log('  Scene 2 soundTracks:', s.soundTracks?.length ?? 'none')
      console.log('  Scene 2 narration.audioUrl:', (s.narration?.audioUrl || 'none').substring(0, 80))
    }
  }

  // Use first montage for detailed check
  const data = rows?.[0]
  if (!data) return
  const scenes = Array.isArray(data.scenes) ? data.scenes : data.scenes?.scenes
  console.log('typeof scenes:', typeof scenes)
  console.log('scenes is array:', Array.isArray(scenes))
  console.log('scenes has .scenes key:', 'scenes' in (scenes || {}))

  const actualScenes = Array.isArray(scenes) ? scenes : scenes?.scenes
  console.log('actual scenes count:', actualScenes?.length)

  // Check scene 2 (index 1) - first with content
  const scene = actualScenes?.[1]
  if (scene) {
    console.log('\n--- Scene 2 (index 1) ---')
    console.log('musicTracks count:', scene.musicTracks?.length ?? 'undefined')
    console.log('soundTracks count:', scene.soundTracks?.length ?? 'undefined')
    console.log('mediaTracks count:', scene.mediaTracks?.length ?? 'undefined')
    console.log('narration.audioUrl:', scene.narration?.audioUrl?.substring(0, 100) ?? 'none')
    if (scene.musicTracks?.[0]) {
      console.log('music[0].url:', scene.musicTracks[0].url)
      console.log('music[0].volume:', scene.musicTracks[0].volume)
    }
    if (scene.soundTracks?.[0]) {
      console.log('sound[0].url:', scene.soundTracks[0].url)
    }
  }

  // Check scene 5 (index 4) - should have dialogue + sounds
  const scene5 = actualScenes?.[4]
  if (scene5) {
    console.log('\n--- Scene 5 (index 4) ---')
    console.log('musicTracks count:', scene5.musicTracks?.length ?? 'undefined')
    console.log('soundTracks count:', scene5.soundTracks?.length ?? 'undefined')
    console.log('title:', scene5.title)
  }
}

main().catch(console.error)
