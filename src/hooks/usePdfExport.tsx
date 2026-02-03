/**
 * Hook pour l'export PDF par capture d'écran
 * 
 * Gère le rendu des pages, la capture, l'upscale et la génération du PDF
 */

import { useState, useCallback, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import type { Story } from '@/store/useAppStore'
import { ExactPageRenderer } from '@/components/export/ExactPageRenderer'
import {
  generatePdfFromScreenCaptures,
  downloadPdf,
  getPageCaptureSize,
  estimateGenerationTime,
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

export function usePdfExport() {
  const [state, setState] = useState<PdfExportState>({
    isExporting: false,
    progress: 0,
    message: '',
    error: null,
    result: null,
  })

  const containerRef = useRef<HTMLDivElement | null>(null)

  /**
   * Exporte une histoire en PDF
   */
  const exportToPdf = useCallback(async (
    story: Story,
    options: PdfExportOptions = {}
  ): Promise<ScreenCapturePdfResult | null> => {
    const {
      format = BOOK_FORMATS[0], // A5 Portrait par défaut
      pageColor = 'cream',
      showLines = true,
      includePageNumbers = true,
      useUpscale = true,
    } = options

    setState({
      isExporting: true,
      progress: 0,
      message: 'Préparation...',
      error: null,
      result: null,
    })

    try {
      // Créer un conteneur hors écran pour le rendu
      // IMPORTANT: Ne pas utiliser visibility:hidden car html2canvas ne peut pas capturer
      const container = document.createElement('div')
      container.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        z-index: 9999;
        background: white;
      `
      document.body.appendChild(container)
      containerRef.current = container

      // Dimensions de capture
      const { width, height } = getPageCaptureSize(format)

      setState(s => ({ ...s, message: 'Rendu des pages...' }))

      // Rendre chaque page et collecter les éléments
      const pageElements: HTMLElement[] = []

      for (let i = 0; i < story.pages.length; i++) {
        const page = story.pages[i]
        const isCover = i === 0 || page.pageType === 'front-cover'
        const isBackCover = i === story.pages.length - 1 || page.pageType === 'back-cover'

        // Calculer le numéro de page (pas sur couverture et 4ème)
        let pageNumber: number | undefined = undefined
        if (includePageNumbers && !isCover && !isBackCover) {
          pageNumber = i // Page 2, 3, 4... (couverture = page 1 non numérotée)
        }

        // Créer un wrapper pour cette page
        const pageWrapper = document.createElement('div')
        pageWrapper.style.cssText = `
          width: ${width}px;
          height: ${height}px;
          margin-bottom: 10px;
          background-color: #FFFBEB;
        `
        container.appendChild(pageWrapper)

        // Rendre le composant React dans le wrapper
        const root = createRoot(pageWrapper)
        await new Promise<void>((resolve) => {
          root.render(
            <ExactPageRenderer
              page={page}
              pageIndex={i}
              totalPages={story.pages.length}
              pageColor={pageColor as any}
              showLines={showLines}
              width={width}
              height={height}
            />
          )
          // Attendre un peu que React rende le composant
          setTimeout(resolve, 200)
        })

        // Attendre le chargement des images
        const images = pageWrapper.querySelectorAll('img')
        if (images.length > 0) {
          await Promise.all(
            Array.from(images).map(
              (img) =>
                new Promise<void>((resolve) => {
                  if (img.complete) {
                    resolve()
                  } else {
                    img.onload = () => resolve()
                    img.onerror = () => resolve() // Continuer même si erreur
                  }
                })
            )
          )
        }

        // Récupérer l'élément .printable-page
        const pageElement = pageWrapper.querySelector('.printable-page') as HTMLElement
        if (pageElement) {
          pageElements.push(pageElement)
        }

        setState(s => ({
          ...s,
          progress: Math.round((i / story.pages.length) * 30), // 0-30% pour le rendu
          message: `Rendu page ${i + 1}/${story.pages.length}...`,
        }))
      }

      // Générer le PDF à partir des captures
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
            // Mapper 0-100 vers 30-100 (30% déjà utilisé pour le rendu)
            const adjustedProgress = 30 + Math.round(progress * 0.7)
            setState(s => ({ ...s, progress: adjustedProgress, message }))
          },
        }
      )

      // Nettoyer le conteneur
      document.body.removeChild(container)
      containerRef.current = null

      setState({
        isExporting: false,
        progress: 100,
        message: 'Export terminé !',
        error: null,
        result,
      })

      return result
    } catch (error) {
      console.error('PDF export error:', error)
      
      // Nettoyer en cas d'erreur
      if (containerRef.current) {
        document.body.removeChild(containerRef.current)
        containerRef.current = null
      }

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

  /**
   * Télécharge le PDF généré
   */
  const download = useCallback((filename: string) => {
    if (state.result) {
      downloadPdf(state.result, filename)
    }
  }, [state.result])

  /**
   * Estime le temps de génération
   */
  const getEstimatedTime = useCallback((pageCount: number, useUpscale: boolean = true) => {
    return estimateGenerationTime(pageCount, useUpscale)
  }, [])

  /**
   * Réinitialise l'état
   */
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
