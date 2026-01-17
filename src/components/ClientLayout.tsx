'use client'

import { ReactNode, useState, useEffect, useRef } from 'react'
import { MentorProvider } from './mentor/MentorProvider'
import { ToastProvider } from './ui/Toast'
import { AIWelcomeSequence } from './ui/AIWelcomeSequence'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'

interface ClientLayoutProps {
  children: ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { aiName } = useAppStore()
  const { isInitialized } = useAuthStore()
  const [showWelcomeSequence, setShowWelcomeSequence] = useState(false)
  const hasTriggeredRef = useRef(false)

  // Afficher la séquence d'accueil si pas de nom d'IA
  // Fonctionne avec ou sans authentification
  useEffect(() => {
    // Ne rien faire si déjà déclenché ou si aiName existe
    if (hasTriggeredRef.current || aiName) {
      return
    }
    
    // Attendre que l'auth soit initialisée
    if (!isInitialized) {
      return
    }
    
    hasTriggeredRef.current = true
    
    // Petit délai pour laisser l'app se charger complètement
    setTimeout(() => {
      setShowWelcomeSequence(true)
    }, 1500)
  }, [isInitialized, aiName])

  return (
    <ToastProvider>
      <MentorProvider>
        {children}
        
        {/* Séquence d'accueil interactive avec l'IA */}
        <AIWelcomeSequence
          isOpen={showWelcomeSequence}
          onComplete={() => setShowWelcomeSequence(false)}
        />
      </MentorProvider>
    </ToastProvider>
  )
}

