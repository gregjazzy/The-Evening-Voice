#!/usr/bin/env npx tsx
/**
 * Script de génération des images pour le mode Défis
 * 
 * Usage: npx tsx scripts/generate-challenge-images.ts
 * 
 * Ce script :
 * 1. Génère 3 variantes d'images pour chaque défi
 * 2. Les uploade dans Supabase Storage (bucket "images/challenges")
 * 3. Crée un fichier JSON avec les URLs des images
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { fal } from '@fal-ai/client'

// Charger .env.local
config({ path: '.env.local' })

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const FAL_API_KEY = process.env.FAL_API_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variables Supabase manquantes!')
  process.exit(1)
}

if (!FAL_API_KEY) {
  console.error('❌ FAL_API_KEY manquante!')
  process.exit(1)
}

// Configurer fal.ai
fal.config({ credentials: FAL_API_KEY })

// Client admin Supabase
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// 1 seule image par défi (pas de variantes quasi-identiques)
const VARIANTS_PER_CHALLENGE = 1

// ============================================================================
// DÉFINITION DES DÉFIS (même que dans ChallengeMode.tsx)
// ============================================================================

interface ChallengeData {
  id: string
  type: 'reproduce' | 'variations'
  difficulty: number
  targetPrompt: string
}

const CHALLENGES: ChallengeData[] = [
  // ========== Reproduce - Niveau 1 ==========
  { id: 'reproduce-1-apple', type: 'reproduce', difficulty: 1, targetPrompt: 'A red apple with a green leaf on a wooden table, sunlight from window, watercolor style' },
  { id: 'reproduce-1-star', type: 'reproduce', difficulty: 1, targetPrompt: 'A golden shooting star crossing a purple night sky above snowy mountains, magical atmosphere' },
  { id: 'reproduce-1-rainbow', type: 'reproduce', difficulty: 1, targetPrompt: 'A rainbow arching over a green meadow with wildflowers and a small cottage, sunny day, Studio Ghibli style' },
  { id: 'reproduce-1-butterfly', type: 'reproduce', difficulty: 1, targetPrompt: 'A colorful butterfly with blue and orange wings sitting on a pink flower, garden background, soft focus' },
  { id: 'reproduce-1-moon', type: 'reproduce', difficulty: 1, targetPrompt: 'A big bright full moon reflecting on a calm ocean at night, stars in the sky, peaceful and dreamy' },

  // ========== Reproduce - Niveau 2 ==========
  { id: 'reproduce-2-cat', type: 'reproduce', difficulty: 2, targetPrompt: 'An orange tabby cat sleeping on a cozy red armchair by a fireplace, warm lighting, oil painting style' },
  { id: 'reproduce-2-robot', type: 'reproduce', difficulty: 2, targetPrompt: 'A small friendly robot watering flowers in a garden, morning dew, pastel colors, children book illustration' },
  { id: 'reproduce-2-teddy', type: 'reproduce', difficulty: 2, targetPrompt: 'A brown teddy bear having a tea party with toy friends on a picnic blanket in a sunny park' },
  { id: 'reproduce-2-penguin', type: 'reproduce', difficulty: 2, targetPrompt: 'A cute penguin wearing a red scarf standing on an icy shore, snowflakes falling, cartoon illustration style' },
  { id: 'reproduce-2-owl', type: 'reproduce', difficulty: 2, targetPrompt: 'A wise brown owl sitting on a tree branch at night, big yellow eyes glowing, full moon behind, storybook style' },

  // ========== Reproduce - Niveau 3 ==========
  { id: 'reproduce-3-castle', type: 'reproduce', difficulty: 3, targetPrompt: 'A medieval stone castle on a green hill at sunset, golden sky, fantasy illustration style' },
  { id: 'reproduce-3-boat', type: 'reproduce', difficulty: 3, targetPrompt: 'A small wooden boat on a calm lake surrounded by mountains, morning mist, peaceful scene' },
  { id: 'reproduce-3-treehouse', type: 'reproduce', difficulty: 3, targetPrompt: 'A cozy treehouse with round windows and a rope ladder, autumn forest, warm lighting' },
  { id: 'reproduce-3-market', type: 'reproduce', difficulty: 3, targetPrompt: 'A colorful outdoor market with fruit stalls and flower baskets, cobblestone street, sunny Mediterranean village' },
  { id: 'reproduce-3-lighthouse', type: 'reproduce', difficulty: 3, targetPrompt: 'A red and white striped lighthouse on a rocky cliff, waves crashing below, dramatic cloudy sky, oil painting style' },

  // ========== Reproduce - Niveau 4 ==========
  { id: 'reproduce-4-forest', type: 'reproduce', difficulty: 4, targetPrompt: 'A mysterious foggy forest with rays of golden sunlight breaking through tall trees, magical atmosphere, digital painting' },
  { id: 'reproduce-4-underwater', type: 'reproduce', difficulty: 4, targetPrompt: 'An underwater coral reef scene with colorful tropical fish, light rays from above, serene blue tones' },
  { id: 'reproduce-4-aurora', type: 'reproduce', difficulty: 4, targetPrompt: 'A northern lights display over a snowy mountain landscape, green and purple aurora, starry night sky' },
  { id: 'reproduce-4-volcano', type: 'reproduce', difficulty: 4, targetPrompt: 'A volcano erupting at night with glowing lava flowing down into the dark sea, red and orange sky, dramatic and powerful scene' },
  { id: 'reproduce-4-lanterns', type: 'reproduce', difficulty: 4, targetPrompt: 'Hundreds of glowing paper lanterns floating into a dark night sky above a calm river, warm orange light reflecting on water, magical festival scene' },

  // ========== Reproduce - Niveau 5 ==========
  { id: 'reproduce-5-dragon', type: 'reproduce', difficulty: 5, targetPrompt: 'A majestic blue dragon with iridescent scales perched on a cliff overlooking a vast kingdom at dawn, epic fantasy art, highly detailed' },
  { id: 'reproduce-5-airship', type: 'reproduce', difficulty: 5, targetPrompt: 'A steampunk airship flying through clouds at sunset, brass and copper details, propellers and balloons, Victorian fantasy style' },
  { id: 'reproduce-5-library', type: 'reproduce', difficulty: 5, targetPrompt: 'An ancient magical library with floating books, spiral staircases, glowing crystals, and a wise owl perched on a globe, fantasy art' },
  { id: 'reproduce-5-clocktower', type: 'reproduce', difficulty: 5, targetPrompt: 'A giant clockwork tower in a fantasy city, massive gears and cogs visible, tiny people on bridges between buildings, warm bronze and gold tones, steampunk illustration' },
  { id: 'reproduce-5-crystal', type: 'reproduce', difficulty: 5, targetPrompt: 'An ice palace made entirely of blue crystal in a frozen valley, northern lights reflecting on crystalline walls, intricate frost patterns, fantasy art, highly detailed' },

  // ========== Variations - Niveau 1 ==========
  { id: 'variations-1-balloon', type: 'variations', difficulty: 1, targetPrompt: 'A single red balloon floating in a bright blue sky, simple illustration' },
  { id: 'variations-1-car', type: 'variations', difficulty: 1, targetPrompt: 'A small blue car parked on a street, sunny day, cartoon style' },
  { id: 'variations-1-flower', type: 'variations', difficulty: 1, targetPrompt: 'A big yellow sunflower in a garden, blue sky, simple and bright' },
  { id: 'variations-1-hat', type: 'variations', difficulty: 1, targetPrompt: 'A cute white cat wearing a small red hat, sitting, simple illustration' },

  // ========== Variations - Niveau 2 ==========
  { id: 'variations-2-cottage', type: 'variations', difficulty: 2, targetPrompt: 'A cozy cottage in a flower meadow, sunny summer day, watercolor style' },
  { id: 'variations-2-dog', type: 'variations', difficulty: 2, targetPrompt: 'A happy golden retriever dog running in a park, realistic photo' },
  { id: 'variations-2-snowman', type: 'variations', difficulty: 2, targetPrompt: 'A snowman with a top hat and carrot nose in a snowy garden, daytime, cheerful' },
  { id: 'variations-2-fish', type: 'variations', difficulty: 2, targetPrompt: 'A bright orange clownfish swimming in blue water, simple underwater scene' },

  // ========== Variations - Niveau 3 ==========
  { id: 'variations-3-knight', type: 'variations', difficulty: 3, targetPrompt: 'A knight in shining silver armor holding a sword, realistic medieval style' },
  { id: 'variations-3-pizza', type: 'variations', difficulty: 3, targetPrompt: 'A slice of pepperoni pizza on a plate, food photography style' },
  { id: 'variations-3-rocket', type: 'variations', difficulty: 3, targetPrompt: 'A colorful rocket ship flying through space with stars, realistic digital art' },
  { id: 'variations-3-cat', type: 'variations', difficulty: 3, targetPrompt: 'An orange cat sitting on a windowsill looking outside, sunny day, photograph' },

  // ========== Variations - Niveau 4 ==========
  { id: 'variations-4-city', type: 'variations', difficulty: 4, targetPrompt: 'A futuristic city skyline at night, bright neon lights, cyberpunk style, optimistic atmosphere' },
  { id: 'variations-4-garden', type: 'variations', difficulty: 4, targetPrompt: 'A serene Japanese garden with a red bridge over a koi pond, spring cherry blossoms' },
  { id: 'variations-4-ship', type: 'variations', difficulty: 4, targetPrompt: 'A pirate ship sailing on calm turquoise water, sunny day, adventure illustration' },
  { id: 'variations-4-train', type: 'variations', difficulty: 4, targetPrompt: 'A red steam train crossing a bridge in a green countryside, summer day, cheerful atmosphere' },

  // ========== Variations - Niveau 5 ==========
  { id: 'variations-5-fairy', type: 'variations', difficulty: 5, targetPrompt: 'A magical fairy sitting on a mushroom in an enchanted forest, soft glowing light, fantasy illustration' },
  { id: 'variations-5-castle', type: 'variations', difficulty: 5, targetPrompt: 'A medieval castle on a hilltop surrounded by green fields, sunny day, fantasy illustration' },
  { id: 'variations-5-forest', type: 'variations', difficulty: 5, targetPrompt: 'A dark enchanted forest with glowing mushrooms on the ground, mysterious night scene, fantasy art' },
  { id: 'variations-5-phoenix', type: 'variations', difficulty: 5, targetPrompt: 'A majestic red phoenix bird with fiery wings flying over a volcano, dramatic sunset, epic fantasy art' },
]

// ============================================================================
// FONCTIONS
// ============================================================================

async function generateImage(prompt: string): Promise<Buffer | null> {
  try {
    console.log(`   🎨 Génération avec nano-banana-pro...`)

    // Submit job via REST API (same model as production)
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
    console.log(`   ⏳ Job ${jobId} soumis, polling...`)

    // Poll for completion
    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000))

      const statusResponse = await fetch(
        `https://queue.fal.run/fal-ai/nano-banana-pro/requests/${jobId}/status`,
        { headers: { 'Authorization': `Key ${FAL_API_KEY}` } }
      )
      const status = await statusResponse.json()

      if (status.status === 'COMPLETED') {
        // Get result
        const resultResponse = await fetch(
          `https://queue.fal.run/fal-ai/nano-banana-pro/requests/${jobId}`,
          { headers: { 'Authorization': `Key ${FAL_API_KEY}` } }
        )
        const result = await resultResponse.json()

        if (!result?.images?.[0]?.url) {
          throw new Error('Pas d\'image dans le résultat')
        }

        // Download image
        const imageResponse = await fetch(result.images[0].url)
        const arrayBuffer = await imageResponse.arrayBuffer()
        return Buffer.from(arrayBuffer)
      }

      if (status.status === 'FAILED') {
        throw new Error(`Job failed: ${JSON.stringify(status)}`)
      }

      if (i % 5 === 0) console.log(`   ... ${status.status}`)
    }

    throw new Error('Timeout après 2 minutes')
  } catch (error) {
    console.error(`   ❌ Erreur génération:`, error)
    return null
  }
}

async function uploadToSupabase(buffer: Buffer, path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('images')
      .upload(path, buffer, {
        contentType: 'image/png',
        upsert: true,
      })
    
    if (error) throw error
    
    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(path)
    
    return urlData.publicUrl
  } catch (error) {
    console.error(`   ❌ Erreur upload:`, error)
    return null
  }
}

async function imageExists(challengeId: string): Promise<boolean> {
  const path = `challenges/${challengeId}/variant-1.png`
  const { data } = supabase.storage.from('images').getPublicUrl(path)
  try {
    const response = await fetch(data.publicUrl, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

async function processChallenge(challenge: ChallengeData, skipExisting: boolean): Promise<string[]> {
  const urls: string[] = []

  console.log(`\n📦 Défi: ${challenge.id}`)
  console.log(`   Prompt: "${challenge.targetPrompt.substring(0, 60)}..."`)

  // Check if image already exists
  if (skipExisting) {
    const exists = await imageExists(challenge.id)
    if (exists) {
      console.log(`   ⏭️  Image existe déjà, on passe`)
      return ['exists']
    }
  }

  for (let i = 0; i < VARIANTS_PER_CHALLENGE; i++) {
    console.log(`   Variante ${i + 1}/${VARIANTS_PER_CHALLENGE}...`)

    // Générer l'image
    const imageBuffer = await generateImage(challenge.targetPrompt)
    if (!imageBuffer) {
      console.log(`   ⚠️  Échec, on continue...`)
      continue
    }

    // Upload vers Supabase
    const path = `challenges/${challenge.id}/variant-${i + 1}.png`
    const url = await uploadToSupabase(imageBuffer, path)

    if (url) {
      urls.push(url)
      console.log(`   ✅ Variante ${i + 1} uploadée`)
    }

    // Pause pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return urls
}

async function main() {
  const skipExisting = process.argv.includes('--new-only')

  console.log('╔═══════════════════════════════════════════════════╗')
  console.log('║   GÉNÉRATION DES IMAGES POUR LE MODE DÉFIS        ║')
  console.log('╚═══════════════════════════════════════════════════╝')
  console.log('')
  console.log(`📊 ${CHALLENGES.length} défis × ${VARIANTS_PER_CHALLENGE} variantes = ${CHALLENGES.length * VARIANTS_PER_CHALLENGE} images`)
  if (skipExisting) console.log(`⏭️  Mode --new-only : les images existantes seront ignorées`)
  console.log('')

  const results: Record<string, string[]> = {}
  let totalGenerated = 0
  let totalSkipped = 0
  let totalFailed = 0

  for (const challenge of CHALLENGES) {
    const urls = await processChallenge(challenge, skipExisting)
    results[challenge.id] = urls
    if (urls[0] === 'exists') {
      totalSkipped++
    } else {
      totalGenerated += urls.length
      totalFailed += VARIANTS_PER_CHALLENGE - urls.length
    }
  }
  
  // Sauvegarder le mapping dans un fichier
  const outputPath = './src/data/challenge-images.json'
  const fs = await import('fs/promises')
  await fs.mkdir('./src/data', { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2))
  
  console.log('\n' + '═'.repeat(55))
  console.log(`✅ Terminé!`)
  console.log(`   Images générées: ${totalGenerated}`)
  if (totalSkipped > 0) console.log(`   Déjà existantes: ${totalSkipped}`)
  console.log(`   Échecs: ${totalFailed}`)
  console.log(`   Fichier créé: ${outputPath}`)
  console.log('')
}

main().catch(console.error)
