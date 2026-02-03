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

  // Reset des refs quand l'utilisateur se déconnecte
  // (le composant ne remonte pas entre logout→login si pas de refresh)
  useEffect(() => {
    if (!user) {
      hasTriggeredRef.current = false
      hasCheckedVoiceRef.current = false
      welcomeOpenRef.current = false
    }
  }, [user])

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
  //
  // IMPORTANT: speechSynthesis.getVoices() peut retourner une liste PARTIELLE
  // au premier appel (voix système uniquement). Les voix premium/enhanced
  // arrivent plus tard via l'event onvoiceschanged. On ne doit PAS décider
  // que la voix est absente sur la liste partielle — sinon faux positif aléatoire.
  //
  // Stratégie : si la voix est trouvée immédiatement → OK, terminé.
  // Si non trouvée → attendre onvoiceschanged (ou timeout 3s) avant de conclure.
  useEffect(() => {
    const voiceName = profile?.preferred_voice_id
    if (!profile?.ai_name || !voiceName || hasCheckedVoiceRef.current || !isInitialized) {
      return
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }

    let resolved = false

    const resolve = (voiceFound: boolean) => {
      if (resolved) return
      resolved = true
      hasCheckedVoiceRef.current = true

      if (voiceFound) {
        console.log('🎤 Voix trouvée:', voiceName)
      } else {
        console.log('🎤 Voix non disponible:', voiceName)
        const voices = window.speechSynthesis.getVoices()
        console.log('🎤 Voix disponibles:', voices.map(v => v.name).join(', '))
        setAiVoice('')
        if (!welcomeOpenRef.current) {
          welcomeOpenRef.current = true
          setVoiceOnlyMode(true)
          setShowWelcomeSequence(true)
        }
      }
    }

    const checkVoices = (isFinalCheck: boolean) => {
      if (resolved) return
      const voices = window.speechSynthesis.getVoices()
      if (voices.length === 0) return

      const voiceExists = voices.some(v => v.name === voiceName)
      if (voiceExists) {
        // Voix trouvée → résoudre immédiatement
        resolve(true)
      } else if (isFinalCheck) {
        // Check final (après onvoiceschanged ou timeout) → voix absente
        resolve(false)
      }
      // Si pas trouvée et pas final → on attend onvoiceschanged/timeout
    }

    // Check immédiat : résout seulement si la voix EST trouvée
    checkVoices(false)

    // onvoiceschanged : la liste complète est disponible → check final
    window.speechSynthesis.onvoiceschanged = () => checkVoices(true)

    // Fallback : si onvoiceschanged ne se déclenche jamais (certains navigateurs)
    const fallback = setTimeout(() => checkVoices(true), 3000)

    return () => {
      clearTimeout(fallback)
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
