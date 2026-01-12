/**
 * Système pédagogique d'apprentissage du prompting
 * Méthode des "5 Clés Magiques" pour créer des images
 * 
 * Les 5 Clés (par ordre d'impact) :
 * 1. 🎨 Style (40%) - Le rendu artistique
 * 2. 👤 Héros (25%) - Qui + description + action
 * 3. 💫 Ambiance (15%) - Émotion, lumière, atmosphère
 * 4. 🌍 Monde (10%) - Lieu, moment, décor
 * 5. ✨ Magie (10%) - Le détail unique
 */

// ============================================================================
// TYPES
// ============================================================================

export type PromptingLevel = 'explorer' | 'apprenti' | 'artiste' | 'magicien' | 'maitre'

export type MagicKey = 'style' | 'hero' | 'mood' | 'world' | 'magic'

export interface KeyProgress {
  style: number   // 0-5, débloqué à 5
  hero: number
  mood: number
  world: number
  magic: number
}

export interface PromptingProgress {
  level: PromptingLevel
  xp: number
  keyProgress: KeyProgress
  unlockedKeys: MagicKey[]
  totalImages: number
  currentKeyLearning: MagicKey
}

export interface PromptAnalysis {
  hasStyle: boolean
  styleFound: string | null
  hasDetailedHero: boolean
  heroDetails: string[]
  hasMood: boolean
  moodFound: string | null
  hasWorld: boolean
  worldDetails: string[]
  hasMagicDetail: boolean
  magicFound: string | null
  keysUsed: MagicKey[]
  keysCount: number
  quality: 'basic' | 'good' | 'excellent'
}

export interface ProgressionEvent {
  type: 'xp_gained' | 'key_progress' | 'key_unlocked' | 'level_up' | 'star_earned'
  value?: number
  key?: MagicKey
  newLevel?: PromptingLevel
}

// ============================================================================
// CONFIGURATION DES 5 CLÉS MAGIQUES
// ============================================================================

export const MAGIC_KEYS_CONFIG = {
  style: {
    id: 'style' as MagicKey,
    name: {
      fr: 'Le Style',
      en: 'Style',
      ru: 'Стиль',
    },
    impact: 40,
    order: 1,
    question: {
      fr: 'Ça ressemble à quoi ? Un dessin Pixar ? Une aquarelle ? Une photo ?',
      en: 'What does it look like? A Pixar drawing? Watercolor? A photo?',
      ru: 'На что это похоже? Рисунок Pixar? Акварель? Фото?',
    },
    tip: {
      fr: 'Le style change tout ! Dis comment tu veux que ce soit dessiné.',
      en: 'Style changes everything! Tell me how you want it to look.',
      ru: 'Стиль меняет всё! Скажи, как ты хочешь, чтобы это выглядело.',
    },
    example: {
      fr: '"Style Pixar", "comme une aquarelle", "réaliste", "manga"',
      en: '"Pixar style", "like a watercolor", "realistic", "manga"',
      ru: '"Стиль Pixar", "как акварель", "реалистично", "манга"',
    },
  },
  hero: {
    id: 'hero' as MagicKey,
    name: {
      fr: 'Le Héros',
      en: 'The Hero',
      ru: 'Герой',
    },
    impact: 25,
    order: 2,
    question: {
      fr: 'C\'est qui ? Il ressemble à quoi ? Il fait quoi ?',
      en: 'Who is it? What does it look like? What is it doing?',
      ru: 'Кто это? Как выглядит? Что делает?',
    },
    tip: {
      fr: 'Décris ton personnage : sa taille, ses couleurs, ce qu\'il fait.',
      en: 'Describe your character: size, colors, what they\'re doing.',
      ru: 'Опиши персонажа: размер, цвета, что делает.',
    },
    example: {
      fr: '"Un petit dragon violet aux écailles brillantes qui dort en boule"',
      en: '"A small purple dragon with shimmering scales sleeping curled up"',
      ru: '"Маленький фиолетовый дракон с блестящей чешуёй, спящий клубком"',
    },
  },
  mood: {
    id: 'mood' as MagicKey,
    name: {
      fr: 'L\'Ambiance',
      en: 'The Mood',
      ru: 'Настроение',
    },
    impact: 15,
    order: 3,
    question: {
      fr: 'On ressent quoi en regardant ? C\'est joyeux ? Mystérieux ? Doux ?',
      en: 'How does it feel? Happy? Mysterious? Soft?',
      ru: 'Что чувствуешь, глядя на это? Радостно? Таинственно? Мягко?',
    },
    tip: {
      fr: 'L\'ambiance c\'est l\'émotion de l\'image. Ça change tout !',
      en: 'The mood is the emotion of the image. It changes everything!',
      ru: 'Настроение — это эмоция картинки. Это меняет всё!',
    },
    example: {
      fr: '"paisible", "mystérieux", "joyeux", "lumière douce et chaude"',
      en: '"peaceful", "mysterious", "joyful", "soft warm light"',
      ru: '"мирно", "таинственно", "радостно", "мягкий тёплый свет"',
    },
  },
  world: {
    id: 'world' as MagicKey,
    name: {
      fr: 'Le Monde',
      en: 'The World',
      ru: 'Мир',
    },
    impact: 10,
    order: 4,
    question: {
      fr: 'Ça se passe où ? C\'est quand ? Le jour ? La nuit ?',
      en: 'Where is it? When? Day? Night?',
      ru: 'Где это? Когда? Днём? Ночью?',
    },
    tip: {
      fr: 'Le décor et le moment donnent du contexte à ton image.',
      en: 'The setting and time give context to your image.',
      ru: 'Место и время дают контекст твоей картинке.',
    },
    example: {
      fr: '"dans une forêt enchantée", "au coucher du soleil", "sous la neige"',
      en: '"in an enchanted forest", "at sunset", "in the snow"',
      ru: '"в заколдованном лесу", "на закате", "в снегу"',
    },
  },
  magic: {
    id: 'magic' as MagicKey,
    name: {
      fr: 'La Magie',
      en: 'The Magic',
      ru: 'Магия',
    },
    impact: 10,
    order: 5,
    question: {
      fr: 'Qu\'est-ce qui rendrait cette image vraiment unique et spéciale ?',
      en: 'What would make this image truly unique and special?',
      ru: 'Что сделает эту картинку по-настоящему уникальной?',
    },
    tip: {
      fr: 'Le petit détail magique que personne d\'autre n\'aurait imaginé !',
      en: 'The little magic detail no one else would have imagined!',
      ru: 'Маленькая волшебная деталь, которую никто бы не придумал!',
    },
    example: {
      fr: '"des lucioles qui flottent autour", "des reflets arc-en-ciel", "des étoiles dans ses yeux"',
      en: '"fireflies floating around", "rainbow reflections", "stars in its eyes"',
      ru: '"светлячки вокруг", "радужные отблески", "звёзды в глазах"',
    },
  },
}

// ============================================================================
// CONFIGURATION DES NIVEAUX
// ============================================================================

export const LEVELS_CONFIG = {
  explorer: {
    name: { fr: 'Explorateur', en: 'Explorer', ru: 'Исследователь' },
    xpRequired: 0,
    description: {
      fr: 'Tu découvres le monde magique des images !',
      en: 'You\'re discovering the magical world of images!',
      ru: 'Ты открываешь волшебный мир картинок!',
    },
    keysToLearn: ['style'] as MagicKey[],
  },
  apprenti: {
    name: { fr: 'Apprenti', en: 'Apprentice', ru: 'Ученик' },
    xpRequired: 75,
    description: {
      fr: 'Tu commences à maîtriser l\'art du prompting !',
      en: 'You\'re starting to master the art of prompting!',
      ru: 'Ты начинаешь осваивать искусство промптинга!',
    },
    keysToLearn: ['hero'] as MagicKey[],
  },
  artiste: {
    name: { fr: 'Artiste', en: 'Artist', ru: 'Художник' },
    xpRequired: 175,
    description: {
      fr: 'Tes descriptions créent de vraies ambiances !',
      en: 'Your descriptions create real atmospheres!',
      ru: 'Твои описания создают настоящую атмосферу!',
    },
    keysToLearn: ['mood'] as MagicKey[],
  },
  magicien: {
    name: { fr: 'Magicien', en: 'Magician', ru: 'Волшебник' },
    xpRequired: 300,
    description: {
      fr: 'Tu maîtrises les secrets des images parfaites !',
      en: 'You master the secrets of perfect images!',
      ru: 'Ты владеешь секретами идеальных картинок!',
    },
    keysToLearn: ['world', 'magic'] as MagicKey[],
  },
  maitre: {
    name: { fr: 'Maître', en: 'Master', ru: 'Мастер' },
    xpRequired: 500,
    description: {
      fr: 'Tu es un vrai maître du prompting !',
      en: 'You are a true prompting master!',
      ru: 'Ты настоящий мастер промптинга!',
    },
    keysToLearn: [] as MagicKey[],
  },
}

// ============================================================================
// MOTS-CLÉS POUR LA DÉTECTION
// ============================================================================

const STYLE_KEYWORDS = [
  // Styles artistiques
  'pixar', 'disney', 'ghibli', 'dreamworks', 'cartoon', 'anime', 'manga',
  'watercolor', 'aquarelle', 'oil painting', 'peinture', 'illustration',
  'realistic', 'réaliste', 'photo', 'photorealistic', 'hyperrealistic',
  '3d render', '3d', 'digital art', 'concept art', 'sketch', 'croquis',
  'pastel', 'pencil', 'crayon', 'ink', 'encre', 'vector', 'flat',
  'minimalist', 'abstract', 'impressionist', 'impressionniste',
  'art nouveau', 'pop art', 'retro', 'vintage', 'cyberpunk', 'steampunk',
  'fantasy art', 'fairy tale', 'conte de fées', 'storybook', 'children book',
  // Styles en russe
  'акварель', 'рисунок', 'картина', 'фото', 'мультфильм', 'аниме',
]

const HERO_DESCRIPTORS = {
  size: ['tiny', 'small', 'little', 'big', 'huge', 'giant', 'petit', 'grand', 'énorme', 'minuscule', 'маленький', 'большой', 'огромный', 'крошечный'],
  color: ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'black', 'white', 'golden', 'silver', 'rouge', 'bleu', 'vert', 'jaune', 'violet', 'rose', 'noir', 'blanc', 'doré', 'argenté', 'красный', 'синий', 'зелёный', 'жёлтый', 'фиолетовый', 'розовый', 'чёрный', 'белый', 'золотой', 'серебряный'],
  texture: ['fluffy', 'shiny', 'smooth', 'rough', 'scaly', 'furry', 'feathery', 'brillant', 'doux', 'écailles', 'fourrure', 'plumes', 'пушистый', 'блестящий', 'гладкий', 'чешуя', 'мех', 'перья'],
  action: ['sleeping', 'running', 'flying', 'jumping', 'sitting', 'standing', 'dancing', 'dort', 'court', 'vole', 'saute', 'assis', 'debout', 'danse', 'спит', 'бежит', 'летит', 'прыгает', 'сидит', 'стоит', 'танцует'],
}

const MOOD_KEYWORDS = [
  // Émotions
  'happy', 'sad', 'peaceful', 'mysterious', 'scary', 'exciting', 'calm', 'dreamy',
  'joyeux', 'triste', 'paisible', 'mystérieux', 'effrayant', 'excitant', 'calme', 'rêveur',
  'радостный', 'грустный', 'мирный', 'таинственный', 'страшный', 'спокойный', 'мечтательный',
  // Lumière
  'soft light', 'dramatic light', 'golden hour', 'moonlight', 'sunset', 'sunrise',
  'lumière douce', 'lumière dorée', 'clair de lune', 'coucher de soleil', 'lever de soleil',
  'мягкий свет', 'золотой час', 'лунный свет', 'закат', 'рассвет',
  // Atmosphère
  'magical', 'enchanted', 'cozy', 'warm', 'cold', 'dark', 'bright',
  'magique', 'enchanté', 'chaleureux', 'chaud', 'froid', 'sombre', 'lumineux',
  'волшебный', 'уютный', 'тёплый', 'холодный', 'тёмный', 'светлый',
]

const WORLD_KEYWORDS = [
  // Lieux
  'forest', 'castle', 'beach', 'mountain', 'city', 'village', 'cave', 'underwater', 'space', 'sky', 'garden', 'room',
  'forêt', 'château', 'plage', 'montagne', 'ville', 'village', 'grotte', 'sous l\'eau', 'espace', 'ciel', 'jardin', 'chambre',
  'лес', 'замок', 'пляж', 'гора', 'город', 'деревня', 'пещера', 'под водой', 'космос', 'небо', 'сад', 'комната',
  // Temps
  'day', 'night', 'morning', 'evening', 'dawn', 'dusk', 'winter', 'summer', 'spring', 'autumn', 'fall',
  'jour', 'nuit', 'matin', 'soir', 'aube', 'crépuscule', 'hiver', 'été', 'printemps', 'automne',
  'день', 'ночь', 'утро', 'вечер', 'рассвет', 'сумерки', 'зима', 'лето', 'весна', 'осень',
]

const MAGIC_KEYWORDS = [
  // Éléments magiques
  'fireflies', 'sparkles', 'glitter', 'rainbow', 'stars', 'bubbles', 'petals', 'snow', 'leaves',
  'lucioles', 'étincelles', 'paillettes', 'arc-en-ciel', 'étoiles', 'bulles', 'pétales', 'neige', 'feuilles',
  'светлячки', 'искры', 'блёстки', 'радуга', 'звёзды', 'пузыри', 'лепестки', 'снег', 'листья',
  // Effets
  'glowing', 'floating', 'dancing', 'swirling', 'falling', 'rising',
  'brillant', 'flottant', 'dansant', 'tourbillonnant', 'tombant',
  'светящийся', 'парящий', 'танцующий', 'кружащийся', 'падающий',
  // Détails uniques
  'reflection', 'shadow', 'silhouette', 'pattern', 'texture',
  'reflet', 'ombre', 'silhouette', 'motif', 'texture',
  'отражение', 'тень', 'силуэт', 'узор', 'текстура',
]

// ============================================================================
// FONCTIONS D'ANALYSE
// ============================================================================

/**
 * Analyse un prompt et détecte les 5 Clés utilisées
 */
export function analyzePrompt(prompt: string): PromptAnalysis {
  const lowerPrompt = prompt.toLowerCase()
  const words = prompt.split(/\s+/)
  
  // Détection STYLE
  const styleMatch = STYLE_KEYWORDS.find(kw => lowerPrompt.includes(kw.toLowerCase()))
  const hasStyle = !!styleMatch
  
  // Détection HÉROS détaillé
  const heroDetails: string[] = []
  const hasSize = HERO_DESCRIPTORS.size.some(kw => {
    if (lowerPrompt.includes(kw.toLowerCase())) {
      heroDetails.push(kw)
      return true
    }
    return false
  })
  const hasColor = HERO_DESCRIPTORS.color.some(kw => {
    if (lowerPrompt.includes(kw.toLowerCase())) {
      heroDetails.push(kw)
      return true
    }
    return false
  })
  const hasTexture = HERO_DESCRIPTORS.texture.some(kw => {
    if (lowerPrompt.includes(kw.toLowerCase())) {
      heroDetails.push(kw)
      return true
    }
    return false
  })
  const hasAction = HERO_DESCRIPTORS.action.some(kw => {
    if (lowerPrompt.includes(kw.toLowerCase())) {
      heroDetails.push(kw)
      return true
    }
    return false
  })
  // Héros détaillé = au moins 2 descripteurs OU longueur suffisante avec 1 descripteur
  const hasDetailedHero = heroDetails.length >= 2 || (heroDetails.length >= 1 && words.length >= 10)
  
  // Détection AMBIANCE
  const moodMatch = MOOD_KEYWORDS.find(kw => lowerPrompt.includes(kw.toLowerCase()))
  const hasMood = !!moodMatch
  
  // Détection MONDE
  const worldMatches = WORLD_KEYWORDS.filter(kw => lowerPrompt.includes(kw.toLowerCase()))
  const hasWorld = worldMatches.length >= 1
  
  // Détection MAGIE
  const magicMatch = MAGIC_KEYWORDS.find(kw => lowerPrompt.includes(kw.toLowerCase()))
  const hasMagicDetail = !!magicMatch
  
  // Liste des clés utilisées
  const keysUsed: MagicKey[] = []
  if (hasStyle) keysUsed.push('style')
  if (hasDetailedHero) keysUsed.push('hero')
  if (hasMood) keysUsed.push('mood')
  if (hasWorld) keysUsed.push('world')
  if (hasMagicDetail) keysUsed.push('magic')
  
  // Qualité globale
  const keysCount = keysUsed.length
  const quality = keysCount >= 4 ? 'excellent' 
               : keysCount >= 2 ? 'good' 
               : 'basic'
  
  return {
    hasStyle,
    styleFound: styleMatch || null,
    hasDetailedHero,
    heroDetails,
    hasMood,
    moodFound: moodMatch || null,
    hasWorld,
    worldDetails: worldMatches,
    hasMagicDetail,
    magicFound: magicMatch || null,
    keysUsed,
    keysCount,
    quality,
  }
}

// ============================================================================
// FONCTIONS DE PROGRESSION
// ============================================================================

/**
 * Calcule les XP gagnés selon les clés utilisées
 */
export function calculateXP(keysCount: number): number {
  if (keysCount >= 5) return 40
  if (keysCount >= 4) return 30
  if (keysCount >= 3) return 20
  if (keysCount >= 2) return 15
  if (keysCount >= 1) return 10
  return 5
}

/**
 * Détermine le niveau en fonction des XP
 */
export function getLevelFromXP(xp: number): PromptingLevel {
  if (xp >= LEVELS_CONFIG.maitre.xpRequired) return 'maitre'
  if (xp >= LEVELS_CONFIG.magicien.xpRequired) return 'magicien'
  if (xp >= LEVELS_CONFIG.artiste.xpRequired) return 'artiste'
  if (xp >= LEVELS_CONFIG.apprenti.xpRequired) return 'apprenti'
  return 'explorer'
}

/**
 * Détermine la prochaine clé à apprendre
 */
export function getNextKeyToLearn(progress: PromptingProgress): MagicKey {
  const keyOrder: MagicKey[] = ['style', 'hero', 'mood', 'world', 'magic']
  
  for (const key of keyOrder) {
    if (!progress.unlockedKeys.includes(key)) {
      return key
    }
  }
  
  return 'magic' // Toutes débloquées
}

/**
 * Met à jour la progression après une création d'image
 */
export function updateProgression(
  currentProgress: PromptingProgress,
  analysis: PromptAnalysis
): {
  newProgress: PromptingProgress
  events: ProgressionEvent[]
} {
  const events: ProgressionEvent[] = []
  
  // Copie de la progression
  const newProgress: PromptingProgress = {
    ...currentProgress,
    keyProgress: { ...currentProgress.keyProgress },
    unlockedKeys: [...currentProgress.unlockedKeys],
    totalImages: currentProgress.totalImages + 1,
  }
  
  // XP gagné
  const xpGained = calculateXP(analysis.keysCount)
  newProgress.xp += xpGained
  events.push({ type: 'xp_gained', value: xpGained })
  
  // Progression des clés utilisées
  for (const key of analysis.keysUsed) {
    if (newProgress.keyProgress[key] < 5) {
      newProgress.keyProgress[key]++
      events.push({ type: 'key_progress', key, value: newProgress.keyProgress[key] })
      
      // Clé débloquée ?
      if (newProgress.keyProgress[key] === 5 && !newProgress.unlockedKeys.includes(key)) {
        newProgress.unlockedKeys.push(key)
        events.push({ type: 'key_unlocked', key })
        events.push({ type: 'star_earned' })
      }
    }
  }
  
  // Level up ?
  const newLevel = getLevelFromXP(newProgress.xp)
  if (newLevel !== currentProgress.level) {
    newProgress.level = newLevel
    events.push({ type: 'level_up', newLevel })
  }
  
  // Mettre à jour la clé en cours d'apprentissage
  newProgress.currentKeyLearning = getNextKeyToLearn(newProgress)
  
  return { newProgress, events }
}

// ============================================================================
// GÉNÉRATION DU CONTEXTE PÉDAGOGIQUE POUR LUNA
// ============================================================================

/**
 * Génère le contexte pédagogique pour Luna (images)
 */
export function generateImagePedagogyContext(
  progress: PromptingProgress,
  locale: 'fr' | 'en' | 'ru' = 'fr'
): string {
  const levelConfig = LEVELS_CONFIG[progress.level]
  const currentKey = MAGIC_KEYS_CONFIG[progress.currentKeyLearning]
  const keyProgress = progress.keyProgress[progress.currentKeyLearning]
  
  return `
NIVEAU DE L'ENFANT: ${levelConfig.name[locale]} (${progress.xp} XP)

CLÉS MAÎTRISÉES: ${progress.unlockedKeys.map(k => MAGIC_KEYS_CONFIG[k].name[locale]).join(', ') || 'Aucune'}

CLÉ EN COURS D'APPRENTISSAGE: ${currentKey.name[locale]} (${keyProgress}/5)
- Question à poser: "${currentKey.question[locale]}"
- Conseil: "${currentKey.tip[locale]}"
- Exemple: ${currentKey.example[locale]}

MÉTHODE PÉDAGOGIQUE:
- Guide l'enfant vers la clé "${currentKey.name[locale]}"
- Pose la question de cette clé naturellement
- Si l'enfant utilise bien la clé, félicite-le
- NE FAIS PAS LE TRAVAIL À SA PLACE
- Une technique à la fois

IMAGES CRÉÉES: ${progress.totalImages}
`
}

/**
 * Génère le feedback pour l'enfant après une image
 */
export function generateImageFeedback(
  analysis: PromptAnalysis,
  events: ProgressionEvent[],
  locale: 'fr' | 'en' | 'ru' = 'fr'
): string {
  const messages: string[] = []
  
  // Clés utilisées
  if (analysis.keysUsed.length > 0) {
    const keyNames = analysis.keysUsed.map(k => MAGIC_KEYS_CONFIG[k].name[locale])
    const used = locale === 'fr' ? 'Tu as utilisé' 
               : locale === 'en' ? 'You used'
               : 'Ты использовал'
    messages.push(`${used}: ${keyNames.join(' · ')}`)
  }
  
  // XP gagné
  const xpEvent = events.find(e => e.type === 'xp_gained')
  if (xpEvent) {
    messages.push(`+${xpEvent.value} XP`)
  }
  
  // Clé débloquée
  const unlockEvent = events.find(e => e.type === 'key_unlocked')
  if (unlockEvent && unlockEvent.key) {
    const keyName = MAGIC_KEYS_CONFIG[unlockEvent.key].name[locale]
    const unlocked = locale === 'fr' ? 'Nouvelle clé maîtrisée'
                   : locale === 'en' ? 'New key mastered'
                   : 'Новый ключ освоен'
    messages.push(`${unlocked}: ${keyName}`)
  }
  
  // Level up
  const levelEvent = events.find(e => e.type === 'level_up')
  if (levelEvent && levelEvent.newLevel) {
    const levelName = LEVELS_CONFIG[levelEvent.newLevel].name[locale]
    const levelUp = locale === 'fr' ? 'Nouveau niveau'
                  : locale === 'en' ? 'Level up'
                  : 'Новый уровень'
    messages.push(`${levelUp}: ${levelName}`)
  }
  
  return messages.join(' · ')
}

// ============================================================================
// PROGRESSION INITIALE
// ============================================================================

export function getInitialProgress(): PromptingProgress {
  return {
    level: 'explorer',
    xp: 0,
    keyProgress: {
      style: 0,
      hero: 0,
      mood: 0,
      world: 0,
      magic: 0,
    },
    unlockedKeys: [],
    totalImages: 0,
    currentKeyLearning: 'style',
  }
}

// ============================================================================
// STRUCTURES NARRATIVES (pour les histoires)
// ============================================================================

export type StoryStructure = 'tale' | 'adventure' | 'problem' | 'journal' | 'loop' | 'free'

export interface StoryTemplate {
  id: StoryStructure
  name: { fr: string; en: string; ru: string }
  description: { fr: string; en: string; ru: string }
  recommendedPages: { min: number; max: number }
  steps: {
    title: { fr: string; en: string; ru: string }
    prompt: { fr: string; en: string; ru: string }
    pages: number
  }[]
}

export const STORY_TEMPLATES: Record<StoryStructure, StoryTemplate> = {
  tale: {
    id: 'tale',
    name: {
      fr: 'Conte classique',
      en: 'Classic tale',
      ru: 'Классическая сказка',
    },
    description: {
      fr: 'Comme les contes de fées traditionnels',
      en: 'Like traditional fairy tales',
      ru: 'Как традиционные сказки',
    },
    recommendedPages: { min: 6, max: 10 },
    steps: [
      {
        title: { fr: 'Il était une fois...', en: 'Once upon a time...', ru: 'Жили-были...' },
        prompt: { fr: 'Présente ton héros et son monde', en: 'Introduce your hero and their world', ru: 'Представь героя и его мир' },
        pages: 2,
      },
      {
        title: { fr: 'Mais un jour...', en: 'But one day...', ru: 'Но однажды...' },
        prompt: { fr: 'Quelque chose change tout', en: 'Something changes everything', ru: 'Что-то меняет всё' },
        pages: 2,
      },
      {
        title: { fr: 'Alors...', en: 'Then...', ru: 'Тогда...' },
        prompt: { fr: 'Le héros agit et rencontre des obstacles', en: 'The hero acts and faces obstacles', ru: 'Герой действует и встречает препятствия' },
        pages: 3,
      },
      {
        title: { fr: 'Enfin...', en: 'Finally...', ru: 'Наконец...' },
        prompt: { fr: 'Le problème est résolu', en: 'The problem is solved', ru: 'Проблема решена' },
        pages: 2,
      },
      {
        title: { fr: 'Et depuis...', en: 'And since then...', ru: 'И с тех пор...' },
        prompt: { fr: 'La fin heureuse', en: 'The happy ending', ru: 'Счастливый конец' },
        pages: 1,
      },
    ],
  },
  adventure: {
    id: 'adventure',
    name: {
      fr: 'Aventure',
      en: 'Adventure',
      ru: 'Приключение',
    },
    description: {
      fr: 'Voyage, quête et exploration',
      en: 'Journey, quest and exploration',
      ru: 'Путешествие, поиск и исследование',
    },
    recommendedPages: { min: 8, max: 12 },
    steps: [
      {
        title: { fr: 'Le héros', en: 'The hero', ru: 'Герой' },
        prompt: { fr: 'Qui est-il ? Qu\'est-ce qu\'il veut ?', en: 'Who are they? What do they want?', ru: 'Кто он? Чего он хочет?' },
        pages: 2,
      },
      {
        title: { fr: 'L\'appel', en: 'The call', ru: 'Призыв' },
        prompt: { fr: 'Quelque chose l\'oblige à partir', en: 'Something forces them to leave', ru: 'Что-то заставляет его уйти' },
        pages: 1,
      },
      {
        title: { fr: 'Le voyage', en: 'The journey', ru: 'Путешествие' },
        prompt: { fr: 'Il découvre un nouveau monde', en: 'They discover a new world', ru: 'Он открывает новый мир' },
        pages: 2,
      },
      {
        title: { fr: 'Les épreuves', en: 'The trials', ru: 'Испытания' },
        prompt: { fr: 'Obstacles et problèmes', en: 'Obstacles and problems', ru: 'Препятствия и проблемы' },
        pages: 2,
      },
      {
        title: { fr: 'L\'aide', en: 'The help', ru: 'Помощь' },
        prompt: { fr: 'Il rencontre un ami ou trouve un objet magique', en: 'They meet a friend or find a magic item', ru: 'Он встречает друга или находит волшебный предмет' },
        pages: 2,
      },
      {
        title: { fr: 'Le grand défi', en: 'The big challenge', ru: 'Главное испытание' },
        prompt: { fr: 'Le plus gros problème', en: 'The biggest problem', ru: 'Самая большая проблема' },
        pages: 2,
      },
      {
        title: { fr: 'La victoire', en: 'The victory', ru: 'Победа' },
        prompt: { fr: 'Il gagne et rentre changé', en: 'They win and return changed', ru: 'Он побеждает и возвращается изменившимся' },
        pages: 1,
      },
    ],
  },
  problem: {
    id: 'problem',
    name: {
      fr: 'Problème-Solution',
      en: 'Problem-Solution',
      ru: 'Проблема-Решение',
    },
    description: {
      fr: 'Quelqu\'un a un souci à régler',
      en: 'Someone has a problem to solve',
      ru: 'У кого-то есть проблема',
    },
    recommendedPages: { min: 5, max: 8 },
    steps: [
      {
        title: { fr: 'Tout va bien', en: 'All is well', ru: 'Всё хорошо' },
        prompt: { fr: 'La vie normale du héros', en: 'The hero\'s normal life', ru: 'Обычная жизнь героя' },
        pages: 2,
      },
      {
        title: { fr: 'Le problème', en: 'The problem', ru: 'Проблема' },
        prompt: { fr: 'Quelque chose ne va plus', en: 'Something goes wrong', ru: 'Что-то идёт не так' },
        pages: 1,
      },
      {
        title: { fr: 'Les tentatives', en: 'The attempts', ru: 'Попытки' },
        prompt: { fr: 'Il essaie de résoudre, ça ne marche pas', en: 'They try to fix it, it doesn\'t work', ru: 'Он пытается решить, не получается' },
        pages: 2,
      },
      {
        title: { fr: 'La solution', en: 'The solution', ru: 'Решение' },
        prompt: { fr: 'Il trouve enfin comment faire', en: 'They finally find a way', ru: 'Наконец он находит способ' },
        pages: 2,
      },
      {
        title: { fr: 'Tout va mieux', en: 'All is better', ru: 'Всё лучше' },
        prompt: { fr: 'Le problème est résolu', en: 'The problem is solved', ru: 'Проблема решена' },
        pages: 1,
      },
    ],
  },
  journal: {
    id: 'journal',
    name: {
      fr: 'Journal illustré',
      en: 'Illustrated journal',
      ru: 'Иллюстрированный дневник',
    },
    description: {
      fr: 'Raconter un souvenir',
      en: 'Tell a memory',
      ru: 'Рассказать воспоминание',
    },
    recommendedPages: { min: 3, max: 5 },
    steps: [
      {
        title: { fr: 'Ce qui s\'est passé', en: 'What happened', ru: 'Что случилось' },
        prompt: { fr: 'Le moment, le lieu, les personnes', en: 'The moment, place, people', ru: 'Момент, место, люди' },
        pages: 1,
      },
      {
        title: { fr: 'Les détails', en: 'The details', ru: 'Детали' },
        prompt: { fr: 'Ce qu\'on a fait, vu, entendu', en: 'What we did, saw, heard', ru: 'Что делали, видели, слышали' },
        pages: 2,
      },
      {
        title: { fr: 'Ce que j\'ai ressenti', en: 'How I felt', ru: 'Что я почувствовал' },
        prompt: { fr: 'Les émotions, les pensées', en: 'Emotions, thoughts', ru: 'Эмоции, мысли' },
        pages: 1,
      },
      {
        title: { fr: 'L\'image souvenir', en: 'Memory image', ru: 'Картинка-воспоминание' },
        prompt: { fr: 'Illustration du moment fort', en: 'Illustration of the highlight', ru: 'Иллюстрация главного момента' },
        pages: 1,
      },
    ],
  },
  loop: {
    id: 'loop',
    name: {
      fr: 'La boucle',
      en: 'The loop',
      ru: 'Петля',
    },
    description: {
      fr: 'Comme les 3 petits cochons',
      en: 'Like the 3 little pigs',
      ru: 'Как три поросёнка',
    },
    recommendedPages: { min: 6, max: 10 },
    steps: [
      {
        title: { fr: 'Le début', en: 'The beginning', ru: 'Начало' },
        prompt: { fr: 'Le héros a un objectif', en: 'The hero has a goal', ru: 'У героя есть цель' },
        pages: 1,
      },
      {
        title: { fr: 'Premier essai', en: 'First try', ru: 'Первая попытка' },
        prompt: { fr: 'Il essaie, ça ne marche pas', en: 'They try, it doesn\'t work', ru: 'Он пробует, не получается' },
        pages: 2,
      },
      {
        title: { fr: 'Deuxième essai', en: 'Second try', ru: 'Вторая попытка' },
        prompt: { fr: 'Il réessaie autrement', en: 'They try differently', ru: 'Он пробует по-другому' },
        pages: 2,
      },
      {
        title: { fr: 'Troisième essai', en: 'Third try', ru: 'Третья попытка' },
        prompt: { fr: 'Encore une fois... suspense !', en: 'One more time... suspense!', ru: 'Ещё раз... интрига!' },
        pages: 2,
      },
      {
        title: { fr: 'Ça marche !', en: 'It works!', ru: 'Получилось!' },
        prompt: { fr: 'Cette fois c\'est la bonne', en: 'This time it works', ru: 'На этот раз получилось' },
        pages: 1,
      },
    ],
  },
  free: {
    id: 'free',
    name: {
      fr: 'Libre',
      en: 'Free',
      ru: 'Свободно',
    },
    description: {
      fr: 'Tu fais comme tu veux !',
      en: 'Do it your way!',
      ru: 'Делай как хочешь!',
    },
    recommendedPages: { min: 3, max: 20 },
    steps: [],
  },
}

// ============================================================================
// CONTEXTE PÉDAGOGIQUE POUR L'ÉCRITURE
// ============================================================================

/**
 * Génère le contexte pour Luna quand elle aide à écrire
 */
export function generateWritingPedagogyContext(
  context: 'journal' | 'story',
  storyStructure?: StoryStructure,
  currentStep?: number,
  locale: 'fr' | 'en' | 'ru' = 'fr'
): string {
  const baseContext = `
RÔLE: Tu aides l'enfant à écrire, mais tu ne fais JAMAIS le travail à sa place.

CE QUE TU FAIS:
- Poser des questions pour stimuler l'imagination
- Relancer quand l'enfant est bloqué
- Suggérer des pistes sans imposer
- Encourager et valoriser ses idées

CE QUE TU NE FAIS JAMAIS:
- Écrire des phrases à sa place
- Donner la suite de l'histoire
- Imposer tes idées
- Corriger ou juger

LES 5 QUESTIONS MAGIQUES (pour relancer):
- Qui ? (personnages)
- Quoi ? (action, événement)
- Où ? (lieu)
- Quand ? (moment)
- Et alors ? (rebondissement)

SI L'ENFANT DEMANDE D'ÉCRIRE À SA PLACE:
${locale === 'fr' ? 'Refuse gentiment : "C\'est ton histoire, c\'est toi l\'auteur ! Mais je peux t\'aider à trouver des idées."' : ''}
${locale === 'en' ? 'Gently refuse: "It\'s your story, you\'re the author! But I can help you find ideas."' : ''}
${locale === 'ru' ? 'Мягко откажи: "Это твоя история, ты автор! Но я могу помочь найти идеи."' : ''}
`

  if (context === 'journal') {
    return baseContext + `
CONTEXTE: L'enfant écrit dans son JOURNAL (souvenirs réels)
- Aide-le à raconter sa journée
- Pose des questions sur ce qui s'est passé
- Aide à développer les détails
`
  }

  if (context === 'story' && storyStructure && storyStructure !== 'free') {
    const template = STORY_TEMPLATES[storyStructure]
    const step = currentStep !== undefined ? template.steps[currentStep] : null
    
    return baseContext + `
CONTEXTE: L'enfant écrit une HISTOIRE
Structure choisie: ${template.name[locale]}

${step ? `
ÉTAPE ACTUELLE: ${step.title[locale]}
Ce qu'il doit écrire: ${step.prompt[locale]}

Guide-le pour cette étape spécifique.
` : ''}
`
  }

  return baseContext + `
CONTEXTE: L'enfant écrit librement
Aide-le à développer son idée sans lui imposer de structure.
`
}
