'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { 
  Feather, 
  Plus, 
  BookOpen, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Check,
  Image as ImageIcon,
  X,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  LayoutGrid,
  FileText,
  Book,
  ListTree,
  Folder,
  FolderPlus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Volume2,
  Mic,
  MicOff,
  Send,
  Type,
  Pencil,
  Move,
  Maximize2,
  RotateCw,
  Frame,
  Play,
  Pause,
  Video,
  Palette,
  ImagePlus,
  Layers,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  Gem,
  PartyPopper,
  Clapperboard,
  Edit3,
  Settings,
  Wand2,
  Download,
  Minus,
  AlertTriangle,
  Camera,
  Save,
  Loader2,
} from 'lucide-react'
import { useAppStore, type Story, type BookFormat } from '@/store/useAppStore'
import { useHighlightStore } from '@/store/useHighlightStore'
import { useTTS } from '@/hooks/useTTS'
import { STORY_TEMPLATES, type StoryStructure } from '@/lib/ai/prompting-pedagogy'
import { cn } from '@/lib/utils'
import { MediaPicker } from '@/components/editor/MediaPicker'
import { Highlightable } from '@/components/ui/Highlightable'
import { VoiceSelector } from '@/components/ui/VoiceSelector'
import { ModeIntroModal, useFirstVisit } from '@/components/ui/ModeIntroModal'
import { BOOK_FORMATS, type BookFormatConfig } from '@/store/usePublishStore'
import { useTranslations, useLocale } from '@/lib/i18n/context'
import { useSaveStatus, triggerManualSave } from '@/hooks/useSupabaseSync'
import { useAuthStore } from '@/store/useAuthStore'
import { notify } from '@/store/useNotificationStore'
import { CharacterImageCreator } from '@/components/studio/CharacterImageCreator'
import { usePdfExport } from '@/hooks/usePdfExport'
import { downloadPdf as downloadPdfFile } from '@/lib/export/pdfScreenCapture'

// ============================================================================
// TYPES
// ============================================================================

interface TextStyle {
  fontFamily: string
  fontSize: number // Taille en pixels (ex: 12, 14, 16, 18, 20...)
  color: string
  isBold: boolean
  isItalic: boolean
  textAlign: 'left' | 'center' | 'right'
  lineSpacing: 'tight' | 'normal' | 'relaxed' | number
}

interface ImagePosition {
  x: number      // Position X en pourcentage (0-100)
  y: number      // Position Y en pourcentage (0-100)
  width: number  // Largeur en pourcentage (10-100)
  height: number // Hauteur en pourcentage (10-100)
  rotation: number // Rotation en degrés (0-360)
}

// Styles d'image (filtres visuels)
type ImageStyle = 'normal' | 'sepia' | 'circle' | 'heart' | 'cloud' | 'sketch' | 'glow' | 'rounded' | 'neon' | 'vintage' | 'frost' | 'negative'

// Cadres décoratifs
type FrameStyle = 'none' | 'simple' | 'double' | 'ornate' | 'baroque' | 'wood' | 'polaroid' | 'tape' | 'golden' | 'shadow3d' | 'dotted' | 'romantic'

// Configuration des styles d'image
// Configuration des filtres d'image
const IMAGE_STYLES: { id: ImageStyle; name: string; emoji: string }[] = [
  { id: 'normal', name: 'Normal', emoji: '🖼️' },
  { id: 'sepia', name: 'Ancien', emoji: '🎞️' },
  { id: 'vintage', name: 'Rétro', emoji: '📻' },
  { id: 'circle', name: 'Bulle', emoji: '🔵' },
  { id: 'heart', name: 'Cœur', emoji: '❤️' },
  { id: 'cloud', name: 'Nuage', emoji: '☁️' },
  { id: 'rounded', name: 'Arrondi', emoji: '⬜' },
  { id: 'sketch', name: 'Croquis', emoji: '✏️' },
  { id: 'glow', name: 'Brillant', emoji: '✨' },
  { id: 'neon', name: 'Néon', emoji: '💜' },
  { id: 'frost', name: 'Glacé', emoji: '❄️' },
  { id: 'negative', name: 'Négatif', emoji: '🔳' },
]

// Configuration des cadres décoratifs
const FRAME_STYLES: { id: FrameStyle; name: string; emoji: string }[] = [
  { id: 'none', name: 'Aucun', emoji: '⬜' },
  { id: 'simple', name: 'Simple', emoji: '🔲' },
  { id: 'double', name: 'Double', emoji: '⏹️' },
  { id: 'dotted', name: 'Pointillé', emoji: '⚪' },
  { id: 'polaroid', name: 'Polaroid', emoji: '📷' },
  { id: 'tape', name: 'Scotché', emoji: '📌' },
  { id: 'wood', name: 'Bois', emoji: '🪵' },
  { id: 'golden', name: 'Doré', emoji: '👑' },
  { id: 'baroque', name: 'Baroque', emoji: '🏛️' },
  { id: 'ornate', name: 'Orné', emoji: '💎' },
  { id: 'romantic', name: 'Romantique', emoji: '🌹' },
  { id: 'shadow3d', name: '3D', emoji: '🎲' },
]

// Interface pour une image individuelle sur la page
type MediaType = 'image' | 'video'

interface PageMedia {
  id: string
  url: string
  type: MediaType  // Type de média (image ou vidéo)
  position: ImagePosition
  style: ImageStyle
  frame: FrameStyle
  zIndex: number  // Ordre de superposition (plus haut = devant)
  opacity?: number  // Opacité de 0.1 à 1 (défaut: 1)
}

// Couleurs de page disponibles
type PageColor = 'cream' | 'white' | 'aged' | 'parchment' | 'blue' | 'pink' | 'mint' | 'lavender' | 'peach' | 'sky'

const PAGE_COLORS: { id: PageColor; nameKey: string; bg: string; lines: string }[] = [
  { id: 'cream', nameKey: 'pageColors.cream', bg: 'bg-amber-50', lines: 'rgba(139, 115, 85, 0.15)' },
  { id: 'white', nameKey: 'pageColors.white', bg: 'bg-white', lines: 'rgba(100, 100, 100, 0.12)' },
  { id: 'aged', nameKey: 'pageColors.aged', bg: 'bg-amber-100', lines: 'rgba(139, 90, 43, 0.2)' },
  { id: 'parchment', nameKey: 'pageColors.parchment', bg: 'bg-orange-50', lines: 'rgba(180, 120, 60, 0.15)' },
  { id: 'blue', nameKey: 'pageColors.sky', bg: 'bg-blue-50', lines: 'rgba(59, 130, 246, 0.15)' },
  { id: 'pink', nameKey: 'pageColors.pink', bg: 'bg-pink-50', lines: 'rgba(236, 72, 153, 0.12)' },
  { id: 'mint', nameKey: 'pageColors.mint', bg: 'bg-emerald-50', lines: 'rgba(16, 185, 129, 0.12)' },
  { id: 'lavender', nameKey: 'pageColors.lavender', bg: 'bg-purple-50', lines: 'rgba(139, 92, 246, 0.12)' },
  { id: 'peach', nameKey: 'pageColors.peach', bg: 'bg-orange-100', lines: 'rgba(251, 146, 60, 0.15)' },
  { id: 'sky', nameKey: 'pageColors.sky', bg: 'bg-sky-50', lines: 'rgba(14, 165, 233, 0.12)' },
]

// Interface pour le fond de page (image ou vidéo)
interface BackgroundMedia {
  url: string
  type: MediaType  // 'image' ou 'video'
  opacity: number  // 0.1 à 1
  // Position et échelle (pour le mode édition)
  x?: number       // Décalage horizontal en %
  y?: number       // Décalage vertical en %
  scale?: number   // Échelle (1 = 100%, 1.5 = 150%, etc.)
}

// ============================================================================
// DÉCORATIONS PREMIUM - Ornements luxueux pour le livre
// ============================================================================

type DecorationCategory = 'gold' | 'floral' | 'royal' | 'celestial' | 'artistic' | 'frames'

interface DecorationItem {
  id: string
  name: string
  category: DecorationCategory
  svg: string  // SVG inline
  defaultScale?: number
  defaultColor?: string
}

interface PageDecoration {
  id: string
  decorationId: string
  position: { x: number; y: number }
  scale: number
  rotation: number
  color?: string  // Override couleur
  opacity: number
  flipH?: boolean
  flipV?: boolean
  // Effet de luminosité (glow)
  glowEnabled?: boolean
  glowColor?: string   // Couleur de la luminosité
  glowIntensity?: number  // Intensité de 0 à 100
}

// Interface pour une zone de texte flottante
interface PageTextBox {
  id: string
  content: string
  position: { x: number; y: number; width: number; height: number }
  style: {
    fontFamily: string
    fontSize: number
    color: string
    backgroundColor?: string
    backgroundOpacity?: number
    textAlign: 'left' | 'center' | 'right'
    isBold?: boolean
    isItalic?: boolean
    lineSpacing?: 'tight' | 'normal' | 'relaxed'
  }
  zIndex: number
  rotation?: number
}

// Collection de décorations premium
const PREMIUM_DECORATIONS: DecorationItem[] = [
  // === ORNEMENTS DORÉS ===
  {
    id: 'gold-corner-1',
    name: 'Coin Baroque',
    category: 'gold',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M0 0 Q50 0 50 50 Q50 25 25 25 Q0 25 0 0 M50 50 Q25 50 25 75 Q25 100 0 100 L0 75 Q25 75 25 50 Q25 25 50 25 Q75 25 75 50 Q75 75 50 75 L50 50" opacity="0.9"/><circle cx="35" cy="35" r="3"/><circle cx="15" cy="15" r="2"/><path d="M5 5 Q15 15 5 25" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'gold-corner-2',
    name: 'Coin Filigrane',
    category: 'gold',
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 95 C5 50 50 5 95 5"/><path d="M15 95 C15 55 55 15 95 15"/><path d="M5 85 C5 45 45 5 85 5"/><circle cx="95" cy="5" r="4" fill="currentColor"/><circle cx="5" cy="95" r="4" fill="currentColor"/><path d="M25 75 Q35 65 45 75 Q55 85 65 75" stroke-width="1.5"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'gold-divider-1',
    name: 'Séparateur Royal',
    category: 'gold',
    svg: `<svg viewBox="0 0 200 40" fill="currentColor"><path d="M0 20 H70 M130 20 H200" stroke="currentColor" stroke-width="1" fill="none"/><path d="M80 20 L90 10 L100 20 L90 30 Z"/><circle cx="100" cy="20" r="8"/><path d="M100 12 L100 8 M100 28 L100 32 M92 20 L88 20 M108 20 L112 20" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="70" cy="20" r="3"/><circle cx="130" cy="20" r="3"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'gold-ornament-1',
    name: 'Ornement Versailles',
    category: 'gold',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 5 C60 20 80 25 80 50 C80 75 60 80 50 95 C40 80 20 75 20 50 C20 25 40 20 50 5Z" opacity="0.3"/><path d="M50 15 C55 25 70 28 70 50 C70 72 55 75 50 85 C45 75 30 72 30 50 C30 28 45 25 50 15Z"/><circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="50" cy="50" r="3"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'gold-scroll-1',
    name: 'Volute Dorée',
    category: 'gold',
    svg: `<svg viewBox="0 0 100 60" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 30 Q10 10 30 10 Q50 10 50 30 Q50 50 70 50 Q90 50 90 30"/><path d="M15 30 Q15 15 30 15 Q45 15 45 30"/><circle cx="10" cy="30" r="4" fill="currentColor"/><circle cx="90" cy="30" r="4" fill="currentColor"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'gold-corner-3',
    name: 'Coin Art Nouveau',
    category: 'gold',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M5 5 Q5 50 50 50 Q50 5 5 5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 10 Q10 45 45 45 Q45 10 10 10" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><circle cx="27" cy="27" r="6"/><path d="M15 40 Q25 30 40 15" fill="none" stroke="currentColor" stroke-width="1"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'gold-divider-2',
    name: 'Séparateur Diamant',
    category: 'gold',
    svg: `<svg viewBox="0 0 200 30" fill="currentColor"><path d="M0 15 H80" stroke="currentColor" stroke-width="1" fill="none"/><path d="M120 15 H200" stroke="currentColor" stroke-width="1" fill="none"/><path d="M90 15 L100 5 L110 15 L100 25 Z"/><circle cx="80" cy="15" r="2"/><circle cx="120" cy="15" r="2"/><circle cx="70" cy="15" r="1.5" opacity="0.6"/><circle cx="130" cy="15" r="1.5" opacity="0.6"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'gold-divider-3',
    name: 'Ligne Florale',
    category: 'gold',
    svg: `<svg viewBox="0 0 200 40" fill="currentColor"><path d="M0 20 H70 M130 20 H200" stroke="currentColor" stroke-width="1" fill="none"/><circle cx="100" cy="20" r="10"/><circle cx="100" cy="20" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M80 20 Q85 10 90 20 Q85 30 80 20" opacity="0.7"/><path d="M120 20 Q115 10 110 20 Q115 30 120 20" opacity="0.7"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'gold-frame-corner',
    name: 'Coin Cadre Doré',
    category: 'gold',
    svg: `<svg viewBox="0 0 60 60" fill="currentColor"><path d="M5 55 L5 5 L55 5" fill="none" stroke="currentColor" stroke-width="3"/><path d="M10 50 L10 10 L50 10" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6"/><circle cx="5" cy="5" r="4"/><path d="M15 15 L25 15 M15 15 L15 25" stroke="currentColor" stroke-width="1.5"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'gold-medallion',
    name: 'Médaillon Antique',
    category: 'gold',
    svg: `<svg viewBox="0 0 80 80" fill="currentColor"><circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="40" cy="40" r="28" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="40" cy="40" r="20" opacity="0.3"/><circle cx="40" cy="40" r="8"/><path d="M40 12 L40 8 M40 68 L40 72 M12 40 L8 40 M68 40 L72 40" stroke="currentColor" stroke-width="2"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'gold-swirl',
    name: 'Spirale Élégante',
    category: 'gold',
    svg: `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2"><path d="M40 40 Q40 20 60 20 Q80 20 80 40 Q80 60 60 60 Q40 60 40 40 Q40 30 50 30 Q60 30 60 40 Q60 50 50 50 Q45 50 45 45"/><circle cx="45" cy="45" r="3" fill="currentColor"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'gold-laurel',
    name: 'Laurier Victorieux',
    category: 'gold',
    svg: `<svg viewBox="0 0 100 60" fill="currentColor"><path d="M50 55 L50 30" stroke="currentColor" stroke-width="2" fill="none"/><ellipse cx="35" cy="45" rx="8" ry="4" transform="rotate(-45 35 45)" opacity="0.8"/><ellipse cx="65" cy="45" rx="8" ry="4" transform="rotate(45 65 45)" opacity="0.8"/><ellipse cx="30" cy="35" rx="7" ry="3.5" transform="rotate(-50 30 35)" opacity="0.7"/><ellipse cx="70" cy="35" rx="7" ry="3.5" transform="rotate(50 70 35)" opacity="0.7"/><ellipse cx="28" cy="25" rx="6" ry="3" transform="rotate(-55 28 25)" opacity="0.6"/><ellipse cx="72" cy="25" rx="6" ry="3" transform="rotate(55 72 25)" opacity="0.6"/><circle cx="50" cy="10" r="5"/></svg>`,
    defaultColor: '#D4AF37',
  },

  // === FLORAUX ===
  {
    id: 'floral-rose-1',
    name: 'Rose Élégante',
    category: 'floral',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><ellipse cx="50" cy="45" rx="15" ry="12" opacity="0.3"/><ellipse cx="50" cy="50" rx="12" ry="10" opacity="0.5"/><ellipse cx="50" cy="53" rx="8" ry="7" opacity="0.7"/><ellipse cx="50" cy="55" rx="5" ry="4"/><path d="M50 62 Q50 75 45 90 M50 62 Q52 75 55 88" stroke="currentColor" fill="none" stroke-width="2"/><ellipse cx="38" cy="78" rx="8" ry="4" transform="rotate(-30 38 78)" opacity="0.6"/><ellipse cx="62" cy="76" rx="8" ry="4" transform="rotate(30 62 76)" opacity="0.6"/></svg>`,
    defaultColor: '#E8B4B8',
  },
  {
    id: 'floral-branch-1',
    name: 'Branche Fleurie',
    category: 'floral',
    svg: `<svg viewBox="0 0 150 60" fill="currentColor"><path d="M10 30 Q40 25 75 30 Q110 35 140 30" stroke="currentColor" fill="none" stroke-width="2"/><circle cx="30" cy="25" r="6" opacity="0.8"/><circle cx="55" cy="22" r="5" opacity="0.6"/><circle cx="80" cy="28" r="7"/><circle cx="105" cy="24" r="5" opacity="0.7"/><circle cx="125" cy="27" r="6" opacity="0.5"/><ellipse cx="40" cy="35" rx="6" ry="3" opacity="0.4"/><ellipse cx="95" cy="36" rx="5" ry="2.5" opacity="0.4"/></svg>`,
    defaultColor: '#F4A4BA',
  },
  {
    id: 'floral-wreath-1',
    name: 'Couronne Florale',
    category: 'floral',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="35" stroke="currentColor" fill="none" stroke-width="3" opacity="0.3"/><circle cx="50" cy="15" r="6"/><circle cx="85" cy="50" r="6"/><circle cx="50" cy="85" r="6"/><circle cx="15" cy="50" r="6"/><circle cx="75" cy="25" r="5" opacity="0.7"/><circle cx="75" cy="75" r="5" opacity="0.7"/><circle cx="25" cy="75" r="5" opacity="0.7"/><circle cx="25" cy="25" r="5" opacity="0.7"/><ellipse cx="62" cy="18" rx="4" ry="2" transform="rotate(45 62 18)" opacity="0.5"/><ellipse cx="82" cy="38" rx="4" ry="2" transform="rotate(-45 82 38)" opacity="0.5"/></svg>`,
    defaultColor: '#C9A8B4',
  },
  {
    id: 'floral-leaves-1',
    name: 'Feuillage Délicat',
    category: 'floral',
    svg: `<svg viewBox="0 0 120 80" fill="currentColor"><path d="M60 70 Q60 40 60 10" stroke="currentColor" fill="none" stroke-width="2"/><ellipse cx="45" cy="25" rx="15" ry="8" transform="rotate(-30 45 25)" opacity="0.7"/><ellipse cx="75" cy="25" rx="15" ry="8" transform="rotate(30 75 25)" opacity="0.7"/><ellipse cx="40" cy="45" rx="12" ry="6" transform="rotate(-20 40 45)" opacity="0.5"/><ellipse cx="80" cy="45" rx="12" ry="6" transform="rotate(20 80 45)" opacity="0.5"/><ellipse cx="50" cy="60" rx="8" ry="4" transform="rotate(-10 50 60)" opacity="0.3"/><ellipse cx="70" cy="60" rx="8" ry="4" transform="rotate(10 70 60)" opacity="0.3"/></svg>`,
    defaultColor: '#7BA17B',
  },
  {
    id: 'floral-lily-1',
    name: 'Lys Majestueux',
    category: 'floral',
    svg: `<svg viewBox="0 0 80 100" fill="currentColor"><path d="M40 95 Q40 70 40 50" stroke="currentColor" fill="none" stroke-width="2"/><ellipse cx="40" cy="35" rx="8" ry="20" opacity="0.9"/><ellipse cx="25" cy="40" rx="6" ry="18" transform="rotate(-25 25 40)" opacity="0.7"/><ellipse cx="55" cy="40" rx="6" ry="18" transform="rotate(25 55 40)" opacity="0.7"/><ellipse cx="15" cy="50" rx="5" ry="14" transform="rotate(-40 15 50)" opacity="0.5"/><ellipse cx="65" cy="50" rx="5" ry="14" transform="rotate(40 65 50)" opacity="0.5"/><circle cx="40" cy="25" r="4" opacity="0.8"/></svg>`,
    defaultColor: '#FFFFFF',
  },
  {
    id: 'floral-tulip-1',
    name: 'Tulipe Royale',
    category: 'floral',
    svg: `<svg viewBox="0 0 60 100" fill="currentColor"><path d="M30 95 Q30 60 30 45" stroke="currentColor" fill="none" stroke-width="2"/><ellipse cx="30" cy="30" rx="15" ry="25" opacity="0.8"/><ellipse cx="20" cy="35" rx="8" ry="18" transform="rotate(-15 20 35)" opacity="0.6"/><ellipse cx="40" cy="35" rx="8" ry="18" transform="rotate(15 40 35)" opacity="0.6"/><ellipse cx="25" cy="75" rx="10" ry="5" transform="rotate(-20 25 75)" opacity="0.4"/><ellipse cx="35" cy="80" rx="8" ry="4" transform="rotate(15 35 80)" opacity="0.4"/></svg>`,
    defaultColor: '#FF6B6B',
  },
  {
    id: 'floral-orchid-1',
    name: 'Orchidée Précieuse',
    category: 'floral',
    svg: `<svg viewBox="0 0 100 80" fill="currentColor"><ellipse cx="50" cy="40" rx="20" ry="15" opacity="0.4"/><ellipse cx="35" cy="35" rx="15" ry="10" transform="rotate(-30 35 35)" opacity="0.7"/><ellipse cx="65" cy="35" rx="15" ry="10" transform="rotate(30 65 35)" opacity="0.7"/><ellipse cx="50" cy="55" rx="12" ry="8" opacity="0.8"/><circle cx="50" cy="40" r="6"/><path d="M50 63 Q50 70 50 78" stroke="currentColor" fill="none" stroke-width="2"/></svg>`,
    defaultColor: '#DA70D6',
  },
  {
    id: 'floral-cherry-1',
    name: 'Fleur de Cerisier',
    category: 'floral',
    svg: `<svg viewBox="0 0 60 60" fill="currentColor"><circle cx="30" cy="20" r="8" opacity="0.7"/><circle cx="18" cy="32" r="8" opacity="0.7"/><circle cx="42" cy="32" r="8" opacity="0.7"/><circle cx="22" cy="46" r="8" opacity="0.7"/><circle cx="38" cy="46" r="8" opacity="0.7"/><circle cx="30" cy="35" r="5"/></svg>`,
    defaultColor: '#FFB7C5',
  },
  {
    id: 'floral-vine-1',
    name: 'Vigne Grimpante',
    category: 'floral',
    svg: `<svg viewBox="0 0 150 60" fill="currentColor"><path d="M10 50 Q40 20 70 40 Q100 60 130 30" stroke="currentColor" fill="none" stroke-width="2"/><ellipse cx="25" cy="35" rx="8" ry="5" transform="rotate(-30 25 35)" opacity="0.6"/><ellipse cx="55" cy="30" rx="7" ry="4" transform="rotate(20 55 30)" opacity="0.6"/><ellipse cx="85" cy="45" rx="8" ry="5" transform="rotate(-15 85 45)" opacity="0.6"/><ellipse cx="115" cy="35" rx="7" ry="4" transform="rotate(25 115 35)" opacity="0.6"/><circle cx="40" cy="25" r="4" opacity="0.8"/><circle cx="100" cy="50" r="4" opacity="0.8"/></svg>`,
    defaultColor: '#228B22',
  },
  {
    id: 'floral-daisy-1',
    name: 'Marguerite Douce',
    category: 'floral',
    svg: `<svg viewBox="0 0 80 80" fill="currentColor"><ellipse cx="40" cy="20" rx="6" ry="12" opacity="0.8"/><ellipse cx="55" cy="28" rx="6" ry="12" transform="rotate(45 55 28)" opacity="0.8"/><ellipse cx="60" cy="45" rx="6" ry="12" transform="rotate(90 60 45)" opacity="0.8"/><ellipse cx="52" cy="60" rx="6" ry="12" transform="rotate(135 52 60)" opacity="0.8"/><ellipse cx="40" cy="65" rx="6" ry="12" transform="rotate(180 40 65)" opacity="0.8"/><ellipse cx="28" cy="58" rx="6" ry="12" transform="rotate(-135 28 58)" opacity="0.8"/><ellipse cx="20" cy="42" rx="6" ry="12" transform="rotate(-90 20 42)" opacity="0.8"/><ellipse cx="28" cy="28" rx="6" ry="12" transform="rotate(-45 28 28)" opacity="0.8"/><circle cx="40" cy="42" r="10"/></svg>`,
    defaultColor: '#FFFACD',
  },
  {
    id: 'floral-bouquet-1',
    name: 'Bouquet Raffiné',
    category: 'floral',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 95 Q40 80 50 70 Q60 80 50 95" opacity="0.5"/><circle cx="50" cy="35" r="12" opacity="0.9"/><circle cx="35" cy="45" r="10" opacity="0.7"/><circle cx="65" cy="45" r="10" opacity="0.7"/><circle cx="30" cy="60" r="8" opacity="0.5"/><circle cx="70" cy="60" r="8" opacity="0.5"/><circle cx="45" cy="55" r="9" opacity="0.8"/><circle cx="55" cy="55" r="9" opacity="0.8"/><path d="M40 72 Q50 65 60 72" stroke="currentColor" fill="none" stroke-width="3"/></svg>`,
    defaultColor: '#E8B4B8',
  },

  // === ROYAUX ===
  {
    id: 'royal-crown-1',
    name: 'Couronne Royale',
    category: 'royal',
    svg: `<svg viewBox="0 0 100 80" fill="currentColor"><path d="M15 65 L20 30 L35 45 L50 20 L65 45 L80 30 L85 65 Z" opacity="0.9"/><path d="M10 65 H90 V75 H10 Z"/><circle cx="20" cy="28" r="5"/><circle cx="50" cy="15" r="6"/><circle cx="80" cy="28" r="5"/><rect x="20" y="70" width="60" height="3" opacity="0.5"/><circle cx="50" cy="50" r="4" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'royal-fleurdelis-1',
    name: 'Fleur de Lys',
    category: 'royal',
    svg: `<svg viewBox="0 0 80 100" fill="currentColor"><path d="M40 5 Q45 20 55 25 Q45 30 45 50 L55 50 Q55 70 40 95 Q25 70 25 50 L35 50 Q35 30 25 25 Q35 20 40 5Z"/><ellipse cx="25" cy="25" rx="8" ry="15" transform="rotate(-30 25 25)"/><ellipse cx="55" cy="25" rx="8" ry="15" transform="rotate(30 55 25)"/><circle cx="40" cy="55" r="5" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'royal-crest-1',
    name: 'Blason Noble',
    category: 'royal',
    svg: `<svg viewBox="0 0 80 100" fill="currentColor"><path d="M10 10 H70 V60 Q70 90 40 95 Q10 90 10 60 Z" opacity="0.2" stroke="currentColor" stroke-width="2"/><path d="M15 15 H65 V58 Q65 85 40 90 Q15 85 15 58 Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M40 25 L50 45 L40 55 L30 45 Z" opacity="0.8"/><circle cx="40" cy="70" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
    defaultColor: '#8B4513',
  },
  {
    id: 'royal-scepter-1',
    name: 'Sceptre Impérial',
    category: 'royal',
    svg: `<svg viewBox="0 0 40 120" fill="currentColor"><rect x="17" y="30" width="6" height="85" rx="2"/><circle cx="20" cy="20" r="15"/><circle cx="20" cy="20" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="20" r="4"/><path d="M10 115 H30" stroke="currentColor" stroke-width="3"/><rect x="15" y="108" width="10" height="5" rx="1"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'royal-tiara-1',
    name: 'Diadème Princesse',
    category: 'royal',
    svg: `<svg viewBox="0 0 120 60" fill="currentColor"><path d="M10 55 Q20 40 35 50 Q50 30 60 20 Q70 30 85 50 Q100 40 110 55" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="60" cy="15" r="8"/><circle cx="35" cy="40" r="5"/><circle cx="85" cy="40" r="5"/><circle cx="20" cy="48" r="4" opacity="0.7"/><circle cx="100" cy="48" r="4" opacity="0.7"/><path d="M5 55 H115" stroke="currentColor" stroke-width="3"/></svg>`,
    defaultColor: '#C0C0C0',
  },
  {
    id: 'royal-lion-1',
    name: 'Lion Héraldique',
    category: 'royal',
    svg: `<svg viewBox="0 0 80 100" fill="currentColor"><ellipse cx="40" cy="35" rx="20" ry="18"/><ellipse cx="40" cy="25" rx="25" ry="15" opacity="0.6"/><circle cx="33" cy="32" r="3" opacity="0"/><circle cx="47" cy="32" r="3" opacity="0"/><ellipse cx="40" cy="42" rx="8" ry="5"/><path d="M30 50 Q25 70 20 90 M50 50 Q55 70 60 90" stroke="currentColor" fill="none" stroke-width="3"/><path d="M35 55 L35 85 M45 55 L45 85" stroke="currentColor" stroke-width="3"/><path d="M55 60 Q70 70 65 90" stroke="currentColor" fill="none" stroke-width="2"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'royal-eagle-1',
    name: 'Aigle Impérial',
    category: 'royal',
    svg: `<svg viewBox="0 0 100 80" fill="currentColor"><path d="M50 20 L45 30 L55 30 Z"/><circle cx="50" cy="15" r="8"/><path d="M50 30 Q50 50 50 60" stroke="currentColor" fill="none" stroke-width="3"/><path d="M50 35 Q20 25 5 50 Q15 45 25 50 Q30 40 40 38" opacity="0.8"/><path d="M50 35 Q80 25 95 50 Q85 45 75 50 Q70 40 60 38" opacity="0.8"/><path d="M40 60 L35 75 M50 60 L50 78 M60 60 L65 75" stroke="currentColor" stroke-width="2"/></svg>`,
    defaultColor: '#1C1C1C',
  },
  {
    id: 'royal-orb-1',
    name: 'Orbe Royal',
    category: 'royal',
    svg: `<svg viewBox="0 0 80 100" fill="currentColor"><circle cx="40" cy="55" r="30"/><path d="M40 25 L40 10 M35 10 L45 10" stroke="currentColor" stroke-width="3"/><circle cx="40" cy="5" r="5"/><path d="M10 55 H70" stroke="currentColor" stroke-width="2" opacity="0.5"/><path d="M40 25 Q60 40 40 55 Q20 40 40 25" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'royal-shield-1',
    name: 'Écu Chevaleresque',
    category: 'royal',
    svg: `<svg viewBox="0 0 80 100" fill="currentColor"><path d="M10 10 H70 V50 Q70 90 40 95 Q10 90 10 50 Z" opacity="0.3"/><path d="M10 10 H70 V50 Q70 90 40 95 Q10 90 10 50 Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M40 20 L40 80" stroke="currentColor" stroke-width="2" opacity="0.5"/><path d="M20 40 H60" stroke="currentColor" stroke-width="2" opacity="0.5"/></svg>`,
    defaultColor: '#C41E3A',
  },
  {
    id: 'royal-key-1',
    name: 'Clé du Royaume',
    category: 'royal',
    svg: `<svg viewBox="0 0 40 100" fill="currentColor"><circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="20" cy="20" r="6"/><rect x="17" y="35" width="6" height="55"/><path d="M23 70 H30 M23 80 H28" stroke="currentColor" stroke-width="3"/></svg>`,
    defaultColor: '#D4AF37',
  },

  // === CÉLESTES ===
  {
    id: 'celestial-star-1',
    name: 'Étoile Scintillante',
    category: 'celestial',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 5 L58 38 L95 38 L65 60 L75 95 L50 72 L25 95 L35 60 L5 38 L42 38 Z"/><circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/></svg>`,
    defaultColor: '#FFD700',
  },
  {
    id: 'celestial-moon-1',
    name: 'Croissant de Lune',
    category: 'celestial',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M70 10 Q30 25 30 50 Q30 75 70 90 Q40 80 40 50 Q40 20 70 10Z"/><circle cx="25" cy="30" r="2" opacity="0.6"/><circle cx="20" cy="50" r="1.5" opacity="0.4"/><circle cx="25" cy="70" r="2" opacity="0.6"/><circle cx="35" cy="85" r="1" opacity="0.3"/></svg>`,
    defaultColor: '#F5E6D3',
  },
  {
    id: 'celestial-sun-1',
    name: 'Soleil Radieux',
    category: 'celestial',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="20"/><path d="M50 5 L53 25 L47 25 Z M50 95 L53 75 L47 75 Z M5 50 L25 53 L25 47 Z M95 50 L75 53 L75 47 Z"/><path d="M20 20 L35 32 L32 35 Z M80 20 L68 32 L65 35 Z M20 80 L32 68 L35 65 Z M80 80 L68 68 L65 65 Z" opacity="0.7"/><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/></svg>`,
    defaultColor: '#FFB347',
  },
  {
    id: 'celestial-constellation-1',
    name: 'Constellation',
    category: 'celestial',
    svg: `<svg viewBox="0 0 120 80" fill="currentColor"><circle cx="20" cy="30" r="4"/><circle cx="45" cy="15" r="3"/><circle cx="70" cy="25" r="5"/><circle cx="55" cy="50" r="3"/><circle cx="90" cy="40" r="4"/><circle cx="100" cy="60" r="3"/><path d="M20 30 L45 15 L70 25 M70 25 L55 50 M70 25 L90 40 L100 60" stroke="currentColor" fill="none" stroke-width="1" opacity="0.5"/></svg>`,
    defaultColor: '#E6E6FA',
  },
  {
    id: 'celestial-shooting-star',
    name: 'Étoile Filante',
    category: 'celestial',
    svg: `<svg viewBox="0 0 120 60" fill="currentColor"><path d="M100 15 L85 20 L95 10 L80 25 L90 15 Z"/><path d="M80 25 L10 50" stroke="currentColor" stroke-width="2" opacity="0.6"/><circle cx="60" cy="35" r="2" opacity="0.4"/><circle cx="40" cy="42" r="1.5" opacity="0.3"/><circle cx="25" cy="47" r="1" opacity="0.2"/></svg>`,
    defaultColor: '#FFD700',
  },
  {
    id: 'celestial-galaxy',
    name: 'Galaxie Spirale',
    category: 'celestial',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="8"/><path d="M50 50 Q70 40 80 50 Q90 70 70 80 Q50 90 40 70 Q30 50 50 40 Q70 30 85 45" fill="none" stroke="currentColor" stroke-width="2" opacity="0.7"/><circle cx="65" cy="35" r="2" opacity="0.5"/><circle cx="80" cy="55" r="1.5" opacity="0.4"/><circle cx="60" cy="75" r="2" opacity="0.5"/><circle cx="35" cy="60" r="1.5" opacity="0.4"/></svg>`,
    defaultColor: '#9370DB',
  },
  {
    id: 'celestial-planet',
    name: 'Planète Annelée',
    category: 'celestial',
    svg: `<svg viewBox="0 0 100 80" fill="currentColor"><circle cx="50" cy="40" r="20"/><ellipse cx="50" cy="40" rx="40" ry="8" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6"/><circle cx="50" cy="40" r="20" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"/><circle cx="42" cy="35" r="3" opacity="0.3"/></svg>`,
    defaultColor: '#DEB887',
  },
  {
    id: 'celestial-comet',
    name: 'Comète Brillante',
    category: 'celestial',
    svg: `<svg viewBox="0 0 120 60" fill="currentColor"><circle cx="100" cy="20" r="10"/><path d="M90 25 Q50 35 10 50" stroke="currentColor" stroke-width="4" opacity="0.3"/><path d="M92 28 Q55 38 15 52" stroke="currentColor" stroke-width="2" opacity="0.5"/><circle cx="100" cy="20" r="5" opacity="0.8"/></svg>`,
    defaultColor: '#87CEEB',
  },
  {
    id: 'celestial-sparkle',
    name: 'Étincelle Magique',
    category: 'celestial',
    svg: `<svg viewBox="0 0 60 60" fill="currentColor"><path d="M30 5 L32 25 L30 30 L28 25 Z"/><path d="M30 55 L32 35 L30 30 L28 35 Z"/><path d="M5 30 L25 32 L30 30 L25 28 Z"/><path d="M55 30 L35 32 L30 30 L35 28 Z"/><path d="M12 12 L25 27 L30 30 L27 25 Z" opacity="0.6"/><path d="M48 12 L33 27 L30 30 L35 25 Z" opacity="0.6"/><path d="M12 48 L27 33 L30 30 L25 35 Z" opacity="0.6"/><path d="M48 48 L33 33 L30 30 L35 35 Z" opacity="0.6"/></svg>`,
    defaultColor: '#FFD700',
  },
  {
    id: 'celestial-eclipse',
    name: 'Éclipse Mystique',
    category: 'celestial',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="35"/><circle cx="60" cy="45" r="30" fill="#1a1a2e"/><path d="M50 10 L50 5 M50 90 L50 95 M10 50 L5 50 M90 50 L95 50" stroke="currentColor" stroke-width="2" opacity="0.5"/><circle cx="25" cy="35" r="2" opacity="0.3"/><circle cx="30" cy="65" r="1.5" opacity="0.3"/></svg>`,
    defaultColor: '#FFD700',
  },
  {
    id: 'celestial-aurora',
    name: 'Aurore Boréale',
    category: 'celestial',
    svg: `<svg viewBox="0 0 120 80" fill="currentColor"><path d="M10 70 Q30 30 50 50 Q70 70 90 40 Q110 10 120 30" fill="none" stroke="currentColor" stroke-width="8" opacity="0.3"/><path d="M0 75 Q25 40 45 55 Q65 70 85 45 Q105 20 120 35" fill="none" stroke="currentColor" stroke-width="5" opacity="0.5"/><path d="M5 80 Q30 50 50 60 Q70 70 90 50 Q110 30 120 40" fill="none" stroke="currentColor" stroke-width="3" opacity="0.7"/></svg>`,
    defaultColor: '#00FF7F',
  },
  {
    id: 'celestial-north-star',
    name: 'Étoile Polaire',
    category: 'celestial',
    svg: `<svg viewBox="0 0 80 80" fill="currentColor"><path d="M40 5 L43 35 L40 40 L37 35 Z"/><path d="M40 75 L43 45 L40 40 L37 45 Z"/><path d="M5 40 L35 43 L40 40 L35 37 Z"/><path d="M75 40 L45 43 L40 40 L45 37 Z"/><circle cx="40" cy="40" r="6"/><circle cx="40" cy="40" r="12" fill="none" stroke="currentColor" stroke-width="1" opacity="0.4"/></svg>`,
    defaultColor: '#FFFFFF',
  },

  // === ARTISTIQUES ===
  {
    id: 'artistic-butterfly-1',
    name: 'Papillon Élégant',
    category: 'artistic',
    svg: `<svg viewBox="0 0 100 80" fill="currentColor"><ellipse cx="35" cy="30" rx="25" ry="20" opacity="0.8"/><ellipse cx="65" cy="30" rx="25" ry="20" opacity="0.8"/><ellipse cx="30" cy="55" rx="15" ry="12" opacity="0.6"/><ellipse cx="70" cy="55" rx="15" ry="12" opacity="0.6"/><ellipse cx="50" cy="40" rx="4" ry="20"/><path d="M48 20 Q40 5 35 10 M52 20 Q60 5 65 10" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="35" cy="10" r="2"/><circle cx="65" cy="10" r="2"/></svg>`,
    defaultColor: '#DDA0DD',
  },
  {
    id: 'artistic-feather-1',
    name: 'Plume d\'Or',
    category: 'artistic',
    svg: `<svg viewBox="0 0 60 120" fill="currentColor"><path d="M30 10 Q45 30 45 60 Q45 90 30 110 Q15 90 15 60 Q15 30 30 10Z" opacity="0.3"/><path d="M30 5 Q30 60 30 115" stroke="currentColor" fill="none" stroke-width="2"/><path d="M30 20 Q40 25 42 35 M30 35 Q42 38 45 50 M30 50 Q43 52 47 65 M30 65 Q42 68 45 80 M30 80 Q38 83 40 92" stroke="currentColor" fill="none" stroke-width="1" opacity="0.6"/><path d="M30 20 Q20 25 18 35 M30 35 Q18 38 15 50 M30 50 Q17 52 13 65 M30 65 Q18 68 15 80 M30 80 Q22 83 20 92" stroke="currentColor" fill="none" stroke-width="1" opacity="0.6"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'artistic-ribbon-1',
    name: 'Ruban Soyeux',
    category: 'artistic',
    svg: `<svg viewBox="0 0 150 60" fill="currentColor"><path d="M10 30 Q30 10 50 30 Q70 50 90 30 Q110 10 130 30 Q140 40 140 50 L130 45 Q110 25 90 45 Q70 65 50 45 Q30 25 10 45 L5 40 Q5 35 10 30Z" opacity="0.8"/><path d="M10 30 Q30 10 50 30" stroke="currentColor" fill="none" stroke-width="1" opacity="0.5"/></svg>`,
    defaultColor: '#C41E3A',
  },
  {
    id: 'artistic-heart-1',
    name: 'Cœur Orné',
    category: 'artistic',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 90 Q10 60 10 35 Q10 10 35 10 Q50 10 50 25 Q50 10 65 10 Q90 10 90 35 Q90 60 50 90Z"/><path d="M50 80 Q20 55 20 35 Q20 18 35 18 Q50 18 50 30" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"/><circle cx="35" cy="35" r="5" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/></svg>`,
    defaultColor: '#DC143C',
  },
  {
    id: 'artistic-swan-1',
    name: 'Cygne Gracieux',
    category: 'artistic',
    svg: `<svg viewBox="0 0 100 80" fill="currentColor"><path d="M30 70 Q20 60 25 45 Q30 30 45 25 Q60 20 65 30 Q70 40 60 45 Q50 50 55 40 Q60 30 50 30 Q40 30 35 40 Q30 50 35 60 Q40 70 50 70 Q70 70 85 60" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="50" cy="28" r="3"/><ellipse cx="60" cy="65" rx="25" ry="10" opacity="0.6"/></svg>`,
    defaultColor: '#FFFFFF',
  },
  {
    id: 'artistic-peacock-1',
    name: 'Paon Majestueux',
    category: 'artistic',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="20" r="6"/><path d="M50 26 Q50 50 50 70" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="30" cy="35" r="12" opacity="0.7"/><circle cx="70" cy="35" r="12" opacity="0.7"/><circle cx="20" cy="55" r="10" opacity="0.5"/><circle cx="80" cy="55" r="10" opacity="0.5"/><circle cx="35" cy="65" r="8" opacity="0.4"/><circle cx="65" cy="65" r="8" opacity="0.4"/><circle cx="30" cy="35" r="4"/><circle cx="70" cy="35" r="4"/><circle cx="20" cy="55" r="3" opacity="0.8"/><circle cx="80" cy="55" r="3" opacity="0.8"/></svg>`,
    defaultColor: '#1E90FF',
  },
  {
    id: 'artistic-dragonfly-1',
    name: 'Libellule Délicate',
    category: 'artistic',
    svg: `<svg viewBox="0 0 100 80" fill="currentColor"><ellipse cx="50" cy="40" rx="4" ry="25"/><circle cx="50" cy="12" r="6"/><ellipse cx="30" cy="35" rx="20" ry="8" opacity="0.5"/><ellipse cx="70" cy="35" rx="20" ry="8" opacity="0.5"/><ellipse cx="32" cy="50" rx="15" ry="6" opacity="0.4"/><ellipse cx="68" cy="50" rx="15" ry="6" opacity="0.4"/><circle cx="47" cy="10" r="2" opacity="0"/><circle cx="53" cy="10" r="2" opacity="0"/></svg>`,
    defaultColor: '#00CED1',
  },
  {
    id: 'artistic-hummingbird-1',
    name: 'Colibri Irisé',
    category: 'artistic',
    svg: `<svg viewBox="0 0 100 80" fill="currentColor"><ellipse cx="55" cy="40" rx="18" ry="15"/><circle cx="70" cy="35" r="8"/><path d="M78 35 L95 30" stroke="currentColor" stroke-width="2"/><ellipse cx="40" cy="35" rx="15" ry="8" transform="rotate(-20 40 35)" opacity="0.6"/><ellipse cx="38" cy="48" rx="12" ry="6" transform="rotate(20 38 48)" opacity="0.5"/><path d="M55 55 Q55 70 60 75 Q50 70 55 55" opacity="0.7"/></svg>`,
    defaultColor: '#FF1493',
  },
  {
    id: 'artistic-mask-1',
    name: 'Masque Vénitien',
    category: 'artistic',
    svg: `<svg viewBox="0 0 100 60" fill="currentColor"><path d="M10 30 Q30 10 50 20 Q70 10 90 30 Q70 50 50 40 Q30 50 10 30" opacity="0.8"/><ellipse cx="30" cy="28" rx="10" ry="8" fill="#1a1a2e"/><ellipse cx="70" cy="28" rx="10" ry="8" fill="#1a1a2e"/><path d="M45 35 L50 40 L55 35" fill="none" stroke="currentColor" stroke-width="2"/><path d="M0 25 Q5 20 10 30 M90 30 Q95 20 100 25" stroke="currentColor" stroke-width="2" fill="none" opacity="0.6"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'artistic-quill-ink-1',
    name: 'Plume et Encrier',
    category: 'artistic',
    svg: `<svg viewBox="0 0 80 100" fill="currentColor"><path d="M55 10 Q60 30 55 60 Q50 90 45 95" fill="none" stroke="currentColor" stroke-width="2"/><path d="M55 10 Q70 15 65 25 Q60 35 55 30 Q50 25 55 10" opacity="0.7"/><ellipse cx="25" cy="85" rx="20" ry="12"/><ellipse cx="25" cy="80" rx="15" ry="8" fill="#1a1a2e"/><path d="M45 95 Q35 90 30 85" stroke="currentColor" stroke-width="1" opacity="0.5"/></svg>`,
    defaultColor: '#2F4F4F',
  },
  {
    id: 'artistic-scroll-1',
    name: 'Parchemin Ancien',
    category: 'artistic',
    svg: `<svg viewBox="0 0 100 80" fill="currentColor"><path d="M15 15 Q10 15 10 25 L10 60 Q10 70 20 70 L85 70 Q90 70 90 60 L90 25 Q90 15 80 15" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="15" cy="20" rx="5" ry="8"/><ellipse cx="15" cy="65" rx="5" ry="8"/><path d="M25 30 H75 M25 42 H75 M25 54 H60" stroke="currentColor" stroke-width="1" opacity="0.4"/></svg>`,
    defaultColor: '#DEB887',
  },
  {
    id: 'artistic-music-note',
    name: 'Note de Musique',
    category: 'artistic',
    svg: `<svg viewBox="0 0 60 100" fill="currentColor"><ellipse cx="20" cy="80" rx="15" ry="10" transform="rotate(-20 20 80)"/><path d="M32 75 L32 15" stroke="currentColor" stroke-width="3"/><path d="M32 15 Q50 20 50 35 Q50 50 32 45" fill="currentColor"/></svg>`,
    defaultColor: '#1C1C1C',
  },
  {
    id: 'artistic-treble-clef',
    name: 'Clé de Sol',
    category: 'artistic',
    svg: `<svg viewBox="0 0 60 100" fill="currentColor"><path d="M30 90 Q20 85 20 75 Q20 65 30 60 Q40 55 40 45 Q40 30 30 25 Q20 20 15 30 Q10 40 20 50 Q30 60 30 75 Q30 85 25 90 Q20 95 15 90" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="30" cy="40" r="5"/><circle cx="30" cy="20" r="3"/></svg>`,
    defaultColor: '#D4AF37',
  },

  // === CADRES ===
  {
    id: 'frame-elegant-1',
    name: 'Cadre Élégant',
    category: 'frames',
    svg: `<svg viewBox="0 0 120 80" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="5" width="110" height="70" rx="3"/><rect x="10" y="10" width="100" height="60" rx="2"/><circle cx="10" cy="10" r="3" fill="currentColor"/><circle cx="110" cy="10" r="3" fill="currentColor"/><circle cx="10" cy="70" r="3" fill="currentColor"/><circle cx="110" cy="70" r="3" fill="currentColor"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'frame-ornate-1',
    name: 'Cadre Orné',
    category: 'frames',
    svg: `<svg viewBox="0 0 120 80" fill="currentColor"><rect x="5" y="5" width="110" height="70" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><path d="M5 20 Q15 25 15 15 Q15 5 25 5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M115 20 Q105 25 105 15 Q105 5 95 5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 60 Q15 55 15 65 Q15 75 25 75" fill="none" stroke="currentColor" stroke-width="2"/><path d="M115 60 Q105 55 105 65 Q105 75 95 75" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="60" cy="5" r="4"/><circle cx="60" cy="75" r="4"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'frame-baroque-1',
    name: 'Cadre Baroque',
    category: 'frames',
    svg: `<svg viewBox="0 0 120 80" fill="currentColor"><rect x="8" y="8" width="104" height="64" rx="2" fill="none" stroke="currentColor" stroke-width="4"/><path d="M0 20 Q8 25 8 15 Q8 5 18 0" fill="none" stroke="currentColor" stroke-width="2"/><path d="M120 20 Q112 25 112 15 Q112 5 102 0" fill="none" stroke="currentColor" stroke-width="2"/><path d="M0 60 Q8 55 8 65 Q8 75 18 80" fill="none" stroke="currentColor" stroke-width="2"/><path d="M120 60 Q112 55 112 65 Q112 75 102 80" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="60" cy="0" r="5"/><circle cx="60" cy="80" r="5"/><circle cx="0" cy="40" r="5"/><circle cx="120" cy="40" r="5"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'frame-art-deco-1',
    name: 'Cadre Art Déco',
    category: 'frames',
    svg: `<svg viewBox="0 0 120 80" fill="currentColor"><rect x="5" y="5" width="110" height="70" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 5 L20 20 M115 5 L100 20 M5 75 L20 60 M115 75 L100 60" stroke="currentColor" stroke-width="2"/><rect x="15" y="15" width="90" height="50" fill="none" stroke="currentColor" stroke-width="1"/><path d="M30 5 L30 15 M60 5 L60 15 M90 5 L90 15" stroke="currentColor" stroke-width="1"/><path d="M30 75 L30 65 M60 75 L60 65 M90 75 L90 65" stroke="currentColor" stroke-width="1"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'frame-victorian-1',
    name: 'Cadre Victorien',
    category: 'frames',
    svg: `<svg viewBox="0 0 120 80" fill="currentColor"><rect x="5" y="5" width="110" height="70" rx="5" fill="none" stroke="currentColor" stroke-width="3"/><rect x="12" y="12" width="96" height="56" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="5" cy="5" r="4"/><circle cx="115" cy="5" r="4"/><circle cx="5" cy="75" r="4"/><circle cx="115" cy="75" r="4"/><path d="M40 5 Q45 12 50 5 Q55 12 60 5 Q65 12 70 5 Q75 12 80 5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M40 75 Q45 68 50 75 Q55 68 60 75 Q65 68 70 75 Q75 68 80 75" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
    defaultColor: '#8B4513',
  },
  {
    id: 'frame-circle-1',
    name: 'Médaillon Cadre',
    category: 'frames',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="50" cy="5" r="4"/><circle cx="50" cy="95" r="4"/><circle cx="5" cy="50" r="4"/><circle cx="95" cy="50" r="4"/><circle cx="20" cy="20" r="3" opacity="0.7"/><circle cx="80" cy="20" r="3" opacity="0.7"/><circle cx="20" cy="80" r="3" opacity="0.7"/><circle cx="80" cy="80" r="3" opacity="0.7"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'frame-oval-1',
    name: 'Cadre Ovale',
    category: 'frames',
    svg: `<svg viewBox="0 0 100 80" fill="currentColor"><ellipse cx="50" cy="40" rx="45" ry="35" fill="none" stroke="currentColor" stroke-width="3"/><ellipse cx="50" cy="40" rx="38" ry="28" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="50" cy="5" r="4"/><circle cx="50" cy="75" r="4"/><path d="M20 15 Q25 20 20 25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M80 15 Q75 20 80 25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M20 55 Q25 60 20 65" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M80 55 Q75 60 80 65" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'frame-ribbon-1',
    name: 'Cadre Ruban',
    category: 'frames',
    svg: `<svg viewBox="0 0 140 100" fill="currentColor"><rect x="20" y="15" width="100" height="70" fill="none" stroke="currentColor" stroke-width="2"/><path d="M0 25 L20 15 L20 85 L0 95 L0 70 L10 65 L10 55 L0 50 L0 25" opacity="0.8"/><path d="M140 25 L120 15 L120 85 L140 95 L140 70 L130 65 L130 55 L140 50 L140 25" opacity="0.8"/></svg>`,
    defaultColor: '#C41E3A',
  },
  {
    id: 'frame-shield-1',
    name: 'Cadre Blason',
    category: 'frames',
    svg: `<svg viewBox="0 0 80 100" fill="currentColor"><path d="M5 10 H75 V55 Q75 90 40 98 Q5 90 5 55 Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M12 17 H68 V52 Q68 82 40 90 Q12 82 12 52 Z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="40" cy="10" r="5"/></svg>`,
    defaultColor: '#1E3A5F',
  },
]

// Catégories de décorations avec leurs infos
const DECORATION_CATEGORIES: { id: DecorationCategory; nameKey: string; icon: string }[] = [
  { id: 'gold', nameKey: 'decorationCategories.gold', icon: '✨' },
  { id: 'floral', nameKey: 'decorationCategories.floral', icon: '🌸' },
  { id: 'royal', nameKey: 'decorationCategories.royal', icon: '👑' },
  { id: 'celestial', nameKey: 'decorationCategories.celestial', icon: '⭐' },
  { id: 'artistic', nameKey: 'decorationCategories.artistic', icon: '🦋' },
  { id: 'frames', nameKey: 'decorationCategories.frames', icon: '🖼️' },
]

interface StoryPageLocal {
  id: string
  title: string
  content: string
  // Type de page (couverture, contenu, 4ème)
  pageType?: 'front-cover' | 'content' | 'back-cover'
  // Support multi-médias (images et vidéos)
  images?: PageMedia[]
  // Fond de page (image ou vidéo avec opacité)
  backgroundMedia?: BackgroundMedia
  // Décorations premium (stickers luxueux)
  decorations?: PageDecoration[]
  // Zones de texte flottantes
  textBoxes?: PageTextBox[]
  // Legacy: anciens champs pour rétrocompatibilité
  image?: string
  imagePosition?: ImagePosition
  imageStyle?: ImageStyle
  frameStyle?: FrameStyle
  chapterId?: string
  style?: TextStyle
}

interface Chapter {
  id: string
  title: string
  type: 'intro' | 'development' | 'climax' | 'conclusion' | 'custom'
  color: string
  titleAlignment?: 'left' | 'center' | 'right' | 'hidden'
}

// ============================================================================
// CONFIGURATION DES POLICES
// ============================================================================

const FONTS = [
  {
    id: 'handwriting',
    nameKey: 'fonts.handwriting',
    family: "'Caveat', cursive",
    preview: 'Aa',
  },
  {
    id: 'tale',
    nameKey: 'fonts.tale',
    family: "'Cormorant Garamond', serif",
    preview: 'Aa',
  },
  {
    id: 'child',
    nameKey: 'fonts.child',
    family: "'Patrick Hand', cursive",
    preview: 'Aa',
  },
  {
    id: 'book',
    nameKey: 'fonts.book',
    family: "'Merriweather', serif",
    preview: 'Aa',
  },
  {
    id: 'comic',
    nameKey: 'fonts.comic',
    family: "'Comic Neue', cursive",
    preview: 'Aa',
  },
  {
    id: 'magic',
    nameKey: 'fonts.magic',
    family: "'Spectral', serif",
    preview: 'Aa',
  },
]

// Tailles de police disponibles (comme dans Word)
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]


const DEFAULT_STYLE: TextStyle = {
  fontFamily: "'Merriweather', serif",
  fontSize: 18, // Taille par défaut en pixels
  color: '#ffffff',
  isBold: false,
  isItalic: false,
  textAlign: 'left',
  lineSpacing: 'normal',
}


// ============================================================================
// HOOK : Reconnaissance vocale (Speech-to-Text)
// ============================================================================

interface UseSpeechRecognitionReturn {
  isListening: boolean
  isSupported: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

function useSpeechRecognition(locale: string = 'fr'): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(true) // Default to true, will check on mount
  const recognitionRef = useRef<any>(null)
  const hasInitialized = useRef(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setIsSupported(false)
      return
    }
    
    // Check if running in Electron
    const isElectron = !!(window as any).electronAPI
    console.log('🎤 Environnement:', isElectron ? 'Electron' : 'Navigateur')
    
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      console.log('❌ Speech Recognition non supporté')
      setIsSupported(false)
      return
    }
    
    console.log('✅ Speech Recognition disponible')
    
    setIsSupported(true)
    
    if (hasInitialized.current) return
    hasInitialized.current = true

    try {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'ru-RU'

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error)
      setIsSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    }
  }, [locale])

  const startListening = async () => {
    console.log('🎤 startListening appelé', { hasRecognition: !!recognitionRef.current, isListening })
    
    if (recognitionRef.current && !isListening) {
      // Dans Electron, demander la permission du microphone d'abord
      if (typeof window !== 'undefined' && (window as any).electronAPI?.requestMicrophoneAccess) {
        console.log('🎤 Demande permission microphone Electron...')
        try {
          const granted = await (window as any).electronAPI.requestMicrophoneAccess()
          console.log('🎤 Permission microphone:', granted ? 'accordée' : 'refusée')
          if (!granted) {
            return
          }
        } catch (err) {
          console.error('❌ Erreur permission microphone:', err)
        }
      }
      
      setTranscript('')
      try {
        console.log('🎤 Démarrage reconnaissance vocale...')
        recognitionRef.current.start()
        setIsListening(true)
        console.log('✅ Reconnaissance vocale démarrée')
      } catch (err) {
        console.error('❌ Erreur démarrage reconnaissance vocale:', err)
      }
    } else {
      console.log('⚠️ startListening ignoré:', { hasRecognition: !!recognitionRef.current, isListening })
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const resetTranscript = () => {
    setTranscript('')
  }

  return { isListening, isSupported, transcript, startListening, stopListening, resetTranscript }
}

import {
  LINE_SPACINGS,
  CANONICAL_PAGE_WIDTH,
  REFERENCE_PAGE_WIDTH,
  DECORATION_BASE_SIZE,
  getPageScale,
  getBaseLineHeightPx,
  getScaledLineHeightPx,
  getScaledFontSize,
  getCanonicalDimensions,
  getFitScale,
  getPagePaddingPx,
  SPINE_WIDTH as CANONICAL_SPINE_WIDTH,
} from '@/lib/rendering/pageRendering'
import type { LineSpacing } from '@/lib/rendering/pageRendering'

// Fonction helper pour calculer la hauteur de ligne en pixels (à la taille de référence)
// Accepte les presets (tight/normal/relaxed) ou une valeur numérique directe
const getLineHeightPx = (lineSpacing: 'tight' | 'normal' | 'relaxed' | number): number => {
  if (typeof lineSpacing === 'number') return lineSpacing
  return getBaseLineHeightPx(lineSpacing as LineSpacing)
}

// ============================================================================
// COMPOSANT : Image déplaçable (calque flottant)
// ============================================================================

interface DraggableMediaProps {
  mediaId: string
  src: string
  mediaType: MediaType  // 'image' ou 'video'
  position: ImagePosition
  imageStyle: ImageStyle
  frameStyle: FrameStyle
  zIndex: number
  opacity?: number  // Opacité de 0.1 à 1 (défaut: 1)
  onPositionChange: (position: ImagePosition) => void
  onStyleChange: (style: ImageStyle) => void
  onFrameChange: (frame: FrameStyle) => void
  onOpacityChange?: (opacity: number) => void
  onDelete: () => void
  onBringForward?: () => void
  onSendBackward?: () => void
  onCreateNewImage?: () => void  // Créer une nouvelle image avec ce personnage
  onVideoPosterChange?: (poster: string) => void  // Capture du frame vidéo pour PDF
  onConvertToImage?: (imageUrl: string) => void  // Remplacer la vidéo par une capture image
  containerRef: React.RefObject<HTMLDivElement>
  totalMedia?: number
}

const DEFAULT_IMAGE_POSITION: ImagePosition = {
  x: 50,    // Centré horizontalement
  y: 20,    // En haut
  width: 40,  // 40% de largeur
  height: 30, // 30% de hauteur
  rotation: 0, // Pas de rotation par défaut
}

function DraggableMedia({ mediaId, src, mediaType, position, imageStyle, frameStyle, zIndex, opacity = 1, onPositionChange, onStyleChange, onFrameChange, onOpacityChange, onDelete, onBringForward, onSendBackward, onCreateNewImage, onVideoPosterChange, onConvertToImage, containerRef, totalMedia = 1 }: DraggableMediaProps) {
  const t = useTranslations('writing')
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [resizeCorner, setResizeCorner] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(false)
  const [showFrameMenu, setShowFrameMenu] = useState(false)
  const [showStyleMenu, setShowStyleMenu] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)  // Pour les vidéos
  const [isCapturing, setIsCapturing] = useState(false)  // Capture frame en cours
  const [localOpacity, setLocalOpacity] = useState(opacity)
  const mediaRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const startPosRef = useRef({ x: 0, y: 0, posX: 0, posY: 0, width: 0, height: 0 })
  const rotationRef = useRef({ centerX: 0, centerY: 0, startAngle: 0, startRotation: 0 })
  
  // Fonction pour toggle play/pause vidéo
  const toggleVideo = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        // Capturer le frame actuel pour l'export PDF
        captureVideoFrame()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Capturer le frame vidéo actuel comme image (data URL)
  // Passe par un proxy serveur car pub-*.r2.dev ne renvoie pas de headers CORS
  // (ne se déclenche qu'une fois au moment du pause, pas à chaque chargement)
  const captureVideoFrame = async () => {
    const video = videoRef.current
    if (!video) { console.warn('⚠️ videoPoster: no video ref'); return }
    if (!onVideoPosterChange) { console.warn('⚠️ videoPoster: no callback'); return }
    const seekTime = video.currentTime
    console.log('📸 Capturing video frame at', seekTime, 's...')
    try {
      const resp = await fetch(`/api/media/proxy?url=${encodeURIComponent(src)}`)
      const blob = await resp.blob()
      const blobUrl = URL.createObjectURL(blob)

      const tmp = document.createElement('video')
      tmp.muted = true
      tmp.playsInline = true
      tmp.preload = 'auto'
      tmp.src = blobUrl

      await new Promise<void>((resolve, reject) => {
        tmp.onloadeddata = () => resolve()
        tmp.onerror = () => reject(new Error('temp video load error'))
      })

      tmp.currentTime = seekTime
      await new Promise<void>((resolve) => { tmp.onseeked = () => resolve() })

      const canvas = document.createElement('canvas')
      canvas.width = tmp.videoWidth
      canvas.height = tmp.videoHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height)
      const poster = canvas.toDataURL('image/jpeg', 0.97)
      URL.revokeObjectURL(blobUrl)

      console.log('✅ Video frame captured, size:', Math.round(poster.length / 1024), 'KB')
      onVideoPosterChange(poster)
    } catch (err) {
      console.error('❌ Could not capture video frame:', err)
    }
  }

  // Capturer le frame vidéo et l'uploader comme vraie image sur R2
  const captureAndConvertToImage = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const video = videoRef.current
    if (!video || !onConvertToImage) return
    setIsCapturing(true)
    const seekTime = video.currentTime
    console.log('📸 Capture frame pour conversion image à', seekTime, 's...')
    try {
      // Fetch via proxy CORS
      const resp = await fetch(`/api/media/proxy?url=${encodeURIComponent(src)}`)
      const blob = await resp.blob()
      const blobUrl = URL.createObjectURL(blob)

      const tmp = document.createElement('video')
      tmp.muted = true
      tmp.playsInline = true
      tmp.preload = 'auto'
      tmp.src = blobUrl
      await new Promise<void>((resolve, reject) => {
        tmp.onloadeddata = () => resolve()
        tmp.onerror = () => reject(new Error('temp video load error'))
      })
      tmp.currentTime = seekTime
      await new Promise<void>((resolve) => { tmp.onseeked = () => resolve() })

      // Capture haute qualité
      const canvas = document.createElement('canvas')
      canvas.width = tmp.videoWidth
      canvas.height = tmp.videoHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(blobUrl)

      // Convertir en blob JPEG haute qualité
      const imageBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95)
      })

      // Upload via r2-proxy
      const { user, profile } = useAuthStore.getState()
      const formData = new FormData()
      const file = new File([imageBlob], `video-frame-${Date.now()}.jpg`, { type: 'image/jpeg' })
      formData.append('file', file)
      formData.append('userId', user?.id || 'video-capture')
      formData.append('profileId', profile?.id || '')
      formData.append('contentType', 'image/jpeg')
      formData.append('source', 'video-capture')

      const uploadResp = await fetch('/api/upload/r2-proxy', { method: 'POST', body: formData })
      if (!uploadResp.ok) throw new Error(`Upload échoué: ${uploadResp.status}`)
      const { publicUrl } = await uploadResp.json()

      console.log('✅ Frame capturé et uploadé:', publicUrl)
      onConvertToImage(publicUrl)
      notify.success(t('captureFrame'), t('captureFrameSuccess'))
    } catch (err) {
      console.error('❌ Erreur capture/upload frame:', err)
      notify.error(t('captureFrame'), t('captureFrameError'))
    } finally {
      setIsCapturing(false)
    }
  }

  // Gérer le début du drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isResizing || showStyleMenu) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    
    const container = containerRef.current
    if (!container) return
    
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
      width: position.width,
      height: position.height,
    }
  }

  // Gérer le début du redimensionnement
  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeCorner(corner)
    
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
      width: position.width,
      height: position.height,
    }
  }

  // Gérer le début de la rotation
  const handleRotateStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsRotating(true)
    
    // Calculer le centre de l'image
    if (mediaRef.current) {
      const rect = mediaRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      // Calculer l'angle initial entre le centre et la position de la souris
      const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
      
      rotationRef.current = {
        centerX,
        centerY,
        startAngle,
        startRotation: position.rotation || 0,
      }
    }
  }

  // Gérer le mouvement de la souris
  useEffect(() => {
    if (!isDragging && !isResizing && !isRotating) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isRotating) {
        // Rotation - calculer le nouvel angle
        const { centerX, centerY, startAngle, startRotation } = rotationRef.current
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
        let newRotation = startRotation + (currentAngle - startAngle)
        
        // Normaliser entre 0 et 360
        newRotation = ((newRotation % 360) + 360) % 360
        
        onPositionChange({ ...position, rotation: newRotation })
        return
      }

      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const deltaX = ((e.clientX - startPosRef.current.x) / rect.width) * 100
      const deltaY = ((e.clientY - startPosRef.current.y) / rect.height) * 100

      if (isDragging) {
        // Déplacement
        const newX = Math.max(0, Math.min(100 - position.width, startPosRef.current.posX + deltaX))
        const newY = Math.max(0, Math.min(100 - position.height, startPosRef.current.posY + deltaY))
        onPositionChange({ ...position, x: newX, y: newY })
      } else if (isResizing && resizeCorner) {
        // Redimensionnement
        let newWidth = startPosRef.current.width
        let newHeight = startPosRef.current.height
        let newX = startPosRef.current.posX
        let newY = startPosRef.current.posY

        if (resizeCorner.includes('e')) {
          newWidth = Math.max(15, Math.min(100 - newX, startPosRef.current.width + deltaX))
        }
        if (resizeCorner.includes('w')) {
          const widthDelta = -deltaX
          newWidth = Math.max(15, startPosRef.current.width + widthDelta)
          newX = startPosRef.current.posX - widthDelta
          if (newX < 0) {
            newWidth += newX
            newX = 0
          }
        }
        if (resizeCorner.includes('s')) {
          newHeight = Math.max(10, Math.min(100 - newY, startPosRef.current.height + deltaY))
        }
        if (resizeCorner.includes('n')) {
          const heightDelta = -deltaY
          newHeight = Math.max(10, startPosRef.current.height + heightDelta)
          newY = startPosRef.current.posY - heightDelta
          if (newY < 0) {
            newHeight += newY
            newY = 0
          }
        }

        onPositionChange({ x: newX, y: newY, width: newWidth, height: newHeight, rotation: position.rotation || 0 })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setIsRotating(false)
      setResizeCorner(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, isRotating, resizeCorner, position, onPositionChange, containerRef])

  // Classes et styles selon le style d'image choisi
  const getImageStyleClasses = () => {
    switch (imageStyle) {
      case 'sepia':
        return 'sepia brightness-95'
      case 'vintage':
        return 'sepia-[0.3] contrast-110 brightness-95 saturate-90'
      case 'circle':
        return 'rounded-full'
      case 'rounded':
        return 'rounded-3xl'
      case 'sketch':
        return 'grayscale contrast-125'
      case 'glow':
        return 'brightness-110 saturate-110'
      case 'frost':
        return 'brightness-105 saturate-75 hue-rotate-[200deg]'
      case 'negative':
        return 'invert hue-rotate-180'
      default:
        return ''
    }
  }

  // Styles CSS personnalisés selon le style
  const getContainerStyles = (): React.CSSProperties => {
    const rotation = position.rotation || 0
    // Utiliser le zIndex prop + boost si interaction en cours
    const baseZIndex = zIndex + 10 // Base: zIndex de l'image + 10 pour être au-dessus du texte
    const activeZIndex = isDragging || isResizing || showControls || showStyleMenu || showFrameMenu ? baseZIndex + 100 : baseZIndex
    
    const baseStyles: React.CSSProperties = {
      left: `${position.x}%`,
      top: `${position.y}%`,
      width: `${position.width}%`,
      height: `${position.height}%`,
      cursor: isDragging ? 'grabbing' : 'grab',
      zIndex: activeZIndex,
      transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
    }

    // Le cadre "scotché" ajoute une légère inclinaison aléatoire
    if (frameStyle === 'tape') {
      return {
        ...baseStyles,
        transform: `rotate(${rotation + (Math.random() - 0.5) * 3}deg)`,
      }
    }
    
    return baseStyles
  }

  // Clip-path pour les formes spéciales
  const getClipPath = () => {
    switch (imageStyle) {
      case 'heart':
        // Forme de cœur en pourcentages
        return 'polygon(50% 15%, 60% 5%, 75% 0%, 90% 5%, 100% 20%, 100% 35%, 95% 50%, 50% 100%, 5% 50%, 0% 35%, 0% 20%, 10% 5%, 25% 0%, 40% 5%, 50% 15%)'
      default:
        return undefined
    }
  }

  return (
    <div
      ref={mediaRef}
      className="absolute"
      style={getContainerStyles()}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (!isDragging && !isResizing && !isRotating && !showStyleMenu && !showFrameMenu) {
          setShowControls(false)
        }
      }}
    >
      {/* Conteneur de l'image avec les styles visuels */}
      <div 
        className={cn(
          "w-full h-full transition-shadow",
          "rounded-lg overflow-hidden",
          imageStyle === 'circle' && "rounded-full overflow-hidden",
          // Pas d'ombre ni de cadre pour certains styles
          !['circle', 'heart', 'cloud', 'glow', 'polaroid', 'neon', 'golden', 'shadow3d', 'frost'].includes(imageStyle) && (
            (isDragging || isResizing) ? "shadow-xl ring-2 ring-aurora-500" : "shadow-lg hover:shadow-xl"
          ),
          !['circle', 'heart', 'cloud', 'glow', 'polaroid', 'neon', 'golden', 'shadow3d', 'frost'].includes(imageStyle) && showControls && !showStyleMenu && "ring-2 ring-aurora-400/50"
        )}
      >
        {/* Image ou Vidéo */}
        {mediaType === 'video' ? (
          <video
            ref={videoRef}
            src={src}
            className={cn(
              "w-full h-full object-cover pointer-events-none",
              getImageStyleClasses(),
            )}
            style={{
              clipPath: getClipPath(),
              opacity: localOpacity,
              maskImage: imageStyle === 'cloud'
                ? 'radial-gradient(ellipse 75% 75% at 50% 50%, black 35%, transparent 90%)'
                : undefined,
              WebkitMaskImage: imageStyle === 'cloud'
                ? 'radial-gradient(ellipse 75% 75% at 50% 50%, black 35%, transparent 90%)'
                : undefined,
            }}
            loop
            muted={false}
            playsInline
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          <img 
            src={src} 
            alt="Illustration" 
            className={cn(
              "w-full h-full object-cover pointer-events-none",
              getImageStyleClasses(),
            )}
            style={{
              clipPath: getClipPath(),
              opacity: localOpacity,
              maskImage: imageStyle === 'cloud' 
                ? 'radial-gradient(ellipse 75% 75% at 50% 50%, black 35%, transparent 90%)' 
                : undefined,
              WebkitMaskImage: imageStyle === 'cloud' 
                ? 'radial-gradient(ellipse 75% 75% at 50% 50%, black 35%, transparent 90%)' 
                : undefined,
            }}
            draggable={false}
          />
        )}

        {/* Overlay avec contrôles */}
        {showControls && !showStyleMenu && (
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        )}

        {/* Boutons vidéo : Play/Pause + Capturer frame */}
        {mediaType === 'video' && showControls && !showStyleMenu && (
          <>
            <button
              onClick={toggleVideo}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-20"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            {/* Bouton capturer ce frame comme image — visible quand en pause */}
            {!isPlaying && onConvertToImage && (
              <button
                onClick={captureAndConvertToImage}
                disabled={isCapturing}
                className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/70 text-white text-xs font-medium hover:bg-black/90 transition-colors z-20 disabled:opacity-50"
                title={t('captureFrame')}
              >
                <Camera className="w-4 h-4" />
                {isCapturing ? '...' : t('captureFrame')}
              </button>
            )}
          </>
        )}

        {/* Bouton déplacer (centre) - seulement pour images */}
        {mediaType === 'image' && showControls && !showStyleMenu && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white pointer-events-none">
            <Move className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Style Brillant - halo lumineux (filtre) */}
      {imageStyle === 'glow' && (
        <div 
          className="absolute inset-0 pointer-events-none z-10 rounded-lg"
          style={{
            boxShadow: '0 0 20px 5px rgba(255, 215, 0, 0.4), 0 0 40px 10px rgba(255, 165, 0, 0.2)',
          }}
        />
      )}

      {/* Style Néon - bordure lumineuse (filtre) */}
      {imageStyle === 'neon' && (
        <div 
          className="absolute inset-0 pointer-events-none z-10 rounded-lg"
          style={{
            boxShadow: '0 0 10px 2px #ff00ff, 0 0 20px 4px #00ffff, 0 0 30px 6px #ff00ff, inset 0 0 15px 3px rgba(255, 0, 255, 0.3)',
          }}
        />
      )}

      {/* Style Glacé - reflet froid (filtre) */}
      {imageStyle === 'frost' && (
        <div 
          className="absolute inset-0 pointer-events-none z-10 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(200, 230, 255, 0.3) 0%, transparent 50%, rgba(200, 230, 255, 0.2) 100%)',
            boxShadow: '0 0 20px 5px rgba(150, 200, 255, 0.3)',
          }}
        />
      )}

      {/* ========== CADRES DÉCORATIFS ========== */}
      
      {/* Cadre Simple */}
      {frameStyle === 'simple' && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute inset-0 border-4 border-gray-700 rounded-lg" />
        </div>
      )}

      {/* Cadre Double */}
      {frameStyle === 'double' && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute inset-0 border-2 border-gray-700 rounded-lg" />
          <div className="absolute inset-2 border-2 border-gray-500 rounded-md" />
        </div>
      )}

      {/* Cadre Pointillé */}
      {frameStyle === 'dotted' && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute inset-0 border-4 border-dashed border-gray-600 rounded-lg" />
        </div>
      )}

      {/* Cadre Polaroid */}
      {frameStyle === 'polaroid' && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute inset-0 border-[12px] border-white border-b-[40px] rounded-sm shadow-xl" />
        </div>
      )}

      {/* Cadre Scotché */}
      {frameStyle === 'tape' && (
        <>
          <div className="absolute -top-2 -left-2 w-10 h-5 bg-amber-200/90 rotate-[-20deg] rounded-sm shadow-sm z-10" />
          <div className="absolute -top-2 -right-2 w-10 h-5 bg-pink-200/90 rotate-[20deg] rounded-sm shadow-sm z-10" />
          <div className="absolute -bottom-2 -left-2 w-10 h-5 bg-blue-200/90 rotate-[15deg] rounded-sm shadow-sm z-10" />
          <div className="absolute -bottom-2 -right-2 w-10 h-5 bg-green-200/90 rotate-[-15deg] rounded-sm shadow-sm z-10" />
        </>
      )}

      {/* Cadre Bois */}
      {frameStyle === 'wood' && (
        <div className="absolute inset-0 pointer-events-none z-10 rounded-lg"
          style={{
            border: '8px solid',
            borderImage: 'linear-gradient(135deg, #8B4513 0%, #A0522D 20%, #8B4513 40%, #D2691E 60%, #8B4513 80%, #A0522D 100%) 1',
            boxShadow: '0 4px 15px rgba(0,0,0,0.4), inset 0 0 0 2px rgba(0,0,0,0.3)',
          }}
        />
      )}

      {/* Cadre Doré */}
      {frameStyle === 'golden' && (
        <div className="absolute inset-0 pointer-events-none z-10 rounded-lg"
          style={{
            border: '6px solid',
            borderImage: 'linear-gradient(135deg, #d4af37 0%, #f9e077 15%, #d4af37 30%, #f9e077 50%, #d4af37 70%, #f9e077 85%, #d4af37 100%) 1',
            boxShadow: '0 0 20px rgba(212, 175, 55, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.3)',
          }}
        />
      )}

      {/* Cadre Baroque */}
      {frameStyle === 'baroque' && (
        <>
          <div className="absolute inset-0 pointer-events-none z-10 rounded-lg"
            style={{
              border: '10px solid',
              borderImage: 'linear-gradient(135deg, #2c1810 0%, #4a2c20 25%, #2c1810 50%, #4a2c20 75%, #2c1810 100%) 1',
              boxShadow: '0 0 0 3px #d4af37, 0 0 20px rgba(0,0,0,0.5)',
            }}
          />
          {/* Ornements dorés aux coins */}
          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-amber-400 rounded-tl-md z-20" style={{ borderWidth: '3px' }} />
          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-amber-400 rounded-tr-md z-20" style={{ borderWidth: '3px' }} />
          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-amber-400 rounded-bl-md z-20" style={{ borderWidth: '3px' }} />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-amber-400 rounded-br-md z-20" style={{ borderWidth: '3px' }} />
        </>
      )}

      {/* Cadre Orné */}
      {frameStyle === 'ornate' && (
        <div className="absolute inset-0 pointer-events-none z-10 rounded-lg"
          style={{
            border: '6px solid',
            borderImage: 'repeating-linear-gradient(45deg, #c0c0c0 0px, #c0c0c0 2px, #e8e8e8 2px, #e8e8e8 4px, #a0a0a0 4px, #a0a0a0 6px) 6',
            boxShadow: '0 0 15px rgba(0,0,0,0.3)',
          }}
        />
      )}

      {/* Cadre Romantique */}
      {frameStyle === 'romantic' && (
        <>
          <div className="absolute inset-0 pointer-events-none z-10 rounded-lg"
            style={{
              border: '6px solid',
              borderImage: 'linear-gradient(135deg, #ffb6c1 0%, #ffc0cb 25%, #ff69b4 50%, #ffc0cb 75%, #ffb6c1 100%) 1',
              boxShadow: '0 0 15px rgba(255, 105, 180, 0.4)',
            }}
          />
          {/* Petits cœurs aux coins */}
          <div className="absolute -top-2 -left-2 text-pink-500 text-sm z-20">♥</div>
          <div className="absolute -top-2 -right-2 text-pink-500 text-sm z-20">♥</div>
          <div className="absolute -bottom-2 -left-2 text-pink-500 text-sm z-20">♥</div>
          <div className="absolute -bottom-2 -right-2 text-pink-500 text-sm z-20">♥</div>
        </>
      )}

      {/* Cadre 3D - ombre portée décalée */}
      {frameStyle === 'shadow3d' && (
        <div 
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            boxShadow: '8px 8px 0 rgba(0, 0, 0, 0.4), 16px 16px 0 rgba(0, 0, 0, 0.2)',
          }}
        />
      )}

      {/* CONTRÔLES - Positionnés HORS du conteneur avec overflow hidden */}
      {/* Bouton supprimer */}
      {showControls && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors z-30 shadow-lg"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Boutons de superposition (devant/derrière) - seulement si plusieurs médias */}
      {showControls && totalMedia > 1 && (
        <div className="absolute -bottom-2 -left-2 flex gap-1 z-30">
          {onSendBackward && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSendBackward()
              }}
              className="p-1 rounded-full bg-midnight-700 text-white hover:bg-midnight-600 transition-colors shadow-lg"
              onMouseDown={(e) => e.stopPropagation()}
              title={t('sendToBack')}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
          {onBringForward && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onBringForward()
              }}
              className="p-1 rounded-full bg-midnight-700 text-white hover:bg-midnight-600 transition-colors shadow-lg"
              onMouseDown={(e) => e.stopPropagation()}
              title={t('bringForward')}
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Bouton palette (filtres) */}
      {showControls && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowFrameMenu(false)
            setShowStyleMenu(!showStyleMenu)
          }}
          className={cn(
            "absolute -top-2 -left-2 p-1.5 rounded-full transition-colors z-30 shadow-lg",
            showStyleMenu 
              ? "bg-aurora-500 text-white" 
              : "bg-midnight-800 text-white hover:bg-aurora-500"
          )}
          onMouseDown={(e) => e.stopPropagation()}
          title={t('editor.filters')}
        >
          <Sparkles className="w-4 h-4" />
        </button>
      )}

      {/* Bouton cadres */}
      {showControls && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowStyleMenu(false)
            setShowFrameMenu(!showFrameMenu)
          }}
          className={cn(
            "absolute -bottom-2 -right-2 p-1.5 rounded-full transition-colors z-30 shadow-lg",
            showFrameMenu
              ? "bg-amber-500 text-white"
              : "bg-midnight-800 text-white hover:bg-amber-500"
          )}
          onMouseDown={(e) => e.stopPropagation()}
          title={t('editor.frames')}
        >
          <Frame className="w-4 h-4" />
        </button>
      )}

      {/* Bouton nouvelle image avec ce personnage (seulement pour images) */}
      {showControls && mediaType === 'image' && onCreateNewImage && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCreateNewImage()
          }}
          className="absolute top-1/2 -right-10 -translate-y-1/2 p-2 rounded-full bg-gradient-to-r from-aurora-500 to-stardust-500 text-white hover:shadow-lg hover:shadow-aurora-500/25 transition-all z-30 shadow-lg"
          onMouseDown={(e) => e.stopPropagation()}
          title={t('createNewImage')}
        >
          <Wand2 className="w-4 h-4" />
        </button>
      )}

      {/* Poignée de rotation */}
      {showControls && !showStyleMenu && (
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-30" style={{ top: '-32px' }}>
          {/* Icône flèche enroulée */}
          <div
            className={cn(
              "p-1 rounded-full bg-emerald-500 text-white cursor-grab shadow-md hover:bg-emerald-600 hover:scale-110 transition-all",
              isRotating && "cursor-grabbing scale-125 bg-emerald-400"
            )}
            onMouseDown={handleRotateStart}
            title={t('rotation')}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </div>
          {/* Ligne verticale */}
          <div className="w-0.5 h-3 bg-emerald-500" />
        </div>
      )}

      {/* Menu de sélection de style (filtres) - via portail pour éviter le décalage dû au transform parent */}
      {showStyleMenu && typeof document !== 'undefined' && createPortal(
        <>
          {/* Overlay pour fermer au clic extérieur */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowStyleMenu(false)}
          />
          <div
            className="fixed bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-[9999] min-w-[260px]"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-medium text-gray-600 px-2 pb-2 border-b border-gray-100 mb-2">
              🎨 {t('editor.filters')}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {IMAGE_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    onStyleChange(style.id)
                    setShowStyleMenu(false)
                  }}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-lg transition-all",
                    imageStyle === style.id
                      ? "bg-aurora-100 text-aurora-700 ring-2 ring-aurora-400"
                      : "hover:bg-gray-100 text-gray-600"
                  )}
                  title={t(`imageStyles.${style.id}`)}
                >
                  <span className="text-xl">{style.emoji}</span>
                  <span className="text-xs mt-1 whitespace-nowrap">{t(`imageStyles.${style.id}`)}</span>
                </button>
              ))}
            </div>
            
            {/* Slider d'opacité */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">👁️ {t('opacity')}</span>
                <span className="text-sm text-gray-500">{Math.round(localOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={localOpacity * 100}
                onChange={(e) => {
                  const newOpacity = parseInt(e.target.value) / 100
                  setLocalOpacity(newOpacity)
                  onOpacityChange?.(newOpacity)
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-aurora-500"
              />
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Menu de sélection de cadre - via portail pour éviter le décalage dû au transform parent */}
      {showFrameMenu && typeof document !== 'undefined' && createPortal(
        <>
          {/* Overlay pour fermer au clic extérieur */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowFrameMenu(false)}
          />
          <div
            className="fixed bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-[9999] min-w-[280px]"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-medium text-gray-600 px-2 pb-2 border-b border-gray-100 mb-2">
              🖼️ {t('editor.frames')}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {FRAME_STYLES.map((frame) => (
                <button
                  key={frame.id}
                  onClick={() => {
                    onFrameChange(frame.id)
                    setShowFrameMenu(false)
                  }}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-lg transition-all",
                    frameStyle === frame.id
                      ? "bg-amber-100 text-amber-700 ring-2 ring-amber-400"
                      : "hover:bg-gray-100 text-gray-600"
                  )}
                  title={t(`frameStyles.${frame.id}`)}
                >
                  <span className="text-xl">{frame.emoji}</span>
                  <span className="text-xs mt-1 whitespace-nowrap">{t(`frameStyles.${frame.id}`)}</span>
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Poignées de redimensionnement */}
      {showControls && !showStyleMenu && !showFrameMenu && (
        <>
          {/* Coins */}
          <div
            className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-aurora-500 rounded-full cursor-nw-resize z-20"
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-aurora-500 rounded-full cursor-ne-resize z-20"
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          <div
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-aurora-500 rounded-full cursor-sw-resize z-20"
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-aurora-500 rounded-full cursor-se-resize z-20"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
          {/* Bords */}
          <div
            className="absolute top-1/2 -left-1 w-2 h-6 -translate-y-1/2 bg-white border-2 border-aurora-500 rounded-full cursor-w-resize z-20"
            onMouseDown={(e) => handleResizeStart(e, 'w')}
          />
          <div
            className="absolute top-1/2 -right-1 w-2 h-6 -translate-y-1/2 bg-white border-2 border-aurora-500 rounded-full cursor-e-resize z-20"
            onMouseDown={(e) => handleResizeStart(e, 'e')}
          />
          <div
            className="absolute -top-1 left-1/2 w-6 h-2 -translate-x-1/2 bg-white border-2 border-aurora-500 rounded-full cursor-n-resize z-20"
            onMouseDown={(e) => handleResizeStart(e, 'n')}
          />
          <div
            className="absolute -bottom-1 left-1/2 w-6 h-2 -translate-x-1/2 bg-white border-2 border-aurora-500 rounded-full cursor-s-resize z-20"
            onMouseDown={(e) => handleResizeStart(e, 's')}
          />
        </>
      )}
    </div>
  )
}

// ============================================================================
// COMPOSANT : Zone de texte flottante (draggable)
// ============================================================================

interface DraggableTextBoxProps {
  textBox: PageTextBox
  onPositionChange: (id: string, position: { x: number; y: number; width: number; height: number }) => void
  onContentChange: (id: string, content: string) => void
  onStyleChange: (id: string, style: PageTextBox['style']) => void
  onDelete: (id: string) => void
  containerRef: React.RefObject<HTMLDivElement>
  pageWidth?: number
}

function DraggableTextBox({ textBox, onPositionChange, onContentChange, onStyleChange, onDelete, containerRef, pageWidth = REFERENCE_PAGE_WIDTH }: DraggableTextBoxProps) {
  const t = useTranslations('writing')
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [showStyleMenu, setShowStyleMenu] = useState(false)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [resizeCorner, setResizeCorner] = useState<string | null>(null)
  const textBoxRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const menuDragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const startPosRef = useRef({ x: 0, y: 0, posX: 0, posY: 0, width: 0, height: 0 })

  // Gérer le début du drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isResizing || isEditing || showStyleMenu) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    
    const container = containerRef.current
    if (!container) return
    
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: textBox.position.x,
      posY: textBox.position.y,
      width: textBox.position.width,
      height: textBox.position.height,
    }
  }

  // Gérer le début du redimensionnement
  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeCorner(corner)
    
    const container = containerRef.current
    if (!container) return
    
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: textBox.position.x,
      posY: textBox.position.y,
      width: textBox.position.width,
      height: textBox.position.height,
    }
  }

  // Gérer le mouvement de la souris
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()

      if (isDragging) {
        const deltaX = ((e.clientX - startPosRef.current.x) / rect.width) * 100
        const deltaY = ((e.clientY - startPosRef.current.y) / rect.height) * 100
        
        const newX = Math.max(0, Math.min(100 - textBox.position.width, startPosRef.current.posX + deltaX))
        const newY = Math.max(0, Math.min(100 - textBox.position.height, startPosRef.current.posY + deltaY))
        
        onPositionChange(textBox.id, { ...textBox.position, x: newX, y: newY })
      }

      if (isResizing && resizeCorner) {
        const deltaX = ((e.clientX - startPosRef.current.x) / rect.width) * 100
        const deltaY = ((e.clientY - startPosRef.current.y) / rect.height) * 100
        
        let newWidth = startPosRef.current.width
        let newHeight = startPosRef.current.height
        let newX = startPosRef.current.posX
        let newY = startPosRef.current.posY
        
        if (resizeCorner.includes('e')) newWidth = Math.max(10, startPosRef.current.width + deltaX)
        if (resizeCorner.includes('w')) {
          newWidth = Math.max(10, startPosRef.current.width - deltaX)
          newX = startPosRef.current.posX + deltaX
        }
        if (resizeCorner.includes('s')) newHeight = Math.max(5, startPosRef.current.height + deltaY)
        if (resizeCorner.includes('n')) {
          newHeight = Math.max(5, startPosRef.current.height - deltaY)
          newY = startPosRef.current.posY + deltaY
        }
        
        onPositionChange(textBox.id, { x: newX, y: newY, width: newWidth, height: newHeight })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setResizeCorner(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, resizeCorner, textBox, onPositionChange, containerRef])

  // Double-clic pour éditer
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setTimeout(() => editorRef.current?.focus(), 0)
  }

  // Sauvegarder le contenu quand on quitte l'édition
  const handleBlur = () => {
    if (editorRef.current) {
      onContentChange(textBox.id, editorRef.current.innerHTML)
    }
    setIsEditing(false)
  }

  const lineHeightPx = typeof textBox.style.lineSpacing === 'number'
    ? textBox.style.lineSpacing
    : getScaledLineHeightPx((textBox.style.lineSpacing || 'normal') as LineSpacing, pageWidth)

  return (
    <div
      ref={textBoxRef}
      className="absolute"
      style={{
        left: `${textBox.position.x}%`,
        top: `${textBox.position.y}%`,
        width: `${textBox.position.width}%`,
        height: `${textBox.position.height}%`,
        cursor: isEditing ? 'text' : (isDragging ? 'grabbing' : 'grab'),
        zIndex: textBox.zIndex + 10,
        transform: textBox.rotation ? `rotate(${textBox.rotation}deg)` : undefined,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (!isDragging && !isResizing && !isEditing && !showStyleMenu) {
          setShowControls(false)
        }
      }}
    >
      {/* Zone de texte */}
      <div 
        className={cn(
          "w-full h-full rounded-lg overflow-hidden transition-shadow",
          showControls && !isEditing && "ring-2 ring-dream-400/50",
          isEditing && "ring-2 ring-aurora-500"
        )}
        style={{
          backgroundColor: textBox.style.backgroundColor 
            ? `rgba(${parseInt(textBox.style.backgroundColor.slice(1, 3), 16)}, ${parseInt(textBox.style.backgroundColor.slice(3, 5), 16)}, ${parseInt(textBox.style.backgroundColor.slice(5, 7), 16)}, ${textBox.style.backgroundOpacity || 0.8})`
            : 'transparent',
        }}
      >
        <div
          ref={editorRef}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleBlur()
            }
          }}
          className={cn(
            "w-full h-full overflow-auto outline-none",
            !isEditing && "pointer-events-none"
          )}
          style={{
            padding: `${8 * getPageScale(pageWidth)}px`,
            fontFamily: textBox.style.fontFamily,
            fontSize: `${getScaledFontSize(textBox.style.fontSize, pageWidth)}px`,
            color: textBox.style.color,
            textAlign: textBox.style.textAlign,
            fontWeight: textBox.style.isBold ? 'bold' : 'normal',
            fontStyle: textBox.style.isItalic ? 'italic' : 'normal',
            lineHeight: `${lineHeightPx}px`,
          }}
          dangerouslySetInnerHTML={{ __html: textBox.content }}
        />
      </div>

      {/* Contrôles */}
      {showControls && !isEditing && (
        <>
          {/* Bouton supprimer */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(textBox.id); }}
            className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors z-30 shadow-lg"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <X className="w-3 h-3" />
          </button>

          {/* Bouton style */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowStyleMenu(!showStyleMenu); }}
            className={cn(
              "absolute -top-2 -left-2 p-1.5 rounded-full transition-colors z-30 shadow-lg",
              showStyleMenu 
                ? "bg-dream-500 text-white" 
                : "bg-midnight-800 text-white hover:bg-dream-500"
            )}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Sparkles className="w-3 h-3" />
          </button>

          {/* Indicateur déplacer */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white pointer-events-none">
            <Move className="w-4 h-4" />
          </div>
        </>
      )}

      {/* Menu de style — rendu via portail pour éviter le décalage dû au scale() parent */}
      {showStyleMenu && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => { setShowStyleMenu(false); setMenuPos(null); }}
          />
          <div
            className="fixed z-[9999] w-[260px] max-h-[80vh] overflow-y-auto rounded-2xl bg-midnight-900/95 backdrop-blur-xl border border-midnight-700/50 shadow-2xl"
            style={menuPos
              ? { left: `${menuPos.x}px`, top: `${menuPos.y}px` }
              : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
            }
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — draggable */}
            <div
              className="sticky top-0 z-10 bg-midnight-900/95 backdrop-blur-xl px-4 pt-3 pb-2 border-b border-midnight-700/50 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
              onMouseDown={(e) => {
                e.preventDefault()
                const menuEl = e.currentTarget.parentElement!
                const rect = menuEl.getBoundingClientRect()
                const offsetX = e.clientX - rect.left
                const offsetY = e.clientY - rect.top
                const onMove = (ev: MouseEvent) => {
                  setMenuPos({ x: ev.clientX - offsetX, y: ev.clientY - offsetY })
                }
                const onUp = () => {
                  window.removeEventListener('mousemove', onMove)
                  window.removeEventListener('mouseup', onUp)
                }
                window.addEventListener('mousemove', onMove)
                window.addEventListener('mouseup', onUp)
              }}
            >
              <span className="text-sm font-medium text-white/90">{t('editor.textStyle')}</span>
              <button onClick={() => { setShowStyleMenu(false); setMenuPos(null); }} className="text-midnight-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-3">
              {/* Police */}
              <div>
                <label className="text-[11px] uppercase tracking-wider text-midnight-400 mb-1.5 block">{t('editor.font')}</label>
                <div className="grid grid-cols-2 gap-1">
                  {FONTS.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => onStyleChange(textBox.id, { ...textBox.style, fontFamily: font.family })}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-left text-xs transition-all",
                        textBox.style.fontFamily === font.family
                          ? "bg-aurora-500/20 text-aurora-300 ring-1 ring-aurora-500/40"
                          : "text-white/70 hover:bg-midnight-700/50"
                      )}
                      style={{ fontFamily: font.family }}
                    >
                      {t(font.nameKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style + Alignement sur une ligne */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[11px] uppercase tracking-wider text-midnight-400 mb-1.5 block">{t('editor.style')}</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onStyleChange(textBox.id, { ...textBox.style, isBold: !textBox.style.isBold })}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg font-bold text-sm transition-colors",
                        textBox.style.isBold ? "bg-aurora-500/20 text-aurora-300" : "text-white/60 hover:bg-midnight-700/50"
                      )}
                    >
                      {t('editor.bold')}
                    </button>
                    <button
                      onClick={() => onStyleChange(textBox.id, { ...textBox.style, isItalic: !textBox.style.isItalic })}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg italic text-sm transition-colors",
                        textBox.style.isItalic ? "bg-aurora-500/20 text-aurora-300" : "text-white/60 hover:bg-midnight-700/50"
                      )}
                    >
                      {t('editor.italic')}
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[11px] uppercase tracking-wider text-midnight-400 mb-1.5 block">{t('editor.align')}</label>
                  <div className="flex gap-1">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => onStyleChange(textBox.id, { ...textBox.style, textAlign: align })}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg transition-colors",
                          textBox.style.textAlign === align ? "bg-aurora-500/20 text-aurora-300" : "text-white/60 hover:bg-midnight-700/50"
                        )}
                      >
                        {align === 'left' && <AlignLeft className="w-3.5 h-3.5 mx-auto" />}
                        {align === 'center' && <AlignCenter className="w-3.5 h-3.5 mx-auto" />}
                        {align === 'right' && <AlignRight className="w-3.5 h-3.5 mx-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Couleur + Fond sur une ligne */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[11px] uppercase tracking-wider text-midnight-400 mb-1.5 block">{t('editor.color')}</label>
                  <div className="flex gap-1 flex-wrap">
                    {['#3d3426', '#000000', '#ffffff', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'].map((color) => (
                      <button
                        key={color}
                        onClick={() => onStyleChange(textBox.id, { ...textBox.style, color })}
                        className={cn(
                          "w-5 h-5 rounded-full border-2 transition-all",
                          textBox.style.color === color ? "border-aurora-400 scale-125" : "border-midnight-600 hover:border-midnight-400"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[11px] uppercase tracking-wider text-midnight-400 mb-1.5 block">{t('editor.bgColor')}</label>
                  <div className="flex gap-1 flex-wrap">
                    <button
                      onClick={() => onStyleChange(textBox.id, { ...textBox.style, backgroundColor: undefined })}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center",
                        !textBox.style.backgroundColor ? "border-aurora-400" : "border-midnight-600 hover:border-midnight-400"
                      )}
                      style={{ background: 'repeating-conic-gradient(#555 0% 25%, transparent 0% 50%) 50%/8px 8px' }}
                    />
                    {['#ffffff', '#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#1e1e1e'].map((color) => (
                      <button
                        key={color}
                        onClick={() => onStyleChange(textBox.id, { ...textBox.style, backgroundColor: color, backgroundOpacity: 0.9 })}
                        className={cn(
                          "w-5 h-5 rounded-full border-2 transition-all",
                          textBox.style.backgroundColor === color ? "border-aurora-400 scale-125" : "border-midnight-600 hover:border-midnight-400"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Taille */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-midnight-400">{t('editor.size')}</label>
                  <span className="text-[11px] text-aurora-400 font-medium">{textBox.style.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="48"
                  value={textBox.style.fontSize}
                  onChange={(e) => onStyleChange(textBox.id, { ...textBox.style, fontSize: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-midnight-700 rounded-full appearance-none cursor-pointer accent-aurora-500"
                />
              </div>

              {/* Interligne */}
              <div>
                <label className="text-[11px] uppercase tracking-wider text-midnight-400 mb-1.5 block">{t('editor.spacing')}</label>
                <div className="flex gap-1">
                  {Object.entries(LINE_SPACINGS).map(([key, { nameKey, pixelHeight }]) => (
                    <button
                      key={key}
                      onClick={() => onStyleChange(textBox.id, { ...textBox.style, lineSpacing: key as 'tight' | 'normal' | 'relaxed' })}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs transition-colors text-center",
                        (textBox.style.lineSpacing || 'normal') === key
                          ? "bg-aurora-500/20 text-aurora-300"
                          : "text-white/60 hover:bg-midnight-700/50"
                      )}
                    >
                      {t(nameKey)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Poignées de redimensionnement */}
      {showControls && !isEditing && !showStyleMenu && (
        <>
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-dream-500 rounded-full cursor-nw-resize z-20" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-dream-500 rounded-full cursor-ne-resize z-20" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-dream-500 rounded-full cursor-sw-resize z-20" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-dream-500 rounded-full cursor-se-resize z-20" onMouseDown={(e) => handleResizeStart(e, 'se')} />
          <div className="absolute top-1/2 -left-1 w-2 h-6 -translate-y-1/2 bg-white border-2 border-dream-500 rounded-full cursor-w-resize z-20" onMouseDown={(e) => handleResizeStart(e, 'w')} />
          <div className="absolute top-1/2 -right-1 w-2 h-6 -translate-y-1/2 bg-white border-2 border-dream-500 rounded-full cursor-e-resize z-20" onMouseDown={(e) => handleResizeStart(e, 'e')} />
        </>
      )}
    </div>
  )
}

// ============================================================================
// COMPOSANT : Fond d'image éditable (draggable)
// ============================================================================
// DRAGGABLE DECORATION - Décorations draggables sur les pages
// ============================================================================

interface DraggableDecorationProps {
  decoration: PageDecoration
  decorationItem: DecorationItem
  onPositionChange: (id: string, position: { x: number; y: number }) => void
  onScaleChange: (id: string, scale: number) => void
  onRotationChange: (id: string, rotation: number) => void
  onColorChange: (id: string, color: string) => void
  onOpacityChange: (id: string, opacity: number) => void
  onFlip: (id: string, direction: 'h' | 'v') => void
  onGlowChange: (id: string, glowEnabled: boolean, glowColor: string, glowIntensity: number) => void
  onDelete: (id: string) => void
  containerRef: React.RefObject<HTMLDivElement>
}

function DraggableDecoration({
  decoration,
  decorationItem,
  onPositionChange,
  onScaleChange,
  onRotationChange,
  onColorChange,
  onOpacityChange,
  onGlowChange,
  onFlip,
  onDelete,
  containerRef,
}: DraggableDecorationProps) {
  const t = useTranslations('writing')
  const [isDragging, setIsDragging] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [menuOffset, setMenuOffset] = useState({ x: 0, y: 0 }) // Offset de drag du menu
  const [isDraggingMenu, setIsDraggingMenu] = useState(false)
  const [menuDragStart, setMenuDragStart] = useState({ x: 0, y: 0 })
  const decorationRef = useRef<HTMLDivElement>(null)
  
  // Fermer le menu d'édition au clic extérieur
  useEffect(() => {
    if (!isEditing) return
    
    const handleClickOutside = (e: MouseEvent) => {
      const menuElement = document.getElementById(`decoration-menu-${decoration.id}`)
      const decorationElement = decorationRef.current
      
      // Vérifier si le clic est en dehors du menu ET de la décoration
      if (menuElement && !menuElement.contains(e.target as Node) &&
          decorationElement && !decorationElement.contains(e.target as Node)) {
        setIsEditing(false)
      }
    }
    
    // Délai pour éviter de fermer immédiatement après l'ouverture
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)
    
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditing, decoration.id])

  const color = decoration.color || decorationItem.defaultColor || '#D4AF37'
  const scale = decoration.scale || 1
  const rotation = decoration.rotation || 0
  const opacity = decoration.opacity || 1
  const glowEnabled = decoration.glowEnabled || false
  const glowColor = decoration.glowColor || color  // Par défaut, même couleur que la décoration
  const glowIntensity = decoration.glowIntensity || 50  // 0-100

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    
    // Stocker la position initiale du clic ET la position actuelle de la décoration
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      // Position du clic en pourcentage du conteneur
      const clickXPercent = ((e.clientX - rect.left) / rect.width) * 100
      const clickYPercent = ((e.clientY - rect.top) / rect.height) * 100
      // Offset entre le clic et le centre de la décoration
      setDragStart({ 
        x: clickXPercent - decoration.position.x, 
        y: clickYPercent - decoration.position.y 
      })
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return
      
      const rect = containerRef.current.getBoundingClientRect()
      // Position de la souris en pourcentage du conteneur
      const mouseXPercent = ((e.clientX - rect.left) / rect.width) * 100
      const mouseYPercent = ((e.clientY - rect.top) / rect.height) * 100
      
      // Soustraire l'offset initial pour maintenir la position relative
      const x = mouseXPercent - dragStart.x
      const y = mouseYPercent - dragStart.y
      
      // Clamp entre -20 et 120 pour permettre de dépasser un peu les bords
      const clampedX = Math.max(-20, Math.min(120, x))
      const clampedY = Math.max(-20, Math.min(120, y))
      
      onPositionChange(decoration.id, { x: clampedX, y: clampedY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, containerRef, decoration.id, onPositionChange])

  // Gérer le drag du menu d'édition
  useEffect(() => {
    if (!isDraggingMenu) return

    const handleMenuMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - menuDragStart.x
      const deltaY = e.clientY - menuDragStart.y
      setMenuOffset({ x: deltaX, y: deltaY })
    }

    const handleMenuMouseUp = () => {
      setIsDraggingMenu(false)
    }

    window.addEventListener('mousemove', handleMenuMouseMove)
    window.addEventListener('mouseup', handleMenuMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMenuMouseMove)
      window.removeEventListener('mouseup', handleMenuMouseUp)
    }
  }, [isDraggingMenu, menuDragStart])

  // Réinitialiser l'offset du menu quand on ferme/ouvre l'édition
  useEffect(() => {
    if (!isEditing) {
      setMenuOffset({ x: 0, y: 0 })
    }
  }, [isEditing])

  // Calculer la position du menu directement au click
  const updateMenuPosition = useCallback(() => {
    if (decorationRef.current) {
      const rect = decorationRef.current.getBoundingClientRect()
      const newPos = {
        x: rect.left + rect.width / 2,
        y: Math.min(rect.bottom + 10, window.innerHeight - 350)
      }
      console.log('Menu position updated:', newPos)
      setMenuPosition(newPos)
    }
  }, [])

  // Mettre à jour quand isEditing change ou quand la position change
  useEffect(() => {
    if (isEditing) {
      updateMenuPosition()
    }
  }, [isEditing, updateMenuPosition])

  const premiumColors = [
    '#D4AF37', // Or
    '#C0C0C0', // Argent
    '#B87333', // Cuivre
    '#E8B4B8', // Rose poudré
    '#7BA17B', // Vert sauge
    '#6B5B95', // Violet royal
    '#DC143C', // Rouge cramoisi
    '#1E3A5F', // Bleu marine
    '#2F4F4F', // Gris ardoise
    '#8B4513', // Brun selle
    '#FFB347', // Orange abricot
    '#DDA0DD', // Prune
  ]

  return (
    <>
    <div
      ref={decorationRef}
      className={cn(
        'absolute cursor-move select-none group overflow-visible',
        isDragging && 'z-50',
        isEditing && 'ring-2 ring-dream-400 ring-offset-2 ring-offset-transparent'
      )}
      style={{
        left: `${decoration.position.x}%`,
        top: `${decoration.position.y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale}) ${decoration.flipH ? 'scaleX(-1)' : ''} ${decoration.flipV ? 'scaleY(-1)' : ''}`,
        opacity,
        zIndex: isEditing ? 100 : 30,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation()
        console.log('Decoration wrapper clicked, isEditing:', isEditing)
        // Calculer la position du menu immédiatement
        if (decorationRef.current) {
          const rect = decorationRef.current.getBoundingClientRect()
          setMenuPosition({
            x: rect.left + rect.width / 2,
            y: Math.min(rect.bottom + 10, window.innerHeight - 350)
          })
        }
        setIsEditing(!isEditing)
      }}
    >
      {/* Croix rouge de suppression - visible quand sélectionné */}
      {isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(decoration.id)
          }}
          className="absolute -top-4 -right-4 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-2xl border-2 border-white cursor-pointer transition-all hover:scale-110"
          style={{ 
            transform: `rotate(${-rotation}deg) scale(${1/scale})`,
            zIndex: 200,
          }}
          title={t('deleteDecoration')}
        >
          <X className="w-5 h-5 text-white" strokeWidth={3} />
        </button>
      )}

      {/* SVG de la décoration - pointer-events:none pour que le clic soit capturé par le parent */}
      <div
        className="transition-transform hover:scale-110"
        style={{
          width: `${DECORATION_BASE_SIZE}px`,
          height: `${DECORATION_BASE_SIZE}px`,
          color,
          pointerEvents: 'none',
          filter: glowEnabled 
            ? `drop-shadow(0 0 ${Math.round(glowIntensity / 10)}px ${glowColor}) drop-shadow(0 0 ${Math.round(glowIntensity / 5)}px ${glowColor})`
            : 'none',
          transition: 'filter 0.3s ease'
        }}
        dangerouslySetInnerHTML={{ 
          __html: decorationItem.svg.replace('<svg ', '<svg width="100%" height="100%" ')
        }}
      />

      {/* SVG indicator quand sélectionné */}
      {isEditing && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-dream-500 rounded-full animate-pulse" />
      )}
    </div>

    {/* Menu d'édition flottant - rendu via Portal pour échapper au overflow:hidden du conteneur */}
    {isEditing && menuPosition.x > 0 && typeof document !== 'undefined' && createPortal(
      <div 
        id={`decoration-menu-${decoration.id}`}
        className="fixed bg-midnight-900/95 backdrop-blur-lg rounded-xl p-4 shadow-2xl border border-midnight-700 min-w-[280px]"
        style={{
          left: `${menuPosition.x + menuOffset.x}px`,
          top: `${menuPosition.y + menuOffset.y}px`,
          transform: 'translateX(-50%)',
          zIndex: 99999,
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header déplaçable avec croix de fermeture */}
        <div 
          className="flex items-center justify-between mb-3 pb-2 border-b border-midnight-700 cursor-move select-none"
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDraggingMenu(true)
            setMenuDragStart({ 
              x: e.clientX - menuOffset.x, 
              y: e.clientY - menuOffset.y 
            })
          }}
        >
          <span className="text-sm font-medium text-white flex items-center gap-2">
            <Move className="w-3.5 h-3.5 text-midnight-400" />
            {t('editDecoration')}
          </span>
          <button
            onClick={() => setIsEditing(false)}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 rounded-full hover:bg-midnight-700 text-midnight-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Taille */}
        <div className="mb-3">
          <label className="text-xs text-midnight-400 block mb-1">{t('size')}</label>
          <input
            type="range"
            min="20"
            max="300"
            value={scale * 100}
            onChange={(e) => onScaleChange(decoration.id, parseInt(e.target.value) / 100)}
            className="w-full h-2 bg-midnight-700 rounded-lg appearance-none cursor-pointer accent-dream-500"
          />
          <div className="flex justify-between text-[10px] text-midnight-500 mt-1">
            <span>20%</span>
            <span>{Math.round(scale * 100)}%</span>
            <span>300%</span>
          </div>
        </div>

        {/* Rotation */}
        <div className="mb-3">
          <label className="text-xs text-midnight-400 block mb-1">{t('rotation')}</label>
          <input
            type="range"
            min="-180"
            max="180"
            value={rotation}
            onChange={(e) => onRotationChange(decoration.id, parseInt(e.target.value))}
            className="w-full h-2 bg-midnight-700 rounded-lg appearance-none cursor-pointer accent-aurora-500"
          />
          <div className="flex justify-between text-[10px] text-midnight-500 mt-1">
            <span>-180°</span>
            <span>{rotation}°</span>
            <span>180°</span>
          </div>
        </div>

        {/* Opacité */}
        <div className="mb-3">
          <label className="text-xs text-midnight-400 block mb-1">{t('opacity')}</label>
          <input
            type="range"
            min="20"
            max="100"
            value={opacity * 100}
            onChange={(e) => onOpacityChange(decoration.id, parseInt(e.target.value) / 100)}
            className="w-full h-2 bg-midnight-700 rounded-lg appearance-none cursor-pointer accent-sunset-500"
          />
          <div className="flex justify-between text-[10px] text-midnight-500 mt-1">
            <span>20%</span>
            <span>{Math.round(opacity * 100)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Couleurs premium */}
        <div className="mb-3">
          <label className="text-xs text-midnight-400 block mb-2">{t('editor.color')}</label>
          <div className="grid grid-cols-6 gap-1.5">
            {premiumColors.map((c) => (
              <button
                key={c}
                onClick={() => onColorChange(decoration.id, c)}
                className={cn(
                  'w-6 h-6 rounded-full border-2 transition-all hover:scale-110',
                  color === c ? 'border-white shadow-lg ring-2 ring-white/30' : 'border-transparent'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Luminosité / Glow */}
        <div className="mb-3 p-3 rounded-lg bg-midnight-800/50 border border-midnight-700/50">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-midnight-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              {t('brightness')}
            </label>
            <button
              onClick={() => onGlowChange(decoration.id, !glowEnabled, glowColor, glowIntensity)}
              className={cn(
                'w-10 h-5 rounded-full transition-all relative',
                glowEnabled ? 'bg-aurora-500' : 'bg-midnight-600'
              )}
            >
              <div 
                className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all',
                  glowEnabled ? 'left-5' : 'left-0.5'
                )}
              />
            </button>
          </div>
          
          {glowEnabled && (
            <>
              {/* Intensité du glow */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-midnight-400 mb-1">
                  <span>{t('intensity')}</span>
                  <span className="text-aurora-400">{glowIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={glowIntensity}
                  onChange={(e) => onGlowChange(decoration.id, glowEnabled, glowColor, parseInt(e.target.value))}
                  className="w-full h-2 bg-midnight-700 rounded-lg appearance-none cursor-pointer slider-aurora"
                />
              </div>
              
              {/* Couleur du glow */}
              <div>
                <label className="text-xs text-midnight-400 block mb-1.5">{t('glowColor')}</label>
                <div className="grid grid-cols-6 gap-1">
                  {[
                    '#FFD700', // Or
                    '#FFFFFF', // Blanc
                    '#87CEEB', // Bleu ciel
                    '#FFB6C1', // Rose
                    '#90EE90', // Vert clair
                    '#DDA0DD', // Violet clair
                    '#FF6B6B', // Rouge
                    '#4ECDC4', // Turquoise
                    '#FF8C00', // Orange
                    '#9B59B6', // Violet
                    '#3498DB', // Bleu
                    '#1ABC9C', // Émeraude
                  ].map((c) => (
                    <button
                      key={c}
                      onClick={() => onGlowChange(decoration.id, glowEnabled, c, glowIntensity)}
                      className={cn(
                        'w-5 h-5 rounded-full border-2 transition-all hover:scale-110',
                        glowColor === c ? 'border-white shadow-lg ring-1 ring-white/50' : 'border-transparent',
                        'relative'
                      )}
                      style={{ 
                        backgroundColor: c,
                        boxShadow: glowColor === c ? `0 0 10px ${c}, 0 0 20px ${c}` : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-midnight-700">
          <div className="flex gap-1">
            <button
              onClick={() => onFlip(decoration.id, 'h')}
              className="p-2 rounded-lg bg-midnight-800 hover:bg-midnight-700 text-midnight-300 hover:text-white transition-colors"
              title={t('flipHorizontal')}
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => onFlip(decoration.id, 'v')}
              className="p-2 rounded-lg bg-midnight-800 hover:bg-midnight-700 text-midnight-300 hover:text-white transition-colors"
              title={t('flipVertical')}
            >
              <FlipVertical className="w-4 h-4" />
            </button>
            <button
              onClick={() => onRotationChange(decoration.id, 0)}
              className="p-2 rounded-lg bg-midnight-800 hover:bg-midnight-700 text-midnight-300 hover:text-white transition-colors"
              title={t('resetRotation')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => onDelete(decoration.id)}
            className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors flex items-center gap-1.5"
            title={t('deleteDecoration')}
          >
            <Trash2 className="w-4 h-4" />
            {t('deleteDecoration')}
          </button>
        </div>
      </div>,
      document.body
    )}
    </>
  )
}

// ============================================================================
// DECORATION PICKER - Sélecteur de décorations premium
// ============================================================================

interface DecorationPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (decorationId: string) => void
}

function DecorationPicker({ isOpen, onClose, onSelect }: DecorationPickerProps) {
  const t = useTranslations('writing')
  const [activeCategory, setActiveCategory] = useState<DecorationCategory>('gold')
  const [hoveredDecoration, setHoveredDecoration] = useState<string | null>(null)

  const filteredDecorations = PREMIUM_DECORATIONS.filter(d => d.category === activeCategory)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-midnight-950/90 backdrop-blur-md"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Modal */}
        <motion.div
          className="relative bg-gradient-to-br from-midnight-900 via-midnight-850 to-midnight-900 rounded-2xl shadow-2xl border border-midnight-700 overflow-hidden max-w-2xl w-full mx-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-midnight-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{t('decorations')}</h2>
                <p className="text-xs text-midnight-400">{t('decorationsSubtitle')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-midnight-800 text-midnight-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Categories */}
          <div className="flex gap-2 p-4 border-b border-midnight-700/30 overflow-x-auto">
            {DECORATION_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-dream-600 to-aurora-600 text-white shadow-lg'
                    : 'bg-midnight-800/50 text-midnight-300 hover:bg-midnight-800 hover:text-white'
                )}
              >
                <span>{cat.icon}</span>
                <span>{t(cat.nameKey)}</span>
              </button>
            ))}
          </div>

          {/* Grid de décorations */}
          <div className="p-4 max-h-[400px] overflow-y-auto">
            <div className="grid grid-cols-4 gap-4">
              {filteredDecorations.map((deco) => (
                <motion.button
                  key={deco.id}
                  onClick={() => {
                    onSelect(deco.id)
                    onClose()
                  }}
                  onMouseEnter={() => setHoveredDecoration(deco.id)}
                  onMouseLeave={() => setHoveredDecoration(null)}
                  className={cn(
                    'relative aspect-square rounded-xl border-2 transition-all p-4 group',
                    'bg-gradient-to-br from-midnight-800/50 to-midnight-900/50',
                    hoveredDecoration === deco.id
                      ? 'border-dream-500 shadow-lg shadow-dream-500/20 scale-105'
                      : 'border-midnight-700 hover:border-midnight-600'
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className="w-full h-full flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ color: deco.defaultColor }}
                    dangerouslySetInnerHTML={{ 
                      __html: deco.svg.replace('<svg ', '<svg width="100%" height="100%" ')
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2 text-center">
                    <span className="text-xs text-midnight-400 group-hover:text-white transition-colors">
                      {t(`decorationNames.${deco.id}`)}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-midnight-700/30 bg-midnight-900/50">
            <p className="text-xs text-midnight-500 text-center">
              💫 {t('decorationFooter')}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================================================
// EDITABLE BACKGROUND - Fond de page éditable
// ============================================================================

interface EditableBackgroundProps {
  backgroundMedia: BackgroundMedia
  onPositionChange: (x: number, y: number, scale: number) => void
  onEditEnd: () => void
  containerRef: React.RefObject<HTMLDivElement>
  roundedClass?: string
}

function EditableBackground({ 
  backgroundMedia, 
  onPositionChange, 
  onEditEnd,
  containerRef,
  roundedClass = 'rounded-r-lg'
}: EditableBackgroundProps) {
  const t = useTranslations('writing')
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ 
    x: backgroundMedia.x || 0, 
    y: backgroundMedia.y || 0,
    scale: backgroundMedia.scale || 1
  })
  
  // Synchroniser avec les props
  useEffect(() => {
    setPosition({
      x: backgroundMedia.x || 0,
      y: backgroundMedia.y || 0,
      scale: backgroundMedia.scale || 1
    })
  }, [backgroundMedia.x, backgroundMedia.y, backgroundMedia.scale])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      setPosition(prev => ({ ...prev, x: newX, y: newY }))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      onPositionChange(position.x, position.y, position.scale)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, position, onPositionChange])

  // Gérer le zoom à la molette
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newScale = Math.max(0.1, Math.min(3, position.scale + delta))
    setPosition(prev => ({ ...prev, scale: newScale }))
    onPositionChange(position.x, position.y, newScale)
  }

  return (
    <div 
      className={`absolute inset-0 overflow-hidden ${roundedClass} z-50 cursor-move`}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
    >
      {/* Image de fond avec transformation */}
      {backgroundMedia.type === 'video' ? (
        <video
          src={backgroundMedia.url}
          className="absolute w-full h-full object-cover pointer-events-none"
          style={{ 
            opacity: backgroundMedia.opacity,
            transform: `translate(${position.x}px, ${position.y}px) scale(${position.scale})`,
            transformOrigin: 'center center',
          }}
          muted
          loop
          autoPlay
          playsInline
        />
      ) : (
        <img
          src={backgroundMedia.url}
          alt=""
          className="absolute w-full h-full object-cover pointer-events-none"
          style={{ 
            opacity: backgroundMedia.opacity,
            transform: `translate(${position.x}px, ${position.y}px) scale(${position.scale})`,
            transformOrigin: 'center center',
          }}
        />
      )}
      
      {/* Overlay d'édition */}
      <div className="absolute inset-0 border-4 border-aurora-500 border-dashed pointer-events-none" />
      
      {/* Instructions */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-midnight-900/90 rounded-full text-xs text-white flex items-center gap-2 pointer-events-none">
        <Move className="w-3.5 h-3.5" />
        {t('dragToMove')} • {t('scrollToZoom')}
      </div>
      
      {/* Bouton terminer */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onEditEnd()
        }}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-aurora-500 hover:bg-aurora-600 text-white text-sm font-medium rounded-lg shadow-lg transition-colors pointer-events-auto"
      >
        ✓ {t('done')}
      </button>

      {/* Affichage des valeurs */}
      <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 rounded text-[10px] text-white pointer-events-none">
        {t('zoom')}: {Math.round(position.scale * 100)}%
      </div>
    </div>
  )
}

// ============================================================================
// COMPOSANT : Onglet de page
// ============================================================================

interface PageTabProps {
  page: StoryPageLocal
  index: number
  totalPages: number
  isActive: boolean
  chapter?: Chapter
  onClick: () => void
  onDelete?: () => void
  canDelete: boolean
}

function PageTab({ page, index, totalPages, isActive, chapter, onClick, onDelete, canDelete }: PageTabProps) {
  const t = useTranslations('writing')
  const hasContent = page.content.length > 0
  const hasImage = !!page.image || (page.images && page.images.length > 0)
  
  // Déterminer si c'est une page de couverture
  const isFrontCover = index === 0
  const isBackCover = index === totalPages - 1 && totalPages > 1
  
  // Label de la page
  const getPageLabel = () => {
    if (isFrontCover) return `📕 ${t('frontCover')}`
    if (isBackCover) return `📗 ${t('backCover')}`
    return page.title || `Page ${index + 1}`
  }
  
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative flex flex-col gap-0.5 px-3 py-2 rounded-t-xl transition-all min-w-[90px] max-w-[140px]',
        'border-t border-l border-r',
        isActive 
          ? 'bg-midnight-800 border-aurora-500/30 text-white -mb-px z-10' 
          : 'bg-midnight-900/50 border-midnight-700/30 text-midnight-400 hover:text-white hover:bg-midnight-800/50',
        // Style spécial pour les couvertures
        isFrontCover && 'border-t-amber-500/50',
        isBackCover && 'border-t-emerald-500/50'
      )}
      style={{
        borderTopColor: isFrontCover ? '#f59e0b' : isBackCover ? '#10b981' : chapter ? chapter.color : undefined,
        borderTopWidth: (isFrontCover || isBackCover || chapter) ? '3px' : '1px'
      }}
      whileHover={{ y: -2 }}
      layout
    >
      {/* Badge couverture */}
      {(isFrontCover || isBackCover) && (
        <span className={cn(
          "text-[9px] font-medium truncate w-full",
          isFrontCover ? "text-amber-400" : "text-emerald-400"
        )}>
          {isFrontCover ? t('frontCover').toUpperCase() : t('backCoverShort').toUpperCase()}
        </span>
      )}
      
      {/* Chapitre si assigné (et pas une couverture) */}
      {chapter && !isFrontCover && !isBackCover && (
        <span 
          className="text-[9px] font-medium truncate w-full"
          style={{ color: chapter.color }}
        >
          {chapter.title}
        </span>
      )}
      
      {/* Numéro et indicateurs */}
      <div className="flex items-center gap-1.5 w-full">
        <div className="flex gap-0.5">
        {hasContent && <div className="w-1.5 h-1.5 rounded-full bg-aurora-400" title={t('textIndicator')} />}
        {hasImage && <div className="w-1.5 h-1.5 rounded-full bg-stardust-400" title={t('imageIndicator')} />}
        {!hasContent && !hasImage && <div className="w-1.5 h-1.5 rounded-full bg-midnight-600" />}
      </div>
      
        <span className="truncate text-xs">
        {getPageLabel()}
      </span>
      
      {/* Bouton supprimer */}
      {canDelete && isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.()
          }}
            className="ml-auto p-0.5 rounded hover:bg-red-500/20 text-midnight-500 hover:text-red-400 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
      </div>
    </motion.button>
  )
}

// ============================================================================
// COMPOSANT : Vue d'ensemble (miniatures)
// ============================================================================

interface OverviewProps {
  pages: StoryPageLocal[]
  currentPage: number
  onPageSelect: (index: number) => void
  onClose: () => void
}

function Overview({ pages, currentPage, onPageSelect, onClose }: OverviewProps) {
  const t = useTranslations('writing')
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-midnight-950/90 z-50 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-midnight-900 rounded-2xl p-6 max-w-5xl w-full max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display text-white">{t('overview')}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-midnight-800 text-midnight-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {pages.map((page, index) => {
            const isFrontCover = index === 0
            const isBackCover = index === pages.length - 1 && pages.length > 1
            
            return (
            <motion.button
              key={page.id}
              onClick={() => {
                onPageSelect(index)
                onClose()
              }}
              className={cn(
                'aspect-[3/4] rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all relative',
                'border-2',
                currentPage === index
                  ? 'border-aurora-500 bg-aurora-500/10'
                  : isFrontCover
                    ? 'border-amber-500/50 bg-amber-500/5 hover:border-amber-400'
                    : isBackCover
                      ? 'border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-400'
                      : 'border-midnight-700 bg-midnight-800/50 hover:border-midnight-600'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Badge couverture */}
              {(isFrontCover || isBackCover) && (
                <div className={cn(
                  "absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-bold whitespace-nowrap",
                  isFrontCover ? "bg-amber-500 text-amber-950" : "bg-emerald-500 text-emerald-950"
                )}>
                  {isFrontCover ? `📕 ${t('frontCover').toUpperCase()}` : `📗 ${t('backCover').toUpperCase()}`}
                </div>
              )}
              
              {/* Miniature */}
              {page.image ? (
                <div 
                  className="w-full h-16 rounded bg-cover bg-center"
                  style={{ backgroundImage: `url(${page.image})` }}
                />
              ) : page.content ? (
                <div className="w-full h-16 rounded bg-midnight-700/50 p-2 overflow-hidden">
                  <p className="text-[6px] text-midnight-400 leading-tight line-clamp-6">
                    {page.content}
                  </p>
                </div>
              ) : (
                <div className="w-full h-16 rounded bg-midnight-700/30 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-midnight-600" />
                </div>
              )}
              
              {/* Titre */}
              <span className={cn(
                'text-xs truncate w-full text-center',
                currentPage === index 
                  ? 'text-aurora-300' 
                  : isFrontCover 
                    ? 'text-amber-300'
                    : isBackCover
                      ? 'text-emerald-300'
                      : 'text-midnight-400'
              )}>
                {isFrontCover ? t('frontCover') : isBackCover ? t('backCover') : (page.title || `Page ${index + 1}`)}
              </span>
            </motion.button>
          )}
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// COMPOSANT : Éditeur de Couverture
// ============================================================================

interface CoverEditorProps {
  cover: StoryPageLocal | null
  coverType: 'front' | 'back'
  storyTitle: string
  bookFormat?: BookFormat
  onClose: () => void
  onUpdateCover: (updates: Partial<StoryPageLocal>) => void
  onImageAdd: () => void
  onBackgroundAdd: () => void
}

function CoverEditor({ 
  cover, 
  coverType, 
  storyTitle,
  bookFormat = 'square-21',
  onClose, 
  onUpdateCover,
  onImageAdd,
  onBackgroundAdd,
}: CoverEditorProps) {
  const t = useTranslations('writing')
  const formatConfig = BOOK_FORMATS.find(f => f.id === bookFormat)
  const formatRatio = formatConfig ? formatConfig.widthMm / formatConfig.heightMm : 1

  const title = coverType === 'front' ? `📕 ${t('frontCover')}` : `📖 ${t('backCover')}`
  const placeholder = coverType === 'front'
    ? t('coverPlaceholderFront')
    : t('coverPlaceholderBack')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-midnight-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-midnight-800 text-midnight-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Aperçu de la couverture */}
          <div className="flex flex-col items-center">
            <div 
              className="relative rounded-lg shadow-2xl overflow-hidden bg-midnight-800"
              style={{ 
                width: '280px',
                height: `${280 / formatRatio}px`,
              }}
            >
              {/* Fond de la couverture */}
              {cover?.backgroundMedia?.url ? (
                <img 
                  src={cover.backgroundMedia.url} 
                  alt="Fond" 
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ opacity: cover.backgroundMedia.opacity || 1 }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-aurora-500/20 to-stardust-500/20" />
              )}
              
              {/* Images sur la couverture */}
              {cover?.images?.map((img) => (
                <img 
                  key={img.id}
                  src={img.url} 
                  alt="" 
                  className="absolute"
                  style={{
                    left: `${img.position.x}%`,
                    top: `${img.position.y}%`,
                    width: `${img.position.width}%`,
                    height: `${img.position.height}%`,
                    objectFit: 'cover',
                  }}
                />
              ))}
              
              {/* Texte par défaut pour la couverture */}
              {coverType === 'front' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <h3 className="text-2xl font-display text-white drop-shadow-lg">
                    {storyTitle || 'Mon histoire'}
                  </h3>
                </div>
              )}
              
              {/* Contenu texte */}
              {cover?.content && (
                <div className="absolute inset-0 p-4 flex items-end">
                  <p className="text-white/80 text-sm line-clamp-4">
                    {cover.content}
                  </p>
                </div>
              )}
            </div>
            
            <p className="text-midnight-400 text-sm mt-4">
              Format: {formatConfig?.name || 'Standard'}
            </p>
          </div>
          
          {/* Outils d'édition */}
          <div className="space-y-4">
            {/* Texte */}
            <div className="glass-card p-4">
              <label className="block text-sm font-medium text-midnight-300 mb-2">
                {coverType === 'front' ? t('coverTextFront') : t('coverTextBack')}
              </label>
              <textarea
                value={cover?.content || ''}
                onChange={(e) => onUpdateCover({ content: e.target.value })}
                placeholder={placeholder}
                rows={4}
                className="w-full px-4 py-3 bg-midnight-800/50 border border-midnight-700 rounded-xl text-white placeholder-midnight-500 focus:outline-none focus:ring-2 focus:ring-aurora-500 resize-none"
              />
            </div>
            
            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onBackgroundAdd}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-midnight-800 hover:bg-midnight-700 text-white rounded-xl transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
                <span>{t('background')}</span>
              </button>
              
              <button
                onClick={onImageAdd}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-midnight-800 hover:bg-midnight-700 text-white rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>{t('addImage')}</span>
              </button>
            </div>
            
            <p className="text-midnight-500 text-xs text-center">
              💡 {t('coverTip')}
              <br />
              {t('coverTipQuality')}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            <Check className="w-4 h-4 mr-2" />
            {t('done')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// COMPOSANT : Vue Structure (chapitres et organisation)
// ============================================================================

interface StructureViewProps {
  pages: StoryPageLocal[]
  chapters: Chapter[]
  currentPage: number
  storyStructure?: string
  onPageSelect: (index: number) => void
  onAddChapter: (chapter: Chapter) => void
  onDeleteChapter: (chapterId: string) => void
  onAssignPageToChapter: (pageIndex: number, chapterId: string | undefined) => void
  onClose: () => void
}

const CHAPTER_TYPES = [
  { type: 'intro' as const, labelKey: 'chapterTypes.intro', color: '#22c55e', icon: '📖' },
  { type: 'development' as const, labelKey: 'chapterTypes.dev', color: '#3b82f6', icon: '📝' },
  { type: 'climax' as const, labelKey: 'chapterTypes.climax', color: '#f97316', icon: '⚡' },
  { type: 'conclusion' as const, labelKey: 'chapterTypes.conclusion', color: '#8b5cf6', icon: '🎬' },
  { type: 'custom' as const, labelKey: 'chapterTypes.custom', color: '#ec4899', icon: '✨' },
]

function StructureView({ 
  pages, 
  chapters, 
  currentPage, 
  storyStructure,
  onPageSelect, 
  onAddChapter,
  onDeleteChapter,
  onAssignPageToChapter,
  onClose 
}: StructureViewProps) {
  const t = useTranslations('writing')
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [selectedType, setSelectedType] = useState<Chapter['type']>('custom')
  const [showAddChapter, setShowAddChapter] = useState(false)

  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) return
    const typeConfig = CHAPTER_TYPES.find(t => t.type === selectedType)!
    onAddChapter({
      id: Date.now().toString(),
      title: newChapterTitle,
      type: selectedType,
      color: typeConfig.color,
    })
    setNewChapterTitle('')
    setShowAddChapter(false)
  }

  // Grouper les pages par chapitre
  const pagesByChapter = chapters.map(chapter => ({
    chapter,
    pages: pages.map((p, i) => ({ ...p, index: i })).filter(p => p.chapterId === chapter.id)
  }))
  
  const unassignedPages = pages.map((p, i) => ({ ...p, index: i })).filter(p => !p.chapterId)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-midnight-950/90 z-50 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-midnight-900 rounded-2xl p-6 max-w-4xl w-full max-h-[85vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ListTree className="w-6 h-6 text-aurora-400" />
            <h2 className="text-xl font-display text-white">{t('storyStructure')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-midnight-800 text-midnight-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre de progression visuelle */}
        <div className="mb-6 p-4 bg-midnight-800/50 rounded-xl">
          <p className="text-sm text-midnight-400 mb-3">{t('storyProgress')}</p>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-midnight-700">
            {chapters.map((chapter, i) => {
              const chapterPages = pages.filter(p => p.chapterId === chapter.id)
              const width = (chapterPages.length / Math.max(pages.length, 1)) * 100
              return (
                <div
                  key={chapter.id}
                  className="h-full transition-all"
                  style={{ 
                    backgroundColor: chapter.color, 
                    width: `${width}%`,
                    minWidth: chapterPages.length > 0 ? '8px' : '0'
                  }}
                  title={`${chapter.title} (${chapterPages.length} pages)`}
                />
              )
            })}
            {unassignedPages.length > 0 && (
              <div
                className="h-full bg-midnight-600"
                style={{ width: `${(unassignedPages.length / pages.length) * 100}%` }}
                title={t('unassignedCount', { count: unassignedPages.length })}
              />
            )}
          </div>
          <div className="flex justify-between mt-2 text-xs text-midnight-500">
            <span>{t('beginning')}</span>
            <span>{t('totalPages', { count: pages.length })}</span>
            <span>{t('end')}</span>
          </div>
        </div>

        {/* Chapitres */}
        <div className="space-y-4">
          {pagesByChapter.map(({ chapter, pages: chapterPages }) => (
            <div key={chapter.id} className="rounded-xl border border-midnight-700/50 overflow-hidden">
              <div 
                className="flex items-center justify-between p-3"
                style={{ backgroundColor: `${chapter.color}20` }}
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4" style={{ color: chapter.color }} />
                  <span className="font-medium text-white">{chapter.title}</span>
                  <span className="text-xs text-midnight-400">
                    ({chapterPages.length} {chapterPages.length > 1 ? t('pages') : t('page')})
                  </span>
                </div>
                <button
                  onClick={() => onDeleteChapter(chapter.id)}
                  className="p-1.5 rounded hover:bg-midnight-800/50 text-midnight-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              {chapterPages.length > 0 ? (
                <div className="p-3 grid grid-cols-6 gap-2">
                  {chapterPages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => {
                        onPageSelect(page.index)
                        onClose()
                      }}
                      className={cn(
                        'aspect-[3/4] rounded-lg p-2 flex flex-col items-center justify-center gap-1 transition-all text-xs',
                        'border',
                        currentPage === page.index
                          ? 'border-aurora-500 bg-aurora-500/10'
                          : 'border-midnight-700 bg-midnight-800/30 hover:border-midnight-600'
                      )}
                    >
                      <FileText className="w-4 h-4 text-midnight-400" />
                      <span className="text-midnight-300 truncate w-full text-center">
                        P.{page.index + 1}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="p-3 text-sm text-midnight-500 italic">
                  {t('dragPagesHint')}
                </p>
              )}
            </div>
          ))}

          {/* Pages non assignées */}
          {unassignedPages.length > 0 && (
            <div className="rounded-xl border border-midnight-700/50 border-dashed overflow-hidden">
              <div className="flex items-center gap-2 p-3 bg-midnight-800/30">
                <FileText className="w-4 h-4 text-midnight-500" />
                <span className="text-midnight-400">{t('unassignedPages')}</span>
              </div>
              <div className="p-3 grid grid-cols-6 gap-2">
                {unassignedPages.map((page) => (
                  <div key={page.id} className="relative group">
                    <button
                      onClick={() => {
                        onPageSelect(page.index)
                        onClose()
                      }}
                      className={cn(
                        'w-full aspect-[3/4] rounded-lg p-2 flex flex-col items-center justify-center gap-1 transition-all text-xs',
                        'border',
                        currentPage === page.index
                          ? 'border-aurora-500 bg-aurora-500/10'
                          : 'border-midnight-700 bg-midnight-800/30 hover:border-midnight-600'
                      )}
                    >
                      <FileText className="w-4 h-4 text-midnight-400" />
                      <span className="text-midnight-300 truncate w-full text-center">
                        P.{page.index + 1}
                      </span>
                    </button>
                    {/* Menu pour assigner à un chapitre */}
                    {chapters.length > 0 && (
                      <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              onAssignPageToChapter(page.index, e.target.value)
                            }
                          }}
                          className="w-6 h-6 rounded-full bg-aurora-500 text-white text-xs cursor-pointer appearance-none text-center"
                          title={t('assignToChapter')}
                          defaultValue=""
                        >
                          <option value="" disabled>+</option>
                          {chapters.map(ch => (
                            <option key={ch.id} value={ch.id}>{ch.title}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ajouter un chapitre */}
        <div className="mt-6">
          {showAddChapter ? (
            <div className="p-4 bg-midnight-800/50 rounded-xl space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder={t('chapterNamePlaceholder')}
                  className="flex-1 bg-midnight-900/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-aurora-500/30"
                  autoFocus
                />
                <button
                  onClick={handleAddChapter}
                  disabled={!newChapterTitle.trim()}
                  className="px-4 py-2 rounded-lg bg-aurora-500 text-white text-sm font-medium disabled:opacity-50"
                >
                  {t('add')}
                </button>
                <button
                  onClick={() => setShowAddChapter(false)}
                  className="px-3 py-2 rounded-lg bg-midnight-700 text-midnight-300 text-sm"
                >
                  {t('cancel')}
                </button>
              </div>
              <div className="flex gap-2">
                {CHAPTER_TYPES.map((type) => (
                  <button
                    key={type.type}
                    onClick={() => {
                      setSelectedType(type.type)
                      if (!newChapterTitle) setNewChapterTitle(t(type.labelKey))
                    }}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all',
                      selectedType === type.type
                        ? 'ring-2 ring-white/50'
                        : 'opacity-70 hover:opacity-100'
                    )}
                    style={{ backgroundColor: `${type.color}30`, color: type.color }}
                  >
                    <span>{type.icon}</span>
                    <span>{t(type.labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddChapter(true)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-midnight-700 hover:border-aurora-500/50 text-midnight-400 hover:text-aurora-400 transition-colors"
            >
              <FolderPlus className="w-5 h-5" />
              <span>{t('chapters.new')}</span>
            </button>
          )}
        </div>

        {/* Suggestions de structure */}
        {chapters.length === 0 && (
          <div className="mt-6 p-4 bg-aurora-500/10 rounded-xl border border-aurora-500/20">
            <p className="text-sm text-aurora-300 mb-3">💡 {t('structure')}</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  CHAPTER_TYPES.slice(0, 4).forEach((type, i) => {
                    setTimeout(() => {
                      onAddChapter({
                        id: Date.now().toString() + i,
                        title: t(type.labelKey),
                        type: type.type,
                        color: type.color,
                      })
                    }, i * 100)
                  })
                }}
                className="px-3 py-2 rounded-lg bg-midnight-800 hover:bg-midnight-700 text-sm text-white transition-colors"
              >
                📚 Structure classique (4 parties)
              </button>
              <button
                onClick={() => {
                  ['Chapitre 1', 'Chapitre 2', 'Chapitre 3'].forEach((title, i) => {
                    setTimeout(() => {
                      onAddChapter({
                        id: Date.now().toString() + i,
                        title,
                        type: 'custom',
                        color: ['#3b82f6', '#22c55e', '#f97316'][i],
                      })
                    }, i * 100)
                  })
                }}
                className="px-3 py-2 rounded-lg bg-midnight-800 hover:bg-midnight-700 text-sm text-white transition-colors"
              >
                📖 3 chapitres
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// COMPOSANT : Barre de formatage (contentEditable + execCommand)
// ============================================================================

// ============================================================================
// ALERTE DE SAUVEGARDE — modale bloquante si les saves échouent > 2 min
// ============================================================================

function SaveIndicator() {
  const { status, errorMsg } = useSaveStatus()
  const t = useTranslations('writing')
  const [showAlert, setShowAlert] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const errorStartRef = useRef<number | null>(null)

  useEffect(() => {
    if (status === 'error') {
      if (!errorStartRef.current) errorStartRef.current = Date.now()
      const interval = setInterval(() => {
        if (errorStartRef.current && Date.now() - errorStartRef.current > 120_000) {
          setShowAlert(true)
        }
      }, 10_000)
      return () => clearInterval(interval)
    } else {
      errorStartRef.current = null
      setShowAlert(false)
    }
  }, [status])

  const handleManualSave = async () => {
    setIsSaving(true)
    const ok = await triggerManualSave()
    setIsSaving(false)
    if (!ok) {
      setShowAlert(true)
    }
  }

  return (
    <>
      {/* Bouton de sauvegarde toujours visible */}
      <button
        onClick={handleManualSave}
        disabled={isSaving || status === 'saving'}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          status === 'error'
            ? "text-red-400 hover:text-red-300 hover:bg-red-900/30"
            : status === 'saved'
            ? "text-green-400 hover:text-green-300 hover:bg-green-900/30"
            : "text-midnight-400 hover:text-white hover:bg-midnight-800/50"
        )}
        title={t('saveButton')}
      >
        {isSaving || status === 'saving' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : status === 'saved' ? (
          <Check className="w-4 h-4" />
        ) : status === 'error' ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
      </button>

      {/* Modale d'erreur après 2 min ou échec sauvegarde manuelle */}
      {showAlert && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('saveError.title')}</h3>
                <p className="text-sm text-gray-500">{errorMsg}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">{t('saveError.description')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-aurora-500 text-white font-medium hover:bg-aurora-600 transition-colors"
              >
                {t('saveError.reload')}
              </button>
              <button
                onClick={() => setShowAlert(false)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                {t('saveError.dismiss')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

interface FormatBarProps {
  style: TextStyle
  onStyleChange: (style: Partial<TextStyle>) => void
  activePageIndex: number
  showLines?: boolean
  onToggleLines?: () => void
  bookColor?: PageColor
  onBookColorChange?: (color: PageColor) => void
  // Fond de page
  backgroundMedia?: BackgroundMedia
  onBackgroundAdd?: () => void
  onBackgroundOpacityChange?: (opacity: number) => void
  onBackgroundPositionChange?: (x: number, y: number, scale: number) => void
  onBackgroundRemove?: () => void
  onBackgroundEditToggle?: () => void
  isEditingBackground?: boolean
  // Zones de sécurité pour l'impression
  showSafeZones?: boolean
  onToggleSafeZones?: () => void
  bookFormat?: BookFormat
  onBookFormatChange?: (format: BookFormat) => void
}

function FormatBar({ style, onStyleChange, activePageIndex, showLines = true, onToggleLines, bookColor = 'cream', onBookColorChange, backgroundMedia, onBackgroundAdd, onBackgroundOpacityChange, onBackgroundPositionChange, onBackgroundRemove, onBackgroundEditToggle, isEditingBackground, showSafeZones = false, onToggleSafeZones, bookFormat, onBookFormatChange }: FormatBarProps) {
  const t = useTranslations('writing')
  const locale = useLocale()
  const [showFonts, setShowFonts] = useState(false)
  const [showFontSizes, setShowFontSizes] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const [showPageColors, setShowPageColors] = useState(false)
  const [showBackgroundMenu, setShowBackgroundMenu] = useState(false)
  const [showLineSpacing, setShowLineSpacing] = useState(false)
  const [showFormatMenu, setShowFormatMenu] = useState(false)
  const [lastUsedColor, setLastUsedColor] = useState('#ef4444')
  const [lastUsedSize, setLastUsedSize] = useState(style.fontSize)
  const [detectedFontFamily, setDetectedFontFamily] = useState(style.fontFamily)
  const isFormattingRef = useRef(false)
  
  // Ref pour la barre de formatage (pour détecter les clics extérieurs)
  const formatBarRef = useRef<HTMLDivElement>(null)
  
  // Refs pour éviter les re-renders inutiles
  const lastDetectedSizeRef = useRef(style.fontSize)
  const lastDetectedFontRef = useRef(style.fontFamily)
  
  // Fermer les menus au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Si aucun menu n'est ouvert, ne rien faire
      if (!showFonts && !showFontSizes && !showColors && !showPageColors && !showBackgroundMenu && !showLineSpacing && !showFormatMenu) {
        return
      }
      
      // Vérifier si le clic est à l'extérieur de la barre de formatage
      if (formatBarRef.current && !formatBarRef.current.contains(event.target as Node)) {
        setShowFonts(false)
        setShowFontSizes(false)
        setShowColors(false)
        setShowPageColors(false)
        setShowBackgroundMenu(false)
        setShowLineSpacing(false)
        setShowFormatMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFonts, showFontSizes, showColors, showPageColors, showBackgroundMenu, showLineSpacing, showFormatMenu])
  
  // Détecter la taille de police et la police au curseur
  useEffect(() => {
    const detectFontStyles = () => {
      // Ignorer pendant le formatage
      if (isFormattingRef.current) return
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        let node: Node | null = range.startContainer
        
        // Remonter jusqu'à trouver un élément avec un style
        while (node && node.nodeType !== Node.ELEMENT_NODE) {
          node = node.parentNode
        }
        
        if (node && node instanceof HTMLElement) {
          // Vérifier si on est dans un contentEditable
          const editor = node.closest?.('[contenteditable="true"]')
          if (editor) {
            const computedStyle = window.getComputedStyle(node)
            
            // Détecter la taille (seulement si différente)
            const fontSize = parseInt(computedStyle.fontSize, 10)
            if (fontSize && !isNaN(fontSize) && fontSize !== lastDetectedSizeRef.current) {
              lastDetectedSizeRef.current = fontSize
              setLastUsedSize(fontSize)
            }
            
            // Détecter la police (seulement si différente)
            const fontFamily = computedStyle.fontFamily
            if (fontFamily) {
              const cleanFont = fontFamily.split(',')[0].replace(/['"]/g, '').trim()
              const matchedFont = FONTS.find(f => 
                fontFamily.toLowerCase().includes(f.family.toLowerCase()) ||
                cleanFont.toLowerCase() === f.family.toLowerCase()
              )
              if (matchedFont && matchedFont.family !== lastDetectedFontRef.current) {
                lastDetectedFontRef.current = matchedFont.family
                setDetectedFontFamily(matchedFont.family)
              }
            }
          }
        }
      }
    }
    
    document.addEventListener('selectionchange', detectFontStyles)
    return () => document.removeEventListener('selectionchange', detectFontStyles)
  }, [])
  
  // Ref pour sauvegarder la sélection avant un clic sur la toolbar
  const savedRangeRef = useRef<{ text: string; range: Range | null }>({ text: '', range: null })
  
  // Sauvegarder la sélection/curseur actuel (appelé automatiquement sur selectionchange)
  const captureSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      // Vérifier que la sélection/curseur est dans une zone contentEditable
      const anchorNode = selection.anchorNode
      if (anchorNode) {
        const editor = (anchorNode as Element).closest?.('[contenteditable="true"]') ||
                       anchorNode.parentElement?.closest('[contenteditable="true"]')
        if (editor) {
          savedRangeRef.current = {
            text: selection.toString(),
            range: selection.getRangeAt(0).cloneRange()
          }
        }
      }
    }
  }, [])
  
  // Écouter les changements de sélection
  useEffect(() => {
    document.addEventListener('selectionchange', captureSelection)
    return () => document.removeEventListener('selectionchange', captureSelection)
  }, [captureSelection])
  
  // Restaurer la sélection si nécessaire et appliquer un formatage
  const applyFormatWithRestore = useCallback((formatFn: () => void) => {
    // Vérifier d'abord s'il y a une sélection/curseur actif dans un contentEditable
    const currentSelection = window.getSelection()
    const hasActiveSelection = currentSelection && currentSelection.rangeCount > 0
    const isInEditor = hasActiveSelection && (() => {
      const node = currentSelection.anchorNode
      const editor = (node as Element)?.closest?.('[contenteditable="true"]') ||
                     node?.parentElement?.closest('[contenteditable="true"]')
      return !!editor
    })()

    if (isInEditor) {
      // Curseur/sélection déjà dans l'éditeur, appliquer directement
      formatFn()
    } else {
      // Pas dans l'éditeur, restaurer depuis la sauvegarde
      const { range } = savedRangeRef.current
      if (range) {
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
        }
        formatFn()
      }
    }
  }, [])

  const currentFont = FONTS.find(f => f.family === detectedFontFamily) || FONTS.find(f => f.family === style.fontFamily) || FONTS[3]
  
  // Helper : Insérer un span stylé au curseur (comportement Word)
  // Permet d'appliquer un style au texte qui sera tapé ensuite
  const insertStyledSpanAtCursor = useCallback((styleProps: { fontFamily?: string; fontSize?: number; color?: string }) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return false
    
    const range = selection.getRangeAt(0)
    
    // Vérifier qu'on est dans un contenteditable
    const container = range.startContainer
    const editor = container.nodeType === Node.ELEMENT_NODE 
      ? (container as HTMLElement).closest?.('[contenteditable="true"]')
      : container.parentElement?.closest?.('[contenteditable="true"]')
    
    if (!editor) return false
    
    // Créer un span avec un caractère invisible (zero-width space)
    const span = document.createElement('span')
    span.innerHTML = '\u200B' // Zero-width space pour que le span ne soit pas vide
    
    if (styleProps.fontFamily) {
      span.style.fontFamily = styleProps.fontFamily
    }
    if (styleProps.fontSize) {
      span.style.fontSize = `${styleProps.fontSize}px`
    }
    if (styleProps.color) {
      span.style.color = styleProps.color
    }
    
    // Insérer le span au curseur
    range.deleteContents()
    range.insertNode(span)
    
    // Placer le curseur APRÈS le zero-width space (à l'intérieur du span)
    const newRange = document.createRange()
    newRange.setStart(span.firstChild!, 1) // Après le \u200B
    newRange.collapse(true)
    selection.removeAllRanges()
    selection.addRange(newRange)
    
    // Déclencher un événement input pour sauvegarder
    editor.dispatchEvent(new Event('input', { bubbles: true }))
    
    return true
  }, [])
  
  // Appliquer gras au texte sélectionné
  const applyBold = () => {
    isFormattingRef.current = true
    document.execCommand('bold', false)
    setTimeout(() => { isFormattingRef.current = false }, 50)
  }
  
  // Appliquer italique au texte sélectionné
  const applyItalic = () => {
    isFormattingRef.current = true
    document.execCommand('italic', false)
    setTimeout(() => { isFormattingRef.current = false }, 50)
  }
  
  // Appliquer une couleur au texte sélectionné ou au curseur
  const applyColor = (color: string) => {
    isFormattingRef.current = true
    
    // Vérifier s'il y a une sélection
    const selection = window.getSelection()
    const hasSelection = selection && selection.rangeCount > 0 && !selection.isCollapsed
    
    if (hasSelection) {
      // Sélection active : utiliser execCommand
      document.execCommand('foreColor', false, color)
    } else {
      // Pas de sélection : insérer un span stylé au curseur (comportement Word)
      insertStyledSpanAtCursor({ color })
    }
    
    setLastUsedColor(color)
    setShowColors(false)
    setTimeout(() => { isFormattingRef.current = false }, 50)
  }
  
  // Appliquer une taille de police au texte sélectionné ou au style par défaut
  const applyFontSize = (size: number) => {
    // Vérifier d'abord la sélection ACTUELLE (pas savedRangeRef)
    const currentSelection = window.getSelection()
    const hasCurrentSelection = currentSelection && currentSelection.rangeCount > 0 && !currentSelection.isCollapsed
    
    // Helper pour appliquer la taille à un range
    const applyToRange = (targetRange: Range, sel: Selection) => {
      // Extraire le contenu et nettoyer les tailles existantes
      const fragment = targetRange.extractContents()
      const tempDiv = document.createElement('div')
      tempDiv.appendChild(fragment)
      
      // Retirer les font-size existants des éléments enfants
      tempDiv.querySelectorAll('[style]').forEach(el => {
        (el as HTMLElement).style.fontSize = ''
      })
      // Retirer aussi les spans vides de style
      tempDiv.querySelectorAll('span').forEach(el => {
        if (!el.getAttribute('style') || el.getAttribute('style')?.trim() === '') {
          el.replaceWith(...Array.from(el.childNodes))
        }
      })
      
      // Créer le nouveau span avec la taille
      const span = document.createElement('span')
      span.style.fontSize = `${size}px`
      span.innerHTML = tempDiv.innerHTML
      targetRange.insertNode(span)
      
      // Re-sélectionner le contenu du span créé
      const newRange = document.createRange()
      newRange.selectNodeContents(span)
      sel.removeAllRanges()
      sel.addRange(newRange)
      
      // Sauvegarder la nouvelle sélection
      savedRangeRef.current = {
        text: span.textContent || '',
        range: newRange.cloneRange()
      }
      
      lastDetectedSizeRef.current = size
      setLastUsedSize(size)
    }
    
    if (hasCurrentSelection && currentSelection) {
      // Sélection active actuellement, l'utiliser directement
      applyToRange(currentSelection.getRangeAt(0), currentSelection)
    } else {
      // Pas de sélection actuelle - vérifier si on avait une sélection sauvegardée
      const { range, text } = savedRangeRef.current
      if (range && text) {
        // On avait une sélection, mais le curseur a bougé sans sélection
        // => comportement Word : insérer au curseur actuel
        const inserted = insertStyledSpanAtCursor({ fontSize: size })
        if (!inserted) {
          onStyleChange({ fontSize: size })
        }
        // Vider la sélection sauvegardée puisqu'on ne l'utilise plus
        savedRangeRef.current = { text: '', range: null }
      } else {
        // Aucune sélection du tout : insérer un span stylé au curseur (comportement Word)
        const inserted = insertStyledSpanAtCursor({ fontSize: size })
        if (!inserted) {
          // Si pas dans un éditeur, changer le style par défaut
          onStyleChange({ fontSize: size })
        }
      }
      lastDetectedSizeRef.current = size
      setLastUsedSize(size)
    }
    setShowFontSizes(false)
  }
  
  // Appliquer une police au texte sélectionné uniquement
  const applyFontFamily = (family: string) => {
    // Vérifier d'abord s'il y a une sélection active
    const currentSelection = window.getSelection()
    const hasActiveSelection = currentSelection && currentSelection.rangeCount > 0 && !currentSelection.isCollapsed
    
    const applyToRange = (range: Range, sel: Selection) => {
      // Extraire le contenu et nettoyer les polices existantes
      const fragment = range.extractContents()
      const tempDiv = document.createElement('div')
      tempDiv.appendChild(fragment)
      
      // Retirer les font-family existants des éléments enfants
      tempDiv.querySelectorAll('[style]').forEach(el => {
        (el as HTMLElement).style.fontFamily = ''
      })
      // Retirer les font tags (ancienne méthode)
      tempDiv.querySelectorAll('font[face]').forEach(el => {
        el.removeAttribute('face')
      })
      // Retirer les spans vides de style
      tempDiv.querySelectorAll('span').forEach(el => {
        if (!el.getAttribute('style') || el.getAttribute('style')?.trim() === '') {
          el.replaceWith(...Array.from(el.childNodes))
        }
      })
      
      // Créer le nouveau span avec la police
      const span = document.createElement('span')
      span.style.fontFamily = family
      span.innerHTML = tempDiv.innerHTML
      range.insertNode(span)
      
      // Re-sélectionner le contenu du span créé
      const newRange = document.createRange()
      newRange.selectNodeContents(span)
      sel.removeAllRanges()
      sel.addRange(newRange)
      
      lastDetectedFontRef.current = family
      setDetectedFontFamily(family)
    }
    
    if (hasActiveSelection && currentSelection) {
      // Sélection active actuellement, l'utiliser directement
      applyToRange(currentSelection.getRangeAt(0), currentSelection)
    } else {
      // Pas de sélection actuelle - comportement Word : insérer au curseur
      const inserted = insertStyledSpanAtCursor({ fontFamily: family })
      if (!inserted) {
        // Si pas dans un éditeur, changer le style par défaut
        onStyleChange({ fontFamily: family })
      }
      // Vider la sélection sauvegardée puisqu'on ne l'utilise plus
      savedRangeRef.current = { text: '', range: null }
      lastDetectedFontRef.current = family
      setDetectedFontFamily(family)
    }
    setShowFonts(false)
  }
  
  // Insérer des espaces
  const insertSpaces = (count: number) => {
    if (count > 0) {
      document.execCommand('insertText', false, '    ')
    } else {
      for (let i = 0; i < Math.abs(count); i++) {
        document.execCommand('delete', false)
      }
    }
  }
  
  // Insérer un saut de ligne
  const insertLineBreak = () => {
    document.execCommand('insertLineBreak', false)
  }
  
  return (
    <div ref={formatBarRef} className="flex items-center gap-2 p-2 bg-midnight-900/50 rounded-xl border border-midnight-700/30 flex-wrap">
      {/* Sélecteur de police */}
      <Highlightable id="book-font-family">
        <div className="relative">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowFonts(!showFonts)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-midnight-800/50 hover:bg-midnight-800 text-white transition-colors min-w-[120px]"
            title={t('editor.font')}
          >
            <span style={{ fontFamily: currentFont.family }} className="text-lg">
              {currentFont.preview}
            </span>
            <span className="text-sm text-midnight-300">{t(currentFont.nameKey)}</span>
            <ChevronRight className={cn("w-4 h-4 ml-auto transition-transform", showFonts && "rotate-90")} />
          </button>
          
          <AnimatePresence>
            {showFonts && (
              <>
                {/* Overlay pour fermer au clic extérieur */}
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowFonts(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-2 p-2 bg-midnight-900 rounded-xl border border-midnight-700/50 shadow-xl z-50 w-48"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {FONTS.map((font) => (
                    <button
                      key={font.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyFontFamily(font.family)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                        detectedFontFamily === font.family 
                          ? 'bg-aurora-500/20 text-aurora-300' 
                          : 'hover:bg-midnight-800 text-white'
                      )}
                    >
                      <span style={{ fontFamily: font.family }} className="text-xl w-8">
                        {font.preview}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{t(font.nameKey)}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </Highlightable>
      
      {/* Séparateur */}
      <div className="w-px h-6 bg-midnight-700/50" />
      
      {/* Taille */}
      <Highlightable id="book-font-size">
        <div className="relative">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowFontSizes(!showFontSizes)}
            className="flex items-center gap-1 px-2 py-1 rounded text-sm hover:bg-midnight-800 text-midnight-300 min-w-[50px] justify-center"
            title={t('editor.size')}
          >
            <span>{lastUsedSize}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          
          <AnimatePresence>
            {showFontSizes && (
              <>
                {/* Overlay pour fermer au clic extérieur */}
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowFontSizes(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-0 mt-1 glass rounded-lg shadow-xl z-50 p-1 max-h-48 overflow-y-auto"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {FONT_SIZES.map((size) => (
                    <button
                      key={size}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyFontSize(size)}
                      className={cn(
                        'w-full px-3 py-1 text-left text-sm rounded transition-colors',
                        lastUsedSize === size
                          ? 'bg-aurora-500/20 text-aurora-300'
                          : 'hover:bg-midnight-800 text-midnight-300'
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </Highlightable>
      
      
      {/* Gras / Italique */}
      <div className="flex items-center gap-1">
        <Highlightable id="book-bold">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={applyBold}
            className="w-8 h-8 rounded flex items-center justify-center font-bold transition-colors hover:bg-midnight-800 text-midnight-400 hover:text-aurora-300"
            title={t('editor.bold')}
          >
            {t('editor.bold')}
          </button>
        </Highlightable>
        <Highlightable id="book-italic">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={applyItalic}
            className="w-8 h-8 rounded flex items-center justify-center italic transition-colors hover:bg-midnight-800 text-midnight-400 hover:text-aurora-300"
            title={t('editor.italic')}
          >
            {t('editor.italic')}
          </button>
        </Highlightable>
      </div>
      
      {/* Séparateur */}
      <div className="w-px h-6 bg-midnight-700/50" />
      
      {/* Alignement (par paragraphe via execCommand) */}
      <Highlightable id="book-text-align">
        <div className="flex items-center gap-1">
          {[
            { id: 'left' as const, cmd: 'justifyLeft', icon: AlignLeft, titleKey: 'alignLeft' },
            { id: 'center' as const, cmd: 'justifyCenter', icon: AlignCenter, titleKey: 'alignCenter' },
            { id: 'right' as const, cmd: 'justifyRight', icon: AlignRight, titleKey: 'alignRight' },
          ].map(({ id, cmd, icon: Icon, titleKey }) => (
            <button
              key={id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                applyFormatWithRestore(() => {
                  isFormattingRef.current = true
                  document.execCommand(cmd, false)
                  setTimeout(() => { isFormattingRef.current = false }, 50)
                })
              }}
              className={cn(
                'w-7 h-7 rounded flex items-center justify-center transition-colors',
                'hover:bg-midnight-800 text-midnight-400 hover:text-aurora-300'
              )}
              title={t(titleKey)}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </Highlightable>
      
      {/* Séparateur */}
      <div className="w-px h-6 bg-midnight-700/50" />
      
      {/* Espacement de ligne +/- */}
      <Highlightable id="book-line-spacing">
        <div className="flex items-center bg-midnight-800/30 rounded-lg">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const current = getLineHeightPx(style.lineSpacing || 'normal')
              onStyleChange({ ...style, lineSpacing: Math.max(style.fontSize || 8, current - 2) })
            }}
            className="w-7 h-7 rounded-l-lg flex items-center justify-center text-midnight-400 hover:text-aurora-300 hover:bg-midnight-800 transition-colors"
            title={t('editor.spacing')}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <div className="w-10 h-7 flex items-center justify-center text-[10px] text-midnight-300 border-x border-midnight-700/30">
            {getLineHeightPx(style.lineSpacing || 'normal')}px
          </div>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const current = getLineHeightPx(style.lineSpacing || 'normal')
              onStyleChange({ ...style, lineSpacing: current + 2 })
            }}
            className="w-7 h-7 rounded-r-lg flex items-center justify-center text-midnight-400 hover:text-aurora-300 hover:bg-midnight-800 transition-colors"
            title={t('editor.spacing')}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </Highlightable>
      
      {/* Séparateur */}
      <div className="w-px h-6 bg-midnight-700/50" />
      
      {/* Espaces et saut de ligne */}
      <div className="flex items-center gap-1">
        <div className="flex items-center bg-midnight-800/30 rounded-lg">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormatWithRestore(() => insertSpaces(-4))}
            className="w-7 h-7 rounded-l-lg flex items-center justify-center text-midnight-400 hover:text-aurora-300 hover:bg-midnight-800 transition-colors"
            title={t('removeSpaces')}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-7 flex items-center justify-center text-[10px] text-midnight-300 border-x border-midnight-700/30">
            Tab
          </div>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormatWithRestore(() => insertSpaces(4))}
            className="w-7 h-7 rounded-r-lg flex items-center justify-center text-midnight-400 hover:text-aurora-300 hover:bg-midnight-800 transition-colors"
            title={t('addTab')}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
          <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertLineBreak}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-midnight-400 hover:text-aurora-300 hover:bg-midnight-800 transition-colors bg-midnight-800/30"
          title={t('lineBreak')}
        >
          <ChevronDown className="w-4 h-4" />
          </button>
          </div>
      
      {/* Séparateur */}
      <div className="w-px h-6 bg-midnight-700/50" />
      
      {/* Couleur */}
      <Highlightable id="book-text-color">
      <div className="relative">
          <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowColors(!showColors)}
          className="flex flex-col items-center justify-center w-8 h-8 rounded hover:bg-midnight-800 transition-colors"
          title={t('textColor')}
        >
          <span className="text-sm font-bold" style={{ color: lastUsedColor }}>A</span>
          <div className="w-5 h-1 rounded-sm" style={{ backgroundColor: lastUsedColor }} />
          </button>
        
        <AnimatePresence>
          {showColors && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-10"
                onClick={() => setShowColors(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                className="absolute top-full left-0 mt-2 p-3 bg-midnight-900 rounded-xl border border-midnight-700/50 shadow-xl z-50"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-midnight-400">{t('textColor')}</p>
          <button
                    onClick={() => setShowColors(false)}
                    className="text-midnight-500 hover:text-white text-xs"
          >
                    ✕
          </button>
      </div>
      
                <div className="space-y-1">
                  {/* Gris */}
                  <div className="flex gap-0.5">
                    {['#ffffff', '#e5e5e5', '#a3a3a3', '#737373', '#525252', '#262626', '#000000'].map((color) => (
          <button
                        key={color}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyColor(color)}
                        className="w-5 h-5 rounded-sm transition-all hover:scale-110 hover:ring-1 hover:ring-white/50"
                        style={{ backgroundColor: color, border: color === '#ffffff' ? '1px solid #525252' : 'none' }}
          />
        ))}
                  </div>
                  {/* Couleurs */}
                  {[
                    ['#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#7f1d1d'],
                    ['#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#7c2d12'],
                    ['#fef08a', '#fde047', '#facc15', '#eab308', '#ca8a04', '#a16207', '#713f12'],
                    ['#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#14532d'],
                    ['#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#164e63'],
                    ['#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e3a8a'],
                    ['#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#4c1d95'],
                    ['#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#831843'],
                  ].map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-0.5">
                      {row.map((color) => (
                        <button
                          key={color}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyColor(color)}
                          className="w-5 h-5 rounded-sm transition-all hover:scale-110 hover:ring-1 hover:ring-white/50"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      </Highlightable>
      
      {/* Séparateur */}
      <div className="w-px h-6 bg-midnight-700/50" />
      
      {/* Bouton lignes de cahier */}
      {onToggleLines && (
        <Highlightable id="book-lines">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggleLines}
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors",
            showLines 
              ? "bg-aurora-500/20 text-aurora-300" 
              : "text-midnight-400 hover:bg-midnight-800"
          )}
          title={showLines ? t('hideLines') : t('showLines')}
        >
          {/* Icône lignes de cahier */}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="8" x2="20" y2="8" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="16" x2="20" y2="16" />
          </svg>
        </button>
        </Highlightable>
      )}
      
      {/* Bouton zones de sécurité impression */}
      {onToggleSafeZones && (
        <Highlightable id="book-safe-zones">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggleSafeZones}
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors",
            showSafeZones 
              ? "bg-amber-500/20 text-amber-300" 
              : "text-midnight-400 hover:bg-midnight-800"
          )}
          title={showSafeZones ? t('hideSafeZones') : t('showSafeZones')}
        >
          {/* Icône zones de sécurité (cadre avec marges) */}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* Cadre extérieur (fond perdu) */}
            <rect x="2" y="2" width="20" height="20" rx="1" strokeDasharray="3 2" className="text-red-400" />
            {/* Cadre intérieur (zone sûre) */}
            <rect x="5" y="5" width="14" height="14" rx="1" strokeDasharray="2 2" className="text-amber-400" />
          </svg>
          <span className="text-xs hidden sm:inline">{t('margins')}</span>
        </button>
        </Highlightable>
      )}
      
      {/* Sélecteur de format du livre */}
      {onBookFormatChange && (
        <Highlightable id="book-format">
        <div className="relative">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowFormatMenu(!showFormatMenu)}
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors",
              showFormatMenu 
                ? "bg-dream-500/20 text-dream-300" 
                : "text-midnight-400 hover:bg-midnight-800"
            )}
            title={t('bookFormat')}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="4" y="2" width="12" height="18" rx="1" />
              <line x1="4" y1="6" x2="16" y2="6" />
            </svg>
            <span className="text-xs hidden sm:inline">{t('format')}</span>
          </button>
          
          {/* Menu des formats */}
          <AnimatePresence>
            {showFormatMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowFormatMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full left-0 mt-2 p-3 bg-midnight-900 rounded-xl border border-midnight-700 shadow-xl z-50 min-w-[220px]"
                >
                  <div className="text-xs text-midnight-400 mb-2 font-medium">{t('bookFormat')}</div>
                  <div className="flex flex-col gap-1">
                    {BOOK_FORMATS.map((format) => (
                      <button
                        key={format.id}
                        onClick={() => {
                          onBookFormatChange(format.id)
                          setShowFormatMenu(false)
                        }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors",
                          bookFormat === format.id
                            ? "bg-dream-500/20 text-dream-300"
                            : "text-midnight-300 hover:bg-midnight-800"
                        )}
                      >
                        <span className="text-lg">{format.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{locale === 'fr' ? format.nameFr : format.name}</span>
                          <span className="text-xs text-midnight-500">{format.widthMm}×{format.heightMm}mm</span>
                        </div>
                        {bookFormat === format.id && (
                          <Check className="w-4 h-4 ml-auto text-dream-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        </Highlightable>
      )}
      
      {/* Sélecteur de couleur du livre */}
      {onBookColorChange && (
        <Highlightable id="book-color">
        <div className="relative">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowPageColors(!showPageColors)}
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors",
              showPageColors 
                ? "bg-dream-500/20 text-dream-300" 
                : "text-midnight-400 hover:bg-midnight-800"
            )}
            title={t('pageColor')}
          >
            <Palette className="w-4 h-4" />
          </button>
          
          {/* Menu de couleurs */}
          <AnimatePresence>
            {showPageColors && (
              <>
                {/* Overlay pour fermer au clic extérieur */}
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPageColors(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full left-0 mt-2 p-3 bg-midnight-900 rounded-xl border border-midnight-700 shadow-xl z-50 min-w-[200px]"
                >
                  <div className="text-xs text-midnight-400 mb-2 font-medium">{t('pageColor')}</div>
                  <div className="grid grid-cols-5 gap-2">
                    {PAGE_COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => {
                          onBookColorChange(color.id)
                          setShowPageColors(false)
                        }}
                        className={cn(
                          "w-8 h-8 rounded-lg border-2 transition-all hover:scale-110",
                          color.bg,
                          bookColor === color.id
                            ? "border-aurora-500 ring-2 ring-aurora-500/30"
                            : "border-midnight-600 hover:border-midnight-500"
                        )}
                        title={t(color.nameKey)}
                      />
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        </Highlightable>
      )}
      
      {/* Bouton fond de page */}
      {onBackgroundAdd && (
        <Highlightable id="book-add-background">
        <div className="relative">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowBackgroundMenu(!showBackgroundMenu)}
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors",
              backgroundMedia 
                ? "bg-aurora-500/20 text-aurora-300" 
                : showBackgroundMenu
                  ? "bg-dream-500/20 text-dream-300"
                  : "text-midnight-400 hover:bg-midnight-800"
            )}
            title={t('background')}
          >
            <Layers className="w-4 h-4" />
          </button>
          
          {/* Menu fond de page */}
          <AnimatePresence>
            {showBackgroundMenu && (
              <>
                {/* Overlay pour fermer au clic extérieur */}
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowBackgroundMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 p-3 bg-midnight-900 rounded-xl border border-midnight-700 shadow-xl z-50 min-w-[220px]"
                >
                  <div className="text-xs text-midnight-400 mb-3 font-medium">{t('background')}</div>
                
                {backgroundMedia ? (
                  <>
                    {/* Aperçu du fond actuel */}
                    <div className="relative w-full h-20 rounded-lg overflow-hidden mb-3 bg-midnight-800">
                      {backgroundMedia.type === 'video' ? (
                        <video
                          src={backgroundMedia.url}
                          className="w-full h-full object-cover"
                          style={{ opacity: backgroundMedia.opacity }}
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <img
                          src={backgroundMedia.url}
                          alt="Fond"
                          className="w-full h-full object-cover"
                          style={{ opacity: backgroundMedia.opacity }}
                        />
                      )}
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white">
                        {backgroundMedia.type === 'video' ? '🎬' : '🖼️'} {Math.round(backgroundMedia.opacity * 100)}%
                      </div>
                    </div>
                    
                    {/* Slider d'opacité */}
                    <div className="mb-3">
                      <label className="text-xs text-midnight-400 block mb-1">{t('opacity')}</label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={backgroundMedia.opacity * 100}
                        onChange={(e) => onBackgroundOpacityChange?.(parseInt(e.target.value) / 100)}
                        className="w-full h-2 bg-midnight-700 rounded-lg appearance-none cursor-pointer accent-aurora-500"
                      />
                      <div className="flex justify-between text-[10px] text-midnight-500 mt-1">
                        <span>10%</span>
                        <span>{Math.round(backgroundMedia.opacity * 100)}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                    
                    {/* Slider de zoom */}
                    <div className="mb-3">
                      <label className="text-xs text-midnight-400 block mb-1">{t('zoom')}</label>
                      <input
                        type="range"
                        min="10"
                        max="300"
                        value={(backgroundMedia.scale || 1) * 100}
                        onChange={(e) => onBackgroundPositionChange?.(
                          backgroundMedia.x || 0,
                          backgroundMedia.y || 0,
                          parseInt(e.target.value) / 100
                        )}
                        className="w-full h-2 bg-midnight-700 rounded-lg appearance-none cursor-pointer accent-dream-500"
                      />
                      <div className="flex justify-between text-[10px] text-midnight-500 mt-1">
                        <span>10%</span>
                        <span>{Math.round((backgroundMedia.scale || 1) * 100)}%</span>
                        <span>300%</span>
                      </div>
                    </div>
                    
                    {/* Bouton éditer position */}
                    <button
                      onClick={() => {
                        onBackgroundEditToggle?.()
                        setShowBackgroundMenu(false)
                      }}
                      className={`w-full mb-3 px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        isEditingBackground 
                          ? 'bg-aurora-500 text-white' 
                          : 'bg-midnight-800 hover:bg-midnight-700 text-white'
                      }`}
                    >
                      <Move className="w-3.5 h-3.5" />
                      {isEditingBackground ? t('finishPositioning') : t('moveImage')}
                    </button>
                    
                    {/* Boutons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onBackgroundAdd()
                          setShowBackgroundMenu(false)
                        }}
                        className="flex-1 px-3 py-1.5 bg-midnight-800 hover:bg-midnight-700 text-white text-xs rounded-lg transition-colors"
                      >
                        {t('change')}
                      </button>
                      <button
                        onClick={() => {
                          onBackgroundRemove?.()
                          setShowBackgroundMenu(false)
                        }}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-midnight-500 mb-3">
                      {t('addBackgroundHint')}
                    </p>
                    <button
                      onClick={() => {
                        onBackgroundAdd()
                        setShowBackgroundMenu(false)
                      }}
                      className="w-full px-3 py-2 bg-gradient-to-r from-aurora-600 to-dream-600 text-white text-sm font-medium rounded-lg hover:from-aurora-500 hover:to-dream-500 transition-colors flex items-center justify-center gap-2"
                    >
                      <ImagePlus className="w-4 h-4" />
                      {t('addBackground')}
                    </button>
                  </>
                )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        </Highlightable>
      )}
    </div>
  )
}

// ============================================================================
// COMPOSANT : Zone d'écriture avec titre de page
// ============================================================================

interface WritingAreaProps {
  // Page droite (principale)
  page?: StoryPageLocal
  pageIndex: number
  chapters: Chapter[]
  onContentChange: (content: string) => void
  onTitleChange: (title: string) => void
  onStyleChange: (pageIndex: number, style: Partial<TextStyle>) => void
  onChapterChange: (chapterId: string | undefined) => void
  onCreateChapter: (title: string) => void
  onUpdateChapter?: (chapterId: string, updates: Partial<Chapter>) => void
  onImageAdd: (pageIndex: number) => void
  // Callbacks multi-images (nouveau)
  onImagePositionChange?: (pageIndex: number, imageId: string, position: ImagePosition) => void
  onImageStyleChange?: (pageIndex: number, imageId: string, style: ImageStyle) => void
  onImageFrameChange?: (pageIndex: number, imageId: string, frame: FrameStyle) => void
  onImageOpacityChange?: (pageIndex: number, imageId: string, opacity: number) => void
  onImageDelete?: (pageIndex: number, imageId: string) => void
  onImageBringForward?: (pageIndex: number, imageId: string) => void
  onImageSendBackward?: (pageIndex: number, imageId: string) => void
  onImageCreateNew?: (imageUrl: string, pageIndex: number) => void  // Créer nouvelle image avec même personnage
  onVideoPosterChange?: (pageIndex: number, imageId: string, poster: string) => void
  onConvertVideoToImage?: (pageIndex: number, imageId: string, imageUrl: string) => void
  locale?: 'fr' | 'en' | 'ru'
  onPrevPage?: () => void
  onNextPage?: () => void
  hasPrevPage?: boolean
  hasNextPage?: boolean
  totalPages?: number
  // Page gauche (livre ouvert)
  leftPage?: StoryPageLocal
  leftPageIndex?: number
  onLeftContentChange?: (content: string) => void
  // Header intégré
  storyTitle?: string
  onStoryTitleChange?: (title: string) => void
  onBack?: () => void
  onShowStructure?: () => void
  onShowOverview?: () => void
  // Callback pour notifier le parent du changement de zoom
  onZoomChange?: (zoomedPage: 'left' | 'right' | null) => void
  // Permet au parent de contrôler la page zoomée
  externalZoomedPage?: 'left' | 'right' | null
  // Afficher/masquer les lignes de cahier
  showLines?: boolean
  onToggleLines?: () => void
  // Couleur du livre (globale)
  bookColor?: PageColor
  onBookColorChange?: (color: PageColor) => void
  // Fond de page
  onBackgroundAdd?: (pageIndex: number) => void
  onBackgroundOpacityChange?: (pageIndex: number, opacity: number) => void
  onBackgroundPositionChange?: (pageIndex: number, x: number, y: number, scale: number) => void
  onBackgroundRemove?: (pageIndex: number) => void
  // Décorations premium
  onDecorationAdd?: (pageIndex: number) => void
  onDecorationPositionChange?: (pageIndex: number, decoId: string, position: { x: number; y: number }) => void
  onDecorationScaleChange?: (pageIndex: number, decoId: string, scale: number) => void
  onDecorationRotationChange?: (pageIndex: number, decoId: string, rotation: number) => void
  onDecorationColorChange?: (pageIndex: number, decoId: string, color: string) => void
  onDecorationOpacityChange?: (pageIndex: number, decoId: string, opacity: number) => void
  onDecorationGlowChange?: (pageIndex: number, decoId: string, glowEnabled: boolean, glowColor: string, glowIntensity: number) => void
  onDecorationFlip?: (pageIndex: number, decoId: string, direction: 'h' | 'v') => void
  onDecorationDelete?: (pageIndex: number, decoId: string) => void
  // Zones de texte flottantes
  onTextBoxAdd?: (pageIndex: number) => void
  onTextBoxPositionChange?: (pageIndex: number, textBoxId: string, position: { x: number; y: number; width: number; height: number }) => void
  onTextBoxContentChange?: (pageIndex: number, textBoxId: string, content: string) => void
  onTextBoxStyleChange?: (pageIndex: number, textBoxId: string, style: PageTextBox['style']) => void
  onTextBoxDelete?: (pageIndex: number, textBoxId: string) => void
  // Verrouillage de l'édition (histoire terminée)
  isLocked?: boolean
  onUnlock?: () => void
  // Format du livre (pour les proportions)
  bookFormat?: BookFormat
  onBookFormatChange?: (format: BookFormat) => void
  // Afficher les zones de sécurité pour l'impression
  showSafeZones?: boolean
  onToggleSafeZones?: () => void
  // Pages de couverture
  hasFrontCover?: boolean
  hasBackCover?: boolean
  onShowFrontCover?: () => void
  onShowBackCover?: () => void
  // Export PDF
  onExportPdf?: () => void
  isExportingPdf?: boolean
  exportStatus?: string
}

// Helper pour obtenir le ratio du format
function getFormatRatio(bookFormat: BookFormat = 'portrait-a5'): number {
  const format = BOOK_FORMATS.find(f => f.id === bookFormat)
  if (!format) return 0.7 // Portrait par défaut (A5)
  return format.widthMm / format.heightMm
}

// Composant pour afficher les zones de sécurité d'impression
function SafeZoneOverlay({ format, side }: { format: BookFormatConfig | undefined; side: 'left' | 'right' }) {
  const t = useTranslations('writing')
  if (!format) return null
  
  // Calculer les pourcentages des marges
  const safeZonePercent = (format.safeZoneMm / format.widthMm) * 100
  const bleedPercent = (format.bleedMm / format.widthMm) * 100
  const spineMarginPercent = (format.spineMarginMm / format.widthMm) * 100
  
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Zone de fond perdu (bleed) - rouge - sera coupée à l'impression */}
      <div 
        className="absolute border-2 border-dashed border-red-500/50"
        style={{
          top: `${bleedPercent}%`,
          bottom: `${bleedPercent}%`,
          left: `${bleedPercent}%`,
          right: `${bleedPercent}%`,
        }}
      />
      
      {/* Zone VERTE = zone sûre où le contenu sera toujours visible */}
      <div 
        className="absolute border-2 border-solid border-emerald-500/70 bg-emerald-500/5"
        style={{
          top: `${safeZonePercent + bleedPercent}%`,
          bottom: `${safeZonePercent + bleedPercent}%`,
          left: side === 'left' 
            ? `${safeZonePercent + bleedPercent}%` 
            : `${spineMarginPercent}%`,
          right: side === 'right' 
            ? `${safeZonePercent + bleedPercent}%` 
            : `${spineMarginPercent}%`,
        }}
      />
      
      {/* Marge côté reliure - plus grande, en bleu - cachée par la reliure */}
      <div 
        className={cn(
          "absolute top-0 bottom-0 bg-blue-500/20 border-2 border-dashed border-blue-500/50",
          side === 'left' ? 'right-0' : 'left-0'
        )}
        style={{
          width: `${spineMarginPercent}%`,
        }}
      />
      
      {/* Zone rouge = sera coupée */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(to right, rgba(239, 68, 68, 0.15) 0%, transparent ${bleedPercent}%),
            linear-gradient(to left, rgba(239, 68, 68, 0.15) 0%, transparent ${bleedPercent}%),
            linear-gradient(to bottom, rgba(239, 68, 68, 0.15) 0%, transparent ${bleedPercent}%),
            linear-gradient(to top, rgba(239, 68, 68, 0.15) 0%, transparent ${bleedPercent}%)
          `,
        }}
      />
      
      {/* Labels explicatifs */}
      <div className="absolute top-1 left-1 text-[8px] text-red-400 bg-red-500/20 px-1 rounded font-medium">
        ✂️ {t('safeZoneCut')}
      </div>
      <div 
        className="absolute text-[8px] text-emerald-400 bg-emerald-500/20 px-1 rounded font-medium"
        style={{ 
          top: `${safeZonePercent + bleedPercent + 1}%`,
          left: side === 'left' ? `${safeZonePercent + bleedPercent + 1}%` : `${spineMarginPercent + 1}%`,
        }}
      >
        ✓ {t('safeZoneSafe')}
      </div>
      <div 
        className={cn(
          "absolute top-1/2 -translate-y-1/2 text-[8px] text-blue-400/80 bg-blue-500/10 px-1 rounded writing-vertical-lr",
          side === 'left' ? 'right-1' : 'left-1'
        )}
      >
        {t('safeZoneBinding')}
      </div>
    </div>
  )
}

function WritingArea({ page, pageIndex, chapters, onContentChange, onTitleChange, onStyleChange, onChapterChange, onCreateChapter, onUpdateChapter, onImageAdd, onImagePositionChange, onImageStyleChange, onImageFrameChange, onImageOpacityChange, onImageDelete, onImageBringForward, onImageSendBackward, onImageCreateNew, onVideoPosterChange, onConvertVideoToImage, locale = 'fr', onPrevPage, onNextPage, hasPrevPage, hasNextPage, totalPages, leftPage, leftPageIndex, onLeftContentChange, storyTitle, onStoryTitleChange, onBack, onShowStructure, onShowOverview, onZoomChange, externalZoomedPage, showLines = true, onToggleLines, bookColor = 'cream', onBookColorChange, onBackgroundAdd, onBackgroundOpacityChange, onBackgroundPositionChange, onBackgroundRemove, onDecorationAdd, onDecorationPositionChange, onDecorationScaleChange, onDecorationRotationChange, onDecorationColorChange, onDecorationOpacityChange, onDecorationGlowChange, onDecorationFlip, onDecorationDelete, onTextBoxAdd, onTextBoxPositionChange, onTextBoxContentChange, onTextBoxStyleChange, onTextBoxDelete, isLocked = false, onUnlock, bookFormat = 'portrait-a5', onBookFormatChange, showSafeZones = false, onToggleSafeZones, hasFrontCover, hasBackCover, onShowFrontCover, onShowBackCover, onExportPdf, isExportingPdf = false, exportStatus = '' }: WritingAreaProps) {
  
  const t = useTranslations('writing')

  // ========================================================================
  // CANONICAL RENDERING
  // Pages are always rendered at fixed canonical dimensions (500px width).
  // A CSS transform: scale() wrapper fits them into the available viewport.
  // ========================================================================
  const formatConfig = BOOK_FORMATS.find(f => f.id === bookFormat)
  const canonicalDims = getCanonicalDimensions(bookFormat)
  const pagePad = getPagePaddingPx(bookFormat)
  const SPINE_WIDTH = CANONICAL_SPINE_WIDTH

  // The canonical spread is 2 pages side by side + spine
  const canonicalSpreadWidth = canonicalDims.width * 2 + SPINE_WIDTH
  const canonicalSpreadHeight = canonicalDims.height

  // Ref to the viewport container that we observe for sizing
  const bookContainerRef = useRef<HTMLDivElement>(null)
  const [spreadScale, setSpreadScale] = useState(1)

  useEffect(() => {
    const calculateScale = () => {
      if (!bookContainerRef.current) return
      const rect = bookContainerRef.current.getBoundingClientRect()
      const availableWidth = rect.width - 16
      const availableHeight = rect.height - 16
      const scale = getFitScale(canonicalSpreadWidth, canonicalSpreadHeight, availableWidth, availableHeight)
      setSpreadScale(scale)
    }

    const resizeObserver = new ResizeObserver(calculateScale)
    if (bookContainerRef.current) resizeObserver.observe(bookContainerRef.current)

    // Initial calculations (layout may not be ready immediately)
    const t1 = setTimeout(calculateScale, 50)
    const t2 = setTimeout(calculateScale, 200)

    return () => {
      resizeObserver.disconnect()
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [canonicalSpreadWidth, canonicalSpreadHeight])

  // With canonical rendering, pageWidth is ALWAYS the canonical width
  const pageWidth = CANONICAL_PAGE_WIDTH
  const pageScale = 1 // getPageScale(pageWidth) === 1

  // Styles séparés pour chaque page
  const rightStyle = page?.style || DEFAULT_STYLE
  const leftStyle = leftPage?.style || DEFAULT_STYLE
  const editorRef = useRef<HTMLDivElement>(null)
  const leftEditorRef = useRef<HTMLDivElement>(null)
  const zoomedEditorRef = useRef<HTMLDivElement>(null)
  const lastContentRef = useRef<string>(page?.content || '')
  const lastLeftContentRef = useRef<string>(leftPage?.content || '')
  const lastZoomContentRef = useRef<string>('')
  const [pageFullIndicator, setPageFullIndicator] = useState<'left' | 'right' | 'zoom' | null>(null)
  const pageFullTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // 📐 Le ratio du format détermine les proportions CSS (aspect-ratio)
  // Le livre s'adapte automatiquement à l'espace disponible via CSS flexbox
  
  // 🛡️ La modération du contenu est gérée par l'IA-Amie dans le chat
  
  // Refs pour les conteneurs de page (pour le drag & drop des images)
  const leftPageContainerRef = useRef<HTMLDivElement>(null)
  const rightPageContainerRef = useRef<HTMLDivElement>(null)
  const zoomedPageContainerRef = useRef<HTMLDivElement>(null)
  
  // État pour le mode zoom (null = pas de zoom, 'left' = page gauche, 'right' = page droite)
  const [zoomedPage, setZoomedPage] = useState<'left' | 'right' | null>(null)
  
  // État pour le menu d'alignement du titre de chapitre
  const [alignmentMenuOpen, setAlignmentMenuOpen] = useState<'left' | 'right' | 'zoom' | null>(null)
  
  // État pour le menu de couleur de page
  const [colorMenuOpen, setColorMenuOpen] = useState(false)
  
  // État pour l'édition du fond de page (drag & zoom)
  const [editingBackgroundPage, setEditingBackgroundPage] = useState<'left' | 'right' | 'zoom' | null>(null)
  
  // État pour tracker quelle page est "active" (dernière page cliquée/focusée)
  const [activePage, setActivePage] = useState<'left' | 'right'>('right')
  
  // État pour tracker quelle page est en mode dictée
  const [dictatingPage, setDictatingPage] = useState<'left' | 'right' | 'zoom' | null>(null)
  
  
  // Helper pour obtenir les styles de couleur de page
  const getPageColorStyles = (color?: PageColor) => {
    const pageColorConfig = PAGE_COLORS.find(c => c.id === (color || 'cream')) || PAGE_COLORS[0]
    const gradients: Record<PageColor, string> = {
      'cream': 'linear-gradient(225deg, #fef9f0 0%, #fdf6e8 50%, #fbf2df 100%)',
      'white': 'linear-gradient(225deg, #ffffff 0%, #fafafa 50%, #f5f5f5 100%)',
      'aged': 'linear-gradient(225deg, #fde68a 0%, #fcd34d 50%, #fbbf24 100%)',
      'parchment': 'linear-gradient(225deg, #ffedd5 0%, #fed7aa 50%, #fdba74 100%)',
      'blue': 'linear-gradient(225deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)',
      'pink': 'linear-gradient(225deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)',
      'mint': 'linear-gradient(225deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)',
      'lavender': 'linear-gradient(225deg, #faf5ff 0%, #f3e8ff 50%, #e9d5ff 100%)',
      'peach': 'linear-gradient(225deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
      'sky': 'linear-gradient(225deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
    }
    return {
      background: gradients[color || 'cream'],
      linesColor: pageColorConfig.lines,
    }
  }
  
  // Notifier le parent quand le zoom change
  useEffect(() => {
    onZoomChange?.(zoomedPage)
  }, [zoomedPage, onZoomChange])
  
  // Synchroniser avec le zoom externe (quand le parent change la page)
  useEffect(() => {
    if (externalZoomedPage !== undefined) {
      setZoomedPage(externalZoomedPage)
    }
  }, [externalZoomedPage])
  
  
  // Speech recognition for dictation
  const { isListening, isSupported, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition(locale)

  // Initialiser le contenu au premier rendu
  useEffect(() => {
    if (editorRef.current && page?.content) {
      editorRef.current.innerHTML = page.content
      lastContentRef.current = page.content
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Initialiser le contenu de la page gauche
  useEffect(() => {
    if (leftEditorRef.current && leftPage?.content) {
      leftEditorRef.current.innerHTML = leftPage.content
      lastLeftContentRef.current = leftPage.content
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Synchroniser le contenu si changé de l'extérieur
  useEffect(() => {
    if (editorRef.current && page && page.content !== lastContentRef.current) {
      editorRef.current.innerHTML = page.content || ''
      lastContentRef.current = page.content || ''
    }
  }, [page?.content])

  useEffect(() => {
    if (leftEditorRef.current && leftPage && leftPage.content !== lastLeftContentRef.current) {
      leftEditorRef.current.innerHTML = leftPage.content || ''
      lastLeftContentRef.current = leftPage.content || ''
    }
  }, [leftPage?.content])

  // Réinitialiser le contenu quand on sort du mode zoom
  useEffect(() => {
    if (zoomedPage === null) {
      // On sort du mode zoom, réinitialiser les éditeurs
      if (editorRef.current && page) {
        editorRef.current.innerHTML = page.content || ''
        lastContentRef.current = page.content || ''
      }
      if (leftEditorRef.current && leftPage) {
        leftEditorRef.current.innerHTML = leftPage.content || ''
        lastLeftContentRef.current = leftPage.content || ''
      }
    }
  }, [zoomedPage]) // eslint-disable-line react-hooks/exhaustive-deps

  // Initialiser le contenu du mode zoom (seulement quand on entre en zoom ou changement externe)
  useEffect(() => {
    if (zoomedEditorRef.current && zoomedPage) {
      const content = zoomedPage === 'left' ? leftPage?.content : page?.content
      const currentEditorContent = zoomedEditorRef.current.innerHTML
      
      // Ne réinitialiser que si :
      // 1. L'éditeur est vide (on vient d'entrer en mode zoom)
      // 2. Le contenu vient de l'extérieur (différent de ce qu'on a tracké)
      if (!currentEditorContent || content !== lastZoomContentRef.current) {
        // Vérifier aussi que ce n'est pas notre propre frappe qui a changé le content
        if (currentEditorContent !== content) {
          zoomedEditorRef.current.innerHTML = content || ''
        }
      }
      lastZoomContentRef.current = content || ''
    }
  }, [zoomedPage]) // Seulement quand on entre/sort du mode zoom
  
  // Helper : placer le curseur à la fin d'un élément contentEditable
  const placeCaretAtEnd = (el: HTMLElement) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }

  // Helper : afficher l'indicateur "page pleine" pendant 2 secondes
  const showPageFullIndicator = (which: 'left' | 'right' | 'zoom') => {
    if (pageFullTimerRef.current) clearTimeout(pageFullTimerRef.current)
    setPageFullIndicator(which)
    pageFullTimerRef.current = setTimeout(() => setPageFullIndicator(null), 2000)
  }

  // Helper : vérifier si un éditeur déborde et revenir au contenu précédent
  const checkOverflowAndRevert = (
    editor: HTMLElement,
    lastRef: React.MutableRefObject<string>,
    page: 'left' | 'right' | 'zoom'
  ): boolean => {
    if (editor.scrollHeight > editor.clientHeight) {
      editor.innerHTML = lastRef.current
      placeCaretAtEnd(editor)
      showPageFullIndicator(page)
      return true // overflow détecté
    }
    return false
  }

  // Gérer les changements de contenu
  const handleInput = () => {
    if (editorRef.current) {
      if (checkOverflowAndRevert(editorRef.current, lastContentRef, 'right')) return
      const html = editorRef.current.innerHTML
      lastContentRef.current = html
      onContentChange(html)
    }
  }

  const handleLeftInput = () => {
    if (leftEditorRef.current && onLeftContentChange) {
      if (checkOverflowAndRevert(leftEditorRef.current, lastLeftContentRef, 'left')) return
      const html = leftEditorRef.current.innerHTML
      lastLeftContentRef.current = html
      onLeftContentChange(html)
    }
  }

  // Gérer le copier-coller avec vérification de débordement
  const handlePaste = (
    editor: React.RefObject<HTMLDivElement | null>,
    lastRef: React.MutableRefObject<string>,
    page: 'left' | 'right' | 'zoom',
    onChange: (html: string) => void
  ) => (e: React.ClipboardEvent) => {
    // Sauvegarder le contenu avant le paste
    const savedContent = lastRef.current
    // Laisser le paste se produire, puis vérifier le débordement
    requestAnimationFrame(() => {
      if (editor.current && editor.current.scrollHeight > editor.current.clientHeight) {
        // Débordement : revenir au contenu avant le paste
        editor.current.innerHTML = savedContent
        placeCaretAtEnd(editor.current)
        showPageFullIndicator(page)
      } else if (editor.current) {
        const html = editor.current.innerHTML
        lastRef.current = html
        onChange(html)
      }
    })
  }

  // Append transcript to content when dictation stops
  useEffect(() => {
    if (!isListening && transcript && dictatingPage) {
      // Sélectionner le bon éditeur selon la page en dictée
      const targetEditor = dictatingPage === 'left' ? leftEditorRef.current
                         : dictatingPage === 'zoom' ? zoomedEditorRef.current
                         : editorRef.current
      const targetLastRef = dictatingPage === 'left' ? lastLeftContentRef
                          : dictatingPage === 'zoom' ? lastZoomContentRef
                          : lastContentRef
      const targetPage = dictatingPage === 'zoom' ? 'zoom' as const : dictatingPage as 'left' | 'right'

      if (targetEditor) {
        const savedContent = targetLastRef.current
        targetEditor.focus()
        document.execCommand('insertText', false, transcript)
        // Vérifier le débordement après insertion de la dictée
        if (targetEditor.scrollHeight > targetEditor.clientHeight) {
          targetEditor.innerHTML = savedContent
          placeCaretAtEnd(targetEditor)
          showPageFullIndicator(targetPage)
        }
        resetTranscript()
        setDictatingPage(null)
      }
    }
  }, [isListening, transcript, resetTranscript, dictatingPage])
  
  const placeholders = {
    fr: 'Écris ton histoire ici...',
    en: 'Write your story here...',
    ru: 'Пиши свою историю здесь...',
  }
  
  const titlePlaceholders = {
    fr: 'Titre de la page (optionnel)',
    en: 'Page title (optional)',
    ru: 'Название страницы (необязательно)',
  }
  
  const micLabels = {
    fr: { start: 'Dicter', stop: 'Arrêter', listening: 'J\'écoute...' },
    en: { start: 'Dictate', stop: 'Stop', listening: 'Listening...' },
    ru: { start: 'Диктовать', stop: 'Стоп', listening: 'Слушаю...' },
  }
  const mic = micLabels[locale as keyof typeof micLabels] || micLabels.en

  // Hauteur de ligne en pixels pour chaque page (canonical — scale = 1)
  const rightLineHeightPx = getLineHeightPx(rightStyle.lineSpacing || 'normal')
  const leftLineHeightPx = getLineHeightPx(leftStyle.lineSpacing || 'normal')

  // Style du texte pour la page droite (canonical — valeurs directes, pas de scaling)
  const rightTextStyle: React.CSSProperties = {
    fontFamily: rightStyle.fontFamily,
    fontSize: `${rightStyle.fontSize}px`,
    lineHeight: `${rightLineHeightPx}px`,
    fontWeight: rightStyle.isBold ? 'bold' : 'normal',
    fontStyle: rightStyle.isItalic ? 'italic' : 'normal',
    textAlign: rightStyle.textAlign,
  }

  // Style du texte pour la page gauche (canonical — valeurs directes, pas de scaling)
  const leftTextStyle: React.CSSProperties = {
    fontFamily: leftStyle.fontFamily,
    fontSize: `${leftStyle.fontSize}px`,
    lineHeight: `${leftLineHeightPx}px`,
    fontWeight: leftStyle.isBold ? 'bold' : 'normal',
    fontStyle: leftStyle.isItalic ? 'italic' : 'normal',
    textAlign: leftStyle.textAlign,
  }

  // Compter les mots (enlever les balises HTML)
  const getWordCount = (content: string = '') => {
    const text = content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')
    return text.split(/\s+/).filter(Boolean).length
  }

  // Helper pour obtenir tous les médias d'une page (format nouveau + legacy)
  const getPageImages = (p: StoryPageLocal | undefined): PageMedia[] => {
    if (!p) return []
    
    // Si le nouveau format est utilisé
    if (p.images && p.images.length > 0) {
      return p.images
    }
    
    // Fallback vers le format legacy (une seule image)
    if (p.image) {
      return [{
        id: 'legacy-image',
        url: p.image,
        type: 'image' as MediaType,
        position: p.imagePosition || DEFAULT_IMAGE_POSITION,
        style: p.imageStyle || 'normal',
        frame: p.frameStyle || 'none',
        zIndex: 1,
      }]
    }
    
    return []
  }

  // Images de la page droite et gauche
  const rightPageImages = getPageImages(page)
  const leftPageImages = getPageImages(leftPage)
  
  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      {/* Barre d'outils unifiée (titre + outils + actions) */}
      <div className="flex items-center justify-between gap-2 mb-1 relative z-50 px-1 flex-shrink-0">
        {/* Gauche : Retour + Titre */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg text-midnight-400 hover:text-white hover:bg-midnight-800/50 transition-colors"
              title={t('formatSelector.back')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {onStoryTitleChange && (
            <input
              type="text"
              value={storyTitle || ''}
              onChange={(e) => onStoryTitleChange(e.target.value)}
              className="font-display text-sm text-aurora-300 bg-midnight-800/30 rounded-lg px-2 py-1 outline-none border border-transparent focus:border-aurora-500/30 min-w-[120px] max-w-[180px]"
              placeholder={t('titlePlaceholder')}
            />
          )}
          <SaveIndicator />
        </div>

        {/* Centre : Outils de formatage */}
        <div className="glass rounded-lg px-2 py-0.5 shadow-lg z-50">
              {/* L'index de la page active dépend de quelle page a été cliquée en dernier */}
              {(() => {
                const activePageIndex = activePage === 'left' ? (leftPageIndex ?? pageIndex) : pageIndex
                const activePageData = activePage === 'left' ? leftPage : page
                const activeStyle = activePageData?.style || DEFAULT_STYLE
                return (
              <FormatBar 
                style={activeStyle} 
                onStyleChange={(styleUpdate) => onStyleChange(activePageIndex, styleUpdate)}
                activePageIndex={activePageIndex}
                showLines={showLines}
                onToggleLines={onToggleLines}
                bookColor={bookColor}
                onBookColorChange={onBookColorChange}
                    backgroundMedia={activePageData?.backgroundMedia}
                    onBackgroundAdd={() => onBackgroundAdd?.(activePageIndex)}
                    onBackgroundOpacityChange={(opacity) => onBackgroundOpacityChange?.(activePageIndex, opacity)}
                    onBackgroundPositionChange={(x, y, scale) => onBackgroundPositionChange?.(activePageIndex, x, y, scale)}
                    onBackgroundRemove={() => onBackgroundRemove?.(activePageIndex)}
                    onBackgroundEditToggle={() => setEditingBackgroundPage(editingBackgroundPage === activePage ? null : activePage)}
                    isEditingBackground={editingBackgroundPage === activePage}
                    showSafeZones={showSafeZones}
                    onToggleSafeZones={onToggleSafeZones}
                    bookFormat={bookFormat}
                    onBookFormatChange={onBookFormatChange}
                  />
                )
              })()}
            </div>
        
        {/* Droite : Structure + Vue */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {onShowStructure && (
          <button
              onClick={onShowStructure}
              className="p-1.5 rounded-lg bg-midnight-800/50 hover:bg-midnight-800 text-midnight-400 hover:text-white transition-colors"
              title={t('structure')}
            >
              <ListTree className="w-4 h-4" />
          </button>
          )}
          {onShowOverview && (
            <button
              onClick={onShowOverview}
              className="p-1.5 rounded-lg bg-midnight-800/50 hover:bg-midnight-800 text-midnight-400 hover:text-white transition-colors"
              title={t('overview')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          )}
          {/* Bouton Export PDF HD */}
          {onExportPdf && (
            <button
              onClick={onExportPdf}
              disabled={isExportingPdf}
              className="p-1.5 rounded-lg bg-aurora-600/50 hover:bg-aurora-600 text-white/80 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-wait"
              title={t('editor.exportPdf')}
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          {exportStatus && (
            <span className="text-xs text-aurora-400 animate-pulse">{exportStatus}</span>
          )}
        </div>
      </div>
      
      {/* Overlay pendant l'export - positionné en haut pour ne pas gêner la capture */}
      {exportStatus && (
        <div 
          data-export-overlay="true"
          className="export-overlay fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
        >
          <div className="bg-midnight-900 px-8 py-4 rounded-xl shadow-2xl border border-white/20">
            <p className="text-white font-medium text-lg">{exportStatus}</p>
          </div>
        </div>
      )}
      
      {/* MODE ZOOM - Page unique agrandie */}
      {zoomedPage ? (() => {
        // Déterminer quelle page afficher selon le zoom
        const zPage = zoomedPage === 'left' ? leftPage : page
        const zPageIndex = zoomedPage === 'left' ? (leftPageIndex ?? 0) : pageIndex
        const zPageImages = getPageImages(zPage)
        // Utiliser le style de la page zoomée
        const zTextStyle = zoomedPage === 'left' ? leftTextStyle : rightTextStyle
        const zLineHeightPx = zoomedPage === 'left' ? leftLineHeightPx : rightLineHeightPx
        const zHandleInput = () => {
          // Mettre à jour en temps réel pendant l'édition
          if (zoomedEditorRef.current) {
            if (checkOverflowAndRevert(zoomedEditorRef.current, lastZoomContentRef, 'zoom')) return
            const html = zoomedEditorRef.current.innerHTML
            // Tracker le contenu pour éviter les réinitialisations
            lastZoomContentRef.current = html
            if (zoomedPage === 'left' && onLeftContentChange) {
              onLeftContentChange(html)
            } else {
              onContentChange(html)
            }
          }
        }
        
        // Fonction pour synchroniser et quitter le mode zoom
        const exitZoom = () => {
          // Synchroniser le contenu avant de fermer
          if (zoomedEditorRef.current) {
            const html = zoomedEditorRef.current.innerHTML
            if (zoomedPage === 'left' && onLeftContentChange) {
              onLeftContentChange(html)
            } else {
              onContentChange(html)
            }
          }
          setZoomedPage(null)
        }
        
        if (!zPage) return null
        
        // Compute zoom scale to fit the canonical page in the viewport
        const zoomContainerRef = useRef<HTMLDivElement>(null)
        const [zoomScale, setZoomScale] = useState(1)
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          const calcZoomScale = () => {
            if (!zoomContainerRef.current) return
            const rect = zoomContainerRef.current.getBoundingClientRect()
            const s = getFitScale(canonicalDims.width, canonicalDims.height, rect.width - 40, rect.height - 40)
            setZoomScale(Math.min(s, 1.5)) // Allow up to 1.5x for zoom
          }
          const ro = new ResizeObserver(calcZoomScale)
          if (zoomContainerRef.current) ro.observe(zoomContainerRef.current)
          const t = setTimeout(calcZoomScale, 50)
          return () => { ro.disconnect(); clearTimeout(t) }
        }, [canonicalDims.width, canonicalDims.height])

        return (
        <div 
          ref={zoomContainerRef}
          className="flex-1 flex items-center justify-center pt-2 cursor-pointer"
          onClick={exitZoom}
        >
          {/* Scale wrapper for zoomed page */}
          <div style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center', willChange: 'transform' }}>
          {/* Page zoomée — canonical fixed dimensions */}
          <motion.div
            ref={zoomedPageContainerRef}
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative flex flex-col shadow-2xl"
            style={{
              width: `${canonicalDims.width}px`,
              height: `${canonicalDims.height}px`,
              background: getPageColorStyles(bookColor).background,
              borderRadius: '12px',
              overflow: 'visible',
            }}
          >
            {/* Bouton réduire en haut à droite */}
            <button
              onClick={(e) => { e.stopPropagation(); exitZoom(); }}
              className="absolute top-2 right-2 z-20 p-2 rounded-full bg-amber-200/80 hover:bg-amber-300 text-amber-700 transition-all shadow-sm hover:shadow"
              title={t('backToBook')}
            >
              <EyeOff className="w-4 h-4" />
            </button>
            
            {/* Fond de page (image ou vidéo) */}
            {zPage?.backgroundMedia && (
              editingBackgroundPage === 'zoom' ? (
                <EditableBackground
                  backgroundMedia={zPage.backgroundMedia}
                  onPositionChange={(x, y, scale) => onBackgroundPositionChange?.(zPageIndex, x, y, scale)}
                  onEditEnd={() => setEditingBackgroundPage(null)}
                  containerRef={zoomedPageContainerRef}
                  roundedClass="rounded-xl"
                />
              ) : (
              <div className="absolute inset-0 overflow-hidden rounded-xl z-0">
                {zPage.backgroundMedia.type === 'video' ? (
                  <video
                    src={zPage.backgroundMedia.url}
                    className="w-full h-full object-cover"
                      style={{ 
                        opacity: zPage.backgroundMedia.opacity,
                        transform: `translate(${zPage.backgroundMedia.x || 0}px, ${zPage.backgroundMedia.y || 0}px) scale(${zPage.backgroundMedia.scale || 1})`,
                        transformOrigin: 'center center',
                      }}
                    muted
                    loop
                    autoPlay
                    playsInline
                  />
                ) : (
                  <img
                    src={zPage.backgroundMedia.url}
                    alt=""
                    className="w-full h-full object-cover"
                      style={{ 
                        opacity: zPage.backgroundMedia.opacity,
                        transform: `translate(${zPage.backgroundMedia.x || 0}px, ${zPage.backgroundMedia.y || 0}px) scale(${zPage.backgroundMedia.scale || 1})`,
                        transformOrigin: 'center center',
                      }}
                  />
                )}
              </div>
              )
            )}
            
            {/* Texture papier */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
              zIndex: 1,
            }} />
            
            {/* En-tête avec chapitre (toujours présent pour garder la marge) */}
            {(() => {
              const zChapter = chapters.find(c => c.id === zPage.chapterId)
              const alignment = zChapter?.titleAlignment || 'center'
              if (alignment === 'hidden') {
                return (
                  <div 
                    className="min-h-[48px] border-b border-amber-300/30 cursor-pointer hover:bg-amber-100/30 transition-colors relative"
                    onClick={() => zChapter && setAlignmentMenuOpen(alignmentMenuOpen === 'zoom' ? null : 'zoom')}
                  >
                    {/* Menu d'alignement */}
                    {alignmentMenuOpen === 'zoom' && zChapter && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-xl border border-amber-200 py-1 z-50">
                        {[
                          { value: 'left', label: `◀ ${t('alignLeft')}`, icon: <AlignLeft className="w-4 h-4" /> },
                          { value: 'center', label: `▣ ${t('alignCenter')}`, icon: <AlignCenter className="w-4 h-4" /> },
                          { value: 'right', label: `▶ ${t('alignRight')}`, icon: <AlignRight className="w-4 h-4" /> },
                          { value: 'hidden', label: `✕ ${t('alignHide')}`, icon: <EyeOff className="w-4 h-4" /> },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={(e) => {
                              e.stopPropagation()
                              onUpdateChapter?.(zChapter.id, { titleAlignment: opt.value as Chapter['titleAlignment'] })
                              setAlignmentMenuOpen(null)
                            }}
                            className={cn(
                              "w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-amber-50 transition-colors",
                              alignment === opt.value && "bg-amber-100 text-amber-700"
                            )}
                          >
                            {opt.icon}
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }
              return (
                <div 
                  className={cn(
                    "px-8 pt-4 pb-2 border-b border-amber-300/30 relative z-10 min-h-[48px] flex items-center cursor-pointer hover:bg-amber-100/30 transition-colors",
                    alignment === 'left' && 'justify-start',
                    alignment === 'center' && 'justify-center',
                    alignment === 'right' && 'justify-end'
                  )}
                  onClick={() => zChapter && setAlignmentMenuOpen(alignmentMenuOpen === 'zoom' ? null : 'zoom')}
                >
                  {zChapter ? (
                <span
                  className="text-lg font-serif font-medium"
                      style={{ color: zChapter.color || '#8b7355' }}
                >
                      {zChapter.title}
                </span>
                  ) : (
                    <span className="text-amber-400/30 text-sm font-serif italic">—</span>
                  )}
                  
                  {/* Menu d'alignement */}
                  {alignmentMenuOpen === 'zoom' && zChapter && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-xl border border-amber-200 py-1 z-50">
                      {[
                        { value: 'left', label: `◀ ${t('alignLeft')}`, icon: <AlignLeft className="w-4 h-4" /> },
                        { value: 'center', label: `▣ ${t('alignCenter')}`, icon: <AlignCenter className="w-4 h-4" /> },
                        { value: 'right', label: `▶ ${t('alignRight')}`, icon: <AlignRight className="w-4 h-4" /> },
                        { value: 'hidden', label: `✕ ${t('alignHide')}`, icon: <EyeOff className="w-4 h-4" /> },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={(e) => {
                            e.stopPropagation()
                            onUpdateChapter?.(zChapter.id, { titleAlignment: opt.value as Chapter['titleAlignment'] })
                            setAlignmentMenuOpen(null)
                          }}
                          className={cn(
                            "w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-amber-50 transition-colors text-amber-800",
                            alignment === opt.value && "bg-amber-100 text-amber-700 font-medium"
                          )}
                        >
                          {opt.icon}
                          {opt.label}
                        </button>
                      ))}
        </div>
      )}
                </div>
              )
            })()}

            {/* Médias flottants de la page zoomée (multi-médias) */}
            {zPageImages.map((media) => (
              <DraggableMedia
                key={media.id}
                mediaId={media.id}
                src={media.url}
                mediaType={media.type}
                position={media.position}
                imageStyle={media.style}
                frameStyle={media.frame}
                zIndex={media.zIndex}
                opacity={media.opacity}
                onPositionChange={(pos) => onImagePositionChange?.(zPageIndex, media.id, pos)}
                onStyleChange={(style) => onImageStyleChange?.(zPageIndex, media.id, style)}
                onFrameChange={(frame) => onImageFrameChange?.(zPageIndex, media.id, frame)}
                onOpacityChange={(opacity) => onImageOpacityChange?.(zPageIndex, media.id, opacity)}
                onDelete={() => onImageDelete?.(zPageIndex, media.id)}
                onBringForward={() => onImageBringForward?.(zPageIndex, media.id)}
                onSendBackward={() => onImageSendBackward?.(zPageIndex, media.id)}
                onCreateNewImage={() => onImageCreateNew?.(media.url, zPageIndex)}
                onVideoPosterChange={(poster) => onVideoPosterChange?.(zPageIndex, media.id, poster)}
                onConvertToImage={(url) => onConvertVideoToImage?.(zPageIndex, media.id, url)}
                containerRef={zoomedPageContainerRef}
                totalMedia={zPageImages.length}
              />
            ))}
            
            {/* Décorations premium en mode zoom */}
            {zPage?.decorations?.map((deco) => {
              const decorationItem = PREMIUM_DECORATIONS.find(d => d.id === deco.decorationId)
              if (!decorationItem) return null
              return (
                <DraggableDecoration
                  key={deco.id}
                  decoration={deco}
                  decorationItem={decorationItem}
                  onPositionChange={(id, pos) => onDecorationPositionChange?.(zPageIndex, id, pos)}
                  onScaleChange={(id, scale) => onDecorationScaleChange?.(zPageIndex, id, scale)}
                  onRotationChange={(id, rotation) => onDecorationRotationChange?.(zPageIndex, id, rotation)}
                  onColorChange={(id, color) => onDecorationColorChange?.(zPageIndex, id, color)}
                  onOpacityChange={(id, opacity) => onDecorationOpacityChange?.(zPageIndex, id, opacity)}
                  onGlowChange={(id, enabled, color, intensity) => onDecorationGlowChange?.(zPageIndex, id, enabled, color, intensity)}
                  onFlip={(id, direction) => onDecorationFlip?.(zPageIndex, id, direction)}
                  onDelete={(id) => onDecorationDelete?.(zPageIndex, id)}
                  containerRef={zoomedPageContainerRef}
                />
              )
            })}

            {/* Zones de texte flottantes en mode zoom */}
            {zPage?.textBoxes?.map((textBox) => (
              <DraggableTextBox
                key={textBox.id}
                textBox={textBox}
                onPositionChange={(id, pos) => onTextBoxPositionChange?.(zPageIndex, id, pos)}
                onContentChange={(id, content) => onTextBoxContentChange?.(zPageIndex, id, content)}
                onStyleChange={(id, style) => onTextBoxStyleChange?.(zPageIndex, id, style)}
                onDelete={(id) => onTextBoxDelete?.(zPageIndex, id)}
                containerRef={zoomedPageContainerRef}
                pageWidth={pageWidth}
              />
            ))}
      
            {/* Zone d'écriture avec lignes intégrées */}
            <div className="flex-1 relative overflow-hidden">
              {/* Lignes de cahier (conditionnelles) - synchronisées avec lineHeight */}
              {showLines && (
              <div 
                className="absolute pointer-events-none"
                style={{
                  left: `${pagePad.left}px`,
                  right: `${pagePad.right}px`,
                  top: `${pagePad.top}px`,
                  bottom: `${pagePad.bottom}px`,
                  backgroundImage: `repeating-linear-gradient(transparent, transparent ${zLineHeightPx - 1}px, rgba(139, 115, 85, 0.15) ${zLineHeightPx - 1}px, rgba(139, 115, 85, 0.15) ${zLineHeightPx}px)`,
                  backgroundSize: `100% ${zLineHeightPx}px`,
                }}
              />
              )}
              
              {/* Marge rouge (conditionnelle) */}
              {showLines && (
              <div 
                data-pdf-hide="true"
                className="absolute w-px bg-red-300/40 pointer-events-none" 
                style={{ left: `${pagePad.left}px`, top: `${pagePad.top}px`, bottom: `${pagePad.bottom}px` }}
              />
              )}
      
              {/* Zone de texte contentEditable */}
              <div
                ref={zoomedEditorRef}
                contentEditable={!isLocked}
                onInput={zHandleInput}
                onPaste={handlePaste(zoomedEditorRef, lastZoomContentRef, 'zoom', (html) => {
                  if (zoomedPage === 'left' && onLeftContentChange) onLeftContentChange(html)
                  else onContentChange(html)
                })}
                data-placeholder={placeholders[locale]}
                style={{
                  ...zTextStyle,
                  color: '#3d3426',
                  paddingLeft: `${pagePad.left}px`,
                  paddingRight: `${pagePad.right}px`,
                  paddingTop: `${pagePad.top}px`,
                  paddingBottom: `${pagePad.bottom}px`,
                }}
          className={cn(
                  'absolute inset-0 overflow-hidden',
                  'font-serif',
                  'focus:outline-none',
                  'empty:before:content-[attr(data-placeholder)] empty:before:text-amber-500/40 empty:before:pointer-events-none'
                )}
              />
          </div>
          
        {/* Indicateur page pleine - zoom */}
            {pageFullIndicator === 'zoom' && (
              <div data-pdf-hide="true" className="absolute bottom-[14%] left-0 right-0 z-20 flex justify-center pointer-events-none animate-in fade-in duration-300">
                <span className="bg-amber-100/90 text-amber-700 text-sm font-serif px-4 py-1.5 rounded-full shadow-sm border border-amber-200/60">
                  {t('editor.pageFull')}
                </span>
              </div>
            )}

        {/* Barre d'outils en bas */}
            <div data-pdf-hide="true" className="relative z-10 px-8 py-3 flex items-center justify-between border-t border-amber-300/30 bg-gradient-to-t from-amber-50/80 to-transparent">
              <span className="text-sm text-amber-700/50 font-serif">{getWordCount(zPage.content)} {t('words')}</span>
          <div className="flex items-center gap-2">
                <button
              onClick={() => {
                if (isListening) {
                  stopListening()
                } else {
                  setDictatingPage('zoom')
                  startListening()
                }
              }}
              disabled={!isSupported}
              className={cn(
                    'p-2 rounded-full transition-all',
                    isListening && dictatingPage === 'zoom'
                      ? 'text-red-500 bg-red-100 animate-pulse' 
                      : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
                  )}
                  title={isListening && dictatingPage === 'zoom' ? mic.stop : mic.start}
                >
                  {isListening && dictatingPage === 'zoom' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <Highlightable id="book-add-image">
                <button
                  onClick={() => onImageAdd(zPageIndex)}
                  className="p-2 rounded-full text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50 transition-all"
                  title={t('addImage')}
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                </Highlightable>
                <Highlightable id="book-add-background">
                <button
                  onClick={() => onBackgroundAdd?.(zPageIndex)}
                  className={cn(
                    'p-2 rounded-full transition-all',
                    zPage.backgroundMedia
                      ? 'text-aurora-600 bg-aurora-100'
                      : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
                  )}
                  title={t('background')}
                >
                  <Layers className="w-5 h-5" />
                </button>
                </Highlightable>
                {zPage.backgroundMedia && (
                  <button
                    onClick={() => setEditingBackgroundPage(editingBackgroundPage === 'zoom' ? null : 'zoom')}
                    className={cn(
                      'p-2 rounded-full transition-all',
                      editingBackgroundPage === 'zoom'
                        ? 'text-aurora-600 bg-aurora-100'
                        : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
                    )}
                    title={t('moveBackground')}
                  >
                    <Move className="w-5 h-5" />
                  </button>
                )}
                <Highlightable id="book-decorations">
                <button
                  onClick={() => onDecorationAdd?.(zPageIndex)}
                  className={cn(
                    'p-2 rounded-full transition-all',
                    (zPage.decorations?.length || 0) > 0
                      ? 'text-amber-500 bg-amber-100'
                      : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
                  )}
                  title={t('decorations')}
                >
                  <Gem className="w-5 h-5" />
                </button>
                </Highlightable>
                <Highlightable id="book-text-box">
                <button
                  onClick={() => onTextBoxAdd?.(zPageIndex)}
                  className={cn(
                    'p-2 rounded-full transition-all',
                    (zPage.textBoxes?.length || 0) > 0
                      ? 'text-dream-500 bg-dream-100'
                      : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
                  )}
                  title={t('textBox')}
                >
                  <Type className="w-5 h-5" />
                </button>
                </Highlightable>
              </div>
            </div>
            
            {/* Numéro de page / Badge couverture */}
            <div 
              data-pdf-hide="true"
              className={cn(
              "text-center pb-4 text-sm font-serif relative z-10",
              zPageIndex === 0 
                ? "text-amber-500 font-bold" 
                : zPageIndex === (totalPages || 1) - 1 && (totalPages || 1) > 1
                  ? "text-emerald-500 font-bold"
                  : "text-amber-600/40"
            )}>
              {zPageIndex === 0
                ? `📕 ${t('frontCover').toUpperCase()}`
                : zPageIndex === (totalPages || 1) - 1 && (totalPages || 1) > 1
                  ? `📗 ${t('backCover').toUpperCase()}`
                  : `— Page ${zPageIndex + 1} —`}
            </div>
          </motion.div>
          </div>{/* end zoom scale wrapper */}
          </div>
        )
      })() : (
      /* LIVRE OUVERT - TAILLE MAXIMISÉE calculée en JS */
      <div
        className="flex-1 relative overflow-hidden"
      >
        {/* Flèche gauche - overlaid */}
        {onPrevPage && (
          <button
            onClick={onPrevPage}
            disabled={!hasPrevPage}
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full transition-all',
              hasPrevPage
                ? 'text-midnight-400 hover:text-white hover:bg-midnight-800/50'
                : 'text-midnight-700 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Zone du livre - TOUT l'espace disponible */}
        <div
          ref={bookContainerRef}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* SCALE WRAPPER — applies viewport fitting via CSS transform */}
          <div
            data-scale-wrapper
            style={{
              transform: `scale(${spreadScale})`,
              transformOrigin: 'center center',
              // The wrapper itself takes the canonical spread size for layout purposes
              // but doesn't clip — the parent centers it
              willChange: 'transform',
            }}
          >
          {/* LIVRE — Canonical fixed dimensions */}
          <div
            className="relative flex shadow-2xl"
            style={{
              width: `${canonicalSpreadWidth}px`,
              height: `${canonicalSpreadHeight}px`,
              perspective: '2000px',
            }}
          >
            {/* Bandeau légende EN OVERLAY - ne prend pas de place */}
            {showSafeZones && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-full bg-midnight-900/90 border border-midnight-700 flex items-center gap-3 text-[10px] whitespace-nowrap">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded border border-red-500"></span><span className="text-red-400">{t('safeZoneCut')}</span></span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500/40"></span><span className="text-emerald-400">{t('safeZoneSafeShort')}</span></span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500/40"></span><span className="text-blue-400">{t('safeZoneBinding')}</span></span>
              </div>
            )}
            {/* Ombre du livre */}
            <div className="absolute -bottom-4 left-4 right-4 h-8 bg-black/30 blur-xl rounded-full" />
          
          {/* PAGE GAUCHE (page d'écriture) — canonical fixed width */}
          <div
            ref={leftPageContainerRef}
            data-page-side="left"
            className="relative group h-full"
            onClick={() => setActivePage('left')}
            style={{
              width: `${canonicalDims.width}px`,
              background: getPageColorStyles(bookColor).background,
              borderRadius: '8px 0 0 8px',
              boxShadow: 'inset -20px 0 30px -20px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Clip pour le contenu interne */}
            <div className="absolute inset-0 overflow-hidden rounded-l-lg pointer-events-none" style={{ zIndex: 0 }} />
            
            {/* Overlay zones de sécurité pour l'impression */}
            {showSafeZones && <SafeZoneOverlay format={formatConfig} side="left" />}
            
            {/* Fond de page gauche (image ou vidéo) */}
            {leftPage?.backgroundMedia && (
              editingBackgroundPage === 'left' ? (
                <EditableBackground
                  backgroundMedia={leftPage.backgroundMedia}
                  onPositionChange={(x, y, scale) => leftPageIndex !== undefined && onBackgroundPositionChange?.(leftPageIndex, x, y, scale)}
                  onEditEnd={() => setEditingBackgroundPage(null)}
                  containerRef={leftPageContainerRef}
                  roundedClass="rounded-l-lg"
                />
              ) : (
              <div className="absolute inset-0 overflow-hidden rounded-l-lg z-0">
                {leftPage.backgroundMedia.type === 'video' ? (
                  <video
                    src={leftPage.backgroundMedia.url}
                    className="w-full h-full object-cover"
                      style={{ 
                        opacity: leftPage.backgroundMedia.opacity,
                        transform: `translate(${leftPage.backgroundMedia.x || 0}px, ${leftPage.backgroundMedia.y || 0}px) scale(${leftPage.backgroundMedia.scale || 1})`,
                        transformOrigin: 'center center',
                      }}
                    muted
                    loop
                    autoPlay
                    playsInline
                  />
                ) : (
                  <img
                    src={leftPage.backgroundMedia.url}
                    alt=""
                    className="w-full h-full object-cover"
                      style={{ 
                        opacity: leftPage.backgroundMedia.opacity,
                        transform: `translate(${leftPage.backgroundMedia.x || 0}px, ${leftPage.backgroundMedia.y || 0}px) scale(${leftPage.backgroundMedia.scale || 1})`,
                        transformOrigin: 'center center',
                      }}
                  />
                )}
              </div>
              )
            )}
            
            {/* Texture papier subtile */}
            <div className="absolute inset-0 opacity-30 rounded-l-lg overflow-hidden pointer-events-none" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
              zIndex: 1,
            }} />
            
            {/* Médias flottants de la page gauche (multi-médias) */}
            {leftPageIndex !== undefined && leftPageImages.map((media) => (
              <DraggableMedia
                key={media.id}
                mediaId={media.id}
                src={media.url}
                mediaType={media.type}
                position={media.position}
                imageStyle={media.style}
                frameStyle={media.frame}
                zIndex={media.zIndex}
                opacity={media.opacity}
                onPositionChange={(pos) => onImagePositionChange?.(leftPageIndex, media.id, pos)}
                onStyleChange={(style) => onImageStyleChange?.(leftPageIndex, media.id, style)}
                onFrameChange={(frame) => onImageFrameChange?.(leftPageIndex, media.id, frame)}
                onOpacityChange={(opacity) => onImageOpacityChange?.(leftPageIndex, media.id, opacity)}
                onDelete={() => onImageDelete?.(leftPageIndex, media.id)}
                onBringForward={() => onImageBringForward?.(leftPageIndex, media.id)}
                onSendBackward={() => onImageSendBackward?.(leftPageIndex, media.id)}
                onCreateNewImage={() => onImageCreateNew?.(media.url, leftPageIndex)}
                onVideoPosterChange={(poster) => onVideoPosterChange?.(leftPageIndex, media.id, poster)}
                onConvertToImage={(url) => onConvertVideoToImage?.(leftPageIndex, media.id, url)}
                containerRef={leftPageContainerRef}
                totalMedia={leftPageImages.length}
              />
            ))}
            
            {/* Décorations premium de la page gauche */}
            {leftPageIndex !== undefined && leftPage?.decorations?.map((deco) => {
              const decorationItem = PREMIUM_DECORATIONS.find(d => d.id === deco.decorationId)
              if (!decorationItem) return null
              return (
                <DraggableDecoration
                  key={deco.id}
                  decoration={deco}
                  decorationItem={decorationItem}
                  onPositionChange={(id, pos) => onDecorationPositionChange?.(leftPageIndex, id, pos)}
                  onScaleChange={(id, scale) => onDecorationScaleChange?.(leftPageIndex, id, scale)}
                  onRotationChange={(id, rotation) => onDecorationRotationChange?.(leftPageIndex, id, rotation)}
                  onColorChange={(id, color) => onDecorationColorChange?.(leftPageIndex, id, color)}
                  onOpacityChange={(id, opacity) => onDecorationOpacityChange?.(leftPageIndex, id, opacity)}
                  onGlowChange={(id, enabled, color, intensity) => onDecorationGlowChange?.(leftPageIndex, id, enabled, color, intensity)}
                  onFlip={(id, direction) => onDecorationFlip?.(leftPageIndex, id, direction)}
                  onDelete={(id) => onDecorationDelete?.(leftPageIndex, id)}
                  containerRef={leftPageContainerRef}
                />
              )
            })}

            {/* Zones de texte flottantes de la page gauche */}
            {leftPageIndex !== undefined && leftPage?.textBoxes?.map((textBox) => (
              <DraggableTextBox
                key={textBox.id}
                textBox={textBox}
                onPositionChange={(id, pos) => onTextBoxPositionChange?.(leftPageIndex, id, pos)}
                onContentChange={(id, content) => onTextBoxContentChange?.(leftPageIndex, id, content)}
                onStyleChange={(id, style) => onTextBoxStyleChange?.(leftPageIndex, id, style)}
                onDelete={(id) => onTextBoxDelete?.(leftPageIndex, id)}
                containerRef={leftPageContainerRef}
                pageWidth={pageWidth}
              />
            ))}

            {/* En-tête avec chapitre - overlay absolu dans la zone de padding top */}
            {(() => {
              const leftChapter = chapters.find(c => c.id === leftPage?.chapterId)
              const alignment = leftChapter?.titleAlignment || 'center'
              if (alignment === 'hidden') {
                return (
                  <div
                    data-pdf-hide="true"
                    className="absolute top-0 left-0 right-0 z-20 min-h-[32px] border-b border-amber-300/20 cursor-pointer hover:bg-amber-100/30 transition-colors"
                    onClick={() => leftChapter && setAlignmentMenuOpen(alignmentMenuOpen === 'left' ? null : 'left')}
                  >
                    {alignmentMenuOpen === 'left' && leftChapter && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-xl border border-amber-200 py-1 z-50">
                        {[
                          { value: 'left', label: `◀ ${t('alignLeft')}`, icon: <AlignLeft className="w-3 h-3" /> },
                          { value: 'center', label: `▣ ${t('alignCenter')}`, icon: <AlignCenter className="w-3 h-3" /> },
                          { value: 'right', label: `▶ ${t('alignRight')}`, icon: <AlignRight className="w-3 h-3" /> },
                          { value: 'hidden', label: `✕ ${t('alignHide')}`, icon: <EyeOff className="w-3 h-3" /> },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={(e) => {
                              e.stopPropagation()
                              onUpdateChapter?.(leftChapter.id, { titleAlignment: opt.value as Chapter['titleAlignment'] })
                              setAlignmentMenuOpen(null)
                            }}
                            className={cn(
                              "w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-amber-50 transition-colors text-amber-800",
                              alignment === opt.value && "bg-amber-100 text-amber-700 font-medium"
                            )}
                          >
                            {opt.icon}
                            {opt.label}
                          </button>
                        ))}
                    </div>
                    )}
                    </div>
                )
              }
              return (
                <div
                  data-pdf-hide="true"
                  className={cn(
                    "absolute top-0 left-0 right-0 z-20 px-4 pt-2 pb-1 border-b border-amber-300/20 min-h-[32px] flex items-center cursor-pointer hover:bg-amber-100/30 transition-colors",
                    alignment === 'left' && 'justify-start',
                    alignment === 'center' && 'justify-center',
                    alignment === 'right' && 'justify-end'
                  )}
                  onClick={() => leftChapter && setAlignmentMenuOpen(alignmentMenuOpen === 'left' ? null : 'left')}
                >
                  {leftChapter ? (
                    <span
                      className="text-xs font-serif font-medium truncate"
                      style={{ color: leftChapter.color || '#8b7355' }}
                    >
                      {leftChapter.title}
                    </span>
                  ) : (
                    <span className="text-amber-400/20 text-xs">—</span>
                  )}

                  {alignmentMenuOpen === 'left' && leftChapter && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-xl border border-amber-200 py-1 z-50">
                      {[
                        { value: 'left', label: `◀ ${t('alignLeft')}`, icon: <AlignLeft className="w-3 h-3" /> },
                        { value: 'center', label: `▣ ${t('alignCenter')}`, icon: <AlignCenter className="w-3 h-3" /> },
                        { value: 'right', label: `▶ ${t('alignRight')}`, icon: <AlignRight className="w-3 h-3" /> },
                        { value: 'hidden', label: `✕ ${t('alignHide')}`, icon: <EyeOff className="w-3 h-3" /> },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={(e) => {
                            e.stopPropagation()
                            onUpdateChapter?.(leftChapter.id, { titleAlignment: opt.value as Chapter['titleAlignment'] })
                            setAlignmentMenuOpen(null)
                          }}
                          className={cn(
                            "w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-amber-50 transition-colors",
                            alignment === opt.value && "bg-amber-100 text-amber-700"
                          )}
                        >
                          {opt.icon}
                          {opt.label}
                        </button>
                      ))}
                    </div>
              )}
              </div>
              )
            })()}
            
            {/* Lignes de cahier (conditionnelles) - synchronisées avec lineHeight */}
            {showLines && (
              <div 
                className="absolute"
                style={{
                  left: `${pagePad.left}px`,
                  right: `${pagePad.right}px`,
                  top: `${pagePad.top}px`,
                  bottom: `${pagePad.bottom}px`,
                  backgroundImage: `repeating-linear-gradient(transparent, transparent ${leftLineHeightPx - 1}px, rgba(139, 115, 85, 0.15) ${leftLineHeightPx - 1}px, rgba(139, 115, 85, 0.15) ${leftLineHeightPx}px)`,
                  backgroundSize: `100% ${leftLineHeightPx}px`,
                }} 
              />
            )}
            
            {/* Marge rouge (à droite pour page gauche, conditionnelle) */}
            {showLines && (
              <div 
                data-pdf-hide="true"
                className="absolute w-px bg-red-300/40" 
                style={{ right: `${pagePad.right}px`, top: `${pagePad.top}px`, bottom: `${pagePad.bottom}px` }}
              />
            )}
            
            {/* Zone d'écriture - page gauche - absolute, même layout que ExactPageRenderer */}
            {leftPage ? (
              <div
                key={`left-${leftPageIndex}-${zoomedPage === null}`}
                ref={leftEditorRef}
                contentEditable={!isLocked}
                onInput={handleLeftInput}
                onPaste={handlePaste(leftEditorRef, lastLeftContentRef, 'left', onLeftContentChange!)}
                onClick={(e) => { e.stopPropagation(); setActivePage('left'); }}
                data-placeholder={placeholders[locale]}
                style={{
                  ...leftTextStyle,
                  color: '#3d3426',
                  paddingLeft: `${pagePad.left}px`,
                  paddingRight: `${pagePad.right}px`,
                  paddingTop: `${pagePad.top}px`,
                  paddingBottom: `${pagePad.bottom}px`,
                }}
                className={cn(
                  'absolute inset-0 overflow-hidden z-10',
                  'font-serif',
                  'focus:outline-none',
                  'empty:before:content-[attr(data-placeholder)] empty:before:text-amber-500/40 empty:before:pointer-events-none'
                )}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-amber-600/30 text-sm font-serif italic">
                  {t('startOfBook')}
                </span>
              </div>
            )}
            
            {/* Indicateur page pleine - gauche */}
            {pageFullIndicator === 'left' && (
              <div data-pdf-hide="true" className="absolute bottom-[14%] left-0 right-0 z-20 flex justify-center pointer-events-none animate-in fade-in duration-300">
                <span className="bg-amber-100/90 text-amber-700 text-xs font-serif px-3 py-1 rounded-full shadow-sm border border-amber-200/60">
                  {t('editor.pageFull')}
                </span>
              </div>
            )}

            {/* Barre d'outils en bas - page gauche - overlay absolu */}
            {leftPage && leftPageIndex !== undefined && (
              <div
                data-pdf-hide="true"
                className="absolute bottom-0 left-0 right-0 z-20 px-6 py-2 flex items-center justify-between border-t border-amber-300/30 bg-gradient-to-t from-amber-50/80 to-transparent"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs text-amber-700/50 font-serif">
                  {leftPage.content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').split(/\s+/).filter(Boolean).length} {t('words')}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { 
                      e.stopPropagation()
                      if (isListening && dictatingPage === 'left') {
                        stopListening()
                      } else {
                        setDictatingPage('left')
                        startListening()
                      }
                    }}
                    disabled={!isSupported}
                    className={cn(
                      'p-2 rounded-full transition-all',
                      isListening && dictatingPage === 'left'
                        ? 'text-red-500 bg-red-100 animate-pulse' 
                        : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
                    )}
                    title={isListening && dictatingPage === 'left' ? mic.stop : mic.start}
                  >
                    {isListening && dictatingPage === 'left' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <Highlightable id="book-add-image">
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (leftPageIndex !== undefined) {
                        onImageAdd(leftPageIndex); 
                      }
                    }}
                    className="p-2 rounded-full text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50 transition-all"
                    title={t('addImage')}
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  </Highlightable>
                  <Highlightable id="book-add-background">
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (leftPageIndex !== undefined) {
                        onBackgroundAdd?.(leftPageIndex); 
                      }
                    }}
                    className={cn(
                      'p-2 rounded-full transition-all',
                      leftPage.backgroundMedia
                        ? 'text-aurora-600 bg-aurora-100'
                        : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
                    )}
                    title={t('background')}
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                  </Highlightable>
                  {leftPage.backgroundMedia && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingBackgroundPage(editingBackgroundPage === 'left' ? null : 'left'); }}
                      className={cn(
                        'p-2 rounded-full transition-all',
                        editingBackgroundPage === 'left'
                          ? 'text-aurora-600 bg-aurora-100'
                          : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
                      )}
                      title={t('moveBackground')}
                    >
                      <Move className="w-4 h-4" />
                    </button>
                  )}
                  <Highlightable id="book-decorations">
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (leftPageIndex !== undefined) {
                        onDecorationAdd?.(leftPageIndex); 
                      }
                    }}
                    className={cn(
                      'p-2 rounded-full transition-all',
                      (leftPage.decorations?.length || 0) > 0
                        ? 'text-amber-500 bg-amber-100'
                        : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
                    )}
                    title={t('decorations')}
                  >
                    <Gem className="w-4 h-4" />
                  </button>
                  </Highlightable>
                  <Highlightable id="book-text-box">
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (leftPageIndex !== undefined) {
                        onTextBoxAdd?.(leftPageIndex); 
                      }
                    }}
                    className={cn(
                      'p-2 rounded-full transition-all',
                      (leftPage.textBoxes?.length || 0) > 0
                        ? 'text-dream-500 bg-dream-100'
                        : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
                    )}
                    title={t('textBox')}
                  >
                    <Type className="w-4 h-4" />
                  </button>
                  </Highlightable>
              </div>
            </div>
            )}

            {/* Numéro de page en bas / Badge couverture - overlay absolu */}
            <div
              data-pdf-hide="true"
              className={cn(
                "absolute left-0 right-0 z-20 text-center pb-1 text-xs font-serif pointer-events-none",
                leftPageIndex === 0
                  ? "text-amber-500 font-bold"
                  : leftPageIndex === (totalPages || 1) - 1 && (totalPages || 1) > 1
                    ? "text-emerald-500 font-bold"
                    : "text-amber-600/40"
              )}
              style={{ bottom: leftPage && leftPageIndex !== undefined ? '34px' : '4px' }}
            >
              {leftPageIndex === 0
                ? t('frontCover').toUpperCase()
                : leftPageIndex === (totalPages || 1) - 1 && (totalPages || 1) > 1
                  ? t('backCoverShort').toUpperCase()
                  : `— ${leftPageIndex !== undefined ? leftPageIndex + 1 : '—'} —`}
            </div>

          </div>

          {/* RELIURE CENTRALE */}
          <div 
            className="relative z-10 w-4 flex-shrink-0"
            style={{
              background: 'linear-gradient(90deg, #d4a574 0%, #c9956a 30%, #8b6914 50%, #c9956a 70%, #d4a574 100%)',
              boxShadow: '0 0 15px rgba(0,0,0,0.3)',
            }}
          >
            {/* Lignes de reliure */}
            <div className="absolute inset-0 flex flex-col justify-evenly py-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-px bg-amber-900/30 mx-1" />
              ))}
            </div>
          </div>
          
          {/* PAGE DROITE (page d'écriture) — canonical fixed width */}
          <div
            ref={rightPageContainerRef}
            data-page-side="right"
            className="relative group h-full"
            onClick={() => setActivePage('right')}
            style={{
              width: `${canonicalDims.width}px`,
              background: getPageColorStyles(bookColor).background,
              borderRadius: '0 8px 8px 0',
              boxShadow: 'inset 20px 0 30px -20px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
          >
            {/* Clip pour le contenu interne */}
            <div className="absolute inset-0 overflow-hidden rounded-r-lg pointer-events-none" style={{ zIndex: 0 }} />
            
            {/* Overlay zones de sécurité pour l'impression */}
            {showSafeZones && <SafeZoneOverlay format={formatConfig} side="right" />}
            
            {/* Fond de page droite (image ou vidéo) */}
            {page?.backgroundMedia && (
              editingBackgroundPage === 'right' ? (
                <EditableBackground
                  backgroundMedia={page.backgroundMedia}
                  onPositionChange={(x, y, scale) => onBackgroundPositionChange?.(pageIndex, x, y, scale)}
                  onEditEnd={() => setEditingBackgroundPage(null)}
                  containerRef={rightPageContainerRef}
                  roundedClass="rounded-r-lg"
                />
              ) : (
              <div className="absolute inset-0 overflow-hidden rounded-r-lg z-0">
                {page.backgroundMedia.type === 'video' ? (
                  <video
                    src={page.backgroundMedia.url}
                    className="w-full h-full object-cover"
                      style={{ 
                        opacity: page.backgroundMedia.opacity,
                        transform: `translate(${page.backgroundMedia.x || 0}px, ${page.backgroundMedia.y || 0}px) scale(${page.backgroundMedia.scale || 1})`,
                        transformOrigin: 'center center',
                      }}
                    muted
                    loop
                    autoPlay
                    playsInline
                  />
                ) : (
                  <img
                    src={page.backgroundMedia.url}
                    alt=""
                    className="w-full h-full object-cover"
                      style={{ 
                        opacity: page.backgroundMedia.opacity,
                        transform: `translate(${page.backgroundMedia.x || 0}px, ${page.backgroundMedia.y || 0}px) scale(${page.backgroundMedia.scale || 1})`,
                        transformOrigin: 'center center',
                      }}
                  />
                )}
              </div>
              )
            )}
            
            {/* Texture papier */}
            <div className="absolute inset-0 opacity-20 rounded-r-lg overflow-hidden pointer-events-none" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
              zIndex: 1,
            }} />
            
            {/* Médias flottants de la page droite (multi-médias) */}
            {rightPageImages.map((media) => (
              <DraggableMedia
                key={media.id}
                mediaId={media.id}
                src={media.url}
                mediaType={media.type}
                position={media.position}
                imageStyle={media.style}
                frameStyle={media.frame}
                zIndex={media.zIndex}
                opacity={media.opacity}
                onPositionChange={(pos) => onImagePositionChange?.(pageIndex, media.id, pos)}
                onStyleChange={(style) => onImageStyleChange?.(pageIndex, media.id, style)}
                onFrameChange={(frame) => onImageFrameChange?.(pageIndex, media.id, frame)}
                onOpacityChange={(opacity) => onImageOpacityChange?.(pageIndex, media.id, opacity)}
                onDelete={() => onImageDelete?.(pageIndex, media.id)}
                onBringForward={() => onImageBringForward?.(pageIndex, media.id)}
                onSendBackward={() => onImageSendBackward?.(pageIndex, media.id)}
                onCreateNewImage={() => onImageCreateNew?.(media.url, pageIndex)}
                onVideoPosterChange={(poster) => onVideoPosterChange?.(pageIndex, media.id, poster)}
                onConvertToImage={(url) => onConvertVideoToImage?.(pageIndex, media.id, url)}
                containerRef={rightPageContainerRef}
                totalMedia={rightPageImages.length}
              />
            ))}
            
            {/* Décorations premium de la page droite */}
            {page?.decorations?.map((deco) => {
              const decorationItem = PREMIUM_DECORATIONS.find(d => d.id === deco.decorationId)
              if (!decorationItem) return null
              return (
                <DraggableDecoration
                  key={deco.id}
                  decoration={deco}
                  decorationItem={decorationItem}
                  onPositionChange={(id, pos) => onDecorationPositionChange?.(pageIndex, id, pos)}
                  onScaleChange={(id, scale) => onDecorationScaleChange?.(pageIndex, id, scale)}
                  onRotationChange={(id, rotation) => onDecorationRotationChange?.(pageIndex, id, rotation)}
                  onColorChange={(id, color) => onDecorationColorChange?.(pageIndex, id, color)}
                  onOpacityChange={(id, opacity) => onDecorationOpacityChange?.(pageIndex, id, opacity)}
                  onGlowChange={(id, enabled, color, intensity) => onDecorationGlowChange?.(pageIndex, id, enabled, color, intensity)}
                  onFlip={(id, direction) => onDecorationFlip?.(pageIndex, id, direction)}
                  onDelete={(id) => onDecorationDelete?.(pageIndex, id)}
                  containerRef={rightPageContainerRef}
                />
              )
            })}

            {/* Zones de texte flottantes de la page droite */}
            {page?.textBoxes?.map((textBox) => (
              <DraggableTextBox
                key={textBox.id}
                textBox={textBox}
                onPositionChange={(id, pos) => onTextBoxPositionChange?.(pageIndex, id, pos)}
                onContentChange={(id, content) => onTextBoxContentChange?.(pageIndex, id, content)}
                onStyleChange={(id, style) => onTextBoxStyleChange?.(pageIndex, id, style)}
                onDelete={(id) => onTextBoxDelete?.(pageIndex, id)}
                containerRef={rightPageContainerRef}
                pageWidth={pageWidth}
              />
            ))}

            {/* En-tête avec chapitre - overlay absolu dans la zone de padding top */}
            {(() => {
              const rightChapter = chapters.find(c => c.id === page?.chapterId)
              const alignment = rightChapter?.titleAlignment || 'center'
              if (alignment === 'hidden') {
                return (
                  <div
                    data-pdf-hide="true"
                    className="absolute top-0 left-0 right-0 z-20 min-h-[32px] border-b border-amber-300/20 cursor-pointer hover:bg-amber-100/30 transition-colors"
                    onClick={() => rightChapter && setAlignmentMenuOpen(alignmentMenuOpen === 'right' ? null : 'right')}
                  >
                    {alignmentMenuOpen === 'right' && rightChapter && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-xl border border-amber-200 py-1 z-50">
                        {[
                          { value: 'left', label: `◀ ${t('alignLeft')}`, icon: <AlignLeft className="w-3 h-3" /> },
                          { value: 'center', label: `▣ ${t('alignCenter')}`, icon: <AlignCenter className="w-3 h-3" /> },
                          { value: 'right', label: `▶ ${t('alignRight')}`, icon: <AlignRight className="w-3 h-3" /> },
                          { value: 'hidden', label: `✕ ${t('alignHide')}`, icon: <EyeOff className="w-3 h-3" /> },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={(e) => {
                              e.stopPropagation()
                              onUpdateChapter?.(rightChapter.id, { titleAlignment: opt.value as Chapter['titleAlignment'] })
                              setAlignmentMenuOpen(null)
                            }}
                            className={cn(
                              "w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-amber-50 transition-colors text-amber-800",
                              alignment === opt.value && "bg-amber-100 text-amber-700 font-medium"
                            )}
                          >
                            {opt.icon}
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }
              return (
                <div
                  data-pdf-hide="true"
                  className={cn(
                    "absolute top-0 left-0 right-0 z-20 px-4 pt-2 pb-1 border-b border-amber-300/20 min-h-[32px] flex items-center cursor-pointer hover:bg-amber-100/30 transition-colors",
                    alignment === 'left' && 'justify-start',
                    alignment === 'center' && 'justify-center',
                    alignment === 'right' && 'justify-end'
                  )}
                  onClick={() => rightChapter && setAlignmentMenuOpen(alignmentMenuOpen === 'right' ? null : 'right')}
                >
                  {rightChapter ? (
                    <span
                      className="text-xs font-serif font-medium truncate"
                      style={{ color: rightChapter.color || '#8b7355' }}
                    >
                      {rightChapter.title}
                    </span>
                  ) : (
                    <span className="text-amber-400/20 text-xs">—</span>
                  )}

                  {alignmentMenuOpen === 'right' && rightChapter && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-xl border border-amber-200 py-1 z-50">
                      {[
                        { value: 'left', label: `◀ ${t('alignLeft')}`, icon: <AlignLeft className="w-3 h-3" /> },
                        { value: 'center', label: `▣ ${t('alignCenter')}`, icon: <AlignCenter className="w-3 h-3" /> },
                        { value: 'right', label: `▶ ${t('alignRight')}`, icon: <AlignRight className="w-3 h-3" /> },
                        { value: 'hidden', label: `✕ ${t('alignHide')}`, icon: <EyeOff className="w-3 h-3" /> },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={(e) => {
                            e.stopPropagation()
                            onUpdateChapter?.(rightChapter.id, { titleAlignment: opt.value as Chapter['titleAlignment'] })
                            setAlignmentMenuOpen(null)
                          }}
                          className={cn(
                            "w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-amber-50 transition-colors",
                            alignment === opt.value && "bg-amber-100 text-amber-700"
                          )}
                        >
                          {opt.icon}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
            
            {/* Lignes de cahier - conditionnelles - synchronisées avec lineHeight */}
            {showLines && (
              <div 
                className="absolute"
                style={{
                  left: `${pagePad.left}px`,
                  right: `${pagePad.right}px`,
                  top: `${pagePad.top}px`,
                  bottom: `${pagePad.bottom}px`,
                  backgroundImage: `repeating-linear-gradient(transparent, transparent ${rightLineHeightPx - 1}px, rgba(139, 115, 85, 0.15) ${rightLineHeightPx - 1}px, rgba(139, 115, 85, 0.15) ${rightLineHeightPx}px)`,
                  backgroundSize: `100% ${rightLineHeightPx}px`,
                }} 
              />
            )}
            
            {/* Marge rouge (conditionnelle) */}
            {showLines && (
              <div 
                data-pdf-hide="true"
                className="absolute w-px bg-red-300/40" 
                style={{ left: `${pagePad.left}px`, top: `${pagePad.top}px`, bottom: `${pagePad.bottom}px` }}
              />
            )}
            
            {/* Zone d'écriture - page droite - absolute, même layout que ExactPageRenderer */}
            {page ? (
            <div
                key={`right-${pageIndex}-${zoomedPage === null}`}
              ref={editorRef}
              contentEditable={!isLocked}
              onInput={handleInput}
              onPaste={handlePaste(editorRef, lastContentRef, 'right', onContentChange)}
              onClick={(e) => { e.stopPropagation(); setActivePage('right'); }}
              data-placeholder={placeholders[locale]}
              style={{
                ...rightTextStyle,
                color: '#3d3426',
                paddingLeft: `${pagePad.left}px`,
                paddingRight: `${pagePad.right}px`,
                paddingTop: `${pagePad.top}px`,
                paddingBottom: `${pagePad.bottom}px`,
              }}
          className={cn(
                'absolute inset-0 overflow-hidden z-10',
                  'font-serif',
                'focus:outline-none',
                'empty:before:content-[attr(data-placeholder)] empty:before:text-amber-500/40 empty:before:pointer-events-none'
          )}
        />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-amber-600/30 text-sm font-serif italic">
                  {t('nextPage')}
                </span>
              </div>
            )}
        
        {/* Indicateur page pleine - droite */}
            {pageFullIndicator === 'right' && (
              <div data-pdf-hide="true" className="absolute bottom-[14%] left-0 right-0 z-20 flex justify-center pointer-events-none animate-in fade-in duration-300">
                <span className="bg-amber-100/90 text-amber-700 text-xs font-serif px-3 py-1 rounded-full shadow-sm border border-amber-200/60">
                  {t('editor.pageFull')}
                </span>
              </div>
            )}

        {/* Barre d'outils en bas - overlay absolu */}
            <div
              data-pdf-hide="true"
              className="absolute bottom-0 left-0 right-0 z-20 px-6 py-2 flex items-center justify-between border-t border-amber-300/30 bg-gradient-to-t from-amber-50/80 to-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-amber-700/50 font-serif">{getWordCount(page?.content)} {t('words')}</span>
              <div className="flex items-center gap-1">
            <button
              onClick={(e) => { 
                e.stopPropagation()
                if (isListening && dictatingPage === 'right') {
                  stopListening()
                } else {
                  setDictatingPage('right')
                  startListening()
                }
              }}
              disabled={!isSupported}
              className={cn(
                    'p-2 rounded-full transition-all',
                    isListening && dictatingPage === 'right'
                      ? 'text-red-500 bg-red-100 animate-pulse' 
                      : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
                  )}
                  title={isListening && dictatingPage === 'right' ? mic.stop : mic.start}
                >
                  {isListening && dictatingPage === 'right' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
            <Highlightable id="book-add-image">
            <button
              onClick={(e) => { e.stopPropagation(); onImageAdd(pageIndex); }}
                  className="p-2 rounded-full text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50 transition-all"
                  title={t('addImage')}
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            </Highlightable>
            <Highlightable id="book-add-background">
            <button
              onClick={(e) => { e.stopPropagation(); onBackgroundAdd?.(pageIndex); }}
              className={cn(
                'p-2 rounded-full transition-all',
                page?.backgroundMedia
                  ? 'text-aurora-600 bg-aurora-100'
                  : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
              )}
              title={t('background')}
            >
              <Layers className="w-4 h-4" />
            </button>
            </Highlightable>
            {page?.backgroundMedia && (
              <button
                onClick={(e) => { e.stopPropagation(); setEditingBackgroundPage(editingBackgroundPage === 'right' ? null : 'right'); }}
                className={cn(
                  'p-2 rounded-full transition-all',
                  editingBackgroundPage === 'right'
                    ? 'text-aurora-600 bg-aurora-100'
                    : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
                )}
                title={t('moveBackground')}
              >
                <Move className="w-4 h-4" />
              </button>
            )}
            <Highlightable id="book-decorations">
            <button
              onClick={(e) => { e.stopPropagation(); onDecorationAdd?.(pageIndex); }}
              className={cn(
                'p-2 rounded-full transition-all',
                (page?.decorations?.length || 0) > 0
                  ? 'text-amber-500 bg-amber-100'
                  : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
              )}
              title={t('decorations')}
            >
              <Gem className="w-4 h-4" />
            </button>
            </Highlightable>
            <Highlightable id="book-text-box">
            <button
              onClick={(e) => { e.stopPropagation(); onTextBoxAdd?.(pageIndex); }}
              className={cn(
                'p-2 rounded-full transition-all',
                (page?.textBoxes?.length || 0) > 0
                  ? 'text-dream-500 bg-dream-100'
                  : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
              )}
              title={t('textBox')}
            >
              <Type className="w-4 h-4" />
            </button>
            </Highlightable>
          </div>
        </div>
            
            {/* Numéro de page en bas / Badge couverture - overlay absolu */}
            <div
              data-pdf-hide="true"
              className={cn(
                "absolute left-0 right-0 z-20 text-center pb-1 text-xs font-serif pointer-events-none",
                pageIndex === 0
                  ? "text-amber-500 font-bold"
                  : pageIndex === (totalPages || 1) - 1 && (totalPages || 1) > 1
                    ? "text-emerald-500 font-bold"
                    : "text-amber-600/40"
              )}
              style={{ bottom: '34px' }}
            >
              {pageIndex === 0
                ? t('frontCover').toUpperCase()
                : pageIndex === (totalPages || 1) - 1 && (totalPages || 1) > 1
                  ? t('backCoverShort').toUpperCase()
                  : `— ${pageIndex + 1} —`}
            </div>

          </div>
        </div>
        </div>{/* end scale wrapper */}
        </div>{/* end bookContainerRef */}
        
        {/* Flèche droite - overlaid */}
        {onNextPage && (
          <button
            onClick={onNextPage}
            disabled={!hasNextPage}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full transition-all',
              hasNextPage
                ? 'text-midnight-400 hover:text-white hover:bg-midnight-800/50'
                : 'text-midnight-700 cursor-not-allowed'
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
      )}
      
    </div>
  )
}

// ============================================================================
// COMPOSANT : Panneau latéral IA-Amie (nom personnalisable)
// ============================================================================

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AISidePanelProps {
  isOpen: boolean
  onToggle: () => void
  pageContent: string
  pageTitle: string
  pageNumber: number
  totalPages: number
  locale?: 'fr' | 'en' | 'ru'
  // Pour lecture chapitre/livre
  allPages: Array<{ id: string; title: string; content: string; chapterId?: string }>
  chapters: Array<{ id: string; title: string }>
  currentChapterId?: string
  storyTitle: string
}

function AISidePanel({ 
  isOpen, 
  onToggle, 
  pageContent, 
  pageTitle, 
  pageNumber, 
  totalPages,
  locale = 'fr',
  allPages,
  chapters,
  currentChapterId,
  storyTitle
}: AISidePanelProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true) // Vocal activé par défaut
  const [isAnalysisMenuOpen, setIsAnalysisMenuOpen] = useState(false)
  const [showVoiceSelector, setShowVoiceSelector] = useState(false)
  const [showNameEditor, setShowNameEditor] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // TTS avec voix globale depuis le store
  const { aiVoice } = useAppStore()
  const { speak, stop, isSpeaking, isAvailable: isTTSAvailable } = useTTS(locale, aiVoice || undefined)
  
  // Speech recognition for voice input to AI
  const { 
    isListening, 
    isSupported: isSpeechSupported, 
    transcript, 
    startListening, 
    stopListening, 
    resetTranscript 
  } = useSpeechRecognition(locale)
  
  // Send transcript to AI when dictation stops
  useEffect(() => {
    if (!isListening && transcript) {
      sendToAI(transcript)
      resetTranscript()
    }
  }, [isListening, transcript])
  
  // Récupérer le nom personnalisé de l'IA depuis le store
  const { aiName } = useAppStore()
  
  // i18n
  const currentLocale = useLocale()
  const t = useTranslations('writing')
  
  // Nom par défaut selon la langue
  const defaultName = t('ai.defaultName')
  const displayName = aiName || defaultName

  // Scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initial message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'assistant', content: t('ai.intro') }])
    }
  }, [])

  // Highlight store pour faire briller les éléments UI
  const { highlightMultiple } = useHighlightStore()

  // sendToAI avec message visible (court) et message complet (pour l'API)
  const sendToAI = async (userMessage: string, hiddenContext?: string) => {
    if (!userMessage.trim() || isLoading) return
    
    // Stop any current speech
    if (isSpeaking) {
      stop()
    }
    
    // Add user message (version courte visible)
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setMessage('')
    setIsLoading(true)
    
    // Le message envoyé à l'API inclut le contexte caché si présent
    const fullMessage = hiddenContext ? `${userMessage}\n\n${hiddenContext}` : userMessage
    
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: fullMessage,
          context: 'book',
          currentMode: 'ecriture', // Pour le guidage visuel (highlights)
          locale, // Langue de l'interface
          aiName, // Transmettre le nom personnalisé de l'IA
          userName: useAppStore.getState().userName, // Prénom de l'enfant
          chatHistory: messages.slice(-10),
        }),
      })
      
      const data = await response.json()
      
      if (data.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }])
        
        // Déclencher les highlights si présents dans la réponse
        if (data.highlights && data.highlights.length > 0) {
          highlightMultiple(data.highlights)
        }
        
        // Speak the response if autoSpeak is enabled
        if (autoSpeak && isTTSAvailable) {
          speak(data.text)
        }
      }
    } catch (error) {
      console.error('Error sending to AI:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: t('ai.error') }])
    } finally {
      setIsLoading(false)
    }
  }

  // === UTILITAIRE : Nettoyer le HTML pour extraire le texte ===
  const stripHtml = (html: string): string => {
    if (!html) return ''
    // Créer un élément temporaire pour parser le HTML
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    // Récupérer le texte et nettoyer les espaces multiples
    return tmp.textContent || tmp.innerText || ''
  }

  // === LECTURE PAGE ===
  const handleReadPage = () => {
    const cleanContent = stripHtml(pageContent).trim()
    
    if (!cleanContent) {
      sendToAI(t('ai.emptyPage'))
      return
    }
    
    // Message visible (court)
    const visibleMessage = t('ai.readPageMessage', { name: displayName, page: String(pageNumber) })

    // Contexte caché (envoyé à l'API) — sent to AI, always in the locale's language via the locale param in useAI
    const hiddenContext = currentLocale === 'fr'
      ? `Contenu de la page ${pageNumber}${pageTitle ? ` "${pageTitle}"` : ''} :\n\n"${cleanContent}"\n\n→ Analyse la structure (QUI, QUOI, OÙ...), dis-moi si c'est cohérent, et aide-moi à améliorer ! Si tu vois des petites fautes, dis-le moi gentiment.`
      : currentLocale === 'en'
      ? `Content of page ${pageNumber}${pageTitle ? ` "${pageTitle}"` : ''}:\n\n"${cleanContent}"\n\n→ Analyze the structure (WHO, WHAT, WHERE...), tell me if it's coherent, and help me improve! If you see small mistakes, tell me gently.`
      : `Содержание страницы ${pageNumber}${pageTitle ? ` "${pageTitle}"` : ''}:\n\n"${cleanContent}"\n\n→ Проанализируй структуру (КТО, ЧТО, ГДЕ...), скажи, всё ли логично, и помоги улучшить! Если увидишь ошибки, скажи мягко.`
    
    sendToAI(visibleMessage, hiddenContext)
  }

  // === LECTURE CHAPITRE ===
  const handleReadChapter = () => {
    const chapterPages = currentChapterId 
      ? allPages.filter(p => p.chapterId === currentChapterId)
      : allPages
    
    const chapterContent = chapterPages
      .map((p, i) => {
        const cleanText = stripHtml(p.content).trim()
        return `Page ${i + 1}${p.title ? ` - ${p.title}` : ''}: "${cleanText || '(vide)'}"`
      })
      .join('\n\n')
    
    if (!chapterContent.trim() || chapterPages.every(p => !stripHtml(p.content).trim())) {
      sendToAI(t('ai.emptyChapter'))
      return
    }
    
    const chapterTitle = currentChapterId
      ? chapters.find(c => c.id === currentChapterId)?.title || t('ai.thisChapter')
      : t('ai.myStory')

    // Message visible (court)
    const visibleMessage = t('ai.readChapterMessage', { name: displayName, chapter: chapterTitle })

    // Contexte caché
    const hiddenContext = currentLocale === 'fr'
      ? `Contenu du chapitre :\n\n${chapterContent}\n\n→ Est-ce que l'histoire est cohérente ? Les personnages sont bien décrits ? Il manque quelque chose ? Des conseils pour la suite ?`
      : currentLocale === 'en'
      ? `Chapter content:\n\n${chapterContent}\n\n→ Is the story coherent? Are the characters well described? Is something missing? Any advice for what's next?`
      : `Содержание главы:\n\n${chapterContent}\n\n→ История логична? Персонажи хорошо описаны? Чего-то не хватает? Советы для продолжения?`
    
    sendToAI(visibleMessage, hiddenContext)
  }

  // === LECTURE LIVRE ENTIER ===
  const handleReadBook = () => {
    const bookContent = allPages
      .map((p, i) => {
        const chapter = chapters.find(c => c.id === p.chapterId)
        const chapterLabel = chapter ? `[${chapter.title}] ` : ''
        const cleanText = stripHtml(p.content).trim()
        return `${chapterLabel}Page ${i + 1}${p.title ? ` - ${p.title}` : ''}: "${cleanText || '(vide)'}"`
      })
      .join('\n\n')
    
    if (!bookContent.trim() || allPages.every(p => !stripHtml(p.content).trim())) {
      sendToAI(t('ai.emptyBook'))
      return
    }
    
    const title = storyTitle || t('ai.myBook')

    // Message visible (court)
    const visibleMessage = t('ai.readBookMessage', { name: displayName, title })

    // Contexte caché
    const hiddenContext = currentLocale === 'fr'
      ? `Contenu complet du livre :\n\n${bookContent}\n\n→ Analyse globale : l'histoire a un bon début, milieu et fin ? Les personnages sont cohérents ? L'histoire est intéressante ? Qu'est-ce que je pourrais améliorer ? Y a-t-il des fautes que tu remarques souvent ?`
      : currentLocale === 'en'
      ? `Full book content:\n\n${bookContent}\n\n→ Global analysis: does the story have a good beginning, middle and end? Are the characters consistent? Is the story interesting? What could I improve? Are there mistakes you notice often?`
      : `Полное содержание книги:\n\n${bookContent}\n\n→ Общий анализ: есть хорошее начало, середина и конец? Персонажи последовательны? История интересная? Что можно улучшить? Есть ли частые ошибки?`
    
    sendToAI(visibleMessage, hiddenContext)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendToAI(message)
  }

  // Collapsed state - just a button
  if (!isOpen) {
    return (
      <motion.button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-2 px-4 py-3 rounded-xl',
          'bg-gradient-to-r from-aurora-500/20 to-stardust-500/20',
          'border border-aurora-500/30',
          'hover:from-aurora-500/30 hover:to-stardust-500/30',
          'transition-all'
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-aurora-500 to-stardust-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-aurora-300 font-medium">{displayName}</span>
        <ChevronLeft className="w-4 h-4 text-aurora-400" />
      </motion.button>
    )
  }

  // Expanded panel
  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="h-full flex flex-col bg-midnight-900/50 rounded-2xl border border-midnight-700/30 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-midnight-700/30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aurora-500 to-stardust-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          {showNameEditor ? (
            <input
              type="text"
              defaultValue={aiName || ''}
              placeholder={t('ai.namePlaceholder')}
              maxLength={15}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.target as HTMLInputElement).value.trim()
                  if (value) {
                    useAppStore.getState().setAiName(value)
                  }
                  setShowNameEditor(false)
                } else if (e.key === 'Escape') {
                  setShowNameEditor(false)
                }
              }}
              onBlur={(e) => {
                const value = e.target.value.trim()
                if (value) {
                  useAppStore.getState().setAiName(value)
                }
                setShowNameEditor(false)
              }}
              className="w-full bg-midnight-800 border border-aurora-500/50 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-aurora-500"
            />
          ) : (
            <button
              onClick={() => setShowNameEditor(true)}
              className="text-left group"
              title={t('ai.clickToRename')}
            >
              <p className="font-medium text-white flex items-center gap-1.5">
                {displayName}
                <Edit3 className="w-3 h-3 text-midnight-500 group-hover:text-aurora-400 transition-colors" />
              </p>
            </button>
          )}
          <p className="text-xs text-midnight-400">{t('ai.subtitle')}</p>
        </div>
        
        {/* Toggle Écrit / Oral */}
        {isTTSAvailable && (
          <button
            onClick={() => {
              if (isSpeaking) stop()
              setAutoSpeak(!autoSpeak)
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              autoSpeak 
                ? 'bg-aurora-500/20 text-aurora-300 border border-aurora-500/30'
                : 'bg-midnight-700/50 text-midnight-400 border border-midnight-600/30 hover:text-midnight-300'
            )}
            title={autoSpeak ? t('ai.voiceOn') : t('ai.voiceOff')}
          >
            <Volume2 className={cn("w-3.5 h-3.5", isSpeaking && "animate-pulse")} />
            {autoSpeak ? t('ai.voice') : t('ai.text')}
          </button>
        )}
        
        {/* Bouton paramètres voix */}
        {isTTSAvailable && (
          <button
            onClick={() => setShowVoiceSelector(!showVoiceSelector)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showVoiceSelector
                ? 'bg-aurora-500/20 text-aurora-300'
                : 'bg-midnight-800/50 text-midnight-400 hover:text-white'
            )}
            title={t('ai.chooseVoice')}
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
        
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-midnight-800 text-midnight-400 hover:text-white transition-colors"
          title={t('ai.collapse')}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Panel sélecteur de voix */}
      <AnimatePresence>
        {showVoiceSelector && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-midnight-700/50 overflow-hidden"
          >
            <VoiceSelector className="rounded-none border-0" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'rounded-xl p-3 text-sm',
              msg.role === 'assistant'
                ? 'bg-aurora-500/10 text-aurora-100'
                : 'bg-midnight-800/50 text-white ml-4'
            )}
          >
            <p className="leading-relaxed">{msg.content}</p>
            {/* Bouton écouter pour les messages de l'IA */}
            {msg.role === 'assistant' && isTTSAvailable && (
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stop()
                  } else {
                    speak(msg.content)
                  }
                }}
                className={cn(
                  'mt-2 p-1.5 rounded-full transition-all',
                  isSpeaking
                    ? 'bg-aurora-500/30 text-aurora-300'
                    : 'bg-midnight-700/30 text-midnight-400 hover:text-aurora-300 hover:bg-aurora-500/20'
                )}
                title={isSpeaking ? t('ai.stop') : t('ai.listen', { name: displayName })}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        ))}
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-aurora-500/10 rounded-xl p-3 text-sm text-aurora-300"
          >
            <span className="animate-pulse">{t('ai.reading')}</span>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input avec analyse premium */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-midnight-700/30">
        {/* Pastille IA Analyse - Design Premium */}
        <div className="flex justify-end mb-3 relative">
          <motion.button
            type="button"
            onClick={() => setIsAnalysisMenuOpen((v) => !v)}
            disabled={isLoading}
            className={cn(
              'group relative px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide',
              'bg-gradient-to-r from-aurora-600/10 via-dream-500/10 to-aurora-600/10',
              'border border-aurora-500/20 text-aurora-200/80',
              'hover:border-aurora-400/40 hover:text-white',
              'shadow-[0_0_20px_rgba(139,92,246,0.1)]',
              'hover:shadow-[0_0_25px_rgba(139,92,246,0.2)]',
              'transition-all duration-300',
              isAnalysisMenuOpen && 'border-aurora-400/50 text-white shadow-[0_0_30px_rgba(139,92,246,0.25)]',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
            whileHover={!isLoading ? { scale: 1.03 } : {}}
            whileTap={!isLoading ? { scale: 0.97 } : {}}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
            
            {/* Glow ring on active */}
            {isAnalysisMenuOpen && (
              <motion.div
                className="absolute -inset-[1px] rounded-full bg-gradient-to-r from-aurora-500/30 via-dream-500/30 to-aurora-500/30 blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
            
            <span className="relative flex items-center gap-2">
              <motion.span
                animate={isAnalysisMenuOpen ? { rotate: 180 } : { rotate: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </motion.span>
              <span className="uppercase">{t('ai.reads', { name: displayName })}</span>
            </span>
          </motion.button>
          
          {/* Menu radial premium */}
          <AnimatePresence>
            {isAnalysisMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 8 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="absolute right-0 bottom-full mb-2 p-1 rounded-2xl bg-midnight-950/95 backdrop-blur-xl border border-aurora-500/20 shadow-2xl shadow-aurora-500/10"
              >
                {/* Gradient border effect */}
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-aurora-500/30 via-transparent to-dream-500/30 -z-10 blur-[1px]" />
                
                <div className="flex gap-0.5">
                  {[
                    { action: handleReadPage, icon: FileText, label: t('ai.pageLabel'), title: t('ai.readPage') },
                    { action: handleReadChapter, icon: Folder, label: t('ai.chapterLabel'), title: t('ai.readChapter') },
                    { action: handleReadBook, icon: Book, label: t('ai.bookLabel'), title: t('ai.readBook') },
                  ].map((item, idx) => (
                    <motion.button
                      key={item.label}
                      type="button"
                      onClick={() => { setIsAnalysisMenuOpen(false); item.action(); }}
                      className="group/item relative px-4 py-2 rounded-xl text-[11px] font-medium text-midnight-300 hover:text-white transition-all duration-200 flex flex-col items-center gap-1.5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.2 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title={item.title}
                    >
                      {/* Hover glow */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-aurora-500/0 via-aurora-500/0 to-dream-500/0 group-hover/item:from-aurora-500/20 group-hover/item:via-aurora-500/10 group-hover/item:to-dream-500/20 transition-all duration-300" />
                      
                      {/* Icon with glow */}
                      <div className="relative">
                        <item.icon className="w-4 h-4 relative z-10 transition-transform duration-200 group-hover/item:scale-110" />
                        <div className="absolute inset-0 blur-md bg-aurora-500/0 group-hover/item:bg-aurora-500/50 transition-all duration-300" />
                      </div>
                      
                      <span className="relative z-10 tracking-wide">{item.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={isListening ? t('ai.listening') : message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('ai.placeholder', { name: displayName })}
            disabled={isLoading || isListening}
            className="flex-1 px-4 py-2 rounded-xl bg-midnight-800/50 border border-midnight-700/50 text-white placeholder-midnight-500 text-sm focus:outline-none focus:border-aurora-500/30 disabled:opacity-50"
          />
          
          {/* Bouton micro pour parler à l'IA */}
          <motion.button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={isLoading || !isSpeechSupported}
            className={cn(
              'px-3 py-2 rounded-xl transition-colors',
              !isSpeechSupported
                ? 'bg-midnight-800/30 text-midnight-600 cursor-not-allowed'
                : isListening 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-midnight-800/50 text-midnight-400 hover:text-aurora-300 hover:bg-midnight-800'
            )}
            animate={isListening ? { scale: [1, 1.1, 1] } : {}}
            transition={isListening ? { repeat: Infinity, duration: 0.8 } : {}}
            title={!isSpeechSupported ? t('notSupported') : isListening ? t('ai.stop') : t('speakTo', { name: displayName })}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </motion.button>
          
          <motion.button
            type="submit"
            disabled={!message.trim() || isLoading || isListening}
            className={cn(
              'p-3 rounded-xl bg-gradient-to-br from-aurora-500 to-aurora-700 text-white',
              (!message.trim() || isLoading || isListening) && 'opacity-50'
            )}
            whileHover={message.trim() && !isLoading && !isListening ? { scale: 1.05 } : {}}
            whileTap={message.trim() && !isLoading && !isListening ? { scale: 0.95 } : {}}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </form>
    </motion.div>
  )
}

// ============================================================================
// COMPOSANT : Sélecteur de structure
// ============================================================================

// Format par défaut (recommandé) — modifiable ensuite dans l'éditeur
const DEFAULT_BOOK_FORMAT: BookFormat = BOOK_FORMATS.find(f => f.recommended)?.id || 'square-21'

interface StructureSelectorProps {
  onSelect: (structure: StoryStructure, bookFormat: BookFormat) => void
  locale?: 'fr' | 'en' | 'ru'
}

// Configuration des structures - avec images générées par IA
const STRUCTURE_CONFIG: Record<StoryStructure, {
  icon: string
  image: string
}> = {
  tale: {
    icon: '🏰',
    image: '/images/structures/structure-tale.jpg',
  },
  adventure: {
    icon: '🗺️',
    image: '/images/structures/structure-adventure.jpg',
  },
  problem: {
    icon: '🧩',
    image: '/images/structures/structure-problem.jpg',
  },
  free: {
    icon: '✨',
    image: '/images/structures/structure-free.jpg',
  },
}

function StructureSelector({ onSelect, locale = 'fr' }: StructureSelectorProps) {
  const t = useTranslations('writing')
  const structures: StoryStructure[] = ['tale', 'adventure', 'problem', 'free']

  const handleSelectStructure = (structure: StoryStructure) => {
    onSelect(structure, DEFAULT_BOOK_FORMAT)
  }

  return (
    <div className="relative max-w-6xl mx-auto">
      {/* Titre compact */}
      <motion.div 
        className="text-center mb-4 lg:mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="font-display text-xl sm:text-2xl lg:text-3xl text-white mb-1 lg:mb-2">
          {t('formatSelector.structureTitle')}
        </h2>
        <p className="text-white/50 text-xs sm:text-sm">
          {t('formatSelector.structureSubtitle')}
        </p>
      </motion.div>

      {/* Grille 2x2 qui s'adapte à l'écran */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 max-w-4xl mx-auto px-2">
        {structures.map((structureId, index) => {
          const template = STORY_TEMPLATES[structureId]
          const config = STRUCTURE_CONFIG[structureId]
          
          return (
            <motion.button
              key={structureId}
              onClick={() => handleSelectStructure(structureId)}
              className="group relative text-left focus:outline-none focus:ring-2 focus:ring-aurora-500/50 rounded-2xl lg:rounded-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Carte avec image de fond - ratio compact */}
              <div className="relative overflow-hidden rounded-xl lg:rounded-2xl aspect-[4/3] shadow-[0_4px_16px_0_rgba(0,0,0,0.3)] group-hover:shadow-[0_8px_24px_0_rgba(0,0,0,0.4)] transition-all duration-300">
                {/* Image de fond générée par IA - lumineuse et colorée */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${config.image})`,
                    filter: 'brightness(1.08) saturate(1.1) contrast(1.03)',
                  }}
                />
                
                {/* Overlay gradient très subtil pour lisibilité du texte - SANS flou */}
                <div 
                  className="absolute inset-0 transition-all duration-500"
                  style={{
                    background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.4) 100%)',
                  }}
                />
                
                {/* Effet de verre premium - reflet lumineux en haut */}
                <div 
                  className="absolute inset-x-0 top-0 h-1/2 opacity-30 group-hover:opacity-40 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 30%, transparent 100%)',
                  }}
                />
                
                {/* Bordure élégante avec glow */}
                <div 
                  className="absolute inset-0 rounded-3xl border border-white/30 group-hover:border-white/50 transition-all duration-500"
                  style={{
                    boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.3), 0 0 20px rgba(255,255,255,0.1)',
                  }}
                />
                
                {/* Effet de brillance diagonal au survol */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
                    transform: 'translateX(-100%)',
                    animation: 'shimmer 3s infinite',
                  }}
                />
                
                {/* Vignette subtile pour la profondeur */}
                <div 
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    boxShadow: 'inset 0 0 60px rgba(0,0,0,0.3)',
                  }}
                />
                
                {/* Contenu - adapté aux petits écrans desktop */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5 lg:p-6 z-10">
                  {/* Badge icône avec effet glass */}
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-black/60 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                    <span className="text-xl sm:text-2xl lg:text-3xl drop-shadow-lg">{config.icon}</span>
                  </div>
                  
                  {/* Texte avec meilleur contraste */}
                  <div>
                    <h3 className="font-display text-lg sm:text-xl lg:text-2xl xl:text-3xl text-white mb-1 lg:mb-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-300 origin-left">
                      {template.name[locale]}
                    </h3>
                    <p className="text-sm lg:text-base text-white/95 leading-snug lg:leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] line-clamp-2 lg:line-clamp-none">
                      {template.description[locale]}
                    </p>
                  </div>
                  
                  {/* Bouton Commencer premium - caché sur très petits écrans */}
                  <div className="mt-3 lg:mt-5 hidden sm:flex items-center gap-2 text-sm lg:text-base font-semibold text-white opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                    <span className="px-4 py-2 lg:px-6 lg:py-3 rounded-full bg-white/30 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/40 hover:scale-105 transition-all duration-300">
                      {t('formatSelector.start')} →
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
      
      {/* Note */}
      <motion.p 
        className="text-center text-white/40 text-xs lg:text-sm mt-6 lg:mt-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {t('formatSelector.structureHint')}
      </motion.p>
    </div>
  )
}

// ============================================================================
// COMPOSANT PRINCIPAL : BookMode
// ============================================================================

export function BookMode() {
  const { 
    stories,
    currentStory, 
    createStory,
    setCurrentStory,
    updateStoryPages,
    deleteStory,
    addStoryChapter,
    deleteStoryChapter,
    updateStoryChapters,
    completeStory,
    reopenStory,
    setCurrentMode,
    updateStoryFormat,
  } = useAppStore()
  
  const [storyTitle, setStoryTitle] = useState('')
  const [showAIPanel, setShowAIPanel] = useState(true) // Panneau IA ouvert par défaut
  
  // Modale d'introduction (première visite)
  const { isFirstVisit, markAsSeen } = useFirstVisit('writing')
  const [showOverview, setShowOverview] = useState(false)
  const [showStructureSelector, setShowStructureSelector] = useState(false)
  const [showStructureView, setShowStructureView] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  
  // État local pour les pages de contenu (Page 1 = couverture, dernière = 4ème)
  const [pages, setPages] = useState<StoryPageLocal[]>([
    { id: '1', title: '', content: '' }
  ])
  
  // Chapitres (synchronisés avec le store)
  const [chapters, setChapters] = useState<Chapter[]>([])
  // Navigation par spread (paire de pages) comme un vrai livre
  const [currentSpread, setCurrentSpread] = useState(0)
  // État pour savoir quelle page est zoomée (null = vue double page)
  const [currentZoomedPage, setCurrentZoomedPage] = useState<'left' | 'right' | null>(null)
  // État pour l'édition du nom de chapitre
  const [isEditingChapterName, setIsEditingChapterName] = useState(false)
  const [editingChapterName, setEditingChapterName] = useState('')
  // État pour afficher/masquer les lignes de cahier (global)
  const [showLines, setShowLines] = useState(true)
  // État pour afficher/masquer les zones de sécurité d'impression
  const [showSafeZones, setShowSafeZones] = useState(false)
  // État pour les alertes DPI (images basse résolution)
  const [dpiWarning, setDpiWarning] = useState<{ imageId: string; dpi: number; message: string } | null>(null)
  
  // État pour la couleur du livre (global pour toutes les pages)
  const [bookColor, setBookColor] = useState<PageColor>('cream')
  
  // État pour le MediaPicker
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [mediaPickerTargetPage, setMediaPickerTargetPage] = useState<'left' | 'right'>('right')
  
  // État pour le MediaPicker de fond de page
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false)
  const [backgroundPickerTargetPage, setBackgroundPickerTargetPage] = useState<number>(0)
  
  // État pour le CharacterImageCreator (nouvelle image avec même personnage)
  const [showCharacterCreator, setShowCharacterCreator] = useState(false)
  const [characterCreatorRefImage, setCharacterCreatorRefImage] = useState<string>('')
  const [characterCreatorTargetPage, setCharacterCreatorTargetPage] = useState<number>(0)
  
  // État pour le DecorationPicker
  const [showDecorationPicker, setShowDecorationPicker] = useState(false)
  const [decorationPickerTargetPage, setDecorationPickerTargetPage] = useState<number>(0)
  
  // État pour la confirmation de suppression de page
  const [pageToDelete, setPageToDelete] = useState<number | null>(null)
  
  // ============================================================================
  // EXPORT PDF — off-screen via usePdfExport (Gelato print-ready, ≥300 DPI)
  // ============================================================================
  const {
    isExporting: isExportingPdf,
    message: exportStatus,
    exportToPdf,
  } = usePdfExport()

  const handleExportPdf = useCallback(async () => {
    if (!currentStory || pages.length === 0) return

    const storyFormat = currentStory.bookFormat || 'portrait-a5'
    const formatConfig = BOOK_FORMATS.find(f => f.id === storyFormat) || BOOK_FORMATS[0]

    // Build a Story-shaped object from the local pages state
    const storyForExport = {
      ...currentStory,
      pages: pages.map(p => ({
        id: p.id,
        title: p.title || '',
        content: p.content || '',
        pageType: p.pageType,
        images: p.images,
        backgroundMedia: p.backgroundMedia,
        decorations: p.decorations,
        textBoxes: p.textBoxes,
        style: p.style,
      })),
    }

    const result = await exportToPdf(storyForExport as any, {
      format: formatConfig,
      pageColor: bookColor,
      showLines,
    })

    if (result) {
      const filename = `${currentStory.title.replace(/[^a-zA-Z0-9]/g, '_')}_${formatConfig.name}_Gelato`
      downloadPdfFile(result, filename)
    }
  }, [currentStory, pages, bookColor, showLines, exportToPdf])
  
  // Calcul des indices de pages pour le spread courant
  // Spread 0 : couverture seule à droite (left=undefined, right=page 0)
  // Spread 1 : pages [1, 2], Spread 2 : pages [3, 4], etc.
  const leftPageIndex = currentSpread === 0 ? undefined : (currentSpread * 2 - 1)
  const rightPageIndex = currentSpread === 0 ? 0 : (currentSpread * 2)
  const totalSpreads = Math.ceil((pages.length + 1) / 2)
  
  // i18n
  const locale = useLocale()
  const t = useTranslations('writing')
  const tCommon = useTranslations('common')

  // Référence pour tracker l'ID de l'histoire chargée
  const loadedStoryIdRef = useRef<string | null>(null)
  
  // Initialiser avec une histoire existante (seulement quand on change d'histoire)
  useEffect(() => {
    if (currentStory && currentStory.id !== loadedStoryIdRef.current) {
      console.log('Loading NEW story:', currentStory.title, 'pages:', currentStory.pages, 'chapters:', currentStory.chapters)
      loadedStoryIdRef.current = currentStory.id
      setStoryTitle(currentStory.title)
      
      if (currentStory.pages && currentStory.pages.length > 0) {
        // Helper pour convertir une page du store vers le format local
        const convertPage = (p: typeof currentStory.pages[0]): StoryPageLocal => ({
          id: p.id,
          title: p.title || '',
          content: p.content || '',
          pageType: p.pageType,
          // Nouveau format multi-médias (cast pour compatibilité de types)
          images: p.images?.map(img => ({
            ...img,
            style: img.style as ImageStyle,
            frame: img.frame as FrameStyle,
          })),
          // Fond de page (image ou vidéo)
          backgroundMedia: p.backgroundMedia as BackgroundMedia | undefined,
          // Décorations (stickers, ornements)
          decorations: p.decorations as PageDecoration[] | undefined,
          // Zones de texte flottantes
          textBoxes: p.textBoxes as PageTextBox[] | undefined,
          // Legacy fields
          image: p.image,
          imagePosition: p.imagePosition,
          imageStyle: p.imageStyle as ImageStyle | undefined,
          frameStyle: p.frameStyle as FrameStyle | undefined,
          chapterId: p.chapterId,
          // Charger le style depuis la page stockée, ou utiliser le style par défaut
          style: p.style ? {
            fontFamily: p.style.fontFamily || DEFAULT_STYLE.fontFamily,
            fontSize: p.style.fontSize || DEFAULT_STYLE.fontSize,
            color: p.style.color || DEFAULT_STYLE.color,
            isBold: p.style.isBold ?? DEFAULT_STYLE.isBold,
            isItalic: p.style.isItalic ?? DEFAULT_STYLE.isItalic,
            textAlign: p.style.textAlign || DEFAULT_STYLE.textAlign,
            lineSpacing: p.style.lineSpacing || DEFAULT_STYLE.lineSpacing,
          } : DEFAULT_STYLE,
        })
        
        // Séparer les pages de couverture des pages de contenu
        const allPages = currentStory.pages
        // Toutes les pages sont traitées de la même façon
        // Page 1 = couverture, dernière page = 4ème de couverture (à l'export)
        setPages(allPages.map(convertPage))
      } else {
        // Si pas de pages, créer une page vide (qui sera la couverture)
        setPages([{ id: '1', title: '', content: '', chapterId: undefined, style: DEFAULT_STYLE }])
      }
      
      // Charger les chapitres depuis le store
      if (currentStory.chapters && currentStory.chapters.length > 0) {
        setChapters(currentStory.chapters.map(c => ({
          id: c.id,
          title: c.title,
          type: c.type,
          color: c.color,
        })))
      } else {
        setChapters([])
      }
      
      setCurrentSpread(0)
      setShowStructureSelector(false)
    } else if (!currentStory) {
      loadedStoryIdRef.current = null
    }
  }, [currentStory])

  const handleAddPage = () => {
    const newPage: StoryPageLocal = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      chapterId: undefined,
      pageType: 'content',
    }
    // Insérer avant la 4e de couverture (dernière page)
    const lastPage = pages[pages.length - 1]
    const isLastBackCover = lastPage?.pageType === 'back-cover'
    const newPages = isLastBackCover
      ? [...pages.slice(0, -1), newPage, lastPage]
      : [...pages, newPage]
    setPages(newPages)
    // Aller au spread contenant la nouvelle page (avant le back cover)
    const newContentLastIndex = isLastBackCover ? newPages.length - 2 : newPages.length - 1
    setCurrentSpread(Math.floor(newContentLastIndex / 2))

    // Sauvegarder dans le store (utilise pagesToStoreFormat pour inclure tous les champs)
    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  const handleDeletePage = (index: number) => {
    // Ne pas supprimer le front cover ni le back cover
    const page = pages[index]
    if (page?.pageType === 'front-cover' || page?.pageType === 'back-cover') return
    // Garder au minimum 4 pages (front + 2 contenu + back)
    if (pages.length <= 4) return
    const newPages = pages.filter((_, i) => i !== index)
    // Si le total devient impair, supprimer aussi la page vide adjacente
    // pour maintenir le back cover sur une page gauche
    if (newPages.length % 2 !== 0) {
      // Chercher une page de contenu vide (avant le back cover) à supprimer
      const backCoverIdx = newPages.length - 1
      let blankIdx = -1
      for (let i = backCoverIdx - 1; i >= 1; i--) {
        const p = newPages[i]
        if (!p.content && !p.images?.length && !p.backgroundMedia && !p.textBoxes?.length && p.pageType !== 'front-cover') {
          blankIdx = i
          break
        }
      }
      if (blankIdx >= 0) {
        newPages.splice(blankIdx, 1)
      } else {
        // Pas de page vide à supprimer, ajouter une page blanche avant le back cover
        const blankPage: StoryPageLocal = {
          id: crypto.randomUUID(),
          title: '',
          content: '',
          pageType: 'content',
        }
        newPages.splice(newPages.length - 1, 0, blankPage)
      }
    }
    setPages(newPages)
    // Ajuster le spread si nécessaire
    const newTotalSpreads = Math.ceil(newPages.length / 2)
    if (currentSpread >= newTotalSpreads) {
      setCurrentSpread(Math.max(0, newTotalSpreads - 1))
    }

    // Sauvegarder dans le store (utilise pagesToStoreFormat pour inclure tous les champs)
    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  // Modifie le contenu de la page droite uniquement
  const handleContentChange = (content: string) => {
    if (!pages[rightPageIndex]) return
    const newPages = [...pages]
    newPages[rightPageIndex] = { ...newPages[rightPageIndex], content }
    setPages(newPages)
    
    // Sauvegarder dans le store
    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  const handleTitleChange = (title: string) => {
    if (!pages[rightPageIndex]) return
    const newPages = [...pages]
    newPages[rightPageIndex] = { ...newPages[rightPageIndex], title }
    setPages(newPages)
    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  const handleStyleChange = (pageIndex: number, styleUpdate: Partial<TextStyle>) => {
    if (!pages[pageIndex]) return
    const newPages = [...pages]
    const currentStyle = newPages[pageIndex].style || DEFAULT_STYLE
    newPages[pageIndex] = { 
      ...newPages[pageIndex], 
      style: { ...currentStyle, ...styleUpdate } 
    }
    setPages(newPages)
    
    // Sauvegarder les styles dans le store
    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  // Helper pour convertir les pages vers le format de sauvegarde
  const pagesToStoreFormat = (pagesArray: StoryPageLocal[]) => {
    return pagesArray.map((p, index) => ({
      id: p.id,
      stepIndex: index,
      content: p.content,
      pageType: p.pageType, // Important: préserver le type de page (front-cover, back-cover, content)
      // Style de texte de la page (police, taille, alignement, etc.)
      style: p.style,
      images: p.images,
      // Fond de page, décorations et zones de texte
      backgroundMedia: p.backgroundMedia,
      decorations: p.decorations,
      textBoxes: p.textBoxes,
      // Legacy fields pour rétrocompatibilité
      image: p.image,
      imagePosition: p.imagePosition,
      imageStyle: p.imageStyle,
      frameStyle: p.frameStyle,
      order: index,
      chapterId: p.chapterId,
      title: p.title,
    }))
  }

  // Helper pour mettre à jour un média spécifique dans une page
  const updateImageInPage = (page: StoryPageLocal, imageId: string, updates: Partial<PageMedia>): StoryPageLocal => {
    // Si c'est une image legacy
    if (imageId === 'legacy-image') {
      return {
        ...page,
        imagePosition: updates.position || page.imagePosition,
        imageStyle: updates.style || page.imageStyle,
        frameStyle: updates.frame || page.frameStyle,
      }
    }
    
    // Si c'est le nouveau format multi-images
    if (page.images) {
      return {
        ...page,
        images: page.images.map(img => 
          img.id === imageId ? { ...img, ...updates } : img
        ),
      }
    }
    
    return page
  }

  // Gestion de la position de l'image (drag & drop)
  const handleImagePositionChange = (pageIdx: number, imageId: string, position: ImagePosition) => {
    if (!pages[pageIdx]) return
    const newPages = [...pages]
    newPages[pageIdx] = updateImageInPage(newPages[pageIdx], imageId, { position })
    setPages(newPages)
    
    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  // Gestion du style de l'image
  const handleImageStyleChange = (pageIdx: number, imageId: string, style: ImageStyle) => {
    if (!pages[pageIdx]) return
    const newPages = [...pages]
    newPages[pageIdx] = updateImageInPage(newPages[pageIdx], imageId, { style })
    setPages(newPages)
    
    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  // Gestion du cadre de l'image
  const handleImageFrameChange = (pageIdx: number, imageId: string, frame: FrameStyle) => {
    if (!pages[pageIdx]) return
    const newPages = [...pages]
    newPages[pageIdx] = updateImageInPage(newPages[pageIdx], imageId, { frame })
    setPages(newPages)
    
    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  // Gestion de l'opacité de l'image
  const handleImageOpacityChange = (pageIdx: number, imageId: string, opacity: number) => {
    if (!pages[pageIdx]) return
    const newPages = [...pages]
    newPages[pageIdx] = updateImageInPage(newPages[pageIdx], imageId, { opacity })
    setPages(newPages)
    
    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  // Capture du frame vidéo pour l'export PDF
  const handleVideoPosterChange = (pageIdx: number, imageId: string, poster: string) => {
    if (!pages[pageIdx]) return
    const newPages = [...pages]
    newPages[pageIdx] = updateImageInPage(newPages[pageIdx], imageId, { videoPoster: poster } as Partial<PageMedia>)
    setPages(newPages)

    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  // Capturer un frame vidéo comme nouvelle image (ajoutée à côté de la vidéo)
  const handleConvertVideoToImage = (pageIdx: number, imageId: string, imageUrl: string) => {
    if (!pages[pageIdx]) return
    const page = pages[pageIdx]
    // Récupérer la position de la vidéo source pour placer l'image à côté
    const sourceMedia = page.images?.find(m => m.id === imageId)
    const newPages = [...pages]
    const mediaId = `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newMedia: PageMedia = {
      id: mediaId,
      url: imageUrl,
      type: 'image',
      position: sourceMedia ? {
        ...sourceMedia.position,
        x: Math.min(sourceMedia.position.x + 5, 90),
        y: Math.min(sourceMedia.position.y + 5, 90),
      } : DEFAULT_IMAGE_POSITION,
      style: sourceMedia?.style || 'normal',
      frame: sourceMedia?.frame || 'none',
      zIndex: (page.images?.length || 0) + 1,
    }
    newPages[pageIdx] = {
      ...page,
      images: [...(page.images || []), newMedia],
    }
    setPages(newPages)

    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  // Suppression d'une image d'une page
  const handleImageDelete = (pageIdx: number, imageId: string) => {
    if (!pages[pageIdx]) return
    const newPages = [...pages]
    const page = newPages[pageIdx]
    
    if (imageId === 'legacy-image') {
      // Suppression d'une image legacy
      newPages[pageIdx] = { 
        ...page, 
        image: undefined, 
        imagePosition: undefined,
        imageStyle: undefined,
        frameStyle: undefined,
      }
    } else if (page.images) {
      // Suppression d'une image du nouveau format
      newPages[pageIdx] = {
        ...page,
        images: page.images.filter(img => img.id !== imageId),
      }
    }
    
    setPages(newPages)
    
    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  // Mettre une image devant (augmente son zIndex au-dessus de toutes les autres)
  const handleImageBringForward = (pageIdx: number, imageId: string) => {
    if (!pages[pageIdx]?.images || pages[pageIdx].images!.length < 2) return
    const newPages = [...pages]
    const page = newPages[pageIdx]
    
    if (page.images) {
      const currentImage = page.images.find(img => img.id === imageId)
      if (!currentImage) return
      
      const maxZIndex = Math.max(...page.images.map(img => img.zIndex))
      
      // Si l'image est déjà au premier plan, ne rien faire
      if (currentImage.zIndex >= maxZIndex) return
      
      newPages[pageIdx] = {
        ...page,
        images: page.images.map(img => 
          img.id === imageId ? { ...img, zIndex: maxZIndex + 1 } : img
        ),
      }
      setPages(newPages)
      
      if (currentStory) {
        updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
      }
    }
  }

  // Envoyer une image derrière (diminue son zIndex en dessous de toutes les autres)
  const handleImageSendBackward = (pageIdx: number, imageId: string) => {
    if (!pages[pageIdx]?.images || pages[pageIdx].images!.length < 2) return
    const newPages = [...pages]
    const page = newPages[pageIdx]
    
    if (page.images) {
      const currentImage = page.images.find(img => img.id === imageId)
      if (!currentImage) return
      
      const minZIndex = Math.min(...page.images.map(img => img.zIndex))
      
      // Si l'image est déjà à l'arrière-plan, ne rien faire
      if (currentImage.zIndex <= minZIndex) return
      
      // Augmenter le zIndex de toutes les autres images au lieu de baisser celui de l'image courante
      // (évite les zIndex négatifs ou nuls)
      newPages[pageIdx] = {
        ...page,
        images: page.images.map(img => 
          img.id === imageId ? img : { ...img, zIndex: img.zIndex + 1 }
        ),
      }
      setPages(newPages)
      
      if (currentStory) {
        updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
      }
    }
  }

  // Gestion de l'ajout d'image/vidéo via MediaPicker
  const handleOpenMediaPicker = (targetPage: 'left' | 'right' = 'right') => {
    setMediaPickerTargetPage(targetPage)
    setShowMediaPicker(true)
  }

  const handleMediaSelect = async (url: string, type: 'image' | 'video' | 'audio') => {
    console.log('📥 BookMode - handleMediaSelect appelé:', { url: url?.substring(0, 50), type })
    
    // On ne gère pas l'audio pour l'instant
    if (type === 'audio') return
    
    const targetIndex = mediaPickerTargetPage === 'left' ? leftPageIndex : rightPageIndex
    console.log('📥 BookMode - Target page index:', targetIndex, 'pages count:', pages.length)
    if (!pages[targetIndex]) {
      console.error('❌ BookMode - Page cible non trouvée!')
      return
    }
    
    const newPages = [...pages]
    const page = newPages[targetIndex]
    
    // Créer un nouveau média avec ID unique
    const mediaId = `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newMedia: PageMedia = {
      id: mediaId,
      url,
      type: type as MediaType,  // 'image' ou 'video'
      position: DEFAULT_IMAGE_POSITION,
      style: 'normal',
      frame: 'none',
      zIndex: (page.images?.length || 0) + 1,
    }
    
    // Ajouter au tableau de médias
    newPages[targetIndex] = { 
      ...page, 
      images: [...(page.images || []), newMedia],
    }
    setPages(newPages)
    console.log('✅ BookMode - Image ajoutée:', newMedia.id, 'à la page', targetIndex)
    
    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
      console.log('✅ BookMode - Pages mises à jour dans le store')
    }
    
    setShowMediaPicker(false)
    
    // Vérifier la résolution de l'image pour l'impression (uniquement pour les images)
    if (type === 'image' && currentStory?.bookFormat) {
      const format = BOOK_FORMATS.find(f => f.id === currentStory.bookFormat)
      if (format) {
        try {
          // Charger l'image pour obtenir ses dimensions
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.src = url
          
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
          })
          
          // Calculer le DPI pour une impression à la taille par défaut (50% de la page)
          const printWidthMm = format.widthMm * (DEFAULT_IMAGE_POSITION.width / 100)
          const printHeightMm = format.heightMm * (DEFAULT_IMAGE_POSITION.height / 100)
          
          // Convertir mm en pouces (1 pouce = 25.4mm)
          const printWidthInch = printWidthMm / 25.4
          const printHeightInch = printHeightMm / 25.4
          
          // Calculer le DPI (pixels / pouces)
          const dpiWidth = img.naturalWidth / printWidthInch
          const dpiHeight = img.naturalHeight / printHeightInch
          const effectiveDpi = Math.min(dpiWidth, dpiHeight)
          
          console.log(`📐 DPI calculé: ${Math.round(effectiveDpi)} (${img.naturalWidth}x${img.naturalHeight}px pour ${Math.round(printWidthMm)}x${Math.round(printHeightMm)}mm)`)
          
          // Alerter si le DPI est inférieur à 200 (limite acceptable pour impression)
          if (effectiveDpi < 200) {
            setDpiWarning({
              imageId: mediaId,
              dpi: Math.round(effectiveDpi),
              message: effectiveDpi < 150 
                ? `⚠️ Image très basse résolution (${Math.round(effectiveDpi)} DPI). Elle sera floue à l'impression.`
                : `⚠️ Image basse résolution (${Math.round(effectiveDpi)} DPI). Qualité d'impression moyenne.`
            })
            
            // Masquer l'avertissement après 6 secondes
            setTimeout(() => setDpiWarning(null), 6000)
          }
        } catch (err) {
          console.warn('Impossible de vérifier la résolution de l\'image:', err)
        }
      }
    }
  }

  // === Gestion de la création d'image avec même personnage ===
  const handleOpenCharacterCreator = (imageUrl: string, pageIndex: number) => {
    setCharacterCreatorRefImage(imageUrl)
    setCharacterCreatorTargetPage(pageIndex)
    setShowCharacterCreator(true)
  }

  const handleCharacterImageCreated = (imageUrl: string) => {
    console.log('🎨 Nouvelle image avec personnage créée:', imageUrl.substring(0, 50))
    
    const targetIndex = characterCreatorTargetPage
    if (!pages[targetIndex]) {
      console.error('❌ Page cible non trouvée!')
      return
    }
    
    const newPages = [...pages]
    const page = newPages[targetIndex]
    
    // Créer un nouveau média avec ID unique
    const mediaId = `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newMedia: PageMedia = {
      id: mediaId,
      url: imageUrl,
      type: 'image' as MediaType,
      position: {
        ...DEFAULT_IMAGE_POSITION,
        x: 55,  // Légèrement décalé pour ne pas superposer l'original
        y: 25,
      },
      style: 'normal',
      frame: 'none',
      zIndex: (page.images?.length || 0) + 1,
    }
    
    // Ajouter au tableau de médias
    newPages[targetIndex] = { 
      ...page, 
      images: [...(page.images || []), newMedia],
    }
    setPages(newPages)
    console.log('✅ Image ajoutée depuis CharacterCreator:', newMedia.id)
    
    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
    
    setShowCharacterCreator(false)
  }

  // === Gestion du fond de page ===
  const handleOpenBackgroundPicker = (targetIndex: number) => {
    setBackgroundPickerTargetPage(targetIndex)
    setShowBackgroundPicker(true)
  }

  const handleBackgroundSelect = (url: string, type: 'image' | 'video' | 'audio') => {
    // On ne gère pas l'audio pour l'instant
    if (type === 'audio') return
    
    console.log('🎯 handleBackgroundSelect - backgroundPickerTargetPage:', backgroundPickerTargetPage, 'pages.length:', pages.length)
    
    if (!pages[backgroundPickerTargetPage]) return
    
    const newPages = [...pages]
    newPages[backgroundPickerTargetPage] = {
      ...newPages[backgroundPickerTargetPage],
      backgroundMedia: {
        url,
        type: type as MediaType,
        opacity: 0.5, // Opacité par défaut à 50%
      },
    }
    setPages(newPages)
    console.log('✅ Fond appliqué à la page', backgroundPickerTargetPage)
    
    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
    
    setShowBackgroundPicker(false)
  }

  const handleBackgroundOpacityChange = (pageIndex: number, opacity: number) => {
    if (!pages[pageIndex]?.backgroundMedia) return
    
    const newPages = [...pages]
    newPages[pageIndex] = {
      ...newPages[pageIndex],
      backgroundMedia: {
        ...newPages[pageIndex].backgroundMedia!,
        opacity,
      },
    }
    setPages(newPages)
    
    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  const handleBackgroundPositionChange = (pageIndex: number, x: number, y: number, scale: number) => {
    if (!pages[pageIndex]?.backgroundMedia) return
    
    const newPages = [...pages]
    newPages[pageIndex] = {
      ...newPages[pageIndex],
      backgroundMedia: {
        ...newPages[pageIndex].backgroundMedia!,
        x,
        y,
        scale,
      },
    }
    setPages(newPages)
    
    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  const handleBackgroundRemove = (pageIndex: number) => {
    if (!pages[pageIndex]) return
    
    const newPages = [...pages]
    const { backgroundMedia, ...pageWithoutBackground } = newPages[pageIndex]
    newPages[pageIndex] = pageWithoutBackground
    setPages(newPages)
    
    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  // === Gestion des décorations premium ===
  const handleOpenDecorationPicker = (targetIndex: number) => {
    setDecorationPickerTargetPage(targetIndex)
    setShowDecorationPicker(true)
  }

  const handleAddDecoration = (decorationId: string) => {
    const targetPage = pages[decorationPickerTargetPage]
    if (!targetPage) return

    const newDecoration: PageDecoration = {
      id: `deco-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      decorationId,
      position: { x: 50, y: 50 }, // Centre de la page
      scale: 1,
      rotation: 0,
      opacity: 1,
    }

    const newPages = [...pages]
    newPages[decorationPickerTargetPage] = {
      ...targetPage,
      decorations: [...(targetPage.decorations || []), newDecoration],
    }
    setPages(newPages)

    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  const handleDecorationPositionChange = (pageIndex: number, decoId: string, position: { x: number; y: number }) => {
    const targetPage = pages[pageIndex]
    if (!targetPage?.decorations) return

    const newPages = [...pages]
    newPages[pageIndex] = {
      ...targetPage,
      decorations: targetPage.decorations.map(d =>
        d.id === decoId ? { ...d, position } : d
      ),
    }
    setPages(newPages)

    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  const handleDecorationScaleChange = (pageIndex: number, decoId: string, scale: number) => {
    const targetPage = pages[pageIndex]
    if (!targetPage?.decorations) return

    const newPages = [...pages]
    newPages[pageIndex] = {
      ...targetPage,
      decorations: targetPage.decorations.map(d =>
        d.id === decoId ? { ...d, scale } : d
      ),
    }
    setPages(newPages)

    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  const handleDecorationRotationChange = (pageIndex: number, decoId: string, rotation: number) => {
    const targetPage = pages[pageIndex]
    if (!targetPage?.decorations) return

    const newPages = [...pages]
    newPages[pageIndex] = {
      ...targetPage,
      decorations: targetPage.decorations.map(d =>
        d.id === decoId ? { ...d, rotation } : d
      ),
    }
    setPages(newPages)

    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  const handleDecorationColorChange = (pageIndex: number, decoId: string, color: string) => {
    const targetPage = pages[pageIndex]
    if (!targetPage?.decorations) return

    const newPages = [...pages]
    newPages[pageIndex] = {
      ...targetPage,
      decorations: targetPage.decorations.map(d =>
        d.id === decoId ? { ...d, color } : d
      ),
    }
    setPages(newPages)

    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  const handleDecorationGlowChange = (pageIndex: number, decoId: string, glowEnabled: boolean, glowColor: string, glowIntensity: number) => {
    const targetPage = pages[pageIndex]
    if (!targetPage?.decorations) return

    const newPages = [...pages]
    newPages[pageIndex] = {
      ...targetPage,
      decorations: targetPage.decorations.map(d =>
        d.id === decoId ? { ...d, glowEnabled, glowColor, glowIntensity } : d
      ),
    }
    setPages(newPages)

    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  const handleDecorationOpacityChange = (pageIndex: number, decoId: string, opacity: number) => {
    const targetPage = pages[pageIndex]
    if (!targetPage?.decorations) return

    const newPages = [...pages]
    newPages[pageIndex] = {
      ...targetPage,
      decorations: targetPage.decorations.map(d =>
        d.id === decoId ? { ...d, opacity } : d
      ),
    }
    setPages(newPages)

    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  const handleDecorationFlip = (pageIndex: number, decoId: string, direction: 'h' | 'v') => {
    const targetPage = pages[pageIndex]
    if (!targetPage?.decorations) return

    const newPages = [...pages]
    newPages[pageIndex] = {
      ...targetPage,
      decorations: targetPage.decorations.map(d =>
        d.id === decoId 
          ? { ...d, [direction === 'h' ? 'flipH' : 'flipV']: !d[direction === 'h' ? 'flipH' : 'flipV'] } 
          : d
      ),
    }
    setPages(newPages)

    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  const handleDecorationDelete = (pageIndex: number, decoId: string) => {
    const targetPage = pages[pageIndex]
    if (!targetPage?.decorations) return

    const newPages = [...pages]
    newPages[pageIndex] = {
      ...targetPage,
      decorations: targetPage.decorations.filter(d => d.id !== decoId),
    }
    setPages(newPages)
    
    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  // ============ GESTION DES ZONES DE TEXTE ============
  
  const handleTextBoxAdd = (pageIndex: number) => {
    const targetPage = pages[pageIndex]
    if (!targetPage) return

    const newTextBox: PageTextBox = {
      id: `textbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: t('editor.defaultTextBox'),
      position: { x: 20, y: 20, width: 30, height: 15 },
      style: {
        fontFamily: 'Georgia',
        fontSize: 16,
        color: '#3d3426',
        backgroundColor: '#ffffff',
        backgroundOpacity: 0.9,
        textAlign: 'left',
        lineSpacing: 'normal',
      },
      zIndex: (targetPage.textBoxes?.length || 0) + 1,
    }

    const newPages = [...pages]
    newPages[pageIndex] = {
      ...targetPage,
      textBoxes: [...(targetPage.textBoxes || []), newTextBox],
    }
    setPages(newPages)

    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  const handleTextBoxPositionChange = (pageIndex: number, textBoxId: string, position: { x: number; y: number; width: number; height: number }) => {
    const targetPage = pages[pageIndex]
    if (!targetPage?.textBoxes) return

    const newPages = [...pages]
    newPages[pageIndex] = {
      ...targetPage,
      textBoxes: targetPage.textBoxes.map(tb =>
        tb.id === textBoxId ? { ...tb, position } : tb
      ),
    }
    setPages(newPages)

    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  const handleTextBoxContentChange = (pageIndex: number, textBoxId: string, content: string) => {
    const targetPage = pages[pageIndex]
    if (!targetPage?.textBoxes) return

    const newPages = [...pages]
    newPages[pageIndex] = {
      ...targetPage,
      textBoxes: targetPage.textBoxes.map(tb =>
        tb.id === textBoxId ? { ...tb, content } : tb
      ),
    }
    setPages(newPages)

    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  const handleTextBoxStyleChange = (pageIndex: number, textBoxId: string, style: PageTextBox['style']) => {
    const targetPage = pages[pageIndex]
    if (!targetPage?.textBoxes) return

    const newPages = [...pages]
    newPages[pageIndex] = {
      ...targetPage,
      textBoxes: targetPage.textBoxes.map(tb =>
        tb.id === textBoxId ? { ...tb, style } : tb
      ),
    }
    setPages(newPages)

    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  const handleTextBoxDelete = (pageIndex: number, textBoxId: string) => {
    const targetPage = pages[pageIndex]
    if (!targetPage?.textBoxes) return

    const newPages = [...pages]
    newPages[pageIndex] = {
      ...targetPage,
      textBoxes: targetPage.textBoxes.filter(tb => tb.id !== textBoxId),
    }
    setPages(newPages)
    
    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
  }

  const handleSelectStructure = (structure: StoryStructure, bookFormat: BookFormat) => {
    // Créer l'histoire dans le store avec le format du livre
    const newStory = createStory(storyTitle, structure, bookFormat)
    setCurrentStory(newStory)
    
    // Créer les pages locales selon le template
    const template = STORY_TEMPLATES[structure]
    if (structure === 'free') {
      setPages([{ id: '1', title: '', content: '', chapterId: undefined, style: DEFAULT_STYLE }])
    } else {
      const newPages: StoryPageLocal[] = template.steps.map((step, index) => ({
        id: crypto.randomUUID(),
        title: step.title[locale],
        content: '',
        chapterId: undefined,
        style: DEFAULT_STYLE,
      }))
      setPages(newPages)
    }
    setShowStructureSelector(false)
    setCurrentSpread(0)
  }

  // Pages du spread courant
  const leftPage = leftPageIndex !== undefined ? pages[leftPageIndex] : undefined
  const rightPage = rightPageIndex < pages.length ? pages[rightPageIndex] : undefined

  // Vue : pas d'histoire en cours (on vérifie currentStory et non storyTitle pour éviter 
  // de quitter cette vue dès qu'on tape une lettre dans le titre)
  if (!currentStory && !showStructureSelector) {
  return (
    <div className="h-full flex flex-col">
      {/* En-tête */}
      <motion.header 
          className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-4xl text-aurora-300 mb-2 flex items-center gap-3">
          <Feather className="w-8 h-8" />
            {t('workshopTitle')}
        </h1>
          <p className="text-midnight-300">{t('workshopSubtitle')}</p>
      </motion.header>

      {/* Contenu */}
      <div className="flex-1 glass rounded-3xl p-8">
          <motion.div 
            className="h-full flex flex-col items-center justify-center text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-aurora-500/20 to-stardust-500/20 flex items-center justify-center mb-6 floating">
              <BookOpen className="w-12 h-12 text-aurora-400" />
            </div>
            
            {/* Input titre */}
            <div className="w-full max-w-md mb-6">
              <input
                type="text"
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                placeholder={t('titlePlaceholder')}
                className="w-full text-center text-2xl font-display bg-transparent border-b-2 border-midnight-700 focus:border-aurora-500 text-white placeholder-midnight-600 py-2 outline-none transition-colors"
              />
            </div>

            <motion.button
              onClick={() => storyTitle.trim() && setShowStructureSelector(true)}
              disabled={!storyTitle.trim()}
              className={cn(
                'btn-magic flex items-center gap-2 text-lg py-4 px-8',
                !storyTitle.trim() && 'opacity-50 cursor-not-allowed'
              )}
              whileHover={storyTitle.trim() ? { scale: 1.05 } : {}}
              whileTap={storyTitle.trim() ? { scale: 0.95 } : {}}
            >
              <Plus className="w-5 h-5" />
              {t('newStory')}
            </motion.button>

            {/* Histoires précédentes */}
            {stories.length > 0 && (
              <div className="mt-12 w-full max-w-lg">
                <h3 className="text-sm uppercase tracking-wider text-midnight-400 mb-4">
                  {t('myStories')}
                </h3>
                <div className="space-y-2">
                  {stories.slice(0, 5).map((story) => (
                    <motion.div
                      key={story.id}
                      className="w-full p-4 rounded-xl bg-midnight-900/30 hover:bg-midnight-800/30 text-left transition-colors flex items-center gap-3 group"
                      whileHover={{ x: 5 }}
                    >
                      <button
                      onClick={() => {
                        setCurrentStory(story)
                        setStoryTitle(story.title)
                      }}
                        className="flex-1 flex items-center gap-3"
                    >
                      <Book className={cn("w-4 h-4", story.isComplete ? "text-green-400" : "text-aurora-400")} />
                        <span className="flex-1 truncate text-white">{story.title}</span>
                      {story.isComplete && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-500/20 text-green-400 rounded border border-green-500/30">
                          ✓
                        </span>
                      )}
                      <span className="text-xs text-midnight-400">
                        {story.pages.length} {t('pages')}
                      </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(locale === 'fr' 
                            ? `Supprimer "${story.title}" ?` 
                            : locale === 'en' 
                            ? `Delete "${story.title}"?` 
                            : `Удалить "${story.title}"?`)) {
                            deleteStory(story.id)
                          }
                        }}
                        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-midnight-500 hover:text-red-400 transition-all"
                        title={tCommon('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    )
  }

  // Vue : sélection structure
  if (showStructureSelector) {
    return (
      <div className="h-full flex flex-col relative">
        {/* Header épuré */}
        <motion.header 
          className="mb-6 md:mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={() => setShowStructureSelector(false)}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">{t('back')}</span>
          </button>
          
          <h1 className="font-display text-2xl md:text-3xl text-white/90">
            {storyTitle}
          </h1>
        </motion.header>
        
        {/* Contenu principal - glass container */}
        <motion.div 
          className="flex-1 rounded-2xl p-6 md:p-10 overflow-auto"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <StructureSelector onSelect={handleSelectStructure} locale={locale} />
        </motion.div>
      </div>
    )
  }

  // Vue : écriture (version compacte - livre maximisé)
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ZONE PRINCIPALE - Livre + IA + Onglets */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Sous-zone : Livre + IA */}
        <div className="flex-1 flex gap-1 min-h-0 overflow-hidden">
        {/* ZONE CENTRALE - Livre maximisé */}
          <div className="flex-1 min-w-0 overflow-hidden">
          {(leftPage || rightPage) && (
            <WritingArea
              page={rightPage}
              pageIndex={rightPageIndex}
            chapters={chapters}
              onContentChange={handleContentChange}
              onTitleChange={handleTitleChange}
              onStyleChange={handleStyleChange}
            onChapterChange={(chapterId) => {
              if (!rightPage) return
              const newPages = pages.map((p, i) =>
                  i === rightPageIndex ? { ...p, chapterId } : p
              )
              setPages(newPages)
              if (currentStory) {
                updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
              }
            }}
            onCreateChapter={(title) => {
              const colors = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b']
              const newChapter: Chapter = {
                id: Date.now().toString(),
                title,
                type: 'custom',
                color: colors[chapters.length % colors.length],
              }
              setChapters(prev => [...prev, newChapter])
              if (currentStory) {
                addStoryChapter(currentStory.id, {
                  id: newChapter.id,
                  title: newChapter.title,
                  type: newChapter.type,
                  color: newChapter.color,
                })
              }
              if (!rightPage) return
              const newPages = pages.map((p, i) =>
                  i === rightPageIndex ? { ...p, chapterId: newChapter.id } : p
              )
              setPages(newPages)
              if (currentStory) {
                updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
              }
            }}
            onUpdateChapter={(chapterId, updates) => {
              setChapters(prev => prev.map(c => 
                c.id === chapterId ? { ...c, ...updates } : c
              ))
            }}
            onImageAdd={(targetPageIndex) => {
              setMediaPickerTargetPage(targetPageIndex === leftPageIndex ? 'left' : 'right')
              setShowMediaPicker(true)
            }}
              locale={locale}
              // Navigation par spread (2 pages à la fois)
              onPrevPage={() => setCurrentSpread(Math.max(0, currentSpread - 1))}
            onNextPage={() => {
                if (currentSpread >= totalSpreads - 1) {
                  // Ajouter 2 pages pour le prochain spread
                  handleAddPage()
                  handleAddPage()
                } else {
                  setCurrentSpread(currentSpread + 1)
                }
              }}
              hasPrevPage={currentSpread > 0}
            hasNextPage={true}
            totalPages={pages.length}
              // Page gauche du spread
              leftPage={leftPage}
              leftPageIndex={leftPageIndex}
              onLeftContentChange={(content) => {
                if (leftPage) {
                  const newPages = pages.map((p, i) =>
                    i === leftPageIndex ? { ...p, content } : p
                  )
                  setPages(newPages)
                  if (currentStory) {
                    updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
                  }
                }
              }}
              // Header intégré
              storyTitle={storyTitle}
              onStoryTitleChange={setStoryTitle}
              onBack={() => {
                setStoryTitle('')
                setPages([{ id: '1', title: '', content: '', chapterId: undefined }])
                setCurrentSpread(0)
                setCurrentStory(null)
              }}
              onShowStructure={() => setShowStructureView(true)}
              onShowOverview={() => setShowOverview(true)}
              bookFormat={currentStory?.bookFormat || 'portrait-a5'}
              onBookFormatChange={(format) => {
                if (currentStory) {
                  updateStoryFormat(currentStory.id, format)
                }
              }}
              showSafeZones={showSafeZones}
              onToggleSafeZones={() => setShowSafeZones(!showSafeZones)}
              onZoomChange={setCurrentZoomedPage}
              externalZoomedPage={currentZoomedPage}
              showLines={showLines}
              onToggleLines={() => setShowLines(!showLines)}
              onImagePositionChange={handleImagePositionChange}
              onImageStyleChange={handleImageStyleChange}
              onImageFrameChange={handleImageFrameChange}
              onImageOpacityChange={handleImageOpacityChange}
              onImageDelete={handleImageDelete}
              onImageBringForward={handleImageBringForward}
              onImageSendBackward={handleImageSendBackward}
              onImageCreateNew={handleOpenCharacterCreator}
              onVideoPosterChange={handleVideoPosterChange}
              onConvertVideoToImage={handleConvertVideoToImage}
              bookColor={bookColor}
              onBookColorChange={setBookColor}
              onBackgroundAdd={handleOpenBackgroundPicker}
              onBackgroundOpacityChange={handleBackgroundOpacityChange}
              onBackgroundPositionChange={handleBackgroundPositionChange}
              onBackgroundRemove={handleBackgroundRemove}
              onDecorationAdd={handleOpenDecorationPicker}
              onDecorationPositionChange={handleDecorationPositionChange}
              onDecorationScaleChange={handleDecorationScaleChange}
              onDecorationRotationChange={handleDecorationRotationChange}
              onDecorationColorChange={handleDecorationColorChange}
              onDecorationOpacityChange={handleDecorationOpacityChange}
              onDecorationGlowChange={handleDecorationGlowChange}
              onDecorationFlip={handleDecorationFlip}
              onDecorationDelete={handleDecorationDelete}
              onTextBoxAdd={handleTextBoxAdd}
              onTextBoxPositionChange={handleTextBoxPositionChange}
              onTextBoxContentChange={handleTextBoxContentChange}
              onTextBoxStyleChange={handleTextBoxStyleChange}
              onTextBoxDelete={handleTextBoxDelete}
              isLocked={currentStory?.isComplete}
              onUnlock={() => currentStory && reopenStory(currentStory.id)}
              // Export PDF
              onExportPdf={handleExportPdf}
              isExportingPdf={isExportingPdf}
              exportStatus={exportStatus}
            />
        )}
        </div>

          {/* Panneau IA */}
          <AnimatePresence mode="wait">
            <AISidePanel
              isOpen={showAIPanel}
              onToggle={() => setShowAIPanel(!showAIPanel)}
              pageContent={rightPage?.content || ''}
              pageTitle={rightPage?.title || ''}
              pageNumber={rightPageIndex + 1}
              totalPages={pages.length}
              locale={locale}
              allPages={pages}
              chapters={chapters}
              currentChapterId={rightPage?.chapterId}
              storyTitle={storyTitle}
            />
          </AnimatePresence>
          
          {/* MediaPicker pour ajouter des images/vidéos */}
          <MediaPicker
            isOpen={showMediaPicker}
            onClose={() => setShowMediaPicker(false)}
            onSelect={handleMediaSelect}
            allowedTypes="all"
            storyId={currentStory?.id}
          />
          
          {/* MediaPicker pour les fonds de page */}
          <MediaPicker
            isOpen={showBackgroundPicker}
            onClose={() => setShowBackgroundPicker(false)}
            onSelect={handleBackgroundSelect}
            allowedTypes="all"
            title={t('addMedia')}
            storyId={currentStory?.id}
          />
          
          {/* CharacterImageCreator pour créer une nouvelle image avec même personnage */}
          <CharacterImageCreator
            isOpen={showCharacterCreator}
            onClose={() => setShowCharacterCreator(false)}
            referenceImageUrl={characterCreatorRefImage}
            onImageCreated={handleCharacterImageCreated}
          />
          
          {/* DecorationPicker pour les décorations premium */}
          <DecorationPicker
            isOpen={showDecorationPicker}
            onClose={() => setShowDecorationPicker(false)}
            onSelect={handleAddDecoration}
          />
          
          {/* Alerte DPI pour images basse résolution */}
          <AnimatePresence>
            {dpiWarning && (
              <motion.div
                initial={{ opacity: 0, y: 50, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: 50, x: '-50%' }}
                className="fixed bottom-24 left-1/2 z-50 px-4 py-3 rounded-xl shadow-2xl border max-w-md"
                style={{
                  background: dpiWarning.dpi < 150 
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(185, 28, 28, 0.95))'
                    : 'linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95))',
                  borderColor: dpiWarning.dpi < 150 ? 'rgba(248, 113, 113, 0.5)' : 'rgba(251, 191, 36, 0.5)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    dpiWarning.dpi < 150 ? "bg-red-400/20" : "bg-amber-400/20"
                  )}>
                    <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{dpiWarning.message}</p>
                    <p className="text-white/70 text-xs mt-1">
                      Recommandé : 300 DPI minimum pour une impression de qualité.
                    </p>
                  </div>
                  <button
                    onClick={() => setDpiWarning(null)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-white/70" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Modal de confirmation pour supprimer une page */}
          <AnimatePresence>
            {pageToDelete !== null && (
              <motion.div
                className="fixed inset-0 z-[100] flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Backdrop */}
                <motion.div
                  className="absolute inset-0 bg-midnight-950/80 backdrop-blur-sm"
                  onClick={() => setPageToDelete(null)}
                />
                
                {/* Modal */}
                <motion.div
                  className="relative bg-gradient-to-b from-midnight-900 to-midnight-950 rounded-2xl border border-red-500/20 shadow-2xl p-6 max-w-sm mx-4"
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{t('deletePageTitle')}</h3>
                  </div>

                  <p className="text-midnight-300 mb-6">
                    {t('deletePageConfirm', { page: pageToDelete + 1 })}
                    {pages[pageToDelete]?.content && (
                      <span className="block mt-1 text-amber-400 text-sm">
                        ⚠️ {t('deletePageWarning')}
                      </span>
                    )}
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setPageToDelete(null)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-midnight-800 text-midnight-300 hover:text-white hover:bg-midnight-700 transition-colors font-medium"
                    >
                      {t('deletePageKeep')}
                    </button>
                    <button
                      onClick={() => {
                        handleDeletePage(pageToDelete)
                        setPageToDelete(null)
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors font-medium border border-red-500/30"
                    >
                      {t('deletePageDelete')}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* BARRE SOUS LE LIVRE - Onglets de pages centrés par rapport au livre */}
        <div className={cn(
          "flex items-center justify-center gap-4 py-3 flex-shrink-0 transition-all",
          showAIPanel ? "pr-[320px]" : "pr-12" // Compenser la largeur du panneau IA
        )}>
          {/* Nom du chapitre actif (à gauche des onglets) */}
          {(() => {
            // Déterminer la page active
            const activePageIndex = currentZoomedPage === 'left' ? leftPageIndex 
              : currentZoomedPage === 'right' ? rightPageIndex 
              : rightPageIndex // En double page, on prend la droite par défaut
            const activePage = pages[activePageIndex]
            const activeChapter = activePage ? chapters.find(c => c.id === activePage.chapterId) : null
            
            return (
              <div className="flex items-center gap-2 min-w-[120px]">
                {isEditingChapterName ? (
                  <input
                    type="text"
                    value={editingChapterName}
                    onChange={(e) => setEditingChapterName(e.target.value)}
                    onBlur={() => {
                      // Sauvegarder le nom du chapitre
                      if (activeChapter && editingChapterName.trim()) {
                        setChapters(prev => prev.map(c => 
                          c.id === activeChapter.id ? { ...c, title: editingChapterName.trim() } : c
                        ))
                      } else if (!activeChapter && editingChapterName.trim() && activePage) {
                        // Créer un nouveau chapitre si la page n'en a pas
                        const colors = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b']
                        const newChapter: Chapter = {
                          id: Date.now().toString(),
                          title: editingChapterName.trim(),
                          type: 'custom',
                          color: colors[chapters.length % colors.length],
                        }
                        setChapters(prev => [...prev, newChapter])
                        // Assigner le chapitre à la page active
                        setPages(prev => prev.map((p, i) => 
                          i === activePageIndex ? { ...p, chapterId: newChapter.id } : p
                        ))
                      }
                      setIsEditingChapterName(false)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur()
                      } else if (e.key === 'Escape') {
                        setIsEditingChapterName(false)
                      }
                    }}
                    autoFocus
                    className="bg-midnight-800/50 text-white text-sm px-2 py-1 rounded-lg border border-aurora-500/30 outline-none w-32"
                    placeholder={t('chapterNamePlaceholder')}
                  />
                ) : (
          <button
                    onClick={() => {
                      setEditingChapterName(activeChapter?.title || '')
                      setIsEditingChapterName(true)
                    }}
                    className="flex items-center gap-2 text-sm text-midnight-300 hover:text-white transition-colors group"
                  >
                    <BookOpen className="w-4 h-4 text-aurora-400" />
                    <span className={activeChapter ? 'text-white' : 'text-midnight-500 italic'}>
                      {activeChapter?.title || 'Sans titre'}
                    </span>
                    <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-midnight-400" />
          </button>
                )}
              </div>
            )
          })()}
          
          {/* Onglets de pages (groupés par spread) */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {pages.map((page, index) => {
              const chapter = chapters.find(c => c.id === page.chapterId)
              const spreadOfPage = Math.floor(index / 2)
              const isLeftOfSpread = index % 2 === 0
              
              // En mode zoom, seule la page zoomée est active
              // En mode double page, les deux pages du spread sont actives
              const isActive = currentZoomedPage !== null
                ? (currentZoomedPage === 'left' && index === leftPageIndex) || (currentZoomedPage === 'right' && index === rightPageIndex)
                : (index === leftPageIndex || index === rightPageIndex)
              
              return (
                <div key={page.id} className="relative group">
                  <button
                    onClick={() => {
                      setCurrentSpread(spreadOfPage)
                      // En mode zoom, mettre à jour la page zoomée selon l'onglet cliqué
                      if (currentZoomedPage !== null) {
                        setCurrentZoomedPage(isLeftOfSpread ? 'left' : 'right')
                      }
                    }}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 text-sm transition-all',
                      // Arrondi selon position dans le spread (complet si zoom)
                      currentZoomedPage !== null 
                        ? 'rounded-xl'
                        : (isLeftOfSpread ? 'rounded-l-xl' : 'rounded-r-xl'),
                      // Highlight si page active
                      isActive
                        ? 'bg-aurora-500/20 text-white border border-aurora-500/30'
                        : 'text-midnight-400 hover:bg-midnight-800/50 hover:text-white',
                      // Padding supplémentaire si bouton X visible
                      isActive && pages.length > 1 && 'pr-7'
                    )}
                  >
                    <span className="font-semibold">{index + 1}</span>
                    {/* Point de couleur du chapitre */}
                    {chapter && (
                      <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: chapter.color }}
                        title={chapter.title}
                      />
                    )}
                    {/* Point rose si contenu (et pas de chapitre) */}
                    {!chapter && page.content && (
                      <div className="w-2 h-2 rounded-full bg-aurora-400" />
                    )}
                  </button>
                  {/* Bouton supprimer (visible seulement sur page active, pas sur couvertures, minimum 4 pages) */}
                  {isActive && pages.length > 4 && page.pageType !== 'front-cover' && page.pageType !== 'back-cover' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setPageToDelete(index)
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full text-midnight-400 hover:text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                      title={t('deletePage')}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
            <button
              onClick={() => {
                handleAddPage()
                handleAddPage()
              }}
              className="p-2 rounded-xl text-midnight-500 hover:text-aurora-400 hover:bg-midnight-800/30 transition-all"
              title={t('editor.add2Pages')}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {/* Compteur de spreads */}
          <span className="text-sm text-midnight-400 font-medium">
            {currentSpread + 1} / {totalSpreads}
          </span>
          
          {/* Bouton Terminer */}
          {currentStory && !currentStory.isComplete && pages.some(p => p.content?.trim()) && (
            <motion.button
              onClick={() => setShowCompletionModal(true)}
              className="ml-4 px-4 py-2 rounded-xl bg-gradient-to-r from-aurora-500 to-dream-500 text-white text-sm font-medium hover:from-aurora-600 hover:to-dream-600 transition-all flex items-center gap-2 shadow-lg shadow-aurora-500/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">{t('finishStory')}</span>
              <span className="sm:hidden">{t('finish')}</span>
            </motion.button>
          )}
          
          {/* Badge histoire terminée + bouton reprendre */}
          {currentStory?.isComplete && (
            <div className="ml-4 flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium flex items-center gap-1.5 border border-green-500/30">
                <Check className="w-3 h-3" />
                {t('completed')}
              </div>
              <motion.button
                onClick={() => {
                  if (confirm(locale === 'fr' 
                    ? 'Voulez-vous reprendre l\'édition de cette histoire ?' 
                    : locale === 'en'
                    ? 'Do you want to resume editing this story?'
                    : 'Хотите возобновить редактирование этой истории?')) {
                    reopenStory(currentStory.id)
                  }
                }}
                className="px-3 py-1.5 rounded-full bg-aurora-500/20 text-aurora-400 text-xs font-medium flex items-center gap-1.5 border border-aurora-500/30 hover:bg-aurora-500/30 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Edit3 className="w-3 h-3" />
                {t('resumeEditing')}
              </motion.button>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de célébration */}
      <AnimatePresence>
        {showCompletionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCompletionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20 }}
              className="glass-card p-8 max-w-lg w-full text-center relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Confettis animés */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: ['#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24'][i % 5],
                      left: `${Math.random() * 100}%`,
                      top: -20,
                    }}
                    animate={{
                      y: [0, 500],
                      x: [0, (Math.random() - 0.5) * 100],
                      rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                      opacity: [1, 0],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      delay: Math.random() * 0.5,
                      repeat: Infinity,
                      repeatDelay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>
              
              {/* Contenu */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <PartyPopper className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
              </motion.div>
              
              <h2 className="text-3xl font-display text-white mb-2">
                🎉 {t('completionBravo')}
              </h2>
              <p className="text-xl text-aurora-300 mb-6">
                {t('completionDone')}
              </p>

              <p className="text-midnight-300 mb-8">
                {t('completionMessage', { title: currentStory?.title || '' })}
              </p>
              
              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <motion.button
                  onClick={() => {
                    if (currentStory) completeStory(currentStory.id)
                    setShowCompletionModal(false)
                    setCurrentMode('studio')
                  }}
                  className="p-4 rounded-xl bg-aurora-500/20 border border-aurora-500/30 hover:bg-aurora-500/30 transition-all group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Palette className="w-8 h-8 text-aurora-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-white font-medium">{t('createImages')}</div>
                  <div className="text-midnight-400 text-sm">{t('illustrateStory')}</div>
                </motion.button>
                
                <motion.button
                  onClick={() => {
                    if (currentStory) completeStory(currentStory.id)
                    setShowCompletionModal(false)
                    setCurrentMode('layout')
                  }}
                  className="p-4 rounded-xl bg-dream-500/20 border border-dream-500/30 hover:bg-dream-500/30 transition-all group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Clapperboard className="w-8 h-8 text-dream-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-white font-medium">{t('createVideo')}</div>
                  <div className="text-midnight-400 text-sm">{t('animateStory')}</div>
                </motion.button>
              </div>
              
              {/* Continuer l'écriture */}
              <button
                onClick={() => {
                  if (currentStory) completeStory(currentStory.id)
                  setShowCompletionModal(false)
                }}
                className="text-midnight-400 hover:text-white transition-colors text-sm"
              >
                {t('keepWriting')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Vue d'ensemble */}
      <AnimatePresence>
        {showOverview && (
          <Overview
            pages={pages}
            currentPage={rightPageIndex}
            onPageSelect={(index) => setCurrentSpread(Math.floor(index / 2))}
            onClose={() => setShowOverview(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Vue structure */}
      <AnimatePresence>
        {showStructureView && (
          <StructureView
            pages={pages}
            chapters={chapters}
            currentPage={rightPageIndex}
            storyStructure={currentStory?.structure}
            onPageSelect={(index) => setCurrentSpread(Math.floor(index / 2))}
            onAddChapter={(chapter) => {
              setChapters(prev => [...prev, chapter])
              // Sauvegarder dans le store
              if (currentStory) {
                addStoryChapter(currentStory.id, {
                  id: chapter.id,
                  title: chapter.title,
                  type: chapter.type,
                  color: chapter.color,
                })
              }
            }}
            onDeleteChapter={(chapterId) => {
              setChapters(prev => prev.filter(c => c.id !== chapterId))
              // Retirer l'assignation des pages de ce chapitre
              const newPages = pages.map(p => 
                p.chapterId === chapterId ? { ...p, chapterId: undefined } : p
              )
              setPages(newPages)
              // Sauvegarder dans le store
              if (currentStory) {
                deleteStoryChapter(currentStory.id, chapterId)
              }
            }}
            onAssignPageToChapter={(pageIndex, chapterId) => {
              const newPages = pages.map((p, i) =>
                i === pageIndex ? { ...p, chapterId } : p
              )
              setPages(newPages)
              // Sauvegarder dans le store
              if (currentStory) {
                updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
              }
            }}
            onClose={() => setShowStructureView(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Éditeur de couverture */}
      <AnimatePresence>
        {/* Éditeur de couverture supprimé - Page 1 = couverture, dernière page = 4ème */}
      </AnimatePresence>
      
      {/* Modale d'introduction - première visite */}
      <ModeIntroModal
        mode="writing"
        isOpen={isFirstVisit}
        onClose={markAsSeen}
      />
    </div>
  )
}
