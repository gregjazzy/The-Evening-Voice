/**
 * Service de détourage d'image (suppression de fond)
 * Utilise @imgly/background-removal qui fonctionne entièrement côté client
 * 
 * Avantages:
 * - Gratuit et illimité
 * - Privé (les images ne quittent pas l'appareil)
 * - Fonctionne hors-ligne après le premier chargement du modèle
 */

import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal'

export interface RemoveBackgroundOptions {
  /** Callback pour suivre la progression (0-100) */
  onProgress?: (progress: number) => void
  /** Format de sortie (défaut: 'image/png') */
  outputFormat?: 'image/png' | 'image/webp' | 'image/jpeg'
  /** Qualité pour JPEG/WEBP (0-1, défaut: 0.9) */
  quality?: number
}

export interface RemoveBackgroundResult {
  /** URL blob de l'image détourée */
  url: string
  /** Blob de l'image détourée */
  blob: Blob
  /** Fichier de l'image détourée */
  file: File
}

/**
 * Supprime le fond d'une image
 * @param imageSource - URL, Blob, ou File de l'image source
 * @param options - Options de configuration
 * @returns Promise avec l'URL blob, le blob et le fichier de l'image détourée
 */
export async function removeBackground(
  imageSource: string | Blob | File,
  options: RemoveBackgroundOptions = {}
): Promise<RemoveBackgroundResult> {
  const {
    onProgress,
    outputFormat = 'image/png',
    quality = 0.9,
  } = options

  try {
    // Signaler le début
    onProgress?.(5)

    // Configuration du modèle
    const config = {
      // Le modèle sera téléchargé et mis en cache automatiquement
      progress: (key: string, current: number, total: number) => {
        // Convertir la progression en pourcentage
        if (total > 0) {
          const percent = Math.round((current / total) * 85) + 10 // 10-95%
          onProgress?.(percent)
        }
      },
      output: {
        format: outputFormat,
        quality,
      },
    }

    onProgress?.(10)

    // Appeler le service de détourage
    const resultBlob = await imglyRemoveBackground(imageSource, config)

    onProgress?.(95)

    // Créer l'URL blob
    const url = URL.createObjectURL(resultBlob)

    // Créer le fichier avec un nom approprié
    const originalName = imageSource instanceof File 
      ? imageSource.name.replace(/\.[^/.]+$/, '') 
      : 'image'
    const extension = outputFormat === 'image/png' ? 'png' : outputFormat === 'image/webp' ? 'webp' : 'jpg'
    const file = new File([resultBlob], `${originalName}-detoured.${extension}`, { type: outputFormat })

    onProgress?.(100)

    return {
      url,
      blob: resultBlob,
      file,
    }
  } catch (error) {
    console.error('Erreur lors du détourage:', error)
    throw new Error(
      error instanceof Error 
        ? `Échec du détourage: ${error.message}` 
        : 'Échec du détourage de l\'image'
    )
  }
}

/**
 * Vérifie si le navigateur supporte le détourage
 * (nécessite WebGL2 pour le modèle ML)
 */
export function isBackgroundRemovalSupported(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    return gl !== null
  } catch {
    return false
  }
}

/**
 * Précharge le modèle ML pour accélérer les futures suppressions
 * Utile à appeler au démarrage de l'app
 */
export async function preloadModel(): Promise<void> {
  // Créer une petite image test pour déclencher le chargement du modèle
  const canvas = document.createElement('canvas')
  canvas.width = 10
  canvas.height = 10
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = 'red'
    ctx.fillRect(0, 0, 10, 10)
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), 'image/png')
    })
    
    try {
      await imglyRemoveBackground(blob, {
        // Petit modèle pour le préchargement rapide
      })
    } catch {
      // Ignorer les erreurs de préchargement
    }
  }
}
