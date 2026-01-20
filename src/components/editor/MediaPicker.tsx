'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Upload,
  Image as ImageIcon,
  Video,
  Music,
  Sparkles,
  FolderOpen,
  Check,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { useStudioStore, type ImportedAsset } from '@/store/useStudioStore'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { cn } from '@/lib/utils'

type MediaType = 'image' | 'video' | 'audio' | 'all'

interface MediaPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (url: string, type: 'image' | 'video' | 'audio') => void
  allowedTypes?: MediaType
  title?: string
}

export function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  allowedTypes = 'all',
  title = 'Ajouter un média',
}: MediaPickerProps) {
  const { importedAssets } = useStudioStore()
  const { upload, isUploading, progress } = useMediaUpload()
  const [activeTab, setActiveTab] = useState<'studio' | 'upload'>('studio')
  const [isDragging, setIsDragging] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<ImportedAsset | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filtrer les assets selon le type autorisé
  const filteredAssets = importedAssets.filter((asset) => {
    if (allowedTypes === 'all') return true
    if (allowedTypes === 'image') return asset.type === 'image'
    if (allowedTypes === 'video') return asset.type === 'video'
    if (allowedTypes === 'audio') return asset.type === 'audio'
    return true
  })

  // Grouper par type
  const imageAssets = filteredAssets.filter((a) => a.type === 'image')
  const videoAssets = filteredAssets.filter((a) => a.type === 'video')
  const audioAssets = filteredAssets.filter((a) => a.type === 'audio')

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      const file = files[0]

      // Déterminer le type de média
      let type: 'image' | 'video' | 'audio' = 'image'
      if (file.type.startsWith('video/')) type = 'video'
      else if (file.type.startsWith('audio/')) type = 'audio'

      // Upload vers Supabase (images/audio) ou R2 (videos)
      const result = await upload(file, { type, source: 'upload' })
      
      if (result) {
        onSelect(result.url, type)
        onClose()
      }
    },
    [upload, onSelect, onClose]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFileSelect(e.dataTransfer.files)
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleSelectFromStudio = (asset: ImportedAsset) => {
    setSelectedAsset(asset)
  }

  const handleConfirmSelection = () => {
    if (selectedAsset) {
      onSelect(selectedAsset.url, selectedAsset.type as 'image' | 'video' | 'audio')
      onClose()
    }
  }

  const getAcceptTypes = () => {
    switch (allowedTypes) {
      case 'image':
        return 'image/*'
      case 'video':
        return 'video/*'
      case 'audio':
        return 'audio/*'
      default:
        return 'image/*,video/*,audio/*'
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-midnight-950/90 backdrop-blur-md"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-3xl max-h-[85vh] mx-4 bg-gradient-to-b from-midnight-900 to-midnight-950 rounded-3xl border border-aurora-500/20 shadow-2xl shadow-aurora-500/10 overflow-hidden flex flex-col"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-midnight-700/50">
            <h2 className="font-display text-2xl text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aurora-500 to-dream-500 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-midnight-800 text-midnight-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-6 pt-4">
            <button
              onClick={() => setActiveTab('studio')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                activeTab === 'studio'
                  ? 'bg-aurora-500/20 text-aurora-300 border border-aurora-500/30'
                  : 'text-midnight-400 hover:text-white hover:bg-midnight-800'
              )}
            >
              <Sparkles className="w-4 h-4" />
              Mes créations Studio
              {filteredAssets.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-aurora-500/30 text-[10px]">
                  {filteredAssets.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                activeTab === 'upload'
                  ? 'bg-dream-500/20 text-dream-300 border border-dream-500/30'
                  : 'text-midnight-400 hover:text-white hover:bg-midnight-800'
              )}
            >
              <FolderOpen className="w-4 h-4" />
              Depuis mon ordinateur
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'studio' ? (
                <motion.div
                  key="studio"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {filteredAssets.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-midnight-800/50 flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-midnight-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Pas encore de créations
                      </h3>
                      <p className="text-midnight-400 text-sm max-w-sm mx-auto">
                        Va dans le <span className="text-aurora-400">Studio</span> pour créer des
                        images magiques avec fal.ai, des voix avec ElevenLabs ou des vidéos avec
                        fal.ai !
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Images */}
                      {imageAssets.length > 0 &&
                        (allowedTypes === 'all' || allowedTypes === 'image') && (
                          <div>
                            <h3 className="text-sm text-midnight-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" />
                              Images ({imageAssets.length})
                            </h3>
                            <div className="grid grid-cols-4 gap-3">
                              {imageAssets.map((asset) => (
                                <AssetCard
                                  key={asset.id}
                                  asset={asset}
                                  isSelected={selectedAsset?.id === asset.id}
                                  onSelect={() => handleSelectFromStudio(asset)}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Videos */}
                      {videoAssets.length > 0 &&
                        (allowedTypes === 'all' || allowedTypes === 'video') && (
                          <div>
                            <h3 className="text-sm text-midnight-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Video className="w-4 h-4" />
                              Vidéos ({videoAssets.length})
                            </h3>
                            <div className="grid grid-cols-4 gap-3">
                              {videoAssets.map((asset) => (
                                <AssetCard
                                  key={asset.id}
                                  asset={asset}
                                  isSelected={selectedAsset?.id === asset.id}
                                  onSelect={() => handleSelectFromStudio(asset)}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Audios */}
                      {audioAssets.length > 0 &&
                        (allowedTypes === 'all' || allowedTypes === 'audio') && (
                          <div>
                            <h3 className="text-sm text-midnight-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Music className="w-4 h-4" />
                              Sons ({audioAssets.length})
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                              {audioAssets.map((asset) => (
                                <AudioAssetCard
                                  key={asset.id}
                                  asset={asset}
                                  isSelected={selectedAsset?.id === asset.id}
                                  onSelect={() => handleSelectFromStudio(asset)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {/* Zone de drop */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={cn(
                      'relative border-2 border-dashed rounded-2xl p-12 text-center transition-all',
                      isUploading
                        ? 'border-aurora-500 bg-aurora-500/10 cursor-wait'
                        : isDragging
                          ? 'border-dream-500 bg-dream-500/10 cursor-pointer'
                          : 'border-midnight-700 hover:border-dream-500/50 hover:bg-midnight-800/30 cursor-pointer'
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={getAcceptTypes()}
                      onChange={(e) => handleFileSelect(e.target.files)}
                      className="hidden"
                      disabled={isUploading}
                    />

                    <div
                      className={cn(
                        'w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all',
                        isUploading
                          ? 'bg-aurora-500/20'
                          : isDragging
                            ? 'bg-dream-500/20 scale-110'
                            : 'bg-midnight-800/50'
                      )}
                    >
                      {isUploading ? (
                        <Loader2 className="w-10 h-10 text-aurora-400 animate-spin" />
                      ) : (
                        <Upload
                          className={cn(
                            'w-10 h-10 transition-all',
                            isDragging ? 'text-dream-400' : 'text-midnight-500'
                          )}
                        />
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2">
                      {isUploading 
                        ? `Upload en cours... ${progress}%` 
                        : isDragging 
                          ? 'Lâche ici !' 
                          : 'Glisse un fichier ici'}
                    </h3>
                    <p className="text-midnight-400 text-sm">
                      {isUploading 
                        ? 'Ton fichier est envoyé vers le cloud ✨' 
                        : 'ou clique pour parcourir ton ordinateur'}
                    </p>

                    {/* Barre de progression */}
                    {isUploading && (
                      <div className="mt-4 w-full max-w-xs mx-auto h-2 bg-midnight-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-aurora-500 to-dream-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}

                    {!isUploading && (
                      <div className="mt-6 flex items-center justify-center gap-4 text-xs text-midnight-500">
                        {(allowedTypes === 'all' || allowedTypes === 'image') && (
                          <span className="flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            Images
                          </span>
                        )}
                        {(allowedTypes === 'all' || allowedTypes === 'video') && (
                          <span className="flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            Vidéos
                          </span>
                        )}
                        {(allowedTypes === 'all' || allowedTypes === 'audio') && (
                          <span className="flex items-center gap-1">
                            <Music className="w-3 h-3" />
                            Sons
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer avec bouton de validation */}
          {selectedAsset && activeTab === 'studio' && (
            <motion.div
              className="border-t border-midnight-700/50 p-4 bg-midnight-900/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedAsset.type === 'image' && selectedAsset.url && (
                    <img
                      src={selectedAsset.url}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">{selectedAsset.name}</p>
                    <p className="text-xs text-midnight-400">
                      {selectedAsset.source === 'midjourney' && '🎨 fal.ai'}
                      {selectedAsset.source === 'elevenlabs' && '🎙️ ElevenLabs'}
                      {selectedAsset.source === 'runway' && '🎬 fal.ai'}
                      {selectedAsset.source === 'upload' && '📁 Import'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedAsset(null)}
                    className="px-4 py-2 rounded-xl text-midnight-400 hover:text-white hover:bg-midnight-800 transition-colors"
                  >
                    Annuler
                  </button>
                  <motion.button
                    onClick={handleConfirmSelection}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-aurora-600 to-dream-600 text-white font-semibold shadow-lg shadow-aurora-500/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Check className="w-4 h-4" />
                    Utiliser
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Carte d'asset image/vidéo
function AssetCard({
  asset,
  isSelected,
  onSelect,
}: {
  asset: ImportedAsset
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        'relative aspect-square rounded-xl overflow-hidden group transition-all',
        isSelected
          ? 'ring-2 ring-aurora-500 ring-offset-2 ring-offset-midnight-900'
          : 'hover:ring-2 hover:ring-midnight-600'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {asset.type === 'image' && asset.url && (
        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
      )}
      {asset.type === 'video' && asset.url && (
        <video src={asset.url} className="w-full h-full object-cover" muted />
      )}

      {/* Overlay au hover */}
      <div
        className={cn(
          'absolute inset-0 flex items-end justify-start p-2 transition-all',
          isSelected
            ? 'bg-gradient-to-t from-aurora-900/90 to-transparent'
            : 'bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100'
        )}
      >
        <p className="text-white text-xs truncate">{asset.name}</p>
      </div>

      {/* Badge de sélection */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-aurora-500 flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Badge source */}
      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/50 text-white">
        {asset.source === 'midjourney' && '🎨'}
        {asset.source === 'runway' && '🎬'}
        {asset.source === 'upload' && '📁'}
      </div>
    </motion.button>
  )
}

// Carte d'asset audio
function AudioAssetCard({
  asset,
  isSelected,
  onSelect,
}: {
  asset: ImportedAsset
  isSelected: boolean
  onSelect: () => void
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        'relative p-4 rounded-xl transition-all flex items-center gap-4',
        isSelected
          ? 'bg-aurora-500/20 ring-2 ring-aurora-500'
          : 'bg-midnight-800/50 hover:bg-midnight-700/50'
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <audio ref={audioRef} src={asset.url} onEnded={() => setIsPlaying(false)} />

      <button
        onClick={togglePlay}
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
          isPlaying ? 'bg-dream-500 text-white' : 'bg-midnight-700 text-midnight-300 hover:bg-midnight-600'
        )}
      >
        <Music className="w-5 h-5" />
      </button>

      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-white truncate">{asset.name}</p>
        <p className="text-xs text-midnight-400">
          {asset.source === 'elevenlabs' && '🎙️ ElevenLabs'}
          {asset.source === 'upload' && '📁 Import'}
        </p>
      </div>

      {isSelected && (
        <div className="w-6 h-6 rounded-full bg-aurora-500 flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.button>
  )
}

export default MediaPicker
