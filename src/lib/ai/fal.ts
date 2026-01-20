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
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2' // 3:4 = portrait livre (défaut)
  numImages?: number
  safetyTolerance?: number // 1-6, plus haut = plus permissif
  model?: 'flux' | 'recraft' | 'nano-banana' // Choix du modèle
  resolution?: '1K' | '2K' | '4K' // Pour Nano Banana Pro (défaut: 2K)
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
 * Génère une image avec différents modèles fal.ai
 * Format par défaut: portrait 3:4 (adapté aux livres d'enfants)
 * 
 * Modèles disponibles:
 * - nano-banana: Google Gemini 3 Pro Image - Meilleure compréhension du langage naturel (FR/EN)
 * - recraft: Recraft V3 - Bon pour illustrations
 * - flux: Flux Pro 1.1 - Modèle historique
 */
export async function generateImageFlux(params: FluxImageParams): Promise<FluxImageResult> {
  const {
    prompt,
    aspectRatio = '3:4', // Format portrait livre par défaut
    numImages = 1,
    safetyTolerance = 5, // Permissif (le contenu est déjà modéré côté chat par Gemini)
    model = 'nano-banana', // Nano Banana Pro par défaut (meilleure compréhension langage naturel)
    resolution = '2K', // 2K par défaut pour bonne qualité sans upscale
  } = params

  // 🛡️ Le prompt est déjà modéré par l'IA côté chat
  const safePrompt = prompt

  console.log(`🎨 Génération avec ${model.toUpperCase()}:`, safePrompt)

  // ============================================
  // NANO BANANA PRO - Google Gemini 3 Pro Image
  // Meilleure compréhension du langage naturel (FR/EN)
  // ============================================
  if (model === 'nano-banana') {
    // Convertir aspectRatio au format Nano Banana (utilise des ratios comme "3:4")
    // Nano Banana supporte: 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16
    const nanoBananaRatios: Record<string, string> = {
      '1:1': '1:1',
      '16:9': '16:9',
      '9:16': '9:16',
      '4:3': '4:3',
      '3:4': '3:4',
      '2:3': '2:3',
      '3:2': '3:2',
    }
    const ratio = nanoBananaRatios[aspectRatio] || '3:4'

    console.log(`📐 Nano Banana - Ratio: ${ratio}, Resolution: ${resolution}`)

    const result = await fal.subscribe('fal-ai/nano-banana-pro', {
      input: {
        prompt: safePrompt,
        aspect_ratio: ratio,
        resolution: resolution,
        num_images: numImages,
        output_format: 'png',
      },
      logs: true,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = result.data as any
    console.log('🍌 Nano Banana response:', JSON.stringify(data, null, 2))

    // Nano Banana retourne { images: [...], description: "..." }
    const images = data.images?.map((img: { url: string; width?: number; height?: number }) => ({
      url: img.url,
      width: img.width || 1024,
      height: img.height || 1024,
    })) || []

    return {
      images,
      seed: 0, // Nano Banana ne retourne pas de seed
      prompt: safePrompt,
    }
  }

  // ============================================
  // RECRAFT V3 - Meilleure compréhension des prompts complexes
  // ============================================
  if (model === 'recraft') {
    // Recraft utilise des dimensions en pixels
    const recraftSizes: Record<string, { width: number; height: number }> = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1365, height: 768 },
      '9:16': { width: 768, height: 1365 },
      '4:3': { width: 1182, height: 886 },
      '3:4': { width: 886, height: 1182 },
      '2:3': { width: 819, height: 1229 },
      '3:2': { width: 1229, height: 819 },
    }
    const size = recraftSizes[aspectRatio] || recraftSizes['3:4']

    const result = await fal.subscribe('fal-ai/recraft/v3/text-to-image', {
      input: {
        prompt: safePrompt,
        image_size: size,
        style: 'digital_illustration', // Style illustration pour enfants
      },
      logs: true,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = result.data as any

    return {
      images: data.images || [{ url: data.image?.url, width: size.width, height: size.height }],
      seed: data.seed || 0,
      prompt: safePrompt,
    }
  }

  // ============================================
  // FLUX PRO - Modèle par défaut précédent
  // ============================================
  const sizePreset = aspectRatioToSize(aspectRatio)

  const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
    input: {
      prompt: safePrompt,
      image_size: sizePreset,
      num_images: numImages,
      safety_tolerance: String(safetyTolerance) as '1' | '2' | '3' | '4' | '5' | '6',
      output_format: 'png',
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
// UPSCALE - Pour qualité impression livre
// ============================================

export interface UpscaleParams {
  imageUrl: string
  scale?: 2 | 4  // x2 ou x4
}

export interface UpscaleResult {
  imageUrl: string
  width: number
  height: number
}

/**
 * Upscale une image pour qualité impression (livre Legato)
 * Utilise Real-ESRGAN via fal.ai
 * 
 * Coût: ~$0.01 par image
 * 
 * Exemple:
 * - Image 1152×1536 → x2 → 2304×3072 (suffisant A5 300 DPI)
 */
export async function upscaleImageForPrint(params: UpscaleParams): Promise<UpscaleResult> {
  const { imageUrl, scale = 2 } = params

  const result = await fal.subscribe('fal-ai/real-esrgan', {
    input: {
      image_url: imageUrl,
      scale: scale,
    },
    logs: true,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = result.data as any

  return {
    imageUrl: data.image?.url || data.url,
    width: data.image?.width || 0,
    height: data.image?.height || 0,
  }
}

// ============================================
// VIDÉOS - Kling 2.5 Turbo Pro
// ============================================

export interface KlingVideoParams {
  prompt: string
  imageUrl?: string // Image de départ (optionnel, pour image-to-video)
  duration?: '5' | '10' // secondes
  aspectRatio?: '16:9' | '9:16' | '1:1'
}

export interface KlingVideoResult {
  videoUrl: string
  duration: number
}

/**
 * Génère une vidéo avec Kling 2.5 Turbo Pro (text-to-video)
 * Pas besoin d'image ! Juste un prompt texte.
 * Prix : $0.35 pour 5 secondes
 */
export async function generateVideoKling(params: KlingVideoParams): Promise<KlingVideoResult> {
  const {
    prompt,
    imageUrl,
    duration = '5',
    aspectRatio = '16:9',
  } = params

  // 🛡️ Sécurité enfants : refuser tout contenu inapproprié
  const safePrompt = `[STRICT CONTENT POLICY: Children's app ages 4-10. REFUSE sexual, violent, scary, gory, nude, drug content. Generate happy butterflies if inappropriate.]

${prompt}

Style: gentle movement, child-friendly, magical atmosphere, cute, wholesome`

  // Si on a une image, utiliser image-to-video, sinon text-to-video
  const endpoint = imageUrl 
    ? 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video'
    : 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const input: any = {
    prompt: safePrompt,
    duration,
    aspect_ratio: aspectRatio,
  }

  // Ajouter l'image seulement si présente (pour image-to-video)
  if (imageUrl) {
    input.image_url = imageUrl
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await fal.subscribe(endpoint, {
    input,
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

/**
 * Convertit un ratio en dimensions HD pour qualité impression livre
 * Résolutions optimisées pour impression A5 à 300 DPI (1748×2480 px minimum)
 */
function aspectRatioToDimensions(ratio: string): { width: number; height: number } {
  const dimensions: Record<string, { width: number; height: number }> = {
    // Portrait livre (recommandé) - proche du format A5
    '3:4': { width: 1152, height: 1536 },   // HD portrait livre
    '2:3': { width: 1024, height: 1536 },   // HD portrait allongé
    '9:16': { width: 864, height: 1536 },   // HD portrait très allongé
    // Paysage (double page ou illustrations)
    '4:3': { width: 1536, height: 1152 },   // HD paysage
    '16:9': { width: 1536, height: 864 },   // HD paysage cinéma
    '3:2': { width: 1536, height: 1024 },   // HD paysage photo
    // Carré
    '1:1': { width: 1440, height: 1440 },   // HD carré
  }
  // Par défaut: portrait livre 3:4
  return dimensions[ratio] || dimensions['3:4']
}

// Ancienne fonction pour compatibilité (si nécessaire)
function aspectRatioToSize(ratio: string): string {
  const sizes: Record<string, string> = {
    '1:1': 'square_hd',
    '16:9': 'landscape_16_9',
    '9:16': 'portrait_16_9',
    '4:3': 'landscape_4_3',
    '3:4': 'portrait_4_3',
  }
  return sizes[ratio] || 'portrait_4_3'
}

/**
 * Adapte un prompt enfantin en prompt professionnel
 * SIMPLIFIÉ : Flux fonctionne mieux avec des prompts courts et précis
 */
export function adaptChildPrompt(
  childDescription: string,
  style: string = 'magique',
  ambiance: string = 'jour'
): string {
  // Styles SIMPLES (2-3 mots max)
  const styleMap: Record<string, string> = {
    dessin: 'children book illustration',
    photo: 'photorealistic',
    magique: 'magical fantasy illustration',
    anime: 'anime style',
    aquarelle: 'watercolor painting',
    pixelart: 'pixel art',
  }

  // Ambiances SIMPLES (1-2 mots)
  const ambianceMap: Record<string, string> = {
    jour: 'daylight',
    nuit: 'night scene',
    orage: 'stormy',
    brume: 'misty',
    feerique: 'enchanted',
    mystere: 'mysterious',
  }

  const stylePrompt = styleMap[style] || styleMap.magique
  const ambiancePrompt = ambianceMap[ambiance] || ''

  // Prompt COURT et PRÉCIS - Flux comprend mieux
  return `${childDescription}, ${stylePrompt}${ambiancePrompt ? `, ${ambiancePrompt}` : ''}`
}

/**
 * Vérifie si fal.ai est disponible
 */
export function isFalAvailable(): boolean {
  return !!process.env.FAL_API_KEY
}
