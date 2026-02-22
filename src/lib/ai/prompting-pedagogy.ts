/**
 * Pedagogy types and story templates (stripped of pedagogy logic).
 * Types/interfaces kept for import compatibility.
 * Functions are stubs that return no-op values.
 */

// ============================================================================
// TYPES
// ============================================================================

export type PromptingLevel = 'explorer' | 'apprenti' | 'artiste' | 'magicien' | 'maitre'

export type MagicKey = 'style' | 'hero' | 'mood' | 'world' | 'magic'

export interface KeyProgress {
  style: number
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
// TYPES - WRITING
// ============================================================================

export type WritingLevel = 'curieux' | 'bavard' | 'precis' | 'expert' | 'maitre_ia'

export type WritingQuestion = 'who' | 'what' | 'where' | 'when' | 'then'

export interface WritingQuestionProgress {
  who: number
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
  consecutiveBlockedMessages: number
}

export interface WritingMessageAnalysis {
  hasWho: boolean
  whoDetails: string[]
  hasWhat: boolean
  whatDetails: string[]
  hasWhere: boolean
  whereDetails: string[]
  hasWhen: boolean
  whenDetails: string[]
  hasThen: boolean
  thenDetails: string[]
  questionsUsed: WritingQuestion[]
  questionsCount: number
  quality: 'vague' | 'basique' | 'correct' | 'bon' | 'excellent'
  isBlocked: boolean
  asksForHelp: boolean
}

export interface WritingProgressionEvent {
  type: 'xp_gained' | 'question_progress' | 'question_unlocked' | 'level_up' | 'story_completed' | 'blocked_detected'
  value?: number
  question?: WritingQuestion
  newLevel?: WritingLevel
}

// ============================================================================
// EMPTY CONFIGS (kept for import compat)
// ============================================================================

export const MAGIC_KEYS_CONFIG = {} as Record<string, unknown>

export const LEVELS_CONFIG = {} as Record<string, unknown>

export const WRITING_LEVELS_CONFIG = {} as Record<string, unknown>

export const WRITING_QUESTIONS_CONFIG = {} as Record<string, unknown>

// ============================================================================
// STORY TEMPLATES (kept — these are structural templates, not pedagogy)
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
    name: { fr: 'Conte classique', en: 'Classic tale', ru: 'Классическая сказка' },
    description: { fr: 'Comme les contes de fées traditionnels', en: 'Like traditional fairy tales', ru: 'Как традиционные сказки' },
    recommendedPages: { min: 6, max: 10 },
    steps: [
      { title: { fr: 'Il était une fois...', en: 'Once upon a time...', ru: 'Жили-были...' }, prompt: { fr: 'Présente ton héros et son monde', en: 'Introduce your hero and their world', ru: 'Представь героя и его мир' }, pages: 2 },
      { title: { fr: 'Mais un jour...', en: 'But one day...', ru: 'Но однажды...' }, prompt: { fr: 'Quelque chose change tout', en: 'Something changes everything', ru: 'Что-то меняет всё' }, pages: 2 },
      { title: { fr: 'Alors...', en: 'Then...', ru: 'Тогда...' }, prompt: { fr: 'Le héros agit et rencontre des obstacles', en: 'The hero acts and faces obstacles', ru: 'Герой действует и встречает препятствия' }, pages: 3 },
      { title: { fr: 'Enfin...', en: 'Finally...', ru: 'Наконец...' }, prompt: { fr: 'Le problème est résolu', en: 'The problem is solved', ru: 'Проблема решена' }, pages: 2 },
      { title: { fr: 'Et depuis...', en: 'And since then...', ru: 'И с тех пор...' }, prompt: { fr: 'La fin heureuse', en: 'The happy ending', ru: 'Счастливый конец' }, pages: 1 },
    ],
  },
  adventure: {
    id: 'adventure',
    name: { fr: 'Aventure', en: 'Adventure', ru: 'Приключение' },
    description: { fr: 'Voyage, quête et exploration', en: 'Journey, quest and exploration', ru: 'Путешествие, поиск и исследование' },
    recommendedPages: { min: 8, max: 12 },
    steps: [
      { title: { fr: 'Le héros', en: 'The hero', ru: 'Герой' }, prompt: { fr: 'Qui est-il ? Qu\'est-ce qu\'il veut ?', en: 'Who are they? What do they want?', ru: 'Кто он? Чего он хочет?' }, pages: 2 },
      { title: { fr: 'L\'appel', en: 'The call', ru: 'Призыв' }, prompt: { fr: 'Quelque chose l\'oblige à partir', en: 'Something forces them to leave', ru: 'Что-то заставляет его уйти' }, pages: 1 },
      { title: { fr: 'Le voyage', en: 'The journey', ru: 'Путешествие' }, prompt: { fr: 'Il découvre un nouveau monde', en: 'They discover a new world', ru: 'Он открывает новый мир' }, pages: 2 },
      { title: { fr: 'Les épreuves', en: 'The trials', ru: 'Испытания' }, prompt: { fr: 'Obstacles et problèmes', en: 'Obstacles and problems', ru: 'Препятствия и проблемы' }, pages: 2 },
      { title: { fr: 'L\'aide', en: 'The help', ru: 'Помощь' }, prompt: { fr: 'Il rencontre un ami ou trouve un objet magique', en: 'They meet a friend or find a magic item', ru: 'Он встречает друга или находит волшебный предмет' }, pages: 2 },
      { title: { fr: 'Le grand défi', en: 'The big challenge', ru: 'Главное испытание' }, prompt: { fr: 'Le plus gros problème', en: 'The biggest problem', ru: 'Самая большая проблема' }, pages: 2 },
      { title: { fr: 'La victoire', en: 'The victory', ru: 'Победа' }, prompt: { fr: 'Il gagne et rentre changé', en: 'They win and return changed', ru: 'Он побеждает и возвращается изменившимся' }, pages: 1 },
    ],
  },
  problem: {
    id: 'problem',
    name: { fr: 'Problème-Solution', en: 'Problem-Solution', ru: 'Проблема-Решение' },
    description: { fr: 'Quelqu\'un a un souci à régler', en: 'Someone has a problem to solve', ru: 'У кого-то есть проблема' },
    recommendedPages: { min: 5, max: 8 },
    steps: [
      { title: { fr: 'Tout va bien', en: 'All is well', ru: 'Всё хорошо' }, prompt: { fr: 'La vie normale du héros', en: 'The hero\'s normal life', ru: 'Обычная жизнь героя' }, pages: 2 },
      { title: { fr: 'Le problème', en: 'The problem', ru: 'Проблема' }, prompt: { fr: 'Quelque chose ne va plus', en: 'Something goes wrong', ru: 'Что-то идёт не так' }, pages: 1 },
      { title: { fr: 'Les tentatives', en: 'The attempts', ru: 'Попытки' }, prompt: { fr: 'Il essaie de résoudre, ça ne marche pas', en: 'They try to fix it, it doesn\'t work', ru: 'Он пытается решить, не получается' }, pages: 2 },
      { title: { fr: 'La solution', en: 'The solution', ru: 'Решение' }, prompt: { fr: 'Il trouve enfin comment faire', en: 'They finally find a way', ru: 'Наконец он находит способ' }, pages: 2 },
      { title: { fr: 'Tout va mieux', en: 'All is better', ru: 'Всё лучше' }, prompt: { fr: 'Le problème est résolu', en: 'The problem is solved', ru: 'Проблема решена' }, pages: 1 },
    ],
  },
  free: {
    id: 'free',
    name: { fr: 'Libre', en: 'Free', ru: 'Свободно' },
    description: { fr: 'Tu fais comme tu veux !', en: 'Do it your way!', ru: 'Делай как хочешь!' },
    recommendedPages: { min: 3, max: 20 },
    steps: [],
  },
}

// ============================================================================
// STUB FUNCTIONS (no-op, kept for import compat)
// ============================================================================

export function analyzePrompt(_prompt: string): PromptAnalysis {
  return {
    hasStyle: false, styleFound: null,
    hasDetailedHero: false, heroDetails: [],
    hasMood: false, moodFound: null,
    hasWorld: false, worldDetails: [],
    hasMagicDetail: false, magicFound: null,
    keysUsed: [], keysCount: 0, quality: 'basic',
  }
}

export function analyzeWritingMessage(_message: string): WritingMessageAnalysis {
  return {
    hasWho: false, whoDetails: [],
    hasWhat: false, whatDetails: [],
    hasWhere: false, whereDetails: [],
    hasWhen: false, whenDetails: [],
    hasThen: false, thenDetails: [],
    questionsUsed: [], questionsCount: 0,
    quality: 'vague', isBlocked: false, asksForHelp: false,
  }
}

export function calculateWritingXP(_analysis: WritingMessageAnalysis): number { return 0 }

export function getWritingLevelFromXP(_xp: number): WritingLevel { return 'curieux' }

export function getNextQuestionToLearn(_progress: WritingPromptingProgress): WritingQuestion { return 'who' }

export function updateWritingProgression(
  _progress: WritingPromptingProgress,
  _analysis: WritingMessageAnalysis,
): { progress: WritingPromptingProgress; events: WritingProgressionEvent[] } {
  return { progress: _progress, events: [] }
}

export function completeStory(
  _progress: WritingPromptingProgress,
): { progress: WritingPromptingProgress; events: WritingProgressionEvent[] } {
  return { progress: _progress, events: [] }
}

export function getInitialWritingProgress(): WritingPromptingProgress {
  return {
    level: 'curieux', xp: 0,
    questionProgress: { who: 0, what: 0, where: 0, when: 0, then: 0 },
    unlockedQuestions: ['who', 'what'],
    totalMessages: 0, totalStories: 0,
    currentQuestionLearning: 'who',
    consecutiveBlockedMessages: 0,
  }
}

export function generateWritingLevelContext(
  _progress: WritingPromptingProgress,
  _locale?: string,
): string { return '' }

export function calculateXP(_keysCount: number): number { return 0 }

export function getLevelFromXP(_xp: number): PromptingLevel { return 'explorer' }

export function getNextKeyToLearn(_progress: PromptingProgress): MagicKey { return 'style' }

export function updateProgression(
  _progress: PromptingProgress,
  _analysis: PromptAnalysis,
): { progress: PromptingProgress; events: ProgressionEvent[] } {
  return { progress: _progress, events: [] }
}

export function generateImagePedagogyContext(
  _progress: PromptingProgress,
  _locale?: string,
): string { return '' }

export function generateImageFeedback(
  _analysis: PromptAnalysis,
  _progress: PromptingProgress,
  _locale?: string,
): string { return '' }

export function getInitialProgress(): PromptingProgress {
  return {
    level: 'explorer', xp: 0,
    keyProgress: { style: 0, hero: 0, mood: 0, world: 0, magic: 0 },
    unlockedKeys: ['style', 'hero'],
    totalImages: 0, currentKeyLearning: 'style',
  }
}

export function generateWritingPedagogyContext(
  _context: 'journal' | 'story',
  _storyStructure?: StoryStructure,
  _currentStep?: number,
  _locale?: string,
): string { return '' }
