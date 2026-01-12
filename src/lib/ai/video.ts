/**
 * Service Vidéo - Génération d'animations (Runway/Luma)
 * Pour créer des fonds animés pour le mode Theater
 */

const RUNWAY_API_URL = 'https://api.runwayml.com/v1'
const LUMA_API_URL = 'https://api.lumalabs.ai/dream-machine/v1'

interface GenerateVideoParams {
  imageUrl: string
  prompt?: string
  duration?: number // en secondes (4s par défaut)
  aspectRatio?: '16:9' | '9:16' | '1:1'
  motion?: 'subtle' | 'moderate' | 'dynamic'
  loop?: boolean
}

interface VideoGenerationJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  videoUrl?: string
  thumbnailUrl?: string
  error?: string
}

// ============================================
// RUNWAY ML (Gen-2)
// ============================================

/**
 * Lance une génération vidéo avec Runway Gen-2
 */
export async function generateVideoRunway(params: GenerateVideoParams): Promise<VideoGenerationJob> {
  const apiKey = process.env.RUNWAY_API_KEY
  if (!apiKey) {
    throw new Error('Clé API Runway non configurée')
  }

  const {
    imageUrl,
    prompt = '',
    duration = 4,
    motion = 'moderate',
  } = params

  // Mapper le niveau de motion
  const motionAmount = {
    subtle: 1,
    moderate: 3,
    dynamic: 5,
  }[motion]

  try {
    const response = await fetch(`${RUNWAY_API_URL}/image_to_video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-09-13',
      },
      body: JSON.stringify({
        promptImage: imageUrl,
        promptText: prompt || 'gentle camera movement, cinematic, magical atmosphere',
        model: 'gen3a_turbo',
        duration,
        ratio: '16:9',
        seed: Math.floor(Math.random() * 1000000),
        watermark: false,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Erreur Runway: ${error.message || response.statusText}`)
    }

    const data = await response.json()
    return {
      id: data.id,
      status: 'pending',
    }
  } catch (error) {
    console.error('Erreur génération vidéo Runway:', error)
    throw error
  }
}

/**
 * Vérifie le statut d'une génération Runway
 */
export async function checkRunwayStatus(taskId: string): Promise<VideoGenerationJob> {
  const apiKey = process.env.RUNWAY_API_KEY
  if (!apiKey) {
    throw new Error('Clé API Runway non configurée')
  }

  try {
    const response = await fetch(`${RUNWAY_API_URL}/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Runway-Version': '2024-09-13',
      },
    })

    if (!response.ok) {
      throw new Error('Erreur vérification statut Runway')
    }

    const data = await response.json()
    
    const statusMap: Record<string, VideoGenerationJob['status']> = {
      PENDING: 'pending',
      RUNNING: 'processing',
      SUCCEEDED: 'completed',
      FAILED: 'failed',
    }

    return {
      id: taskId,
      status: statusMap[data.status] || 'pending',
      progress: data.progress,
      videoUrl: data.output?.[0],
      error: data.failure,
    }
  } catch (error) {
    console.error('Erreur vérification statut Runway:', error)
    throw error
  }
}

// ============================================
// LUMA LABS (Dream Machine)
// ============================================

/**
 * Lance une génération vidéo avec Luma Dream Machine
 */
export async function generateVideoLuma(params: GenerateVideoParams): Promise<VideoGenerationJob> {
  const apiKey = process.env.LUMA_API_KEY
  if (!apiKey) {
    throw new Error('Clé API Luma non configurée')
  }

  const {
    imageUrl,
    prompt = 'gentle magical movement, fairy tale atmosphere',
    aspectRatio = '16:9',
    loop = true,
  } = params

  try {
    const response = await fetch(`${LUMA_API_URL}/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        keyframes: {
          frame0: {
            type: 'image',
            url: imageUrl,
          },
        },
        aspect_ratio: aspectRatio,
        loop,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Erreur Luma: ${error.detail || response.statusText}`)
    }

    const data = await response.json()
    return {
      id: data.id,
      status: 'pending',
    }
  } catch (error) {
    console.error('Erreur génération vidéo Luma:', error)
    throw error
  }
}

/**
 * Vérifie le statut d'une génération Luma
 */
export async function checkLumaStatus(generationId: string): Promise<VideoGenerationJob> {
  const apiKey = process.env.LUMA_API_KEY
  if (!apiKey) {
    throw new Error('Clé API Luma non configurée')
  }

  try {
    const response = await fetch(`${LUMA_API_URL}/generations/${generationId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error('Erreur vérification statut Luma')
    }

    const data = await response.json()
    
    const statusMap: Record<string, VideoGenerationJob['status']> = {
      queued: 'pending',
      dreaming: 'processing',
      completed: 'completed',
      failed: 'failed',
    }

    return {
      id: generationId,
      status: statusMap[data.state] || 'pending',
      videoUrl: data.assets?.video,
      thumbnailUrl: data.assets?.thumbnail,
      error: data.failure_reason,
    }
  } catch (error) {
    console.error('Erreur vérification statut Luma:', error)
    throw error
  }
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Génère une vidéo de fond pour une page (utilise le service disponible)
 */
export async function generateBackgroundVideo(
  imageUrl: string,
  ambiance: string,
  onProgress?: (progress: number) => void
): Promise<{ videoUrl: string; service: 'runway' | 'luma' }> {
  // Prompt adapté à l'ambiance
  const ambiancePrompts: Record<string, string> = {
    jour: 'gentle sunlight rays, soft clouds moving, peaceful daytime scene',
    nuit: 'twinkling stars, soft moonlight glow, peaceful night atmosphere',
    orage: 'dramatic lightning flashes, rain drops, stormy clouds',
    brume: 'slowly drifting mist, mysterious fog, soft movement',
    feerique: 'magical sparkles floating, fairy dust, enchanted glow',
    mystere: 'mysterious shadows moving, dramatic atmosphere',
    foret: 'leaves gently swaying, sunlight through trees, forest ambiance',
    ocean: 'gentle waves, water reflection, peaceful ocean movement',
  }

  const prompt = ambiancePrompts[ambiance] || 'gentle magical movement'

  // Essayer d'abord Runway, puis Luma en fallback
  try {
    // Tenter avec Runway
    const runwayJob = await generateVideoRunway({
      imageUrl,
      prompt,
      duration: 4,
      motion: 'subtle',
    })

    const result = await waitForVideoGeneration(runwayJob.id, 'runway', onProgress)
    return { videoUrl: result.videoUrl!, service: 'runway' }
  } catch (runwayError) {
    console.warn('Runway échoué, tentative avec Luma:', runwayError)
    
    // Fallback sur Luma
    const lumaJob = await generateVideoLuma({
      imageUrl,
      prompt,
      loop: true,
    })

    const result = await waitForVideoGeneration(lumaJob.id, 'luma', onProgress)
    return { videoUrl: result.videoUrl!, service: 'luma' }
  }
}

/**
 * Attend que la génération vidéo soit terminée (polling)
 */
export async function waitForVideoGeneration(
  jobId: string,
  service: 'runway' | 'luma',
  onProgress?: (progress: number) => void,
  maxWaitMs: number = 180000 // 3 minutes
): Promise<VideoGenerationJob> {
  const startTime = Date.now()
  const pollInterval = 5000 // 5 secondes

  const checkStatus = service === 'runway' ? checkRunwayStatus : checkLumaStatus

  while (Date.now() - startTime < maxWaitMs) {
    const status = await checkStatus(jobId)
    
    if (onProgress && status.progress) {
      onProgress(status.progress)
    }

    if (status.status === 'completed' && status.videoUrl) {
      return status
    }

    if (status.status === 'failed') {
      throw new Error(status.error || 'Génération vidéo échouée')
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }

  throw new Error('Timeout: la génération vidéo a pris trop de temps')
}

