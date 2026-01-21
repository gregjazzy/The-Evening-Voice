'use client'

import { ReactNode, useState, useEffect, useRef } from 'react'
import { MentorProvider } from './mentor/MentorProvider'
import { ToastProvider } from './ui/Toast'
import { AIWelcomeSequence } from './ui/AIWelcomeSequence'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppConfig } from '@/hooks/useAppConfig'
import { useSyncUserPreferences } from '@/hooks/useSyncUserPreferences'

interface ClientLayoutProps {
  children: ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { aiName, aiVoice, setAiVoice } = useAppStore()
  const { isInitialized, user } = useAuthStore()
  const [showWelcomeSequence, setShowWelcomeSequence] = useState(false)
  const [voiceOnlyMode, setVoiceOnlyMode] = useState(false)
  const hasTriggeredRef = useRef(false)
  const hasCheckedVoiceRef = useRef(false)
  
  // Charger la configuration (clés API, famille) au démarrage
  useAppConfig()
  
  // Synchroniser les préférences utilisateur avec Supabase
  useSyncUserPreferences()

  // Afficher la séquence d'accueil si pas de nom d'IA ET utilisateur connecté
  useEffect(() => {
    if (hasTriggeredRef.current || aiName) {
      return
    }
    
    // IMPORTANT: Ne pas afficher l'onboarding si pas initialisé ou pas connecté
    if (!isInitialized || !user) {
      return
    }
    
    hasTriggeredRef.current = true
    
    setTimeout(() => {
      setShowWelcomeSequence(true)
      setVoiceOnlyMode(false)
    }, 1500)
  }, [isInitialized, aiName, user])

  // Vérifier si la voix sauvegardée est disponible dans ce navigateur
  useEffect(() => {
    // Ne vérifier que si on a un nom ET une voix sauvegardée
    if (!aiName || !aiVoice || hasCheckedVoiceRef.current || !isInitialized) {
      return
    }

    // Attendre que les voix soient chargées
    const checkVoiceAvailability = () => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return
      }

      const voices = window.speechSynthesis.getVoices()
      
      // Les voix peuvent ne pas être encore chargées
      if (voices.length === 0) {
        return
      }

      hasCheckedVoiceRef.current = true
      
      // Vérifier si la voix sauvegardée est disponible
      const voiceExists = voices.some(v => v.name === aiVoice)
      
      if (!voiceExists) {
        // La voix n'est pas disponible (changement de navigateur)
        console.log('🎤 Voix sauvegardée non disponible:', aiVoice)
        console.log('🎤 Voix disponibles:', voices.map(v => v.name).join(', '))
        
        // Reset la voix - NE PAS afficher la séquence si elle est déjà ouverte
        setAiVoice('')
        if (!showWelcomeSequence) {
          setVoiceOnlyMode(true)
          setShowWelcomeSequence(true)
        }
      } else {
        console.log('🎤 Voix trouvée:', aiVoice)
      }
    }

    // Vérifier immédiatement
    checkVoiceAvailability()
    
    // Et aussi quand les voix sont chargées (peut être asynchrone)
    window.speechSynthesis.onvoiceschanged = checkVoiceAvailability

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [isInitialized, aiName, aiVoice, setAiVoice])

  return (
    <ToastProvider>
      <MentorProvider>
        {children}
        
        {/* Séquence d'accueil interactive avec l'IA */}
        <AIWelcomeSequence
          isOpen={showWelcomeSequence}
          onComplete={() => setShowWelcomeSequence(false)}
          voiceOnlyMode={voiceOnlyMode}
        />
      </MentorProvider>
    </ToastProvider>
  )
}
