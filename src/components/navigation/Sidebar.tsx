'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from '@/lib/i18n/context'
import { 
  BookHeart, 
  Feather, 
  Palette, 
  LayoutGrid, 
  Theater,
  Sparkles,
  Link2,
  Wifi,
  WifiOff,
  Monitor
} from 'lucide-react'
import { useAppStore, type AppMode } from '@/store/useAppStore'
import { useMentorStore } from '@/store/useMentorStore'
import { ConnectionModal } from '@/components/mentor/ConnectionModal'
import { UserMenu } from '@/components/ui/UserMenu'
import { cn } from '@/lib/utils'

interface NavItem {
  id: AppMode
  icon: React.ReactNode
  labelKey: string
}

const navItems: NavItem[] = [
  {
    id: 'diary',
    icon: <BookHeart className="w-6 h-6" />,
    labelKey: 'diary'
  },
  {
    id: 'book',
    icon: <Feather className="w-6 h-6" />,
    labelKey: 'book'
  },
  {
    id: 'studio',
    icon: <Palette className="w-6 h-6" />,
    labelKey: 'studio'
  },
  {
    id: 'layout',
    icon: <LayoutGrid className="w-6 h-6" />,
    labelKey: 'layout'
  },
  {
    id: 'theater',
    icon: <Theater className="w-6 h-6" />,
    labelKey: 'theater'
  },
]

export function Sidebar() {
  const t = useTranslations('nav')
  const { currentMode, setCurrentMode } = useAppStore()
  const { isConnected, role, connectedUsers, disconnect } = useMentorStore()
  const [showConnectionModal, setShowConnectionModal] = useState(false)

  const childrenCount = connectedUsers.filter(u => u.role === 'child').length

  return (
    <>
      <motion.aside
        className="fixed left-0 top-0 h-full w-24 glass flex flex-col items-center py-8 z-50"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo / Titre */}
        <motion.div 
          className="mb-8 flex flex-col items-center"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-aurora-500 to-aurora-700 flex items-center justify-center magic-glow">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="mt-2 text-xs font-display text-aurora-300 tracking-wider">
            La Voix
          </span>
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-2 w-full px-3">
          {navItems.map((item, index) => (
            <motion.button
              key={item.id}
              onClick={() => setCurrentMode(item.id)}
              className={cn(
                'nav-item w-full',
                currentMode === item.id && 'active'
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={t(item.labelKey)}
              data-mentor-target={`nav-${item.id}`}
            >
              <motion.div
                animate={currentMode === item.id ? {
                  scale: [1, 1.2, 1],
                  transition: { duration: 0.3 }
                } : {}}
              >
                {item.icon}
              </motion.div>
              <span className="mode-label">{t(item.labelKey)}</span>
              
              {/* Indicateur de mode actif */}
              {currentMode === item.id && (
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  layoutId="activeMode"
                  style={{
                    background: 'linear-gradient(135deg, rgba(233, 121, 249, 0.1) 0%, rgba(99, 102, 170, 0.1) 100%)',
                    zIndex: -1
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </motion.button>
          ))}

          {/* Bouton Dashboard Mentor (seulement pour les mentors) */}
          <AnimatePresence>
            {isConnected && role === 'mentor' && (
              <motion.button
                onClick={() => setCurrentMode('mentor' as AppMode)}
                className={cn(
                  'nav-item w-full mt-4 border-t border-white/5 pt-4',
                  currentMode === 'mentor' && 'active'
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Dashboard Mentor"
              >
                <Monitor className="w-6 h-6" />
                <span className="mode-label">Mentor</span>
                {childrenCount > 0 && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-dream-500 text-white text-xs flex items-center justify-center">
                    {childrenCount}
                  </span>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </nav>

        {/* Connexion collaborative */}
        <div className="mt-auto pt-4 w-full px-3">
          <motion.button
            onClick={() => isConnected ? disconnect() : setShowConnectionModal(true)}
            className={cn(
              'w-full p-3 rounded-xl flex flex-col items-center gap-1 transition-all',
              isConnected 
                ? 'bg-dream-600/20 text-dream-300 border border-dream-500/30' 
                : 'bg-midnight-800/50 text-midnight-400 hover:text-white hover:bg-midnight-700/50'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={isConnected ? 'Déconnecter' : 'Connexion collaborative'}
          >
            {isConnected ? (
              <>
                <div className="flex items-center gap-1">
                  <Wifi className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase tracking-wide">
                  {role === 'mentor' ? 'Mentor' : 'Connecté'}
                </span>
              </>
            ) : (
              <>
                <Link2 className="w-5 h-5" />
                <span className="text-[10px] uppercase tracking-wide">Collab</span>
              </>
            )}
          </motion.button>

          {/* Indicateur visuel */}
          <motion.div 
            className="mt-4 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-dream-400" : "bg-aurora-400 twinkling"
            )} />
          </motion.div>

          {/* Menu utilisateur */}
          <div className="mt-4 w-full">
            <UserMenu />
          </div>
        </div>
      </motion.aside>

      {/* Modal de connexion */}
      <ConnectionModal 
        isOpen={showConnectionModal} 
        onClose={() => setShowConnectionModal(false)} 
      />
    </>
  )
}
