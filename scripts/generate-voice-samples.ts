/**
 * Script pour générer les échantillons audio de chaque voix ElevenLabs
 * 
 * Usage: npx ts-node scripts/generate-voice-samples.ts
 */

import { fal } from '@fal-ai/client'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'

// Configuration fal.ai
fal.config({
  credentials: process.env.FAL_API_KEY,
})

// Les voix à générer
const VOICES = {
  fr: [
    { id: 'kwhMCf63M8O3rCfnQ3oQ', name: 'narratrice', text: 'Il était une fois, dans un royaume lointain, une petite fille qui rêvait de grandes aventures.' },
    { id: 'FvmvwvObRqIHojkEGh5N', name: 'jeuneFille', text: 'Oh regarde ! Une étoile filante ! Vite, fais un vœu !' },
    { id: 'M9RTtrzRACmbUzsEMq8p', name: 'mamie', text: 'Viens près de moi mon petit, je vais te raconter une belle histoire.' },
    { id: '5Qfm4RqcAer0xoyWtoHC', name: 'jeuneGarcon', text: 'Super ! On va partir à l\'aventure ! Tu viens avec moi ?' },
    { id: '1wg2wOjdEWKA7yQD8Kca', name: 'papy', text: 'De mon temps, les dragons étaient nos amis. Laisse-moi te raconter...' },
  ],
  en: [
    { id: 'RILOU7YmBhvwJGDGjNmP', name: 'narrator', text: 'Once upon a time, in a faraway kingdom, there lived a little girl who dreamed of great adventures.' },
    { id: 'rCmVtv8cYU60uhlsOo1M', name: 'youngGirl', text: 'Oh look! A shooting star! Quick, make a wish!' },
    { id: 'kkPJzQOWz2Oz9cUaEaQd', name: 'grandma', text: 'Come sit by me, dear child. Let me tell you a beautiful story.' },
    { id: 'G17SuINrv2H9FC6nvetn', name: 'narratorMale', text: 'In the ancient days, when magic still roamed the land, there was a brave knight.' },
    { id: 'ttNi9wVM8M97tsxE7PFZ', name: 'villain', text: 'You dare enter my domain? Very well, let us see how brave you really are.' },
    { id: '0lp4RIz96WD1RUtvEu3Q', name: 'grandpa', text: 'Back in my day, dragons were our friends. Let me tell you the story...' },
  ],
  ru: [
    { id: 'GN4wbsbejSnGSa1AzjH5', name: 'narrator', text: 'Жила-была в далёком королевстве маленькая девочка, которая мечтала о приключениях.' },
    { id: 'EDpEYNf6XIeKYRzYcx4I', name: 'youngGirl', text: 'Ой, смотри! Падающая звезда! Загадай желание!' },
    { id: 're2r5d74PqDzicySNW0I', name: 'narratorMale', text: 'В древние времена, когда магия ещё жила на земле, был один храбрый рыцарь.' },
    { id: 'wAGzRVkxKEs8La0lmdrE', name: 'mysterious', text: 'Ты осмелился войти в мои владения? Посмотрим, насколько ты храбр.' },
  ],
}

const OUTPUT_DIR = path.join(__dirname, '../public/sound/voices')

async function downloadFile(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath)
    https.get(url, (response) => {
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', (err) => {
      fs.unlink(filepath, () => {})
      reject(err)
    })
  })
}

async function generateSample(voiceId: string, text: string, locale: string, name: string): Promise<void> {
  console.log(`🎤 Génération: ${locale}/${name} (${voiceId})...`)
  
  try {
    const result = await fal.subscribe('fal-ai/elevenlabs/tts/multilingual-v2', {
      input: {
        text,
        voice: voiceId,
      },
    }) as { data: { audio: { url: string } } }
    
    const audioUrl = result.data.audio.url
    const outputPath = path.join(OUTPUT_DIR, locale, `${name}.mp3`)
    
    // Créer le dossier si nécessaire
    const dir = path.dirname(outputPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    // Télécharger le fichier
    await downloadFile(audioUrl, outputPath)
    console.log(`   ✅ Sauvegardé: ${outputPath}`)
    
  } catch (error) {
    console.error(`   ❌ Erreur pour ${name}:`, error)
  }
}

async function main() {
  console.log('🚀 Génération des échantillons de voix ElevenLabs...\n')
  
  if (!process.env.FAL_API_KEY) {
    console.error('❌ FAL_API_KEY non définie dans l\'environnement')
    process.exit(1)
  }
  
  // Créer le dossier de sortie
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
  
  for (const [locale, voices] of Object.entries(VOICES)) {
    console.log(`\n📁 Langue: ${locale.toUpperCase()}`)
    console.log('─'.repeat(40))
    
    for (const voice of voices) {
      await generateSample(voice.id, voice.text, locale, voice.name)
      // Petit délai pour éviter le rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  console.log('\n✅ Terminé !')
}

main().catch(console.error)
