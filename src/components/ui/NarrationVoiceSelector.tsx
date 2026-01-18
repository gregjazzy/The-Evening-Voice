'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, Check, Play, Pause, Sparkles, Star } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { 
  getVoicesForLocale, 
  type ElevenLabsVoice,
  FRENCH_VOICES,
  ENGLISH_VOICES,
  RUSSIAN_VOICES,
} from '@/lib/ai/elevenlabs'
import { cn } from '@/lib/utils'

interface NarrationVoiceSelectorProps {
  locale?: 'fr' | 'en' | 'ru'
  className?: string
  onVoiceChange?: (voiceId: string) => void
}

// ============================================
// EXTRAITS AUDIO PRÉ-ENREGISTRÉS
// Stockés dans /public/sound/voices/
// ============================================

const VOICE_SAMPLES: Record<string, Record<string, string>> = {
  // 🇫🇷 Français (5 voix)
  fr: {
    narratrice: '/sound/voices/fr/narratrice.mp3',
    jeuneFille: '/sound/voices/fr/jeune_fille.mp3',
    mamie: '/sound/voices/fr/mamie.mp3',
    jeuneGarcon: '/sound/voices/fr/jeune_garcon.mp3',
    papy: '/sound/voices/fr/papy.mp3',
  },
  // 🇬🇧 Anglais (6 voix)
  en: {
    narrator: '/sound/voices/en/narrator.mp3',
    youngGirl: '/sound/voices/en/young_girl.mp3',
    grandma: '/sound/voices/en/grandma.mp3',
    narratorMale: '/sound/voices/en/narrator_male.mp3',
    villain: '/sound/voices/en/villain.mp3',
    grandpa: '/sound/voices/en/grandpa.mp3',
  },
  // 🇷🇺 Russe (4 voix)
  ru: {
    narrator: '/sound/voices/ru/narrator.mp3',
    youngGirl: '/sound/voices/ru/young_girl.mp3',
    narratorMale: '/sound/voices/ru/narrator_male.mp3',
    mysterious: '/sound/voices/ru/mysterious.mp3',
  },
}

// Texte de démo par langue (ce qui est dit dans les samples)
const SAMPLE_TEXT: Record<string, string> = {
  fr: "Il était une fois, dans un royaume lointain, une princesse qui rêvait d'aventures magiques...",
  en: "Once upon a time, in a faraway kingdom, there lived a princess who dreamed of magical adventures...",
  ru: "Давным-давно, в далёком королевстве, жила-была принцесса, которая мечтала о волшебных приключениях...",
}

// Mapping des clés de voix par locale
const VOICE_KEYS: Record<string, Record<string, string>> = {
  fr: Object.fromEntries(Object.entries(FRENCH_VOICES).map(([key, voice]) => [voice.id, key])),
  en: Object.fromEntries(Object.entries(ENGLISH_VOICES).map(([key, voice]) => [voice.id, key])),
  ru: Object.fromEntries(Object.entries(RUSSIAN_VOICES).map(([key, voice]) => [voice.id, key])),
}

export function NarrationVoiceSelector({ 
  locale = 'fr', 
  className,
  onVoiceChange,
}: NarrationVoiceSelectorProps) {
  const { narrationVoiceId, setNarrationVoiceId } = useAppStore()
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const voices = getVoicesForLocale(locale)

  // Trouver la voix actuelle
  const currentVoice = voices.find(v => v.id === narrationVoiceId) || voices[0]

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Obtenir l'URL du sample pour une voix
  const getSampleUrl = (voice: ElevenLabsVoice): string | null => {
    const voiceKeys = VOICE_KEYS[locale] || VOICE_KEYS.fr
    const key = voiceKeys[voice.id]
    if (!key) return null
    
    const samples = VOICE_SAMPLES[locale] || VOICE_SAMPLES.fr
    return samples[key] || null
  }

  // Jouer/arrêter l'extrait
  const handlePlaySample = async (voice: ElevenLabsVoice) => {
    // Si c'est la même voix, toggle pause/play
    if (playingVoiceId === voice.id) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setPlayingVoiceId(null)
      return
    }

    // Arrêter l'audio en cours
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    const sampleUrl = getSampleUrl(voice)
    if (!sampleUrl) {
      console.warn('Pas de sample disponible pour cette voix')
      return
    }

    setLoadingVoiceId(voice.id)

    try {
      const audio = new Audio(sampleUrl)
      audioRef.current = audio

      audio.oncanplaythrough = () => {
        setLoadingVoiceId(null)
        setPlayingVoiceId(voice.id)
        audio.play().catch(console.error)
      }

      audio.onended = () => {
        setPlayingVoiceId(null)
        audioRef.current = null
      }

      audio.onerror = () => {
        console.error('Erreur lecture sample:', sampleUrl)
        setLoadingVoiceId(null)
        setPlayingVoiceId(null)
      }

      audio.load()
    } catch (error) {
      console.error('Erreur création audio:', error)
      setLoadingVoiceId(null)
    }
  }

  // Sélectionner une voix
  const handleSelectVoice = (voice: ElevenLabsVoice) => {
    setNarrationVoiceId(voice.id)
    onVoiceChange?.(voice.id)
  }

  // Grouper les voix par genre
  const femaleVoices = voices.filter(v => v.gender === 'female')
  const maleVoices = voices.filter(v => v.gender === 'male')

  return (
    <div className={cn('glass rounded-2xl p-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dream-500 to-aurora-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Voix de narration</h3>
          <p className="text-xs text-midnight-400">
            {currentVoice ? `${currentVoice.emoji} ${currentVoice.name}` : 'Choisir une voix'}
          </p>
        </div>
      </div>

      {/* Info sample */}
      <div className="bg-midnight-800/50 rounded-lg p-3 mb-4">
        <p className="text-xs text-midnight-400 italic">
          "{SAMPLE_TEXT[locale]}"
        </p>
        <p className="text-[10px] text-midnight-500 mt-1">
          🔊 Clique sur ▶️ pour écouter la voix
        </p>
      </div>

      {/* Voix féminines */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-aurora-300 mb-2 flex items-center gap-1">
          <span>👩</span> Voix féminines
        </h4>
        <div className="space-y-2">
          {femaleVoices.map((voice) => (
            <VoiceItem
              key={voice.id}
              voice={voice}
              isSelected={narrationVoiceId === voice.id}
              isPlaying={playingVoiceId === voice.id}
              isLoading={loadingVoiceId === voice.id}
              onSelect={() => handleSelectVoice(voice)}
              onPlay={() => handlePlaySample(voice)}
              hasSample={!!getSampleUrl(voice)}
            />
          ))}
        </div>
      </div>

      {/* Voix masculines */}
      <div>
        <h4 className="text-xs font-medium text-aurora-300 mb-2 flex items-center gap-1">
          <span>👨</span> Voix masculines
        </h4>
        <div className="space-y-2">
          {maleVoices.map((voice) => (
            <VoiceItem
              key={voice.id}
              voice={voice}
              isSelected={narrationVoiceId === voice.id}
              isPlaying={playingVoiceId === voice.id}
              isLoading={loadingVoiceId === voice.id}
              onSelect={() => handleSelectVoice(voice)}
              onPlay={() => handlePlaySample(voice)}
              hasSample={!!getSampleUrl(voice)}
            />
          ))}
        </div>
      </div>

      {/* Note */}
      <p className="text-[10px] text-midnight-500 mt-4 text-center">
        ✨ Voix premium ElevenLabs pour la lecture de tes histoires
      </p>
    </div>
  )
}

// Composant pour une voix individuelle
interface VoiceItemProps {
  voice: ElevenLabsVoice
  isSelected: boolean
  isPlaying: boolean
  isLoading: boolean
  onSelect: () => void
  onPlay: () => void
  hasSample: boolean
}

function VoiceItem({ 
  voice, 
  isSelected, 
  isPlaying, 
  isLoading,
  onSelect, 
  onPlay,
  hasSample,
}: VoiceItemProps) {
  const styleColors: Record<string, string> = {
    warm: 'text-orange-400',
    dramatic: 'text-purple-400',
    gentle: 'text-blue-400',
    playful: 'text-pink-400',
    mysterious: 'text-indigo-400',
  }

  return (
    <motion.div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all',
        isSelected
          ? 'bg-aurora-500/20 border border-aurora-500/30'
          : 'bg-midnight-800/50 hover:bg-midnight-700/50 border border-transparent'
      )}
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Indicateur de sélection */}
      <div className={cn(
        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
        isSelected
          ? 'border-aurora-500 bg-aurora-500'
          : 'border-midnight-600'
      )}>
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </div>

      {/* Emoji */}
      <span className="text-2xl">{voice.emoji}</span>

      {/* Info voix */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">
            {voice.name}
          </span>
          {voice.style && (
            <span className={cn('text-[10px]', styleColors[voice.style] || 'text-midnight-400')}>
              {voice.style === 'warm' && '🔥 Chaleureux'}
              {voice.style === 'dramatic' && '🎭 Dramatique'}
              {voice.style === 'gentle' && '💫 Doux'}
              {voice.style === 'playful' && '🎈 Enjoué'}
              {voice.style === 'mysterious' && '🌙 Mystérieux'}
            </span>
          )}
        </div>
        <p className="text-[11px] text-midnight-400 truncate">
          {voice.description}
        </p>
      </div>

      {/* Bouton lecture */}
      {hasSample && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPlay()
          }}
          disabled={isLoading}
          className={cn(
            'p-2 rounded-lg transition-all flex-shrink-0',
            isPlaying
              ? 'bg-aurora-500 text-white'
              : 'bg-midnight-700/50 text-midnight-400 hover:text-white hover:bg-midnight-600/50'
          )}
          title="Écouter un extrait"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-aurora-400 border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
      )}
    </motion.div>
  )
}

export default NarrationVoiceSelector
