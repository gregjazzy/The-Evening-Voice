'use client'

import { Sidebar } from '@/components/navigation/Sidebar'
import { MainContent } from '@/components/MainContent'
import { MentorProvider } from '@/components/mentor'
import { ChildRemoteStatus } from '@/components/remote'
import { ElectronIndicator } from '@/components/modes/CollabMode'
import { StarsBackground } from '@/components/ui/StarsBackground'

/**
 * Page principale de l'application
 * Le contenu est géré par MainContent basé sur le mode sélectionné
 */
export default function HomePage() {
  return (
    <MentorProvider>
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

