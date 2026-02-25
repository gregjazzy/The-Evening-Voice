'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sidebar } from '@/components/navigation/Sidebar'
import { MainContent } from '@/components/MainContent'
import { MentorProvider } from '@/components/mentor'
import { ChildRemoteStatus } from '@/components/remote'
import { ElectronIndicator } from '@/components/modes/CollabMode'
import { StarsBackground } from '@/components/ui/StarsBackground'
import { useAppStore } from '@/store/useAppStore'
import { usePublishStore } from '@/store/usePublishStore'

/**
 * Gérer le retour Stripe (?checkout=success ou ?checkout=cancelled)
 * Doit être dans un Suspense boundary pour useSearchParams
 */
function CheckoutHandler() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout')
    if (!checkoutStatus) return

    if (checkoutStatus === 'success') {
      usePublishStore.getState().clearCart()
      usePublishStore.getState().setCurrentStep('checkout-success')
      useAppStore.getState().setCurrentMode('publish')
    } else if (checkoutStatus === 'cancelled') {
      usePublishStore.getState().setCurrentStep('cart')
      useAppStore.getState().setCurrentMode('publish')
    }

    // Nettoyer les params de l'URL
    const url = new URL(window.location.href)
    url.searchParams.delete('checkout')
    url.searchParams.delete('session_id')
    url.searchParams.delete('type')
    window.history.replaceState({}, '', url.toString())
  }, [searchParams])

  return null
}

/**
 * Page principale de l'application
 * Le contenu est géré par MainContent basé sur le mode sélectionné
 */
export default function HomePage() {
  return (
    <MentorProvider>
      {/* Retour Stripe checkout */}
      <Suspense fallback={null}>
        <CheckoutHandler />
      </Suspense>

      {/* Fond étoilé (ne re-render pas) */}
      <StarsBackground />

      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col ml-20 lg:ml-24 p-4 lg:p-8 overflow-auto relative z-10">
          <MainContent />
        </main>
      </div>

      {/* Statut de connexion pour les enfants (WebRTC) */}
      <ChildRemoteStatus />
      <ElectronIndicator />
    </MentorProvider>
  )
}
