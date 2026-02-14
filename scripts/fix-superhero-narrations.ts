#!/usr/bin/env npx tsx
/**
 * Corrige les narrations manquantes de l'histoire superhéro
 * Appelle ElevenLabs directement et met à jour le montage
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!

if (!ELEVENLABS_API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY manquante!')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const STORY_ID = '0eacc6f8-1ffe-4416-97e3-73327c5e64a7'

const VOICES: Record<string, string> = {
  narratrice: 'F1toM6PcP54s45kOOAyV',   // Mademoiselle French - Conversational
  jeuneGarcon: 'FvmvwvObRqIHojkEGh5N',  // Adolescente française (Chicadi) - voix jeune
  jeuneFille: 'QbsdzCokdlo98elkq4Pc',   // Mademoiselle French - Elearning
  papy: 'nr2EGJNe96rzn9FRlTId',         // Yann - voix masculine (L'Ombre)
}

// Textes et voix par scène (même ordre que la création)
const SCENE_DATA = [
  // Scène 1: couverture - pas de narration
  { text: '', voice: 'narratrice' },
  // Scène 2
  { text: 'Léo avait huit ans et vivait dans une petite ville tranquille. À l\'école, il était plutôt discret. Il aimait dessiner des super-héros dans son cahier et rêvait d\'aventures extraordinaires. Mais pour l\'instant, sa plus grande aventure, c\'était de rentrer à pied tout seul.', voice: 'narratrice' },
  // Scène 3
  { text: 'Ce soir-là, en passant devant le vieux chêne du parc, quelque chose brilla dans les racines. Léo s\'approcha. C\'était un médaillon doré, avec un soleil gravé au centre. Quand il le toucha, une chaleur douce envahit ses doigts.', voice: 'narratrice' },
  // Scène 4
  { text: 'De retour dans sa chambre, le médaillon se mit à briller de plus en plus fort. Des rayons dorés jaillirent entre ses doigts ! Léo leva la main : un faisceau de lumière pure traversa la pièce. Il pouvait contrôler la lumière !', voice: 'narratrice',
    dialogues: [{ voice: 'jeuneGarcon', text: 'Waouh ! C\'est... c\'est incroyable !' }] },
  // Scène 5
  { text: 'Le lendemain, tout bascula. Un nuage noir, épais comme de l\'encre, envahit le ciel. Les lampadaires s\'éteignirent un par un. Les écrans, les phares, les lumières des maisons — tout mourut. Une voix grondante résonna dans l\'obscurité : « La lumière m\'appartient désormais. »', voice: 'narratrice',
    dialogues: [{ voice: 'papy', text: 'La lumière m\'appartient désormais.' }] },
  // Scène 6
  { text: 'Dans les rues, les gens couraient dans tous les sens. Les enfants pleuraient, les parents cherchaient leurs familles à tâtons. L\'Ombre — c\'est comme ça que les gens l\'appelaient — semblait se nourrir de la peur. Plus les gens avaient peur, plus il faisait noir.', voice: 'narratrice' },
  // Scène 7
  { text: 'Léo serra le médaillon dans sa main. Son cœur battait si fort qu\'il l\'entendait dans ses oreilles. Il avait peur, lui aussi. Mais il pensa aux enfants qui pleuraient, aux parents perdus dans le noir. Il inspira profondément.', voice: 'narratrice',
    dialogues: [{ voice: 'jeuneGarcon', text: 'J\'ai peur. Mais je dois y aller. Je suis le seul qui peut faire quelque chose.' }] },
  // Scène 8
  { text: 'Le médaillon explosa de lumière. Une cape dorée apparut sur ses épaules. Léo sentit ses pieds quitter le sol. Il montait ! Au-dessus des toits, au-dessus des nuages noirs. Il était le Gardien de Lumière, et la nuit n\'allait pas gagner.', voice: 'narratrice' },
  // Scène 9
  { text: 'Des formes sombres surgirent de partout — les soldats de l\'Ombre. Ils avaient des griffes de fumée et des yeux rouges. Léo tendit les mains : des éclairs dorés jaillirent ! Les créatures hurlèrent et disparurent en fumée. Mais il en venait toujours plus.', voice: 'narratrice' },
  // Scène 10
  { text: 'Soudain, une vague de ténèbres le frappa en pleine poitrine. Léo fut projeté en arrière, traversa un mur de fumée noire et s\'écrasa au sol. Le médaillon s\'éteignit. Dans le silence, une voix ricanait dans le noir.', voice: 'narratrice',
    dialogues: [{ voice: 'papy', text: 'Tu n\'es qu\'un enfant. Tu ne peux rien contre moi.' }] },
  // Scène 11
  { text: 'Léo resta assis dans la ruelle sombre. Le médaillon ne brillait presque plus. Les larmes coulèrent sur ses joues. Il n\'était qu\'un garçon de huit ans. Qu\'est-ce qu\'il pouvait faire contre une force pareille ?', voice: 'narratrice',
    dialogues: [{ voice: 'jeuneGarcon', text: 'Je ne suis qu\'un enfant... Je n\'y arriverai jamais...' }] },
  // Scène 12
  { text: 'Des pas résonnèrent. C\'étaient Emma et Samir, ses meilleurs amis. Ils l\'avaient cherché partout. Emma lui tendit la main. « Léo, on est là. Tu n\'es pas seul. On croit en toi. » Et quelque chose de magique se produisit : le médaillon se remit à briller.', voice: 'narratrice',
    dialogues: [{ voice: 'jeuneFille', text: 'Léo, on est là. Tu n\'es pas seul. On croit en toi !' }] },
  // Scène 13
  { text: 'L\'amitié. C\'était ça, le vrai pouvoir du médaillon. Pas juste la lumière — le courage que donnent ceux qui nous aiment. Le médaillon s\'embrasa. La cape se reforma, plus brillante que jamais. Léo s\'éleva dans les airs, un soleil à lui tout seul.', voice: 'narratrice' },
  // Scène 14
  { text: 'Léo fila droit vers le cœur des ténèbres. L\'Ombre l\'attendait — une silhouette gigantesque aux yeux de braise. Le combat fut titanesque. Des éclairs de lumière contre des vagues d\'obscurité. Chaque coup faisait trembler la ville entière. Mais Léo ne reculait plus.', voice: 'narratrice',
    dialogues: [{ voice: 'jeuneGarcon', text: 'Tu ne fais plus peur à personne !' }] },
  // Scène 15
  { text: 'Léo rassembla toute sa lumière. Tout ce qu\'il avait : le courage de ses amis, l\'amour de sa famille, la force de ne jamais abandonner. Un rayon de lumière pure traversa l\'Ombre de part en part. Le monstre poussa un cri terrible... et disparut en mille éclats de poussière noire. Le ciel s\'ouvrit. Les étoiles réapparurent.', voice: 'narratrice' },
  // Scène 16
  { text: 'Les lumières de la ville se rallumèrent une à une, comme des lucioles. Les gens sortirent de chez eux, souriant, applaudissant sans savoir pourquoi. Et Léo ? Il se posa discrètement sur le toit de sa maison, retira sa cape et rentra par la fenêtre. Sa maman l\'appela pour le dîner. Il sourit. Le médaillon brillait doucement sous son t-shirt.', voice: 'narratrice' },
  // Scène 17: back-cover
  { text: 'Parfois, les vrais héros ne portent pas de cape. Ils portent un cartable.', voice: 'narratrice' },
]

async function generateNarration(text: string, voiceId: string): Promise<Buffer | null> {
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
    const err = await response.text()
    throw new Error(`ElevenLabs ${response.status}: ${err.substring(0, 200)}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

async function uploadAudio(buffer: Buffer, filename: string): Promise<string | null> {
  const path = `stories/superhero/${filename}`
  const { error } = await supabase.storage
    .from('audio')
    .upload(path, buffer, { contentType: 'audio/mpeg', upsert: true })

  if (error) {
    console.error(`   ❌ Upload:`, error.message)
    return null
  }

  const { data } = supabase.storage.from('audio').getPublicUrl(path)
  return data.publicUrl
}

async function main() {
  console.log('🎤 Génération des narrations pour "Léo, le Gardien de Lumière"\n')

  // 1. Charger le montage existant
  const { data: montage } = await supabase
    .from('montage_projects')
    .select('id, scenes')
    .eq('story_id', STORY_ID)
    .single()

  if (!montage) {
    console.error('❌ Montage non trouvé pour', STORY_ID)
    return
  }

  const scenes = Array.isArray(montage.scenes) ? montage.scenes : montage.scenes.scenes
  let totalAudios = 0
  let totalDialogues = 0

  for (let i = 0; i < SCENE_DATA.length; i++) {
    const sceneData = SCENE_DATA[i]
    if (!sceneData.text) {
      console.log(`⏭️  Scène ${i + 1}: pas de texte`)
      continue
    }

    console.log(`\n📖 Scène ${i + 1}: "${sceneData.text.substring(0, 50)}..."`)

    // Narration principale
    try {
      console.log(`   🎤 Narration (${sceneData.voice})...`)
      const buffer = await generateNarration(sceneData.text, VOICES[sceneData.voice])
      if (buffer) {
        const url = await uploadAudio(buffer, `narration-${i + 1}-${randomUUID().substring(0, 8)}.mp3`)
        if (url && scenes[i]) {
          scenes[i].narration.audioUrl = url
          console.log(`   ✅ Narration OK`)
          totalAudios++
        }
      }
    } catch (error: any) {
      console.error(`   ❌ Narration:`, error.message)
    }

    // Dialogues
    if (sceneData.dialogues) {
      for (const dialogue of sceneData.dialogues) {
        try {
          console.log(`   🗣️  Dialogue (${dialogue.voice}): "${dialogue.text.substring(0, 40)}..."`)
          const buffer = await generateNarration(dialogue.text, VOICES[dialogue.voice])
          if (buffer) {
            const url = await uploadAudio(buffer, `dialogue-${i + 1}-${randomUUID().substring(0, 8)}.mp3`)
            if (url) {
              console.log(`   ✅ Dialogue OK`)
              totalDialogues++
              // TODO: ajouter comme piste audio supplémentaire dans le montage
            }
          }
        } catch (error: any) {
          console.error(`   ❌ Dialogue:`, error.message)
        }
      }
    }

    // Pause pour éviter le rate limiting
    await new Promise(r => setTimeout(r, 500))
  }

  // 2. Mettre à jour le montage
  console.log('\n💾 Mise à jour du montage...')
  const { error } = await supabase
    .from('montage_projects')
    .update({
      scenes: scenes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', montage.id)

  if (error) {
    console.error('❌ Erreur mise à jour montage:', error)
  } else {
    console.log('✅ Montage mis à jour')
  }

  console.log(`\n═══════════════════════════════════════`)
  console.log(`✅ ${totalAudios} narrations générées`)
  console.log(`✅ ${totalDialogues} dialogues générés`)
}

main().catch(console.error)
