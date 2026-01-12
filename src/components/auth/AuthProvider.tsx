'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialize, isInitialized, isLoading } = useAuthStore()
  const [isMounted, setIsMounted] = useState(false)

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-20 h-20 rounded-full bg-gradient-to-br from-aurora-500 to-aurora-700 flex items-center justify-center"
            animate={{ 
              scale: [1, 1.1, 1],
              boxShadow: [
                '0 0 20px rgba(233, 121, 249, 0.3)',
                '0 0 40px rgba(233, 121, 249, 0.6)',
                '0 0 20px rgba(233, 121, 249, 0.3)'
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <p className="text-aurora-300 text-lg">Chargement magique...</p>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}

