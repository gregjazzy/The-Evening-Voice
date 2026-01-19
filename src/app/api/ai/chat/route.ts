/**
 * API Route - Chat avec l'IA-Amie (nom personnalisable)
 * Utilise le système des 5 Clés Magiques (images) + 5 Questions Magiques (écriture)
 * + Système de guidage visuel (highlights)
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateLunaResponse, type ChatMessage, type LunaContext } from '@/lib/ai/gemini'
import type { PromptingProgress, StoryStructure, WritingPromptingProgress } from '@/lib/ai/prompting-pedagogy'
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

Réponds "OUI" si c'est une question innocente sur l'écriture d'histoire.`

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
  fr: "Hmm, je préfère qu'on parle d'autre chose ! 😊 Qu'est-ce que tu aimerais raconter comme histoire ? Un aventurier courageux ? Une princesse magique ? Un animal rigolo ?",
  en: "Hmm, let's talk about something else! 😊 What kind of story would you like to tell? A brave adventurer? A magical princess? A funny animal?",
  ru: "Хм, давай поговорим о чём-то другом! 😊 Какую историю ты хочешь рассказать? О храбром приключенце? О волшебной принцессе? О забавном животном?"
}

interface ChatRequestBody {
  message: string
  context?: 'diary' | 'book' | 'studio' | 'montage' | 'general'
  currentMode?: string // Mode actuel de l'interface (pour le guidage visuel)
  locale?: 'fr' | 'en' | 'ru'
  aiName?: string // Nom personnalisé de l'IA
  userName?: string // Prénom de l'enfant
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
      userName,
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

    // Récupérer la clé API pour la modération
    const apiKey = await getApiKeyForRequest('gemini')
    
    // Modérer le contenu du message de l'enfant
    if (apiKey) {
      const isAppropriate = await isContentAppropriate(message, apiKey)
      if (!isAppropriate) {
        console.log(`🛡️ Contenu bloqué dans chat: "${message.substring(0, 50)}..."`)
        return NextResponse.json({
          text: REDIRECT_RESPONSES[locale] || REDIRECT_RESPONSES.fr,
          highlights: undefined,
        })
      }
    }

    // Générer le contexte de l'interface pour le guidage visuel
    const interfaceMode = currentMode || context || 'general'
    const interfaceKnowledge = generateInterfaceKnowledge(interfaceMode)

    // Construire le contexte de l'IA-Amie
    const aiContext: LunaContext = {
      mode: context,
      locale,
      aiName, // Nom personnalisé transmis au prompt
      userName, // Prénom de l'enfant pour personnaliser les réponses
      apiKey: apiKey || undefined, // Clé API dynamique
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
      studioConsecutiveStruggles: studioContext?.consecutiveStruggles, // Blocages répétés
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
