'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Printer,
  Package,
  Palette,
  Eye,
  CheckCircle2,
  XCircle,
  X,
  Image as ImageIcon,
  FileText,
  Loader2,
  Download,
  ShoppingCart,
  ArrowLeft,
  Book,
  Ruler,
  DollarSign,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useStudioStore } from '@/store/useStudioStore'
import { useAuthStore } from '@/store/useAuthStore'
import {
  usePublishStore,
  BOOK_FORMATS,
  COVER_TYPES,
  PRINT_QUALITIES,
  type PublishStep,
  type BookFormat,
  type BookFormatConfig,
} from '@/store/usePublishStore'
import { exportToPDF } from '@/lib/export/pdf'
import { ModeIntroModal, useFirstVisit } from '@/components/ui/ModeIntroModal'
import { cn } from '@/lib/utils'

// ============================================================================
// COMPOSANT : Étapes de navigation
// ============================================================================

const STEPS: { id: PublishStep; label: string; icon: React.ReactNode }[] = [
  { id: 'select-story', label: 'Histoire', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'choose-format', label: 'Format', icon: <Ruler className="w-4 h-4" /> },
  { id: 'design-cover', label: 'Couverture', icon: <Palette className="w-4 h-4" /> },
  { id: 'preview', label: 'Aperçu', icon: <Eye className="w-4 h-4" /> },
  { id: 'quality-check', label: 'Qualité', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'order', label: 'Commander', icon: <ShoppingCart className="w-4 h-4" /> },
]

function StepIndicator({ currentStep }: { currentStep: PublishStep }) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep)
  
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep
        const isPast = index < currentIndex
        const isFuture = index > currentIndex
        
        return (
          <div key={step.id} className="flex items-center">
            <motion.div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-full transition-all',
                isActive && 'bg-aurora-600 text-white',
                isPast && 'bg-aurora-600/20 text-aurora-400',
                isFuture && 'bg-midnight-800/50 text-midnight-500'
              )}
              animate={isActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {isPast ? <Check className="w-4 h-4" /> : step.icon}
              <span className="text-sm font-medium hidden md:inline">{step.label}</span>
            </motion.div>
            
            {index < STEPS.length - 1 && (
              <div className={cn(
                'w-8 h-0.5 mx-1',
                index < currentIndex ? 'bg-aurora-600' : 'bg-midnight-700'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// ÉTAPE 1 : Sélection de l'histoire
// ============================================================================

function SelectStoryStep() {
  const { stories } = useAppStore()
  const { selectedStory, setSelectedStory, setCurrentStep } = usePublishStore()
  
  // Permettre les livres avec au moins 1 page (on peut toujours compléter plus tard)
  const completedStories = stories.filter(s => s.pages.length >= 1)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display text-white mb-2">
          📚 Quel livre veux-tu imprimer ?
        </h2>
        <p className="text-midnight-300">
          Choisis l'histoire que tu veux transformer en vrai livre
        </p>
      </div>
      
      {completedStories.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BookOpen className="w-16 h-16 text-midnight-500 mx-auto mb-4" />
          <h3 className="text-xl text-white mb-2">Pas encore d'histoire prête</h3>
          <p className="text-midnight-400 mb-4">
            Crée d'abord une histoire dans le mode Écriture
          </p>
          <button
            onClick={() => useAppStore.getState().setCurrentMode('book')}
            className="btn-primary"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Créer une histoire
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {completedStories.map((story) => (
            <motion.button
              key={story.id}
              onClick={() => setSelectedStory(story)}
              className={cn(
                'glass-card p-6 text-left transition-all hover:scale-[1.02]',
                selectedStory?.id === story.id && 'ring-2 ring-aurora-500 bg-aurora-500/10'
              )}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-20 rounded-lg bg-gradient-to-br from-aurora-600/20 to-dream-600/20 flex items-center justify-center flex-shrink-0">
                  <Book className="w-8 h-8 text-aurora-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-white truncate">
                    {story.title || 'Sans titre'}
                  </h3>
                  <p className="text-sm text-midnight-400 mt-1">
                    {story.pages.length} pages
                  </p>
                  <p className="text-xs text-midnight-500 mt-2">
                    Créé le {new Date(story.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                  {selectedStory?.id === story.id && (
                    <div className="flex items-center gap-1 mt-2 text-aurora-400 text-sm">
                      <Check className="w-4 h-4" />
                      Sélectionné
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
      
      {selectedStory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex justify-center"
        >
          <button
            onClick={() => setCurrentStep('choose-format')}
            className="btn-primary text-lg px-8 py-3"
          >
            Continuer
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

// ============================================================================
// ÉTAPE 2 : Choix du format
// ============================================================================

function ChooseFormatStep() {
  const { 
    selectedFormat, 
    setSelectedFormat, 
    coverType, 
    setCoverType,
    printQuality,
    setPrintQuality,
    setCurrentStep,
    selectedStory,
    estimatedPrice,
    calculatePrice,
  } = usePublishStore()
  
  useEffect(() => {
    calculatePrice()
  }, [selectedFormat, coverType, printQuality, calculatePrice])
  
  const currentFormat = BOOK_FORMATS.find(f => f.id === selectedFormat)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display text-white mb-2">
          📐 Choisis le format de ton livre
        </h2>
        <p className="text-midnight-300">
          Chaque format a ses avantages - le carré est parfait pour les livres d'enfants !
        </p>
        {/* Indicateur si le format a été défini lors de la création */}
        {selectedStory?.bookFormat && (
          <p className="text-sm text-aurora-400 mt-2 flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            Format choisi lors de la création : {BOOK_FORMATS.find(f => f.id === selectedStory.bookFormat)?.nameFr}
          </p>
        )}
      </div>
      
      {/* Formats de livre */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5 mb-8">
        {BOOK_FORMATS.map((format) => (
          <motion.button
            key={format.id}
            onClick={() => setSelectedFormat(format.id)}
            className={cn(
              'glass-card p-4 text-center transition-all relative',
              selectedFormat === format.id && 'ring-2 ring-aurora-500 bg-aurora-500/10'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {format.recommended && (
              <div className="absolute -top-2 -right-2 bg-aurora-500 text-white text-xs px-2 py-0.5 rounded-full">
                ⭐ Recommandé
              </div>
            )}
            <div className="text-3xl mb-2">{format.icon}</div>
            <h4 className="text-white font-medium">{format.nameFr}</h4>
            <p className="text-xs text-midnight-400 mt-1">
              {format.widthMm} × {format.heightMm} mm
            </p>
            <p className="text-xs text-aurora-400 mt-2">
              {format.priceEstimate}
            </p>
          </motion.button>
        ))}
      </div>
      
      {/* Options supplémentaires */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Type de couverture */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Book className="w-5 h-5 text-aurora-400" />
            Type de couverture
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {COVER_TYPES.map((cover) => (
              <button
                key={cover.type}
                onClick={() => setCoverType(cover.type)}
                className={cn(
                  'p-4 rounded-xl text-center transition-all',
                  coverType === cover.type 
                    ? 'bg-aurora-600 text-white' 
                    : 'bg-midnight-800/50 text-midnight-300 hover:bg-midnight-700/50'
                )}
              >
                <div className="text-2xl mb-1">{cover.icon}</div>
                <div className="text-sm font-medium">{cover.nameFr}</div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Qualité d'impression */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Printer className="w-5 h-5 text-aurora-400" />
            Qualité d'impression
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {PRINT_QUALITIES.map((quality) => (
              <button
                key={quality.id}
                onClick={() => setPrintQuality(quality.id)}
                className={cn(
                  'p-4 rounded-xl text-left transition-all',
                  printQuality === quality.id 
                    ? 'bg-aurora-600 text-white' 
                    : 'bg-midnight-800/50 text-midnight-300 hover:bg-midnight-700/50'
                )}
              >
                <div className="font-medium">{quality.nameFr}</div>
                <div className="text-xs mt-1 opacity-75">{quality.paper}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Résumé et prix */}
      {currentFormat && (
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-white">Récapitulatif</h3>
              <p className="text-midnight-400 text-sm mt-1">
                {currentFormat.nameFr} • {COVER_TYPES.find(c => c.type === coverType)?.nameFr} • {PRINT_QUALITIES.find(q => q.id === printQuality)?.nameFr}
              </p>
              <p className="text-midnight-500 text-xs mt-1">
                {selectedStory?.pages.length} pages
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-midnight-400">Prix estimé</div>
              <div className="text-3xl font-bold text-aurora-400">
                {estimatedPrice ? `${estimatedPrice.toFixed(2)}€` : '—'}
              </div>
              <div className="text-xs text-midnight-500">+ livraison</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('select-story')}
          className="btn-secondary"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </button>
        <button
          onClick={() => setCurrentStep('design-cover')}
          className="btn-primary"
        >
          Continuer
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// ÉTAPE 3 : Design de la couverture
// ============================================================================

function DesignCoverStep() {
  const { cover, updateCover, setCurrentStep, selectedStory } = usePublishStore()
  const { importedAssets } = useStudioStore()
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [imagePickerTarget, setImagePickerTarget] = useState<'front' | 'back'>('front')
  
  // Récupérer les pages de couverture de l'histoire si elles existent
  const frontCoverPage = selectedStory?.pages?.find(p => p.pageType === 'front-cover')
  const backCoverPage = selectedStory?.pages?.find(p => p.pageType === 'back-cover')
  
  // Utiliser les données des pages de couverture si disponibles
  const frontCoverImage = frontCoverPage?.backgroundMedia?.url || 
    frontCoverPage?.images?.[0]?.url || 
    cover.frontImage
  const backCoverImage = backCoverPage?.backgroundMedia?.url || 
    backCoverPage?.images?.[0]?.url || 
    cover.backImage
  const backCoverText = backCoverPage?.content || cover.backText
  
  // Récupérer toutes les images disponibles (Studio + pages de l'histoire)
  const availableImages = [
    // Images importées depuis le Studio (la vraie source !)
    ...importedAssets
      .filter(asset => asset.type === 'image')
      .map(asset => ({ url: asset.url, source: 'Studio' as const })),
    // Images sur les pages (nouveau format multi-images)
    ...(selectedStory?.pages || [])
      .flatMap(page => page.images || [])
      .map(img => ({ url: img.url, source: 'Histoire' as const })),
    // Images legacy (ancien format)
    ...(selectedStory?.pages || [])
      .filter(page => page.image)
      .map(page => ({ url: page.image!, source: 'Histoire' as const })),
    // Fonds de page (backgroundMedia)
    ...(selectedStory?.pages || [])
      .filter(page => page.backgroundMedia?.url && page.backgroundMedia.type === 'image')
      .map(page => ({ url: page.backgroundMedia!.url, source: 'Histoire' as const })),
  ].filter((img, index, self) => 
    // Dédupliquer par URL
    self.findIndex(i => i.url === img.url) === index
  )
  
  const handleSelectImage = (url: string) => {
    if (imagePickerTarget === 'front') {
      updateCover({ frontImage: url })
    } else {
      updateCover({ backImage: url })
    }
    setShowImagePicker(false)
  }
  
  const handleRemoveImage = (target: 'front' | 'back') => {
    if (target === 'front') {
      updateCover({ frontImage: undefined })
    } else {
      updateCover({ backImage: undefined })
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display text-white mb-2">
          🎨 Crée ta couverture
        </h2>
        <p className="text-midnight-300">
          C'est la première chose qu'on voit - rends-la magique !
        </p>
        {/* Indication si les couvertures existent dans l'histoire */}
        {(selectedStory?.pages?.some(p => p.pageType === 'front-cover') || 
          selectedStory?.pages?.some(p => p.pageType === 'back-cover')) && (
          <p className="text-sm text-aurora-400 mt-2 flex items-center justify-center gap-2">
            <span>✨</span>
            Tes couvertures sont créées dans le mode <strong>Écriture</strong> (boutons 📕 et 📖)
          </p>
        )}
      </div>
      
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Formulaire */}
        <div className="space-y-6">
          {/* Titre */}
          <div className="glass-card p-6">
            <label className="block text-sm font-medium text-midnight-300 mb-2">
              Titre du livre
            </label>
            <input
              type="text"
              value={cover.frontTitle}
              onChange={(e) => updateCover({ frontTitle: e.target.value })}
              placeholder={selectedStory?.title || 'Mon super livre'}
              className="w-full px-4 py-3 bg-midnight-800/50 border border-midnight-700 rounded-xl text-white placeholder-midnight-500 focus:outline-none focus:ring-2 focus:ring-aurora-500"
            />
          </div>
          
          {/* Sous-titre */}
          <div className="glass-card p-6">
            <label className="block text-sm font-medium text-midnight-300 mb-2">
              Sous-titre (optionnel)
            </label>
            <input
              type="text"
              value={cover.frontSubtitle || ''}
              onChange={(e) => updateCover({ frontSubtitle: e.target.value })}
              placeholder="Une aventure extraordinaire..."
              className="w-full px-4 py-3 bg-midnight-800/50 border border-midnight-700 rounded-xl text-white placeholder-midnight-500 focus:outline-none focus:ring-2 focus:ring-aurora-500"
            />
          </div>
          
          {/* Auteur */}
          <div className="glass-card p-6">
            <label className="block text-sm font-medium text-midnight-300 mb-2">
              Nom de l'auteur
            </label>
            <input
              type="text"
              value={cover.authorName}
              onChange={(e) => updateCover({ authorName: e.target.value })}
              placeholder="Ton nom ou pseudo"
              className="w-full px-4 py-3 bg-midnight-800/50 border border-midnight-700 rounded-xl text-white placeholder-midnight-500 focus:outline-none focus:ring-2 focus:ring-aurora-500"
            />
          </div>
          
          {/* Image de couverture */}
          <div className="glass-card p-6">
            <label className="block text-sm font-medium text-midnight-300 mb-2">
              Image de couverture (optionnel)
            </label>
            {cover.frontImage ? (
              <div className="relative">
                <img 
                  src={cover.frontImage} 
                  alt="Couverture" 
                  className="w-full h-40 object-cover rounded-xl"
                />
                <button
                  onClick={() => handleRemoveImage('front')}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setImagePickerTarget('front'); setShowImagePicker(true); }}
                  className="absolute bottom-2 right-2 px-3 py-1.5 bg-midnight-800/80 text-white text-xs rounded-lg hover:bg-midnight-700 transition-colors"
                >
                  Changer
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setImagePickerTarget('front'); setShowImagePicker(true); }}
                className="w-full h-32 border-2 border-dashed border-midnight-600 rounded-xl flex flex-col items-center justify-center gap-2 text-midnight-400 hover:text-aurora-400 hover:border-aurora-500/50 transition-all"
              >
                <ImageIcon className="w-8 h-8" />
                <span className="text-sm">Choisir une image</span>
              </button>
            )}
            {availableImages.length === 0 && (
              <p className="text-xs text-midnight-500 mt-2">
                💡 Génère des images dans le Studio pour les utiliser ici !
              </p>
            )}
          </div>
          
          {/* Couleur de fond */}
          <div className="glass-card p-6">
            <label className="block text-sm font-medium text-midnight-300 mb-2">
              Couleur de fond {cover.frontImage && '(visible derrière l\'image)'}
            </label>
            <div className="flex gap-3 flex-wrap">
              {[
                '#1a1a2e', '#2d132c', '#0f3460', '#1a472a', 
                '#3d0c02', '#4a235a', '#1b4332', '#0d1b2a'
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => updateCover({ 
                    frontBackgroundColor: color,
                    backBackgroundColor: color,
                    spineBackgroundColor: color,
                  })}
                  className={cn(
                    'w-10 h-10 rounded-lg transition-all',
                    cover.frontBackgroundColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-midnight-900'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          
          {/* Texte 4ème de couverture */}
          <div className="glass-card p-6">
            <label className="block text-sm font-medium text-midnight-300 mb-2">
              Résumé (4ème de couverture)
            </label>
            <textarea
              value={cover.backText || ''}
              onChange={(e) => updateCover({ backText: e.target.value })}
              placeholder="Un court résumé de ton histoire..."
              rows={4}
              className="w-full px-4 py-3 bg-midnight-800/50 border border-midnight-700 rounded-xl text-white placeholder-midnight-500 focus:outline-none focus:ring-2 focus:ring-aurora-500 resize-none"
            />
          </div>
        </div>
        
        {/* Prévisualisation */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-medium text-white mb-4">Aperçu</h3>
          
          <div className="flex gap-4 justify-center">
            {/* Première de couverture */}
            <div
              className="w-40 h-56 rounded-lg shadow-2xl flex flex-col items-center justify-center p-4 text-center relative overflow-hidden"
              style={{ backgroundColor: cover.frontBackgroundColor }}
            >
              {/* Image de couverture (depuis la page couverture ou le formulaire) */}
              {frontCoverImage && (
                <img 
                  src={frontCoverImage} 
                  alt="Couverture"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              {/* Overlay gradient */}
              <div className={cn(
                "absolute inset-0",
                frontCoverImage 
                  ? "bg-gradient-to-t from-black/70 via-black/20 to-black/30" 
                  : "bg-gradient-to-b from-white/5 to-transparent"
              )} />
              {/* Titre et auteur */}
              <div className="relative z-10 flex flex-col items-center justify-center flex-1">
                <h4 className="text-white font-display text-lg leading-tight drop-shadow-lg">
                  {cover.frontTitle || 'Mon livre'}
                </h4>
                {cover.frontSubtitle && (
                  <p className="text-white/80 text-xs mt-2 drop-shadow">
                    {cover.frontSubtitle}
                  </p>
                )}
              </div>
              <p className="text-white/70 text-xs relative z-10 drop-shadow mb-1">
                {cover.authorName || 'Auteur'}
              </p>
            </div>
            
            {/* Tranche */}
            <div
              className="w-4 h-56 rounded-sm"
              style={{ backgroundColor: cover.spineBackgroundColor }}
            />
            
            {/* 4ème de couverture */}
            <div
              className="w-40 h-56 rounded-lg shadow-2xl flex flex-col p-4 relative overflow-hidden"
              style={{ backgroundColor: cover.backBackgroundColor }}
            >
              {/* Image de fond (depuis la page 4ème couverture ou le formulaire) */}
              {backCoverImage && (
                <img 
                  src={backCoverImage} 
                  alt="Dos"
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
              <p className="text-white/80 text-xs leading-relaxed relative z-10 flex-1">
                {backCoverText || 'Résumé de l\'histoire...'}
              </p>
            </div>
          </div>
          
          <p className="text-center text-midnight-500 text-xs mt-4">
            Première de couverture • Dos • 4ème de couverture
          </p>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setCurrentStep('choose-format')}
          className="btn-secondary"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </button>
        <button
          onClick={() => setCurrentStep('preview')}
          className="btn-primary"
        >
          Continuer
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>
      
      {/* Modal sélection d'image */}
      <AnimatePresence>
        {showImagePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowImagePicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-display text-white">
                  🖼️ Choisir une image
                </h3>
                <button
                  onClick={() => setShowImagePicker(false)}
                  className="p-2 rounded-full hover:bg-midnight-700/50 text-midnight-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {availableImages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                  <ImageIcon className="w-16 h-16 text-midnight-600 mb-4" />
                  <p className="text-white mb-2">Aucune image disponible</p>
                  <p className="text-sm text-midnight-400 mb-4">
                    Génère des images dans le Studio ou ajoute-en à ton histoire
                  </p>
                  <button
                    onClick={() => {
                      setShowImagePicker(false)
                      useAppStore.getState().setCurrentMode('studio')
                    }}
                    className="btn-primary"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Aller au Studio
                  </button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-3">
                    {availableImages.map((img, index) => (
                      <motion.button
                        key={`${img.url}-${index}`}
                        onClick={() => handleSelectImage(img.url)}
                        className="relative aspect-square rounded-xl overflow-hidden group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <img
                          src={img.url}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Check className="w-8 h-8 text-white drop-shadow-lg" />
                          </div>
                        </div>
                        <span className="absolute bottom-1 right-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                          {img.source}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============================================================================
// ÉTAPE 4 : Aperçu - VRAIE PRÉVISUALISATION D'IMPRESSION
// ============================================================================

function PreviewStep() {
  const { selectedStory, selectedFormat, cover, setCurrentStep } = usePublishStore()
  const format = BOOK_FORMATS.find(f => f.id === selectedFormat)
  
  const [currentPage, setCurrentPage] = useState(0)
  const [showSafeZones, setShowSafeZones] = useState(true)
  const [viewMode, setViewMode] = useState<'spread' | 'single'>('spread')
  
  if (!selectedStory || !format) return null
  
  const pages = selectedStory.pages || []
  const totalSpreads = Math.ceil(pages.length / 2) + 1 // +1 pour la couverture
  
  // Calculer le ratio et les dimensions d'affichage
  const formatRatio = format.widthMm / format.heightMm
  const displayHeight = Math.min(400, window.innerHeight * 0.5)
  const displayWidth = displayHeight * formatRatio
  
  // Couleur de fond de page selon le bookColor de l'histoire
  const bookColor = selectedStory.bookColor || 'cream'
  const pageBackground = {
    cream: 'linear-gradient(135deg, #FFFEF5 0%, #FDF8E8 50%, #F5EFD5 100%)',
    white: 'linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 50%, #F5F5F5 100%)',
    aged: 'linear-gradient(135deg, #F5E6D3 0%, #E8D5BE 50%, #D4C4A8 100%)',
    parchment: 'linear-gradient(135deg, #F4E4BC 0%, #E8D4A0 50%, #D4C080 100%)',
  }[bookColor] || 'linear-gradient(135deg, #FFFEF5 0%, #FDF8E8 50%, #F5EFD5 100%)'
  
  // Rendu d'une page individuelle avec tous ses éléments
  const renderPage = (pageIndex: number, side: 'left' | 'right') => {
    const page = pages[pageIndex]
    if (!page) {
      return (
        <div className="flex-1 flex items-center justify-center text-amber-400/50 text-sm">
          {pageIndex >= pages.length ? 'Fin du livre' : 'Page vide'}
        </div>
      )
    }
    
    // Images de la page (format nouveau ou legacy)
    const pageImages = page.images || (page.image ? [{
      id: 'legacy',
      url: page.image,
      type: 'image',
      position: page.imagePosition || { x: 50, y: 50, width: 50, height: 50, rotation: 0 },
    }] : [])
    
    return (
      <div className="relative flex-1 overflow-hidden">
        {/* Fond de page (image ou couleur) */}
        {page.backgroundMedia && (
          <div className="absolute inset-0 z-0">
            {page.backgroundMedia.type === 'video' ? (
              <video
                src={page.backgroundMedia.url}
                className="w-full h-full object-cover"
                style={{ opacity: page.backgroundMedia.opacity || 1 }}
                muted
                loop
                autoPlay
              />
            ) : (
              <img
                src={page.backgroundMedia.url}
                alt=""
                className="w-full h-full object-cover"
                style={{ opacity: page.backgroundMedia.opacity || 1 }}
              />
            )}
          </div>
        )}
        
        {/* Zone de sécurité (overlay) */}
        {showSafeZones && (
          <div 
            className="absolute inset-0 pointer-events-none z-30"
            style={{
              border: `${format.safeZoneMm * 0.8}px dashed rgba(255, 0, 0, 0.3)`,
              margin: `${format.bleedMm * 0.8}px`,
            }}
          >
            <div className="absolute top-0 left-0 bg-red-500/20 text-red-500 text-[8px] px-1 rounded-br">
              Zone sécurité
            </div>
          </div>
        )}
        
        {/* Images flottantes */}
        {pageImages.map((img: any, idx: number) => (
          <div
            key={img.id || idx}
            className="absolute z-10"
            style={{
              left: `${img.position?.x || 50}%`,
              top: `${img.position?.y || 50}%`,
              width: `${img.position?.width || 40}%`,
              height: `${img.position?.height || 40}%`,
              transform: `translate(-50%, -50%) rotate(${img.position?.rotation || 0}deg)`,
            }}
          >
            <img
              src={img.url}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
        ))}
        
        {/* Contenu texte */}
        <div 
          className="relative z-20 h-full p-4 overflow-hidden"
          style={{
            padding: `${format.safeZoneMm * 0.8 + 10}px`,
            paddingLeft: side === 'left' ? `${format.spineMarginMm * 0.8 + 10}px` : `${format.safeZoneMm * 0.8 + 10}px`,
            paddingRight: side === 'right' ? `${format.spineMarginMm * 0.8 + 10}px` : `${format.safeZoneMm * 0.8 + 10}px`,
          }}
        >
          <div 
            className="text-sm text-amber-900 font-serif leading-relaxed"
            style={{
              fontFamily: page.style?.fontFamily || 'Georgia, serif',
              fontSize: `${(page.style?.fontSize || 14) * 0.7}px`,
              textAlign: page.style?.textAlign || 'left',
            }}
            dangerouslySetInnerHTML={{ __html: page.content || '' }}
          />
        </div>
      </div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto"
    >
      <div className="text-center mb-6">
        <h2 className="text-3xl font-display text-white mb-2">
          👀 Aperçu réel de ton livre
        </h2>
        <p className="text-midnight-300">
          Voici exactement à quoi ressemblera ton livre une fois imprimé
        </p>
      </div>
      
      {/* Contrôles */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => setShowSafeZones(!showSafeZones)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm transition-all',
            showSafeZones 
              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
              : 'bg-midnight-800/50 text-midnight-400'
          )}
        >
          📏 Zones de sécurité {showSafeZones ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={() => setViewMode(viewMode === 'spread' ? 'single' : 'spread')}
          className="px-3 py-1.5 rounded-lg text-sm bg-midnight-800/50 text-midnight-400"
        >
          {viewMode === 'spread' ? '📖 Double page' : '📄 Page simple'}
        </button>
      </div>
      
      {/* Prévisualisation du livre */}
      <div className="glass-card p-8 mb-6">
        <div className="flex items-center justify-center gap-1">
          {viewMode === 'spread' ? (
            <>
              {/* Page de gauche */}
              <div
                className="relative flex flex-col shadow-xl overflow-hidden"
                style={{
                  width: `${displayWidth}px`,
                  height: `${displayHeight}px`,
                  background: pageBackground,
                  borderRadius: '4px 0 0 4px',
                  boxShadow: 'inset -10px 0 20px -10px rgba(0,0,0,0.15)',
                }}
              >
                {currentPage === 0 ? (
                  // Page de titre (couverture intérieure)
                  <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <div>
                      <h3 className="text-2xl font-serif text-amber-900 mb-3">{cover.frontTitle || selectedStory.title}</h3>
                      {cover.frontSubtitle && (
                        <p className="text-sm text-amber-700 mb-4 italic">{cover.frontSubtitle}</p>
                      )}
                      <div className="w-16 h-0.5 bg-amber-400 mx-auto mb-4" />
                      <p className="text-xs text-amber-600">{cover.authorName}</p>
                    </div>
                  </div>
                ) : (
                  renderPage(currentPage * 2 - 1, 'left')
                )}
                <div className="text-center py-2 text-xs text-amber-500/70">
                  {currentPage === 0 ? '' : currentPage * 2}
                </div>
              </div>
              
              {/* Reliure centrale */}
              <div 
                className="w-2 self-stretch"
                style={{
                  background: 'linear-gradient(90deg, rgba(139,90,43,0.3) 0%, rgba(101,67,33,0.5) 50%, rgba(139,90,43,0.3) 100%)',
                  boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                }}
              />
              
              {/* Page de droite */}
              <div
                className="relative flex flex-col shadow-xl overflow-hidden"
                style={{
                  width: `${displayWidth}px`,
                  height: `${displayHeight}px`,
                  background: pageBackground,
                  borderRadius: '0 4px 4px 0',
                  boxShadow: 'inset 10px 0 20px -10px rgba(0,0,0,0.15)',
                }}
              >
                {renderPage(currentPage * 2, 'right')}
                <div className="text-center py-2 text-xs text-amber-500/70">
                  {currentPage * 2 + 1}
                </div>
              </div>
            </>
          ) : (
            // Mode page simple
            <div
              className="relative flex flex-col shadow-xl overflow-hidden"
              style={{
                width: `${displayWidth * 1.5}px`,
                height: `${displayHeight * 1.5}px`,
                background: pageBackground,
                borderRadius: '4px',
              }}
            >
              {renderPage(currentPage, currentPage % 2 === 0 ? 'right' : 'left')}
              <div className="text-center py-2 text-xs text-amber-500/70">
                Page {currentPage + 1}
              </div>
            </div>
          )}
        </div>
        
        {/* Navigation des pages */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="p-2 rounded-full bg-midnight-800/50 text-white disabled:opacity-30 hover:bg-midnight-700/50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {/* Indicateurs de pages */}
          <div className="flex items-center gap-1">
            {Array.from({ length: viewMode === 'spread' ? totalSpreads : pages.length }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  currentPage === i ? 'bg-aurora-500 w-4' : 'bg-midnight-600 hover:bg-midnight-500'
                )}
              />
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={viewMode === 'spread' ? currentPage >= totalSpreads - 1 : currentPage >= pages.length - 1}
            className="p-2 rounded-full bg-midnight-800/50 text-white disabled:opacity-30 hover:bg-midnight-700/50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-center text-midnight-400 text-sm mt-2">
          {viewMode === 'spread' 
            ? (currentPage === 0 ? 'Page de titre' : `Pages ${currentPage * 2} - ${currentPage * 2 + 1}`)
            : `Page ${currentPage + 1}`
          } / {pages.length} pages
        </div>
      </div>
      
      {/* Infos format */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center justify-center gap-6 text-sm text-midnight-400 flex-wrap">
          <span>📐 Format: {format.widthMm} × {format.heightMm} mm</span>
          <span>📄 {pages.length} pages</span>
          <span>📏 Marge sécurité: {format.safeZoneMm}mm</span>
          <span>✂️ Fond perdu: {format.bleedMm}mm</span>
          <span>📚 Marge reliure: {format.spineMarginMm}mm</span>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('design-cover')}
          className="btn-secondary"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </button>
        <button
          onClick={() => setCurrentStep('quality-check')}
          className="btn-primary"
        >
          Vérifier la qualité
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// ÉTAPE 5 : Vérification qualité
// ============================================================================

function QualityCheckStep() {
  const { 
    selectedStory, 
    selectedFormat,
    qualityChecks,
    imageQualityInfos,
    isCheckingQuality,
    runQualityCheck,
    setCurrentStep,
  } = usePublishStore()
  
  const format = BOOK_FORMATS.find(f => f.id === selectedFormat)
  const [isUpscaling, setIsUpscaling] = useState(false)
  const [upscaleProgress, setUpscaleProgress] = useState<Record<string, 'pending' | 'done' | 'error'>>({})
  
  useEffect(() => {
    if (selectedStory && format) {
      runQualityCheck(selectedStory, format)
    }
  }, [selectedStory, format, runQualityCheck])
  
  const hasErrors = qualityChecks.some(c => c.type === 'error')
  const hasWarnings = qualityChecks.some(c => c.type === 'warning')
  const lowDpiImages = imageQualityInfos.filter(img => !img.isOk)
  
  // Upscale toutes les images en basse résolution
  const handleUpscaleAll = async () => {
    if (lowDpiImages.length === 0) return
    
    setIsUpscaling(true)
    const progress: Record<string, 'pending' | 'done' | 'error'> = {}
    
    for (const img of lowDpiImages) {
      progress[img.imageId] = 'pending'
    }
    setUpscaleProgress(progress)
    
    for (const img of lowDpiImages) {
      try {
        const response = await fetch('/api/ai/upscale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: img.url,
            scale: 2,
          }),
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log(`✅ Image ${img.imageId} upscaled:`, data.url)
          setUpscaleProgress(prev => ({ ...prev, [img.imageId]: 'done' }))
          // Note: Ici il faudrait mettre à jour l'URL de l'image dans l'histoire
          // Pour l'instant on marque juste comme fait
        } else {
          setUpscaleProgress(prev => ({ ...prev, [img.imageId]: 'error' }))
        }
      } catch (error) {
        console.error(`Erreur upscale ${img.imageId}:`, error)
        setUpscaleProgress(prev => ({ ...prev, [img.imageId]: 'error' }))
      }
    }
    
    setIsUpscaling(false)
    
    // Re-vérifier la qualité après upscale
    if (selectedStory && format) {
      runQualityCheck(selectedStory, format)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display text-white mb-2">
          ✅ Vérification qualité
        </h2>
        <p className="text-midnight-300">
          On vérifie que tout est parfait pour l'impression
        </p>
      </div>
      
      <div className="glass-card p-6 mb-8">
        {isCheckingQuality ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-12 h-12 text-aurora-500 animate-spin mb-4" />
            <p className="text-white">Vérification en cours...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {qualityChecks.map((check) => (
              <motion.div
                key={check.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl',
                  check.type === 'success' && 'bg-green-500/10 border border-green-500/20',
                  check.type === 'warning' && 'bg-amber-500/10 border border-amber-500/20',
                  check.type === 'error' && 'bg-red-500/10 border border-red-500/20'
                )}
              >
                {check.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />}
                {check.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />}
                {check.type === 'error' && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                
                <div className="flex-1">
                  <p className={cn(
                    check.type === 'success' && 'text-green-300',
                    check.type === 'warning' && 'text-amber-300',
                    check.type === 'error' && 'text-red-300'
                  )}>
                    {check.message}
                  </p>
                  {check.page && (
                    <p className="text-xs text-midnight-500 mt-1">Page {check.page}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Images en basse résolution */}
      {!isCheckingQuality && lowDpiImages.length > 0 && (
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-amber-300 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Images en basse résolution
              </h3>
              <p className="text-sm text-midnight-400 mt-1">
                Ces images pourraient être floues à l'impression
              </p>
            </div>
            <button
              onClick={handleUpscaleAll}
              disabled={isUpscaling}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              {isUpscaling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Amélioration...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Améliorer tout
                </>
              )}
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {lowDpiImages.map((img) => (
              <div 
                key={img.imageId}
                className="relative rounded-lg overflow-hidden bg-midnight-800/50 aspect-square"
              >
                <img 
                  src={img.url} 
                  alt={`Page ${img.pageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-400">
                      {img.currentDpi ? `${img.currentDpi} DPI` : 'DPI inconnu'}
                    </span>
                    <span className="text-midnight-400">
                      Page {img.pageIndex + 1}
                    </span>
                  </div>
                  {img.widthPx && img.heightPx && (
                    <p className="text-[10px] text-midnight-500 mt-0.5">
                      {img.widthPx}×{img.heightPx}px
                    </p>
                  )}
                </div>
                
                {/* Indicateur d'upscale */}
                {upscaleProgress[img.imageId] && (
                  <div className={cn(
                    "absolute top-2 right-2 p-1 rounded-full",
                    upscaleProgress[img.imageId] === 'pending' && "bg-amber-500/80",
                    upscaleProgress[img.imageId] === 'done' && "bg-green-500/80",
                    upscaleProgress[img.imageId] === 'error' && "bg-red-500/80"
                  )}>
                    {upscaleProgress[img.imageId] === 'pending' && (
                      <Loader2 className="w-3 h-3 text-white animate-spin" />
                    )}
                    {upscaleProgress[img.imageId] === 'done' && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                    {upscaleProgress[img.imageId] === 'error' && (
                      <AlertCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <p className="text-xs text-midnight-500 mt-4 text-center">
            💡 L'amélioration utilise l'IA pour augmenter la résolution (300 DPI recommandé)
          </p>
        </div>
      )}
      
      {/* Résumé */}
      {!isCheckingQuality && (
        <div className={cn(
          'glass-card p-6 mb-8 text-center',
          !hasErrors && !hasWarnings && 'bg-green-500/5 border-green-500/20',
          hasWarnings && !hasErrors && 'bg-amber-500/5 border-amber-500/20',
          hasErrors && 'bg-red-500/5 border-red-500/20'
        )}>
          {!hasErrors && !hasWarnings && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl text-green-300 font-medium">Tout est parfait ! 🎉</h3>
              <p className="text-green-400/70 mt-2">Ton livre est prêt pour l'impression</p>
            </>
          )}
          {hasWarnings && !hasErrors && (
            <>
              <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl text-amber-300 font-medium">Quelques avertissements</h3>
              <p className="text-amber-400/70 mt-2">Tu peux continuer, mais vérifie les points ci-dessus</p>
            </>
          )}
          {hasErrors && (
            <>
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl text-red-300 font-medium">Des corrections sont nécessaires</h3>
              <p className="text-red-400/70 mt-2">Corrige les erreurs avant de continuer</p>
            </>
          )}
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('preview')}
          className="btn-secondary"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </button>
        <button
          onClick={() => setCurrentStep('order')}
          disabled={hasErrors}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {hasErrors ? 'Corriger les erreurs' : 'Commander'}
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// ÉTAPE 6 : Commande
// ============================================================================

function OrderStep() {
  const { 
    selectedStory,
    selectedFormat,
    coverType,
    printQuality,
    cover,
    estimatedPrice,
    isExporting,
    exportProgress,
    pdfUrl,
    isUploadingPdf,
    uploadPdfProgress,
    uploadPdfToSupabase,
    setCurrentStep,
    // Gelato
    gelatoQuote,
    isLoadingQuote,
    quoteError,
    fetchGelatoQuote,
    shippingAddress,
    updateShippingAddress,
    isOrdering,
    orderResult,
    orderError,
    placeGelatoOrder,
  } = usePublishStore()
  
  const { user } = useAuthStore()
  
  const format = BOOK_FORMATS.find(f => f.id === selectedFormat)
  const [showExportSuccess, setShowExportSuccess] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [localExportProgress, setLocalExportProgress] = useState(0)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  
  // Charger le devis Gelato au montage
  useEffect(() => {
    if (selectedStory && !gelatoQuote && !isLoadingQuote) {
      fetchGelatoQuote()
    }
  }, [selectedStory, gelatoQuote, isLoadingQuote, fetchGelatoQuote])
  
  // Générer ET uploader le PDF
  const handleExportPdf = async () => {
    if (!selectedStory || !format || !user) return
    
    setIsGeneratingPdf(true)
    setLocalExportProgress(0)
    
    try {
      // 1. Générer le PDF
      const result = await exportToPDF(selectedStory, format, cover, {
        onProgress: (progress) => {
          setLocalExportProgress(Math.round(progress * 0.5)) // 0-50%
        },
        includeBleed: true,
      })
      
      setPdfBlob(result.blob)
      setLocalExportProgress(50)
      
      // 2. Uploader vers Supabase pour Gelato
      const publicUrl = await uploadPdfToSupabase(result.blob, selectedStory, user.id)
      
      if (publicUrl) {
        setShowExportSuccess(true)
        setLocalExportProgress(100)
      }
      
    } catch (error) {
      console.error('Erreur génération/upload PDF:', error)
    } finally {
      setIsGeneratingPdf(false)
    }
  }
  
  // Télécharger le PDF localement
  const handleDownloadPdf = () => {
    if (!pdfBlob || !selectedStory) return
    
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedStory.title || 'mon-livre'}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }
  
  const handlePlaceOrder = async () => {
    const success = await placeGelatoOrder()
    if (success) {
      setShowAddressForm(false)
    }
  }
  
  // Calculer la progression totale (génération + upload)
  const totalProgress = isGeneratingPdf 
    ? localExportProgress 
    : isUploadingPdf 
      ? 50 + Math.round(uploadPdfProgress * 0.5)
      : showExportSuccess ? 100 : 0
  
  if (!format) return null
  
  // Si commande réussie
  if (orderResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center"
      >
        <div className="glass-card p-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <CheckCircle2 className="w-24 h-24 text-green-400 mx-auto mb-6" />
          </motion.div>
          
          <h2 className="text-3xl font-display text-white mb-4">
            🎉 Commande passée !
          </h2>
          
          <p className="text-midnight-300 mb-6">
            Ton livre est en cours de préparation. Tu recevras un email de confirmation.
          </p>
          
          <div className="bg-midnight-800/50 rounded-xl p-4 mb-6 text-left">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-midnight-400">N° de commande</span>
                <span className="text-white font-mono">{orderResult.referenceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-midnight-400">Statut</span>
                <span className="text-aurora-400">{orderResult.status}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              usePublishStore.getState().reset()
              useAppStore.getState().setCurrentMode('book')
            }}
            className="btn-primary"
          >
            Retour à l'écriture
          </button>
        </div>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display text-white mb-2">
          🎉 Prêt à imprimer !
        </h2>
        <p className="text-midnight-300">
          Dernière étape - choisis comment obtenir ton livre
        </p>
      </div>
      
      {/* Récapitulatif avec prix Gelato */}
      <div className="glass-card p-6 mb-8">
        <h3 className="text-lg font-medium text-white mb-4">Récapitulatif de ta commande</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-midnight-400">Livre</span>
            <span className="text-white">{selectedStory?.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-midnight-400">Format</span>
            <span className="text-white">{format.nameFr} ({format.widthMm}×{format.heightMm}mm)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-midnight-400">Pages</span>
            <span className="text-white">{selectedStory?.pages.length} pages</span>
          </div>
          <div className="flex justify-between">
            <span className="text-midnight-400">Couverture</span>
            <span className="text-white">{COVER_TYPES.find(c => c.type === coverType)?.nameFr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-midnight-400">Qualité</span>
            <span className="text-white">{PRINT_QUALITIES.find(q => q.id === printQuality)?.nameFr}</span>
          </div>
          
          {/* Prix Gelato */}
          <div className="border-t border-midnight-700 pt-3 mt-3">
            {isLoadingQuote ? (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-aurora-400" />
                <span className="text-midnight-400">Calcul du prix...</span>
              </div>
            ) : gelatoQuote ? (
              <>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-midnight-400">Impression</span>
                  <span className="text-white">{gelatoQuote.productPrice.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-midnight-400">Livraison ({gelatoQuote.fulfillmentCountry})</span>
                  <span className="text-white">{gelatoQuote.shippingPrice.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-lg border-t border-midnight-700 pt-2">
                  <span className="text-white font-medium">Total</span>
                  <span className="text-aurora-400 font-bold">{gelatoQuote.totalPrice.toFixed(2)}€</span>
                </div>
                <p className="text-xs text-midnight-500 mt-1">
                  🚚 Livraison estimée : {gelatoQuote.estimatedDelivery.min}-{gelatoQuote.estimatedDelivery.max} jours
                </p>
              </>
            ) : quoteError ? (
              <div className="text-center py-2">
                <p className="text-amber-400 text-sm mb-2">{quoteError}</p>
                <button
                  onClick={() => fetchGelatoQuote()}
                  className="text-xs text-aurora-400 hover:underline"
                >
                  Réessayer
                </button>
              </div>
            ) : (
              <div className="flex justify-between text-lg">
                <span className="text-white font-medium">Prix estimé</span>
                <span className="text-aurora-400 font-bold">{estimatedPrice?.toFixed(2)}€</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Options */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {/* Export PDF */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-aurora-500/20 flex items-center justify-center">
              <Download className="w-6 h-6 text-aurora-400" />
            </div>
            <div>
              <h4 className="text-white font-medium">Préparer le PDF</h4>
              <p className="text-xs text-midnight-400">Génération + Upload pour impression</p>
            </div>
          </div>
          
          {(isGeneratingPdf || isUploadingPdf) ? (
            <div className="space-y-3">
              <div className="h-2 bg-midnight-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-aurora-600 to-dream-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={cn(
                  "text-midnight-400",
                  totalProgress < 50 && "text-aurora-400 font-medium"
                )}>
                  {totalProgress < 50 ? '📄 Génération PDF...' : '☁️ Upload vers le cloud...'}
                </span>
                <span className="text-midnight-400">{totalProgress}%</span>
              </div>
            </div>
          ) : showExportSuccess ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span>PDF prêt pour l'impression !</span>
              </div>
              {pdfBlob && (
                <button
                  onClick={handleDownloadPdf}
                  className="w-full py-2 px-4 bg-midnight-800/50 hover:bg-midnight-700/50 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Télécharger une copie
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleExportPdf}
              disabled={!user}
              className="w-full py-3 px-4 bg-aurora-600 hover:bg-aurora-500 text-white rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              Préparer le PDF
            </button>
          )}
          
          {!user && (
            <p className="text-xs text-amber-400/70 text-center mt-2">
              ⚠️ Connexion requise pour préparer le PDF
            </p>
          )}
        </div>
        
        {/* Commander impression Gelato */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-dream-500/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-dream-400" />
            </div>
            <div>
              <h4 className="text-white font-medium">Commander l'impression</h4>
              <p className="text-xs text-midnight-400">Livre livré chez toi via Gelato</p>
            </div>
          </div>
          
          {!showExportSuccess ? (
            <div className="text-center py-3">
              <p className="text-midnight-400 text-sm mb-2">
                👈 Prépare d'abord le PDF
              </p>
              <p className="text-xs text-midnight-500">
                Le PDF doit être généré avant de commander
              </p>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowAddressForm(true)}
                disabled={!gelatoQuote || isLoadingQuote || !pdfUrl}
                className="w-full py-3 px-4 bg-dream-600 hover:bg-dream-500 text-white rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" />
                Commander {gelatoQuote ? `(${gelatoQuote.totalPrice.toFixed(2)}€)` : ''}
              </button>
              
              <p className="text-xs text-midnight-500 text-center mt-2">
                🖨️ Imprimé et livré par Gelato
              </p>
            </>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('quality-check')}
          className="btn-secondary"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </button>
        <button
          onClick={() => useAppStore.getState().setCurrentMode('book')}
          className="btn-secondary"
        >
          Retour à l'écriture
        </button>
      </div>
      
      {/* Modal formulaire adresse */}
      <AnimatePresence>
        {showAddressForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddressForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display text-white">
                  📦 Adresse de livraison
                </h3>
                <button
                  onClick={() => setShowAddressForm(false)}
                  className="p-2 rounded-full hover:bg-midnight-700/50 text-midnight-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Prénom / Nom */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-midnight-400 mb-1">Prénom *</label>
                    <input
                      type="text"
                      value={shippingAddress.firstName}
                      onChange={(e) => updateShippingAddress({ firstName: e.target.value })}
                      className="w-full px-3 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-midnight-400 mb-1">Nom *</label>
                    <input
                      type="text"
                      value={shippingAddress.lastName}
                      onChange={(e) => updateShippingAddress({ lastName: e.target.value })}
                      className="w-full px-3 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
                    />
                  </div>
                </div>
                
                {/* Adresse */}
                <div>
                  <label className="block text-xs text-midnight-400 mb-1">Adresse *</label>
                  <input
                    type="text"
                    value={shippingAddress.addressLine1}
                    onChange={(e) => updateShippingAddress({ addressLine1: e.target.value })}
                    placeholder="Numéro et rue"
                    className="w-full px-3 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-midnight-400 mb-1">Complément</label>
                  <input
                    type="text"
                    value={shippingAddress.addressLine2 || ''}
                    onChange={(e) => updateShippingAddress({ addressLine2: e.target.value })}
                    placeholder="Appartement, étage..."
                    className="w-full px-3 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
                  />
                </div>
                
                {/* Ville / Code postal */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-midnight-400 mb-1">Code postal *</label>
                    <input
                      type="text"
                      value={shippingAddress.postCode}
                      onChange={(e) => updateShippingAddress({ postCode: e.target.value })}
                      className="w-full px-3 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-midnight-400 mb-1">Ville *</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => updateShippingAddress({ city: e.target.value })}
                      className="w-full px-3 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
                    />
                  </div>
                </div>
                
                {/* Pays */}
                <div>
                  <label className="block text-xs text-midnight-400 mb-1">Pays *</label>
                  <select
                    value={shippingAddress.country}
                    onChange={(e) => {
                      updateShippingAddress({ country: e.target.value })
                      // Recharger le devis avec le nouveau pays
                      setTimeout(() => fetchGelatoQuote(), 100)
                    }}
                    className="w-full px-3 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
                  >
                    <option value="FR">🇫🇷 France</option>
                    <option value="BE">🇧🇪 Belgique</option>
                    <option value="CH">🇨🇭 Suisse</option>
                    <option value="CA">🇨🇦 Canada</option>
                    <option value="DE">🇩🇪 Allemagne</option>
                    <option value="ES">🇪🇸 Espagne</option>
                    <option value="IT">🇮🇹 Italie</option>
                    <option value="GB">🇬🇧 Royaume-Uni</option>
                    <option value="US">🇺🇸 États-Unis</option>
                  </select>
                </div>
                
                {/* Email / Téléphone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-midnight-400 mb-1">Email *</label>
                    <input
                      type="email"
                      value={shippingAddress.email}
                      onChange={(e) => updateShippingAddress({ email: e.target.value })}
                      className="w-full px-3 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-midnight-400 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={shippingAddress.phone || ''}
                      onChange={(e) => updateShippingAddress({ phone: e.target.value })}
                      className="w-full px-3 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
                    />
                  </div>
                </div>
                
                {/* Erreur */}
                {orderError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{orderError}</p>
                  </div>
                )}
                
                {/* Prix total */}
                {gelatoQuote && (
                  <div className="p-4 bg-aurora-500/10 border border-aurora-500/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">Total à payer</span>
                      <span className="text-2xl font-bold text-aurora-400">
                        {gelatoQuote.totalPrice.toFixed(2)}€
                      </span>
                    </div>
                    <p className="text-xs text-aurora-400/70 mt-1">
                      Livraison en {gelatoQuote.estimatedDelivery.min}-{gelatoQuote.estimatedDelivery.max} jours
                    </p>
                  </div>
                )}
                
                {/* Bouton commander */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={isOrdering || !gelatoQuote}
                  className="w-full py-3 px-4 bg-dream-600 hover:bg-dream-500 text-white rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isOrdering ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Commande en cours...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Confirmer la commande
                    </>
                  )}
                </button>
                
                <p className="text-xs text-midnight-500 text-center">
                  🔒 Paiement sécurisé • Livraison par Gelato
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function PublishMode() {
  const { currentStep, reset } = usePublishStore()
  
  // Modale d'introduction (première visite)
  const { isFirstVisit, markAsSeen } = useFirstVisit('publish')
  
  // Reset au montage
  useEffect(() => {
    return () => {
      // Ne pas reset si on navigue juste entre les étapes
    }
  }, [])
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                reset()
                useAppStore.getState().setCurrentMode('book')
              }}
              className="p-2 rounded-full hover:bg-midnight-800/50 text-midnight-400 hover:text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-display text-white flex items-center gap-2">
              <Printer className="w-6 h-6 text-aurora-400" />
              Publier mon livre
            </h1>
          </div>
        </div>
        
        <StepIndicator currentStep={currentStep} />
      </div>
      
      {/* Contenu */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {currentStep === 'select-story' && <SelectStoryStep key="select" />}
          {currentStep === 'choose-format' && <ChooseFormatStep key="format" />}
          {currentStep === 'design-cover' && <DesignCoverStep key="cover" />}
          {currentStep === 'preview' && <PreviewStep key="preview" />}
          {currentStep === 'quality-check' && <QualityCheckStep key="quality" />}
          {currentStep === 'order' && <OrderStep key="order" />}
        </AnimatePresence>
      </div>
      
      {/* Modale d'introduction - première visite */}
      <ModeIntroModal
        mode="publish"
        isOpen={isFirstVisit}
        onClose={markAsSeen}
      />
    </div>
  )
}
