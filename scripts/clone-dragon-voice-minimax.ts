/**
 * ÉTAPE 2: Cloner la voix du dragon via fal.ai
 * Tester avec ElevenLabs Voice Cloning ET MiniMax
 */

import { fal } from '@fal-ai/client'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'

// Configuration fal.ai
fal.config({
  credentials: process.env.FAL_API_KEY,
})

const SAMPLES_DIR = path.join(__dirname, '../public/sound/voices/samples')
const DRAGON_SAMPLE = path.join(SAMPLES_DIR, 'dragon_sample_1min.mp3')

// Texte de 2 minutes pour le dragon
const DRAGON_TEXT_2MIN = `
Ah, te voilà de retour, petit humain ! Je t'attendais.

Cette nuit, les étoiles m'ont murmuré des secrets extraordinaires.
Elles m'ont parlé d'un trésor caché au fond de la forêt enchantée.
Un trésor plus précieux que tout l'or du monde.

Sais-tu ce que c'est ? Non ?
Alors écoute bien, car cette histoire ne se raconte qu'une seule fois.

Il y a très, très longtemps, bien avant que les hommes ne construisent leurs châteaux...
Vivait une petite fée nommée Lumina.
Elle était si petite qu'elle pouvait se cacher dans une fleur de marguerite !

Lumina avait un don extraordinaire.
Chaque fois qu'elle riait, des étincelles dorées s'échappaient de ses ailes.
Et ces étincelles, mon jeune ami, avaient le pouvoir de réaliser les vœux les plus purs.

Un jour, un méchant sorcier entendit parler de ce pouvoir.
Il décida de capturer Lumina pour voler sa magie.
Quelle horreur ! Quel monstre !

Mais la petite fée était maligne, oh oui, très maligne.
Elle se cacha dans l'endroit le plus improbable du royaume...
Dans le cœur d'un vieux dragon grognon qui vivait seul dans sa montagne.

Ce dragon, c'était mon arrière-arrière-grand-père, Flammos l'Ancien.
Au début, il était furieux ! Comment osait-on envahir son territoire ?
Mais quand il vit les larmes de la petite fée, son cœur de pierre fondit.

Ensemble, ils affrontèrent le sorcier.
Flammos cracha ses plus belles flammes, et Lumina fit pleuvoir ses étincelles magiques.
Le sorcier fut transformé en crapaud et s'enfuit dans les marais pour toujours !

Depuis ce jour, les dragons et les fées sont les meilleurs amis du monde.
Et le trésor dont je te parlais ? C'est cette amitié, précieuse et éternelle.

Voilà, mon histoire est terminée pour ce soir.
Ferme les yeux maintenant, et laisse les rêves t'emporter vers des mondes merveilleux.
Bonne nuit, petit ami. Que les étoiles veillent sur ton sommeil.
`.trim()

async function downloadFile(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location
        if (redirectUrl) {
          return downloadFile(redirectUrl, filepath).then(resolve).catch(reject)
        }
      }
      
      const file = fs.createWriteStream(filepath)
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

async function uploadFileToFal(filePath: string): Promise<string> {
  console.log('📤 Upload du fichier audio vers fal.ai...')
  
  const fileBuffer = fs.readFileSync(filePath)
  const blob = new Blob([fileBuffer], { type: 'audio/mpeg' })
  const file = new File([blob], path.basename(filePath), { type: 'audio/mpeg' })
  
  const url = await fal.storage.upload(file)
  console.log('   ✅ Upload réussi:', url)
  return url
}

async function main() {
  console.log('🐉 CLONAGE VOIX DRAGON VIA FAL.AI')
  console.log('═'.repeat(60))
  
  if (!process.env.FAL_API_KEY) {
    console.error('❌ FAL_API_KEY non définie')
    process.exit(1)
  }
  
  // Vérifier que l'échantillon existe
  if (!fs.existsSync(DRAGON_SAMPLE)) {
    console.error(`❌ Échantillon non trouvé: ${DRAGON_SAMPLE}`)
    process.exit(1)
  }
  
  const sampleStats = fs.statSync(DRAGON_SAMPLE)
  console.log(`\n📁 Échantillon source: ${DRAGON_SAMPLE}`)
  console.log(`   Taille: ${Math.round(sampleStats.size / 1024)} KB`)
  console.log(`📝 Texte à générer: ${DRAGON_TEXT_2MIN.length} caractères (~2 min)`)
  
  // Upload du fichier
  const audioUrl = await uploadFileToFal(DRAGON_SAMPLE)
  
  // ═══════════════════════════════════════════════════════════════
  // ESSAI 1: ElevenLabs Voice Cloning via fal.ai
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n📌 ESSAI 1: ElevenLabs TTS avec Voice Cloning (fal.ai)')
  console.log('─'.repeat(60))
  
  try {
    console.log('⏳ Génération avec clonage ElevenLabs...')
    
    const result = await fal.subscribe('fal-ai/elevenlabs/tts/turbo-v2.5', {
      input: {
        text: DRAGON_TEXT_2MIN,
        voice_cloning: {
          audio_urls: [audioUrl],
        },
      },
      logs: true,
    }) as any
    
    console.log('\n📋 Réponse:', JSON.stringify(result, null, 2))
    
    if (result.data?.audio?.url) {
      const outputFile = path.join(SAMPLES_DIR, 'dragon_2min_elevenlabs_cloned.mp3')
      console.log('\n📥 Téléchargement...')
      await downloadFile(result.data.audio.url, outputFile)
      
      const outputStats = fs.statSync(outputFile)
      console.log(`   ✅ Fichier sauvegardé: ${outputFile}`)
      console.log(`   📊 Taille: ${Math.round(outputStats.size / 1024)} KB`)
    }
    
  } catch (error: any) {
    console.error('\n❌ Erreur ElevenLabs:', error.message || error)
    if (error.body) {
      console.error('   Détails:', JSON.stringify(error.body, null, 2))
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // ESSAI 2: MiniMax Voice Clone en plusieurs parties
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n📌 ESSAI 2: MiniMax Voice Clone (texte découpé)')
  console.log('─'.repeat(60))
  
  // Découper le texte en morceaux de 900 caractères max
  const chunks: string[] = []
  let remaining = DRAGON_TEXT_2MIN
  while (remaining.length > 0) {
    // Trouver un point de coupure naturel (phrase complète)
    let cutPoint = Math.min(900, remaining.length)
    if (cutPoint < remaining.length) {
      const lastPeriod = remaining.lastIndexOf('.', cutPoint)
      const lastExclaim = remaining.lastIndexOf('!', cutPoint)
      const lastQuestion = remaining.lastIndexOf('?', cutPoint)
      const bestCut = Math.max(lastPeriod, lastExclaim, lastQuestion)
      if (bestCut > 0) cutPoint = bestCut + 1
    }
    chunks.push(remaining.slice(0, cutPoint).trim())
    remaining = remaining.slice(cutPoint).trim()
  }
  
  console.log(`📝 Texte découpé en ${chunks.length} parties`)
  
  const audioFiles: string[] = []
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    console.log(`\n⏳ Partie ${i + 1}/${chunks.length} (${chunk.length} car.)...`)
    
    try {
      const cloneResult = await fal.subscribe('fal-ai/minimax/voice-clone', {
        input: {
          audio_url: audioUrl,
          text: chunk,
        },
        logs: true,
      }) as any
      
      const audioUrlPart = cloneResult.data?.audio?.url
      if (audioUrlPart) {
        const partFile = path.join(SAMPLES_DIR, `dragon_2min_part${i + 1}.mp3`)
        await downloadFile(audioUrlPart, partFile)
        audioFiles.push(partFile)
        console.log(`   ✅ Partie ${i + 1} sauvegardée`)
      }
      
      // Pause pour éviter le rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error: any) {
      console.error(`   ❌ Erreur partie ${i + 1}:`, error.message)
    }
  }
  
  if (audioFiles.length > 0) {
    console.log(`\n✅ ${audioFiles.length} fichiers audio générés`)
    console.log('   Pour les combiner: ffmpeg -i "concat:part1.mp3|part2.mp3|..." output.mp3')
  }
  
  // ═══════════════════════════════════════════════════════════════
  // RÉSUMÉ FINAL
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n' + '═'.repeat(60))
  console.log('📋 RÉSUMÉ FINAL')
  console.log('═'.repeat(60))
  console.log(`📁 Dossier: ${SAMPLES_DIR}`)
  console.log('\n🎤 Fichiers dragon:')
  
  const files = fs.readdirSync(SAMPLES_DIR)
  for (const file of files) {
    if (file.includes('dragon')) {
      const filePath = path.join(SAMPLES_DIR, file)
      const stats = fs.statSync(filePath)
      const isText = file.endsWith('.txt')
      if (isText) {
        const content = fs.readFileSync(filePath, 'utf-8')
        console.log(`   - ${file}: ${content}`)
      } else {
        console.log(`   - ${file} (${Math.round(stats.size / 1024)} KB)`)
      }
    }
  }
  
  console.log('\n⚠️  Le voice_id MiniMax est réutilisable pendant 7 jours')
  console.log('   (si utilisé au moins une fois avec fal-ai/minimax/speech)')
  console.log('═'.repeat(60))
}

main().catch(console.error)
