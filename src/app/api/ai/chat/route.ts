/**
 * API Route - Chat avec l'IA-Amie (nom personnalisable)
 * Utilise le système des 5 Clés Magiques (images) + 5 Questions Magiques (écriture)
 * + Système de guidage visuel (highlights)
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateLunaResponse, type ChatMessage, type LunaContext } from '@/lib/ai/gemini'
import type { PromptingProgress, StoryStructure, WritingPromptingProgress } from '@/lib/ai/prompting-pedagogy'
import { parseHighlightCommands, generateInterfaceKnowledge, type HighlightConfig } from '@/store/useHighlightStore'

interface ChatRequestBody {
  message: string
  context?: 'diary' | 'book' | 'studio' | 'general'
  currentMode?: string // Mode actuel de l'interface (pour le guidage visuel)
  locale?: 'fr' | 'en' | 'ru'
  aiName?: string // Nom personnalisé de l'IA
  chatHistory?: ChatMessage[]
  emotionalContext?: string[]
  promptingProgress?: PromptingProgress
  writingProgress?: WritingPromptingProgress
  storyStructure?: StoryStructure
  storyStep?: number
  // Contexte spécifique au Studio
  studioContext?: {
    type: 'image' | 'video'
    currentStep?: string
    level?: number
    // État du kit de création
    kit?: {
      subject?: string
      subjectDetails?: string
      style?: string | null
      ambiance?: string | null
      light?: string | null
    } | null
    // Éléments manquants détectés
    missingElements?: string[]
    // Étapes complétées
    completedSteps?: string[]
  }
}

interface ChatResponse {
  text: string
  highlights?: HighlightConfig[]
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json()
    const { 
      message, 
      context = 'general',
      currentMode,
      locale = 'fr',
      aiName,
      chatHistory = [], 
      emotionalContext = [],
      promptingProgress,
      writingProgress,
      storyStructure,
      storyStep,
      studioContext
    } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message requis' },
        { status: 400 }
      )
    }

    // Générer le contexte de l'interface pour le guidage visuel
    const interfaceMode = currentMode || context || 'general'
    const interfaceKnowledge = generateInterfaceKnowledge(interfaceMode)

    // Construire le contexte de l'IA-Amie
    const aiContext: LunaContext = {
      mode: context,
      locale,
      aiName, // Nom personnalisé transmis au prompt
      promptingProgress,
      writingProgress,
      storyStructure,
      storyStep,
      emotionalContext,
      studioType: studioContext?.type, // Type de création studio (image/video)
      // Nouveau : contexte enrichi pour le Studio
      studioKit: studioContext?.kit,
      studioMissingElements: studioContext?.missingElements,
      studioLevel: studioContext?.level,
      // Nouveau : connaissance de l'interface pour le guidage visuel
      interfaceKnowledge,
    }

    // Générer la réponse de l'IA-Amie
    const rawResponse = await generateLunaResponse(
      message,
      aiContext,
      chatHistory
    )

    // Parser les commandes de highlight dans la réponse
    const { cleanText, highlights } = parseHighlightCommands(rawResponse.text)

    // Retourner la réponse nettoyée avec les highlights
    const response: ChatResponse = {
      text: cleanText,
      highlights: highlights.length > 0 ? highlights : undefined,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erreur API chat:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la réponse' },
      { status: 500 }
    )
  }
}
