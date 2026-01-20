/**
 * API Route - Analyse des résultats du mode Défis
 * Compare l'image cible avec l'image générée par l'enfant
 * Donne un score et un feedback pédagogique
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getApiKeyForRequest } from '@/lib/config/server-config'

interface AnalysisRequest {
  targetImageUrl: string
  resultImageUrl: string
  userPrompt: string
  originalPrompt: string
  originalPromptFr: string
  difficulty: number
}

interface AnalysisResponse {
  score: number // 0-100
  feedback: string
  strengths: string[]
  improvements: string[]
  promptTips: string[]
}

// Convertir une URL d'image en base64
async function imageUrlToBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  const contentType = response.headers.get('content-type') || 'image/png'
  return { data: base64, mimeType: contentType }
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json()
    const { targetImageUrl, resultImageUrl, userPrompt, originalPrompt, originalPromptFr, difficulty } = body

    if (!targetImageUrl || !resultImageUrl || !userPrompt) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const apiKey = await getApiKeyForRequest('gemini')
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API Gemini manquante' }, { status: 500 })
    }

    // Charger les deux images
    const [targetImage, resultImage] = await Promise.all([
      imageUrlToBase64(targetImageUrl),
      imageUrlToBase64(resultImageUrl),
    ])

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `Tu es un professeur bienveillant qui aide un enfant de 6-10 ans à apprendre l'art du "prompting" (donner des instructions à une IA pour créer des images).

L'enfant participe à un défi de niveau ${difficulty}/5.

**IMAGE 1 (À GAUCHE)** : L'image CIBLE que l'enfant doit reproduire.
**IMAGE 2 (À DROITE)** : L'image que l'enfant a générée avec son prompt.

**Prompt de l'enfant** : "${userPrompt}"
**Prompt original utilisé pour la cible** : "${originalPrompt}"
**Description française** : "${originalPromptFr}"

ANALYSE les deux images et réponds en JSON avec cette structure EXACTE :
{
  "score": <nombre entre 0 et 100>,
  "feedback": "<2-3 phrases encourageantes et constructives, adaptées à un enfant>",
  "strengths": ["<ce que l'enfant a bien fait>", "<autre point positif>"],
  "improvements": ["<suggestion d'amélioration simple>"],
  "promptTips": ["<conseil concret pour améliorer le prompt>"]
}

RÈGLES :
- Sois TOUJOURS encourageant et positif, même si les images sont très différentes
- Utilise un langage simple adapté aux enfants
- Le score doit refléter la similarité visuelle (couleurs, sujet, composition)
- Si le sujet principal est correct, donne au moins 50 points
- Donne des conseils CONCRETS et ACTIONNABLES
- Maximum 2-3 éléments par liste
- Pas d'emoji dans les textes

Réponds UNIQUEMENT avec le JSON, sans markdown ni explication.`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: targetImage.mimeType,
          data: targetImage.data,
        },
      },
      {
        inlineData: {
          mimeType: resultImage.mimeType,
          data: resultImage.data,
        },
      },
    ])

    const responseText = result.response.text().trim()
    
    // Parser le JSON (enlever les backticks markdown si présents)
    let jsonStr = responseText
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '')
    }
    
    const analysis: AnalysisResponse = JSON.parse(jsonStr)

    // Valider et normaliser le score
    analysis.score = Math.max(0, Math.min(100, Math.round(analysis.score)))

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Erreur analyse défi:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'analyse',
        // Fallback en cas d'erreur
        score: 50,
        feedback: 'Bravo pour ton essai ! Continue à expérimenter avec différents mots pour voir ce que l\'IA comprend.',
        strengths: ['Tu as fait un essai'],
        improvements: ['Essaie d\'ajouter plus de détails'],
        promptTips: ['Décris les couleurs et les formes que tu vois'],
      }, 
      { status: 200 } // On retourne 200 avec un fallback pour ne pas bloquer l'UX
    )
  }
}
