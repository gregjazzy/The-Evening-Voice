/**
 * API Route - Chat avec l'assistant technique
 * Guidage visuel (highlights) + modération de contenu
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateLunaResponse, type ChatMessage, type LunaContext } from '@/lib/ai/gemini'
import type { StoryStructure } from '@/lib/ai/prompting-pedagogy'
import { parseHighlightCommands, generateInterfaceKnowledge, type HighlightConfig } from '@/store/useHighlightStore'
import { getApiKeyForRequest } from '@/lib/config/server-config'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

// Modération du contenu via Gemini
async function isContentAppropriate(text: string, apiKey: string): Promise<boolean> {
  if (!text || text.length < 5) return true
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    })

    const prompt = `Tu es un modérateur de contenu pour une application destinée aux enfants de 4 à 10 ans.

Un enfant a écrit ce message : "${text}"

Ce message est-il approprié pour un enfant ? Réponds UNIQUEMENT par "OUI" ou "NON".

Critères pour répondre "NON" :
- Gros mots ou insultes (même déguisés)
- Contenu sexuel ou références au sexe
- Violence graphique
- Thèmes adultes inappropriés

Réponds "OUI" pour tout le reste : questions sur l'application, l'interface, les outils, l'écriture, les images, ou toute question innocente même si elle est mal formulée ou incompréhensible.`

    const result = await model.generateContent(prompt)
    const response = result.response.text().trim().toUpperCase()
    return response.includes('OUI')
  } catch (error) {
    console.error('Erreur modération:', error)
    return true // Fail-open
  }
}

// Réponses de redirection pour contenu inapproprié
const REDIRECT_RESPONSES = {
  fr: "Hmm, je préfère qu'on parle d'autre chose ! 😊",
  en: "Hmm, let's talk about something else! 😊",
  ru: "Хм, давай поговорим о чём-то другом! 😊"
}

interface ChatRequestBody {
  message: string
  context?: 'diary' | 'book' | 'studio' | 'montage' | 'general'
  currentMode?: string
  locale?: 'fr' | 'en' | 'ru'
  aiName?: string
  userName?: string
  chatHistory?: ChatMessage[]
  emotionalContext?: string[]
  storyStructure?: StoryStructure
  storyStep?: number
  studioContext?: {
    type: 'image' | 'video'
  }
}

interface ChatResponse {
  text: string
  highlights?: HighlightConfig[]
  isAppropriate?: boolean // Indique si le contenu de l'enfant est approprié
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
      userName,
      chatHistory = [],
      emotionalContext = [],
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

    // Récupérer la clé API pour la modération
    const apiKey = await getApiKeyForRequest('gemini')
    
    // Modérer le contenu du message de l'enfant
    if (apiKey) {
      const contentIsAppropriate = await isContentAppropriate(message, apiKey)
      if (!contentIsAppropriate) {
        console.log(`🛡️ Contenu bloqué dans chat: "${message.substring(0, 50)}..."`)
        return NextResponse.json({
          text: REDIRECT_RESPONSES[locale] || REDIRECT_RESPONSES.fr,
          highlights: undefined,
          isAppropriate: false, // Signaler que le contenu n'est pas approprié
        })
      }
    }

    // Générer le contexte de l'interface pour le guidage visuel
    const interfaceMode = currentMode || context || 'general'
    const interfaceKnowledge = generateInterfaceKnowledge(interfaceMode)

    // Construire le contexte de l'assistant
    const aiContext: LunaContext = {
      mode: context,
      locale,
      aiName,
      userName,
      apiKey: apiKey || undefined,
      storyStructure,
      storyStep,
      emotionalContext,
      studioType: studioContext?.type,
      interfaceKnowledge,
    }

    // Générer la réponse de l'assistant
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
      isAppropriate: true, // Le contenu a passé la modération
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
