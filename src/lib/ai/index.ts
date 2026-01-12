/**
 * Point d'entrée pour tous les services IA
 */

// Gemini (IA-Amie Luna)
export {
  generateLunaResponse,
  generateImagePrompt,
  analyzeForMemoryImage,
} from './gemini'

export type { LunaContext, GeminiResponse, ChatMessage } from './gemini'

// Prompting pedagogy (5 Clés Magiques - IMAGES)
export {
  analyzePrompt,
  updateProgression,
  calculateXP,
  generateImagePedagogyContext,
  generateWritingPedagogyContext,
  generateImageFeedback,
  getInitialProgress,
  MAGIC_KEYS_CONFIG,
  LEVELS_CONFIG,
  STORY_TEMPLATES,
  // 5 Questions Magiques - ÉCRITURE
  analyzeWritingMessage,
  updateWritingProgression,
  calculateWritingXP,
  getInitialWritingProgress,
  completeStory,
  generateWritingLevelContext,
  WRITING_LEVELS_CONFIG,
  WRITING_QUESTIONS_CONFIG,
} from './prompting-pedagogy'

export type {
  PromptingProgress,
  PromptAnalysis,
  ProgressionEvent,
  MagicKey,
  PromptingLevel,
  StoryStructure,
  StoryTemplate,
  // Types pour l'écriture
  WritingLevel,
  WritingPromptingProgress,
  WritingMessageAnalysis,
  WritingProgressionEvent,
  WritingQuestion,
} from './prompting-pedagogy'

// ElevenLabs (Voix/Narration)
export {
  generateVoice,
  generatePageNarration,
  generateLunaVoice,
  estimateAudioDuration,
  getAvailableVoices,
  checkQuota as checkElevenLabsQuota,
  AVAILABLE_VOICES,
} from './elevenlabs'

// Midjourney (Images)
export {
  generateImage,
  checkGenerationStatus as checkMidjourneyStatus,
  waitForGeneration as waitForMidjourneyGeneration,
  launchMidjourneySafari,
  adaptChildPrompt,
} from './midjourney'

// Vidéo (Runway/Luma)
export {
  generateVideoRunway,
  generateVideoLuma,
  generateBackgroundVideo,
  checkRunwayStatus,
  checkLumaStatus,
  waitForVideoGeneration,
} from './video'

// Types réexportés
export type { VoiceType } from './elevenlabs'

