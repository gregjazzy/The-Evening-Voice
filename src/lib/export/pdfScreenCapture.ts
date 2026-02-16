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
import { toPng } from 'html-to-image'
import { domToPng } from 'modern-screenshot'
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
export const mmToPx = (mm: number, dpi: number = TARGET_DPI) => Math.round((mm / 25.4) * dpi)

/** Convert millimeters to PDF points (72 DPI) */
export const mmToPt = (mm: number) => (mm / 25.4) * 72

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

// ---------------------------------------------------------------------------
// Safari detection
// ---------------------------------------------------------------------------

const isSafari =
  typeof navigator !== 'undefined' &&
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

console.log('🔍 [PDF] isSafari =', isSafari, '| UA =', typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A')

// ---------------------------------------------------------------------------
// Safari hybrid capture: 2 layers composited on canvas
// ---------------------------------------------------------------------------
// Safari's foreignObject (used by domToPng/toPng) cannot render images.
// html2canvas CAN render images but has text positioning bugs.
// Solution: capture text with domToPng, objects with html2canvas, composite.

/**
 * Load a data URL into an HTMLImageElement.
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * Safari-only: capture element in two passes and composite.
 * Pass 1 — text layer: hide [data-layer=objects], capture with domToPng
 * Pass 2 — objects layer: hide [data-layer=text], capture with html2canvas
 * Then composite both on a canvas (objects below, text on top).
 */
async function captureElementSafari(
  element: HTMLElement,
  scale: number
): Promise<string> {
  console.log('🔍 [PDF] captureElementSafari called')
  const w = element.offsetWidth * scale
  const h = element.offsetHeight * scale
  console.log('🔍 [PDF] element size:', element.offsetWidth, 'x', element.offsetHeight, '→ canvas:', w, 'x', h)

  // --- helpers to toggle layer visibility ---
  const objectEls = Array.from(element.querySelectorAll<HTMLElement>('[data-layer="objects"]'))
  const textEls = Array.from(element.querySelectorAll<HTMLElement>('[data-layer="text"]'))
  console.log('🔍 [PDF] objectEls:', objectEls.length, '| textEls:', textEls.length)

  function hideObjects() { objectEls.forEach(el => el.style.visibility = 'hidden') }
  function showObjects() { objectEls.forEach(el => el.style.visibility = '') }
  function hideText() { textEls.forEach(el => el.style.visibility = 'hidden') }
  function showText() { textEls.forEach(el => el.style.visibility = '') }

  // --- Pass 1: text layer (domToPng — foreignObject, good text, no images) ---
  // Make background transparent so text layer doesn't cover objects layer
  const origBackground = element.style.background
  element.style.background = 'transparent'
  hideObjects()
  const textDataUrl = await domToPng(element, {
    scale,
    fetch: { requestInit: { mode: 'cors' } },
  })
  showObjects()
  element.style.background = origBackground
  console.log('🔍 [PDF] Pass 1 (text) done, dataUrl length:', textDataUrl?.length || 0)

  // --- Pass 2: objects layer (html2canvas — good images, text hidden) ---
  hideText()
  const wrapper = element.parentElement
  if (wrapper) {
    // Positionner à 0,0 (requis par html2canvas) mais garder invisible via clip-path
    wrapper.style.left = '0px'
    wrapper.style.top = '0px'
    wrapper.style.clipPath = 'inset(0 0 0 0)'
    wrapper.style.opacity = '0'
  }
  const objectsCanvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    imageTimeout: 30000,
    logging: false,
    scrollX: 0,
    scrollY: 0,
  })
  if (wrapper) {
    wrapper.style.left = '-99999px'
    wrapper.style.top = '-99999px'
    wrapper.style.clipPath = ''
    wrapper.style.opacity = ''
  }
  showText()
  console.log('🔍 [PDF] Pass 2 (objects) done, canvas:', objectsCanvas.width, 'x', objectsCanvas.height)

  // --- Composite: objects below, text on top ---
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // Draw objects layer
  ctx.drawImage(objectsCanvas, 0, 0, w, h)

  // Draw text layer on top
  const textImg = await loadImage(textDataUrl)
  ctx.drawImage(textImg, 0, 0, w, h)

  return canvas.toDataURL('image/png')
}

// ---------------------------------------------------------------------------

/**
 * Capture an HTML element to a PNG data URL at the given scale.
 *
 * Chrome/Firefox: html-to-image (toPng) — single pass.
 * Safari:         hybrid 2-layer composite (domToPng + html2canvas).
 */
export async function captureElementToPng(
  element: HTMLElement,
  scale: number = 2
): Promise<string> {
  if (isSafari) {
    return captureElementSafari(element, scale)
  }

  return toPng(element, {
    pixelRatio: scale,
    cacheBust: true,
    includeQueryParams: true,
  })
}

/**
 * Debug capture: return intermediate layer snapshots.
 * Safari: text-only, objects-only, composite.
 * Chrome: single capture.
 */
export async function captureElementDebug(
  element: HTMLElement,
  scale: number = 2
): Promise<{ label: string; dataUrl: string }[]> {
  const results: { label: string; dataUrl: string }[] = []

  if (isSafari) {
    const objectEls = Array.from(element.querySelectorAll<HTMLElement>('[data-layer="objects"]'))
    const textEls = Array.from(element.querySelectorAll<HTMLElement>('[data-layer="text"]'))

    // Pass 1: text only
    const origBackground = element.style.background
    element.style.background = 'transparent'
    objectEls.forEach(el => el.style.visibility = 'hidden')
    const textDataUrl = await domToPng(element, {
      scale,
      fetch: { requestInit: { mode: 'cors' } },
    })
    objectEls.forEach(el => el.style.visibility = '')
    element.style.background = origBackground
    results.push({ label: 'Safari Pass 1 (text only)', dataUrl: textDataUrl })

    // Pass 2: objects only
    textEls.forEach(el => el.style.visibility = 'hidden')
    const wrapper = element.parentElement
    if (wrapper) {
      wrapper.style.left = '0px'
      wrapper.style.top = '0px'
      wrapper.style.clipPath = 'inset(0 0 0 0)'
      wrapper.style.opacity = '0'
    }
    const objectsCanvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      imageTimeout: 30000,
      logging: false,
      scrollX: 0,
      scrollY: 0,
    })
    if (wrapper) {
      wrapper.style.left = '-99999px'
      wrapper.style.top = '-99999px'
      wrapper.style.clipPath = ''
      wrapper.style.opacity = ''
    }
    textEls.forEach(el => el.style.visibility = '')
    results.push({ label: 'Safari Pass 2 (objects only)', dataUrl: objectsCanvas.toDataURL('image/png') })

    // Composite
    const w = element.offsetWidth * scale
    const h = element.offsetHeight * scale
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(objectsCanvas, 0, 0, w, h)
    const textImg = await loadImage(textDataUrl)
    ctx.drawImage(textImg, 0, 0, w, h)
    results.push({ label: 'Safari Composite (final)', dataUrl: canvas.toDataURL('image/png') })
  } else {
    // Chrome: single capture
    const dataUrl = await toPng(element, {
      pixelRatio: scale,
      cacheBust: true,
      includeQueryParams: true,
    })
    results.push({ label: 'Capture (html-to-image)', dataUrl })
  }

  return results
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
 * Generate a print-ready PDF by rendering pages ONE AT A TIME.
 *
 * Each page is rendered → captured → cleaned up before the next one starts.
 * This prevents pages from overlapping in the off-screen DOM and bleeding
 * into each other's captures.
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

  for (let i = 0; i < totalPages; i++) {
    onProgress?.(
      Math.round((i / totalPages) * 90),
      `Capture page ${i + 1}/${totalPages}...`
    )

    // 1. Capture to PNG
    let imageDataUrl = await captureElementToPng(pageElements[i], captureScale)

    // 2. Optionally upscale
    if (useUpscale) {
      const estimatedWidthPx = pageElements[i].offsetWidth * captureScale
      if (estimatedWidthPx < targetWidthPx * 0.7) {
        imageDataUrl = await upscaleImage(imageDataUrl, 2)
      }
    }

    // 3. Embed in PDF
    const imageBytes = dataUrlToUint8Array(imageDataUrl)
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
