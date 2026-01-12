/**
 * Composant d'affichage de la progression du prompting
 * Design premium épuré avec étoiles subtiles
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { LEVELS_CONFIG, MAGIC_KEYS_CONFIG, type MagicKey } from '@/lib/ai/prompting-pedagogy'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

// ============================================================================
// COMPOSANT : Étoile simple
// ============================================================================

interface StarIconProps {
  filled: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  animate?: boolean
}

function StarIcon({ filled, size = 'md', className, animate = false }: StarIconProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }
  
  return (
    <motion.span
      className={cn(
        sizeClasses[size],
        'inline-block',
        filled ? 'text-amber-400' : 'text-midnight-600',
        className
      )}
      initial={animate ? { scale: 0, rotate: -180 } : false}
      animate={animate ? { scale: 1, rotate: 0 } : false}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
    >
      {filled ? '✦' : '✧'}
    </motion.span>
  )
}

// ============================================================================
// COMPOSANT : Animation d'étoile gagnée (pour la sidebar)
// ============================================================================

export function StarEarnedAnimation() {
  const { pendingStarAnimation, setPendingStarAnimation } = useAppStore()
  
  useEffect(() => {
    if (pendingStarAnimation) {
      // Auto-clear après l'animation
      const timer = setTimeout(() => {
        setPendingStarAnimation(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [pendingStarAnimation, setPendingStarAnimation])
  
  return (
    <AnimatePresence>
      {pendingStarAnimation && (
        <motion.div
          className="fixed z-50 pointer-events-none"
          initial={{ opacity: 0, scale: 0, x: '50vw', y: '50vh' }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            scale: [0, 1.5, 1, 0.5],
            x: ['50vw', '50vw', '10vw'],
            y: ['50vh', '40vh', '20vh'],
          }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          <span className="text-4xl text-amber-400 drop-shadow-lg">✦</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// COMPOSANT : Sidebar compact (étoiles seulement)
// ============================================================================

interface SidebarProgressProps {
  locale?: 'fr' | 'en' | 'ru'
}

export function SidebarProgress({ locale = 'fr' }: SidebarProgressProps) {
  const { promptingProgress, userName } = useAppStore()
  const levelConfig = LEVELS_CONFIG[promptingProgress.level]
  const totalStars = promptingProgress.unlockedKeys.length
  
  return (
    <div className="px-4 py-3">
      {/* Nom et niveau */}
      <div className="mb-2">
        <p className="font-medium text-white text-sm">
          {userName || (locale === 'fr' ? 'Mon profil' : locale === 'en' ? 'My profile' : 'Мой профиль')}
        </p>
        <p className="text-xs text-midnight-400">{levelConfig.name[locale]}</p>
      </div>
      
      {/* Étoiles (clés débloquées) */}
      <div className="flex items-center gap-1">
        {(['style', 'hero', 'mood', 'world', 'magic'] as MagicKey[]).map((key) => (
          <StarIcon
            key={key}
            filled={promptingProgress.unlockedKeys.includes(key)}
            size="md"
          />
        ))}
        <span className="ml-2 text-xs text-midnight-500">
          {totalStars}/5
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// COMPOSANT : Page de progression complète
// ============================================================================

interface FullProgressProps {
  locale?: 'fr' | 'en' | 'ru'
}

export function FullProgress({ locale = 'fr' }: FullProgressProps) {
  const { promptingProgress } = useAppStore()
  const levelConfig = LEVELS_CONFIG[promptingProgress.level]
  const currentKey = MAGIC_KEYS_CONFIG[promptingProgress.currentKeyLearning]
  const keyProgress = promptingProgress.keyProgress[promptingProgress.currentKeyLearning]
  
  // Niveaux pour la timeline
  const levels = ['explorer', 'apprenti', 'artiste', 'magicien', 'maitre'] as const
  const currentLevelIndex = levels.indexOf(promptingProgress.level)
  
  const titles = {
    fr: {
      title: 'Ma progression',
      currentMission: 'Mission en cours',
      keys: 'Les 5 Clés Magiques',
      images: 'images',
    },
    en: {
      title: 'My progress',
      currentMission: 'Current mission',
      keys: 'The 5 Magic Keys',
      images: 'images',
    },
    ru: {
      title: 'Мой прогресс',
      currentMission: 'Текущая миссия',
      keys: '5 Волшебных Ключей',
      images: 'изображений',
    },
  }
  
  const t = titles[locale]
  
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Titre */}
      <div className="text-center">
        <h1 className="text-2xl font-light text-white mb-2">{t.title}</h1>
        <p className="text-midnight-400">{levelConfig.description[locale]}</p>
      </div>
      
      {/* Timeline des niveaux */}
      <div className="relative flex items-center justify-between px-4">
        {/* Ligne de fond */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-midnight-700" />
        
        {/* Points des niveaux */}
        {levels.map((level, index) => {
          const isPast = index < currentLevelIndex
          const isCurrent = index === currentLevelIndex
          const config = LEVELS_CONFIG[level]
          
          return (
            <div key={level} className="relative flex flex-col items-center">
              <motion.div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center relative z-10',
                  isPast && 'bg-amber-500/20 border border-amber-500/50',
                  isCurrent && 'bg-aurora-500/20 border-2 border-aurora-400',
                  !isPast && !isCurrent && 'bg-midnight-800 border border-midnight-600'
                )}
                animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <StarIcon 
                  filled={isPast || isCurrent} 
                  size="sm"
                />
              </motion.div>
              <span className={cn(
                'mt-2 text-xs',
                isCurrent ? 'text-aurora-300 font-medium' : 'text-midnight-500'
              )}>
                {config.name[locale]}
              </span>
            </div>
          )
        })}
      </div>
      
      {/* Mission en cours */}
      <div className="bg-midnight-800/30 rounded-xl p-5 border border-midnight-700/50">
        <h2 className="text-sm text-midnight-400 mb-3">{t.currentMission}</h2>
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-aurora-500/10 flex items-center justify-center">
            <span className="text-2xl">{currentKey.id === 'style' ? '🎨' : currentKey.id === 'hero' ? '👤' : currentKey.id === 'mood' ? '💫' : currentKey.id === 'world' ? '🌍' : '✨'}</span>
          </div>
          
          <div className="flex-1">
            <h3 className="font-medium text-white mb-1">{currentKey.name[locale]}</h3>
            <p className="text-sm text-midnight-400 mb-3">{currentKey.tip[locale]}</p>
            
            {/* Progression de la clé */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-midnight-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-aurora-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(keyProgress / 5) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-xs text-midnight-400">{keyProgress}/5 {t.images}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Les 5 Clés */}
      <div>
        <h2 className="text-sm text-midnight-400 mb-4">{t.keys}</h2>
        
        <div className="grid grid-cols-5 gap-3">
          {(['style', 'hero', 'mood', 'world', 'magic'] as MagicKey[]).map((keyId) => {
            const key = MAGIC_KEYS_CONFIG[keyId]
            const isUnlocked = promptingProgress.unlockedKeys.includes(keyId)
            const isCurrent = promptingProgress.currentKeyLearning === keyId
            const progress = promptingProgress.keyProgress[keyId]
            
            const icons = {
              style: '🎨',
              hero: '👤',
              mood: '💫',
              world: '🌍',
              magic: '✨',
            }
            
            return (
              <motion.div
                key={keyId}
                className={cn(
                  'relative p-3 rounded-xl text-center transition-all',
                  isUnlocked && 'bg-amber-500/10 border border-amber-500/30',
                  isCurrent && !isUnlocked && 'bg-aurora-500/10 border border-aurora-500/30',
                  !isUnlocked && !isCurrent && 'bg-midnight-800/30 border border-midnight-700/30'
                )}
                whileHover={{ scale: 1.05 }}
              >
                {/* Icône */}
                <div className="text-2xl mb-2">{icons[keyId]}</div>
                
                {/* Nom */}
                <p className={cn(
                  'text-xs font-medium mb-2',
                  isUnlocked ? 'text-amber-300' : isCurrent ? 'text-aurora-300' : 'text-midnight-500'
                )}>
                  {key.name[locale]}
                </p>
                
                {/* Étoile ou progression */}
                {isUnlocked ? (
                  <StarIcon filled size="lg" />
                ) : (
                  <div className="flex justify-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          i < progress ? 'bg-aurora-400' : 'bg-midnight-600'
                        )}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
      
      {/* Stats discrètes */}
      <div className="flex justify-center gap-8 text-center text-xs text-midnight-500">
        <div>
          <span className="text-white font-medium">{promptingProgress.xp}</span> XP
        </div>
        <div>
          <span className="text-white font-medium">{promptingProgress.totalImages}</span> {t.images}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPOSANT : Feedback après génération d'image
// ============================================================================

interface ImageFeedbackProps {
  keysUsed: MagicKey[]
  xpGained: number
  locale?: 'fr' | 'en' | 'ru'
}

export function ImageFeedback({ keysUsed, xpGained, locale = 'fr' }: ImageFeedbackProps) {
  if (keysUsed.length === 0 && xpGained === 0) return null
  
  const labels = {
    fr: 'Tu as utilisé',
    en: 'You used',
    ru: 'Ты использовал',
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between text-xs text-midnight-400 mt-3 pt-3 border-t border-midnight-700/30"
    >
      <div className="flex items-center gap-2">
        {keysUsed.length > 0 && (
          <>
            <span>{labels[locale]}:</span>
            {keysUsed.map(key => (
              <span key={key} className="text-aurora-300">
                {MAGIC_KEYS_CONFIG[key].name[locale]}
              </span>
            ))}
          </>
        )}
      </div>
      
      {xpGained > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1"
        >
          <StarIcon filled size="sm" />
          <span className="text-amber-400">+{xpGained}</span>
        </motion.div>
      )}
    </motion.div>
  )
}

// ============================================================================
// EXPORT PAR DÉFAUT (legacy)
// ============================================================================

export default function PromptingProgress() {
  return <FullProgress />
}
