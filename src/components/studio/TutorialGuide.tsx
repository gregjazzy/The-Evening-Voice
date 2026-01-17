'use client'

/**
 * TutorialGuide - Tutoriels visuels pour Midjourney et Runway
 * 
 * Affiche des guides étape par étape avec :
 * - Images/GIFs de démonstration (placeholders à remplacer)
 * - Textes explicatifs adaptés aux enfants
 * - Navigation entre les étapes
 * 
 * SCREENSHOTS À CAPTURER :
 * 
 * 📸 MIDJOURNEY (5 images) :
 * 1. midjourney-01-discord.png - Page d'accueil Discord avec bouton Midjourney
 * 2. midjourney-02-channel.png - Canal #newbies ou #général  
 * 3. midjourney-03-imagine.png - Commande /imagine dans le chat
 * 4. midjourney-04-prompt.png - Zone de texte avec prompt collé
 * 5. midjourney-05-result.png - Résultat avec les 4 images générées
 * 
 * 📸 RUNWAY (5 images) :
 * 1. runway-01-home.png - Page d'accueil Runway ML
 * 2. runway-02-create.png - Bouton "Create" ou "Gen-3"
 * 3. runway-03-prompt.png - Zone de texte du prompt
 * 4. runway-04-generate.png - Bouton de génération
 * 5. runway-05-result.png - Vidéo générée en preview
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
  imageUrl: string        // URL de l'image/GIF (placeholder si non fourni)
  imagePlaceholder: string // Description du screenshot à capturer
}

interface Tutorial {
  id: 'midjourney' | 'runway'
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
    id: 'midjourney',
    name: 'Midjourney',
    emoji: '🎨',
    color: 'from-purple-500 to-indigo-600',
    url: 'https://discord.com/channels/@me',
    steps: [
      {
        id: 'mj-1',
        title: 'Ouvre Discord',
        description: 'Midjourney fonctionne sur Discord. Clique sur l\'icône Midjourney dans la barre de gauche.',
        tip: '💡 Si tu n\'as pas Discord, demande à un adulte de t\'aider à créer un compte.',
        imageUrl: '/tutorials/midjourney-01-discord.png',
        imagePlaceholder: 'Screenshot de Discord avec le serveur Midjourney visible dans la sidebar',
      },
      {
        id: 'mj-2',
        title: 'Va dans un salon',
        description: 'Choisis un salon comme #newbies ou #general pour créer tes images.',
        tip: '💡 Les salons "newbies" sont parfaits pour débuter !',
        imageUrl: '/tutorials/midjourney-02-channel.png',
        imagePlaceholder: 'Screenshot montrant la liste des canaux avec #newbies surligné',
      },
      {
        id: 'mj-3',
        title: 'Tape /imagine',
        description: 'Dans la zone de texte en bas, écris /imagine puis appuie sur Entrée.',
        tip: '💡 Le slash / est très important, c\'est une commande magique !',
        imageUrl: '/tutorials/midjourney-03-imagine.png',
        imagePlaceholder: 'Screenshot de la zone de chat avec /imagine tapé',
      },
      {
        id: 'mj-4',
        title: 'Colle ton prompt',
        description: 'Maintenant, colle le texte magique que tu as copié (Cmd+V sur Mac).',
        tip: '💡 C\'est le prompt que Luna t\'a aidé à créer !',
        imageUrl: '/tutorials/midjourney-04-prompt.png',
        imagePlaceholder: 'Screenshot montrant le prompt collé après /imagine prompt:',
      },
      {
        id: 'mj-5',
        title: 'Admire le résultat !',
        description: 'Midjourney va créer 4 images. Clique sur celle que tu préfères, puis sur "U1" à "U4" pour la télécharger.',
        tip: '💡 U = Upscale (agrandir). V = Variation (créer des variantes).',
        imageUrl: '/tutorials/midjourney-05-result.png',
        imagePlaceholder: 'Screenshot des 4 images générées avec les boutons U1-U4 et V1-V4',
      },
    ],
  },
  {
    id: 'runway',
    name: 'Runway',
    emoji: '🎬',
    color: 'from-orange-500 to-red-600',
    url: 'https://app.runwayml.com/',
    steps: [
      {
        id: 'rw-1',
        title: 'Ouvre Runway',
        description: 'Va sur le site de Runway et connecte-toi à ton compte.',
        tip: '💡 Demande à un adulte de t\'aider pour le compte si besoin.',
        imageUrl: '/tutorials/runway-01-home.png',
        imagePlaceholder: 'Screenshot de la page d\'accueil Runway avec le bouton de connexion',
      },
      {
        id: 'rw-2',
        title: 'Choisis Gen-3',
        description: 'Clique sur "Create" puis choisis "Gen-3 Alpha" pour créer des vidéos magiques.',
        tip: '💡 Gen-3 crée les plus belles vidéos !',
        imageUrl: '/tutorials/runway-02-create.png',
        imagePlaceholder: 'Screenshot du menu avec Gen-3 Alpha sélectionné',
      },
      {
        id: 'rw-3',
        title: 'Colle ton prompt',
        description: 'Dans la grande zone de texte, colle le texte que Luna t\'a aidé à créer.',
        tip: '💡 Tu peux aussi ajouter une image de départ pour guider Runway !',
        imageUrl: '/tutorials/runway-03-prompt.png',
        imagePlaceholder: 'Screenshot de la zone de prompt avec du texte',
      },
      {
        id: 'rw-4',
        title: 'Lance la création',
        description: 'Clique sur le gros bouton "Generate" et attends la magie !',
        tip: '💡 La génération prend environ 1-2 minutes.',
        imageUrl: '/tutorials/runway-04-generate.png',
        imagePlaceholder: 'Screenshot avec le bouton Generate mis en évidence',
      },
      {
        id: 'rw-5',
        title: 'Télécharge ta vidéo',
        description: 'Quand c\'est prêt, clique sur le bouton de téléchargement pour récupérer ta vidéo.',
        tip: '💡 Tu peux faire plusieurs essais pour trouver le meilleur résultat !',
        imageUrl: '/tutorials/runway-05-result.png',
        imagePlaceholder: 'Screenshot de la vidéo générée avec le bouton download',
      },
    ],
  },
]

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

interface TutorialGuideProps {
  type: 'midjourney' | 'runway'
  isOpen: boolean
  onClose: () => void
  onCopyPrompt?: () => void
}

export function TutorialGuide({ type, isOpen, onClose, onCopyPrompt }: TutorialGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [copied, setCopied] = useState(false)
  
  const tutorial = TUTORIALS.find(t => t.id === type)
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
                      {type === 'midjourney' ? (
                        <ImageIcon className="w-8 h-8 text-purple-400" />
                      ) : (
                        <Video className="w-8 h-8 text-orange-400" />
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
                    Copier et ouvrir {tutorial.name}
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
  type: 'midjourney' | 'runway'
  onOpen: () => void
  className?: string
}

export function TutorialButton({ type, onOpen, className }: TutorialButtonProps) {
  const tutorial = TUTORIALS.find(t => t.id === type)
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
