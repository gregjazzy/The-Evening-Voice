'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLayoutStore, type AudioTrack } from '@/store/useLayoutStore'
import { cn } from '@/lib/utils'
import {
  Music,
  Mic,
  Wind,
  Volume2,
  VolumeX,
  Trash2,
  Play,
  Pause,
  Repeat,
  Upload
} from 'lucide-react'

const audioTypes = [
  { id: 'narration', label: 'Narration', icon: Mic, color: 'aurora' },
  { id: 'music', label: 'Musique', icon: Music, color: 'dream' },
  { id: 'ambient', label: 'Ambiance', icon: Wind, color: 'stardust' },
] as const

export function AudioPanel() {
  const {
    currentPage,
    addAudioTrack,
    updateAudioTrack,
    deleteAudioTrack,
  } = useLayoutStore()

  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})

  if (!currentPage) return null

  const handleFileUpload = async (type: AudioTrack['type'], file: File) => {
    const url = URL.createObjectURL(file)
    addAudioTrack(type, url)
  }

  const togglePlay = (track: AudioTrack) => {
    const audio = audioRefs.current[track.id]
    if (!audio) {
      // Créer l'audio si pas encore fait
      const newAudio = new Audio(track.url)
      newAudio.volume = track.volume
      newAudio.loop = track.loop
      audioRefs.current[track.id] = newAudio
      newAudio.play()
      setPlayingId(track.id)
      return
    }

    if (playingId === track.id) {
      audio.pause()
      setPlayingId(null)
    } else {
      // Arrêter les autres
      Object.values(audioRefs.current).forEach((a) => a.pause())
      audio.play()
      setPlayingId(track.id)
    }
  }

  const handleVolumeChange = (track: AudioTrack, volume: number) => {
    updateAudioTrack(track.id, { volume })
    if (audioRefs.current[track.id]) {
      audioRefs.current[track.id].volume = volume
    }
  }

  return (
    <div className="space-y-4">
      {/* Types d'audio */}
      {audioTypes.map(({ id, label, icon: Icon, color }) => {
        const tracks = currentPage.audioTracks.filter((t) => t.type === id)
        
        return (
          <div key={id} className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  color === 'aurora' && 'bg-aurora-500/30 text-aurora-300',
                  color === 'dream' && 'bg-dream-500/30 text-dream-300',
                  color === 'stardust' && 'bg-stardust-500/30 text-stardust-300',
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">{label}</span>
              </div>
              
              {/* Bouton d'ajout */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(id, file)
                  }}
                />
                <div className={cn(
                  'p-2 rounded-lg transition-colors',
                  color === 'aurora' && 'hover:bg-aurora-500/20',
                  color === 'dream' && 'hover:bg-dream-500/20',
                  color === 'stardust' && 'hover:bg-stardust-500/20',
                )}>
                  <Upload className="w-4 h-4" />
                </div>
              </label>
            </div>

            {/* Liste des pistes */}
            <AnimatePresence>
              {tracks.length > 0 ? (
                <div className="space-y-2">
                  {tracks.map((track) => (
                    <motion.div
                      key={track.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-midnight-800/50"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {/* Play/Pause */}
                      <button
                        onClick={() => togglePlay(track)}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          playingId === track.id 
                            ? 'bg-aurora-500/30 text-aurora-300'
                            : 'bg-midnight-700/50 hover:bg-midnight-600/50'
                        )}
                      >
                        {playingId === track.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>

                      {/* Volume */}
                      <div className="flex-1 flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-midnight-400" />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={track.volume * 100}
                          onChange={(e) => handleVolumeChange(track, parseInt(e.target.value) / 100)}
                          className="flex-1"
                        />
                        <span className="text-xs text-midnight-400 w-8">
                          {Math.round(track.volume * 100)}%
                        </span>
                      </div>

                      {/* Loop toggle */}
                      <button
                        onClick={() => updateAudioTrack(track.id, { loop: !track.loop })}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          track.loop 
                            ? 'bg-dream-500/30 text-dream-300'
                            : 'bg-midnight-700/50 text-midnight-400 hover:text-white'
                        )}
                      >
                        <Repeat className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (audioRefs.current[track.id]) {
                            audioRefs.current[track.id].pause()
                            delete audioRefs.current[track.id]
                          }
                          if (playingId === track.id) setPlayingId(null)
                          deleteAudioTrack(track.id)
                        }}
                        className="p-2 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-midnight-500 text-center py-2">
                  Aucun fichier {label.toLowerCase()}
                </p>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

