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
import { useTranslations, useLocale } from '@/lib/i18n/context'

export type ModeType = 'writing' | 'studio' | 'montage' | 'theater' | 'publish' | 'challenge'

interface ModeIntroContent {
  icon: React.ReactNode
  objectives: string[]
  levels: {
    title: string
    description: string
  }[]
  gradient: string
  accentColor: string
}

const MODE_CONTENT: Record<ModeType, ModeIntroContent> = {
  writing: {
    icon: <BookOpen className="w-12 h-12" />,
    objectives: ['objective0', 'objective1', 'objective2'],
    levels: [
      { title: 'level0Title', description: 'level0Desc' },
      { title: 'level1Title', description: 'level1Desc' },
      { title: 'level2Title', description: 'level2Desc' },
      { title: 'level3Title', description: 'level3Desc' },
      { title: 'level4Title', description: 'level4Desc' },
    ],
    gradient: "from-aurora-500 to-dream-500",
    accentColor: "aurora"
  },
  studio: {
    icon: <Palette className="w-12 h-12" />,
    objectives: ['objective0', 'objective1', 'objective2'],
    levels: [
      { title: 'level0Title', description: 'level0Desc' },
      { title: 'level1Title', description: 'level1Desc' },
      { title: 'level2Title', description: 'level2Desc' },
      { title: 'level3Title', description: 'level3Desc' },
      { title: 'level4Title', description: 'level4Desc' },
    ],
    gradient: "from-stardust-500 to-aurora-500",
    accentColor: "stardust"
  },
  montage: {
    icon: <Film className="w-12 h-12" />,
    objectives: ['objective0', 'objective1', 'objective2'],
    levels: [
      { title: 'level0Title', description: 'level0Desc' },
      { title: 'level1Title', description: 'level1Desc' },
      { title: 'level2Title', description: 'level2Desc' },
      { title: 'level3Title', description: 'level3Desc' },
      { title: 'level4Title', description: 'level4Desc' },
    ],
    gradient: "from-dream-500 to-midnight-400",
    accentColor: "dream"
  },
  theater: {
    icon: <Theater className="w-12 h-12" />,
    objectives: ['objective0', 'objective1', 'objective2'],
    levels: [
      { title: 'level0Title', description: 'level0Desc' },
      { title: 'level1Title', description: 'level1Desc' },
      { title: 'level2Title', description: 'level2Desc' },
    ],
    gradient: "from-golden-500 to-aurora-500",
    accentColor: "golden"
  },
  publish: {
    icon: <Printer className="w-12 h-12" />,
    objectives: ['objective0', 'objective1', 'objective2'],
    levels: [
      { title: 'level0Title', description: 'level0Desc' },
      { title: 'level1Title', description: 'level1Desc' },
      { title: 'level2Title', description: 'level2Desc' },
    ],
    gradient: "from-emerald-500 to-teal-500",
    accentColor: "emerald"
  },
  challenge: {
    icon: <Target className="w-12 h-12" />,
    objectives: ['objective0', 'objective1', 'objective2'],
    levels: [
      { title: 'level0Title', description: 'level0Desc' },
      { title: 'level1Title', description: 'level1Desc' },
      { title: 'level2Title', description: 'level2Desc' },
      { title: 'level3Title', description: 'level3Desc' },
      { title: 'level4Title', description: 'level4Desc' },
    ],
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
  const t = useTranslations('modeIntro')
  const locale = useLocale()

  // Fonction pour lire un texte avec la voix sélectionnée
  const speak = useCallback((text: string) => {
    if (!isSpeaking || typeof window === 'undefined' || !('speechSynthesis' in window)) return

    // Arrêter toute lecture en cours
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = locale === 'en' ? 'en-US' : locale === 'ru' ? 'ru-RU' : 'fr-FR'
    utterance.rate = 0.95
    utterance.pitch = 1.1

    // Utiliser la voix sélectionnée
    const voices = window.speechSynthesis.getVoices()
    const selectedVoice = voices.find(v => v.name === aiVoice)
      || (locale === 'en' ? voices.find(v => v.lang.startsWith('en')) :
          locale === 'ru' ? voices.find(v => v.lang.startsWith('ru')) :
          voices.find(v => v.name.includes('Audrey')) || voices.find(v => v.name.includes('Amélie')) || voices.find(v => v.lang.startsWith('fr')))

    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    utterance.onstart = () => setIsCurrentlySpeaking(true)
    utterance.onend = () => setIsCurrentlySpeaking(false)
    utterance.onerror = () => setIsCurrentlySpeaking(false)

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [isSpeaking, aiVoice, locale])

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
        return `${t(`${mode}.title`)}. ${t(`${mode}.subtitle`)}. ${t(`${mode}.description`)}`
      case 1:
        return `${t('learningPath')}. ${t('stepsToFollow')}: ${content.levels.map((_, i) => `${t('level')} ${i + 1}, ${t(`${mode}.level${i}Title`)}: ${t(`${mode}.level${i}Desc`)}`).join('. ')}`
      case 2:
        return `${t('whatYouWillAccomplish')}: ${t(`${mode}.reward`)}`
      default:
        return ''
    }
  }, [content, t, mode])

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
              title={isSpeaking ? t('muteVoice') : t('enableVoice')}
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
                      {t(`${mode}.title`)}
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
                      {t(`${mode}.subtitle`)}
                    </motion.p>

                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-midnight-300 text-lg leading-relaxed mb-8"
                    >
                      {t(`${mode}.description`)}
                    </motion.p>

                    {/* Objectives */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-3 text-left"
                    >
                      {content.objectives.map((_, index) => (
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
                          <span className="text-midnight-200">{t(`${mode}.objective${index}`)}</span>
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
                        {t('learningPath')}
                      </h3>
                      <p className="text-midnight-400">
                        {t('stepsToFollow')}
                      </p>
                    </div>

                    {/* Level progression */}
                    <div className="space-y-4">
                      {content.levels.map((_, index) => (
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
                              {t(`${mode}.level${index}Title`)}
                            </div>
                            <div className="text-sm text-midnight-400">
                              {t(`${mode}.level${index}Desc`)}
                            </div>
                          </div>
                          {index === 0 && (
                            <div className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium",
                              `bg-${content.accentColor}-500/20 text-${content.accentColor}-400`
                            )}>
                              {t('youAreHere')}
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
                      {t('whatYouWillAccomplish')}
                    </motion.h3>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-br from-golden-500/10 to-golden-600/5 border border-golden-500/20 rounded-2xl p-6 mb-8"
                    >
                      <p className="text-golden-200 text-lg leading-relaxed">
                        {t(`${mode}.reward`)}
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center justify-center gap-2 text-midnight-400"
                    >
                      <Wand2 className="w-5 h-5" />
                      <span>{t('readyToStart')}</span>
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
                    {t('skip')}
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
                        <span>{t('letsGo')}</span>
                        <Sparkles className="w-5 h-5" />
                      </>
                    ) : (
                      <>
                        <span>{t('next')}</span>
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
