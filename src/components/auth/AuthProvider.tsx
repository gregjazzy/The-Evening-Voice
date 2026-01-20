'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useSupabaseSync } from '@/hooks/useSupabaseSync'
import { LoadingScreen } from '@/components/ui/LoadingSpinner'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialize, isInitialized, isLoading } = useAuthStore()
  const [isMounted, setIsMounted] = useState(false)
  const hasInitializedRef = useRef(false)
  
  // Synchronisation avec Supabase (charge les données au login)
  useSupabaseSync()

  useEffect(() => {
    setIsMounted(true)
    
    // Éviter les appels multiples à initialize() (React Strict Mode, rechargements)
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      initialize()
    }
  }, []) // Pas de dépendances - n'exécuter qu'une seule fois

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

