/**
 * ÉTAPE 2: Cloner la voix du dragon avec ElevenLabs et générer un texte de 2 minutes
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

// Texte de 2 minutes pour le dragon (différent du texte d'entraînement)
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
  console.log('🐉 ÉTAPE 2: CLONAGE VOIX DRAGON AVEC ELEVENLABS')
  console.log('═'.repeat(60))
  
  if (!process.env.FAL_API_KEY) {
    console.error('❌ FAL_API_KEY non définie')
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
  // ÉTAPE 2.1: Upload de l'échantillon et clonage de la voix
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n📌 ÉTAPE 2.1: Clonage de la voix avec ElevenLabs')
  console.log('─'.repeat(60))
  
  let voiceId: string | undefined
  let audioFileUrl: string
  
  try {
    // Upload du fichier
    audioFileUrl = await uploadFileToFal(DRAGON_SAMPLE)
    
    console.log('\n⏳ Clonage de la voix en cours...')
    
    // Cloner la voix avec ElevenLabs via fal.ai
    const cloneResult = await fal.subscribe('fal-ai/elevenlabs/voice-clone', {
      input: {
        audio_url: audioFileUrl,
        name: 'Drakor le Dragon',
      },
      logs: true,
    }) as { data: { voice_id: string } }
    
    voiceId = cloneResult.data.voice_id
    console.log('\n✅ Voix clonée avec succès!')
    console.log(`   🔑 Voice ID ElevenLabs: ${voiceId}`)
    
    // Sauvegarder le voice_id
    const voiceIdFile = path.join(SAMPLES_DIR, 'dragon_elevenlabs_voice_id.txt')
    fs.writeFileSync(voiceIdFile, voiceId)
    console.log(`   📄 Voice ID sauvegardé: ${voiceIdFile}`)
    
  } catch (error: any) {
    console.error('\n❌ Erreur clonage:', error.message || error)
    if (error.body) {
      console.error('   Détails:', JSON.stringify(error.body, null, 2))
    }
    
    // Alternative: essayer avec le endpoint speech-to-speech ou autre
    console.log('\n🔄 Tentative alternative avec fal-ai/elevenlabs/tts...')
    
    // On ne peut pas cloner directement, on va utiliser le preview MiniMax
    console.log('⚠️  Le clonage direct n\'est pas disponible.')
    console.log('   On va utiliser MiniMax Voice Clone à la place.')
    
    try {
      audioFileUrl = await uploadFileToFal(DRAGON_SAMPLE)
      
      console.log('\n⏳ Clonage avec MiniMax Voice Clone...')
      
      const minimaxClone = await fal.subscribe('fal-ai/minimax/voice-clone', {
        input: {
          audio_url: audioFileUrl,
        },
        logs: true,
      }) as { data: { voice_id: string } }
      
      voiceId = minimaxClone.data.voice_id
      console.log('\n✅ Voix clonée avec MiniMax!')
      console.log(`   🔑 Voice ID MiniMax: ${voiceId}`)
      
      const voiceIdFile = path.join(SAMPLES_DIR, 'dragon_minimax_voice_id.txt')
      fs.writeFileSync(voiceIdFile, voiceId)
      console.log(`   📄 Voice ID sauvegardé: ${voiceIdFile}`)
      
    } catch (minimaxError: any) {
      console.error('\n❌ Erreur MiniMax clone:', minimaxError.message || minimaxError)
      process.exit(1)
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // ÉTAPE 2.2: Générer le texte de 2 minutes avec la voix clonée
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n📌 ÉTAPE 2.2: Génération du texte de 2 minutes')
  console.log('─'.repeat(60))
  console.log('📝 Texte à générer:')
  console.log(DRAGON_TEXT_2MIN.slice(0, 200) + '...')
  console.log(`\n   (${DRAGON_TEXT_2MIN.length} caractères, ~2 minutes)\n`)
  
  try {
    console.log(`⏳ Génération TTS avec voice_id: ${voiceId}...`)
    
    // Essayer d'abord avec ElevenLabs
    let ttsResult: { data: { audio: { url: string } } }
    
    try {
      ttsResult = await fal.subscribe('fal-ai/elevenlabs/tts/multilingual-v2', {
        input: {
          text: DRAGON_TEXT_2MIN,
          voice: voiceId,
        },
        logs: true,
      }) as { data: { audio: { url: string } } }
    } catch {
      // Fallback sur MiniMax TTS
      console.log('   ↳ Fallback sur MiniMax TTS...')
      ttsResult = await fal.subscribe('fal-ai/minimax/speech', {
        input: {
          text: DRAGON_TEXT_2MIN,
          voice_id: voiceId,
        },
        logs: true,
      }) as { data: { audio: { url: string } } }
    }
    
    console.log('\n✅ Audio généré!')
    console.log('   URL:', ttsResult.data.audio.url)
    
    // Télécharger le fichier
    const outputFile = path.join(SAMPLES_DIR, 'dragon_2min_cloned.mp3')
    console.log('\n📥 Téléchargement...')
    await downloadFile(ttsResult.data.audio.url, outputFile)
    
    const outputStats = fs.statSync(outputFile)
    console.log(`   ✅ Fichier sauvegardé: ${outputFile}`)
    console.log(`   📊 Taille: ${Math.round(outputStats.size / 1024)} KB`)
    
  } catch (error: any) {
    console.error('\n❌ Erreur TTS:', error.message || error)
    if (error.body) {
      console.error('   Détails:', JSON.stringify(error.body, null, 2))
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // RÉSUMÉ FINAL
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n' + '═'.repeat(60))
  console.log('📋 RÉSUMÉ FINAL')
  console.log('═'.repeat(60))
  console.log(`📁 Dossier: ${SAMPLES_DIR}`)
  console.log('\n🎤 Fichiers générés:')
  
  const files = fs.readdirSync(SAMPLES_DIR)
  for (const file of files) {
    if (file.includes('dragon')) {
      const filePath = path.join(SAMPLES_DIR, file)
      const stats = fs.statSync(filePath)
      const isText = file.endsWith('.txt')
      console.log(`   - ${file} ${isText ? '' : `(${Math.round(stats.size / 1024)} KB)`}`)
    }
  }
  
  if (voiceId) {
    console.log(`\n🔑 Voice ID pour réutilisation: ${voiceId}`)
  }
  
  console.log('\n✅ Échantillons prêts pour test!')
  console.log('═'.repeat(60))
}

main().catch(console.error)
