/**
 * Hook pour exporter le PDF directement depuis BookMode
 * 
 * Capture les pages EXACTEMENT comme elles sont affichées,
 * en masquant temporairement les éléments d'UI.
 */

import { useState, useCallback, useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import type { Story } from '@/store/useAppStore'

export interface BookPdfExportState {
  isExporting: boolean
  progress: number
  currentPage: number
  totalPages: number
  message: string
  error: string | null
}

export interface BookPdfExportOptions {
  format?: 'a5' | 'a4' | 'square'
  quality?: number // 0.7 - 1
  scale?: number   // 1 - 4 (multiplicateur de résolution)
}

// Dimensions en mm
const FORMAT_DIMENSIONS = {
  a5: { width: 148, height: 210 },
  a4: { width: 210, height: 297 },
  square: { width: 200, height: 200 },
}

/**
 * Hook pour exporter le livre en PDF depuis BookMode
 */
export function useBookPdfExport() {
  const [state, setState] = useState<BookPdfExportState>({
    isExporting: false,
    progress: 0,
    currentPage: 0,
    totalPages: 0,
    message: '',
    error: null,
  })

  const abortRef = useRef(false)

  /**
   * Capture un élément de page en masquant l'UI
   */
  const capturePageElement = useCallback(async (
    pageElement: HTMLElement,
    scale: number = 2
  ): Promise<string> => {
    // Trouver tous les éléments d'UI à masquer
    const uiSelectors = [
      'button',
      '[class*="mots"]',
      '[class*="COUVERTURE"]',
      '[class*="couv"]',
      '.absolute.bottom-2', // Barre d'outils en bas
      '.absolute.z-10.px-6', // Barre d'outils
    ]

    // Sauvegarder et masquer les éléments d'UI
    const hiddenElements: { el: HTMLElement; display: string; visibility: string }[] = []

    uiSelectors.forEach(selector => {
      pageElement.querySelectorAll(selector).forEach(el => {
        const htmlEl = el as HTMLElement
        hiddenElements.push({
          el: htmlEl,
          display: htmlEl.style.display,
          visibility: htmlEl.style.visibility,
        })
        htmlEl.style.visibility = 'hidden'
      })
    })

    try {
      // Capturer l'élément
      const canvas = await html2canvas(pageElement, {
        scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: null, // Garder la couleur de fond de l'élément
        imageTimeout: 30000,
      })

      return canvas.toDataURL('image/jpeg', 0.95)
    } finally {
      // Restaurer les éléments masqués
      hiddenElements.forEach(({ el, display, visibility }) => {
        el.style.display = display
        el.style.visibility = visibility
      })
    }
  }, [])

  /**
   * Exporte le livre en PDF en capturant chaque page affichée
   * 
   * @param story L'histoire à exporter
   * @param getPageElement Fonction qui retourne l'élément DOM d'une page pour un index donné
   * @param navigateToPage Fonction pour naviguer vers une page spécifique
   * @param options Options d'export
   */
  const exportToPdf = useCallback(async (
    story: Story,
    getPageElement: (pageIndex: number) => HTMLElement | null,
    navigateToPage: (pageIndex: number) => Promise<void>,
    options: BookPdfExportOptions = {}
  ): Promise<Blob | null> => {
    const {
      format = 'a5',
      quality = 0.95,
      scale = 2,
    } = options

    const dims = FORMAT_DIMENSIONS[format]
    abortRef.current = false

    setState({
      isExporting: true,
      progress: 0,
      currentPage: 0,
      totalPages: story.pages.length,
      message: 'Préparation...',
      error: null,
    })

    try {
      // Créer le PDF
      const pdf = new jsPDF({
        orientation: dims.width > dims.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [dims.width, dims.height],
        compress: true,
      })

      // Capturer chaque page
      for (let i = 0; i < story.pages.length; i++) {
        if (abortRef.current) {
          throw new Error('Export annulé')
        }

        setState(s => ({
          ...s,
          currentPage: i + 1,
          progress: Math.round((i / story.pages.length) * 100),
          message: `Capture page ${i + 1}/${story.pages.length}...`,
        }))

        // Naviguer vers la page
        await navigateToPage(i)

        // Attendre que la page soit rendue
        await new Promise(resolve => setTimeout(resolve, 300))

        // Récupérer l'élément de page
        const pageElement = getPageElement(i)
        if (!pageElement) {
          console.warn(`Page ${i} non trouvée, skip`)
          continue
        }

        // Capturer la page
        const imageData = await capturePageElement(pageElement, scale)

        // Ajouter au PDF
        if (i > 0) {
          pdf.addPage([dims.width, dims.height])
        }
        pdf.addImage(imageData, 'JPEG', 0, 0, dims.width, dims.height)
      }

      setState(s => ({
        ...s,
        progress: 100,
        message: 'PDF généré !',
      }))

      // Retourner le blob
      const blob = pdf.output('blob')

      // Télécharger automatiquement
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${story.title || 'mon-livre'}.pdf`
      link.click()
      URL.revokeObjectURL(url)

      return blob

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      setState(s => ({
        ...s,
        isExporting: false,
        error: message,
      }))
      return null

    } finally {
      setState(s => ({
        ...s,
        isExporting: false,
      }))
    }
  }, [capturePageElement])

  /**
   * Annule l'export en cours
   */
  const cancelExport = useCallback(() => {
    abortRef.current = true
  }, [])

  /**
   * Réinitialise l'état
   */
  const reset = useCallback(() => {
    setState({
      isExporting: false,
      progress: 0,
      currentPage: 0,
      totalPages: 0,
      message: '',
      error: null,
    })
  }, [])

  return {
    ...state,
    exportToPdf,
    cancelExport,
    reset,
  }
}

export default useBookPdfExport
