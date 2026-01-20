'use client'

/**
 * TutorialGuide - Tutoriels visuels pour fal.ai
 * 
 * Affiche des guides étape par étape avec :
 * - Images/GIFs de démonstration
 * - Textes explicatifs adaptés aux enfants
 * - Navigation entre les étapes
 * 
 * SCREENSHOTS À CAPTURER :
 * 
 * 📸 FAL.AI IMAGES - Flux Pro (5 images) :
 * 1. falai-image-01-home.png - Page d'accueil fal.ai Flux playground
 * 2. falai-image-02-prompt.png - Zone de texte pour le prompt
 * 3. falai-image-03-run.png - Bouton "Run" mis en évidence
 * 4. falai-image-04-loading.png - Écran de chargement
 * 5. falai-image-05-result.png - Image générée avec bouton download
 * 
 * 📸 FAL.AI VIDEOS - Kling (5 images) :
 * 1. falai-video-01-home.png - Page d'accueil fal.ai Kling playground
 * 2. falai-video-02-prompt.png - Zone de texte pour le prompt
 * 3. falai-video-03-run.png - Bouton "Run" mis en évidence  
 * 4. falai-video-04-loading.png - Écran de chargement
 * 5. falai-video-05-result.png - Vidéo générée avec bouton download
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Image as ImageIcon,
  Video,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface TutorialStep {
  id: string
  title: string
  description: string
  tip?: string            // Conseil pour l'enfant
  imageUrl: string        // URL de l'image/GIF
  imagePlaceholder: string // Description du screenshot à capturer
}

interface Tutorial {
  id: 'image' | 'video'
  name: string
  emoji: string
  color: string
  url: string
  steps: TutorialStep[]
}

// ============================================================================
// DONNÉES DES TUTORIELS
// ============================================================================

const TUTORIALS: Tutorial[] = [
  {
    id: 'image',
    name: 'fal.ai Images',
    emoji: '🎨',
    color: 'from-aurora-500 to-aurora-700',
    url: 'https://fal.ai/models/fal-ai/flux-pro/v1.1/playground',
    steps: [
      {
        id: 'img-1',
        title: 'Ouvre fal.ai',
        description: 'Clique sur le lien pour ouvrir la page fal.ai. C\'est là que tu vas créer tes images !',
        tip: '💡 fal.ai est un site magique qui transforme tes idées en images.',
        imageUrl: '/tutorials/falai-image-01-home.png',
        imagePlaceholder: 'Screenshot de la page fal.ai Flux Pro playground',
      },
      {
        id: 'img-2',
        title: 'Trouve la zone de texte',
        description: 'Tu vas voir un grand rectangle où tu peux écrire. C\'est là que tu colles ton prompt !',
        tip: '💡 Le prompt, c\'est la description magique de ton image.',
        imageUrl: '/tutorials/falai-image-02-prompt.png',
        imagePlaceholder: 'Screenshot de la zone de prompt sur fal.ai',
      },
      {
        id: 'img-3',
        title: 'Colle ton prompt',
        description: 'Appuie sur Cmd+V (ou Ctrl+V sur PC) pour coller le texte magique que ton amie IA t\'a aidé à créer.',
        tip: '💡 Le texte vient du bouton "Copier" que tu as cliqué avant !',
        imageUrl: '/tutorials/falai-image-03-paste.png',
        imagePlaceholder: 'Screenshot du prompt collé dans la zone de texte',
      },
      {
        id: 'img-4',
        title: 'Clique sur Run !',
        description: 'Trouve le bouton "Run" (souvent en bleu ou violet) et clique dessus. La magie commence !',
        tip: '💡 Ça peut prendre quelques secondes, sois patient(e) !',
        imageUrl: '/tutorials/falai-image-04-run.png',
        imagePlaceholder: 'Screenshot avec le bouton Run mis en évidence',
      },
      {
        id: 'img-5',
        title: 'Télécharge ton image !',
        description: 'Ton image apparaît ! Clique dessus avec le bouton droit, puis "Enregistrer l\'image sous..." pour la télécharger.',
        tip: '💡 Ensuite, glisse ton image dans La Voix du Soir pour l\'ajouter à ta galerie !',
        imageUrl: '/tutorials/falai-image-05-result.png',
        imagePlaceholder: 'Screenshot de l\'image générée avec menu contextuel',
      },
    ],
  },
  {
    id: 'video',
    name: 'fal.ai Vidéos',
    emoji: '🎬',
    color: 'from-stardust-500 to-stardust-700',
    url: 'https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/text-to-video/playground',
    steps: [
      {
        id: 'vid-1',
        title: 'Ouvre fal.ai',
        description: 'Clique sur le lien pour ouvrir la page fal.ai Vidéos. C\'est parti pour créer des vidéos magiques !',
        tip: '💡 Kling est le moteur qui anime tes idées en vidéo.',
        imageUrl: '/tutorials/falai-video-01-home.png',
        imagePlaceholder: 'Screenshot de la page fal.ai Kling playground',
      },
      {
        id: 'vid-2',
        title: 'Trouve la zone de texte',
        description: 'Cherche le grand rectangle pour écrire. C\'est ici que tu décris ta vidéo !',
        tip: '💡 Pour une vidéo, décris ce qui BOUGE : "un chat qui saute", "des étoiles qui brillent"...',
        imageUrl: '/tutorials/falai-video-02-prompt.png',
        imagePlaceholder: 'Screenshot de la zone de prompt vidéo sur fal.ai',
      },
      {
        id: 'vid-3',
        title: 'Colle ton prompt',
        description: 'Appuie sur Cmd+V (ou Ctrl+V sur PC) pour coller ton texte magique.',
        tip: '💡 Ton prompt décrit le mouvement et l\'ambiance de ta vidéo.',
        imageUrl: '/tutorials/falai-video-03-paste.png',
        imagePlaceholder: 'Screenshot du prompt vidéo collé',
      },
      {
        id: 'vid-4',
        title: 'Clique sur Run !',
        description: 'Trouve le bouton "Run" et clique dessus. La création d\'une vidéo prend un peu plus de temps !',
        tip: '💡 Une vidéo peut mettre 1-2 minutes à se créer. C\'est normal !',
        imageUrl: '/tutorials/falai-video-04-run.png',
        imagePlaceholder: 'Screenshot avec le bouton Run mis en évidence',
      },
      {
        id: 'vid-5',
        title: 'Télécharge ta vidéo !',
        description: 'Ta vidéo est prête ! Clique sur le bouton de téléchargement (souvent une flèche vers le bas).',
        tip: '💡 Glisse ta vidéo dans La Voix du Soir pour l\'ajouter à ta collection !',
        imageUrl: '/tutorials/falai-video-05-result.png',
        imagePlaceholder: 'Screenshot de la vidéo générée avec bouton download',
      },
    ],
  },
]

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

// Pour compatibilité avec l'ancien code qui utilise 'midjourney' | 'runway'
type TutorialType = 'midjourney' | 'runway' | 'image' | 'video'

interface TutorialGuideProps {
  type: TutorialType
  isOpen: boolean
  onClose: () => void
  onCopyPrompt?: () => void
}

export function TutorialGuide({ type, isOpen, onClose, onCopyPrompt }: TutorialGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [copied, setCopied] = useState(false)
  
  // Mapper les anciens types vers les nouveaux
  const mappedType = type === 'midjourney' ? 'image' : type === 'runway' ? 'video' : type
  
  const tutorial = TUTORIALS.find(t => t.id === mappedType)
  if (!tutorial) return null
  
  const step = tutorial.steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === tutorial.steps.length - 1
  
  const handlePrev = () => {
    if (!isFirstStep) setCurrentStep(prev => prev - 1)
  }
  
  const handleNext = () => {
    if (!isLastStep) setCurrentStep(prev => prev + 1)
  }
  
  const handleCopyAndOpen = () => {
    onCopyPrompt?.()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    
    // Ouvrir le site après un délai
    setTimeout(() => {
      window.open(tutorial.url, '_blank')
    }, 500)
  }
  
  if (!isOpen) return null
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className={cn(
            'p-4 flex items-center justify-between',
            'bg-gradient-to-r',
            tutorial.color
          )}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{tutorial.emoji}</span>
              <div>
                <h2 className="text-xl font-display text-white">
                  Comment utiliser {tutorial.name}
                </h2>
                <p className="text-sm text-white/70">
                  Étape {currentStep + 1} sur {tutorial.steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Barre de progression */}
          <div className="h-1 bg-midnight-800">
            <motion.div
              className={cn('h-full bg-gradient-to-r', tutorial.color)}
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / tutorial.steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {/* Contenu de l'étape */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Image/Screenshot */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-midnight-800 mb-6">
                  {/* Placeholder si pas d'image */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-midnight-700 flex items-center justify-center mb-4">
                      {mappedType === 'image' ? (
                        <ImageIcon className="w-8 h-8 text-aurora-400" />
                      ) : (
                        <Video className="w-8 h-8 text-stardust-400" />
                      )}
                    </div>
                    <p className="text-midnight-400 text-sm">
                      📸 Screenshot à ajouter :
                    </p>
                    <p className="text-midnight-300 text-xs mt-2 max-w-md">
                      {step.imagePlaceholder}
                    </p>
                  </div>
                  
                  {/* Image réelle (si disponible) */}
                  <img
                    src={step.imageUrl}
                    alt={step.title}
                    className="absolute inset-0 w-full h-full object-contain"
                    onError={(e) => {
                      // Cacher l'image si elle n'existe pas
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
                
                {/* Titre et description */}
                <h3 className="text-2xl font-display text-white mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-aurora-500/20 flex items-center justify-center text-aurora-400 text-sm">
                    {currentStep + 1}
                  </span>
                  {step.title}
                </h3>
                
                <p className="text-lg text-midnight-200 mb-4">
                  {step.description}
                </p>
                
                {/* Conseil */}
                {step.tip && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-dream-500/10 border border-dream-500/20">
                    <Sparkles className="w-5 h-5 text-dream-400 flex-shrink-0 mt-0.5" />
                    <p className="text-dream-300 text-sm">
                      {step.tip}
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Footer avec navigation */}
          <div className="p-4 border-t border-midnight-700 flex items-center justify-between">
            {/* Bouton précédent */}
            <button
              onClick={handlePrev}
              disabled={isFirstStep}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                isFirstStep
                  ? 'opacity-40 cursor-not-allowed'
                  : 'bg-midnight-800 hover:bg-midnight-700 text-white'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </button>
            
            {/* Bouton central : Copier et ouvrir (sur étape 3) */}
            {currentStep === 2 && (
              <motion.button
                onClick={handleCopyAndOpen}
                className={cn(
                  'flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-all',
                  'bg-gradient-to-r',
                  tutorial.color,
                  'text-white hover:opacity-90'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copié ! Ouverture...
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copier et ouvrir fal.ai
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            )}
            
            {/* Bouton suivant */}
            <button
              onClick={isLastStep ? onClose : handleNext}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                'bg-aurora-600 hover:bg-aurora-500 text-white'
              )}
            >
              {isLastStep ? 'Terminé !' : 'Suivant'}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================================================
// BOUTON D'AIDE RAPIDE
// ============================================================================

interface TutorialButtonProps {
  type: TutorialType
  onOpen: () => void
  className?: string
}

export function TutorialButton({ type, onOpen, className }: TutorialButtonProps) {
  // Mapper les anciens types vers les nouveaux
  const mappedType = type === 'midjourney' ? 'image' : type === 'runway' ? 'video' : type
  const tutorial = TUTORIALS.find(t => t.id === mappedType)
  if (!tutorial) return null
  
  return (
    <motion.button
      onClick={onOpen}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all',
        'bg-midnight-800/50 hover:bg-midnight-700/50 text-midnight-300 hover:text-white',
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <HelpCircle className="w-4 h-4" />
      Comment ça marche ?
    </motion.button>
  )
}

export default TutorialGuide
