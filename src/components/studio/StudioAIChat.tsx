'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  Loader2,
  WifiOff,
  Settings,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useLocale, useTranslations } from '@/lib/i18n/context'
import { VoiceSelector } from '@/components/ui/VoiceSelector'
import { type CreationType } from '@/store/useStudioProgressStore'
import { useTTS } from '@/hooks/useTTS'
import { cn } from '@/lib/utils'


// ============================================
// HOOK: Reconnaissance vocale (Speech-to-Text)
// ============================================
function useSpeechRecognition(locale: string = 'fr') {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef<any>(null)
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsSupported(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    setIsSupported(true)
    if (hasInitialized.current) return
    hasInitialized.current = true

    try {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'ru-RU'

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript)
        }
      }

      recognitionRef.current.onerror = () => setIsListening(false)
      recognitionRef.current.onend = () => setIsListening(false)
    } catch {
      setIsSupported(false)
    }

    return () => {
      try { recognitionRef.current?.stop() } catch { /* ignore */ }
    }
  }, [locale])

  const startListening = async () => {
    if (!recognitionRef.current || isListening) return

    // Electron: demander permission micro
    if ((window as any).electronAPI?.requestMicrophoneAccess) {
      try {
        const granted = await (window as any).electronAPI.requestMicrophoneAccess()
        if (!granted) return
      } catch { /* ignore */ }
    }

    setTranscript('')
    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch { /* ignore */ }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  return { isListening, isSupported, transcript, startListening, stopListening }
}


interface Message {
  id: string
  role: 'ai' | 'child'
  content: string
  timestamp: Date
}

interface StudioAIChatProps {
  type: CreationType
  onSuggestion?: (suggestion: string) => void
  className?: string
}

export function StudioAIChat({ type, className }: StudioAIChatProps) {
  const { aiName } = useAppStore()
  const { aiVoice } = useAppStore()
  const locale = useLocale()
  const t = useTranslations('studio')
  const tts = useTTS(locale, aiVoice || undefined)

  // Reconnaissance vocale
  const speech = useSpeechRecognition(locale)

  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [showVoiceSelector, setShowVoiceSelector] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Nom de l'IA (ou défaut)
  const friendName = aiName || t('chat.defaultName')
  const firstName = (useAppStore.getState().userName || '').split(' ')[0]

  // Message d'intro — technique uniquement
  useEffect(() => {
    const greeting = locale === 'fr'
      ? `Salut${firstName ? ` ${firstName}` : ''} ! Si tu as une question sur l'outil, je suis là !`
      : locale === 'en'
      ? `Hey${firstName ? ` ${firstName}` : ''}! If you have a question about the tool, I'm here!`
      : `Привет${firstName ? ` ${firstName}` : ''}! Если есть вопрос об инструменте, я тут!`

    setMessages([{
      id: 'intro',
      role: 'ai',
      content: greeting,
      timestamp: new Date(),
    }])
  }, [type]) // Reset when switching image/video

  // ============================================
  // DÉTECTION DU MODE HORS-LIGNE
  // ============================================
  useEffect(() => {
    setIsOffline(!navigator.onLine)

    const handleOnline = () => {
      setIsOffline(false)
      const onlineMessage: Message = {
        id: Date.now().toString(),
        role: 'ai',
        content: t('chat.backOnline'),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, onlineMessage])
    }

    const handleOffline = () => {
      setIsOffline(true)
      const offlineMessage: Message = {
        id: Date.now().toString(),
        role: 'ai',
        content: t('chat.offlineGreeting'),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, offlineMessage])
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Arrêter la voix et le micro quand on quitte
  useEffect(() => {
    return () => {
      tts.stop()
      speech.stopListening()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Afficher le transcript en temps réel dans l'input
  useEffect(() => {
    if (speech.transcript) {
      setInputValue(speech.transcript)
    }
  }, [speech.transcript])

  // Ref pour toujours avoir la dernière version de sendMessage
  const sendMessageRef = useRef<(text: string) => void>(() => {})

  // Quand la reconnaissance vocale s'arrête, envoyer automatiquement
  const prevListeningRef = useRef(false)
  useEffect(() => {
    if (prevListeningRef.current && !speech.isListening && speech.transcript.trim()) {
      sendMessageRef.current(speech.transcript.trim())
    }
    prevListeningRef.current = speech.isListening
  }, [speech.isListening, speech.transcript])

  // Scroll vers le bas quand nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text || isLoading) return

    const userMessage = text
    setInputValue('')

    // Ajouter le message de l'enfant
    const childMessage: Message = {
      id: Date.now().toString(),
      role: 'child',
      content: userMessage,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, childMessage])

    // Appeler l'API de chat
    setIsLoading(true)

    try {
      const chatHistory = messages.slice(-10).map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content,
      }))

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: 'studio',
          locale,
          chatHistory,
          aiName: friendName,
          userName: useAppStore.getState().userName,
          studioContext: { type },
        }),
      })

      if (!response.ok) throw new Error('Erreur API')

      const data = await response.json()

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.text || data.response || t('chat.notUnderstood'),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiResponse])

      if (voiceEnabled && tts.isAvailable) {
        tts.speak(aiResponse.content)
      }
    } catch (error) {
      console.error('Erreur chat IA:', error)

      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: locale === 'fr'
          ? "Désolé, je n'ai pas pu répondre. Réessaie !"
          : locale === 'en'
          ? "Sorry, I couldn't respond. Try again!"
          : "Извини, не смог ответить. Попробуй ещё раз!",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, fallbackMessage])

      if (voiceEnabled && tts.isAvailable) {
        tts.speak(fallbackMessage.content)
      }
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  // Mettre à jour la ref
  sendMessageRef.current = sendMessage

  const handleSend = () => sendMessage(inputValue.trim())

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled)
    if (voiceEnabled) {
      tts.stop()
    }
  }

  return (
    <motion.div
      className={cn(
        'glass rounded-2xl flex flex-col h-full max-h-full overflow-hidden',
        className
      )}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-midnight-700/50">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
          isOffline
            ? "bg-gradient-to-br from-amber-500 to-orange-500"
            : "bg-gradient-to-br from-aurora-500 to-dream-500"
        )}>
          {isOffline ? (
            <WifiOff className="w-4 h-4 text-white" />
          ) : (
            <Sparkles className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm truncate">{friendName}</h3>
          <p className={cn(
            "text-xs truncate",
            isOffline ? "text-amber-300" : "text-aurora-300"
          )}>
            {isOffline ? t('chat.offlineMode') : (locale === 'fr' ? 'Aide technique' : locale === 'en' ? 'Technical help' : 'Техническая помощь')}
          </p>
        </div>
        {/* Bouton paramètres voix */}
        <button
          onClick={() => setShowVoiceSelector(!showVoiceSelector)}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            showVoiceSelector
              ? 'bg-aurora-500/20 text-aurora-300'
              : 'bg-midnight-800/50 text-midnight-400 hover:text-white'
          )}
          title={t('chat.changeVoice')}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Bouton activer/désactiver voix */}
        <button
          onClick={toggleVoice}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            voiceEnabled
              ? 'bg-aurora-500/20 text-aurora-300'
              : 'bg-midnight-800/50 text-midnight-400'
          )}
          title={voiceEnabled ? t('chat.disableVoice') : t('chat.enableVoice')}
        >
          {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Panel sélecteur de voix */}
      <AnimatePresence>
        {showVoiceSelector && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-midnight-700/50 overflow-hidden"
          >
            <VoiceSelector className="rounded-none border-0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bannière mode hors-ligne */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/30 px-4 py-2"
          >
            <p className="text-xs text-amber-200 text-center">
              {t('chat.offlineBanner')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex gap-3',
                message.role === 'child' && 'justify-end'
              )}
            >
              {message.role === 'ai' && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-aurora-500/30">
                  <HelpCircle className="w-4 h-4 text-aurora-400" />
                </div>
              )}

              <div className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3',
                message.role === 'ai' && 'bg-midnight-800/70 text-white',
                message.role === 'child' && 'bg-aurora-500/20 text-white',
              )}>
                <p className="text-sm whitespace-pre-line">{message.content}</p>
              </div>
            </motion.div>
          ))}

          {/* Indicateur de chargement */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-aurora-500/30">
                <Loader2 className="w-4 h-4 text-aurora-400 animate-spin" />
              </div>
              <div className="bg-midnight-800/70 rounded-2xl px-4 py-3">
                <p className="text-sm text-midnight-300">{t('chat.thinking')}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t border-midnight-700/50">
        <div className="flex gap-2">
          {speech.isSupported && (
            <button
              onClick={() => speech.isListening ? speech.stopListening() : speech.startListening()}
              className={cn(
                'p-3 rounded-xl transition-colors',
                speech.isListening
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'bg-midnight-800/50 text-midnight-400 hover:text-white'
              )}
              title={speech.isListening ? t('chat.stop') : t('chat.speak')}
            >
              {speech.isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={speech.isListening ? t('chat.listening') : isOffline ? t('chat.placeholderOffline') : (locale === 'fr' ? 'Une question sur l\'outil ?' : locale === 'en' ? 'Question about the tool?' : 'Вопрос об инструменте?')}
            className="flex-1 bg-midnight-800/50 rounded-xl px-4 py-3 text-white placeholder:text-midnight-500 text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500/30"
          />

          <motion.button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={cn(
              'p-3 rounded-xl transition-colors',
              inputValue.trim() && !isLoading
                ? 'bg-aurora-500 text-white hover:bg-aurora-600'
                : 'bg-midnight-800/50 text-midnight-600 cursor-not-allowed'
            )}
            whileHover={inputValue.trim() && !isLoading ? { scale: 1.05 } : {}}
            whileTap={inputValue.trim() && !isLoading ? { scale: 0.95 } : {}}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </div>

    </motion.div>
  )
}
