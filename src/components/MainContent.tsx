'use client'

import { useAppStore, type AppMode } from '@/store/useAppStore'
import { BookMode } from './modes/BookMode'
import { StudioMode } from './modes/StudioMode'
import { LayoutMode } from './modes/LayoutMode'
import { TheaterMode } from './modes/TheaterMode'
import { CollabMode } from './modes/CollabMode'
import { PublishMode } from './modes/PublishMode'
import { ChallengeMode } from './modes/ChallengeMode'

const modeComponents: Record<AppMode, React.ComponentType> = {
  book: BookMode,
  studio: StudioMode,
  challenge: ChallengeMode, // Mode défis pour apprendre le prompting
  layout: LayoutMode,
  theater: TheaterMode,
  mentor: CollabMode, // CollabMode détecte si Electron pour RemoteDesktop ou MentorDashboard
  publish: PublishMode, // Mode publication pour imprimer le livre
}

export function MainContent() {
  const { currentMode } = useAppStore()
  const CurrentModeComponent = modeComponents[currentMode]

  return (
    <div className="h-full">
      <CurrentModeComponent />
    </div>
  )
}
