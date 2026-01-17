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
  
  // Contenu texte (HTML)
  const textContent = page.content || ''
  
  // Médias (images)
  const mediasHTML = (page.images || []).map((media: PageMedia) => {
    if (media.type !== 'image') return ''
    
    const style = `
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
    
    return `<img src="${media.url}" style="${style}" crossorigin="anonymous" />`
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
  
  // Décorations
  const decorationsHTML = (page.decorations || []).map((deco: PageDecoration) => {
    const emoji = DECORATION_SVGS[deco.decorationId] || '✨'
    const style = `
      position: absolute;
      left: ${deco.position.x}%;
      top: ${deco.position.y}%;
      transform: translate(-50%, -50%) scale(${deco.scale || 1}) rotate(${deco.rotation || 0}deg) ${deco.flipX ? 'scaleX(-1)' : ''} ${deco.flipY ? 'scaleY(-1)' : ''};
      font-size: ${32 * (deco.scale || 1)}px;
      opacity: ${deco.opacity || 1};
      z-index: 100;
      ${deco.glow ? 'filter: drop-shadow(0 0 8px gold);' : ''}
    `
    return `<span style="${style}">${emoji}</span>`
  }).join('')
  
  return `
    <div id="page-${page.id}" style="
      width: ${width}px;
      height: ${height}px;
      background-color: ${bgColor};
      position: relative;
      overflow: hidden;
      font-family: 'Merriweather', Georgia, serif;
    ">
      ${backgroundHTML}
      
      <div style="
        position: absolute;
        inset: 0;
        padding: 8% ${outerMargin} 8% ${innerMargin};
        z-index: 1;
      ">
        <div style="
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          line-height: 1.8;
          font-size: ${Math.round(width * 0.018)}px;
          color: #2D3748;
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

export default exportToPDF
