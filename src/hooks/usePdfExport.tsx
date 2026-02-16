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
import { useTranslations } from '@/lib/i18n/context'
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
  computeCaptureScale,
  captureElementDebug,
  type ScreenCapturePdfResult,
} from '@/lib/export/pdfScreenCapture'
import { BOOK_FORMATS, type BookFormatConfig } from '@/store/usePublishStore'

const isSafari =
  typeof navigator !== 'undefined' &&
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

/**
 * Pre-render an SVG string to a PNG data URL via canvas.
 * Safari cannot render SVG data URLs inside foreignObject (used by
 * modern-screenshot). By converting to PNG first, we bypass the issue.
 */
function svgToPngDataUrl(svgString: string, width: number, height: number): Promise<string> {
  // Ensure valid SVG for Safari
  let svg = svgString
  if (!svg.includes('xmlns=')) {
    svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  }
  // Check the <svg> tag itself for width= (not stroke-width, fill-width, etc.)
  const svgTag = svg.match(/<svg[^>]*>/)?.[0] || ''
  if (!svgTag.match(/\swidth=/)) {
    svg = svg.replace('<svg', `<svg width="${width}" height="${height}"`)
  }
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width * 2
      canvas.height = height * 2
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('SVG to PNG conversion failed'))
    }
    img.src = url
  })
}

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

// Debug snapshot for each page step
export interface DebugPageSnapshot {
  pageIndex: number
  label: string
  dataUrl: string
}

export interface PdfDebugResult {
  snapshots: DebugPageSnapshot[]
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
  coverLabels?: { front: string; back: string },
): HTMLElement {
  const style = page.style || {}
  const gradient = PAGE_GRADIENTS[(pageColor as PageColor) || 'cream'] || PAGE_GRADIENTS.cream

  const isFrontCover = pageIndex === 0
  const isBackCover = pageIndex === totalPages - 1 && totalPages > 1

  const scale = getPageScale(width)
  const pagePad = getPagePaddingPx(bookFormat as any)

  // Text styles — same defaults as BookMode's DEFAULT_STYLE
  const fontSize = style.fontSize || 18
  const rawLineSpacing = style.lineSpacing || 'normal'
  const lineHeightPx = typeof rawLineSpacing === 'number'
    ? rawLineSpacing
    : getBaseLineHeightPx(rawLineSpacing as LineSpacing)
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
    overflow: hidden;
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

    bgContainer.setAttribute('data-layer', 'objects')

    if (page.backgroundMedia.type === 'video') {
      // Utiliser le videoPoster (frame capturé) pour le PDF via background-image
      // (background-image conserve la résolution native, contrairement à <img>
      // qui est re-rastérisé à la taille CSS par html-to-image)
      const posterUrl = page.backgroundMedia.videoPoster
      if (posterUrl) {
        const bgWrapper = document.createElement('div')
        bgWrapper.style.cssText = `
          position: absolute;
          left: ${bleedPx}px;
          top: ${bleedPxV}px;
          width: ${width}px;
          height: ${height}px;
          overflow: hidden;
          background-size: cover;
          background-position: center;
          opacity: ${page.backgroundMedia.opacity};
          transform: translate(${page.backgroundMedia.x || 0}px, ${page.backgroundMedia.y || 0}px) scale(${page.backgroundMedia.scale || 1});
          transform-origin: center center;
        `
        bgWrapper.style.backgroundImage = `url("${posterUrl}")`
        bgContainer.appendChild(bgWrapper)
      }
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
      imgDiv.setAttribute('data-layer', 'objects')
      // Pour les vidéos, utiliser background-image avec le poster (même technique que les
      // images normales) pour préserver la résolution native dans html-to-image
      const bgUrl = media.type === 'video' ? (media as any).videoPoster : media.url
      imgDiv.style.cssText = `
        position: absolute;
        left: ${media.position.x}%;
        top: ${media.position.y}%;
        width: ${media.position.width}%;
        height: ${media.position.height}%;
        ${media.position.rotation ? `transform: rotate(${media.position.rotation}deg);` : ''}
        z-index: ${media.zIndex || 5};
        ${bgUrl ? `background-size: cover; background-position: center;` : ''}
        opacity: ${opacity};
        overflow: hidden;
      `
      if (bgUrl) {
        imgDiv.style.backgroundImage = `url("${bgUrl}")`
      }
      contentArea.appendChild(imgDiv)
    }
  }

  // ---- 4. Decorations (SVG — same as ExactPageRenderer) ----
  if (page.decorations) {
    console.log('🎄 [PDF] page', pageIndex, 'decorations count:', page.decorations.length)
    page.decorations.forEach((d: any, i: number) => {
      console.log(`  🎄 [${i}] id=${d.id} decoId=${d.decorationId} pos=(${d.position?.x?.toFixed?.(1)}, ${d.position?.y?.toFixed?.(1)}) scale=${d.scale} rot=${d.rotation}`)
    })
    // Détecter les doublons
    const ids = page.decorations.map((d: any) => d.id)
    const uniqueIds = new Set(ids)
    if (ids.length !== uniqueIds.size) {
      console.warn('⚠️ [PDF] DOUBLONS DÉTECTÉS! ids:', ids)
    }
    const decoIds = page.decorations.map((d: any) => d.decorationId)
    console.log('🎄 [PDF] decorationId frequency:', decoIds.reduce((acc: any, id: string) => { acc[id] = (acc[id] || 0) + 1; return acc }, {}))

    for (const deco of page.decorations) {
      const decorationItem = PREMIUM_DECORATIONS.find(d => d.id === deco.decorationId)
      if (!decorationItem) { console.log('🔍 [PDF] decoration NOT FOUND in PREMIUM_DECORATIONS:', deco.decorationId); continue }

      const color = deco.color || decorationItem.defaultColor || '#D4AF37'
      const coloredSvg = decorationItem.svg.replace(/currentColor/g, color)
      const size = DECORATION_BASE_SIZE

      const decoDiv = document.createElement('div')
      decoDiv.setAttribute('data-layer', 'objects')
      const transforms = [
        'translate(-50%, -50%)',
        `rotate(${deco.rotation || 0}deg)`,
        deco.scale && deco.scale !== 1 ? `scale(${deco.scale})` : '',
        deco.flipX ? 'scaleX(-1)' : '',
        deco.flipY ? 'scaleY(-1)' : '',
      ].filter(Boolean).join(' ')

      // Keep data attributes for Safari SVG→PNG post-processing
      decoDiv.setAttribute('data-deco-svg', coloredSvg)
      decoDiv.setAttribute('data-deco-size', String(size))
      decoDiv.style.cssText = `
        position: absolute;
        left: ${deco.position.x}%;
        top: ${deco.position.y}%;
        width: ${size}px;
        height: ${size}px;
        transform: ${transforms};
        opacity: ${deco.opacity || 1};
        z-index: 100;
        color: ${color};
        ${deco.glow ? 'filter: drop-shadow(0 0 8px gold);' : ''}
      `
      // Inline SVG — works with html-to-image (Chrome) and html2canvas (Safari)
      decoDiv.innerHTML = coloredSvg.replace('<svg ', '<svg width="100%" height="100%" ')
      contentArea.appendChild(decoDiv)
    }
  }

  // ---- 5. Floating text boxes (same as ExactPageRenderer) ----
  if (page.textBoxes) {
    for (const textBox of page.textBoxes) {
      const tbRawSpacing = textBox.style?.lineSpacing || 'normal'
      const tbLineHeight = typeof tbRawSpacing === 'number'
        ? tbRawSpacing
        : getScaledLineHeightPx(tbRawSpacing as LineSpacing, width)
      const tbDiv = document.createElement('div')
      tbDiv.setAttribute('data-layer', 'text')
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
  textDiv.setAttribute('data-layer', 'text')
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
    pageNumDiv.setAttribute('data-layer', 'text')
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
  coverLabels?: { front: string; back: string },
): Promise<{ element: HTMLElement; cleanup: () => void }> {
  const renderWidth = width + 2 * bleedPx
  const renderHeight = height + 2 * bleedPx

  // Wrapper positioned far off-screen (no opacity tricks — html-to-image needs visible elements)
  const wrapper = document.createElement('div')
  wrapper.style.cssText = `
    position: fixed;
    left: -99999px;
    top: -99999px;
    width: ${renderWidth}px;
    height: ${renderHeight}px;
    pointer-events: none;
    z-index: -9999;
    overflow: hidden;
  `
  document.body.appendChild(wrapper)

  // Build the page DOM imperatively (mirrors BookMode)
  const pageDiv = buildPageDOM(
    page, pageIndex, totalPages,
    pageColor, showLines, width, height, formatId, bleedPx, coverLabels,
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

  // Safari: convert SVG decoration data URLs to PNG data URLs
  // html2canvas rejects SVGs without xmlns — PNG bypasses the issue entirely
  if (isSafari) {
    const decoElements = Array.from(wrapper.querySelectorAll<HTMLElement>('[data-deco-svg]'))
    console.log('🔍 [PDF] Safari SVG→PNG: found', decoElements.length, 'decorations')
    for (const el of decoElements) {
      const svgStr = el.getAttribute('data-deco-svg')
      const decoSize = parseInt(el.getAttribute('data-deco-size') || '80', 10)
      if (svgStr) {
        try {
          console.log('🔍 [PDF] Converting SVG to PNG, size:', decoSize, 'svg length:', svgStr.length)
          const pngDataUrl = await svgToPngDataUrl(svgStr, decoSize, decoSize)
          console.log('🔍 [PDF] SVG→PNG OK, png length:', pngDataUrl.length)
          // Replace inline SVG with PNG background — Safari foreignObject
          // renders inline SVGs incorrectly, causing phantom decorations
          el.innerHTML = ''
          el.style.backgroundImage = `url("${pngDataUrl}")`
          el.style.backgroundSize = 'contain'
          el.style.backgroundRepeat = 'no-repeat'
          el.style.backgroundPosition = 'center'
        } catch (e) {
          console.warn('🔍 [PDF] SVG to PNG conversion FAILED:', e)
        }
      }
    }
  } else {
    console.log('🔍 [PDF] Not Safari, skipping SVG→PNG conversion')
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
  const t = useTranslations('writing')
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
      message: t('preparingExport'),
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
          message: t('renderingPage', { current: i + 1, total: story.pages.length }),
        }))

        const { element, cleanup } = await renderSinglePage(
          story.pages[i], i, story.pages.length,
          pageColor, showLines, width, height, format.id, bleedPx,
          { front: t('frontCover').toUpperCase(), back: t('backCover').toUpperCase() },
        )
        pageElements.push(element)
        cleanups.push(cleanup)
      }

      setState(s => ({ ...s, progress: 20, message: t('capturingPages') }))

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
          onProgress: (progress, _message) => {
            const adjustedProgress = 20 + Math.round(progress * 0.8)
            // Translate the capture progress message
            const totalPages = story.pages.length
            const currentPage = Math.round((progress / 90) * totalPages) + 1
            const translatedMessage = t('capturePage', { current: Math.min(currentPage, totalPages), total: totalPages })
            setState(s => ({ ...s, progress: adjustedProgress, message: translatedMessage }))
          },
        }
      )

      // Clean up all rendered pages
      cleanups.forEach(fn => fn())

      setState({
        isExporting: false,
        progress: 100,
        message: t('exportDone'),
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
        error: error instanceof Error ? error.message : t('exportError'),
        result: null,
      })
      return null
    }
  }, [t])

  // Debug preview: capture each intermediate step as images
  const [debugSnapshots, setDebugSnapshots] = useState<DebugPageSnapshot[]>([])

  const debugPreviewPdf = useCallback(async (
    story: Story,
    options: PdfExportOptions = {}
  ): Promise<void> => {
    const {
      format = BOOK_FORMATS.find(f => f.id === 'portrait-a5') || BOOK_FORMATS[0],
      pageColor = 'cream',
      showLines = true,
    } = options

    console.log('🔬 PDF DEBUG PREVIEW — format:', format.id)

    setState({
      isExporting: true,
      progress: 0,
      message: 'Debug: construction des pages...',
      error: null,
      result: null,
    })
    setDebugSnapshots([])

    try {
      await document.fonts.ready
      const { width, height } = getPageCaptureSize(format)
      const bleedPx = computeBleedPx(format)
      const captureScale = computeCaptureScale(format)
      // Use lower scale for debug (faster)
      const debugScale = Math.max(2, Math.min(captureScale, 3))

      const allSnapshots: DebugPageSnapshot[] = []
      const cleanups: (() => void)[] = []

      for (let i = 0; i < story.pages.length; i++) {
        setState(s => ({
          ...s,
          progress: Math.round((i / story.pages.length) * 100),
          message: `Debug page ${i + 1}/${story.pages.length}...`,
        }))

        // Step 1: Render page DOM
        const { element, cleanup } = await renderSinglePage(
          story.pages[i], i, story.pages.length,
          pageColor, showLines, width, height, format.id, bleedPx,
          { front: 'COUVERTURE', back: '4ÈME DE COUVERTURE' },
        )
        cleanups.push(cleanup)

        // Step 2: Quick screenshot of the raw DOM (before Safari SVG→PNG conversion)
        // We use a simple canvas capture at low scale for speed
        try {
          const { toPng } = await import('html-to-image')
          const rawDom = await toPng(element, { pixelRatio: 1, cacheBust: true })
          allSnapshots.push({
            pageIndex: i,
            label: `Page ${i + 1} — DOM brut (avant capture)`,
            dataUrl: rawDom,
          })
        } catch {
          console.warn(`Debug: raw DOM capture failed for page ${i}`)
        }

        // Step 3: Capture with intermediate steps (Safari 2-pass or Chrome single)
        const debugSteps = await captureElementDebug(element, debugScale)
        for (const step of debugSteps) {
          allSnapshots.push({
            pageIndex: i,
            label: `Page ${i + 1} — ${step.label}`,
            dataUrl: step.dataUrl,
          })
        }
      }

      // Cleanup DOM
      cleanups.forEach(fn => fn())

      setDebugSnapshots(allSnapshots)
      setState({
        isExporting: false,
        progress: 100,
        message: `Debug terminé: ${allSnapshots.length} snapshots`,
        error: null,
        result: null,
      })
    } catch (error) {
      console.error('PDF debug preview error:', error)
      setState({
        isExporting: false,
        progress: 0,
        message: '',
        error: error instanceof Error ? error.message : 'Erreur debug preview',
        result: null,
      })
    }
  }, [t])

  const clearDebugSnapshots = useCallback(() => {
    setDebugSnapshots([])
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
    setDebugSnapshots([])
  }, [])

  return {
    ...state,
    exportToPdf,
    debugPreviewPdf,
    debugSnapshots,
    clearDebugSnapshots,
    download,
    getEstimatedTime,
    reset,
    formats: BOOK_FORMATS,
  }
}

export default usePdfExport
