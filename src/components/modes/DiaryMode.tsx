'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Sparkles, 
  ImagePlus, 
  Mic, 
  MicOff,
  Moon,
  Sun,
  Cloud,
  Heart,
  Star,
  Camera,
  Wand2,
  X,
  Loader2,
  Image as ImageIcon,
  Volume2,
  VolumeX
} from 'lucide-react'
import { useTTS } from '@/hooks/useTTS'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { useAppStore } from '@/store/useAppStore'
import { cn, formatDate, getGreeting, getMoodEmoji } from '@/lib/utils'

// ============================================================================
// HOOK : Reconnaissance vocale (Speech-to-Text) pour parler à Luna
// ============================================================================

interface UseSpeechRecognitionReturn {
  isListening: boolean
  isSupported: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

function useSpeechRecognition(locale: string = 'fr'): UseSpeechRecognitionReturn {
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
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
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
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch { /* ignore */ }
      }
    }
  }, [locale])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('')
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const resetTranscript = () => setTranscript('')

  return { isListening, isSupported, transcript, startListening, stopListening, resetTranscript }
}

type Mood = 'happy' | 'sad' | 'excited' | 'calm' | 'dreamy'

const moodOptions: { id: Mood; icon: React.ReactNode; label: string; color: string }[] = [
  { id: 'happy', icon: <Sun className="w-5 h-5" />, label: 'Joyeuse', color: 'from-stardust-400 to-stardust-600' },
  { id: 'sad', icon: <Cloud className="w-5 h-5" />, label: 'Triste', color: 'from-midnight-400 to-midnight-600' },
  { id: 'excited', icon: <Star className="w-5 h-5" />, label: 'Excitée', color: 'from-aurora-400 to-aurora-600' },
  { id: 'calm', icon: <Moon className="w-5 h-5" />, label: 'Calme', color: 'from-dream-400 to-dream-600' },
  { id: 'dreamy', icon: <Heart className="w-5 h-5" />, label: 'Rêveuse', color: 'from-rose-400 to-rose-600' },
]

// Réponses de l'IA-Amie (simulées pour la démo)
const aiResponses = {
  greeting: [
    "Coucou ! 🌙 Comment s'est passée ta journée ? J'ai hâte que tu me racontes !",
    "Hey ! ✨ Je suis là, prête à t'écouter. Qu'est-ce qui s'est passé aujourd'hui ?",
    "Bonsoir ! 💫 Je pensais à toi. Tu veux me raconter quelque chose ?"
  ],
  happy: [
    "Oh c'est trop génial ! 🎉 Ça me rend heureuse aussi de te voir comme ça !",
    "Wouah ! Je comprends que tu sois contente ! C'est vraiment super ce que tu me racontes ! ✨",
    "Ça fait plaisir de te voir si joyeuse ! 🌟 Continue, je veux tout savoir !"
  ],
  sad: [
    "Oh... 🌙 Je comprends que tu te sentes comme ça. Tu sais, c'est normal d'être triste parfois.",
    "Je suis là pour toi. 💜 Tu veux m'en dire plus sur ce qui te fait de la peine ?",
    "Ça va aller... 🌸 Parfois les journées sont difficiles, mais je suis là pour t'écouter."
  ],
  excited: [
    "Ouiii ! 🎊 Je sens ton excitation d'ici ! Raconte-moi tout !",
    "Trop cool ! 🚀 J'adore quand tu es aussi enthousiaste !",
    "Waouh ! ✨ Ton énergie me donne le sourire ! Continue !"
  ],
  encourage: [
    "C'est super intéressant ce que tu écris ! 📝 Tu veux ajouter plus de détails ?",
    "J'adore ta façon de raconter les choses ! Continue comme ça ! 💫",
    "Tu as vraiment du talent pour écrire ! Qu'est-ce qui s'est passé ensuite ? ✨"
  ],
  memoryImage: [
    "Tu sais quoi ? Ce que tu m'as raconté ferait une super image souvenir ! 🎨 Tu veux qu'on en crée une ensemble ?",
    "J'imagine déjà la scène que tu décris ! 🌈 Et si on en faisait une illustration pour ton journal ?",
    "Cette histoire mérite vraiment une image ! ✨ Veux-tu créer un souvenir illustré ?"
  ]
}

function getRandomResponse(category: keyof typeof aiResponses): string {
  const responses = aiResponses[category]
  return responses[Math.floor(Math.random() * responses.length)]
}

export function DiaryMode() {
  const { 
    chatHistory, 
    addChatMessage,
    clearChatHistory,
    addDiaryEntry,
    diaryEntries,
    userName,
    setUserName,
    addEmotionalContext
  } = useAppStore()

  // TTS pour que Luna parle
  const { speak, stop, isSpeaking, isAvailable: isTTSAvailable } = useTTS('fr')
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const [autoSpeak, setAutoSpeak] = useState(false) // Toggle écrit / écrit+oral
  const lastMessageIdRef = useRef<string | null>(null)

  // Hook pour uploader les médias vers Supabase Storage
  const { upload, uploadFromUrl, isUploading, progress, error: uploadError } = useMediaUpload()

  // Speech recognition pour parler à Luna
  const { 
    isListening: isListeningToUser, 
    isSupported: isSpeechSupported, 
    transcript: userTranscript, 
    startListening: startUserListening, 
    stopListening: stopUserListening, 
    resetTranscript: resetUserTranscript 
  } = useSpeechRecognition('fr')

  // Lecture automatique quand un nouveau message de Luna arrive
  useEffect(() => {
    if (!autoSpeak || !isTTSAvailable) return
    
    const lastMessage = chatHistory[chatHistory.length - 1]
    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastMessage.id
      // Petit délai pour laisser l'animation du message
      const timer = setTimeout(() => {
        speak(lastMessage.content)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [chatHistory, autoSpeak, isTTSAvailable, speak])

  // État pour le message vocal à envoyer
  const [pendingVoiceMessage, setPendingVoiceMessage] = useState<string | null>(null)
  
  // Quand l'utilisateur arrête de parler, stocker le transcript
  useEffect(() => {
    if (!isListeningToUser && userTranscript) {
      setPendingVoiceMessage(userTranscript)
      resetUserTranscript()
    }
  }, [isListeningToUser, userTranscript, resetUserTranscript])

  const handleSpeak = useCallback(async (messageId: string, text: string) => {
    if (speakingMessageId === messageId) {
      // Arrêter la lecture
      await stop()
      setSpeakingMessageId(null)
    } else {
      // Lire ce message
      setSpeakingMessageId(messageId)
      await speak(text)
      setSpeakingMessageId(null)
    }
  }, [speakingMessageId, speak, stop])

  const [diaryText, setDiaryText] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [showMemoryPrompt, setShowMemoryPrompt] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  
  // Images du journal (URLs permanentes Supabase)
  const [diaryImages, setDiaryImages] = useState<{ url: string; assetId?: string }[]>([])
  const [showImagePrompt, setShowImagePrompt] = useState(false)
  const [imagePrompt, setImagePrompt] = useState('')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  
  // Enregistrements audio (URLs permanentes Supabase)
  const [audioRecordings, setAudioRecordings] = useState<{ url: string; duration: number; assetId?: string }[]>([])
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  // Message d'accueil initial (une seule fois)
  const hasGreeted = useRef(false)
  
  useEffect(() => {
    if (chatHistory.length === 0 && !hasGreeted.current) {
      hasGreeted.current = true
      setTimeout(() => {
        addChatMessage({
          role: 'assistant',
          content: getRandomResponse('greeting')
        })
      }, 500)
    }
  }, [chatHistory.length, addChatMessage])

  // Vraie réponse IA via Gemini
  const getAIResponse = async (userMessage: string) => {
    setIsTyping(true)
    
    try {
      // Construire l'historique pour le contexte
      const history = chatHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: 'diary',
          chatHistory: history,
          emotionalContext: [selectedMood, diaryText.slice(0, 200)].filter(Boolean),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        addChatMessage({
          role: 'assistant',
          content: data.text || data.response || "Je suis là pour t'écouter ! ✨"
        })

        // Si Luna suggère une image souvenir
        if (data.suggestMemoryImage || data.text?.includes('image souvenir')) {
          setShowMemoryPrompt(true)
        }
      } else {
        // Fallback si l'API ne répond pas
        addChatMessage({
          role: 'assistant',
          content: "Oups, je rêvais un peu ! 🌙 Tu peux me répéter ?"
        })
      }
    } catch (error) {
      console.error('Erreur Luna:', error)
      addChatMessage({
        role: 'assistant',
        content: "Oh, ma magie a fait des siennes ! ✨ Réessaie ?"
      })
    } finally {
      // Ajouter au contexte émotionnel
      addEmotionalContext(userMessage.slice(0, 100))
      setIsTyping(false)
    }
  }

  // Traiter le message vocal en attente
  useEffect(() => {
    if (pendingVoiceMessage) {
      addChatMessage({
        role: 'user',
        content: pendingVoiceMessage
      })
      getAIResponse(pendingVoiceMessage)
      setPendingVoiceMessage(null)
    }
  }, [pendingVoiceMessage, addChatMessage])

  const handleSendMessage = () => {
    if (!chatInput.trim()) return
    
    addChatMessage({
      role: 'user',
      content: chatInput
    })
    
    getAIResponse(chatInput)
    setChatInput('')
  }

  const handleSaveDiary = () => {
    if (!diaryText.trim() && diaryImages.length === 0 && audioRecordings.length === 0) return
    
    addDiaryEntry({
      content: diaryText,
      mood: selectedMood || undefined,
      memoryImage: diaryImages.length > 0 ? diaryImages[0].url : undefined, // Première image comme image principale
      audioUrl: audioRecordings.length > 0 ? audioRecordings[0].url : undefined, // Premier audio
    })
    
    // Message de confirmation de l'IA
    const parts = []
    if (diaryImages.length > 0) {
      parts.push(`${diaryImages.length} jolie${diaryImages.length > 1 ? 's' : ''} image${diaryImages.length > 1 ? 's' : ''} 🖼️`)
    }
    if (audioRecordings.length > 0) {
      parts.push(`${audioRecordings.length} message${audioRecordings.length > 1 ? 's' : ''} vocal${audioRecordings.length > 1 ? 'aux' : ''} 🎙️`)
    }
    
    const mediaText = parts.length > 0 ? ` Avec ${parts.join(' et ')} !` : ''
    
    addChatMessage({
      role: 'assistant',
      content: `J'ai bien gardé ton histoire dans le journal ! ${getMoodEmoji(selectedMood || undefined)}${mediaText} C'est précieux ce que tu m'as confié. 💜`
    })
    
    setDiaryText('')
    setSelectedMood(null)
    setDiaryImages([])
    setAudioRecordings([])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Enregistrement vocal
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const duration = recordingTime
        
        // Arrêter le stream
        stream.getTracks().forEach((track) => track.stop())
        
        // Upload vers Supabase Storage
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' })
        const result = await upload(audioFile, { type: 'audio', source: 'upload' })
        
        if (result) {
          setAudioRecordings((prev) => [...prev, { url: result.url, duration, assetId: result.assetId }])
          
          // Message de Luna
          addChatMessage({
            role: 'assistant',
            content: `J'ai entendu ta belle voix ! 🎙️ Ton message vocal est sauvegardé. C'est chouette de t'entendre ! ✨`
          })
        } else {
          addChatMessage({
            role: 'assistant',
            content: `Oups ! 😅 Je n'ai pas pu sauvegarder ton message vocal. Tu peux réessayer ?`
          })
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Timer pour afficher la durée
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Erreur accès micro:', error)
      addChatMessage({
        role: 'assistant',
        content: `Oups ! 😅 Je n'arrive pas à accéder au micro. Tu peux vérifier que l'app a la permission ?`
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Supprimer un enregistrement (Note: le fichier reste sur Supabase pour l'instant)
  const handleRemoveAudio = (index: number) => {
    setAudioRecordings((prev) => prev.filter((_, i) => i !== index))
  }

  // Formater le temps en mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Ajouter une photo depuis le Mac
  const handleAddPhoto = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // Upload chaque image vers Supabase Storage
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const result = await upload(file, { type: 'image', source: 'upload' })
        if (result) {
          setDiaryImages((prev) => [...prev, { url: result.url, assetId: result.assetId }])
        }
      }
    }

    // Reset input
    e.target.value = ''
  }

  // Supprimer une image
  const handleRemoveImage = (index: number) => {
    setDiaryImages((prev) => prev.filter((_, i) => i !== index))
  }

  // Générer une image avec l'IA
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return

    setIsGeneratingImage(true)
    
    try {
      // Appel à l'API Midjourney
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: imagePrompt,
          style: 'dreamy, magical, children illustration, soft colors, whimsical'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.imageUrl) {
          // Télécharger et uploader l'image vers Supabase Storage
          const result = await uploadFromUrl(data.imageUrl, { 
            type: 'image', 
            source: 'midjourney' 
          })
          
          if (result) {
            setDiaryImages((prev) => [...prev, { url: result.url, assetId: result.assetId }])
            
            // Message de Luna
            addChatMessage({
              role: 'assistant',
              content: `Tadaa ! 🎨 J'ai créé une image magique pour ton journal ! "${imagePrompt}" - Elle est jolie, non ? ✨`
            })
          }
        }
      } else {
        // Fallback : ouvrir Midjourney dans Safari
        addChatMessage({
          role: 'assistant',
          content: `Je vais t'aider à créer cette image ! 🎨 Je copie ton idée et j'ouvre Midjourney pour toi...`
        })
        
        // Copier le prompt et ouvrir Safari
        navigator.clipboard.writeText(`${imagePrompt}, dreamy magical children illustration, soft colors, whimsical --ar 16:9`)
        window.open('https://www.midjourney.com', '_blank')
      }
    } catch (error) {
      console.error('Erreur génération image:', error)
      addChatMessage({
        role: 'assistant',
        content: `Oups ! 😅 Je n'ai pas pu créer l'image. Mais tu peux essayer sur Midjourney avec cette idée : "${imagePrompt}"`
      })
    } finally {
      setIsGeneratingImage(false)
      setShowImagePrompt(false)
      setImagePrompt('')
    }
  }

  return (
    <div className="h-full flex gap-6">
      {/* Zone du Journal (Carnet) */}
      <motion.section 
        className="flex-1 flex flex-col glass rounded-3xl p-6 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl text-aurora-300 mb-1">
              Mon Journal Secret
            </h1>
            <p className="text-sm text-midnight-300">
              {formatDate(new Date())} • {getGreeting()}
            </p>
          </div>
          
          {/* Sélecteur d'humeur */}
          <div className="flex gap-2">
            {moodOptions.map((mood) => (
              <motion.button
                key={mood.id}
                onClick={() => setSelectedMood(mood.id)}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  selectedMood === mood.id 
                    ? `bg-gradient-to-br ${mood.color} text-white shadow-glow`
                    : 'bg-midnight-800/50 text-midnight-300 hover:text-white hover:bg-midnight-700/50'
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title={mood.label}
              >
                {mood.icon}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Zone d'écriture */}
        <div className="flex-1 relative flex flex-col">
          <textarea
            ref={textareaRef}
            value={diaryText}
            onChange={(e) => setDiaryText(e.target.value)}
            placeholder="Écris ici tes pensées, tes rêves, tes secrets... ✨"
            className="diary-textarea flex-1 w-full resize-none bg-midnight-900/30 rounded-2xl p-6 focus:ring-2 focus:ring-aurora-500/30"
          />
          
          {/* Galerie d'images et enregistrements */}
          {(diaryImages.length > 0 || audioRecordings.length > 0) && (
            <div className="mt-4 space-y-3">
              {/* Images */}
              {diaryImages.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {diaryImages.map((img, index) => (
                    <motion.div
                      key={img.assetId || `img-${index}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group"
                    >
                      <img
                        src={img.url}
                        alt={`Image ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-xl border-2 border-aurora-500/30"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Enregistrements audio */}
              {audioRecordings.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {audioRecordings.map((audio, index) => (
                    <motion.div
                      key={audio.assetId || `audio-${index}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group flex items-center gap-2 px-3 py-2 bg-aurora-900/30 rounded-xl border border-aurora-500/30"
                    >
                      <div className="w-8 h-8 rounded-full bg-aurora-500/30 flex items-center justify-center">
                        <Mic className="w-4 h-4 text-aurora-300" />
                      </div>
                      <audio src={audio.url} controls className="h-8 max-w-[150px]" />
                      <span className="text-xs text-aurora-400">{formatTime(audio.duration)}</span>
                      <button
                        onClick={() => handleRemoveAudio(index)}
                        className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Compteur de mots et médias + indicateur d'upload */}
          <div className="absolute bottom-4 right-4 text-xs text-midnight-400 flex items-center gap-2">
            {isUploading && (
              <span className="flex items-center gap-1 text-aurora-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                {progress}%
              </span>
            )}
            <span>
              {diaryText.split(/\s+/).filter(Boolean).length} mots
              {diaryImages.length > 0 && ` • ${diaryImages.length} 🖼️`}
              {audioRecordings.length > 0 && ` • ${audioRecordings.length} 🎙️`}
            </span>
          </div>
        </div>

        {/* Modal génération d'image IA */}
        <AnimatePresence>
          {showImagePrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-midnight-900/95 border border-aurora-500/30 rounded-2xl p-6 max-w-md w-full mx-4"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aurora-400 to-stardust-500 flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Créer une image magique</h3>
                    <p className="text-xs text-aurora-300">Décris ce que tu veux voir ✨</p>
                  </div>
                </div>

                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Ex: Un château dans les nuages avec des licornes..."
                  className="w-full h-24 bg-midnight-800/50 rounded-xl p-4 text-sm resize-none focus:ring-2 focus:ring-aurora-500/30 mb-4"
                  autoFocus
                />

                <div className="flex gap-3">
                  <motion.button
                    onClick={() => {
                      setShowImagePrompt(false)
                      setImagePrompt('')
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-midnight-800/50 text-midnight-300 hover:bg-midnight-700/50 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Annuler
                  </motion.button>
                  <motion.button
                    onClick={handleGenerateImage}
                    disabled={!imagePrompt.trim() || isGeneratingImage}
                    className={cn(
                      'flex-1 btn-magic flex items-center justify-center gap-2',
                      (!imagePrompt.trim() || isGeneratingImage) && 'opacity-50'
                    )}
                    whileHover={imagePrompt.trim() && !isGeneratingImage ? { scale: 1.02 } : {}}
                    whileTap={imagePrompt.trim() && !isGeneratingImage ? { scale: 0.98 } : {}}
                  >
                    {isGeneratingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Créer !
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-4">
          {/* Input fichier caché */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Bouton enregistrement vocal */}
          <motion.button
            onClick={toggleRecording}
            className={cn(
              'p-3 rounded-full transition-all flex items-center gap-2',
              isRecording 
                ? 'bg-rose-500 text-white animate-pulse pr-4' 
                : 'bg-midnight-800/50 text-midnight-300 hover:bg-midnight-700/50 hover:text-aurora-300'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isRecording ? 'Arrêter l\'enregistrement' : 'Enregistrer un message vocal'}
          >
            {isRecording ? (
              <>
                <MicOff className="w-5 h-5" />
                <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
              </>
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </motion.button>

          {/* Bouton ajouter photo */}
          <motion.button
            onClick={handleAddPhoto}
            className="p-3 rounded-full bg-midnight-800/50 text-midnight-300 hover:bg-midnight-700/50 hover:text-aurora-300 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Ajouter une photo"
          >
            <Camera className="w-5 h-5" />
          </motion.button>

          {/* Bouton générer image IA */}
          <motion.button
            onClick={() => setShowImagePrompt(true)}
            className="p-3 rounded-full bg-gradient-to-br from-aurora-600/50 to-stardust-600/50 text-white hover:from-aurora-500/50 hover:to-stardust-500/50 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Créer une image magique avec l'IA"
          >
            <Wand2 className="w-5 h-5" />
          </motion.button>

          <div className="flex-1" />

          <motion.button
            onClick={handleSaveDiary}
            disabled={!diaryText.trim() && diaryImages.length === 0 && audioRecordings.length === 0}
            className={cn(
              'btn-magic flex items-center gap-2',
              (!diaryText.trim() && diaryImages.length === 0 && audioRecordings.length === 0) && 'opacity-50 cursor-not-allowed'
            )}
            whileHover={(diaryText.trim() || diaryImages.length > 0 || audioRecordings.length > 0) ? { scale: 1.02 } : {}}
            whileTap={(diaryText.trim() || diaryImages.length > 0 || audioRecordings.length > 0) ? { scale: 0.98 } : {}}
          >
            <Sparkles className="w-4 h-4" />
            Garder ce souvenir
          </motion.button>
        </div>
      </motion.section>

      {/* Zone Chat IA */}
      <motion.section 
        className="w-96 flex flex-col glass rounded-3xl overflow-hidden"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* En-tête du chat */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aurora-400 to-aurora-600 flex items-center justify-center floating">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">Luna</h3>
              <p className="text-xs text-aurora-300">Ta copine magique ✨</p>
            </div>
            {/* Toggle Écrit / Écrit + Oral */}
            {isTTSAvailable && (
              <button
                onClick={() => {
                  if (autoSpeak) stop() // Arrêter si on désactive
                  setAutoSpeak(!autoSpeak)
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  autoSpeak
                    ? 'bg-aurora-500/20 text-aurora-300 border border-aurora-500/30'
                    : 'bg-midnight-700/50 text-midnight-400 border border-midnight-600/30 hover:text-midnight-300'
                )}
                title={autoSpeak ? 'Luna parle automatiquement' : 'Luna écrit seulement'}
              >
                <Volume2 className="w-3.5 h-3.5" />
                {autoSpeak ? 'Oral' : 'Écrit'}
              </button>
            )}
            {chatHistory.length > 1 && (
              <button
                onClick={clearChatHistory}
                className="p-2 rounded-lg text-midnight-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Effacer la conversation"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {chatHistory.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn('chat-message', message.role)}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                {/* Bouton écouter pour les messages de Luna */}
                {message.role === 'assistant' && isTTSAvailable && (
                  <button
                    onClick={() => handleSpeak(message.id, message.content)}
                    className={cn(
                      'mt-2 p-1.5 rounded-full transition-all',
                      speakingMessageId === message.id
                        ? 'bg-aurora-500/30 text-aurora-300'
                        : 'bg-midnight-700/30 text-midnight-400 hover:text-aurora-300 hover:bg-aurora-500/20'
                    )}
                    title={speakingMessageId === message.id ? 'Arrêter' : 'Écouter Luna'}
                  >
                    {speakingMessageId === message.id ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Indicateur de frappe */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="chat-message assistant"
            >
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-aurora-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-aurora-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-aurora-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}

          {/* Prompt Image Souvenir */}
          <AnimatePresence>
            {showMemoryPrompt && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-4 rounded-2xl bg-gradient-to-br from-aurora-500/20 to-stardust-500/20 border border-aurora-500/30"
              >
                <p className="text-sm mb-3">Veux-tu créer une image souvenir de ce moment ? 🎨</p>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => {
                      setShowMemoryPrompt(false)
                      // TODO: Navigation vers Studio
                    }}
                    className="flex-1 btn-magic py-2 text-sm flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ImagePlus className="w-4 h-4" />
                    Oui !
                  </motion.button>
                  <motion.button
                    onClick={() => setShowMemoryPrompt(false)}
                    className="px-4 py-2 rounded-xl bg-midnight-800/50 text-sm hover:bg-midnight-700/50 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Plus tard
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={chatEndRef} />
        </div>

        {/* Input du chat */}
        <div className="p-4 border-t border-white/5">
          <div className="flex gap-2">
            <input
              type="text"
              value={isListeningToUser ? 'J\'écoute...' : chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Parle-moi..."
              disabled={isListeningToUser}
              className="flex-1 bg-midnight-900/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-aurora-500/30 disabled:opacity-50"
            />
            {/* Bouton micro pour parler à Luna */}
            <motion.button
              onClick={isListeningToUser ? stopUserListening : startUserListening}
              disabled={!isSpeechSupported}
              className={cn(
                'p-3 rounded-xl transition-colors',
                !isSpeechSupported
                  ? 'bg-midnight-800/30 text-midnight-600 cursor-not-allowed'
                  : isListeningToUser 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'bg-midnight-800/50 text-midnight-400 hover:text-aurora-300 hover:bg-midnight-700/50'
              )}
              animate={isListeningToUser ? { scale: [1, 1.1, 1] } : {}}
              transition={isListeningToUser ? { repeat: Infinity, duration: 0.8 } : {}}
              title={!isSpeechSupported ? 'Non supporté' : isListeningToUser ? 'Arrêter' : 'Parler à Luna'}
            >
              {isListeningToUser ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </motion.button>
            <motion.button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isListeningToUser}
              className={cn(
                'p-3 rounded-xl bg-gradient-to-br from-aurora-500 to-aurora-700 text-white',
                (!chatInput.trim() || isListeningToUser) && 'opacity-50'
              )}
              whileHover={chatInput.trim() && !isListeningToUser ? { scale: 1.05 } : {}}
              whileTap={chatInput.trim() && !isListeningToUser ? { scale: 0.95 } : {}}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

