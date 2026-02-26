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
  Film,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useLocale } from '@/lib/i18n/context'
import { VoiceSelector } from '@/components/ui/VoiceSelector'
import { useTTS } from '@/hooks/useTTS'
import { useHighlightStore } from '@/store/useHighlightStore'
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

interface MontageAIChatProps {
  className?: string
}

export function MontageAIChat({ className }: MontageAIChatProps) {
  const { aiName } = useAppStore()
  const { aiVoice } = useAppStore()
  const locale = useLocale()
  const tts = useTTS(locale, aiVoice || undefined)
  const { highlightMultiple } = useHighlightStore()

  const speech = useSpeechRecognition(locale)

  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [showVoiceSelector, setShowVoiceSelector] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const friendName = aiName || (locale === 'fr' ? 'Luna' : locale === 'en' ? 'Luna' : 'Луна')
  const firstName = (useAppStore.getState().userName || '').split(' ')[0]

  // Message d'intro
  useEffect(() => {
    const greeting = locale === 'fr'
      ? `Salut${firstName ? ` ${firstName}` : ''} ! Je suis là pour t'aider avec le montage. Demande-moi comment faire !`
      : locale === 'en'
      ? `Hey${firstName ? ` ${firstName}` : ''}! I'm here to help with the montage. Ask me how to do things!`
      : `Привет${firstName ? ` ${firstName}` : ''}! Я помогу с монтажом. Спрашивай, как что-то сделать!`

    setMessages([{
      id: 'intro',
      role: 'ai',
      content: greeting,
      timestamp: new Date(),
    }])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Détection hors-ligne
  useEffect(() => {
    setIsOffline(!navigator.onLine)

    const handleOnline = () => {
      setIsOffline(false)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: locale === 'fr' ? 'De retour en ligne !' : locale === 'en' ? 'Back online!' : 'Снова онлайн!',
        timestamp: new Date(),
      }])
    }

    const handleOffline = () => {
      setIsOffline(true)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: locale === 'fr' ? 'Pas de connexion... Je ne peux pas t\'aider pour le moment.' : locale === 'en' ? 'No connection... I can\'t help right now.' : 'Нет связи... Не могу помочь сейчас.',
        timestamp: new Date(),
      }])
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup
  useEffect(() => {
    return () => {
      tts.stop()
      speech.stopListening()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Transcript sync
  useEffect(() => {
    if (speech.transcript) {
      setInputValue(speech.transcript)
    }
  }, [speech.transcript])

  // Auto-send on speech end
  const sendMessageRef = useRef<(text: string) => void>(() => {})
  const prevListeningRef = useRef(false)
  useEffect(() => {
    if (prevListeningRef.current && !speech.isListening && speech.transcript.trim()) {
      sendMessageRef.current(speech.transcript.trim())
    }
    prevListeningRef.current = speech.isListening
  }, [speech.isListening, speech.transcript])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text || isLoading) return

    const userMessage = text
    setInputValue('')

    const childMessage: Message = {
      id: Date.now().toString(),
      role: 'child',
      content: userMessage,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, childMessage])
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
          context: 'montage',
          currentMode: 'montage',
          locale,
          chatHistory,
          aiName: friendName,
          userName: useAppStore.getState().userName,
        }),
      })

      if (!response.ok) throw new Error('Erreur API')

      const data = await response.json()

      // Déclencher les highlights si présents
      if (data.highlights && data.highlights.length > 0) {
        highlightMultiple(data.highlights)
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.text || data.response || (locale === 'fr' ? "Je n'ai pas compris." : locale === 'en' ? "I didn't understand." : 'Не понял.'),
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
        'glass rounded-2xl flex flex-col overflow-hidden',
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
            : "bg-gradient-to-br from-dream-500 to-aurora-500"
        )}>
          {isOffline ? (
            <WifiOff className="w-4 h-4 text-white" />
          ) : (
            <Film className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm truncate">{friendName}</h3>
          <p className={cn(
            "text-xs truncate",
            isOffline ? "text-amber-300" : "text-dream-300"
          )}>
            {isOffline
              ? (locale === 'fr' ? 'Hors ligne' : locale === 'en' ? 'Offline' : 'Оффлайн')
              : (locale === 'fr' ? 'Aide montage' : locale === 'en' ? 'Montage help' : 'Помощь с монтажом')}
          </p>
        </div>
        <button
          onClick={() => setShowVoiceSelector(!showVoiceSelector)}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            showVoiceSelector
              ? 'bg-dream-500/20 text-dream-300'
              : 'bg-midnight-800/50 text-midnight-400 hover:text-white'
          )}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={toggleVoice}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            voiceEnabled
              ? 'bg-dream-500/20 text-dream-300'
              : 'bg-midnight-800/50 text-midnight-400'
          )}
        >
          {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Voice selector */}
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

      {/* Offline banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/30 px-4 py-2"
          >
            <p className="text-xs text-amber-200 text-center">
              {locale === 'fr' ? 'Mode hors-ligne — connexion nécessaire' : locale === 'en' ? 'Offline mode — connection needed' : 'Оффлайн — нужно подключение'}
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
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-dream-500/30">
                  <HelpCircle className="w-4 h-4 text-dream-400" />
                </div>
              )}

              <div className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3',
                message.role === 'ai' && 'bg-midnight-800/70 text-white',
                message.role === 'child' && 'bg-dream-500/20 text-white',
              )}>
                <p className="text-sm whitespace-pre-line">{message.content}</p>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-dream-500/30">
                <Loader2 className="w-4 h-4 text-dream-400 animate-spin" />
              </div>
              <div className="bg-midnight-800/70 rounded-2xl px-4 py-3">
                <p className="text-sm text-midnight-300">
                  {locale === 'fr' ? 'Je réfléchis...' : locale === 'en' ? 'Thinking...' : 'Думаю...'}
                </p>
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
            placeholder={speech.isListening
              ? (locale === 'fr' ? 'Je t\'écoute...' : locale === 'en' ? 'Listening...' : 'Слушаю...')
              : isOffline
              ? (locale === 'fr' ? 'Pas de connexion...' : locale === 'en' ? 'No connection...' : 'Нет связи...')
              : (locale === 'fr' ? 'Une question sur le montage ?' : locale === 'en' ? 'Question about the montage?' : 'Вопрос о монтаже?')}
            className="flex-1 bg-midnight-800/50 rounded-xl px-4 py-3 text-white placeholder:text-midnight-500 text-sm focus:outline-none focus:ring-2 focus:ring-dream-500/30"
          />

          <motion.button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={cn(
              'p-3 rounded-xl transition-colors',
              inputValue.trim() && !isLoading
                ? 'bg-dream-500 text-white hover:bg-dream-600'
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
