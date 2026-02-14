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
  locale?: string
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

function getScoringRules(locale: string, difficulty: number): string {
  const rules: Record<string, Record<number, string>> = {
    fr: {
      1: `BARÈME NIVEAU 1 (Découverte) :
- Sujet principal correct = 40 pts
- Couleurs ou position mentionnées = +20 pts
- Style artistique mentionné = +20 pts
- Prompt détaillé et complet = jusqu'à 100 pts`,
      2: `BARÈME NIVEAU 2 (Facile) :
- Sujet principal correct = 30 pts
- Détails du personnage/objet = +20 pts
- Style ou couleurs mentionnés = +20 pts
- Bonne composition décrite = +30 pts`,
      3: `BARÈME NIVEAU 3 (Intermédiaire) :
- Sujet seul = 25 pts maximum
- Composition + style mentionnés = peut atteindre 50+ pts
- Atmosphère + détails = peut atteindre 80+ pts`,
      4: `BARÈME NIVEAU 4 (Avancé) :
- Sujet seul = 20 pts maximum
- Atmosphère/ambiance obligatoire pour dépasser 50 pts
- Prompt complet (sujet + style + ambiance + détails) pour 75+ pts`,
      5: `BARÈME NIVEAU 5 (Expert) :
- Sujet seul = 15 pts maximum
- Il faut sujet + style + couleurs + composition + atmosphère + éclairage pour dépasser 60 pts
- Seul un prompt très complet et précis peut atteindre 80+ pts`,
    },
    en: {
      1: `SCORING LEVEL 1 (Discovery):
- Correct main subject = 40 pts
- Colors or position mentioned = +20 pts
- Art style mentioned = +20 pts
- Detailed and complete prompt = up to 100 pts`,
      2: `SCORING LEVEL 2 (Easy):
- Correct main subject = 30 pts
- Character/object details = +20 pts
- Style or colors mentioned = +20 pts
- Good composition described = +30 pts`,
      3: `SCORING LEVEL 3 (Intermediate):
- Subject alone = 25 pts max
- Composition + style mentioned = can reach 50+ pts
- Atmosphere + details = can reach 80+ pts`,
      4: `SCORING LEVEL 4 (Advanced):
- Subject alone = 20 pts max
- Atmosphere/mood required to exceed 50 pts
- Complete prompt (subject + style + mood + details) for 75+ pts`,
      5: `SCORING LEVEL 5 (Expert):
- Subject alone = 15 pts max
- Need subject + style + colors + composition + atmosphere + lighting to exceed 60 pts
- Only a very complete and precise prompt can reach 80+ pts`,
    },
    ru: {
      1: `ШКАЛА УРОВЕНЬ 1 (Знакомство):
- Правильный основной предмет = 40 баллов
- Упомянуты цвета или расположение = +20 баллов
- Упомянут художественный стиль = +20 баллов
- Подробный и полный промпт = до 100 баллов`,
      2: `ШКАЛА УРОВЕНЬ 2 (Лёгкий):
- Правильный основной предмет = 30 баллов
- Детали персонажа/объекта = +20 баллов
- Упомянут стиль или цвета = +20 баллов
- Хорошая композиция описана = +30 баллов`,
      3: `ШКАЛА УРОВЕНЬ 3 (Средний):
- Только предмет = максимум 25 баллов
- Композиция + стиль = может достичь 50+ баллов
- Атмосфера + детали = может достичь 80+ баллов`,
      4: `ШКАЛА УРОВЕНЬ 4 (Продвинутый):
- Только предмет = максимум 20 баллов
- Атмосфера/настроение обязательны для 50+ баллов
- Полный промпт (предмет + стиль + настроение + детали) для 75+ баллов`,
      5: `ШКАЛА УРОВЕНЬ 5 (Эксперт):
- Только предмет = максимум 15 баллов
- Нужны предмет + стиль + цвета + композиция + атмосфера + освещение для 60+ баллов
- Только очень полный и точный промпт может достичь 80+ баллов`,
    },
  }

  return (rules[locale] || rules.fr)[difficulty] || (rules[locale] || rules.fr)[1]
}

function getPromptLengthRules(locale: string, difficulty: number, userPrompt: string): string {
  const wordCount = userPrompt.trim().split(/\s+/).length

  const rules: Record<string, string> = {
    fr: `RÈGLES DE LONGUEUR DU PROMPT :
- Prompt de moins de 5 mots : score maximum 25 pts (quel que soit le niveau)
${difficulty >= 2 ? '- Prompt de moins de 10 mots : score maximum 50 pts' : ''}
Le prompt de l'enfant fait ${wordCount} mots.`,
    en: `PROMPT LENGTH RULES:
- Prompt under 5 words: max score 25 pts (any level)
${difficulty >= 2 ? '- Prompt under 10 words: max score 50 pts' : ''}
The child's prompt has ${wordCount} words.`,
    ru: `ПРАВИЛА ДЛИНЫ ПРОМПТА:
- Промпт менее 5 слов: максимум 25 баллов (любой уровень)
${difficulty >= 2 ? '- Промпт менее 10 слов: максимум 50 баллов' : ''}
Промпт ребёнка содержит ${wordCount} слов.`,
  }

  return rules[locale] || rules.fr
}

function getAnalysisPrompt(locale: string, difficulty: number, userPrompt: string, originalPrompt: string, originalPromptFr: string): string {
  const scoringRules = getScoringRules(locale, difficulty)
  const lengthRules = getPromptLengthRules(locale, difficulty, userPrompt)

  if (locale === 'en') {
    return `You are a kind teacher helping a child aged 6-10 learn the art of "prompting" (giving instructions to an AI to create images).

The child is participating in a challenge of level ${difficulty}/5.

**IMAGE 1 (LEFT)**: The TARGET image the child must reproduce.
**IMAGE 2 (RIGHT)**: The image the child generated with their prompt.

**Child's prompt**: "${userPrompt}"
**Original prompt used for target**: "${originalPrompt}"
**French description**: "${originalPromptFr}"

ANALYZE both images and respond in JSON with this EXACT structure:
{
  "score": <number between 0 and 100>,
  "feedback": "<2-3 encouraging and constructive sentences, adapted for a child>",
  "strengths": ["<what the child did well>", "<another positive point>"],
  "improvements": ["<simple improvement suggestion>"],
  "promptTips": ["<concrete tip to improve the prompt>"]
}

${scoringRules}

${lengthRules}

RULES:
- ALWAYS be encouraging and positive, even if the images are very different
- Use simple language suitable for children
- The score must STRICTLY follow the scoring rules above — do NOT give points for just guessing the subject at higher levels
- Give CONCRETE and ACTIONABLE tips to help the child write a better prompt
- Maximum 2-3 items per list
- No emoji in texts

Respond ONLY with the JSON, without markdown or explanation.`
  }

  if (locale === 'ru') {
    return `Ты добрый учитель, помогающий ребёнку 6-10 лет освоить искусство "промптинга" (давать инструкции ИИ для создания изображений).

Ребёнок участвует в челлендже уровня ${difficulty}/5.

**ИЗОБРАЖЕНИЕ 1 (СЛЕВА)**: ЦЕЛЕВОЕ изображение, которое ребёнок должен воспроизвести.
**ИЗОБРАЖЕНИЕ 2 (СПРАВА)**: Изображение, которое ребёнок сгенерировал с помощью своего промпта.

**Промпт ребёнка**: "${userPrompt}"
**Оригинальный промпт для цели**: "${originalPrompt}"
**Французское описание**: "${originalPromptFr}"

ПРОАНАЛИЗИРУЙ оба изображения и ответь в JSON с ТОЧНОЙ структурой:
{
  "score": <число от 0 до 100>,
  "feedback": "<2-3 ободряющих и конструктивных предложения, адаптированных для ребёнка>",
  "strengths": ["<что ребёнок сделал хорошо>", "<ещё один положительный момент>"],
  "improvements": ["<простое предложение по улучшению>"],
  "promptTips": ["<конкретный совет по улучшению промпта>"]
}

${scoringRules}

${lengthRules}

ПРАВИЛА:
- ВСЕГДА будь ободряющим и позитивным, даже если изображения очень разные
- Используй простой язык, подходящий для детей
- Оценка должна СТРОГО следовать шкале выше — НЕ давай баллы просто за угаданный предмет на высоких уровнях
- Давай КОНКРЕТНЫЕ и ВЫПОЛНИМЫЕ советы для улучшения промпта
- Максимум 2-3 элемента в списке
- Без эмодзи в текстах

Ответь ТОЛЬКО JSON, без markdown или объяснений.`
  }

  // Default: French
  return `Tu es un professeur bienveillant qui aide un enfant de 6-10 ans à apprendre l'art du "prompting" (donner des instructions à une IA pour créer des images).

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

${scoringRules}

${lengthRules}

RÈGLES :
- Sois TOUJOURS encourageant et positif, même si les images sont très différentes
- Utilise un langage simple adapté aux enfants
- Le score doit STRICTEMENT suivre le barème ci-dessus — NE DONNE PAS de points juste pour avoir deviné le sujet aux niveaux élevés
- Donne des conseils CONCRETS et ACTIONNABLES pour aider l'enfant à écrire un meilleur prompt
- Maximum 2-3 éléments par liste
- Pas d'emoji dans les textes

Réponds UNIQUEMENT avec le JSON, sans markdown ni explication.`
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json()
    const { targetImageUrl, resultImageUrl, userPrompt, originalPrompt, originalPromptFr, difficulty, locale = 'fr' } = body

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

    const prompt = getAnalysisPrompt(locale, difficulty, userPrompt, originalPrompt, originalPromptFr)

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

    // Extract locale from the request body for fallback
    let locale = 'fr'
    try {
      const body = await request.clone().json()
      if (body.locale) locale = body.locale
    } catch { /* ignore parsing error */ }

    const fallbacks: Record<string, { feedback: string; strengths: string[]; improvements: string[]; promptTips: string[] }> = {
      en: {
        feedback: 'Great try! Keep experimenting with different words to see what the AI understands.',
        strengths: ['You made an attempt'],
        improvements: ['Try adding more details'],
        promptTips: ['Describe the colors and shapes you see'],
      },
      ru: {
        feedback: 'Отличная попытка! Продолжай экспериментировать с разными словами.',
        strengths: ['Ты сделал попытку'],
        improvements: ['Попробуй добавить больше деталей'],
        promptTips: ['Опиши цвета и формы, которые видишь'],
      },
      fr: {
        feedback: 'Bravo pour ton essai ! Continue à expérimenter avec différents mots pour voir ce que l\'IA comprend.',
        strengths: ['Tu as fait un essai'],
        improvements: ['Essaie d\'ajouter plus de détails'],
        promptTips: ['Décris les couleurs et les formes que tu vois'],
      },
    }
    const fb = fallbacks[locale] || fallbacks.fr

    return NextResponse.json(
      {
        error: 'Erreur lors de l\'analyse',
        // Fallback en cas d'erreur
        score: 50,
        ...fb,
      },
      { status: 200 } // On retourne 200 avec un fallback pour ne pas bloquer l'UX
    )
  }
}
