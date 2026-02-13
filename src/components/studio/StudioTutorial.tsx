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
import { useTranslations } from '@/lib/i18n/context'

interface TutorialStep {
  id: string
  image?: string // URL ou chemin vers une image/GIF
  action?: 'copy' | 'open' | 'click' | 'wait'
}

// Tutoriel fal.ai Images (Flux Pro)
const IMAGE_TUTORIAL: TutorialStep[] = [
  { id: 'intro' },
  { id: 'open', action: 'open' },
  { id: 'prompt' },
  { id: 'paste', action: 'copy' },
  { id: 'run', action: 'click' },
  { id: 'wait', action: 'wait' },
  { id: 'save' },
  { id: 'done' },
]

// Tutoriel fal.ai Vidéos (Kling)
const VIDEO_TUTORIAL: TutorialStep[] = [
  { id: 'intro' },
  { id: 'open', action: 'open' },
  { id: 'prompt' },
  { id: 'paste', action: 'copy' },
  { id: 'run', action: 'click' },
  { id: 'wait', action: 'wait' },
  { id: 'preview' },
  { id: 'download' },
  { id: 'done' },
]

interface StudioTutorialProps {
  type: CreationType
  onClose: () => void
  onOpenTool: () => void
  promptToCopy?: string
}

export function StudioTutorial({ type, onClose, onOpenTool, promptToCopy }: StudioTutorialProps) {
  const t = useTranslations('studio')
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
            {t('studioTutorial.stepOf', { current: String(currentStepIndex + 1), total: String(tutorial.length) })}
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
              {t(`studioTutorial.${type}.step${currentStepIndex + 1}.title`)}
            </h2>

            {/* Description */}
            <p className="text-lg text-midnight-200 mb-6">
              {t(`studioTutorial.${type}.step${currentStepIndex + 1}.description`)}
            </p>

            {/* Image/GIF si disponible */}
            {currentStep.image && (
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-midnight-800 mb-6">
                <img
                  src={currentStep.image}
                  alt={t(`studioTutorial.${type}.step${currentStepIndex + 1}.title`)}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Actions spéciales */}
            {currentStep.action === 'copy' && promptToCopy && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-midnight-400">{t('studioTutorial.promptToCopy')}</span>
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
                        {t('studioTutorial.copied')}
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        {t('studioTutorial.copy')}
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
                {t('studioTutorial.openFalai')}
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
                <span>{t('studioTutorial.magicHappening')}</span>
              </div>
            )}

            {/* Astuce */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-dream-500/10 border border-dream-500/20">
              <span className="text-xl">💡</span>
              <p className="text-sm text-dream-200">
                <span className="font-medium text-dream-300">{t('studioTutorial.tipLabel')}</span>
                {t(`studioTutorial.${type}.step${currentStepIndex + 1}.tip`)}
              </p>
            </div>
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
            {t('studioTutorial.previous')}
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
                {t('studioTutorial.finish')}
                <Play className="w-5 h-5" />
              </>
            ) : (
              <>
                {t('studioTutorial.next')}
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
  const t = useTranslations('studio')
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
      {compact ? t('studioTutorial.tutorial') : t(type === 'image' ? 'studioTutorial.tutorialFalaiImages' : 'studioTutorial.tutorialFalaiVideos')}
    </motion.button>
  )
}
