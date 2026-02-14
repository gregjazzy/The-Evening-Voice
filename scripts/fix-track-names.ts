import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const MONTAGE_ID = '01d49fed-2b5a-4574-a387-86cd53f3ac04'

// Extract a nice name from a file path like /sound/music/epic-adventure.mp3 → "Epic Adventure"
function nameFromUrl(url: string): string {
  const filename = url.split('/').pop()?.replace(/\.\w+$/, '') || 'Unknown'
  return filename
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

async function main() {
  const { data, error } = await supabase
    .from('montage_projects')
    .select('id, scenes')
    .eq('id', MONTAGE_ID)
    .single()

  if (error || !data) { console.error('Error:', error); return }

  const scenes = data.scenes
  let fixedMusic = 0
  let fixedSounds = 0

  for (const scene of scenes) {
    if (scene.musicTracks) {
      for (const track of scene.musicTracks) {
        if (!track.name) {
          track.name = nameFromUrl(track.url)
          fixedMusic++
        }
      }
    }
    if (scene.soundTracks) {
      for (const track of scene.soundTracks) {
        if (!track.name) {
          track.name = nameFromUrl(track.url)
          fixedSounds++
        }
      }
    }
  }

  console.log(`Fixed ${fixedMusic} music tracks, ${fixedSounds} sound tracks`)

  // Save back
  const { error: updateError } = await supabase
    .from('montage_projects')
    .update({ scenes, updated_at: new Date().toISOString() })
    .eq('id', MONTAGE_ID)

  if (updateError) {
    console.error('Update error:', updateError)
  } else {
    console.log('Done!')
    // Verify
    const { data: verify } = await supabase
      .from('montage_projects')
      .select('scenes')
      .eq('id', MONTAGE_ID)
      .single()
    const s2 = verify?.scenes?.[1]
    console.log('Scene 2 music[0].name:', s2?.musicTracks?.[0]?.name)
    console.log('Scene 3 sound[0].name:', verify?.scenes?.[2]?.soundTracks?.[0]?.name)
  }
}

main().catch(console.error)
