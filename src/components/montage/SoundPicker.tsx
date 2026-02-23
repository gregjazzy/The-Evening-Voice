'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  MUSIC_SOUNDS,
  AMBIANCE_SOUNDS,
  EFFECT_SOUNDS,
  CATEGORY_LABELS,
  MOOD_LABELS,
  type Sound,
  type SoundType,
  type SoundCategory,
  type SoundMood,
} from '@/lib/sounds'
import { cn } from '@/lib/utils'
import { Play, Pause, Check, X } from 'lucide-react'

interface SoundPickerProps {
  type: 'music' | 'ambiance' | 'effect'
  onSelect: (sound: Sound) => void
  onClose: () => void
}

export function SoundPicker({ type, onSelect, onClose }: SoundPickerProps) {
  const [filter, setFilter] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Source des sons selon le type
  const sounds = type === 'music'
    ? MUSIC_SOUNDS
    : type === 'ambiance'
    ? AMBIANCE_SOUNDS
    : EFFECT_SOUNDS

  // Filtres disponibles
  const filters = type === 'effect'
    ? Object.entries(CATEGORY_LABELS).map(([key, val]) => ({ id: key, label: val.label, emoji: val.emoji }))
    : Object.entries(MOOD_LABELS).map(([key, val]) => ({ id: key, label: val.label, emoji: val.emoji }))

  // Filtrer
  const filtered = filter
    ? sounds.filter(s => type === 'effect' ? s.category === filter : s.mood === filter)
    : sounds

  const handlePlay = (sound: Sound) => {
    if (playingId === sound.id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    const audio = new Audio(sound.file)
    audio.volume = 0.5
    audio.onended = () => { setPlayingId(null); audioRef.current = null }
    audio.play()
    audioRef.current = audio
    setPlayingId(sound.id)
  }

  const handleSelect = (sound: Sound) => {
    audioRef.current?.pause()
    audioRef.current = null
    setPlayingId(null)
    onSelect(sound)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="glass rounded-xl p-3 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-midnight-300">
          {type === 'music' ? '🎵 Musique' : type === 'ambiance' ? '🌿 Ambiance' : '💥 Effet sonore'}
        </h4>
        <button onClick={onClose} className="p-1 rounded-lg text-midnight-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setFilter(null)}
          className={cn(
            'px-2 py-1 rounded-full text-xs transition-colors',
            !filter ? 'bg-aurora-500/30 text-aurora-300' : 'bg-midnight-800/50 text-midnight-400 hover:text-white'
          )}
        >
          Tous
        </button>
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-2 py-1 rounded-full text-xs transition-colors',
              filter === f.id ? 'bg-aurora-500/30 text-aurora-300' : 'bg-midnight-800/50 text-midnight-400 hover:text-white'
            )}
          >
            {f.emoji} {f.label}
          </button>
        ))}
      </div>

      {/* Liste des sons */}
      <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
        {filtered.map(sound => (
          <div
            key={sound.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-midnight-800/30 hover:bg-midnight-700/50 transition-colors group"
          >
            {/* Preview */}
            <button
              onClick={() => handlePlay(sound)}
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors',
                playingId === sound.id ? 'bg-aurora-500 text-white' : 'bg-midnight-700 text-midnight-400 hover:text-white'
              )}
            >
              {playingId === sound.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <span className="text-sm truncate block">{sound.emoji} {sound.name}</span>
            </div>

            {/* Sélectionner */}
            <button
              onClick={() => handleSelect(sound)}
              className="p-1.5 rounded-lg bg-aurora-500/20 text-aurora-300 hover:bg-aurora-500/40 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Check className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
