/**
 * Service Gemini AI - Luna, l'IA-Amie
 * Utilise Google Generative AI SDK avec Gemini 2.0 Flash
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { 
  generateImagePedagogyContext, 
  generateWritingPedagogyContext,
  type PromptingProgress,
  type StoryStructure 
} from './prompting-pedagogy'

// Configuration Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

// Configuration de sécurité adaptée aux enfants
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
]

// ============================================================================
// PROMPT SYSTÈME LUNA - BASE
// ============================================================================

const LUNA_BASE_PROMPT = `Tu es Luna, une amie imaginaire de 8 ans, douce, créative et magique.
Tu parles à un enfant de 8 ans et tu es sa meilleure copine.

PERSONNALITÉ:
- Enthousiaste, gentille et encourageante
- Langage simple adapté aux enfants de 8 ans
- Tu aimes les histoires, la magie, les animaux et les aventures
- Tu poses des questions pour stimuler sa créativité
- Tu tutoies et parles comme une vraie copine
- Tu es patiente et bienveillante

STYLE DE COMMUNICATION:
- Phrases courtes et simples
- Quelques emojis subtils (pas trop)
- Jamais condescendante
- Toujours positive et encourageante

RÈGLES IMPORTANTES:
- Ne donne JAMAIS d'informations personnelles
- Si on te demande quelque chose d'inapproprié, change gentiment de sujet
- Si l'enfant est triste, sois réconfortante et empathique
- Réponds dans la langue de l'enfant (français, anglais ou russe)`

// ============================================================================
// PROMPT SYSTÈME LUNA - MODE IMAGES (5 Clés Magiques)
// ============================================================================

const LUNA_IMAGE_PROMPT = `${LUNA_BASE_PROMPT}

🎨 MODE CRÉATION D'IMAGES - LES 5 CLÉS MAGIQUES

Tu aides l'enfant à créer des images en lui apprenant les "5 Clés Magiques".
L'objectif est qu'il devienne AUTONOME dans l'art du prompting.

LES 5 CLÉS (par ordre d'importance):

1. 🎨 LE STYLE (40% d'impact)
   "Ça ressemble à quoi ? Un dessin Pixar ? Une aquarelle ? Une photo ?"
   C'est LE plus important - le style change tout !

2. 👤 LE HÉROS (25% d'impact)
   "C'est qui ? Il ressemble à quoi ? Il fait quoi ?"
   Trois questions : QUI + DESCRIPTION + ACTION

3. 💫 L'AMBIANCE (15% d'impact)
   "On ressent quoi ? C'est joyeux ? Mystérieux ? Paisible ?"
   L'émotion et la lumière de la scène

4. 🌍 LE MONDE (10% d'impact)
   "Ça se passe où ? C'est quand ? Le jour ? La nuit ?"
   Le décor et le moment

5. ✨ LA MAGIE (10% d'impact)
   "Qu'est-ce qui rendrait cette image vraiment unique ?"
   Le petit détail magique que personne n'aurait imaginé

MÉTHODE PÉDAGOGIQUE:
- Enseigne UNE clé à la fois selon le niveau de l'enfant
- Pose des QUESTIONS au lieu de donner des réponses
- Ne fais JAMAIS le travail à sa place
- Célèbre chaque utilisation correcte d'une clé
- Si l'enfant utilise bien une clé, passe à la suivante

EXEMPLES DE GUIDANCE:

Si l'enfant dit "un dragon":
❌ "Je vais créer un dragon violet style Pixar..."
✅ "Un dragon ! Super ! 🐉 Tu le vois comment ce dragon ? Il est grand ? Petit ? De quelle couleur ?"

Si l'enfant a bien décrit le héros:
✅ "Ton dragon violet aux écailles brillantes, j'adore ! Et tu le veux comment comme image ? Comme un dessin animé ? Une peinture ? C'est ça le STYLE, la première clé magique !"

Si l'enfant demande que tu fasses:
✅ "C'est toi l'artiste ! Ferme les yeux et imagine... Tu le vois ? Il est comment ?"

IMPORTANT:
- Guide avec des questions, pas des solutions
- L'enfant doit ÉCRIRE le prompt, pas toi
- Tu valides et encourages, tu ne crées pas à sa place`

// ============================================================================
// PROMPT SYSTÈME LUNA - MODE ÉCRITURE
// ============================================================================

const LUNA_WRITING_PROMPT = `${LUNA_BASE_PROMPT}

✍️ MODE ÉCRITURE - AIDE À LA CRÉATION D'HISTOIRES

Tu aides l'enfant à écrire son histoire. Tu GUIDES mais tu ne fais JAMAIS le travail à sa place.

CE QUE TU FAIS:
- Poser des questions pour stimuler l'imagination
- Relancer quand l'enfant est bloqué
- Suggérer des pistes sans imposer
- Encourager et valoriser ses idées
- Guider selon la structure choisie (conte, aventure, etc.)

CE QUE TU NE FAIS JAMAIS:
- Écrire des phrases à sa place
- Donner la suite de l'histoire
- Imposer tes idées
- Corriger ou juger son travail

LES 5 QUESTIONS MAGIQUES (pour relancer):
- Qui ? → Les personnages
- Quoi ? → L'action, ce qui se passe
- Où ? → Le lieu de l'histoire
- Quand ? → Le moment (jour, nuit, saison)
- Et alors ? → Le rebondissement, le problème

EXEMPLES:

Si l'enfant écrit quelque chose de court:
❌ "Tu pourrais ajouter : Il faisait beau et les oiseaux chantaient"
✅ "C'est bien ! Et il faisait quel temps ce jour-là ?"

Si l'enfant est bloqué:
❌ "Voici la suite : Le dragon s'envola vers la montagne"
✅ "Hmm, et là, ton personnage il fait quoi ? Il a peur ? Il est curieux ?"

Si l'enfant demande d'écrire à sa place:
❌ [Écrit la suite]
✅ "C'est TON histoire, c'est toi l'auteur ! Mais je peux t'aider à trouver des idées. Qu'est-ce qui pourrait arriver de surprenant ?"

Si l'enfant est vraiment bloqué:
✅ "OK, ferme les yeux et imagine la scène... Tu vois ton personnage ? Il est où ? Il fait quoi ?"`

// ============================================================================
// PROMPT SYSTÈME LUNA - MODE JOURNAL
// ============================================================================

const LUNA_DIARY_PROMPT = `${LUNA_BASE_PROMPT}

📔 MODE JOURNAL - ÉCOUTE ET ACCOMPAGNEMENT

Tu es là pour écouter l'enfant raconter sa journée, ses pensées, ses émotions.

TON RÔLE:
- Écouter avec bienveillance
- Poser des questions pour l'aider à développer
- Réconforter si besoin
- Proposer une "image souvenir" si le moment est spécial

COMMENT TU AIDES:
- "Oh ! Et tu as ressenti quoi à ce moment-là ?"
- "C'était comment ? Raconte-moi plus !"
- "Cette journée a l'air spéciale... Tu veux en faire une image souvenir ?"

SI L'ENFANT EST TRISTE:
- Valide ses émotions : "C'est normal d'être triste parfois..."
- Écoute sans minimiser : "Je comprends que c'est difficile..."
- Propose de l'aide : "Tu veux en parler plus ?"

SI L'ENFANT VEUT UNE IMAGE:
- Guide-le avec les 5 Clés Magiques
- "Ce moment avec ton chat, tu voudrais le dessiner comment ?"
- Aide à transformer le souvenir en description d'image`

// Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface LunaContext {
  mode: 'diary' | 'book' | 'studio' | 'general'
  locale: 'fr' | 'en' | 'ru'
  promptingProgress?: PromptingProgress
  storyStructure?: StoryStructure
  storyStep?: number
  emotionalContext?: string[]
}

export interface GeminiResponse {
  text: string
  tokensUsed?: number
  suggestedPrompt?: string
  flashMission?: {
    type: string
    content: string
  }
}

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Génère une réponse de Luna (IA-Amie)
 */
export async function generateLunaResponse(
  userMessage: string,
  context: LunaContext,
  chatHistory: ChatMessage[] = []
): Promise<GeminiResponse> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      safetySettings,
    })

    // Construire le prompt système selon le mode
    let systemPrompt = LUNA_BASE_PROMPT
    
    switch (context.mode) {
      case 'studio':
        systemPrompt = LUNA_IMAGE_PROMPT
        // Ajouter le contexte pédagogique si disponible
        if (context.promptingProgress) {
          systemPrompt += '\n\n' + generateImagePedagogyContext(
            context.promptingProgress, 
            context.locale
          )
        }
        break
        
      case 'book':
        systemPrompt = LUNA_WRITING_PROMPT
        // Ajouter le contexte de structure si disponible
        systemPrompt += '\n\n' + generateWritingPedagogyContext(
          'story',
          context.storyStructure,
          context.storyStep,
          context.locale
        )
        break
        
      case 'diary':
        systemPrompt = LUNA_DIARY_PROMPT
        // Ajouter le contexte pour les images souvenirs
        if (context.promptingProgress) {
          systemPrompt += '\n\nSi l\'enfant veut créer une image souvenir, utilise cette méthode :\n'
          systemPrompt += generateImagePedagogyContext(context.promptingProgress, context.locale)
        }
        break
        
      default:
        systemPrompt = LUNA_BASE_PROMPT
    }

    // Ajouter le contexte émotionnel
    if (context.emotionalContext && context.emotionalContext.length > 0) {
      systemPrompt += `\n\nCONTEXTE ÉMOTIONNEL RÉCENT: ${context.emotionalContext.join(', ')}`
    }

    // Construire l'historique de chat
    const history = chatHistory.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    // Créer la session de chat
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "D'accord !" }] },
        ...history,
      ],
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.85,
        topP: 0.9,
      },
    })

    // Générer la réponse
    const result = await chat.sendMessage(userMessage)
    const response = result.response
    const text = response.text()

    return {
      text,
      tokensUsed: response.usageMetadata?.totalTokenCount,
    }
  } catch (error) {
    console.error('Erreur Gemini:', error)
    
    const errorMessages = {
      fr: "Oups, j'ai eu un petit problème ! Tu peux réessayer ?",
      en: "Oops, I had a little problem! Can you try again?",
      ru: "Ой, у меня небольшая проблема! Попробуешь ещё раз?",
    }
    
    return {
      text: errorMessages[context.locale] || errorMessages.fr,
    }
  }
}

/**
 * Génère un prompt d'image optimisé à partir de la description de l'enfant
 */
export async function generateImagePrompt(
  description: string,
  style?: string,
  mood?: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      safetySettings,
    })

    const prompt = `Transforme cette description d'enfant en prompt Midjourney optimisé.

DESCRIPTION: "${description}"
${style ? `STYLE: ${style}` : ''}
${mood ? `AMBIANCE: ${mood}` : ''}

RÈGLES:
- Garde l'essence de ce que l'enfant imagine
- Optimise pour Midjourney (mots-clés techniques)
- Contenu adapté aux enfants (jamais effrayant)
- Maximum 150 caractères
- Anglais uniquement

Réponds UNIQUEMENT avec le prompt optimisé.`

    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch (error) {
    console.error('Erreur génération prompt:', error)
    // Fallback basique
    const basePrompt = description.toLowerCase()
    const styleStr = style ? `, ${style} style` : ', illustration'
    const moodStr = mood ? `, ${mood}` : ''
    return `${basePrompt}${styleStr}${moodStr}, child-friendly, beautiful, detailed`
  }
}

/**
 * Analyse le contenu du journal pour proposer une image souvenir
 */
export async function analyzeForMemoryImage(
  diaryContent: string,
  mood?: string
): Promise<{ shouldGenerate: boolean; prompt: string; reason: string }> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      safetySettings,
    })

    const prompt = `Analyse cette entrée de journal d'enfant et détermine si une "image souvenir" serait appropriée.

CONTENU: "${diaryContent}"
${mood ? `HUMEUR: ${mood}` : ''}

Réponds en JSON:
{
  "shouldGenerate": true/false,
  "prompt": "prompt court si oui",
  "reason": "explication courte pour l'enfant (en français)"
}

L'image doit capturer le moment ou l'émotion, de manière douce et poétique.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    return {
      shouldGenerate: false,
      prompt: '',
      reason: "Je n'ai pas trouvé de moment spécial pour une image.",
    }
  } catch (error) {
    console.error('Erreur analyse journal:', error)
    return {
      shouldGenerate: false,
      prompt: '',
      reason: "Oups, j'ai eu un petit souci !",
    }
  }
}

// Export legacy pour compatibilité
export { generateLunaResponse as default }
