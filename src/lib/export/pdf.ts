/**
 * Service d'export PDF pour les livres
 * 
 * Génère un PDF haute qualité (300 DPI) pour l'impression
 * Compatible avec les formats Gelato
 */

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { Story, StoryPage, PageMedia, PageDecoration } from '@/store/useAppStore'
import type { BookFormatConfig, BookCover } from '@/store/usePublishStore'
import { findDecorationById, svgToDataUrl } from '@/data/decorations'

// Helper pour accéder aux dimensions du format
const getFormatDimensions = (format: BookFormatConfig) => ({
  width: format.widthMm,
  height: format.heightMm,
})

// Constantes pour l'export haute qualité
const DPI = 300
const SCREEN_DPI = 96
const DPI_SCALE = DPI / SCREEN_DPI // ~3.125x pour 300 DPI

// Conversion mm → pixels à 300 DPI
const mmToPx = (mm: number) => Math.round((mm / 25.4) * DPI)

// Palettes de couleurs pour les pages
const PAGE_COLORS: Record<string, string> = {
  cream: '#FFF8E7',
  white: '#FFFFFF',
  ivory: '#FFFFF0',
  sepia: '#F5E6D3',
  parchment: '#F5F0E1',
  lavender: '#E6E6FA',
  mint: '#F0FFF0',
  peach: '#FFEFD5',
}

// Décorations SVG (simplifiées pour le PDF)
const DECORATION_SVGS: Record<string, string> = {
  // Gold
  'gold-star': '⭐',
  'gold-crown': '👑',
  'gold-swirl': '✨',
  'gold-flourish': '🌟',
  // Floral
  'floral-rose': '🌹',
  'floral-vine': '🌿',
  'floral-bouquet': '💐',
  // Celestial
  'celestial-moon': '🌙',
  'celestial-sun': '☀️',
  'celestial-stars': '⭐',
  // Royal
  'royal-frame': '👑',
  'royal-shield': '🛡️',
}

export interface ExportOptions {
  onProgress?: (progress: number) => void
  includeBleed?: boolean  // Marges de coupe (3mm)
  cmykConversion?: boolean // Conversion CMYK (pour impression pro)
}

export interface ExportResult {
  blob: Blob
  url: string
  pageCount: number
  fileSize: number
}

// Résultat de la vérification qualité d'une image
export interface ImageQualityResult {
  widthPx: number
  heightPx: number
  currentDpi: number
  isOk: boolean // true si >= 300 DPI
}

// Map de polices pour l'export (avec fallbacks)
const FONT_MAP: Record<string, string> = {
  'Georgia, serif': 'Georgia, Times New Roman, serif',
  'Palatino Linotype, serif': 'Palatino Linotype, Book Antiqua, Palatino, serif',
  'Book Antiqua, serif': 'Book Antiqua, Palatino, serif',
  'Garamond, serif': 'Garamond, Times New Roman, serif',
  'Times New Roman, serif': 'Times New Roman, Times, serif',
  'Baskerville, serif': 'Baskerville, Georgia, serif',
  'Crimson Text, serif': 'Crimson Text, Georgia, serif',
  'Merriweather, serif': 'Merriweather, Georgia, serif',
  'Playfair Display, serif': 'Playfair Display, Georgia, serif',
  'Lora, serif': 'Lora, Georgia, serif',
  'Libre Baskerville, serif': 'Libre Baskerville, Georgia, serif',
  'EB Garamond, serif': 'EB Garamond, Garamond, serif',
  'Cormorant Garamond, serif': 'Cormorant Garamond, Garamond, serif',
  'Dancing Script, cursive': 'Dancing Script, cursive',
  'Great Vibes, cursive': 'Great Vibes, cursive',
  'Pacifico, cursive': 'Pacifico, cursive',
  'Satisfy, cursive': 'Satisfy, cursive',
  'Tangerine, cursive': 'Tangerine, cursive',
  'Allura, cursive': 'Allura, cursive',
  'Alex Brush, cursive': 'Alex Brush, cursive',
  'Pinyon Script, cursive': 'Pinyon Script, cursive',
}

// Convertir lineSpacing en valeur CSS
const getLineHeight = (spacing: string | undefined): string => {
  switch (spacing) {
    case 'tight': return '1.4'
    case 'relaxed': return '2.2'
    case 'normal':
    default: return '1.8'
  }
}

/**
 * Génère le HTML d'une page du livre
 */
function generatePageHTML(
  page: StoryPage,
  format: BookFormatConfig,
  pageColor: string = 'cream',
  isLeftPage: boolean = false
): string {
  const dims = getFormatDimensions(format)
  const width = mmToPx(dims.width)
  const height = mmToPx(dims.height)
  const bgColor = PAGE_COLORS[pageColor] || PAGE_COLORS.cream
  
  // Marges intérieures (gouttière plus large côté reliure)
  const innerMargin = isLeftPage ? '8%' : '12%'
  const outerMargin = isLeftPage ? '12%' : '8%'
  
  // Récupérer les styles de la page
  const style = page.style || {}
  const fontFamily = FONT_MAP[style.fontFamily || ''] || style.fontFamily || 'Georgia, serif'
  // Adapter la taille de police pour l'impression (300 DPI)
  // La taille dans l'éditeur est en pixels écran, il faut la convertir
  const baseFontSize = style.fontSize || 16
  // Scale factor pour 300 DPI (environ 3x la taille écran)
  const fontSize = Math.round(baseFontSize * (DPI / SCREEN_DPI))
  const textAlign = style.textAlign || 'left'
  const lineHeight = getLineHeight(style.lineSpacing)
  const fontWeight = style.isBold ? 'bold' : 'normal'
  const fontStyle = style.isItalic ? 'italic' : 'normal'
  const textColor = style.color || '#2D3748'
  
  // Contenu texte (HTML)
  const textContent = page.content || ''
  
  // Médias (images)
  const mediasHTML = (page.images || []).map((media: PageMedia) => {
    if (media.type !== 'image') return ''
    
    const imgStyle = `
      position: absolute;
      left: ${media.position.x}%;
      top: ${media.position.y}%;
      width: ${media.position.width}%;
      height: ${media.position.height}%;
      transform: translate(-50%, -50%) rotate(${media.position.rotation}deg);
      object-fit: cover;
      z-index: ${media.zIndex || 1};
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `
    
    return `<img src="${media.url}" style="${imgStyle}" crossorigin="anonymous" />`
  }).join('')
  
  // Fond de page
  let backgroundHTML = ''
  if (page.backgroundMedia?.url) {
    const bg = page.backgroundMedia
    backgroundHTML = `
      <div style="
        position: absolute;
        inset: 0;
        background-image: url(${bg.url});
        background-size: cover;
        background-position: center;
        opacity: ${bg.opacity || 0.3};
        z-index: 0;
      "></div>
    `
  }
  
  // Décorations - utiliser les vrais SVG depuis les données de décorations
  const decorationsHTML = (page.decorations || []).map((deco: PageDecoration) => {
    // Trouver la décoration dans les données
    const decorationItem = findDecorationById(deco.decorationId)
    
    if (decorationItem) {
      // Utiliser le vrai SVG converti en data URL
      const color = deco.color || decorationItem.defaultColor || '#D4AF37'
      const svgDataUrl = svgToDataUrl(decorationItem.svg, color)
      // Taille de base plus grande pour l'impression (300 DPI)
      const baseSize = Math.round(150 * (deco.scale || 1))
      
      const decoStyle = `
        position: absolute;
        left: ${deco.position.x}%;
        top: ${deco.position.y}%;
        transform: translate(-50%, -50%) rotate(${deco.rotation || 0}deg) ${deco.flipX ? 'scaleX(-1)' : ''} ${deco.flipY ? 'scaleY(-1)' : ''};
        width: ${baseSize}px;
        height: auto;
        opacity: ${deco.opacity || 1};
        z-index: 100;
        ${deco.glow ? 'filter: drop-shadow(0 0 12px gold);' : ''}
      `
      return `<img src="${svgDataUrl}" style="${decoStyle}" />`
    }
    
    // Fallback emoji si décoration non trouvée
    const emoji = DECORATION_SVGS[deco.decorationId] || '✨'
    const decoStyle = `
      position: absolute;
      left: ${deco.position.x}%;
      top: ${deco.position.y}%;
      transform: translate(-50%, -50%) scale(${deco.scale || 1}) rotate(${deco.rotation || 0}deg) ${deco.flipX ? 'scaleX(-1)' : ''} ${deco.flipY ? 'scaleY(-1)' : ''};
      font-size: ${Math.round(64 * (deco.scale || 1))}px;
      opacity: ${deco.opacity || 1};
      z-index: 100;
      ${deco.glow ? 'filter: drop-shadow(0 0 8px gold);' : ''}
    `
    return `<span style="${decoStyle}">${emoji}</span>`
  }).join('')
  
  // CSS pour forcer l'héritage des styles sur tous les éléments enfants
  const inheritStyles = `
    <style>
      #page-${page.id} .text-content,
      #page-${page.id} .text-content * {
        font-family: ${fontFamily} !important;
        font-size: ${fontSize}px !important;
        font-weight: ${fontWeight} !important;
        font-style: ${fontStyle} !important;
        text-align: ${textAlign} !important;
        color: ${textColor} !important;
        line-height: ${lineHeight} !important;
      }
      #page-${page.id} .text-content div,
      #page-${page.id} .text-content p {
        margin: 0;
        padding: 0;
      }
    </style>
  `
  
  return `
    ${inheritStyles}
    <div id="page-${page.id}" style="
      width: ${width}px;
      height: ${height}px;
      background-color: ${bgColor};
      position: relative;
      overflow: hidden;
      font-family: ${fontFamily};
    ">
      ${backgroundHTML}
      
      <div style="
        position: absolute;
        inset: 0;
        padding: 8% ${outerMargin} 8% ${innerMargin};
        z-index: 1;
      ">
        <div class="text-content" style="
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          line-height: ${lineHeight};
          font-size: ${fontSize}px;
          font-weight: ${fontWeight};
          font-style: ${fontStyle};
          text-align: ${textAlign};
          color: ${textColor};
        ">
          ${textContent}
        </div>
      </div>
      
      ${mediasHTML}
      ${decorationsHTML}
    </div>
  `
}

/**
 * Génère le HTML de la couverture
 */
function generateCoverHTML(
  cover: BookCover,
  format: BookFormatConfig
): string {
  const dims = getFormatDimensions(format)
  const width = mmToPx(dims.width)
  const height = mmToPx(dims.height)
  
  // Couleur de fond ou image
  const bgStyle = cover.backgroundImage 
    ? `background-image: url(${cover.backgroundImage}); background-size: cover; background-position: center;`
    : `background-color: ${cover.backgroundColor || '#1a1a2e'};`
  
  return `
    <div id="cover" style="
      width: ${width}px;
      height: ${height}px;
      ${bgStyle}
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10%;
      font-family: 'Playfair Display', Georgia, serif;
    ">
      <h1 style="
        font-size: ${Math.round(width * 0.06)}px;
        color: ${cover.titleColor || '#FFD700'};
        text-align: center;
        margin-bottom: 5%;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      ">${cover.title || 'Mon Histoire'}</h1>
      
      ${cover.subtitle ? `
        <h2 style="
          font-size: ${Math.round(width * 0.025)}px;
          color: ${cover.titleColor || '#FFD700'};
          opacity: 0.8;
          text-align: center;
          margin-bottom: 10%;
        ">${cover.subtitle}</h2>
      ` : ''}
      
      ${cover.authorName ? `
        <p style="
          position: absolute;
          bottom: 8%;
          font-size: ${Math.round(width * 0.02)}px;
          color: ${cover.titleColor || '#FFD700'};
          opacity: 0.7;
        ">par ${cover.authorName}</p>
      ` : ''}
    </div>
  `
}

/**
 * Capture un élément HTML en canvas haute résolution
 */
async function captureElement(element: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    scale: DPI_SCALE,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: null,
    imageTimeout: 15000,
  })
}

/**
 * Exporte une histoire en PDF haute qualité
 */
export async function exportToPDF(
  story: Story,
  format: BookFormatConfig,
  cover: BookCover,
  options: ExportOptions = {}
): Promise<ExportResult> {
  const { onProgress, includeBleed = false } = options
  const dims = getFormatDimensions(format)
  
  // Dimensions du PDF (mm)
  const pdfWidth = dims.width + (includeBleed ? 6 : 0)  // +3mm de chaque côté
  const pdfHeight = dims.height + (includeBleed ? 6 : 0)
  
  // Créer le PDF
  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pdfWidth, pdfHeight],
    compress: true,
  })
  
  // Container temporaire pour le rendu
  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    z-index: -1;
  `
  document.body.appendChild(container)
  
  const totalSteps = story.pages.length + 2 // +2 pour couverture et 4ème de couv
  let currentStep = 0
  
  const updateProgress = () => {
    currentStep++
    onProgress?.(Math.round((currentStep / totalSteps) * 100))
  }
  
  try {
    // 1. Générer la couverture
    container.innerHTML = generateCoverHTML(cover, format)
    const coverElement = container.firstElementChild as HTMLElement
    const coverCanvas = await captureElement(coverElement)
    
    const coverImgData = coverCanvas.toDataURL('image/jpeg', 0.95)
    pdf.addImage(coverImgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
    updateProgress()
    
    // 2. Générer chaque page
    for (let i = 0; i < story.pages.length; i++) {
      const page = story.pages[i]
      const isLeftPage = i % 2 === 0
      
      pdf.addPage([pdfWidth, pdfHeight])
      
      container.innerHTML = generatePageHTML(page, format, 'cream', isLeftPage)
      const pageElement = container.firstElementChild as HTMLElement
      const pageCanvas = await captureElement(pageElement)
      
      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95)
      pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
      updateProgress()
    }
    
    // 3. Page finale (optionnelle)
    pdf.addPage([pdfWidth, pdfHeight])
    container.innerHTML = `
      <div style="
        width: ${mmToPx(dims.width)}px;
        height: ${mmToPx(dims.height)}px;
        background-color: ${PAGE_COLORS.cream};
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Georgia', serif;
        color: #888;
        font-size: ${Math.round(mmToPx(dims.width) * 0.015)}px;
      ">
        <p style="text-align: center;">
          Créé avec ❤️ sur<br/>
          <strong>La Voix du Soir</strong>
        </p>
      </div>
    `
    const finalElement = container.firstElementChild as HTMLElement
    const finalCanvas = await captureElement(finalElement)
    const finalImgData = finalCanvas.toDataURL('image/jpeg', 0.95)
    pdf.addImage(finalImgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
    updateProgress()
    
    // Générer le blob
    const blob = pdf.output('blob')
    const url = URL.createObjectURL(blob)
    
    // Télécharger automatiquement
    const link = document.createElement('a')
    link.href = url
    link.download = `${story.title || 'mon-livre'}.pdf`
    link.click()
    
    return {
      blob,
      url,
      pageCount: story.pages.length + 2,
      fileSize: blob.size,
    }
    
  } finally {
    // Nettoyer
    document.body.removeChild(container)
  }
}

/**
 * Estime la taille du PDF (sans le générer)
 */
export function estimatePDFSize(story: Story, format: BookFormatConfig): number {
  // Estimation : ~500KB par page A5, ~1MB par page A4
  const baseSize = format.id.includes('A5') ? 500 : 1000
  const pageCount = story.pages.length + 2
  return pageCount * baseSize * 1024 // en bytes
}

/**
 * Vérifie la qualité (DPI) d'une image pour l'impression
 * 
 * @param imageUrl URL de l'image à vérifier
 * @param printWidthMm Largeur d'impression en mm
 * @param printHeightMm Hauteur d'impression en mm
 * @returns Résultat avec les DPI calculés et si c'est OK pour l'impression
 */
export async function checkImageQuality(
  imageUrl: string,
  printWidthMm: number,
  printHeightMm: number
): Promise<ImageQualityResult> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const widthPx = img.naturalWidth
      const heightPx = img.naturalHeight
      
      // Calculer les DPI dans chaque dimension
      // DPI = pixels / (mm / 25.4)
      const dpiWidth = widthPx / (printWidthMm / 25.4)
      const dpiHeight = heightPx / (printHeightMm / 25.4)
      
      // Prendre le DPI minimum (la plus faible qualité)
      const currentDpi = Math.min(dpiWidth, dpiHeight)
      
      // OK si >= 300 DPI (ou acceptable si >= 200 DPI avec warning)
      const isOk = currentDpi >= 200
      
      resolve({
        widthPx,
        heightPx,
        currentDpi: Math.round(currentDpi),
        isOk,
      })
    }
    
    img.onerror = () => {
      reject(new Error(`Impossible de charger l'image: ${imageUrl}`))
    }
    
    // Ajouter un timeout de 10 secondes
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout lors du chargement de l'image: ${imageUrl}`))
    }, 10000)
    
    img.onload = () => {
      clearTimeout(timeout)
      const widthPx = img.naturalWidth
      const heightPx = img.naturalHeight
      
      const dpiWidth = widthPx / (printWidthMm / 25.4)
      const dpiHeight = heightPx / (printHeightMm / 25.4)
      const currentDpi = Math.min(dpiWidth, dpiHeight)
      
      resolve({
        widthPx,
        heightPx,
        currentDpi: Math.round(currentDpi),
        isOk: currentDpi >= 200,
      })
    }
    
    img.src = imageUrl
  })
}

/**
 * Upscale une image via fal.ai Real-ESRGAN si nécessaire
 */
export async function upscaleImage(imageUrl: string, scale: number = 2): Promise<string> {
  try {
    const response = await fetch('/api/ai/upscale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, scale }),
    })
    
    if (!response.ok) {
      throw new Error('Erreur upscale')
    }
    
    const data = await response.json()
    return data.url
  } catch (error) {
    console.error('Erreur upscale:', error)
    throw error
  }
}

export default exportToPDF
