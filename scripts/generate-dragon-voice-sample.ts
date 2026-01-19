/**
 * Script pour générer un échantillon de voix de dragon (1 min)
 * avec différentes expressions pour le clonage ElevenLabs
 */

import { fal } from '@fal-ai/client'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'

// Configuration fal.ai
fal.config({
  credentials: process.env.FAL_API_KEY,
})

// Texte du dragon - PARTIE 1 (preview pour Voice Design - limite ~500 caractères)
const DRAGON_TEXT_PREVIEW = `Je suis Drakor, le gardien ancestral de la montagne de cristal. Approche, jeune humain, n'aie pas peur de moi. Ma sagesse est aussi vaste que les océans. Mais attention ! Ma colère peut faire trembler les montagnes ! Ha ha ha ! Tu frissons ? C'est normal, petit mortel.`

// Texte complet pour générer l'échantillon de 1 minute avec la voix créée
const DRAGON_TEXT_FULL = `
Je suis Drakor, le gardien ancestral de la montagne de cristal.

Approche, jeune humain, n'aie pas peur de moi.
Ma sagesse est aussi vaste que les océans, et mon cœur aussi ancien que les étoiles.

Mais attention ! Ne me prends pas pour un être faible.
Ma colère peut faire trembler les montagnes et mon souffle peut réduire des royaumes en cendres !

Ha ha ha ! Tu frissons ? C'est normal, petit mortel.

Écoute bien mes paroles, car elles sont précieuses.
Il y a bien longtemps, quand le monde était jeune...
Les dragons et les humains vivaient en harmonie.

Nous partagions nos secrets, nos rêves, nos histoires.

Hmm... ces temps sont révolus.
Mais peut-être... oui, peut-être que toi, tu es différent.

Viens, assieds-toi près de mon feu.
Je vais te raconter l'histoire de la princesse Luna et du chevalier sans peur.

Es-tu prêt à écouter, petit ami ?
`.trim()

// Description de la voix du dragon pour Voice Design
const DRAGON_VOICE_PROMPT = `A powerful ancient dragon with a deep, resonant male voice that rumbles like distant thunder. The voice should be slow and deliberate, with each word carrying the weight of centuries. Rich bass tones with a slight growl underneath, as if fire simmers in the throat. Speaking pace is measured and regal. The tone conveys both wisdom and menace.`

const OUTPUT_DIR = path.join(__dirname, '../public/sound/voices/samples')
const OUTPUT_FILE_PREVIEW = 'dragon_voice_design_preview.mp3'
const OUTPUT_FILE_FULL = 'dragon_sample_1min.mp3'

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

async function main() {
  console.log('🐉 GÉNÉRATION VOIX DE DRAGON - 2 ÉTAPES\n')
  console.log('═'.repeat(60))
  
  if (!process.env.FAL_API_KEY) {
    console.error('❌ FAL_API_KEY non définie')
    process.exit(1)
  }
  
  // Créer le dossier de sortie
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
  
  // ═══════════════════════════════════════════════════════════════
  // ÉTAPE 1: Créer la voix avec Voice Design (preview court)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📌 ÉTAPE 1: Création de la voix avec MiniMax Voice Design')
  console.log('─'.repeat(60))
  console.log('🎭 Prompt voix:', DRAGON_VOICE_PROMPT.slice(0, 80) + '...')
  console.log('📝 Preview texte:', DRAGON_TEXT_PREVIEW.slice(0, 60) + '...')
  console.log(`   (${DRAGON_TEXT_PREVIEW.length} caractères)\n`)
  
  let voiceId: string | undefined
  
  try {
    console.log('⏳ Génération Voice Design en cours...')
    
    const designResult = await fal.subscribe('fal-ai/minimax/voice-design', {
      input: {
        prompt: DRAGON_VOICE_PROMPT,
        preview_text: DRAGON_TEXT_PREVIEW,
      },
      logs: true,
    }) as { data: { audio: { url: string }, voice_id?: string } }
    
    console.log('\n✅ Voice Design réussi!')
    console.log('   Audio URL:', designResult.data.audio.url)
    
    if (designResult.data.voice_id) {
      voiceId = designResult.data.voice_id
      console.log('   Voice ID:', voiceId)
    }
    
    // Sauvegarder le preview
    const previewPath = path.join(OUTPUT_DIR, OUTPUT_FILE_PREVIEW)
    console.log('\n📥 Sauvegarde du preview...')
    await downloadFile(designResult.data.audio.url, previewPath)
    
    const previewStats = fs.statSync(previewPath)
    console.log(`   ✅ Preview sauvegardé: ${previewPath}`)
    console.log(`   📊 Taille: ${Math.round(previewStats.size / 1024)} KB`)
    
  } catch (error: any) {
    console.error('\n❌ Erreur Voice Design:', error.message || error)
    if (error.body) {
      console.error('   Détails:', JSON.stringify(error.body, null, 2))
    }
    process.exit(1)
  }
  
  // ═══════════════════════════════════════════════════════════════
  // ÉTAPE 2: Générer le texte complet (1 min) avec la voix créée
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n📌 ÉTAPE 2: Génération du texte complet (~1 min)')
  console.log('─'.repeat(60))
  console.log('📝 Texte complet:')
  console.log(DRAGON_TEXT_FULL)
  console.log(`\n   (${DRAGON_TEXT_FULL.length} caractères)\n`)
  
  if (!voiceId) {
    console.log('⚠️  Pas de voice_id reçu - utilisation de MiniMax TTS avec prompt')
    
    try {
      console.log('⏳ Génération TTS en cours...')
      
      // Utiliser Voice Design à nouveau avec le texte complet (peut prendre du temps)
      const ttsResult = await fal.subscribe('fal-ai/minimax/voice-design', {
        input: {
          prompt: DRAGON_VOICE_PROMPT,
          preview_text: DRAGON_TEXT_FULL.slice(0, 500), // Limiter au max
        },
        logs: true,
      }) as { data: { audio: { url: string } } }
      
      console.log('\n✅ TTS généré!')
      
      const fullPath = path.join(OUTPUT_DIR, OUTPUT_FILE_FULL)
      console.log('📥 Sauvegarde de l\'échantillon complet...')
      await downloadFile(ttsResult.data.audio.url, fullPath)
      
      const fullStats = fs.statSync(fullPath)
      console.log(`   ✅ Échantillon sauvegardé: ${fullPath}`)
      console.log(`   📊 Taille: ${Math.round(fullStats.size / 1024)} KB`)
      
    } catch (error: any) {
      console.error('\n❌ Erreur TTS:', error.message || error)
      if (error.body) {
        console.error('   Détails:', JSON.stringify(error.body, null, 2))
      }
    }
  } else {
    // Utiliser l'ID de voix pour générer avec MiniMax TTS
    try {
      console.log(`⏳ Génération avec voice_id: ${voiceId}...`)
      
      const ttsResult = await fal.subscribe('fal-ai/minimax/speech', {
        input: {
          text: DRAGON_TEXT_FULL,
          voice_id: voiceId,
        },
        logs: true,
      }) as { data: { audio: { url: string } } }
      
      console.log('\n✅ TTS généré!')
      
      const fullPath = path.join(OUTPUT_DIR, OUTPUT_FILE_FULL)
      console.log('📥 Sauvegarde de l\'échantillon complet...')
      await downloadFile(ttsResult.data.audio.url, fullPath)
      
      const fullStats = fs.statSync(fullPath)
      console.log(`   ✅ Échantillon sauvegardé: ${fullPath}`)
      console.log(`   📊 Taille: ${Math.round(fullStats.size / 1024)} KB`)
      
    } catch (error: any) {
      console.error('\n❌ Erreur TTS:', error.message || error)
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // RÉSUMÉ
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n' + '═'.repeat(60))
  console.log('📋 RÉSUMÉ')
  console.log('═'.repeat(60))
  console.log(`📁 Dossier de sortie: ${OUTPUT_DIR}`)
  console.log(`\n🎤 Fichiers générés:`)
  
  const files = fs.readdirSync(OUTPUT_DIR)
  for (const file of files) {
    if (file.includes('dragon')) {
      const filePath = path.join(OUTPUT_DIR, file)
      const stats = fs.statSync(filePath)
      console.log(`   - ${file} (${Math.round(stats.size / 1024)} KB)`)
    }
  }
  
  if (voiceId) {
    console.log(`\n🔑 Voice ID MiniMax: ${voiceId}`)
    console.log('   (Réutilisable pendant 7 jours avec fal-ai/minimax/speech)')
  }
  
  console.log('\n⚠️  IMPORTANT: Garde ces échantillons pour le clonage ElevenLabs!')
  console.log('═'.repeat(60))
}

main().catch(console.error)
