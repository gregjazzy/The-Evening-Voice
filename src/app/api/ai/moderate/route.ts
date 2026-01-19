import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { getApiConfig } from '@/lib/config/server-config'

// Cache simple pour éviter de rappeler l'API pour le même texte
const moderationCache = new Map<string, { appropriate: boolean; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Texte requis' },
        { status: 400 }
      )
    }

    // Vérifier le cache
    const cacheKey = text.toLowerCase().trim()
    const cached = moderationCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ appropriate: cached.appropriate })
    }

    // Récupérer la clé API
    const config = await getApiConfig()
    const apiKey = config.geminiApiKey
    
    if (!apiKey) {
      console.error('❌ Clé API Gemini non configurée pour la modération')
      // En cas d'erreur, on laisse passer (fail-open pour ne pas bloquer l'enfant)
      return NextResponse.json({ appropriate: true })
    }

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
    
Un enfant a écrit ce texte pour créer une image ou une vidéo : "${text}"

Ce texte est-il approprié pour un enfant ? Réponds UNIQUEMENT par "OUI" ou "NON".

Critères pour répondre "NON" :
- Gros mots ou insultes (même déguisés avec des * ou chiffres)
- Violence graphique ou armes
- Contenu sexuel ou nudité
- Drogue, alcool, tabac
- Discrimination ou haine
- Contenu effrayant ou cauchemardesque pour un jeune enfant
- Thèmes adultes inappropriés

Si c'est juste une description innocente (animaux, nature, personnages, objets, lieux, magie...), réponds "OUI".`

    const result = await model.generateContent(prompt)
    const response = result.response.text().trim().toUpperCase()
    
    const appropriate = response.includes('OUI')
    
    // Mettre en cache
    moderationCache.set(cacheKey, { appropriate, timestamp: Date.now() })
    
    // Nettoyer le cache périodiquement
    if (moderationCache.size > 1000) {
      const now = Date.now()
      for (const [key, value] of moderationCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          moderationCache.delete(key)
        }
      }
    }

    console.log(`🛡️ Modération: "${text.substring(0, 50)}..." → ${appropriate ? '✅' : '❌'}`)
    
    return NextResponse.json({ appropriate })
    
  } catch (error) {
    console.error('Erreur modération:', error)
    // Fail-open: en cas d'erreur, on laisse passer
    return NextResponse.json({ appropriate: true })
  }
}
