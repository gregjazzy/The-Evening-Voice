'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Wand2, 
  AlertCircle,
  CheckCircle,
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
  Image as ImageIcon,
  Film,
  Video,
} from 'lucide-react'
import { useStudioStore, type StyleType, type AmbianceType, type LightType, type FormatType, type MovementType, type CameraType } from '@/store/useStudioStore'
import { useStudioProgressStore } from '@/store/useStudioProgressStore'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

// Options de style avec icônes et couleurs
const styleOptions: { id: StyleType; label: string; emoji: string; color: string }[] = [
  { id: 'dessin', label: 'Dessin', emoji: '✏️', color: 'from-amber-500 to-orange-600' },
  { id: 'photo', label: 'Photo', emoji: '📷', color: 'from-slate-500 to-slate-700' },
  { id: 'magique', label: 'Magique', emoji: '✨', color: 'from-aurora-500 to-aurora-700' },
  { id: 'anime', label: 'Anime', emoji: '🌸', color: 'from-pink-500 to-rose-600' },
  { id: 'aquarelle', label: 'Aquarelle', emoji: '🎨', color: 'from-cyan-500 to-blue-600' },
  { id: 'pixel', label: 'Pixel Art', emoji: '👾', color: 'from-green-500 to-emerald-600' },
]

// Options d'ambiance
const ambianceOptions: { id: AmbianceType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'jour', label: 'Jour', icon: <CloudSun className="w-5 h-5" />, color: 'from-sky-400 to-blue-500' },
  { id: 'nuit', label: 'Nuit', icon: <Moon className="w-5 h-5" />, color: 'from-indigo-600 to-purple-800' },
  { id: 'orage', label: 'Orage', icon: <Zap className="w-5 h-5" />, color: 'from-gray-600 to-slate-800' },
  { id: 'brume', label: 'Brume', icon: <CloudRain className="w-5 h-5" />, color: 'from-gray-400 to-slate-500' },
  { id: 'feerique', label: 'Féérique', icon: <Stars className="w-5 h-5" />, color: 'from-fuchsia-500 to-purple-600' },
  { id: 'mystere', label: 'Mystère', icon: <Eye className="w-5 h-5" />, color: 'from-violet-700 to-purple-900' },
]

// Options de lumière
const lightOptions: { id: LightType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'soleil', label: 'Soleil', icon: <Sun className="w-5 h-5" />, color: 'from-yellow-400 to-orange-500' },
  { id: 'lune', label: 'Lune', icon: <Moon className="w-5 h-5" />, color: 'from-slate-300 to-slate-500' },
  { id: 'bougie', label: 'Bougie', icon: <Flame className="w-5 h-5" />, color: 'from-orange-500 to-red-600' },
  { id: 'neon', label: 'Néon', icon: <Zap className="w-5 h-5" />, color: 'from-pink-500 to-cyan-500' },
  { id: 'aurore', label: 'Aurore', icon: <Stars className="w-5 h-5" />, color: 'from-green-400 to-purple-500' },
]

// Options de format d'image
const formatOptions: { id: FormatType; label: string; emoji: string; description: string; color: string }[] = [
  { id: 'portrait', label: 'Portrait', emoji: '📐', description: 'Vertical', color: 'from-amber-500 to-orange-600' },
  { id: 'paysage', label: 'Paysage', emoji: '🖼️', description: 'Horizontal', color: 'from-blue-500 to-cyan-600' },
  { id: 'carre', label: 'Carré', emoji: '⬜', description: 'Carré', color: 'from-pink-500 to-rose-600' },
]

// Options de mouvement pour vidéos
const movementOptions: { id: MovementType; label: string; emoji: string; description: string; color: string }[] = [
  { id: 'lent', label: 'Lent', emoji: '🐢', description: 'Doux et calme', color: 'from-blue-400 to-cyan-500' },
  { id: 'rapide', label: 'Rapide', emoji: '⚡', description: 'Dynamique', color: 'from-orange-500 to-red-500' },
  { id: 'doux', label: 'Doux', emoji: '🌸', description: 'Fluide', color: 'from-pink-400 to-rose-500' },
  { id: 'dynamique', label: 'Dynamique', emoji: '🎬', description: 'Énergique', color: 'from-purple-500 to-indigo-500' },
  { id: 'immobile', label: 'Presque fixe', emoji: '🖼️', description: 'Peu de mouvement', color: 'from-slate-400 to-gray-500' },
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
  const {
    currentKit,
    updateKit,
    checkKitCompleteness,
    importedAssets,
  } = useStudioStore()
  
  // Filtrer les images disponibles pour les vidéos (uniquement celles du projet actuel)
  const availableImages = importedAssets.filter(a => 
    a.type === 'image' && 
    a.url && 
    (!a.projectId || a.projectId === currentStory?.id) // Images de l'histoire ou sans projet (anciennes)
  )

  const { 
    currentCreationType,
    completeStep,
    completedSteps,
    isStepDoneByChild,
    getLevel,
  } = useStudioProgressStore()
  
  // Récupérer le niveau actuel pour savoir quoi afficher
  const currentLevel = currentCreationType ? getLevel(currentCreationType) : 1
  
  // Formation progressive : les boutons restent visibles plus longtemps
  // Niveau 4+ = l'enfant décrit style/ambiance dans son texte
  // Niveau 5  = l'enfant décrit tout (détails + format inclus) dans son texte
  const showStyleButtons = currentLevel < 4    // Visible niveaux 1-3 (avant: < 3)
  const showAmbianceButtons = currentLevel < 4 // Visible niveaux 1-3 (avant: < 3)
  const showLightOptions = currentLevel < 5    // Visible niveaux 1-4 (avant: < 4)
  // Format TOUJOURS visible pour les images (important pour livre vs montage)
  // Au niveau 5, l'enfant peut aussi le décrire dans le texte
  // Les vidéos sont toujours en 16:9 (pas de choix)
  const showFormatButtons = currentCreationType === 'image'
  const showMovementButtons = currentCreationType === 'video'

  const { currentStory } = useAppStore()
  const { addImportedAsset } = useStudioStore()
  const { user } = useAuthStore()
  const { uploadFromUrl, isUploading: isUploadingToCloud } = useMediaUpload()
  const { showToast } = useToast()
  
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // 🎨 Génération directe via fal.ai (niveaux 1-2)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAsset, setGeneratedAsset] = useState<{ url: string; type: 'image' | 'video' } | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [isSavingToCloud, setIsSavingToCloud] = useState(false) // Pour l'upload permanent (Supabase/R2)
  
  // Niveaux 1-2 utilisent fal.ai directement, 3+ copient vers fal.ai playground
  const useDirectGeneration = currentLevel <= 2
  
  // Fonction de génération via fal.ai
  const handleDirectGenerate = async () => {
    if (!currentKit || !complete || isGenerating) return
    
    setIsGenerating(true)
    setGenerationError(null)
    setGeneratedAsset(null)
    
    try {
      const isVideo = currentCreationType === 'video'
      const endpoint = isVideo ? '/api/ai/video' : '/api/ai/image'
      
      // Préparer le format selon le type
      const formatMap: Record<string, string> = {
        portrait: '3:4',
        paysage: '16:9',
        carre: '1:1',
      }
      
      // Préparer les données selon le type
      const requestBody = isVideo 
        ? {
            // Pour les vidéos : image-to-video avec action et mouvement
            imageUrl: currentKit.sourceImageUrl,
            prompt: `${currentKit.action}. ${currentKit.movement ? `Movement style: ${currentKit.movement}` : ''}`,
            duration: '5',
          }
        : {
            // Pour les images
            description: currentKit.subject,
            style: currentKit.style || 'magique',
            ambiance: currentKit.ambiance || 'jour',
            aspectRatio: formatMap[currentKit.format || 'portrait'] || '3:4',
            prompt: currentKit.generatedPrompt,
          }
      
      const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur de génération')
      }
      
          const data = await response.json()
      const assetUrl = isVideo ? data.videoUrl : data.imageUrl
      
      if (!assetUrl) {
        throw new Error('Pas d\'URL reçue')
      }
      
      console.log('✅ Asset généré:', assetUrl)
      setGeneratedAsset({ url: assetUrl, type: isVideo ? 'video' : 'image' })
      
      // Ajouter automatiquement à la galerie (lié au projet actuel)
      const assetName = isVideo 
        ? (currentKit.action?.substring(0, 30) || 'Vidéo') + '...'
        : (currentKit.subject?.substring(0, 30) || 'Image') + '...'
      
      addImportedAsset({
        name: assetName,
        url: assetUrl,
        type: isVideo ? 'video' : 'image',
        file: null,
        source: isVideo ? 'runway' : 'midjourney', // Utiliser les types existants
        promptUsed: currentKit.generatedPrompt,
        projectId: currentStory?.id, // Lier à l'histoire actuelle
      })
      
      // Marquer les étapes comme complétées
      completeStep('review_prompt')
      completeStep('generate')
      completeStep('import')
      
      } catch (error) {
      console.error('Erreur génération fal.ai:', error)
      setGenerationError(error instanceof Error ? error.message : 'Erreur inconnue')
      } finally {
      setIsGenerating(false)
      }
  }
    
  // 🛡️ La modération est gérée par l'IA-Amie dans le chat (pas d'API séparée)
  
  // Au niveau 4+, l'enfant doit écrire les éléments dans son texte
  const isAdvancedLevel = currentLevel >= 4
  const baseCompleteness = checkKitCompleteness()
  
  // Calculer la détection de mots-clés pour les niveaux avancés
  const isExpertLevel = currentLevel >= 5 // Niveau expert : tout doit être dans le texte
  
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
  
  // Format toujours requis pour les images (livre vs montage)
  // Au niveau 5, peut aussi être détecté dans le texte
  const formatOk = !isImageCreation || // Vidéos: pas besoin de format
    currentKit?.format || // Format sélectionné via bouton (tous niveaux)
    (isExpertLevel && advancedDetection.hasFormat) // Niveau 5: aussi accepté dans le texte
    
  // Vérifier si le prompt est complet
  const complete = isAdvancedLevel 
    ? advancedDetection.hasEnoughText && 
      advancedDetection.hasStyle && 
      advancedDetection.hasAmbiance &&
      (isExpertLevel ? advancedDetection.hasDetails : true) &&
      formatOk
    : baseCompleteness.complete && formatOk // Format requis même pour débutants (images)
    
  // Construire la liste des éléments manquants
  const missing = useMemo(() => {
    if (!isAdvancedLevel) return baseCompleteness.missing
    
    const missingItems: string[] = []
    if (!advancedDetection.hasEnoughText) missingItems.push('description plus détaillée')
    if (!advancedDetection.hasStyle) missingItems.push('style visuel (dessin, photo, magique...)')
    if (!advancedDetection.hasAmbiance) missingItems.push('ambiance (jour, nuit, orage...)')
    if (isExpertLevel && !advancedDetection.hasDetails) missingItems.push('détails (couleurs, lumière, textures...)')
    // Format requis pour toutes les images (tous niveaux)
    if (isImageCreation && !currentKit?.format && !(isExpertLevel && advancedDetection.hasFormat)) {
      missingItems.push('format d\'image (portrait, paysage ou carré)')
    }
    return missingItems
  }, [isAdvancedLevel, isExpertLevel, baseCompleteness.missing, advancedDetection, isImageCreation, currentKit?.format])
  
  // Refs pour tracker les changements
  const prevSubjectRef = useRef('')
  const prevStyleRef = useRef<StyleType | null>(null)
  const prevAmbianceRef = useRef<AmbianceType | null>(null)
  
  // Délai avant d'afficher les sections suivantes (pour ne pas être trop brusque)
  const [showNextSections, setShowNextSections] = useState(false)
  
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
  
  // Afficher les sections suivantes APRÈS validation par l'IA (étape 'describe' complétée)
  useEffect(() => {
    const isDescribeCompleted = completedSteps.includes('describe')
    
    if (isDescribeCompleted && !showNextSections) {
      const timer = setTimeout(() => {
        setShowNextSections(true)
      }, 300)
      return () => clearTimeout(timer)
    }
    
    if (!isDescribeCompleted && showNextSections) {
      setShowNextSections(false)
    }
  }, [completedSteps, showNextSections])

  // Fonction pour invalider une étape et envoyer des réactions à l'IA
  const { uncompleteStep, sendAIReaction } = useStudioProgressStore()
  
  // ============================================================================
  // VALIDATION DES CHAMPS TEXTE - Envoie au chat pour que l'IA contrôle
  // ============================================================================
  
  // Fonction de validation d'un champ texte - envoie au chat (NE VALIDE PAS tout de suite)
  const validateTextField = (fieldName: 'subject' | 'details' | 'notes' | 'action', text: string) => {
    // Envoyer le texte au chat pour que l'IA le vérifie
    const fieldLabels: Record<string, string> = {
      subject: 'mon idée',
      details: 'les détails',
      notes: 'mes notes',
      action: 'ce qui se passe',
    }
    
    sendAIReaction({
      type: 'user_input',
      fieldName,
      userMessage: text, // Le texte de l'enfant pour l'afficher dans le chat
      message: `L'enfant a écrit pour "${fieldLabels[fieldName]}": "${text}"` // Contexte pour l'IA
    })
    
    // NE PAS valider ici - attendre la réponse de l'IA dans le chat
    // La validation sera faite par StudioAIChat si l'IA approuve
  }
  
  // Invalider les champs si le texte change après validation
  useEffect(() => {
    if (validatedFields.subject && currentKit?.subject !== prevSubjectRef.current) {
      setValidatedFields(prev => ({ ...prev, subject: false }))
      if (completedSteps.includes('describe')) {
      uncompleteStep('describe')
    }
    }
    prevSubjectRef.current = currentKit?.subject || ''
  }, [currentKit?.subject])

  useEffect(() => {
    if (!currentKit) return
    
    // Étape 2 : Style choisi
    if (currentKit.style && !prevStyleRef.current) {
      if (!completedSteps.includes('choose_style')) {
        completeStep('choose_style')
      }
    }
    prevStyleRef.current = currentKit.style
  }, [currentKit?.style, completeStep, completedSteps])

  useEffect(() => {
    if (!currentKit) return
    
    // Étape 3 : Ambiance choisie
    if (currentKit.ambiance && !prevAmbianceRef.current) {
      if (!completedSteps.includes('choose_mood')) {
        completeStep('choose_mood')
      }
    }
    prevAmbianceRef.current = currentKit.ambiance
  }, [currentKit?.ambiance, completeStep, completedSteps])

  // Étape 4 : Lumière choisie
  const prevLightRef = useRef(currentKit?.light)
  useEffect(() => {
    if (!currentKit) return
    
    if (currentKit.light && !prevLightRef.current) {
      if (!completedSteps.includes('choose_light')) {
        completeStep('choose_light')
      }
    }
    prevLightRef.current = currentKit.light
  }, [currentKit?.light, completeStep, completedSteps])

  // Étape 5 : Format choisi (images uniquement)
  const prevFormatRef = useRef(currentKit?.format)
  useEffect(() => {
    if (!currentKit || currentCreationType !== 'image') return
    
    if (currentKit.format && !prevFormatRef.current) {
      if (!completedSteps.includes('choose_format')) {
        completeStep('choose_format')
      }
    }
    prevFormatRef.current = currentKit.format
  }, [currentKit?.format, currentCreationType, completeStep, completedSteps])

  // Étape 5b : Mouvement choisi (vidéos uniquement)
  const prevMovementRef = useRef(currentKit?.movement)
  useEffect(() => {
    if (!currentKit || currentCreationType !== 'video') return
    
    if (currentKit.movement && !prevMovementRef.current) {
      if (!completedSteps.includes('choose_movement')) {
        completeStep('choose_movement')
      }
    }
    prevMovementRef.current = currentKit.movement
  }, [currentKit?.movement, currentCreationType, completeStep, completedSteps])

  // Étape : Caméra choisie (vidéos uniquement)
  const prevCameraRef = useRef(currentKit?.camera)
  useEffect(() => {
    if (!currentKit || currentCreationType !== 'video') return
    
    if (currentKit.camera && !prevCameraRef.current) {
      if (!completedSteps.includes('choose_camera')) {
        completeStep('choose_camera')
      }
    }
    prevCameraRef.current = currentKit.camera
  }, [currentKit?.camera, currentCreationType, completeStep, completedSteps])

  // Étape : Effets choisis (vidéos uniquement) - utilise 'choose_extra' selon le store
  const prevEffectsRef = useRef(currentKit?.effects)
  useEffect(() => {
    if (!currentKit || currentCreationType !== 'video') return
    
    // Valider si un effet est choisi (même "aucun" = chaîne vide déjà définie)
    if (currentKit.effects !== undefined && currentKit.effects !== prevEffectsRef.current) {
      if (!completedSteps.includes('choose_extra')) {
        completeStep('choose_extra')
      }
    }
    prevEffectsRef.current = currentKit.effects
  }, [currentKit?.effects, currentCreationType, completeStep, completedSteps])

  // Étape 6 : Détails ajoutés - Maintenant géré via les boutons "Valider" manuels
  // La fonction validateTextField() dans chaque champ appelle completeStep('choose_extra')

  // Copier le prompt
  const handleCopyPrompt = async () => {
    if (!currentKit?.generatedPrompt) return
    
    try {
      await navigator.clipboard.writeText(currentKit.generatedPrompt)
      setCopied(true)
      
      // Marquer les étapes comme complétées
      if (!completedSteps.includes('review_prompt')) {
        completeStep('review_prompt')
      }
      
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erreur copie:', err)
    }
  }

  // Ouvrir fal.ai (Flux Pro pour images, Kling pour vidéos)
  const handleOpenTool = () => {
    const url = currentCreationType === 'video' 
      ? 'https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/text-to-video/playground' 
      : 'https://fal.ai/models/fal-ai/flux-pro/v1.1/playground'
    
    window.open(url, '_blank')
    
    if (!completedSteps.includes('open_safari')) {
      completeStep('open_safari')
    }
    
    // Si le prompt a été copié, on considère que "Coller le prompt" sera fait
    if (completedSteps.includes('review_prompt') && !completedSteps.includes('paste_prompt')) {
      // Délai de 3 secondes (le temps que l'utilisateur colle)
      setTimeout(() => {
        completeStep('paste_prompt')
      }, 3000)
    }
  }

  // Récupérer le texte de l'histoire comme suggestion
  useEffect(() => {
    if (currentKit && !currentKit.subject && currentStory?.pages.length) {
      const lastPage = currentStory.pages[currentStory.pages.length - 1]
      if (lastPage.content) {
        // Suggérer un extrait du texte
        const suggestion = lastPage.content.slice(0, 100)
        updateKit({ subject: suggestion })
      }
    }
  }, [currentKit?.id])

  // Détection automatique par mots-clés pour niveaux 3+
  useEffect(() => {
    if (!currentKit || !isAdvancedLevel) return
    
    const creationType = currentCreationType || 'image'
    const detected = detectElementsInText(
      currentKit.subject + ' ' + (currentKit.subjectDetails || ''),
      creationType
    )
    setDetectedElements(detected)
    
    // Auto-compléter les étapes si détecté (niveau 3+ seulement)
    // NOTE: On ne coche PAS automatiquement "choose_extra" ici basé sur les mots-clés
    // du sujet principal. Cette étape ne doit être cochée que si l'utilisateur
    // remplit explicitement le champ subjectDetails, light, ou additionalNotes.
    if (detected.hasStyle && !completedSteps.includes('choose_style')) {
      completeStep('choose_style')
    }
    if (detected.hasAmbiance && !completedSteps.includes('choose_mood')) {
      completeStep('choose_mood')
    }
  }, [currentKit?.subject, currentKit?.subjectDetails, isAdvancedLevel, currentCreationType, completeStep, completedSteps])

  if (!currentKit) return null

  return (
    <div className="space-y-6">
      {/* ========== SECTION VIDÉO : Sélection d'image de base (PREMIÈRE ÉTAPE) ========== */}
      <AnimatePresence>
        {currentCreationType === 'video' && (
          <motion.section
            className={cn(
              "glass rounded-2xl p-6 transition-all",
              !currentKit.sourceImageUrl && "ring-2 ring-stardust-500/50 animate-pulse-subtle"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <motion.div
                animate={!currentKit.sourceImageUrl ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <ImageIcon className={cn(
                  "w-5 h-5",
                  !currentKit.sourceImageUrl ? "text-stardust-400" : "text-dream-400"
                )} />
              </motion.div>
              <h3 className={cn(
                "font-semibold",
                !currentKit.sourceImageUrl ? "text-stardust-300" : "text-white"
              )}>
                {!currentKit.sourceImageUrl ? "🖼️ Choisis une image à animer" : "🖼️ Image sélectionnée"}
              </h3>
              {currentKit.sourceImageUrl && (
                <CheckCircle className="w-4 h-4 text-dream-400 ml-auto" />
              )}
            </div>
            
            {/* Grille d'images disponibles - 6 colonnes x 2 lignes visibles */}
            {availableImages.length > 0 ? (
              <div className="grid grid-cols-6 gap-2 max-h-[140px] overflow-y-auto pr-1">
                {availableImages.map((asset) => (
                  <motion.button
                    key={asset.id}
                    onClick={() => updateKit({ 
                      sourceImageUrl: asset.cloudUrl || asset.url,
                      sourceImageId: asset.id 
                    })}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                      currentKit.sourceImageId === asset.id
                        ? "border-dream-500 ring-2 ring-dream-500/50"
                        : "border-midnight-700 hover:border-stardust-500/50"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img
                      src={asset.cloudUrl || asset.url}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                    {currentKit.sourceImageId === asset.id && (
                      <div className="absolute inset-0 bg-dream-500/20 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-dream-400" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4 rounded-xl bg-midnight-900/50 border-2 border-dashed border-stardust-500/30">
                <ImageIcon className="w-12 h-12 text-stardust-400 mx-auto mb-3" />
                <p className="text-stardust-300 font-medium mb-2">
                  Tu n'as pas encore d'images ! 🎨
                </p>
                <p className="text-sm text-midnight-400">
                  Crée d'abord des images dans le mode Images, puis reviens ici pour les animer !
                </p>
              </div>
            )}
            
            {/* Image sélectionnée en preview */}
            {currentKit.sourceImageUrl && (
              <motion.div
                className="mt-4 p-3 rounded-xl bg-dream-500/10 border border-dream-500/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-sm text-dream-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Super ! Cette image va devenir une vidéo magique ! ✨
                </p>
              </motion.div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Section Sujet - IMAGES UNIQUEMENT - avec animation pulsante si vide */}
      {currentCreationType === 'image' && (
      <motion.section
        className={cn(
          "glass rounded-2xl p-6 transition-all",
          !currentKit.subject && "ring-2 ring-aurora-500/50 animate-pulse-subtle"
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            animate={!currentKit.subject ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Lightbulb className={cn(
              "w-5 h-5",
              !currentKit.subject ? "text-aurora-400" : "text-stardust-400"
            )} />
          </motion.div>
          <h3 className={cn(
            "font-semibold",
            !currentKit.subject ? "text-aurora-300" : "text-white"
          )}>
            {!currentKit.subject ? "✨ Qu'est-ce que tu veux créer ?" : "Qu'est-ce que tu veux créer ?"}
          </h3>
            {validatedFields.subject && (
            <CheckCircle className="w-4 h-4 text-dream-400 ml-auto" />
          )}
        </div>
        
          <div className="flex gap-2">
        <textarea
          value={currentKit.subject}
              onChange={(e) => {
                updateKit({ subject: e.target.value })
                // Invalider si modifié après validation
                if (validatedFields.subject) {
                  setValidatedFields(prev => ({ ...prev, subject: false }))
                }
              }}
          placeholder="Décris ce que tu imagines... Par exemple : Un château sur un nuage avec des licornes 🏰✨"
          className={cn(
                "flex-1 h-24 resize-none rounded-xl p-4 text-white placeholder:text-midnight-400 focus:ring-2 focus:outline-none transition-all",
                validatedFields.subject
                  ? "bg-dream-500/10 border-2 border-dream-500/30 focus:ring-dream-500/50"
                  : !currentKit.subject 
                    ? "bg-aurora-500/10 border-2 border-aurora-500/30 placeholder:text-aurora-300/60 focus:ring-aurora-500/50" 
                    : "bg-midnight-900/50 focus:ring-aurora-500/50"
          )}
          data-mentor-target="studio-subject"
        />
          </div>
          
          {/* Bouton Valider */}
          {currentKit.subject.length >= 5 && !validatedFields.subject && (
            <motion.button
              onClick={() => validateTextField('subject', currentKit.subject)}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-aurora-500/20 text-aurora-300 border border-aurora-500/30 hover:bg-aurora-500/30 transition-all font-medium"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <CheckCircle className="w-5 h-5" />
              Valider ma description ✓
            </motion.button>
          )}
          
          {/* Message de validation réussie */}
          {completedSteps.includes('describe') && (
            <motion.div
              className="mt-3 p-3 rounded-xl bg-dream-500/10 border border-dream-500/20 text-dream-300 text-sm flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <CheckCircle className="w-4 h-4" />
              Super ! Ton idée est validée ! 🌟
            </motion.div>
          )}
        
        {/* Suggestions depuis l'histoire */}
        {(currentStory?.pages?.length ?? 0) > 0 && !currentKit.subject && (
          <motion.div
            className="mt-3 p-3 rounded-xl bg-aurora-500/10 border border-aurora-500/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-sm text-aurora-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Suggestion de ton histoire : cliquer pour utiliser
            </p>
          </motion.div>
        )}
      </motion.section>
      )}

      {/* ========== SECTION VIDÉO : Action/Scénario ========== */}
      <AnimatePresence>
        {currentCreationType === 'video' && currentKit.sourceImageUrl && (
          <motion.section
            className={cn(
              "glass rounded-2xl p-6 transition-all",
              !currentKit.action && "ring-2 ring-stardust-500/50 animate-pulse-subtle"
            )}
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <motion.div
                animate={!currentKit.action ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Zap className={cn(
                  "w-5 h-5",
                  !currentKit.action ? "text-stardust-400" : "text-dream-400"
                )} />
              </motion.div>
              <h3 className={cn(
                "font-semibold",
                !currentKit.action ? "text-stardust-300" : "text-white"
              )}>
                {!currentKit.action ? "🎬 Qu'est-ce qui se passe ?" : "🎬 Scénario"}
              </h3>
              {validatedFields.action && (
                <CheckCircle className="w-4 h-4 text-dream-400 ml-auto" />
              )}
            </div>
            
            <textarea
              value={currentKit.action}
              onChange={(e) => {
                updateKit({ action: e.target.value })
                if (validatedFields.action) {
                  setValidatedFields(prev => ({ ...prev, action: false }))
                }
              }}
              placeholder="Décris ce qui se passe dans ta vidéo... Par exemple : Le dragon ouvre ses ailes et s'envole vers le ciel 🐉✨"
              className={cn(
                "w-full h-20 resize-none rounded-xl p-4 text-white placeholder:text-midnight-400 focus:ring-2 focus:outline-none transition-all",
                validatedFields.action
                  ? "bg-dream-500/10 border-2 border-dream-500/30 focus:ring-dream-500/50"
                  : !currentKit.action 
                    ? "bg-stardust-500/10 border-2 border-stardust-500/30 placeholder:text-stardust-300/60 focus:ring-stardust-500/50" 
                    : "bg-midnight-900/50 focus:ring-stardust-500/50"
              )}
            />
            
            {/* Suggestions d'actions */}
            <div className="mt-3 flex flex-wrap gap-2">
              <p className="text-xs text-midnight-400 w-full mb-1">💡 Exemples :</p>
              {[
                "s'envole doucement",
                "tourne la tête",
                "les yeux brillent",
                "le vent souffle",
                "les étoiles scintillent",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    updateKit({ action: currentKit.action + (currentKit.action ? ' ' : '') + suggestion })
                    if (validatedFields.action) {
                      setValidatedFields(prev => ({ ...prev, action: false }))
                    }
                  }}
                  className="px-2 py-1 text-xs rounded-lg bg-stardust-500/20 text-stardust-300 hover:bg-stardust-500/30 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            
            {/* Bouton Valider Action */}
            {currentKit.action && currentKit.action.length >= 5 && !validatedFields.action && (
              <motion.button
                onClick={() => validateTextField('action', currentKit.action || '')}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-stardust-500/20 text-stardust-300 border border-stardust-500/30 hover:bg-stardust-500/30 transition-all font-medium"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CheckCircle className="w-5 h-5" />
                Valider mon scénario ✓
              </motion.button>
            )}
            
            {/* Message de validation réussie */}
            {completedSteps.includes('describe') && (
              <motion.div
                className="mt-3 p-3 rounded-xl bg-dream-500/10 border border-dream-500/20 text-dream-300 text-sm flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <CheckCircle className="w-4 h-4" />
                Parfait ! Ton scénario est validé ! 🎬
              </motion.div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

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
                {!currentKit.style ? "👆 Choisis un style !" : "Quel style ?"}
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
                  <span className="text-sm font-medium">{style.label}</span>
                  
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
      
      {/* Message d'encouragement pour niveau 3+ (les boutons disparaissent) */}
      <AnimatePresence>
        {!showStyleButtons && showNextSections && (
          <motion.div
            className="glass rounded-xl p-4 border border-dream-500/30"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <p className="text-sm text-dream-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>
                <strong>Niveau {currentLevel}</strong> : Tu sais déjà tout décrire dans ton texte ! 
                Décris le style, l'ambiance, les couleurs... directement dans ta phrase.
              </span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

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
                {!currentKit.ambiance ? "👆 Choisis une ambiance !" : "Quelle ambiance ?"}
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
                  <span className="text-sm font-medium">{ambiance.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Section Détails - après l'ambiance - IMAGES UNIQUEMENT */}
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
              <Sparkles className="w-5 h-5 text-dream-400" />
              <h3 className="font-semibold text-white">✨ Ajouter des détails</h3>
              {completedSteps.includes('choose_extra') && currentKit.subjectDetails && (
                <CheckCircle className="w-4 h-4 text-dream-400 ml-auto" />
              )}
            </div>
            
            <p className="text-sm text-midnight-300 mb-3">Ajoute des couleurs, formes, personnages...</p>
            <input
              type="text"
              value={currentKit.subjectDetails}
              onChange={(e) => {
                updateKit({ subjectDetails: e.target.value })
                if (validatedFields.details) {
                  setValidatedFields(prev => ({ ...prev, details: false }))
                }
              }}
              placeholder="Ex: avec des ailes dorées, des fleurs violettes, un ciel rose..."
              className={cn(
                "w-full rounded-xl px-4 py-3 text-white placeholder:text-midnight-400",
                completedSteps.includes('choose_extra') && currentKit.subjectDetails
                  ? "bg-dream-500/10 border border-dream-500/30"
                  : "bg-midnight-900/50"
              )}
              data-mentor-target="studio-details"
            />
            {/* Bouton Valider Détails */}
            {currentKit.subjectDetails && currentKit.subjectDetails.length >= 3 && !completedSteps.includes('choose_extra') && (
              <motion.button
                onClick={() => validateTextField('details', currentKit.subjectDetails || '')}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-dream-500/10 text-dream-300 border border-dream-500/20 hover:bg-dream-500/20 transition-all text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <CheckCircle className="w-4 h-4" />
                Valider ✓
              </motion.button>
            )}
            {completedSteps.includes('choose_extra') && currentKit.subjectDetails && (
              <p className="mt-2 text-xs text-dream-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Validé !
              </p>
            )}
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
              <h3 className="font-semibold text-white">☀️ Quelle lumière ?</h3>
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
                  <span className="text-sm font-medium">{light.label}</span>
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
              <h3 className="font-semibold text-white">C&apos;est pour quoi ?</h3>
              {currentKit.format && (
                <CheckCircle className="w-4 h-4 text-dream-400 ml-auto" />
              )}
            </div>
            
            <p className="text-sm text-midnight-300 mb-4">
              Quelle forme pour ton image ?
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
                  <span className="text-sm font-medium">{format.label}</span>
                  <span className="text-xs opacity-70">{format.description}</span>
                </motion.button>
              ))}
            </div>
            
          </motion.section>
        )}
      </AnimatePresence>

      {/* Section Mouvement (vidéos uniquement) - Après VALIDATION de l'action */}
      <AnimatePresence>
        {showMovementButtons && completedSteps.includes('describe') && (
          <motion.section
            className="glass rounded-2xl p-6"
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Film className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-white">💫 Choisir le mouvement</h3>
              {currentKit.movement && (
                <CheckCircle className="w-4 h-4 text-dream-400 ml-auto" />
              )}
            </div>
            
            <p className="text-sm text-midnight-300 mb-4">
              Comment ta vidéo va bouger ?
            </p>
            
            <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
              {movementOptions.map((movement) => (
                <motion.button
                  key={movement.id}
                  onClick={() => updateKit({ 
                    movement: currentKit.movement === movement.id ? null : movement.id 
                  })}
                  className={cn(
                    'p-4 rounded-xl flex flex-col items-center gap-2 transition-all',
                    currentKit.movement === movement.id
                      ? 'bg-gradient-to-r ' + movement.color + ' text-white ring-2 ring-white/30'
                      : 'bg-midnight-800/50 hover:bg-midnight-700/50'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-2xl">{movement.emoji}</span>
                  <span className="text-sm font-medium">{movement.label}</span>
                  <span className="text-xs opacity-70">{movement.description}</span>
                </motion.button>
              ))}
            </div>
            
          </motion.section>
        )}
      </AnimatePresence>

      {/* Section Caméra (vidéos uniquement) - AVANT les effets selon le guide */}
      <AnimatePresence>
        {currentCreationType === 'video' && currentKit.movement && (
          <motion.section
            className="glass rounded-2xl p-6"
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Video className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">🎥 Mouvement de caméra (optionnel)</h3>
              {currentKit.camera && (
                <CheckCircle className="w-4 h-4 text-dream-400 ml-auto" />
              )}
            </div>
            
            <p className="text-sm text-midnight-300 mb-4">
              Comment la caméra bouge pendant la vidéo ?
            </p>
            
            <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
              {[
                { id: 'fixe' as const, label: 'Fixe', emoji: '🎯', description: 'Ne bouge pas' },
                { id: 'zoom_in' as const, label: 'Zoom +', emoji: '🔍', description: 'Se rapproche' },
                { id: 'zoom_out' as const, label: 'Zoom -', emoji: '🔭', description: 'S\'éloigne' },
                { id: 'pan_gauche' as const, label: 'Gauche', emoji: '⬅️', description: 'Glisse gauche' },
                { id: 'pan_droite' as const, label: 'Droite', emoji: '➡️', description: 'Glisse droite' },
                { id: 'travelling' as const, label: 'Travelling', emoji: '🎬', description: 'Suit le sujet' },
              ].map((cam) => (
                <motion.button
                  key={cam.id}
                  onClick={() => updateKit({ 
                    camera: currentKit.camera === cam.id ? null : cam.id 
                  })}
                  className={cn(
                    'p-3 rounded-xl flex flex-col items-center gap-1 transition-all',
                    currentKit.camera === cam.id
                      ? 'bg-blue-500/30 text-white ring-2 ring-blue-500/50'
                      : 'bg-midnight-800/50 hover:bg-midnight-700/50'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-xl">{cam.emoji}</span>
                  <span className="text-xs font-medium">{cam.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Section Effets spéciaux (vidéos uniquement) - APRÈS la caméra selon le guide */}
      <AnimatePresence>
        {currentCreationType === 'video' && currentKit.movement && (
          <motion.section
            className="glass rounded-2xl p-6"
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-white">✨ Effets spéciaux (optionnel)</h3>
              {currentKit.effects && (
                <CheckCircle className="w-4 h-4 text-dream-400 ml-auto" />
              )}
            </div>
            
            <p className="text-sm text-midnight-300 mb-4">
              Ajoute de la magie à ta vidéo !
            </p>
            
            <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
              {[
                { id: '', label: 'Aucun', emoji: '➖' },
                { id: 'sparkles', label: 'Étincelles', emoji: '✨' },
                { id: 'glow', label: 'Halo', emoji: '🌈' },
                { id: 'smoke', label: 'Fumée', emoji: '💨' },
                { id: 'stars', label: 'Étoiles', emoji: '⭐' },
                { id: 'fire', label: 'Flammes', emoji: '🔥' },
                { id: 'snow', label: 'Flocons', emoji: '❄️' },
                { id: 'magic', label: 'Magie', emoji: '🪄' },
              ].map((effect) => (
                <motion.button
                  key={effect.id || 'none'}
                  onClick={() => updateKit({ 
                    effects: currentKit.effects === effect.id ? '' : effect.id 
                  })}
                  className={cn(
                    'p-2 rounded-xl flex flex-col items-center gap-1 transition-all',
                    currentKit.effects === effect.id
                      ? 'bg-amber-500/30 text-white ring-2 ring-amber-500/50'
                      : 'bg-midnight-800/50 hover:bg-midnight-700/50'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-xl">{effect.emoji}</span>
                  <span className="text-[10px] font-medium">{effect.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Résumé / Preview - apparaît avec les autres sections */}
      <AnimatePresence>
        {showNextSections && (
          <motion.section
            className={cn(
              'rounded-2xl p-6 border-2',
              complete
                ? 'bg-dream-500/10 border-dream-500/30'
                : 'bg-stardust-500/10 border-stardust-500/30'
            )}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {complete ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-dream-400" />
                    <h3 className="font-semibold text-dream-300">Kit prêt !</h3>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-stardust-400" />
                    <h3 className="font-semibold text-stardust-300">
                      Il manque : {missing.join(', ')}
                    </h3>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-aurora-300 hover:text-aurora-200"
              >
                {showPreview ? 'Cacher' : 'Voir le prompt'}
              </button>
            </div>

            <AnimatePresence>
              {showPreview && (
                <motion.div
                  className="p-4 rounded-xl bg-midnight-900/50 font-mono text-sm text-midnight-200 mb-4"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {currentKit.generatedPrompt || 'Le prompt apparaîtra ici...'}
                </motion.div>
              )}
            </AnimatePresence>

            {/* BOUTONS D'ACTION PRINCIPAUX */}
            {complete && (
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* ========== NIVEAUX 1-2 : Génération directe via fal.ai ========== */}
                {useDirectGeneration ? (
                  <>
                    {/* Bouton Générer */}
                    <motion.button
                      onClick={handleDirectGenerate}
                      disabled={isGenerating}
                      className={cn(
                        'w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-lg transition-all',
                        isGenerating
                          ? 'bg-aurora-500/50 text-white cursor-wait'
                          : 'bg-gradient-to-r from-aurora-500 to-dream-500 text-white hover:from-aurora-600 hover:to-dream-600'
                      )}
                      whileHover={!isGenerating ? { scale: 1.02 } : {}}
                      whileTap={!isGenerating ? { scale: 0.98 } : {}}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          Création en cours... ✨
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-6 h-6" />
                          🪄 Créer {currentCreationType === 'video' ? 'ma vidéo' : 'mon image'} !
                        </>
                      )}
                    </motion.button>
                    
                    {/* Message d'erreur */}
                    {generationError && (
                      <motion.div
                        className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        ❌ {generationError}
                        <button
                          onClick={handleDirectGenerate}
                          className="ml-2 underline hover:no-underline"
                        >
                          Réessayer
                        </button>
                      </motion.div>
                    )}
                    
                    {/* Affichage de l'asset généré */}
                    {generatedAsset && (
                      <motion.div
                        className="mt-4 rounded-xl overflow-hidden border-2 border-dream-500/50"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        {generatedAsset.type === 'image' ? (
                          <img 
                            src={generatedAsset.url} 
                            alt="Image générée" 
                            className="w-full h-auto min-h-[200px] bg-midnight-800"
                            onError={(e) => {
                              console.error('Erreur chargement image:', generatedAsset.url)
                              e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="%231a1a2e" width="400" height="300"/><text fill="%23888" font-size="14" x="50%" y="50%" text-anchor="middle">Image non disponible</text></svg>'
                            }}
                          />
                        ) : (
                          <video 
                            src={generatedAsset.url} 
                            controls 
                            autoPlay 
                            loop
                            className="w-full h-auto min-h-[200px] bg-midnight-800"
                          />
                        )}
                        
                        <div className="p-4 bg-dream-500/10 space-y-3">
                          <p className="text-dream-300 font-medium text-center">
                            🎉 Tadaa ! Qu'est-ce que tu en penses ?
                          </p>
                          
                          {/* 3 boutons d'action */}
                          <div className="grid grid-cols-3 gap-2">
                            {/* ✅ Garder */}
                            <motion.button
                              onClick={async () => {
                                // Vérifier que l'utilisateur est connecté
                                if (!user) {
                                  showToast('Tu dois être connecté pour sauvegarder. Rafraîchis la page et reconnecte-toi.', 'error')
                                  return
                                }
                                
                                // Upload vers stockage permanent (Supabase pour images, R2 pour vidéos)
                                setIsSavingToCloud(true)
                                try {
                                  const result = await uploadFromUrl(generatedAsset.url, {
                                    type: generatedAsset.type,
                                    source: generatedAsset.type === 'video' ? 'runway' : 'midjourney',
                                    storyId: currentStory?.id,
                                  })
                                  
                                  if (result) {
                                    // Mettre à jour l'asset avec l'URL permanente
                                    const asset = importedAssets.find(a => a.url === generatedAsset.url)
                                    if (asset) {
                                      useStudioStore.getState().updateAsset(asset.id, { 
                                        cloudUrl: result.url,
                                        assetId: result.assetId,
                                      })
                                    }
                                    console.log(`✅ ${generatedAsset.type === 'video' ? 'Vidéo' : 'Image'} sauvegardée:`, result.url)
                                    showToast(`${generatedAsset.type === 'video' ? 'Vidéo' : 'Image'} sauvegardée !`, 'success')
                                    // Fermer l'aperçu SEULEMENT si succès
                                    setGeneratedAsset(null)
                                    setGenerationError(null)
                                  } else {
                                    // Upload a retourné null (erreur silencieuse)
                                    showToast('Erreur lors de la sauvegarde. Vérifie ta connexion et réessaie.', 'error')
                                  }
                                } catch (error) {
                                  console.error('Erreur sauvegarde:', error)
                                  showToast(`Erreur : ${error instanceof Error ? error.message : 'Sauvegarde impossible'}`, 'error')
                                } finally {
                                  setIsSavingToCloud(false)
                                }
                              }}
                              disabled={isSavingToCloud || isUploadingToCloud}
                              className={cn(
                                "flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl transition-all border",
                                (isSavingToCloud || isUploadingToCloud)
                                  ? "bg-dream-500/10 text-dream-400 border-dream-500/20 cursor-wait"
                                  : "bg-dream-500/20 text-dream-300 hover:bg-dream-500/30 border-dream-500/30"
                              )}
                              whileHover={!(isSavingToCloud || isUploadingToCloud) ? { scale: 1.02 } : {}}
                              whileTap={!(isSavingToCloud || isUploadingToCloud) ? { scale: 0.98 } : {}}
                            >
                              {(isSavingToCloud || isUploadingToCloud) ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                              ) : (
                                <CheckCircle className="w-6 h-6" />
                              )}
                              <span className="text-sm font-medium">
                                {(isSavingToCloud || isUploadingToCloud) ? 'Sauvegarde...' : 'Garder !'}
                              </span>
                            </motion.button>
                            
                            {/* 🗑️ Supprimer */}
                            <motion.button
                              onClick={() => {
                                // Supprimer de la galerie
                                const assets = importedAssets.filter(a => a.url !== generatedAsset.url)
                                // On doit utiliser le store pour supprimer
                                const lastAsset = importedAssets.find(a => a.url === generatedAsset.url)
                                if (lastAsset) {
                                  useStudioStore.getState().removeImportedAsset(lastAsset.id)
                                }
                                setGeneratedAsset(null)
                                setGenerationError(null)
                              }}
                              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all border border-red-500/30"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <AlertCircle className="w-6 h-6" />
                              <span className="text-sm font-medium">Supprimer</span>
                            </motion.button>
                            
                            {/* 🔄 Nouvelle création */}
                            <motion.button
                              onClick={() => {
                                // Supprimer l'ancienne de la galerie et régénérer
                                const lastAsset = importedAssets.find(a => a.url === generatedAsset.url)
                                if (lastAsset) {
                                  useStudioStore.getState().removeImportedAsset(lastAsset.id)
                                }
                                setGeneratedAsset(null)
                                setGenerationError(null)
                                // Relancer la génération
                                handleDirectGenerate()
                              }}
                              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-aurora-500/20 text-aurora-300 hover:bg-aurora-500/30 transition-all border border-aurora-500/30"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <RefreshCw className="w-6 h-6" />
                              <span className="text-sm font-medium">Refaire</span>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    <p className="text-center text-xs text-midnight-400 mt-2">
                      L'IA va créer {currentCreationType === 'video' ? 'ta vidéo' : 'ton image'} en quelques secondes ! ✨
                    </p>
                  </>
                ) : (
                  /* ========== NIVEAUX 3+ : Copier + Aller sur fal.ai ========== */
                  <>
                {/* Bouton Copier le prompt */}
                <motion.button
                  onClick={handleCopyPrompt}
                  className={cn(
                    'w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-lg transition-all',
                    copied
                      ? 'bg-dream-500 text-white'
                      : 'bg-gradient-to-r from-aurora-500 to-aurora-600 text-white hover:from-aurora-600 hover:to-aurora-700'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      Copié ! ✨
                    </>
                  ) : (
                    <>
                      <Copy className="w-6 h-6" />
                      1. Copier mon prompt
                    </>
                  )}
                </motion.button>

                    {/* Bouton Ouvrir fal.ai */}
                <motion.button
                  onClick={handleOpenTool}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-stardust-500 to-stardust-600 text-midnight-900 hover:from-stardust-400 hover:to-stardust-500 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Rocket className="w-6 h-6" />
                      2. Aller sur fal.ai
                  <ExternalLink className="w-5 h-5" />
                </motion.button>

                <p className="text-center text-xs text-midnight-400 mt-2">
                  Colle ton prompt avec <kbd className="px-1.5 py-0.5 rounded bg-midnight-800 text-midnight-300">Cmd+V</kbd> puis lance la création !
                </p>

                {/* Bouton de confirmation après avoir ouvert l'outil */}
                {completedSteps.includes('open_safari') && !completedSteps.includes('generate') && (
                  <motion.button
                    onClick={() => {
                      if (!completedSteps.includes('paste_prompt')) {
                        completeStep('paste_prompt')
                      }
                      completeStep('generate')
                    }}
                    className="w-full mt-4 flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-medium text-sm bg-dream-500/20 text-dream-300 border border-dream-500/30 hover:bg-dream-500/30 transition-all"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Sparkles className="w-5 h-5" />
                    3. J'ai lancé la création ! ✨
                  </motion.button>
                )}

                {/* Message final quand la création est lancée */}
                {completedSteps.includes('generate') && (
                  <motion.div
                    className="mt-4 p-4 rounded-xl bg-dream-500/10 border border-dream-500/30 text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <p className="text-dream-300 font-medium">
                      🎉 Super ! Quand c'est prêt, utilise la zone <strong>"Importer tes créations"</strong> juste en dessous ⬇️
                    </p>
                  </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

