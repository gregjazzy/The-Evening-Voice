'use client'

import { useAppStore, type AppMode } from '@/store/useAppStore'
import { DiaryMode } from './modes/DiaryMode'
import { BookMode } from './modes/BookMode'
import { StudioMode } from './modes/StudioMode'
import { LayoutMode } from './modes/LayoutMode'
import { TheaterMode } from './modes/TheaterMode'
import { CollabMode } from './modes/CollabMode'

const modeComponents: Record<AppMode, React.ComponentType> = {
  diary: DiaryMode,
  book: BookMode,
  studio: StudioMode,
  layout: LayoutMode,
  theater: TheaterMode,
  mentor: CollabMode, // CollabMode détecte si Electron pour RemoteDesktop ou MentorDashboard
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
