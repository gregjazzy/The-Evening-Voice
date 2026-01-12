'use client'

import { motion } from 'framer-motion'
import { useLayoutStore, luxuryFonts } from '@/store/useLayoutStore'
import { cn } from '@/lib/utils'
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Minus,
  Palette,
  RotateCw,
  Trash2,
  Sparkles
} from 'lucide-react'

const presetColors = [
  '#FFFFFF', // Blanc
  '#F8F0E3', // Crème
  '#FFD700', // Or
  '#E6B8FF', // Lavande
  '#87CEEB', // Ciel
  '#98FB98', // Menthe
  '#FFB6C1', // Rose
  '#000000', // Noir
]

export function TypographyPanel() {
  const {
    currentPage,
    selectedElement,
    updateTextBlock,
    deleteTextBlock,
    addTextBlock,
  } = useLayoutStore()

  const selectedBlock = currentPage?.textBlocks.find((b) => b.id === selectedElement)

  const handleAddText = () => {
    addTextBlock('Double-clique pour modifier')
  }

  if (!currentPage) return null

  return (
    <div className="space-y-6">
      {/* Bouton Ajouter Texte */}
      <motion.button
        onClick={handleAddText}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-aurora-600 to-aurora-700 text-white font-semibold"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Type className="w-5 h-5" />
        Ajouter du texte
      </motion.button>

      {/* Panneau d'édition si un texte est sélectionné */}
      {selectedBlock && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Police */}
          <div>
            <label className="text-xs text-midnight-400 uppercase tracking-wider mb-2 block">
              Police
            </label>
            <div className="grid grid-cols-2 gap-2">
              {luxuryFonts.map((font) => (
                <button
                  key={font.id}
                  onClick={() => updateTextBlock(selectedBlock.id, { fontFamily: font.name })}
                  className={cn(
                    'p-2 rounded-lg text-sm transition-all text-left',
                    selectedBlock.fontFamily === font.name
                      ? 'bg-aurora-500/30 border border-aurora-500'
                      : 'bg-midnight-800/50 hover:bg-midnight-700/50'
                  )}
                  style={{ fontFamily: font.name }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>

          {/* Taille */}
          <div>
            <label className="text-xs text-midnight-400 uppercase tracking-wider mb-2 block">
              Taille : {selectedBlock.fontSize}px
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateTextBlock(selectedBlock.id, { 
                  fontSize: Math.max(12, selectedBlock.fontSize - 2) 
                })}
                className="p-2 rounded-lg bg-midnight-800/50 hover:bg-midnight-700/50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="12"
                max="120"
                value={selectedBlock.fontSize}
                onChange={(e) => updateTextBlock(selectedBlock.id, { 
                  fontSize: parseInt(e.target.value) 
                })}
                className="flex-1"
              />
              <button
                onClick={() => updateTextBlock(selectedBlock.id, { 
                  fontSize: Math.min(120, selectedBlock.fontSize + 2) 
                })}
                className="p-2 rounded-lg bg-midnight-800/50 hover:bg-midnight-700/50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Alignement */}
          <div>
            <label className="text-xs text-midnight-400 uppercase tracking-wider mb-2 block">
              Alignement
            </label>
            <div className="flex gap-2">
              {[
                { value: 'left', icon: AlignLeft },
                { value: 'center', icon: AlignCenter },
                { value: 'right', icon: AlignRight },
              ].map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => updateTextBlock(selectedBlock.id, { 
                    textAlign: value as 'left' | 'center' | 'right' 
                  })}
                  className={cn(
                    'flex-1 p-3 rounded-lg transition-all',
                    selectedBlock.textAlign === value
                      ? 'bg-aurora-500/30 text-aurora-300'
                      : 'bg-midnight-800/50 hover:bg-midnight-700/50'
                  )}
                >
                  <Icon className="w-5 h-5 mx-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Couleur */}
          <div>
            <label className="text-xs text-midnight-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
              <Palette className="w-3 h-3" />
              Couleur
            </label>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => updateTextBlock(selectedBlock.id, { color })}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                    selectedBlock.color === color 
                      ? 'border-aurora-500 scale-110' 
                      : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={selectedBlock.color}
                onChange={(e) => updateTextBlock(selectedBlock.id, { color: e.target.value })}
                className="w-8 h-8 rounded-full cursor-pointer"
              />
            </div>
          </div>

          {/* Rotation */}
          <div>
            <label className="text-xs text-midnight-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
              <RotateCw className="w-3 h-3" />
              Rotation : {selectedBlock.rotation}°
            </label>
            <input
              type="range"
              min="-45"
              max="45"
              value={selectedBlock.rotation}
              onChange={(e) => updateTextBlock(selectedBlock.id, { 
                rotation: parseInt(e.target.value) 
              })}
              className="w-full"
            />
          </div>

          {/* Opacité */}
          <div>
            <label className="text-xs text-midnight-400 uppercase tracking-wider mb-2 block">
              Opacité : {Math.round(selectedBlock.opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={selectedBlock.opacity * 100}
              onChange={(e) => updateTextBlock(selectedBlock.id, { 
                opacity: parseInt(e.target.value) / 100 
              })}
              className="w-full"
            />
          </div>

          {/* Ombre */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-midnight-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Ombre portée
            </label>
            <button
              onClick={() => updateTextBlock(selectedBlock.id, { 
                shadow: !selectedBlock.shadow 
              })}
              className={cn(
                'w-12 h-6 rounded-full transition-colors relative',
                selectedBlock.shadow ? 'bg-aurora-500' : 'bg-midnight-700'
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform',
                selectedBlock.shadow ? 'translate-x-6' : 'translate-x-0.5'
              )} />
            </button>
          </div>

          {/* Supprimer */}
          <button
            onClick={() => deleteTextBlock(selectedBlock.id)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer le texte
          </button>
        </motion.div>
      )}

      {!selectedBlock && currentPage.textBlocks.length > 0 && (
        <p className="text-sm text-midnight-400 text-center">
          Clique sur un texte pour le modifier
        </p>
      )}
    </div>
  )
}

