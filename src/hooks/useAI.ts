/**
 * Hook React pour interagir avec les services IA
 * Utilise le nouveau système des 5 Clés Magiques
 */

'use client'

import { useState, useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { PromptingProgress, WritingPromptingProgress } from '@/lib/ai/prompting-pedagogy'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface UseAIReturn {
  // Chat avec l'IA-Amie
  sendMessage: (message: string, context?: 'diary' | 'book' | 'studio' | 'general') => Promise<{ text: string }>
  isLoadingChat: boolean
  
  // Génération d'images
  generateImage: (description: string, style: string, ambiance: string) => Promise<string | null>
  checkImageStatus: (jobId: string) => Promise<{ status: string; imageUrl?: string }>
  isGeneratingImage: boolean
  imageProgress: number
  
  // Génération de voix
  generateVoice: (text: string, type?: 'narration' | 'ai_friend') => Promise<string | null>
  isGeneratingVoice: boolean
  
  // Génération de vidéo
  generateVideo: (imageUrl: string, ambiance: string) => Promise<string | null>
  isGeneratingVideo: boolean
  videoProgress: number
  
  // Lancement Safari avec prompt
  launchGemini: (searchTopic: string) => void
  launchMidjourney: (prompt: string) => void

  // Progression prompting (nouveau système 5 Clés)
  promptingProgress: PromptingProgress
  writingProgress: WritingPromptingProgress
}

export function useAI(): UseAIReturn {
  const { 
    chatHistory, 
    addChatMessage, 
    emotionalContext,
    promptingProgress,
    writingProgress,
    updateWritingProgress,
    currentStory,
  } = useAppStore()
  
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [imageProgress, setImageProgress] = useState(0)
  const [videoProgress, setVideoProgress] = useState(0)

  // ============================================
  // CHAT AVEC L'IA-AMIE
  // ============================================
  
  const sendMessage = useCallback(async (
    message: string,
    context: 'diary' | 'book' | 'studio' | 'general' = 'general'
  ): Promise<{ text: string }> => {
    setIsLoadingChat(true)
    
    try {
      // Ajouter le message utilisateur
      addChatMessage({ role: 'user', content: message })
      
      // Préparer l'historique pour l'API
      const history: ChatMessage[] = chatHistory.slice(-10).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))
      
      // Analyser le message de l'enfant pour la progression (en mode book)
      if (context === 'book') {
        updateWritingProgress(message)
      }
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context,
          locale: 'fr', // TODO: get from i18n context
          chatHistory: history,
          emotionalContext,
          promptingProgress,
          writingProgress,
          storyStructure: currentStory?.structure,
          storyStep: currentStory?.currentStep,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Erreur API')
      }
      
      const data = await response.json()
      
      // Ajouter la réponse de l'IA
      addChatMessage({ role: 'assistant', content: data.text })
      
      return { text: data.text }
    } catch (error) {
      console.error('Erreur chat:', error)
      const errorMessage = "Oups, j'ai eu un petit problème ! ✨ Réessaie ?"
      addChatMessage({ role: 'assistant', content: errorMessage })
      return { text: errorMessage }
    } finally {
      setIsLoadingChat(false)
    }
  }, [chatHistory, emotionalContext, promptingProgress, currentStory, addChatMessage])

  // ============================================
  // GÉNÉRATION D'IMAGES
  // ============================================
  
  const generateImage = useCallback(async (
    description: string,
    style: string,
    ambiance: string
  ): Promise<string | null> => {
    setIsGeneratingImage(true)
    setImageProgress(0)
    
    try {
      // Lancer la génération
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, style, ambiance }),
      })
      
      if (!response.ok) {
        throw new Error('Erreur génération')
      }
      
      const { jobId } = await response.json()
      
      // Polling jusqu'à completion
      let status = { status: 'pending', imageUrl: undefined as string | undefined, progress: 0 }
      while (status.status !== 'completed' && status.status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        const statusResponse = await fetch(`/api/ai/image?jobId=${jobId}`)
        status = await statusResponse.json()
        
        if (status.progress) {
          setImageProgress(status.progress)
        }
      }
      
      if (status.status === 'failed') {
        throw new Error('Génération échouée')
      }
      
      return status.imageUrl || null
    } catch (error) {
      console.error('Erreur génération image:', error)
      return null
    } finally {
      setIsGeneratingImage(false)
      setImageProgress(0)
    }
  }, [])

  const checkImageStatus = useCallback(async (jobId: string) => {
    const response = await fetch(`/api/ai/image?jobId=${jobId}`)
    return response.json()
  }, [])

  // ============================================
  // GÉNÉRATION DE VOIX
  // ============================================
  
  const generateVoice = useCallback(async (
    text: string,
    type: 'narration' | 'ai_friend' = 'narration'
  ): Promise<string | null> => {
    setIsGeneratingVoice(true)
    
    try {
      const response = await fetch('/api/ai/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, type }),
      })
      
      if (!response.ok) {
        throw new Error('Erreur génération voix')
      }
      
      const data = await response.json()
      
      // Convertir base64 en URL blob
      const audioBlob = base64ToBlob(data.audioData, data.mimeType)
      const audioUrl = URL.createObjectURL(audioBlob)
      
      return audioUrl
    } catch (error) {
      console.error('Erreur génération voix:', error)
      return null
    } finally {
      setIsGeneratingVoice(false)
    }
  }, [])

  // ============================================
  // GÉNÉRATION DE VIDÉO
  // ============================================
  
  const generateVideo = useCallback(async (
    imageUrl: string,
    ambiance: string
  ): Promise<string | null> => {
    setIsGeneratingVideo(true)
    setVideoProgress(0)
    
    try {
      const response = await fetch('/api/ai/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, ambiance }),
      })
      
      if (!response.ok) {
        throw new Error('Erreur génération vidéo')
      }
      
      const data = await response.json()
      return data.videoUrl
    } catch (error) {
      console.error('Erreur génération vidéo:', error)
      return null
    } finally {
      setIsGeneratingVideo(false)
      setVideoProgress(0)
    }
  }, [])

  // ============================================
  // LANCEMENT SAFARI
  // ============================================
  
  const launchGemini = useCallback(async (searchTopic: string) => {
    // Copier dans le presse-papier
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(searchTopic)
    }
    // Ouvrir Gemini
    window.open('https://gemini.google.com/app', '_blank')
  }, [])

  const launchMidjourney = useCallback(async (prompt: string) => {
    // Copier le prompt formaté
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(`/imagine prompt: ${prompt}`)
    }
    // Ouvrir Midjourney
    window.open('https://www.midjourney.com/imagine', '_blank')
  }, [])

  return {
    sendMessage,
    isLoadingChat,
    generateImage,
    checkImageStatus,
    isGeneratingImage,
    imageProgress,
    generateVoice,
    isGeneratingVoice,
    generateVideo,
    isGeneratingVideo,
    videoProgress,
    launchGemini,
    launchMidjourney,
    promptingProgress,
    writingProgress,
  }
}

// Utilitaire pour convertir base64 en blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64)
  const byteArrays: BlobPart[] = []
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512)
    const byteNumbers = new Array(slice.length)
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }
    
    byteArrays.push(new Uint8Array(byteNumbers) as BlobPart)
  }
  
  return new Blob(byteArrays, { type: mimeType })
}
