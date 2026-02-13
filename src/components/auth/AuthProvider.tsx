'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useSupabaseSync } from '@/hooks/useSupabaseSync'
import { LoadingScreen } from '@/components/ui/LoadingSpinner'

interface AuthProviderProps {
  children: React.ReactNode
}

// Routes qui ne nécessitent pas d'auth
const publicPaths = ['/login', '/register', '/connexion', '/inscription']

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialize, isInitialized, isLoading, user } = useAuthStore()
  const [isMounted, setIsMounted] = useState(false)
  const hasInitializedRef = useRef(false)
  const pathname = usePathname()
  const router = useRouter()

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

  // Protection côté client : rediriger vers login si pas de session
  useEffect(() => {
    console.log('🔒 AuthProvider check:', { isInitialized, hasUser: !!user, pathname })
    if (!isInitialized) return
    const isPublic = publicPaths.some(p => pathname.includes(p))
    if (!user && !isPublic) {
      const locale = pathname.split('/')[1] || 'fr'
      console.log('🔒 Pas de session, redirection vers login')
      router.replace(`/${locale}/login`)
    }
  }, [isInitialized, user, pathname, router])

  // Éviter le flash de contenu pendant l'hydratation
  if (!isMounted) {
    return null
  }

  // Écran de chargement uniquement pendant l'initialisation initiale
  // (pas pendant signIn/signUp — ces pages gèrent leur propre spinner)
  if (!isInitialized) {
    return <LoadingScreen message="Préparation de la magie..." />
  }

  // Pas de user et pas sur une route publique → ne rien afficher (redirect en cours)
  const isPublic = publicPaths.some(p => pathname.includes(p))
  if (!user && !isPublic) {
    return <LoadingScreen message="Redirection..." />
  }

  return <>{children}</>
}

