'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModeIntroModal, useFirstVisit } from '@/components/ui/ModeIntroModal'
import { useTranslations, useLocale } from '@/lib/i18n/context'
import { useChallengeProgressStore } from '@/store/useChallengeProgressStore'
import { useAuthStore } from '@/store/useAuthStore'

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
  // ========== Niveau 1 - Objets simples ==========
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
  {
    id: 'reproduce-1-butterfly',
    type: 'reproduce',
    difficulty: 1,
    targetPrompt: 'A colorful butterfly with blue and orange wings sitting on a pink flower, garden background, soft focus',
    targetPromptFr: 'Un papillon coloré aux ailes bleues et oranges posé sur une fleur rose dans un jardin',
    hints: ['C\'est un insecte qui vole', 'Il a de grandes ailes colorées', 'Il est posé sur une fleur'],
  },
  {
    id: 'reproduce-1-moon',
    type: 'reproduce',
    difficulty: 1,
    targetPrompt: 'A big bright full moon reflecting on a calm ocean at night, stars in the sky, peaceful and dreamy',
    targetPromptFr: 'Une grande pleine lune brillante se reflétant sur un océan calme, ciel étoilé',
    hints: ['C\'est la nuit', 'Il y a de l\'eau', 'Quelque chose de rond brille dans le ciel'],
  },

  // ========== Niveau 2 - Personnages avec contexte ==========
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
  {
    id: 'reproduce-2-penguin',
    type: 'reproduce',
    difficulty: 2,
    targetPrompt: 'A cute penguin wearing a red scarf standing on an icy shore, snowflakes falling, cartoon illustration style',
    targetPromptFr: 'Un pingouin mignon portant une écharpe rouge sur un rivage glacé, flocons de neige',
    hints: ['C\'est un animal noir et blanc', 'Il porte un vêtement', 'Il fait très froid'],
  },
  {
    id: 'reproduce-2-owl',
    type: 'reproduce',
    difficulty: 2,
    targetPrompt: 'A wise brown owl sitting on a tree branch at night, big yellow eyes glowing, full moon behind, storybook style',
    targetPromptFr: 'Un hibou brun sage sur une branche la nuit, grands yeux jaunes brillants, pleine lune',
    hints: ['C\'est un oiseau nocturne', 'Il a de grands yeux', 'C\'est la nuit', 'Il est dans un arbre'],
  },

  // ========== Niveau 3 - Scènes complètes ==========
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
  {
    id: 'reproduce-3-market',
    type: 'reproduce',
    difficulty: 3,
    targetPrompt: 'A colorful outdoor market with fruit stalls and flower baskets, cobblestone street, sunny Mediterranean village',
    targetPromptFr: 'Un marché coloré en plein air avec des étals de fruits et des paniers de fleurs, village méditerranéen',
    hints: ['C\'est un lieu où on achète des choses', 'Il y a des fruits et des fleurs', 'C\'est dehors au soleil', 'Les rues sont en pierre'],
  },
  {
    id: 'reproduce-3-lighthouse',
    type: 'reproduce',
    difficulty: 3,
    targetPrompt: 'A red and white striped lighthouse on a rocky cliff, waves crashing below, dramatic cloudy sky, oil painting style',
    targetPromptFr: 'Un phare rouge et blanc sur une falaise rocheuse, vagues en contrebas, ciel dramatique',
    hints: ['C\'est une tour près de la mer', 'Elle guide les bateaux', 'Il y a des vagues', 'Le ciel est impressionnant'],
  },

  // ========== Niveau 4 - Atmosphères ==========
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
  {
    id: 'reproduce-4-volcano',
    type: 'reproduce',
    difficulty: 4,
    targetPrompt: 'A volcano erupting at night with glowing lava flowing down into the dark sea, red and orange sky, dramatic and powerful scene',
    targetPromptFr: 'Un volcan en éruption la nuit avec de la lave coulant vers la mer sombre, ciel rouge et orange',
    hints: ['C\'est une montagne spéciale', 'Du feu en sort', 'C\'est la nuit', 'Il y a de l\'eau pas loin'],
  },
  {
    id: 'reproduce-4-lanterns',
    type: 'reproduce',
    difficulty: 4,
    targetPrompt: 'Hundreds of glowing paper lanterns floating into a dark night sky above a calm river, warm orange light reflecting on water, magical festival scene',
    targetPromptFr: 'Des centaines de lanternes en papier flottant dans le ciel nocturne au-dessus d\'une rivière calme',
    hints: ['C\'est la nuit', 'Des lumières montent dans le ciel', 'Il y a de l\'eau en bas', 'C\'est une fête magique'],
  },

  // ========== Niveau 5 - Complexe ==========
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
  {
    id: 'reproduce-5-clocktower',
    type: 'reproduce',
    difficulty: 5,
    targetPrompt: 'A giant clockwork tower in a fantasy city, massive gears and cogs visible, tiny people on bridges between buildings, warm bronze and gold tones, steampunk illustration',
    targetPromptFr: 'Une tour géante à engrenages dans une ville fantastique, petites personnes sur des ponts, tons bronze et or',
    hints: ['C\'est un bâtiment mécanique géant', 'On voit des rouages', 'Il y a une ville autour', 'Les couleurs sont chaudes et métalliques'],
  },
  {
    id: 'reproduce-5-crystal',
    type: 'reproduce',
    difficulty: 5,
    targetPrompt: 'An ice palace made entirely of blue crystal in a frozen valley, northern lights reflecting on crystalline walls, intricate frost patterns, fantasy art, highly detailed',
    targetPromptFr: 'Un palais de glace en cristal bleu dans une vallée gelée, aurores boréales se reflétant sur les murs',
    hints: ['C\'est un bâtiment très froid', 'Il est fait de glace', 'Le ciel a des couleurs', 'Tout brille et se reflète'],
  },
]

const VARIATION_CHALLENGES: ChallengeData[] = [
  // ========== Niveau 1 - Variations très simples (changer 1 couleur ou 1 élément évident) ==========
  {
    id: 'variations-1-balloon',
    type: 'variations',
    difficulty: 1,
    targetPrompt: 'A single red balloon floating in a bright blue sky, simple illustration',
    targetPromptFr: 'Un ballon rouge flottant dans un ciel bleu, illustration simple',
    hints: ['Garde le ballon', 'Change sa couleur'],
    variationInstruction: 'Change le ballon ROUGE en ballon VERT',
  },
  {
    id: 'variations-1-car',
    type: 'variations',
    difficulty: 1,
    targetPrompt: 'A small blue car parked on a street, sunny day, cartoon style',
    targetPromptFr: 'Une petite voiture bleue garée dans une rue, journée ensoleillée, style cartoon',
    hints: ['Garde la voiture', 'Change sa couleur'],
    variationInstruction: 'Change la voiture BLEUE en voiture JAUNE',
  },
  {
    id: 'variations-1-flower',
    type: 'variations',
    difficulty: 1,
    targetPrompt: 'A big yellow sunflower in a garden, blue sky, simple and bright',
    targetPromptFr: 'Un grand tournesol jaune dans un jardin, ciel bleu, simple et lumineux',
    hints: ['Garde la fleur dans le jardin', 'Change le type de fleur'],
    variationInstruction: 'Remplace le TOURNESOL par une ROSE ROUGE',
  },
  {
    id: 'variations-1-hat',
    type: 'variations',
    difficulty: 1,
    targetPrompt: 'A cute white cat wearing a small red hat, sitting, simple illustration',
    targetPromptFr: 'Un mignon chat blanc portant un petit chapeau rouge, assis, illustration simple',
    hints: ['Garde le chat', 'Change ce qu\'il porte'],
    variationInstruction: 'Remplace le CHAPEAU par des LUNETTES DE SOLEIL',
  },

  // ========== Niveau 2 - Variations simples (changer 1 chose) ==========
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
  {
    id: 'variations-2-snowman',
    type: 'variations',
    difficulty: 2,
    targetPrompt: 'A snowman with a top hat and carrot nose in a snowy garden, daytime, cheerful',
    targetPromptFr: 'Un bonhomme de neige avec un chapeau haut-de-forme et un nez carotte dans un jardin enneigé',
    hints: ['Garde le bonhomme de neige', 'Change l\'endroit où il se trouve'],
    variationInstruction: 'Mets le bonhomme de neige sur une PLAGE au soleil',
  },
  {
    id: 'variations-2-fish',
    type: 'variations',
    difficulty: 2,
    targetPrompt: 'A bright orange clownfish swimming in blue water, simple underwater scene',
    targetPromptFr: 'Un poisson-clown orange vif nageant dans l\'eau bleue',
    hints: ['Garde le poisson', 'Change sa couleur'],
    variationInstruction: 'Change le poisson ORANGE en poisson VIOLET',
  },

  // ========== Niveau 3 - Changement de style ==========
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
  {
    id: 'variations-3-rocket',
    type: 'variations',
    difficulty: 3,
    targetPrompt: 'A colorful rocket ship flying through space with stars, realistic digital art',
    targetPromptFr: 'Une fusée colorée volant dans l\'espace avec des étoiles, art digital réaliste',
    hints: ['Garde la fusée et l\'espace', 'Change le style artistique'],
    variationInstruction: 'Transforme cette fusée réaliste en style ORIGAMI / papier plié',
  },
  {
    id: 'variations-3-cat',
    type: 'variations',
    difficulty: 3,
    targetPrompt: 'An orange cat sitting on a windowsill looking outside, sunny day, photograph',
    targetPromptFr: 'Un chat orange assis sur le rebord d\'une fenêtre regardant dehors, photo',
    hints: ['Garde le chat et la fenêtre', 'Change le style artistique'],
    variationInstruction: 'Transforme cette photo en style AQUARELLE',
  },

  // ========== Niveau 4 - Changement d'ambiance ==========
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
  {
    id: 'variations-4-ship',
    type: 'variations',
    difficulty: 4,
    targetPrompt: 'A pirate ship sailing on calm turquoise water, sunny day, adventure illustration',
    targetPromptFr: 'Un bateau pirate naviguant sur une eau turquoise calme, journée ensoleillée',
    hints: ['Garde le bateau pirate', 'Change la météo et l\'ambiance'],
    variationInstruction: 'Mets le bateau dans une TEMPÊTE avec des éclairs et des vagues géantes',
  },
  {
    id: 'variations-4-train',
    type: 'variations',
    difficulty: 4,
    targetPrompt: 'A red steam train crossing a bridge in a green countryside, summer day, cheerful atmosphere',
    targetPromptFr: 'Un train à vapeur rouge traversant un pont dans la campagne verte, journée d\'été',
    hints: ['Garde le train et le pont', 'Change la saison et l\'ambiance'],
    variationInstruction: 'Transforme en scène HIVERNALE NOCTURNE avec de la neige et des étoiles',
  },

  // ========== Niveau 5 - Variations complexes (changer plusieurs choses) ==========
  {
    id: 'variations-5-fairy',
    type: 'variations',
    difficulty: 5,
    targetPrompt: 'A magical fairy sitting on a mushroom in an enchanted forest, soft glowing light, fantasy illustration',
    targetPromptFr: 'Une fée magique assise sur un champignon dans une forêt enchantée',
    hints: ['Garde l\'idée de créature magique', 'Change la créature et le lieu'],
    variationInstruction: 'Remplace la fée par un LUTIN et la forêt par une GROTTE de cristal',
  },
  {
    id: 'variations-5-castle',
    type: 'variations',
    difficulty: 5,
    targetPrompt: 'A medieval castle on a hilltop surrounded by green fields, sunny day, fantasy illustration',
    targetPromptFr: 'Un château médiéval sur une colline entouré de champs verts, journée ensoleillée',
    hints: ['Garde l\'idée d\'un grand bâtiment', 'Change l\'époque et le lieu'],
    variationInstruction: 'Transforme ce château médiéval en STATION SPATIALE en orbite autour d\'une planète',
  },
  {
    id: 'variations-5-forest',
    type: 'variations',
    difficulty: 5,
    targetPrompt: 'A dark enchanted forest with glowing mushrooms on the ground, mysterious night scene, fantasy art',
    targetPromptFr: 'Une forêt enchantée sombre avec des champignons lumineux, scène nocturne mystérieuse',
    hints: ['Garde l\'idée de lieu magique lumineux', 'Change complètement l\'environnement'],
    variationInstruction: 'Transforme cette forêt en FOND MARIN avec des coraux et des méduses bioluminescentes',
  },
  {
    id: 'variations-5-phoenix',
    type: 'variations',
    difficulty: 5,
    targetPrompt: 'A majestic red phoenix bird with fiery wings flying over a volcano, dramatic sunset, epic fantasy art',
    targetPromptFr: 'Un phénix rouge majestueux aux ailes de feu volant au-dessus d\'un volcan, coucher de soleil',
    hints: ['Garde l\'idée d\'une créature volante puissante', 'Change la créature, les couleurs et le décor'],
    variationInstruction: 'Remplace le phénix par un DRAGON DE GLACE bleu volant au-dessus d\'un océan gelé sous les aurores boréales',
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

// Polling pour attendre qu'un job de génération d'image soit terminé
async function pollImageJob(jobId: string, model?: string): Promise<string> {
  const maxPolls = 80 // 80 x 1.5s = 2 min
  const pollInterval = 1500

  for (let i = 0; i < maxPolls; i++) {
    // Premier poll après 3s (fal.ai ne finit jamais en moins), puis 1.5s
    await new Promise(resolve => setTimeout(resolve, i === 0 ? 3000 : pollInterval))

    const statusUrl = `/api/ai/image?jobId=${encodeURIComponent(jobId)}&model=${encodeURIComponent(model || 'nano-banana')}`
    const statusResponse = await fetch(statusUrl)
    const statusData = await statusResponse.json()

    if (statusData.status === 'completed' && statusData.imageUrl) {
      return statusData.imageUrl
    }

    if (statusData.status === 'failed') {
      throw new Error(statusData.error || 'La génération a échoué')
    }
  }

  throw new Error('Timeout - la génération prend trop de temps')
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
  const [pollingProgress, setPollingProgress] = useState('')
  const [showInstructions, setShowInstructions] = useState(true)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [justUnlockedLevel, setJustUnlockedLevel] = useState<number | null>(null)

  const t = useTranslations('challenge')
  const locale = useLocale()

  // Progression store
  const { recordAttempt, isLevelUnlocked, getBestScoreForLevel, getSuccessCountForLevel, getScoreThresholdForLevel, loadFromServer, _synced } = useChallengeProgressStore()
  const user = useAuthStore(s => s.user)

  // Load progress from server on mount
  useEffect(() => {
    if (user?.id && !_synced) {
      loadFromServer(user.id)
    }
  }, [user?.id, _synced, loadFromServer])

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
          resolution: '1K', // Défis : 1K suffit (affiché ~400px)
        }),
      })

      if (!response.ok) throw new Error('Erreur génération image cible')

      const data = await response.json()

      // Polling si le job est en attente
      if (data.status === 'pending' && data.jobId) {
        return await pollImageJob(data.jobId, data.model)
      }

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
    setShowInstructions(false)
    setIsNewRecord(false)
    const currentPrompt = userPrompt

    try {
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          aspectRatio: '1:1',
          resolution: '1K', // Défis : 1K suffit (affiché ~400px)
        }),
      })

      if (!response.ok) throw new Error('Erreur de génération')

      let data = await response.json()

      // Polling si le job est en attente
      if (data.status === 'pending' && data.jobId) {
        setPollingProgress(t('pollingProgress'))
        const imageUrl = await pollImageJob(data.jobId, data.model)
        data = { ...data, imageUrl, status: 'completed' }
        setPollingProgress('')
      }

      const attemptIndex = attempts.length
      const newAttempt: AttemptResult = {
        userPrompt: currentPrompt,
        generatedImage: data.imageUrl,
        attemptNumber: attemptIndex + 1,
        isAnalyzing: true,
      }

      setAttempts(prev => [...prev, newAttempt])
      setUserPrompt('')
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
            locale,
          }),
        })

        const analysis: AnalysisResult = await analysisResponse.json()

        // Record attempt in progress store
        if (activeChallenge.id) {
          const prevUnlocked = activeChallenge.difficulty < 5
            ? isLevelUnlocked(activeChallenge.type, activeChallenge.difficulty + 1)
            : true
          const newRec = recordAttempt(activeChallenge.id, analysis.score, user?.id)
          setIsNewRecord(newRec)

          // Check if next level was just unlocked
          if (!prevUnlocked && activeChallenge.difficulty < 5
            && isLevelUnlocked(activeChallenge.type, activeChallenge.difficulty + 1)) {
            setJustUnlockedLevel(activeChallenge.difficulty + 1)
          }
        }

        setAttempts(prev => prev.map((attempt, idx) =>
          idx === attemptIndex
            ? { ...attempt, analysis, isAnalyzing: false }
            : attempt
        ))
      } catch (analysisError) {
        console.error('Erreur analyse:', analysisError)
        setAttempts(prev => prev.map((attempt, idx) =>
          idx === attemptIndex
            ? { ...attempt, isAnalyzing: false }
            : attempt
        ))
      }
    } catch (error) {
      console.error('Erreur génération:', error)
      setIsGenerating(false)
      setPollingProgress('')
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
              <h1 className="text-xl font-display font-bold text-white">{t('title')}</h1>
              <p className="text-sm text-midnight-400">{t('subtitle')}</p>
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
                  {t('reproduceTitle')}
                </h2>

                <p className="text-midnight-300 text-sm leading-relaxed mb-4">
                  {t('reproduceDesc')}
                </p>

                <div className="flex items-center gap-2 text-midnight-400 text-xs">
                  <Zap className="w-3 h-3" />
                  <span>{t('reproduceBadge')}</span>
                </div>

                <div className="mt-4 flex items-center text-aurora-400 text-sm font-medium">
                  {t('start')}
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
                  {t('variationsTitle')}
                </h2>

                <p className="text-midnight-300 text-sm leading-relaxed mb-4">
                  {t('variationsDesc')}
                </p>

                <div className="flex items-center gap-2 text-midnight-400 text-xs">
                  <Zap className="w-3 h-3" />
                  <span>{t('variationsBadge')}</span>
                </div>

                <div className="mt-4 flex items-center text-violet-400 text-sm font-medium">
                  {t('start')}
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
                {isReproduce ? t('reproduceTitle') : t('variationsTitle')}
              </h1>
              <p className="text-sm text-midnight-400">{t('chooseDifficulty')}</p>
            </div>
          </div>
        </div>

        {/* Sélection de difficulté */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-3">
            
            {[1, 2, 3, 4, 5].map((level) => {
              const config = {
                1: { label: t('difficulty1Label'), desc: t('difficulty1Desc'), color: 'from-emerald-500 to-teal-500' },
                2: { label: t('difficulty2Label'), desc: t('difficulty2Desc'), color: 'from-cyan-500 to-blue-500' },
                3: { label: t('difficulty3Label'), desc: t('difficulty3Desc'), color: 'from-blue-500 to-indigo-500' },
                4: { label: t('difficulty4Label'), desc: t('difficulty4Desc'), color: 'from-violet-500 to-purple-500' },
                5: { label: t('difficulty5Label'), desc: t('difficulty5Desc'), color: 'from-purple-500 to-pink-500' },
              }[level]!

              const unlocked = isLevelUnlocked(selectedType, level)
              const bestScore = getBestScoreForLevel(selectedType, level)

              return (
                <motion.button
                  key={level}
                  onClick={() => {
                    if (!unlocked) return
                    setSelectedDifficulty(level as DifficultyLevel)
                    selectChallenge(selectedType, level as DifficultyLevel)
                  }}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all",
                    unlocked
                      ? "bg-midnight-800/50 hover:bg-midnight-800 border-white/10 hover:border-white/20 cursor-pointer"
                      : "bg-midnight-900/50 border-white/5 cursor-not-allowed opacity-60"
                  )}
                  whileHover={unlocked ? { x: 4 } : undefined}
                  whileTap={unlocked ? { scale: 0.98 } : undefined}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg bg-gradient-to-r flex items-center justify-center text-white font-bold",
                        unlocked ? config.color : "from-midnight-600 to-midnight-700"
                      )}>
                        {unlocked ? level : <Lock className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className={cn("font-medium", unlocked ? "text-white" : "text-midnight-500")}>
                          {config.label}
                        </div>
                        <p className="text-sm text-midnight-400">
                          {unlocked ? config.desc : t('lockedLevel', { level: level - 1, threshold: getScoreThresholdForLevel(level - 1) })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {unlocked && (() => {
                        const successCount = getSuccessCountForLevel(selectedType, level)
                        return (
                          <>
                            {successCount > 0 && (
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                successCount >= 3 ? "bg-emerald-500/20 text-emerald-400" :
                                "bg-amber-500/20 text-amber-400"
                              )}>
                                {t('successCount', { count: Math.min(successCount, 3) })}
                              </span>
                            )}
                            {bestScore > 0 && (
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                bestScore >= 70 ? "bg-emerald-500/20 text-emerald-400" :
                                bestScore >= 40 ? "bg-amber-500/20 text-amber-400" :
                                "bg-midnight-600 text-midnight-300"
                              )}>
                                {t('bestScore', { score: bestScore })}
                              </span>
                            )}
                          </>
                        )
                      })()}
                      {unlocked ? (
                        <ArrowRight className="w-5 h-5 text-midnight-500" />
                      ) : (
                        <Lock className="w-4 h-4 text-midnight-600" />
                      )}
                    </div>
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
                {isReproduce ? t('reproduceTitle') : t('createVariation')}
              </h1>
              <div className="flex items-center gap-2 text-sm text-midnight-400">
                <span>{t('level')} {activeChallenge.difficulty}</span>
                {hasAttempted && (
                  <>
                    <span>•</span>
                    <span>{attempts.length} {attempts.length > 1 ? t('attempts') : t('attempt')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleNewChallenge}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-midnight-400 hover:text-white transition-colors"
            title={t('newChallenge')}
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">{t('newChallenge')}</span>
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-h-0 p-4 md:p-6">
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col min-h-0">
          
          {/* Consigne pour les variations */}
          {!isReproduce && activeChallenge.variationInstruction && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 flex-shrink-0"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <Target className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <div className="text-sm text-violet-300 font-medium mb-1">{t('mission')}</div>
                  <div className="text-white">{t(`challenges.${activeChallenge.id}.variationInstruction`)}</div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Instructions pour les enfants */}
          {showInstructions && !hasAttempted && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 rounded-xl bg-aurora-500/10 border border-aurora-500/20 flex-shrink-0"
            >
              <div className="text-sm font-medium text-aurora-300 mb-1.5">{t('instructionTitle')}</div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-midnight-200">
                <span>1. {t('instructionStep1')}</span>
                <span>2. {t('instructionStep2')}</span>
                <span>3. {t('instructionStep3')}</span>
              </div>
            </motion.div>
          )}

          {/* Zone des images */}
          <div className="flex gap-3 mb-3 flex-1 min-h-0">

            {/* Image cible */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              <h3 className="text-xs font-medium text-midnight-300 mb-1 flex-shrink-0">
                {isReproduce ? t('targetImageLabel') : t('startImageLabel')}
              </h3>
              <div className="flex-1 min-h-0 rounded-2xl bg-midnight-800 border border-white/10 overflow-hidden relative">
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
                        <p className="text-midnight-400 text-sm">{t('generatingChallenge')}</p>
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
                        <p className="text-midnight-500 text-sm">{t('loadError')}</p>
                        <button
                          onClick={handleNewChallenge}
                          className="mt-2 text-aurora-400 text-sm hover:underline"
                        >
                          {t('retry')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Image générée par l'utilisateur */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              <h3 className="text-xs font-medium text-midnight-300 mb-1 flex-shrink-0">
                {t('yourResult')}
              </h3>
              <div className="flex-1 min-h-0 rounded-2xl bg-midnight-800 border border-white/10 overflow-hidden relative">
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
                        <p className="text-midnight-400 text-sm">{pollingProgress || t('generatingImage')}</p>
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
                          {t('writePrompt')}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Feedback d'analyse - compact */}
              <AnimatePresence>
                {latestAttempt?.isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 p-2 rounded-lg bg-midnight-700/50 border border-white/5"
                  >
                    <div className="flex items-center gap-2 text-midnight-400 text-xs">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {t('analyzing')}
                    </div>
                  </motion.div>
                )}
                {latestAttempt?.analysis && !latestAttempt.isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 p-2 rounded-lg bg-midnight-700/50 border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={cn(
                          "text-lg font-bold",
                          latestAttempt.analysis.score >= 80 ? "text-emerald-400" :
                          latestAttempt.analysis.score >= 60 ? "text-amber-400" :
                          latestAttempt.analysis.score >= 40 ? "text-orange-400" :
                          "text-red-400"
                        )}>
                          {latestAttempt.analysis.score}%
                        </div>
                        {isNewRecord && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-[10px] font-bold text-amber-400 whitespace-nowrap"
                          >
                            {t('newRecord')}
                          </motion.div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="h-1.5 bg-midnight-600 rounded-full overflow-hidden mb-1">
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
                        <p className="text-white text-xs leading-snug line-clamp-2">{latestAttempt.analysis.feedback}</p>
                      </div>
                    </div>
                    {latestAttempt.analysis.promptTips && latestAttempt.analysis.promptTips.length > 0 && (
                      <div className="mt-1.5 text-xs text-aurora-300">
                        <span className="text-aurora-400 font-medium">{t('tip')}: </span>
                        {latestAttempt.analysis.promptTips[0]}
                      </div>
                    )}
                    {/* Encouragement message for progression */}
                    {activeChallenge && (() => {
                      const threshold = getScoreThresholdForLevel(activeChallenge.difficulty)
                      if (latestAttempt.analysis.score < threshold) return null
                      const successCount = getSuccessCountForLevel(activeChallenge.type, activeChallenge.difficulty)
                      if (successCount >= 3) return null // unlock animation handles this
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                        >
                          <div className="text-xs font-medium text-emerald-400">
                            {t('successCount', { count: successCount })}
                            {' — '}
                            {successCount === 1 ? t('encouragement1') : t('encouragement2')}
                          </div>
                        </motion.div>
                      )
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
          </div>

          {/* Zone de saisie et actions */}
          <div className="space-y-2 flex-shrink-0">
            
            {/* Indices et solution */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Bouton indices */}
              {activeChallenge.hints.length > 0 && showHintIndex < activeChallenge.hints.length && (
                <button
                  onClick={() => setShowHintIndex(prev => Math.min(prev + 1, activeChallenge.hints.length))}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-sm hover:bg-amber-500/20 transition-colors"
                >
                  <Lightbulb className="w-4 h-4" />
                  {showHintIndex === 0 ? t('needHint') : t('nextHint')}
                </button>
              )}
              
              {/* Indices affichés */}
              {showHintIndex > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: Math.min(showHintIndex, activeChallenge.hints.length) }, (_, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-sm"
                    >
                      {t(`challenges.${activeChallenge.id}.hint${i}`)}
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
                  {showSolution ? t('hide') : t('showOriginal')}
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
                        <div className="text-sm text-emerald-300 font-medium mb-2">{t('originalUsed')}</div>
                        <p className="text-white text-sm">{t(`challenges.${activeChallenge.id}.description`)}</p>
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
                placeholder={isReproduce ? t('placeholderReproduce') : t('placeholderVariation')}
                className="w-full h-16 p-3 rounded-xl bg-midnight-800 border border-white/10 focus:border-aurora-500/50 focus:outline-none text-white text-sm placeholder:text-midnight-500 resize-none"
                disabled={isGenerating || activeChallenge.isLoadingTarget}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleGenerate()
                  }
                }}
              />
              <div className="absolute bottom-3 right-3 text-xs text-midnight-500">
                {t('shortcutHint')}
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
                    {t('newAttempt')}
                  </button>
                )}
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={!userPrompt.trim() || isGenerating || activeChallenge.isLoadingTarget}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white text-sm transition-all",
                  "bg-gradient-to-r from-aurora-500 to-emerald-500 shadow-lg",
                  (!userPrompt.trim() || isGenerating || activeChallenge.isLoadingTarget) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {t('generate')}
                  </>
                )}
              </button>
            </div>
            
            {/* Historique des tentatives */}
            {attempts.length > 1 && (
              <div className="pt-2 border-t border-white/5">
                <div className="text-xs text-midnight-400 mb-1.5">{t('previousAttempts')}</div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {attempts.slice(0, -1).map((attempt, i) => (
                    <div key={i} className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10">
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

      {/* Célébration déblocage de niveau */}
      <AnimatePresence>
        {justUnlockedLevel !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setJustUnlockedLevel(null)}
          >
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
              className="relative p-8 rounded-3xl bg-gradient-to-b from-midnight-800 to-midnight-900 border border-aurora-500/30 shadow-2xl shadow-aurora-500/20 text-center max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Rayons animés derrière */}
              <motion.div
                className="absolute inset-0 rounded-3xl overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2 w-1 h-32 bg-gradient-to-t from-transparent to-aurora-500/20 origin-bottom"
                    style={{ transform: `rotate(${i * 45}deg)` }}
                    animate={{ opacity: [0.2, 0.6, 0.2], scaleY: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </motion.div>

              <div className="relative">
                {/* Icone trophée animée */}
                <motion.div
                  className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-aurora-500 to-emerald-500 flex items-center justify-center"
                  animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Trophy className="w-10 h-10 text-white" />
                </motion.div>

                {/* Étoiles flottantes */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-amber-400 text-lg"
                    style={{
                      top: `${20 + Math.random() * 40}%`,
                      left: `${10 + Math.random() * 80}%`,
                    }}
                    initial={{ opacity: 0, scale: 0, y: 20 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], y: [20, -20, -40] }}
                    transition={{ duration: 1.5, delay: 0.5 + i * 0.15, repeat: Infinity, repeatDelay: 1 }}
                  >
                    *
                  </motion.div>
                ))}

                <motion.h2
                  className="text-2xl font-display font-bold text-white mb-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {t('levelUnlocked', { level: justUnlockedLevel })}
                </motion.h2>

                <motion.div
                  className="flex justify-center gap-1 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {[...Array(justUnlockedLevel)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-3 h-3 rounded-full bg-gradient-to-r from-aurora-500 to-emerald-500"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
                    />
                  ))}
                </motion.div>

                <motion.button
                  onClick={() => setJustUnlockedLevel(null)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-aurora-500 to-emerald-500 text-white font-medium text-sm"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('generate').replace(/^./, c => c.toUpperCase())}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ChallengeMode
