/**
 * API Route - Génération de narration avec ElevenLabs (via fal.ai)
 * + Transcription AssemblyAI pour les timestamps précis
 * 
 * Flux harmonisé identique aux voix enregistrées :
 * 1. Générer audio avec ElevenLabs
 * 2. Transcrire avec AssemblyAI pour obtenir les timestamps
 * 3. Retourner audioUrl + duration + timings
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateVoiceElevenLabs, isFalAvailable } from '@/lib/ai/fal'
import { getDefaultNarrationVoice, getApiKeyForRequest } from '@/lib/config/server-config'
import { AssemblyAI, TranscriptWord } from 'assemblyai'

// Voix par défaut si aucune n'est spécifiée
const DEFAULT_VOICE_ID = 'kwhMCf63M8O3rCfnQ3oQ' // La Conteuse (FR)

// Cache pour les clients AssemblyAI
const assemblyClients = new Map<string, AssemblyAI>()

function getAssemblyAI(apiKey: string): AssemblyAI {
  if (!assemblyClients.has(apiKey)) {
    assemblyClients.set(apiKey, new AssemblyAI({ apiKey }))
  }
  return assemblyClients.get(apiKey)!
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voiceId, locale = 'fr', phrases, withTimestamps = true } = body

    if (!text) {
      return NextResponse.json(
        { error: 'Texte requis' },
        { status: 400 }
      )
    }

    if (!isFalAvailable()) {
      return NextResponse.json(
        { error: 'Clé API fal.ai non configurée' },
        { status: 500 }
      )
    }
    
    // Récupérer la voix par défaut de la famille si aucune n'est spécifiée
    let selectedVoiceId = voiceId
    if (!selectedVoiceId) {
      const familyVoice = await getDefaultNarrationVoice(locale)
      selectedVoiceId = familyVoice || DEFAULT_VOICE_ID
    }
    
    console.log('🎤 Génération narration ElevenLabs via fal.ai, voix:', selectedVoiceId)

    // ========================================
    // ÉTAPE 1: Générer l'audio avec ElevenLabs
    // ========================================
    const result = await generateVoiceElevenLabs({
      text,
      voiceId: selectedVoiceId,
    })

    const audioUrl = result.audioUrl
    console.log('✅ Audio généré:', audioUrl)

    // ========================================
    // ÉTAPE 2: Transcrire avec AssemblyAI (si demandé)
    // ========================================
    let duration = 0
    let timings: Array<{ text: string; index: number; startTime: number; endTime: number }> = []
    
    const assemblyApiKey = await getApiKeyForRequest('assemblyai')
    
    if (withTimestamps && assemblyApiKey) {
      console.log('🔄 Transcription AssemblyAI pour timestamps précis...')
      
      try {
        // Télécharger l'audio généré
        const audioResponse = await fetch(audioUrl)
        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer())
        
        console.log('📥 Audio téléchargé:', audioBuffer.length, 'bytes')
        
        // Transcrire avec AssemblyAI
        const client = getAssemblyAI(assemblyApiKey)
        const transcript = await client.transcripts.transcribe({
          audio: audioBuffer,
          language_code: locale === 'ru' ? 'ru' : locale === 'en' ? 'en' : 'fr',
        })
        
        if (transcript.status === 'error') {
          console.error('❌ Erreur AssemblyAI:', transcript.error)
        } else {
          console.log('✅ Transcription reçue')
          console.log('📊 Durée audio:', transcript.audio_duration, 'secondes')
          console.log('📝 Mots détectés:', transcript.words?.length || 0)
          
          duration = transcript.audio_duration || 0
          const words = transcript.words || []
          
          // Utiliser les phrases fournies ou extraire du texte
          const expectedPhrases: string[] = phrases || text.split(/[.!?]+/).filter((s: string) => s.trim())
          
          if (expectedPhrases.length > 0 && words.length > 0) {
            timings = alignPhrasesWithWords(expectedPhrases, words, duration)
            console.log('✅ Timings alignés:', timings.length, 'phrases')
          }
        }
        
      } catch (transcribeError) {
        console.error('❌ Erreur transcription:', transcribeError)
        // Continuer sans timestamps précis
      }
    }
    
    // ========================================
    // FALLBACK: Estimation si pas de timestamps
    // ========================================
    if (duration === 0) {
      // Estimation basée sur le nombre de mots (150 mots/min)
      const wordCount = text.split(/\s+/).length
      duration = (wordCount / 150) * 60
    }
    
    if (timings.length === 0 && phrases && phrases.length > 0) {
      // Distribution uniforme des phrases
      const durationPerPhrase = duration / phrases.length
      timings = phrases.map((phrase: string, index: number) => ({
        text: phrase,
        index,
        startTime: index * durationPerPhrase,
        endTime: (index + 1) * durationPerPhrase,
      }))
      console.log('⚠️ Fallback: timings estimés')
    }

    // ========================================
    // RÉPONSE
    // ========================================
    return NextResponse.json({
      audioUrl,
      duration,
      voiceId: selectedVoiceId,
      timings: timings.length > 0 ? timings : undefined,
      hasAccurateTimings: timings.length > 0 && !!assemblyApiKey,
    })

  } catch (error) {
    console.error('Erreur API narration:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la narration' },
      { status: 500 }
    )
  }
}

// ========================================
// HELPERS
// ========================================

function alignPhrasesWithWords(
  expectedPhrases: string[],
  words: TranscriptWord[],
  audioDuration: number
): Array<{ text: string; index: number; startTime: number; endTime: number }> {
  const timings: Array<{ text: string; index: number; startTime: number; endTime: number }> = []
  
  let wordIndex = 0
  
  for (let i = 0; i < expectedPhrases.length; i++) {
    const phrase = expectedPhrases[i]
    const phraseWords = phrase.toLowerCase().split(/\s+/).filter(w => w.length > 0)
    
    const startWordIndex = findPhraseStart(phraseWords, words, wordIndex)
    
    if (startWordIndex >= 0) {
      const startTime = (words[startWordIndex].start || 0) / 1000
      
      let endWordIndex = startWordIndex + phraseWords.length - 1
      if (endWordIndex >= words.length) {
        endWordIndex = words.length - 1
      }
      
      const endTime = (words[endWordIndex].end || 0) / 1000
      
      timings.push({
        text: phrase,
        index: i,
        startTime,
        endTime,
      })
      
      wordIndex = endWordIndex + 1
    } else {
      const estimatedStart = i === 0 ? 0 : (timings[i - 1]?.endTime || 0)
      const avgDuration = audioDuration / expectedPhrases.length
      
      timings.push({
        text: phrase,
        index: i,
        startTime: estimatedStart,
        endTime: estimatedStart + avgDuration,
      })
    }
  }
  
  if (timings.length > 0 && audioDuration > 0) {
    timings[timings.length - 1].endTime = audioDuration
  }
  
  return timings
}

function findPhraseStart(
  phraseWords: string[],
  words: TranscriptWord[],
  startFrom: number
): number {
  if (phraseWords.length === 0) return -1
  
  const firstWord = normalizeWord(phraseWords[0])
  
  for (let i = startFrom; i < words.length; i++) {
    const word = normalizeWord(words[i].text || '')
    
    if (word.includes(firstWord) || firstWord.includes(word) || 
        levenshteinDistance(word, firstWord) <= 2) {
      return i
    }
  }
  
  return -1
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-zàâäéèêëïîôùûüç]/g, '')
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[b.length][a.length]
}
