/**
 * Export PDF par capture directe des pages de BookMode
 * 
 * Capture EXACTEMENT ce qui est affiché à l'écran (screenshot)
 */

import { useState, useCallback } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface ExportProgress {
  status: 'idle' | 'capturing' | 'upscaling' | 'generating' | 'done' | 'error'
  currentPage: number
  totalPages: number
  message: string
}

interface UseDirectPdfExportOptions {
  onProgress?: (progress: ExportProgress) => void
  upscaleEnabled?: boolean
}

export function useDirectPdfExport(options: UseDirectPdfExportOptions = {}) {
  const { onProgress, upscaleEnabled = true } = options
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<ExportProgress>({
    status: 'idle',
    currentPage: 0,
    totalPages: 0,
    message: '',
  })

  const updateProgress = useCallback((update: Partial<ExportProgress>) => {
    setProgress((prev) => {
      const newProgress = { ...prev, ...update }
      onProgress?.(newProgress)
      return newProgress
    })
  }, [onProgress])

  /**
   * Capture un élément DOM en image
   */
  const captureElement = useCallback(async (element: HTMLElement): Promise<string> => {
    const canvas = await html2canvas(element, {
      scale: 2, // 2x pour meilleure qualité
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: null, // Garder le fond tel quel
      imageTimeout: 30000,
    })
    return canvas.toDataURL('image/png')
  }, [])

  /**
   * Upscale une image via Fal.ai
   */
  const upscaleImage = useCallback(async (imageDataUrl: string): Promise<string> => {
    try {
      // Convertir data URL en blob puis en URL publique
      const response = await fetch(imageDataUrl)
      const blob = await response.blob()
      
      // Créer une URL temporaire
      const formData = new FormData()
      formData.append('file', blob, 'page.png')
      
      // Uploader vers notre API qui va l'envoyer à Fal.ai
      const uploadResponse = await fetch('/api/ai/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageDataUrl,
          scale: 2,
        }),
      })
      
      if (!uploadResponse.ok) {
        console.warn('Upscale failed, using original image')
        return imageDataUrl
      }
      
      const data = await uploadResponse.json()
      return data.url || imageDataUrl
    } catch (error) {
      console.warn('Upscale error:', error)
      return imageDataUrl
    }
  }, [])

  /**
   * Exporte les pages en PDF en capturant directement les éléments DOM
   */
  const exportFromElements = useCallback(async (
    pageElements: HTMLElement[],
    filename: string = 'livre.pdf'
  ): Promise<void> => {
    if (pageElements.length === 0) {
      throw new Error('Aucune page à exporter')
    }

    setIsExporting(true)
    updateProgress({
      status: 'capturing',
      currentPage: 0,
      totalPages: pageElements.length,
      message: 'Préparation...',
    })

    try {
      const pageImages: string[] = []

      // Capturer chaque page
      for (let i = 0; i < pageElements.length; i++) {
        updateProgress({
          status: 'capturing',
          currentPage: i + 1,
          message: `Capture de la page ${i + 1}/${pageElements.length}...`,
        })

        const element = pageElements[i]
        
        // Cacher temporairement les éléments UI
        const uiElements = element.querySelectorAll('[data-pdf-hide]')
        uiElements.forEach((el) => {
          (el as HTMLElement).style.visibility = 'hidden'
        })

        // Capturer
        let imageUrl = await captureElement(element)

        // Restaurer les éléments UI
        uiElements.forEach((el) => {
          (el as HTMLElement).style.visibility = ''
        })

        // Upscale si activé
        if (upscaleEnabled) {
          updateProgress({
            status: 'upscaling',
            currentPage: i + 1,
            message: `Amélioration de la page ${i + 1}...`,
          })
          imageUrl = await upscaleImage(imageUrl)
        }

        pageImages.push(imageUrl)
      }

      // Générer le PDF
      updateProgress({
        status: 'generating',
        currentPage: pageElements.length,
        message: 'Génération du PDF...',
      })

      // Format A5 en paysage pour un livre
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a5',
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      for (let i = 0; i < pageImages.length; i++) {
        if (i > 0) {
          pdf.addPage()
        }

        const img = new Image()
        img.src = pageImages[i]
        await new Promise<void>((resolve) => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
        })

        // Calculer le ratio pour remplir la page
        const imgRatio = img.width / img.height
        const pageRatio = pdfWidth / pdfHeight

        let drawWidth: number
        let drawHeight: number
        let x: number
        let y: number

        if (imgRatio > pageRatio) {
          drawWidth = pdfWidth
          drawHeight = pdfWidth / imgRatio
          x = 0
          y = (pdfHeight - drawHeight) / 2
        } else {
          drawHeight = pdfHeight
          drawWidth = pdfHeight * imgRatio
          x = (pdfWidth - drawWidth) / 2
          y = 0
        }

        pdf.addImage(pageImages[i], 'PNG', x, y, drawWidth, drawHeight)
      }

      // Télécharger
      pdf.save(filename)

      updateProgress({
        status: 'done',
        currentPage: pageElements.length,
        message: 'PDF généré avec succès !',
      })
    } catch (error) {
      console.error('Export error:', error)
      updateProgress({
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur lors de l\'export',
      })
      throw error
    } finally {
      setIsExporting(false)
    }
  }, [captureElement, upscaleImage, upscaleEnabled, updateProgress])

  return {
    exportFromElements,
    isExporting,
    progress,
  }
}
