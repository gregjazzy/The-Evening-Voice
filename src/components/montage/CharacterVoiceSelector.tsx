'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Play, 
  Square,
  Check, 
  Mic,
  Wand2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  getAllCharacters,
  getElevenLabsIdForCharacter,
  type CharacterVoiceMapping,
} from '@/lib/ai/voice-catalog'
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

// "Ma voix" - option enregistrement
const MY_VOICE = {
  characterId: 'my-voice',
  characterName: 'Ma voix',
  emoji: '🎤',
  voiceId: '',
  description: 'Enregistre ta propre voix',
  color: '#FF6B6B',
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
  const [selectedId, setSelectedId] = useState<string | null>(
    phrase.characterId || null
  )
  
  // État du formulaire custom
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customDescription, setCustomDescription] = useState('')
  const [isCreatingCustom, setIsCreatingCustom] = useState(false)
  const [customPreviewUrl, setCustomPreviewUrl] = useState<string | null>(null)
  const [customVoice, setCustomVoice] = useState<{
    description: string
    audioUrl: string
    voiceId?: string
  } | null>(null)
  
  // Obtenir les personnages disponibles
  const characters = getAllCharacters()
  
  // Arrêter tout audio en cours
  const stopPreview = useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current.currentTime = 0
    }
    setPreviewingId(null)
  }, [])
  
  // Prévisualiser une voix
  const handlePreview = useCallback(async (character: CharacterVoiceMapping) => {
    stopPreview()
    
    if (previewingId === character.characterId) return
    
    setPreviewingId(character.characterId)
    
    const elevenLabsId = getElevenLabsIdForCharacter(character.characterId)
    if (!elevenLabsId) {
      setPreviewingId(null)
      return
    }
    
    try {
      const previewText = phrase.text.length > 80 
        ? phrase.text.slice(0, 77) + '...'
        : phrase.text
      
      const response = await fetch('/api/ai/voice/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: previewText,
          voiceId: elevenLabsId,
          locale,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        const audio = new Audio(data.audioUrl)
        previewAudioRef.current = audio
        audio.onended = () => setPreviewingId(null)
        audio.onerror = () => setPreviewingId(null)
        await audio.play()
      } else {
        setPreviewingId(null)
      }
    } catch (error) {
      console.error('Erreur preview:', error)
      setPreviewingId(null)
    }
  }, [previewingId, stopPreview, phrase.text, locale])
  
  // Créer une voix personnalisée via Voice Design
  const handleCreateCustomVoice = useCallback(async () => {
    if (!customDescription || customDescription.length < 10) return
    
    setIsCreatingCustom(true)
    setCustomPreviewUrl(null)
    
    try {
      const response = await fetch('/api/ai/voice/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: customDescription,
          text: phrase.text.slice(0, 100),
          locale,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setCustomPreviewUrl(data.audioUrl)
        setCustomVoice({
          description: customDescription,
          audioUrl: data.audioUrl,
          voiceId: data.voiceId,
        })
        setSelectedId('custom')
        
        // Jouer le preview
        const audio = new Audio(data.audioUrl)
        previewAudioRef.current = audio
        audio.play()
      }
    } catch (error) {
      console.error('Erreur création voix:', error)
    } finally {
      setIsCreatingCustom(false)
    }
  }, [customDescription, phrase.text, locale])
  
  // Confirmer la sélection
  const handleConfirm = useCallback(async () => {
    if (!selectedId) return
    
    setIsGenerating(true)
    
    try {
      // Ma voix (enregistrement)
      if (selectedId === 'my-voice') {
        updatePhraseVoice(phrase.id, {
          voiceType: 'recorded',
          voiceId: undefined,
          characterId: 'my-voice',
          characterName: 'Ma voix',
          characterEmoji: '🎤',
          characterColor: '#FF6B6B',
          customAudioUrl: undefined,
        })
        onClose()
        return
      }
      
      // Voix custom créée
      if (selectedId === 'custom' && customVoice) {
        updatePhraseVoice(phrase.id, {
          voiceType: 'custom',
          voiceId: customVoice.voiceId,
          characterId: 'custom',
          characterName: customVoice.description.slice(0, 25) + '...',
          characterEmoji: '✨',
          characterColor: '#DA70D6',
          customAudioUrl: customVoice.audioUrl,
        })
        onClose()
        return
      }
      
      // Personnage prédéfini
      const character = characters.find(c => c.characterId === selectedId)
      if (!character) return
      
      const elevenLabsId = getElevenLabsIdForCharacter(selectedId)
      if (!elevenLabsId) return
      
      // Générer l'audio complet
      const response = await fetch('/api/ai/voice/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: phrase.text,
          voiceId: elevenLabsId,
          locale,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        
        updatePhraseVoice(phrase.id, {
          voiceType: 'preset',
          voiceId: elevenLabsId,
          characterId: character.characterId,
          characterName: character.characterName,
          characterEmoji: character.emoji,
          characterColor: character.color,
          customAudioUrl: data.audioUrl,
        })
        
        onClose()
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [selectedId, phrase, locale, characters, customVoice, updatePhraseVoice, onClose])
  
  // Nettoyer à la fermeture
  const handleClose = useCallback(() => {
    stopPreview()
    setShowCustomForm(false)
    setCustomDescription('')
    setCustomPreviewUrl(null)
    setCustomVoice(null)
    onClose()
  }, [stopPreview, onClose])
  
  // Trouver le personnage/voix sélectionné pour l'affichage
  const getSelectedInfo = () => {
    if (selectedId === 'my-voice') return { name: 'Ma voix', emoji: '🎤', type: 'Enregistrement' }
    if (selectedId === 'custom' && customVoice) return { name: customVoice.description.slice(0, 20) + '...', emoji: '✨', type: 'Voix créée' }
    const character = characters.find(c => c.characterId === selectedId)
    if (character) return { name: character.characterName, emoji: character.emoji, type: 'Personnage' }
    return null
  }
  
  const selectedInfo = getSelectedInfo()
  
  if (!isOpen) return null
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass rounded-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-midnight-700/50 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  🎭 Qui parle ?
                </h2>
                <p className="text-xs text-midnight-400 mt-1 line-clamp-1">
                  "{phrase.text}"
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-midnight-700/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Contenu */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              
              {/* ═══════════════════════════════════════════════════════ */}
              {/* SECTION 1 : Ma voix / Voix personnalisée */}
              {/* ═══════════════════════════════════════════════════════ */}
              
              {/* Ma voix */}
              <button
                onClick={() => setSelectedId('my-voice')}
                className={cn(
                  'w-full p-3 rounded-xl flex items-center gap-3 transition-all text-left',
                  selectedId === 'my-voice'
                    ? 'bg-gradient-to-r from-red-500/20 to-orange-500/10 ring-2 ring-red-500/50'
                    : 'bg-midnight-800/30 hover:bg-midnight-800/50'
                )}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 bg-red-500/20">
                  🎤
                </div>
                <div className="flex-1">
                  <p className="font-medium">Ma voix</p>
                  <p className="text-xs text-midnight-400">J'enregistre moi-même</p>
                </div>
                {selectedId === 'my-voice' && (
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
              
              {/* Créer une voix */}
              <div>
                <button
                  onClick={() => setShowCustomForm(!showCustomForm)}
                  className={cn(
                    'w-full p-3 rounded-xl flex items-center gap-3 transition-all text-left',
                    showCustomForm || selectedId === 'custom'
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/10 ring-2 ring-purple-500/50'
                      : 'bg-midnight-800/30 hover:bg-midnight-800/50'
                  )}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-purple-500/20">
                    <Wand2 className="w-5 h-5 text-purple-300" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Créer une voix</p>
                    <p className="text-xs text-midnight-400">Décris la voix que tu imagines</p>
                  </div>
                  {showCustomForm ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                {/* Formulaire */}
                <AnimatePresence>
                  {showCustomForm && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 px-1 space-y-3">
                        <textarea
                          value={customDescription}
                          onChange={(e) => setCustomDescription(e.target.value)}
                          placeholder="Ex: Une voix grave de dragon qui gronde, un peu effrayante mais rigolote..."
                          className="w-full p-3 rounded-lg bg-midnight-800/50 border border-midnight-700/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-midnight-500"
                          rows={2}
                        />
                        
                        <button
                          onClick={handleCreateCustomVoice}
                          disabled={customDescription.length < 10 || isCreatingCustom}
                          className={cn(
                            'w-full p-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all',
                            customDescription.length >= 10 && !isCreatingCustom
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white'
                              : 'bg-midnight-800/50 text-midnight-500 cursor-not-allowed'
                          )}
                        >
                          {isCreatingCustom ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Création...</>
                          ) : (
                            <><Wand2 className="w-4 h-4" /> Créer et écouter</>
                          )}
                        </button>
                        
                        {customPreviewUrl && (
                          <div className="p-2 rounded-lg bg-green-500/20 text-green-300 text-xs flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            Voix créée ! Clique sur "Appliquer" pour l'utiliser.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* ═══════════════════════════════════════════════════════ */}
              {/* SECTION 2 : Personnages prédéfinis */}
              {/* ═══════════════════════════════════════════════════════ */}
              
              <div className="flex items-center gap-2 py-2 pt-4">
                <div className="flex-1 h-px bg-midnight-700/50" />
                <span className="text-xs text-midnight-500">ou choisis un personnage</span>
                <div className="flex-1 h-px bg-midnight-700/50" />
              </div>
              
              {/* Grille de personnages */}
              <div className="grid grid-cols-4 gap-2">
                {characters.map((character) => (
                  <button
                    key={character.characterId}
                    onClick={() => setSelectedId(character.characterId)}
                    className={cn(
                      'relative p-2 rounded-xl flex flex-col items-center gap-1 transition-all',
                      selectedId === character.characterId
                        ? 'ring-2 ring-aurora-500/70 bg-aurora-500/10'
                        : 'bg-midnight-800/30 hover:bg-midnight-800/50'
                    )}
                    style={selectedId === character.characterId ? {} : { borderColor: `${character.color}30` }}
                    title={character.description}
                  >
                    <span className="text-2xl">{character.emoji}</span>
                    <span className="text-[10px] text-center leading-tight truncate w-full">
                      {character.characterName}
                    </span>
                    
                    {/* Bouton preview */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePreview(character)
                      }}
                      className={cn(
                        'absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all',
                        previewingId === character.characterId
                          ? 'bg-aurora-500 text-white'
                          : 'bg-midnight-700 text-midnight-300 hover:bg-midnight-600'
                      )}
                      title="Écouter"
                    >
                      {previewingId === character.characterId ? (
                        <Square className="w-2.5 h-2.5" />
                      ) : (
                        <Play className="w-2.5 h-2.5" />
                      )}
                    </button>
                    
                    {selectedId === character.characterId && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-aurora-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-midnight-700/50 flex items-center justify-between shrink-0 bg-midnight-900/50">
              <div className="flex items-center gap-2 min-w-0">
                {selectedInfo ? (
                  <>
                    <span className="text-lg">{selectedInfo.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{selectedInfo.name}</p>
                      <p className="text-xs text-midnight-400">{selectedInfo.type}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-midnight-500">Choisis une voix</p>
                )}
              </div>
              
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleClose}
                  className="px-3 py-2 rounded-lg bg-midnight-800/50 hover:bg-midnight-700/50 transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedId || isGenerating}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all',
                    selectedId && !isGenerating
                      ? 'bg-aurora-500 hover:bg-aurora-400 text-white'
                      : 'bg-midnight-800/50 text-midnight-500 cursor-not-allowed'
                  )}
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Génération...</>
                  ) : (
                    <><Check className="w-4 h-4" /> Appliquer</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CharacterVoiceSelector
