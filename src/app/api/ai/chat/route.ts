/**
 * API Route - Chat avec l'IA-Amie (nom personnalisable)
 * Utilise le système des 5 Clés Magiques (images) + 5 Questions Magiques (écriture)
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateLunaResponse, type ChatMessage, type LunaContext } from '@/lib/ai/gemini'
import type { PromptingProgress, StoryStructure, WritingPromptingProgress } from '@/lib/ai/prompting-pedagogy'

interface ChatRequestBody {
  message: string
  context?: 'diary' | 'book' | 'studio' | 'general'
  locale?: 'fr' | 'en' | 'ru'
  aiName?: string // Nom personnalisé de l'IA
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
      aiName,
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
    }

    // Générer la réponse de l'IA-Amie
    const response = await generateLunaResponse(
      message,
      aiContext,
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
