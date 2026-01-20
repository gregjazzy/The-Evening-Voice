'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Image,
  Mic,
  Video,
  Search,
  Shield,
  AlertTriangle,
  Rocket
} from 'lucide-react'
import { useStudioStore, toolUrls } from '@/store/useStudioStore'
import { useMentorStore } from '@/store/useMentorStore'
import { cn } from '@/lib/utils'

// Définition des outils avec leurs infos
const tools = [
  {
    id: 'gemini' as const,
    name: 'Gemini',
    description: 'Demande de l\'aide à l\'IA de Google',
    icon: Search,
    color: 'from-blue-500 to-cyan-500',
    emoji: '🔮',
    forType: ['image', 'voice', 'video'],
  },
  {
    id: 'midjourney' as const,
    name: 'fal.ai Images',
    description: 'Crée des images incroyables',
    icon: Image,
    color: 'from-aurora-500 to-purple-600',
    emoji: '🎨',
    forType: ['image'],
  },
  {
    id: 'elevenlabs' as const,
    name: 'ElevenLabs',
    description: 'Donne une voix à tes personnages',
    icon: Mic,
    color: 'from-dream-500 to-teal-600',
    emoji: '🎙️',
    forType: ['voice'],
  },
  {
    id: 'runway' as const,
    name: 'fal.ai Vidéos',
    description: 'Transforme en vidéo animée',
    icon: Video,
    color: 'from-stardust-500 to-orange-600',
    emoji: '🎬',
    forType: ['video'],
  },
]

interface SafariBridgeProps {
  onBridgeOpen?: (tool: string) => void
}

export function SafariBridge({ onBridgeOpen }: SafariBridgeProps) {
  const {
    currentKit,
    checkKitCompleteness,
    prepareBridge,
    openBridge,
    triggerMissionFlash,
  } = useStudioStore()

  const { isConnected, role, controlActive } = useMentorStore()
  
  const [copiedTool, setCopiedTool] = useState<string | null>(null)
  const [pendingBridge, setPendingBridge] = useState<string | null>(null)
  const [showMentorValidation, setShowMentorValidation] = useState(false)

  const { complete, missing } = checkKitCompleteness()

  // Filtrer les outils selon le type de création
  const availableTools = currentKit
    ? tools.filter((t) => t.forType.includes(currentKit.creationType))
    : tools

  const handleToolClick = async (toolId: typeof tools[number]['id']) => {
    // Vérifier si le kit est complet
    if (!complete) {
      triggerMissionFlash(
        '⚠️ Kit incomplet !',
        `Il te manque encore : ${missing.join(', ')}. Complète ton kit avant de partir sur Safari !`
      )
      return
    }

    // Si mentor connecté et enfant, demander validation
    if (isConnected && role === 'child' && !currentKit?.isValidatedByMentor) {
      setShowMentorValidation(true)
      setPendingBridge(toolId)
      return
    }

    await launchBridge(toolId)
  }

  const launchBridge = async (toolId: typeof tools[number]['id']) => {
    // Préparer le bridge et copier le prompt
    const bridgeId = prepareBridge(toolId)
    
    const { currentKit } = useStudioStore.getState()
    if (!currentKit) return

    try {
      // Copier le prompt dans le presse-papier
      await navigator.clipboard.writeText(currentKit.generatedPrompt)
      setCopiedTool(toolId)
      
      // Feedback visuel
      setTimeout(() => setCopiedTool(null), 3000)

      // Ouvrir Safari après un court délai
      setTimeout(() => {
        openBridge(bridgeId)
        window.open(toolUrls[toolId], '_blank')
        onBridgeOpen?.(toolId)
      }, 500)
      
    } catch (err) {
      console.error('Erreur clipboard:', err)
      triggerMissionFlash(
        '📋 Copie manuelle',
        'Sélectionne le texte du prompt et copie-le avec Cmd+C avant de partir'
      )
    }
  }

  const handleMentorValidation = (approved: boolean) => {
    setShowMentorValidation(false)
    if (approved && pendingBridge) {
      launchBridge(pendingBridge as typeof tools[number]['id'])
    }
    setPendingBridge(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Rocket className="w-5 h-5 text-aurora-400" />
        <h3 className="font-semibold text-white">Passerelles Safari</h3>
        {isConnected && role === 'child' && (
          <span className="ml-auto text-xs text-dream-400 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Supervision active
          </span>
        )}
      </div>

      <p className="text-sm text-midnight-300 mb-4">
        Choisis un outil. Le prompt sera copié automatiquement et Safari s'ouvrira sur la bonne page.
      </p>

      {/* Grille des outils */}
      <div className="grid grid-cols-2 gap-3">
        {availableTools.map((tool) => {
          const isDisabled = !currentKit || !complete
          const isCopied = copiedTool === tool.id
          
          return (
            <motion.button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              disabled={isDisabled}
              className={cn(
                'relative p-5 rounded-2xl text-left transition-all overflow-hidden group',
                isDisabled
                  ? 'bg-midnight-800/30 opacity-50 cursor-not-allowed'
                  : 'glass hover:border-aurora-500/30'
              )}
              whileHover={!isDisabled ? { scale: 1.02 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              data-mentor-target={`safari-bridge-${tool.id}`}
            >
              {/* Fond gradient au hover */}
              {!isDisabled && (
                <div 
                  className={cn(
                    'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity',
                    tool.color
                  )}
                />
              )}

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
                    tool.color
                  )}>
                    <tool.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {isCopied ? (
                      <motion.div
                        key="copied"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex items-center gap-1 text-dream-400 text-xs"
                      >
                        <Check className="w-4 h-4" />
                        Copié !
                      </motion.div>
                    ) : (
                      <motion.div
                        key="external"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-midnight-400 group-hover:text-aurora-400 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <h4 className="font-semibold text-white mb-1 flex items-center gap-2">
                  <span>{tool.emoji}</span>
                  {tool.name}
                </h4>
                <p className="text-sm text-midnight-300">{tool.description}</p>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Message si kit incomplet */}
      {!complete && currentKit && (
        <motion.div
          className="p-4 rounded-xl bg-stardust-500/10 border border-stardust-500/30 flex items-start gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertTriangle className="w-5 h-5 text-stardust-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-stardust-300 font-medium">
              Complète ton kit d'abord !
            </p>
            <p className="text-xs text-midnight-400 mt-1">
              Il manque : {missing.join(', ')}
            </p>
          </div>
        </motion.div>
      )}

      {/* Preview du prompt */}
      {currentKit && currentKit.generatedPrompt && (
        <motion.div
          className="glass rounded-xl p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-midnight-400 uppercase tracking-wider">
              Prompt prêt
            </span>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(currentKit.generatedPrompt)
                setCopiedTool('manual')
                setTimeout(() => setCopiedTool(null), 2000)
              }}
              className="flex items-center gap-1 text-xs text-aurora-400 hover:text-aurora-300"
            >
              {copiedTool === 'manual' ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copiedTool === 'manual' ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <p className="font-mono text-xs text-midnight-200 line-clamp-3">
            {currentKit.generatedPrompt}
          </p>
        </motion.div>
      )}

      {/* Modal de validation Mentor */}
      <AnimatePresence>
        {showMentorValidation && (
          <motion.div
            className="fixed inset-0 z-[9998] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div 
              className="absolute inset-0 bg-midnight-950/80 backdrop-blur-sm"
              onClick={() => handleMentorValidation(false)}
            />
            
            <motion.div
              className="relative glass rounded-3xl p-8 max-w-md mx-4 text-center"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-aurora-500/30 to-dream-500/30 flex items-center justify-center">
                <Shield className="w-8 h-8 text-aurora-400" />
              </div>
              
              <h3 className="font-display text-xl text-white mb-2">
                Attends ton mentor !
              </h3>
              <p className="text-midnight-300 mb-6">
                Ton mentor doit valider ton Kit de Sortie avant que tu partes sur Safari. 
                C'est pour s'assurer que tu es bien préparée ! 🎒
              </p>

              <div className="flex gap-3 justify-center">
                <motion.button
                  onClick={() => handleMentorValidation(false)}
                  className="px-6 py-3 rounded-xl bg-midnight-800/50 text-midnight-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Attendre
                </motion.button>
                
                {/* En mode démo, permettre de continuer */}
                {!controlActive && (
                  <motion.button
                    onClick={() => handleMentorValidation(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-aurora-600 to-aurora-700 text-white font-semibold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continuer (démo)
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

