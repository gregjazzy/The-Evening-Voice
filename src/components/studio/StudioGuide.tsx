'use client'

import { type CreationType } from '@/store/useStudioProgressStore'

// Removed: Level progression guide
// This component is no longer used — kept as empty export for safety

interface StudioGuideProps {
  type: CreationType
  onHelpRequest?: () => void
}

export function StudioGuide(_props: StudioGuideProps) {
  return null
}

export function StudioLevelBadge(_props: { type: CreationType }) {
  return null
}
