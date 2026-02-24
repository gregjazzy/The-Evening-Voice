/**
 * Service de génération d'images via Google Gemini API (direct)
 *
 * Remplace fal.ai/nano-banana-pro pour la génération d'images.
 * Avantages :
 * - Réponse directe (pas de polling/queue)
 * - Base64 retourné dans la réponse (pas de proxy fal.media)
 * - Même modèle sous-jacent (Gemini), sans intermédiaire
 *
 * Modèles :
 * - gemini-2.5-flash-image : Rapide, optimisé pour le volume
 * - gemini-3-pro-image-preview : Pro, meilleure qualité
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// Modèle par défaut
const DEFAULT_MODEL = 'gemini-3-pro-image-preview'

export interface GeminiImageParams {
  prompt: string
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2'
  resolution?: '1K' | '2K' | '4K'
  model?: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview'
}

export interface GeminiImageResult {
  status: 'completed' | 'failed'
  imageUrl?: string   // data:image/png;base64,...
  width?: number
  height?: number
  error?: string
}

/**
 * Génère une image via l'API Gemini directe
 * Retourne une data URL base64 (pas besoin de proxy)
 */
export async function generateImageGemini(params: GeminiImageParams): Promise<GeminiImageResult> {
  const {
    prompt,
    aspectRatio = '3:4',
    resolution = '2K',
    model = DEFAULT_MODEL,
  } = params

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY non configurée')
  }

  if (!prompt || prompt.length < 3) {
    throw new Error('Le prompt doit avoir au moins 3 caractères')
  }

  console.log(`🎨 Gemini Image (${model}) - Ratio: ${aspectRatio}, Resolution: ${resolution}`)
  console.log(`   Prompt: ${prompt.substring(0, 150)}...`)

  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`

  const body = {
    contents: [{
      parts: [{ text: prompt }],
    }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
      imageConfig: {
        aspectRatio,
        imageSize: resolution,
      },
    },
  }

  const controller = new AbortController()
  // Timeout de 55s (Gemini 3 Pro Image est plus lent que Flash)
  const timeout = setTimeout(() => controller.abort(), 55000)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Gemini Image API error:', response.status, errorText)
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    // Extraire l'image base64 de la réponse
    const candidate = data.candidates?.[0]
    if (!candidate?.content?.parts) {
      console.error('❌ Réponse Gemini inattendue:', JSON.stringify(data, null, 2))
      return { status: 'failed', error: 'Réponse inattendue de Gemini' }
    }

    // Chercher la partie image dans les parts
    const imagePart = candidate.content.parts.find(
      (part: { inlineData?: { mimeType: string; data: string } }) => part.inlineData?.mimeType?.startsWith('image/')
    )

    if (!imagePart?.inlineData) {
      // Gemini a peut-être refusé de générer (safety filter)
      const textPart = candidate.content.parts.find(
        (part: { text?: string }) => part.text
      )
      const refusalText = textPart?.text || 'Image non générée'
      console.warn('⚠️ Gemini n\'a pas généré d\'image:', refusalText)
      return { status: 'failed', error: refusalText }
    }

    const { mimeType, data: base64Data } = imagePart.inlineData
    const imageUrl = `data:${mimeType};base64,${base64Data}`

    // Estimer les dimensions basées sur le ratio et la résolution
    const dimensions = estimateDimensions(aspectRatio, resolution)

    console.log(`✅ Image Gemini générée: ${mimeType}, ~${Math.round(base64Data.length / 1024)}KB`)

    return {
      status: 'completed',
      imageUrl,
      width: dimensions.width,
      height: dimensions.height,
    }
  } catch (error) {
    clearTimeout(timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ Gemini Image timeout (25s)')
      return { status: 'failed', error: 'Timeout - génération trop longue' }
    }
    throw error
  }
}

/**
 * Vérifie si l'API Gemini Image est disponible
 */
export function isGeminiImageAvailable(): boolean {
  return !!process.env.GOOGLE_GEMINI_API_KEY
}

/**
 * Estime les dimensions de l'image selon le ratio et la résolution
 */
function estimateDimensions(
  aspectRatio: string,
  resolution: string
): { width: number; height: number } {
  // Base de pixels selon la résolution
  const basePixels: Record<string, number> = {
    '1K': 1024,
    '2K': 2048,
    '4K': 4096,
  }
  const base = basePixels[resolution] || 1024

  const ratioMap: Record<string, { w: number; h: number }> = {
    '1:1': { w: 1, h: 1 },
    '16:9': { w: 16, h: 9 },
    '9:16': { w: 9, h: 16 },
    '4:3': { w: 4, h: 3 },
    '3:4': { w: 3, h: 4 },
    '2:3': { w: 2, h: 3 },
    '3:2': { w: 3, h: 2 },
  }

  const ratio = ratioMap[aspectRatio] || ratioMap['3:4']
  const scale = Math.sqrt((base * base) / (ratio.w * ratio.h))

  return {
    width: Math.round(ratio.w * scale),
    height: Math.round(ratio.h * scale),
  }
}
