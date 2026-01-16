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

// Tutoriel Midjourney
const MIDJOURNEY_TUTORIAL: TutorialStep[] = [
  {
    id: 'intro',
    title: "Bienvenue sur Midjourney ! 🎨",
    description: "Midjourney est un outil magique qui transforme tes mots en images. Suis ce tutoriel pour apprendre à l'utiliser !",
    tip: "C'est comme un peintre magique qui dessine ce que tu lui décris !",
  },
  {
    id: 'open',
    title: "Ouvre Safari 🚀",
    description: "Clique sur le bouton pour aller sur Midjourney dans Safari.",
    action: 'open',
    tip: "Safari, c'est l'application avec la boussole bleue !",
  },
  {
    id: 'discord',
    title: "Connecte-toi à Discord 💬",
    description: "Midjourney fonctionne dans Discord. Si tu n'es pas connectée, demande de l'aide à un adulte.",
    tip: "Discord, c'est un peu comme un salon de discussion magique !",
  },
  {
    id: 'channel',
    title: "Va dans le bon salon ✨",
    description: "Cherche un salon qui commence par 'newbies' ou 'general'. Clique dessus pour entrer.",
    tip: "Les salons sont listés sur le côté gauche de l'écran.",
  },
  {
    id: 'prompt',
    title: "Écris ton prompt 📝",
    description: "En bas de l'écran, il y a une zone de texte. Écris /imagine puis colle ton prompt.",
    action: 'copy',
    tip: "Le prompt, c'est la description de ce que tu veux créer !",
  },
  {
    id: 'imagine',
    title: "Tape /imagine 🔮",
    description: "Commence par écrire /imagine (avec le slash !), puis un espace, puis colle ton prompt avec Cmd+V.",
    tip: "Le slash / est important, c'est lui qui dit à Midjourney que tu veux créer !",
  },
  {
    id: 'send',
    title: "Envoie ta demande ✉️",
    description: "Appuie sur Entrée pour envoyer. Midjourney va commencer à créer ton image !",
    action: 'click',
    tip: "C'est parti pour la magie !",
  },
  {
    id: 'wait',
    title: "Attends la magie ⏳",
    description: "Midjourney travaille... Ça prend environ 1 minute. Tu verras l'image apparaître petit à petit !",
    action: 'wait',
    tip: "Tu peux voir l'image se construire progressivement, c'est fascinant !",
  },
  {
    id: 'choose',
    title: "Choisis ton image préférée 🖼️",
    description: "Midjourney te propose 4 images. Clique sur U1, U2, U3 ou U4 pour agrandir celle que tu préfères.",
    tip: "U veut dire 'Upscale' (agrandir). V veut dire 'Variation' (faire des variantes).",
  },
  {
    id: 'save',
    title: "Sauvegarde ton image 💾",
    description: "Clique sur l'image agrandie, puis clic droit > 'Enregistrer l'image'. Choisis où la sauvegarder.",
    tip: "Tu pourras ensuite l'importer dans ton histoire !",
  },
  {
    id: 'done',
    title: "Bravo ! 🎉",
    description: "Tu as créé ta première image avec Midjourney ! Retourne dans l'app pour l'importer.",
    tip: "Tu peux recommencer autant de fois que tu veux !",
  },
]

// Tutoriel Runway
const RUNWAY_TUTORIAL: TutorialStep[] = [
  {
    id: 'intro',
    title: "Bienvenue sur Runway ! 🎬",
    description: "Runway est un outil magique qui transforme tes mots ou images en vidéos. Suis ce tutoriel pour apprendre à l'utiliser !",
    tip: "C'est comme un réalisateur de films qui donne vie à ton imagination !",
  },
  {
    id: 'open',
    title: "Ouvre Safari 🚀",
    description: "Clique sur le bouton pour aller sur Runway dans Safari.",
    action: 'open',
    tip: "Safari, c'est l'application avec la boussole bleue !",
  },
  {
    id: 'login',
    title: "Connecte-toi 🔐",
    description: "Si tu n'es pas connectée, demande de l'aide à un adulte pour te connecter à Runway.",
    tip: "Une fois connectée, tu auras accès à tous les outils !",
  },
  {
    id: 'gen2',
    title: "Choisis Gen-2 🎥",
    description: "Clique sur 'Gen-2' ou 'Generate Video'. C'est l'outil pour créer des vidéos !",
    tip: "Gen-2 est le plus puissant pour créer des vidéos à partir de texte.",
  },
  {
    id: 'mode',
    title: "Choisis ton mode 📸",
    description: "Tu peux créer une vidéo à partir de texte seul, ou à partir d'une image. Choisis ce que tu préfères !",
    tip: "Si tu as déjà créé une image, tu peux l'animer !",
  },
  {
    id: 'prompt',
    title: "Écris ton prompt 📝",
    description: "Dans la zone de texte, colle ton prompt qui décrit ce qui se passe dans la vidéo.",
    action: 'copy',
    tip: "Décris le mouvement : 'le dragon s'envole', 'la fée danse'...",
  },
  {
    id: 'settings',
    title: "Ajuste les réglages ⚙️",
    description: "Tu peux choisir la durée (4 ou 16 secondes) et la qualité de ta vidéo.",
    tip: "Commence avec 4 secondes, c'est plus rapide pour essayer !",
  },
  {
    id: 'generate',
    title: "Génère ta vidéo 🚀",
    description: "Clique sur 'Generate' ou 'Create'. Runway va créer ta vidéo !",
    action: 'click',
    tip: "C'est parti pour la magie !",
  },
  {
    id: 'wait',
    title: "Attends la magie ⏳",
    description: "Runway travaille... Ça peut prendre 2-3 minutes. Tu verras la progression !",
    action: 'wait',
    tip: "Patience, la création vidéo prend plus de temps que les images.",
  },
  {
    id: 'preview',
    title: "Regarde le résultat 👀",
    description: "Quand c'est prêt, tu peux regarder ta vidéo. Si elle te plaît, on la télécharge !",
    tip: "Si ça ne te plaît pas, tu peux recommencer avec un prompt différent.",
  },
  {
    id: 'download',
    title: "Télécharge ta vidéo 💾",
    description: "Clique sur le bouton de téléchargement (flèche vers le bas) pour sauvegarder ta vidéo.",
    tip: "Choisis bien l'endroit où tu la sauvegardes pour la retrouver facilement !",
  },
  {
    id: 'done',
    title: "Bravo ! 🎉",
    description: "Tu as créé ta première vidéo avec Runway ! Retourne dans l'app pour l'importer.",
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

  const tutorial = type === 'image' ? MIDJOURNEY_TUTORIAL : RUNWAY_TUTORIAL
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
                Ouvrir {type === 'image' ? 'Midjourney' : 'Runway'} dans Safari
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
                <span>La magie opère... Sois patiente ! ✨</span>
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
      {compact ? 'Tutoriel' : `Tutoriel ${type === 'image' ? 'Midjourney' : 'Runway'}`}
    </motion.button>
  )
}
