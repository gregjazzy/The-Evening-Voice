/**
 * Service fal.ai unifié
 * Gère tous les appels IA : Images (Flux), Vidéos (Kling), Voix (ElevenLabs), Sync (Sync Labs)
 */

import { fal } from '@fal-ai/client'

// Configuration fal.ai
fal.config({
  credentials: process.env.FAL_API_KEY,
})

// ============================================
// TYPES
// ============================================

export interface GenerationJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  url?: string
  error?: string
}

// ============================================
// IMAGES - Flux 1 Pro
// ============================================

export interface FluxImageParams {
  prompt: string
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  numImages?: number
  safetyTolerance?: number // 1-6, plus haut = plus permissif
}

export interface FluxImageResult {
  images: Array<{
    url: string
    width: number
    height: number
  }>
  seed: number
  prompt: string
}

/**
 * Génère une image avec Flux 1 Pro
 */
export async function generateImageFlux(params: FluxImageParams): Promise<FluxImageResult> {
  const {
    prompt,
    aspectRatio = '16:9',
    numImages = 1,
    safetyTolerance = 2, // Sécurisé pour enfants
  } = params

  // Ajouter des termes de sécurité au prompt
  const safePrompt = `${prompt}, child-friendly, safe for kids, no violence, no scary elements`

  const imageSize = aspectRatioToSize(aspectRatio) as 'square' | 'square_hd' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9'

  const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
    input: {
      prompt: safePrompt,
      image_size: imageSize,
      num_images: numImages,
      safety_tolerance: String(safetyTolerance) as '1' | '2' | '3' | '4' | '5' | '6',
      output_format: 'jpeg',
    },
    logs: true,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = result.data as any

  return {
    images: data.images,
    seed: data.seed,
    prompt: safePrompt,
  }
}

// ============================================
// VIDÉOS - Kling 2.1
// ============================================

export interface KlingVideoParams {
  prompt: string
  imageUrl?: string // Image de départ (optionnel)
  duration?: '5' | '10' // secondes
  aspectRatio?: '16:9' | '9:16' | '1:1'
}

export interface KlingVideoResult {
  videoUrl: string
  duration: number
}

/**
 * Génère une vidéo avec Kling 2.1
 */
export async function generateVideoKling(params: KlingVideoParams): Promise<KlingVideoResult> {
  const {
    prompt,
    imageUrl,
    duration = '5',
    aspectRatio = '16:9',
  } = params

  // Prompt sécurisé
  const safePrompt = `${prompt}, gentle movement, child-friendly, magical atmosphere`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await fal.subscribe('fal-ai/kling-video/v1.5/pro/image-to-video', {
    input: {
      prompt: safePrompt,
      image_url: imageUrl || '',
      duration,
      aspect_ratio: aspectRatio,
    },
    logs: true,
  }) as any

  return {
    videoUrl: result.data?.video?.url || '',
    duration: parseInt(duration),
  }
}

/**
 * Génère une vidéo à partir d'une image (image-to-video)
 */
export async function generateVideoFromImage(
  imageUrl: string,
  prompt: string,
  duration: '5' | '10' = '5'
): Promise<KlingVideoResult> {
  return generateVideoKling({
    prompt,
    imageUrl,
    duration,
  })
}

// ============================================
// VOIX - ElevenLabs via fal.ai
// ============================================

export interface ElevenLabsVoiceParams {
  text: string
  voiceId: string
  modelId?: string
}

export interface ElevenLabsVoiceResult {
  audioUrl: string
  duration?: number
}

/**
 * Génère une voix avec ElevenLabs via fal.ai
 * Utilise le modèle multilingual-v2 pour un support multilingue optimal
 */
export async function generateVoiceElevenLabs(params: ElevenLabsVoiceParams): Promise<ElevenLabsVoiceResult> {
  const {
    text,
    voiceId,
  } = params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await fal.subscribe('fal-ai/elevenlabs/tts/multilingual-v2', {
    input: {
      text,
      voice: voiceId,
    },
    logs: true,
  }) as any

  return {
    audioUrl: result.data.audio.url,
  }
}

// ============================================
// SYNC - Sync Labs (Lip Sync)
// ============================================

export interface SyncLabsParams {
  videoUrl: string
  audioUrl: string
}

export interface SyncLabsResult {
  videoUrl: string
}

/**
 * Synchronise les lèvres d'une vidéo avec un audio
 */
export async function syncLipsWithAudio(params: SyncLabsParams): Promise<SyncLabsResult> {
  const { videoUrl, audioUrl } = params

  const result = await fal.subscribe('fal-ai/sync-lipsync', {
    input: {
      video_url: videoUrl,
      audio_url: audioUrl,
    },
    logs: true,
  })

  return {
    videoUrl: result.data.video.url,
  }
}

// ============================================
// TRANSCRIPTION - Whisper via fal.ai
// ============================================

export interface TranscriptionParams {
  audioUrl: string
  language?: string
}

export interface TranscriptionResult {
  text: string
  chunks: Array<{
    text: string
    timestamp: [number, number]
  }>
  duration?: number
}

/**
 * Transcrit un audio avec Whisper via fal.ai
 */
export async function transcribeAudio(params: TranscriptionParams): Promise<TranscriptionResult> {
  const { audioUrl, language = 'fr' } = params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await fal.subscribe('fal-ai/whisper', {
    input: {
      audio_url: audioUrl,
      language: language as 'fr' | 'en' | 'ru',
      task: 'transcribe',
      chunk_level: 'segment',
    },
    logs: true,
  }) as any

  // Convertir les chunks au format attendu
  const chunks = (result.data?.chunks || []).map((chunk: { text: string; timestamp: number[] }) => ({
    text: chunk.text,
    timestamp: [chunk.timestamp[0] || 0, chunk.timestamp[1] || 0] as [number, number],
  }))

  return {
    text: result.data?.text || '',
    chunks,
  }
}

// ============================================
// UTILITAIRES
// ============================================

function aspectRatioToSize(ratio: string): string {
  const sizes: Record<string, string> = {
    '1:1': 'square',
    '16:9': 'landscape_16_9',
    '9:16': 'portrait_16_9',
    '4:3': 'landscape_4_3',
    '3:4': 'portrait_4_3',
  }
  return sizes[ratio] || 'landscape_16_9'
}

/**
 * Adapte un prompt enfantin en prompt professionnel
 */
export function adaptChildPrompt(
  childDescription: string,
  style: string = 'magique',
  ambiance: string = 'jour'
): string {
  const styleMap: Record<string, string> = {
    dessin: 'hand-drawn illustration, sketch style, colored pencil, cute',
    photo: 'photorealistic, cinematic lighting, detailed',
    magique: 'fantasy art, magical glow, ethereal, dreamy, sparkles',
    anime: 'anime style, Studio Ghibli inspired, vibrant colors',
    aquarelle: 'watercolor painting, soft edges, artistic',
    pixelart: 'pixel art, retro game style, 8-bit aesthetic',
  }

  const ambianceMap: Record<string, string> = {
    jour: 'bright daylight, warm golden hour, sunny',
    nuit: 'night scene, starry sky, moonlight, peaceful',
    orage: 'dramatic stormy weather, lightning, epic',
    brume: 'misty atmosphere, soft fog, mysterious',
    feerique: 'enchanted forest, fairy lights, magical sparkles',
    mystere: 'mysterious shadows, dramatic lighting',
  }

  const stylePrompt = styleMap[style] || styleMap.magique
  const ambiancePrompt = ambianceMap[ambiance] || ambianceMap.jour

  return `${childDescription}, ${stylePrompt}, ${ambiancePrompt}, child-friendly, beautiful composition, highly detailed, safe for children`
}

/**
 * Vérifie si fal.ai est disponible
 */
export function isFalAvailable(): boolean {
  return !!process.env.FAL_API_KEY
}
