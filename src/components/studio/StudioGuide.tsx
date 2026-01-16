'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, Circle, Lock, HelpCircle, Trophy } from 'lucide-react'
import { 
  useStudioProgressStore,
  type CreationType,
  type GuideStep,
  LEVEL_NAMES,
  LEVEL_EMOJIS,
} from '@/store/useStudioProgressStore'
import { cn } from '@/lib/utils'

interface StudioGuideProps {
  type: CreationType
  onHelpRequest?: () => void
}

export function StudioGuide({ type, onHelpRequest }: StudioGuideProps) {
  const {
    currentStep,
    completedSteps,
    getLevel,
    getLevelName,
    getLevelEmoji,
    getCreationsInLevel,
    getCreationsNeeded,
    getProgress,
    getGuideSteps,
    isStepDoneByChild,
  } = useStudioProgressStore()

  const level = getLevel(type)
  const levelName = getLevelName(type)
  const levelEmoji = getLevelEmoji(type)
  const creationsInLevel = getCreationsInLevel(type)
  const creationsNeeded = getCreationsNeeded(type)
  const progress = getProgress(type)
  const guideSteps = getGuideSteps(type)

  const getStepStatus = (stepId: GuideStep): 'completed' | 'current' | 'pending' | 'locked' => {
    if (completedSteps.includes(stepId)) return 'completed'
    if (currentStep === stepId) return 'current'
    
    // Vérifier si l'étape est bloquée (niveau trop bas)
    const stepConfig = guideSteps.find(s => s.id === stepId)
    if (stepConfig && !isStepDoneByChild(type, stepId)) {
      // L'IA fait cette étape, pas bloquée mais marquée différemment
      return 'pending'
    }
    
    return 'pending'
  }

  return (
    <motion.div
      className="glass rounded-2xl p-5 w-72"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header avec niveau */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-midnight-700/50">
        <div className="text-2xl">{levelEmoji}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-white text-sm">
            {type === 'image' ? '🖼️ Images' : '🎬 Vidéos'}
          </h3>
          <p className="text-xs text-aurora-300">
            Niveau {level} : {levelName}
          </p>
        </div>
      </div>

      {/* Titre du guide */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">✨</span>
        <h4 className="font-medium text-white text-sm">Mon Guide</h4>
      </div>

      {/* Liste des étapes */}
      <div className="space-y-2 mb-4">
        {guideSteps.map((step, index) => {
          const status = getStepStatus(step.id)
          const isChildStep = isStepDoneByChild(type, step.id)
          
          return (
            <motion.div
              key={step.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm',
                status === 'completed' && 'bg-dream-500/20',
                status === 'current' && 'bg-aurora-500/20 ring-1 ring-aurora-500/50',
                status === 'pending' && 'bg-midnight-800/30',
              )}
              initial={status === 'current' ? { scale: 1 } : {}}
              animate={status === 'current' ? { 
                scale: [1, 1.02, 1],
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {/* Numéro / État */}
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                status === 'completed' && 'bg-dream-500 text-white',
                status === 'current' && 'bg-aurora-500 text-white',
                status === 'pending' && 'bg-midnight-700 text-midnight-400',
              )}>
                {status === 'completed' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : status === 'current' ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Circle className="w-3 h-3 fill-current" />
                  </motion.div>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Emoji et Label */}
              <div className="flex-1 flex items-center gap-2">
                <span>{step.emoji}</span>
                <span className={cn(
                  'text-sm',
                  status === 'completed' && 'text-dream-300',
                  status === 'current' && 'text-white font-medium',
                  status === 'pending' && 'text-midnight-400',
                )}>
                  {step.label}
                </span>
              </div>

              {/* Indicateur si l'IA fait cette étape */}
              {!isChildStep && status !== 'completed' && (
                <span 
                  className="text-xs text-aurora-400 bg-aurora-500/10 px-1.5 py-0.5 rounded"
                  title="L'IA t'aide pour cette étape"
                >
                  IA
                </span>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Barre de progression du niveau */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-midnight-400 mb-1">
          <span>Progression niveau {level}</span>
          <span>{creationsInLevel}/{creationsNeeded || '∞'}</span>
        </div>
        <div className="h-2 bg-midnight-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-aurora-500 to-dream-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        {creationsNeeded > 0 && (
          <p className="text-xs text-midnight-500 mt-1 text-center">
            Encore {creationsNeeded - creationsInLevel} création{creationsNeeded - creationsInLevel > 1 ? 's' : ''} pour le niveau {level + 1}
          </p>
        )}
        {creationsNeeded === 0 && (
          <p className="text-xs text-dream-400 mt-1 text-center flex items-center justify-center gap-1">
            <Trophy className="w-3 h-3" />
            Niveau maximum atteint !
          </p>
        )}
      </div>

      {/* Bouton d'aide */}
      <motion.button
        onClick={onHelpRequest}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stardust-500/20 text-stardust-300 hover:bg-stardust-500/30 transition-colors text-sm"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <HelpCircle className="w-4 h-4" />
        J'ai besoin d'aide
      </motion.button>
    </motion.div>
  )
}

// Composant compact pour afficher juste le niveau actuel
export function StudioLevelBadge({ type }: { type: CreationType }) {
  const { getLevel, getLevelName, getLevelEmoji, getProgress } = useStudioProgressStore()
  
  const level = getLevel(type)
  const levelName = getLevelName(type)
  const levelEmoji = getLevelEmoji(type)
  const progress = getProgress(type)

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-midnight-800/50 text-sm">
      <span>{levelEmoji}</span>
      <span className="text-white font-medium">Niveau {level}</span>
      <span className="text-midnight-400">·</span>
      <span className="text-aurora-300">{levelName}</span>
      <div className="w-12 h-1.5 bg-midnight-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-aurora-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
