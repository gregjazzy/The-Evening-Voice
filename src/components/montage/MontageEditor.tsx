'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useMontageStore, type MontageScene } from '@/store/useMontageStore'
import { useAppStore } from '@/store/useAppStore'
import { saveMontageProjectToSupabase } from '@/hooks/useSupabaseSync'
import { useAuthStore } from '@/store/useAuthStore'
import { useTranslations } from '@/lib/i18n/context'
import { PageSetupPanel } from './PageSetupPanel'
import { cn, getThumbnailUrl } from '@/lib/utils'
import {
  Film,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Trash2,
  Loader2,
  Check,
  Image,
  Video,
  Volume2,
  Mic,
  Home,
  Save,
  Music,
  Plus,
} from 'lucide-react'

// =============================================================================
// PAGE THUMBNAIL - Miniature d'une page dans la sidebar
// =============================================================================

interface PageThumbProps {
  scene: MontageScene
  index: number
  isActive: boolean
  canDelete: boolean
  onClick: () => void
  onDelete: () => void
}

function PageThumb({ scene, index, isActive, canDelete, onClick, onDelete }: PageThumbProps) {
  const hasAudio = !!scene.narration?.audioUrl
  const hasMusic = (scene.musicTracks?.length || 0) > 0
  const hasSounds = (scene.soundTracks?.length || 0) > 0
  const coverMedia = scene.mediaTracks?.[0]

  return (
    <div className="group/thumb relative">
      <button
        onClick={onClick}
        className={cn(
          'relative w-full rounded-xl overflow-hidden border-2 transition-all',
          isActive
            ? 'border-aurora-500 shadow-lg shadow-aurora-500/20'
            : 'border-midnight-700 hover:border-midnight-500'
        )}
      >
        {/* Miniature */}
        <div className="aspect-[4/3] bg-midnight-800">
          {coverMedia?.type === 'image' ? (
            <img
              src={getThumbnailUrl(coverMedia.url, 150)}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                const img = e.target as HTMLImageElement
                if (!img.dataset.fallback) {
                  img.dataset.fallback = '1'
                  img.src = coverMedia.url
                }
              }}
            />
          ) : coverMedia?.type === 'video' ? (
            <div className="relative w-full h-full">
              <video
                src={`${coverMedia.url}#t=0.1`}
                preload="metadata"
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-aurora-500/10 to-midnight-800 -z-10">
                <Video className="w-6 h-6 text-midnight-500" />
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="w-6 h-6 text-midnight-600" />
            </div>
          )}
        </div>

        {/* Numéro */}
        <div className={cn(
          'absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
          isActive ? 'bg-aurora-500 text-white' : 'bg-black/60 text-white/70'
        )}>
          {index + 1}
        </div>

        {/* Indicateurs */}
        <div className="absolute bottom-1.5 right-1.5 flex gap-1">
          {hasAudio && <div className="w-4 h-4 rounded-full bg-emerald-500/80 flex items-center justify-center"><Mic className="w-2.5 h-2.5 text-white" /></div>}
          {hasMusic && <div className="w-4 h-4 rounded-full bg-dream-500/80 flex items-center justify-center"><Music className="w-2.5 h-2.5 text-white" /></div>}
          {hasSounds && <div className="w-4 h-4 rounded-full bg-pink-500/80 flex items-center justify-center"><Volume2 className="w-2.5 h-2.5 text-white" /></div>}
        </div>

        {/* Titre */}
        <div className="p-1.5 bg-midnight-900/90">
          <p className="text-[10px] text-midnight-300 truncate">
            {scene.title || `Page ${index + 1}`}
          </p>
        </div>
      </button>

      {/* Bouton supprimer */}
      {canDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity z-10"
        >
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  )
}

// =============================================================================
// INSERT BUTTON - Bouton "+" entre les pages
// =============================================================================

function InsertButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="group/insert flex items-center justify-center py-1">
      <button
        onClick={onClick}
        className="flex items-center justify-center w-full h-5 rounded-lg opacity-0 group-hover/insert:opacity-100 hover:!opacity-100 transition-opacity bg-aurora-500/0 hover:bg-aurora-500/20"
      >
        <div className="flex items-center gap-1">
          <div className="h-px w-3 bg-aurora-500/50" />
          <Plus className="w-3.5 h-3.5 text-aurora-400" />
          <div className="h-px w-3 bg-aurora-500/50" />
        </div>
      </button>
    </div>
  )
}

// =============================================================================
// SCENE SELECTOR - Navigation rapide entre pages (header)
// =============================================================================

function SceneSelector() {
  const { currentProject, currentSceneIndex, setCurrentScene } = useMontageStore()
  if (!currentProject) return null

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setCurrentScene(currentSceneIndex - 1)}
        disabled={currentSceneIndex === 0}
        className={cn(
          'p-2 rounded-lg transition-colors',
          currentSceneIndex === 0 ? 'text-midnight-600 cursor-not-allowed' : 'text-midnight-400 hover:text-white hover:bg-midnight-800/50'
        )}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <span className="text-sm text-midnight-300 font-medium">
        {currentSceneIndex + 1} / {currentProject.scenes.length}
      </span>

      <button
        onClick={() => setCurrentScene(currentSceneIndex + 1)}
        disabled={currentSceneIndex === currentProject.scenes.length - 1}
        className={cn(
          'p-2 rounded-lg transition-colors',
          currentSceneIndex === currentProject.scenes.length - 1 ? 'text-midnight-600 cursor-not-allowed' : 'text-midnight-400 hover:text-white hover:bg-midnight-800/50'
        )}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}

// =============================================================================
// MONTAGE EDITOR - Vue par page simplifiée
// =============================================================================

export function MontageEditor() {
  const t = useTranslations('layout')
  const { currentProject, currentSceneIndex, getCurrentScene, setCurrentScene, closeProject, insertScene, deleteScene } = useMontageStore()
  const { stories } = useAppStore()
  const { projects, loadProject, deleteProject, createProject } = useMontageStore()

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { profile } = useAuthStore()
  const scene = getCurrentScene()

  // Sauvegarde manuelle
  const handleSave = async () => {
    const freshProject = useMontageStore.getState().currentProject
    if (!freshProject || !profile?.id) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveStatus('saving')
    try {
      const success = await Promise.race([
        saveMontageProjectToSupabase(freshProject, profile.id),
        new Promise<false>((resolve) => setTimeout(() => resolve(false), 8000)),
      ])
      setSaveStatus(success ? 'success' : 'error')
    } catch {
      setSaveStatus('error')
    } finally {
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  // ═══ ÉCRAN DE SÉLECTION DE PROJET ═══
  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <motion.div
          className="glass rounded-3xl p-8 max-w-3xl w-full"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-aurora-500/30 to-dream-500/30 flex items-center justify-center">
              <Film className="w-10 h-10 text-aurora-400" />
            </div>
            <h2 className="font-display text-2xl text-white mb-2">{t('montageEditor.title')}</h2>
            <p className="text-midnight-300">{t('montageEditor.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Projets existants */}
            <div className="space-y-4">
              <h3 className="text-sm text-midnight-400 uppercase tracking-wider flex items-center gap-2">
                <Film className="w-4 h-4" />
                {t('montageEditor.continueProject')}
              </h3>

              {projects.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {projects.map((project) => (
                    <motion.div key={project.id} className="group relative" whileHover={{ scale: 1.02 }}>
                      <button
                        onClick={() => loadProject(project.id)}
                        className="w-full p-4 rounded-xl bg-aurora-500/10 hover:bg-aurora-500/20 text-left border border-aurora-500/20"
                      >
                        <p className="font-medium text-aurora-300">{project.title}</p>
                        <p className="text-xs text-midnight-400 mt-1">
                          {t('montageEditor.scenesCount', { count: project.scenes.length })}
                        </p>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(t('montageEditor.deleteConfirm'))) deleteProject(project.id)
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-500/20 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-midnight-800/30 text-center">
                  <Film className="w-8 h-8 mx-auto mb-2 text-midnight-600" />
                  <p className="text-sm text-midnight-500">{t('montageEditor.noProjects')}</p>
                </div>
              )}
            </div>

            {/* Nouvelles histoires */}
            <div className="space-y-4">
              <h3 className="text-sm text-midnight-400 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {t('montageEditor.newProject')}
              </h3>

              {stories.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stories.map((story) => {
                    const existing = projects.find(p => p.storyId === story.id)

                    return (
                      <motion.button
                        key={story.id}
                        onClick={() => {
                          if (existing) {
                            loadProject(existing.id)
                          } else {
                            // Récupérer pages depuis localStorage
                            let pagesWithContent: Array<{id: string, title?: string, content?: string, order?: number, pageType?: string, images?: { url: string; type?: 'image' | 'video' }[], backgroundMedia?: { url: string; type?: 'image' | 'video' }}> = []
                            try {
                              const localData = JSON.parse(localStorage.getItem('lavoixdusoir-storage') || '{}')
                              const localStory = localData.state?.stories?.find((s: { id: string }) => s.id === story.id)
                              if (localStory?.pages?.length > 0) pagesWithContent = localStory.pages
                            } catch {}

                            if (pagesWithContent.length === 0) pagesWithContent = story.pages

                            const pages = pagesWithContent
                              .filter(p => p.pageType !== 'back-cover')
                              .map((p, idx) => {
                                const isCover = p.pageType === 'front-cover'
                                return {
                                  id: p.id,
                                  title: isCover ? story.title : t('montageEditor.sceneTitle', { index: (p.order ?? idx) + 1 }),
                                  text: p.content || (isCover ? story.title : ''),
                                  images: p.images,
                                  backgroundMedia: p.backgroundMedia,
                                }
                              })

                            if (pages.length === 0) {
                              alert(t('montageEditor.noContentAlert'))
                              return
                            }
                            createProject(story.id, story.title, pages)
                          }
                        }}
                        className={cn(
                          'w-full p-4 rounded-xl text-left border',
                          existing
                            ? 'bg-dream-500/10 hover:bg-dream-500/20 border-dream-500/20'
                            : 'bg-midnight-800/50 hover:bg-midnight-700/50 border-midnight-700/30'
                        )}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{story.title}</p>
                            <p className="text-xs text-midnight-400">{t('montageEditor.pagesCount', { count: story.pages.length })}</p>
                          </div>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs',
                            existing ? 'bg-dream-500/20 text-dream-300' : 'bg-emerald-500/20 text-emerald-300'
                          )}>
                            {existing ? t('montageEditor.existing') : t('montageEditor.create')}
                          </span>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-midnight-800/30 text-center">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-midnight-600" />
                  <p className="text-sm text-midnight-500">{t('montageEditor.createFirstStory')}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ═══ VUE PAR PAGE ═══
  return (
    <div className="h-full flex flex-col gap-2">
      {/* En-tête */}
      <motion.header
        className="flex items-center justify-between shrink-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <motion.button
            onClick={closeProject}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-midnight-800/50 text-midnight-300 hover:text-white hover:bg-midnight-700/50 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Home className="w-5 h-5" />
          </motion.button>

          <div>
            <h1 className="font-display text-2xl text-aurora-300 flex items-center gap-3">
              <Film className="w-7 h-7" />
              {t('montageEditor.heading')}
            </h1>
            <p className="text-midnight-300">{currentProject.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <SceneSelector />

          {/* Bouton Sauvegarder */}
          <motion.button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
              saveStatus === 'success'
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                : saveStatus === 'error'
                ? 'bg-rose-500/30 text-rose-200 border border-rose-500/50'
                : 'bg-gradient-to-r from-aurora-500/30 to-dream-500/30 text-white border border-aurora-500/40 hover:from-aurora-500/40 hover:to-dream-500/40'
            )}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saveStatus === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saveStatus === 'error' ? t('montageEditor.retry') : t('montageEditor.save')}
          </motion.button>
        </div>
      </motion.header>

      {/* Contenu principal : sidebar pages + zone config */}
      <div className="flex-1 overflow-hidden flex gap-3">
        {/* Sidebar gauche : miniatures des pages */}
        <div className="w-24 md:w-28 lg:w-32 shrink-0 overflow-y-auto scrollbar-thin pr-1">
          {currentProject.scenes.map((s, index) => (
            <div key={s.id}>
              {/* Bouton insérer avant la première page */}
              {index === 0 && (
                <InsertButton onClick={() => insertScene(-1)} />
              )}

              <PageThumb
                scene={s}
                index={index}
                isActive={index === currentSceneIndex}
                canDelete={currentProject.scenes.length > 1}
                onClick={() => setCurrentScene(index)}
                onDelete={() => {
                  if (confirm('Supprimer cette page ?')) deleteScene(index)
                }}
              />

              {/* Bouton insérer après chaque page */}
              <InsertButton onClick={() => insertScene(index)} />
            </div>
          ))}
        </div>

        {/* Zone principale */}
        {scene && (
          <div className="flex-1 flex md:flex-row flex-col gap-3 min-h-0 overflow-hidden">
            {/* Aperçu de la page */}
            <div className="md:flex-1 shrink-0 min-h-0 flex flex-col">
              <div className="glass rounded-xl overflow-hidden flex-1 min-h-0 flex flex-col">
                <div className="flex-1 bg-midnight-900 relative min-h-0">
                  {scene.mediaTracks?.[0] ? (
                    scene.mediaTracks[0].type === 'video' ? (
                      <video
                        key={`${scene.mediaTracks[0].url}-${scene.mediaTracks[0].playbackRate ?? 1}`}
                        src={scene.mediaTracks[0].url}
                        className="absolute inset-0 w-full h-full object-contain"
                        autoPlay
                        muted
                        playsInline
                        onPlay={(e) => {
                          const rate = scene.mediaTracks[0]?.playbackRate
                          if (rate) (e.target as HTMLVideoElement).playbackRate = rate
                        }}
                      />
                    ) : (
                      <img
                        src={getThumbnailUrl(scene.mediaTracks[0].url, 800)}
                        alt={scene.title}
                        className="absolute inset-0 w-full h-full object-contain"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement
                          if (!img.dataset.fallback) {
                            img.dataset.fallback = '1'
                            img.src = scene.mediaTracks[0].url
                          }
                        }}
                      />
                    )
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image className="w-16 h-16 text-midnight-700" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panel de configuration (narration + musique + sons) */}
            <div className="md:w-72 lg:w-80 xl:w-96 shrink-0 overflow-y-auto scrollbar-thin min-h-0">
              <PageSetupPanel />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
