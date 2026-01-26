'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from '@/lib/i18n/context'
import { 
  Feather, 
  Palette, 
  LayoutGrid, 
  Theater,
  Sparkles,
  Link2,
  Wifi,
  Monitor,
  Printer,
  Shield,
  Users,
  Lock,
  Book,
  ChevronDown,
  Plus,
  Check,
  Target,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { useAppStore, type AppMode } from '@/store/useAppStore'
import { useMentorStore } from '@/store/useMentorStore'
import { useAdminStore } from '@/store/useAdminStore'
import { ConnectionModal } from '@/components/mentor/ConnectionModal'
import { UserMenu } from '@/components/ui/UserMenu'
import { Highlightable } from '@/components/ui/Highlightable'
import { type HighlightableElement } from '@/store/useHighlightStore'
import { SuperAdminPanel, ParentAdminPanel } from '@/components/admin'
import { cn } from '@/lib/utils'

interface NavItem {
  id: AppMode
  highlightId: HighlightableElement
  icon: React.ReactNode
  labelKey: string
}

const navItems: NavItem[] = [
  {
    id: 'book',
    highlightId: 'nav-ecriture',
    icon: <Feather className="w-5 h-5 lg:w-6 lg:h-6" />,
    labelKey: 'book'
  },
  {
    id: 'studio',
    highlightId: 'nav-studio',
    icon: <Palette className="w-5 h-5 lg:w-6 lg:h-6" />,
    labelKey: 'studio'
  },
  {
    id: 'challenge',
    highlightId: 'nav-challenge',
    icon: <Target className="w-5 h-5 lg:w-6 lg:h-6" />,
    labelKey: 'challenge'
  },
  {
    id: 'layout',
    highlightId: 'nav-montage',
    icon: <LayoutGrid className="w-5 h-5 lg:w-6 lg:h-6" />,
    labelKey: 'layout'
  },
  {
    id: 'theater',
    highlightId: 'nav-theatre',
    icon: <Theater className="w-5 h-5 lg:w-6 lg:h-6" />,
    labelKey: 'theater'
  },
  {
    id: 'publish',
    highlightId: 'nav-publier',
    icon: <Printer className="w-5 h-5 lg:w-6 lg:h-6" />,
    labelKey: 'publish'
  },
]

export function Sidebar() {
  const t = useTranslations('nav')
  const { currentMode, setCurrentMode, currentStory, stories, setCurrentStory, deleteStory } = useAppStore()
  const { isConnected, role, connectedUsers, disconnect } = useMentorStore()
  const { isSuperAdmin, userFamilyInfo } = useAdminStore()
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showStorySelector, setShowStorySelector] = useState(false)
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null)
  const storySelectorRef = useRef<HTMLDivElement>(null)
  
  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (storySelectorRef.current && !storySelectorRef.current.contains(event.target as Node)) {
        setShowStorySelector(false)
      }
    }
    
    if (showStorySelector) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showStorySelector])

  const childrenCount = connectedUsers.filter(u => u.role === 'child').length
  const isParent = userFamilyInfo?.user_role === 'parent'
  const canAccessAdmin = isSuperAdmin || isParent
  
  // Modes qui nécessitent une histoire avec titre
  // Note: Studio ne nécessite PAS d'histoire - on peut générer des images indépendamment
  const modesRequiringStory: AppMode[] = ['layout']
  const hasStoryWithTitle = !!currentStory?.title
  
  // Histoires triées par date (plus récentes en premier)
  const sortedStories = [...stories].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
  
  // Sélectionner une histoire
  const handleSelectStory = (story: typeof stories[0]) => {
    setCurrentStory(story)
    setShowStorySelector(false)
  }
  
  // Créer nouvelle histoire → aller dans Écriture
  const handleNewStory = () => {
    setCurrentStory(null)
    setCurrentMode('book')
    setShowStorySelector(false)
  }

  return (
    <>
      <motion.aside
        className="fixed left-0 top-0 h-full w-20 lg:w-24 glass flex flex-col items-center py-4 lg:py-8 z-50"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo / Titre */}
        <motion.div 
          className="mb-2 lg:mb-4 flex flex-col items-center"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-aurora-500 to-aurora-700 flex items-center justify-center magic-glow">
            <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
          </div>
          <span className="mt-1 lg:mt-2 text-[10px] lg:text-xs font-display text-aurora-300 tracking-wider hidden lg:block">
            La Voix
          </span>
        </motion.div>

        {/* Sélecteur d'histoire */}
        <div ref={storySelectorRef} className="relative w-full px-2 lg:px-3 mb-2 lg:mb-4">
          <motion.button
            onClick={() => setShowStorySelector(!showStorySelector)}
            className={cn(
              'w-full p-2 rounded-xl flex items-center justify-center gap-1 lg:gap-2 transition-all overflow-hidden',
              currentStory 
                ? 'bg-aurora-500/10 border border-aurora-500/30 hover:bg-aurora-500/20'
                : 'bg-midnight-800/50 border border-midnight-700 hover:bg-midnight-700/50'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Sur mobile: juste l'icône du livre */}
            <Book className={cn(
              'w-4 h-4 flex-shrink-0 lg:hidden',
              currentStory ? 'text-aurora-400' : 'text-midnight-500'
            )} />
            
            {/* Sur desktop: icône + texte + flèche */}
            <div className="hidden lg:flex items-center gap-2 w-full min-w-0">
              <Book className={cn(
                'w-4 h-4 flex-shrink-0',
                currentStory ? 'text-aurora-400' : 'text-midnight-500'
              )} />
              <span className={cn(
                'flex-1 text-xs truncate text-left min-w-0',
                currentStory ? 'text-white' : 'text-midnight-400'
              )}>
                {currentStory?.title || 'Choisir...'}
              </span>
              <ChevronDown className={cn(
                'w-3 h-3 flex-shrink-0 transition-transform',
                showStorySelector && 'rotate-180',
                currentStory ? 'text-aurora-400' : 'text-midnight-500'
              )} />
            </div>
          </motion.button>
          
          {/* Dropdown - positionnement sur la droite sur mobile */}
          <AnimatePresence>
            {showStorySelector && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-1 z-50 bg-midnight-900 border border-midnight-700 rounded-xl shadow-xl overflow-hidden w-[220px] max-w-[280px] left-full ml-2 lg:left-0 lg:ml-0 lg:right-0 lg:w-auto"
              >
                {/* Titre du dropdown */}
                <div className="px-3 py-2 border-b border-midnight-700 bg-midnight-800/50">
                  <span className="text-xs text-midnight-400 font-medium">📚 Mes histoires</span>
                </div>
                
                {/* Liste des histoires */}
                <div className="max-h-48 overflow-y-auto">
                  {sortedStories.length === 0 ? (
                    <div className="p-3 text-center text-midnight-500 text-xs">
                      Aucune histoire
                    </div>
                  ) : (
                    sortedStories.map((story) => (
                      <div
                        key={story.id}
                        className={cn(
                          'w-full p-3 flex items-center gap-2 hover:bg-midnight-800 transition-colors group',
                          currentStory?.id === story.id && 'bg-aurora-500/10'
                        )}
                      >
                        <button
                          onClick={() => handleSelectStory(story)}
                          className="flex-1 flex items-center gap-2 text-left min-w-0 overflow-hidden"
                        >
                          <Book className={cn(
                            'w-4 h-4 flex-shrink-0',
                            currentStory?.id === story.id ? 'text-aurora-400' : 'text-midnight-500'
                          )} />
                          <span className={cn(
                            'flex-1 text-xs truncate block max-w-[160px]',
                            currentStory?.id === story.id ? 'text-white' : 'text-midnight-300'
                          )}>
                            {story.title || 'Sans titre'}
                          </span>
                        </button>
                        {currentStory?.id === story.id ? (
                          <Check className="w-4 h-4 text-aurora-400 flex-shrink-0" />
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setStoryToDelete(story.id)
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
                
                {/* Bouton nouvelle histoire */}
                <div className="border-t border-midnight-700">
                  <button
                    onClick={handleNewStory}
                    className="w-full p-3 flex items-center gap-2 hover:bg-dream-500/10 transition-colors text-dream-400"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-xs font-medium">+ Nouvelle histoire</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 lg:gap-2 w-full px-2 lg:px-3">
          {navItems.map((item, index) => {
            const isLocked = modesRequiringStory.includes(item.id) && !hasStoryWithTitle
            
            return (
              <Highlightable key={item.id} id={item.highlightId}>
                <motion.button
                  onClick={() => !isLocked && setCurrentMode(item.id)}
                  className={cn(
                    'nav-item w-full',
                    currentMode === item.id && 'active',
                    isLocked && 'opacity-40 cursor-not-allowed'
                  )}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={isLocked ? {} : { scale: 1.05 }}
                  whileTap={isLocked ? {} : { scale: 0.95 }}
                  title={isLocked ? 'Crée d\'abord une histoire dans Écriture' : t(item.labelKey)}
                  data-mentor-target={`nav-${item.id}`}
                >
                  <motion.div
                    animate={currentMode === item.id ? {
                      scale: [1, 1.2, 1],
                      transition: { duration: 0.3 }
                    } : {}}
                    className="relative"
                  >
                    {item.icon}
                    {isLocked && (
                      <Lock className="w-3 h-3 absolute -bottom-1 -right-1 text-midnight-400" />
                    )}
                  </motion.div>
                  <span className="mode-label hidden lg:block">{t(item.labelKey)}</span>
                  
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
              </Highlightable>
            )
          })}

          {/* Bouton Dashboard Mentor (seulement pour les mentors) */}
          <AnimatePresence>
            {isConnected && role === 'mentor' && (
              <motion.button
                onClick={() => setCurrentMode('mentor' as AppMode)}
                className={cn(
                  'nav-item w-full mt-2 lg:mt-4 border-t border-white/5 pt-2 lg:pt-4',
                  currentMode === 'mentor' && 'active'
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Dashboard Mentor"
              >
                <Monitor className="w-5 h-5 lg:w-6 lg:h-6" />
                <span className="mode-label hidden lg:block">Mentor</span>
                {childrenCount > 0 && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-dream-500 text-white text-xs flex items-center justify-center">
                    {childrenCount}
                  </span>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </nav>

        {/* Bouton Admin (Super Admin ou Parent) */}
        {canAccessAdmin && (
          <div className="mt-auto pt-2 lg:pt-4 w-full px-2 lg:px-3">
            <motion.button
              onClick={() => setShowAdminPanel(true)}
              className={cn(
                'w-full p-2 lg:p-3 rounded-xl flex flex-col items-center gap-1 transition-all',
                isSuperAdmin
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30'
                  : 'bg-pink-600/20 text-pink-300 border border-pink-500/30 hover:bg-pink-600/30'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title={isSuperAdmin ? 'Super Admin' : 'Gestion famille'}
            >
              {isSuperAdmin ? (
                <>
                  <Shield className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="text-[8px] lg:text-[10px] uppercase tracking-wide hidden lg:block">Admin</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="text-[8px] lg:text-[10px] uppercase tracking-wide hidden lg:block">Famille</span>
                </>
              )}
            </motion.button>
          </div>
        )}

        {/* Connexion collaborative */}
        <div className={cn("w-full px-2 lg:px-3", !canAccessAdmin && "mt-auto pt-2 lg:pt-4")}>
          <motion.button
            onClick={() => isConnected ? disconnect() : setShowConnectionModal(true)}
            className={cn(
              'w-full p-2 lg:p-3 rounded-xl flex flex-col items-center gap-1 transition-all',
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
                <span className="text-[8px] lg:text-[10px] uppercase tracking-wide hidden lg:block">
                  {role === 'mentor' ? 'Mentor' : 'Connecté'}
                </span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="text-[8px] lg:text-[10px] uppercase tracking-wide hidden lg:block">Collab</span>
              </>
            )}
          </motion.button>

          {/* Indicateur visuel */}
          <motion.div 
            className="mt-2 lg:mt-4 flex justify-center"
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
          <div className="mt-2 lg:mt-4 w-full">
            <UserMenu />
          </div>
        </div>
      </motion.aside>

      {/* Modal de connexion */}
      <ConnectionModal 
        isOpen={showConnectionModal} 
        onClose={() => setShowConnectionModal(false)} 
      />

      {/* Panel Admin */}
      <AnimatePresence>
        {showAdminPanel && (
          isSuperAdmin ? (
            <SuperAdminPanel onClose={() => setShowAdminPanel(false)} />
          ) : (
            <ParentAdminPanel onClose={() => setShowAdminPanel(false)} />
          )
        )}
      </AnimatePresence>

      {/* Modal de confirmation de suppression */}
      <AnimatePresence>
        {storyToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setStoryToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-midnight-900 border border-midnight-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Supprimer l'histoire ?</h3>
                  <p className="text-sm text-midnight-400">Cette action est irréversible</p>
                </div>
              </div>
              
              <p className="text-sm text-midnight-300 mb-6">
                L'histoire "<span className="text-white font-medium">{stories.find(s => s.id === storyToDelete)?.title || 'Sans titre'}</span>" sera définitivement supprimée avec toutes ses pages.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setStoryToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-midnight-800 hover:bg-midnight-700 text-midnight-300 hover:text-white transition-colors text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    if (storyToDelete) {
                      // Si on supprime l'histoire en cours, désélectionner
                      if (currentStory?.id === storyToDelete) {
                        setCurrentStory(null)
                      }
                      deleteStory(storyToDelete)
                      setStoryToDelete(null)
                      setShowStorySelector(false)
                    }
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30 transition-colors text-sm font-medium"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
