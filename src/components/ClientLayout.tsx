'use client'

import { ReactNode, useState, useEffect } from 'react'
import { MentorProvider } from './mentor/MentorProvider'
import { ToastProvider } from './ui/Toast'
import { AINameModal } from './ui/AINameModal'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'

interface ClientLayoutProps {
  children: ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { aiName } = useAppStore()
  const { user, isInitialized } = useAuthStore()
  const [showNameModal, setShowNameModal] = useState(false)

  // Afficher le modal de choix de nom à la première connexion
  useEffect(() => {
    // Attendre que l'auth soit initialisée et que l'utilisateur soit connecté
    if (isInitialized && user && !aiName) {
      // Petit délai pour laisser l'app se charger
      const timer = setTimeout(() => {
        setShowNameModal(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isInitialized, user, aiName])

  return (
    <ToastProvider>
      <MentorProvider>
        {children}
        
        {/* Modal pour choisir le nom de l'IA à la première connexion */}
        <AINameModal
          isOpen={showNameModal}
          onClose={() => setShowNameModal(false)}
          isFirstTime={true}
        />
      </MentorProvider>
    </ToastProvider>
  )
}

