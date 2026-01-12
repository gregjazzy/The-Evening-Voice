'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Palette, 
  Image, 
  Mic, 
  Video, 
  ArrowLeft,
  Sparkles,
  Wand2,
  Shield,
  Eye
} from 'lucide-react'
import { useStudioStore } from '@/store/useStudioStore'
import { useMentorStore } from '@/store/useMentorStore'
import { PromptBuilder } from '@/components/studio/PromptBuilder'
import { SafariBridge } from '@/components/studio/SafariBridge'
import { AssetDropzone } from '@/components/studio/AssetDropzone'
import { StudioMissionFlash } from '@/components/studio/StudioMissionFlash'
import { cn } from '@/lib/utils'

// Types de création disponibles
const creationTypes = [
  {
    id: 'image' as const,
    name: 'Images',
    description: 'Crée des illustrations avec Midjourney',
    icon: Image,
    color: 'from-aurora-500 to-aurora-700',
    available: true,
  },
  {
    id: 'voice' as const,
    name: 'Voix',
    description: 'Donne vie à tes personnages avec ElevenLabs',
    icon: Mic,
    color: 'from-dream-500 to-dream-700',
    available: true,
  },
  {
    id: 'video' as const,
    name: 'Vidéos',
    description: 'Anime tes scènes avec Runway',
    icon: Video,
    color: 'from-stardust-500 to-stardust-700',
    available: true,
  },
]

export function StudioMode() {
  const {
    currentKit,
    selectedTool,
    createNewKit,
    clearKit,
    setSelectedTool,
    importedAssets,
  } = useStudioStore()

  const { isConnected, role, controlActive } = useMentorStore()
  
  const [view, setView] = useState<'select' | 'create' | 'import'>('select')

  // Changer de vue quand un kit est créé
  useEffect(() => {
    if (currentKit) {
      setView('create')
    }
  }, [currentKit?.id])

  const handleSelectType = (type: 'image' | 'voice' | 'video') => {
    createNewKit(type)
    setView('create')
  }

  const handleBack = () => {
    if (view === 'create') {
      clearKit()
    }
    setView('select')
  }

  return (
    <div className="h-full flex flex-col">
      {/* En-tête */}
      <motion.header 
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          {view !== 'select' && (
            <motion.button
              onClick={handleBack}
              className="p-2 rounded-xl bg-midnight-800/50 text-midnight-300 hover:text-white hover:bg-midnight-700/50 transition-colors"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          )}
          
          <div>
            <h1 className="font-display text-3xl text-aurora-300 flex items-center gap-3">
              <Palette className="w-8 h-8" />
              Mon Studio de Création
            </h1>
            <p className="text-midnight-300 mt-1">
              {view === 'select' && 'Choisis ce que tu veux créer'}
              {view === 'create' && `Création ${selectedTool === 'image' ? "d'image" : selectedTool === 'voice' ? 'de voix' : 'de vidéo'}`}
              {view === 'import' && 'Importe tes créations'}
            </p>
          </div>
        </div>

        {/* Indicateurs */}
        <div className="flex items-center gap-3">
          {isConnected && role === 'child' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dream-500/20 text-dream-300 text-sm">
              <Shield className="w-4 h-4" />
              Mentor connecté
            </div>
          )}
          
          {importedAssets.length > 0 && (
            <motion.button
              onClick={() => setView('import')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-midnight-800/50 text-white hover:bg-midnight-700/50 transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              <Sparkles className="w-4 h-4 text-aurora-400" />
              {importedAssets.length} créations
            </motion.button>
          )}
        </div>
      </motion.header>

      {/* Contenu principal */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Vue de sélection */}
          {view === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              {/* Grille des types de création */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                {creationTypes.map((type, index) => (
                  <motion.button
                    key={type.id}
                    onClick={() => handleSelectType(type.id)}
                    className="relative glass rounded-3xl p-8 text-left hover:border-aurora-500/30 transition-all group overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    data-mentor-target={`studio-type-${type.id}`}
                  >
                    {/* Fond gradient au hover */}
                    <div 
                      className={cn(
                        'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity',
                        type.color
                      )} 
                    />
                    
                    <div className={cn(
                      'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br',
                      type.color
                    )}>
                      <type.icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {type.name}
                    </h3>
                    <p className="text-sm text-midnight-300">
                      {type.description}
                    </p>
                  </motion.button>
                ))}
              </div>

              {/* Zone d'import rapide */}
              <motion.div
                className="glass rounded-3xl p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <AssetDropzone />
              </motion.div>
            </motion.div>
          )}

          {/* Vue de création */}
          {view === 'create' && currentKit && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex gap-6"
            >
              {/* Panneau gauche : Formulaire de prompt */}
              <div className="flex-1 overflow-y-auto pr-2">
                <PromptBuilder />
              </div>

              {/* Panneau droit : Passerelles et actions */}
              <div className="w-96 flex flex-col gap-6">
                {/* Safari Bridges */}
                <div className="glass rounded-2xl p-6">
                  <SafariBridge />
                </div>

                {/* Zone d'import */}
                <div className="glass rounded-2xl p-6 flex-1">
                  <AssetDropzone />
                </div>
              </div>
            </motion.div>
          )}

          {/* Vue d'import/galerie */}
          {view === 'import' && (
            <motion.div
              key="import"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <div className="glass rounded-3xl p-8 h-full">
                <AssetDropzone />
                
                {/* Galerie des assets */}
                {importedAssets.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-aurora-400" />
                      Ma galerie
                    </h3>
                    
                    <div className="grid grid-cols-4 gap-4">
                      {importedAssets.filter(a => a.type === 'image').map((asset) => (
                        <motion.div
                          key={asset.id}
                          className="aspect-square rounded-xl overflow-hidden bg-midnight-800"
                          whileHover={{ scale: 1.05 }}
                        >
                          <img
                            src={asset.url}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mission Flash overlay */}
      <StudioMissionFlash />
    </div>
  )
}
