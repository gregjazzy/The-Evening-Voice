'use client'

import { ReactNode } from 'react'
import { GhostCursor } from './GhostCursor'
import { EventMirror } from './EventMirror'
import { ControlRequestOverlay } from './ControlRequestOverlay'
import { MissionOverlay } from './MissionOverlay'
import { MentorStatusBar } from './MentorStatusBar'

interface MentorProviderProps {
  children: ReactNode
}

/**
 * Provider qui englobe l'application pour activer toutes
 * les fonctionnalités de contrôle mentor
 */
export function MentorProvider({ children }: MentorProviderProps) {
  return (
    <>
      {children}
      
      {/* Couche de synchronisation d'événements (invisible) */}
      <EventMirror />
      
      {/* Curseur fantôme du mentor */}
      <GhostCursor />
      
      {/* Overlay de demande de contrôle */}
      <ControlRequestOverlay />
      
      {/* Overlay des missions flash */}
      <MissionOverlay />
      
      {/* Barre de statut quand le mentor contrôle */}
      <MentorStatusBar />
    </>
  )
}

