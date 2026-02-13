/**
 * Capture d'écran directe des pages du livre
 * 
 * Prend une vraie capture de l'élément DOM tel qu'il est affiché,
 * en masquant temporairement les éléments d'UI (boutons, compteurs, etc.)
 */

import html2canvas from 'html2canvas'

/**
 * Sélecteurs CSS des éléments d'UI à masquer pendant la capture
 */
const UI_ELEMENTS_TO_HIDE = [
  // Compteur de mots
  '[class*="mots"]',
  // Boutons d'action (dicter, ajouter image, etc.)
  'button',
  // Labels de page (COUVERTURE, numéro de page, etc.)
  '[class*="COUVERTURE"]',
  '[class*="couv"]',
  // Placeholder text
  '[data-placeholder]::before',
  '.empty\\:before\\:content-\\[attr\\(data-placeholder\\)\\]::before',
]

/**
 * Capture une page du livre en screenshot
 * 
 * @param pageElement L'élément DOM de la page à capturer
 * @param options Options de capture
 * @returns Canvas de la capture
 */
export async function capturePageElement(
  pageElement: HTMLElement,
  options: {
    scale?: number
    hideUI?: boolean
    backgroundColor?: string
  } = {}
): Promise<HTMLCanvasElement> {
  const {
    scale = 2,
    hideUI = true,
    backgroundColor = '#FFFBEB',
  } = options

  // Sauvegarder les styles originaux des éléments à masquer
  const hiddenElements: { element: HTMLElement; originalDisplay: string }[] = []

  if (hideUI) {
    // Masquer les éléments d'UI dans la page
    const uiElements = pageElement.querySelectorAll('button, [class*="mots"], [class*="COUVERTURE"]')
    uiElements.forEach((el) => {
      const htmlEl = el as HTMLElement
      hiddenElements.push({
        element: htmlEl,
        originalDisplay: htmlEl.style.display,
      })
      htmlEl.style.display = 'none'
    })
  }

  try {
    // Capturer l'élément avec html2canvas
    const canvas = await html2canvas(pageElement, {
      scale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor,
      imageTimeout: 30000,
      // Ignorer les éléments qui ne doivent pas être capturés
      ignoreElements: (element) => {
        // Ignorer les boutons et éléments d'UI
        if (element.tagName === 'BUTTON') return true
        if (element.classList?.contains('absolute') && 
            (element.textContent?.includes('mots') || 
             element.textContent?.includes('COUVERTURE'))) {
          return true
        }
        return false
      },
    })

    return canvas
  } finally {
    // Restaurer les éléments masqués
    hiddenElements.forEach(({ element, originalDisplay }) => {
      element.style.display = originalDisplay
    })
  }
}

/**
 * Capture toutes les pages visibles d'une histoire
 * 
 * @param containerSelector Sélecteur du conteneur des pages
 * @param pageSelector Sélecteur des éléments de page individuels
 */
export async function captureAllPages(
  containerSelector: string,
  pageSelector: string,
  options: {
    scale?: number
    onProgress?: (current: number, total: number) => void
  } = {}
): Promise<HTMLCanvasElement[]> {
  const { scale = 2, onProgress } = options

  const container = document.querySelector(containerSelector)
  if (!container) {
    throw new Error(`Container not found: ${containerSelector}`)
  }

  const pages = container.querySelectorAll(pageSelector)
  const canvases: HTMLCanvasElement[] = []

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i] as HTMLElement
    onProgress?.(i + 1, pages.length)

    const canvas = await capturePageElement(page, { scale })
    canvases.push(canvas)
  }

  return canvases
}

export default capturePageElement
