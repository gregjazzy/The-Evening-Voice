/**
 * API Route - Chat avec Luna (IA-Amie)
 * Utilise le système des 5 Clés Magiques (images) + 5 Questions Magiques (écriture)
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateLunaResponse, type ChatMessage, type LunaContext } from '@/lib/ai/gemini'
import type { PromptingProgress, StoryStructure, WritingPromptingProgress } from '@/lib/ai/prompting-pedagogy'

interface ChatRequestBody {
  message: string
  context?: 'diary' | 'book' | 'studio' | 'general'
  locale?: 'fr' | 'en' | 'ru'
  chatHistory?: ChatMessage[]
  emotionalContext?: string[]
  promptingProgress?: PromptingProgress
  writingProgress?: WritingPromptingProgress
  storyStructure?: StoryStructure
  storyStep?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json()
    const { 
      message, 
      context = 'general',
      locale = 'fr',
      chatHistory = [], 
      emotionalContext = [],
      promptingProgress,
      writingProgress,
      storyStructure,
      storyStep
    } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message requis' },
        { status: 400 }
      )
    }

    // Construire le contexte Luna
    const lunaContext: LunaContext = {
      mode: context,
      locale,
      promptingProgress,
      writingProgress,
      storyStructure,
      storyStep,
      emotionalContext,
    }

    // Générer la réponse de Luna
    const response = await generateLunaResponse(
      message,
      lunaContext,
      chatHistory
    )

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erreur API chat:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la réponse' },
      { status: 500 }
    )
  }
}
