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

// Options prédéfinies pour chaque clé
const KEY_OPTIONS: Record<string, Array<{ value: string; label: string; emoji?: string }>> = {
  // IMAGES
  'image-style': [
    { value: 'digital art', label: 'Dessin digital', emoji: '🖼️' },
    { value: 'watercolor painting', label: 'Aquarelle', emoji: '🎨' },
    { value: 'anime style', label: 'Anime/Manga', emoji: '✨' },
    { value: '3D render', label: '3D réaliste', emoji: '🎮' },
    { value: 'pencil sketch', label: 'Croquis crayon', emoji: '✏️' },
    { value: 'oil painting', label: 'Peinture à l\'huile', emoji: '🖌️' },
    { value: 'pixel art', label: 'Pixel art', emoji: '👾' },
    { value: 'photograph', label: 'Photo réaliste', emoji: '📷' },
    { value: 'fairy tale illustration', label: 'Conte de fées', emoji: '🧚' },
    { value: 'storybook illustration', label: 'Livre d\'enfant', emoji: '📚' },
  ],
  'image-hero': [
    { value: 'a brave princess', label: 'Une princesse courageuse', emoji: '👸' },
    { value: 'a friendly dragon', label: 'Un dragon amical', emoji: '🐉' },
    { value: 'a magical unicorn', label: 'Une licorne magique', emoji: '🦄' },
    { value: 'a clever fox', label: 'Un renard malin', emoji: '🦊' },
    { value: 'a little fairy', label: 'Une petite fée', emoji: '🧚' },
    { value: 'a young adventurer girl', label: 'Une aventurière', emoji: '🗺️' },
    { value: 'a wise owl', label: 'Un hibou sage', emoji: '🦉' },
    { value: 'a playful cat', label: 'Un chat joueur', emoji: '🐱' },
  ],
  'image-mood': [
    { value: 'magical and dreamy', label: 'Magique et rêveur', emoji: '✨' },
    { value: 'warm and cozy', label: 'Chaleureux', emoji: '🌅' },
    { value: 'mysterious and enchanting', label: 'Mystérieux', emoji: '🌙' },
    { value: 'bright and cheerful', label: 'Joyeux et lumineux', emoji: '☀️' },
    { value: 'soft and peaceful', label: 'Doux et paisible', emoji: '🌸' },
    { value: 'adventurous and exciting', label: 'Aventureux', emoji: '⚡' },
    { value: 'whimsical and playful', label: 'Fantaisiste', emoji: '🎪' },
  ],
  'image-world': [
    { value: 'enchanted forest', label: 'Forêt enchantée', emoji: '🌲' },
    { value: 'floating castle in the clouds', label: 'Château dans les nuages', emoji: '🏰' },
    { value: 'underwater kingdom', label: 'Royaume sous-marin', emoji: '🌊' },
    { value: 'magical garden', label: 'Jardin magique', emoji: '🌺' },
    { value: 'starry night sky', label: 'Ciel étoilé', emoji: '🌌' },
    { value: 'cozy treehouse', label: 'Cabane dans l\'arbre', emoji: '🏠' },
    { value: 'crystal cave', label: 'Grotte de cristal', emoji: '💎' },
    { value: 'rainbow meadow', label: 'Prairie arc-en-ciel', emoji: '🌈' },
  ],
  'image-magic': [
    { value: 'glowing sparkles everywhere', label: 'Étincelles partout', emoji: '✨' },
    { value: 'rainbow colors', label: 'Couleurs arc-en-ciel', emoji: '🌈' },
    { value: 'floating petals', label: 'Pétales volants', emoji: '🌸' },
    { value: 'golden light beams', label: 'Rayons dorés', emoji: '💫' },
    { value: 'magical aurora', label: 'Aurore magique', emoji: '🌌' },
    { value: 'butterflies dancing', label: 'Papillons dansants', emoji: '🦋' },
    { value: 'glitter dust', label: 'Poussière de fée', emoji: '⭐' },
  ],

  // VIDÉOS
  'video-style': [
    { value: 'cinematic', label: 'Cinématique', emoji: '🎬' },
    { value: 'anime animation', label: 'Anime', emoji: '✨' },
    { value: 'dreamy and soft', label: 'Rêveur et doux', emoji: '☁️' },
    { value: '3D animated', label: '3D animé', emoji: '🎮' },
    { value: 'painterly', label: 'Peint', emoji: '🎨' },
    { value: 'stop motion', label: 'Stop motion', emoji: '🎯' },
  ],
  'video-action': [
    { value: 'flying through the sky', label: 'Vole dans le ciel', emoji: '🦅' },
    { value: 'dancing gracefully', label: 'Danse avec grâce', emoji: '💃' },
    { value: 'walking slowly', label: 'Marche doucement', emoji: '🚶' },
    { value: 'running through a field', label: 'Court dans un champ', emoji: '🏃' },
    { value: 'swimming underwater', label: 'Nage sous l\'eau', emoji: '🏊' },
    { value: 'spinning around', label: 'Tourne sur soi', emoji: '🌀' },
    { value: 'floating gently', label: 'Flotte doucement', emoji: '🎈' },
    { value: 'jumping happily', label: 'Saute joyeusement', emoji: '⬆️' },
  ],
  'video-mood': [
    { value: 'magical and dreamy', label: 'Magique et rêveur', emoji: '✨' },
    { value: 'peaceful and calm', label: 'Paisible et calme', emoji: '🌅' },
    { value: 'exciting and dynamic', label: 'Excitant et dynamique', emoji: '⚡' },
    { value: 'mysterious', label: 'Mystérieux', emoji: '🌙' },
    { value: 'joyful and bright', label: 'Joyeux et lumineux', emoji: '☀️' },
    { value: 'romantic', label: 'Romantique', emoji: '💖' },
  ],
  'video-rhythm': [
    { value: 'slow and gentle', label: 'Lent et doux', emoji: '🐢' },
    { value: 'medium speed', label: 'Vitesse normale', emoji: '🚶' },
    { value: 'fast and energetic', label: 'Rapide et énergique', emoji: '🚀' },
    { value: 'gradually accelerating', label: 'Qui accélère', emoji: '📈' },
    { value: 'slow motion', label: 'Ralenti', emoji: '🎬' },
  ],
  'video-effect': [
    { value: 'sparkles and particles', label: 'Étincelles et particules', emoji: '✨' },
    { value: 'soft lens flare', label: 'Reflets lumineux', emoji: '💫' },
    { value: 'camera zoom in', label: 'Zoom avant', emoji: '🔍' },
    { value: 'camera pan', label: 'Panoramique', emoji: '📹' },
    { value: 'blur to sharp', label: 'Flou vers net', emoji: '🎯' },
    { value: 'color fade', label: 'Transition de couleur', emoji: '🌈' },
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
            {magicKey.name}
            {!unlocked && <span className="text-xs text-midnight-500">(bientôt !)</span>}
          </h4>
          <p className="text-xs text-midnight-400">{magicKey.question}</p>
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
                    {option.label}
                  </motion.button>
                ))}
              </div>

              {/* Input personnalisé */}
              <div className="mt-3">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="Ou écris ta propre idée..."
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
          <h3 className="font-semibold text-white">Les 5 Clés Magiques</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-midnight-400">
          <Info className="w-3.5 h-3.5" />
          {unlockedKeys.length}/{magicKeys.length} débloquées
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
          <span>Continue à créer pour débloquer plus de clés !</span>
        </motion.div>
      )}
    </div>
  )
}
