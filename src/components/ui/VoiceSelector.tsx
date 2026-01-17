'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, Star, Check, ChevronDown, Sparkles } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useTTS, type VoiceOption } from '@/hooks/useTTS'
import { cn } from '@/lib/utils'

interface VoiceSelectorProps {
  className?: string
  compact?: boolean // Mode compact pour les petits espaces
}

export function VoiceSelector({ className, compact = false }: VoiceSelectorProps) {
  const { aiVoice, setAiVoice, aiName } = useAppStore()
  const tts = useTTS('fr', aiVoice || undefined)
  const [isOpen, setIsOpen] = useState(false)
  const [testingVoice, setTestingVoice] = useState<string | null>(null)

  const friendName = aiName || 'ton amie'

  // Tester une voix
  const handleTestVoice = async (voice: VoiceOption) => {
    setTestingVoice(voice.name)
    
    // Temporairement utiliser cette voix pour le test
    const testText = `Bonjour ! Je suis ${friendName}, et voici ma voix "${voice.name.split(' ')[0]}". Tu aimes ?`
    
    // Créer une utterance de test
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(testText)
      const voices = window.speechSynthesis.getVoices()
      const selectedVoice = voices.find(v => v.name === voice.name)
      
      if (selectedVoice) {
        utterance.voice = selectedVoice
        utterance.rate = 1.1
        utterance.pitch = 1.1
        
        utterance.onend = () => setTestingVoice(null)
        utterance.onerror = () => setTestingVoice(null)
        
        window.speechSynthesis.speak(utterance)
      } else {
        setTestingVoice(null)
      }
    }
  }

  // Sélectionner une voix
  const handleSelectVoice = (voice: VoiceOption) => {
    setAiVoice(voice.name)
    tts.setVoice(voice.name)
    setIsOpen(false)
  }

  // Qualité badge
  const QualityBadge = ({ quality }: { quality: VoiceOption['quality'] }) => {
    const config = {
      premium: { label: '⭐ Premium', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
      standard: { label: '✓ Standard', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
      basic: { label: 'Basique', className: 'bg-midnight-700 text-midnight-400 border-midnight-600' },
    }
    const { label, className } = config[quality]
    return (
      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', className)}>
        {label}
      </span>
    )
  }

  if (compact) {
    return (
      <div className={cn('relative', className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-midnight-800/50 hover:bg-midnight-700/50 text-white text-sm transition-colors"
        >
          <Volume2 className="w-4 h-4 text-aurora-400" />
          <span className="truncate max-w-[100px]">
            {tts.currentVoice?.name.split(' ')[0] || 'Voix...'}
          </span>
          <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 w-64 bg-midnight-900 border border-midnight-700 rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-2 border-b border-midnight-700">
                <p className="text-xs text-midnight-400">Voix de {friendName}</p>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {tts.availableVoices.map((voice) => (
                  <button
                    key={voice.name}
                    onClick={() => handleSelectVoice(voice)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 hover:bg-midnight-800 transition-colors text-left',
                      tts.currentVoice?.name === voice.name && 'bg-aurora-500/10'
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white">{voice.name.split(' ')[0]}</span>
                        {voice.isRecommended && <Star className="w-3 h-3 text-amber-400" />}
                      </div>
                      <QualityBadge quality={voice.quality} />
                    </div>
                    {tts.currentVoice?.name === voice.name && (
                      <Check className="w-4 h-4 text-aurora-400" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Mode complet
  return (
    <div className={cn('glass rounded-2xl p-4', className)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aurora-500 to-dream-500 flex items-center justify-center">
          <Volume2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Voix de {friendName}</h3>
          <p className="text-xs text-midnight-400">
            {tts.currentVoice 
              ? `${tts.currentVoice.name} ${tts.currentVoice.isRecommended ? '⭐' : ''}`
              : 'Aucune voix sélectionnée'
            }
          </p>
        </div>
      </div>

      {/* Liste des voix */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
        {tts.availableVoices.length === 0 ? (
          <p className="text-sm text-midnight-400 text-center py-4">
            Chargement des voix...
          </p>
        ) : (
          tts.availableVoices.map((voice) => (
            <motion.div
              key={voice.name}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors',
                tts.currentVoice?.name === voice.name
                  ? 'bg-aurora-500/20 border border-aurora-500/30'
                  : 'bg-midnight-800/50 hover:bg-midnight-700/50 border border-transparent'
              )}
              onClick={() => handleSelectVoice(voice)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Indicateur de sélection */}
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                tts.currentVoice?.name === voice.name
                  ? 'border-aurora-500 bg-aurora-500'
                  : 'border-midnight-600'
              )}>
                {tts.currentVoice?.name === voice.name && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>

              {/* Info voix */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    {voice.name.split('(')[0].trim()}
                  </span>
                  {voice.isRecommended && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-300">
                      <Star className="w-3 h-3" /> Recommandée
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <QualityBadge quality={voice.quality} />
                  <span className="text-[10px] text-midnight-500">{voice.lang}</span>
                </div>
              </div>

              {/* Bouton test */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleTestVoice(voice)
                }}
                disabled={testingVoice !== null}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  testingVoice === voice.name
                    ? 'bg-aurora-500/30 text-aurora-300'
                    : 'bg-midnight-700/50 text-midnight-400 hover:text-white hover:bg-midnight-600/50'
                )}
                title="Écouter cette voix"
              >
                {testingVoice === voice.name ? (
                  <Sparkles className="w-4 h-4 animate-pulse" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* Message d'aide */}
      {tts.availableVoices.length > 0 && (
        <p className="text-[11px] text-midnight-500 mt-3 text-center">
          💡 Les voix ⭐ Premium sont les plus naturelles
        </p>
      )}
    </div>
  )
}

export default VoiceSelector
