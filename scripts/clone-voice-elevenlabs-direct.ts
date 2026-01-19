/**
 * ÉTAPE 2: Clonage voix avec API ElevenLabs directe
 * 
 * Ce script :
 * 1. Clone la voix du dragon avec Instant Voice Cloning
 * 2. Génère un texte de 2 minutes avec cette voix
 */

import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import FormData from 'form-data'

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
      // Gérer les redirections
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

async function cloneVoice(apiKey: string, audioPath: string, voiceName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('name', voiceName)
    form.append('files', fs.createReadStream(audioPath))
    form.append('description', 'Voix de dragon créée par La Voix du Soir')
    
    const options = {
      hostname: 'api.elevenlabs.io',
      path: '/v1/voices/add',
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        ...form.getHeaders(),
      },
    }
    
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(data)
          resolve(result.voice_id)
        } else {
          reject(new Error(`Erreur ${res.statusCode}: ${data}`))
        }
      })
    })
    
    req.on('error', reject)
    form.pipe(req)
  })
}

async function generateSpeech(apiKey: string, voiceId: string, text: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true,
      },
    })
    
    const options = {
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${voiceId}`,
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
    }
    
    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(outputPath)
        res.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve()
        })
      } else {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          reject(new Error(`Erreur ${res.statusCode}: ${data}`))
        })
      }
    })
    
    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

async function main() {
  console.log('🐉 ÉTAPE 2: CLONAGE VOIX DRAGON AVEC ELEVENLABS API DIRECTE')
  console.log('═'.repeat(60))
  
  const apiKey = process.env.ELEVENLABS_API_KEY
  
  if (!apiKey) {
    console.error('❌ ELEVENLABS_API_KEY non définie dans .env.local')
    console.error('')
    console.error('📋 Pour configurer:')
    console.error('   1. Aller sur https://elevenlabs.io/')
    console.error('   2. Créer un compte ou se connecter')
    console.error('   3. Profile → API Keys → Copier la clé')
    console.error('   4. Ajouter dans .env.local:')
    console.error('      ELEVENLABS_API_KEY=sk_xxxxxxxxxx')
    process.exit(1)
  }
  
  // Vérifier que l'échantillon existe
  if (!fs.existsSync(DRAGON_SAMPLE)) {
    console.error(`❌ Échantillon non trouvé: ${DRAGON_SAMPLE}`)
    console.error('   Exécute d\'abord: npx tsx scripts/generate-dragon-voice-sample.ts')
    process.exit(1)
  }
  
  const sampleStats = fs.statSync(DRAGON_SAMPLE)
  console.log(`\n📁 Échantillon source: ${DRAGON_SAMPLE}`)
  console.log(`   Taille: ${Math.round(sampleStats.size / 1024)} KB`)
  
  // ═══════════════════════════════════════════════════════════════
  // ÉTAPE 2.1: Cloner la voix
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n📌 ÉTAPE 2.1: Clonage Instant Voice avec ElevenLabs')
  console.log('─'.repeat(60))
  
  let voiceId: string
  
  // Vérifier s'il y a un voice ID existant
  // ID par défaut du dragon depuis env.example
  const DEFAULT_DRAGON_ID = 'TxGEqnHWrfWFTfGW9XjX'
  const existingId = process.env.ELEVENLABS_VOICE_DRAGON || DEFAULT_DRAGON_ID
  
  if (existingId) {
    console.log(`✅ Voice ID Dragon existant trouvé: ${existingId}`)
    console.log('   (Le clonage nécessite un abonnement ElevenLabs payant)')
    voiceId = existingId
  } else {
    // Essayer de cloner (nécessite un abonnement payant)
    try {
      console.log('⏳ Envoi de l\'échantillon et clonage...')
      voiceId = await cloneVoice(apiKey, DRAGON_SAMPLE, 'Drakor le Dragon')
      
      console.log('\n✅ Voix clonée avec succès!')
      console.log(`   🔑 Voice ID: ${voiceId}`)
      
      // Sauvegarder le voice_id
      const voiceIdFile = path.join(SAMPLES_DIR, 'dragon_elevenlabs_voice_id.txt')
      fs.writeFileSync(voiceIdFile, voiceId)
      console.log(`   📄 Voice ID sauvegardé: ${voiceIdFile}`)
      
    } catch (error: any) {
      console.error('\n❌ Erreur clonage:', error.message || error)
      console.error('\n💡 Pour cloner une voix, un abonnement ElevenLabs payant est requis.')
      console.error('   Ou ajoutez ELEVENLABS_VOICE_DRAGON=<voice_id> dans .env.local')
      process.exit(1)
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // ÉTAPE 2.2: Générer le texte de 2 minutes
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n📌 ÉTAPE 2.2: Génération du texte de 2 minutes')
  console.log('─'.repeat(60))
  console.log(`📝 Texte: ${DRAGON_TEXT_2MIN.length} caractères (~2 min)`)
  console.log(`   Preview: ${DRAGON_TEXT_2MIN.slice(0, 100)}...`)
  
  try {
    console.log(`\n⏳ Génération TTS avec voice_id: ${voiceId}...`)
    
    const outputFile = path.join(SAMPLES_DIR, 'dragon_2min_elevenlabs.mp3')
    await generateSpeech(apiKey, voiceId, DRAGON_TEXT_2MIN, outputFile)
    
    const outputStats = fs.statSync(outputFile)
    console.log('\n✅ Audio généré!')
    console.log(`   📁 Fichier: ${outputFile}`)
    console.log(`   📊 Taille: ${Math.round(outputStats.size / 1024)} KB`)
    
  } catch (error: any) {
    console.error('\n❌ Erreur TTS:', error.message || error)
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
  
  console.log('\n✅ Échantillons prêts!')
  console.log('═'.repeat(60))
}

main().catch(console.error)
