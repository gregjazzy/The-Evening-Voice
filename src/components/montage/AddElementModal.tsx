'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMontageStore, type TimeRange } from '@/store/useMontageStore'
import { useStudioStore, type ImportedAsset } from '@/store/useStudioStore'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { cn } from '@/lib/utils'
import {
  X,
  Video,
  Image,
  Music,
  Volume2,
  Lightbulb,
  Sparkles,
  Type,
  Upload,
  Plus,
  Check,
  Search,
  Loader2,
  Wind,
  Play,
  Pause,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { 
  ALL_SOUNDS, 
  MUSIC_SOUNDS, 
  AMBIANCE_SOUNDS, 
  EFFECT_SOUNDS,
  CATEGORY_LABELS,
  MOOD_LABELS,
  THEME_LABELS,
  type Sound,
  type SoundCategory as RealSoundCategory,
  type SoundMood,
  type SoundTheme,
} from '@/lib/sounds'

// =============================================================================
// TYPES
// =============================================================================

type ElementType = 'media' | 'music' | 'sound' | 'light' | 'decoration' | 'animation' | 'effect'

interface AddElementModalProps {
  isOpen: boolean
  onClose: () => void
  elementType: ElementType
}

// =============================================================================
// DÉCORATIONS DISPONIBLES
// =============================================================================

const DECORATIONS = [
  // Émojis populaires
  { id: 'star', type: 'emoji', emoji: '⭐', name: 'Étoile' },
  { id: 'heart', type: 'emoji', emoji: '❤️', name: 'Cœur' },
  { id: 'sparkles', type: 'emoji', emoji: '✨', name: 'Étincelles' },
  { id: 'moon', type: 'emoji', emoji: '🌙', name: 'Lune' },
  { id: 'sun', type: 'emoji', emoji: '☀️', name: 'Soleil' },
  { id: 'rainbow', type: 'emoji', emoji: '🌈', name: 'Arc-en-ciel' },
  { id: 'cloud', type: 'emoji', emoji: '☁️', name: 'Nuage' },
  { id: 'butterfly', type: 'emoji', emoji: '🦋', name: 'Papillon' },
  { id: 'flower', type: 'emoji', emoji: '🌸', name: 'Fleur' },
  { id: 'leaf', type: 'emoji', emoji: '🍃', name: 'Feuille' },
  { id: 'tree', type: 'emoji', emoji: '🌳', name: 'Arbre' },
  { id: 'mushroom', type: 'emoji', emoji: '🍄', name: 'Champignon' },
  { id: 'crown', type: 'emoji', emoji: '👑', name: 'Couronne' },
  { id: 'gem', type: 'emoji', emoji: '💎', name: 'Diamant' },
  { id: 'magic', type: 'emoji', emoji: '🪄', name: 'Baguette' },
  { id: 'fairy', type: 'emoji', emoji: '🧚', name: 'Fée' },
  { id: 'unicorn', type: 'emoji', emoji: '🦄', name: 'Licorne' },
  { id: 'dragon', type: 'emoji', emoji: '🐉', name: 'Dragon' },
  { id: 'castle', type: 'emoji', emoji: '🏰', name: 'Château' },
  { id: 'book', type: 'emoji', emoji: '📖', name: 'Livre' },
]

// =============================================================================
// FILTRES PAR THÈME POUR EFFETS SONORES
// =============================================================================

const EFFECT_THEME_FILTERS = [
  { id: null, label: 'Tous', emoji: '🎵', count: 70 },
  { id: 'superheros', label: 'Super-Héros', emoji: '🦸', count: 36 },
  { id: 'animaux', label: 'Animaux', emoji: '🐾', count: 18 },
  { id: 'nature', label: 'Nature', emoji: '🌿', count: 15 },
  { id: 'combat', label: 'Combat', emoji: '⚔️', count: 14 },
  { id: 'humain', label: 'Humain', emoji: '👤', count: 9 },
  { id: 'objets', label: 'Objets', emoji: '📦', count: 6 },
  { id: 'feerique', label: 'Féerique', emoji: '✨', count: 5 },
]

// =============================================================================
// EFFETS SONORES PAR CATÉGORIE (ANCIEN)
// =============================================================================

type SoundCategory = 'animaux' | 'humains' | 'meteo' | 'nature' | 'magie' | 'ambiance' | 'actions'

interface SoundEffect {
  id: string
  name: string
  emoji: string
  type: 'sfx' | 'ambiance' | 'loop'
}

const SOUND_CATEGORIES: Record<SoundCategory, { label: string; emoji: string; sounds: SoundEffect[] }> = {
  animaux: {
    label: 'Animaux',
    emoji: '🐾',
    sounds: [
      // Oiseaux
      { id: 'birds-singing', name: 'Oiseaux chantent', emoji: '🐦', type: 'ambiance' },
      { id: 'owl', name: 'Chouette/Hibou', emoji: '🦉', type: 'sfx' },
      { id: 'crow', name: 'Corbeau', emoji: '🐦‍⬛', type: 'sfx' },
      { id: 'nightingale', name: 'Rossignol', emoji: '🐦', type: 'ambiance' },
      { id: 'seagulls', name: 'Mouettes', emoji: '🕊️', type: 'ambiance' },
      { id: 'rooster', name: 'Coq', emoji: '🐓', type: 'sfx' },
      // Sauvages
      { id: 'wolf-howl', name: 'Loup hurle', emoji: '🐺', type: 'sfx' },
      { id: 'bear-growl', name: 'Ours grogne', emoji: '🐻', type: 'sfx' },
      { id: 'lion-roar', name: 'Lion rugit', emoji: '🦁', type: 'sfx' },
      { id: 'snake-hiss', name: 'Serpent siffle', emoji: '🐍', type: 'sfx' },
      { id: 'elephant', name: 'Éléphant barrit', emoji: '🐘', type: 'sfx' },
      { id: 'monkey', name: 'Singe crie', emoji: '🐒', type: 'sfx' },
      // Domestiques
      { id: 'cat-purr', name: 'Chat ronronne', emoji: '😺', type: 'ambiance' },
      { id: 'cat-meow', name: 'Chat miaule', emoji: '🐱', type: 'sfx' },
      { id: 'dog-bark', name: 'Chien aboie', emoji: '🐕', type: 'sfx' },
      { id: 'dog-whine', name: 'Chien gémit', emoji: '🐶', type: 'sfx' },
      { id: 'horse-neigh', name: 'Cheval hennit', emoji: '🐴', type: 'sfx' },
      { id: 'horse-gallop', name: 'Galop de cheval', emoji: '🏇', type: 'loop' },
      { id: 'sheep', name: 'Mouton bêle', emoji: '🐑', type: 'sfx' },
      { id: 'cow', name: 'Vache meugle', emoji: '🐄', type: 'sfx' },
      // Petites bêtes
      { id: 'frog', name: 'Grenouille', emoji: '🐸', type: 'sfx' },
      { id: 'crickets', name: 'Grillons/Cigales', emoji: '🦗', type: 'ambiance' },
      { id: 'bees', name: 'Abeilles', emoji: '🐝', type: 'ambiance' },
      { id: 'mosquito', name: 'Moustique', emoji: '🦟', type: 'sfx' },
      { id: 'mouse-squeak', name: 'Souris couine', emoji: '🐭', type: 'sfx' },
      // Fantastiques
      { id: 'dragon-growl', name: 'Dragon grogne', emoji: '🐉', type: 'sfx' },
      { id: 'dragon-roar', name: 'Dragon rugit', emoji: '🔥', type: 'sfx' },
      { id: 'unicorn', name: 'Licorne', emoji: '🦄', type: 'sfx' },
      { id: 'fairy-flutter', name: 'Fée volète', emoji: '🧚', type: 'sfx' },
      { id: 'creature-mystery', name: 'Créature mystérieuse', emoji: '👾', type: 'sfx' },
    ],
  },
  humains: {
    label: 'Humains',
    emoji: '👶',
    sounds: [
      // Rires
      { id: 'child-laugh', name: 'Rire enfant', emoji: '😄', type: 'sfx' },
      { id: 'happy-laugh', name: 'Rire joyeux', emoji: '😊', type: 'sfx' },
      { id: 'giggle', name: 'Petit rire', emoji: '🤭', type: 'sfx' },
      { id: 'lol', name: 'Fou rire', emoji: '🤣', type: 'sfx' },
      { id: 'evil-laugh', name: 'Rire maléfique', emoji: '😈', type: 'sfx' },
      // Émotions
      { id: 'crying', name: 'Pleurs', emoji: '😢', type: 'sfx' },
      { id: 'sigh', name: 'Soupir', emoji: '😮‍💨', type: 'sfx' },
      { id: 'gasp', name: 'Cri de surprise', emoji: '😱', type: 'sfx' },
      { id: 'ohhh', name: '"Ohhh!"', emoji: '😮', type: 'sfx' },
      { id: 'wow', name: '"Wow!"', emoji: '🤩', type: 'sfx' },
      { id: 'ahhh', name: '"Ahhh!" (peur)', emoji: '😨', type: 'sfx' },
      { id: 'phew', name: '"Ouf!" (soulagement)', emoji: '😌', type: 'sfx' },
      // Foule
      { id: 'applause', name: 'Applaudissements', emoji: '👏', type: 'sfx' },
      { id: 'cheering', name: 'Acclamations', emoji: '🎉', type: 'sfx' },
      { id: 'whispers', name: 'Chuchotements', emoji: '🤫', type: 'ambiance' },
      { id: 'murmurs', name: 'Murmures', emoji: '💭', type: 'ambiance' },
      { id: 'crowd-chatter', name: 'Foule bavarde', emoji: '👥', type: 'ambiance' },
      // Voix
      { id: 'yawn', name: 'Bâillement', emoji: '🥱', type: 'sfx' },
      { id: 'sneeze', name: 'Éternuement', emoji: '🤧', type: 'sfx' },
      { id: 'hiccup', name: 'Hoquet', emoji: '😯', type: 'sfx' },
      { id: 'snoring', name: 'Ronflements', emoji: '😴', type: 'ambiance' },
      { id: 'heartbeat', name: 'Battement cœur', emoji: '💓', type: 'loop' },
    ],
  },
  meteo: {
    label: 'Météo',
    emoji: '🌦️',
    sounds: [
      { id: 'wind-light', name: 'Vent léger', emoji: '🌬️', type: 'ambiance' },
      { id: 'wind-strong', name: 'Vent fort', emoji: '💨', type: 'ambiance' },
      { id: 'wind-howling', name: 'Bourrasque', emoji: '🌪️', type: 'ambiance' },
      { id: 'rain-light', name: 'Pluie douce', emoji: '🌧️', type: 'ambiance' },
      { id: 'rain-heavy', name: 'Pluie battante', emoji: '⛈️', type: 'ambiance' },
      { id: 'rain-window', name: 'Pluie sur vitre', emoji: '🪟', type: 'ambiance' },
      { id: 'thunder', name: 'Tonnerre', emoji: '⚡', type: 'sfx' },
      { id: 'thunder-rumble', name: 'Tonnerre grondant', emoji: '🌩️', type: 'sfx' },
      { id: 'storm', name: 'Orage complet', emoji: '⛈️', type: 'ambiance' },
      { id: 'snow-crunch', name: 'Neige crissante', emoji: '❄️', type: 'sfx' },
      { id: 'hail', name: 'Grêle', emoji: '🌨️', type: 'ambiance' },
      { id: 'blizzard', name: 'Blizzard', emoji: '🌬️', type: 'ambiance' },
    ],
  },
  nature: {
    label: 'Nature',
    emoji: '🌿',
    sounds: [
      { id: 'forest-calm', name: 'Forêt calme', emoji: '🌲', type: 'ambiance' },
      { id: 'jungle', name: 'Jungle', emoji: '🌴', type: 'ambiance' },
      { id: 'ocean-waves', name: 'Vagues océan', emoji: '🌊', type: 'ambiance' },
      { id: 'river', name: 'Rivière', emoji: '🏞️', type: 'ambiance' },
      { id: 'waterfall', name: 'Cascade', emoji: '💧', type: 'ambiance' },
      { id: 'stream', name: 'Ruisseau', emoji: '🌊', type: 'ambiance' },
      { id: 'campfire', name: 'Feu de camp', emoji: '🔥', type: 'ambiance' },
      { id: 'fire-crackling', name: 'Feu qui crépite', emoji: '🪵', type: 'ambiance' },
      { id: 'leaves-rustle', name: 'Feuilles au vent', emoji: '🍃', type: 'ambiance' },
      { id: 'branches-crack', name: 'Branches craquent', emoji: '🌳', type: 'sfx' },
      { id: 'underwater', name: 'Sous l\'eau', emoji: '🫧', type: 'ambiance' },
      { id: 'cave-drip', name: 'Gouttes grotte', emoji: '🕳️', type: 'ambiance' },
    ],
  },
  magie: {
    label: 'Magie',
    emoji: '✨',
    sounds: [
      { id: 'magic-sparkle', name: 'Étincelle magique', emoji: '✨', type: 'sfx' },
      { id: 'magic-whoosh', name: 'Whoosh magique', emoji: '💫', type: 'sfx' },
      { id: 'magic-pop', name: 'Pop!', emoji: '💥', type: 'sfx' },
      { id: 'spell-cast', name: 'Sort lancé', emoji: '🪄', type: 'sfx' },
      { id: 'transformation', name: 'Transformation', emoji: '🔮', type: 'sfx' },
      { id: 'appear', name: 'Apparition', emoji: '👻', type: 'sfx' },
      { id: 'disappear', name: 'Disparition', emoji: '💨', type: 'sfx' },
      { id: 'magic-chime', name: 'Carillon magique', emoji: '🔔', type: 'sfx' },
      { id: 'bells', name: 'Clochettes', emoji: '🎐', type: 'sfx' },
      { id: 'mystic-energy', name: 'Énergie mystique', emoji: '⚡', type: 'ambiance' },
      { id: 'portal', name: 'Portail', emoji: '🌀', type: 'sfx' },
      { id: 'enchant', name: 'Enchantement', emoji: '💎', type: 'sfx' },
      { id: 'fairy-dust', name: 'Poussière de fée', emoji: '🧚', type: 'sfx' },
      { id: 'crystal', name: 'Cristal résonne', emoji: '💠', type: 'sfx' },
    ],
  },
  ambiance: {
    label: 'Ambiance',
    emoji: '🏠',
    sounds: [
      { id: 'night-calm', name: 'Nuit calme', emoji: '🌙', type: 'ambiance' },
      { id: 'day-peaceful', name: 'Jour paisible', emoji: '☀️', type: 'ambiance' },
      { id: 'village', name: 'Village animé', emoji: '🏘️', type: 'ambiance' },
      { id: 'market', name: 'Marché', emoji: '🛒', type: 'ambiance' },
      { id: 'party', name: 'Fête/Célébration', emoji: '🎊', type: 'ambiance' },
      { id: 'castle-quiet', name: 'Château silencieux', emoji: '🏰', type: 'ambiance' },
      { id: 'dungeon', name: 'Donjon sombre', emoji: '⛓️', type: 'ambiance' },
      { id: 'cave', name: 'Grotte', emoji: '🕳️', type: 'ambiance' },
      { id: 'space', name: 'Espace', emoji: '🚀', type: 'ambiance' },
      { id: 'clock-tick', name: 'Horloge tic-tac', emoji: '🕰️', type: 'loop' },
      { id: 'church-bells', name: 'Cloches église', emoji: '⛪', type: 'sfx' },
      { id: 'tavern', name: 'Taverne', emoji: '🍺', type: 'ambiance' },
    ],
  },
  actions: {
    label: 'Actions',
    emoji: '🎬',
    sounds: [
      // Pas
      { id: 'footsteps-grass', name: 'Pas sur herbe', emoji: '🌱', type: 'loop' },
      { id: 'footsteps-stone', name: 'Pas sur pierre', emoji: '🪨', type: 'loop' },
      { id: 'footsteps-wood', name: 'Pas sur bois', emoji: '🪵', type: 'loop' },
      { id: 'footsteps-snow', name: 'Pas sur neige', emoji: '❄️', type: 'loop' },
      { id: 'running', name: 'Course', emoji: '🏃', type: 'loop' },
      // Portes & objets
      { id: 'door-open', name: 'Porte s\'ouvre', emoji: '🚪', type: 'sfx' },
      { id: 'door-close', name: 'Porte se ferme', emoji: '🚪', type: 'sfx' },
      { id: 'door-creak', name: 'Porte grince', emoji: '😱', type: 'sfx' },
      { id: 'key-lock', name: 'Clé dans serrure', emoji: '🔑', type: 'sfx' },
      { id: 'chest-open', name: 'Coffre s\'ouvre', emoji: '📦', type: 'sfx' },
      { id: 'page-turn', name: 'Page qui tourne', emoji: '📖', type: 'sfx' },
      { id: 'book-close', name: 'Livre se ferme', emoji: '📕', type: 'sfx' },
      // Impacts
      { id: 'sword-draw', name: 'Épée dégainée', emoji: '⚔️', type: 'sfx' },
      { id: 'sword-clash', name: 'Épées s\'entrechoquent', emoji: '🗡️', type: 'sfx' },
      { id: 'arrow', name: 'Flèche tirée', emoji: '🏹', type: 'sfx' },
      { id: 'fall', name: 'Chute', emoji: '💥', type: 'sfx' },
      { id: 'splash', name: 'Plouf!', emoji: '💦', type: 'sfx' },
      { id: 'explosion', name: 'Explosion', emoji: '💣', type: 'sfx' },
      { id: 'glass-break', name: 'Verre brisé', emoji: '🔨', type: 'sfx' },
    ],
  },
}

// =============================================================================
// MUSIQUES
// =============================================================================

const MUSIC_TRACKS = [
  { id: 'lullaby', name: 'Berceuse douce', type: 'background' },
  { id: 'adventure', name: 'Aventure épique', type: 'theme' },
  { id: 'mystery', name: 'Mystère', type: 'theme' },
  { id: 'happy', name: 'Joyeux', type: 'background' },
  { id: 'magical', name: 'Féérique', type: 'theme' },
  { id: 'peaceful', name: 'Paisible', type: 'background' },
  { id: 'dramatic', name: 'Dramatique', type: 'theme' },
  { id: 'playful', name: 'Espiègle', type: 'loop' },
]

// =============================================================================
// EFFETS TEXTE
// =============================================================================

const TEXT_EFFECTS = [
  { id: 'highlight', name: 'Surbrillance', type: 'highlight', color: '#FFD700' },
  { id: 'glow', name: 'Lueur', type: 'glow', color: '#00FFFF' },
  { id: 'shake', name: 'Tremblement', type: 'shake' },
  { id: 'scale', name: 'Zoom', type: 'scale' },
  { id: 'fadeIn', name: 'Apparition', type: 'fadeIn' },
]

// =============================================================================
// ANIMATIONS - Effets visuels (plein écran et localisés)
// =============================================================================

type AnimCategory = 'fullscreen' | 'localized'

interface AnimationTemplate {
  id: string
  name: string
  emoji: string
  type: string
  color: string
  category: AnimCategory
  description?: string
}

// Effets PLEIN ÉCRAN (ambiance générale)
const FULLSCREEN_ANIMATIONS: AnimationTemplate[] = [
  { id: 'falling-stars', name: 'Étoiles filantes', emoji: '⭐', type: 'falling-stars', color: '#FFD700', category: 'fullscreen', description: 'Étoiles qui tombent du ciel' },
  { id: 'floating-hearts', name: 'Cœurs flottants', emoji: '❤️', type: 'floating-hearts', color: '#FF6B6B', category: 'fullscreen', description: 'Cœurs qui flottent dans l\'air' },
  { id: 'sparkles', name: 'Étincelles', emoji: '✨', type: 'sparkles', color: '#FFFFFF', category: 'fullscreen', description: 'Étincelles partout' },
  { id: 'bubbles', name: 'Bulles', emoji: '🫧', type: 'bubbles', color: '#87CEEB', category: 'fullscreen', description: 'Bulles qui montent' },
  { id: 'snow', name: 'Neige', emoji: '❄️', type: 'snow', color: '#FFFFFF', category: 'fullscreen', description: 'Flocons de neige' },
  { id: 'leaves', name: 'Feuilles d\'automne', emoji: '🍂', type: 'leaves', color: '#D2691E', category: 'fullscreen', description: 'Feuilles qui tombent' },
  { id: 'fireflies', name: 'Lucioles', emoji: '🌟', type: 'fireflies', color: '#FFFF00', category: 'fullscreen', description: 'Lucioles dans la nuit' },
  { id: 'confetti', name: 'Confettis', emoji: '🎊', type: 'confetti', color: '#FF69B4', category: 'fullscreen', description: 'Confettis de fête' },
  { id: 'rain', name: 'Pluie', emoji: '🌧️', type: 'rain', color: '#4682B4', category: 'fullscreen', description: 'Gouttes de pluie' },
  { id: 'clouds', name: 'Nuages', emoji: '☁️', type: 'clouds', color: '#FFFFFF', category: 'fullscreen', description: 'Nuages qui passent' },
  { id: 'magic-dust', name: 'Poussière magique', emoji: '🪄', type: 'magic-dust', color: '#DA70D6', category: 'fullscreen', description: 'Poussière enchantée' },
  { id: 'butterflies', name: 'Papillons', emoji: '🦋', type: 'butterflies', color: '#FF69B4', category: 'fullscreen', description: 'Papillons volants' },
  { id: 'petals', name: 'Pétales de fleurs', emoji: '🌸', type: 'petals', color: '#FFB6C1', category: 'fullscreen', description: 'Pétales roses qui tombent' },
  { id: 'feathers', name: 'Plumes', emoji: '🪶', type: 'feathers', color: '#FFFFFF', category: 'fullscreen', description: 'Plumes qui flottent' },
  { id: 'fairy-dust', name: 'Poussière de fée', emoji: '🧚', type: 'fairy-dust', color: '#FFD700', category: 'fullscreen', description: 'Poussière dorée magique' },
]

// Effets LOCALISÉS (point d'origine, comme baguette magique)
const LOCALIZED_ANIMATIONS: AnimationTemplate[] = [
  { id: 'magic-wand', name: 'Baguette magique', emoji: '🪄', type: 'magic-wand', color: '#FFD700', category: 'localized', description: 'Étoiles sortant d\'un point' },
  { id: 'heart-burst', name: 'Explosion de cœurs', emoji: '💕', type: 'heart-burst', color: '#FF6B6B', category: 'localized', description: 'Cœurs qui explosent' },
  { id: 'star-burst', name: 'Explosion d\'étoiles', emoji: '🌟', type: 'star-burst', color: '#FFD700', category: 'localized', description: 'Étoiles qui jaillissent' },
  { id: 'sparkle-trail', name: 'Traînée d\'étincelles', emoji: '✨', type: 'sparkle-trail', color: '#FFFFFF', category: 'localized', description: 'Traînée brillante' },
  { id: 'love-float', name: 'Cœurs qui s\'envolent', emoji: '💖', type: 'love-float', color: '#FF69B4', category: 'localized', description: 'Cœurs qui montent d\'un point' },
  { id: 'magic-swirl', name: 'Tourbillon magique', emoji: '🌀', type: 'magic-swirl', color: '#DA70D6', category: 'localized', description: 'Spirale enchantée' },
  { id: 'pixie-dust', name: 'Poussière de pixie', emoji: '💫', type: 'pixie-dust', color: '#E6E6FA', category: 'localized', description: 'Poussière de fée locale' },
  { id: 'golden-sparkle', name: 'Étincelles dorées', emoji: '⭐', type: 'golden-sparkle', color: '#FFD700', category: 'localized', description: 'Scintillements dorés' },
  { id: 'rainbow-burst', name: 'Arc-en-ciel', emoji: '🌈', type: 'rainbow-burst', color: '#FF6B6B', category: 'localized', description: 'Explosion arc-en-ciel' },
  { id: 'fairy-circle', name: 'Cercle de fées', emoji: '🧚‍♀️', type: 'fairy-circle', color: '#DA70D6', category: 'localized', description: 'Cercle de lumière féerique' },
  { id: 'wish-stars', name: 'Étoiles de vœux', emoji: '🌠', type: 'wish-stars', color: '#87CEEB', category: 'localized', description: 'Étoiles qui montent au ciel' },
  { id: 'kiss-hearts', name: 'Bisous', emoji: '😘', type: 'kiss-hearts', color: '#FF69B4', category: 'localized', description: 'Cœurs qui partent en bisou' },
  { id: 'magic-portal', name: 'Portail magique', emoji: '🔮', type: 'magic-portal', color: '#9400D3', category: 'localized', description: 'Portail tourbillonnant' },
  { id: 'enchanted-glow', name: 'Lueur enchantée', emoji: '💡', type: 'enchanted-glow', color: '#FFFACD', category: 'localized', description: 'Halo lumineux' },
  { id: 'twinkle-cluster', name: 'Scintillements', emoji: '🌟', type: 'twinkle-cluster', color: '#FFFFFF', category: 'localized', description: 'Groupe d\'étoiles qui brillent' },
]

// Toutes les animations
const ALL_ANIMATIONS = [...FULLSCREEN_ANIMATIONS, ...LOCALIZED_ANIMATIONS]

// =============================================================================
// COULEURS DE LUMIÈRE
// =============================================================================

const LIGHT_PRESETS = [
  { id: 'warm', name: 'Chaleureux', color: '#FFB347', intensity: 80 },
  { id: 'cool', name: 'Frais', color: '#87CEEB', intensity: 70 },
  { id: 'magic', name: 'Magique', color: '#DA70D6', intensity: 60 },
  { id: 'sunset', name: 'Coucher de soleil', color: '#FF6B6B', intensity: 75 },
  { id: 'forest', name: 'Forêt', color: '#228B22', intensity: 50 },
  { id: 'night', name: 'Nuit', color: '#191970', intensity: 30 },
  { id: 'golden', name: 'Doré', color: '#FFD700', intensity: 85 },
  { id: 'soft', name: 'Doux', color: '#FFEFD5', intensity: 60 },
]

// =============================================================================
// COMPOSANT MODAL
// =============================================================================

export function AddElementModal({ isOpen, onClose, elementType }: AddElementModalProps) {
  const { 
    getCurrentScene,
    getSceneDuration,
    addMediaTrack,
    addMusicTrack,
    addSoundTrack,
    addLightTrack,
    addDecorationTrack,
    addAnimationTrack,
    addTextEffect,
  } = useMontageStore()
  
  // 🎨 Récupérer les assets importés depuis le Studio
  const { importedAssets } = useStudioStore()
  
  // Filtrer pour n'avoir que les images et vidéos du Studio avec une URL valide
  const studioMediaAssets = importedAssets.filter(
    (asset) => 
      (asset.type === 'image' || asset.type === 'video') &&
      (asset.cloudUrl || asset.url) // Doit avoir au moins une URL
  )
  
  const { upload, isUploading } = useMediaUpload()
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [soundCategory, setSoundCategory] = useState<SoundCategory>('animaux')
  const [animCategory, setAnimCategory] = useState<AnimCategory>('localized') // Par défaut: localisé
  
  // 🎵 État pour la bibliothèque de sons réels
  const [realSoundCategory, setRealSoundCategory] = useState<RealSoundCategory>('music')
  const [soundMoodFilter, setSoundMoodFilter] = useState<SoundMood | null>(null)
  const [effectThemeFilter, setEffectThemeFilter] = useState<string | null>(null) // Filtre par thème
  const [playingSound, setPlayingSound] = useState<string | null>(null)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)
  
  const scene = getCurrentScene()
  const duration = getSceneDuration() || 10

  // Créer un TimeRange par défaut
  const createTimeRange = (startPercent = 0, durationPercent = 30): TimeRange => ({
    startTime: (startPercent / 100) * duration,
    endTime: ((startPercent + durationPercent) / 100) * duration,
    fadeIn: 0.3,
    fadeOut: 0.3,
  })

  // Ajouter un média (image/vidéo) depuis un fichier uploadé
  const handleAddMedia = async (file: File) => {
    if (!scene) return
    
    const isVideo = file.type.startsWith('video/')
    const result = await upload(file, { type: isVideo ? 'video' : 'image' })
    
    if (result?.url) {
      addMediaTrack({
        type: isVideo ? 'video' : 'image',
        url: result.url,
        name: file.name,
        timeRange: createTimeRange(0, 50),
        position: { x: 50, y: 50, width: 80, height: 60 },
        zIndex: (scene.mediaTracks?.length || 0) + 1,
        loop: isVideo,
        muted: false,
      })
      onClose()
    }
  }

  // 🎨 Ajouter un asset depuis le Studio
  const handleAddStudioAsset = (asset: ImportedAsset) => {
    if (!scene) return
    
    const isVideo = asset.type === 'video'
    
    // Utiliser l'URL cloud si disponible (permanente), sinon l'URL locale (temporaire)
    const mediaUrl = asset.cloudUrl || asset.url
    
    addMediaTrack({
      type: isVideo ? 'video' : 'image',
      url: mediaUrl,
      name: asset.name,
      timeRange: createTimeRange(0, 50),
      position: { x: 50, y: 50, width: 80, height: 60 },
      zIndex: (scene.mediaTracks?.length || 0) + 1,
      loop: isVideo,
      muted: false,
    })
    onClose()
  }

  // 🎵 Prévisualiser un son réel
  const handlePlaySound = (sound: Sound) => {
    // Si on clique sur le même son qui joue → PAUSE
    if (playingSound === sound.id) {
      if (audioRef) {
        audioRef.pause()
        audioRef.currentTime = 0
      }
      setPlayingSound(null)
      setAudioRef(null)
      return
    }
    
    // Arrêter le son précédent si différent
    if (audioRef) {
      audioRef.pause()
      audioRef.currentTime = 0
    }
    
    // Créer et jouer le nouveau son
    const audio = new Audio(sound.file)
    audio.volume = 0.5
    
    // Gérer les événements
    audio.onended = () => {
      setPlayingSound(null)
      setAudioRef(null)
    }
    audio.onerror = (e) => {
      console.error('❌ Erreur lecture audio:', sound.file, e)
      setPlayingSound(null)
      setAudioRef(null)
    }
    
    // Jouer directement
    audio.play()
      .then(() => {
        console.log('🎵 Lecture:', sound.name)
      })
      .catch((err) => {
        console.error('❌ Erreur play():', err)
        setPlayingSound(null)
        setAudioRef(null)
      })
    
    setAudioRef(audio)
    setPlayingSound(sound.id)
  }

  // Ajouter une musique (VRAIS FICHIERS)
  const handleAddRealMusic = (sound: Sound) => {
    // Arrêter la prévisualisation
    if (audioRef) {
      audioRef.pause()
      setPlayingSound(null)
    }
    
    addMusicTrack({
      url: sound.file,
      name: sound.name,
      type: 'background',
      timeRange: createTimeRange(0, 100), // Toute la scène par défaut
      volume: 0.5,
      loop: true,
      fadeIn: 1,
      fadeOut: 1,
    })
    onClose()
  }

  // Ajouter une ambiance (VRAIS FICHIERS)
  const handleAddRealAmbiance = (sound: Sound) => {
    if (audioRef) {
      audioRef.pause()
      setPlayingSound(null)
    }
    
    addSoundTrack({
      url: sound.file,
      name: sound.name,
      type: 'ambiance',
      timeRange: createTimeRange(0, 100),
      volume: 0.4,
      loop: true,
    })
    onClose()
  }

  // Ajouter un effet sonore (VRAIS FICHIERS)
  const handleAddRealEffect = (sound: Sound) => {
    if (audioRef) {
      audioRef.pause()
      setPlayingSound(null)
    }
    
    addSoundTrack({
      url: sound.file,
      name: sound.name,
      type: 'sfx',
      timeRange: createTimeRange(10, 20),
      volume: 0.7,
      loop: false,
    })
    onClose()
  }

  // Ajouter une musique (ancien système - placeholder)
  const handleAddMusic = (musicId: string) => {
    const music = MUSIC_TRACKS.find(m => m.id === musicId)
    if (!music) return
    
    addMusicTrack({
      url: `/audio/music/${musicId}.mp3`, // URL placeholder
      name: music.name,
      type: music.type as any,
      timeRange: createTimeRange(0, 100), // Toute la scène par défaut
      volume: 0.5,
      loop: true,
      fadeIn: 1,
      fadeOut: 1,
    })
    onClose()
  }

  // Ajouter une lumière
  const handleAddLight = (presetId: string) => {
    const preset = LIGHT_PRESETS.find(p => p.id === presetId)
    if (!preset) return
    
    addLightTrack({
      timeRange: createTimeRange(0, 100),
      color: preset.color,
      intensity: preset.intensity,
    })
    onClose()
  }

  // Ajouter une décoration
  const handleAddDecoration = (decoId: string) => {
    const deco = DECORATIONS.find(d => d.id === decoId)
    if (!deco) return
    
    addDecorationTrack({
      type: deco.type as any,
      emoji: deco.emoji,
      name: deco.name,
      timeRange: createTimeRange(20, 40),
      position: {
        x: 50,
        y: 50,
        width: 10,
        height: 10,
        rotation: 0,
      },
      animation: {
        type: 'pulse',
        duration: 1,
      },
      zIndex: 10,
    })
    onClose()
  }

  // Ajouter une animation
  const handleAddAnimation = (animId: string) => {
    const anim = ALL_ANIMATIONS.find(a => a.id === animId)
    if (!anim) return
    
    // Configuration de base
    const baseConfig = {
      type: anim.type as any,
      name: anim.name,
      category: anim.category,
      timeRange: createTimeRange(0, anim.category === 'fullscreen' ? 100 : 50), // Localisé: plus court
      intensity: 50,
      color: anim.color,
      size: 'medium' as const,
      glow: anim.category === 'localized', // Lueur pour les effets localisés
    }
    
    // Pour les effets localisés, ajouter une position au centre
    if (anim.category === 'localized') {
      addAnimationTrack({
        ...baseConfig,
        position: {
          x: 50, // Centre horizontal
          y: 50, // Centre vertical
          radius: 25, // Rayon 25%
        },
        direction: 'radial', // Direction radiale pour les explosions
      })
    } else {
      addAnimationTrack({
        ...baseConfig,
        direction: anim.type === 'rain' || anim.type === 'snow' || anim.type === 'leaves' ? 'down' : 'random',
      })
    }
    onClose()
  }

  // Ajouter un effet texte
  const handleAddTextEffect = (effectId: string) => {
    const effect = TEXT_EFFECTS.find(e => e.id === effectId)
    if (!effect) return
    
    addTextEffect({
      type: effect.type as any,
      phraseIndex: -1, // Toutes les phrases
      timeRange: createTimeRange(0, 100),
      color: effect.color,
      intensity: 80,
    })
    onClose()
  }

  // Configuration par type
  const config = {
    media: {
      title: 'Ajouter une image ou vidéo',
      icon: <Video className="w-6 h-6" />,
      color: 'text-blue-400',
    },
    music: {
      title: 'Ajouter une musique',
      icon: <Music className="w-6 h-6" />,
      color: 'text-emerald-400',
    },
    sound: {
      title: 'Ajouter un son',
      icon: <Volume2 className="w-6 h-6" />,
      color: 'text-pink-400',
    },
    light: {
      title: 'Ajouter une lumière',
      icon: <Lightbulb className="w-6 h-6" />,
      color: 'text-yellow-400',
    },
    decoration: {
      title: 'Ajouter une décoration',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'text-orange-400',
    },
    animation: {
      title: 'Ajouter une animation',
      icon: <Wind className="w-6 h-6" />,
      color: 'text-cyan-400',
    },
    effect: {
      title: 'Ajouter un effet texte',
      icon: <Type className="w-6 h-6" />,
      color: 'text-purple-400',
    },
  }

  const currentConfig = config[elementType]

  if (!isOpen) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-2xl mx-4 max-h-[80vh] bg-gradient-to-br from-midnight-900 via-midnight-950 to-black rounded-3xl border border-aurora-500/30 shadow-2xl overflow-hidden"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* En-tête */}
          <div className="p-6 border-b border-midnight-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg bg-midnight-800', currentConfig.color)}>
                  {currentConfig.icon}
                </div>
                <h2 className="text-xl font-display text-white">
                  {currentConfig.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-midnight-800 text-midnight-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Média (Studio + upload) */}
            {elementType === 'media' && (
              <div className="space-y-6">
                {/* 🎨 Section Assets du Studio */}
                {studioMediaAssets.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-aurora-400" />
                      <h3 className="text-sm font-medium text-aurora-300">
                        Assets du Studio ({studioMediaAssets.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3 max-h-[200px] overflow-y-auto pr-2">
                      {studioMediaAssets.map((asset) => (
                        <motion.button
                          key={asset.id}
                          onClick={() => handleAddStudioAsset(asset)}
                          className="group relative aspect-video rounded-lg overflow-hidden border-2 border-midnight-700 hover:border-aurora-500 transition-all bg-midnight-800"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {asset.type === 'video' ? (
                            <video
                              src={asset.cloudUrl || asset.url}
                              className="absolute inset-0 w-full h-full object-cover"
                              muted
                            />
                          ) : (
                            <img
                              src={asset.cloudUrl || asset.url}
                              alt={asset.name}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          )}
                          {/* Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          {/* Badge type */}
                          <div className="absolute top-1 right-1">
                            {asset.type === 'video' ? (
                              <Video className="w-4 h-4 text-blue-400 drop-shadow" />
                            ) : (
                              <Image className="w-4 h-4 text-green-400 drop-shadow" />
                            )}
                          </div>
                          {/* Nom */}
                          <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-xs text-white truncate font-medium">
                              {asset.name}
                            </p>
                            <p className="text-[10px] text-aurora-300 capitalize">
                              {asset.source}
                            </p>
                          </div>
                          {/* Icône + au survol */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-aurora-500/80 flex items-center justify-center">
                              <Plus className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    <p className="text-xs text-midnight-500 text-center">
                      Clique sur un asset pour l'ajouter à la scène
                    </p>
                  </div>
                )}

                {/* Séparateur si des assets Studio existent */}
                {studioMediaAssets.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-midnight-700" />
                    <span className="text-xs text-midnight-500">ou</span>
                    <div className="flex-1 h-px bg-midnight-700" />
                  </div>
                )}

                {/* Upload nouveau fichier */}
                <label className="block">
                  <div className="border-2 border-dashed border-midnight-600 rounded-xl p-8 text-center hover:border-blue-500/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleAddMedia(file)
                      }}
                    />
                    {isUploading ? (
                      <Loader2 className="w-12 h-12 mx-auto text-blue-400 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-12 h-12 mx-auto text-midnight-500 mb-3" />
                        <p className="text-midnight-400">
                          Clique ou glisse une image/vidéo ici
                        </p>
                        <p className="text-xs text-midnight-600 mt-2">
                          JPG, PNG, GIF, MP4, WEBM
                        </p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            )}

            {/* Musique - VRAIE BIBLIOTHÈQUE */}
            {elementType === 'music' && (
              <div className="space-y-4">
                {/* Barre de recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-500" />
                  <input
                    type="text"
                    placeholder="Rechercher une musique..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white placeholder-midnight-500 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>

                {/* Info */}
                <p className="text-xs text-midnight-400 text-center">
                  🎵 {MUSIC_SOUNDS.length} musiques disponibles • Clique sur ▶️ pour écouter
                </p>

                {/* Grille de musiques */}
                <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-2">
                  {MUSIC_SOUNDS
                    .filter(s => searchQuery === '' || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((sound) => (
                    <motion.div
                      key={sound.id}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all flex items-center gap-3',
                        'border-midnight-700 bg-midnight-800/50 hover:border-emerald-500/50'
                      )}
                      whileHover={{ scale: 1.01 }}
                    >
                      {/* Bouton play */}
                      <button
                        onClick={() => handlePlaySound(sound)}
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0',
                          playingSound === sound.id
                            ? 'bg-emerald-500 text-white'
                            : 'bg-midnight-700 text-emerald-400 hover:bg-emerald-500/30'
                        )}
                      >
                        {playingSound === sound.id ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" />
                        )}
                      </button>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{sound.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg">{sound.emoji}</span>
                          <div className="flex flex-wrap gap-1">
                            {sound.moods.slice(0, 2).map(mood => (
                              <span key={mood} className="text-[10px] px-1.5 py-0.5 rounded bg-midnight-700 text-midnight-300">
                                {MOOD_LABELS[mood]?.emoji} {MOOD_LABELS[mood]?.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Bouton ajouter */}
                      <button
                        onClick={() => handleAddRealMusic(sound)}
                        className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2 flex-shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Ajouter</span>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Sons - VRAIE BIBLIOTHÈQUE (Ambiances + Effets) */}
            {elementType === 'sound' && (
              <div className="space-y-4">
                {/* Onglets Ambiances / Effets */}
                <div className="flex gap-2 p-1 bg-midnight-800/50 rounded-lg">
                  <button
                    onClick={() => setRealSoundCategory('ambiance')}
                    className={cn(
                      'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                      realSoundCategory === 'ambiance'
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                        : 'text-midnight-400 hover:text-white'
                    )}
                  >
                    <span className="mr-2">🌧️</span>
                    Ambiances
                    <span className="text-xs ml-2 opacity-70">({AMBIANCE_SOUNDS.length})</span>
                  </button>
                  <button
                    onClick={() => setRealSoundCategory('effect')}
                    className={cn(
                      'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                      realSoundCategory === 'effect'
                        ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg'
                        : 'text-midnight-400 hover:text-white'
                    )}
                  >
                    <span className="mr-2">💥</span>
                    Effets Sonores
                    <span className="text-xs ml-2 opacity-70">({EFFECT_SOUNDS.length})</span>
                  </button>
                </div>

                {/* Filtres par thème pour Effets Sonores */}
                {realSoundCategory === 'effect' && (
                  <div className="flex flex-wrap gap-1.5">
                    {EFFECT_THEME_FILTERS.map((filter) => (
                      <button
                        key={filter.id || 'all'}
                        onClick={() => setEffectThemeFilter(filter.id)}
                        className={cn(
                          'px-2 py-1 rounded-md text-xs font-medium transition-all',
                          effectThemeFilter === filter.id
                            ? 'bg-pink-500 text-white'
                            : 'bg-midnight-700/50 text-midnight-300 hover:bg-midnight-600'
                        )}
                      >
                        {filter.emoji} {filter.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Barre de recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-500" />
                  <input
                    type="text"
                    placeholder={realSoundCategory === 'ambiance' ? "Rechercher une ambiance..." : "Rechercher un effet..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white placeholder-midnight-500 focus:border-pink-500/50 focus:outline-none"
                  />
                </div>

                {/* Info */}
                <p className="text-xs text-midnight-400 text-center">
                  {realSoundCategory === 'ambiance' ? '🌧️' : '💥'} Clique sur ▶️ pour écouter, puis "Ajouter" pour l'utiliser
                </p>

                {/* Grille de sons */}
                <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto pr-2">
                  {(realSoundCategory === 'ambiance' ? AMBIANCE_SOUNDS : EFFECT_SOUNDS)
                    .filter(s => searchQuery === '' || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .filter(s => realSoundCategory !== 'effect' || !effectThemeFilter || s.themes.includes(effectThemeFilter as any))
                    .map((sound) => (
                    <motion.div
                      key={sound.id}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all flex items-center gap-3',
                        'border-midnight-700 bg-midnight-800/50',
                        realSoundCategory === 'ambiance' 
                          ? 'hover:border-cyan-500/50' 
                          : 'hover:border-pink-500/50'
                      )}
                      whileHover={{ scale: 1.01 }}
                    >
                      {/* Bouton play */}
                      <button
                        onClick={() => handlePlaySound(sound)}
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0',
                          playingSound === sound.id
                            ? realSoundCategory === 'ambiance' ? 'bg-cyan-500 text-white' : 'bg-pink-500 text-white'
                            : realSoundCategory === 'ambiance' 
                              ? 'bg-midnight-700 text-cyan-400 hover:bg-cyan-500/30'
                              : 'bg-midnight-700 text-pink-400 hover:bg-pink-500/30'
                        )}
                      >
                        {playingSound === sound.id ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" />
                        )}
                      </button>
                      
                      {/* Emoji + Info */}
                      <span className="text-2xl">{sound.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{sound.name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sound.themes.slice(0, 2).map(theme => (
                            <span key={theme} className="text-[10px] px-1.5 py-0.5 rounded bg-midnight-700 text-midnight-300">
                              {THEME_LABELS[theme]?.emoji} {THEME_LABELS[theme]?.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Bouton ajouter */}
                      <button
                        onClick={() => realSoundCategory === 'ambiance' 
                          ? handleAddRealAmbiance(sound) 
                          : handleAddRealEffect(sound)
                        }
                        className={cn(
                          'px-4 py-2 rounded-lg transition-all flex items-center gap-2 flex-shrink-0',
                          realSoundCategory === 'ambiance'
                            ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white'
                            : 'bg-pink-500/20 text-pink-400 hover:bg-pink-500 hover:text-white'
                        )}
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Ajouter</span>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Lumières */}
            {elementType === 'light' && (
              <div className="grid grid-cols-2 gap-3">
                {LIGHT_PRESETS.map((preset) => (
                  <motion.button
                    key={preset.id}
                    onClick={() => handleAddLight(preset.id)}
                    className={cn(
                      'p-4 rounded-xl border text-left transition-all',
                      'border-midnight-700 bg-midnight-800/50 hover:border-yellow-500/50'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full border-2 border-white/30"
                        style={{ backgroundColor: preset.color }}
                      />
                      <div>
                        <p className="font-medium text-white">{preset.name}</p>
                        <p className="text-xs text-midnight-400">{preset.intensity}% intensité</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Décorations */}
            {elementType === 'decoration' && (
              <div className="grid grid-cols-4 gap-3">
                {DECORATIONS.map((deco) => (
                  <motion.button
                    key={deco.id}
                    onClick={() => handleAddDecoration(deco.id)}
                    className={cn(
                      'p-4 rounded-xl border text-center transition-all',
                      'border-midnight-700 bg-midnight-800/50 hover:border-orange-500/50'
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-4xl block mb-2">{deco.emoji}</span>
                    <p className="text-xs text-midnight-400">{deco.name}</p>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Animations de fond */}
            {/* Animations - Effets visuels */}
            {elementType === 'animation' && (
              <div className="space-y-4">
                {/* Onglets de catégorie */}
                <div className="flex gap-2 p-1 bg-midnight-800/50 rounded-lg">
                  <button
                    onClick={() => setAnimCategory('localized')}
                    className={cn(
                      'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                      animCategory === 'localized'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                        : 'text-midnight-400 hover:text-white'
                    )}
                  >
                    <span className="mr-2">🪄</span>
                    Effets Magiques
                    <span className="text-xs ml-2 opacity-70">({LOCALIZED_ANIMATIONS.length})</span>
                  </button>
                  <button
                    onClick={() => setAnimCategory('fullscreen')}
                    className={cn(
                      'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                      animCategory === 'fullscreen'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                        : 'text-midnight-400 hover:text-white'
                    )}
                  >
                    <span className="mr-2">🌌</span>
                    Ambiance
                    <span className="text-xs ml-2 opacity-70">({FULLSCREEN_ANIMATIONS.length})</span>
                  </button>
                </div>
                
                {/* Description de la catégorie */}
                <p className="text-sm text-midnight-400 px-2">
                  {animCategory === 'localized' 
                    ? '✨ Ces effets apparaissent à un point précis (comme une baguette magique). Tu peux les déplacer sur l\'écran !'
                    : '🌠 Ces effets couvrent tout l\'écran pour créer une ambiance magique.'
                  }
                </p>
                
                {/* Grille d'animations */}
                <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
                  {(animCategory === 'localized' ? LOCALIZED_ANIMATIONS : FULLSCREEN_ANIMATIONS).map((anim) => (
                    <motion.button
                      key={anim.id}
                      onClick={() => handleAddAnimation(anim.id)}
                      className={cn(
                        'p-4 rounded-xl border text-center transition-all group relative overflow-hidden',
                        'border-midnight-700 bg-midnight-800/50',
                        animCategory === 'localized' 
                          ? 'hover:border-pink-500/50 hover:bg-pink-500/10' 
                          : 'hover:border-cyan-500/50 hover:bg-cyan-500/10'
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Effet de lueur au survol */}
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity rounded-xl"
                        style={{ 
                          background: `radial-gradient(circle at center, ${anim.color}40 0%, transparent 70%)` 
                        }}
                      />
                      
                      <span className="text-3xl block mb-2 relative z-10">{anim.emoji}</span>
                      <p className="text-sm font-medium text-white relative z-10">{anim.name}</p>
                      <p className="text-[10px] text-midnight-400 mt-1 relative z-10">{anim.description}</p>
                      <div 
                        className="w-4 h-4 rounded-full mx-auto mt-2 relative z-10 ring-2 ring-white/20"
                        style={{ backgroundColor: anim.color }}
                      />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Effets texte */}
            {elementType === 'effect' && (
              <div className="grid grid-cols-2 gap-3">
                {TEXT_EFFECTS.map((effect) => (
                  <motion.button
                    key={effect.id}
                    onClick={() => handleAddTextEffect(effect.id)}
                    className={cn(
                      'p-4 rounded-xl border text-left transition-all',
                      'border-midnight-700 bg-midnight-800/50 hover:border-purple-500/50'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <Type className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="font-medium text-white">{effect.name}</p>
                        <p className="text-xs text-midnight-400">{effect.type}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
