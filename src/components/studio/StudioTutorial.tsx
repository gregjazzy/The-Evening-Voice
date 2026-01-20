'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  Copy,
  Check,
  Play,
  Sparkles,
} from 'lucide-react'
import { type CreationType } from '@/store/useStudioProgressStore'
import { cn } from '@/lib/utils'

interface TutorialStep {
  id: string
  title: string
  description: string
  image?: string // URL ou chemin vers une image/GIF
  tip?: string
  action?: 'copy' | 'open' | 'click' | 'wait'
}

// Tutoriel fal.ai Images (Flux Pro)
const IMAGE_TUTORIAL: TutorialStep[] = [
  {
    id: 'intro',
    title: "Bienvenue sur fal.ai ! 🎨",
    description: "fal.ai est un site magique qui transforme tes mots en images. C'est super simple à utiliser !",
    tip: "C'est comme un peintre magique qui dessine ce que tu lui décris !",
  },
  {
    id: 'open',
    title: "Ouvre fal.ai 🚀",
    description: "Clique sur le bouton pour ouvrir fal.ai dans Safari. La page s'ouvrira toute seule !",
    action: 'open',
    tip: "fal.ai, c'est un site internet tout simple.",
  },
  {
    id: 'prompt',
    title: "Trouve la zone de texte 📝",
    description: "Tu vas voir un grand rectangle blanc où tu peux écrire. C'est là que tu vas coller ton prompt !",
    tip: "Le prompt, c'est la description magique de ton image.",
  },
  {
    id: 'paste',
    title: "Colle ton prompt ✨",
    description: "Appuie sur les touches Cmd + V en même temps pour coller ton texte magique.",
    action: 'copy',
    tip: "Le texte vient du bouton 'Copier' que tu as cliqué avant !",
  },
  {
    id: 'run',
    title: "Clique sur Run ! 🎯",
    description: "Trouve le bouton 'Run' (souvent en bleu ou violet) et clique dessus. C'est parti !",
    action: 'click',
    tip: "Run veut dire 'Lancer' en anglais.",
  },
  {
    id: 'wait',
    title: "Attends la magie ⏳",
    description: "fal.ai crée ton image... Ça prend juste quelques secondes ! Tu vas voir l'image apparaître.",
    action: 'wait',
    tip: "C'est super rapide !",
  },
  {
    id: 'save',
    title: "Télécharge ton image 💾",
    description: "Clique sur ton image avec le bouton droit de la souris, puis choisis 'Enregistrer l'image'.",
    tip: "Mets-la dans un endroit facile à retrouver !",
  },
  {
    id: 'done',
    title: "Bravo ! 🎉",
    description: "Tu as créé ta première image avec fal.ai ! Maintenant, glisse-la dans l'app pour l'ajouter à ta galerie.",
    tip: "Tu peux créer autant d'images que tu veux !",
  },
]

// Tutoriel fal.ai Vidéos (Kling)
const VIDEO_TUTORIAL: TutorialStep[] = [
  {
    id: 'intro',
    title: "Bienvenue sur fal.ai ! 🎬",
    description: "fal.ai peut aussi créer des vidéos magiques à partir de tes descriptions !",
    tip: "C'est comme un réalisateur de films qui donne vie à ton imagination !",
  },
  {
    id: 'open',
    title: "Ouvre fal.ai 🚀",
    description: "Clique sur le bouton pour ouvrir fal.ai Vidéos dans Safari.",
    action: 'open',
    tip: "C'est le même site, mais une page spéciale pour les vidéos.",
  },
  {
    id: 'prompt',
    title: "Trouve la zone de texte 📝",
    description: "Tu vas voir un grand rectangle où écrire. C'est ici que tu décris ta vidéo !",
    tip: "Pour les vidéos, pense à décrire ce qui BOUGE.",
  },
  {
    id: 'paste',
    title: "Colle ton prompt ✨",
    description: "Appuie sur Cmd + V pour coller le texte magique qui décrit ta vidéo.",
    action: 'copy',
    tip: "Ton prompt décrit le mouvement : 'un chat qui saute', 'des étoiles qui brillent'...",
  },
  {
    id: 'run',
    title: "Clique sur Run ! 🎯",
    description: "Trouve le bouton 'Run' et clique dessus pour lancer la création de ta vidéo !",
    action: 'click',
    tip: "Les vidéos prennent un peu plus de temps que les images.",
  },
  {
    id: 'wait',
    title: "Attends la magie ⏳",
    description: "fal.ai crée ta vidéo... Ça prend environ 1-2 minutes. Patience, ça vaut le coup !",
    action: 'wait',
    tip: "C'est normal que ce soit plus long, il y a plein d'images à créer !",
  },
  {
    id: 'preview',
    title: "Regarde le résultat 👀",
    description: "Quand c'est prêt, ta vidéo va se jouer toute seule. Regarde si elle te plaît !",
    tip: "Si ça ne te plaît pas, tu peux recommencer avec un prompt différent.",
  },
  {
    id: 'download',
    title: "Télécharge ta vidéo 💾",
    description: "Clique sur le bouton de téléchargement (une flèche vers le bas) pour sauvegarder ta vidéo.",
    tip: "Choisis bien où tu la mets pour la retrouver facilement !",
  },
  {
    id: 'done',
    title: "Bravo ! 🎉",
    description: "Tu as créé ta première vidéo avec fal.ai ! Glisse-la dans l'app pour l'ajouter à ta collection.",
    tip: "Tu peux maintenant animer toutes tes histoires !",
  },
]

interface StudioTutorialProps {
  type: CreationType
  onClose: () => void
  onOpenTool: () => void
  promptToCopy?: string
}

export function StudioTutorial({ type, onClose, onOpenTool, promptToCopy }: StudioTutorialProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  const tutorial = type === 'image' ? IMAGE_TUTORIAL : VIDEO_TUTORIAL
  const currentStep = tutorial[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === tutorial.length - 1

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStepIndex(prev => prev + 1)
      setCopied(false)
    } else {
      onClose()
    }
  }

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1)
      setCopied(false)
    }
  }

  const handleCopy = async () => {
    if (promptToCopy) {
      await navigator.clipboard.writeText(promptToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOpenTool = () => {
    onOpenTool()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-2xl bg-midnight-900 rounded-3xl border border-midnight-700 overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-midnight-800/50 text-midnight-400 hover:text-white hover:bg-midnight-700/50 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Indicateur de progression */}
        <div className="px-6 pt-6">
          <div className="flex gap-1">
            {tutorial.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'flex-1 h-1.5 rounded-full transition-colors',
                  index <= currentStepIndex ? 'bg-aurora-500' : 'bg-midnight-700'
                )}
              />
            ))}
          </div>
          <p className="text-xs text-midnight-400 mt-2 text-center">
            Étape {currentStepIndex + 1} sur {tutorial.length}
          </p>
        </div>

        {/* Contenu de l'étape */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-8"
          >
            {/* Titre avec emoji */}
            <h2 className="text-2xl font-display text-white mb-4">
              {currentStep.title}
            </h2>

            {/* Description */}
            <p className="text-lg text-midnight-200 mb-6">
              {currentStep.description}
            </p>

            {/* Image/GIF si disponible */}
            {currentStep.image && (
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-midnight-800 mb-6">
                <img
                  src={currentStep.image}
                  alt={currentStep.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Actions spéciales */}
            {currentStep.action === 'copy' && promptToCopy && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-midnight-400">Ton prompt à copier :</span>
                  <motion.button
                    onClick={handleCopy}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                      copied
                        ? 'bg-dream-500/20 text-dream-300'
                        : 'bg-aurora-500/20 text-aurora-300 hover:bg-aurora-500/30'
                    )}
                    whileTap={{ scale: 0.95 }}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copier
                      </>
                    )}
                  </motion.button>
                </div>
                <div className="p-4 rounded-xl bg-midnight-800/70 border border-midnight-700">
                  <p className="text-white text-sm font-mono break-all">
                    {promptToCopy}
                  </p>
                </div>
              </div>
            )}

            {currentStep.action === 'open' && (
              <motion.button
                onClick={handleOpenTool}
                className="flex items-center gap-3 px-6 py-3 rounded-xl bg-aurora-500 text-white font-medium hover:bg-aurora-600 transition-colors mb-6"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ExternalLink className="w-5 h-5" />
                Ouvrir fal.ai dans Safari
              </motion.button>
            )}

            {currentStep.action === 'wait' && (
              <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-stardust-500/20 text-stardust-300 mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
                <span>La magie opère... Sois patient(e) ! ✨</span>
              </div>
            )}

            {/* Astuce */}
            {currentStep.tip && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-dream-500/10 border border-dream-500/20">
                <span className="text-xl">💡</span>
                <p className="text-sm text-dream-200">
                  <span className="font-medium text-dream-300">Astuce : </span>
                  {currentStep.tip}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between px-8 pb-6">
          <motion.button
            onClick={handlePrev}
            disabled={isFirstStep}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl transition-colors',
              isFirstStep
                ? 'text-midnight-600 cursor-not-allowed'
                : 'text-midnight-300 hover:text-white hover:bg-midnight-800/50'
            )}
            whileHover={!isFirstStep ? { x: -3 } : {}}
          >
            <ChevronLeft className="w-5 h-5" />
            Précédent
          </motion.button>

          <motion.button
            onClick={handleNext}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-colors',
              isLastStep
                ? 'bg-dream-500 text-white hover:bg-dream-600'
                : 'bg-aurora-500 text-white hover:bg-aurora-600'
            )}
            whileHover={{ x: isLastStep ? 0 : 3 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLastStep ? (
              <>
                Terminer
                <Play className="w-5 h-5" />
              </>
            ) : (
              <>
                Suivant
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Composant bouton pour lancer le tutoriel
interface TutorialButtonProps {
  type: CreationType
  onClick: () => void
  compact?: boolean
}

export function TutorialButton({ type, onClick, compact = false }: TutorialButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-xl transition-colors',
        compact
          ? 'px-3 py-1.5 text-sm bg-midnight-800/50 text-aurora-300 hover:bg-midnight-700/50'
          : 'px-4 py-2 bg-aurora-500/20 text-aurora-300 hover:bg-aurora-500/30'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Play className={cn(compact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      {compact ? 'Tutoriel' : `Tutoriel fal.ai ${type === 'image' ? 'Images' : 'Vidéos'}`}
    </motion.button>
  )
}
