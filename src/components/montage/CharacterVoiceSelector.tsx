'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Play, 
  Square,
  Check, 
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  getVoicesForLocale, 
  type ElevenLabsVoice,
} from '@/lib/ai/elevenlabs'
import { useMontageStore, type PhraseTiming } from '@/store/useMontageStore'

// =============================================================================
// TYPES
// =============================================================================

interface CharacterVoiceSelectorProps {
  isOpen: boolean
  onClose: () => void
  phrase: PhraseTiming
  locale?: 'fr' | 'en' | 'ru'
}

// Samples audio pré-enregistrés
const VOICE_SAMPLES: Record<string, Record<string, string>> = {
  fr: {
    narratrice: '/sound/voices/fr/narratrice.mp3',
    jeuneFille: '/sound/voices/fr/jeuneFille.mp3',
    mamie: '/sound/voices/fr/mamie.mp3',
    jeuneGarcon: '/sound/voices/fr/jeuneGarcon.mp3',
    papy: '/sound/voices/fr/papy.mp3',
  },
  en: {
    narrator: '/sound/voices/en/narrator.mp3',
    youngGirl: '/sound/voices/en/youngGirl.mp3',
    grandma: '/sound/voices/en/grandma.mp3',
    narratorMale: '/sound/voices/en/narratorMale.mp3',
    villain: '/sound/voices/en/villain.mp3',
    grandpa: '/sound/voices/en/grandpa.mp3',
  },
  ru: {
    narrator: '/sound/voices/ru/narrator.mp3',
    youngGirl: '/sound/voices/ru/youngGirl.mp3',
    narratorMale: '/sound/voices/ru/narratorMale.mp3',
    mysterious: '/sound/voices/ru/mysterious.mp3',
  },
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export function CharacterVoiceSelector({
  isOpen,
  onClose,
  phrase,
  locale = 'fr',
}: CharacterVoiceSelectorProps) {
  const { updatePhraseVoice } = useMontageStore()
  
  // État local
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(
    phrase.voiceId || null
  )
  
  // Obtenir les voix disponibles pour la langue
  const voices = getVoicesForLocale(locale)
  
  // Trouver la clé d'une voix par son ID
  const getVoiceKey = (voice: ElevenLabsVoice): string | null => {
    const voicesObj = locale === 'fr' 
      ? require('@/lib/ai/elevenlabs').FRENCH_VOICES
      : locale === 'en'
      ? require('@/lib/ai/elevenlabs').ENGLISH_VOICES
      : require('@/lib/ai/elevenlabs').RUSSIAN_VOICES
    
    for (const [key, v] of Object.entries(voicesObj)) {
      if ((v as ElevenLabsVoice).id === voice.id) return key
    }
    return null
  }
  
  // Obtenir l'URL du sample
  const getSampleUrl = (voice: ElevenLabsVoice): string | null => {
    const key = getVoiceKey(voice)
    if (!key) return null
    return VOICE_SAMPLES[locale]?.[key] || null
  }
  
  // Arrêter tout audio en cours
  const stopPreview = useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current.currentTime = 0
    }
    setPreviewingId(null)
  }, [])
  
  // Prévisualiser une voix
  const handlePreview = useCallback(async (voice: ElevenLabsVoice) => {
    stopPreview()
    
    if (previewingId === voice.id) return
    
    setPreviewingId(voice.id)
    
    const sampleUrl = getSampleUrl(voice)
    if (!sampleUrl) {
      setPreviewingId(null)
      return
    }
    
    try {
      const audio = new Audio(sampleUrl)
      previewAudioRef.current = audio
      
      audio.onended = () => {
        setPreviewingId(null)
      }
      
      audio.onerror = () => {
        console.error('Erreur lecture sample')
        setPreviewingId(null)
      }
      
      await audio.play()
    } catch (error) {
      console.error('Erreur preview:', error)
      setPreviewingId(null)
    }
  }, [previewingId, stopPreview])
  
  // Sélectionner et appliquer une voix
  const handleSelectVoice = useCallback(async (voice: ElevenLabsVoice) => {
    setSelectedVoiceId(voice.id)
    setIsGenerating(true)
    
    try {
      // Générer l'audio avec la nouvelle voix
      const response = await fetch('/api/ai/voice/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: phrase.text,
          voiceId: voice.id,
          locale,
        }),
      })
      
      if (!response.ok) throw new Error('Erreur génération')
      
      const data = await response.json()
      
      // Mettre à jour la phrase avec la nouvelle voix
      updatePhraseVoice(phrase.id, {
        voiceId: voice.id,
        characterName: voice.name,
        characterEmoji: voice.emoji,
        customAudioUrl: data.audioUrl,
      })
      
      // Fermer le modal
      onClose()
      
    } catch (error) {
      console.error('Erreur sélection voix:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [phrase, locale, updatePhraseVoice, onClose])
  
  // Cleanup on close
  const handleClose = useCallback(() => {
    stopPreview()
    onClose()
  }, [stopPreview, onClose])
  
  if (!isOpen) return null
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md glass rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-midnight-700/50">
            <div>
              <h2 className="text-lg font-semibold text-white">
                🎤 Choisir une voix
              </h2>
              <p className="text-sm text-midnight-400 mt-1">
                Pour : "{phrase.text.slice(0, 40)}..."
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-midnight-700/50 text-midnight-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            <p className="text-xs text-midnight-400 mb-4">
              Choisis une voix pour cette phrase. Tu pourras écouter un extrait avant de confirmer.
            </p>
            
            {/* Liste des voix */}
            <div className="space-y-2">
              {voices.map((voice) => {
                const isSelected = selectedVoiceId === voice.id
                const isPreviewing = previewingId === voice.id
                const hasSample = !!getSampleUrl(voice)
                
                return (
                  <div
                    key={voice.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl transition-all',
                      isSelected
                        ? 'bg-aurora-500/20 border border-aurora-500/30'
                        : 'bg-midnight-800/50 hover:bg-midnight-700/50 border border-transparent'
                    )}
                  >
                    {/* Emoji */}
                    <span className="text-2xl">{voice.emoji}</span>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {voice.name}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-aurora-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-midnight-400 truncate">
                        {voice.description}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Bouton écouter */}
                      {hasSample && (
                        <button
                          onClick={() => handlePreview(voice)}
                          disabled={isGenerating}
                          className={cn(
                            'p-2 rounded-lg transition-all',
                            isPreviewing
                              ? 'bg-aurora-500 text-white'
                              : 'bg-midnight-700/50 text-midnight-400 hover:text-white'
                          )}
                          title="Écouter un extrait"
                        >
                          {isPreviewing ? (
                            <Square className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      
                      {/* Bouton sélectionner */}
                      <button
                        onClick={() => handleSelectVoice(voice)}
                        disabled={isGenerating}
                        className={cn(
                          'px-3 py-2 rounded-lg text-xs font-medium transition-all',
                          isSelected
                            ? 'bg-aurora-500 text-white'
                            : 'bg-midnight-700 text-midnight-300 hover:bg-midnight-600'
                        )}
                      >
                        {isGenerating && selectedVoiceId === voice.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isSelected ? (
                          'Sélectionné'
                        ) : (
                          'Choisir'
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-midnight-700/50">
            <p className="text-[10px] text-midnight-500 text-center">
              ✨ Voix premium ElevenLabs via fal.ai
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default CharacterVoiceSelector
