import { fal } from '@fal-ai/client'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'

fal.config({ credentials: process.env.FAL_API_KEY })

const SAMPLES_DIR = path.join(__dirname, '../public/sound/voices/samples')

async function downloadFile(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location
        if (redirectUrl) return downloadFile(redirectUrl, filepath).then(resolve).catch(reject)
      }
      const file = fs.createWriteStream(filepath)
      response.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
    }).on('error', reject)
  })
}

async function uploadFile(filePath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath)
  const blob = new Blob([fileBuffer], { type: 'audio/mpeg' })
  const file = new File([blob], path.basename(filePath), { type: 'audio/mpeg' })
  return await fal.storage.upload(file)
}

async function main() {
  const audioUrl = await uploadFile(path.join(SAMPLES_DIR, 'dragon_sample_1min.mp3'))
  console.log('📤 Audio uploadé:', audioUrl)
  
  const testText = "Je suis Drakor, le gardien ancestral. Ma colère peut faire trembler les montagnes !"
  
  // Test 1: ElevenLabs multilingual-v2
  console.log('\n🔵 Test ElevenLabs multilingual-v2 avec voice_cloning...')
  try {
    const r1 = await fal.subscribe('fal-ai/elevenlabs/tts/multilingual-v2', {
      input: {
        text: testText,
        voice_cloning: { audio_urls: [audioUrl] },
      },
      logs: true,
    }) as any
    console.log('Réponse:', JSON.stringify(r1.data, null, 2))
    if (r1.data?.audio?.url) {
      await downloadFile(r1.data.audio.url, path.join(SAMPLES_DIR, 'test_11labs_multilingual.mp3'))
      console.log('✅ Sauvegardé: test_11labs_multilingual.mp3')
    }
  } catch (e: any) {
    console.log('❌ Erreur:', e.message)
  }
  
  // Test 2: Vérifier si on peut passer un voice settings
  console.log('\n🔵 Test ElevenLabs turbo avec voice settings...')
  try {
    const r2 = await fal.subscribe('fal-ai/elevenlabs/tts/turbo-v2.5', {
      input: {
        text: testText,
        voice_cloning: { 
          audio_urls: [audioUrl],
        },
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.9,  // Plus de similarité avec la source
          style: 0.3,
        },
      },
      logs: true,
    }) as any
    console.log('Réponse:', JSON.stringify(r2.data, null, 2))
    if (r2.data?.audio?.url) {
      await downloadFile(r2.data.audio.url, path.join(SAMPLES_DIR, 'test_11labs_turbo_settings.mp3'))
      console.log('✅ Sauvegardé: test_11labs_turbo_settings.mp3')
    }
  } catch (e: any) {
    console.log('❌ Erreur:', e.message)
  }
  
  console.log('\n📋 Fichiers de test créés dans', SAMPLES_DIR)
}

main().catch(console.error)
