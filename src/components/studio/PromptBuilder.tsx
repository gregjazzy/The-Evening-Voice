'use client'

import { useState, useEffect, useRef } from 'react'
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
  Rocket
} from 'lucide-react'
import { useStudioStore, type StyleType, type AmbianceType, type LightType } from '@/store/useStudioStore'
import { useStudioProgressStore } from '@/store/useStudioProgressStore'
import { useAppStore } from '@/store/useAppStore'
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

/**
 * Analyse le texte pour détecter style, ambiance et détails
 * @param text - Le texte à analyser
 * @param creationType - 'image' ou 'video' pour adapter les mots-clés
 */
function detectElementsInText(text: string, creationType: 'image' | 'video' = 'image'): {
  hasStyle: boolean
  hasAmbiance: boolean
  hasDetails: boolean
  hasMovement: boolean // Spécifique vidéo
  hasRhythm: boolean // Spécifique vidéo
  detectedStyle: string[]
  detectedAmbiance: string[]
  detectedDetails: string[]
  detectedMovement: string[]
  detectedRhythm: string[]
} {
  const lowerText = text.toLowerCase()
  
  const detectedStyle = STYLE_KEYWORDS.filter(kw => lowerText.includes(kw))
  const detectedAmbiance = AMBIANCE_KEYWORDS.filter(kw => lowerText.includes(kw))
  const detectedDetails = DETAIL_KEYWORDS.filter(kw => lowerText.includes(kw))
  
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
    hasMovement: detectedMovement.length > 0,
    hasRhythm: detectedRhythm.length > 0,
    detectedStyle,
    detectedAmbiance,
    detectedDetails,
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
  } = useStudioStore()

  const { 
    currentCreationType,
    completeStep,
    completedSteps,
    isStepDoneByChild,
    getLevel,
  } = useStudioProgressStore()
  
  // Récupérer le niveau actuel pour savoir quoi afficher
  const currentLevel = currentCreationType ? getLevel(currentCreationType) : 1
  
  // Niveau 3+ = l'enfant décrit tout dans son texte, on cache les boutons style/ambiance
  const showStyleButtons = currentLevel < 3
  const showAmbianceButtons = currentLevel < 3
  const showLightOptions = currentLevel < 4

  const { currentProject } = useAppStore()
  
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Au niveau 3+, on considère le kit complet si la description est assez longue (pas besoin des boutons)
  const isAdvancedLevel = currentLevel >= 3
  const baseCompleteness = checkKitCompleteness()
  
  // Pour les niveaux avancés : 20+ caractères de description = kit complet
  const complete = isAdvancedLevel 
    ? (currentKit?.subject?.length ?? 0) >= 20 
    : baseCompleteness.complete
    
  const missing = isAdvancedLevel 
    ? ((currentKit?.subject?.length ?? 0) < 20 ? ['description détaillée'] : [])
    : baseCompleteness.missing
  
  // Refs pour tracker les changements
  const prevSubjectRef = useRef('')
  const prevStyleRef = useRef<StyleType | null>(null)
  const prevAmbianceRef = useRef<AmbianceType | null>(null)
  
  // Délai avant d'afficher les sections suivantes (pour ne pas être trop brusque)
  const [showNextSections, setShowNextSections] = useState(false)
  
  // Détection par mots-clés pour niveaux 3+ (exposé pour l'IA)
  const [detectedElements, setDetectedElements] = useState<{
    hasStyle: boolean
    hasAmbiance: boolean
    hasDetails: boolean
    hasMovement: boolean
    hasRhythm: boolean
    detectedStyle: string[]
    detectedAmbiance: string[]
    detectedDetails: string[]
    detectedMovement: string[]
    detectedRhythm: string[]
  }>({
    hasStyle: false,
    hasAmbiance: false,
    hasDetails: false,
    hasMovement: false,
    hasRhythm: false,
    detectedStyle: [],
    detectedAmbiance: [],
    detectedDetails: [],
    detectedMovement: [],
    detectedRhythm: [],
  })
  
  // Attendre 1 seconde après avoir écrit assez de texte avant d'afficher Style
  useEffect(() => {
    if (currentKit && currentKit.subject.length >= 10 && !showNextSections) {
      const timer = setTimeout(() => {
        setShowNextSections(true)
      }, 800) // 800ms de délai
      return () => clearTimeout(timer)
    }
    // Reset si on efface le texte
    if (currentKit && currentKit.subject.length < 10 && showNextSections) {
      setShowNextSections(false)
    }
  }, [currentKit?.subject, showNextSections])

  // Mettre à jour les étapes du guide automatiquement
  useEffect(() => {
    if (!currentKit) return
    
    // Étape 1 : Description (quand on a écrit au moins 10 caractères = une vraie idée)
    if (currentKit.subject.length >= 10 && prevSubjectRef.current.length < 10) {
      if (!completedSteps.includes('describe')) {
        completeStep('describe')
      }
    }
    prevSubjectRef.current = currentKit.subject
  }, [currentKit?.subject, completeStep, completedSteps])

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

  // Étape 4 : Détails ajoutés (subjectDetails, light, ou additionalNotes)
  useEffect(() => {
    if (!currentKit) return
    
    // Si l'enfant a ajouté des détails supplémentaires
    const hasDetails = 
      (currentKit.subjectDetails && currentKit.subjectDetails.length >= 3) ||
      currentKit.light ||
      (currentKit.additionalNotes && currentKit.additionalNotes.length >= 3)
    
    if (hasDetails && !completedSteps.includes('choose_extra')) {
      completeStep('choose_extra')
    }
  }, [currentKit?.subjectDetails, currentKit?.light, currentKit?.additionalNotes, completeStep, completedSteps])

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

  // Ouvrir Midjourney/Runway
  const handleOpenTool = () => {
    const url = currentCreationType === 'video' 
      ? 'https://app.runwayml.com/' 
      : 'https://www.midjourney.com/app/'
    
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

  // Récupérer le texte du Book comme suggestion
  useEffect(() => {
    if (currentKit && !currentKit.subject && currentProject?.chapters.length) {
      const lastChapter = currentProject.chapters[currentProject.chapters.length - 1]
      if (lastChapter.content) {
        // Suggérer un extrait du texte
        const suggestion = lastChapter.content.slice(0, 100)
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
      {/* Section Sujet - avec animation pulsante si vide */}
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
          {currentKit.subject.length >= 10 && (
            <CheckCircle className="w-4 h-4 text-dream-400 ml-auto" />
          )}
        </div>
        
        <textarea
          value={currentKit.subject}
          onChange={(e) => updateKit({ subject: e.target.value })}
          placeholder="Décris ce que tu imagines... Par exemple : Un château sur un nuage avec des licornes 🏰✨"
          className={cn(
            "w-full h-24 resize-none rounded-xl p-4 text-white placeholder:text-midnight-400 focus:ring-2 focus:ring-aurora-500/50 focus:outline-none transition-all",
            !currentKit.subject 
              ? "bg-aurora-500/10 border-2 border-aurora-500/30 placeholder:text-aurora-300/60" 
              : "bg-midnight-900/50"
          )}
          data-mentor-target="studio-subject"
        />
        
        {/* Suggestions depuis le Book */}
        {(currentProject?.chapters?.length ?? 0) > 0 && !currentKit.subject && (
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

      {/* Section Style - VISIBLE SEULEMENT NIVEAU 1-2 (apprentissage) */}
      <AnimatePresence>
        {showStyleButtons && showNextSections && (
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

      {/* Section Ambiance - VISIBLE SEULEMENT NIVEAU 1-2 */}
      <AnimatePresence>
        {showAmbianceButtons && currentKit.style && (
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

      {/* Section Lumière - VISIBLE SEULEMENT NIVEAU 1-3 */}
      <AnimatePresence>
        {showLightOptions && currentKit.ambiance && (
          <motion.section
            className="glass rounded-2xl p-6"
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-5 h-5 text-stardust-400" />
              <h3 className="font-semibold text-white">✨ Enrichir les détails</h3>
              {(currentKit.subjectDetails || currentKit.light || currentKit.additionalNotes) && (
                <CheckCircle className="w-4 h-4 text-dream-400 ml-auto" />
              )}
            </div>
            
            {/* Détails supplémentaires (couleurs, formes...) */}
            <div className="mb-4">
              <p className="text-sm text-midnight-300 mb-2">Ajoute des couleurs, formes, personnages...</p>
              <input
                type="text"
                value={currentKit.subjectDetails}
                onChange={(e) => updateKit({ subjectDetails: e.target.value })}
                placeholder="Ex: avec des ailes dorées, des fleurs violettes, un ciel rose..."
                className="w-full bg-midnight-900/50 rounded-xl px-4 py-3 text-white placeholder:text-midnight-400"
                data-mentor-target="studio-details"
              />
            </div>

            {/* Lumière */}
            <div className="mb-4">
              <p className="text-sm text-midnight-300 mb-2">Quelle lumière ?</p>
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
            </div>

            {/* Notes */}
            <div>
              <p className="text-sm text-midnight-300 mb-2">Autre chose ?</p>
              <input
                type="text"
                value={currentKit.additionalNotes}
                onChange={(e) => updateKit({ additionalNotes: e.target.value })}
                placeholder="Tout ce qui te passe par la tête..."
                className="w-full bg-midnight-900/50 rounded-xl px-4 py-3 text-white placeholder:text-midnight-400"
                data-mentor-target="studio-notes"
              />
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

                {/* Bouton Ouvrir Midjourney/Runway */}
                <motion.button
                  onClick={handleOpenTool}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-stardust-500 to-stardust-600 text-midnight-900 hover:from-stardust-400 hover:to-stardust-500 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Rocket className="w-6 h-6" />
                  2. Aller sur {currentCreationType === 'video' ? 'Runway' : 'Midjourney'}
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
              </motion.div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

