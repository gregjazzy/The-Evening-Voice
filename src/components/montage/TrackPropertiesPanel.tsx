'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  useMontageStore,
  type MediaTrack,
  type SoundTrack,
  type LightTrack,
  type DecorationTrack,
  type AnimationTrack,
  type MusicTrack,
  type PhraseTiming,
  type PhraseStyle,
  type PhrasePosition,
  type PhraseFontSize,
} from '@/store/useMontageStore'
import { cn } from '@/lib/utils'
import { 
  X, 
  Image, 
  Video, 
  Music, 
  Volume2, 
  Lightbulb, 
  Sparkles,
  Star,
  Type,
  Move,
  Maximize2,
  Eye,
  Clock,
  Sliders,
  GripVertical,
  Mic,
  AudioWaveform,
} from 'lucide-react'
import { CharacterVoiceSelector } from './CharacterVoiceSelector'

// =============================================================================
// SLIDER COMPONENT
// =============================================================================
interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
  icon?: React.ReactNode
}

function Slider({ label, value, min, max, step = 1, unit = '', onChange, icon }: SliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-midnight-400 flex items-center gap-1.5">
          {icon}
          {label}
        </label>
        <span className="text-xs font-mono text-midnight-300">
          {value.toFixed(step < 1 ? 1 : 0)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-midnight-700 rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:h-3
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-aurora-400
                   [&::-webkit-slider-thumb]:shadow-lg
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:transition-transform
                   [&::-webkit-slider-thumb]:hover:scale-125"
      />
    </div>
  )
}

// =============================================================================
// SECTION COMPONENT
// =============================================================================
interface SectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  color?: string
}

function Section({ title, icon, children, color = 'text-aurora-400' }: SectionProps) {
  return (
    <div className="space-y-3">
      <h4 className={cn("text-xs font-medium uppercase tracking-wider flex items-center gap-2", color)}>
        {icon}
        {title}
      </h4>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  )
}

// =============================================================================
// MEDIA PROPERTIES
// =============================================================================
function MediaProperties({ track }: { track: MediaTrack }) {
  const { updateMediaTrack } = useMontageStore()
  
  return (
    <div className="space-y-4">
      {/* Position et taille */}
      <Section title="Position & Taille" icon={<Move className="w-3.5 h-3.5" />} color="text-blue-400">
        <div className="grid grid-cols-2 gap-3">
          <Slider
            label="Position X"
            value={track.position.x}
            min={0}
            max={100}
            unit="%"
            onChange={(x) => updateMediaTrack(track.id, { position: { ...track.position, x } })}
          />
          <Slider
            label="Position Y"
            value={track.position.y}
            min={0}
            max={100}
            unit="%"
            onChange={(y) => updateMediaTrack(track.id, { position: { ...track.position, y } })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Slider
            label="Largeur"
            value={track.position.width}
            min={5}
            max={100}
            unit="%"
            icon={<Maximize2 className="w-3 h-3" />}
            onChange={(width) => updateMediaTrack(track.id, { position: { ...track.position, width } })}
          />
          <Slider
            label="Hauteur"
            value={track.position.height}
            min={5}
            max={100}
            unit="%"
            onChange={(height) => updateMediaTrack(track.id, { position: { ...track.position, height } })}
          />
        </div>
      </Section>

      {/* Opacité et fondus */}
      <Section title="Opacité & Fondus" icon={<Eye className="w-3.5 h-3.5" />} color="text-purple-400">
        <Slider
          label="Opacité"
          value={(track.opacity ?? 1) * 100}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => updateMediaTrack(track.id, { opacity: v / 100 })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Slider
            label="Fade In"
            value={track.fadeIn ?? 0}
            min={0}
            max={3}
            step={0.1}
            unit="s"
            icon={<Clock className="w-3 h-3" />}
            onChange={(fadeIn) => updateMediaTrack(track.id, { fadeIn })}
          />
          <Slider
            label="Fade Out"
            value={track.fadeOut ?? 0}
            min={0}
            max={3}
            step={0.1}
            unit="s"
            onChange={(fadeOut) => updateMediaTrack(track.id, { fadeOut })}
          />
        </div>
      </Section>

      {/* Z-Index */}
      <Section title="Superposition" icon={<Sliders className="w-3.5 h-3.5" />} color="text-green-400">
        <Slider
          label="Couche (z-index)"
          value={track.zIndex}
          min={1}
          max={10}
          onChange={(zIndex) => updateMediaTrack(track.id, { zIndex })}
        />
      </Section>
    </div>
  )
}

// =============================================================================
// NARRATION PROPERTIES (VOLUME DE LA VOIX)
// =============================================================================
function NarrationProperties() {
  const { getCurrentScene, updateNarrationVolume } = useMontageStore()
  const scene = getCurrentScene()
  const volume = scene?.narration?.volume ?? 1
  
  return (
    <div className="space-y-4">
      {/* Volume de la voix */}
      <Section title="Volume de la voix" icon={<Volume2 className="w-3.5 h-3.5" />} color="text-amber-400">
        <Slider
          label="Volume"
          value={volume * 100}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => updateNarrationVolume(v / 100)}
        />
      </Section>
      
      {/* Infos */}
      <Section title="Informations" icon={<Mic className="w-3.5 h-3.5" />} color="text-blue-400">
        <div className="text-xs text-midnight-400 space-y-1">
          <p>Source: {scene?.narration?.source === 'recorded' ? '🎤 Enregistrée' : '🤖 TTS'}</p>
          <p>Durée: {scene?.narration?.duration?.toFixed(1)}s</p>
          <p>Phrases: {scene?.narration?.phrases?.length || 0}</p>
        </div>
      </Section>
    </div>
  )
}

// =============================================================================
// PHRASE PROPERTIES (STYLE DE LA PHRASE)
// =============================================================================
function PhraseProperties({ phrase }: { phrase: PhraseTiming }) {
  const { updatePhraseStyle, updatePhraseTiming } = useMontageStore()
  const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false)
  
  // Volume de la phrase (défaut: 1)
  const volume = phrase.volume ?? 1
  
  // Voix actuelle de la phrase
  const currentVoiceName = phrase.characterName || 'Voix par défaut'
  const currentVoiceEmoji = phrase.characterEmoji || '🎤'
  const hasCustomVoice = !!phrase.voiceId || !!phrase.customAudioUrl
  
  // Style par défaut
  const style: PhraseStyle = {
    position: phrase.style?.position || 'bottom',
    fontSize: phrase.style?.fontSize || 'large',
    color: phrase.style?.color || '#FFFFFF',
    backgroundColor: phrase.style?.backgroundColor,
    animation: phrase.style?.animation || 'fade',
    customPosition: phrase.style?.customPosition,
  }
  
  const positions: { value: PhrasePosition; label: string; icon: string }[] = [
    { value: 'top', label: 'Haut', icon: '⬆️' },
    { value: 'center', label: 'Centre', icon: '⏺️' },
    { value: 'bottom', label: 'Bas', icon: '⬇️' },
    { value: 'custom', label: 'Libre', icon: '✋' },
  ]
  
  const fontSizes: { value: PhraseFontSize; label: string; size: string }[] = [
    { value: 'small', label: 'Petit', size: '16px' },
    { value: 'medium', label: 'Moyen', size: '20px' },
    { value: 'large', label: 'Grand', size: '28px' },
    { value: 'xlarge', label: 'Très grand', size: '36px' },
  ]
  
  const animations: { value: string; label: string }[] = [
    { value: 'fade', label: '✨ Fondu' },
    { value: 'slide', label: '➡️ Glissement' },
    { value: 'zoom', label: '🔍 Zoom' },
    { value: 'typewriter', label: '⌨️ Machine à écrire' },
  ]
  
  const presetColors = [
    '#FFFFFF', // Blanc
    '#FFD700', // Or
    '#FF6B6B', // Rouge clair
    '#4ECDC4', // Turquoise
    '#A78BFA', // Violet
    '#F97316', // Orange
    '#22C55E', // Vert
    '#3B82F6', // Bleu
  ]
  
  return (
    <div className="space-y-4">
      {/* Aperçu de la phrase */}
      <Section title="Aperçu" icon={<Type className="w-3.5 h-3.5" />} color="text-purple-400">
        <div 
          className="p-3 rounded-lg bg-midnight-900 text-center"
          style={{
            color: style.color,
            backgroundColor: style.backgroundColor || 'transparent',
            fontSize: fontSizes.find(f => f.value === style.fontSize)?.size || '28px',
          }}
        >
          {phrase.text.length > 50 ? phrase.text.substring(0, 50) + '...' : phrase.text}
        </div>
      </Section>
      
      {/* 🎤 VOIX - Section pour changer la voix de la phrase */}
      <Section title="Voix" icon={<AudioWaveform className="w-3.5 h-3.5" />} color="text-dream-400">
        <div className="space-y-2">
          {/* Voix actuelle */}
          <div className="flex items-center gap-2 p-2 bg-midnight-800/50 rounded-lg">
            <span className="text-lg">{currentVoiceEmoji}</span>
            <span className="text-sm text-white flex-1">{currentVoiceName}</span>
            {hasCustomVoice && (
              <span className="text-[10px] px-1.5 py-0.5 bg-aurora-500/20 text-aurora-400 rounded">
                Personnalisée
              </span>
            )}
          </div>
          
          {/* Bouton pour changer */}
          <button
            onClick={() => setIsVoiceSelectorOpen(true)}
            className="w-full py-2 px-3 rounded-lg bg-dream-500/20 hover:bg-dream-500/30 text-dream-300 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Mic className="w-4 h-4" />
            Changer la voix
          </button>
          
          {/* Info */}
          <p className="text-[10px] text-midnight-500">
            💡 Tu peux enregistrer ta voix ou choisir une voix IA
          </p>
        </div>
        
        {/* Modal de sélection de voix */}
        <CharacterVoiceSelector
          isOpen={isVoiceSelectorOpen}
          onClose={() => setIsVoiceSelectorOpen(false)}
          phrase={phrase}
          locale="fr"
        />
      </Section>
      
      {/* Position à l'écran */}
      <Section title="Position" icon={<Move className="w-3.5 h-3.5" />} color="text-blue-400">
        <div className="grid grid-cols-4 gap-1">
          {positions.map((pos) => (
            <button
              key={pos.value}
              onClick={() => updatePhraseStyle(phrase.id, { position: pos.value })}
              className={cn(
                'p-2 rounded text-xs flex flex-col items-center gap-1 transition-colors',
                style.position === pos.value
                  ? 'bg-aurora-500 text-white'
                  : 'bg-midnight-700 hover:bg-midnight-600 text-midnight-300'
              )}
            >
              <span>{pos.icon}</span>
              <span>{pos.label}</span>
            </button>
          ))}
        </div>
        
        {/* Position personnalisée */}
        {style.position === 'custom' && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Slider
              label="X"
              value={style.customPosition?.x ?? 50}
              min={0}
              max={100}
              unit="%"
              onChange={(x) => updatePhraseStyle(phrase.id, { 
                customPosition: { x, y: style.customPosition?.y ?? 50 } 
              })}
            />
            <Slider
              label="Y"
              value={style.customPosition?.y ?? 50}
              min={0}
              max={100}
              unit="%"
              onChange={(y) => updatePhraseStyle(phrase.id, { 
                customPosition: { x: style.customPosition?.x ?? 50, y } 
              })}
            />
          </div>
        )}
      </Section>
      
      {/* Taille de police */}
      <Section title="Taille" icon={<Maximize2 className="w-3.5 h-3.5" />} color="text-green-400">
        <div className="grid grid-cols-4 gap-1">
          {fontSizes.map((size) => (
            <button
              key={size.value}
              onClick={() => updatePhraseStyle(phrase.id, { fontSize: size.value })}
              className={cn(
                'p-2 rounded text-xs transition-colors',
                style.fontSize === size.value
                  ? 'bg-aurora-500 text-white'
                  : 'bg-midnight-700 hover:bg-midnight-600 text-midnight-300'
              )}
            >
              {size.label}
            </button>
          ))}
        </div>
      </Section>
      
      {/* Couleur du texte */}
      <Section title="Couleur du texte" icon={<Eye className="w-3.5 h-3.5" />} color="text-pink-400">
        <div className="flex flex-wrap gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => updatePhraseStyle(phrase.id, { color })}
              className={cn(
                'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110',
                style.color === color ? 'border-white scale-110' : 'border-transparent'
              )}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          {/* Couleur personnalisée */}
          <input
            type="color"
            value={style.color}
            onChange={(e) => updatePhraseStyle(phrase.id, { color: e.target.value })}
            className="w-7 h-7 rounded cursor-pointer"
            title="Couleur personnalisée"
          />
        </div>
      </Section>
      
      {/* Couleur de fond (optionnel) */}
      <Section title="Fond (optionnel)" icon={<Sliders className="w-3.5 h-3.5" />} color="text-orange-400">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!style.backgroundColor}
            onChange={(e) => updatePhraseStyle(phrase.id, { 
              backgroundColor: e.target.checked ? '#00000080' : undefined 
            })}
            className="rounded"
          />
          <span className="text-xs text-midnight-400">Activer le fond</span>
          {style.backgroundColor && (
            <input
              type="color"
              value={style.backgroundColor.replace(/[0-9a-f]{2}$/i, '') || '#000000'}
              onChange={(e) => updatePhraseStyle(phrase.id, { backgroundColor: e.target.value + '80' })}
              className="w-6 h-6 rounded cursor-pointer ml-auto"
            />
          )}
        </div>
      </Section>
      
      {/* Animation d'entrée */}
      <Section title="Animation" icon={<Sparkles className="w-3.5 h-3.5" />} color="text-yellow-400">
        <div className="grid grid-cols-2 gap-1">
          {animations.map((anim) => (
            <button
              key={anim.value}
              onClick={() => updatePhraseStyle(phrase.id, { animation: anim.value as any })}
              className={cn(
                'p-2 rounded text-xs transition-colors',
                style.animation === anim.value
                  ? 'bg-aurora-500 text-white'
                  : 'bg-midnight-700 hover:bg-midnight-600 text-midnight-300'
              )}
            >
              {anim.label}
            </button>
          ))}
        </div>
      </Section>
      
      {/* Volume audio de la phrase */}
      <Section title="Volume Audio" icon={<Volume2 className="w-3.5 h-3.5" />} color="text-amber-400">
        <Slider
          label="Volume"
          value={volume * 100}
          min={0}
          max={150}
          unit="%"
          onChange={(v) => updatePhraseTiming(phrase.id, { volume: v / 100 })}
        />
        <p className="text-[10px] text-midnight-500 mt-1">
          💡 100% = volume normal, 150% = amplifié
        </p>
      </Section>
    </div>
  )
}

// =============================================================================
// SOUND/MUSIC PROPERTIES
// =============================================================================
function SoundProperties({ track, type }: { track: SoundTrack | MusicTrack; type: 'sound' | 'music' }) {
  const { updateSoundTrack, updateMusicTrack } = useMontageStore()
  const update = type === 'sound' ? updateSoundTrack : updateMusicTrack
  
  // Debug: afficher l'ID et le nom du track en cours d'édition
  console.log(`📝 Panel ouvert pour ${type}:`, track.name, 'ID:', track.id, 'Volume:', track.volume)
  
  return (
    <div className="space-y-4">
      {/* Volume */}
      <Section title="Volume" icon={<Volume2 className="w-3.5 h-3.5" />} color="text-pink-400">
        <Slider
          label="Volume"
          value={track.volume * 100}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => {
            console.log(`🔊 Modification volume de "${track.name}" (ID: ${track.id}) → ${v}%`)
            update(track.id, { volume: v / 100 })
          }}
        />
      </Section>

      {/* Fondus audio */}
      <Section title="Fondus Audio" icon={<Clock className="w-3.5 h-3.5" />} color="text-orange-400">
        <div className="grid grid-cols-2 gap-3">
          <Slider
            label="Fade In"
            value={track.timeRange.fadeIn ?? 0}
            min={0}
            max={5}
            step={0.1}
            unit="s"
            onChange={(fadeIn) => update(track.id, { timeRange: { ...track.timeRange, fadeIn } })}
          />
          <Slider
            label="Fade Out"
            value={track.timeRange.fadeOut ?? 0}
            min={0}
            max={5}
            step={0.1}
            unit="s"
            onChange={(fadeOut) => update(track.id, { timeRange: { ...track.timeRange, fadeOut } })}
          />
        </div>
      </Section>

      {/* Loop */}
      <Section title="Options" icon={<Sliders className="w-3.5 h-3.5" />} color="text-cyan-400">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={track.loop}
            onChange={(e) => update(track.id, { loop: e.target.checked })}
            className="w-4 h-4 rounded bg-midnight-700 border-midnight-600 text-aurora-400 
                       focus:ring-aurora-400 focus:ring-offset-midnight-800"
          />
          <span className="text-sm text-midnight-300">Boucle (répéter)</span>
        </label>
      </Section>
    </div>
  )
}

// =============================================================================
// DECORATION PROPERTIES
// =============================================================================
function DecorationProperties({ track }: { track: DecorationTrack }) {
  const { updateDecorationTrack } = useMontageStore()
  
  return (
    <div className="space-y-4">
      {/* Position et taille */}
      <Section title="Position & Taille" icon={<Move className="w-3.5 h-3.5" />} color="text-yellow-400">
        <div className="grid grid-cols-2 gap-3">
          <Slider
            label="Position X"
            value={track.position.x}
            min={0}
            max={100}
            unit="%"
            onChange={(x) => updateDecorationTrack(track.id, { position: { ...track.position, x } })}
          />
          <Slider
            label="Position Y"
            value={track.position.y}
            min={0}
            max={100}
            unit="%"
            onChange={(y) => updateDecorationTrack(track.id, { position: { ...track.position, y } })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Slider
            label="Largeur"
            value={track.position.width}
            min={5}
            max={100}
            unit="%"
            onChange={(width) => updateDecorationTrack(track.id, { position: { ...track.position, width } })}
          />
          <Slider
            label="Hauteur"
            value={track.position.height}
            min={5}
            max={100}
            unit="%"
            onChange={(height) => updateDecorationTrack(track.id, { position: { ...track.position, height } })}
          />
        </div>
        <Slider
          label="Rotation"
          value={track.position.rotation ?? 0}
          min={-180}
          max={180}
          unit="°"
          onChange={(rotation) => updateDecorationTrack(track.id, { position: { ...track.position, rotation } })}
        />
      </Section>

      {/* Opacité et fondus */}
      <Section title="Opacité & Fondus" icon={<Eye className="w-3.5 h-3.5" />} color="text-purple-400">
        <Slider
          label="Opacité"
          value={(track.opacity ?? 1) * 100}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => updateDecorationTrack(track.id, { opacity: v / 100 })}
        />
        <Slider
          label="Échelle"
          value={(track.scale ?? 1) * 100}
          min={10}
          max={300}
          unit="%"
          onChange={(v) => updateDecorationTrack(track.id, { scale: v / 100 })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Slider
            label="Fade In"
            value={track.fadeIn ?? 0}
            min={0}
            max={3}
            step={0.1}
            unit="s"
            onChange={(fadeIn) => updateDecorationTrack(track.id, { fadeIn })}
          />
          <Slider
            label="Fade Out"
            value={track.fadeOut ?? 0}
            min={0}
            max={3}
            step={0.1}
            unit="s"
            onChange={(fadeOut) => updateDecorationTrack(track.id, { fadeOut })}
          />
        </div>
      </Section>

      {/* Effet de lueur */}
      <Section title="Effet de lueur" icon={<Sparkles className="w-3.5 h-3.5" />} color="text-amber-400">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={track.glow?.enabled ?? false}
            onChange={(e) => updateDecorationTrack(track.id, { 
              glow: { 
                enabled: e.target.checked, 
                color: track.glow?.color || '#FFD700',
                intensity: track.glow?.intensity || 50 
              } 
            })}
            className="w-4 h-4 rounded bg-midnight-700 border-midnight-600 text-aurora-400"
          />
          <span className="text-sm text-midnight-300">Activer la lueur</span>
        </label>
        {track.glow?.enabled && (
          <>
            <Slider
              label="Intensité"
              value={track.glow?.intensity ?? 50}
              min={0}
              max={100}
              unit="%"
              onChange={(intensity) => updateDecorationTrack(track.id, { 
                glow: { ...track.glow!, intensity } 
              })}
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-midnight-400">Couleur</label>
              <input
                type="color"
                value={track.glow?.color || '#FFD700'}
                onChange={(e) => updateDecorationTrack(track.id, { 
                  glow: { ...track.glow!, color: e.target.value } 
                })}
                className="w-8 h-6 rounded cursor-pointer bg-transparent"
              />
            </div>
          </>
        )}
      </Section>
    </div>
  )
}

// =============================================================================
// ANIMATION PROPERTIES
// =============================================================================
function AnimationProperties({ track }: { track: AnimationTrack }) {
  const { updateAnimationTrack } = useMontageStore()
  const isLocalized = track.type.startsWith('localized-')
  
  return (
    <div className="space-y-4">
      {/* Position (pour animations localisées) */}
      {isLocalized && track.position && (
        <Section title="Position de l'effet" icon={<Move className="w-3.5 h-3.5" />} color="text-cyan-400">
          <div className="grid grid-cols-2 gap-3">
            <Slider
              label="Position X"
              value={track.position.x}
              min={0}
              max={100}
              unit="%"
              onChange={(x) => updateAnimationTrack(track.id, { position: { ...track.position!, x } })}
            />
            <Slider
              label="Position Y"
              value={track.position.y}
              min={0}
              max={100}
              unit="%"
              onChange={(y) => updateAnimationTrack(track.id, { position: { ...track.position!, y } })}
            />
          </div>
          <Slider
            label="Rayon de dispersion"
            value={track.position?.radius ?? 30}
            min={5}
            max={80}
            unit="%"
            onChange={(radius) => updateAnimationTrack(track.id, { position: { ...track.position!, radius } })}
          />
        </Section>
      )}

      {/* Intensité et vitesse */}
      <Section title="Intensité & Vitesse" icon={<Sparkles className="w-3.5 h-3.5" />} color="text-pink-400">
        <Slider
          label="Intensité (densité)"
          value={track.intensity}
          min={10}
          max={100}
          unit="%"
          onChange={(intensity) => updateAnimationTrack(track.id, { intensity })}
        />
        <Slider
          label="Vitesse"
          value={track.speed ?? 50}
          min={10}
          max={100}
          unit="%"
          onChange={(speed) => updateAnimationTrack(track.id, { speed })}
        />
      </Section>

      {/* Apparence */}
      <Section title="Apparence" icon={<Eye className="w-3.5 h-3.5" />} color="text-purple-400">
        <Slider
          label="Opacité"
          value={(track.opacity ?? 1) * 100}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => updateAnimationTrack(track.id, { opacity: v / 100 })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Slider
            label="Fade In"
            value={track.fadeIn ?? 0}
            min={0}
            max={3}
            step={0.1}
            unit="s"
            onChange={(fadeIn) => updateAnimationTrack(track.id, { fadeIn })}
          />
          <Slider
            label="Fade Out"
            value={track.fadeOut ?? 0}
            min={0}
            max={3}
            step={0.1}
            unit="s"
            onChange={(fadeOut) => updateAnimationTrack(track.id, { fadeOut })}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-midnight-400">Couleur</label>
          <input
            type="color"
            value={track.color || '#FFFFFF'}
            onChange={(e) => updateAnimationTrack(track.id, { color: e.target.value })}
            className="w-8 h-6 rounded cursor-pointer bg-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-midnight-400">Taille</label>
          <select
            value={track.size || 'medium'}
            onChange={(e) => updateAnimationTrack(track.id, { size: e.target.value as 'small' | 'medium' | 'large' })}
            className="flex-1 px-2 py-1 text-sm rounded bg-midnight-700 border border-midnight-600 text-white"
          >
            <option value="small">Petite</option>
            <option value="medium">Moyenne</option>
            <option value="large">Grande</option>
          </select>
        </div>
      </Section>
    </div>
  )
}

// =============================================================================
// LIGHT PROPERTIES
// =============================================================================
function LightProperties({ track }: { track: LightTrack }) {
  const { updateLightTrack } = useMontageStore()
  
  return (
    <div className="space-y-4">
      {/* Couleur et intensité */}
      <Section title="Lumière" icon={<Lightbulb className="w-3.5 h-3.5" />} color="text-yellow-400">
        <div className="flex items-center gap-3">
          <label className="text-xs text-midnight-400">Couleur</label>
          <input
            type="color"
            value={track.color}
            onChange={(e) => updateLightTrack(track.id, { color: e.target.value })}
            className="w-10 h-8 rounded cursor-pointer bg-transparent"
          />
          <span className="text-xs text-midnight-500 font-mono">{track.color}</span>
        </div>
        <Slider
          label="Intensité"
          value={track.intensity}
          min={0}
          max={100}
          unit="%"
          onChange={(intensity) => updateLightTrack(track.id, { intensity })}
        />
      </Section>

      {/* Fondus */}
      <Section title="Transitions" icon={<Clock className="w-3.5 h-3.5" />} color="text-orange-400">
        <div className="grid grid-cols-2 gap-3">
          <Slider
            label="Fade In"
            value={track.fadeIn ?? 0}
            min={0}
            max={3}
            step={0.1}
            unit="s"
            onChange={(fadeIn) => updateLightTrack(track.id, { fadeIn })}
          />
          <Slider
            label="Fade Out"
            value={track.fadeOut ?? 0}
            min={0}
            max={3}
            step={0.1}
            unit="s"
            onChange={(fadeOut) => updateLightTrack(track.id, { fadeOut })}
          />
        </div>
      </Section>

      {/* Pulsation */}
      <Section title="Animation" icon={<Sparkles className="w-3.5 h-3.5" />} color="text-pink-400">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={track.pulse?.enabled ?? false}
            onChange={(e) => updateLightTrack(track.id, { 
              pulse: { 
                enabled: e.target.checked, 
                speed: track.pulse?.speed || 1,
                minIntensity: track.pulse?.minIntensity || 20 
              } 
            })}
            className="w-4 h-4 rounded bg-midnight-700 border-midnight-600 text-aurora-400"
          />
          <span className="text-sm text-midnight-300">Pulsation</span>
        </label>
        {track.pulse?.enabled && (
          <>
            <Slider
              label="Vitesse"
              value={track.pulse?.speed ?? 1}
              min={0.1}
              max={5}
              step={0.1}
              unit="x"
              onChange={(speed) => updateLightTrack(track.id, { 
                pulse: { ...track.pulse!, speed } 
              })}
            />
            <Slider
              label="Intensité min"
              value={track.pulse?.minIntensity ?? 20}
              min={0}
              max={100}
              unit="%"
              onChange={(minIntensity) => updateLightTrack(track.id, { 
                pulse: { ...track.pulse!, minIntensity } 
              })}
            />
          </>
        )}
      </Section>
    </div>
  )
}

// =============================================================================
// MAIN PANEL (DRAGGABLE)
// =============================================================================
export function TrackPropertiesPanel() {
  const {
    selectedTrackId,
    selectedTrackType,
    getCurrentScene,
    clearSelection,
  } = useMontageStore()

  const scene = getCurrentScene()
  
  // État pour la position du panneau (déplaçable)
  const [position, setPosition] = useState({ x: 0, y: 100 }) // Position initiale, sera ajustée au mount
  const [isDragging, setIsDragging] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const positionStartRef = useRef({ x: 0, y: 0 })

  // Initialiser la position au mount (côté client uniquement)
  useEffect(() => {
    if (!isInitialized && typeof window !== 'undefined') {
      setPosition({ x: window.innerWidth - 300, y: 100 })
      setIsInitialized(true)
    }
  }, [isInitialized])

  // Handlers pour le drag
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    positionStartRef.current = position
  }, [position])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.x
      const deltaY = e.clientY - dragStartRef.current.y
      
      // Limiter aux bords de l'écran (avec marge pour la sidebar de 96px à gauche)
      const newX = Math.max(96, Math.min(window.innerWidth - 288, positionStartRef.current.x + deltaX))
      const newY = Math.max(16, Math.min(window.innerHeight - 300, positionStartRef.current.y + deltaY))
      
      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  // Trouver l'élément sélectionné
  const getSelectedTrack = () => {
    if (!scene || !selectedTrackType) return null
    
    // Cas spécial pour la narration (pas d'ID de track)
    if (selectedTrackType === 'narration') {
      return { type: 'narration', track: scene.narration }
    }
    
    if (!selectedTrackId) return null
    
    switch (selectedTrackType) {
      case 'media':
        return { type: 'media', track: scene.mediaTracks?.find(t => t.id === selectedTrackId) }
      case 'music':
        return { type: 'music', track: scene.musicTracks?.find(t => t.id === selectedTrackId) }
      case 'sound':
        return { type: 'sound', track: scene.soundTracks?.find(t => t.id === selectedTrackId) }
      case 'light':
        return { type: 'light', track: scene.lightTracks?.find(t => t.id === selectedTrackId) }
      case 'decoration':
        return { type: 'decoration', track: scene.decorationTracks?.find(t => t.id === selectedTrackId) }
      case 'animation':
        return { type: 'animation', track: scene.animationTracks?.find(t => t.id === selectedTrackId) }
      case 'phrase':
        return { type: 'phrase', track: scene.narration?.phrases?.find(p => p.id === selectedTrackId) }
      default:
        return null
    }
  }

  const selected = getSelectedTrack()
  
  const getTrackIcon = () => {
    switch (selected?.type) {
      case 'media': return (selected.track as MediaTrack)?.type === 'video' ? <Video className="w-4 h-4" /> : <Image className="w-4 h-4" />
      case 'music': return <Music className="w-4 h-4" />
      case 'sound': return <Volume2 className="w-4 h-4" />
      case 'light': return <Lightbulb className="w-4 h-4" />
      case 'decoration': return <Star className="w-4 h-4" />
      case 'animation': return <Sparkles className="w-4 h-4" />
      case 'narration': return <Mic className="w-4 h-4" />
      case 'phrase': return <Type className="w-4 h-4" />
      default: return null
    }
  }

  const getTrackName = () => {
    if (!selected?.track) return ''
    if (selected.type === 'narration') return '🎤 Narration (Voix)'
    if (selected.type === 'phrase') {
      const phrase = selected.track as PhraseTiming
      return phrase.text.length > 20 ? phrase.text.substring(0, 20) + '...' : phrase.text
    }
    return (selected.track as any).name || (selected.track as any).type || 'Élément'
  }

  // Utiliser un portal pour rendre au-dessus de tout (y compris le mode plein écran)
  if (typeof document === 'undefined') return null
  
  return createPortal(
    <AnimatePresence>
      {selected?.track && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={cn(
            "fixed glass rounded-xl w-72 max-h-[calc(100vh-100px)] overflow-hidden flex flex-col shadow-2xl z-[10000]",
            isDragging && "cursor-grabbing"
          )}
          style={{ 
            left: position.x, 
            top: position.y,
          }}
        >
          {/* Barre de drag */}
          <div 
            className="flex items-center justify-between px-3 py-2 bg-midnight-800/50 border-b border-midnight-700/50 cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleDragStart}
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-midnight-500" />
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-aurora-500/20 text-aurora-400">
                  {getTrackIcon()}
                </div>
                <div>
                  <h3 className="font-medium text-xs text-white truncate max-w-[140px]">
                    {getTrackName()}
                  </h3>
                  <p className="text-[10px] text-midnight-500 capitalize">{selected.type}</p>
                </div>
              </div>
            </div>
            <button
              onClick={clearSelection}
              className="p-1 rounded hover:bg-midnight-700/50 text-midnight-500 hover:text-white transition-colors"
              onMouseDown={(e) => e.stopPropagation()} // Empêcher le drag quand on clique sur fermer
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Contenu scrollable */}
          <div className="p-4 overflow-y-auto flex-1">
            {selected.type === 'media' && <MediaProperties track={selected.track as MediaTrack} />}
            {selected.type === 'sound' && <SoundProperties track={selected.track as SoundTrack} type="sound" />}
            {selected.type === 'music' && <SoundProperties track={selected.track as MusicTrack} type="music" />}
            {selected.type === 'light' && <LightProperties track={selected.track as LightTrack} />}
            {selected.type === 'decoration' && <DecorationProperties track={selected.track as DecorationTrack} />}
            {selected.type === 'animation' && <AnimationProperties track={selected.track as AnimationTrack} />}
            {selected.type === 'narration' && <NarrationProperties />}
            {selected.type === 'phrase' && <PhraseProperties phrase={selected.track as PhraseTiming} />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
