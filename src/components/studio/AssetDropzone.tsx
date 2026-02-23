'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import {
  Upload,
  Image,
  Video,
  X,
  Check,
  FileImage,
  FileVideo,
  Trash2,
  Download,
  Sparkles,
  Cloud,
  CloudOff,
  Loader2,
  Eraser,
  ZoomIn,
  FolderOpen,
  Plus,
} from 'lucide-react'
import { useStudioStore, type ImportedAsset } from '@/store/useStudioStore'
import { useStudioProgressStore } from '@/store/useStudioProgressStore'
import { useAppStore } from '@/store/useAppStore'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { useToast } from '@/components/ui/Toast'
import { removeBackground, isBackgroundRemovalSupported } from '@/lib/background-removal'
import { cn, getThumbnailUrl } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n/context'

// Résolution minimale pour impression A5 à 300 DPI
// A5 = 14.8 × 21 cm = 5.83 × 8.27 pouces
// À 300 DPI : 1748 × 2480 pixels
const MIN_PRINT_WIDTH = 1748
const MIN_PRINT_HEIGHT = 2480


interface AssetDropzoneProps {
  onAssetImported?: (asset: ImportedAsset) => void
  showDropzone?: boolean // Si false, affiche seulement la galerie
  showGallery?: boolean // Si false, affiche seulement la zone de drop
  title?: string // Titre personnalisé
}

export function AssetDropzone({ onAssetImported, showDropzone = true, showGallery = true, title }: AssetDropzoneProps) {
  const t = useTranslations('studio')
  const { importedAssets, addImportedAsset, updateAsset, removeImportedAsset, currentKit, updateKit } = useStudioStore()
  const { completeStep, completedSteps, currentCreationType } = useStudioProgressStore()
  const { currentStory } = useAppStore()
  const { upload, isUploading } = useMediaUpload()
  const toast = useToast()
  
  // État pour le feedback visuel après import
  const [justImported, setJustImported] = useState<string | null>(null)
  
  // Filtrer les assets par projet actuel et avec une URL valide
  // Les URLs blob (blob:http://...) ne survivent pas au rechargement de page
  const projectAssets = useMemo(() => {
    return importedAssets.filter(a => {
      // Doit appartenir au projet actuel ou être sans projet
      const belongsToProject = !a.projectId || a.projectId === currentStory?.id
      // Doit avoir une URL valide (cloudUrl ou URL non-blob)
      const hasValidUrl = a.cloudUrl || (a.url && !a.url.startsWith('blob:'))
      return belongsToProject && hasValidUrl
    })
  }, [importedAssets, currentStory?.id])
  
  // Images disponibles pour le modal (même filtre que PromptBuilder pour cohérence)
  const availableImagesForModal = useMemo(() => {
    return importedAssets.filter(a => 
      a.type === 'image' && 
      (a.cloudUrl || (a.url && !a.url.startsWith('blob:'))) &&
      (!a.projectId || a.projectId === currentStory?.id)
    )
  }, [importedAssets, currentStory?.id])
  
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [removingBgId, setRemovingBgId] = useState<string | null>(null)
  const [bgRemovalProgress, setBgRemovalProgress] = useState(0)
  const [upscalingId, setUpscalingId] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Mémoriser le support WebGL (calculé une seule fois)
  const canRemoveBackground = useMemo(() => isBackgroundRemovalSupported(), [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🔷 DragEnter détecté')
    setIsDragging(true)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Ne pas re-set isDragging à chaque dragOver pour éviter les re-renders
    if (!isDragging) setIsDragging(true)
  }, [isDragging])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Vérifier que nous quittons vraiment la zone (pas juste un enfant)
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      console.log('🔶 DragLeave - sortie de la zone')
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setIsProcessing(true)

    const files = Array.from(e.dataTransfer.files)
    console.log('📥 Drop détecté:', files.length, 'fichiers')
    
    for (const file of files) {
      console.log('📄 Traitement:', file.name, file.type)
      await processFile(file)
    }
    
    setIsProcessing(false)
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    setIsProcessing(true)
    
    for (const file of Array.from(files)) {
      await processFile(file)
    }
    
    setIsProcessing(false)
    e.target.value = '' // Reset input
  }

  const processFile = async (file: File) => {
    console.log('🔄 processFile appelé:', file.name, file.type)
    
    // Déterminer le type
    let type: 'image' | 'audio' | 'video' = 'image'
    if (file.type.startsWith('audio/')) type = 'audio'
    else if (file.type.startsWith('video/')) type = 'video'
    else if (!file.type.startsWith('image/')) {
      console.log('❌ Type de fichier non supporté:', file.type)
      toast.warning('Type de fichier non supporté', 'Seules les images et vidéos sont acceptées')
      return
    }

    // Toast immédiat pour confirmer la détection
    toast.info('📥 Import en cours...', file.name.slice(0, 30))

    // Créer l'URL de prévisualisation (temporaire pour affichage immédiat)
    const previewUrl = URL.createObjectURL(file)
    console.log('✅ URL preview créée:', previewUrl)

    // Détecter la source (heuristique basée sur le nom du fichier)
    let source: ImportedAsset['source'] = 'upload'
    const filename = file.name.toLowerCase()
    if (filename.includes('midjourney') || filename.includes('mj_')) {
      source = 'midjourney'
    } else if (filename.includes('elevenlabs') || filename.includes('11labs')) {
      source = 'elevenlabs'
    } else if (filename.includes('runway') || filename.includes('gen-')) {
      source = 'runway'
    }

    // Ajouter immédiatement avec URL temporaire (pour preview)
    const asset: Omit<ImportedAsset, 'id' | 'importedAt'> = {
      type,
      file,
      url: previewUrl,
      name: file.name,
      source,
      promptUsed: currentKit?.generatedPrompt,
      isUploading: true,
      projectId: currentStory?.id, // Lier à l'histoire actuelle
    }

    const assetId = addImportedAsset(asset)
    console.log('✅ Asset ajouté au store:', assetId, asset.name)
    
    // Feedback visuel immédiat
    setJustImported(assetId)
    setTimeout(() => setJustImported(null), 3000) // Effet flash pendant 3s
    
    // Upload vers le cloud en arrière-plan
    try {
      const result = await upload(file, {
        type,
        source,
      })

      if (result) {
        // Mise à jour avec l'URL cloud permanente
        updateAsset(assetId, {
          cloudUrl: result.url,
          assetId: result.assetId,
          isUploading: false,
        })
        console.log(`✅ Asset uploadé: ${result.url}`)
        
        // Toast de succès
        toast.success('✅ Fichier importé !', file.name.slice(0, 25))
        
        // Pour les images: vérifier si upscaling nécessaire pour qualité impression
        if (type === 'image' && result.url) {
          // Obtenir les dimensions de l'image
          const img = new window.Image()
          img.onload = async () => {
            const needsUpscale = img.width < MIN_PRINT_WIDTH || img.height < MIN_PRINT_HEIGHT
            
            if (needsUpscale) {
              console.log(`🔍 Image trop petite (${img.width}x${img.height}), upscaling automatique...`)
              setUpscalingId(assetId)
              
              try {
                const upscaleResponse = await fetch('/api/ai/image/upscale', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ imageUrl: result.url }),
                })
                
                if (upscaleResponse.ok) {
                  const upscaled = await upscaleResponse.json()
                  updateAsset(assetId, {
                    cloudUrl: upscaled.imageUrl,
                  })
                  console.log(`✅ Image upscalée: ${upscaled.width}x${upscaled.height}`)
                } else {
                  console.warn('⚠️ Upscaling échoué, image conservée telle quelle')
                }
              } catch (upscaleError) {
                console.warn('⚠️ Erreur upscaling:', upscaleError)
              } finally {
                setUpscalingId(null)
              }
            } else {
              console.log(`✅ Image déjà en qualité impression (${img.width}x${img.height})`)
            }
          }
          img.src = result.url
        }
      } else {
        // Erreur d'upload (garde l'URL temporaire)
        updateAsset(assetId, {
          isUploading: false,
          uploadError: 'Échec upload - utilisez en local',
        })
        console.warn(`⚠️ Upload échoué pour ${file.name}, URL temporaire conservée`)
      }
    } catch (err) {
      updateAsset(assetId, {
        isUploading: false,
        uploadError: err instanceof Error ? err.message : 'Erreur inconnue',
      })
      console.error('Erreur upload:', err)
    }
    
    onAssetImported?.(asset as ImportedAsset)
    
    // Marquer l'étape "Importer" comme complétée
    if (!completedSteps.includes('import')) {
      completeStep('import')
    }
    
    // Feedback visuel de succès (après upload)
    toast.success(`${type === 'image' ? '🖼️ Image' : '🎬 Vidéo'} importée !`, file.name.slice(0, 30))
  }

  const getAssetIcon = (type: ImportedAsset['type']) => {
    switch (type) {
      case 'image': return FileImage
      case 'video': return FileVideo
      default: return FileImage
    }
  }

  const getSourceBadge = (source: ImportedAsset['source']) => {
    const badges: Record<ImportedAsset['source'], { label: string; color: string }> = {
      midjourney: { label: 'fal.ai Flux', color: 'bg-aurora-500' },
      elevenlabs: { label: 'ElevenLabs', color: 'bg-dream-500' },
      runway: { label: 'fal.ai Kling', color: 'bg-stardust-500' },
      gemini: { label: 'Gemini', color: 'bg-blue-500' },
      upload: { label: 'Upload', color: 'bg-midnight-500' },
    }
    return badges[source]
  }

  // ✂️ Fonction de suppression du fond
  const handleRemoveBackground = async (asset: ImportedAsset) => {
    if (asset.type !== 'image' || removingBgId) return
    
    setRemovingBgId(asset.id)
    setBgRemovalProgress(0)
    
    try {
      const result = await removeBackground(asset.url, {
        onProgress: (progress) => setBgRemovalProgress(progress),
      })
      
      // Créer un nouvel asset avec l'image détourée
      const detoureedAsset: Omit<ImportedAsset, 'id' | 'importedAt'> = {
        type: 'image',
        file: result.file,
        url: result.url,
        name: asset.name.replace(/\.[^/.]+$/, '') + '-detoured.png',
        source: asset.source,
        promptUsed: asset.promptUsed,
        isUploading: true,
        projectId: asset.projectId || currentStory?.id, // Garder l'histoire de l'original
      }
      
      const newAssetId = addImportedAsset(detoureedAsset)
      
      // Upload vers le cloud
      const cloudResult = await upload(result.file, { type: 'image', source: asset.source })
      if (cloudResult) {
        updateAsset(newAssetId, {
          cloudUrl: cloudResult.url,
          assetId: cloudResult.assetId,
          isUploading: false,
        })
      } else {
        updateAsset(newAssetId, { isUploading: false })
      }
      
    } catch (error) {
      console.error('Erreur détourage:', error)
      alert('Erreur lors du détourage. Réessayez.')
    } finally {
      setRemovingBgId(null)
      setBgRemovalProgress(0)
    }
  }

  // Si pas de dropzone et pas d'assets du projet, ne rien afficher
  if (!showDropzone && projectAssets.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Download className="w-5 h-5 text-dream-400" />
        <h3 className="font-semibold text-white">{title || (showDropzone ? t('assetDropzone.importTitle') : t('assetDropzone.myCreations'))}</h3>
      </div>

      {/* Input file caché pour l'import depuis l'ordinateur */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Bouton pour voir mes créations existantes */}
      {showDropzone && projectAssets.length > 0 && (
        <div className="space-y-2">
          <motion.button
            onClick={() => setShowImportModal(true)}
            className="w-full border border-midnight-600 hover:border-stardust-500/50 rounded-xl p-3 text-center transition-all hover:bg-midnight-800/30 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <FolderOpen className="w-4 h-4 text-stardust-400" />
            <span className="text-stardust-300 text-sm">
              {t('assetDropzone.viewExisting', { count: String(projectAssets.length) })}
            </span>
          </motion.button>
        </div>
      )}

      {/* ========== MODALE D'IMPORT ========== */}
      {showImportModal && typeof document !== 'undefined' && createPortal(
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowImportModal(false)}
          />
          
          {/* Contenu de la modale */}
          <motion.div
            className="relative w-full max-w-2xl max-h-[80vh] bg-midnight-900 rounded-3xl border border-midnight-700 shadow-2xl overflow-hidden flex flex-col"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-midnight-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-aurora-500/20 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-aurora-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{t('assetDropzone.importCreation')}</h2>
                  <p className="text-xs text-midnight-400">{t('assetDropzone.chooseOrImport')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 rounded-xl hover:bg-midnight-800 transition-colors"
              >
                <X className="w-5 h-5 text-midnight-400" />
              </button>
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Section 1 : Mes images existantes (priorité visuelle) */}
              {availableImagesForModal.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Image className="w-4 h-4 text-aurora-400" />
                    {t('assetDropzone.selectExisting', { count: String(availableImagesForModal.length) })}
                  </h3>
                  <p className="text-xs text-midnight-400 mb-3">
                    {t('assetDropzone.clickToUse')}
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-64 overflow-y-auto pr-1">
                    {availableImagesForModal.map((asset) => (
                      <motion.button
                        key={asset.id}
                        onClick={() => {
                          // Si mode vidéo, sélectionner comme image source
                          if (currentCreationType === 'video') {
                            updateKit({ 
                              sourceImageUrl: asset.cloudUrl || asset.url,
                              sourceImageId: asset.id 
                            })
                            // Marquer l'étape "choose_image" comme complétée
                            if (!completedSteps.includes('choose_image')) {
                              completeStep('choose_image')
                            }
                          }
                          // Callback si fourni
                          onAssetImported?.(asset)
                          // Marquer l'étape "Importer" comme complétée
                          if (!completedSteps.includes('import')) {
                            completeStep('import')
                          }
                          setShowImportModal(false)
                          toast.success('✅ Image sélectionnée !', asset.name.slice(0, 20))
                        }}
                        className="relative aspect-square rounded-xl overflow-hidden border-2 border-midnight-700 hover:border-aurora-500 transition-all group"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <img
                          src={getThumbnailUrl(asset.cloudUrl || asset.url, 200)}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement
                            if (!img.dataset.fallback) {
                              img.dataset.fallback = '1'
                              img.src = asset.cloudUrl || asset.url
                            }
                          }}
                        />
                        {/* Overlay au hover */}
                        <div className="absolute inset-0 bg-aurora-500/0 group-hover:bg-aurora-500/20 transition-colors flex items-center justify-center">
                          <Check className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                        </div>
                        {/* Badge cloud */}
                        {asset.cloudUrl && (
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-dream-500/80 flex items-center justify-center">
                            <Cloud className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message si aucune image */}
              {availableImagesForModal.length === 0 && (
                <div className="text-center py-6 px-4 rounded-xl bg-midnight-800/30 border border-midnight-700">
                  <Image className="w-10 h-10 text-midnight-500 mx-auto mb-2" />
                  <p className="text-midnight-400 text-sm">
                    {t('assetDropzone.noImages')}
                  </p>
                  <p className="text-midnight-500 text-xs mt-1">
                    {t('assetDropzone.importFirst')}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-midnight-700 bg-midnight-800/50">
              <button
                onClick={() => setShowImportModal(false)}
                className="w-full py-2.5 rounded-xl bg-midnight-700 hover:bg-midnight-600 text-white text-sm font-medium transition-colors"
              >
                {t('assetDropzone.close')}
              </button>
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}

      {/* Grille des assets importés - seulement si showGallery=true */}
      {showGallery && projectAssets.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm text-midnight-400 uppercase tracking-wider">
            {t('assetDropzone.importedFiles', { count: String(projectAssets.length) })}
          </h4>
          
          {/* Grille de miniatures - scrollable si beaucoup d'images */}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-48 overflow-y-auto pr-1">
            <AnimatePresence>
              {projectAssets.map((asset) => {
                const Icon = getAssetIcon(asset.type)
                
                const isNewlyImported = justImported === asset.id
                
                return (
                  <motion.div
                    key={asset.id}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden bg-midnight-800 group cursor-pointer",
                      isNewlyImported && "ring-2 ring-dream-400 ring-offset-2 ring-offset-midnight-900"
                    )}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: isNewlyImported ? [1, 1.05, 1] : 1,
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={isNewlyImported ? { duration: 0.5 } : undefined}
                    layout
                    title={asset.name}
                  >
                    {/* Image/Video preview - Miniature redimensionnée pour performance */}
                    {asset.type === 'image' && (asset.cloudUrl || asset.url) ? (
                      <img
                        src={getThumbnailUrl(asset.cloudUrl || asset.url, 200)}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement
                          // Fallback : si la miniature échoue, charger l'original
                          if (!img.dataset.fallback) {
                            img.dataset.fallback = '1'
                            img.src = asset.cloudUrl || asset.url
                          }
                        }}
                      />
                    ) : asset.type === 'video' && (asset.cloudUrl || asset.url) ? (
                      <video
                        src={asset.cloudUrl || asset.url}
                        className="w-full h-full object-cover"
                        preload="metadata"
                        muted
                        playsInline
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon className="w-8 h-8 text-midnight-400" />
                      </div>
                    )}

                    {/* Indicateur de statut (coin) */}
                    {isNewlyImported && (
                      <motion.div 
                        className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-dream-500 text-white text-[10px] font-bold"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        ✓ Nouveau
                      </motion.div>
                    )}
                    {!isNewlyImported && asset.isUploading && (
                      <div className="absolute top-1 left-1 p-1 rounded-full bg-midnight-900/80">
                        <Loader2 className="w-3 h-3 text-aurora-400 animate-spin" />
                      </div>
                    )}
                    {!isNewlyImported && upscalingId === asset.id && (
                      <div className="absolute top-1 left-1 p-1 rounded-full bg-midnight-900/80">
                        <ZoomIn className="w-3 h-3 text-dream-400 animate-pulse" />
                      </div>
                    )}
                    {!isNewlyImported && asset.cloudUrl && !asset.isUploading && upscalingId !== asset.id && (
                      <div className="absolute top-1 left-1 p-1 rounded-full bg-midnight-900/80">
                        <Cloud className="w-3 h-3 text-emerald-400" />
                      </div>
                    )}

                    {/* Overlay au survol avec actions */}
                    <div className="absolute inset-0 bg-midnight-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      {/* Bouton détourage */}
                      {asset.type === 'image' && canRemoveBackground && (
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveBackground(asset)
                          }}
                          disabled={removingBgId !== null}
                          className="p-2 rounded-lg bg-aurora-500/30 text-aurora-300 hover:bg-aurora-500/50 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title={t('assetDropzone.removeBg')}
                        >
                          {removingBgId === asset.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Eraser className="w-4 h-4" />
                          )}
                        </motion.button>
                      )}
                      
                      {/* Bouton supprimer */}
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImportedAsset(asset.id)
                        }}
                        className="p-2 rounded-lg bg-rose-500/30 text-rose-300 hover:bg-rose-500/50 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title={t('assetDropzone.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>

                    {/* Badge vidéo */}
                    {asset.type === 'video' && (
                      <div className="absolute bottom-1 right-1 p-1 rounded bg-midnight-900/80">
                        <Video className="w-3 h-3 text-stardust-400" />
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}

