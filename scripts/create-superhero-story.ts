#!/usr/bin/env npx tsx
/**
 * Script de création d'une histoire animée de superhéro
 *
 * Crée un livre complet avec :
 * - Texte par page
 * - Images générées (nano-banana-pro 2K)
 * - Narration vocale (ElevenLabs)
 * - Musique de fond + bruitages
 * - Montage timeline avec ducking audio
 *
 * Usage: npx tsx scripts/create-superhero-story.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const FAL_API_KEY = process.env.FAL_API_KEY!
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROFILE_ID = 'cb0c90c3-1ac5-483c-a500-0e5d5a27bf3a' // Gregoire Mittelette
const AUTHOR_NAME = 'Gregoire Mittelette'
const BOOK_FORMAT = 'square-21'

// ElevenLabs voice IDs (French)
const VOICES = {
  narratrice: 'kwhMCf63M8O3rCfnQ3oQ',   // La Conteuse
  jeuneGarcon: '5Qfm4RqcAer0xoyWtoHC',   // Petit Lucas (Léo)
  jeuneFille: 'FvmvwvObRqIHojkEGh5N',    // Petite Étoile (amie)
  papy: '1wg2wOjdEWKA7yQD8Kca',          // Papy Marcel (voix grave pour l'Ombre)
}

// ============================================================================
// L'HISTOIRE : "Léo, le Gardien de Lumière"
// ============================================================================

interface SceneDefinition {
  pageType: 'front-cover' | 'content' | 'back-cover'
  title?: string
  text: string
  imagePrompt: string
  ambiance: string
  voiceType: keyof typeof VOICES
  // Dialogue lines with different voices
  dialogues?: { voice: keyof typeof VOICES; text: string }[]
  // Sound design
  musicTrack?: string   // path from /public/
  soundEffects?: { file: string; delay: number }[] // delay in seconds from scene start
}

const STORY_TITLE = 'Léo, le Gardien de Lumière'

const SCENES: SceneDefinition[] = [
  // === COUVERTURE ===
  {
    pageType: 'front-cover',
    title: 'Léo, le Gardien de Lumière',
    text: '',
    imagePrompt: 'A brave 8-year-old boy with brown hair standing on a rooftop at night, wearing a golden cape flowing in the wind, holding a glowing golden medallion, city skyline behind him with dramatic dark clouds, golden light emanating from the medallion illuminating the scene, epic superhero pose, cinematic lighting, children book illustration style, vibrant colors',
    ambiance: 'nuit',
    voiceType: 'narratrice',
  },

  // === SCÈNE 1 : VIE NORMALE ===
  {
    pageType: 'content',
    title: 'Un garçon comme les autres',
    text: 'Léo avait huit ans et vivait dans une petite ville tranquille. À l\'école, il était plutôt discret. Il aimait dessiner des super-héros dans son cahier et rêvait d\'aventures extraordinaires. Mais pour l\'instant, sa plus grande aventure, c\'était de rentrer à pied tout seul.',
    imagePrompt: 'A shy 8-year-old boy with brown hair walking home from school on a peaceful suburban street, carrying a backpack with superhero stickers, autumn leaves falling, warm golden afternoon light, cozy neighborhood with colorful houses, children book illustration, warm watercolor style',
    ambiance: 'jour',
    voiceType: 'narratrice',
    musicTrack: '/sound/music/ambiance-tranquille.mp3',
  },

  // === SCÈNE 2 : DÉCOUVERTE ===
  {
    pageType: 'content',
    title: 'Le médaillon',
    text: 'Ce soir-là, en passant devant le vieux chêne du parc, quelque chose brilla dans les racines. Léo s\'approcha. C\'était un médaillon doré, avec un soleil gravé au centre. Quand il le toucha, une chaleur douce envahit ses doigts.',
    imagePrompt: 'An 8-year-old boy kneeling at the base of a massive old oak tree in a park at twilight, discovering a glowing golden medallion with a sun engraved on it nestled in the roots, magical golden light emanating from the medallion, fireflies around, mysterious atmosphere, children book illustration, detailed and magical',
    ambiance: 'feerique',
    voiceType: 'narratrice',
    musicTrack: '/sound/music/fe-e-rique.mp3',
    soundEffects: [
      { file: '/sound/ambiances/bruit-feerique.mp3', delay: 3 },
    ],
  },

  // === SCÈNE 3 : POUVOIR ===
  {
    pageType: 'content',
    title: 'Le pouvoir de la lumière',
    text: 'De retour dans sa chambre, le médaillon se mit à briller de plus en plus fort. Des rayons dorés jaillirent entre ses doigts ! Léo leva la main : un faisceau de lumière pure traversa la pièce. Il pouvait contrôler la lumière !',
    imagePrompt: 'An amazed 8-year-old boy in his bedroom at night, holding a brilliant golden medallion, powerful beams of golden light shooting from his hands illuminating the whole room, toys and posters visible, his face lit up with wonder and excitement, dramatic lighting, energy particles floating, superhero origin scene, children book illustration',
    ambiance: 'feerique',
    voiceType: 'narratrice',
    musicTrack: '/sound/music/superheroes/super-hero-theme.mp3',
    soundEffects: [
      { file: '/sound/effects/superheroes/energy-hum.mp3', delay: 2 },
      { file: '/sound/effects/superheroes/power-rumble.mp3', delay: 4 },
    ],
    dialogues: [
      { voice: 'jeuneGarcon', text: 'Waouh ! C\'est... c\'est incroyable !' },
    ],
  },

  // === SCÈNE 4 : MENACE ===
  {
    pageType: 'content',
    title: 'Les ténèbres',
    text: 'Le lendemain, tout bascula. Un nuage noir, épais comme de l\'encre, envahit le ciel. Les lampadaires s\'éteignirent un par un. Les écrans, les phares, les lumières des maisons — tout mourut. Une voix grondante résonna dans l\'obscurité : « La lumière m\'appartient désormais. »',
    imagePrompt: 'A city plunged into complete darkness, massive black storm clouds swirling overhead like ink, streetlights going out one by one, cars stopped with dead headlights, terrified people on the streets looking up, a menacing shadow figure visible in the clouds with glowing red eyes, dramatic and dark atmosphere, children book illustration, cinematic',
    ambiance: 'mystere',
    voiceType: 'narratrice',
    musicTrack: '/sound/music/grave-suspense.mp3',
    soundEffects: [
      { file: '/sound/ambiances/tonnerre-orage.mp3', delay: 1 },
      { file: '/sound/ambiances/sirene-ville.mp3', delay: 5 },
    ],
    dialogues: [
      { voice: 'papy', text: 'La lumière m\'appartient désormais.' },
    ],
  },

  // === SCÈNE 5 : PEUR ===
  {
    pageType: 'content',
    title: 'La peur',
    text: 'Dans les rues, les gens couraient dans tous les sens. Les enfants pleuraient, les parents cherchaient leurs familles à tâtons. L\'Ombre — c\'est comme ça que les gens l\'appelaient — semblait se nourrir de la peur. Plus les gens avaient peur, plus il faisait noir.',
    imagePrompt: 'Terrified families running through pitch-black city streets, parents holding crying children, only faint emergency lights visible, dark shadowy tendrils creeping along buildings, oppressive atmosphere, people stumbling in darkness, dramatic scene, children book illustration, dark blue and purple tones',
    ambiance: 'mystere',
    voiceType: 'narratrice',
    musicTrack: '/sound/music/superheroes/superhero-music-suspens.mp3',
    soundEffects: [
      { file: '/sound/ambiances/vent-fort.mp3', delay: 0 },
      { file: '/sound/effects/superheroes/thunder-rumble.mp3', delay: 4 },
    ],
  },

  // === SCÈNE 6 : DÉCISION ===
  {
    pageType: 'content',
    title: 'Le choix',
    text: 'Léo serra le médaillon dans sa main. Son cœur battait si fort qu\'il l\'entendait dans ses oreilles. Il avait peur, lui aussi. Mais il pensa aux enfants qui pleuraient, aux parents perdus dans le noir. Il inspira profondément.',
    imagePrompt: 'Close-up of an 8-year-old boy with determined eyes in a dark room, gripping a golden medallion tightly, the medallion casting warm light on his face, a single tear on his cheek but jaw set with determination, dramatic close-up portrait, warm golden light vs surrounding darkness, emotional moment, children book illustration',
    ambiance: 'mystere',
    voiceType: 'narratrice',
    musicTrack: '/sound/music/superheroes/superhero-music-suspens.mp3',
    soundEffects: [
      { file: '/sound/effects/superheroes/heartbeat.mp3', delay: 0 },
    ],
    dialogues: [
      { voice: 'jeuneGarcon', text: 'J\'ai peur. Mais je dois y aller. Je suis le seul qui peut faire quelque chose.' },
    ],
  },

  // === SCÈNE 7 : ENVOL ===
  {
    pageType: 'content',
    title: 'Le gardien s\'envole',
    text: 'Le médaillon explosa de lumière. Une cape dorée apparut sur ses épaules. Léo sentit ses pieds quitter le sol. Il montait ! Au-dessus des toits, au-dessus des nuages noirs. Il était le Gardien de Lumière, et la nuit n\'allait pas gagner.',
    imagePrompt: 'An 8-year-old superhero boy soaring above a dark city skyline, wearing a magnificent flowing golden cape, golden light trail behind him, breaking through dark storm clouds, the golden medallion on his chest blazing with light, epic flight scene from below angle, stars visible above the clouds, triumphant and powerful, children book illustration, dynamic composition',
    ambiance: 'nuit',
    voiceType: 'narratrice',
    musicTrack: '/sound/music/superheroes/super-hero-theme.mp3',
    soundEffects: [
      { file: '/sound/effects/superheroes/powerful-jump.mp3', delay: 1 },
      { file: '/sound/effects/superheroes/cape-swoosh.mp3', delay: 2 },
      { file: '/sound/effects/superheroes/vol-supersonique.mp3', delay: 3 },
    ],
  },

  // === SCÈNE 8 : PREMIER COMBAT ===
  {
    pageType: 'content',
    title: 'Les créatures d\'ombre',
    text: 'Des formes sombres surgirent de partout — les soldats de l\'Ombre. Ils avaient des griffes de fumée et des yeux rouges. Léo tendit les mains : des éclairs dorés jaillirent ! Les créatures hurlèrent et disparurent en fumée. Mais il en venait toujours plus.',
    imagePrompt: 'An epic battle scene with a young superhero boy shooting golden light beams from both hands at dark shadow creatures with red eyes and smoke claws, multiple creatures dissolving into smoke where the light hits them, on a dark city rooftop, explosions of golden light, dynamic action pose, intense battle, children book illustration, dramatic lighting',
    ambiance: 'orage',
    voiceType: 'narratrice',
    musicTrack: '/sound/music/superheroes/fight-music.mp3',
    soundEffects: [
      { file: '/sound/effects/superheroes/laser-shot.mp3', delay: 1 },
      { file: '/sound/effects/superheroes/explosion.mp3', delay: 2 },
      { file: '/sound/effects/superheroes/punch.mp3', delay: 4 },
      { file: '/sound/effects/superheroes/fifght-metal-clash.mp3', delay: 5 },
    ],
  },

  // === SCÈNE 9 : DÉFAITE ===
  {
    pageType: 'content',
    title: 'La chute',
    text: 'Soudain, une vague de ténèbres le frappa en pleine poitrine. Léo fut projeté en arrière, traversa un mur de fumée noire et s\'écrasa au sol. Le médaillon s\'éteignit. Dans le silence, une voix ricanait dans le noir.',
    imagePrompt: 'A young superhero boy crashed on the ground in a dark alley, his golden cape torn, the medallion on his chest dimmed and cracked, rubble around him, dark shadow tendrils closing in, the boy trying to get up but struggling, defeated hero moment, dramatic dark atmosphere, a faint flicker of gold remaining in the medallion, children book illustration, emotional',
    ambiance: 'mystere',
    voiceType: 'narratrice',
    musicTrack: '/sound/music/grave-suspense.mp3',
    soundEffects: [
      { file: '/sound/effects/superheroes/heavy-landing.mp3', delay: 1 },
      { file: '/sound/effects/superheroes/thunder-rumble.mp3', delay: 3 },
    ],
    dialogues: [
      { voice: 'papy', text: 'Tu n\'es qu\'un enfant. Tu ne peux rien contre moi.' },
    ],
  },

  // === SCÈNE 10 : DOUTE ===
  {
    pageType: 'content',
    title: 'Seul dans le noir',
    text: 'Léo resta assis dans la ruelle sombre. Le médaillon ne brillait presque plus. Les larmes coulèrent sur ses joues. Il n\'était qu\'un garçon de huit ans. Qu\'est-ce qu\'il pouvait faire contre une force pareille ?',
    imagePrompt: 'A sad 8-year-old boy sitting alone in a dark alley, knees hugged to his chest, tears on his face, the golden medallion barely glowing on the ground next to him, puddles reflecting faint light, rain falling gently, lonely and vulnerable, emotional moment of doubt, dark blue tones with tiny warm gold flicker, children book illustration',
    ambiance: 'nuit',
    voiceType: 'narratrice',
    musicTrack: '/sound/ambiances/petite-pluie.mp3',
    soundEffects: [
      { file: '/sound/effects/superheroes/wind-howl.mp3', delay: 2 },
    ],
    dialogues: [
      { voice: 'jeuneGarcon', text: 'Je ne suis qu\'un enfant... Je n\'y arriverai jamais...' },
    ],
  },

  // === SCÈNE 11 : LES AMIS ===
  {
    pageType: 'content',
    title: 'Tu n\'es pas seul',
    text: 'Des pas résonnèrent. C\'étaient Emma et Samir, ses meilleurs amis. Ils l\'avaient cherché partout. Emma lui tendit la main. « Léo, on est là. Tu n\'es pas seul. On croit en toi. » Et quelque chose de magique se produisit : le médaillon se remit à briller.',
    imagePrompt: 'Two children (a girl with red hair and a boy with dark curly hair) helping an 8-year-old superhero boy stand up in a dark alley, the girl extending her hand, warm friendship moment, the golden medallion on the ground starting to glow again with warm light, three friends together against the darkness, hope returning, warm golden light growing, children book illustration, emotional and heartwarming',
    ambiance: 'nuit',
    voiceType: 'narratrice',
    musicTrack: '/sound/music/joyeux.mp3',
    soundEffects: [
      { file: '/sound/ambiances/bruit-feerique.mp3', delay: 5 },
    ],
    dialogues: [
      { voice: 'jeuneFille', text: 'Léo, on est là. Tu n\'es pas seul. On croit en toi !' },
    ],
  },

  // === SCÈNE 12 : RETOUR EN FORCE ===
  {
    pageType: 'content',
    title: 'Plus fort que jamais',
    text: 'L\'amitié. C\'était ça, le vrai pouvoir du médaillon. Pas juste la lumière — le courage que donnent ceux qui nous aiment. Le médaillon s\'embrasa. La cape se reforma, plus brillante que jamais. Léo s\'éleva dans les airs, un soleil à lui tout seul.',
    imagePrompt: 'An 8-year-old superhero boy hovering above the ground, blazing with intense golden light like a small sun, new brilliant golden cape flowing powerfully, the medallion radiating massive beams of light in all directions, his two friends watching from below in awe, the darkness retreating from the light, power-up transformation scene, epic and triumphant, children book illustration, maximum brightness and drama',
    ambiance: 'feerique',
    voiceType: 'narratrice',
    musicTrack: '/sound/music/superheroes/super-hero-theme.mp3',
    soundEffects: [
      { file: '/sound/effects/superheroes/power-rumble.mp3', delay: 1 },
      { file: '/sound/effects/superheroes/energy-hum.mp3', delay: 2 },
      { file: '/sound/effects/superheroes/cape-swoosh.mp3', delay: 4 },
    ],
  },

  // === SCÈNE 13 : COMBAT FINAL ===
  {
    pageType: 'content',
    title: 'L\'affrontement',
    text: 'Léo fila droit vers le cœur des ténèbres. L\'Ombre l\'attendait — une silhouette gigantesque aux yeux de braise. Le combat fut titanesque. Des éclairs de lumière contre des vagues d\'obscurité. Chaque coup faisait trembler la ville entière. Mais Léo ne reculait plus.',
    imagePrompt: 'Epic final battle between a small glowing golden superhero boy and a massive dark shadow villain with burning red eyes towering over buildings, golden light beams clashing with dark energy waves creating massive shockwaves, the city below shaking, lightning and explosions of light and dark, titan clash in the sky, epic scale battle, dramatic composition, children book illustration, maximum action and drama',
    ambiance: 'orage',
    voiceType: 'narratrice',
    musicTrack: '/sound/music/superheroes/fight-music.mp3',
    soundEffects: [
      { file: '/sound/effects/superheroes/laser-shot.mp3', delay: 1 },
      { file: '/sound/effects/superheroes/explosion.mp3', delay: 2 },
      { file: '/sound/effects/superheroes/fifght-metal-clash.mp3', delay: 3 },
      { file: '/sound/effects/superheroes/tir-laser.mp3', delay: 5 },
      { file: '/sound/effects/superheroes/thunder-rumble.mp3', delay: 6 },
    ],
    dialogues: [
      { voice: 'jeuneGarcon', text: 'Tu ne fais plus peur à personne !' },
    ],
  },

  // === SCÈNE 14 : VICTOIRE ===
  {
    pageType: 'content',
    title: 'La lumière triomphe',
    text: 'Léo rassembla toute sa lumière. Tout ce qu\'il avait : le courage de ses amis, l\'amour de sa famille, la force de ne jamais abandonner. Un rayon de lumière pure traversa l\'Ombre de part en part. Le monstre poussa un cri terrible... et disparut en mille éclats de poussière noire. Le ciel s\'ouvrit. Les étoiles réapparurent.',
    imagePrompt: 'The climactic victory moment: a young superhero boy unleashing a massive beam of pure golden light from his medallion that pierces through a giant shadow monster which is disintegrating into black dust particles, the dark clouds splitting apart revealing a starry night sky, the city below bathed in returning golden light, triumphant victory scene, epic scale, sparkling particles everywhere, children book illustration, breathtaking',
    ambiance: 'feerique',
    voiceType: 'narratrice',
    musicTrack: '/sound/music/superheroes/super-hero-theme.mp3',
    soundEffects: [
      { file: '/sound/effects/superheroes/power-rumble.mp3', delay: 1 },
      { file: '/sound/effects/superheroes/laser-shot.mp3', delay: 2 },
      { file: '/sound/effects/superheroes/explosion.mp3', delay: 4 },
      { file: '/sound/effects/superheroes/victory-shout.mp3', delay: 6 },
      { file: '/sound/effects/superheroes/crowd-cheer.mp3', delay: 7 },
    ],
  },

  // === SCÈNE 15 : RETOUR AU CALME ===
  {
    pageType: 'content',
    title: 'Le héros discret',
    text: 'Les lumières de la ville se rallumèrent une à une, comme des lucioles. Les gens sortirent de chez eux, souriant, applaudissant sans savoir pourquoi. Et Léo ? Il se posa discrètement sur le toit de sa maison, retira sa cape et rentra par la fenêtre. Sa maman l\'appela pour le dîner. Il sourit. Le médaillon brillait doucement sous son t-shirt.',
    imagePrompt: 'A peaceful city at night with lights turning back on one by one like fireflies, warm glow from windows, happy people in the streets celebrating, and on a rooftop a small boy silhouette with a golden cape gently landing, removing his cape, warm and peaceful atmosphere, golden and blue tones, the medallion glowing softly under his shirt, poetic ending scene, children book illustration, cozy and hopeful',
    ambiance: 'nuit',
    voiceType: 'narratrice',
    musicTrack: '/sound/music/conte-fee-suspense.mp3',
    soundEffects: [
      { file: '/sound/ambiances/applaudissements-foule.mp3', delay: 3 },
    ],
  },

  // === COUVERTURE ARRIÈRE ===
  {
    pageType: 'back-cover',
    text: 'Parfois, les vrais héros ne portent pas de cape. Ils portent un cartable.',
    imagePrompt: 'A simple golden medallion with a sun engraved on it lying on an open school notebook with superhero doodles, warm afternoon sunlight through a window, pencils and erasers around, cozy and nostalgic, the medallion glowing faintly, children book illustration, warm tones, simple and beautiful composition',
    ambiance: 'jour',
    voiceType: 'narratrice',
  },
]

// ============================================================================
// FONCTIONS DE GÉNÉRATION
// ============================================================================

async function generateImage(prompt: string): Promise<string | null> {
  try {
    const submitResponse = await fetch('https://queue.fal.run/fal-ai/nano-banana-pro', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: '1:1',
        num_images: 1,
        output_format: 'png',
        resolution: '2K',
      }),
    })

    if (!submitResponse.ok) {
      throw new Error(`Submit failed: ${submitResponse.status} ${await submitResponse.text()}`)
    }

    const { request_id: jobId } = await submitResponse.json()
    console.log(`   ⏳ Job ${jobId}`)

    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 3000))

      const statusResponse = await fetch(
        `https://queue.fal.run/fal-ai/nano-banana-pro/requests/${jobId}/status`,
        { headers: { 'Authorization': `Key ${FAL_API_KEY}` } }
      )
      const status = await statusResponse.json()

      if (status.status === 'COMPLETED') {
        const resultResponse = await fetch(
          `https://queue.fal.run/fal-ai/nano-banana-pro/requests/${jobId}`,
          { headers: { 'Authorization': `Key ${FAL_API_KEY}` } }
        )
        const result = await resultResponse.json()
        if (!result?.images?.[0]?.url) throw new Error('Pas d\'image')

        // Download and upload to Supabase
        const imageResponse = await fetch(result.images[0].url)
        const buffer = Buffer.from(await imageResponse.arrayBuffer())
        return await uploadToStorage(buffer, 'images', `stories/superhero/${randomUUID()}.png`, 'image/png')
      }

      if (status.status === 'FAILED') throw new Error(`Job failed`)
      if (i % 5 === 0) process.stdout.write('.')
    }
    throw new Error('Timeout')
  } catch (error) {
    console.error(`   ❌ Image:`, error)
    return null
  }
}

async function generateNarration(text: string, voiceId: string): Promise<{ url: string | null; duration: number }> {
  try {
    // Call ElevenLabs directly (returns raw audio/mpeg)
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.78,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ElevenLabs ${response.status}: ${errorText}`)
    }

    // Response is raw audio buffer
    const buffer = Buffer.from(await response.arrayBuffer())
    const url = await uploadToStorage(buffer, 'audio', `stories/superhero/${randomUUID()}.mp3`, 'audio/mpeg')

    // Estimate duration (~150 words/min for French narration)
    const wordCount = text.split(/\s+/).length
    const duration = Math.max(3, (wordCount / 150) * 60)

    return { url, duration }
  } catch (error) {
    console.error(`   ❌ Narration:`, error)
    const wordCount = text.split(/\s+/).length
    return { url: null, duration: Math.max(3, (wordCount / 150) * 60) }
  }
}

async function uploadToStorage(buffer: Buffer, bucket: string, path: string, contentType: string): Promise<string | null> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: true })

  if (error) {
    console.error(`   ❌ Upload ${bucket}/${path}:`, error)
    return null
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  return urlData.publicUrl
}

// ============================================================================
// ASSEMBLAGE DU LIVRE
// ============================================================================

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗')
  console.log('║  CRÉATION : Léo, le Gardien de Lumière               ║')
  console.log('║  15 scènes • Superhéro • ~10 minutes                 ║')
  console.log('╚═══════════════════════════════════════════════════════╝\n')

  const storyId = randomUUID()
  const pages: any[] = []
  const montageScenes: any[] = []

  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i]
    const pageId = randomUUID()
    const pageNumber = i + 1

    console.log(`\n📖 Scène ${pageNumber}/${SCENES.length}: ${scene.title || scene.pageType}`)

    // 1. Générer l'image
    console.log('   🎨 Génération image...')
    const imageUrl = await generateImage(scene.imagePrompt)
    if (imageUrl) console.log('   ✅ Image OK')

    // 2. Générer la narration principale
    let mainNarration: { url: string | null; duration: number } = { url: null, duration: 5 }
    if (scene.text) {
      console.log('   🎤 Génération narration...')
      mainNarration = await generateNarration(scene.text, VOICES[scene.voiceType])
      if (mainNarration.url) console.log(`   ✅ Narration OK (${mainNarration.duration.toFixed(1)}s)`)
    }

    // 3. Générer les dialogues
    const dialogueAudios: { url: string | null; duration: number; text: string; voice: string }[] = []
    if (scene.dialogues) {
      for (const dialogue of scene.dialogues) {
        console.log(`   🗣️  Dialogue (${dialogue.voice}): "${dialogue.text.substring(0, 40)}..."`)
        const audio = await generateNarration(dialogue.text, VOICES[dialogue.voice])
        dialogueAudios.push({ ...audio, text: dialogue.text, voice: dialogue.voice })
        if (audio.url) console.log(`   ✅ Dialogue OK`)
      }
    }

    // 4. Calculer la durée totale de la scène
    const narratorDuration = mainNarration.duration
    const dialogueDuration = dialogueAudios.reduce((acc, d) => acc + d.duration + 1, 0) // +1s gap
    const introDuration = 3 // 3s d'intro avec musique seule
    const outroDuration = 2 // 2s de sortie
    const totalDuration = introDuration + narratorDuration + dialogueDuration + outroDuration

    // 5. Construire la page story_pages
    pages.push({
      id: pageId,
      story_id: storyId,
      page_number: pageNumber,
      title: scene.title || null,
      text_blocks: scene.text ? [{
        content: scene.text,
        style: {
          fontFamily: 'Georgia',
          fontSize: 18,
          color: '#1a1a2e',
          textAlign: 'left' as const,
          lineSpacing: 'relaxed' as const,
        }
      }] : [],
      media_layers: {
        images: [],
        decorations: [],
        textBoxes: scene.title && scene.pageType === 'content' ? [{
          id: randomUUID(),
          content: scene.title,
          position: { x: 5, y: 3, width: 90, height: 8 },
          style: {
            fontFamily: 'Georgia',
            fontSize: 24,
            color: '#D4AF37',
            textAlign: 'center' as const,
            isBold: true,
            backgroundColor: 'rgba(0,0,0,0.3)',
            backgroundOpacity: 0.3,
          },
          zIndex: 10,
        }] : [],
        pageType: scene.pageType,
        backgroundMedia: imageUrl ? {
          url: imageUrl,
          type: 'image' as const,
          opacity: 1,
        } : null,
      },
      background_image_url: imageUrl,
      ambiance: scene.ambiance,
      light_color: scene.ambiance === 'nuit' ? '#4169E1' :
                   scene.ambiance === 'feerique' ? '#FFD700' :
                   scene.ambiance === 'orage' ? '#4B0082' :
                   scene.ambiance === 'mystere' ? '#2F1B41' : '#FFE4B5',
      light_intensity: 80,
    })

    // 6. Construire la scène montage
    const narrationPhrases = scene.text
      ? scene.text.split(/(?<=[.!?])\s+/).filter(p => p.trim()).map((phrase, idx, arr) => {
          const phraseWordCount = phrase.split(/\s+/).length
          const phraseDuration = Math.max(2, (phraseWordCount / 150) * 60)
          const prevEnd = idx === 0 ? introDuration : 0 // calculated below
          return {
            id: randomUUID(),
            text: phrase.trim(),
            index: idx,
            timeRange: { startTime: 0, endTime: phraseDuration }, // will be recalculated
            style: {
              position: 'bottom',
              fontSize: 'large',
              color: '#FFFFFF',
              animation: 'fade',
            },
            voiceType: 'narrator',
          }
        })
      : []

    // Recalculate phrase timings sequentially
    let currentTime = introDuration
    for (const phrase of narrationPhrases) {
      const dur = phrase.timeRange.endTime
      phrase.timeRange = { startTime: currentTime, endTime: currentTime + dur }
      currentTime += dur + 0.3 // small gap
    }

    // Music tracks with ducking
    const musicTracks: any[] = []
    if (scene.musicTrack) {
      musicTracks.push({
        id: randomUUID(),
        url: scene.musicTrack,
        type: 'background',
        volume: 0.25, // Low volume during narration (ducking)
        timeRange: { startTime: 0, endTime: totalDuration },
        fadeIn: 2,
        fadeOut: 2,
        loop: true,
      })
    }

    // Sound effect tracks
    const soundTracks: any[] = []
    if (scene.soundEffects) {
      for (const sfx of scene.soundEffects) {
        soundTracks.push({
          id: randomUUID(),
          url: sfx.file,
          type: 'sfx',
          volume: 0.6,
          timeRange: { startTime: sfx.delay, endTime: sfx.delay + 3 },
          loop: false,
        })
      }
    }

    montageScenes.push({
      id: randomUUID(),
      bookPageId: pageId,
      title: scene.title || `Scène ${pageNumber}`,
      text: scene.text,
      phrases: scene.text ? scene.text.split(/(?<=[.!?])\s+/).filter(p => p.trim()) : [],
      duration: totalDuration,
      introDuration,
      outroDuration,
      narrationZoneDuration: totalDuration,
      narration: {
        id: randomUUID(),
        audioUrl: mainNarration.url,
        source: 'tts',
        ttsVoice: VOICES[scene.voiceType],
        duration: narratorDuration,
        phrases: narrationPhrases,
        isSynced: true,
        volume: 1.0,
      },
      mediaTracks: imageUrl ? [{
        id: randomUUID(),
        type: 'image',
        url: imageUrl,
        name: scene.title || 'Background',
        timeRange: { startTime: 0, endTime: totalDuration },
        position: { x: 0, y: 0, width: 100, height: 100 },
        zIndex: 0,
        opacity: 1,
        fadeIn: 1,
        fadeOut: 1,
      }] : [],
      musicTracks,
      soundTracks,
      lightTracks: [],
      decorationTracks: [],
      animationTracks: [],
      textEffectTracks: [],
    })

    // Pause between API calls
    await new Promise(r => setTimeout(r, 500))
  }

  // ============================================================================
  // SAUVEGARDE EN BASE
  // ============================================================================

  console.log('\n\n💾 Sauvegarde en base...')

  // 1. Créer l'histoire
  const { error: storyError } = await supabase.from('stories').upsert({
    id: storyId,
    profile_id: PROFILE_ID,
    title: STORY_TITLE,
    author: AUTHOR_NAME,
    status: 'completed',
    total_pages: SCENES.length,
    current_page: 1,
    metadata: {
      structure: 'hero-journey',
      bookFormat: BOOK_FORMAT,
      chapters: [],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (storyError) {
    console.error('❌ Erreur story:', storyError)
    return
  }
  console.log('   ✅ Story créée:', storyId)

  // 2. Supprimer les anciennes pages puis insérer les nouvelles
  await supabase.from('story_pages').delete().eq('story_id', storyId)

  const { error: pagesError } = await supabase.from('story_pages').insert(pages)
  if (pagesError) {
    console.error('❌ Erreur pages:', pagesError)
    return
  }
  console.log(`   ✅ ${pages.length} pages créées`)

  // 3. Créer le projet de montage
  const montageId = randomUUID()
  const { error: montageError } = await supabase.from('montage_projects').upsert({
    id: montageId,
    profile_id: PROFILE_ID,
    story_id: storyId,
    title: STORY_TITLE,
    scenes: montageScenes,
    is_complete: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (montageError) {
    console.error('❌ Erreur montage:', montageError)
    // Non bloquant — le livre est quand même créé
  } else {
    console.log('   ✅ Montage créé:', montageId)
  }

  // Résumé
  const totalDuration = montageScenes.reduce((acc: number, s: any) => acc + s.duration, 0)
  console.log('\n' + '═'.repeat(55))
  console.log(`✅ TERMINÉ !`)
  console.log(`   📖 "${STORY_TITLE}"`)
  console.log(`   📄 ${pages.length} pages`)
  console.log(`   ⏱️  ${Math.floor(totalDuration / 60)}min ${Math.floor(totalDuration % 60)}s`)
  console.log(`   🎨 ${pages.filter(p => p.background_image_url).length} images`)
  console.log(`   🎤 ${montageScenes.filter((s: any) => s.narration.audioUrl).length} narrations`)
  console.log(`   🎵 ${montageScenes.filter((s: any) => s.musicTracks.length > 0).length} pistes musicales`)
  console.log(`   💥 ${montageScenes.reduce((acc: number, s: any) => acc + s.soundTracks.length, 0)} bruitages`)
  console.log(`   🆔 Story ID: ${storyId}`)
  console.log('')
}

main().catch(console.error)
