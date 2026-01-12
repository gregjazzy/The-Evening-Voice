'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutGrid, 
  Type, 
  Music, 
  Image,
  Grid,
  ZoomIn,
  ZoomOut,
  Book,
  Plus,
  Sparkles,
  Import
} from 'lucide-react'
import { useLayoutStore, ambianceLightMap } from '@/store/useLayoutStore'
import { useStudioStore } from '@/store/useStudioStore'
import { LayoutCanvas, TypographyPanel, AudioPanel, PageNavigator } from '@/components/layout'
import { cn } from '@/lib/utils'

// Tabs disponibles
const tabs = [
  { id: 'type', label: 'Texte', icon: Type },
  { id: 'media', label: 'Médias', icon: Image },
  { id: 'audio', label: 'Audio', icon: Music },
] as const

export function LayoutMode() {
  const {
    currentBook,
    currentPage,
    showGrid,
    zoomLevel,
    createBook,
    createPage,
    setShowGrid,
    setZoomLevel,
    updatePage,
    importFromStudio,
  } = useLayoutStore()

  const { importedAssets } = useStudioStore()

  const [activeTab, setActiveTab] = useState<'type' | 'media' | 'audio'>('type')
  const [showNewBookModal, setShowNewBookModal] = useState(false)
  const [newBookTitle, setNewBookTitle] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)

  // Créer un livre si aucun n'existe
  useEffect(() => {
    if (!currentBook) {
      setShowNewBookModal(true)
    }
  }, [])

  const handleCreateBook = () => {
    if (newBookTitle.trim()) {
      createBook(newBookTitle, 'Auteur Magique')
      createPage('Première page')
      setShowNewBookModal(false)
      setNewBookTitle('')
    }
  }

  const handleImportAsset = (asset: typeof importedAssets[0]) => {
    if (!currentPage) return
    
    if (asset.type === 'image') {
      if (!currentPage.backgroundImage) {
        updatePage({ backgroundImage: asset.url })
      } else {
        importFromStudio(asset.url, 'image')
      }
    } else if (asset.type === 'video') {
      updatePage({ backgroundVideo: asset.url })
    } else if (asset.type === 'audio') {
      importFromStudio(asset.url, 'audio')
    }
    setShowImportModal(false)
  }

  return (
    <div className="h-full flex flex-col">
      {/* En-tête */}
      <motion.header 
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="font-display text-3xl text-aurora-300 flex items-center gap-3">
            <LayoutGrid className="w-8 h-8" />
            Table de Montage
          </h1>
          <p className="text-midnight-300 mt-1">
            {currentBook 
              ? `📖 ${currentBook.title} - ${currentPage?.title || 'Aucune page'}` 
              : 'Crée ton premier livre'
            }
          </p>
        </div>

        {/* Contrôles de vue */}
        <div className="flex items-center gap-2">
          {/* Import depuis Studio */}
          {importedAssets.length > 0 && currentPage && (
            <motion.button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-aurora-500/20 text-aurora-300 hover:bg-aurora-500/30"
              whileHover={{ scale: 1.02 }}
            >
              <Import className="w-4 h-4" />
              Importer ({importedAssets.length})
            </motion.button>
          )}

          {/* Toggle grille */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showGrid ? 'bg-aurora-500/30 text-aurora-300' : 'bg-midnight-800/50 text-midnight-400'
            )}
            title="Afficher la grille"
          >
            <Grid className="w-5 h-5" />
          </button>

          {/* Zoom */}
          <div className="flex items-center gap-1 bg-midnight-800/50 rounded-lg p-1">
            <button
              onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
              className="p-1.5 rounded hover:bg-midnight-700/50"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-midnight-300 w-10 text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
              className="p-1.5 rounded hover:bg-midnight-700/50"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Contenu principal */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Canvas principal */}
        <div className="flex-1 flex flex-col gap-4">
          <LayoutCanvas />
          
          {/* Navigation des pages */}
          {currentBook && (
            <div className="glass rounded-xl p-4">
              <PageNavigator />
            </div>
          )}
        </div>

        {/* Panneau latéral */}
        <motion.aside
          className="w-80 glass rounded-2xl p-4 overflow-y-auto"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {currentPage ? (
            <>
              {/* Tabs */}
              <div className="flex gap-1 mb-4 bg-midnight-800/50 rounded-lg p-1">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm transition-all',
                      activeTab === id
                        ? 'bg-aurora-500/30 text-aurora-300'
                        : 'text-midnight-400 hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Contenu selon le tab */}
              <AnimatePresence mode="wait">
                {activeTab === 'type' && (
                  <motion.div
                    key="type"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <TypographyPanel />
                  </motion.div>
                )}

                {activeTab === 'media' && (
                  <motion.div
                    key="media"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Sélection du fond */}
                    <div>
                      <h3 className="text-sm text-midnight-400 uppercase tracking-wider mb-2">
                        Arrière-plan
                      </h3>
                      
                      <div className="space-y-2">
                        {/* Image de fond */}
                        <label className="block cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                updatePage({ backgroundImage: URL.createObjectURL(file) })
                              }
                            }}
                          />
                          <div className="p-4 rounded-xl border-2 border-dashed border-midnight-600 hover:border-aurora-500/50 hover:bg-aurora-500/5 transition-all text-center">
                            <Image className="w-8 h-8 mx-auto mb-2 text-midnight-400" />
                            <p className="text-sm text-midnight-300">
                              {currentPage.backgroundImage ? 'Changer l\'image' : 'Ajouter une image'}
                            </p>
                          </div>
                        </label>

                        {/* Vidéo de fond */}
                        <label className="block cursor-pointer">
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                updatePage({ backgroundVideo: URL.createObjectURL(file) })
                              }
                            }}
                          />
                          <div className="p-4 rounded-xl border-2 border-dashed border-midnight-600 hover:border-dream-500/50 hover:bg-dream-500/5 transition-all text-center">
                            <Sparkles className="w-8 h-8 mx-auto mb-2 text-midnight-400" />
                            <p className="text-sm text-midnight-300">
                              {currentPage.backgroundVideo ? 'Changer la vidéo' : 'Ajouter une vidéo'}
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Ambiance pour les lumières */}
                    <div>
                      <h3 className="text-sm text-midnight-400 uppercase tracking-wider mb-2">
                        Ambiance lumineuse
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(ambianceLightMap).slice(0, 6).map(([key, { color }]) => (
                          <button
                            key={key}
                            onClick={() => updatePage({ ambiance: key })}
                            className={cn(
                              'p-3 rounded-lg text-xs capitalize transition-all',
                              currentPage.ambiance === key
                                ? 'ring-2 ring-aurora-500'
                                : 'hover:bg-midnight-700/50'
                            )}
                            style={{ backgroundColor: `${color}30` }}
                          >
                            {key}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'audio' && (
                  <motion.div
                    key="audio"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <AudioPanel />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Book className="w-16 h-16 text-midnight-600 mb-4" />
              <p className="text-midnight-400 mb-4">
                Crée une page pour commencer
              </p>
              {currentBook && (
                <motion.button
                  onClick={() => createPage()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-aurora-500/20 text-aurora-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle page
                </motion.button>
              )}
            </div>
          )}
        </motion.aside>
      </div>

      {/* Modal nouveau livre */}
      <AnimatePresence>
        {showNewBookModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-midnight-950/90 backdrop-blur-md" />
            
            <motion.div
              className="relative glass rounded-3xl p-8 max-w-md mx-4 text-center"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-aurora-500/30 to-dream-500/30 flex items-center justify-center">
                <Book className="w-10 h-10 text-aurora-400" />
              </div>
              
              <h2 className="font-display text-2xl text-white mb-2">
                Créer un nouveau livre
              </h2>
              <p className="text-midnight-300 mb-6">
                Donne un titre à ton histoire magique ✨
              </p>

              <input
                type="text"
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                placeholder="Le titre de mon livre..."
                className="w-full px-4 py-3 rounded-xl bg-midnight-900/50 border border-white/10 focus:border-aurora-500/50 mb-4 text-center font-display text-lg"
                autoFocus
              />

              <motion.button
                onClick={handleCreateBook}
                disabled={!newBookTitle.trim()}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold',
                  newBookTitle.trim()
                    ? 'bg-gradient-to-r from-aurora-600 to-dream-600 text-white shadow-glow'
                    : 'bg-midnight-800/50 text-midnight-500 cursor-not-allowed'
                )}
                whileHover={newBookTitle.trim() ? { scale: 1.02 } : {}}
                whileTap={newBookTitle.trim() ? { scale: 0.98 } : {}}
              >
                <Sparkles className="w-5 h-5" />
                Commencer l'aventure !
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal import depuis Studio */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div 
              className="absolute inset-0 bg-midnight-950/80 backdrop-blur-sm"
              onClick={() => setShowImportModal(false)}
            />
            
            <motion.div
              className="relative glass rounded-2xl p-6 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h3 className="font-display text-xl text-white mb-4 flex items-center gap-2">
                <Import className="w-5 h-5 text-aurora-400" />
                Importer depuis le Studio
              </h3>

              <div className="grid grid-cols-3 gap-4">
                {importedAssets.map((asset) => (
                  <motion.button
                    key={asset.id}
                    onClick={() => handleImportAsset(asset)}
                    className="aspect-square rounded-xl overflow-hidden bg-midnight-800 hover:ring-2 hover:ring-aurora-500 transition-all"
                    whileHover={{ scale: 1.05 }}
                  >
                    {asset.type === 'image' && asset.url && (
                      <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                    )}
                    {asset.type === 'audio' && (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-8 h-8 text-dream-400" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>

              <button
                onClick={() => setShowImportModal(false)}
                className="mt-4 w-full p-2 rounded-xl bg-midnight-800/50 text-midnight-300"
              >
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
