/**
 * Hook pour l'export PDF par capture d'écran — Gelato print-ready
 *
 * Construit le DOM de chaque page de manière impérative (miroir exact de BookMode),
 * capture avec html-to-image, et assemble en PDF via pdf-lib.
 *
 * Chaque page est rendue individuellement à position (0,0) sur <body>
 * pour éviter les bugs html2canvas liés au positionnement/stacking.
 */

import { useState, useCallback } from 'react'
import type { Story, PageMedia, PageDecoration, PageTextBox } from '@/store/useAppStore'
import { PREMIUM_DECORATIONS } from '@/data/decorations'
import {
  getPagePaddingPx,
  getBaseLineHeightPx,
  getScaledLineHeightPx,
  getScaledFontSize,
  getPageScale,
  DECORATION_BASE_SIZE,
  CANONICAL_PAGE_WIDTH,
} from '@/lib/rendering/pageRendering'
import type { LineSpacing } from '@/lib/rendering/pageRendering'
import {
  generatePdfFromScreenCaptures,
  downloadPdf,
  getPageCaptureSize,
  estimateGenerationTime,
  computeBleedPx,
  type ScreenCapturePdfResult,
} from '@/lib/export/pdfScreenCapture'
import { BOOK_FORMATS, type BookFormatConfig } from '@/store/usePublishStore'

export interface PdfExportState {
  isExporting: boolean
  progress: number
  message: string
  error: string | null
  result: ScreenCapturePdfResult | null
}

export interface PdfExportOptions {
  format?: BookFormatConfig
  pageColor?: string
  showLines?: boolean
  includePageNumbers?: boolean
  useUpscale?: boolean
}

// ---------------------------------------------------------------------------
// Page color gradients — same as BookMode's getPageColorStyles()
// ---------------------------------------------------------------------------

type PageColor = 'cream' | 'white' | 'aged' | 'parchment' | 'blue' | 'pink' | 'mint' | 'lavender' | 'peach' | 'sky'

const PAGE_GRADIENTS: Record<PageColor, string> = {
  cream:     'linear-gradient(225deg, #fef9f0 0%, #fdf6e8 50%, #fbf2df 100%)',
  white:     'linear-gradient(225deg, #ffffff 0%, #fafafa 50%, #f5f5f5 100%)',
  aged:      'linear-gradient(225deg, #fde68a 0%, #fcd34d 50%, #fbbf24 100%)',
  parchment: 'linear-gradient(225deg, #ffedd5 0%, #fed7aa 50%, #fdba74 100%)',
  blue:      'linear-gradient(225deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)',
  pink:      'linear-gradient(225deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)',
  mint:      'linear-gradient(225deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)',
  lavender:  'linear-gradient(225deg, #faf5ff 0%, #f3e8ff 50%, #e9d5ff 100%)',
  peach:     'linear-gradient(225deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
  sky:       'linear-gradient(225deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
}

// ---------------------------------------------------------------------------
// Imperative DOM construction — mirrors BookMode exactly
// ---------------------------------------------------------------------------

/**
 * Build a single page's DOM imperatively, mirroring BookMode's exact structure.
 * Returns the .printable-page element ready for html2canvas capture.
 */
function buildPageDOM(
  page: Story['pages'][0],
  pageIndex: number,
  totalPages: number,
  pageColor: string,
  showLines: boolean,
  width: number,
  height: number,
  bookFormat: string,
  bleedPx: number,
): HTMLElement {
  const style = page.style || {}
  const gradient = PAGE_GRADIENTS[(pageColor as PageColor) || 'cream'] || PAGE_GRADIENTS.cream

  const isFrontCover = pageIndex === 0
  const isBackCover = pageIndex === totalPages - 1 && totalPages > 1

  const scale = getPageScale(width)
  const pagePad = getPagePaddingPx(bookFormat as any)

  // Text styles — same defaults as BookMode's DEFAULT_STYLE
  const fontSize = style.fontSize || 18
  const lineSpacing = (style.lineSpacing || 'normal') as LineSpacing
  const lineHeightPx = getBaseLineHeightPx(lineSpacing)
  const fontFamily = style.fontFamily || "'Merriweather', serif"

  // Bleed support
  const bleedPxV = bleedPx
  const renderWidth = width + 2 * bleedPx
  const renderHeight = height + 2 * bleedPxV

  // ---- 1. Page container (= BookMode page container) ----
  const pageDiv = document.createElement('div')
  pageDiv.className = 'printable-page'
  pageDiv.style.cssText = `
    position: relative;
    width: ${renderWidth}px;
    height: ${renderHeight}px;
    background: ${gradient};
    overflow: hidden;
  `

  // Content area — offset by bleed so positions match canonical coordinates
  const contentArea = document.createElement('div')
  contentArea.style.cssText = `
    position: absolute;
    left: ${bleedPx}px;
    top: ${bleedPxV}px;
    width: ${width}px;
    height: ${height}px;
  `
  pageDiv.appendChild(contentArea)

  // ---- 2. Background media (same structure as BookMode) ----
  if (page.backgroundMedia) {
    const bgContainer = document.createElement('div')
    // Extends into bleed via negative inset
    bgContainer.style.cssText = `
      position: absolute;
      left: ${-bleedPx}px;
      top: ${-bleedPxV}px;
      right: ${-bleedPx}px;
      bottom: ${-bleedPxV}px;
      overflow: hidden;
      z-index: 0;
    `

    if (page.backgroundMedia.type === 'video') {
      const video = document.createElement('video')
      video.src = page.backgroundMedia.url
      video.muted = true
      video.playsInline = true
      video.style.cssText = `
        position: absolute;
        left: ${bleedPx}px;
        top: ${bleedPxV}px;
        width: ${width}px;
        height: ${height}px;
        object-fit: cover;
        opacity: ${page.backgroundMedia.opacity};
        transform: translate(${page.backgroundMedia.x || 0}px, ${page.backgroundMedia.y || 0}px) scale(${page.backgroundMedia.scale || 1});
        transform-origin: center center;
      `
      bgContainer.appendChild(video)
    } else {
      const bgImg = document.createElement('div')
      bgImg.style.cssText = `
        position: absolute;
        left: ${bleedPx}px;
        top: ${bleedPxV}px;
        width: ${width}px;
        height: ${height}px;
        background-image: url(${page.backgroundMedia.url});
        background-size: cover;
        background-position: center;
        opacity: ${page.backgroundMedia.opacity};
        transform: translate(${page.backgroundMedia.x || 0}px, ${page.backgroundMedia.y || 0}px) scale(${page.backgroundMedia.scale || 1});
        transform-origin: center center;
      `
      bgContainer.appendChild(bgImg)
    }

    contentArea.appendChild(bgContainer)
  }

  // ---- 3. Floating images (% positioning — same as ExactPageRenderer) ----
  if (page.images) {
    for (const media of page.images) {
      const opacity = (media as PageMedia & { opacity?: number }).opacity ?? 1
      const imgDiv = document.createElement('div')
      imgDiv.style.cssText = `
        position: absolute;
        left: ${media.position.x}%;
        top: ${media.position.y}%;
        width: ${media.position.width}%;
        height: ${media.position.height}%;
        ${media.position.rotation ? `transform: rotate(${media.position.rotation}deg);` : ''}
        z-index: ${media.zIndex || 10};
        ${media.type !== 'video' ? `background-image: url(${media.url}); background-size: cover; background-position: center;` : ''}
        opacity: ${opacity};
      `
      if (media.type === 'video') {
        const video = document.createElement('video')
        video.src = media.url
        video.muted = true
        video.playsInline = true
        video.style.cssText = `width: 100%; height: 100%; object-fit: cover; opacity: ${opacity};`
        imgDiv.appendChild(video)
      }
      contentArea.appendChild(imgDiv)
    }
  }

  // ---- 4. Decorations (SVG — same as ExactPageRenderer) ----
  if (page.decorations) {
    for (const deco of page.decorations) {
      const decorationItem = PREMIUM_DECORATIONS.find(d => d.id === deco.decorationId)
      if (!decorationItem) continue

      const color = deco.color || decorationItem.defaultColor || '#D4AF37'
      const coloredSvg = decorationItem.svg.replace(/currentColor/g, color)
      const size = DECORATION_BASE_SIZE

      const decoDiv = document.createElement('div')
      const transforms = [
        'translate(-50%, -50%)',
        `rotate(${deco.rotation || 0}deg)`,
        deco.scale && deco.scale !== 1 ? `scale(${deco.scale})` : '',
        deco.flipX ? 'scaleX(-1)' : '',
        deco.flipY ? 'scaleY(-1)' : '',
      ].filter(Boolean).join(' ')

      decoDiv.style.cssText = `
        position: absolute;
        left: ${deco.position.x}%;
        top: ${deco.position.y}%;
        width: ${size}px;
        height: ${size}px;
        transform: ${transforms};
        opacity: ${deco.opacity || 1};
        z-index: 100;
        ${deco.glow ? 'filter: drop-shadow(0 0 8px gold);' : ''}
      `
      decoDiv.innerHTML = coloredSvg
      contentArea.appendChild(decoDiv)
    }
  }

  // ---- 5. Floating text boxes (same as ExactPageRenderer) ----
  if (page.textBoxes) {
    for (const textBox of page.textBoxes) {
      const tbLineHeight = getScaledLineHeightPx((textBox.style?.lineSpacing || 'normal') as LineSpacing, width)
      const tbDiv = document.createElement('div')
      tbDiv.style.cssText = `
        position: absolute;
        left: ${textBox.position.x}%;
        top: ${textBox.position.y}%;
        width: ${textBox.position.width}%;
        height: ${textBox.position.height}%;
        ${(textBox as any).rotation ? `transform: rotate(${(textBox as any).rotation}deg);` : ''}
        padding: 8px;
        background-color: ${textBox.style?.backgroundColor || 'transparent'};
        border-radius: 8px;
        font-family: ${textBox.style?.fontFamily || 'Georgia, serif'};
        font-size: ${getScaledFontSize(textBox.style?.fontSize || 14, width)}px;
        line-height: ${tbLineHeight}px;
        color: ${textBox.style?.color || '#3d3426'};
        text-align: ${textBox.style?.textAlign || 'center'};
        font-weight: ${textBox.style?.isBold ? 'bold' : 'normal'};
        font-style: ${textBox.style?.isItalic ? 'italic' : 'normal'};
        z-index: ${textBox.zIndex || 50};
      `
      tbDiv.textContent = textBox.content
      contentArea.appendChild(tbDiv)
    }
  }

  // ---- 6. Notebook lines — NEVER rendered in PDF export (print only) ----
  // Lines and red margin are editor-only visual aids, not part of the printed book.

  // ---- 7. TEXT ZONE — structure IDENTICAL to BookMode ----
  // BookMode uses: className="absolute inset-0 overflow-hidden z-10 font-serif"
  //   style={{ ...textStyle, color, paddingLeft, paddingRight, paddingTop, paddingBottom }}
  // This is the KEY fix: inset:0 + padding instead of explicit top/left/right/bottom
  const textDiv = document.createElement('div')
  // Use top/right/bottom/left instead of `inset` — html2canvas doesn't support `inset`
  textDiv.style.cssText = `
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    padding: ${pagePad.top}px ${pagePad.right}px ${pagePad.bottom}px ${pagePad.left}px;
    overflow: hidden;
    z-index: 10;
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
    line-height: ${lineHeightPx}px;
    font-weight: ${style.isBold ? 'bold' : 'normal'};
    font-style: ${style.isItalic ? 'italic' : 'normal'};
    text-align: ${style.textAlign || 'left'};
    color: #3d3426;
  `
  textDiv.innerHTML = page.content || ''
  contentArea.appendChild(textDiv)

  // ---- 8. Page number / cover label ----
  if (!isFrontCover && !isBackCover) {
    const pageNumDiv = document.createElement('div')
    pageNumDiv.style.cssText = `
      position: absolute;
      bottom: ${12 * scale}px;
      left: 50%;
      transform: translateX(-50%);
      font-family: Georgia, serif;
      font-size: ${12 * scale}px;
      color: rgba(139, 115, 85, 0.6);
      z-index: 100;
    `
    pageNumDiv.textContent = `— ${pageIndex + 1} —`
    contentArea.appendChild(pageNumDiv)
  } else {
    const labelDiv = document.createElement('div')
    labelDiv.style.cssText = `
      position: absolute;
      bottom: ${12 * scale}px;
      left: 50%;
      transform: translateX(-50%);
      font-family: Georgia, serif;
      font-size: ${10 * scale}px;
      font-weight: bold;
      color: ${isFrontCover ? '#f59e0b' : '#10b981'};
      z-index: 100;
    `
    labelDiv.textContent = isFrontCover ? 'COUVERTURE' : '4EME DE COUVERTURE'
    contentArea.appendChild(labelDiv)
  }

  return pageDiv
}

// ---------------------------------------------------------------------------
// renderSinglePage — builds DOM imperatively, waits for images
// ---------------------------------------------------------------------------

/**
 * Build a single page off-screen, wait for images, return the .printable-page element.
 * The wrapper is a direct child of <body> at position (0,0) to avoid html2canvas offset bugs.
 */
async function renderSinglePage(
  page: Story['pages'][0],
  pageIndex: number,
  totalPages: number,
  pageColor: string,
  showLines: boolean,
  width: number,
  height: number,
  formatId: string,
  bleedPx: number,
): Promise<{ element: HTMLElement; cleanup: () => void }> {
  const renderWidth = width + 2 * bleedPx
  const renderHeight = height + 2 * bleedPx

  // Wrapper positioned far off-screen (no opacity tricks — html-to-image needs visible elements)
  const wrapper = document.createElement('div')
  wrapper.style.cssText = `
    position: absolute;
    left: -99999px;
    top: -99999px;
    width: ${renderWidth}px;
    height: ${renderHeight}px;
    pointer-events: none;
  `
  document.body.appendChild(wrapper)

  // Build the page DOM imperatively (mirrors BookMode)
  const pageDiv = buildPageDOM(
    page, pageIndex, totalPages,
    pageColor, showLines, width, height, formatId, bleedPx,
  )
  wrapper.appendChild(pageDiv)

  // Small delay for the browser to layout
  await new Promise(resolve => setTimeout(resolve, 50))

  // Wait for images to load
  const imagePromises: Promise<void>[] = []
  wrapper.querySelectorAll('img').forEach((img) => {
    if (!img.complete) {
      imagePromises.push(new Promise<void>(r => {
        img.onload = () => r()
        img.onerror = () => r()
      }))
    }
  })
  wrapper.querySelectorAll<HTMLElement>('[style*="background-image"]').forEach((div) => {
    const urlMatch = div.style.backgroundImage.match(/url\(["']?(.+?)["']?\)/)
    if (urlMatch) {
      imagePromises.push(new Promise<void>(r => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => r()
        img.onerror = () => r()
        img.src = urlMatch[1]
      }))
    }
  })
  if (imagePromises.length > 0) {
    await Promise.all(imagePromises)
  }

  // Get the .printable-page element
  const el = wrapper.querySelector('.printable-page') as HTMLElement
  if (!el) throw new Error(`Page ${pageIndex}: .printable-page not found`)

  return {
    element: el,
    cleanup: () => {
      document.body.removeChild(wrapper)
    },
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePdfExport() {
  const [state, setState] = useState<PdfExportState>({
    isExporting: false,
    progress: 0,
    message: '',
    error: null,
    result: null,
  })

  const exportToPdf = useCallback(async (
    story: Story,
    options: PdfExportOptions = {}
  ): Promise<ScreenCapturePdfResult | null> => {
    const {
      format = BOOK_FORMATS.find(f => f.id === 'portrait-a5') || BOOK_FORMATS[0],
      pageColor = 'cream',
      showLines = true,
      includePageNumbers = true,
      useUpscale = false,
    } = options

    console.log('📘 PDF EXPORT V5 — imperative DOM (mirrors BookMode), format:', format.id)

    setState({
      isExporting: true,
      progress: 0,
      message: 'Préparation de l\'export PDF HD...',
      error: null,
      result: null,
    })

    try {
      await document.fonts.ready

      const { width, height } = getPageCaptureSize(format)
      const bleedPx = computeBleedPx(format)

      // Render each page sequentially
      const pageElements: HTMLElement[] = []
      const cleanups: (() => void)[] = []

      for (let i = 0; i < story.pages.length; i++) {
        setState(s => ({
          ...s,
          progress: Math.round((i / story.pages.length) * 20),
          message: `Rendu page ${i + 1}/${story.pages.length}...`,
        }))

        const { element, cleanup } = await renderSinglePage(
          story.pages[i], i, story.pages.length,
          pageColor, showLines, width, height, format.id, bleedPx,
        )
        pageElements.push(element)
        cleanups.push(cleanup)
      }

      setState(s => ({ ...s, progress: 20, message: 'Capture des pages...' }))

      // Generate PDF from the page elements
      const result = await generatePdfFromScreenCaptures(
        story,
        pageElements,
        {
          format,
          pageColor,
          showLines,
          includePageNumbers,
          useUpscale,
          onProgress: (progress, message) => {
            const adjustedProgress = 20 + Math.round(progress * 0.8)
            setState(s => ({ ...s, progress: adjustedProgress, message }))
          },
        }
      )

      // Clean up all rendered pages
      cleanups.forEach(fn => fn())

      setState({
        isExporting: false,
        progress: 100,
        message: 'Export terminé !',
        error: null,
        result,
      })

      // Auto-clear the message after 3 seconds
      setTimeout(() => {
        setState(s => ({ ...s, message: '', progress: 0 }))
      }, 3000)

      return result
    } catch (error) {
      console.error('PDF export error:', error)
      setState({
        isExporting: false,
        progress: 0,
        message: '',
        error: error instanceof Error ? error.message : 'Erreur lors de l\'export',
        result: null,
      })
      return null
    }
  }, [])

  const download = useCallback((filename: string) => {
    if (state.result) {
      downloadPdf(state.result, filename)
    }
  }, [state.result])

  const getEstimatedTime = useCallback((pageCount: number, useUpscale: boolean = false) => {
    return estimateGenerationTime(pageCount, useUpscale)
  }, [])

  const reset = useCallback(() => {
    setState({
      isExporting: false,
      progress: 0,
      message: '',
      error: null,
      result: null,
    })
  }, [])

  return {
    ...state,
    exportToPdf,
    download,
    getEstimatedTime,
    reset,
    formats: BOOK_FORMATS,
  }
}

export default usePdfExport
