/**
 * Service d'export PDF par capture d'écran — Gelato print-ready
 *
 * Workflow :
 * 1. Rend chaque page via construction DOM impérative (miroir BookMode)
 * 2. Capture avec html-to-image (SVG foreignObject, fidèle au navigateur)
 * 3. Optionally upscale via fal.ai Real-ESRGAN
 * 4. Assemble en PDF avec pdf-lib (remplace jsPDF)
 *
 * The PDF produced is ready to send to Gelato for printing:
 * - Dimensions include 3mm bleed on each side
 * - Resolution ≥ 300 DPI
 * - PNG pages
 */

import { PDFDocument } from 'pdf-lib'
import html2canvas from 'html2canvas'
import type { Story } from '@/store/useAppStore'
import { CANONICAL_PAGE_WIDTH, getCanonicalDimensions } from '@/lib/rendering/pageRendering'
import { BOOK_FORMATS, type BookFormatConfig } from '@/store/usePublishStore'

export { BOOK_FORMATS, type BookFormatConfig }

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Target print resolution */
const TARGET_DPI = 300

/** Convert millimeters to pixels at a given DPI */
const mmToPx = (mm: number, dpi: number = TARGET_DPI) => Math.round((mm / 25.4) * dpi)

/** Convert millimeters to PDF points (72 DPI) */
const mmToPt = (mm: number) => (mm / 25.4) * 72

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScreenCapturePdfOptions {
  format: BookFormatConfig
  pageColor?: string
  showLines?: boolean
  includePageNumbers?: boolean
  onProgress?: (progress: number, message: string) => void
  useUpscale?: boolean
}

export interface ScreenCapturePdfResult {
  blob: Blob
  url: string
  pageCount: number
  fileSize: number
  dimensions: { widthPx: number; heightPx: number }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the capture scale needed so that the captured image
 * reaches at least the target pixel width for 300 DPI (including bleed).
 */
export function computeCaptureScale(format: BookFormatConfig): number {
  const targetWidthPx = mmToPx(format.widthMm + 2 * format.bleedMm, TARGET_DPI)
  const bleedPx = Math.round((format.bleedMm / format.widthMm) * CANONICAL_PAGE_WIDTH)
  const renderWidthPx = CANONICAL_PAGE_WIDTH + 2 * bleedPx
  return Math.ceil(targetWidthPx / renderWidthPx)
}

/**
 * Compute the bleed in canonical pixels (same coordinate space as CANONICAL_PAGE_WIDTH).
 */
export function computeBleedPx(format: BookFormatConfig): number {
  return Math.round((format.bleedMm / format.widthMm) * CANONICAL_PAGE_WIDTH)
}

/**
 * Capture an HTML element to a canvas at the given scale.
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
    backgroundColor: null,
    imageTimeout: 30000,
  })
}

/**
 * Convert a data URL to a Uint8Array.
 */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Upscale an image via the fal.ai Real-ESRGAN API endpoint.
 */
async function upscaleImage(imageDataUrl: string, scale: 2 | 4 = 2): Promise<string> {
  try {
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
    return imageDataUrl
  }
}

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

/**
 * Generate a print-ready PDF from pre-rendered page elements.
 *
 * Uses pdf-lib instead of jsPDF for accurate image placement.
 * The PDF dimensions include bleed (3mm each side) so it can be sent
 * directly to Gelato for printing.
 */
export async function generatePdfFromScreenCaptures(
  story: Story,
  pageElements: HTMLElement[],
  options: ScreenCapturePdfOptions
): Promise<ScreenCapturePdfResult> {
  const {
    format,
    onProgress,
    useUpscale = true,
  } = options

  // PDF dimensions include 3mm bleed on each side for Gelato
  const pdfWidthMm = format.widthMm + 2 * format.bleedMm
  const pdfHeightMm = format.heightMm + 2 * format.bleedMm

  // PDF dimensions in points (pdf-lib uses points, 1pt = 1/72 inch)
  const pdfWidthPt = mmToPt(pdfWidthMm)
  const pdfHeightPt = mmToPt(pdfHeightMm)

  // Target pixel dimensions at 300 DPI (for quality verification)
  const targetWidthPx = mmToPx(pdfWidthMm)
  const targetHeightPx = mmToPx(pdfHeightMm)

  // Dynamic capture scale — enough pixels for 300 DPI
  const bleedPx = computeBleedPx(format)
  const renderWidthPx = CANONICAL_PAGE_WIDTH + 2 * bleedPx
  const captureScale = Math.ceil(targetWidthPx / renderWidthPx)

  // Create PDF document with pdf-lib
  const pdfDoc = await PDFDocument.create()

  const totalPages = pageElements.length

  // --- Parallel capture: batch html2canvas calls (4 at a time to avoid OOM) ---
  const BATCH_SIZE = 4
  const capturedImages: string[] = new Array(totalPages)

  for (let batchStart = 0; batchStart < totalPages; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, totalPages)

    onProgress?.(
      Math.round((batchStart / totalPages) * 80),
      `Capture pages ${batchStart + 1}-${batchEnd}/${totalPages}...`
    )

    const batchPromises = []
    for (let i = batchStart; i < batchEnd; i++) {
      batchPromises.push(
        captureElementToCanvas(pageElements[i], captureScale).then(canvas => {
          const dataUrl = canvas.toDataURL('image/png')
          capturedImages[i] = dataUrl
        })
      )
    }
    await Promise.all(batchPromises)
  }

  // --- Optionally upscale (parallel per batch) ---
  if (useUpscale) {
    for (let i = 0; i < totalPages; i++) {
      // Estimate pixel width from element
      const estimatedWidthPx = pageElements[i].offsetWidth * captureScale
      if (estimatedWidthPx < targetWidthPx * 0.7) {
        onProgress?.(Math.round(80 + (i / totalPages) * 10), `Upscale page ${i + 1}...`)
        capturedImages[i] = await upscaleImage(capturedImages[i], 2)
      }
    }
  }

  // --- Assemble PDF (sequential — pdf-lib needs ordered pages) ---
  onProgress?.(90, 'Assemblage du PDF...')

  for (let i = 0; i < totalPages; i++) {
    const imageBytes = dataUrlToUint8Array(capturedImages[i])
    const pngImage = await pdfDoc.embedPng(imageBytes)
    const page = pdfDoc.addPage([pdfWidthPt, pdfHeightPt])
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pdfWidthPt,
      height: pdfHeightPt,
    })
  }

  onProgress?.(100, 'Génération du PDF terminée !')

  const pdfBytes = await pdfDoc.save()
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
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
 * Download a generated PDF result.
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
 * Estimate PDF generation time.
 */
export function estimateGenerationTime(
  pageCount: number,
  useUpscale: boolean
): { seconds: number; message: string } {
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
 * Get the capture dimensions for a page (canonical + bleed).
 * Used by usePdfExport to create the off-screen renderer at the right size.
 */
export function getPageCaptureSize(format: BookFormatConfig): {
  width: number
  height: number
  bleedPx: number
} {
  const dims = getCanonicalDimensions(format.id)
  const bleedPx = computeBleedPx(format)
  return {
    width: dims.width,
    height: dims.height,
    bleedPx,
  }
}

export default generatePdfFromScreenCaptures
