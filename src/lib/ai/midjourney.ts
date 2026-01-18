/**
 * Service Midjourney - Génération d'images
 * Utilise ImagineAPI comme connecteur tiers
 * 
 * Priorité clés API : Clé passée en paramètre > Variable d'environnement
 */

const MIDJOURNEY_API_URL = process.env.MIDJOURNEY_API_URL || 'https://api.imagineapi.dev'

interface GenerateImageParams {
  prompt: string
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  style?: 'raw' | 'cute' | 'expressive' | 'scenic'
  chaos?: number // 0-100
  stylize?: number // 0-1000
  quality?: number // 0.25, 0.5, 1
  // Clé API optionnelle (priorité sur env var)
  apiKey?: string
}

interface GenerationJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  imageUrl?: string
  thumbnailUrl?: string
  error?: string
}

/**
 * Lance une génération d'image Midjourney
 */
export async function generateImage(params: GenerateImageParams): Promise<GenerationJob> {
  const key = params.apiKey || process.env.MIDJOURNEY_API_KEY
  if (!key) {
    throw new Error('Clé API Midjourney non configurée. Configurez-la dans les paramètres de votre famille.')
  }

  const {
    prompt,
    aspectRatio = '16:9',
    style = 'expressive',
    chaos = 15,
    stylize = 500,
    quality = 1,
  } = params

  // Construire le prompt Midjourney complet
  const fullPrompt = buildMidjourneyPrompt(prompt, { aspectRatio, style, chaos, stylize, quality })

  try {
    const response = await fetch(`${MIDJOURNEY_API_URL}/imagine`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Erreur Midjourney: ${error.message || response.statusText}`)
    }

    const data = await response.json()
    return {
      id: data.id,
      status: 'pending',
    }
  } catch (error) {
    console.error('Erreur génération image:', error)
    throw error
  }
}

/**
 * Vérifie le statut d'une génération
 */
export async function checkGenerationStatus(jobId: string, apiKey?: string): Promise<GenerationJob> {
  const key = apiKey || process.env.MIDJOURNEY_API_KEY
  if (!key) {
    throw new Error('Clé API Midjourney non configurée')
  }

  try {
    const response = await fetch(`${MIDJOURNEY_API_URL}/imagine/status/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${key}`,
      },
    })

    if (!response.ok) {
      throw new Error('Erreur vérification statut')
    }

    const data = await response.json()
    return {
      id: jobId,
      status: data.status,
      progress: data.progress,
      imageUrl: data.upscaled_urls?.[0] || data.url,
      thumbnailUrl: data.thumbnail_url,
      error: data.error,
    }
  } catch (error) {
    console.error('Erreur vérification statut:', error)
    throw error
  }
}

/**
 * Attend que la génération soit terminée (polling)
 */
export async function waitForGeneration(
  jobId: string,
  options?: { apiKey?: string; onProgress?: (progress: number) => void; maxWaitMs?: number }
): Promise<GenerationJob> {
  const { apiKey, onProgress, maxWaitMs = 120000 } = options || {}
  const startTime = Date.now()
  const pollInterval = 3000 // 3 secondes

  while (Date.now() - startTime < maxWaitMs) {
    const status = await checkGenerationStatus(jobId, apiKey)
    
    if (onProgress && status.progress) {
      onProgress(status.progress)
    }

    if (status.status === 'completed') {
      return status
    }

    if (status.status === 'failed') {
      throw new Error(status.error || 'Génération échouée')
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }

  throw new Error('Timeout: la génération a pris trop de temps')
}

/**
 * Construit un prompt Midjourney optimisé
 */
function buildMidjourneyPrompt(
  basePrompt: string,
  options: {
    aspectRatio: string
    style: string
    chaos: number
    stylize: number
    quality: number
  }
): string {
  const params: string[] = []

  // Aspect ratio
  params.push(`--ar ${options.aspectRatio}`)

  // Style
  if (options.style !== 'raw') {
    params.push(`--style ${options.style}`)
  }

  // Chaos (variabilité)
  if (options.chaos !== 0) {
    params.push(`--c ${options.chaos}`)
  }

  // Stylize (force artistique)
  params.push(`--s ${options.stylize}`)

  // Qualité
  if (options.quality !== 1) {
    params.push(`--q ${options.quality}`)
  }

  // Version du modèle
  params.push('--v 6')

  // Pas de contenu mature
  params.push('--no scary, violence, blood, horror')

  return `${basePrompt} ${params.join(' ')}`
}

/**
 * Ouvre Midjourney dans Safari avec le prompt préparé
 */
export async function launchMidjourneySafari(prompt: string): Promise<void> {
  // Copier le prompt dans le presse-papier
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    const formattedPrompt = `/imagine prompt: ${prompt}`
    await navigator.clipboard.writeText(formattedPrompt)
  }
  
  // Ouvrir Midjourney
  const midjourneyUrl = 'https://www.midjourney.com/imagine'
  window.open(midjourneyUrl, '_blank')
}

/**
 * Adapte un prompt enfantin en prompt Midjourney professionnel
 */
export function adaptChildPrompt(
  childDescription: string,
  style: string = 'magique',
  ambiance: string = 'jour'
): string {
  const styleMap: Record<string, string> = {
    dessin: 'hand-drawn illustration, sketch style, colored pencil',
    photo: 'photorealistic, cinematic lighting, detailed',
    magique: 'fantasy art, magical glow, ethereal, dreamy',
    anime: 'anime style, Studio Ghibli inspired, vibrant colors',
    aquarelle: 'watercolor painting, soft edges, artistic',
    pixelart: 'pixel art, retro game style, 8-bit aesthetic',
  }

  const ambianceMap: Record<string, string> = {
    jour: 'bright daylight, warm golden hour',
    nuit: 'night scene, starry sky, moonlight',
    orage: 'dramatic stormy weather, lightning',
    brume: 'misty atmosphere, soft fog, mysterious',
    feerique: 'enchanted forest, fairy lights, magical sparkles',
    mystere: 'mysterious shadows, dramatic lighting',
  }

  const stylePrompt = styleMap[style] || styleMap.magique
  const ambiancePrompt = ambianceMap[ambiance] || ambianceMap.jour

  return `${childDescription}, ${stylePrompt}, ${ambiancePrompt}, child-friendly, beautiful composition, highly detailed`
}

