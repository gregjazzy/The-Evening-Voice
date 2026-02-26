'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Wand2, 
  AlertCircle,
  CheckCircle,
  Check,
  Lightbulb,
  CloudSun,
  Moon,
  Zap,
  CloudRain,
  Stars,
  Eye,
  Sun,
  Flame,
  CircleDot,
  Copy,
  ExternalLink,
  Rocket,
  Loader2,
  Download,
  RefreshCw,
  FileText,
} from 'lucide-react'
import { useStudioStore, type StyleType, type AmbianceType, type LightType, type FormatType } from '@/store/useStudioStore'
import { useStudioProgressStore } from '@/store/useStudioProgressStore'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { useToast } from '@/components/ui/Toast'
import { useTranslations, useLocale } from '@/lib/i18n/context'
import { cn, getThumbnailUrl } from '@/lib/utils'
import { Highlightable } from '@/components/ui/Highlightable'

// Options de style avec icônes et couleurs
const styleOptions: { id: StyleType; labelKey: string; emoji: string; color: string }[] = [
  { id: 'dessin', labelKey: 'styles.drawing', emoji: '✏️', color: 'from-amber-500 to-orange-600' },
  { id: 'photo', labelKey: 'styles.photo', emoji: '📷', color: 'from-slate-500 to-slate-700' },
  { id: 'magique', labelKey: 'styles.magic', emoji: '✨', color: 'from-aurora-500 to-aurora-700' },
  { id: 'anime', labelKey: 'styles.anime', emoji: '🌸', color: 'from-pink-500 to-rose-600' },
  { id: 'aquarelle', labelKey: 'styles.watercolor', emoji: '🎨', color: 'from-cyan-500 to-blue-600' },
  { id: 'pixel', labelKey: 'styles.pixelart', emoji: '👾', color: 'from-green-500 to-emerald-600' },
]

// Options d'ambiance
const ambianceOptions: { id: AmbianceType; labelKey: string; icon: React.ReactNode; color: string }[] = [
  { id: 'jour', labelKey: 'ambiances.day', icon: <CloudSun className="w-5 h-5" />, color: 'from-sky-400 to-blue-500' },
  { id: 'nuit', labelKey: 'ambiances.night', icon: <Moon className="w-5 h-5" />, color: 'from-indigo-600 to-purple-800' },
  { id: 'orage', labelKey: 'ambiances.storm', icon: <Zap className="w-5 h-5" />, color: 'from-gray-600 to-slate-800' },
  { id: 'brume', labelKey: 'ambiances.mist', icon: <CloudRain className="w-5 h-5" />, color: 'from-gray-400 to-slate-500' },
  { id: 'feerique', labelKey: 'ambiances.fairy', icon: <Stars className="w-5 h-5" />, color: 'from-fuchsia-500 to-purple-600' },
  { id: 'mystere', labelKey: 'ambiances.mystery', icon: <Eye className="w-5 h-5" />, color: 'from-violet-700 to-purple-900' },
]

// Options de lumière
const lightOptions: { id: LightType; labelKey: string; icon: React.ReactNode; color: string }[] = [
  { id: 'soleil', labelKey: 'lights.sun', icon: <Sun className="w-5 h-5" />, color: 'from-yellow-400 to-orange-500' },
  { id: 'lune', labelKey: 'lights.moon', icon: <Moon className="w-5 h-5" />, color: 'from-slate-300 to-slate-500' },
  { id: 'bougie', labelKey: 'lights.candle', icon: <Flame className="w-5 h-5" />, color: 'from-orange-500 to-red-600' },
  { id: 'neon', labelKey: 'lights.neon', icon: <Zap className="w-5 h-5" />, color: 'from-pink-500 to-cyan-500' },
  { id: 'aurore', labelKey: 'lights.aurora', icon: <Stars className="w-5 h-5" />, color: 'from-green-400 to-purple-500' },
]

// Options de format d'image
const formatOptions: { id: FormatType; emoji: string; color: string }[] = [
  { id: 'portrait', emoji: '📐', color: 'from-amber-500 to-orange-600' },
  { id: 'paysage', emoji: '🖼️', color: 'from-blue-500 to-cyan-600' },
  { id: 'carre', emoji: '⬜', color: 'from-pink-500 to-rose-600' },
]

// ============================================================================
// DÉTECTION PAR MOTS-CLÉS (pour niveaux 3+)
// ============================================================================

const STYLE_KEYWORDS = [
  // Dessin
  'dessin', 'dessine', 'dessiné', 'croquis', 'sketch', 'crayon', 'trait',
  // Photo
  'photo', 'photographique', 'réaliste', 'réel', 'vrai',
  // Magique
  'magique', 'magie', 'enchante', 'féerique', 'fantastique', 'fantasy',
  // Anime
  'anime', 'manga', 'japonais', 'kawaii', 'chibi',
  // Aquarelle
  'aquarelle', 'peinture', 'peint', 'watercolor', 'pastel',
  // Pixel
  'pixel', 'pixelisé', 'retro', 'rétro', '8-bit', '8bit', 'jeu vidéo',
  // Autres styles
  'cartoon', 'illustration', 'artistique', '3d', 'cinema', 'cinématique',
]

const AMBIANCE_KEYWORDS = [
  // Jour
  'jour', 'journée', 'matin', 'midi', 'après-midi', 'ensoleillé', 'clair',
  // Nuit
  'nuit', 'nocturne', 'soir', 'minuit', 'étoiles', 'lune', 'sombre', 'noir',
  // Orage
  'orage', 'tempête', 'éclair', 'tonnerre', 'pluie', 'storm',
  // Brume
  'brume', 'brouillard', 'brumeux', 'fog', 'nuageux', 'nuages',
  // Féérique
  'féérique', 'féerique', 'enchanté', 'brillant', 'scintillant', 'sparkle', 'magique',
  // Mystère
  'mystère', 'mystérieux', 'sombre', 'inquiétant', 'effrayant', 'dark',
  // Ambiances générales
  'automne', 'hiver', 'été', 'printemps', 'coucher de soleil', 'lever de soleil', 'crépuscule', 'aube',
]

const DETAIL_KEYWORDS = [
  // Couleurs
  'rouge', 'bleu', 'vert', 'jaune', 'orange', 'violet', 'rose', 'noir', 'blanc', 'gris',
  'doré', 'argenté', 'or', 'argent', 'bronze', 'cuivre',
  'arc-en-ciel', 'multicolore', 'coloré',
  // Tailles
  'grand', 'petit', 'géant', 'minuscule', 'énorme', 'immense', 'tiny',
  // Textures/Formes
  'brillant', 'lumineux', 'transparent', 'flou', 'net', 'détaillé',
  'rond', 'carré', 'pointu', 'doux', 'rugueux',
  // Éléments visuels
  'ailes', 'couronne', 'cape', 'épée', 'baguette', 'fleurs', 'cristal',
  'flammes', 'eau', 'feu', 'glace', 'neige', 'vent',
]

// Mots-clés spécifiques aux VIDÉOS
const VIDEO_MOVEMENT_KEYWORDS = [
  // Actions
  'bouge', 'anime', 'animé', 'animation', 'danse', 'court', 'courir', 'vole', 'voler',
  'tombe', 'tomber', 'saute', 'sauter', 'marche', 'nage', 'tourne', 'tourner',
  'grandit', 'rétrécit', 'apparaît', 'disparaît', 'se transforme',
  // Mouvements de caméra
  'zoom', 'travelling', 'panoramique', 'plan', 'gros plan',
]

const VIDEO_RHYTHM_KEYWORDS = [
  // Rythme
  'lent', 'lentement', 'doucement', 'rapide', 'rapidement', 'vite',
  'dynamique', 'calme', 'paisible', 'énergique', 'fluide',
  // Effets
  'fondu', 'transition', 'ralenti', 'accéléré', 'boucle', 'loop',
]

// Mots-clés pour le FORMAT d'image
const FORMAT_KEYWORDS = [
  // Portrait (livre)
  'portrait', 'vertical', 'page', 'livre', 'book', 'a5', 'a4',
  // Paysage (vidéo)
  'paysage', 'horizontal', 'landscape', 'cinéma', 'cinema', '16:9', 'vidéo', 'video', 'écran', 'wide',
  // Carré
  'carré', 'square', 'instagram', '1:1',
]

/**
 * Analyse le texte pour détecter style, ambiance, détails et format
 * @param text - Le texte à analyser
 * @param creationType - 'image' ou 'video' pour adapter les mots-clés
 */
function detectElementsInText(text: string, creationType: 'image' | 'video' = 'image'): {
  hasStyle: boolean
  hasAmbiance: boolean
  hasDetails: boolean
  hasFormat: boolean
  hasMovement: boolean // Spécifique vidéo
  hasRhythm: boolean // Spécifique vidéo
  detectedStyle: string[]
  detectedAmbiance: string[]
  detectedDetails: string[]
  detectedFormat: string[]
  detectedMovement: string[]
  detectedRhythm: string[]
} {
  const lowerText = text.toLowerCase()
  
  const detectedStyle = STYLE_KEYWORDS.filter(kw => lowerText.includes(kw))
  const detectedAmbiance = AMBIANCE_KEYWORDS.filter(kw => lowerText.includes(kw))
  const detectedDetails = DETAIL_KEYWORDS.filter(kw => lowerText.includes(kw))
  const detectedFormat = FORMAT_KEYWORDS.filter(kw => lowerText.includes(kw))
  
  // Détection spécifique aux vidéos
  const detectedMovement = creationType === 'video' 
    ? VIDEO_MOVEMENT_KEYWORDS.filter(kw => lowerText.includes(kw))
    : []
  const detectedRhythm = creationType === 'video'
    ? VIDEO_RHYTHM_KEYWORDS.filter(kw => lowerText.includes(kw))
    : []
  
  return {
    hasStyle: detectedStyle.length > 0,
    hasAmbiance: detectedAmbiance.length > 0,
    hasDetails: detectedDetails.length > 0,
    hasFormat: detectedFormat.length > 0,
    hasMovement: detectedMovement.length > 0,
    hasRhythm: detectedRhythm.length > 0,
    detectedStyle,
    detectedAmbiance,
    detectedDetails,
    detectedFormat,
    detectedMovement,
    detectedRhythm,
  }
}

interface PromptBuilderProps {
  onComplete?: () => void
}

export function PromptBuilder({ onComplete }: PromptBuilderProps) {
  const t = useTranslations('studio')
  const tPublish = useTranslations('publish')
  const { currentStory } = useAppStore()
  const { profile } = useAuthStore()
  const creditBalance = (profile as any)?.credit_balance ?? 0
  
  const {
    currentKit,
    updateKit,
    checkKitCompleteness,
    importedAssets,
  } = useStudioStore()
  

  const {
    currentCreationType,
  } = useStudioProgressStore()

  // All UI elements always visible — no progressive revelation
  // Vibe coding: all scaffolding hidden — free prompt → generate directly
  const showStyleButtons = false
  const showAmbianceButtons = false
  const showLightOptions = false
  const showDetailsSection = false
  const showFormatButtons = false

  const { addImportedAsset, updateAsset } = useStudioStore()
  const { user } = useAuthStore()
  const { uploadFromUrl, isUploading: isUploadingToCloud } = useMediaUpload()
  const toast = useToast()


  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hasReadPrompt, setHasReadPrompt] = useState(false) // L'enfant doit valider qu'il a lu le prompt
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null) // Tooltip actif
  
  // 📚 Dictionnaire EXHAUSTIF des termes techniques avec explications pour enfants
  const technicalTerms: Record<string, { emoji: string; fr: string; explanation: string }> = {
    
    // ═══════════════════════════════════════════════════════════════════
    // 🎬 MOUVEMENTS VIDÉO
    // ═══════════════════════════════════════════════════════════════════
    'slow gentle movement': { emoji: '🐢', fr: 'mouvement lent et doux', explanation: 'L\'image va bouger tout doucement, comme au ralenti' },
    'fast dynamic movement': { emoji: '⚡', fr: 'mouvement rapide', explanation: 'L\'image va bouger vite avec beaucoup d\'énergie !' },
    'soft smooth movement': { emoji: '🌸', fr: 'mouvement fluide', explanation: 'L\'image va bouger de façon douce et élégante' },
    'energetic movement': { emoji: '🎯', fr: 'mouvement énergique', explanation: 'Plein de vie et d\'énergie dans les mouvements !' },
    'subtle breathing motion': { emoji: '🖼️', fr: 'mouvement subtil', explanation: 'Presque immobile, juste un petit mouvement comme une respiration' },
    'flowing movement': { emoji: '🌊', fr: 'mouvement fluide', explanation: 'Qui coule comme de l\'eau, très doux' },
    'dynamic motion': { emoji: '💨', fr: 'mouvement dynamique', explanation: 'Beaucoup d\'action et de mouvement !' },
    'gentle motion': { emoji: '🍃', fr: 'mouvement doux', explanation: 'Un mouvement calme et paisible' },
    'rapid movement': { emoji: '🏃', fr: 'mouvement rapide', explanation: 'Ça bouge très vite !' },
    'slow motion': { emoji: '🐌', fr: 'ralenti', explanation: 'Comme quand on filme au ralenti, tout est plus lent' },
    'time lapse': { emoji: '⏰', fr: 'accéléré', explanation: 'Le temps passe très vite, comme voir une fleur pousser en quelques secondes' },
    'loop': { emoji: '🔄', fr: 'boucle', explanation: 'L\'animation se répète sans fin' },
    'seamless loop': { emoji: '♾️', fr: 'boucle parfaite', explanation: 'L\'animation se répète sans qu\'on voie le début ou la fin' },
    
    // ═══════════════════════════════════════════════════════════════════
    // 📹 MOUVEMENTS DE CAMÉRA
    // ═══════════════════════════════════════════════════════════════════
    'static camera': { emoji: '📹', fr: 'caméra fixe', explanation: 'La caméra ne bouge pas du tout, elle reste en place' },
    'slow zoom in': { emoji: '🔍', fr: 'zoom avant', explanation: 'La caméra se rapproche doucement de l\'image' },
    'slow zoom out': { emoji: '🔭', fr: 'zoom arrière', explanation: 'La caméra s\'éloigne doucement de l\'image' },
    'zoom in': { emoji: '🔍', fr: 'zoom avant', explanation: 'La caméra se rapproche' },
    'zoom out': { emoji: '🔭', fr: 'zoom arrière', explanation: 'La caméra s\'éloigne' },
    'pan left': { emoji: '👈', fr: 'panoramique gauche', explanation: 'La caméra glisse vers la gauche' },
    'pan right': { emoji: '👉', fr: 'panoramique droite', explanation: 'La caméra glisse vers la droite' },
    'pan up': { emoji: '👆', fr: 'panoramique haut', explanation: 'La caméra monte vers le haut' },
    'pan down': { emoji: '👇', fr: 'panoramique bas', explanation: 'La caméra descend vers le bas' },
    'tracking shot': { emoji: '🎥', fr: 'plan de suivi', explanation: 'La caméra suit l\'action, comme quand on filme quelqu\'un qui marche' },
    'dolly shot': { emoji: '🛤️', fr: 'travelling', explanation: 'La caméra avance ou recule sur des rails' },
    'crane shot': { emoji: '🏗️', fr: 'plan grue', explanation: 'La caméra monte ou descend comme sur une grue' },
    'handheld': { emoji: '🤳', fr: 'caméra à la main', explanation: 'Comme si quelqu\'un tenait la caméra, ça bouge un peu' },
    'steady cam': { emoji: '🎬', fr: 'steadicam', explanation: 'La caméra bouge mais reste très stable' },
    'orbiting': { emoji: '🌍', fr: 'orbite', explanation: 'La caméra tourne autour du sujet' },
    'rotating': { emoji: '🔄', fr: 'rotation', explanation: 'La caméra tourne sur elle-même' },
    'tilt up': { emoji: '⬆️', fr: 'inclinaison haute', explanation: 'La caméra pivote vers le haut' },
    'tilt down': { emoji: '⬇️', fr: 'inclinaison basse', explanation: 'La caméra pivote vers le bas' },
    'dutch angle': { emoji: '📐', fr: 'angle hollandais', explanation: 'La caméra est penchée pour créer une ambiance bizarre' },
    'push in': { emoji: '➡️', fr: 'avancée', explanation: 'La caméra s\'approche du sujet' },
    'pull out': { emoji: '⬅️', fr: 'recul', explanation: 'La caméra s\'éloigne du sujet' },
    
    // ═══════════════════════════════════════════════════════════════════
    // 🎯 TYPES DE PLANS
    // ═══════════════════════════════════════════════════════════════════
    'close-up': { emoji: '👁️', fr: 'gros plan', explanation: 'On voit le visage ou un objet de très près' },
    'close up': { emoji: '👁️', fr: 'gros plan', explanation: 'On voit le visage ou un objet de très près' },
    'extreme close-up': { emoji: '🔬', fr: 'très gros plan', explanation: 'On voit juste un œil ou un tout petit détail' },
    'medium shot': { emoji: '🧍', fr: 'plan moyen', explanation: 'On voit la personne de la taille à la tête' },
    'wide shot': { emoji: '🏞️', fr: 'plan large', explanation: 'On voit beaucoup de choses autour du sujet' },
    'long shot': { emoji: '🌄', fr: 'plan d\'ensemble', explanation: 'On voit tout le paysage avec le sujet petit dedans' },
    'establishing shot': { emoji: '🏙️', fr: 'plan de situation', explanation: 'Un plan qui montre où on est, comme une ville vue de loin' },
    'over the shoulder': { emoji: '👤', fr: 'par-dessus l\'épaule', explanation: 'On voit par-dessus l\'épaule de quelqu\'un' },
    'point of view': { emoji: '👀', fr: 'point de vue', explanation: 'On voit comme si on était le personnage' },
    'POV': { emoji: '👀', fr: 'point de vue', explanation: 'On voit à travers les yeux du personnage' },
    'aerial shot': { emoji: '🚁', fr: 'plan aérien', explanation: 'Filmé depuis le ciel, comme avec un drone' },
    'bird\'s eye view': { emoji: '🦅', fr: 'vue plongeante', explanation: 'On regarde d\'en haut, comme un oiseau' },
    'birds eye view': { emoji: '🦅', fr: 'vue plongeante', explanation: 'On regarde d\'en haut, comme un oiseau' },
    'worm\'s eye view': { emoji: '🐛', fr: 'contre-plongée', explanation: 'On regarde d\'en bas vers le haut' },
    'worms eye view': { emoji: '🐛', fr: 'contre-plongée', explanation: 'On regarde d\'en bas vers le haut' },
    'low angle': { emoji: '⬆️', fr: 'contre-plongée', explanation: 'La caméra est en bas et regarde vers le haut' },
    'high angle': { emoji: '⬇️', fr: 'plongée', explanation: 'La caméra est en haut et regarde vers le bas' },
    'eye level': { emoji: '👁️', fr: 'niveau des yeux', explanation: 'La caméra est à hauteur des yeux' },
    'full body shot': { emoji: '🧍', fr: 'plan en pied', explanation: 'On voit la personne des pieds à la tête' },
    'portrait shot': { emoji: '🖼️', fr: 'portrait', explanation: 'On voit bien le visage de la personne' },
    
    // ═══════════════════════════════════════════════════════════════════
    // ✨ EFFETS SPÉCIAUX
    // ═══════════════════════════════════════════════════════════════════
    'magical sparkles and particles': { emoji: '✨', fr: 'étincelles magiques', explanation: 'Des petites lumières brillantes comme de la poussière de fée !' },
    'soft glowing halo effect': { emoji: '🌈', fr: 'effet halo lumineux', explanation: 'Une lumière douce qui entoure les choses, comme une auréole' },
    'gentle smoke and mist': { emoji: '💨', fr: 'fumée et brume', explanation: 'De la fumée légère qui flotte dans l\'air, mystérieux !' },
    'twinkling stars': { emoji: '⭐', fr: 'étoiles scintillantes', explanation: 'Des étoiles qui brillent et clignotent dans le ciel' },
    'warm flames and embers': { emoji: '🔥', fr: 'flammes et braises', explanation: 'Du feu avec des petites braises qui volent' },
    'falling snowflakes': { emoji: '❄️', fr: 'flocons de neige', explanation: 'Des flocons de neige qui tombent doucement' },
    'magical fairy dust particles': { emoji: '🪄', fr: 'poussière de fée', explanation: 'Des particules magiques comme dans les contes de fées !' },
    'sparkles': { emoji: '✨', fr: 'étincelles', explanation: 'Des petites lumières qui brillent' },
    'particles': { emoji: '🌟', fr: 'particules', explanation: 'Des petits points de lumière qui flottent' },
    'glowing': { emoji: '💡', fr: 'brillant', explanation: 'Qui émet de la lumière' },
    'glow': { emoji: '💡', fr: 'lueur', explanation: 'Une lumière douce' },
    'shimmer': { emoji: '✨', fr: 'chatoiement', explanation: 'Qui brille et change de couleur comme une bulle de savon' },
    'glitter': { emoji: '💎', fr: 'paillettes', explanation: 'Des petits points brillants comme des paillettes' },
    'lens flare': { emoji: '☀️', fr: 'halo de lumière', explanation: 'Quand la lumière fait des ronds dans l\'image' },
    'bokeh': { emoji: '🔵', fr: 'bokeh', explanation: 'Les lumières floues en arrière-plan font de jolis ronds' },
    'motion blur': { emoji: '💨', fr: 'flou de mouvement', explanation: 'Le flou qui montre que quelque chose bouge vite' },
    'depth of field': { emoji: '📷', fr: 'profondeur de champ', explanation: 'Quand l\'arrière-plan est flou et le sujet net' },
    'shallow depth of field': { emoji: '🎯', fr: 'faible profondeur', explanation: 'Seulement le sujet est net, tout le reste est flou' },
    'vignette': { emoji: '⭕', fr: 'vignette', explanation: 'Les bords de l\'image sont plus sombres' },
    'chromatic aberration': { emoji: '🌈', fr: 'aberration chromatique', explanation: 'Des bords arc-en-ciel sur les objets' },
    'film grain': { emoji: '📽️', fr: 'grain de film', explanation: 'Des petits points comme sur les vieux films' },
    'noise': { emoji: '📺', fr: 'bruit', explanation: 'Des petits points colorés dans l\'image' },
    'bloom': { emoji: '🌸', fr: 'bloom', explanation: 'La lumière déborde et brille autour des zones claires' },
    'ray tracing': { emoji: '🔦', fr: 'lancer de rayons', explanation: 'La lumière rebondit de façon très réaliste' },
    'reflection': { emoji: '🪞', fr: 'reflet', explanation: 'On voit le reflet des choses' },
    'refraction': { emoji: '💎', fr: 'réfraction', explanation: 'La lumière se déforme à travers le verre ou l\'eau' },
    'caustics': { emoji: '🌊', fr: 'caustiques', explanation: 'Les jolies lumières qui dansent sous l\'eau' },
    'volumetric lighting': { emoji: '🌅', fr: 'lumière volumétrique', explanation: 'On voit les rayons de lumière dans l\'air' },
    'volumetric fog': { emoji: '🌫️', fr: 'brouillard volumétrique', explanation: 'Du brouillard épais et réaliste' },
    'god rays': { emoji: '☀️', fr: 'rayons divins', explanation: 'De grands rayons de lumière qui traversent les nuages' },
    'sunbeams': { emoji: '🌤️', fr: 'rayons de soleil', explanation: 'Des rayons de soleil qui percent à travers' },
    
    // ═══════════════════════════════════════════════════════════════════
    // 🎨 STYLES ARTISTIQUES
    // ═══════════════════════════════════════════════════════════════════
    'hand-drawn illustration style': { emoji: '✏️', fr: 'style dessin', explanation: 'Comme si quelqu\'un avait dessiné avec un crayon' },
    'hand-drawn': { emoji: '✏️', fr: 'dessiné à la main', explanation: 'Fait à la main, pas par ordinateur' },
    'illustration': { emoji: '🖼️', fr: 'illustration', explanation: 'Un dessin fait pour un livre ou un magazine' },
    'photorealistic': { emoji: '📷', fr: 'photoréaliste', explanation: 'Tellement réaliste qu\'on dirait une vraie photo !' },
    'photo realistic': { emoji: '📷', fr: 'photoréaliste', explanation: 'Tellement réaliste qu\'on dirait une vraie photo !' },
    'hyper realistic': { emoji: '🔬', fr: 'hyper réaliste', explanation: 'Encore plus réaliste qu\'une photo !' },
    'hyperrealistic': { emoji: '🔬', fr: 'hyper réaliste', explanation: 'Encore plus réaliste qu\'une photo !' },
    'magical fantasy art': { emoji: '✨', fr: 'art fantastique', explanation: 'Style magique avec des couleurs brillantes et féériques' },
    'fantasy art': { emoji: '🐉', fr: 'art fantastique', explanation: 'Avec des dragons, de la magie et des créatures imaginaires' },
    'ethereal glow': { emoji: '💫', fr: 'lueur éthérée', explanation: 'Une lumière douce et mystérieuse, comme dans les rêves' },
    'ethereal': { emoji: '👼', fr: 'éthéré', explanation: 'Léger et délicat, comme un ange ou un rêve' },
    'anime style': { emoji: '🌸', fr: 'style anime', explanation: 'Comme dans les dessins animés japonais !' },
    'anime': { emoji: '🌸', fr: 'anime', explanation: 'Style des dessins animés japonais' },
    'manga': { emoji: '📖', fr: 'manga', explanation: 'Style des bandes dessinées japonaises' },
    'Studio Ghibli inspired': { emoji: '🏯', fr: 'inspiré Ghibli', explanation: 'Comme les films de Miyazaki (Totoro, Chihiro...)' },
    'Studio Ghibli': { emoji: '🏯', fr: 'Studio Ghibli', explanation: 'Le studio qui a fait Totoro, Chihiro et plein d\'autres films magiques !' },
    'Ghibli': { emoji: '🏯', fr: 'Ghibli', explanation: 'Style des films de Miyazaki, doux et poétique' },
    'watercolor painting style': { emoji: '🎨', fr: 'style aquarelle', explanation: 'Comme une peinture à l\'eau, avec des couleurs qui se mélangent' },
    'watercolor': { emoji: '🎨', fr: 'aquarelle', explanation: 'Peinture à l\'eau, les couleurs se mélangent doucement' },
    'oil painting': { emoji: '🖼️', fr: 'peinture à l\'huile', explanation: 'Comme les tableaux des grands musées' },
    'acrylic': { emoji: '🎨', fr: 'acrylique', explanation: 'Peinture avec des couleurs vives et brillantes' },
    'pixel art': { emoji: '👾', fr: 'pixel art', explanation: 'Fait avec des petits carrés, comme les vieux jeux vidéo !' },
    'retro game style': { emoji: '🕹️', fr: 'style rétro', explanation: 'Comme dans les jeux vidéo d\'autrefois' },
    '8-bit': { emoji: '👾', fr: '8 bits', explanation: 'Style des très vieux jeux vidéo avec gros pixels' },
    '16-bit': { emoji: '🎮', fr: '16 bits', explanation: 'Style des jeux Super Nintendo' },
    'voxel': { emoji: '🧊', fr: 'voxel', explanation: 'Fait de petits cubes 3D, comme Minecraft' },
    'low poly': { emoji: '📐', fr: 'low poly', explanation: 'Formes simples avec peu de détails, style géométrique' },
    'cartoon': { emoji: '🎪', fr: 'cartoon', explanation: 'Style dessin animé avec des formes simples et drôles' },
    'comic book': { emoji: '💥', fr: 'bande dessinée', explanation: 'Comme dans les comics, avec des traits marqués' },
    'comic': { emoji: '💥', fr: 'BD', explanation: 'Style bande dessinée' },
    'graphic novel': { emoji: '📚', fr: 'roman graphique', explanation: 'BD pour les grands, avec de beaux dessins' },
    'cel shading': { emoji: '🎨', fr: 'cel shading', explanation: 'Style 3D qui ressemble à un dessin animé' },
    'toon shading': { emoji: '🎬', fr: 'rendu cartoon', explanation: 'La 3D ressemble à un dessin animé' },
    'impressionist': { emoji: '🌻', fr: 'impressionniste', explanation: 'Comme les peintures de Monet, avec des touches de couleur' },
    'impressionism': { emoji: '🌻', fr: 'impressionnisme', explanation: 'Style artistique avec des couleurs qui se mélangent' },
    'expressionist': { emoji: '😱', fr: 'expressionniste', explanation: 'Formes déformées qui montrent des émotions fortes' },
    'surreal': { emoji: '🎭', fr: 'surréaliste', explanation: 'Comme un rêve bizarre, des choses impossibles' },
    'surrealism': { emoji: '🎭', fr: 'surréalisme', explanation: 'Art bizarre comme dans les rêves' },
    'abstract': { emoji: '🔷', fr: 'abstrait', explanation: 'Des formes et couleurs sans représenter quelque chose de réel' },
    'minimalist': { emoji: '⬜', fr: 'minimaliste', explanation: 'Très simple, avec peu d\'éléments' },
    'maximalist': { emoji: '🎪', fr: 'maximaliste', explanation: 'Plein de détails partout !' },
    'baroque': { emoji: '👑', fr: 'baroque', explanation: 'Très décoré et riche, comme les châteaux' },
    'art nouveau': { emoji: '🌿', fr: 'art nouveau', explanation: 'Avec des courbes élégantes comme des plantes' },
    'art deco': { emoji: '🏛️', fr: 'art déco', explanation: 'Style géométrique et élégant des années 1920' },
    'pop art': { emoji: '🎨', fr: 'pop art', explanation: 'Couleurs vives comme les œuvres d\'Andy Warhol' },
    'graffiti': { emoji: '🎨', fr: 'graffiti', explanation: 'Comme les dessins sur les murs des villes' },
    'street art': { emoji: '🏙️', fr: 'art de rue', explanation: 'Art fait dans la rue, sur les murs' },
    'steampunk': { emoji: '⚙️', fr: 'steampunk', explanation: 'Style avec des engrenages et de la vapeur, rétro-futuriste' },
    'dieselpunk': { emoji: '🛢️', fr: 'dieselpunk', explanation: 'Comme le steampunk mais avec des moteurs' },
    'cyberpunk': { emoji: '🤖', fr: 'cyberpunk', explanation: 'Style futuriste avec plein de technologie et néons' },
    'solarpunk': { emoji: '🌱', fr: 'solarpunk', explanation: 'Futur écologique avec des plantes et du soleil' },
    'gothic': { emoji: '🦇', fr: 'gothique', explanation: 'Sombre et mystérieux, avec des châteaux' },
    'dark fantasy': { emoji: '⚔️', fr: 'dark fantasy', explanation: 'Fantastique mais sombre et dangereux' },
    'kawaii': { emoji: '🎀', fr: 'kawaii', explanation: 'Mignon à la japonaise, tout rond et adorable' },
    'chibi': { emoji: '😊', fr: 'chibi', explanation: 'Personnages mignons avec grosse tête et petit corps' },
    'realistic': { emoji: '📷', fr: 'réaliste', explanation: 'Qui ressemble à la vraie vie' },
    'stylized': { emoji: '🎨', fr: 'stylisé', explanation: 'Avec un style particulier, pas totalement réaliste' },
    'vintage': { emoji: '📻', fr: 'vintage', explanation: 'Style ancien, comme autrefois' },
    'retro': { emoji: '📼', fr: 'rétro', explanation: 'Style des années passées' },
    'futuristic': { emoji: '🚀', fr: 'futuriste', explanation: 'Style du futur avec de la technologie avancée' },
    'sci-fi': { emoji: '🛸', fr: 'science-fiction', explanation: 'Avec des vaisseaux, des robots et l\'espace' },
    'medieval': { emoji: '🏰', fr: 'médiéval', explanation: 'Du Moyen Âge avec des chevaliers et châteaux' },
    'victorian': { emoji: '🎩', fr: 'victorien', explanation: 'Style de l\'époque de la reine Victoria en Angleterre' },
    'renaissance': { emoji: '🖼️', fr: 'renaissance', explanation: 'Comme les peintures de Léonard de Vinci' },
    'ukiyo-e': { emoji: '🌊', fr: 'ukiyo-e', explanation: 'Estampes japonaises traditionnelles, comme la grande vague' },
    'chinese painting': { emoji: '🎋', fr: 'peinture chinoise', explanation: 'Style traditionnel chinois à l\'encre' },
    'ink wash': { emoji: '🖌️', fr: 'lavis d\'encre', explanation: 'Peinture à l\'encre noire diluée' },
    'stained glass': { emoji: '🏰', fr: 'vitrail', explanation: 'Comme les fenêtres colorées des églises' },
    'mosaic': { emoji: '🎨', fr: 'mosaïque', explanation: 'Fait de plein de petits morceaux colorés' },
    'paper cut': { emoji: '✂️', fr: 'papier découpé', explanation: 'Comme si c\'était fait de papier découpé' },
    'origami': { emoji: '🦢', fr: 'origami', explanation: 'Art du pliage de papier japonais' },
    'claymation': { emoji: '🎭', fr: 'pâte à modeler', explanation: 'Comme les films en pâte à modeler' },
    'stop motion': { emoji: '🎬', fr: 'stop motion', explanation: 'Animation image par image' },
    'isometric': { emoji: '📐', fr: 'isométrique', explanation: 'Vue en angle où tout garde la même taille' },
    'flat design': { emoji: '📱', fr: 'design plat', explanation: 'Simple et moderne, sans ombres ni volumes' },
    'material design': { emoji: '📲', fr: 'material design', explanation: 'Style moderne de Google avec des ombres douces' },
    'glassmorphism': { emoji: '🔮', fr: 'glassmorphism', explanation: 'Effet verre dépoli transparent' },
    'neumorphism': { emoji: '⬜', fr: 'neumorphism', explanation: 'Boutons qui ont l\'air enfoncés dans la surface' },
    
    // ═══════════════════════════════════════════════════════════════════
    // 🌅 AMBIANCES & ATMOSPHÈRES
    // ═══════════════════════════════════════════════════════════════════
    'daytime': { emoji: '☀️', fr: 'journée', explanation: 'C\'est le jour, avec le soleil' },
    'bright atmosphere': { emoji: '🌤️', fr: 'atmosphère lumineuse', explanation: 'Tout est bien éclairé et lumineux' },
    'nighttime': { emoji: '🌙', fr: 'nuit', explanation: 'C\'est la nuit, quand il fait sombre' },
    'night': { emoji: '🌙', fr: 'nuit', explanation: 'Quand le soleil est couché' },
    'starry sky': { emoji: '⭐', fr: 'ciel étoilé', explanation: 'Un ciel rempli de belles étoiles' },
    'stormy weather': { emoji: '⛈️', fr: 'temps orageux', explanation: 'Il y a un orage avec des nuages sombres' },
    'stormy': { emoji: '⛈️', fr: 'orageux', explanation: 'Avec un orage et des éclairs' },
    'dramatic clouds': { emoji: '🌩️', fr: 'nuages dramatiques', explanation: 'Des gros nuages impressionnants dans le ciel' },
    'dramatic': { emoji: '🎭', fr: 'dramatique', explanation: 'Très impressionnant, qui fait effet' },
    'misty': { emoji: '🌫️', fr: 'brumeux', explanation: 'Il y a de la brume, on ne voit pas très loin' },
    'mist': { emoji: '🌫️', fr: 'brume', explanation: 'Un léger brouillard' },
    'fog': { emoji: '🌁', fr: 'brouillard', explanation: 'Comme un nuage au sol qui cache les choses' },
    'foggy': { emoji: '🌁', fr: 'brumeux', explanation: 'Plein de brouillard' },
    'mysterious atmosphere': { emoji: '🔮', fr: 'atmosphère mystérieuse', explanation: 'Une ambiance de mystère, un peu inquiétante' },
    'fairy tale setting': { emoji: '🧚', fr: 'décor de conte', explanation: 'Comme dans les contes de fées avec de la magie !' },
    'enchanted': { emoji: '🪄', fr: 'enchanté', explanation: 'Magique et merveilleux, comme sous un sort' },
    'mysterious': { emoji: '🔮', fr: 'mystérieux', explanation: 'Plein de secrets et de mystères' },
    'shadowy': { emoji: '👤', fr: 'ombragé', explanation: 'Avec beaucoup d\'ombres, un peu sombre' },
    'intriguing': { emoji: '🤔', fr: 'intrigant', explanation: 'Qui donne envie d\'en savoir plus !' },
    'dreamy': { emoji: '💭', fr: 'onirique', explanation: 'Comme dans un rêve' },
    'dreamlike': { emoji: '💭', fr: 'comme un rêve', explanation: 'Flou et doux comme dans les rêves' },
    'magical': { emoji: '✨', fr: 'magique', explanation: 'Plein de magie !' },
    'whimsical': { emoji: '🎪', fr: 'fantaisiste', explanation: 'Drôle et imaginatif' },
    'moody': { emoji: '🌧️', fr: 'mélancolique', explanation: 'Une ambiance un peu triste ou pensive' },
    'melancholic': { emoji: '😢', fr: 'mélancolique', explanation: 'Un peu triste mais beau' },
    'peaceful': { emoji: '🕊️', fr: 'paisible', explanation: 'Calme et tranquille' },
    'serene': { emoji: '🧘', fr: 'serein', explanation: 'Très calme et reposant' },
    'tranquil': { emoji: '🌸', fr: 'tranquille', explanation: 'Paisible et calme' },
    'cozy': { emoji: '🛋️', fr: 'douillet', explanation: 'Confortable et chaleureux' },
    'warm': { emoji: '🔥', fr: 'chaleureux', explanation: 'Qui donne une sensation de chaleur agréable' },
    'cold': { emoji: '❄️', fr: 'froid', explanation: 'Ambiance froide, glaciale' },
    'dark': { emoji: '🌑', fr: 'sombre', explanation: 'Peu de lumière, plutôt noir' },
    'bright': { emoji: '☀️', fr: 'lumineux', explanation: 'Beaucoup de lumière' },
    'vibrant': { emoji: '🌈', fr: 'vibrant', explanation: 'Couleurs vives et éclatantes' },
    'muted': { emoji: '🌫️', fr: 'atténué', explanation: 'Couleurs douces et pastel' },
    'pastel': { emoji: '🎀', fr: 'pastel', explanation: 'Couleurs douces et claires' },
    'saturated': { emoji: '🎨', fr: 'saturé', explanation: 'Couleurs très vives et intenses' },
    'desaturated': { emoji: '⬜', fr: 'désaturé', explanation: 'Couleurs ternes, presque grises' },
    'monochrome': { emoji: '⬛', fr: 'monochrome', explanation: 'Une seule couleur avec ses nuances' },
    'black and white': { emoji: '⬛', fr: 'noir et blanc', explanation: 'Sans couleurs, juste du noir, blanc et gris' },
    'sepia': { emoji: '📜', fr: 'sépia', explanation: 'Couleur brune comme les vieilles photos' },
    'golden hour': { emoji: '🌅', fr: 'heure dorée', explanation: 'La belle lumière juste avant le coucher du soleil' },
    'blue hour': { emoji: '🌆', fr: 'heure bleue', explanation: 'Le moment magique juste après le coucher du soleil' },
    'sunset': { emoji: '🌅', fr: 'coucher de soleil', explanation: 'Quand le soleil se couche avec de belles couleurs' },
    'sunrise': { emoji: '🌄', fr: 'lever de soleil', explanation: 'Quand le soleil se lève le matin' },
    'dusk': { emoji: '🌆', fr: 'crépuscule', explanation: 'Le moment entre le jour et la nuit' },
    'dawn': { emoji: '🌅', fr: 'aube', explanation: 'Le tout début du jour' },
    'twilight': { emoji: '🌙', fr: 'crépuscule', explanation: 'La lumière douce entre jour et nuit' },
    'overcast': { emoji: '☁️', fr: 'nuageux', explanation: 'Le ciel est couvert de nuages' },
    'cloudy': { emoji: '☁️', fr: 'nuageux', explanation: 'Avec des nuages' },
    'rainy': { emoji: '🌧️', fr: 'pluvieux', explanation: 'Il pleut' },
    'snowy': { emoji: '🌨️', fr: 'enneigé', explanation: 'Avec de la neige' },
    'sunny': { emoji: '☀️', fr: 'ensoleillé', explanation: 'Avec du soleil' },
    'windy': { emoji: '💨', fr: 'venteux', explanation: 'Il y a du vent' },
    'autumn': { emoji: '🍂', fr: 'automne', explanation: 'La saison des feuilles qui tombent' },
    'fall': { emoji: '🍂', fr: 'automne', explanation: 'La saison des feuilles oranges' },
    'winter': { emoji: '❄️', fr: 'hiver', explanation: 'La saison froide avec la neige' },
    'spring': { emoji: '🌸', fr: 'printemps', explanation: 'La saison des fleurs' },
    'summer': { emoji: '☀️', fr: 'été', explanation: 'La saison chaude' },
    'tropical': { emoji: '🌴', fr: 'tropical', explanation: 'Chaud et humide comme dans la jungle' },
    'arctic': { emoji: '🧊', fr: 'arctique', explanation: 'Très froid comme au pôle Nord' },
    'desert': { emoji: '🏜️', fr: 'désert', explanation: 'Sec et chaud avec du sable' },
    'underwater': { emoji: '🐠', fr: 'sous-marin', explanation: 'Sous l\'eau' },
    'space': { emoji: '🚀', fr: 'espace', explanation: 'Dans l\'espace avec les étoiles' },
    'cosmic': { emoji: '🌌', fr: 'cosmique', explanation: 'De l\'univers, avec des étoiles et galaxies' },
    
    // ═══════════════════════════════════════════════════════════════════
    // 💡 ÉCLAIRAGES
    // ═══════════════════════════════════════════════════════════════════
    'golden sunlight': { emoji: '🌞', fr: 'lumière dorée', explanation: 'La belle lumière chaude du soleil' },
    'sunlight': { emoji: '☀️', fr: 'lumière du soleil', explanation: 'La lumière naturelle du soleil' },
    'moonlit': { emoji: '🌕', fr: 'éclairé par la lune', explanation: 'Baigné dans la douce lumière de la lune' },
    'moonlight': { emoji: '🌕', fr: 'clair de lune', explanation: 'La lumière douce de la lune' },
    'silver glow': { emoji: '✨', fr: 'lueur argentée', explanation: 'Une lumière douce couleur argent' },
    'candlelight': { emoji: '🕯️', fr: 'lumière de bougie', explanation: 'La lumière chaude et dansante des bougies' },
    'warm orange glow': { emoji: '🔶', fr: 'lueur orange chaude', explanation: 'Une lumière orange et chaleureuse' },
    'neon lights': { emoji: '💡', fr: 'néons', explanation: 'Des lumières colorées qui brillent fort' },
    'neon': { emoji: '💡', fr: 'néon', explanation: 'Lumière colorée très vive' },
    'aurora borealis': { emoji: '🌌', fr: 'aurore boréale', explanation: 'Les magnifiques lumières colorées du ciel polaire' },
    'northern lights': { emoji: '🌈', fr: 'lumières du nord', explanation: 'Pareil que l\'aurore boréale, c\'est magique !' },
    'natural lighting': { emoji: '☀️', fr: 'lumière naturelle', explanation: 'Éclairé par le soleil ou la lune, pas artificiel' },
    'artificial lighting': { emoji: '💡', fr: 'lumière artificielle', explanation: 'Éclairé par des lampes' },
    'studio lighting': { emoji: '🎬', fr: 'éclairage studio', explanation: 'Lumière professionnelle comme pour les photos' },
    'dramatic lighting': { emoji: '🎭', fr: 'éclairage dramatique', explanation: 'Lumière qui crée des ombres impressionnantes' },
    'soft lighting': { emoji: '🌸', fr: 'lumière douce', explanation: 'Lumière qui ne fait pas d\'ombres dures' },
    'hard lighting': { emoji: '💥', fr: 'lumière dure', explanation: 'Lumière qui fait des ombres bien marquées' },
    'backlight': { emoji: '🌅', fr: 'contre-jour', explanation: 'La lumière vient de derrière le sujet' },
    'backlighting': { emoji: '🌅', fr: 'contre-jour', explanation: 'Éclairé par derrière' },
    'rim light': { emoji: '✨', fr: 'lumière de contour', explanation: 'Un liseré de lumière autour du sujet' },
    'fill light': { emoji: '💡', fr: 'lumière d\'appoint', explanation: 'Lumière qui éclaire les ombres' },
    'key light': { emoji: '🔦', fr: 'lumière principale', explanation: 'La lumière la plus forte qui éclaire le sujet' },
    'ambient light': { emoji: '🏠', fr: 'lumière ambiante', explanation: 'La lumière générale de l\'environnement' },
    'spotlight': { emoji: '🔦', fr: 'projecteur', explanation: 'Un rond de lumière concentré' },
    'diffused light': { emoji: '☁️', fr: 'lumière diffuse', explanation: 'Lumière douce qui vient de partout' },
    'harsh light': { emoji: '☀️', fr: 'lumière crue', explanation: 'Lumière très forte qui fait des ombres dures' },
    'chiaroscuro': { emoji: '🎭', fr: 'clair-obscur', explanation: 'Fort contraste entre lumière et ombre, comme les tableaux anciens' },
    'high key': { emoji: '⬜', fr: 'high key', explanation: 'Image très lumineuse avec peu d\'ombres' },
    'low key': { emoji: '⬛', fr: 'low key', explanation: 'Image sombre avec beaucoup d\'ombres' },
    'silhouette': { emoji: '👤', fr: 'silhouette', explanation: 'Forme noire devant une lumière' },
    'bioluminescent': { emoji: '🦑', fr: 'bioluminescent', explanation: 'Qui brille naturellement comme certaines méduses' },
    'glowing eyes': { emoji: '👁️', fr: 'yeux brillants', explanation: 'Des yeux qui émettent de la lumière' },
    
    // ═══════════════════════════════════════════════════════════════════
    // 🎭 QUALITÉ & RENDU
    // ═══════════════════════════════════════════════════════════════════
    '4K': { emoji: '📺', fr: '4K', explanation: 'Très haute définition, image super nette' },
    '8K': { emoji: '📺', fr: '8K', explanation: 'Définition incroyable, chaque détail est visible' },
    'HD': { emoji: '📺', fr: 'haute définition', explanation: 'Image de bonne qualité' },
    'high resolution': { emoji: '🔬', fr: 'haute résolution', explanation: 'Image très détaillée' },
    'high quality': { emoji: '⭐', fr: 'haute qualité', explanation: 'Très bien fait' },
    'ultra detailed': { emoji: '🔍', fr: 'ultra détaillé', explanation: 'Plein de petits détails partout' },
    'highly detailed': { emoji: '🔍', fr: 'très détaillé', explanation: 'Beaucoup de détails' },
    'intricate details': { emoji: '🔬', fr: 'détails complexes', explanation: 'Des détails très fins et travaillés' },
    'sharp focus': { emoji: '🎯', fr: 'mise au point nette', explanation: 'L\'image est très nette' },
    'sharp': { emoji: '🎯', fr: 'net', explanation: 'Pas flou du tout' },
    'crisp': { emoji: '✨', fr: 'net', explanation: 'Image parfaitement nette' },
    'smooth': { emoji: '🧈', fr: 'lisse', explanation: 'Sans aspérités, tout doux' },
    'textured': { emoji: '🧱', fr: 'texturé', explanation: 'Avec une surface qu\'on peut presque toucher' },
    'glossy': { emoji: '✨', fr: 'brillant', explanation: 'Surface qui reflète la lumière' },
    'matte': { emoji: '⬜', fr: 'mat', explanation: 'Surface qui ne brille pas' },
    'metallic': { emoji: '🔩', fr: 'métallique', explanation: 'Qui ressemble à du métal' },
    'shiny': { emoji: '✨', fr: 'brillant', explanation: 'Qui reflète la lumière' },
    'reflective': { emoji: '🪞', fr: 'réfléchissant', explanation: 'Comme un miroir' },
    'transparent': { emoji: '🔮', fr: 'transparent', explanation: 'On peut voir à travers' },
    'translucent': { emoji: '🧊', fr: 'translucide', explanation: 'La lumière passe mais on ne voit pas bien à travers' },
    'opaque': { emoji: '⬛', fr: 'opaque', explanation: 'On ne peut pas voir à travers' },
    'octane render': { emoji: '🖥️', fr: 'rendu Octane', explanation: 'Un logiciel qui fait de très belles images 3D' },
    'unreal engine': { emoji: '🎮', fr: 'Unreal Engine', explanation: 'Le moteur des jeux vidéo très réalistes' },
    'blender': { emoji: '🎨', fr: 'Blender', explanation: 'Logiciel gratuit pour faire de la 3D' },
    'cinema 4d': { emoji: '🎬', fr: 'Cinema 4D', explanation: 'Logiciel professionnel de 3D' },
    'v-ray': { emoji: '💡', fr: 'V-Ray', explanation: 'Logiciel qui calcule la lumière de façon réaliste' },
    'arnold': { emoji: '🎬', fr: 'Arnold', explanation: 'Moteur de rendu professionnel' },
    'CGI': { emoji: '🖥️', fr: 'images de synthèse', explanation: 'Fait par ordinateur' },
    '3D render': { emoji: '🖥️', fr: 'rendu 3D', explanation: 'Image créée en trois dimensions par ordinateur' },
    'digital art': { emoji: '🖥️', fr: 'art numérique', explanation: 'Art fait avec un ordinateur' },
    'digital painting': { emoji: '🖌️', fr: 'peinture numérique', explanation: 'Peinture faite sur tablette ou ordinateur' },
    'concept art': { emoji: '🎨', fr: 'concept art', explanation: 'Dessin pour imaginer un personnage ou un monde' },
    'matte painting': { emoji: '🏔️', fr: 'matte painting', explanation: 'Peinture de décor pour les films' },
    'trending on artstation': { emoji: '⭐', fr: 'populaire sur ArtStation', explanation: 'Style des artistes populaires sur internet' },
    'award winning': { emoji: '🏆', fr: 'primé', explanation: 'Qui a gagné des prix' },
    'masterpiece': { emoji: '👑', fr: 'chef-d\'œuvre', explanation: 'Une création exceptionnelle' },
    'beautiful': { emoji: '😍', fr: 'beau', explanation: 'Très joli à regarder' },
    'stunning': { emoji: '🤩', fr: 'époustouflant', explanation: 'Qui coupe le souffle tellement c\'est beau' },
    'breathtaking': { emoji: '😮', fr: 'à couper le souffle', explanation: 'Tellement beau qu\'on oublie de respirer' },
    'epic': { emoji: '⚔️', fr: 'épique', explanation: 'Grandiose, comme dans les grandes aventures' },
    'majestic': { emoji: '👑', fr: 'majestueux', explanation: 'Grand et impressionnant comme un roi' },
    'elegant': { emoji: '✨', fr: 'élégant', explanation: 'Raffiné et de bon goût' },
    'delicate': { emoji: '🌸', fr: 'délicat', explanation: 'Fin et fragile' },
    'ornate': { emoji: '👑', fr: 'orné', explanation: 'Avec beaucoup de décorations' },
  }
  
  // 🎯 Transforme le prompt en éléments avec tooltips
  const renderPromptWithTooltips = (prompt: string) => {
    if (!prompt) return null
    
    // Trier les termes par longueur décroissante pour matcher les plus longs d'abord
    const sortedTerms = Object.keys(technicalTerms).sort((a, b) => b.length - a.length)
    
    // Créer un tableau de segments (texte normal ou terme technique)
    type Segment = { type: 'text' | 'term'; content: string; key: string }
    const segments: Segment[] = []
    let remainingText = prompt
    let keyCounter = 0
    
    while (remainingText.length > 0) {
      let foundTerm = false
      const lowerRemaining = remainingText.toLowerCase()
      
      for (const term of sortedTerms) {
        const index = lowerRemaining.indexOf(term.toLowerCase())
        if (index === 0) {
          // Le terme est au début
          segments.push({ type: 'term', content: remainingText.slice(0, term.length), key: `term-${keyCounter++}` })
          remainingText = remainingText.slice(term.length)
          foundTerm = true
          break
        } else if (index > 0) {
          // Il y a du texte avant le terme
          segments.push({ type: 'text', content: remainingText.slice(0, index), key: `text-${keyCounter++}` })
          segments.push({ type: 'term', content: remainingText.slice(index, index + term.length), key: `term-${keyCounter++}` })
          remainingText = remainingText.slice(index + term.length)
          foundTerm = true
          break
        }
      }
      
      if (!foundTerm) {
        // Aucun terme trouvé, ajouter le reste comme texte
        segments.push({ type: 'text', content: remainingText, key: `text-${keyCounter++}` })
        remainingText = ''
      }
    }
    
    return (
      <span className="inline">
        {segments.map((segment) => {
          if (segment.type === 'text') {
            return <span key={segment.key}>{segment.content}</span>
          }
          
          const termKey = segment.content.toLowerCase()
          const termInfo = technicalTerms[termKey]
          
          if (!termInfo) {
            return <span key={segment.key}>{segment.content}</span>
          }
          
          return (
            <span
              key={segment.key}
              className="relative inline-block"
              onMouseEnter={() => setActiveTooltip(segment.key)}
              onMouseLeave={() => setActiveTooltip(null)}
              onClick={() => setActiveTooltip(activeTooltip === segment.key ? null : segment.key)}
            >
              <span className="cursor-help border-b-2 border-dashed border-aurora-400 text-aurora-300 hover:text-aurora-200 hover:border-aurora-300 transition-colors">
                {segment.content}
              </span>
              
              {/* Tooltip */}
              <AnimatePresence>
                {activeTooltip === segment.key && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl bg-midnight-800 border border-aurora-500/50 shadow-xl shadow-aurora-500/20"
                  >
                    {/* Flèche */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-midnight-800" />
                    
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{termInfo.emoji}</span>
                        <span className="font-bold text-aurora-300 text-sm">{termInfo.fr}</span>
                      </div>
                      <p className="text-white/90 text-xs leading-relaxed">
                        {termInfo.explanation}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </span>
          )
        })}
      </span>
    )
  }
  
  // 📚 Génère une explication du prompt adaptée aux enfants de 8 ans (garde pour le mode liste)
  const generatePromptExplanation = () => {
    if (!currentKit) return null
    
    const explanations: string[] = []
    
    if (currentCreationType === 'image') {
      // === EXPLICATION POUR LES IMAGES ===
      if (currentKit.subject) {
        explanations.push(`🎨 <strong>Ce que tu crées :</strong> ${currentKit.subject}`)
      }
      
      if (currentKit.style) {
        const styleExplanations: Record<string, string> = {
          dessin: "✏️ <strong>Style dessin :</strong> L'IA va dessiner comme avec un crayon !<br/><span class='text-aurora-400 text-xs'>→ En anglais : \"hand-drawn illustration style\" (style illustration dessinée à la main)</span>",
          photo: "📷 <strong>Style photo :</strong> Ça va ressembler à une vraie photo !<br/><span class='text-aurora-400 text-xs'>→ En anglais : \"photorealistic\" (photoréaliste = comme une vraie photo)</span>",
          magique: "✨ <strong>Style magique :</strong> Avec de la brillance et de la magie partout !<br/><span class='text-aurora-400 text-xs'>→ En anglais : \"magical fantasy art, ethereal glow\" (art fantastique magique, lueur éthérée)</span>",
          anime: "🌸 <strong>Style anime :</strong> Comme dans les dessins animés japonais !<br/><span class='text-aurora-400 text-xs'>→ En anglais : \"anime style, Studio Ghibli inspired\" (style anime, inspiré du Studio Ghibli)</span>",
          aquarelle: "🎨 <strong>Style aquarelle :</strong> Comme une peinture à l'eau, tout doux !<br/><span class='text-aurora-400 text-xs'>→ En anglais : \"watercolor painting style\" (style peinture aquarelle)</span>",
          pixel: "👾 <strong>Style pixel :</strong> Comme dans les jeux vidéo rétro avec des petits carrés !<br/><span class='text-aurora-400 text-xs'>→ En anglais : \"pixel art, retro game style\" (pixel art, style jeu vidéo rétro)</span>",
        }
        explanations.push(styleExplanations[currentKit.style] || '')
      }
      
      if (currentKit.ambiance) {
        const ambianceExplanations: Record<string, string> = {
          jour: "☀️ <strong>Moment :</strong> C'est le jour, avec de la lumière !<br/><span class='text-aurora-400 text-xs'>→ En anglais : \"daytime, bright atmosphere\" (journée, atmosphère lumineuse)</span>",
          nuit: "🌙 <strong>Moment :</strong> C'est la nuit, sous les étoiles !<br/><span class='text-aurora-400 text-xs'>→ En anglais : \"nighttime, starry sky\" (nuit, ciel étoilé)</span>",
          orage: "⛈️ <strong>Météo :</strong> Il y a un orage avec des éclairs !<br/><span class='text-aurora-400 text-xs'>→ En anglais : \"stormy weather, dramatic clouds\" (temps orageux, nuages dramatiques)</span>",
          brume: "🌫️ <strong>Ambiance :</strong> Il y a du brouillard mystérieux !<br/><span class='text-aurora-400 text-xs'>→ En anglais : \"misty, fog, mysterious atmosphere\" (brumeux, brouillard, atmosphère mystérieuse)</span>",
          feerique: "🧚 <strong>Ambiance :</strong> C'est féérique et enchanté !<br/><span class='text-aurora-400 text-xs'>→ En anglais : \"fairy tale setting, enchanted\" (décor de conte de fées, enchanté)</span>",
          mystere: "🔮 <strong>Ambiance :</strong> C'est mystérieux et intrigant !<br/><span class='text-aurora-400 text-xs'>→ En anglais : \"mysterious, shadowy, intriguing\" (mystérieux, ombragé, intrigant)</span>",
        }
        explanations.push(ambianceExplanations[currentKit.ambiance] || '')
      }
      
      if (currentKit.light) {
        const lightExplanations: Record<string, string> = {
          soleil: "🌞 <strong>Lumière :</strong> Éclairé par le soleil doré !<br/><span class='text-aurora-400 text-xs'>→ En anglais : \"golden sunlight\" (lumière dorée du soleil)</span>",
          lune: "🌕 <strong>Lumière :</strong> Baigné de lumière argentée de la lune !<br/><span class='text-aurora-400 text-xs'>→ En anglais : \"moonlit, silver glow\" (éclairé par la lune, lueur argentée)</span>",
          bougie: "🕯️ <strong>Lumière :</strong> Éclairé par des bougies, tout chaleureux !<br/><span class='text-aurora-400 text-xs'>→ En anglais : \"candlelight, warm orange glow\" (lumière de bougie, lueur orange chaude)</span>",
          neon: "💡 <strong>Lumière :</strong> Avec des néons colorés qui brillent !<br/><span class='text-aurora-400 text-xs'>→ En anglais : \"neon lights, cyberpunk\" (lumières néon, style cyberpunk)</span>",
          aurore: "🌌 <strong>Lumière :</strong> Avec une aurore boréale magique !<br/><span class='text-aurora-400 text-xs'>→ En anglais : \"aurora borealis, northern lights\" (aurore boréale, lumières du nord)</span>",
        }
        explanations.push(lightExplanations[currentKit.light] || '')
      }
      
      if (currentKit.format) {
        const formatExplanations: Record<string, string> = {
          portrait: "📐 <strong>Format :</strong> Image verticale (comme un portrait ou une page de livre)",
          paysage: "🖼️ <strong>Format :</strong> Image horizontale (comme un écran de cinéma)",
          carre: "⬜ <strong>Format :</strong> Image carrée (comme une photo Instagram)",
        }
        explanations.push(formatExplanations[currentKit.format] || '')
      }
    }
    
    return explanations.filter(e => e).join('\n')
  }
  
  // 🎨 Génération directe via fal.ai (niveaux 1-2)
  const locale = useLocale()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAsset, setGeneratedAsset] = useState<{ url: string; type: 'image' | 'video' } | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null)
  const [showImagePicker, setShowImagePicker] = useState(false)

  // Satisfaction flow state
  const [satisfactionAnswer, setSatisfactionAnswer] = useState<'yes' | 'no' | null>(null)
  const [disappointmentText, setDisappointmentText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)

  // Reset satisfaction when generating new image
  useEffect(() => {
    if (isGenerating) {
      setSatisfactionAnswer(null)
      setDisappointmentText('')
      setAnalysisResult(null)
    }
  }, [isGenerating])

  // "Help me understand" — AI analyzes gap between prompt and desired result
  const handleAnalyzePrompt = async () => {
    if (!disappointmentText || !currentKit?.subject) return
    setIsAnalyzing(true)
    setAnalysisResult(null)
    try {
      const childPrompt = currentKit.subject

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: locale === 'fr'
            ? `L'enfant a écrit ce prompt pour générer une image : "${childPrompt}"\nCe qui la déçoit dans le résultat : "${disappointmentText}"\n\nExplique-lui simplement pourquoi son prompt a pu donner un résultat différent de ce qu'elle imaginait. Dis-lui ce qu'elle pourrait changer dans sa description pour se rapprocher de ce qu'elle veut. Ne propose PAS d'idées créatives — explique seulement le lien entre les mots du prompt et le résultat visuel.`
            : locale === 'en'
            ? `The child wrote this prompt to generate an image: "${childPrompt}"\nWhat disappoints her about the result: "${disappointmentText}"\n\nExplain simply why her prompt may have produced a different result from what she imagined. Tell her what she could change in her description to get closer to what she wants. Do NOT suggest creative ideas — only explain the link between the prompt words and the visual result.`
            : `Ребёнок написал этот промпт для генерации изображения: "${childPrompt}"\nЧто её разочаровало в результате: "${disappointmentText}"\n\nОбъясни просто, почему её промпт мог дать результат, отличный от того, что она представляла. Скажи, что она может изменить в описании, чтобы приблизиться к желаемому. НЕ предлагай творческих идей — только объясни связь между словами промпта и визуальным результатом.`,
          context: 'studio',
          locale,
          aiName: useAppStore.getState().aiName,
          userName: useAppStore.getState().userName,
          studioContext: { type: currentCreationType || 'image' },
        }),
      })
      if (!response.ok) throw new Error('API error')
      const data = await response.json()
      setAnalysisResult(data.text || data.response || 'No response')
    } catch (error) {
      console.error('Erreur analyse:', error)
      setAnalysisResult(locale === 'fr' ? "Désolé, je n'ai pas pu analyser. Réessaie !" : locale === 'en' ? "Sorry, I couldn't analyze. Try again!" : "Извини, не смог проанализировать. Попробуй ещё раз!")
    } finally {
      setIsAnalyzing(false)
    }
  }
  const [isSavingToCloud, setIsSavingToCloud] = useState(false) // Pour l'upload permanent (Supabase/R2)
  
  // All users go through fal.ai playground (no level gating)
  const useDirectGeneration = false
  
  // Réinitialiser la validation quand le prompt change
  useEffect(() => {
    setHasReadPrompt(false)
  }, [currentKit?.generatedPrompt])
  
  // NOTE: Le useEffect pour valider 'review_prompt' est défini plus bas, après la variable 'complete'
  
  // Fonction de génération via fal.ai avec polling pour éviter timeout Netlify
  const handleDirectGenerate = async () => {
    // 'complete' sera vérifié via le bouton disabled
    if (!currentKit || isGenerating) return

    setIsGenerating(true)
    setGenerationError(null)
    setGeneratedAsset(null)

    try {
      const endpoint = '/api/ai/image'

      const formatMap: Record<string, string> = {
        portrait: '3:4',
        paysage: '16:9',
        carre: '1:1',
      }

      // Get profile ID for credit check
      const profileId = useAuthStore.getState().profile?.id

      const requestBody = {
        description: currentKit.subject,
        aspectRatio: formatMap[currentKit.format || 'portrait'] || '3:4',
        prompt: currentKit.subject, // Prompt brut de l'enfant, tel quel
        profileId, // For credit deduction
      }
      
      console.log('🚀 Envoi requête génération:', {
        endpoint,
        requestBody,
        timestamp: new Date().toISOString(),
      })
      
      const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
      
      console.log('📥 Réponse reçue:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
      })
      
      // Parser la réponse en gérant les erreurs HTML
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Erreur parsing JSON:', parseError)
        throw new Error('Erreur serveur - réessaie dans quelques secondes')
      }
      
      if (!response.ok) {
        if (data.code === 'INSUFFICIENT_CREDITS') {
          throw new Error(tPublish('creditsShop.insufficientCredits') || 'Plus de crédits IA disponibles')
        }
        throw new Error(data.error || 'Erreur de génération')
      }

      // Update local credit balance after successful generation
      if (data.newBalance !== undefined) {
        const currentProfile = useAuthStore.getState().profile
        if (currentProfile) {
          useAuthStore.setState({
            profile: { ...currentProfile, credit_balance: data.newBalance } as any
          })
        }
      }

      console.log('📦 Données reçues du serveur:', JSON.stringify(data, null, 2))

      // 🔄 POLLING : Si on reçoit un jobId, on doit poll jusqu'à completion
      if (data.status === 'pending' && data.jobId) {
        console.log('⏳ Job en attente, démarrage du polling...', data.jobId)

        const maxPolls = 60 // 60 x 2s = 2 min
        const pollInterval = 2000

        for (let i = 0; i < maxPolls; i++) {
          await new Promise(resolve => setTimeout(resolve, pollInterval))

          const statusUrl = `/api/ai/image?jobId=${encodeURIComponent(data.jobId)}&model=${encodeURIComponent(data.model || 'nano-banana')}`

          console.log(`🔍 Poll ${i + 1}/${maxPolls}...`)

          const statusResponse = await fetch(statusUrl)
          const statusData = await statusResponse.json()

          console.log('📊 Status:', statusData.status)

          if (statusData.status === 'completed' && statusData.imageUrl) {
            data = statusData
            break
          }

          if (statusData.status === 'failed') {
            throw new Error(statusData.error || 'La génération a échoué')
          }
        }

        if (data.status !== 'completed') {
          throw new Error('Timeout - la génération prend trop de temps')
        }
      }

      const assetUrl = data.imageUrl

      if (!assetUrl) {
        throw new Error('Pas d\'URL reçue')
      }

      console.log('✅ Image générée:', assetUrl)
      setGeneratedAsset({ url: assetUrl, type: 'image' })

      const assetName = (currentKit.subject?.substring(0, 30) || 'Image') + '...'

      const assetId = addImportedAsset({
        name: assetName,
        url: assetUrl,
        type: 'image',
        file: null,
        source: 'midjourney',
        promptUsed: currentKit.subject,
        projectId: currentStory?.id,
        isUploading: true,
      })

      // Upload automatique vers Supabase en arrière-plan
      uploadFromUrl(assetUrl, {
        type: 'image',
        source: 'midjourney',
        storyId: currentStory?.id,
      }).then((result) => {
        if (result) {
          updateAsset(assetId, {
            cloudUrl: result.url,
            assetId: result.assetId,
            isUploading: false,
          })
          console.log('☁️ Image sauvegardée dans Supabase:', result.url)
        } else {
          updateAsset(assetId, { isUploading: false, uploadError: 'Upload échoué' })
        }
      }).catch((err) => {
        console.error('❌ Erreur upload Supabase:', err)
        updateAsset(assetId, { isUploading: false, uploadError: err.message })
      })

      } catch (error) {
      console.error('Erreur génération fal.ai:', error)
      setGenerationError(error instanceof Error ? error.message : 'Erreur inconnue')
      } finally {
      setIsGenerating(false)
      }
  }
    
  // 🎬 Génération vidéo via fal.ai Kling
  const handleDirectGenerateVideo = async () => {
    if (!currentKit || isGenerating) return

    setIsGenerating(true)
    setGenerationError(null)
    setGeneratedAsset(null)

    try {
      const requestBody: Record<string, unknown> = {
        prompt: currentKit.subject,
        duration: '5',
        profileId: profile?.id,
      }
      if (referenceImageUrl) {
        requestBody.imageUrl = referenceImageUrl
      }

      console.log('🎬 Envoi requête vidéo:', requestBody)

      const response = await fetch('/api/ai/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      let data = await response.json()

      if (!response.ok) {
        if (data.code === 'INSUFFICIENT_CREDITS') {
          setGenerationError(tPublish('creditsShop.insufficientCredits'))
          setIsGenerating(false)
          return
        }
        throw new Error(data.error || 'Erreur de génération vidéo')
      }

      // Update credit balance
      if (data.newBalance !== undefined) {
        const currentProfile = useAuthStore.getState().profile
        if (currentProfile) {
          useAuthStore.setState({
            profile: { ...currentProfile, credit_balance: data.newBalance } as any
          })
        }
      }

      // Polling pour attendre la completion
      if (data.status === 'pending' && data.jobId) {
        console.log('⏳ Job vidéo en attente, polling...', data.jobId)

        const maxPolls = 120 // 120 x 3s = 6 min (vidéo prend plus longtemps)
        const pollInterval = 3000

        for (let i = 0; i < maxPolls; i++) {
          await new Promise(resolve => setTimeout(resolve, pollInterval))

          const statusUrl = `/api/ai/video?jobId=${encodeURIComponent(data.jobId)}&hasImage=${!!referenceImageUrl}`
          const statusResponse = await fetch(statusUrl)
          const statusData = await statusResponse.json()

          console.log(`🔍 Poll vidéo ${i + 1}/${maxPolls}:`, statusData.status)

          if (statusData.status === 'completed' && statusData.videoUrl) {
            data = statusData
            break
          }

          if (statusData.status === 'failed') {
            // Rembourser les crédits vidéo
            if (profile?.id) {
              fetch('/api/ai/refund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId: profile.id, amount: 3, reason: 'refund_failed_video' }),
              }).then(res => res.json()).then(d => {
                if (d.newBalance !== undefined) {
                  const p = useAuthStore.getState().profile
                  if (p) useAuthStore.setState({ profile: { ...p, credit_balance: d.newBalance } as any })
                }
              }).catch(() => {})
            }
            throw new Error(statusData.error || 'La génération vidéo a échoué')
          }
        }

        if (data.status !== 'completed') {
          // Rembourser les crédits vidéo (timeout)
          if (profile?.id) {
            fetch('/api/ai/refund', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profileId: profile.id, amount: 3, reason: 'refund_timeout_video' }),
            }).then(res => res.json()).then(d => {
              if (d.newBalance !== undefined) {
                const p = useAuthStore.getState().profile
                if (p) useAuthStore.setState({ profile: { ...p, credit_balance: d.newBalance } as any })
              }
            }).catch(() => {})
          }
          throw new Error('Timeout - la génération vidéo prend trop de temps')
        }
      }

      const videoUrl = data.videoUrl
      if (!videoUrl) {
        throw new Error('Pas d\'URL vidéo reçue')
      }

      console.log('✅ Vidéo générée:', videoUrl)
      setGeneratedAsset({ url: videoUrl, type: 'video' })

      const assetName = (currentKit.subject?.substring(0, 30) || 'Vidéo') + '...'

      const videoAssetId = addImportedAsset({
        name: assetName,
        url: videoUrl,
        type: 'video',
        file: null,
        source: 'midjourney',
        promptUsed: currentKit.subject,
        projectId: currentStory?.id,
        isUploading: true,
      })

      // Upload automatique vers le cloud (R2 pour vidéos) en arrière-plan
      uploadFromUrl(videoUrl, {
        type: 'video',
        source: 'midjourney',
        storyId: currentStory?.id,
      }).then((result) => {
        if (result) {
          updateAsset(videoAssetId, {
            cloudUrl: result.url,
            assetId: result.assetId,
            isUploading: false,
          })
          console.log('☁️ Vidéo sauvegardée dans le cloud:', result.url)
        } else {
          updateAsset(videoAssetId, { isUploading: false, uploadError: 'Upload échoué' })
        }
      }).catch((err) => {
        console.error('❌ Erreur upload cloud:', err)
        updateAsset(videoAssetId, { isUploading: false, uploadError: err.message })
      })
    } catch (error) {
      console.error('Erreur génération vidéo:', error)
      setGenerationError(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setIsGenerating(false)
    }
  }

  // Dispatch vers image ou vidéo
  const handleGenerate = () => {
    if (currentCreationType === 'video') {
      handleDirectGenerateVideo()
    } else {
      handleDirectGenerate()
    }
  }

  // 🛡️ La modération est gérée par l'IA-Amie dans le chat (pas d'API séparée)
  
  // No level gating — all features always available
  const isAdvancedLevel = true
  const baseCompleteness = checkKitCompleteness()

  const isExpertLevel = true
  
  const advancedDetection = useMemo(() => {
    if (!isAdvancedLevel || !currentKit?.subject) {
      return { hasStyle: false, hasAmbiance: false, hasDetails: false, hasFormat: false, hasEnoughText: false }
    }
    const fullText = (currentKit.subject + ' ' + (currentKit.subjectDetails || '') + ' ' + (currentKit.additionalNotes || '')).toLowerCase()
    const hasStyle = STYLE_KEYWORDS.some(kw => fullText.includes(kw))
    const hasAmbiance = AMBIANCE_KEYWORDS.some(kw => fullText.includes(kw))
    const hasDetails = DETAIL_KEYWORDS.some(kw => fullText.includes(kw))
    const hasFormat = FORMAT_KEYWORDS.some(kw => fullText.includes(kw))
    const hasEnoughText = fullText.length >= 20
    return { hasStyle, hasAmbiance, hasDetails, hasFormat, hasEnoughText }
  }, [isAdvancedLevel, currentKit?.subject, currentKit?.subjectDetails, currentKit?.additionalNotes])
  
  // Pour les niveaux avancés : description longue + mots-clés
  // Niveau 4 : style + ambiance requis
  // Niveau 5 : style + ambiance + détails requis
  const isImageCreation = currentCreationType === 'image'
  
  // Vibe coding: prompt is complete when child has written something
  const complete = (currentKit?.subject?.length || 0) >= 3

  // No missing elements indicator — child writes freely
  const missing: string[] = []
  
  // Removed: auto-completion of review_prompt step
  
  // Refs pour tracker les changements
  const prevSubjectRef = useRef('')
  const prevStyleRef = useRef<StyleType | null>(null)
  const prevAmbianceRef = useRef<AmbianceType | null>(null)
  
  // All sections always visible — no gating by AI validation
  const [showNextSections] = useState(true)
  
  // État pour les champs validés (déplacé ici pour être disponible dans les useEffect)
  const [validatedFields, setValidatedFields] = useState<{
    subject: boolean
    details: boolean
    notes: boolean
    action: boolean
  }>({ subject: false, details: false, notes: false, action: false })
  
  // Détection par mots-clés pour niveaux 3+ (exposé pour l'IA)
  const [detectedElements, setDetectedElements] = useState<{
    hasStyle: boolean
    hasAmbiance: boolean
    hasDetails: boolean
    hasFormat: boolean
    hasMovement: boolean
    hasRhythm: boolean
    detectedStyle: string[]
    detectedAmbiance: string[]
    detectedDetails: string[]
    detectedFormat: string[]
    detectedMovement: string[]
    detectedRhythm: string[]
  }>({
    hasStyle: false,
    hasAmbiance: false,
    hasDetails: false,
    hasFormat: false,
    hasMovement: false,
    hasRhythm: false,
    detectedStyle: [],
    detectedAmbiance: [],
    detectedDetails: [],
    detectedFormat: [],
    detectedMovement: [],
    detectedRhythm: [],
  })
  
  // Sections always visible — removed step gating

  // Removed: AI validation of text fields — vibe coding, child writes freely
  
  // Removed: field invalidation on text change — no step tracking

  // Removed: all step completion tracking effects — no pedagogy

  // Copier le prompt
  const handleCopyPrompt = async () => {
    if (!currentKit?.generatedPrompt) return
    
    try {
      await navigator.clipboard.writeText(currentKit.generatedPrompt)
      setCopied(true)

      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erreur copie:', err)
    }
  }

  const handleOpenTool = () => {
    window.open('https://fal.ai/models/fal-ai/flux-pro/v1.1/playground', '_blank')
  }

  // Keyword detection (kept for UI feedback, no step completion)
  useEffect(() => {
    if (!currentKit) return

    const detected = detectElementsInText(
      currentKit.subject + ' ' + (currentKit.subjectDetails || ''),
      currentCreationType || 'image'
    )
    setDetectedElements(detected)
  }, [currentKit?.subject, currentKit?.subjectDetails, currentCreationType])

  if (!currentKit) return null

  return (
    <div className="space-y-6">
      {/* Section Sujet + Générer */}
      {(
      <Highlightable id="studio-prompt-input">
      <motion.section
        className="glass rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Wand2 className="w-5 h-5 text-aurora-400" />
          <h3 className="font-semibold text-white">
            {t('promptBuilderUI.whatDoYouWantToCreate')}
          </h3>
        </div>

        <textarea
          value={currentKit.subject}
          onChange={(e) => updateKit({ subject: e.target.value })}
          placeholder={currentCreationType === 'video' ? t('promptBuilderUI.describeVideoPlaceholder') : t('promptBuilderUI.describePlaceholder')}
          className="w-full h-28 resize-none rounded-xl p-4 text-white placeholder:text-midnight-400 bg-midnight-900/50 focus:ring-2 focus:ring-aurora-500/50 focus:outline-none transition-all"
          data-mentor-target="studio-subject"
        />

        {/* Image de référence — uniquement pour les vidéos */}
        {currentCreationType === 'video' && (
          <div className="mt-4">
            <label className="text-sm text-midnight-300 mb-2 block">
              {t('promptBuilderUI.referenceImage')}
            </label>
            {referenceImageUrl ? (
              <div className="flex gap-4 items-start">
                {/* Image sélectionnée */}
                <div className="relative flex-shrink-0">
                  <img
                    src={referenceImageUrl}
                    alt="Reference"
                    className="w-32 h-32 object-cover rounded-xl border-2 border-aurora-500/30"
                  />
                  <button
                    onClick={() => setReferenceImageUrl(null)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    x
                  </button>
                </div>
                {/* Description de la scène */}
                <div className="flex-1 min-w-0">
                  <label className="text-xs text-midnight-400 mb-1 block">
                    {t('promptBuilderUI.describeScene') || 'Décris la scène à animer'}
                  </label>
                  <textarea
                    value={currentKit.subject}
                    onChange={(e) => updateKit({ subject: e.target.value })}
                    placeholder={t('promptBuilderUI.describeVideoPlaceholder')}
                    className="w-full h-24 resize-none rounded-xl p-3 text-sm text-white placeholder:text-midnight-500 bg-midnight-900/50 border border-midnight-700/50 focus:border-aurora-500/50 focus:ring-1 focus:ring-aurora-500/30 focus:outline-none transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowImagePicker(!showImagePicker)}
                  className="px-4 py-2 rounded-xl bg-midnight-800/50 text-midnight-200 hover:bg-midnight-700/50 hover:text-white transition-colors text-sm"
                >
                  {t('promptBuilderUI.chooseFromCreations')}
                </button>
              </div>
            )}
            {showImagePicker && importedAssets.filter(a => a.type === 'image').length > 0 && (
              <div className="mt-3 grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-64 overflow-y-auto p-2 rounded-xl bg-midnight-900/50">
                {importedAssets.filter(a => a.type === 'image').map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      setReferenceImageUrl(asset.cloudUrl || asset.url)
                      setShowImagePicker(false)
                    }}
                    className="relative aspect-square rounded-xl overflow-hidden border-2 border-midnight-700 hover:border-aurora-500 transition-all"
                  >
                    <img
                      src={getThumbnailUrl(asset.cloudUrl || asset.url, 200)}
                      alt={asset.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement
                        if (!img.dataset.fallback) {
                          img.dataset.fallback = '1'
                          img.src = asset.cloudUrl || asset.url
                        }
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
            {showImagePicker && importedAssets.filter(a => a.type === 'image').length === 0 && (
              <p className="mt-2 text-xs text-midnight-400">
                {t('promptBuilderUI.noImagesYet')}
              </p>
            )}
          </div>
        )}

        {/* Credit counter */}
        {(() => {
          const creditCost = currentCreationType === 'video' ? 3 : 1
          const hasEnough = creditBalance >= creditCost
          return (
            <motion.div
              key={creditBalance}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              className={cn(
                'mt-4 p-4 rounded-xl text-center',
                hasEnough
                  ? 'bg-violet-500/10 border border-violet-500/20'
                  : 'bg-amber-500/10 border border-amber-500/20'
              )}
            >
              {hasEnough ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    <span className="text-2xl font-bold text-white">{creditBalance}</span>
                    <Sparkles className="w-5 h-5 text-violet-400" />
                  </div>
                  <p className="text-sm text-violet-300">
                    {tPublish('creditsShop.creditsRemaining', { count: creditBalance })}
                  </p>
                  {currentCreationType === 'video' && (
                    <p className="mt-2 text-sm text-amber-300 font-medium">
                      {tPublish('creditsShop.videoCost')}
                    </p>
                  )}
                </>
              ) : profile ? (
                <>
                  <p className="text-lg font-semibold text-amber-300 mb-1">{tPublish('creditsShop.noCredits')}</p>
                  {currentCreationType === 'video' && creditBalance > 0 && (
                    <p className="text-sm text-amber-300/70 mb-2">
                      {tPublish('creditsShop.notEnoughForVideo', { cost: 3, balance: creditBalance })}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      useAppStore.getState().setCurrentMode('publish')
                    }}
                    className="px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-400 transition-colors"
                  >
                    {tPublish('creditsShop.buyCredits')}
                  </button>
                </>
              ) : null}
            </motion.div>
          )
        })()}

        <motion.button
          onClick={handleGenerate}
          disabled={isGenerating || !complete || (creditBalance < (currentCreationType === 'video' ? 3 : 1) && !!profile)}
          className={cn(
            'w-full mt-3 flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-lg transition-all',
            isGenerating
              ? 'bg-aurora-500/50 text-white cursor-wait'
              : (!complete || (creditBalance < (currentCreationType === 'video' ? 3 : 1) && !!profile))
                ? 'bg-midnight-700 text-midnight-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-aurora-500 to-dream-500 text-white hover:from-aurora-600 hover:to-dream-600'
          )}
          whileHover={!isGenerating && complete && creditBalance >= (currentCreationType === 'video' ? 3 : 1) ? { scale: 1.02 } : {}}
          whileTap={!isGenerating && complete && creditBalance >= (currentCreationType === 'video' ? 3 : 1) ? { scale: 0.98 } : {}}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              {t('promptBuilderUI.creatingInProgress')}
            </>
          ) : (
            <>
              <Wand2 className="w-6 h-6" />
              {currentCreationType === 'video' ? t('promptBuilderUI.createMyVideo') : t('promptBuilderUI.createMyImage')}
            </>
          )}
        </motion.button>

        {/* Erreur de génération */}
        {generationError && (
          <motion.div
            className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {generationError}
          </motion.div>
        )}

        {/* Résultat généré */}
        {generatedAsset && (
          <motion.div
            className="mt-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="rounded-xl overflow-hidden border-2 border-dream-500/50 max-h-[400px] flex items-center justify-center bg-midnight-800">
              {generatedAsset.type === 'video' ? (
                <video
                  src={generatedAsset.url}
                  controls
                  autoPlay
                  loop
                  muted
                  className="w-full h-auto max-h-[400px] object-contain"
                />
              ) : (
                <img
                  src={generatedAsset.url}
                  alt="Image générée"
                  className="w-full h-auto max-h-[400px] object-contain"
                />
              )}
            </div>

            {/* Satisfaction check — "Does it match what you wanted?" */}
            {!satisfactionAnswer && (
              <div className="mt-4 glass rounded-xl p-4">
                <p className="text-sm text-white font-medium mb-3">
                  {locale === 'fr' ? 'Ça correspond à ce que tu voulais ?' : locale === 'en' ? 'Does it match what you wanted?' : 'Это то, что ты хотела?'}
                </p>
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setSatisfactionAnswer('yes')}
                    className="flex-1 py-3 rounded-xl bg-dream-500/20 text-dream-300 border border-dream-500/30 hover:bg-dream-500/30 font-medium transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {locale === 'fr' ? 'Oui !' : locale === 'en' ? 'Yes!' : 'Да!'}
                  </motion.button>
                  <motion.button
                    onClick={() => setSatisfactionAnswer('no')}
                    className="flex-1 py-3 rounded-xl bg-stardust-500/20 text-stardust-300 border border-stardust-500/30 hover:bg-stardust-500/30 font-medium transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {locale === 'fr' ? 'Non...' : locale === 'en' ? 'No...' : 'Нет...'}
                  </motion.button>
                </div>
              </div>
            )}

            {/* If satisfied → keep/use the image */}
            {satisfactionAnswer === 'yes' && (
              <motion.div
                className="mt-4 glass rounded-xl p-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-dream-300 font-medium mb-3">
                  {locale === 'fr' ? 'Super ! Tu peux utiliser cette image dans ton histoire.' : locale === 'en' ? 'Great! You can use this image in your story.' : 'Отлично! Можешь использовать это изображение в своей истории.'}
                </p>
              </motion.div>
            )}

            {/* If not satisfied → explain what's wrong */}
            {satisfactionAnswer === 'no' && (
              <motion.div
                className="mt-4 glass rounded-xl p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-sm text-stardust-300 font-medium mb-3">
                  {locale === 'fr' ? 'Qu\'est-ce qui ne te plaît pas ?' : locale === 'en' ? "What don't you like about it?" : 'Что тебе не нравится?'}
                </p>
                <textarea
                  value={disappointmentText}
                  onChange={(e) => setDisappointmentText(e.target.value)}
                  placeholder={locale === 'fr' ? 'Explique ce que tu voulais...' : locale === 'en' ? 'Explain what you wanted...' : 'Объясни, что ты хотела...'}
                  className="w-full h-20 resize-none rounded-xl p-3 text-white placeholder:text-midnight-400 bg-midnight-900/50 focus:ring-2 focus:ring-stardust-500/50 focus:outline-none text-sm"
                />

                <div className="flex gap-3 mt-3">
                  {/* Re-generate with new prompt */}
                  <motion.button
                    onClick={() => {
                      setSatisfactionAnswer(null)
                      setGeneratedAsset(null)
                      setDisappointmentText('')
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-aurora-500/20 text-aurora-300 border border-aurora-500/30 hover:bg-aurora-500/30 font-medium text-sm transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {locale === 'fr' ? 'Modifier mon prompt et réessayer' : locale === 'en' ? 'Edit my prompt and retry' : 'Изменить промпт и попробовать снова'}
                  </motion.button>

                  {/* Analyze prompt flaws */}
                  {disappointmentText.length >= 5 && (
                    <motion.button
                      onClick={handleAnalyzePrompt}
                      disabled={isAnalyzing}
                      className="flex-1 py-2.5 rounded-xl bg-stardust-500/20 text-stardust-300 border border-stardust-500/30 hover:bg-stardust-500/30 font-medium text-sm transition-all"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        locale === 'fr' ? 'Aide-moi à comprendre' : locale === 'en' ? 'Help me understand' : 'Помоги мне понять'
                      )}
                    </motion.button>
                  )}
                </div>

                {/* AI analysis result */}
                {analysisResult && (
                  <motion.div
                    className="mt-3 p-3 rounded-xl bg-midnight-800/70 text-sm text-white whitespace-pre-line"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {analysisResult}
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.section>
      </Highlightable>
      )}

      {/* Section Style - VISIBLE SEULEMENT NIVEAU 1-2 (apprentissage) - IMAGES UNIQUEMENT */}
      <AnimatePresence>
        {showStyleButtons && showNextSections && currentCreationType === 'image' && (
          <motion.section
            className={cn(
              "glass rounded-2xl p-6 transition-all",
              !currentKit.style && "ring-2 ring-aurora-500/50 animate-pulse-subtle"
            )}
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <motion.div
                animate={!currentKit.style ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Wand2 className="w-5 h-5 text-aurora-400" />
              </motion.div>
              <h3 className={cn(
                "font-semibold",
                !currentKit.style ? "text-aurora-300" : "text-white"
              )}>
                {!currentKit.style ? `👆 ${t('promptBuilderUI.chooseStylePrompt')}` : t('promptBuilderUI.whatStyle')}
              </h3>
              {currentKit.style && (
                <CheckCircle className="w-4 h-4 text-dream-400 ml-auto" />
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {styleOptions.map((style) => (
                <motion.button
                  key={style.id}
                  onClick={() => updateKit({ style: style.id })}
                  className={cn(
                    'relative p-4 rounded-xl text-center transition-all overflow-hidden',
                    currentKit.style === style.id
                      ? 'ring-2 ring-aurora-500 bg-gradient-to-br ' + style.color
                      : 'bg-midnight-800/50 hover:bg-midnight-700/50'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  data-mentor-target={`studio-style-${style.id}`}
                >
                  <span className="text-2xl block mb-1">{style.emoji}</span>
                  <span className="text-sm font-medium">{t(style.labelKey)}</span>
                  
                  {currentKit.style === style.id && (
                    <motion.div
                      className="absolute inset-0 bg-white/10"
                      layoutId="styleSelector"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      
      {/* Removed: level advanced message */}

      {/* Section Ambiance - VISIBLE SEULEMENT NIVEAU 1-3 - IMAGES UNIQUEMENT */}
      <AnimatePresence>
        {showAmbianceButtons && currentKit.style && currentCreationType === 'image' && (
          <motion.section
            className={cn(
              "glass rounded-2xl p-6 transition-all",
              !currentKit.ambiance && "ring-2 ring-sky-500/50 animate-pulse-subtle"
            )}
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <motion.div
                animate={!currentKit.ambiance ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <CloudSun className="w-5 h-5 text-sky-400" />
              </motion.div>
              <h3 className={cn(
                "font-semibold",
                !currentKit.ambiance ? "text-sky-300" : "text-white"
              )}>
                {!currentKit.ambiance ? `👆 ${t('promptBuilderUI.chooseMoodPrompt')}` : t('promptBuilderUI.whatMood')}
              </h3>
              {currentKit.ambiance && (
                <CheckCircle className="w-4 h-4 text-dream-400 ml-auto" />
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {ambianceOptions.map((ambiance) => (
                <motion.button
                  key={ambiance.id}
                  onClick={() => updateKit({ ambiance: ambiance.id })}
                  className={cn(
                    'relative p-4 rounded-xl text-center transition-all overflow-hidden flex flex-col items-center gap-2',
                    currentKit.ambiance === ambiance.id
                      ? 'ring-2 ring-aurora-500 bg-gradient-to-br ' + ambiance.color + ' text-white'
                      : 'bg-midnight-800/50 hover:bg-midnight-700/50'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  data-mentor-target={`studio-ambiance-${ambiance.id}`}
                >
                  {ambiance.icon}
                  <span className="text-sm font-medium">{t(ambiance.labelKey)}</span>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Section Détails - après l'ambiance - IMAGES UNIQUEMENT */}
      <AnimatePresence>
        {showDetailsSection && currentKit.ambiance && currentCreationType === 'image' && (
          <motion.section
            className="glass rounded-2xl p-6"
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-dream-400" />
              <h3 className="font-semibold text-white">✨ {t('promptBuilderUI.addDetails')}</h3>
              {currentKit.subjectDetails && currentKit.subjectDetails.length >= 10 && (
                <CheckCircle className="w-4 h-4 text-dream-400 ml-auto" />
              )}
            </div>
            
            <p className="text-sm text-midnight-300 mb-3">{t('promptBuilderUI.addColorsEtc')}</p>
            <input
              type="text"
              value={currentKit.subjectDetails}
              onChange={(e) => {
                updateKit({ subjectDetails: e.target.value })
                if (validatedFields.details) {
                  setValidatedFields(prev => ({ ...prev, details: false }))
                }
              }}
              placeholder={t('promptBuilderUI.detailsPlaceholder')}
              className={cn(
                "w-full rounded-xl px-4 py-3 text-white placeholder:text-midnight-400",
                currentKit.subjectDetails && currentKit.subjectDetails.length >= 10
                  ? "bg-dream-500/10 border border-dream-500/30"
                  : "bg-midnight-900/50"
              )}
              data-mentor-target="studio-details"
            />
            {/* Removed: validate/validation UI — vibe coding */}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Section Lumière - après les détails - IMAGES UNIQUEMENT */}
      <AnimatePresence>
        {showLightOptions && currentKit.ambiance && currentCreationType === 'image' && (
          <motion.section
            className="glass rounded-2xl p-6"
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-5 h-5 text-stardust-400" />
              <h3 className="font-semibold text-white">☀️ {t('promptBuilderUI.whatLight')}</h3>
              {currentKit.light && (
                <CheckCircle className="w-4 h-4 text-dream-400 ml-auto" />
              )}
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2">
              {lightOptions.map((light) => (
                <motion.button
                  key={light.id}
                  onClick={() => updateKit({ 
                    light: currentKit.light === light.id ? null : light.id 
                  })}
                  className={cn(
                    'flex-shrink-0 px-4 py-3 rounded-xl flex items-center gap-2 transition-all',
                    currentKit.light === light.id
                      ? 'bg-gradient-to-r ' + light.color + ' text-white'
                      : 'bg-midnight-800/50 hover:bg-midnight-700/50'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {light.icon}
                  <span className="text-sm font-medium">{t(light.labelKey)}</span>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Section Format - TOUJOURS VISIBLE pour les images (livre vs montage) */}
      <AnimatePresence>
        {showFormatButtons && currentKit.style && (
          <motion.section
            className="glass rounded-2xl p-6"
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📐</span>
              <h3 className="font-semibold text-white">{t('promptBuilderUI.whatShape')}</h3>
              {currentKit.format && (
                <CheckCircle className="w-4 h-4 text-dream-400 ml-auto" />
              )}
            </div>
            
            <p className="text-sm text-midnight-300 mb-4">
              {t('promptBuilderUI.whatShapeSubtitle')}
            </p>
            
            <div className="grid grid-cols-3 gap-3">
              {formatOptions.map((format) => (
                <motion.button
                  key={format.id}
                  onClick={() => updateKit({ 
                    format: currentKit.format === format.id ? null : format.id 
                  })}
                  className={cn(
                    'p-4 rounded-xl flex flex-col items-center gap-2 transition-all',
                    currentKit.format === format.id
                      ? 'bg-gradient-to-r ' + format.color + ' text-white ring-2 ring-white/30'
                      : 'bg-midnight-800/50 hover:bg-midnight-700/50'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-3xl">{format.emoji}</span>
                  <span className="text-sm font-medium">{t(`promptBuilderUI.formats.${format.id}.label`)}</span>
                  <span className="text-xs opacity-70">{t(`promptBuilderUI.formats.${format.id}.description`)}</span>
                </motion.button>
              ))}
            </div>
            
          </motion.section>
        )}
      </AnimatePresence>

    </div>
  )
}

