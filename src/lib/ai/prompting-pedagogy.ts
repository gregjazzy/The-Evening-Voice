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
// TYPES - PROGRESSION ÉCRITURE (5 Questions Magiques pour Gemini)
// ============================================================================

/**
 * Système pédagogique d'apprentissage du prompting TEXTUEL
 * Méthode des "5 Questions Magiques" pour parler aux IA
 * 
 * Les 5 Questions :
 * 1. 👤 QUI ? - Les personnages
 * 2. ❓ QUOI ? - L'action, le problème
 * 3. 📍 OÙ ? - Le lieu
 * 4. ⏰ QUAND ? - Le moment
 * 5. 💥 ET ALORS ? - Le rebondissement
 */

export type WritingLevel = 'curieux' | 'bavard' | 'precis' | 'expert' | 'maitre_ia'

export type WritingQuestion = 'who' | 'what' | 'where' | 'when' | 'then'

export interface WritingQuestionProgress {
  who: number    // 0-10, maîtrisé à 10
  what: number
  where: number
  when: number
  then: number
}

export interface WritingPromptingProgress {
  level: WritingLevel
  xp: number
  questionProgress: WritingQuestionProgress
  unlockedQuestions: WritingQuestion[]
  totalMessages: number
  totalStories: number
  currentQuestionLearning: WritingQuestion
  consecutiveBlockedMessages: number  // Pour détecter les blocages
}

export interface WritingMessageAnalysis {
  hasWho: boolean       // Mentionne un personnage
  whoDetails: string[]  // Détails trouvés
  hasWhat: boolean      // Mentionne une action/problème
  whatDetails: string[]
  hasWhere: boolean     // Mentionne un lieu
  whereDetails: string[]
  hasWhen: boolean      // Mentionne un moment
  whenDetails: string[]
  hasThen: boolean      // Mentionne un rebondissement/surprise
  thenDetails: string[]
  questionsUsed: WritingQuestion[]
  questionsCount: number
  quality: 'vague' | 'basique' | 'correct' | 'bon' | 'excellent'
  isBlocked: boolean    // Message type "je sais pas", "aide-moi"
  asksForHelp: boolean  // Demande explicite d'aide
}

export interface WritingProgressionEvent {
  type: 'xp_gained' | 'question_progress' | 'question_unlocked' | 'level_up' | 'story_completed' | 'blocked_detected'
  value?: number
  question?: WritingQuestion
  newLevel?: WritingLevel
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
// CONFIGURATION DES NIVEAUX - ÉCRITURE (~10h de progression)
// ============================================================================

export const WRITING_LEVELS_CONFIG = {
  curieux: {
    name: { fr: 'Curieux', en: 'Curious', ru: 'Любопытный' },
    emoji: '🌱',
    xpRequired: 0,
    description: {
      fr: 'Tu découvres comment parler aux IA !',
      en: 'You\'re discovering how to talk to AIs!',
      ru: 'Ты узнаёшь, как разговаривать с ИИ!',
    },
    questionsToLearn: ['who', 'what'] as WritingQuestion[],
    mentionFrequency: 0.5, // 1 fois sur 2
  },
  bavard: {
    name: { fr: 'Bavard', en: 'Chatty', ru: 'Болтун' },
    emoji: '💬',
    xpRequired: 200,
    description: {
      fr: 'Tu sais donner du contexte, c\'est super !',
      en: 'You know how to give context, that\'s great!',
      ru: 'Ты умеешь давать контекст, это здорово!',
    },
    questionsToLearn: ['where'] as WritingQuestion[],
    mentionFrequency: 0.4, // 1 fois sur 2.5
  },
  precis: {
    name: { fr: 'Précis', en: 'Precise', ru: 'Точный' },
    emoji: '🎯',
    xpRequired: 500,
    description: {
      fr: 'Tes explications sont de plus en plus claires !',
      en: 'Your explanations are getting clearer!',
      ru: 'Твои объяснения становятся всё яснее!',
    },
    questionsToLearn: ['when'] as WritingQuestion[],
    mentionFrequency: 0.25, // 1 fois sur 4
  },
  expert: {
    name: { fr: 'Expert', en: 'Expert', ru: 'Эксперт' },
    emoji: '🔍',
    xpRequired: 900,
    description: {
      fr: 'Tu maîtrises l\'art de bien communiquer !',
      en: 'You master the art of good communication!',
      ru: 'Ты владеешь искусством общения!',
    },
    questionsToLearn: ['then'] as WritingQuestion[],
    mentionFrequency: 0.15, // 1 fois sur 6-7
  },
  maitre_ia: {
    name: { fr: 'Maître des IA', en: 'AI Master', ru: 'Мастер ИИ' },
    emoji: '🧙',
    xpRequired: 1500,
    description: {
      fr: 'Tu sais parler à toutes les IA ! Tu peux aider tes amis !',
      en: 'You can talk to any AI! You can help your friends!',
      ru: 'Ты умеешь разговаривать с любым ИИ! Можешь помочь друзьям!',
    },
    questionsToLearn: [] as WritingQuestion[],
    mentionFrequency: 0.1, // Presque jamais, elle sait
  },
}

// ============================================================================
// CONFIGURATION DES 5 QUESTIONS MAGIQUES (ÉCRITURE)
// ============================================================================

export const WRITING_QUESTIONS_CONFIG = {
  who: {
    id: 'who' as WritingQuestion,
    name: { fr: 'QUI', en: 'WHO', ru: 'КТО' },
    emoji: '👤',
    description: {
      fr: 'Les personnages de l\'histoire',
      en: 'The characters in the story',
      ru: 'Персонажи истории',
    },
    question: {
      fr: 'C\'est qui ton personnage ?',
      en: 'Who is your character?',
      ru: 'Кто твой персонаж?',
    },
    order: 1,
  },
  what: {
    id: 'what' as WritingQuestion,
    name: { fr: 'QUOI', en: 'WHAT', ru: 'ЧТО' },
    emoji: '❓',
    description: {
      fr: 'L\'action, le problème',
      en: 'The action, the problem',
      ru: 'Действие, проблема',
    },
    question: {
      fr: 'Il se passe quoi ? C\'est quoi le problème ?',
      en: 'What\'s happening? What\'s the problem?',
      ru: 'Что происходит? В чём проблема?',
    },
    order: 2,
  },
  where: {
    id: 'where' as WritingQuestion,
    name: { fr: 'OÙ', en: 'WHERE', ru: 'ГДЕ' },
    emoji: '📍',
    description: {
      fr: 'Le lieu de l\'histoire',
      en: 'The place of the story',
      ru: 'Место истории',
    },
    question: {
      fr: 'Ça se passe où ?',
      en: 'Where does it happen?',
      ru: 'Где это происходит?',
    },
    order: 3,
  },
  when: {
    id: 'when' as WritingQuestion,
    name: { fr: 'QUAND', en: 'WHEN', ru: 'КОГДА' },
    emoji: '⏰',
    description: {
      fr: 'Le moment (jour, nuit, saison...)',
      en: 'The time (day, night, season...)',
      ru: 'Время (день, ночь, сезон...)',
    },
    question: {
      fr: 'C\'est quand ? Le jour ? La nuit ?',
      en: 'When is it? Day? Night?',
      ru: 'Когда это? Днём? Ночью?',
    },
    order: 4,
  },
  then: {
    id: 'then' as WritingQuestion,
    name: { fr: 'ET ALORS', en: 'AND THEN', ru: 'И ТОГДА' },
    emoji: '💥',
    description: {
      fr: 'Le rebondissement, la surprise',
      en: 'The twist, the surprise',
      ru: 'Поворот, сюрприз',
    },
    question: {
      fr: 'Qu\'est-ce qui arrive de surprenant ?',
      en: 'What surprising thing happens?',
      ru: 'Что удивительного происходит?',
    },
    order: 5,
  },
}

// ============================================================================
// MOTS-CLÉS POUR LA DÉTECTION (IMAGES)
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
// MOTS-CLÉS POUR LA DÉTECTION (ÉCRITURE - 5 Questions Magiques)
// ============================================================================

// QUI - Personnages (détection de noms de personnages ou descriptions)
const WHO_KEYWORDS = [
  // Personnages courants dans les histoires d'enfants
  'dragon', 'princesse', 'prince', 'roi', 'reine', 'chevalier', 'fée', 'sorcier', 'sorcière',
  'licorne', 'chat', 'chien', 'lapin', 'ours', 'loup', 'renard', 'oiseau', 'poisson',
  'garçon', 'fille', 'enfant', 'ami', 'amie', 'copain', 'copine', 'frère', 'soeur', 'maman', 'papa',
  'héros', 'monstre', 'géant', 'nain', 'elfe', 'lutin', 'pirate', 'robot', 'alien',
  // Anglais
  'dragon', 'princess', 'prince', 'king', 'queen', 'knight', 'fairy', 'wizard', 'witch',
  'unicorn', 'cat', 'dog', 'rabbit', 'bear', 'wolf', 'fox', 'bird', 'fish',
  'boy', 'girl', 'child', 'friend', 'brother', 'sister', 'mom', 'dad',
  'hero', 'monster', 'giant', 'dwarf', 'elf', 'pirate', 'robot', 'alien',
  // Russe
  'дракон', 'принцесса', 'принц', 'король', 'королева', 'рыцарь', 'фея', 'волшебник',
  'единорог', 'кот', 'собака', 'кролик', 'медведь', 'волк', 'лиса', 'птица', 'рыба',
  'мальчик', 'девочка', 'ребёнок', 'друг', 'брат', 'сестра', 'мама', 'папа',
  // Pronoms qui indiquent un personnage
  'il', 'elle', 'lui', 'he', 'she', 'him', 'her', 'он', 'она',
  'mon', 'ma', 'mes', 'son', 'sa', 'my', 'his', 'мой', 'моя', 'его', 'её',
]

// QUOI - Actions et problèmes
const WHAT_KEYWORDS = [
  // Verbes d'action
  'cherche', 'trouve', 'perd', 'perdu', 'veut', 'doit', 'essaie', 'aide',
  'combat', 'sauve', 'protège', 'découvre', 'explore', 'voyage', 'part', 'arrive',
  'mange', 'dort', 'joue', 'court', 'vole', 'nage', 'saute', 'grimpe',
  'pleure', 'rit', 'crie', 'parle', 'chante', 'danse',
  // Problèmes
  'problème', 'danger', 'peur', 'perdu', 'seul', 'triste', 'fâché', 'en colère',
  'malade', 'blessé', 'coincé', 'piégé', 'poursuivi', 'attaqué',
  // Anglais
  'search', 'find', 'lose', 'lost', 'want', 'must', 'try', 'help',
  'fight', 'save', 'protect', 'discover', 'explore', 'travel', 'leave', 'arrive',
  'eat', 'sleep', 'play', 'run', 'fly', 'swim', 'jump', 'climb',
  'cry', 'laugh', 'scream', 'talk', 'sing', 'dance',
  'problem', 'danger', 'fear', 'scared', 'alone', 'sad', 'angry',
  'sick', 'hurt', 'stuck', 'trapped', 'chased', 'attacked',
  // Russe
  'ищет', 'находит', 'теряет', 'потерял', 'хочет', 'должен', 'пытается', 'помогает',
  'сражается', 'спасает', 'защищает', 'открывает', 'исследует', 'путешествует',
  'проблема', 'опасность', 'страх', 'один', 'грустный', 'злой',
]

// OÙ - Lieux
const WHERE_KEYWORDS = [
  // Lieux naturels
  'forêt', 'montagne', 'mer', 'océan', 'plage', 'rivière', 'lac', 'île',
  'désert', 'jungle', 'prairie', 'champ', 'jardin', 'parc',
  // Constructions
  'château', 'maison', 'cabane', 'grotte', 'cave', 'tour', 'palais',
  'village', 'ville', 'école', 'magasin', 'hôpital',
  // Lieux magiques
  'royaume', 'pays', 'monde', 'planète', 'espace', 'ciel', 'nuage',
  'sous l\'eau', 'sous terre', 'en haut', 'en bas', 'loin', 'près',
  // Prépositions de lieu
  'dans', 'sur', 'sous', 'devant', 'derrière', 'à côté', 'près de', 'au milieu',
  // Anglais
  'forest', 'mountain', 'sea', 'ocean', 'beach', 'river', 'lake', 'island',
  'desert', 'jungle', 'meadow', 'field', 'garden', 'park',
  'castle', 'house', 'cabin', 'cave', 'tower', 'palace',
  'village', 'city', 'town', 'school', 'shop', 'hospital',
  'kingdom', 'country', 'world', 'planet', 'space', 'sky', 'cloud',
  'underwater', 'underground', 'up', 'down', 'far', 'near',
  'in', 'on', 'under', 'behind', 'next to', 'near',
  // Russe
  'лес', 'гора', 'море', 'океан', 'пляж', 'река', 'озеро', 'остров',
  'замок', 'дом', 'пещера', 'башня', 'дворец',
  'деревня', 'город', 'школа', 'магазин',
  'королевство', 'страна', 'мир', 'планета', 'космос', 'небо',
]

// QUAND - Moments
const WHEN_KEYWORDS = [
  // Moments de la journée
  'matin', 'midi', 'après-midi', 'soir', 'nuit', 'aube', 'crépuscule',
  'jour', 'minuit', 'lever du soleil', 'coucher du soleil',
  // Saisons
  'printemps', 'été', 'automne', 'hiver',
  // Temps relatif
  'avant', 'après', 'pendant', 'soudain', 'tout à coup', 'un jour',
  'il était une fois', 'longtemps', 'maintenant', 'demain', 'hier',
  // Anglais
  'morning', 'noon', 'afternoon', 'evening', 'night', 'dawn', 'dusk',
  'day', 'midnight', 'sunrise', 'sunset',
  'spring', 'summer', 'autumn', 'fall', 'winter',
  'before', 'after', 'during', 'suddenly', 'one day',
  'once upon a time', 'long ago', 'now', 'tomorrow', 'yesterday',
  // Russe
  'утро', 'день', 'вечер', 'ночь', 'рассвет', 'закат',
  'весна', 'лето', 'осень', 'зима',
  'до', 'после', 'вдруг', 'однажды', 'давным-давно', 'сейчас',
]

// ET ALORS - Rebondissements et surprises
const THEN_KEYWORDS = [
  // Connecteurs de surprise
  'mais', 'soudain', 'tout à coup', 'alors', 'puis', 'ensuite',
  'malheureusement', 'heureusement', 'finalement', 'enfin',
  'par surprise', 'sans prévenir', 'incroyable', 'magique',
  // Événements
  'apparaît', 'disparaît', 'se transforme', 'change', 'explose',
  'tombe', 's\'ouvre', 'se ferme', 'brille', 's\'allume',
  'rencontre', 'découvre', 'réalise', 'comprend',
  // Anglais
  'but', 'suddenly', 'then', 'next', 'after that',
  'unfortunately', 'fortunately', 'finally', 'at last',
  'surprisingly', 'incredible', 'magical',
  'appears', 'disappears', 'transforms', 'changes', 'explodes',
  'falls', 'opens', 'closes', 'shines', 'lights up',
  'meets', 'discovers', 'realizes', 'understands',
  // Russe
  'но', 'вдруг', 'тогда', 'потом', 'затем',
  'к сожалению', 'к счастью', 'наконец',
  'появляется', 'исчезает', 'превращается', 'меняется',
  'падает', 'открывается', 'закрывается', 'светится',
  'встречает', 'обнаруживает', 'понимает',
]

// Messages de blocage
const BLOCKED_KEYWORDS = [
  // Français
  'je sais pas', 'je ne sais pas', 'sais pas', 'aucune idée', 'pas d\'idée',
  'j\'arrive pas', 'je n\'arrive pas', 'c\'est dur', 'c\'est difficile',
  'aide-moi', 'aide moi', 'help', 'bloqué', 'bloquée', 'coincé', 'coincée',
  'je peux pas', 'je ne peux pas',
  // Anglais
  'i don\'t know', 'don\'t know', 'no idea', 'i can\'t', 'can\'t',
  'it\'s hard', 'it\'s difficult', 'help me', 'stuck',
  // Russe
  'не знаю', 'нет идей', 'не могу', 'трудно', 'сложно', 'помоги',
]

// Demandes d'écrire à la place
const WRITE_FOR_ME_KEYWORDS = [
  // Français
  'écris pour moi', 'écris la suite', 'écris l\'histoire', 'fais-le pour moi',
  'tu peux écrire', 'peux-tu écrire', 'écris à ma place',
  'continue pour moi', 'finis pour moi', 'termine pour moi',
  // Anglais
  'write for me', 'write the story', 'do it for me', 'can you write',
  'continue for me', 'finish for me',
  // Russe
  'напиши за меня', 'напиши историю', 'продолжи за меня',
]

// ============================================================================
// FONCTIONS D'ANALYSE (IMAGES)
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
// FONCTIONS D'ANALYSE (ÉCRITURE - 5 Questions Magiques)
// ============================================================================

/**
 * Analyse un message de l'enfant et détecte les 5 Questions utilisées
 */
export function analyzeWritingMessage(message: string): WritingMessageAnalysis {
  const lowerMessage = message.toLowerCase()
  const words = message.split(/\s+/)
  const wordCount = words.length
  
  // Détection QUI (personnages)
  const whoMatches = WHO_KEYWORDS.filter(kw => lowerMessage.includes(kw.toLowerCase()))
  const hasWho = whoMatches.length >= 1 || wordCount >= 8 // Message long = probablement un personnage mentionné
  
  // Détection QUOI (actions, problèmes)
  const whatMatches = WHAT_KEYWORDS.filter(kw => lowerMessage.includes(kw.toLowerCase()))
  const hasWhat = whatMatches.length >= 1
  
  // Détection OÙ (lieux)
  const whereMatches = WHERE_KEYWORDS.filter(kw => lowerMessage.includes(kw.toLowerCase()))
  const hasWhere = whereMatches.length >= 1
  
  // Détection QUAND (moments)
  const whenMatches = WHEN_KEYWORDS.filter(kw => lowerMessage.includes(kw.toLowerCase()))
  const hasWhen = whenMatches.length >= 1
  
  // Détection ET ALORS (rebondissements)
  const thenMatches = THEN_KEYWORDS.filter(kw => lowerMessage.includes(kw.toLowerCase()))
  const hasThen = thenMatches.length >= 1
  
  // Détection blocage
  const isBlocked = BLOCKED_KEYWORDS.some(kw => lowerMessage.includes(kw.toLowerCase())) || wordCount <= 3
  
  // Détection demande d'écrire à la place
  const asksForHelp = WRITE_FOR_ME_KEYWORDS.some(kw => lowerMessage.includes(kw.toLowerCase()))
  
  // Liste des questions utilisées
  const questionsUsed: WritingQuestion[] = []
  if (hasWho) questionsUsed.push('who')
  if (hasWhat) questionsUsed.push('what')
  if (hasWhere) questionsUsed.push('where')
  if (hasWhen) questionsUsed.push('when')
  if (hasThen) questionsUsed.push('then')
  
  const questionsCount = questionsUsed.length
  
  // Qualité globale
  let quality: WritingMessageAnalysis['quality']
  if (isBlocked || wordCount <= 3) {
    quality = 'vague'
  } else if (questionsCount >= 4) {
    quality = 'excellent'
  } else if (questionsCount >= 3) {
    quality = 'bon'
  } else if (questionsCount >= 2) {
    quality = 'correct'
  } else if (questionsCount >= 1) {
    quality = 'basique'
  } else {
    quality = 'vague'
  }
  
  return {
    hasWho,
    whoDetails: whoMatches,
    hasWhat,
    whatDetails: whatMatches,
    hasWhere,
    whereDetails: whereMatches,
    hasWhen,
    whenDetails: whenMatches,
    hasThen,
    thenDetails: thenMatches,
    questionsUsed,
    questionsCount,
    quality,
    isBlocked,
    asksForHelp,
  }
}

// ============================================================================
// FONCTIONS DE PROGRESSION (ÉCRITURE)
// ============================================================================

/**
 * Calcule les XP gagnés selon les questions utilisées (écriture)
 * Calibré pour ~10h de progression totale
 */
export function calculateWritingXP(analysis: WritingMessageAnalysis): number {
  if (analysis.isBlocked || analysis.quality === 'vague') return 0
  
  switch (analysis.quality) {
    case 'excellent': return 30  // 4+ questions
    case 'bon': return 18        // 3 questions
    case 'correct': return 10    // 2 questions
    case 'basique': return 5     // 1 question
    default: return 0
  }
}

/**
 * Détermine le niveau d'écriture en fonction des XP
 */
export function getWritingLevelFromXP(xp: number): WritingLevel {
  if (xp >= WRITING_LEVELS_CONFIG.maitre_ia.xpRequired) return 'maitre_ia'
  if (xp >= WRITING_LEVELS_CONFIG.expert.xpRequired) return 'expert'
  if (xp >= WRITING_LEVELS_CONFIG.precis.xpRequired) return 'precis'
  if (xp >= WRITING_LEVELS_CONFIG.bavard.xpRequired) return 'bavard'
  return 'curieux'
}

/**
 * Détermine la prochaine question à apprendre
 */
export function getNextQuestionToLearn(progress: WritingPromptingProgress): WritingQuestion {
  const questionOrder: WritingQuestion[] = ['who', 'what', 'where', 'when', 'then']
  
  for (const question of questionOrder) {
    if (!progress.unlockedQuestions.includes(question)) {
      return question
    }
  }
  
  return 'then' // Toutes débloquées
}

/**
 * Met à jour la progression après un message à l'IA-Amie
 */
export function updateWritingProgression(
  currentProgress: WritingPromptingProgress,
  analysis: WritingMessageAnalysis
): {
  newProgress: WritingPromptingProgress
  events: WritingProgressionEvent[]
} {
  const events: WritingProgressionEvent[] = []
  
  // Copie de la progression
  const newProgress: WritingPromptingProgress = {
    ...currentProgress,
    questionProgress: { ...currentProgress.questionProgress },
    unlockedQuestions: [...currentProgress.unlockedQuestions],
    totalMessages: currentProgress.totalMessages + 1,
  }
  
  // Gestion du blocage
  if (analysis.isBlocked) {
    newProgress.consecutiveBlockedMessages++
    if (newProgress.consecutiveBlockedMessages >= 2) {
      events.push({ type: 'blocked_detected' })
    }
    return { newProgress, events }
  } else {
    newProgress.consecutiveBlockedMessages = 0
  }
  
  // XP gagné (seulement si pas bloqué)
  const xpGained = calculateWritingXP(analysis)
  if (xpGained > 0) {
    newProgress.xp += xpGained
    events.push({ type: 'xp_gained', value: xpGained })
  }
  
  // Progression des questions utilisées
  for (const question of analysis.questionsUsed) {
    if (newProgress.questionProgress[question] < 10) {
      newProgress.questionProgress[question]++
      events.push({ type: 'question_progress', question, value: newProgress.questionProgress[question] })
      
      // Question débloquée ? (à 10 utilisations)
      if (newProgress.questionProgress[question] === 10 && !newProgress.unlockedQuestions.includes(question)) {
        newProgress.unlockedQuestions.push(question)
        events.push({ type: 'question_unlocked', question })
      }
    }
  }
  
  // Level up ?
  const newLevel = getWritingLevelFromXP(newProgress.xp)
  if (newLevel !== currentProgress.level) {
    newProgress.level = newLevel
    events.push({ type: 'level_up', newLevel })
  }
  
  // Mettre à jour la question en cours d'apprentissage
  newProgress.currentQuestionLearning = getNextQuestionToLearn(newProgress)
  
  return { newProgress, events }
}

/**
 * Marque une histoire comme terminée et ajoute les XP bonus
 */
export function completeStory(
  currentProgress: WritingPromptingProgress
): {
  newProgress: WritingPromptingProgress
  events: WritingProgressionEvent[]
} {
  const events: WritingProgressionEvent[] = []
  
  const newProgress: WritingPromptingProgress = {
    ...currentProgress,
    questionProgress: { ...currentProgress.questionProgress },
    unlockedQuestions: [...currentProgress.unlockedQuestions],
    totalStories: currentProgress.totalStories + 1,
  }
  
  // Bonus XP pour histoire terminée
  const bonusXP = 80
  newProgress.xp += bonusXP
  events.push({ type: 'xp_gained', value: bonusXP })
  events.push({ type: 'story_completed' })
  
  // Vérifier level up
  const newLevel = getWritingLevelFromXP(newProgress.xp)
  if (newLevel !== currentProgress.level) {
    newProgress.level = newLevel
    events.push({ type: 'level_up', newLevel })
  }
  
  return { newProgress, events }
}

/**
 * Retourne la progression initiale pour l'écriture
 */
export function getInitialWritingProgress(): WritingPromptingProgress {
  return {
    level: 'curieux',
    xp: 0,
    questionProgress: {
      who: 0,
      what: 0,
      where: 0,
      when: 0,
      then: 0,
    },
    unlockedQuestions: [],
    totalMessages: 0,
    totalStories: 0,
    currentQuestionLearning: 'who',
    consecutiveBlockedMessages: 0,
  }
}

/**
 * Génère le contexte pédagogique pour l'IA-Amie (écriture)
 */
export function generateWritingLevelContext(
  progress: WritingPromptingProgress,
  locale: 'fr' | 'en' | 'ru' = 'fr'
): string {
  const levelConfig = WRITING_LEVELS_CONFIG[progress.level]
  const currentQuestion = WRITING_QUESTIONS_CONFIG[progress.currentQuestionLearning]
  const questionProgress = progress.questionProgress[progress.currentQuestionLearning]
  
  const mentionFrequencyText = {
    fr: levelConfig.mentionFrequency >= 0.4 
      ? 'SOUVENT (environ 1 message sur 2)' 
      : levelConfig.mentionFrequency >= 0.2 
        ? 'PARFOIS (environ 1 message sur 4)'
        : 'RAREMENT (elle sait déjà)',
    en: levelConfig.mentionFrequency >= 0.4 
      ? 'OFTEN (about 1 in 2 messages)' 
      : levelConfig.mentionFrequency >= 0.2 
        ? 'SOMETIMES (about 1 in 4 messages)'
        : 'RARELY (she already knows)',
    ru: levelConfig.mentionFrequency >= 0.4 
      ? 'ЧАСТО (примерно каждое 2-е сообщение)' 
      : levelConfig.mentionFrequency >= 0.2 
        ? 'ИНОГДА (примерно каждое 4-е сообщение)'
        : 'РЕДКО (она уже знает)',
  }

  return `
================================================================================
📊 NIVEAU DE L'ENFANT : ${levelConfig.emoji} ${levelConfig.name[locale]} (${progress.xp} XP)
================================================================================

QUESTIONS MAÎTRISÉES: ${progress.unlockedQuestions.map(q => WRITING_QUESTIONS_CONFIG[q].emoji + ' ' + WRITING_QUESTIONS_CONFIG[q].name[locale]).join(', ') || 'Aucune encore'}

QUESTION EN COURS: ${currentQuestion.emoji} ${currentQuestion.name[locale]} (${questionProgress}/10)

FRÉQUENCE DES MENTIONS PÉDAGOGIQUES: ${mentionFrequencyText[locale]}
→ Adapte ta façon de nommer les questions selon cette fréquence !

BLOCAGES CONSÉCUTIFS: ${progress.consecutiveBlockedMessages}
${progress.consecutiveBlockedMessages >= 2 ? '⚠️ L\'ENFANT EST BLOQUÉE - Propose ton aide avec des OPTIONS concrètes !' : ''}

HISTOIRES TERMINÉES: ${progress.totalStories}
`
}

// ============================================================================
// FONCTIONS DE PROGRESSION (IMAGES)
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
 * Génère le contexte pédagogique pour l'IA-Amie (images)
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

export type StoryStructure = 'tale' | 'adventure' | 'problem' | 'free'

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
// CONTEXTE PÉDAGOGIQUE POUR L'ÉCRITURE (Structure d'histoire uniquement)
// ============================================================================

/**
 * Génère le contexte SPÉCIFIQUE pour l'écriture (structure, étape actuelle)
 * Note: Les instructions générales sont dans LUNA_WRITING_PROMPT (gemini.ts)
 * Cette fonction n'ajoute que le contexte dynamique pour éviter la duplication
 */
export function generateWritingPedagogyContext(
  context: 'journal' | 'story',
  storyStructure?: StoryStructure,
  currentStep?: number,
  locale: 'fr' | 'en' | 'ru' = 'fr'
): string {
  if (context === 'journal') {
    return `
================================================================================
📓 CONTEXTE : MODE JOURNAL
================================================================================
L'enfant raconte sa VRAIE journée (souvenirs réels, pas fiction).
Aide-la à développer ses souvenirs en posant des questions.
`
  }

  if (context === 'story' && storyStructure && storyStructure !== 'free') {
    const template = STORY_TEMPLATES[storyStructure]
    const step = currentStep !== undefined ? template.steps[currentStep] : null
    
    return `
================================================================================
📖 CONTEXTE : HISTOIRE STRUCTURÉE - ${template.name[locale]}
================================================================================
${step ? `
📍 ÉTAPE ACTUELLE (${currentStep! + 1}/${template.steps.length}) : ${step.title[locale]}
📝 Objectif : ${step.prompt[locale]}

→ Guide l'enfant pour cette étape spécifique.
` : `
L'enfant suit la structure "${template.name[locale]}".
`}
`
  }

  // Mode libre
  return `
================================================================================
📝 CONTEXTE : ÉCRITURE LIBRE
================================================================================
Pas de structure imposée. L'enfant est libre de créer son histoire comme elle veut.
`
}
