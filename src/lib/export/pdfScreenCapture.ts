/**
 * Service d'export PDF par capture d'écran
 * 
 * Workflow :
 * 1. Rend chaque page via ExactPageRenderer
 * 2. Capture avec html2canvas
 * 3. Upscale via fal.ai Real-ESRGAN si nécessaire (pour 300 DPI)
 * 4. Ajoute les numéros de page
 * 5. Assemble en PDF avec jsPDF
 * 
 * Avantage : Le PDF ressemble EXACTEMENT à ce qu'on voit dans l'éditeur
 */

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { Story, StoryPage } from '@/store/useAppStore'
import { REFERENCE_PAGE_WIDTH } from '@/lib/rendering/pageRendering'
import { BOOK_FORMATS, type BookFormatConfig } from '@/store/usePublishStore'

export { BOOK_FORMATS, type BookFormatConfig }

// Résolution cible pour l'impression
const TARGET_DPI = 300
const SCREEN_DPI = 96

// Conversion mm → pixels à une résolution donnée
const mmToPx = (mm: number, dpi: number = TARGET_DPI) => Math.round((mm / 25.4) * dpi)

// Options d'export
export interface ScreenCapturePdfOptions {
  format: BookFormatConfig
  pageColor?: string
  showLines?: boolean
  includePageNumbers?: boolean
  onProgress?: (progress: number, message: string) => void
  useUpscale?: boolean // Utiliser fal.ai pour upscaler (recommandé)
}

// Résultat de l'export
export interface ScreenCapturePdfResult {
  blob: Blob
  url: string
  pageCount: number
  fileSize: number
  dimensions: { widthPx: number; heightPx: number }
}

/**
 * Capture un élément HTML en canvas
 */
async function captureElementToCanvas(
  element: HTMLElement,
  scale: number = 2
): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: null, // Transparent — let the page gradient show through
    imageTimeout: 30000,
  })
}

/**
 * Convertit un canvas en Data URL (PNG lossless)
 */
function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png')
}

/**
 * Upscale une image via l'API fal.ai
 */
async function upscaleImage(imageDataUrl: string, scale: 2 | 4 = 2): Promise<string> {
  try {
    // Convertir data URL en Blob puis upload temporaire
    const response = await fetch(imageDataUrl)
    const blob = await response.blob()
    
    // Créer une URL temporaire pour l'upload
    const formData = new FormData()
    formData.append('file', blob, 'page.jpg')
    
    // Upload vers Supabase temporaire ou utiliser directement
    // Pour simplifier, on va envoyer le base64 à notre API
    const base64 = imageDataUrl.split(',')[1]
    
    const upscaleResponse = await fetch('/api/ai/upscale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        scale,
      }),
    })
    
    if (!upscaleResponse.ok) {
      console.warn('Upscale failed, using original image')
      return imageDataUrl
    }
    
    const result = await upscaleResponse.json()
    return result.url || imageDataUrl
  } catch (error) {
    console.error('Upscale error:', error)
    return imageDataUrl // Fallback to original
  }
}

/**
 * Génère un PDF à partir des captures d'écran des pages
 * 
 * @param story L'histoire à exporter
 * @param pageElements Les éléments DOM des pages rendues
 * @param options Options d'export
 */
export async function generatePdfFromScreenCaptures(
  story: Story,
  pageElements: HTMLElement[],
  options: ScreenCapturePdfOptions
): Promise<ScreenCapturePdfResult> {
  const {
    format,
    includePageNumbers = true,
    onProgress,
    useUpscale = true,
  } = options

  // Dimensions finales du PDF en mm
  const pdfWidthMm = format.widthMm
  const pdfHeightMm = format.heightMm

  // Dimensions cibles en pixels pour 300 DPI
  const targetWidthPx = mmToPx(pdfWidthMm)
  const targetHeightPx = mmToPx(pdfHeightMm)

  // Calculer le scale pour html2canvas
  // scale 5 → 500px * 5 = 2500px, proche de 300 DPI pour A5 (2480px)
  const captureScale = 5

  // Créer le PDF
  const pdf = new jsPDF({
    orientation: pdfWidthMm > pdfHeightMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pdfWidthMm, pdfHeightMm],
    compress: true,
  })

  const totalPages = pageElements.length
  let processedPages = 0

  // Traiter chaque page
  for (let i = 0; i < pageElements.length; i++) {
    const element = pageElements[i]
    const page = story.pages[i]
    const isCover = i === 0 || page?.pageType === 'front-cover'
    const isBackCover = i === pageElements.length - 1 || page?.pageType === 'back-cover'

    onProgress?.(
      Math.round((processedPages / totalPages) * 100),
      `Capture de la page ${i + 1}/${totalPages}...`
    )

    // 1. Capturer l'élément en canvas (PNG lossless)
    const canvas = await captureElementToCanvas(element, captureScale)
    let imageDataUrl = canvasToDataUrl(canvas)

    // 2. Upscaler si nécessaire et demandé
    if (useUpscale) {
      onProgress?.(
        Math.round((processedPages / totalPages) * 100),
        `Amélioration qualité page ${i + 1}/${totalPages}...`
      )
      
      // Calculer si l'upscale est nécessaire (scale 5 donne déjà ~2500px)
      const currentWidthPx = canvas.width
      const needsUpscale = currentWidthPx < targetWidthPx * 0.7 // 70% de la cible

      if (needsUpscale) {
        imageDataUrl = await upscaleImage(imageDataUrl, 2)
      }
    }

    // 3. Ajouter au PDF
    if (i > 0) {
      pdf.addPage([pdfWidthMm, pdfHeightMm])
    }

    // Ajouter l'image (elle sera redimensionnée pour tenir dans la page)
    pdf.addImage(imageDataUrl, 'PNG', 0, 0, pdfWidthMm, pdfHeightMm)

    processedPages++
  }

  onProgress?.(100, 'Génération du PDF terminée !')

  // Générer le blob
  const blob = pdf.output('blob')
  const url = URL.createObjectURL(blob)

  return {
    blob,
    url,
    pageCount: totalPages,
    fileSize: blob.size,
    dimensions: { widthPx: targetWidthPx, heightPx: targetHeightPx },
  }
}

/**
 * Télécharge le PDF généré
 */
export function downloadPdf(result: ScreenCapturePdfResult, filename: string): void {
  const link = document.createElement('a')
  link.href = result.url
  link.download = `${filename}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Estime le temps de génération du PDF
 */
export function estimateGenerationTime(
  pageCount: number,
  useUpscale: boolean
): { seconds: number; message: string } {
  // ~2s par page pour capture, ~5s par page avec upscale
  const secondsPerPage = useUpscale ? 7 : 2
  const totalSeconds = pageCount * secondsPerPage

  if (totalSeconds < 60) {
    return { seconds: totalSeconds, message: `~${totalSeconds} secondes` }
  } else {
    const minutes = Math.ceil(totalSeconds / 60)
    return { seconds: totalSeconds, message: `~${minutes} minute${minutes > 1 ? 's' : ''}` }
  }
}

/**
 * Calcule les dimensions de capture pour une page
 * Retourne les dimensions en pixels pour un rendu à l'écran
 * qui sera ensuite capturé et upscalé
 */
export function getPageCaptureSize(format: BookFormatConfig): { width: number; height: number } {
  // On rend à REFERENCE_PAGE_WIDTH (500px) pour que scale = 1.0 (zéro erreur d'arrondi)
  const RENDER_WIDTH = REFERENCE_PAGE_WIDTH
  const aspectRatio = format.heightMm / format.widthMm
  const renderHeight = Math.round(RENDER_WIDTH * aspectRatio)
  
  return {
    width: RENDER_WIDTH,
    height: renderHeight,
  }
}

export default generatePdfFromScreenCaptures
