/**
 * Génère les images de fond pour les structures d'histoire
 * Utilise l'API interne de l'app (Nano Banana Pro)
 */

import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'

const API_URL = 'http://localhost:3000/api/ai/image'

// Prompts PREMIUM pour enfants de 9 ans - Style cinématographique moderne
// Inspiré des concept arts de studios d'animation haut de gamme (Pixar, DreamWorks, Ghibli)
// Couleurs riches et profondes pour que le texte blanc ressorte bien
const STRUCTURE_PROMPTS: Record<string, { prompt: string; filename: string }> = {
  tale: {
    prompt: `Breathtaking concept art of an ancient enchanted castle at dusk, perched dramatically on a clifftop. Gothic architecture with elegant spires reaching into a twilight sky painted in deep purples and rich gold. Bioluminescent vines climb the weathered stone walls. Northern lights shimmer above while fireflies create constellations below. Cinematic composition with depth. Style: premium animation studio concept art like Tangled or Howl's Moving Castle, sophisticated color palette (deep violet, amber gold, midnight blue), dramatic lighting, painterly quality. Professional quality for ages 9+. Absolutely no text.`,
    filename: 'structure-tale.jpg',
  },
  adventure: {
    prompt: `Epic cinematic concept art of a lone young explorer on a dramatic cliff edge, gazing at a breathtaking vista of ancient overgrown temple ruins, cascading waterfalls plunging into mist, and a smoking volcano on the horizon. The explorer wears a weathered leather jacket and holds an antique brass compass. Golden hour sunlight breaks through storm clouds, creating god rays. Style: premium adventure film concept art like Uncharted or Tomb Raider, rich cinematic colors (burnt orange, deep teal, warm gold), sense of scale and discovery, highly detailed environment. Professional quality for ages 9+. Absolutely no text.`,
    filename: 'structure-adventure.jpg',
  },
  problem: {
    prompt: `Joyful cinematic concept art of a magical inventor's workshop filled with wonder. Colorful glowing puzzle pieces and gears float in the air, connected by streams of golden light. A young girl with bright eyes triumphantly holds up a glowing solution piece. The room is filled with whimsical contraptions, rainbow prisms casting light everywhere, potions bubbling with happy colors. Butterflies made of light flutter around. Style: premium animated film concept art like Pixar or Disney, vibrant joyful palette (warm gold, magenta, turquoise, sunset orange), sense of discovery and triumph. Professional quality for ages 9+. Absolutely no text.`,
    filename: 'structure-problem.jpg',
  },
  free: {
    prompt: `Stunning cosmic concept art of a small silhouetted figure standing on a floating rocky island, arms outstretched toward an infinite universe. Spectacular deep space filled with swirling galaxies in magenta and violet, glowing nebulas, shooting stars leaving golden trails. Floating islands with glowing trees drift in the distance. The figure is surrounded by orbiting magical elements: glowing books, quills drawing light, floating crystals. Style: premium fantasy concept art like Spider-Verse or Soul, rich cosmic palette (deep purple, magenta, electric blue, gold), awe-inspiring sense of infinite possibility. Professional quality for ages 9+. Absolutely no text.`,
    filename: 'structure-free.jpg',
  },
}

async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath)
    const protocol = url.startsWith('https') ? https : http
    
    const request = protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location
        if (redirectUrl) {
          file.close()
          downloadImage(redirectUrl, filepath).then(resolve).catch(reject)
          return
        }
      }
      
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    })
    
    request.on('error', (err) => {
      fs.unlink(filepath, () => {})
      reject(err)
    })
  })
}

async function generateImage(structureId: string, config: { prompt: string; filename: string }) {
  console.log(`\n🎨 Génération: ${structureId.toUpperCase()}`)
  console.log(`   📝 Prompt: ${config.prompt.substring(0, 100)}...`)

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: config.prompt,
        aspectRatio: '16:9', // Format paysage pour les cartes
        model: 'nano-banana',
        skipUpscale: true, // Pas besoin d'upscale pour les fonds de carte
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error)
    }
    
    const imageUrl = data.imageUrl

    if (!imageUrl) {
      throw new Error('Pas d\'URL d\'image dans la réponse')
    }

    console.log(`   ✅ Image générée!`)

    // Télécharger l'image
    const outputDir = path.join(process.cwd(), 'public', 'images', 'structures')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const outputPath = path.join(outputDir, config.filename)
    await downloadImage(imageUrl, outputPath)
    console.log(`   💾 Sauvegardé: public/images/structures/${config.filename}`)

    return { structureId, success: true, path: outputPath }
  } catch (error) {
    console.error(`   ❌ Erreur:`, error instanceof Error ? error.message : error)
    return { structureId, success: false, error }
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║  🎨 GÉNÉRATION DES IMAGES DE STRUCTURES D\'HISTOIRE      ║')
  console.log('║  📚 Style: Livre ancien ouvert avec illustration        ║')
  console.log('║  🤖 Modèle: Nano Banana Pro (fal.ai)                    ║')
  console.log('╚══════════════════════════════════════════════════════════╝')

  // Vérifier que le serveur est accessible
  console.log('\n🔍 Vérification du serveur...')
  try {
    const healthCheck = await fetch('http://localhost:3000')
    if (!healthCheck.ok) {
      throw new Error('Serveur non accessible')
    }
    console.log('   ✅ Serveur accessible sur localhost:3000')
  } catch {
    console.error('   ❌ Le serveur n\'est pas accessible!')
    console.error('   💡 Lance d\'abord: npm run dev')
    process.exit(1)
  }

  const results = []
  const startTime = Date.now()

  for (const [structureId, config] of Object.entries(STRUCTURE_PROMPTS)) {
    const result = await generateImage(structureId, config)
    results.push(result)
    
    // Pause entre les générations pour ne pas surcharger l'API
    if (results.length < Object.keys(STRUCTURE_PROMPTS).length) {
      console.log('   ⏳ Pause 3s avant la prochaine génération...')
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000)
  
  console.log('\n╔══════════════════════════════════════════════════════════╗')
  console.log('║                      📊 RÉSUMÉ                           ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  
  const successes = results.filter(r => r.success)
  const failures = results.filter(r => !r.success)
  
  console.log(`\n   ✅ Réussies: ${successes.length}/${results.length}`)
  if (successes.length > 0) {
    successes.forEach(s => console.log(`      • ${s.structureId}`))
  }
  
  if (failures.length > 0) {
    console.log(`\n   ❌ Échouées: ${failures.length}`)
    failures.forEach(f => console.log(`      • ${f.structureId}`))
  }
  
  console.log(`\n   ⏱️  Durée totale: ${duration}s`)
  console.log(`   📁 Images dans: public/images/structures/`)
  
  console.log('\n✨ Terminé!')
}

main().catch(console.error)
