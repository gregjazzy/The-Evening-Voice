'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from '@/lib/i18n/context'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppStore } from '@/store/useAppStore'
import { 
  User, 
  LogOut,
  ChevronDown,
  Shield,
  Heart,
  Users,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from './LanguageSwitcher'
import { AINameModal } from './AINameModal'

export function UserMenu() {
  const t = useTranslations('nav')
  const tAuth = useTranslations('auth')
  const router = useRouter()
  const { user, profile, signOut } = useAuthStore()
  const { aiName } = useAppStore()
  
  const [isOpen, setIsOpen] = useState(false)
  const [showAINameModal, setShowAINameModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState({ bottom: 0, left: 0 })

  // Calculer la position du dropdown au-dessus du bouton
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPos({ bottom: window.innerHeight - rect.top + 8, left: rect.left })
    }
  }, [])

  useEffect(() => {
    if (isOpen) updatePosition()
  }, [isOpen, updatePosition])

  // Fermer le menu si clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [isSigningOut, setIsSigningOut] = useState(false)
  
  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isSigningOut) {
      console.log('⏳ Déconnexion déjà en cours...')
      return
    }

    console.log('🔴 Clic sur Déconnexion')
    setIsSigningOut(true)
    setIsOpen(false)

    // Timeout de sécurité : si signOut prend trop de temps, forcer la redirection
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Timeout déconnexion, redirection forcée')
      forceCleanAndRedirect()
    }, 5000)

    try {
      await signOut()
      clearTimeout(timeoutId)
      console.log('✅ Déconnexion réussie, redirection...')
      forceCleanAndRedirect()
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('❌ Erreur déconnexion:', error)
      forceCleanAndRedirect()
    }
  }

  // Force-clear all Supabase auth cookies then navigate
  // Prevents the middleware from seeing stale cookies and redirecting back to home
  const forceCleanAndRedirect = () => {
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim()
      if (name.startsWith('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`
      }
    })
    // Detect current locale from URL path for proper redirect
    const locale = window.location.pathname.split('/')[1] || 'fr'
    window.location.href = `/${locale}/login`
  }

  const getRoleIcon = () => {
    switch (profile?.role) {
      case 'child':
        return <Heart className="w-4 h-4 text-pink-400" />
      case 'mentor':
        return <Shield className="w-4 h-4 text-aurora-400" />
      case 'parent':
        return <Users className="w-4 h-4 text-blue-400" />
      default:
        return <User className="w-4 h-4 text-aurora-400" />
    }
  }

  const getRoleName = () => {
    switch (profile?.role) {
      case 'child':
        return tAuth('iAmChild')
      case 'mentor':
        return tAuth('iAmMentor')
      case 'parent':
        return tAuth('iAmParent')
      default:
        return ''
    }
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-aurora-900/50 border border-aurora-700/50 hover:bg-aurora-800/50 transition-colors w-full"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-aurora-500 to-aurora-700 flex items-center justify-center text-white font-semibold text-sm">
          {profile.name?.charAt(0).toUpperCase() || '?'}
        </div>
        
        <ChevronDown className={cn(
          "w-4 h-4 text-aurora-400 transition-transform",
          isOpen && "rotate-180"
        )} />
      </motion.button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed py-2 w-56 rounded-xl border border-aurora-700/50 shadow-2xl"
              style={{ bottom: dropdownPos.bottom, left: dropdownPos.left, zIndex: 9999, background: '#0d0c1a' }}
            >
              {/* En-tête du profil */}
              <div className="px-4 py-3 border-b border-aurora-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aurora-500 to-aurora-700 flex items-center justify-center text-white font-semibold">
                    {profile.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{profile.name}</p>
                    <div className="flex items-center gap-1 text-aurora-300 text-xs">
                      {getRoleIcon()}
                      <span>{getRoleName()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sélecteur de langue */}
              <div className="px-4 py-2 border-b border-aurora-700/50">
                <LanguageSwitcher />
              </div>

              {/* Nom de l'IA (pour les enfants) */}
              {profile.role === 'child' && (
                <div className="px-4 py-2 border-b border-aurora-700/50">
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setShowAINameModal(true)
                    }}
                    className="w-full flex items-center justify-between text-aurora-200 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-stardust-400" />
                      <span className="text-sm">{t('myAiFriend')}</span>
                    </div>
                    <span className="text-sm font-semibold text-stardust-300">
                      {aiName || t('chooseAiName')}
                    </span>
                  </button>
                </div>
              )}

              {/* Options du menu */}
              <div className="py-1">
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className={cn(
                    "w-full px-4 py-2 flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition-colors",
                    isSigningOut && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isSigningOut ? t('signingOut') : t('logout')}</span>
                </button>
              </div>

              {/* Stats (pour les enfants) */}
              {profile.role === 'child' && (
                <div className="px-4 py-3 border-t border-aurora-700/50">
                  <div className="flex justify-between text-xs">
                    <span className="text-aurora-400">{t('missions')}</span>
                    <span className="text-white font-semibold">{profile.missions_completed || 0}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Modal pour modifier le nom de l'IA */}
      <AINameModal
        isOpen={showAINameModal}
        onClose={() => setShowAINameModal(false)}
        isFirstTime={false}
      />
    </div>
  )
}

