/**
 * API Route - Transcription audio avec timestamps (AssemblyAI)
 * Utilisé pour synchroniser automatiquement la voix avec les phrases
 */

import { NextRequest, NextResponse } from 'next/server'
import { AssemblyAI, TranscriptWord } from 'assemblyai'

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY

let assemblyClient: AssemblyAI | null = null
function getAssemblyAI(): AssemblyAI | null {
  if (!assemblyClient && ASSEMBLYAI_API_KEY) {
    assemblyClient = new AssemblyAI({ apiKey: ASSEMBLYAI_API_KEY })
  }
  return assemblyClient
}

export async function POST(request: NextRequest) {
  try {
    if (!ASSEMBLYAI_API_KEY) {
      console.log('⚠️ Clé API AssemblyAI non configurée, utilisation du fallback')
      return handleFallback(request)
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const phrasesJson = formData.get('phrases') as string | null

    if (!audioFile) {
      return NextResponse.json({ error: 'Fichier audio requis' }, { status: 400 })
    }

    console.log('📥 Audio reçu:', audioFile.name, audioFile.type, audioFile.size, 'bytes')

    const expectedPhrases: string[] = phrasesJson ? JSON.parse(phrasesJson) : []

    const client = getAssemblyAI()
    if (!client) {
      console.log('⚠️ Client AssemblyAI non initialisé, utilisation du fallback')
      return handleFallback(request)
    }

    const arrayBuffer = await audioFile.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)
    
    console.log('🚀 Envoi à AssemblyAI...')
    
    try {
      const transcript = await client.transcripts.transcribe({
        audio: audioBuffer,
        language_code: 'fr',
      })
      
      if (transcript.status === 'error') {
        console.error('❌ Erreur AssemblyAI:', transcript.error)
        return handleFallbackWithPhrases(expectedPhrases, 0)
      }
      
      console.log('✅ Transcription reçue:', transcript.text?.substring(0, 100) + '...')
      console.log('📊 Durée audio:', transcript.audio_duration, 'secondes')
      console.log('📝 Mots détectés:', transcript.words?.length || 0)

      const audioDuration = transcript.audio_duration || 0
      const words = transcript.words || []

      if (expectedPhrases.length > 0 && words.length > 0) {
        const alignedTimings = alignPhrasesWithWords(expectedPhrases, words, audioDuration)
        
        return NextResponse.json({
          success: true,
          duration: audioDuration,
          transcription: transcript.text,
          timings: alignedTimings,
        })
      }

      if (words.length > 0) {
        return NextResponse.json({
          success: true,
          duration: audioDuration,
          transcription: transcript.text,
          segments: groupWordsIntoSegments(words),
        })
      }

      return handleFallbackWithPhrases(expectedPhrases, audioDuration)
      
    } catch (transcribeError) {
      console.error('❌ Erreur lors de la transcription AssemblyAI:', transcribeError)
      return handleFallbackWithPhrases(expectedPhrases, 0)
    }

  } catch (error) {
    console.error('❌ Erreur API transcribe:', error)
    
    let errorMessage = 'Erreur lors de la transcription'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

async function handleFallback(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const phrasesJson = formData.get('phrases') as string | null
    const expectedPhrases: string[] = phrasesJson ? JSON.parse(phrasesJson) : []
    
    return handleFallbackWithPhrases(expectedPhrases, 0)
  } catch {
    return NextResponse.json({
      success: true,
      duration: 0,
      transcription: '',
      timings: [],
    })
  }
}

function handleFallbackWithPhrases(expectedPhrases: string[], audioDuration: number): NextResponse {
  console.log('📦 Utilisation du fallback avec distribution uniforme')
  
  const duration = audioDuration || expectedPhrases.length * 2
  const phraseCount = expectedPhrases.length || 1
  const durationPerPhrase = duration / phraseCount
  
  const timings = expectedPhrases.map((phrase, index) => ({
    text: phrase,
    index,
    startTime: index * durationPerPhrase,
    endTime: (index + 1) * durationPerPhrase,
  }))
  
  return NextResponse.json({
    success: true,
    duration,
    transcription: expectedPhrases.join(' '),
    timings,
    fallback: true,
  })
}

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

function groupWordsIntoSegments(
  words: TranscriptWord[]
): Array<{ text: string; startTime: number; endTime: number }> {
  const segments: Array<{ text: string; startTime: number; endTime: number }> = []
  
  let currentSegment = { words: [] as string[], start: 0, end: 0 }
  
  for (const word of words) {
    if (currentSegment.words.length === 0) {
      currentSegment.start = (word.start || 0) / 1000
    }
    
    currentSegment.words.push(word.text || '')
    currentSegment.end = (word.end || 0) / 1000
    
    const text = word.text || ''
    if (text.endsWith('.') || text.endsWith('!') || text.endsWith('?') || 
        text.endsWith(',') || currentSegment.words.length >= 10) {
      segments.push({
        text: currentSegment.words.join(' '),
        startTime: currentSegment.start,
        endTime: currentSegment.end,
      })
      currentSegment = { words: [], start: 0, end: 0 }
    }
  }
  
  if (currentSegment.words.length > 0) {
    segments.push({
      text: currentSegment.words.join(' '),
      startTime: currentSegment.start,
      endTime: currentSegment.end,
    })
  }
  
  return segments
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
