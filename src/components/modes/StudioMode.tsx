'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Palette, 
  Image, 
  Video, 
  ArrowLeft,
  Sparkles,
  Trophy,
  Eye,
  BookOpen,
} from 'lucide-react'
import { useStudioStore } from '@/store/useStudioStore'
import { 
  useStudioProgressStore,
  LEVEL_NAMES,
  LEVEL_EMOJIS,
  type CreationType,
} from '@/store/useStudioProgressStore'
import { PromptBuilder } from '@/components/studio/PromptBuilder'
import { SafariBridge } from '@/components/studio/SafariBridge'
import { AssetDropzone } from '@/components/studio/AssetDropzone'
import { StudioGuide, StudioLevelBadge } from '@/components/studio/StudioGuide'
import { StudioAIChat } from '@/components/studio/StudioAIChat'
import { TutorialGuide, TutorialButton } from '@/components/studio/TutorialGuide'
import { ModeIntroModal, useFirstVisit } from '@/components/ui/ModeIntroModal'
import { cn } from '@/lib/utils'

// Types de création disponibles (sans Voix - intégré directement)
const creationTypes: Array<{
  id: CreationType
  name: string
  description: string
  icon: typeof Image
  color: string
  tool: string
}> = [
  {
    id: 'image',
    name: 'Images',
    description: 'Crée des illustrations magiques',
    icon: Image,
    color: 'from-aurora-500 to-aurora-700',
    tool: 'fal.ai',
  },
  {
    id: 'video',
    name: 'Vidéos',
    description: 'Anime tes scènes',
    icon: Video,
    color: 'from-stardust-500 to-stardust-700',
    tool: 'fal.ai',
  },
]

type ViewType = 'select' | 'create' | 'gallery'

export function StudioMode() {
  // Modale d'introduction (première visite)
  const { isFirstVisit, markAsSeen } = useFirstVisit('studio')
  
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
    getLevel,
    getLevelName,
    getLevelEmoji,
    getProgress,
    badges,
    imageTotalCreations,
    videoTotalCreations,
  } = useStudioProgressStore()
  
  const [view, setView] = useState<ViewType>('select')
  const [selectedType, setSelectedType] = useState<CreationType | null>(null)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [tutorialType, setTutorialType] = useState<'midjourney' | 'runway'>('midjourney')

  // Changer de vue quand un kit est créé
  useEffect(() => {
    if (currentKit && currentCreationType) {
      setView('create')
    }
  }, [currentKit?.id, currentCreationType])

  const handleSelectType = (type: CreationType) => {
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

  const handleHelpRequest = () => {
    // L'aide est gérée par le store de progression
    useStudioProgressStore.getState().requestHelp()
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
              Mon Studio de Création
            </h1>
            <p className="text-midnight-300 text-xs">
              {view === 'select' && 'Apprends à créer des images et des vidéos avec l\'IA !'}
              {view === 'create' && selectedType && `Création ${selectedType === 'image' ? "d'image" : 'de vidéo'}`}
              {view === 'gallery' && 'Tes créations'}
            </p>
          </div>
        </div>

        {/* Indicateurs */}
        <div className="flex items-center gap-3">
          {/* Badge niveau si en création */}
          {view === 'create' && selectedType && (
            <StudioLevelBadge type={selectedType} />
          )}
          
          {/* Badges obtenus */}
          {badges.length > 0 && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-dream-500/20 text-dream-300 text-sm">
              <Trophy className="w-4 h-4" />
              {badges.length} badge{badges.length > 1 ? 's' : ''}
            </div>
          )}
          
          {/* Galerie */}
          {importedAssets.length > 0 && (
            <motion.button
              onClick={() => setView('gallery')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-midnight-800/50 text-white hover:bg-midnight-700/50 transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              <Sparkles className="w-4 h-4 text-aurora-400" />
              {importedAssets.length} créations
            </motion.button>
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
              {/* Progression globale */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {creationTypes.map((type) => {
                  const level = getLevel(type.id)
                  const levelName = getLevelName(type.id)
                  const levelEmoji = getLevelEmoji(type.id)
                  const progress = getProgress(type.id)
                  const totalCreations = type.id === 'image' ? imageTotalCreations : videoTotalCreations

                  return (
                    <motion.button
                      key={type.id}
                      onClick={() => handleSelectType(type.id)}
                      className="relative glass rounded-3xl p-8 text-left hover:border-aurora-500/30 transition-all group overflow-hidden"
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
                        
                        {/* Badge niveau */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-midnight-800/50">
                          <span className="text-lg">{levelEmoji}</span>
                          <span className="text-sm text-white">Niv. {level}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {type.name}
                      </h3>
                      <p className="text-sm text-midnight-300 mb-4">
                        {type.description} avec {type.tool}
                      </p>

                      {/* Barre de progression */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-midnight-400 mb-1">
                          <span>{levelName}</span>
                          <span>{totalCreations} création{totalCreations > 1 ? 's' : ''}</span>
                        </div>
                        <div className="h-2 bg-midnight-800 rounded-full overflow-hidden">
                          <motion.div
                            className={cn('h-full rounded-full bg-gradient-to-r', type.color)}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                          />
                        </div>
                      </div>

                      {/* CTA et Tutoriel */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2 text-aurora-300 text-sm">
                          <BookOpen className="w-4 h-4" />
                          <span>Commencer à apprendre</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openTutorial(type.id === 'image' ? 'midjourney' : 'runway')
                          }}
                          className="text-xs text-midnight-400 hover:text-aurora-300 transition-colors"
                        >
                          Comment utiliser {type.tool} ?
                        </button>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Zone d'import rapide */}
              <motion.div
                className="glass rounded-3xl p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <AssetDropzone />
              </motion.div>

              {/* Badges obtenus */}
              {badges.length > 0 && (
                <motion.div
                  className="mt-6 glass rounded-2xl p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-dream-400" />
                    Mes Badges
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dream-500/20 text-dream-300"
                        title={badge.description}
                      >
                        <span className="text-xl">{badge.emoji}</span>
                        <span className="text-sm font-medium">{badge.name}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
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
              <div className="w-80 flex-shrink-0 h-full min-h-0 overflow-hidden">
                <StudioAIChat 
                  type={selectedType} 
                  onSuggestion={handleSuggestion}
                  className="h-full max-h-full"
                />
              </div>

              {/* Panneau central : Formulaire de prompt - SCROLLABLE */}
              <div 
                className="flex-1 min-w-0 overflow-y-auto px-2 pb-8"
                style={{ maxHeight: 'calc(100vh - 120px)' }}
              >
                <PromptBuilder />

                {/* Zone d'import - seulement pour vidéos ou images niveau 3+ */}
                {/* Images niveau 1-2 : pas besoin, l'image est générée directement */}
                {/* Vidéos : juste la zone de drop (la galerie est déjà dans "Choisis une image à animer") */}
                {(selectedType === 'video' || getLevel(selectedType) >= 3) && (
                  <div className="mt-4 glass rounded-2xl p-4 mb-4">
                    <AssetDropzone 
                      showGallery={selectedType !== 'video'} 
                    />
                  </div>
                )}
              </div>

              {/* Panneau droit : Guide */}
              <div className="flex-shrink-0 h-full min-h-0 overflow-y-auto flex flex-col gap-2">
                <StudioGuide 
                  type={selectedType} 
                  onHelpRequest={handleHelpRequest}
                />
                
                {/* Bouton tutoriel */}
                <motion.button
                  onClick={() => openTutorial(selectedType === 'image' ? 'midjourney' : 'runway')}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-midnight-800/50 hover:bg-midnight-700/50 text-midnight-300 hover:text-white transition-colors text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <BookOpen className="w-4 h-4" />
                  Comment utiliser fal.ai ?
                </motion.button>
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
                  Ma Galerie de Créations
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
                            src={asset.url}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {asset.type === 'video' && (
                          <video
                            src={asset.url}
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
                      Ta galerie est vide pour l'instant.<br />
                      Crée ta première image ou vidéo !
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
      
      {/* Modale d'introduction - première visite */}
      <ModeIntroModal
        mode="studio"
        isOpen={isFirstVisit}
        onClose={markAsSeen}
      />
    </div>
  )
}
