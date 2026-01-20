'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
  Loader2,
  Lightbulb,
  Image as ImageIcon,
  Layers,
  Trophy,
  RotateCcw,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModeIntroModal, useFirstVisit } from '@/components/ui/ModeIntroModal'

// ============================================================================
// TYPES
// ============================================================================

type ChallengeType = 'reproduce' | 'variations'
type DifficultyLevel = 1 | 2 | 3 | 4 | 5

interface ChallengeData {
  id: string // ID unique pour le mapping avec les images pré-générées
  type: ChallengeType
  difficulty: DifficultyLevel
  targetPrompt: string
  targetPromptFr: string // Version française pour l'affichage
  hints: string[]
  variationInstruction?: string // Pour les variations
  preloadedImages?: string[] // URLs des images pré-générées
}

interface ActiveChallenge extends ChallengeData {
visibleId: string // ID unique pour cette instance (avec timestamp)
  targetImage: string | null
  isLoadingTarget: boolean
}

interface AnalysisResult {
  score: number
  feedback: string
  strengths: string[]
  improvements: string[]
  promptTips: string[]
}

interface AttemptResult {
  userPrompt: string
  generatedImage: string
  attemptNumber: number
  analysis?: AnalysisResult
  isAnalyzing?: boolean
}

// URLs de base Supabase Storage
const SUPABASE_STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL 
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/challenges`
  : null

// ============================================================================
// BANQUE DE DÉFIS
// ============================================================================

const REPRODUCE_CHALLENGES: ChallengeData[] = [
  // Niveau 1 - Scènes simples mais intéressantes
  {
    id: 'reproduce-1-apple',
    type: 'reproduce',
    difficulty: 1,
    targetPrompt: 'A red apple with a green leaf on a wooden table, sunlight from window, watercolor style',
    targetPromptFr: 'Une pomme rouge avec une feuille verte sur une table en bois, lumière du soleil',
    hints: ['C\'est un fruit', 'Il y a du bois', 'La lumière vient d\'une fenêtre'],
  },
  {
    id: 'reproduce-1-star',
    type: 'reproduce',
    difficulty: 1,
    targetPrompt: 'A golden shooting star crossing a purple night sky above snowy mountains, magical atmosphere',
    targetPromptFr: 'Une étoile filante dorée traversant un ciel violet au-dessus de montagnes enneigées',
    hints: ['C\'est la nuit', 'Quelque chose bouge dans le ciel', 'Il y a des montagnes blanches'],
  },
  {
    id: 'reproduce-1-rainbow',
    type: 'reproduce',
    difficulty: 1,
    targetPrompt: 'A rainbow arching over a green meadow with wildflowers and a small cottage, sunny day, Studio Ghibli style',
    targetPromptFr: 'Un arc-en-ciel au-dessus d\'une prairie fleurie avec une petite maison, style Ghibli',
    hints: ['Il y a un arc de couleurs', 'Une prairie avec des fleurs', 'Une petite maison'],
  },
  
  // Niveau 2 - Personnages avec contexte
  {
    id: 'reproduce-2-cat',
    type: 'reproduce',
    difficulty: 2,
    targetPrompt: 'An orange tabby cat sleeping on a cozy red armchair by a fireplace, warm lighting, oil painting style',
    targetPromptFr: 'Un chat roux tigré dormant sur un fauteuil rouge près d\'une cheminée, lumière chaude',
    hints: ['C\'est un animal qui fait miaou', 'Il dort', 'Il fait chaud près du feu'],
  },
  {
    id: 'reproduce-2-robot',
    type: 'reproduce',
    difficulty: 2,
    targetPrompt: 'A small friendly robot watering flowers in a garden, morning dew, pastel colors, children book illustration',
    targetPromptFr: 'Un petit robot gentil qui arrose des fleurs dans un jardin, rosée du matin, couleurs pastel',
    hints: ['C\'est une machine gentille', 'Il s\'occupe de plantes', 'C\'est le matin'],
  },
  {
    id: 'reproduce-2-teddy',
    type: 'reproduce',
    difficulty: 2,
    targetPrompt: 'A brown teddy bear having a tea party with toy friends on a picnic blanket in a sunny park',
    targetPromptFr: 'Un ours en peluche marron prenant le thé avec ses amis jouets sur une couverture de pique-nique',
    hints: ['C\'est un jouet doux', 'Il y a une fête', 'C\'est dehors dans un parc'],
  },
  
  // Niveau 3 - Scènes complètes
  {
    id: 'reproduce-3-castle',
    type: 'reproduce',
    difficulty: 3,
    targetPrompt: 'A medieval stone castle on a green hill at sunset, golden sky, fantasy illustration style',
    targetPromptFr: 'Un château médiéval en pierre sur une colline verte au coucher du soleil',
    hints: ['C\'est un bâtiment ancien', 'Il est sur une colline', 'Le ciel est doré', 'On y trouvait des rois'],
  },
  {
    id: 'reproduce-3-boat',
    type: 'reproduce',
    difficulty: 3,
    targetPrompt: 'A small wooden boat on a calm lake surrounded by mountains, morning mist, peaceful scene',
    targetPromptFr: 'Un petit bateau en bois sur un lac calme entouré de montagnes, brume matinale',
    hints: ['C\'est sur l\'eau', 'Il y a des montagnes', 'C\'est le matin', 'L\'atmosphère est paisible'],
  },
  {
    id: 'reproduce-3-treehouse',
    type: 'reproduce',
    difficulty: 3,
    targetPrompt: 'A cozy treehouse with round windows and a rope ladder, autumn forest, warm lighting',
    targetPromptFr: 'Une cabane dans un arbre avec des fenêtres rondes et une échelle de corde',
    hints: ['C\'est une maison spéciale', 'Elle est dans un arbre', 'C\'est l\'automne', 'Il y a une échelle'],
  },
  
  // Niveau 4 - Atmosphères
  {
    id: 'reproduce-4-forest',
    type: 'reproduce',
    difficulty: 4,
    targetPrompt: 'A mysterious foggy forest with rays of golden sunlight breaking through tall trees, magical atmosphere, digital painting',
    targetPromptFr: 'Une forêt mystérieuse avec du brouillard et des rayons de soleil dorés',
    hints: ['C\'est un lieu naturel', 'On voit mal au loin', 'La lumière est spéciale', 'C\'est magique'],
  },
  {
    id: 'reproduce-4-underwater',
    type: 'reproduce',
    difficulty: 4,
    targetPrompt: 'An underwater coral reef scene with colorful tropical fish, light rays from above, serene blue tones',
    targetPromptFr: 'Une scène sous-marine avec un récif de corail et des poissons tropicaux colorés',
    hints: ['C\'est sous l\'eau', 'Il y a beaucoup de couleurs', 'Des poissons nagent', 'La lumière vient d\'en haut'],
  },
  {
    id: 'reproduce-4-aurora',
    type: 'reproduce',
    difficulty: 4,
    targetPrompt: 'A northern lights display over a snowy mountain landscape, green and purple aurora, starry night sky',
    targetPromptFr: 'Des aurores boréales au-dessus de montagnes enneigées, ciel étoilé',
    hints: ['C\'est la nuit', 'Il y a de la neige', 'Le ciel a des couleurs spéciales', 'C\'est un phénomène naturel'],
  },
  
  // Niveau 5 - Complexe
  {
    id: 'reproduce-5-dragon',
    type: 'reproduce',
    difficulty: 5,
    targetPrompt: 'A majestic blue dragon with iridescent scales perched on a cliff overlooking a vast kingdom at dawn, epic fantasy art, highly detailed',
    targetPromptFr: 'Un dragon bleu majestueux aux écailles irisées sur une falaise surplombant un royaume à l\'aube',
    hints: ['C\'est une créature légendaire', 'Elle peut voler', 'Elle est bleue et brillante', 'On voit un royaume en bas'],
  },
  {
    id: 'reproduce-5-airship',
    type: 'reproduce',
    difficulty: 5,
    targetPrompt: 'A steampunk airship flying through clouds at sunset, brass and copper details, propellers and balloons, Victorian fantasy style',
    targetPromptFr: 'Un dirigeable steampunk volant dans les nuages au coucher du soleil, détails en cuivre',
    hints: ['C\'est un véhicule volant', 'Il a des engrenages et du métal', 'C\'est un style rétro-futuriste', 'Il y a des ballons'],
  },
  {
    id: 'reproduce-5-library',
    type: 'reproduce',
    difficulty: 5,
    targetPrompt: 'An ancient magical library with floating books, spiral staircases, glowing crystals, and a wise owl perched on a globe, fantasy art',
    targetPromptFr: 'Une bibliothèque magique ancienne avec des livres flottants, des escaliers en spirale et un hibou',
    hints: ['C\'est un lieu de savoir', 'Il y a de la magie', 'Des livres volent', 'Un oiseau sage est présent'],
  },
]

const VARIATION_CHALLENGES: ChallengeData[] = [
  // Niveau 2 - Variations simples
  {
    id: 'variations-2-cottage',
    type: 'variations',
    difficulty: 2,
    targetPrompt: 'A cozy cottage in a flower meadow, sunny summer day, watercolor style',
    targetPromptFr: 'Une petite maison dans un pré fleuri, journée d\'été ensoleillée',
    hints: ['Garde la maison et le pré', 'Change le moment de la journée'],
    variationInstruction: 'Transforme cette scène de jour en scène de NUIT',
  },
  {
    id: 'variations-2-dog',
    type: 'variations',
    difficulty: 2,
    targetPrompt: 'A happy golden retriever dog running in a park, realistic photo',
    targetPromptFr: 'Un golden retriever joyeux qui court dans un parc, photo réaliste',
    hints: ['Garde le même chien', 'Change ce qu\'il fait'],
    variationInstruction: 'Fais dormir le chien au lieu de courir',
  },
  
  // Niveau 3 - Changement de style
  {
    id: 'variations-3-knight',
    type: 'variations',
    difficulty: 3,
    targetPrompt: 'A knight in shining silver armor holding a sword, realistic medieval style',
    targetPromptFr: 'Un chevalier en armure argentée tenant une épée, style médiéval réaliste',
    hints: ['Garde le chevalier et son épée', 'Change le style artistique'],
    variationInstruction: 'Transforme ce chevalier réaliste en style PIXEL ART',
  },
  {
    id: 'variations-3-pizza',
    type: 'variations',
    difficulty: 3,
    targetPrompt: 'A slice of pepperoni pizza on a plate, food photography style',
    targetPromptFr: 'Une part de pizza au pepperoni dans une assiette, style photo culinaire',
    hints: ['Garde la pizza', 'Change le style artistique'],
    variationInstruction: 'Transforme cette photo en style DESSIN ANIMÉ',
  },
  
  // Niveau 4 - Changement d'ambiance
  {
    id: 'variations-4-city',
    type: 'variations',
    difficulty: 4,
    targetPrompt: 'A futuristic city skyline at night, bright neon lights, cyberpunk style, optimistic atmosphere',
    targetPromptFr: 'Une ville futuriste la nuit avec des néons, style cyberpunk optimiste',
    hints: ['Garde la ville et les néons', 'Change l\'ambiance'],
    variationInstruction: 'Rends cette ville ABANDONNÉE et MYSTÉRIEUSE',
  },
  {
    id: 'variations-4-garden',
    type: 'variations',
    difficulty: 4,
    targetPrompt: 'A serene Japanese garden with a red bridge over a koi pond, spring cherry blossoms',
    targetPromptFr: 'Un jardin japonais paisible avec un pont rouge et un étang, cerisiers en fleurs',
    hints: ['Garde le jardin et le pont', 'Change la saison'],
    variationInstruction: 'Transforme ce printemps en HIVER avec de la neige',
  },
  
  // Niveau 5 - Variations complexes
  {
    id: 'variations-5-fairy',
    type: 'variations',
    difficulty: 5,
    targetPrompt: 'A magical fairy sitting on a mushroom in an enchanted forest, soft glowing light, fantasy illustration',
    targetPromptFr: 'Une fée magique assise sur un champignon dans une forêt enchantée',
    hints: ['Garde l\'idée de créature magique', 'Change la créature et le lieu'],
    variationInstruction: 'Remplace la fée par un LUTIN et la forêt par une GROTTE de cristal',
  },
]

// Fonction pour obtenir une image pré-générée depuis Supabase
async function getPreloadedImage(challengeId: string): Promise<string | null> {
  if (!SUPABASE_STORAGE_URL) return null
  
  // 1 seule image par défi
  const imageUrl = `${SUPABASE_STORAGE_URL}/${challengeId}/variant-1.png`
  
  try {
    // Vérifier que l'image existe
    const response = await fetch(imageUrl, { method: 'HEAD' })
    if (response.ok) {
      return imageUrl
    }
  } catch {
    // Image n'existe pas encore
  }
  
  return null
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function ChallengeMode() {
  // Modale d'introduction (première visite)
  const { isFirstVisit, markAsSeen } = useFirstVisit('challenge')
  
  // États
  const [selectedType, setSelectedType] = useState<ChallengeType | null>(null)
  const [activeChallenge, setActiveChallenge] = useState<ActiveChallenge | null>(null)
  const [userPrompt, setUserPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [attempts, setAttempts] = useState<AttemptResult[]>([])
  const [showHintIndex, setShowHintIndex] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(1)
  
  // Ref pour éviter les doubles exécutions avec strict mode
  const isLoadingRef = useRef(false)

  // Générer l'image cible pour un défi
  const generateTargetImage = useCallback(async (challenge: ChallengeData): Promise<string | null> => {
    try {
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: challenge.targetPrompt,
          aspectRatio: '1:1',
          skipUpscale: true,
        }),
      })
      
      if (!response.ok) throw new Error('Erreur génération image cible')
      
      const data = await response.json()
      return data.imageUrl
    } catch (error) {
      console.error('Erreur génération image cible:', error)
      return null
    }
  }, [])

  // Sélectionner et charger un défi
  const selectChallenge = useCallback(async (type: ChallengeType, difficulty: DifficultyLevel) => {
    // Éviter les doubles exécutions (strict mode)
    if (isLoadingRef.current) return
    isLoadingRef.current = true
    
    const challenges = type === 'reproduce' ? REPRODUCE_CHALLENGES : VARIATION_CHALLENGES
    const filtered = challenges.filter(c => c.difficulty === difficulty)
    
    // Choisir un défi au hasard
    const challengeData = filtered.length > 0 
      ? filtered[Math.floor(Math.random() * filtered.length)]
      : challenges.reduce((prev, curr) => 
          Math.abs(curr.difficulty - difficulty) < Math.abs(prev.difficulty - difficulty) ? curr : prev
        )
    
    const visibleId = `${type}-${Date.now()}`
    const newChallenge: ActiveChallenge = {
      ...challengeData,
      visibleId,
      targetImage: null,
      isLoadingTarget: true,
    }
    
    // Reset des états
    setActiveChallenge(newChallenge)
    setUserPrompt('')
    setAttempts([])
    setShowHintIndex(0)
    setShowSolution(false)
    
    // 1. Essayer de charger une image pré-générée (instantané)
    let targetImage = await getPreloadedImage(challengeData.id)
    
    // 2. Si pas d'image pré-générée, générer à la volée (fallback)
    if (!targetImage) {
      console.log(`⏳ Pas d'image pré-générée pour ${challengeData.id}, génération à la volée...`)
      targetImage = await generateTargetImage(challengeData)
    }
    
    // Vérifier qu'on est toujours sur le même défi
    setActiveChallenge(prev => {
      if (prev && prev.visibleId === visibleId) {
        return { ...prev, targetImage, isLoadingTarget: false }
      }
      return prev
    })
    
    isLoadingRef.current = false
  }, [generateTargetImage])

  // Générer l'image de l'utilisateur
  const handleGenerate = async () => {
    if (!userPrompt.trim() || isGenerating || !activeChallenge || !activeChallenge.targetImage) return
    
    setIsGenerating(true)
    const currentPrompt = userPrompt
    
    try {
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          aspectRatio: '1:1',
          skipUpscale: true,
        }),
      })
      
      if (!response.ok) throw new Error('Erreur de génération')
      
      const data = await response.json()
      
      const attemptIndex = attempts.length
      const newAttempt: AttemptResult = {
        userPrompt: currentPrompt,
        generatedImage: data.imageUrl,
        attemptNumber: attemptIndex + 1,
        isAnalyzing: true,
      }
      
      setAttempts(prev => [...prev, newAttempt])
      setUserPrompt('') // Clear pour nouvelle tentative
      setIsGenerating(false)
      
      // Analyser le résultat en arrière-plan
      try {
        const analysisResponse = await fetch('/api/ai/challenge-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetImageUrl: activeChallenge.targetImage,
            resultImageUrl: data.imageUrl,
            userPrompt: currentPrompt,
            originalPrompt: activeChallenge.targetPrompt,
            originalPromptFr: activeChallenge.targetPromptFr,
            difficulty: activeChallenge.difficulty,
          }),
        })
        
        const analysis: AnalysisResult = await analysisResponse.json()
        
        // Mettre à jour la tentative avec l'analyse
        setAttempts(prev => prev.map((attempt, idx) => 
          idx === attemptIndex 
            ? { ...attempt, analysis, isAnalyzing: false }
            : attempt
        ))
      } catch (analysisError) {
        console.error('Erreur analyse:', analysisError)
        // Marquer comme terminé même en cas d'erreur
        setAttempts(prev => prev.map((attempt, idx) => 
          idx === attemptIndex 
            ? { ...attempt, isAnalyzing: false }
            : attempt
        ))
      }
    } catch (error) {
      console.error('Erreur génération:', error)
      setIsGenerating(false)
    }
  }

  // Navigation
  const handleBack = () => {
    if (activeChallenge) {
      setActiveChallenge(null)
      setAttempts([])
      setShowSolution(false)
    } else {
      setSelectedType(null)
    }
  }

  const handleNewChallenge = () => {
    if (selectedType) {
      selectChallenge(selectedType, selectedDifficulty)
    }
  }

  const handleRetry = () => {
    setUserPrompt('')
  }

  // ============================================================================
  // ÉCRAN DE SÉLECTION DU TYPE
  // ============================================================================
  
  if (!selectedType) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-midnight-900 to-midnight-950">
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-aurora-500 to-emerald-500">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-white">Défis Prompting</h1>
              <p className="text-sm text-midnight-400">Entraîne-toi à parler aux IA</p>
            </div>
          </div>
        </div>

        {/* Sélection du type */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
            
            {/* Reproduis l'image */}
            <motion.button
              onClick={() => setSelectedType('reproduce')}
              className="group relative p-8 rounded-2xl bg-gradient-to-b from-midnight-800 to-midnight-900 border border-white/10 hover:border-aurora-500/50 transition-all text-left"
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-aurora-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-aurora-500 to-emerald-500 flex items-center justify-center mb-4">
                  <ImageIcon className="w-7 h-7 text-white" />
                </div>
                
                <h2 className="text-xl font-display font-semibold text-white mb-2">
                  Reproduis l'image
                </h2>
                
                <p className="text-midnight-300 text-sm leading-relaxed mb-4">
                  On te montre une image générée par l'IA. À toi de trouver le prompt qui permet de créer quelque chose de similaire.
                </p>
                
                <div className="flex items-center gap-2 text-midnight-400 text-xs">
                  <Zap className="w-3 h-3" />
                  <span>5 niveaux de difficulté</span>
                </div>
                
                <div className="mt-4 flex items-center text-aurora-400 text-sm font-medium">
                  Commencer
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.button>

            {/* Variations */}
            <motion.button
              onClick={() => setSelectedType('variations')}
              className="group relative p-8 rounded-2xl bg-gradient-to-b from-midnight-800 to-midnight-900 border border-white/10 hover:border-violet-500/50 transition-all text-left"
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center mb-4">
                  <Layers className="w-7 h-7 text-white" />
                </div>
                
                <h2 className="text-xl font-display font-semibold text-white mb-2">
                  Variations
                </h2>
                
                <p className="text-midnight-300 text-sm leading-relaxed mb-4">
                  On te donne une image et une consigne. Modifie ton prompt pour créer la variation demandée.
                </p>
                
                <div className="flex items-center gap-2 text-midnight-400 text-xs">
                  <Zap className="w-3 h-3" />
                  <span>Maîtrise les modifications de prompts</span>
                </div>
                
                <div className="mt-4 flex items-center text-violet-400 text-sm font-medium">
                  Commencer
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.button>

          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // ÉCRAN DE SÉLECTION DE DIFFICULTÉ
  // ============================================================================

  if (!activeChallenge) {
    const isReproduce = selectedType === 'reproduce'
    
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-midnight-900 to-midnight-950">
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-xl hover:bg-white/5 text-midnight-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-display font-bold text-white">
                {isReproduce ? 'Reproduis l\'image' : 'Variations'}
              </h1>
              <p className="text-sm text-midnight-400">Choisis ton niveau de difficulté</p>
            </div>
          </div>
        </div>

        {/* Sélection de difficulté */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-3">
            
            {[1, 2, 3, 4, 5].map((level) => {
              const config = {
                1: { label: 'Découverte', desc: 'Objets simples et basiques', color: 'from-emerald-500 to-teal-500' },
                2: { label: 'Facile', desc: 'Personnages et objets avec détails', color: 'from-cyan-500 to-blue-500' },
                3: { label: 'Intermédiaire', desc: 'Scènes complètes avec contexte', color: 'from-blue-500 to-indigo-500' },
                4: { label: 'Avancé', desc: 'Atmosphères et ambiances complexes', color: 'from-violet-500 to-purple-500' },
                5: { label: 'Expert', desc: 'Images très détaillées et créatives', color: 'from-purple-500 to-pink-500' },
              }[level]!
              
              return (
                <motion.button
                  key={level}
                  onClick={() => {
                    setSelectedDifficulty(level as DifficultyLevel)
                    selectChallenge(selectedType, level as DifficultyLevel)
                  }}
                  className="w-full p-4 rounded-xl border text-left transition-all bg-midnight-800/50 hover:bg-midnight-800 border-white/10 hover:border-white/20"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg bg-gradient-to-r flex items-center justify-center text-white font-bold",
                        config.color
                      )}>
                        {level}
                      </div>
                      <div>
                        <div className="text-white font-medium">{config.label}</div>
                        <p className="text-sm text-midnight-400">{config.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-midnight-500" />
                  </div>
                </motion.button>
              )
            })}
            
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // ÉCRAN DU DÉFI
  // ============================================================================

  const isReproduce = activeChallenge.type === 'reproduce'
  const latestAttempt = attempts[attempts.length - 1]
  const hasAttempted = attempts.length > 0

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-midnight-900 to-midnight-950">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-xl hover:bg-white/5 text-midnight-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-display font-bold text-white">
                {isReproduce ? 'Reproduis l\'image' : 'Crée la variation'}
              </h1>
              <div className="flex items-center gap-2 text-sm text-midnight-400">
                <span>Niveau {activeChallenge.difficulty}</span>
                {hasAttempted && (
                  <>
                    <span>•</span>
                    <span>{attempts.length} tentative{attempts.length > 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleNewChallenge}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-midnight-400 hover:text-white transition-colors"
            title="Nouveau défi"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Nouveau défi</span>
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Consigne pour les variations */}
          {!isReproduce && activeChallenge.variationInstruction && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <Target className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <div className="text-sm text-violet-300 font-medium mb-1">Ta mission</div>
                  <div className="text-white">{activeChallenge.variationInstruction}</div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Zone des images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
            
            {/* Image cible */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-midnight-300">
                {isReproduce ? 'Image à reproduire' : 'Image de départ'}
              </h3>
              <div className="aspect-square rounded-2xl bg-midnight-800 border border-white/10 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  {activeChallenge.isLoadingTarget ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <Loader2 className="w-10 h-10 text-aurora-500 animate-spin mx-auto mb-3" />
                        <p className="text-midnight-400 text-sm">Génération du défi...</p>
                      </div>
                    </motion.div>
                  ) : activeChallenge.targetImage ? (
                    <motion.img 
                      key="image"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={activeChallenge.targetImage} 
                      alt="Image cible"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <motion.div 
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="text-center p-4">
                        <ImageIcon className="w-10 h-10 text-midnight-600 mx-auto mb-2" />
                        <p className="text-midnight-500 text-sm">Erreur de chargement</p>
                        <button 
                          onClick={handleNewChallenge}
                          className="mt-2 text-aurora-400 text-sm hover:underline"
                        >
                          Réessayer
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Image générée par l'utilisateur */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-midnight-300">
                Ton résultat
              </h3>
              <div className="aspect-square rounded-2xl bg-midnight-800 border border-white/10 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div 
                      key="generating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <Loader2 className="w-10 h-10 text-aurora-500 animate-spin mx-auto mb-3" />
                        <p className="text-midnight-400 text-sm">Génération en cours...</p>
                      </div>
                    </motion.div>
                  ) : latestAttempt ? (
                    <motion.img 
                      key={latestAttempt.attemptNumber}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={latestAttempt.generatedImage} 
                      alt="Ton résultat"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="text-center p-4">
                        <Sparkles className="w-10 h-10 text-midnight-600 mx-auto mb-2" />
                        <p className="text-midnight-500 text-sm">
                          Écris ton prompt ci-dessous
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Feedback d'analyse */}
              <AnimatePresence>
                {latestAttempt?.isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 p-3 rounded-xl bg-midnight-700/50 border border-white/5"
                  >
                    <div className="flex items-center gap-2 text-midnight-400 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyse en cours...
                    </div>
                  </motion.div>
                )}
                {latestAttempt?.analysis && !latestAttempt.isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 space-y-3"
                  >
                    {/* Score */}
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "text-2xl font-bold",
                        latestAttempt.analysis.score >= 80 ? "text-emerald-400" :
                        latestAttempt.analysis.score >= 60 ? "text-amber-400" :
                        latestAttempt.analysis.score >= 40 ? "text-orange-400" :
                        "text-red-400"
                      )}>
                        {latestAttempt.analysis.score}%
                      </div>
                      <div className="flex-1 h-2 bg-midnight-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${latestAttempt.analysis.score}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={cn(
                            "h-full rounded-full",
                            latestAttempt.analysis.score >= 80 ? "bg-emerald-500" :
                            latestAttempt.analysis.score >= 60 ? "bg-amber-500" :
                            latestAttempt.analysis.score >= 40 ? "bg-orange-500" :
                            "bg-red-500"
                          )}
                        />
                      </div>
                    </div>
                    
                    {/* Feedback principal */}
                    <p className="text-white text-sm leading-relaxed">
                      {latestAttempt.analysis.feedback}
                    </p>
                    
                    {/* Points forts */}
                    {latestAttempt.analysis.strengths && latestAttempt.analysis.strengths.length > 0 && (
                      <div className="space-y-1">
                        {latestAttempt.analysis.strengths.map((strength, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-emerald-400 mt-0.5">✓</span>
                            <span className="text-emerald-300">{strength}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Conseils */}
                    {latestAttempt.analysis.promptTips && latestAttempt.analysis.promptTips.length > 0 && (
                      <div className="p-3 rounded-lg bg-aurora-500/10 border border-aurora-500/20">
                        <div className="text-xs text-aurora-400 font-medium mb-1">Conseil</div>
                        {latestAttempt.analysis.promptTips.map((tip, i) => (
                          <p key={i} className="text-aurora-200 text-sm">{tip}</p>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
          </div>

          {/* Zone de saisie et actions */}
          <div className="space-y-4">
            
            {/* Indices et solution */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Bouton indices */}
              {activeChallenge.hints.length > 0 && showHintIndex < activeChallenge.hints.length && (
                <button
                  onClick={() => setShowHintIndex(prev => Math.min(prev + 1, activeChallenge.hints.length))}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-sm hover:bg-amber-500/20 transition-colors"
                >
                  <Lightbulb className="w-4 h-4" />
                  {showHintIndex === 0 ? 'Besoin d\'un indice ?' : 'Indice suivant'}
                </button>
              )}
              
              {/* Indices affichés */}
              {showHintIndex > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeChallenge.hints.slice(0, showHintIndex).map((hint, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-sm"
                    >
                      {hint}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Bouton voir solution (après au moins 1 tentative) */}
              {hasAttempted && (
                <button
                  onClick={() => setShowSolution(!showSolution)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-midnight-700 text-midnight-300 text-sm hover:bg-midnight-600 hover:text-white transition-colors ml-auto"
                >
                  {showSolution ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showSolution ? 'Cacher' : 'Voir le prompt original'}
                </button>
              )}
            </div>
            
            {/* Solution révélée */}
            <AnimatePresence>
              {showSolution && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-start gap-3">
                      <Trophy className="w-5 h-5 text-emerald-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-emerald-300 font-medium mb-2">Prompt original utilisé</div>
                        <p className="text-white text-sm">{activeChallenge.targetPromptFr}</p>
                        <p className="text-midnight-400 text-xs mt-2 font-mono">{activeChallenge.targetPrompt}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input prompt */}
            <div className="relative">
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder={
                  isReproduce 
                    ? "Décris ce que tu vois pour que l'IA puisse le recréer..." 
                    : "Écris le prompt pour créer la variation demandée..."
                }
                className="w-full h-28 p-4 rounded-xl bg-midnight-800 border border-white/10 focus:border-aurora-500/50 focus:outline-none text-white placeholder:text-midnight-500 resize-none"
                disabled={isGenerating || activeChallenge.isLoadingTarget}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleGenerate()
                  }
                }}
              />
              <div className="absolute bottom-3 right-3 text-xs text-midnight-500">
                ⌘ + Entrée pour générer
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {hasAttempted && (
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-midnight-700 hover:bg-midnight-600 text-white text-sm transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Nouvelle tentative
                  </button>
                )}
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={!userPrompt.trim() || isGenerating || activeChallenge.isLoadingTarget}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all",
                  "bg-gradient-to-r from-aurora-500 to-emerald-500 shadow-lg",
                  (!userPrompt.trim() || isGenerating || activeChallenge.isLoadingTarget) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Générer
                  </>
                )}
              </button>
            </div>
            
            {/* Historique des tentatives */}
            {attempts.length > 1 && (
              <div className="pt-4 border-t border-white/5">
                <div className="text-sm text-midnight-400 mb-3">Tes tentatives précédentes</div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {attempts.slice(0, -1).map((attempt, i) => (
                    <div key={i} className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/10">
                        <img 
                          src={attempt.generatedImage} 
                          alt={`Tentative ${attempt.attemptNumber}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs text-midnight-500 mt-1 text-center">
                        #{attempt.attemptNumber}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>

        </div>
      </div>
      
      {/* Modale d'introduction - première visite */}
      <ModeIntroModal
        mode="challenge"
        isOpen={isFirstVisit}
        onClose={markAsSeen}
      />
    </div>
  )
}

export default ChallengeMode
