'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
} from 'lucide-react'
import {
  type CreationType,
  type MagicKey,
  IMAGE_MAGIC_KEYS,
  VIDEO_MAGIC_KEYS,
} from '@/store/useStudioProgressStore'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n/context'

// Options prédéfinies pour chaque clé
const KEY_OPTIONS: Record<string, Array<{ value: string; labelKey: string; emoji?: string }>> = {
  // IMAGES
  'image-style': [
    { value: 'digital art', labelKey: 'magicKeys.options.imageStyle.digitalArt', emoji: '🖼️' },
    { value: 'watercolor painting', labelKey: 'magicKeys.options.imageStyle.watercolor', emoji: '🎨' },
    { value: 'anime style', labelKey: 'magicKeys.options.imageStyle.anime', emoji: '✨' },
    { value: '3D render', labelKey: 'magicKeys.options.imageStyle.3d', emoji: '🎮' },
    { value: 'pencil sketch', labelKey: 'magicKeys.options.imageStyle.pencil', emoji: '✏️' },
    { value: 'oil painting', labelKey: 'magicKeys.options.imageStyle.oil', emoji: '🖌️' },
    { value: 'pixel art', labelKey: 'magicKeys.options.imageStyle.pixel', emoji: '👾' },
    { value: 'photograph', labelKey: 'magicKeys.options.imageStyle.photo', emoji: '📷' },
    { value: 'fairy tale illustration', labelKey: 'magicKeys.options.imageStyle.fairyTale', emoji: '🧚' },
    { value: 'storybook illustration', labelKey: 'magicKeys.options.imageStyle.storybook', emoji: '📚' },
  ],
  'image-hero': [
    { value: 'a brave princess', labelKey: 'magicKeys.options.imageHero.princess', emoji: '👸' },
    { value: 'a friendly dragon', labelKey: 'magicKeys.options.imageHero.dragon', emoji: '🐉' },
    { value: 'a magical unicorn', labelKey: 'magicKeys.options.imageHero.unicorn', emoji: '🦄' },
    { value: 'a clever fox', labelKey: 'magicKeys.options.imageHero.fox', emoji: '🦊' },
    { value: 'a little fairy', labelKey: 'magicKeys.options.imageHero.fairy', emoji: '🧚' },
    { value: 'a young adventurer girl', labelKey: 'magicKeys.options.imageHero.adventurer', emoji: '🗺️' },
    { value: 'a wise owl', labelKey: 'magicKeys.options.imageHero.owl', emoji: '🦉' },
    { value: 'a playful cat', labelKey: 'magicKeys.options.imageHero.cat', emoji: '🐱' },
  ],
  'image-mood': [
    { value: 'magical and dreamy', labelKey: 'magicKeys.options.imageMood.magical', emoji: '✨' },
    { value: 'warm and cozy', labelKey: 'magicKeys.options.imageMood.warm', emoji: '🌅' },
    { value: 'mysterious and enchanting', labelKey: 'magicKeys.options.imageMood.mysterious', emoji: '🌙' },
    { value: 'bright and cheerful', labelKey: 'magicKeys.options.imageMood.bright', emoji: '☀️' },
    { value: 'soft and peaceful', labelKey: 'magicKeys.options.imageMood.soft', emoji: '🌸' },
    { value: 'adventurous and exciting', labelKey: 'magicKeys.options.imageMood.adventurous', emoji: '⚡' },
    { value: 'whimsical and playful', labelKey: 'magicKeys.options.imageMood.whimsical', emoji: '🎪' },
  ],
  'image-world': [
    { value: 'enchanted forest', labelKey: 'magicKeys.options.imageWorld.forest', emoji: '🌲' },
    { value: 'floating castle in the clouds', labelKey: 'magicKeys.options.imageWorld.castle', emoji: '🏰' },
    { value: 'underwater kingdom', labelKey: 'magicKeys.options.imageWorld.underwater', emoji: '🌊' },
    { value: 'magical garden', labelKey: 'magicKeys.options.imageWorld.garden', emoji: '🌺' },
    { value: 'starry night sky', labelKey: 'magicKeys.options.imageWorld.stars', emoji: '🌌' },
    { value: 'cozy treehouse', labelKey: 'magicKeys.options.imageWorld.treehouse', emoji: '🏠' },
    { value: 'crystal cave', labelKey: 'magicKeys.options.imageWorld.cave', emoji: '💎' },
    { value: 'rainbow meadow', labelKey: 'magicKeys.options.imageWorld.meadow', emoji: '🌈' },
  ],
  'image-magic': [
    { value: 'glowing sparkles everywhere', labelKey: 'magicKeys.options.imageMagic.sparkles', emoji: '✨' },
    { value: 'rainbow colors', labelKey: 'magicKeys.options.imageMagic.rainbow', emoji: '🌈' },
    { value: 'floating petals', labelKey: 'magicKeys.options.imageMagic.petals', emoji: '🌸' },
    { value: 'golden light beams', labelKey: 'magicKeys.options.imageMagic.golden', emoji: '💫' },
    { value: 'magical aurora', labelKey: 'magicKeys.options.imageMagic.aurora', emoji: '🌌' },
    { value: 'butterflies dancing', labelKey: 'magicKeys.options.imageMagic.butterflies', emoji: '🦋' },
    { value: 'glitter dust', labelKey: 'magicKeys.options.imageMagic.glitter', emoji: '⭐' },
  ],

  // VIDÉOS
  'video-style': [
    { value: 'cinematic', labelKey: 'magicKeys.options.videoStyle.cinematic', emoji: '🎬' },
    { value: 'anime animation', labelKey: 'magicKeys.options.videoStyle.anime', emoji: '✨' },
    { value: 'dreamy and soft', labelKey: 'magicKeys.options.videoStyle.dreamy', emoji: '☁️' },
    { value: '3D animated', labelKey: 'magicKeys.options.videoStyle.3d', emoji: '🎮' },
    { value: 'painterly', labelKey: 'magicKeys.options.videoStyle.painterly', emoji: '🎨' },
    { value: 'stop motion', labelKey: 'magicKeys.options.videoStyle.stopMotion', emoji: '🎯' },
  ],
  'video-action': [
    { value: 'flying through the sky', labelKey: 'magicKeys.options.videoAction.flying', emoji: '🦅' },
    { value: 'dancing gracefully', labelKey: 'magicKeys.options.videoAction.dancing', emoji: '💃' },
    { value: 'walking slowly', labelKey: 'magicKeys.options.videoAction.walking', emoji: '🚶' },
    { value: 'running through a field', labelKey: 'magicKeys.options.videoAction.running', emoji: '🏃' },
    { value: 'swimming underwater', labelKey: 'magicKeys.options.videoAction.swimming', emoji: '🏊' },
    { value: 'spinning around', labelKey: 'magicKeys.options.videoAction.spinning', emoji: '🌀' },
    { value: 'floating gently', labelKey: 'magicKeys.options.videoAction.floating', emoji: '🎈' },
    { value: 'jumping happily', labelKey: 'magicKeys.options.videoAction.jumping', emoji: '⬆️' },
  ],
  'video-mood': [
    { value: 'magical and dreamy', labelKey: 'magicKeys.options.videoMood.magical', emoji: '✨' },
    { value: 'peaceful and calm', labelKey: 'magicKeys.options.videoMood.peaceful', emoji: '🌅' },
    { value: 'exciting and dynamic', labelKey: 'magicKeys.options.videoMood.exciting', emoji: '⚡' },
    { value: 'mysterious', labelKey: 'magicKeys.options.videoMood.mysterious', emoji: '🌙' },
    { value: 'joyful and bright', labelKey: 'magicKeys.options.videoMood.joyful', emoji: '☀️' },
    { value: 'romantic', labelKey: 'magicKeys.options.videoMood.romantic', emoji: '💖' },
  ],
  'video-rhythm': [
    { value: 'slow and gentle', labelKey: 'magicKeys.options.videoRhythm.slow', emoji: '🐢' },
    { value: 'medium speed', labelKey: 'magicKeys.options.videoRhythm.medium', emoji: '🚶' },
    { value: 'fast and energetic', labelKey: 'magicKeys.options.videoRhythm.fast', emoji: '🚀' },
    { value: 'gradually accelerating', labelKey: 'magicKeys.options.videoRhythm.accelerating', emoji: '📈' },
    { value: 'slow motion', labelKey: 'magicKeys.options.videoRhythm.slowMotion', emoji: '🎬' },
  ],
  'video-effect': [
    { value: 'sparkles and particles', labelKey: 'magicKeys.options.videoEffect.sparkles', emoji: '✨' },
    { value: 'soft lens flare', labelKey: 'magicKeys.options.videoEffect.lensFlare', emoji: '💫' },
    { value: 'camera zoom in', labelKey: 'magicKeys.options.videoEffect.zoomIn', emoji: '🔍' },
    { value: 'camera pan', labelKey: 'magicKeys.options.videoEffect.pan', emoji: '📹' },
    { value: 'blur to sharp', labelKey: 'magicKeys.options.videoEffect.blurToSharp', emoji: '🎯' },
    { value: 'color fade', labelKey: 'magicKeys.options.videoEffect.colorFade', emoji: '🌈' },
  ],
}

interface MagicKeyCardProps {
  magicKey: MagicKey
  type: CreationType
  value: string
  onChange: (value: string) => void
  unlocked: boolean
  expanded: boolean
  onToggle: () => void
}

function MagicKeyCard({
  magicKey,
  type,
  value,
  onChange,
  unlocked,
  expanded,
  onToggle,
}: MagicKeyCardProps) {
  const t = useTranslations('studio')
  const optionsKey = `${type}-${magicKey.id}`
  const options = KEY_OPTIONS[optionsKey] || []

  return (
    <motion.div
      className={cn(
        'rounded-2xl border transition-all overflow-hidden',
        unlocked 
          ? 'bg-midnight-800/50 border-midnight-700 hover:border-aurora-500/30' 
          : 'bg-midnight-900/30 border-midnight-800/50 opacity-60'
      )}
      layout
    >
      {/* Header */}
      <button
        onClick={onToggle}
        disabled={!unlocked}
        className={cn(
          'w-full flex items-center gap-3 p-4 text-left transition-colors',
          unlocked ? 'hover:bg-midnight-700/30' : 'cursor-not-allowed'
        )}
      >
        <span className="text-2xl">{magicKey.emoji}</span>
        <div className="flex-1">
          <h4 className="font-medium text-white text-sm flex items-center gap-2">
            {t(`magicKeyLabels.${type}.${magicKey.id}.name`)}
            {!unlocked && <span className="text-xs text-midnight-500">{t('magicKeys.comingSoon')}</span>}
          </h4>
          <p className="text-xs text-midnight-400">{t(`magicKeyLabels.${type}.${magicKey.id}.question`)}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Indicateur d'impact */}
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-1.5 h-3 rounded-full',
                  i < Math.ceil(magicKey.impact / 20)
                    ? 'bg-aurora-500'
                    : 'bg-midnight-700'
                )}
              />
            ))}
          </div>
          {unlocked && (
            expanded ? <ChevronUp className="w-4 h-4 text-midnight-400" /> : <ChevronDown className="w-4 h-4 text-midnight-400" />
          )}
        </div>
      </button>

      {/* Contenu étendu */}
      <AnimatePresence>
        {expanded && unlocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-midnight-700"
          >
            <div className="p-4">
              {/* Options prédéfinies */}
              <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm transition-colors',
                      value === option.value
                        ? 'bg-aurora-500 text-white'
                        : 'bg-midnight-700/50 text-midnight-300 hover:bg-midnight-700 hover:text-white'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {option.emoji && <span className="mr-1">{option.emoji}</span>}
                    {t(option.labelKey)}
                  </motion.button>
                ))}
              </div>

              {/* Input personnalisé */}
              <div className="mt-3">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={t('magicKeys.customPlaceholder')}
                  className="w-full px-4 py-2 rounded-xl bg-midnight-900/50 border border-midnight-700 text-white placeholder:text-midnight-500 text-sm focus:outline-none focus:border-aurora-500/50"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface StudioMagicKeysProps {
  type: CreationType
  level: number
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  className?: string
}

export function StudioMagicKeys({
  type,
  level,
  values,
  onChange,
  className,
}: StudioMagicKeysProps) {
  const t = useTranslations('studio')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  
  const magicKeys = type === 'image' ? IMAGE_MAGIC_KEYS : VIDEO_MAGIC_KEYS

  // Déterminer quelles clés sont débloquées selon le niveau
  const getUnlockedKeys = (): string[] => {
    // Niveau 1 : Style + Héros/Action
    // Niveau 2 : + Ambiance
    // Niveau 3 : + Monde/Rythme
    // Niveau 4+ : Tout
    const allKeys = magicKeys.map(k => k.id)
    
    if (level >= 4) return allKeys
    if (level === 3) return allKeys.slice(0, 4)
    if (level === 2) return allKeys.slice(0, 3)
    return allKeys.slice(0, 2)
  }

  const unlockedKeys = getUnlockedKeys()

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-aurora-400" />
          <h3 className="font-semibold text-white">{t('magicKeys.title')}</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-midnight-400">
          <Info className="w-3.5 h-3.5" />
          {t('magicKeys.unlockedCount', { unlocked: String(unlockedKeys.length), total: String(magicKeys.length) })}
        </div>
      </div>

      {/* Clés */}
      <div className="space-y-2">
        {magicKeys.map((key) => (
          <MagicKeyCard
            key={key.id}
            magicKey={key}
            type={type}
            value={values[key.id] || ''}
            onChange={(val) => onChange(key.id, val)}
            unlocked={unlockedKeys.includes(key.id)}
            expanded={expandedKey === key.id}
            onToggle={() => setExpandedKey(expandedKey === key.id ? null : key.id)}
          />
        ))}
      </div>

      {/* Message d'encouragement */}
      {unlockedKeys.length < magicKeys.length && (
        <motion.div
          className="flex items-center gap-2 p-3 rounded-xl bg-dream-500/10 border border-dream-500/20 text-sm text-dream-300"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span>🔓</span>
          <span>{t('magicKeys.unlockMore')}</span>
        </motion.div>
      )}
    </div>
  )
}
