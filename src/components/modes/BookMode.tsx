'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
} from 'lucide-react'
import { useAppStore, type Story } from '@/store/useAppStore'
import { useTTS } from '@/hooks/useTTS'
import { STORY_TEMPLATES, type StoryStructure } from '@/lib/ai/prompting-pedagogy'
import { cn } from '@/lib/utils'
import { MediaPicker } from '@/components/editor/MediaPicker'

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
  lineSpacing: 'tight' | 'normal' | 'relaxed'
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
}

// Couleurs de page disponibles
type PageColor = 'cream' | 'white' | 'aged' | 'parchment' | 'blue' | 'pink' | 'mint' | 'lavender' | 'peach' | 'sky'

const PAGE_COLORS: { id: PageColor; name: string; bg: string; lines: string }[] = [
  { id: 'cream', name: 'Crème', bg: 'bg-amber-50', lines: 'rgba(139, 115, 85, 0.15)' },
  { id: 'white', name: 'Blanc', bg: 'bg-white', lines: 'rgba(100, 100, 100, 0.12)' },
  { id: 'aged', name: 'Vieilli', bg: 'bg-amber-100', lines: 'rgba(139, 90, 43, 0.2)' },
  { id: 'parchment', name: 'Parchemin', bg: 'bg-orange-50', lines: 'rgba(180, 120, 60, 0.15)' },
  { id: 'blue', name: 'Bleu ciel', bg: 'bg-blue-50', lines: 'rgba(59, 130, 246, 0.15)' },
  { id: 'pink', name: 'Rose', bg: 'bg-pink-50', lines: 'rgba(236, 72, 153, 0.12)' },
  { id: 'mint', name: 'Menthe', bg: 'bg-emerald-50', lines: 'rgba(16, 185, 129, 0.12)' },
  { id: 'lavender', name: 'Lavande', bg: 'bg-purple-50', lines: 'rgba(139, 92, 246, 0.12)' },
  { id: 'peach', name: 'Pêche', bg: 'bg-orange-100', lines: 'rgba(251, 146, 60, 0.15)' },
  { id: 'sky', name: 'Ciel', bg: 'bg-sky-50', lines: 'rgba(14, 165, 233, 0.12)' },
]

// Interface pour le fond de page (image ou vidéo)
interface BackgroundMedia {
  url: string
  type: MediaType  // 'image' ou 'video'
  opacity: number  // 0.1 à 1
}

interface StoryPageLocal {
  id: string
  title: string
  content: string
  // Support multi-médias (images et vidéos)
  images?: PageMedia[]
  // Fond de page (image ou vidéo avec opacité)
  backgroundMedia?: BackgroundMedia
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
    name: 'Écriture', 
    family: "'Caveat', cursive",
    preview: 'Aa',
    description: 'Manuscrite'
  },
  { 
    id: 'tale', 
    name: 'Conte', 
    family: "'Cormorant Garamond', serif",
    preview: 'Aa',
    description: 'Classique'
  },
  { 
    id: 'child', 
    name: 'Enfant', 
    family: "'Patrick Hand', cursive",
    preview: 'Aa',
    description: 'Ludique'
  },
  { 
    id: 'book', 
    name: 'Livre', 
    family: "'Merriweather', serif",
    preview: 'Aa',
    description: 'Élégant'
  },
  { 
    id: 'comic', 
    name: 'BD', 
    family: "'Comic Neue', cursive",
    preview: 'Aa',
    description: 'Amusant'
  },
  { 
    id: 'magic', 
    name: 'Magie', 
    family: "'Spectral', serif",
    preview: 'Aa',
    description: 'Mystérieux'
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
    
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      console.log('Speech Recognition not supported in this browser')
      setIsSupported(false)
      return
    }
    
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

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('')
      recognitionRef.current.start()
      setIsListening(true)
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

const LINE_SPACINGS = {
  tight: { label: 'Serré', value: '1.4' },
  normal: { label: 'Normal', value: '1.7' },
  relaxed: { label: 'Aéré', value: '2.2' },
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
  onPositionChange: (position: ImagePosition) => void
  onStyleChange: (style: ImageStyle) => void
  onFrameChange: (frame: FrameStyle) => void
  onDelete: () => void
  onBringForward?: () => void
  onSendBackward?: () => void
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

function DraggableMedia({ mediaId, src, mediaType, position, imageStyle, frameStyle, zIndex, onPositionChange, onStyleChange, onFrameChange, onDelete, onBringForward, onSendBackward, containerRef, totalMedia = 1 }: DraggableMediaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [resizeCorner, setResizeCorner] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(false)
  const [showFrameMenu, setShowFrameMenu] = useState(false)
  const [showStyleMenu, setShowStyleMenu] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)  // Pour les vidéos
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
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
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

        {/* Bouton Play/Pause pour vidéos */}
        {mediaType === 'video' && showControls && !showStyleMenu && (
          <button
            onClick={toggleVideo}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-20"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
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
              title="Envoyer derrière"
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
              title="Mettre devant"
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
          title="Filtres"
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
          title="Cadres"
        >
          <Frame className="w-4 h-4" />
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
            title="Faire glisser pour pivoter"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </div>
          {/* Ligne verticale */}
          <div className="w-0.5 h-3 bg-emerald-500" />
        </div>
      )}

      {/* Menu de sélection de style (filtres) - taille fixe */}
      {showStyleMenu && (
        <div 
          className="fixed bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-50 min-w-[240px]"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-sm font-medium text-gray-600 px-2 pb-2 border-b border-gray-100 mb-2">
            🎨 Filtres
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
                title={style.name}
              >
                <span className="text-xl">{style.emoji}</span>
                <span className="text-xs mt-1 whitespace-nowrap">{style.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu de sélection de cadre - taille fixe */}
      {showFrameMenu && (
        <div 
          className="fixed bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-50 min-w-[280px]"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-sm font-medium text-gray-600 px-2 pb-2 border-b border-gray-100 mb-2">
            🖼️ Cadres
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
                title={frame.name}
              >
                <span className="text-xl">{frame.emoji}</span>
                <span className="text-xs mt-1 whitespace-nowrap">{frame.name}</span>
              </button>
            ))}
          </div>
        </div>
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
// COMPOSANT : Onglet de page
// ============================================================================

interface PageTabProps {
  page: StoryPageLocal
  index: number
  isActive: boolean
  chapter?: Chapter
  onClick: () => void
  onDelete?: () => void
  canDelete: boolean
}

function PageTab({ page, index, isActive, chapter, onClick, onDelete, canDelete }: PageTabProps) {
  const hasContent = page.content.length > 0
  const hasImage = !!page.image || (page.images && page.images.length > 0)
  
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative flex flex-col gap-0.5 px-3 py-2 rounded-t-xl transition-all min-w-[90px] max-w-[140px]',
        'border-t border-l border-r',
        isActive 
          ? 'bg-midnight-800 border-aurora-500/30 text-white -mb-px z-10' 
          : 'bg-midnight-900/50 border-midnight-700/30 text-midnight-400 hover:text-white hover:bg-midnight-800/50'
      )}
      style={{
        borderTopColor: chapter ? chapter.color : undefined,
        borderTopWidth: chapter ? '3px' : '1px'
      }}
      whileHover={{ y: -2 }}
      layout
    >
      {/* Chapitre si assigné */}
      {chapter && (
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
        {hasContent && <div className="w-1.5 h-1.5 rounded-full bg-aurora-400" title="Texte" />}
        {hasImage && <div className="w-1.5 h-1.5 rounded-full bg-stardust-400" title="Image" />}
        {!hasContent && !hasImage && <div className="w-1.5 h-1.5 rounded-full bg-midnight-600" />}
      </div>
      
        <span className="truncate text-xs">
        {page.title || `Page ${index + 1}`}
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
          <h2 className="text-xl font-display text-white">Vue d'ensemble</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-midnight-800 text-midnight-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {pages.map((page, index) => (
            <motion.button
              key={page.id}
              onClick={() => {
                onPageSelect(index)
                onClose()
              }}
              className={cn(
                'aspect-[3/4] rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all',
                'border-2',
                currentPage === index
                  ? 'border-aurora-500 bg-aurora-500/10'
                  : 'border-midnight-700 bg-midnight-800/50 hover:border-midnight-600'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
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
                currentPage === index ? 'text-aurora-300' : 'text-midnight-400'
              )}>
                {page.title || `Page ${index + 1}`}
              </span>
            </motion.button>
          ))}
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
  { type: 'intro' as const, label: 'Introduction', color: '#22c55e', icon: '📖' },
  { type: 'development' as const, label: 'Développement', color: '#3b82f6', icon: '📝' },
  { type: 'climax' as const, label: 'Moment clé', color: '#f97316', icon: '⚡' },
  { type: 'conclusion' as const, label: 'Conclusion', color: '#8b5cf6', icon: '🎬' },
  { type: 'custom' as const, label: 'Personnalisé', color: '#ec4899', icon: '✨' },
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
            <h2 className="text-xl font-display text-white">Structure de l'histoire</h2>
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
          <p className="text-sm text-midnight-400 mb-3">Progression de l'histoire</p>
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
                title={`Non assignées (${unassignedPages.length} pages)`}
              />
            )}
          </div>
          <div className="flex justify-between mt-2 text-xs text-midnight-500">
            <span>Début</span>
            <span>{pages.length} pages au total</span>
            <span>Fin</span>
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
                    ({chapterPages.length} {chapterPages.length > 1 ? 'pages' : 'page'})
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
                  Glisse des pages ici ou clique sur une page non assignée
                </p>
              )}
            </div>
          ))}

          {/* Pages non assignées */}
          {unassignedPages.length > 0 && (
            <div className="rounded-xl border border-midnight-700/50 border-dashed overflow-hidden">
              <div className="flex items-center gap-2 p-3 bg-midnight-800/30">
                <FileText className="w-4 h-4 text-midnight-500" />
                <span className="text-midnight-400">Pages non assignées</span>
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
                          title="Assigner à un chapitre"
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
                  placeholder="Nom du chapitre..."
                  className="flex-1 bg-midnight-900/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-aurora-500/30"
                  autoFocus
                />
                <button
                  onClick={handleAddChapter}
                  disabled={!newChapterTitle.trim()}
                  className="px-4 py-2 rounded-lg bg-aurora-500 text-white text-sm font-medium disabled:opacity-50"
                >
                  Ajouter
                </button>
                <button
                  onClick={() => setShowAddChapter(false)}
                  className="px-3 py-2 rounded-lg bg-midnight-700 text-midnight-300 text-sm"
                >
                  Annuler
                </button>
              </div>
              <div className="flex gap-2">
                {CHAPTER_TYPES.map((type) => (
                  <button
                    key={type.type}
                    onClick={() => {
                      setSelectedType(type.type)
                      if (!newChapterTitle) setNewChapterTitle(type.label)
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
                    <span>{type.label}</span>
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
              <span>Ajouter un chapitre</span>
            </button>
          )}
        </div>

        {/* Suggestions de structure */}
        {chapters.length === 0 && (
          <div className="mt-6 p-4 bg-aurora-500/10 rounded-xl border border-aurora-500/20">
            <p className="text-sm text-aurora-300 mb-3">💡 Suggestions de structure</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  CHAPTER_TYPES.slice(0, 4).forEach((type, i) => {
                    setTimeout(() => {
                      onAddChapter({
                        id: Date.now().toString() + i,
                        title: type.label,
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

interface FormatBarProps {
  style: TextStyle
  onStyleChange: (style: TextStyle) => void
  showLines?: boolean
  onToggleLines?: () => void
  bookColor?: PageColor
  onBookColorChange?: (color: PageColor) => void
  // Fond de page
  backgroundMedia?: BackgroundMedia
  onBackgroundAdd?: () => void
  onBackgroundOpacityChange?: (opacity: number) => void
  onBackgroundRemove?: () => void
}

function FormatBar({ style, onStyleChange, showLines = true, onToggleLines, bookColor = 'cream', onBookColorChange, backgroundMedia, onBackgroundAdd, onBackgroundOpacityChange, onBackgroundRemove }: FormatBarProps) {
  const [showFonts, setShowFonts] = useState(false)
  const [showFontSizes, setShowFontSizes] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const [showPageColors, setShowPageColors] = useState(false)
  const [showBackgroundMenu, setShowBackgroundMenu] = useState(false)
  const [lastUsedColor, setLastUsedColor] = useState('#ef4444')
  const [lastUsedSize, setLastUsedSize] = useState(style.fontSize)
  const [detectedFontFamily, setDetectedFontFamily] = useState(style.fontFamily)
  const isFormattingRef = useRef(false)
  
  // Refs pour éviter les re-renders inutiles
  const lastDetectedSizeRef = useRef(style.fontSize)
  const lastDetectedFontRef = useRef(style.fontFamily)
  
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
  
  // Sauvegarder la sélection actuelle (appelé automatiquement sur selectionchange)
  const captureSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      // Vérifier que la sélection est dans une zone contentEditable
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
    // Vérifier d'abord s'il y a une sélection active
    const currentSelection = window.getSelection()
    const hasActiveSelection = currentSelection && currentSelection.rangeCount > 0 && !currentSelection.isCollapsed
    
    if (hasActiveSelection) {
      // Sélection déjà active, appliquer directement
      formatFn()
    } else {
      // Pas de sélection active, essayer de restaurer
      const { range, text } = savedRangeRef.current
      if (range && text) {
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
  
  // Appliquer une couleur au texte sélectionné
  const applyColor = (color: string) => {
    isFormattingRef.current = true
    document.execCommand('foreColor', false, color)
    setLastUsedColor(color)
    setShowColors(false)
    setTimeout(() => { isFormattingRef.current = false }, 50)
  }
  
  // Appliquer une taille de police au texte sélectionné uniquement
  const applyFontSize = (size: number) => {
    const { range, text } = savedRangeRef.current
    if (range && text) {
      // Restaurer la sélection
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
        
        const currentRange = selection.getRangeAt(0)
        
        // Extraire le contenu et nettoyer les tailles existantes
        const fragment = currentRange.extractContents()
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
        currentRange.insertNode(span)
        
        // Re-sélectionner le contenu du span créé
        const newRange = document.createRange()
        newRange.selectNodeContents(span)
        selection.removeAllRanges()
        selection.addRange(newRange)
        
        // Sauvegarder la nouvelle sélection
        savedRangeRef.current = {
          text: span.textContent || '',
          range: newRange.cloneRange()
        }
        
        lastDetectedSizeRef.current = size
        setLastUsedSize(size)
      }
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
    
    if (hasActiveSelection) {
      applyToRange(currentSelection.getRangeAt(0), currentSelection)
    } else {
      // Pas de sélection active, essayer de restaurer
      const { range, text } = savedRangeRef.current
      if (range && text) {
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
          applyToRange(selection.getRangeAt(0), selection)
        }
      }
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
    <div className="flex items-center gap-2 p-2 bg-midnight-900/50 rounded-xl border border-midnight-700/30 flex-wrap">
      {/* Sélecteur de police */}
      <div className="relative">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowFonts(!showFonts)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-midnight-800/50 hover:bg-midnight-800 text-white transition-colors min-w-[120px]"
          title="Police"
        >
          <span style={{ fontFamily: currentFont.family }} className="text-lg">
            {currentFont.preview}
          </span>
          <span className="text-sm text-midnight-300">{currentFont.name}</span>
          <ChevronRight className={cn("w-4 h-4 ml-auto transition-transform", showFonts && "rotate-90")} />
        </button>
        
        <AnimatePresence>
          {showFonts && (
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
                    <p className="text-sm font-medium">{font.name}</p>
                    <p className="text-xs text-midnight-400">{font.description}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Séparateur */}
      <div className="w-px h-6 bg-midnight-700/50" />
      
      {/* Taille */}
      <div className="relative">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowFontSizes(!showFontSizes)}
          className="flex items-center gap-1 px-2 py-1 rounded text-sm hover:bg-midnight-800 text-midnight-300 min-w-[50px] justify-center"
          title="Taille (sélection)"
        >
          <span>{lastUsedSize}</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        
        <AnimatePresence>
          {showFontSizes && (
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
          )}
        </AnimatePresence>
      </div>
      
      
      {/* Gras / Italique */}
      <div className="flex items-center gap-1">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={applyBold}
          className="w-8 h-8 rounded flex items-center justify-center font-bold transition-colors hover:bg-midnight-800 text-midnight-400 hover:text-aurora-300"
          title="Gras"
        >
          B
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={applyItalic}
          className="w-8 h-8 rounded flex items-center justify-center italic transition-colors hover:bg-midnight-800 text-midnight-400 hover:text-aurora-300"
          title="Italique"
        >
          I
        </button>
      </div>
      
      {/* Séparateur */}
      <div className="w-px h-6 bg-midnight-700/50" />
      
      {/* Alignement */}
      <div className="flex items-center gap-1">
        {[
          { id: 'left' as const, icon: AlignLeft },
          { id: 'center' as const, icon: AlignCenter },
          { id: 'right' as const, icon: AlignRight },
        ].map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onStyleChange({ ...style, textAlign: id })}
            className={cn(
              'w-7 h-7 rounded flex items-center justify-center transition-colors',
              style.textAlign === id
                ? 'bg-aurora-500/20 text-aurora-300'
                : 'hover:bg-midnight-800 text-midnight-400'
            )}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
      
      {/* Séparateur */}
      <div className="w-px h-6 bg-midnight-700/50" />
      
      {/* Espaces et saut de ligne */}
      <div className="flex items-center gap-1">
        <div className="flex items-center bg-midnight-800/30 rounded-lg">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertSpaces(-4)}
            className="w-7 h-7 rounded-l-lg flex items-center justify-center text-midnight-400 hover:text-aurora-300 hover:bg-midnight-800 transition-colors"
            title="Retirer des espaces"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-7 flex items-center justify-center text-[10px] text-midnight-300 border-x border-midnight-700/30">
            Tab
          </div>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertSpaces(4)}
            className="w-7 h-7 rounded-r-lg flex items-center justify-center text-midnight-400 hover:text-aurora-300 hover:bg-midnight-800 transition-colors"
            title="Ajouter une tabulation"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
          <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertLineBreak}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-midnight-400 hover:text-aurora-300 hover:bg-midnight-800 transition-colors bg-midnight-800/30"
          title="Saut de ligne"
        >
          <ChevronDown className="w-4 h-4" />
          </button>
          </div>
      
      {/* Séparateur */}
      <div className="w-px h-6 bg-midnight-700/50" />
      
      {/* Couleur */}
      <div className="relative">
          <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowColors(!showColors)}
          className="flex flex-col items-center justify-center w-8 h-8 rounded hover:bg-midnight-800 transition-colors"
          title="Couleur du texte"
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
                  <p className="text-xs text-midnight-400">Couleur du texte</p>
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
      
      {/* Séparateur */}
      <div className="w-px h-6 bg-midnight-700/50" />
      
      {/* Bouton lignes de cahier */}
      {onToggleLines && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggleLines}
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors",
            showLines 
              ? "bg-aurora-500/20 text-aurora-300" 
              : "text-midnight-400 hover:bg-midnight-800"
          )}
          title={showLines ? "Masquer les lignes" : "Afficher les lignes"}
        >
          {/* Icône lignes de cahier */}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="8" x2="20" y2="8" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="16" x2="20" y2="16" />
          </svg>
        </button>
      )}
      
      {/* Sélecteur de couleur du livre */}
      {onBookColorChange && (
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
            title="Couleur des pages"
          >
            <Palette className="w-4 h-4" />
          </button>
          
          {/* Menu de couleurs */}
          <AnimatePresence>
            {showPageColors && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full left-0 mt-2 p-3 bg-midnight-900 rounded-xl border border-midnight-700 shadow-xl z-50 min-w-[200px]"
              >
                <div className="text-xs text-midnight-400 mb-2 font-medium">Couleur du livre</div>
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
                      title={color.name}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      {/* Bouton fond de page */}
      {onBackgroundAdd && (
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
            title="Fond de page"
          >
            <Layers className="w-4 h-4" />
          </button>
          
          {/* Menu fond de page */}
          <AnimatePresence>
            {showBackgroundMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 p-3 bg-midnight-900 rounded-xl border border-midnight-700 shadow-xl z-50 min-w-[220px]"
              >
                <div className="text-xs text-midnight-400 mb-3 font-medium">Fond de page</div>
                
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
                      <label className="text-xs text-midnight-400 block mb-1">Opacité</label>
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
                    
                    {/* Boutons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onBackgroundAdd()
                          setShowBackgroundMenu(false)
                        }}
                        className="flex-1 px-3 py-1.5 bg-midnight-800 hover:bg-midnight-700 text-white text-xs rounded-lg transition-colors"
                      >
                        Changer
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
                      Ajoute une image ou vidéo en fond de cette page
                    </p>
                    <button
                      onClick={() => {
                        onBackgroundAdd()
                        setShowBackgroundMenu(false)
                      }}
                      className="w-full px-3 py-2 bg-gradient-to-r from-aurora-600 to-dream-600 text-white text-sm font-medium rounded-lg hover:from-aurora-500 hover:to-dream-500 transition-colors flex items-center justify-center gap-2"
                    >
                      <ImagePlus className="w-4 h-4" />
                      Ajouter un fond
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
  onStyleChange: (style: TextStyle) => void
  onChapterChange: (chapterId: string | undefined) => void
  onCreateChapter: (title: string) => void
  onUpdateChapter?: (chapterId: string, updates: Partial<Chapter>) => void
  onImageAdd: () => void
  // Callbacks multi-images (nouveau)
  onImagePositionChange?: (pageIndex: number, imageId: string, position: ImagePosition) => void
  onImageStyleChange?: (pageIndex: number, imageId: string, style: ImageStyle) => void
  onImageFrameChange?: (pageIndex: number, imageId: string, frame: FrameStyle) => void
  onImageDelete?: (pageIndex: number, imageId: string) => void
  onImageBringForward?: (pageIndex: number, imageId: string) => void
  onImageSendBackward?: (pageIndex: number, imageId: string) => void
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
  onBackgroundRemove?: (pageIndex: number) => void
}

function WritingArea({ page, pageIndex, chapters, onContentChange, onTitleChange, onStyleChange, onChapterChange, onCreateChapter, onUpdateChapter, onImageAdd, onImagePositionChange, onImageStyleChange, onImageFrameChange, onImageDelete, onImageBringForward, onImageSendBackward, locale = 'fr', onPrevPage, onNextPage, hasPrevPage, hasNextPage, totalPages, leftPage, leftPageIndex, onLeftContentChange, storyTitle, onStoryTitleChange, onBack, onShowStructure, onShowOverview, onZoomChange, externalZoomedPage, showLines = true, onToggleLines, bookColor = 'cream', onBookColorChange, onBackgroundAdd, onBackgroundOpacityChange, onBackgroundRemove }: WritingAreaProps) {
  const style = page?.style || leftPage?.style || DEFAULT_STYLE
  const editorRef = useRef<HTMLDivElement>(null)
  const leftEditorRef = useRef<HTMLDivElement>(null)
  const zoomedEditorRef = useRef<HTMLDivElement>(null)
  const lastContentRef = useRef<string>(page?.content || '')
  const lastLeftContentRef = useRef<string>(leftPage?.content || '')
  
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

  // Initialiser le contenu du mode zoom
  useEffect(() => {
    if (zoomedEditorRef.current && zoomedPage) {
      const content = zoomedPage === 'left' ? leftPage?.content : page?.content
      zoomedEditorRef.current.innerHTML = content || ''
    }
  }, [zoomedPage, leftPage?.content, page?.content])
  
  // Gérer les changements de contenu
  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      lastContentRef.current = html
      onContentChange(html)
    }
  }

  const handleLeftInput = () => {
    if (leftEditorRef.current && onLeftContentChange) {
      const html = leftEditorRef.current.innerHTML
      lastLeftContentRef.current = html
      onLeftContentChange(html)
    }
  }
  
  // Append transcript to content when dictation stops
  useEffect(() => {
    if (!isListening && transcript && editorRef.current) {
      editorRef.current.focus()
      document.execCommand('insertText', false, transcript)
      resetTranscript()
    }
  }, [isListening, transcript, resetTranscript])
  
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

  // Style du texte (pour le conteneur)
  const textStyle: React.CSSProperties = {
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    lineHeight: LINE_SPACINGS[style.lineSpacing].value,
    fontWeight: style.isBold ? 'bold' : 'normal',
    fontStyle: style.isItalic ? 'italic' : 'normal',
    textAlign: style.textAlign,
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
    <div className="flex-1 flex flex-col">
      {/* Barre d'outils unifiée (titre + outils + actions) */}
      <div className="flex items-center justify-between gap-2 mb-1 relative z-50 px-1">
        {/* Gauche : Retour + Titre */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg text-midnight-400 hover:text-white hover:bg-midnight-800/50 transition-colors"
              title="Retour"
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
              placeholder="Titre..."
            />
          )}
        </div>
        
        {/* Centre : Outils de formatage */}
        <div className="glass rounded-lg px-2 py-0.5 shadow-lg z-50">
              <FormatBar 
                style={style} 
                onStyleChange={onStyleChange}
                showLines={showLines}
                onToggleLines={onToggleLines}
                bookColor={bookColor}
                onBookColorChange={onBookColorChange}
                backgroundMedia={page?.backgroundMedia}
                onBackgroundAdd={() => onBackgroundAdd?.(pageIndex)}
                onBackgroundOpacityChange={(opacity) => onBackgroundOpacityChange?.(pageIndex, opacity)}
                onBackgroundRemove={() => onBackgroundRemove?.(pageIndex)}
              />
            </div>
        
        {/* Droite : Structure + Vue */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {onShowStructure && (
          <button
              onClick={onShowStructure}
              className="p-1.5 rounded-lg bg-midnight-800/50 hover:bg-midnight-800 text-midnight-400 hover:text-white transition-colors"
              title="Structure"
            >
              <ListTree className="w-4 h-4" />
          </button>
          )}
          {onShowOverview && (
            <button
              onClick={onShowOverview}
              className="p-1.5 rounded-lg bg-midnight-800/50 hover:bg-midnight-800 text-midnight-400 hover:text-white transition-colors"
              title="Vue d'ensemble"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* MODE ZOOM - Page unique agrandie */}
      {zoomedPage ? (() => {
        // Déterminer quelle page afficher selon le zoom
        const zPage = zoomedPage === 'left' ? leftPage : page
        const zPageIndex = zoomedPage === 'left' ? (leftPageIndex ?? 0) : pageIndex
        const zPageImages = getPageImages(zPage)
        const zHandleInput = () => {
          // Mettre à jour en temps réel pendant l'édition
          if (zoomedEditorRef.current) {
            const html = zoomedEditorRef.current.innerHTML
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
        
        return (
        <div 
          className="flex-1 flex items-center justify-center pt-2 cursor-pointer"
          onClick={exitZoom}
        >
          {/* Page zoomée */}
          <motion.div
            ref={zoomedPageContainerRef}
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative flex flex-col shadow-2xl"
            style={{
              height: 'calc(100vh - 220px)',
              maxHeight: 'calc(100vh - 220px)',
              aspectRatio: '2 / 3',
              background: getPageColorStyles(bookColor).background,
              borderRadius: '12px',
              overflow: 'visible',
            }}
          >
            {/* Bouton réduire en haut à droite */}
            <button
              onClick={(e) => { e.stopPropagation(); exitZoom(); }}
              className="absolute top-2 right-2 z-20 p-2 rounded-full bg-amber-200/80 hover:bg-amber-300 text-amber-700 transition-all shadow-sm hover:shadow"
              title="Revenir au livre"
            >
              <EyeOff className="w-4 h-4" />
            </button>
            
            {/* Fond de page (image ou vidéo) */}
            {zPage?.backgroundMedia && (
              <div className="absolute inset-0 overflow-hidden rounded-xl z-0">
                {zPage.backgroundMedia.type === 'video' ? (
                  <video
                    src={zPage.backgroundMedia.url}
                    className="w-full h-full object-cover"
                    style={{ opacity: zPage.backgroundMedia.opacity }}
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
                    style={{ opacity: zPage.backgroundMedia.opacity }}
                  />
                )}
              </div>
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
                          { value: 'left', label: '◀ Gauche', icon: <AlignLeft className="w-4 h-4" /> },
                          { value: 'center', label: '▣ Centré', icon: <AlignCenter className="w-4 h-4" /> },
                          { value: 'right', label: '▶ Droite', icon: <AlignRight className="w-4 h-4" /> },
                          { value: 'hidden', label: '✕ Masquer', icon: <EyeOff className="w-4 h-4" /> },
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
                        { value: 'left', label: '◀ Gauche', icon: <AlignLeft className="w-4 h-4" /> },
                        { value: 'center', label: '▣ Centré', icon: <AlignCenter className="w-4 h-4" /> },
                        { value: 'right', label: '▶ Droite', icon: <AlignRight className="w-4 h-4" /> },
                        { value: 'hidden', label: '✕ Masquer', icon: <EyeOff className="w-4 h-4" /> },
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
                onPositionChange={(pos) => onImagePositionChange?.(zPageIndex, media.id, pos)}
                onStyleChange={(style) => onImageStyleChange?.(zPageIndex, media.id, style)}
                onFrameChange={(frame) => onImageFrameChange?.(zPageIndex, media.id, frame)}
                onDelete={() => onImageDelete?.(zPageIndex, media.id)}
                onBringForward={() => onImageBringForward?.(zPageIndex, media.id)}
                onSendBackward={() => onImageSendBackward?.(zPageIndex, media.id)}
                containerRef={zoomedPageContainerRef}
                totalMedia={zPageImages.length}
              />
            ))}
      
            {/* Zone d'écriture avec lignes intégrées */}
            <div className="flex-1 relative overflow-hidden">
              {/* Lignes de cahier (conditionnelles) */}
              {showLines && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'repeating-linear-gradient(transparent, transparent 24px, rgba(139, 115, 85, 0.15) 24px, rgba(139, 115, 85, 0.15) 25px)',
                    backgroundSize: '100% 32px',
                }}
              />
              )}
              
              {/* Marge rouge (conditionnelle) */}
              {showLines && (
              <div className="absolute left-12 top-0 bottom-0 w-px bg-red-300/40 pointer-events-none" />
              )}
      
              {/* Zone de texte contentEditable */}
              <div
                ref={zoomedEditorRef}
                contentEditable
                onInput={zHandleInput}
                data-placeholder={placeholders[locale]}
                style={{
                  ...textStyle,
                  color: '#3d3426',
                  lineHeight: '32px',
                }}
          className={cn(
                  'absolute inset-0 px-12 pt-0 pb-12 overflow-y-auto',
                  'font-serif',
                  'focus:outline-none',
                  'empty:before:content-[attr(data-placeholder)] empty:before:text-amber-500/40 empty:before:pointer-events-none'
                )}
              />
          </div>
          
        {/* Barre d'outils en bas */}
            <div className="relative z-10 px-8 py-3 flex items-center justify-between border-t border-amber-300/30 bg-gradient-to-t from-amber-50/80 to-transparent">
              <span className="text-sm text-amber-700/50 font-serif">{getWordCount(zPage.content)} {locale === 'fr' ? 'mots' : 'words'}</span>
          <div className="flex items-center gap-2">
                <button
              onClick={isListening ? stopListening : startListening}
              disabled={!isSupported}
              className={cn(
                    'p-2 rounded-full transition-all',
                    isListening 
                      ? 'text-red-500 bg-red-100 animate-pulse' 
                      : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
                  )}
                  title={isListening ? 'Arrêter' : 'Dicter'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={onImageAdd}
                  className="p-2 rounded-full text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50 transition-all"
                  title="Ajouter une image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Numéro de page */}
            <div className="text-center pb-4 text-amber-600/40 text-sm font-serif relative z-10">
              — Page {zPageIndex + 1} —
            </div>
          </motion.div>
          </div>
        )
      })() : (
      /* LIVRE OUVERT - 2 pages côte à côte */
      <div className="flex-1 flex items-start justify-center overflow-hidden pt-1">
        {/* Flèche gauche */}
        {onPrevPage && (
          <button
            onClick={onPrevPage}
            disabled={!hasPrevPage}
            className={cn(
              'p-2 rounded-full transition-all mr-2',
              hasPrevPage 
                ? 'text-midnight-400 hover:text-white hover:bg-midnight-800/50' 
                : 'text-midnight-700 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        
        <div 
          className="relative flex shadow-2xl"
          style={{
            height: 'calc(100vh - 220px)', // Hauteur fixe pour éviter le redimensionnement
            maxHeight: 'calc(100vh - 220px)',
            perspective: '2000px',
          }}
        >
          {/* Ombre du livre */}
          <div className="absolute -bottom-4 left-4 right-4 h-8 bg-black/30 blur-xl rounded-full" />
          
          {/* PAGE GAUCHE (page d'écriture) */}
          <div 
            ref={leftPageContainerRef}
            className="relative flex flex-col group"
            style={{
              height: '100%',
              aspectRatio: '2 / 3',
              background: getPageColorStyles(bookColor).background,
              borderRadius: '8px 0 0 8px',
              boxShadow: 'inset -20px 0 30px -20px rgba(0,0,0,0.15)',
              overflow: 'visible',
            }}
          >
            {/* Clip pour le contenu interne */}
            <div className="absolute inset-0 overflow-hidden rounded-l-lg pointer-events-none" style={{ zIndex: 0 }} />
            
            {/* Fond de page gauche (image ou vidéo) */}
            {leftPage?.backgroundMedia && (
              <div className="absolute inset-0 overflow-hidden rounded-l-lg z-0">
                {leftPage.backgroundMedia.type === 'video' ? (
                  <video
                    src={leftPage.backgroundMedia.url}
                    className="w-full h-full object-cover"
                    style={{ opacity: leftPage.backgroundMedia.opacity }}
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
                    style={{ opacity: leftPage.backgroundMedia.opacity }}
                  />
                )}
              </div>
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
                onPositionChange={(pos) => onImagePositionChange?.(leftPageIndex, media.id, pos)}
                onStyleChange={(style) => onImageStyleChange?.(leftPageIndex, media.id, style)}
                onFrameChange={(frame) => onImageFrameChange?.(leftPageIndex, media.id, frame)}
                onDelete={() => onImageDelete?.(leftPageIndex, media.id)}
                onBringForward={() => onImageBringForward?.(leftPageIndex, media.id)}
                onSendBackward={() => onImageSendBackward?.(leftPageIndex, media.id)}
                containerRef={leftPageContainerRef}
                totalMedia={leftPageImages.length}
              />
            ))}
            
            {/* En-tête avec chapitre (toujours présent pour garder la marge) */}
            {(() => {
              const leftChapter = chapters.find(c => c.id === leftPage?.chapterId)
              const alignment = leftChapter?.titleAlignment || 'center'
              if (alignment === 'hidden') {
                return (
                  <div 
                    className="min-h-[32px] border-b border-amber-300/20 flex-shrink-0 cursor-pointer hover:bg-amber-100/30 transition-colors relative"
                    onClick={() => leftChapter && setAlignmentMenuOpen(alignmentMenuOpen === 'left' ? null : 'left')}
                  >
                    {alignmentMenuOpen === 'left' && leftChapter && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-xl border border-amber-200 py-1 z-50">
                        {[
                          { value: 'left', label: '◀ Gauche', icon: <AlignLeft className="w-3 h-3" /> },
                          { value: 'center', label: '▣ Centré', icon: <AlignCenter className="w-3 h-3" /> },
                          { value: 'right', label: '▶ Droite', icon: <AlignRight className="w-3 h-3" /> },
                          { value: 'hidden', label: '✕ Masquer', icon: <EyeOff className="w-3 h-3" /> },
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
                  className={cn(
                    "px-4 pt-2 pb-1 border-b border-amber-300/20 relative z-10 min-h-[32px] flex items-center flex-shrink-0 cursor-pointer hover:bg-amber-100/30 transition-colors",
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
                        { value: 'left', label: '◀ Gauche', icon: <AlignLeft className="w-3 h-3" /> },
                        { value: 'center', label: '▣ Centré', icon: <AlignCenter className="w-3 h-3" /> },
                        { value: 'right', label: '▶ Droite', icon: <AlignRight className="w-3 h-3" /> },
                        { value: 'hidden', label: '✕ Masquer', icon: <EyeOff className="w-3 h-3" /> },
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
            
            {/* Lignes de cahier (conditionnelles) */}
            {showLines && (
              <div className="absolute inset-x-10 top-[32px] bottom-12" style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 24px, rgba(139, 115, 85, 0.15) 24px, rgba(139, 115, 85, 0.15) 25px)',
                backgroundSize: '100% 32px',
              }} />
            )}
            
            {/* Marge rouge (à droite pour page gauche, conditionnelle) */}
            {showLines && (
              <div className="absolute right-10 top-[32px] bottom-12 w-px bg-red-300/40" />
            )}
            
            {/* Zone d'écriture - page gauche TipTap */}
            {leftPage ? (
              <div
                key={`left-${leftPageIndex}-${zoomedPage === null}`}
                ref={leftEditorRef}
                contentEditable
                onInput={handleLeftInput}
                onClick={(e) => e.stopPropagation()}
                data-placeholder={placeholders[locale]}
                style={{
                  ...textStyle,
                  color: '#3d3426',
                  lineHeight: '32px',
                }}
                className={cn(
                  'flex-1 px-10 pt-0 pb-12 overflow-y-auto relative z-10',
                  'font-serif',
                  'focus:outline-none',
                  'empty:before:content-[attr(data-placeholder)] empty:before:text-amber-500/40 empty:before:pointer-events-none'
                )}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-amber-600/30 text-sm font-serif italic">
                  {locale === 'fr' ? 'Début du livre' : 'Start of book'}
                </span>
                    </div>
            )}
            
            {/* Barre d'outils en bas - page gauche */}
            {leftPage && (
              <div 
                className="relative z-10 px-6 py-2 flex items-center justify-between border-t border-amber-300/30 bg-gradient-to-t from-amber-50/80 to-transparent"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs text-amber-700/50 font-serif">
                  {leftPage.content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').split(/\s+/).filter(Boolean).length} {locale === 'fr' ? 'mots' : 'words'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); isListening ? stopListening() : startListening(); }}
                    disabled={!isSupported}
                    className={cn(
                      'p-2 rounded-full transition-all',
                      isListening 
                        ? 'text-red-500 bg-red-100 animate-pulse' 
                        : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
                    )}
                    title={isListening ? 'Arrêter' : 'Dicter'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onImageAdd(); }}
                    className="p-2 rounded-full text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50 transition-all"
                    title="Ajouter une image"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
              </div>
            </div>
            )}
            
            {/* Numéro de page en bas */}
            <div className="text-center pb-3 text-amber-600/40 text-xs font-serif">
              — {leftPageIndex !== undefined ? leftPageIndex + 1 : '—'} —
            </div>
            
            {/* Bouton zoom en haut à gauche (symétrique avec page droite) */}
            {leftPage && (
              <button
                onClick={() => setZoomedPage('left')}
                className="absolute top-2 left-2 z-20 p-2 rounded-full bg-amber-200/80 hover:bg-amber-300 text-amber-700 transition-all shadow-sm hover:shadow group-hover:scale-110"
                title="Agrandir la page"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
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
          
          {/* PAGE DROITE (page d'écriture) */}
          <div 
            ref={rightPageContainerRef}
            className="relative flex flex-col group"
            style={{
              height: '100%',
              aspectRatio: '2 / 3', // Ratio livre standard
              background: getPageColorStyles(bookColor).background,
              borderRadius: '0 8px 8px 0',
              boxShadow: 'inset 20px 0 30px -20px rgba(0,0,0,0.1)',
              overflow: 'visible',
            }}
          >
            {/* Clip pour le contenu interne */}
            <div className="absolute inset-0 overflow-hidden rounded-r-lg pointer-events-none" style={{ zIndex: 0 }} />
            
            {/* Fond de page droite (image ou vidéo) */}
            {page?.backgroundMedia && (
              <div className="absolute inset-0 overflow-hidden rounded-r-lg z-0">
                {page.backgroundMedia.type === 'video' ? (
                  <video
                    src={page.backgroundMedia.url}
                    className="w-full h-full object-cover"
                    style={{ opacity: page.backgroundMedia.opacity }}
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
                    style={{ opacity: page.backgroundMedia.opacity }}
                  />
                )}
              </div>
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
                onPositionChange={(pos) => onImagePositionChange?.(pageIndex, media.id, pos)}
                onStyleChange={(style) => onImageStyleChange?.(pageIndex, media.id, style)}
                onFrameChange={(frame) => onImageFrameChange?.(pageIndex, media.id, frame)}
                onDelete={() => onImageDelete?.(pageIndex, media.id)}
                onBringForward={() => onImageBringForward?.(pageIndex, media.id)}
                onSendBackward={() => onImageSendBackward?.(pageIndex, media.id)}
                containerRef={rightPageContainerRef}
                totalMedia={rightPageImages.length}
              />
            ))}
            
            {/* En-tête avec chapitre (toujours présent pour garder la marge) */}
            {(() => {
              const rightChapter = chapters.find(c => c.id === page?.chapterId)
              const alignment = rightChapter?.titleAlignment || 'center'
              if (alignment === 'hidden') {
                return (
                  <div 
                    className="min-h-[32px] border-b border-amber-300/20 flex-shrink-0 cursor-pointer hover:bg-amber-100/30 transition-colors relative"
                    onClick={() => rightChapter && setAlignmentMenuOpen(alignmentMenuOpen === 'right' ? null : 'right')}
                  >
                    {alignmentMenuOpen === 'right' && rightChapter && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-xl border border-amber-200 py-1 z-50">
                        {[
                          { value: 'left', label: '◀ Gauche', icon: <AlignLeft className="w-3 h-3" /> },
                          { value: 'center', label: '▣ Centré', icon: <AlignCenter className="w-3 h-3" /> },
                          { value: 'right', label: '▶ Droite', icon: <AlignRight className="w-3 h-3" /> },
                          { value: 'hidden', label: '✕ Masquer', icon: <EyeOff className="w-3 h-3" /> },
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
                  className={cn(
                    "px-4 pt-2 pb-1 border-b border-amber-300/20 relative z-10 min-h-[32px] flex items-center flex-shrink-0 cursor-pointer hover:bg-amber-100/30 transition-colors",
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
                        { value: 'left', label: '◀ Gauche', icon: <AlignLeft className="w-3 h-3" /> },
                        { value: 'center', label: '▣ Centré', icon: <AlignCenter className="w-3 h-3" /> },
                        { value: 'right', label: '▶ Droite', icon: <AlignRight className="w-3 h-3" /> },
                        { value: 'hidden', label: '✕ Masquer', icon: <EyeOff className="w-3 h-3" /> },
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
            
            {/* Lignes de cahier - conditionnelles */}
            {showLines && (
              <div className="absolute inset-x-10 top-[32px] bottom-12" style={{
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 24px, rgba(139, 115, 85, 0.15) 24px, rgba(139, 115, 85, 0.15) 25px)',
              backgroundSize: '100% 32px', // Même hauteur que lineHeight
            }} />
            )}
            
            {/* Marge rouge (conditionnelle) */}
            {showLines && (
              <div className="absolute left-10 top-[32px] bottom-12 w-px bg-red-300/40" />
            )}
            
            {/* Zone d'écriture - page droite TipTap */}
            {page ? (
            <div
                key={`right-${pageIndex}-${zoomedPage === null}`}
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onClick={(e) => e.stopPropagation()}
              data-placeholder={placeholders[locale]}
              style={{
                ...textStyle,
                color: '#3d3426',
                lineHeight: '32px',
              }}
          className={cn(
                'flex-1 px-10 pt-0 pb-12 overflow-y-auto relative z-10',
                  'font-serif',
                'focus:outline-none',
                'empty:before:content-[attr(data-placeholder)] empty:before:text-amber-500/40 empty:before:pointer-events-none'
          )}
        />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-amber-600/30 text-sm font-serif italic">
                  {locale === 'fr' ? 'Page suivante...' : 'Next page...'}
                </span>
              </div>
            )}
        
        {/* Barre d'outils en bas */}
            <div 
              className="relative z-10 px-6 py-2 flex items-center justify-between border-t border-amber-300/30 bg-gradient-to-t from-amber-50/80 to-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-amber-700/50 font-serif">{getWordCount(page?.content)} {locale === 'fr' ? 'mots' : 'words'}</span>
              <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); isListening ? stopListening() : startListening(); }}
              disabled={!isSupported}
              className={cn(
                    'p-2 rounded-full transition-all',
                    isListening 
                      ? 'text-red-500 bg-red-100 animate-pulse' 
                      : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
                  )}
                  title={isListening ? 'Arrêter' : 'Dicter'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
            <button
              onClick={(e) => { e.stopPropagation(); onImageAdd(); }}
                  className="p-2 rounded-full text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50 transition-all"
                  title="Ajouter une image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
            
            {/* Numéro de page en bas */}
            <div className="text-center pb-3 text-amber-600/40 text-xs font-serif relative z-10">
              — {pageIndex + 1} —
            </div>
            
            {/* Bouton zoom en haut à droite */}
            <button
              onClick={() => setZoomedPage('right')}
              className="absolute top-2 right-2 z-20 p-2 rounded-full bg-amber-200/80 hover:bg-amber-300 text-amber-700 transition-all shadow-sm hover:shadow group-hover:scale-110"
              title="Agrandir la page"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Flèche droite */}
        {onNextPage && (
          <button
            onClick={onNextPage}
            className="p-2 rounded-full text-midnight-400 hover:text-white hover:bg-midnight-800/50 transition-all ml-2"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
      )}
      
    </div>
  )
}

// ============================================================================
// COMPOSANT : Panneau latéral Luna
// ============================================================================

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface LunaSidePanelProps {
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

function LunaSidePanel({ 
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
}: LunaSidePanelProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [isAnalysisMenuOpen, setIsAnalysisMenuOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // TTS
  const { speak, stop, isSpeaking, isAvailable: isTTSAvailable } = useTTS(locale)
  
  // Speech recognition for voice input to Luna
  const { 
    isListening, 
    isSupported: isSpeechSupported, 
    transcript, 
    startListening, 
    stopListening, 
    resetTranscript 
  } = useSpeechRecognition(locale)
  
  // Send transcript to Luna when dictation stops
  useEffect(() => {
    if (!isListening && transcript) {
      sendToLuna(transcript)
      resetTranscript()
    }
  }, [isListening, transcript])
  
  const labels = {
    fr: {
      title: 'Luna',
      subtitle: 'Ton aide pour écrire',
      placeholder: 'Écris à Luna...',
      intro: 'Je suis là pour t\'aider à écrire ton histoire ! 📖✨ Qu\'est-ce que tu veux raconter ?',
      readPage: '📄 Lis ma page',
      readChapter: '📑 Lis mon chapitre',
      readBook: '📚 Lis mon livre',
      reading: 'Je lis...',
      send: 'Envoyer',
      collapse: 'Réduire',
      expand: 'Luna',
      voiceOn: 'Mode oral activé',
      voiceOff: 'Mode écrit',
      emptyPage: 'Je n\'ai pas encore commencé à écrire. Tu peux m\'aider ?',
      emptyChapter: 'Ce chapitre est vide pour l\'instant. Tu veux qu\'on le commence ensemble ?',
      emptyBook: 'Ton livre est encore vide ! Par quoi tu veux commencer ?',
    },
    en: {
      title: 'Luna',
      subtitle: 'Your writing helper',
      placeholder: 'Write to Luna...',
      intro: 'I\'m here to help you write your story! 📖✨ What do you want to tell?',
      readPage: '📄 Read my page',
      readChapter: '📑 Read my chapter',
      readBook: '📚 Read my book',
      reading: 'Reading...',
      send: 'Send',
      collapse: 'Collapse',
      expand: 'Luna',
      voiceOn: 'Voice mode on',
      voiceOff: 'Text mode',
      emptyPage: 'I haven\'t started writing yet. Can you help me?',
      emptyChapter: 'This chapter is empty for now. Want to start it together?',
      emptyBook: 'Your book is still empty! What do you want to start with?',
    },
    ru: {
      title: 'Луна',
      subtitle: 'Твой помощник в письме',
      placeholder: 'Напиши Луне...',
      intro: 'Я здесь, чтобы помочь тебе написать историю! 📖✨ Что ты хочешь рассказать?',
      readPage: '📄 Прочитай страницу',
      readChapter: '📑 Прочитай главу',
      readBook: '📚 Прочитай книгу',
      reading: 'Читаю...',
      send: 'Отправить',
      collapse: 'Свернуть',
      expand: 'Луна',
      voiceOn: 'Голосовой режим',
      voiceOff: 'Текстовый режим',
      emptyPage: 'Я ещё не начала писать. Можешь помочь?',
      emptyChapter: 'Эта глава пока пуста. Начнём вместе?',
      emptyBook: 'Твоя книга ещё пуста! С чего хочешь начать?',
    },
  }
  
  const t = labels[locale]

  // Scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initial message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'assistant', content: t.intro }])
    }
  }, [])

  // sendToLuna avec message visible (court) et message complet (pour l'API)
  const sendToLuna = async (userMessage: string, hiddenContext?: string) => {
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
          chatHistory: messages.slice(-10),
        }),
      })
      
      const data = await response.json()
      
      if (data.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }])
        
        // Speak the response if autoSpeak is enabled
        if (autoSpeak && isTTSAvailable) {
          speak(data.text)
        }
      }
    } catch (error) {
      console.error('Error sending to Luna:', error)
      const errorMessage = locale === 'fr' 
        ? 'Oups, j\'ai eu un petit problème... Réessaie !' 
        : locale === 'en'
        ? 'Oops, I had a little problem... Try again!'
        : 'Ой, у меня небольшая проблема... Попробуй ещё раз!'
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }])
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
      sendToLuna(t.emptyPage)
      return
    }
    
    // Message visible (court)
    const visibleMessage = locale === 'fr'
      ? `Luna, lis ma page ${pageNumber} ! 📄`
      : locale === 'en'
      ? `Luna, read my page ${pageNumber}! 📄`
      : `Луна, прочитай страницу ${pageNumber}! 📄`
    
    // Contexte caché (envoyé à l'API)
    const hiddenContext = locale === 'fr'
      ? `Contenu de la page ${pageNumber}${pageTitle ? ` "${pageTitle}"` : ''} :\n\n"${cleanContent}"\n\n→ Analyse la structure (QUI, QUOI, OÙ...), dis-moi si c'est cohérent, et aide-moi à améliorer ! Si tu vois des petites fautes, dis-le moi gentiment.`
      : locale === 'en'
      ? `Content of page ${pageNumber}${pageTitle ? ` "${pageTitle}"` : ''}:\n\n"${cleanContent}"\n\n→ Analyze the structure (WHO, WHAT, WHERE...), tell me if it's coherent, and help me improve! If you see small mistakes, tell me gently.`
      : `Содержание страницы ${pageNumber}${pageTitle ? ` "${pageTitle}"` : ''}:\n\n"${cleanContent}"\n\n→ Проанализируй структуру (КТО, ЧТО, ГДЕ...), скажи, всё ли логично, и помоги улучшить! Если увидишь ошибки, скажи мягко.`
    
    sendToLuna(visibleMessage, hiddenContext)
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
      sendToLuna(t.emptyChapter)
      return
    }
    
    const chapterTitle = currentChapterId 
      ? chapters.find(c => c.id === currentChapterId)?.title || (locale === 'fr' ? 'ce chapitre' : locale === 'en' ? 'this chapter' : 'эту главу')
      : (locale === 'fr' ? 'mon histoire' : locale === 'en' ? 'my story' : 'мою историю')
    
    // Message visible (court)
    const visibleMessage = locale === 'fr'
      ? `Luna, lis ${chapterTitle} ! 📑`
      : locale === 'en'
      ? `Luna, read ${chapterTitle}! 📑`
      : `Луна, прочитай ${chapterTitle}! 📑`
    
    // Contexte caché
    const hiddenContext = locale === 'fr'
      ? `Contenu du chapitre :\n\n${chapterContent}\n\n→ Est-ce que l'histoire est cohérente ? Les personnages sont bien décrits ? Il manque quelque chose ? Des conseils pour la suite ?`
      : locale === 'en'
      ? `Chapter content:\n\n${chapterContent}\n\n→ Is the story coherent? Are the characters well described? Is something missing? Any advice for what's next?`
      : `Содержание главы:\n\n${chapterContent}\n\n→ История логична? Персонажи хорошо описаны? Чего-то не хватает? Советы для продолжения?`
    
    sendToLuna(visibleMessage, hiddenContext)
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
      sendToLuna(t.emptyBook)
      return
    }
    
    const title = storyTitle || (locale === 'fr' ? 'mon livre' : locale === 'en' ? 'my book' : 'моя книга')
    
    // Message visible (court)
    const visibleMessage = locale === 'fr'
      ? `Luna, lis tout mon livre "${title}" ! 📚`
      : locale === 'en'
      ? `Luna, read my whole book "${title}"! 📚`
      : `Луна, прочитай всю книгу "${title}"! 📚`
    
    // Contexte caché
    const hiddenContext = locale === 'fr'
      ? `Contenu complet du livre :\n\n${bookContent}\n\n→ Analyse globale : l'histoire a un bon début, milieu et fin ? Les personnages sont cohérents ? L'histoire est intéressante ? Qu'est-ce que je pourrais améliorer ? Y a-t-il des fautes que tu remarques souvent ?`
      : locale === 'en'
      ? `Full book content:\n\n${bookContent}\n\n→ Global analysis: does the story have a good beginning, middle and end? Are the characters consistent? Is the story interesting? What could I improve? Are there mistakes you notice often?`
      : `Полное содержание книги:\n\n${bookContent}\n\n→ Общий анализ: есть хорошее начало, середина и конец? Персонажи последовательны? История интересная? Что можно улучшить? Есть ли частые ошибки?`
    
    sendToLuna(visibleMessage, hiddenContext)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendToLuna(message)
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
        <span className="text-aurora-300 font-medium">{t.expand}</span>
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
          <p className="font-medium text-white">{t.title}</p>
          <p className="text-xs text-midnight-400">{t.subtitle}</p>
        </div>
        
        {/* Toggle Écrit / Oral (même style que DiaryMode) */}
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
            title={autoSpeak ? t.voiceOn : t.voiceOff}
          >
            <Volume2 className={cn("w-3.5 h-3.5", isSpeaking && "animate-pulse")} />
            {autoSpeak 
              ? (locale === 'fr' ? 'Oral' : locale === 'en' ? 'Voice' : 'Голос') 
              : (locale === 'fr' ? 'Écrit' : locale === 'en' ? 'Text' : 'Текст')}
          </button>
        )}
        
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-midnight-800 text-midnight-400 hover:text-white transition-colors"
          title={t.collapse}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
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
            {/* Bouton écouter pour les messages de Luna */}
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
                title={isSpeaking ? (locale === 'fr' ? 'Arrêter' : locale === 'en' ? 'Stop' : 'Стоп') : (locale === 'fr' ? 'Écouter Luna' : locale === 'en' ? 'Listen to Luna' : 'Слушать Луну')}
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
            <span className="animate-pulse">{t.reading}</span>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input avec analyse premium */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-midnight-700/30">
        {/* Pastille Luna Analyse - Design Premium */}
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
              <span className="uppercase">{locale === 'fr' ? 'Luna lit' : locale === 'en' ? 'Luna reads' : 'Луна читает'}</span>
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
                    { action: handleReadPage, icon: FileText, label: locale === 'fr' ? 'Page' : locale === 'en' ? 'Page' : 'Страница', title: t.readPage },
                    { action: handleReadChapter, icon: Folder, label: locale === 'fr' ? 'Chapitre' : locale === 'en' ? 'Chapter' : 'Глава', title: t.readChapter },
                    { action: handleReadBook, icon: Book, label: locale === 'fr' ? 'Livre' : locale === 'en' ? 'Book' : 'Книга', title: t.readBook },
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
            value={isListening ? (locale === 'fr' ? 'J\'écoute...' : locale === 'en' ? 'Listening...' : 'Слушаю...') : message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.placeholder}
            disabled={isLoading || isListening}
            className="flex-1 px-4 py-2 rounded-xl bg-midnight-800/50 border border-midnight-700/50 text-white placeholder-midnight-500 text-sm focus:outline-none focus:border-aurora-500/30 disabled:opacity-50"
          />
          
          {/* Bouton micro pour parler à Luna */}
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
            title={!isSpeechSupported ? 'Non supporté par ce navigateur' : isListening ? 'Arrêter' : 'Parler à Luna'}
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
// COMPOSANT : Sélecteur de structure (simplifié)
// ============================================================================

interface StructureSelectorProps {
  onSelect: (structure: StoryStructure) => void
  locale?: 'fr' | 'en' | 'ru'
}

function StructureSelector({ onSelect, locale = 'fr' }: StructureSelectorProps) {
  const structures: StoryStructure[] = ['tale', 'adventure', 'problem', 'journal', 'loop', 'free']
  
  const icons: Record<StoryStructure, string> = {
    tale: '🏰',
    adventure: '🗺️',
    problem: '🧩',
    journal: '📔',
    loop: '🔄',
    free: '✨',
  }
  
  const titles = {
    fr: 'Choisis un type d\'histoire',
    en: 'Choose a story type',
    ru: 'Выбери тип истории',
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {structures.map((structureId) => {
        const template = STORY_TEMPLATES[structureId]
        
        return (
          <motion.button
            key={structureId}
            onClick={() => onSelect(structureId)}
            className={cn(
              'p-4 rounded-xl text-left transition-all',
              'bg-midnight-800/30 hover:bg-midnight-800/50',
              'border border-midnight-700/30 hover:border-aurora-500/30',
              'group'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-2xl mb-2 block">{icons[structureId]}</span>
            <h3 className="font-medium text-white text-sm group-hover:text-aurora-300 transition-colors">
              {template.name[locale]}
            </h3>
            <p className="text-xs text-midnight-500 mt-1">
              {template.description[locale]}
            </p>
          </motion.button>
        )
      })}
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
    updateStoryPage,
    updateStoryPages,
    deleteStory,
    addStoryChapter,
    deleteStoryChapter,
    updateStoryChapters,
  } = useAppStore()
  
  const [storyTitle, setStoryTitle] = useState('')
  const [showLunaPanel, setShowLunaPanel] = useState(true) // Panneau Luna ouvert par défaut
  const [showOverview, setShowOverview] = useState(false)
  const [showStructureSelector, setShowStructureSelector] = useState(false)
  const [showStructureView, setShowStructureView] = useState(false)
  
  // État local pour les pages (plus flexible)
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
  
  // État pour la couleur du livre (global pour toutes les pages)
  const [bookColor, setBookColor] = useState<PageColor>('cream')
  
  // État pour le MediaPicker
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [mediaPickerTargetPage, setMediaPickerTargetPage] = useState<'left' | 'right'>('right')
  
  // État pour le MediaPicker de fond de page
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false)
  const [backgroundPickerTargetPage, setBackgroundPickerTargetPage] = useState<number>(0)
  
  // État pour la confirmation de suppression de page
  const [pageToDelete, setPageToDelete] = useState<number | null>(null)
  
  // Calcul des indices de pages pour le spread courant
  const leftPageIndex = currentSpread * 2
  const rightPageIndex = currentSpread * 2 + 1
  const totalSpreads = Math.ceil(pages.length / 2)
  
  const locale = 'fr' // TODO: get from context
  
  const labels = {
    fr: {
      title: 'Mon Atelier d\'Histoires',
      subtitle: 'Crée des histoires magiques',
      newStory: 'Nouvelle histoire',
      continue: 'Continuer',
      previous: 'Mes histoires',
      titlePlaceholder: 'Le titre de ton histoire...',
      addPage: 'Nouvelle page',
      overview: 'Vue d\'ensemble',
      pages: 'pages',
    },
    en: {
      title: 'My Story Workshop',
      subtitle: 'Create magical stories',
      newStory: 'New story',
      continue: 'Continue',
      previous: 'My stories',
      titlePlaceholder: 'Your story title...',
      addPage: 'New page',
      overview: 'Overview',
      pages: 'pages',
    },
    ru: {
      title: 'Моя Мастерская',
      subtitle: 'Создавай волшебные истории',
      newStory: 'Новая история',
      continue: 'Продолжить',
      previous: 'Мои истории',
      titlePlaceholder: 'Название истории...',
      addPage: 'Новая страница',
      overview: 'Обзор',
      pages: 'страниц',
    },
  }
  
  const t = labels[locale]

  // Référence pour tracker l'ID de l'histoire chargée
  const loadedStoryIdRef = useRef<string | null>(null)
  
  // Initialiser avec une histoire existante (seulement quand on change d'histoire)
  useEffect(() => {
    if (currentStory && currentStory.id !== loadedStoryIdRef.current) {
      console.log('Loading NEW story:', currentStory.title, 'pages:', currentStory.pages, 'chapters:', currentStory.chapters)
      loadedStoryIdRef.current = currentStory.id
      setStoryTitle(currentStory.title)
      
      if (currentStory.pages && currentStory.pages.length > 0) {
        setPages(currentStory.pages.map((p) => ({
          id: p.id,
          title: p.title || '',
          content: p.content || '',
          image: p.image,
          imagePosition: p.imagePosition,
          imageStyle: p.imageStyle as ImageStyle | undefined,
          frameStyle: p.frameStyle as FrameStyle | undefined,
          chapterId: p.chapterId,
          style: DEFAULT_STYLE,
        })))
      } else {
        // Si pas de pages, créer une page vide
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
      id: Math.random().toString(36).substring(2, 9),
      title: '',
      content: '',
      chapterId: undefined,
    }
    const newPages = [...pages, newPage]
    setPages(newPages)
    // Aller au spread contenant la nouvelle page (dernière page)
    setCurrentSpread(Math.floor((newPages.length - 1) / 2))
    
    // Sauvegarder dans le store
    if (currentStory) {
      updateStoryPages(currentStory.id, newPages.map(p => ({
        id: p.id,
        stepIndex: 0,
        content: p.content,
        image: p.image,
        imagePosition: p.imagePosition,
        imageStyle: p.imageStyle,
        frameStyle: p.frameStyle,
        order: 0,
        chapterId: p.chapterId,
        title: p.title,
      })))
    }
  }

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) return // Garder au moins une page
    const newPages = pages.filter((_, i) => i !== index)
    setPages(newPages)
    // Ajuster le spread si nécessaire
    const newTotalSpreads = Math.ceil(newPages.length / 2)
    if (currentSpread >= newTotalSpreads) {
      setCurrentSpread(Math.max(0, newTotalSpreads - 1))
    }
    
    // Sauvegarder dans le store
    if (currentStory) {
      updateStoryPages(currentStory.id, newPages.map(p => ({
        id: p.id,
        stepIndex: 0,
        content: p.content,
        image: p.image,
        imagePosition: p.imagePosition,
        imageStyle: p.imageStyle,
        frameStyle: p.frameStyle,
        order: 0,
        chapterId: p.chapterId,
        title: p.title,
      })))
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
      updateStoryPage(currentStory.id, rightPageIndex, content, newPages[rightPageIndex].image)
    }
  }

  const handleTitleChange = (title: string) => {
    if (!pages[rightPageIndex]) return
    const newPages = [...pages]
    newPages[rightPageIndex] = { ...newPages[rightPageIndex], title }
    setPages(newPages)
  }

  const handleStyleChange = (style: TextStyle) => {
    if (!pages[rightPageIndex]) return
    const newPages = [...pages]
    newPages[rightPageIndex] = { ...newPages[rightPageIndex], style }
    setPages(newPages)
  }

  // Helper pour convertir les pages vers le format de sauvegarde
  const pagesToStoreFormat = (pagesArray: StoryPageLocal[]) => {
    return pagesArray.map(p => ({
      id: p.id,
      stepIndex: 0,
      content: p.content,
      images: p.images,
      // Legacy fields pour rétrocompatibilité
      image: p.image,
      imagePosition: p.imagePosition,
      imageStyle: p.imageStyle,
      frameStyle: p.frameStyle,
      order: 0,
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

  // Mettre une image devant
  const handleImageBringForward = (pageIdx: number, imageId: string) => {
    if (!pages[pageIdx]?.images) return
    const newPages = [...pages]
    const page = newPages[pageIdx]
    
    if (page.images) {
      const maxZIndex = Math.max(...page.images.map(img => img.zIndex))
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

  // Envoyer une image derrière
  const handleImageSendBackward = (pageIdx: number, imageId: string) => {
    if (!pages[pageIdx]?.images) return
    const newPages = [...pages]
    const page = newPages[pageIdx]
    
    if (page.images) {
      const minZIndex = Math.min(...page.images.map(img => img.zIndex))
      newPages[pageIdx] = {
        ...page,
        images: page.images.map(img => 
          img.id === imageId ? { ...img, zIndex: Math.max(1, minZIndex - 1) } : img
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

  const handleMediaSelect = (url: string, type: 'image' | 'video' | 'audio') => {
    // On ne gère pas l'audio pour l'instant
    if (type === 'audio') return
    
    const targetIndex = mediaPickerTargetPage === 'left' ? leftPageIndex : rightPageIndex
    if (!pages[targetIndex]) return
    
    const newPages = [...pages]
    const page = newPages[targetIndex]
    
    // Créer un nouveau média avec ID unique
    const newMedia: PageMedia = {
      id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
    
    if (currentStory) {
      updateStoryPages(currentStory.id, pagesToStoreFormat(newPages))
    }
    
    setShowMediaPicker(false)
  }

  // === Gestion du fond de page ===
  const handleOpenBackgroundPicker = (targetIndex: number) => {
    setBackgroundPickerTargetPage(targetIndex)
    setShowBackgroundPicker(true)
  }

  const handleBackgroundSelect = (url: string, type: 'image' | 'video' | 'audio') => {
    // On ne gère pas l'audio pour l'instant
    if (type === 'audio') return
    
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

  const handleSelectStructure = (structure: StoryStructure) => {
    // Créer l'histoire dans le store
    const newStory = createStory(storyTitle, structure)
    setCurrentStory(newStory)
    
    // Créer les pages locales selon le template
    const template = STORY_TEMPLATES[structure]
    if (structure === 'free') {
      setPages([{ id: '1', title: '', content: '', chapterId: undefined, style: DEFAULT_STYLE }])
    } else {
      const newPages: StoryPageLocal[] = template.steps.map((step, index) => ({
        id: Math.random().toString(36).substring(2, 9),
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
  const leftPage = pages[leftPageIndex]
  const rightPage = pages[rightPageIndex]

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
            {t.title}
        </h1>
          <p className="text-midnight-300">{t.subtitle}</p>
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
                placeholder={t.titlePlaceholder}
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
              {t.newStory}
            </motion.button>

            {/* Histoires précédentes */}
            {stories.length > 0 && (
              <div className="mt-12 w-full max-w-lg">
                <h3 className="text-sm uppercase tracking-wider text-midnight-400 mb-4">
                  {t.previous}
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
                      <Book className="w-4 h-4 text-aurora-400" />
                        <span className="flex-1 truncate text-white">{story.title}</span>
                      <span className="text-xs text-midnight-400">
                        {story.pages.length} {t.pages}
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
                        title={locale === 'fr' ? 'Supprimer' : locale === 'en' ? 'Delete' : 'Удалить'}
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
          <div className="h-full flex flex-col">
        <motion.header className="mb-6">
          <button
            onClick={() => setShowStructureSelector(false)}
            className="text-midnight-400 hover:text-white transition-colors flex items-center gap-2 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour
          </button>
          <h1 className="font-display text-2xl text-white">{storyTitle}</h1>
        </motion.header>
        
        <div className="flex-1 glass rounded-3xl p-8">
          <StructureSelector onSelect={handleSelectStructure} locale={locale} />
          </div>
      </div>
    )
  }

  // Vue : écriture (version compacte - livre maximisé)
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ZONE PRINCIPALE - Livre + Luna + Onglets */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Sous-zone : Livre + Luna */}
        <div className="flex-1 flex gap-1 min-h-0 overflow-hidden">
        {/* ZONE CENTRALE - Livre maximisé */}
          <div className="flex-1 min-w-0 overflow-hidden">
          {leftPage && (
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
                updateStoryPages(currentStory.id, newPages.map(p => ({
                  id: p.id,
                  stepIndex: 0,
                  content: p.content,
                  image: p.image,
                  order: 0,
                  chapterId: p.chapterId,
                  title: p.title,
                })))
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
                updateStoryPages(currentStory.id, newPages.map(p => ({
                  id: p.id,
                  stepIndex: 0,
                  content: p.content,
                  image: p.image,
                  order: 0,
                  chapterId: p.chapterId,
                  title: p.title,
                })))
              }
            }}
            onUpdateChapter={(chapterId, updates) => {
              setChapters(prev => prev.map(c => 
                c.id === chapterId ? { ...c, ...updates } : c
              ))
            }}
            onImageAdd={() => handleOpenMediaPicker('right')}
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
                    updateStoryPages(currentStory.id, newPages.map(p => ({
                      id: p.id,
                      stepIndex: 0,
                      content: p.content,
                      image: p.image,
                      order: 0,
                      chapterId: p.chapterId,
                      title: p.title,
                    })))
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
              onZoomChange={setCurrentZoomedPage}
              externalZoomedPage={currentZoomedPage}
              showLines={showLines}
              onToggleLines={() => setShowLines(!showLines)}
              onImagePositionChange={handleImagePositionChange}
              onImageStyleChange={handleImageStyleChange}
              onImageFrameChange={handleImageFrameChange}
              onImageDelete={handleImageDelete}
              onImageBringForward={handleImageBringForward}
              onImageSendBackward={handleImageSendBackward}
              bookColor={bookColor}
              onBookColorChange={setBookColor}
              onBackgroundAdd={handleOpenBackgroundPicker}
              onBackgroundOpacityChange={handleBackgroundOpacityChange}
              onBackgroundRemove={handleBackgroundRemove}
            />
        )}
        </div>

          {/* Panneau Luna */}
          <AnimatePresence mode="wait">
            <LunaSidePanel
              isOpen={showLunaPanel}
              onToggle={() => setShowLunaPanel(!showLunaPanel)}
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
          />
          
          {/* MediaPicker pour les fonds de page */}
          <MediaPicker
            isOpen={showBackgroundPicker}
            onClose={() => setShowBackgroundPicker(false)}
            onSelect={handleBackgroundSelect}
            allowedTypes="all"
            title="Ajouter un média"
          />
          
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
                    <h3 className="text-lg font-semibold text-white">Supprimer la page ?</h3>
                  </div>
                  
                  <p className="text-midnight-300 mb-6">
                    Tu veux vraiment supprimer la <span className="text-white font-medium">page {pageToDelete + 1}</span> ?
                    {pages[pageToDelete]?.content && (
                      <span className="block mt-1 text-amber-400 text-sm">
                        ⚠️ Cette page contient du texte qui sera perdu !
                      </span>
                    )}
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPageToDelete(null)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-midnight-800 text-midnight-300 hover:text-white hover:bg-midnight-700 transition-colors font-medium"
                    >
                      Non, garder
                    </button>
                    <button
                      onClick={() => {
                        handleDeletePage(pageToDelete)
                        setPageToDelete(null)
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors font-medium border border-red-500/30"
                    >
                      Oui, supprimer
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
          showLunaPanel ? "pr-[320px]" : "pr-12" // Compenser la largeur du panneau Luna
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
                    placeholder="Nom du chapitre..."
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
                  {/* Bouton supprimer (visible seulement sur page active et si plus d'une page) */}
                  {isActive && pages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setPageToDelete(index)
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full text-midnight-400 hover:text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                      title="Supprimer cette page"
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
              title="Ajouter 2 pages"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {/* Compteur de spreads */}
          <span className="text-sm text-midnight-400 font-medium">
            {currentSpread + 1} / {totalSpreads}
          </span>
        </div>
      </div>
      
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
                updateStoryPages(currentStory.id, newPages.map(p => ({
                  id: p.id,
                  stepIndex: 0,
                  content: p.content,
                  image: p.image,
                  order: 0,
                  chapterId: p.chapterId,
                  title: p.title,
                })))
              }
            }}
            onClose={() => setShowStructureView(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
