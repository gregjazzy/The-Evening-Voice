/**
 * API Route - Voice Design ElevenLabs
 * Crée une voix personnalisée à partir d'une description textuelle
 * 
 * Utilise l'API ElevenLabs directement (Voice Design / Voice Generation Preview)
 */

import { NextRequest, NextResponse } from 'next/server'

// Paramètres de Voice Design
export interface VoiceDesignParams {
  description: string          // Description de la voix (ex: "Une voix douce de petite fille")
  text: string                 // Texte à prononcer pour le preview
  gender?: 'female' | 'male'   // Genre de la voix
  age?: 'young' | 'middle_aged' | 'old'  // Âge approximatif
  accent?: string              // Accent (ex: "french", "british", "american")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      description,
      text,
      gender = 'female',
      age = 'young',
      accent = 'french'
    }: VoiceDesignParams = body

    if (!description || description.length < 10) {
      return NextResponse.json(
        { error: 'Description requise (minimum 10 caractères)' },
        { status: 400 }
      )
    }

    if (!text) {
      return NextResponse.json(
        { error: 'Texte requis pour générer le preview' },
        { status: 400 }
      )
    }

    // Vérifier la clé API ElevenLabs (via fal.ai ou directe)
    const falApiKey = process.env.FAL_API_KEY
    
    if (!falApiKey) {
      return NextResponse.json(
        { error: 'Configuration API manquante' },
        { status: 500 }
      )
    }

    console.log('🎨 Voice Design:', {
      description: description.slice(0, 50) + '...',
      gender,
      age,
      accent,
      textLength: text.length,
    })

    // Construire le prompt de description pour ElevenLabs
    // Format recommandé : description naturelle en anglais
    const voiceDescription = buildVoiceDescription(description, gender, age, accent)
    
    try {
      // Utiliser fal.ai pour générer avec une voix existante qui correspond à la description
      // Note: fal.ai ne supporte pas encore Voice Design, on utilise une voix proche
      const { fal } = await import('@fal-ai/client')
      
      fal.config({
        credentials: falApiKey,
      })

      // Mapper la description à une voix ElevenLabs existante
      const voiceId = mapDescriptionToVoice(description, gender, age, accent)
      
      const result = await fal.subscribe('fal-ai/elevenlabs/tts', {
        input: {
          text,
          voice_id: voiceId,
          model_id: 'eleven_multilingual_v2',
        },
        logs: true,
      })

      // Estimer la durée
      const wordCount = text.split(/\s+/).length
      const estimatedDuration = (wordCount / 150) * 60

      return NextResponse.json({
        success: true,
        audioUrl: result.data.audio.url,
        duration: estimatedDuration,
        voiceId: voiceId,
        voiceDescription,
        // Note: comme fal.ai ne supporte pas Voice Design,
        // on retourne la voix mappée comme "custom" temporaire
        isApproximation: true,
        message: 'Voix générée à partir d\'une voix similaire (Voice Design complet bientôt disponible)',
      })

    } catch (falError) {
      console.error('Erreur fal.ai:', falError)
      
      // Fallback: retourner une erreur explicative
      return NextResponse.json({
        success: false,
        error: 'Voice Design non disponible actuellement',
        suggestion: 'Utilisez une des voix de personnages prédéfinis',
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Erreur API Voice Design:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la voix' },
      { status: 500 }
    )
  }
}

/**
 * Construit une description de voix en anglais pour ElevenLabs
 */
function buildVoiceDescription(
  userDescription: string,
  gender: string,
  age: string,
  accent: string
): string {
  const ageMap: Record<string, string> = {
    young: 'young',
    middle_aged: 'middle-aged',
    old: 'elderly',
  }
  
  const accentMap: Record<string, string> = {
    french: 'French',
    british: 'British',
    american: 'American',
    russian: 'Russian',
  }

  return `A ${ageMap[age] || 'young'} ${gender} voice with a ${accentMap[accent] || 'neutral'} accent. ${userDescription}`
}

/**
 * Mappe une description à une voix ElevenLabs existante
 * En attendant le support complet de Voice Design
 */
function mapDescriptionToVoice(
  description: string,
  gender: string,
  age: string,
  accent: string
): string {
  const desc = description.toLowerCase()
  
  // Voix françaises
  if (accent === 'french') {
    if (gender === 'female') {
      if (age === 'young' || desc.includes('enfant') || desc.includes('fille') || desc.includes('jeune')) {
        return 'FvmvwvObRqIHojkEGh5N' // Jeune française
      }
      if (age === 'old' || desc.includes('grand-mère') || desc.includes('vieille') || desc.includes('mamie')) {
        return 'M9RTtrzRACmbUzsEMq8p' // Mamie
      }
      // Défaut femme française
      return 'kwhMCf63M8O3rCfnQ3oQ' // La Conteuse
    } else {
      if (age === 'young' || desc.includes('garçon') || desc.includes('jeune homme')) {
        return '5Qfm4RqcAer0xoyWtoHC' // Jeune garçon
      }
      // Défaut homme français
      return '1wg2wOjdEWKA7yQD8Kca' // Homme français âgé
    }
  }
  
  // Voix anglaises
  if (accent === 'british' || accent === 'american') {
    if (gender === 'female') {
      if (age === 'young') {
        return 'rCmVtv8cYU60uhlsOo1M' // Young British girl
      }
      if (age === 'old') {
        return 'kkPJzQOWz2Oz9cUaEaQd' // Old British woman
      }
      return 'RILOU7YmBhvwJGDGjNmP' // British narrator
    } else {
      if (desc.includes('villain') || desc.includes('méchant') || desc.includes('sombre')) {
        return 'ttNi9wVM8M97tsxE7PFZ' // British villain
      }
      if (age === 'old' || desc.includes('grand-père') || desc.includes('vieux')) {
        return '0lp4RIz96WD1RUtvEu3Q' // English grandpa
      }
      return 'G17SuINrv2H9FC6nvetn' // British narrator male
    }
  }
  
  // Voix russes
  if (accent === 'russian') {
    if (gender === 'female') {
      return 'EDpEYNf6XIeKYRzYcx4I' // Young Russian woman
    } else {
      if (desc.includes('mystérieux') || desc.includes('sorcier') || desc.includes('magicien')) {
        return 'wAGzRVkxKEs8La0lmdrE' // Mysterious Russian man
      }
      return 're2r5d74PqDzicySNW0I' // Russian narrator male
    }
  }
  
  // Personnages spéciaux basés sur la description
  if (desc.includes('dragon') || desc.includes('monstre') || desc.includes('grave')) {
    return '1wg2wOjdEWKA7yQD8Kca' // Voix grave
  }
  if (desc.includes('fée') || desc.includes('magique') || desc.includes('légère')) {
    return 'FvmvwvObRqIHojkEGh5N' // Voix légère
  }
  if (desc.includes('robot') || desc.includes('mécanique')) {
    return 'kwhMCf63M8O3rCfnQ3oQ' // À traiter avec effets
  }
  if (desc.includes('sorcière') || desc.includes('mystérieuse')) {
    return 'M9RTtrzRACmbUzsEMq8p' // Voix mystérieuse
  }
  
  // Défaut basé sur le genre
  return gender === 'female' ? 'kwhMCf63M8O3rCfnQ3oQ' : '1wg2wOjdEWKA7yQD8Kca'
}
