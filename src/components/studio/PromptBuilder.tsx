'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Wand2, 
  AlertCircle,
  CheckCircle,
  Lightbulb,
  CloudSun,
  Moon,
  Zap,
  CloudRain,
  Stars,
  Eye,
  Sun,
  Flame,
  CircleDot
} from 'lucide-react'
import { useStudioStore, type StyleType, type AmbianceType, type LightType } from '@/store/useStudioStore'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

// Options de style avec icônes et couleurs
const styleOptions: { id: StyleType; label: string; emoji: string; color: string }[] = [
  { id: 'dessin', label: 'Dessin', emoji: '✏️', color: 'from-amber-500 to-orange-600' },
  { id: 'photo', label: 'Photo', emoji: '📷', color: 'from-slate-500 to-slate-700' },
  { id: 'magique', label: 'Magique', emoji: '✨', color: 'from-aurora-500 to-aurora-700' },
  { id: 'anime', label: 'Anime', emoji: '🌸', color: 'from-pink-500 to-rose-600' },
  { id: 'aquarelle', label: 'Aquarelle', emoji: '🎨', color: 'from-cyan-500 to-blue-600' },
  { id: 'pixel', label: 'Pixel Art', emoji: '👾', color: 'from-green-500 to-emerald-600' },
]

// Options d'ambiance
const ambianceOptions: { id: AmbianceType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'jour', label: 'Jour', icon: <CloudSun className="w-5 h-5" />, color: 'from-sky-400 to-blue-500' },
  { id: 'nuit', label: 'Nuit', icon: <Moon className="w-5 h-5" />, color: 'from-indigo-600 to-purple-800' },
  { id: 'orage', label: 'Orage', icon: <Zap className="w-5 h-5" />, color: 'from-gray-600 to-slate-800' },
  { id: 'brume', label: 'Brume', icon: <CloudRain className="w-5 h-5" />, color: 'from-gray-400 to-slate-500' },
  { id: 'feerique', label: 'Féérique', icon: <Stars className="w-5 h-5" />, color: 'from-fuchsia-500 to-purple-600' },
  { id: 'mystere', label: 'Mystère', icon: <Eye className="w-5 h-5" />, color: 'from-violet-700 to-purple-900' },
]

// Options de lumière
const lightOptions: { id: LightType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'soleil', label: 'Soleil', icon: <Sun className="w-5 h-5" />, color: 'from-yellow-400 to-orange-500' },
  { id: 'lune', label: 'Lune', icon: <Moon className="w-5 h-5" />, color: 'from-slate-300 to-slate-500' },
  { id: 'bougie', label: 'Bougie', icon: <Flame className="w-5 h-5" />, color: 'from-orange-500 to-red-600' },
  { id: 'neon', label: 'Néon', icon: <Zap className="w-5 h-5" />, color: 'from-pink-500 to-cyan-500' },
  { id: 'aurore', label: 'Aurore', icon: <Stars className="w-5 h-5" />, color: 'from-green-400 to-purple-500' },
]

interface PromptBuilderProps {
  onComplete?: () => void
}

export function PromptBuilder({ onComplete }: PromptBuilderProps) {
  const {
    currentKit,
    updateKit,
    checkKitCompleteness,
    triggerMissionFlash,
  } = useStudioStore()

  const { currentProject } = useAppStore()
  
  const [showPreview, setShowPreview] = useState(false)
  const { complete, missing } = checkKitCompleteness()

  // Récupérer le texte du Book comme suggestion
  useEffect(() => {
    if (currentKit && !currentKit.subject && currentProject?.chapters.length) {
      const lastChapter = currentProject.chapters[currentProject.chapters.length - 1]
      if (lastChapter.content) {
        // Suggérer un extrait du texte
        const suggestion = lastChapter.content.slice(0, 100)
        updateKit({ subject: suggestion })
      }
    }
  }, [currentKit?.id])

  // Vérifier si on doit déclencher une Mission Flash
  useEffect(() => {
    if (currentKit && currentKit.subject.length > 10 && missing.length > 0) {
      const timer = setTimeout(() => {
        if (missing.includes('style')) {
          triggerMissionFlash(
            '🎨 Choisis un style !',
            'Clique sur un style pour donner une apparence à ton image. Est-ce que tu veux un dessin, une photo, ou quelque chose de magique ?'
          )
        } else if (missing.includes('ambiance')) {
          triggerMissionFlash(
            '🌤️ Quelle ambiance ?',
            'Choisis l\'ambiance de ta scène. Est-ce que ça se passe le jour, la nuit, ou peut-être pendant un orage mystérieux ?'
          )
        }
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [currentKit?.subject, missing])

  if (!currentKit) return null

  return (
    <div className="space-y-6">
      {/* Section Sujet */}
      <motion.section
        className="glass rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-stardust-400" />
          <h3 className="font-semibold text-white">Qu'est-ce que tu veux créer ?</h3>
          {currentKit.subject.length >= 5 && (
            <CheckCircle className="w-4 h-4 text-dream-400 ml-auto" />
          )}
        </div>
        
        <textarea
          value={currentKit.subject}
          onChange={(e) => updateKit({ subject: e.target.value })}
          placeholder="Décris ce que tu imagines... Par exemple : Un château sur un nuage avec des licornes"
          className="w-full h-24 resize-none bg-midnight-900/50 rounded-xl p-4 text-white placeholder:text-midnight-400 focus:ring-2 focus:ring-aurora-500/30"
          data-mentor-target="studio-subject"
        />
        
        {/* Suggestions depuis le Book */}
        {(currentProject?.chapters?.length ?? 0) > 0 && !currentKit.subject && (
          <motion.div
            className="mt-3 p-3 rounded-xl bg-aurora-500/10 border border-aurora-500/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-sm text-aurora-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Suggestion de ton histoire : cliquer pour utiliser
            </p>
          </motion.div>
        )}

        {/* Détails supplémentaires */}
        <div className="mt-4">
          <label className="text-sm text-midnight-300 mb-2 block">
            Ajoute des détails (couleurs, formes, personnages...)
          </label>
          <input
            type="text"
            value={currentKit.subjectDetails}
            onChange={(e) => updateKit({ subjectDetails: e.target.value })}
            placeholder="Ex: avec des ailes dorées, des fleurs violettes..."
            className="w-full bg-midnight-900/50 rounded-xl px-4 py-3 text-white placeholder:text-midnight-400"
            data-mentor-target="studio-details"
          />
        </div>
      </motion.section>

      {/* Section Style */}
      <motion.section
        className="glass rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Wand2 className="w-5 h-5 text-aurora-400" />
          <h3 className="font-semibold text-white">Quel style ?</h3>
          {currentKit.style && (
            <CheckCircle className="w-4 h-4 text-dream-400 ml-auto" />
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {styleOptions.map((style) => (
            <motion.button
              key={style.id}
              onClick={() => updateKit({ style: style.id })}
              className={cn(
                'relative p-4 rounded-xl text-center transition-all overflow-hidden',
                currentKit.style === style.id
                  ? 'ring-2 ring-aurora-500 bg-gradient-to-br ' + style.color
                  : 'bg-midnight-800/50 hover:bg-midnight-700/50'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              data-mentor-target={`studio-style-${style.id}`}
            >
              <span className="text-2xl block mb-1">{style.emoji}</span>
              <span className="text-sm font-medium">{style.label}</span>
              
              {currentKit.style === style.id && (
                <motion.div
                  className="absolute inset-0 bg-white/10"
                  layoutId="styleSelector"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* Section Ambiance */}
      <motion.section
        className="glass rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <CloudSun className="w-5 h-5 text-sky-400" />
          <h3 className="font-semibold text-white">Quelle ambiance ?</h3>
          {currentKit.ambiance && (
            <CheckCircle className="w-4 h-4 text-dream-400 ml-auto" />
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {ambianceOptions.map((ambiance) => (
            <motion.button
              key={ambiance.id}
              onClick={() => updateKit({ ambiance: ambiance.id })}
              className={cn(
                'relative p-4 rounded-xl text-center transition-all overflow-hidden flex flex-col items-center gap-2',
                currentKit.ambiance === ambiance.id
                  ? 'ring-2 ring-aurora-500 bg-gradient-to-br ' + ambiance.color + ' text-white'
                  : 'bg-midnight-800/50 hover:bg-midnight-700/50'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              data-mentor-target={`studio-ambiance-${ambiance.id}`}
            >
              {ambiance.icon}
              <span className="text-sm font-medium">{ambiance.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* Section Lumière */}
      <motion.section
        className="glass rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Sun className="w-5 h-5 text-stardust-400" />
          <h3 className="font-semibold text-white">Quelle lumière ?</h3>
          <span className="text-xs text-midnight-400 ml-auto">(optionnel)</span>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2">
          {lightOptions.map((light) => (
            <motion.button
              key={light.id}
              onClick={() => updateKit({ 
                light: currentKit.light === light.id ? null : light.id 
              })}
              className={cn(
                'flex-shrink-0 px-4 py-3 rounded-xl flex items-center gap-2 transition-all',
                currentKit.light === light.id
                  ? 'bg-gradient-to-r ' + light.color + ' text-white'
                  : 'bg-midnight-800/50 hover:bg-midnight-700/50'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {light.icon}
              <span className="text-sm font-medium">{light.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* Notes additionnelles */}
      <motion.section
        className="glass rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <CircleDot className="w-5 h-5 text-dream-400" />
          <h3 className="font-semibold text-white">Autre chose à ajouter ?</h3>
          <span className="text-xs text-midnight-400 ml-auto">(optionnel)</span>
        </div>
        
        <input
          type="text"
          value={currentKit.additionalNotes}
          onChange={(e) => updateKit({ additionalNotes: e.target.value })}
          placeholder="Tout ce qui te passe par la tête..."
          className="w-full bg-midnight-900/50 rounded-xl px-4 py-3 text-white placeholder:text-midnight-400"
          data-mentor-target="studio-notes"
        />
      </motion.section>

      {/* Résumé / Preview */}
      <AnimatePresence>
        {currentKit.subject.length >= 5 && (
          <motion.section
            className={cn(
              'rounded-2xl p-6 border-2',
              complete
                ? 'bg-dream-500/10 border-dream-500/30'
                : 'bg-stardust-500/10 border-stardust-500/30'
            )}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {complete ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-dream-400" />
                    <h3 className="font-semibold text-dream-300">Kit prêt !</h3>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-stardust-400" />
                    <h3 className="font-semibold text-stardust-300">
                      Il manque : {missing.join(', ')}
                    </h3>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-aurora-300 hover:text-aurora-200"
              >
                {showPreview ? 'Cacher' : 'Voir le prompt'}
              </button>
            </div>

            <AnimatePresence>
              {showPreview && (
                <motion.div
                  className="p-4 rounded-xl bg-midnight-900/50 font-mono text-sm text-midnight-200"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {currentKit.generatedPrompt || 'Le prompt apparaîtra ici...'}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

