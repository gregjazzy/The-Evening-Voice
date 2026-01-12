'use client'

import { RemoteControlPanel } from '@/components/remote'
import { MentorDashboard } from '@/components/mentor'
import { useIsElectron } from '@/lib/electron/hooks'
import { useAuthStore } from '@/store/useAuthStore'
import { Monitor } from 'lucide-react'

/**
 * Mode Collaboration
 * - Sur Electron avec mentor → RemoteControlPanel (contrôle total Mac via WebRTC)
 * - Sur Web ou mentor sans Electron → MentorDashboard (contrôle dans l'app seulement)
 */
export function CollabMode() {
  const isElectron = useIsElectron()
  const { profile } = useAuthStore()
  const isMentor = profile?.role === 'mentor' || profile?.role === 'parent'

  // Sur Electron et mentor → Nouveau RemoteControlPanel avec WebRTC
  if (isElectron && isMentor) {
    return <RemoteControlPanel />
  }

  // Sur Web ou enfant → Dashboard classique
  return <MentorDashboard />
}

/**
 * Indicateur pour savoir si on est en mode Electron
 */
export function ElectronIndicator() {
  const isElectron = useIsElectron()

  if (!isElectron) return null

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600/20 border border-green-500/30 text-green-400 text-sm z-50">
      <Monitor className="w-4 h-4" />
      Mode Bureau
    </div>
  )
}

