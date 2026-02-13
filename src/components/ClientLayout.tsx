'use client'

import { ReactNode, useEffect } from 'react'
import { MentorProvider } from './mentor/MentorProvider'
import { ToastProvider } from './ui/Toast'
import { GlobalNotifications } from './ui/GlobalNotifications'
import { useAppConfig } from '@/hooks/useAppConfig'
import { useSyncUserPreferences } from '@/hooks/useSyncUserPreferences'

interface ClientLayoutProps {
  children: ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  // Charger la configuration (clés API, famille) au démarrage
  useAppConfig()

  // Synchroniser les préférences utilisateur avec Supabase
  useSyncUserPreferences()

  // Intercepteur global pour les erreurs non gérées (notamment AbortError de Supabase)
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error || event.message
      const errorString = error?.toString() || String(error || '')
      const stack = error?.stack || ''

      const isAbortError =
        error?.name === 'AbortError' ||
        errorString.includes('AbortError') ||
        errorString.includes('aborted') ||
        errorString.includes('signal is aborted') ||
        stack.includes('locks.js') ||
        (typeof error === 'string' && error.includes('AbortError'))

      if (isAbortError) {
        console.warn('⚠️ AbortError interceptée (ignorée):', error?.message || errorString)
        event.preventDefault()
        event.stopPropagation()
        return false
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      const errorString = error?.toString() || String(error || '')
      const stack = error?.stack || ''

      const isAbortError =
        error?.name === 'AbortError' ||
        errorString.includes('AbortError') ||
        errorString.includes('aborted') ||
        errorString.includes('signal is aborted') ||
        stack.includes('locks.js') ||
        (error?.message && (
          error.message.includes('AbortError') ||
          error.message.includes('aborted') ||
          error.message.includes('signal is aborted')
        ))

      if (isAbortError) {
        console.warn('⚠️ AbortError (promise rejection) interceptée (ignorée):', error?.message || errorString)
        event.preventDefault()
        event.stopPropagation()
      }
    }

    window.addEventListener('error', handleError, true)
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true)

    return () => {
      window.removeEventListener('error', handleError, true)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true)
    }
  }, [])

  return (
    <ToastProvider>
      <MentorProvider>
        {children}
        <GlobalNotifications />
      </MentorProvider>
    </ToastProvider>
  )
}
