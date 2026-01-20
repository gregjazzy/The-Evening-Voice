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
  // Niveau 1 - Scènes simples mais intéressantes
  { id: 'reproduce-1-apple', type: 'reproduce', difficulty: 1, targetPrompt: 'A red apple with a green leaf on a wooden table, sunlight from window, watercolor style' },
  { id: 'reproduce-1-star', type: 'reproduce', difficulty: 1, targetPrompt: 'A golden shooting star crossing a purple night sky above snowy mountains, magical atmosphere' },
  { id: 'reproduce-1-rainbow', type: 'reproduce', difficulty: 1, targetPrompt: 'A rainbow arching over a green meadow with wildflowers and a small cottage, sunny day, Studio Ghibli style' },
  
  // Niveau 2 - Personnages avec contexte
  { id: 'reproduce-2-cat', type: 'reproduce', difficulty: 2, targetPrompt: 'An orange tabby cat sleeping on a cozy red armchair by a fireplace, warm lighting, oil painting style' },
  { id: 'reproduce-2-robot', type: 'reproduce', difficulty: 2, targetPrompt: 'A small friendly robot watering flowers in a garden, morning dew, pastel colors, children book illustration' },
  { id: 'reproduce-2-teddy', type: 'reproduce', difficulty: 2, targetPrompt: 'A brown teddy bear having a tea party with toy friends on a picnic blanket in a sunny park' },
  
  // Niveau 3 - Scènes complètes
  { id: 'reproduce-3-castle', type: 'reproduce', difficulty: 3, targetPrompt: 'A medieval stone castle on a green hill at sunset, golden sky, fantasy illustration style' },
  { id: 'reproduce-3-boat', type: 'reproduce', difficulty: 3, targetPrompt: 'A small wooden boat on a calm lake surrounded by mountains, morning mist, peaceful scene' },
  { id: 'reproduce-3-treehouse', type: 'reproduce', difficulty: 3, targetPrompt: 'A cozy treehouse with round windows and a rope ladder, autumn forest, warm lighting' },
  
  // Niveau 4 - Atmosphères
  { id: 'reproduce-4-forest', type: 'reproduce', difficulty: 4, targetPrompt: 'A mysterious foggy forest with rays of golden sunlight breaking through tall trees, magical atmosphere, digital painting' },
  { id: 'reproduce-4-underwater', type: 'reproduce', difficulty: 4, targetPrompt: 'An underwater coral reef scene with colorful tropical fish, light rays from above, serene blue tones' },
  { id: 'reproduce-4-aurora', type: 'reproduce', difficulty: 4, targetPrompt: 'A northern lights display over a snowy mountain landscape, green and purple aurora, starry night sky' },
  
  // Niveau 5 - Complexe
  { id: 'reproduce-5-dragon', type: 'reproduce', difficulty: 5, targetPrompt: 'A majestic blue dragon with iridescent scales perched on a cliff overlooking a vast kingdom at dawn, epic fantasy art, highly detailed' },
  { id: 'reproduce-5-airship', type: 'reproduce', difficulty: 5, targetPrompt: 'A steampunk airship flying through clouds at sunset, brass and copper details, propellers and balloons, Victorian fantasy style' },
  { id: 'reproduce-5-library', type: 'reproduce', difficulty: 5, targetPrompt: 'An ancient magical library with floating books, spiral staircases, glowing crystals, and a wise owl perched on a globe, fantasy art' },
  
  // Variations - Niveau 2
  { id: 'variations-2-cottage', type: 'variations', difficulty: 2, targetPrompt: 'A cozy cottage in a flower meadow, sunny summer day, watercolor style' },
  { id: 'variations-2-dog', type: 'variations', difficulty: 2, targetPrompt: 'A happy golden retriever dog running in a park, realistic photo' },
  
  // Variations - Niveau 3
  { id: 'variations-3-knight', type: 'variations', difficulty: 3, targetPrompt: 'A knight in shining silver armor holding a sword, realistic medieval style' },
  { id: 'variations-3-pizza', type: 'variations', difficulty: 3, targetPrompt: 'A slice of pepperoni pizza on a plate, food photography style' },
  
  // Variations - Niveau 4
  { id: 'variations-4-city', type: 'variations', difficulty: 4, targetPrompt: 'A futuristic city skyline at night, bright neon lights, cyberpunk style, optimistic atmosphere' },
  { id: 'variations-4-garden', type: 'variations', difficulty: 4, targetPrompt: 'A serene Japanese garden with a red bridge over a koi pond, spring cherry blossoms' },
  
  // Variations - Niveau 5
  { id: 'variations-5-fairy', type: 'variations', difficulty: 5, targetPrompt: 'A magical fairy sitting on a mushroom in an enchanted forest, soft glowing light, fantasy illustration' },
]

// ============================================================================
// FONCTIONS
// ============================================================================

async function generateImage(prompt: string): Promise<Buffer | null> {
  try {
    console.log(`   🎨 Génération avec fal.ai...`)
    
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt,
        image_size: 'square',
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      },
    })
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = result.data as any
    
    if (!data?.images?.[0]?.url) {
      throw new Error('Pas d\'image générée')
    }
    
    // Télécharger l'image
    const imageUrl = data.images[0].url
    const response = await fetch(imageUrl)
    const arrayBuffer = await response.arrayBuffer()
    
    return Buffer.from(arrayBuffer)
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

async function processChallenge(challenge: ChallengeData): Promise<string[]> {
  const urls: string[] = []
  
  console.log(`\n📦 Défi: ${challenge.id}`)
  console.log(`   Prompt: "${challenge.targetPrompt.substring(0, 50)}..."`)
  
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
  console.log('╔═══════════════════════════════════════════════════╗')
  console.log('║   GÉNÉRATION DES IMAGES POUR LE MODE DÉFIS        ║')
  console.log('╚═══════════════════════════════════════════════════╝')
  console.log('')
  console.log(`📊 ${CHALLENGES.length} défis × ${VARIANTS_PER_CHALLENGE} variantes = ${CHALLENGES.length * VARIANTS_PER_CHALLENGE} images`)
  console.log('')
  
  const results: Record<string, string[]> = {}
  let totalGenerated = 0
  let totalFailed = 0
  
  for (const challenge of CHALLENGES) {
    const urls = await processChallenge(challenge)
    results[challenge.id] = urls
    totalGenerated += urls.length
    totalFailed += VARIANTS_PER_CHALLENGE - urls.length
  }
  
  // Sauvegarder le mapping dans un fichier
  const outputPath = './src/data/challenge-images.json'
  const fs = await import('fs/promises')
  await fs.mkdir('./src/data', { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2))
  
  console.log('\n' + '═'.repeat(55))
  console.log(`✅ Terminé!`)
  console.log(`   Images générées: ${totalGenerated}`)
  console.log(`   Échecs: ${totalFailed}`)
  console.log(`   Fichier créé: ${outputPath}`)
  console.log('')
}

main().catch(console.error)
