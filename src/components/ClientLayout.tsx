'use client'

import { ReactNode, useState, useEffect, useRef } from 'react'
import { MentorProvider } from './mentor/MentorProvider'
import { ToastProvider } from './ui/Toast'
import { GlobalNotifications } from './ui/GlobalNotifications'
import { AIWelcomeSequence } from './ui/AIWelcomeSequence'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppConfig } from '@/hooks/useAppConfig'
import { useSyncUserPreferences } from '@/hooks/useSyncUserPreferences'

interface ClientLayoutProps {
  children: ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { setAiVoice } = useAppStore()
  const { isInitialized, user, profile } = useAuthStore()
  const [showWelcomeSequence, setShowWelcomeSequence] = useState(false)
  const [voiceOnlyMode, setVoiceOnlyMode] = useState(false)
  const hasTriggeredRef = useRef(false)
  const hasCheckedVoiceRef = useRef(false)
  const welcomeOpenRef = useRef(false)

  // Charger la configuration (clés API, famille) au démarrage
  useAppConfig()

  // Synchroniser les préférences utilisateur avec Supabase
  useSyncUserPreferences()

  // Afficher la séquence d'accueil si pas de nom d'IA ET utilisateur connecté
  // On vérifie profile.ai_name directement (source de vérité Supabase)
  // au lieu de aiName du store Zustand (qui dépend du sync async et du localStorage
  // vidé à la déconnexion — cause de race condition après logout→refresh→login)
  useEffect(() => {
    if (hasTriggeredRef.current) return
    if (!isInitialized || !user || !profile) return
    if (profile.ai_name) return

    hasTriggeredRef.current = true

    const timer = setTimeout(() => {
      welcomeOpenRef.current = true
      setShowWelcomeSequence(true)
      setVoiceOnlyMode(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [isInitialized, user, profile])

  // Vérifier si la voix sauvegardée est disponible dans ce navigateur
  // On utilise profile.preferred_voice_id directement (source de vérité Supabase)
  useEffect(() => {
    const voiceName = profile?.preferred_voice_id
    if (!profile?.ai_name || !voiceName || hasCheckedVoiceRef.current || !isInitialized) {
      return
    }

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
      const voiceExists = voices.some(v => v.name === voiceName)

      if (!voiceExists) {
        // La voix n'est pas disponible (changement de navigateur)
        console.log('🎤 Voix sauvegardée non disponible:', voiceName)
        console.log('🎤 Voix disponibles:', voices.map(v => v.name).join(', '))

        // Reset la voix - NE PAS afficher la séquence si elle est déjà ouverte
        setAiVoice('')
        if (!welcomeOpenRef.current) {
          welcomeOpenRef.current = true
          setVoiceOnlyMode(true)
          setShowWelcomeSequence(true)
        }
      } else {
        console.log('🎤 Voix trouvée:', voiceName)
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
  }, [isInitialized, profile, setAiVoice])

  return (
    <ToastProvider>
      <MentorProvider>
        {children}
        
        {/* Séquence d'accueil interactive avec l'IA */}
        <AIWelcomeSequence
          isOpen={showWelcomeSequence}
          onComplete={() => { welcomeOpenRef.current = false; setShowWelcomeSequence(false) }}
          voiceOnlyMode={voiceOnlyMode}
        />
        
        {/* Notifications globales (erreurs de sync, etc.) */}
        <GlobalNotifications />
      </MentorProvider>
    </ToastProvider>
  )
}
