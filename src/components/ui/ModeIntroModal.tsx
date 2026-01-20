'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Rocket, 
  Star, 
  Wand2,
  BookOpen,
  Palette,
  Film,
  Theater,
  Printer,
  Target,
  ArrowRight,
  Check,
  Volume2,
  VolumeX
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

export type ModeType = 'writing' | 'studio' | 'montage' | 'theater' | 'publish' | 'challenge'

interface ModeIntroContent {
  icon: React.ReactNode
  title: string
  subtitle: string
  description: string
  objectives: string[]
  levels: {
    title: string
    description: string
  }[]
  reward: string
  gradient: string
  accentColor: string
}

const MODE_CONTENT: Record<ModeType, ModeIntroContent> = {
  writing: {
    icon: <BookOpen className="w-12 h-12" />,
    title: "L'Atelier d'Écriture",
    subtitle: "Deviens un conteur magique",
    description: "Ici, tu vas apprendre à raconter des histoires incroyables avec l'aide de ton assistante magique. Elle t'apprendra les 5 Questions Magiques pour créer des récits qui captivent tout le monde !",
    objectives: [
      "Apprendre à poser les bonnes questions pour construire une histoire",
      "Développer ton imagination avec des personnages et des mondes uniques",
      "Maîtriser l'art de parler aux intelligences artificielles"
    ],
    levels: [
      { title: "Curieux", description: "Tu découvres les bases avec ton amie magique qui te guide" },
      { title: "Apprenti", description: "Tu commences à utiliser les 5 Questions Magiques" },
      { title: "Créateur", description: "Tu crées des histoires de plus en plus riches" },
      { title: "Conteur", description: "Tu maîtrises l'art de raconter" },
      { title: "Maître IA", description: "Tu peux créer des histoires avec n'importe quelle IA !" }
    ],
    reward: "Tu pourras créer des histoires extraordinaires et parler à toutes les IA du monde avec tes nouvelles compétences !",
    gradient: "from-aurora-500 to-dream-500",
    accentColor: "aurora"
  },
  studio: {
    icon: <Palette className="w-12 h-12" />,
    title: "Le Studio Créatif",
    subtitle: "Transforme tes idées en images",
    description: "Dans ce studio magique, tu vas apprendre à créer des images et des vidéos incroyables juste avec des mots ! Les 5 Clés Magiques t'aideront à devenir un vrai artiste numérique.",
    objectives: [
      "Apprendre à décrire précisément ce que tu imagines",
      "Découvrir les secrets du style, de l'ambiance et de la lumière",
      "Créer des images dignes d'un artiste professionnel"
    ],
    levels: [
      { title: "Explorateur", description: "Tu découvres comment l'IA comprend tes mots" },
      { title: "Artiste", description: "Tu apprends les 5 Clés : Style, Héros, Ambiance..." },
      { title: "Créateur", description: "Tu utilises de vrais outils d'IA comme fal.ai" },
      { title: "Expert", description: "Tu crées des œuvres complexes et détaillées" },
      { title: "Maître", description: "Tu peux créer n'importe quelle image imaginable !" }
    ],
    reward: "Tu sauras créer des images et vidéos magnifiques avec n'importe quel outil d'IA, comme un vrai professionnel !",
    gradient: "from-stardust-500 to-aurora-500",
    accentColor: "stardust"
  },
  montage: {
    icon: <Film className="w-12 h-12" />,
    title: "La Table de Montage",
    subtitle: "Deviens réalisateur de films",
    description: "Ici, tu vas assembler tes créations pour en faire de véritables films ! Ajoute de la musique, des effets sonores, des voix et des animations pour donner vie à tes histoires.",
    objectives: [
      "Apprendre à organiser des scènes comme un réalisateur",
      "Synchroniser images, sons et musiques",
      "Créer des émotions avec le rythme et les effets"
    ],
    levels: [
      { title: "Débutant", description: "Tu découvres comment créer ta première scène" },
      { title: "Monteur", description: "Tu apprends à enchaîner les scènes" },
      { title: "Réalisateur", description: "Tu maîtrises le son et la musique" },
      { title: "Cinéaste", description: "Tu crées des montages complexes" },
      { title: "Producteur", description: "Tu réalises des films complets !" }
    ],
    reward: "Tu pourras créer des films entiers avec musique, voix et effets spéciaux, comme un vrai réalisateur !",
    gradient: "from-dream-500 to-midnight-400",
    accentColor: "dream"
  },
  theater: {
    icon: <Theater className="w-12 h-12" />,
    title: "Le Théâtre",
    subtitle: "Présente tes créations au monde",
    description: "Le rideau se lève ! C'est ici que tu peux regarder tes films en grand écran et les montrer à ta famille et tes amis. Installe-toi confortablement, le spectacle va commencer !",
    objectives: [
      "Découvrir tes créations comme au cinéma",
      "Partager tes histoires avec les gens que tu aimes",
      "Voir le résultat final de tout ton travail"
    ],
    levels: [
      { title: "Spectateur", description: "Tu regardes tes premières créations" },
      { title: "Présentateur", description: "Tu montres tes films à ta famille" },
      { title: "Artiste", description: "Tu présentes avec fierté tes œuvres" }
    ],
    reward: "Tu vivras la magie de voir tes histoires prendre vie sur grand écran !",
    gradient: "from-golden-500 to-aurora-500",
    accentColor: "golden"
  },
  publish: {
    icon: <Printer className="w-12 h-12" />,
    title: "L'Imprimerie Magique",
    subtitle: "Transforme tes histoires en vrais livres",
    description: "Incroyable ! Ici, tu peux transformer ton histoire numérique en un vrai livre que tu pourras tenir dans tes mains, offrir ou garder précieusement dans ta bibliothèque.",
    objectives: [
      "Choisir le format parfait pour ton livre",
      "Vérifier que tout est prêt pour l'impression",
      "Commander un vrai livre imprimé"
    ],
    levels: [
      { title: "Éditeur", description: "Tu prépares ton livre pour l'impression" },
      { title: "Auteur", description: "Tu reçois ton premier livre imprimé" },
      { title: "Écrivain", description: "Tu as plusieurs livres à ton actif !" }
    ],
    reward: "Tu auras un vrai livre avec ton nom dessus, comme un vrai auteur !",
    gradient: "from-emerald-500 to-teal-500",
    accentColor: "emerald"
  },
  challenge: {
    icon: <Target className="w-12 h-12" />,
    title: "L'Arène des Défis",
    subtitle: "Entraîne-toi à parler aux IA",
    description: "Bienvenue dans l'arène ! Ici, tu vas t'entraîner à écrire des prompts comme un pro. Reproduis des images, crée des variations, et deviens un expert en communication avec les IA !",
    objectives: [
      "Apprendre à observer et décrire précisément une image",
      "Comprendre quels mots l'IA comprend le mieux",
      "Maîtriser l'art de modifier un prompt pour changer le résultat"
    ],
    levels: [
      { title: "Découverte", description: "Tu apprends à observer les détails" },
      { title: "Facile", description: "Tu reproduis des images simples" },
      { title: "Intermédiaire", description: "Tu crées des variations complexes" },
      { title: "Avancé", description: "Tu maîtrises les atmosphères et styles" },
      { title: "Expert", description: "Tu peux reproduire n'importe quelle image !" }
    ],
    reward: "Tu sauras parler parfaitement aux IA et créer exactement ce que tu imagines !",
    gradient: "from-rose-500 to-orange-500",
    accentColor: "rose"
  }
}

interface ModeIntroModalProps {
  mode: ModeType
  isOpen: boolean
  onClose: () => void
}

export function ModeIntroModal({ mode, isOpen, onClose }: ModeIntroModalProps) {
  const content = MODE_CONTENT[mode]
  const [currentStep, setCurrentStep] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(true) // Activé par défaut
  const [isCurrentlySpeaking, setIsCurrentlySpeaking] = useState(false)
  const { aiVoice } = useAppStore()
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  
  // Fonction pour lire un texte avec la voix sélectionnée
  const speak = useCallback((text: string) => {
    if (!isSpeaking || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    
    // Arrêter toute lecture en cours
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'fr-FR'
    utterance.rate = 0.95
    utterance.pitch = 1.1
    
    // Utiliser la voix sélectionnée
    const voices = window.speechSynthesis.getVoices()
    const selectedVoice = voices.find(v => v.name === aiVoice) 
      || voices.find(v => v.name.includes('Audrey'))
      || voices.find(v => v.name.includes('Amélie'))
      || voices.find(v => v.lang.startsWith('fr'))
    
    if (selectedVoice) {
      utterance.voice = selectedVoice
    }
    
    utterance.onstart = () => setIsCurrentlySpeaking(true)
    utterance.onend = () => setIsCurrentlySpeaking(false)
    utterance.onerror = () => setIsCurrentlySpeaking(false)
    
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [isSpeaking, aiVoice])
  
  // Arrêter la lecture
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsCurrentlySpeaking(false)
    }
  }, [])
  
  // Toggle lecture
  const toggleSpeaking = () => {
    if (isCurrentlySpeaking) {
      stopSpeaking()
    }
    setIsSpeaking(!isSpeaking)
  }
  
  // Obtenir le texte à lire pour chaque étape
  const getTextForStep = useCallback((step: number): string => {
    switch (step) {
      case 0:
        return `${content.title}. ${content.subtitle}. ${content.description}`
      case 1:
        return `Ton parcours d'apprentissage. Voici les étapes que tu vas franchir : ${content.levels.map((l, i) => `Niveau ${i + 1}, ${l.title}: ${l.description}`).join('. ')}`
      case 2:
        return `Ce que tu vas accomplir : ${content.reward}`
      default:
        return ''
    }
  }, [content])
  
  // Lire automatiquement quand on change d'étape
  useEffect(() => {
    if (isOpen && isSpeaking) {
      // Petit délai pour laisser l'animation se faire
      const timeout = setTimeout(() => {
        speak(getTextForStep(currentStep))
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [isOpen, currentStep, isSpeaking, speak, getTextForStep])
  
  // Arrêter la lecture quand on ferme le modal
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking()
    }
  }, [isOpen, stopSpeaking])
  
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
    }
  }, [isOpen])

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-midnight-950/90 backdrop-blur-xl"
            onClick={handleSkip}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-gradient-to-b from-midnight-800 to-midnight-900 rounded-3xl shadow-2xl overflow-hidden border border-midnight-700/50"
          >
            {/* Gradient header */}
            <div className={cn(
              "h-2 w-full bg-gradient-to-r",
              content.gradient
            )} />

            {/* Bouton lecture vocale */}
            <motion.button
              onClick={toggleSpeaking}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "absolute top-6 right-6 p-3 rounded-full transition-all z-10",
                isSpeaking
                  ? "bg-aurora-500/20 text-aurora-400 hover:bg-aurora-500/30"
                  : "bg-midnight-700/50 text-midnight-400 hover:bg-midnight-700"
              )}
              title={isSpeaking ? "Couper la voix" : "Activer la voix"}
            >
              {isSpeaking ? (
                <Volume2 className={cn("w-5 h-5", isCurrentlySpeaking && "animate-pulse")} />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </motion.button>

            {/* Content */}
            <div className="p-8">
              <AnimatePresence mode="wait">
                {/* Step 0: Introduction */}
                {currentStep === 0 && (
                  <motion.div
                    key="intro"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="text-center"
                  >
                    {/* Icon with glow */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className={cn(
                        "mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-lg",
                        content.gradient
                      )}
                    >
                      <div className="text-white">
                        {content.icon}
                      </div>
                    </motion.div>

                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-3xl font-display font-bold text-white mb-2"
                    >
                      {content.title}
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className={cn(
                        "text-lg font-medium mb-6",
                        `text-${content.accentColor}-400`
                      )}
                    >
                      {content.subtitle}
                    </motion.p>

                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-midnight-300 text-lg leading-relaxed mb-8"
                    >
                      {content.description}
                    </motion.p>

                    {/* Objectives */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-3 text-left"
                    >
                      {content.objectives.map((objective, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className="flex items-start gap-3"
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                            `bg-${content.accentColor}-500/20`
                          )}>
                            <Star className={cn("w-3.5 h-3.5", `text-${content.accentColor}-400`)} />
                          </div>
                          <span className="text-midnight-200">{objective}</span>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                )}

                {/* Step 1: Levels */}
                {currentStep === 1 && (
                  <motion.div
                    key="levels"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="text-center mb-8">
                      <Rocket className={cn("w-10 h-10 mx-auto mb-4", `text-${content.accentColor}-400`)} />
                      <h3 className="text-2xl font-display font-bold text-white mb-2">
                        Ton parcours d'apprentissage
                      </h3>
                      <p className="text-midnight-400">
                        Voici les étapes que tu vas franchir
                      </p>
                    </div>

                    {/* Level progression */}
                    <div className="space-y-4">
                      {content.levels.map((level, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border transition-all",
                            index === 0 
                              ? `bg-${content.accentColor}-500/10 border-${content.accentColor}-500/30` 
                              : "bg-midnight-800/50 border-midnight-700/50"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                            index === 0
                              ? `bg-${content.accentColor}-500 text-white`
                              : "bg-midnight-700 text-midnight-400"
                          )}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className={cn(
                              "font-semibold",
                              index === 0 ? "text-white" : "text-midnight-300"
                            )}>
                              {level.title}
                            </div>
                            <div className="text-sm text-midnight-400">
                              {level.description}
                            </div>
                          </div>
                          {index === 0 && (
                            <div className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium",
                              `bg-${content.accentColor}-500/20 text-${content.accentColor}-400`
                            )}>
                              Tu es ici
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Reward */}
                {currentStep === 2 && (
                  <motion.div
                    key="reward"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="text-center"
                  >
                    {/* Celebration icon */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-golden-400 to-golden-600 flex items-center justify-center mb-6 shadow-lg shadow-golden-500/30"
                    >
                      <Sparkles className="w-10 h-10 text-white" />
                    </motion.div>

                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl font-display font-bold text-white mb-4"
                    >
                      Ce que tu vas accomplir
                    </motion.h3>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-br from-golden-500/10 to-golden-600/5 border border-golden-500/20 rounded-2xl p-6 mb-8"
                    >
                      <p className="text-golden-200 text-lg leading-relaxed">
                        {content.reward}
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center justify-center gap-2 text-midnight-400"
                    >
                      <Wand2 className="w-5 h-5" />
                      <span>Prêt à commencer l'aventure ?</span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-midnight-700/50">
                {/* Progress dots */}
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((step) => (
                    <button
                      key={step}
                      onClick={() => setCurrentStep(step)}
                      className={cn(
                        "w-2.5 h-2.5 rounded-full transition-all",
                        currentStep === step
                          ? `bg-${content.accentColor}-500 w-6`
                          : "bg-midnight-600 hover:bg-midnight-500"
                      )}
                    />
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 text-midnight-400 hover:text-midnight-200 transition-colors"
                  >
                    Passer
                  </button>
                  <motion.button
                    onClick={handleNext}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "px-6 py-3 rounded-xl font-semibold text-white flex items-center gap-2 shadow-lg transition-all",
                      `bg-gradient-to-r ${content.gradient} hover:shadow-xl`
                    )}
                  >
                    {currentStep === 2 ? (
                      <>
                        <span>C'est parti !</span>
                        <Sparkles className="w-5 h-5" />
                      </>
                    ) : (
                      <>
                        <span>Suivant</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook pour gérer la première visite
export function useFirstVisit(mode: ModeType) {
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const key = `mode_intro_seen_${mode}`
    const seen = localStorage.getItem(key)
    setIsFirstVisit(!seen)
    setIsLoading(false)
  }, [mode])

  const markAsSeen = () => {
    const key = `mode_intro_seen_${mode}`
    localStorage.setItem(key, 'true')
    setIsFirstVisit(false)
  }

  return { isFirstVisit, isLoading, markAsSeen }
}
