'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Loader2
} from 'lucide-react'
import { useStudioStore, type ImportedAsset } from '@/store/useStudioStore'
import { useStudioProgressStore } from '@/store/useStudioProgressStore'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { cn } from '@/lib/utils'

interface AssetDropzoneProps {
  onAssetImported?: (asset: ImportedAsset) => void
}

export function AssetDropzone({ onAssetImported }: AssetDropzoneProps) {
  const { importedAssets, addImportedAsset, updateAsset, removeImportedAsset, currentKit } = useStudioStore()
  const { completeStep, completedSteps } = useStudioProgressStore()
  const { upload, isUploading } = useMediaUpload()
  
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setIsProcessing(true)

    const files = Array.from(e.dataTransfer.files)
    
    for (const file of files) {
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
    // Déterminer le type
    let type: 'image' | 'audio' | 'video' = 'image'
    if (file.type.startsWith('audio/')) type = 'audio'
    else if (file.type.startsWith('video/')) type = 'video'
    else if (!file.type.startsWith('image/')) return // Ignorer les autres types

    // Créer l'URL de prévisualisation (temporaire pour affichage immédiat)
    const previewUrl = URL.createObjectURL(file)

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
    }

    const assetId = addImportedAsset(asset)
    
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
      midjourney: { label: 'Midjourney', color: 'bg-aurora-500' },
      elevenlabs: { label: 'ElevenLabs', color: 'bg-dream-500' },
      runway: { label: 'Runway', color: 'bg-stardust-500' },
      gemini: { label: 'Gemini', color: 'bg-blue-500' },
      upload: { label: 'Upload', color: 'bg-midnight-500' },
    }
    return badges[source]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Download className="w-5 h-5 text-dream-400" />
        <h3 className="font-semibold text-white">Importer tes créations</h3>
      </div>

      {/* Zone de drop */}
      <motion.div
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer',
          isDragging
            ? 'border-aurora-500 bg-aurora-500/10'
            : 'border-midnight-600 hover:border-aurora-500/50 hover:bg-midnight-800/30'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.01 }}
        animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
      >
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="py-4"
            >
              <motion.div
                className="w-12 h-12 mx-auto mb-3 rounded-full bg-aurora-500/20 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-6 h-6 text-aurora-400" />
              </motion.div>
              <p className="text-aurora-300">Import en cours...</p>
            </motion.div>
          ) : isDragging ? (
            <motion.div
              key="dragging"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="py-4"
            >
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-aurora-500/20 flex items-center justify-center">
                <Upload className="w-8 h-8 text-aurora-400" />
              </div>
              <p className="text-aurora-300 font-medium">Lâche ici !</p>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex justify-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-aurora-500/20 flex items-center justify-center">
                  <Image className="w-6 h-6 text-aurora-400" />
                </div>
                <div className="w-12 h-12 rounded-xl bg-stardust-500/20 flex items-center justify-center">
                  <Video className="w-6 h-6 text-stardust-400" />
                </div>
              </div>
              
              <p className="text-white font-medium mb-1">
                Glisse tes fichiers ici
              </p>
              <p className="text-sm text-midnight-400">
                Images ou vidéos créées sur Midjourney / Runway
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Liste des assets importés */}
      {importedAssets.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm text-midnight-400 uppercase tracking-wider">
            Fichiers importés ({importedAssets.length})
          </h4>
          
          <div className="grid gap-3">
            <AnimatePresence>
              {importedAssets.map((asset) => {
                const Icon = getAssetIcon(asset.type)
                const sourceBadge = getSourceBadge(asset.source)
                
                return (
                  <motion.div
                    key={asset.id}
                    className="glass rounded-xl p-4 flex items-center gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    layout
                  >
                    {/* Preview */}
                    <div className="w-16 h-16 rounded-lg bg-midnight-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {asset.type === 'image' && asset.url ? (
                        <img 
                          src={asset.url} 
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon className="w-8 h-8 text-midnight-400" />
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {asset.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs text-white',
                          sourceBadge.color
                        )}>
                          {sourceBadge.label}
                        </span>
                        
                        {/* Indicateur de statut cloud */}
                        {asset.isUploading ? (
                          <span className="flex items-center gap-1 text-xs text-aurora-400">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Upload...
                          </span>
                        ) : asset.cloudUrl ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-400" title="Sauvegardé dans le cloud">
                            <Cloud className="w-3 h-3" />
                            Cloud
                          </span>
                        ) : asset.uploadError ? (
                          <span className="flex items-center gap-1 text-xs text-amber-400" title={asset.uploadError}>
                            <CloudOff className="w-3 h-3" />
                            Local
                          </span>
                        ) : (
                          <span className="text-xs text-midnight-400">
                            {new Date(asset.importedAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => removeImportedAsset(asset.id)}
                        className="p-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
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

