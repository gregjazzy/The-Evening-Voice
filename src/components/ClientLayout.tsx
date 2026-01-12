'use client'

import { ReactNode } from 'react'
import { MentorProvider } from './mentor/MentorProvider'

interface ClientLayoutProps {
  children: ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <MentorProvider>
      {children}
    </MentorProvider>
  )
}

