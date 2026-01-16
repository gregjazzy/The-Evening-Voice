'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from '@/lib/i18n/context'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppStore } from '@/store/useAppStore'
import { 
  User, 
  Settings, 
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

  // Fermer le menu si clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
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
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-aurora-900/50 border border-aurora-700/50 hover:bg-aurora-800/50 transition-colors w-full"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-aurora-500 to-aurora-700 flex items-center justify-center text-white font-semibold text-sm">
          {profile.name?.charAt(0).toUpperCase() || '?'}
        </div>
        
        <div className="flex-1 text-left hidden min-[100px]:block">
          <p className="text-white text-sm font-semibold truncate max-w-[80px]">
            {profile.name}
          </p>
        </div>
        
        <ChevronDown className={cn(
          "w-4 h-4 text-aurora-400 transition-transform",
          isOpen && "rotate-180"
        )} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 py-2 w-56 glass-card rounded-xl border border-aurora-700/50 shadow-xl z-50"
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
                    <span className="text-sm">Mon amie IA</span>
                  </div>
                  <span className="text-sm font-semibold text-stardust-300">
                    {aiName || '✨ Choisir'}
                  </span>
                </button>
              </div>
            )}

            {/* Options du menu */}
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/settings')
                }}
                className="w-full px-4 py-2 flex items-center gap-3 text-aurora-200 hover:bg-aurora-800/50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>{t('settings')}</span>
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout')}</span>
              </button>
            </div>

            {/* Stats (pour les enfants) */}
            {profile.role === 'child' && (
              <div className="px-4 py-3 border-t border-aurora-700/50">
                <div className="flex justify-between text-xs">
                  <span className="text-aurora-400">Missions</span>
                  <span className="text-white font-semibold">{profile.missions_completed || 0}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal pour modifier le nom de l'IA */}
      <AINameModal
        isOpen={showAINameModal}
        onClose={() => setShowAINameModal(false)}
        isFirstTime={false}
      />
    </div>
  )
}

