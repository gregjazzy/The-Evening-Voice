/**
 * Service fal.ai unifié
 * Gère tous les appels IA : Images (Flux), Vidéos (Kling), Voix (ElevenLabs), Sync (Sync Labs)
 * 
 * NOTE: Utilise fetch directement au lieu du SDK pour éviter les timeouts sur Netlify
 */

import { fal } from '@fal-ai/client'

// Configuration fal.ai - paresseuse pour Netlify
let falConfigured = false
function ensureFalConfigured() {
  if (!falConfigured && process.env.FAL_API_KEY) {
    fal.config({
      credentials: process.env.FAL_API_KEY,
    })
    falConfigured = true
    console.log('✅ fal.ai configuré avec la clé:', process.env.FAL_API_KEY?.substring(0, 8) + '...')
  }
}

// Helper pour les appels REST directs à fal.ai (évite le SDK qui peut timeout)
async function falFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const apiKey = process.env.FAL_API_KEY
  if (!apiKey) {
    throw new Error('FAL_API_KEY non configurée')
  }
  
  return fetch(endpoint, {
    ...options,
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

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
  // Cas 1: Job en attente (retourné immédiatement pour éviter timeout Netlify)
  jobId?: string
  model?: 'nano-banana' | 'recraft' | 'flux' | 'flux-img2img'
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  
  // Cas 2: Résultat final avec images
  images?: Array<{
    url: string
    width: number
    height: number
  }>
  seed?: number
  prompt?: string
}

// ============================================
// FLUX REDUX - Consistance de personnage/style
// Flux Image-to-Image : Transforme une image de référence selon un nouveau prompt
// Garde le style/personnage de l'image originale tout en appliquant le nouveau contexte
// ============================================

export interface FluxReduxParams {
  prompt: string
  referenceImageUrl: string  // Image contenant le personnage/style à garder
  characterDescription?: string  // "le dragon bleu" - ajouté au prompt
  aspectRatio?: '21:9' | '16:9' | '4:3' | '3:2' | '1:1' | '2:3' | '3:4' | '9:16' | '9:21'
}

/**
 * Génère une image avec Flux img2img en gardant le personnage d'une image de référence
 * Fonctionne avec tout : humains, animaux, créatures, objets
 */
export async function generateImageRedux(params: FluxReduxParams): Promise<FluxImageResult> {
  const {
    prompt,
    referenceImageUrl,
    characterDescription,
  } = params

  // Construire un prompt explicite qui dit à l'IA de réutiliser le personnage
  const fullPrompt = characterDescription 
    ? `Use the exact same character (${characterDescription}) from the reference image. New scene: ${prompt}`
    : prompt

  console.log(`🎨 Flux img2img - Génération avec personnage de référence`)
  console.log(`   Prompt: ${fullPrompt.substring(0, 100)}...`)
  console.log(`   Référence: ${referenceImageUrl.substring(0, 50)}...`)

  // Flux img2img : transforme l'image de référence selon le prompt
  // strength = 0.5 → garde 50% de l'image originale, 50% du nouveau prompt
  const submitResponse = await falFetch('https://queue.fal.run/fal-ai/flux/dev/image-to-image', {
    method: 'POST',
    body: JSON.stringify({
      prompt: fullPrompt,
      image_url: referenceImageUrl,
      strength: 0.5,  // 0.5 = équilibre entre image originale et nouveau prompt
      num_inference_steps: 28,
      guidance_scale: 3.5,
    }),
  })

  if (!submitResponse.ok) {
    const errorText = await submitResponse.text()
    console.error('❌ Erreur soumission Flux Redux:', submitResponse.status, errorText)
    throw new Error(`Erreur Flux Redux: ${submitResponse.status}`)
  }

  const submitData = await submitResponse.json()
  const request_id = submitData.request_id

  console.log('🔄 Flux Redux job submitted:', request_id)

  return {
    jobId: request_id,
    model: 'flux-img2img' as const,
    status: 'pending' as const,
  }
}

/**
 * Vérifie le statut d'un job Flux Redux
 * Note: fal.ai utilise une URL raccourcie pour les status: fal-ai/flux-pro (pas le chemin complet)
 */
export async function checkReduxJobStatus(jobId: string): Promise<FluxImageResult> {
  console.log(`🔍 Checking Flux Redux job status: ${jobId}`)

  // fal.ai utilise une URL raccourcie pour les status
  const statusResponse = await falFetch(`https://queue.fal.run/fal-ai/flux-pro/requests/${jobId}/status`)

  if (!statusResponse.ok) {
    console.error('❌ Erreur status Flux Redux:', statusResponse.status)
    throw new Error(`Erreur vérification status Flux Redux: ${statusResponse.status}`)
  }

  const statusData = await statusResponse.json()
  console.log(`📊 Flux Redux job ${jobId} status:`, statusData.status)

  if (statusData.status === 'COMPLETED') {
    const resultResponse = await falFetch(`https://queue.fal.run/fal-ai/flux-pro/requests/${jobId}`)

    if (!resultResponse.ok) {
      throw new Error(`Erreur récupération résultat Flux Redux: ${resultResponse.status}`)
    }

    const data = await resultResponse.json()
    console.log('✅ Flux Redux job completed')

    const images = data.images?.map((img: { url: string; width?: number; height?: number }) => ({
      url: img.url,
      width: img.width || 1024,
      height: img.height || 1024,
    })) || []

    return {
      status: 'completed',
      images,
      seed: data.seed || 0,
      prompt: data.prompt || '',
    }
  }

  if (statusData.status === 'FAILED') {
    return {
      jobId,
      model: 'flux-img2img',
      status: 'failed',
    }
  }

  return {
    jobId,
    model: 'flux-img2img',
    status: statusData.status === 'IN_PROGRESS' ? 'processing' : 'pending',
  }
}

/**
 * Vérifie le statut d'un job de génération d'image fal.ai
 * Appelé par le client en polling pour les jobs nano-banana
 * Utilise REST API directement pour éviter les timeouts du SDK
 */
export async function checkImageJobStatus(jobId: string, model: string): Promise<FluxImageResult> {
  const modelEndpoint = model === 'nano-banana' ? 'fal-ai/nano-banana-pro' : 
                        model === 'recraft' ? 'fal-ai/recraft-v3' : 
                        model === 'flux-img2img' ? 'fal-ai/flux' :  // img2img utilise le même endpoint que flux
                        'fal-ai/flux-pro/v1.1'
  
  console.log(`🔍 Checking job status: ${jobId} for ${modelEndpoint}`)
  
  // Vérifier le status via REST API
  const statusResponse = await falFetch(`https://queue.fal.run/${modelEndpoint}/requests/${jobId}/status`)
  
  if (!statusResponse.ok) {
    console.error('❌ Erreur status fal.ai:', statusResponse.status)
    throw new Error(`Erreur vérification status: ${statusResponse.status}`)
  }
  
  const statusData = await statusResponse.json()
  console.log(`📊 Job ${jobId} status:`, statusData.status)
  
  if (statusData.status === 'COMPLETED') {
    // Récupérer le résultat
    const resultResponse = await falFetch(`https://queue.fal.run/${modelEndpoint}/requests/${jobId}`)
    
    if (!resultResponse.ok) {
      throw new Error(`Erreur récupération résultat: ${resultResponse.status}`)
    }
    
    const data = await resultResponse.json()
    console.log('✅ Job completed, result:', JSON.stringify(data, null, 2))
    
    // Nano Banana retourne { images: [...] }
    if (model === 'nano-banana') {
      const images = data.images?.map((img: { url: string; width?: number; height?: number }) => ({
        url: img.url,
        width: img.width || 1024,
        height: img.height || 1024,
      })) || []
      
      return {
        status: 'completed',
        images,
        seed: 0,
        prompt: '',
      }
    }
    
    // Recraft retourne { images: [{ url }] }
    if (model === 'recraft') {
      const images = data.images?.map((img: { url: string }) => ({
        url: img.url,
        width: 1024,
        height: 1024,
      })) || []
      
      return {
        status: 'completed',
        images,
        seed: 0,
        prompt: '',
      }
    }
    
    // Flux img2img retourne { images: [...] }
    if (model === 'flux-img2img') {
      const image = data.image || data.images?.[0]
      const images = image ? [{
        url: image.url,
        width: image.width || 1024,
        height: image.height || 1024,
      }] : []
      
      return {
        status: 'completed',
        images,
        seed: 0,
        prompt: '',
      }
    }
    
    // Flux retourne { images: [{ url, width, height }], seed }
    return {
      status: 'completed',
      images: data.images || [],
      seed: data.seed || 0,
      prompt: '',
    }
  }
  
  if (statusData.status === 'FAILED') {
    return {
      jobId,
      model: model as 'nano-banana' | 'recraft' | 'flux',
      status: 'failed',
    }
  }
  
  // IN_QUEUE ou IN_PROGRESS
  return {
    jobId,
    model: model as 'nano-banana' | 'recraft' | 'flux',
    status: statusData.status === 'IN_PROGRESS' ? 'processing' : 'pending',
  }
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
  ensureFalConfigured()
  
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
    
    // Validation : prompt doit avoir minimum 3 caractères
    if (!safePrompt || safePrompt.length < 3) {
      throw new Error('Le prompt doit avoir au moins 3 caractères')
    }

    // Soumettre le job via REST API (évite le SDK qui peut timeout sur Netlify)
    const submitResponse = await falFetch('https://queue.fal.run/fal-ai/nano-banana-pro', {
      method: 'POST',
      body: JSON.stringify({
        prompt: safePrompt,
        aspect_ratio: ratio,
        resolution: resolution,
        num_images: numImages,
        output_format: 'png',
      }),
    })
    
    if (!submitResponse.ok) {
      const errorText = await submitResponse.text()
      console.error('❌ Erreur soumission fal.ai:', submitResponse.status, errorText)
      throw new Error(`Erreur fal.ai: ${submitResponse.status}`)
    }
    
    const submitData = await submitResponse.json()
    const request_id = submitData.request_id
    
    console.log('🍌 Nano Banana job submitted:', request_id)
    
    // Retourner le jobId pour que le client puisse poll
    return {
      jobId: request_id,
      model: 'nano-banana' as const,
      status: 'pending' as const,
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
  ensureFalConfigured()
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
  ensureFalConfigured()
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
  ensureFalConfigured()
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
  ensureFalConfigured()
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
  ensureFalConfigured()
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
