'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useSupabaseSync } from '@/hooks/useSupabaseSync'
import { LoadingScreen } from '@/components/ui/LoadingSpinner'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialize, isInitialized, isLoading } = useAuthStore()
  const [isMounted, setIsMounted] = useState(false)
  
  // Synchronisation avec Supabase (charge les données au login)
  useSupabaseSync()

  useEffect(() => {
    setIsMounted(true)
    initialize()
  }, [initialize])

  // Éviter le flash de contenu pendant l'hydratation
  if (!isMounted) {
    return null
  }

  // Écran de chargement pendant l'initialisation
  if (!isInitialized || isLoading) {
    return <LoadingScreen message="Préparation de la magie..." />
  }

  return <>{children}</>
}

