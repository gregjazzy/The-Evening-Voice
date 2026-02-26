'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette,
  Image,
  Video,
  ArrowLeft,
  Sparkles,
  Eye,
  BookOpen,
} from 'lucide-react'
import { useStudioStore } from '@/store/useStudioStore'
import { useAppStore } from '@/store/useAppStore'
import {
  useStudioProgressStore,
  type CreationType,
} from '@/store/useStudioProgressStore'
import { PromptBuilder } from '@/components/studio/PromptBuilder'
import { StudioAIChat } from '@/components/studio/StudioAIChat'
import { TutorialGuide } from '@/components/studio/TutorialGuide'
import { cn, getThumbnailUrl } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n/context'
import { Highlightable } from '@/components/ui/Highlightable'

// Types de creation disponibles
const creationTypes: Array<{
  id: CreationType
  nameKey: string
  descriptionKey: string
  icon: typeof Image
  color: string
  tool: string
}> = [
  {
    id: 'image',
    nameKey: 'mode.imageTypeName',
    descriptionKey: 'mode.imageTypeDesc',
    icon: Image,
    color: 'from-aurora-500 to-aurora-700',
    tool: 'fal.ai',
  },
  {
    id: 'video',
    nameKey: 'mode.videoTypeName',
    descriptionKey: 'mode.videoTypeDesc',
    icon: Video,
    color: 'from-stardust-500 to-stardust-700',
    tool: 'fal.ai',
  },
]

type ViewType = 'select' | 'create' | 'gallery'

export function StudioMode() {
  const t = useTranslations('studio')

  const { currentStory } = useAppStore()

  const {
    currentKit,
    createNewKit,
    clearKit,
    importedAssets,
  } = useStudioStore()

  const {
    startCreation,
    resetCurrentCreation,
    currentCreationType,
  } = useStudioProgressStore()
  
  const [view, setView] = useState<ViewType>('select')
  const [selectedType, setSelectedType] = useState<CreationType | null>(null)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [tutorialType, setTutorialType] = useState<'midjourney' | 'runway'>('midjourney') // Only midjourney used now

  // Changer de vue quand un kit est créé ou supprimé
  useEffect(() => {
    if (currentKit && currentCreationType) {
      setView('create')
    } else if (!currentKit && !currentCreationType) {
      setView('select')
      setSelectedType(null)
    }
  }, [currentKit?.id, currentCreationType])

  const handleSelectType = (type: CreationType) => {
    if (!currentStory) return // Pas de création sans histoire
    setSelectedType(type)
    // Créer le kit dans l'ancien store (pour PromptBuilder)
    createNewKit(type)
    // Démarrer la progression
    startCreation(type)
    setView('create')
  }

  const handleBack = () => {
    if (view === 'create') {
      clearKit()
      resetCurrentCreation()
      setSelectedType(null)
    }
    setView('select')
  }

  const handleSuggestion = (suggestion: string) => {
    // Ne PAS écraser automatiquement le champ description
    // L'enfant doit écrire directement dans le champ de description
    // Le chat est pour discuter avec l'IA, pas pour remplir le formulaire
    // 
    // Ancienne logique (causait le bug de double écriture) :
    // if (currentKit) {
    //   useStudioStore.getState().updateKit({ subject: suggestion })
    // }
  }

  const openTutorial = (type: 'midjourney' | 'runway') => {
    setTutorialType(type)
    setTutorialOpen(true)
  }

  const handleCopyPrompt = () => {
    // Copier le prompt actuel dans le presse-papier
    if (currentKit?.finalPrompt) {
      navigator.clipboard.writeText(currentKit.finalPrompt)
    }
  }

  return (
    <div className="h-full flex flex-col pt-2">
      {/* En-tête - compact */}
      <motion.header 
        className="flex-shrink-0 flex items-center justify-between mb-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          {view !== 'select' && (
            <motion.button
              onClick={handleBack}
              className="p-1.5 rounded-lg bg-midnight-800/50 text-midnight-300 hover:text-white hover:bg-midnight-700/50 transition-colors"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
          )}
          
          <div>
            <h1 className="font-display text-xl text-aurora-300 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              {t('mode.title')}
            </h1>
            <p className="text-midnight-300 text-xs">
              {view === 'select' && t('mode.subtitleSelect')}
              {view === 'create' && selectedType && t('mode.subtitleCreate', { type: t(selectedType === 'video' ? 'mode.videoCreation' : 'mode.imageCreation') })}
              {view === 'gallery' && t('mode.subtitleGallery')}
            </p>
          </div>
        </div>

        {/* Indicateurs */}
        <div className="flex items-center gap-3">
          {/* Galerie */}
          {importedAssets.length > 0 && (
            <Highlightable id="studio-gallery">
              <motion.button
                onClick={() => setView('gallery')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-midnight-800/50 text-white hover:bg-midnight-700/50 transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                <Sparkles className="w-4 h-4 text-aurora-400" />
                {t('mode.creationCount', { count: String(importedAssets.length) })}
              </motion.button>
            </Highlightable>
          )}
        </div>
      </motion.header>

      {/* Contenu principal */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Vue de sélection */}
          {view === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto pb-8"
            >
              {/* Message si aucune histoire sélectionnée */}
              {!currentStory && (
                <motion.div
                  className="glass rounded-3xl p-8 mb-8 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <BookOpen className="w-12 h-12 text-midnight-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {t('mode.noStoryTitle')}
                  </h3>
                  <p className="text-sm text-midnight-300">
                    {t('mode.noStoryDescription')}
                  </p>
                </motion.div>
              )}

              {/* Progression globale */}
              <div className={cn('grid grid-cols-2 gap-6 mb-8', !currentStory && 'opacity-40 pointer-events-none')}>
                {creationTypes.map((type) => (
                  <Highlightable key={type.id} id={type.id === 'image' ? 'studio-type-image' : 'studio-type-video'} subtle>
                    <motion.button
                      onClick={() => handleSelectType(type.id)}
                      className="relative glass rounded-3xl p-8 text-left hover:border-aurora-500/30 transition-all group overflow-hidden w-full"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                    >
                      {/* Fond gradient au hover */}
                      <div
                        className={cn(
                          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity',
                          type.color
                        )}
                      />

                      <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                          'w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br',
                          type.color
                        )}>
                          <type.icon className="w-8 h-8 text-white" />
                        </div>
                      </div>

                      <h3 className="text-xl font-semibold text-white mb-1">
                        {t(type.nameKey)}
                      </h3>
                      <p className="text-sm text-midnight-300 mb-4">
                        {t('mode.withTool', { description: t(type.descriptionKey), tool: type.tool })}
                      </p>

                      {/* CTA et Tutoriel */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2 text-aurora-300 text-sm">
                          <Sparkles className="w-4 h-4" />
                          <span>{t('mode.startLearning')}</span>
                        </div>
                        <span
                          role="link"
                          onClick={(e) => {
                            e.stopPropagation()
                            openTutorial('midjourney')
                          }}
                          className="text-xs text-midnight-400 hover:text-aurora-300 transition-colors cursor-pointer"
                        >
                          {t('mode.howToUse', { tool: type.tool })}
                        </span>
                      </div>
                    </motion.button>
                  </Highlightable>
                ))}
              </div>


            </motion.div>
          )}

          {/* Vue de création pédagogique */}
          {view === 'create' && currentKit && selectedType && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex-1 min-h-0 flex gap-4 items-start overflow-hidden"
            >
              {/* Panneau gauche : IA Chat */}
              <Highlightable id="studio-chat">
                <div className="w-80 flex-shrink-0 h-full min-h-0 overflow-hidden">
                  <StudioAIChat
                    type={selectedType}
                    onSuggestion={handleSuggestion}
                    className="h-full max-h-full"
                  />
                </div>
              </Highlightable>

              {/* Panneau central : Formulaire de prompt - SCROLLABLE */}
              <div
                className="flex-1 min-w-0 overflow-y-auto px-2 pb-8"
                style={{ maxHeight: 'calc(100vh - 120px)' }}
              >
                <PromptBuilder />

              </div>
            </motion.div>
          )}

          {/* Vue galerie */}
          {view === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <div className="glass rounded-3xl p-8 h-full overflow-y-auto">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-aurora-400" />
                  {t('mode.gallery')}
                </h2>

                {importedAssets.length > 0 ? (
                  <div className="grid grid-cols-4 gap-4">
                    {importedAssets.map((asset) => (
                      <motion.div
                        key={asset.id}
                        className="aspect-square rounded-xl overflow-hidden bg-midnight-800 relative group"
                        whileHover={{ scale: 1.05 }}
                      >
                        {asset.type === 'image' && (
                          <img
                            src={getThumbnailUrl(asset.cloudUrl || asset.url, 200)}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement
                              if (!img.dataset.fallback) {
                                img.dataset.fallback = '1'
                                img.src = asset.cloudUrl || asset.url
                              }
                            }}
                          />
                        )}
                        {asset.type === 'video' && (
                          <video
                            src={asset.cloudUrl || asset.url}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => {
                              e.currentTarget.pause()
                              e.currentTarget.currentTime = 0
                            }}
                          />
                        )}
                        
                        {/* Overlay avec infos */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                          <p className="text-sm text-white font-medium truncate">
                            {asset.name}
                          </p>
                          <p className="text-xs text-midnight-300">
                            {asset.source}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Sparkles className="w-16 h-16 text-midnight-700 mb-4" />
                    <p className="text-midnight-400">
                      {t('mode.emptyGallery')}<br />
                      {t('mode.createFirst')}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal Tutoriel */}
      <TutorialGuide
        type={tutorialType}
        isOpen={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        onCopyPrompt={handleCopyPrompt}
      />
    </div>
  )
}
