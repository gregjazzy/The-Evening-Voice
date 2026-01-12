'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { 
  Feather, 
  Plus, 
  BookOpen, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Check,
  Image as ImageIcon,
  X,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  LayoutGrid,
  FileText,
  Book,
  ListTree,
  Folder,
  FolderPlus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Volume2,
  Mic,
  MicOff,
  Send,
  Type,
} from 'lucide-react'
import { useAppStore, type Story } from '@/store/useAppStore'
import { useTTS } from '@/hooks/useTTS'
import { STORY_TEMPLATES, type StoryStructure } from '@/lib/ai/prompting-pedagogy'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface TextStyle {
  fontFamily: string
  fontSize: number // Taille en pixels (ex: 12, 14, 16, 18, 20...)
  color: string
  isBold: boolean
  isItalic: boolean
  textAlign: 'left' | 'center' | 'right'
  lineSpacing: 'tight' | 'normal' | 'relaxed'
}

interface StoryPageLocal {
  id: string
  title: string
  content: string
  image?: string
  chapterId?: string
  style?: TextStyle
}

interface Chapter {
  id: string
  title: string
  type: 'intro' | 'development' | 'climax' | 'conclusion' | 'custom'
  color: string
}

// ============================================================================
// CONFIGURATION DES POLICES
// ============================================================================

const FONTS = [
  { 
    id: 'handwriting', 
    name: 'Écriture', 
    family: "'Caveat', cursive",
    preview: 'Aa',
    description: 'Manuscrite'
  },
  { 
    id: 'tale', 
    name: 'Conte', 
    family: "'Cormorant Garamond', serif",
    preview: 'Aa',
    description: 'Classique'
  },
  { 
    id: 'child', 
    name: 'Enfant', 
    family: "'Patrick Hand', cursive",
    preview: 'Aa',
    description: 'Ludique'
  },
  { 
    id: 'book', 
    name: 'Livre', 
    family: "'Merriweather', serif",
    preview: 'Aa',
    description: 'Élégant'
  },
  { 
    id: 'comic', 
    name: 'BD', 
    family: "'Comic Neue', cursive",
    preview: 'Aa',
    description: 'Amusant'
  },
  { 
    id: 'magic', 
    name: 'Magie', 
    family: "'Spectral', serif",
    preview: 'Aa',
    description: 'Mystérieux'
  },
]

// Tailles de police disponibles (comme dans Word)
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]


const DEFAULT_STYLE: TextStyle = {
  fontFamily: "'Merriweather', serif",
  fontSize: 18, // Taille par défaut en pixels
  color: '#ffffff',
  isBold: false,
  isItalic: false,
  textAlign: 'left',
  lineSpacing: 'normal',
}


// ============================================================================
// HOOK : Reconnaissance vocale (Speech-to-Text)
// ============================================================================

interface UseSpeechRecognitionReturn {
  isListening: boolean
  isSupported: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

function useSpeechRecognition(locale: string = 'fr'): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(true) // Default to true, will check on mount
  const recognitionRef = useRef<any>(null)
  const hasInitialized = useRef(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setIsSupported(false)
      return
    }
    
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      console.log('Speech Recognition not supported in this browser')
      setIsSupported(false)
      return
    }
    
    setIsSupported(true)
    
    if (hasInitialized.current) return
    hasInitialized.current = true

    try {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'ru-RU'

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error)
      setIsSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    }
  }, [locale])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('')
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const resetTranscript = () => {
    setTranscript('')
  }

  return { isListening, isSupported, transcript, startListening, stopListening, resetTranscript }
}

const LINE_SPACINGS = {
  tight: { label: 'Serré', value: '1.4' },
  normal: { label: 'Normal', value: '1.7' },
  relaxed: { label: 'Aéré', value: '2.2' },
}

// ============================================================================
// COMPOSANT : Onglet de page
// ============================================================================

interface PageTabProps {
  page: StoryPageLocal
  index: number
  isActive: boolean
  chapter?: Chapter
  onClick: () => void
  onDelete?: () => void
  canDelete: boolean
}

function PageTab({ page, index, isActive, chapter, onClick, onDelete, canDelete }: PageTabProps) {
  const hasContent = page.content.length > 0
  const hasImage = !!page.image
  
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative flex flex-col gap-0.5 px-3 py-2 rounded-t-xl transition-all min-w-[90px] max-w-[140px]',
        'border-t border-l border-r',
        isActive 
          ? 'bg-midnight-800 border-aurora-500/30 text-white -mb-px z-10' 
          : 'bg-midnight-900/50 border-midnight-700/30 text-midnight-400 hover:text-white hover:bg-midnight-800/50'
      )}
      style={{
        borderTopColor: chapter ? chapter.color : undefined,
        borderTopWidth: chapter ? '3px' : '1px'
      }}
      whileHover={{ y: -2 }}
      layout
    >
      {/* Chapitre si assigné */}
      {chapter && (
        <span 
          className="text-[9px] font-medium truncate w-full"
          style={{ color: chapter.color }}
        >
          {chapter.title}
        </span>
      )}
      
      {/* Numéro et indicateurs */}
      <div className="flex items-center gap-1.5 w-full">
        <div className="flex gap-0.5">
        {hasContent && <div className="w-1.5 h-1.5 rounded-full bg-aurora-400" title="Texte" />}
        {hasImage && <div className="w-1.5 h-1.5 rounded-full bg-stardust-400" title="Image" />}
        {!hasContent && !hasImage && <div className="w-1.5 h-1.5 rounded-full bg-midnight-600" />}
      </div>
      
        <span className="truncate text-xs">
        {page.title || `Page ${index + 1}`}
      </span>
      
      {/* Bouton supprimer */}
      {canDelete && isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.()
          }}
            className="ml-auto p-0.5 rounded hover:bg-red-500/20 text-midnight-500 hover:text-red-400 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
      </div>
    </motion.button>
  )
}

// ============================================================================
// COMPOSANT : Vue d'ensemble (miniatures)
// ============================================================================

interface OverviewProps {
  pages: StoryPageLocal[]
  currentPage: number
  onPageSelect: (index: number) => void
  onClose: () => void
}

function Overview({ pages, currentPage, onPageSelect, onClose }: OverviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-midnight-950/90 z-50 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-midnight-900 rounded-2xl p-6 max-w-5xl w-full max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display text-white">Vue d'ensemble</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-midnight-800 text-midnight-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {pages.map((page, index) => (
            <motion.button
              key={page.id}
              onClick={() => {
                onPageSelect(index)
                onClose()
              }}
              className={cn(
                'aspect-[3/4] rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all',
                'border-2',
                currentPage === index
                  ? 'border-aurora-500 bg-aurora-500/10'
                  : 'border-midnight-700 bg-midnight-800/50 hover:border-midnight-600'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Miniature */}
              {page.image ? (
                <div 
                  className="w-full h-16 rounded bg-cover bg-center"
                  style={{ backgroundImage: `url(${page.image})` }}
                />
              ) : page.content ? (
                <div className="w-full h-16 rounded bg-midnight-700/50 p-2 overflow-hidden">
                  <p className="text-[6px] text-midnight-400 leading-tight line-clamp-6">
                    {page.content}
                  </p>
                </div>
              ) : (
                <div className="w-full h-16 rounded bg-midnight-700/30 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-midnight-600" />
                </div>
              )}
              
              {/* Titre */}
              <span className={cn(
                'text-xs truncate w-full text-center',
                currentPage === index ? 'text-aurora-300' : 'text-midnight-400'
              )}>
                {page.title || `Page ${index + 1}`}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// COMPOSANT : Vue Structure (chapitres et organisation)
// ============================================================================

interface StructureViewProps {
  pages: StoryPageLocal[]
  chapters: Chapter[]
  currentPage: number
  storyStructure?: string
  onPageSelect: (index: number) => void
  onAddChapter: (chapter: Chapter) => void
  onDeleteChapter: (chapterId: string) => void
  onAssignPageToChapter: (pageIndex: number, chapterId: string | undefined) => void
  onClose: () => void
}

const CHAPTER_TYPES = [
  { type: 'intro' as const, label: 'Introduction', color: '#22c55e', icon: '📖' },
  { type: 'development' as const, label: 'Développement', color: '#3b82f6', icon: '📝' },
  { type: 'climax' as const, label: 'Moment clé', color: '#f97316', icon: '⚡' },
  { type: 'conclusion' as const, label: 'Conclusion', color: '#8b5cf6', icon: '🎬' },
  { type: 'custom' as const, label: 'Personnalisé', color: '#ec4899', icon: '✨' },
]

function StructureView({ 
  pages, 
  chapters, 
  currentPage, 
  storyStructure,
  onPageSelect, 
  onAddChapter,
  onDeleteChapter,
  onAssignPageToChapter,
  onClose 
}: StructureViewProps) {
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [selectedType, setSelectedType] = useState<Chapter['type']>('custom')
  const [showAddChapter, setShowAddChapter] = useState(false)

  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) return
    const typeConfig = CHAPTER_TYPES.find(t => t.type === selectedType)!
    onAddChapter({
      id: Date.now().toString(),
      title: newChapterTitle,
      type: selectedType,
      color: typeConfig.color,
    })
    setNewChapterTitle('')
    setShowAddChapter(false)
  }

  // Grouper les pages par chapitre
  const pagesByChapter = chapters.map(chapter => ({
    chapter,
    pages: pages.map((p, i) => ({ ...p, index: i })).filter(p => p.chapterId === chapter.id)
  }))
  
  const unassignedPages = pages.map((p, i) => ({ ...p, index: i })).filter(p => !p.chapterId)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-midnight-950/90 z-50 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-midnight-900 rounded-2xl p-6 max-w-4xl w-full max-h-[85vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ListTree className="w-6 h-6 text-aurora-400" />
            <h2 className="text-xl font-display text-white">Structure de l'histoire</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-midnight-800 text-midnight-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre de progression visuelle */}
        <div className="mb-6 p-4 bg-midnight-800/50 rounded-xl">
          <p className="text-sm text-midnight-400 mb-3">Progression de l'histoire</p>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-midnight-700">
            {chapters.map((chapter, i) => {
              const chapterPages = pages.filter(p => p.chapterId === chapter.id)
              const width = (chapterPages.length / Math.max(pages.length, 1)) * 100
              return (
                <div
                  key={chapter.id}
                  className="h-full transition-all"
                  style={{ 
                    backgroundColor: chapter.color, 
                    width: `${width}%`,
                    minWidth: chapterPages.length > 0 ? '8px' : '0'
                  }}
                  title={`${chapter.title} (${chapterPages.length} pages)`}
                />
              )
            })}
            {unassignedPages.length > 0 && (
              <div
                className="h-full bg-midnight-600"
                style={{ width: `${(unassignedPages.length / pages.length) * 100}%` }}
                title={`Non assignées (${unassignedPages.length} pages)`}
              />
            )}
          </div>
          <div className="flex justify-between mt-2 text-xs text-midnight-500">
            <span>Début</span>
            <span>{pages.length} pages au total</span>
            <span>Fin</span>
          </div>
        </div>

        {/* Chapitres */}
        <div className="space-y-4">
          {pagesByChapter.map(({ chapter, pages: chapterPages }) => (
            <div key={chapter.id} className="rounded-xl border border-midnight-700/50 overflow-hidden">
              <div 
                className="flex items-center justify-between p-3"
                style={{ backgroundColor: `${chapter.color}20` }}
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4" style={{ color: chapter.color }} />
                  <span className="font-medium text-white">{chapter.title}</span>
                  <span className="text-xs text-midnight-400">
                    ({chapterPages.length} {chapterPages.length > 1 ? 'pages' : 'page'})
                  </span>
                </div>
                <button
                  onClick={() => onDeleteChapter(chapter.id)}
                  className="p-1.5 rounded hover:bg-midnight-800/50 text-midnight-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              {chapterPages.length > 0 ? (
                <div className="p-3 grid grid-cols-6 gap-2">
                  {chapterPages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => {
                        onPageSelect(page.index)
                        onClose()
                      }}
                      className={cn(
                        'aspect-[3/4] rounded-lg p-2 flex flex-col items-center justify-center gap-1 transition-all text-xs',
                        'border',
                        currentPage === page.index
                          ? 'border-aurora-500 bg-aurora-500/10'
                          : 'border-midnight-700 bg-midnight-800/30 hover:border-midnight-600'
                      )}
                    >
                      <FileText className="w-4 h-4 text-midnight-400" />
                      <span className="text-midnight-300 truncate w-full text-center">
                        P.{page.index + 1}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="p-3 text-sm text-midnight-500 italic">
                  Glisse des pages ici ou clique sur une page non assignée
                </p>
              )}
            </div>
          ))}

          {/* Pages non assignées */}
          {unassignedPages.length > 0 && (
            <div className="rounded-xl border border-midnight-700/50 border-dashed overflow-hidden">
              <div className="flex items-center gap-2 p-3 bg-midnight-800/30">
                <FileText className="w-4 h-4 text-midnight-500" />
                <span className="text-midnight-400">Pages non assignées</span>
              </div>
              <div className="p-3 grid grid-cols-6 gap-2">
                {unassignedPages.map((page) => (
                  <div key={page.id} className="relative group">
                    <button
                      onClick={() => {
                        onPageSelect(page.index)
                        onClose()
                      }}
                      className={cn(
                        'w-full aspect-[3/4] rounded-lg p-2 flex flex-col items-center justify-center gap-1 transition-all text-xs',
                        'border',
                        currentPage === page.index
                          ? 'border-aurora-500 bg-aurora-500/10'
                          : 'border-midnight-700 bg-midnight-800/30 hover:border-midnight-600'
                      )}
                    >
                      <FileText className="w-4 h-4 text-midnight-400" />
                      <span className="text-midnight-300 truncate w-full text-center">
                        P.{page.index + 1}
                      </span>
                    </button>
                    {/* Menu pour assigner à un chapitre */}
                    {chapters.length > 0 && (
                      <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              onAssignPageToChapter(page.index, e.target.value)
                            }
                          }}
                          className="w-6 h-6 rounded-full bg-aurora-500 text-white text-xs cursor-pointer appearance-none text-center"
                          title="Assigner à un chapitre"
                          defaultValue=""
                        >
                          <option value="" disabled>+</option>
                          {chapters.map(ch => (
                            <option key={ch.id} value={ch.id}>{ch.title}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ajouter un chapitre */}
        <div className="mt-6">
          {showAddChapter ? (
            <div className="p-4 bg-midnight-800/50 rounded-xl space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="Nom du chapitre..."
                  className="flex-1 bg-midnight-900/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-aurora-500/30"
                  autoFocus
                />
                <button
                  onClick={handleAddChapter}
                  disabled={!newChapterTitle.trim()}
                  className="px-4 py-2 rounded-lg bg-aurora-500 text-white text-sm font-medium disabled:opacity-50"
                >
                  Ajouter
                </button>
                <button
                  onClick={() => setShowAddChapter(false)}
                  className="px-3 py-2 rounded-lg bg-midnight-700 text-midnight-300 text-sm"
                >
                  Annuler
                </button>
              </div>
              <div className="flex gap-2">
                {CHAPTER_TYPES.map((type) => (
                  <button
                    key={type.type}
                    onClick={() => {
                      setSelectedType(type.type)
                      if (!newChapterTitle) setNewChapterTitle(type.label)
                    }}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all',
                      selectedType === type.type
                        ? 'ring-2 ring-white/50'
                        : 'opacity-70 hover:opacity-100'
                    )}
                    style={{ backgroundColor: `${type.color}30`, color: type.color }}
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddChapter(true)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-midnight-700 hover:border-aurora-500/50 text-midnight-400 hover:text-aurora-400 transition-colors"
            >
              <FolderPlus className="w-5 h-5" />
              <span>Ajouter un chapitre</span>
            </button>
          )}
        </div>

        {/* Suggestions de structure */}
        {chapters.length === 0 && (
          <div className="mt-6 p-4 bg-aurora-500/10 rounded-xl border border-aurora-500/20">
            <p className="text-sm text-aurora-300 mb-3">💡 Suggestions de structure</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  CHAPTER_TYPES.slice(0, 4).forEach((type, i) => {
                    setTimeout(() => {
                      onAddChapter({
                        id: Date.now().toString() + i,
                        title: type.label,
                        type: type.type,
                        color: type.color,
                      })
                    }, i * 100)
                  })
                }}
                className="px-3 py-2 rounded-lg bg-midnight-800 hover:bg-midnight-700 text-sm text-white transition-colors"
              >
                📚 Structure classique (4 parties)
              </button>
              <button
                onClick={() => {
                  ['Chapitre 1', 'Chapitre 2', 'Chapitre 3'].forEach((title, i) => {
                    setTimeout(() => {
                      onAddChapter({
                        id: Date.now().toString() + i,
                        title,
                        type: 'custom',
                        color: ['#3b82f6', '#22c55e', '#f97316'][i],
                      })
                    }, i * 100)
                  })
                }}
                className="px-3 py-2 rounded-lg bg-midnight-800 hover:bg-midnight-700 text-sm text-white transition-colors"
              >
                📖 3 chapitres
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// COMPOSANT : Barre de formatage (contentEditable + execCommand)
// ============================================================================

interface FormatBarProps {
  style: TextStyle
  onStyleChange: (style: TextStyle) => void
}

function FormatBar({ style, onStyleChange }: FormatBarProps) {
  const [showFonts, setShowFonts] = useState(false)
  const [showFontSizes, setShowFontSizes] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const [lastUsedColor, setLastUsedColor] = useState('#ef4444')
  const [lastUsedSize, setLastUsedSize] = useState(style.fontSize)
  const [detectedFontFamily, setDetectedFontFamily] = useState(style.fontFamily)
  const isFormattingRef = useRef(false)
  
  // Refs pour éviter les re-renders inutiles
  const lastDetectedSizeRef = useRef(style.fontSize)
  const lastDetectedFontRef = useRef(style.fontFamily)
  
  // Détecter la taille de police et la police au curseur
  useEffect(() => {
    const detectFontStyles = () => {
      // Ignorer pendant le formatage
      if (isFormattingRef.current) return
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        let node: Node | null = range.startContainer
        
        // Remonter jusqu'à trouver un élément avec un style
        while (node && node.nodeType !== Node.ELEMENT_NODE) {
          node = node.parentNode
        }
        
        if (node && node instanceof HTMLElement) {
          // Vérifier si on est dans un contentEditable
          const editor = node.closest?.('[contenteditable="true"]')
          if (editor) {
            const computedStyle = window.getComputedStyle(node)
            
            // Détecter la taille (seulement si différente)
            const fontSize = parseInt(computedStyle.fontSize, 10)
            if (fontSize && !isNaN(fontSize) && fontSize !== lastDetectedSizeRef.current) {
              lastDetectedSizeRef.current = fontSize
              setLastUsedSize(fontSize)
            }
            
            // Détecter la police (seulement si différente)
            const fontFamily = computedStyle.fontFamily
            if (fontFamily) {
              const cleanFont = fontFamily.split(',')[0].replace(/['"]/g, '').trim()
              const matchedFont = FONTS.find(f => 
                fontFamily.toLowerCase().includes(f.family.toLowerCase()) ||
                cleanFont.toLowerCase() === f.family.toLowerCase()
              )
              if (matchedFont && matchedFont.family !== lastDetectedFontRef.current) {
                lastDetectedFontRef.current = matchedFont.family
                setDetectedFontFamily(matchedFont.family)
              }
            }
          }
        }
      }
    }
    
    document.addEventListener('selectionchange', detectFontStyles)
    return () => document.removeEventListener('selectionchange', detectFontStyles)
  }, [])
  
  // Ref pour sauvegarder la sélection avant un clic sur la toolbar
  const savedRangeRef = useRef<{ text: string; range: Range | null }>({ text: '', range: null })
  
  // Sauvegarder la sélection actuelle (appelé automatiquement sur selectionchange)
  const captureSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      // Vérifier que la sélection est dans une zone contentEditable
      const anchorNode = selection.anchorNode
      if (anchorNode) {
        const editor = (anchorNode as Element).closest?.('[contenteditable="true"]') || 
                       anchorNode.parentElement?.closest('[contenteditable="true"]')
        if (editor) {
          savedRangeRef.current = {
            text: selection.toString(),
            range: selection.getRangeAt(0).cloneRange()
          }
        }
      }
    }
  }, [])
  
  // Écouter les changements de sélection
  useEffect(() => {
    document.addEventListener('selectionchange', captureSelection)
    return () => document.removeEventListener('selectionchange', captureSelection)
  }, [captureSelection])
  
  // Restaurer la sélection si nécessaire et appliquer un formatage
  const applyFormatWithRestore = useCallback((formatFn: () => void) => {
    // Vérifier d'abord s'il y a une sélection active
    const currentSelection = window.getSelection()
    const hasActiveSelection = currentSelection && currentSelection.rangeCount > 0 && !currentSelection.isCollapsed
    
    if (hasActiveSelection) {
      // Sélection déjà active, appliquer directement
      formatFn()
    } else {
      // Pas de sélection active, essayer de restaurer
      const { range, text } = savedRangeRef.current
      if (range && text) {
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
        }
        formatFn()
      }
    }
  }, [])

  const currentFont = FONTS.find(f => f.family === detectedFontFamily) || FONTS.find(f => f.family === style.fontFamily) || FONTS[3]
  
  // Appliquer gras au texte sélectionné
  const applyBold = () => {
    isFormattingRef.current = true
    document.execCommand('bold', false)
    setTimeout(() => { isFormattingRef.current = false }, 50)
  }
  
  // Appliquer italique au texte sélectionné
  const applyItalic = () => {
    isFormattingRef.current = true
    document.execCommand('italic', false)
    setTimeout(() => { isFormattingRef.current = false }, 50)
  }
  
  // Appliquer une couleur au texte sélectionné
  const applyColor = (color: string) => {
    isFormattingRef.current = true
    document.execCommand('foreColor', false, color)
    setLastUsedColor(color)
    setShowColors(false)
    setTimeout(() => { isFormattingRef.current = false }, 50)
  }
  
  // Appliquer une taille de police au texte sélectionné uniquement
  const applyFontSize = (size: number) => {
    const { range, text } = savedRangeRef.current
    if (range && text) {
      // Restaurer la sélection
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
        
        const currentRange = selection.getRangeAt(0)
        
        // Extraire le contenu et nettoyer les tailles existantes
        const fragment = currentRange.extractContents()
        const tempDiv = document.createElement('div')
        tempDiv.appendChild(fragment)
        
        // Retirer les font-size existants des éléments enfants
        tempDiv.querySelectorAll('[style]').forEach(el => {
          (el as HTMLElement).style.fontSize = ''
        })
        // Retirer aussi les spans vides de style
        tempDiv.querySelectorAll('span').forEach(el => {
          if (!el.getAttribute('style') || el.getAttribute('style')?.trim() === '') {
            el.replaceWith(...el.childNodes)
          }
        })
        
        // Créer le nouveau span avec la taille
        const span = document.createElement('span')
        span.style.fontSize = `${size}px`
        span.innerHTML = tempDiv.innerHTML
        currentRange.insertNode(span)
        
        // Re-sélectionner le contenu du span créé
        const newRange = document.createRange()
        newRange.selectNodeContents(span)
        selection.removeAllRanges()
        selection.addRange(newRange)
        
        // Sauvegarder la nouvelle sélection
        savedRangeRef.current = {
          text: span.textContent || '',
          range: newRange.cloneRange()
        }
        
        lastDetectedSizeRef.current = size
        setLastUsedSize(size)
      }
    }
    setShowFontSizes(false)
  }
  
  // Appliquer une police au texte sélectionné uniquement
  const applyFontFamily = (family: string) => {
    // Vérifier d'abord s'il y a une sélection active
    const currentSelection = window.getSelection()
    const hasActiveSelection = currentSelection && currentSelection.rangeCount > 0 && !currentSelection.isCollapsed
    
    const applyToRange = (range: Range, sel: Selection) => {
      // Extraire le contenu et nettoyer les polices existantes
      const fragment = range.extractContents()
      const tempDiv = document.createElement('div')
      tempDiv.appendChild(fragment)
      
      // Retirer les font-family existants des éléments enfants
      tempDiv.querySelectorAll('[style]').forEach(el => {
        (el as HTMLElement).style.fontFamily = ''
      })
      // Retirer les font tags (ancienne méthode)
      tempDiv.querySelectorAll('font[face]').forEach(el => {
        el.removeAttribute('face')
      })
      // Retirer les spans vides de style
      tempDiv.querySelectorAll('span').forEach(el => {
        if (!el.getAttribute('style') || el.getAttribute('style')?.trim() === '') {
          el.replaceWith(...el.childNodes)
        }
      })
      
      // Créer le nouveau span avec la police
      const span = document.createElement('span')
      span.style.fontFamily = family
      span.innerHTML = tempDiv.innerHTML
      range.insertNode(span)
      
      // Re-sélectionner le contenu du span créé
      const newRange = document.createRange()
      newRange.selectNodeContents(span)
      sel.removeAllRanges()
      sel.addRange(newRange)
      
      lastDetectedFontRef.current = family
      setDetectedFontFamily(family)
    }
    
    if (hasActiveSelection) {
      applyToRange(currentSelection.getRangeAt(0), currentSelection)
    } else {
      // Pas de sélection active, essayer de restaurer
      const { range, text } = savedRangeRef.current
      if (range && text) {
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
          applyToRange(selection.getRangeAt(0), selection)
        }
      }
    }
    setShowFonts(false)
  }
  
  // Insérer des espaces
  const insertSpaces = (count: number) => {
    if (count > 0) {
      document.execCommand('insertText', false, '    ')
    } else {
      for (let i = 0; i < Math.abs(count); i++) {
        document.execCommand('delete', false)
      }
    }
  }
  
  // Insérer un saut de ligne
  const insertLineBreak = () => {
    document.execCommand('insertLineBreak', false)
  }
  
  return (
    <div className="flex items-center gap-2 p-2 bg-midnight-900/50 rounded-xl border border-midnight-700/30 flex-wrap">
      {/* Sélecteur de police */}
      <div className="relative">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowFonts(!showFonts)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-midnight-800/50 hover:bg-midnight-800 text-white transition-colors min-w-[120px]"
          title="Police"
        >
          <span style={{ fontFamily: currentFont.family }} className="text-lg">
            {currentFont.preview}
          </span>
          <span className="text-sm text-midnight-300">{currentFont.name}</span>
          <ChevronRight className={cn("w-4 h-4 ml-auto transition-transform", showFonts && "rotate-90")} />
        </button>
        
        <AnimatePresence>
          {showFonts && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 p-2 bg-midnight-900 rounded-xl border border-midnight-700/50 shadow-xl z-50 w-48"
              onMouseDown={(e) => e.preventDefault()}
            >
              {FONTS.map((font) => (
                <button
                  key={font.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFontFamily(font.family)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                    detectedFontFamily === font.family 
                      ? 'bg-aurora-500/20 text-aurora-300' 
                      : 'hover:bg-midnight-800 text-white'
                  )}
                >
                  <span style={{ fontFamily: font.family }} className="text-xl w-8">
                    {font.preview}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{font.name}</p>
                    <p className="text-xs text-midnight-400">{font.description}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Séparateur */}
      <div className="w-px h-6 bg-midnight-700/50" />
      
      {/* Taille */}
      <div className="relative">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowFontSizes(!showFontSizes)}
          className="flex items-center gap-1 px-2 py-1 rounded text-sm hover:bg-midnight-800 text-midnight-300 min-w-[50px] justify-center"
          title="Taille (sélection)"
        >
          <span>{lastUsedSize}</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        
        <AnimatePresence>
          {showFontSizes && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute top-full left-0 mt-1 glass rounded-lg shadow-xl z-50 p-1 max-h-48 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()}
            >
              {FONT_SIZES.map((size) => (
          <button
            key={size}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFontSize(size)}
            className={cn(
                    'w-full px-3 py-1 text-left text-sm rounded transition-colors',
                    lastUsedSize === size
                ? 'bg-aurora-500/20 text-aurora-300'
                      : 'hover:bg-midnight-800 text-midnight-300'
            )}
          >
                  {size}
          </button>
        ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      
      {/* Gras / Italique */}
      <div className="flex items-center gap-1">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={applyBold}
          className="w-8 h-8 rounded flex items-center justify-center font-bold transition-colors hover:bg-midnight-800 text-midnight-400 hover:text-aurora-300"
          title="Gras"
        >
          B
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={applyItalic}
          className="w-8 h-8 rounded flex items-center justify-center italic transition-colors hover:bg-midnight-800 text-midnight-400 hover:text-aurora-300"
          title="Italique"
        >
          I
        </button>
      </div>
      
      {/* Séparateur */}
      <div className="w-px h-6 bg-midnight-700/50" />
      
      {/* Alignement */}
      <div className="flex items-center gap-1">
        {[
          { id: 'left' as const, icon: AlignLeft },
          { id: 'center' as const, icon: AlignCenter },
          { id: 'right' as const, icon: AlignRight },
        ].map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onStyleChange({ ...style, textAlign: id })}
            className={cn(
              'w-7 h-7 rounded flex items-center justify-center transition-colors',
              style.textAlign === id
                ? 'bg-aurora-500/20 text-aurora-300'
                : 'hover:bg-midnight-800 text-midnight-400'
            )}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
      
      {/* Séparateur */}
      <div className="w-px h-6 bg-midnight-700/50" />
      
      {/* Espaces et saut de ligne */}
      <div className="flex items-center gap-1">
        <div className="flex items-center bg-midnight-800/30 rounded-lg">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertSpaces(-4)}
            className="w-7 h-7 rounded-l-lg flex items-center justify-center text-midnight-400 hover:text-aurora-300 hover:bg-midnight-800 transition-colors"
            title="Retirer des espaces"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-7 flex items-center justify-center text-[10px] text-midnight-300 border-x border-midnight-700/30">
            Tab
          </div>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertSpaces(4)}
            className="w-7 h-7 rounded-r-lg flex items-center justify-center text-midnight-400 hover:text-aurora-300 hover:bg-midnight-800 transition-colors"
            title="Ajouter une tabulation"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
          <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertLineBreak}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-midnight-400 hover:text-aurora-300 hover:bg-midnight-800 transition-colors bg-midnight-800/30"
          title="Saut de ligne"
        >
          <ChevronDown className="w-4 h-4" />
          </button>
          </div>
      
      {/* Séparateur */}
      <div className="w-px h-6 bg-midnight-700/50" />
      
      {/* Couleur */}
      <div className="relative">
          <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowColors(!showColors)}
          className="flex flex-col items-center justify-center w-8 h-8 rounded hover:bg-midnight-800 transition-colors"
          title="Couleur du texte"
        >
          <span className="text-sm font-bold" style={{ color: lastUsedColor }}>A</span>
          <div className="w-5 h-1 rounded-sm" style={{ backgroundColor: lastUsedColor }} />
          </button>
        
        <AnimatePresence>
          {showColors && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-10"
                onClick={() => setShowColors(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                className="absolute top-full left-0 mt-2 p-3 bg-midnight-900 rounded-xl border border-midnight-700/50 shadow-xl z-50"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-midnight-400">Couleur du texte</p>
          <button
                    onClick={() => setShowColors(false)}
                    className="text-midnight-500 hover:text-white text-xs"
          >
                    ✕
          </button>
      </div>
      
                <div className="space-y-1">
                  {/* Gris */}
                  <div className="flex gap-0.5">
                    {['#ffffff', '#e5e5e5', '#a3a3a3', '#737373', '#525252', '#262626', '#000000'].map((color) => (
          <button
                        key={color}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyColor(color)}
                        className="w-5 h-5 rounded-sm transition-all hover:scale-110 hover:ring-1 hover:ring-white/50"
                        style={{ backgroundColor: color, border: color === '#ffffff' ? '1px solid #525252' : 'none' }}
          />
        ))}
                  </div>
                  {/* Couleurs */}
                  {[
                    ['#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#7f1d1d'],
                    ['#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#7c2d12'],
                    ['#fef08a', '#fde047', '#facc15', '#eab308', '#ca8a04', '#a16207', '#713f12'],
                    ['#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#14532d'],
                    ['#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#164e63'],
                    ['#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e3a8a'],
                    ['#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#4c1d95'],
                    ['#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#831843'],
                  ].map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-0.5">
                      {row.map((color) => (
                        <button
                          key={color}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyColor(color)}
                          className="w-5 h-5 rounded-sm transition-all hover:scale-110 hover:ring-1 hover:ring-white/50"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ============================================================================
// COMPOSANT : Zone d'écriture avec titre de page
// ============================================================================

interface WritingAreaProps {
  // Page droite (principale)
  page?: StoryPageLocal
  pageIndex: number
  chapters: Chapter[]
  onContentChange: (content: string) => void
  onTitleChange: (title: string) => void
  onStyleChange: (style: TextStyle) => void
  onChapterChange: (chapterId: string | undefined) => void
  onCreateChapter: (title: string) => void
  onImageAdd: () => void
  locale?: 'fr' | 'en' | 'ru'
  onPrevPage?: () => void
  onNextPage?: () => void
  hasPrevPage?: boolean
  hasNextPage?: boolean
  totalPages?: number
  // Page gauche (livre ouvert)
  leftPage?: StoryPageLocal
  leftPageIndex?: number
  onLeftContentChange?: (content: string) => void
  // Header intégré
  storyTitle?: string
  onStoryTitleChange?: (title: string) => void
  onBack?: () => void
  onShowStructure?: () => void
  onShowOverview?: () => void
  // Callback pour notifier le parent du changement de zoom
  onZoomChange?: (zoomedPage: 'left' | 'right' | null) => void
}

function WritingArea({ page, pageIndex, chapters, onContentChange, onTitleChange, onStyleChange, onChapterChange, onCreateChapter, onImageAdd, locale = 'fr', onPrevPage, onNextPage, hasPrevPage, hasNextPage, totalPages, leftPage, leftPageIndex, onLeftContentChange, storyTitle, onStoryTitleChange, onBack, onShowStructure, onShowOverview, onZoomChange }: WritingAreaProps) {
  const style = page?.style || leftPage?.style || DEFAULT_STYLE
  const editorRef = useRef<HTMLDivElement>(null)
  const leftEditorRef = useRef<HTMLDivElement>(null)
  const zoomedEditorRef = useRef<HTMLDivElement>(null)
  const lastContentRef = useRef<string>(page?.content || '')
  const lastLeftContentRef = useRef<string>(leftPage?.content || '')
  
  // État pour le mode zoom (null = pas de zoom, 'left' = page gauche, 'right' = page droite)
  const [zoomedPage, setZoomedPage] = useState<'left' | 'right' | null>(null)
  
  // Notifier le parent quand le zoom change
  useEffect(() => {
    onZoomChange?.(zoomedPage)
  }, [zoomedPage, onZoomChange])
  
  // Speech recognition for dictation
  const { isListening, isSupported, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition(locale)
  
  // Initialiser le contenu au premier rendu
  useEffect(() => {
    if (editorRef.current && page?.content) {
      editorRef.current.innerHTML = page.content
      lastContentRef.current = page.content
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Initialiser le contenu de la page gauche
  useEffect(() => {
    if (leftEditorRef.current && leftPage?.content) {
      leftEditorRef.current.innerHTML = leftPage.content
      lastLeftContentRef.current = leftPage.content
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Synchroniser le contenu si changé de l'extérieur
  useEffect(() => {
    if (editorRef.current && page && page.content !== lastContentRef.current) {
      editorRef.current.innerHTML = page.content || ''
      lastContentRef.current = page.content || ''
    }
  }, [page?.content])

  useEffect(() => {
    if (leftEditorRef.current && leftPage && leftPage.content !== lastLeftContentRef.current) {
      leftEditorRef.current.innerHTML = leftPage.content || ''
      lastLeftContentRef.current = leftPage.content || ''
    }
  }, [leftPage?.content])

  // Réinitialiser le contenu quand on sort du mode zoom
  useEffect(() => {
    if (zoomedPage === null) {
      // On sort du mode zoom, réinitialiser les éditeurs
      if (editorRef.current && page) {
        editorRef.current.innerHTML = page.content || ''
        lastContentRef.current = page.content || ''
      }
      if (leftEditorRef.current && leftPage) {
        leftEditorRef.current.innerHTML = leftPage.content || ''
        lastLeftContentRef.current = leftPage.content || ''
      }
    }
  }, [zoomedPage]) // eslint-disable-line react-hooks/exhaustive-deps

  // Initialiser le contenu du mode zoom
  useEffect(() => {
    if (zoomedEditorRef.current && zoomedPage) {
      const content = zoomedPage === 'left' ? leftPage?.content : page?.content
      zoomedEditorRef.current.innerHTML = content || ''
    }
  }, [zoomedPage, leftPage?.content, page?.content])
  
  // Gérer les changements de contenu
  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      lastContentRef.current = html
      onContentChange(html)
    }
  }

  const handleLeftInput = () => {
    if (leftEditorRef.current && onLeftContentChange) {
      const html = leftEditorRef.current.innerHTML
      lastLeftContentRef.current = html
      onLeftContentChange(html)
    }
  }
  
  // Append transcript to content when dictation stops
  useEffect(() => {
    if (!isListening && transcript && editorRef.current) {
      editorRef.current.focus()
      document.execCommand('insertText', false, transcript)
      resetTranscript()
    }
  }, [isListening, transcript, resetTranscript])
  
  const placeholders = {
    fr: 'Écris ton histoire ici...',
    en: 'Write your story here...',
    ru: 'Пиши свою историю здесь...',
  }
  
  const titlePlaceholders = {
    fr: 'Titre de la page (optionnel)',
    en: 'Page title (optional)',
    ru: 'Название страницы (необязательно)',
  }
  
  const micLabels = {
    fr: { start: 'Dicter', stop: 'Arrêter', listening: 'J\'écoute...' },
    en: { start: 'Dictate', stop: 'Stop', listening: 'Listening...' },
    ru: { start: 'Диктовать', stop: 'Стоп', listening: 'Слушаю...' },
  }

  // Style du texte (pour le conteneur)
  const textStyle: React.CSSProperties = {
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    lineHeight: LINE_SPACINGS[style.lineSpacing].value,
    fontWeight: style.isBold ? 'bold' : 'normal',
    fontStyle: style.isItalic ? 'italic' : 'normal',
    textAlign: style.textAlign,
  }

  // Compter les mots (enlever les balises HTML)
  const getWordCount = (content: string = '') => {
    const text = content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')
    return text.split(/\s+/).filter(Boolean).length
  }
  
  return (
    <div className="flex-1 flex flex-col">
      {/* Barre d'outils unifiée (titre + outils + actions) */}
      <div className="flex items-center justify-between gap-2 mb-1 relative z-50 px-1">
        {/* Gauche : Retour + Titre */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg text-midnight-400 hover:text-white hover:bg-midnight-800/50 transition-colors"
              title="Retour"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {onStoryTitleChange && (
            <input
              type="text"
              value={storyTitle || ''}
              onChange={(e) => onStoryTitleChange(e.target.value)}
              className="font-display text-sm text-aurora-300 bg-midnight-800/30 rounded-lg px-2 py-1 outline-none border border-transparent focus:border-aurora-500/30 min-w-[120px] max-w-[180px]"
              placeholder="Titre..."
            />
          )}
        </div>
        
        {/* Centre : Outils de formatage */}
        <div className="glass rounded-lg px-2 py-0.5 shadow-lg z-50">
              <FormatBar 
                style={style} 
                onStyleChange={onStyleChange}
              />
            </div>
        
        {/* Droite : Structure + Vue */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {onShowStructure && (
          <button
              onClick={onShowStructure}
              className="p-1.5 rounded-lg bg-midnight-800/50 hover:bg-midnight-800 text-midnight-400 hover:text-white transition-colors"
              title="Structure"
            >
              <ListTree className="w-4 h-4" />
          </button>
          )}
          {onShowOverview && (
            <button
              onClick={onShowOverview}
              className="p-1.5 rounded-lg bg-midnight-800/50 hover:bg-midnight-800 text-midnight-400 hover:text-white transition-colors"
              title="Vue d'ensemble"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* MODE ZOOM - Page unique agrandie */}
      {zoomedPage ? (() => {
        // Déterminer quelle page afficher selon le zoom
        const zPage = zoomedPage === 'left' ? leftPage : page
        const zPageIndex = zoomedPage === 'left' ? (leftPageIndex ?? 0) : pageIndex
        const zHandleInput = () => {
          // Mettre à jour en temps réel pendant l'édition
          if (zoomedEditorRef.current) {
            const html = zoomedEditorRef.current.innerHTML
            if (zoomedPage === 'left' && onLeftContentChange) {
              onLeftContentChange(html)
            } else {
              onContentChange(html)
            }
          }
        }
        
        // Fonction pour synchroniser et quitter le mode zoom
        const exitZoom = () => {
          // Synchroniser le contenu avant de fermer
          if (zoomedEditorRef.current) {
            const html = zoomedEditorRef.current.innerHTML
            if (zoomedPage === 'left' && onLeftContentChange) {
              onLeftContentChange(html)
            } else {
              onContentChange(html)
            }
          }
          setZoomedPage(null)
        }
        
        if (!zPage) return null
        
        return (
        <div 
          className="flex-1 flex items-center justify-center pt-2 cursor-pointer"
          onClick={exitZoom}
        >
          {/* Page zoomée */}
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative flex flex-col shadow-2xl"
            style={{
              height: 'calc(100vh - 220px)',
              maxHeight: 'calc(100vh - 220px)',
              aspectRatio: '2 / 3',
              background: 'linear-gradient(225deg, #fef9f0 0%, #fdf6e8 50%, #fbf2df 100%)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            {/* Bouton réduire en haut à droite */}
            <button
              onClick={(e) => { e.stopPropagation(); exitZoom(); }}
              className="absolute top-2 right-2 z-20 p-2 rounded-full bg-amber-200/80 hover:bg-amber-300 text-amber-700 transition-all shadow-sm hover:shadow"
              title="Revenir au livre"
            >
              <EyeOff className="w-4 h-4" />
            </button>
            
            {/* Texture papier */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
            }} />
            
            {/* En-tête avec chapitre */}
            {zPage.chapterId && (
              <div className="px-8 pt-4 pb-2 text-center border-b border-amber-300/30 relative z-10">
                <span
                  className="text-lg font-serif font-medium"
                  style={{ color: chapters.find(c => c.id === zPage.chapterId)?.color || '#8b7355' }}
                >
                  {chapters.find(c => c.id === zPage.chapterId)?.title}
                </span>
        </div>
      )}
      
            {/* Zone d'écriture avec lignes intégrées */}
            <div className="flex-1 relative overflow-hidden">
              {/* Lignes de cahier */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'repeating-linear-gradient(transparent, transparent 24px, rgba(139, 115, 85, 0.15) 24px, rgba(139, 115, 85, 0.15) 25px)',
                  backgroundSize: '100% 32px',
                }}
              />
              
              {/* Marge rouge */}
              <div className="absolute left-12 top-0 bottom-0 w-px bg-red-300/40 pointer-events-none" />
      
              {/* Zone de texte contentEditable */}
              <div
                ref={zoomedEditorRef}
                contentEditable
                onInput={zHandleInput}
                data-placeholder={placeholders[locale]}
                style={{
                  ...textStyle,
                  color: '#3d3426',
                  lineHeight: '32px',
                }}
          className={cn(
                  'absolute inset-0 px-12 pt-0 pb-12 overflow-y-auto',
                  'font-serif',
                  'focus:outline-none',
                  'empty:before:content-[attr(data-placeholder)] empty:before:text-amber-500/40 empty:before:pointer-events-none'
                )}
              />
          </div>
          
        {/* Barre d'outils en bas */}
            <div className="relative z-10 px-8 py-3 flex items-center justify-between border-t border-amber-300/30 bg-gradient-to-t from-amber-50/80 to-transparent">
              <span className="text-sm text-amber-700/50 font-serif">{getWordCount(zPage.content)} {locale === 'fr' ? 'mots' : 'words'}</span>
          <div className="flex items-center gap-2">
                <button
              onClick={isListening ? stopListening : startListening}
              disabled={!isSupported}
              className={cn(
                    'p-2 rounded-full transition-all',
                    isListening 
                      ? 'text-red-500 bg-red-100 animate-pulse' 
                      : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
                  )}
                  title={isListening ? 'Arrêter' : 'Dicter'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={onImageAdd}
                  className="p-2 rounded-full text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50 transition-all"
                  title="Ajouter une image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Numéro de page */}
            <div className="text-center pb-4 text-amber-600/40 text-sm font-serif relative z-10">
              — Page {zPageIndex + 1} —
            </div>
          </motion.div>
          </div>
        )
      })() : (
      /* LIVRE OUVERT - 2 pages côte à côte */
      <div className="flex-1 flex items-start justify-center overflow-hidden pt-1">
        {/* Flèche gauche */}
        {onPrevPage && (
          <button
            onClick={onPrevPage}
            disabled={!hasPrevPage}
            className={cn(
              'p-2 rounded-full transition-all mr-2',
              hasPrevPage 
                ? 'text-midnight-400 hover:text-white hover:bg-midnight-800/50' 
                : 'text-midnight-700 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        
        <div 
          className="relative flex shadow-2xl"
          style={{
            height: 'calc(100vh - 220px)', // Hauteur fixe pour éviter le redimensionnement
            maxHeight: 'calc(100vh - 220px)',
            perspective: '2000px',
          }}
        >
          {/* Ombre du livre */}
          <div className="absolute -bottom-4 left-4 right-4 h-8 bg-black/30 blur-xl rounded-full" />
          
          {/* PAGE GAUCHE (page d'écriture) */}
          <div 
            className="relative flex flex-col group"
            style={{
              height: '100%',
              aspectRatio: '2 / 3',
              background: 'linear-gradient(135deg, #fef7ed 0%, #fdf4e3 50%, #f9edd8 100%)',
              borderRadius: '8px 0 0 8px',
              boxShadow: 'inset -20px 0 30px -20px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Texture papier subtile */}
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
            }} />
            
            {/* Lignes de cahier */}
            <div className="absolute inset-x-10 top-0 bottom-12" style={{
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 24px, rgba(139, 115, 85, 0.15) 24px, rgba(139, 115, 85, 0.15) 25px)',
              backgroundSize: '100% 32px',
            }} />
            
            {/* Marge rouge (à droite pour page gauche) */}
            <div className="absolute right-10 top-0 bottom-12 w-px bg-red-300/40" />
            
            {/* Zone d'écriture - page gauche TipTap */}
            {leftPage ? (
              <div
                key={`left-${leftPageIndex}-${zoomedPage === null}`}
                ref={leftEditorRef}
                contentEditable
                onInput={handleLeftInput}
                onClick={(e) => e.stopPropagation()}
                data-placeholder={placeholders[locale]}
                style={{
                  ...textStyle,
                  color: '#3d3426',
                  lineHeight: '32px',
                }}
                className={cn(
                  'flex-1 px-10 pt-0 pb-12 overflow-y-auto relative z-10',
                  'font-serif',
                  'focus:outline-none',
                  'empty:before:content-[attr(data-placeholder)] empty:before:text-amber-500/40 empty:before:pointer-events-none'
                )}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-amber-600/30 text-sm font-serif italic">
                  {locale === 'fr' ? 'Début du livre' : 'Start of book'}
                </span>
                    </div>
            )}
            
            {/* Barre d'outils en bas - page gauche */}
            {leftPage && (
              <div 
                className="relative z-10 px-6 py-2 flex items-center justify-between border-t border-amber-300/30 bg-gradient-to-t from-amber-50/80 to-transparent"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs text-amber-700/50 font-serif">
                  {leftPage.content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').split(/\s+/).filter(Boolean).length} {locale === 'fr' ? 'mots' : 'words'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); isListening ? stopListening() : startListening(); }}
                    disabled={!isSupported}
                    className={cn(
                      'p-2 rounded-full transition-all',
                      isListening 
                        ? 'text-red-500 bg-red-100 animate-pulse' 
                        : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
                    )}
                    title={isListening ? 'Arrêter' : 'Dicter'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onImageAdd(); }}
                    className="p-2 rounded-full text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50 transition-all"
                    title="Ajouter une image"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
              </div>
            </div>
            )}
            
            {/* Numéro de page en bas */}
            <div className="text-center pb-3 text-amber-600/40 text-xs font-serif">
              — {leftPageIndex !== undefined ? leftPageIndex + 1 : '—'} —
            </div>
            
            {/* Bouton zoom en haut à gauche (symétrique avec page droite) */}
            {leftPage && (
              <button
                onClick={() => setZoomedPage('left')}
                className="absolute top-2 left-2 z-20 p-2 rounded-full bg-amber-200/80 hover:bg-amber-300 text-amber-700 transition-all shadow-sm hover:shadow group-hover:scale-110"
                title="Agrandir la page"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* RELIURE CENTRALE */}
          <div 
            className="relative z-10 w-4 flex-shrink-0"
            style={{
              background: 'linear-gradient(90deg, #d4a574 0%, #c9956a 30%, #8b6914 50%, #c9956a 70%, #d4a574 100%)',
              boxShadow: '0 0 15px rgba(0,0,0,0.3)',
            }}
          >
            {/* Lignes de reliure */}
            <div className="absolute inset-0 flex flex-col justify-evenly py-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-px bg-amber-900/30 mx-1" />
              ))}
            </div>
          </div>
          
          {/* PAGE DROITE (page d'écriture) */}
          <div 
            className="relative flex flex-col group"
            style={{
              height: '100%',
              aspectRatio: '2 / 3', // Ratio livre standard
              background: 'linear-gradient(225deg, #fef9f0 0%, #fdf6e8 50%, #fbf2df 100%)',
              borderRadius: '0 8px 8px 0',
              boxShadow: 'inset 20px 0 30px -20px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
          >
            {/* Texture papier */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
            }} />
            
            {/* Lignes de cahier - alignées avec la baseline du texte */}
            <div className="absolute inset-x-10 top-0 bottom-12" style={{
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 24px, rgba(139, 115, 85, 0.15) 24px, rgba(139, 115, 85, 0.15) 25px)',
              backgroundSize: '100% 32px', // Même hauteur que lineHeight
            }} />
            
            {/* Marge rouge */}
            <div className="absolute left-10 top-0 bottom-12 w-px bg-red-300/40" />
            
            {/* Zone d'écriture - page droite TipTap */}
            {page ? (
            <div
                key={`right-${pageIndex}-${zoomedPage === null}`}
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onClick={(e) => e.stopPropagation()}
              data-placeholder={placeholders[locale]}
              style={{
                ...textStyle,
                color: '#3d3426',
                lineHeight: '32px',
              }}
          className={cn(
                'flex-1 px-10 pt-0 pb-12 overflow-y-auto relative z-10',
                  'font-serif',
                'focus:outline-none',
                'empty:before:content-[attr(data-placeholder)] empty:before:text-amber-500/40 empty:before:pointer-events-none'
          )}
        />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-amber-600/30 text-sm font-serif italic">
                  {locale === 'fr' ? 'Page suivante...' : 'Next page...'}
                </span>
              </div>
            )}
        
        {/* Barre d'outils en bas */}
            <div 
              className="relative z-10 px-6 py-2 flex items-center justify-between border-t border-amber-300/30 bg-gradient-to-t from-amber-50/80 to-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-amber-700/50 font-serif">{getWordCount(page?.content)} {locale === 'fr' ? 'mots' : 'words'}</span>
              <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); isListening ? stopListening() : startListening(); }}
              disabled={!isSupported}
              className={cn(
                    'p-2 rounded-full transition-all',
                    isListening 
                      ? 'text-red-500 bg-red-100 animate-pulse' 
                      : 'text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50'
                  )}
                  title={isListening ? 'Arrêter' : 'Dicter'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
            <button
              onClick={(e) => { e.stopPropagation(); onImageAdd(); }}
                  className="p-2 rounded-full text-amber-600/60 hover:text-amber-700 hover:bg-amber-200/50 transition-all"
                  title="Ajouter une image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
            
            {/* Numéro de page en bas */}
            <div className="text-center pb-3 text-amber-600/40 text-xs font-serif relative z-10">
              — {pageIndex + 1} —
            </div>
            
            {/* Bouton zoom en haut à droite */}
            <button
              onClick={() => setZoomedPage('right')}
              className="absolute top-2 right-2 z-20 p-2 rounded-full bg-amber-200/80 hover:bg-amber-300 text-amber-700 transition-all shadow-sm hover:shadow group-hover:scale-110"
              title="Agrandir la page"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Flèche droite */}
        {onNextPage && (
          <button
            onClick={onNextPage}
            className="p-2 rounded-full text-midnight-400 hover:text-white hover:bg-midnight-800/50 transition-all ml-2"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
      )}
      
    </div>
  )
}

// ============================================================================
// COMPOSANT : Panneau latéral Luna
// ============================================================================

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface LunaSidePanelProps {
  isOpen: boolean
  onToggle: () => void
  pageContent: string
  pageTitle: string
  pageNumber: number
  totalPages: number
  locale?: 'fr' | 'en' | 'ru'
}

function LunaSidePanel({ 
  isOpen, 
  onToggle, 
  pageContent, 
  pageTitle, 
  pageNumber, 
  totalPages,
  locale = 'fr' 
}: LunaSidePanelProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // TTS
  const { speak, stop, isSpeaking, isAvailable: isTTSAvailable } = useTTS(locale)
  
  // Speech recognition for voice input to Luna
  const { 
    isListening, 
    isSupported: isSpeechSupported, 
    transcript, 
    startListening, 
    stopListening, 
    resetTranscript 
  } = useSpeechRecognition(locale)
  
  // Send transcript to Luna when dictation stops
  useEffect(() => {
    if (!isListening && transcript) {
      sendToLuna(transcript)
      resetTranscript()
    }
  }, [isListening, transcript])
  
  const labels = {
    fr: {
      title: 'Luna',
      subtitle: 'Ton aide pour écrire',
      placeholder: 'Écris à Luna...',
      intro: 'Je suis là pour t\'aider à écrire ton histoire ! 📖✨ Qu\'est-ce que tu veux raconter ?',
      readPage: '📖 Luna, lis ma page !',
      reading: 'Je lis...',
      send: 'Envoyer',
      collapse: 'Réduire',
      expand: 'Luna',
      voiceOn: 'Mode oral activé',
      voiceOff: 'Mode écrit',
    },
    en: {
      title: 'Luna',
      subtitle: 'Your writing helper',
      placeholder: 'Write to Luna...',
      intro: 'I\'m here to help you write your story! 📖✨ What do you want to tell?',
      readPage: '📖 Luna, read my page!',
      reading: 'Reading...',
      send: 'Send',
      collapse: 'Collapse',
      expand: 'Luna',
      voiceOn: 'Voice mode on',
      voiceOff: 'Text mode',
    },
    ru: {
      title: 'Луна',
      subtitle: 'Твой помощник в письме',
      placeholder: 'Напиши Луне...',
      intro: 'Я здесь, чтобы помочь тебе написать историю! 📖✨ Что ты хочешь рассказать?',
      readPage: '📖 Луна, прочитай!',
      reading: 'Читаю...',
      send: 'Отправить',
      collapse: 'Свернуть',
      expand: 'Луна',
      voiceOn: 'Голосовой режим',
      voiceOff: 'Текстовый режим',
    },
  }
  
  const t = labels[locale]

  // Scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initial message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'assistant', content: t.intro }])
    }
  }, [])

  const sendToLuna = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return
    
    // Stop any current speech
    if (isSpeaking) {
      stop()
    }
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setMessage('')
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: 'book',
          chatHistory: messages.slice(-10),
        }),
      })
      
      const data = await response.json()
      
      if (data.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }])
        
        // Speak the response if autoSpeak is enabled
        if (autoSpeak && isTTSAvailable) {
          speak(data.text)
        }
      }
    } catch (error) {
      console.error('Error sending to Luna:', error)
      const errorMessage = locale === 'fr' 
        ? 'Oups, j\'ai eu un petit problème... Réessaie !' 
        : locale === 'en'
        ? 'Oops, I had a little problem... Try again!'
        : 'Ой, у меня небольшая проблема... Попробуй ещё раз!'
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleReadPage = () => {
    if (!pageContent.trim()) {
      sendToLuna(locale === 'fr' 
        ? 'Je n\'ai pas encore commencé à écrire. Tu peux m\'aider ?'
        : locale === 'en'
        ? 'I haven\'t started writing yet. Can you help me?'
        : 'Я ещё не начал писать. Можешь помочь?'
      )
      return
    }
    
    const contextMessage = locale === 'fr'
      ? `Voici ce que j'ai écrit sur la page ${pageNumber}${pageTitle ? ` "${pageTitle}"` : ''} :\n\n"${pageContent}"\n\nAide-moi à continuer !`
      : locale === 'en'
      ? `Here's what I wrote on page ${pageNumber}${pageTitle ? ` "${pageTitle}"` : ''}:\n\n"${pageContent}"\n\nHelp me continue!`
      : `Вот что я написал на странице ${pageNumber}${pageTitle ? ` "${pageTitle}"` : ''}:\n\n"${pageContent}"\n\nПомоги продолжить!`
    
    sendToLuna(contextMessage)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendToLuna(message)
  }

  // Collapsed state - just a button
  if (!isOpen) {
    return (
      <motion.button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-2 px-4 py-3 rounded-xl',
          'bg-gradient-to-r from-aurora-500/20 to-stardust-500/20',
          'border border-aurora-500/30',
          'hover:from-aurora-500/30 hover:to-stardust-500/30',
          'transition-all'
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-aurora-500 to-stardust-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-aurora-300 font-medium">{t.expand}</span>
        <ChevronLeft className="w-4 h-4 text-aurora-400" />
      </motion.button>
    )
  }

  // Expanded panel
  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="h-full flex flex-col bg-midnight-900/50 rounded-2xl border border-midnight-700/30 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-midnight-700/30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aurora-500 to-stardust-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-white">{t.title}</p>
          <p className="text-xs text-midnight-400">{t.subtitle}</p>
        </div>
        
        {/* Toggle Écrit / Oral (même style que DiaryMode) */}
        {isTTSAvailable && (
          <button
            onClick={() => {
              if (isSpeaking) stop()
              setAutoSpeak(!autoSpeak)
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              autoSpeak 
                ? 'bg-aurora-500/20 text-aurora-300 border border-aurora-500/30'
                : 'bg-midnight-700/50 text-midnight-400 border border-midnight-600/30 hover:text-midnight-300'
            )}
            title={autoSpeak ? t.voiceOn : t.voiceOff}
          >
            <Volume2 className={cn("w-3.5 h-3.5", isSpeaking && "animate-pulse")} />
            {autoSpeak 
              ? (locale === 'fr' ? 'Oral' : locale === 'en' ? 'Voice' : 'Голос') 
              : (locale === 'fr' ? 'Écrit' : locale === 'en' ? 'Text' : 'Текст')}
          </button>
        )}
        
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-midnight-800 text-midnight-400 hover:text-white transition-colors"
          title={t.collapse}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'rounded-xl p-3 text-sm',
              msg.role === 'assistant'
                ? 'bg-aurora-500/10 text-aurora-100'
                : 'bg-midnight-800/50 text-white ml-4'
            )}
          >
            <p className="leading-relaxed">{msg.content}</p>
            {/* Bouton écouter pour les messages de Luna */}
            {msg.role === 'assistant' && isTTSAvailable && (
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stop()
                  } else {
                    speak(msg.content)
                  }
                }}
                className={cn(
                  'mt-2 p-1.5 rounded-full transition-all',
                  isSpeaking
                    ? 'bg-aurora-500/30 text-aurora-300'
                    : 'bg-midnight-700/30 text-midnight-400 hover:text-aurora-300 hover:bg-aurora-500/20'
                )}
                title={isSpeaking ? (locale === 'fr' ? 'Arrêter' : locale === 'en' ? 'Stop' : 'Стоп') : (locale === 'fr' ? 'Écouter Luna' : locale === 'en' ? 'Listen to Luna' : 'Слушать Луну')}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        ))}
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-aurora-500/10 rounded-xl p-3 text-sm text-aurora-300"
          >
            <span className="animate-pulse">{t.reading}</span>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Bouton "Luna, lis ma page" */}
      <div className="px-4 pb-2">
        <motion.button
          onClick={handleReadPage}
          disabled={isLoading}
          className={cn(
            'w-full py-2.5 rounded-xl font-medium text-sm transition-all',
            'bg-gradient-to-r from-aurora-500/20 to-stardust-500/20',
            'border border-aurora-500/30',
            'hover:from-aurora-500/30 hover:to-stardust-500/30',
            'text-aurora-200 hover:text-white',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
          whileHover={!isLoading ? { scale: 1.02 } : {}}
          whileTap={!isLoading ? { scale: 0.98 } : {}}
        >
          {t.readPage}
        </motion.button>
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-midnight-700/30">
        <div className="flex gap-2">
          <input
            type="text"
            value={isListening ? (locale === 'fr' ? 'J\'écoute...' : locale === 'en' ? 'Listening...' : 'Слушаю...') : message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.placeholder}
            disabled={isLoading || isListening}
            className="flex-1 px-4 py-2 rounded-xl bg-midnight-800/50 border border-midnight-700/50 text-white placeholder-midnight-500 text-sm focus:outline-none focus:border-aurora-500/30 disabled:opacity-50"
          />
          
          {/* Bouton micro pour parler à Luna */}
          <motion.button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={isLoading || !isSpeechSupported}
            className={cn(
              'px-3 py-2 rounded-xl transition-colors',
              !isSpeechSupported
                ? 'bg-midnight-800/30 text-midnight-600 cursor-not-allowed'
                : isListening 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-midnight-800/50 text-midnight-400 hover:text-aurora-300 hover:bg-midnight-800'
            )}
            animate={isListening ? { scale: [1, 1.1, 1] } : {}}
            transition={isListening ? { repeat: Infinity, duration: 0.8 } : {}}
            title={!isSpeechSupported ? 'Non supporté par ce navigateur' : isListening ? 'Arrêter' : 'Parler à Luna'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </motion.button>
          
          <motion.button
            type="submit"
            disabled={!message.trim() || isLoading || isListening}
            className={cn(
              'p-3 rounded-xl bg-gradient-to-br from-aurora-500 to-aurora-700 text-white',
              (!message.trim() || isLoading || isListening) && 'opacity-50'
            )}
            whileHover={message.trim() && !isLoading && !isListening ? { scale: 1.05 } : {}}
            whileTap={message.trim() && !isLoading && !isListening ? { scale: 0.95 } : {}}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </form>
    </motion.div>
  )
}

// ============================================================================
// COMPOSANT : Sélecteur de structure (simplifié)
// ============================================================================

interface StructureSelectorProps {
  onSelect: (structure: StoryStructure) => void
  locale?: 'fr' | 'en' | 'ru'
}

function StructureSelector({ onSelect, locale = 'fr' }: StructureSelectorProps) {
  const structures: StoryStructure[] = ['tale', 'adventure', 'problem', 'journal', 'loop', 'free']
  
  const icons: Record<StoryStructure, string> = {
    tale: '🏰',
    adventure: '🗺️',
    problem: '🧩',
    journal: '📔',
    loop: '🔄',
    free: '✨',
  }
  
  const titles = {
    fr: 'Choisis un type d\'histoire',
    en: 'Choose a story type',
    ru: 'Выбери тип истории',
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {structures.map((structureId) => {
        const template = STORY_TEMPLATES[structureId]
        
        return (
          <motion.button
            key={structureId}
            onClick={() => onSelect(structureId)}
            className={cn(
              'p-4 rounded-xl text-left transition-all',
              'bg-midnight-800/30 hover:bg-midnight-800/50',
              'border border-midnight-700/30 hover:border-aurora-500/30',
              'group'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-2xl mb-2 block">{icons[structureId]}</span>
            <h3 className="font-medium text-white text-sm group-hover:text-aurora-300 transition-colors">
              {template.name[locale]}
            </h3>
            <p className="text-xs text-midnight-500 mt-1">
              {template.description[locale]}
            </p>
          </motion.button>
        )
      })}
    </div>
  )
}

// ============================================================================
// COMPOSANT PRINCIPAL : BookMode
// ============================================================================

export function BookMode() {
  const { 
    stories,
    currentStory, 
    createStory,
    setCurrentStory,
    updateStoryPage,
    updateStoryPages,
    deleteStory,
    addStoryChapter,
    deleteStoryChapter,
    updateStoryChapters,
  } = useAppStore()
  
  const [storyTitle, setStoryTitle] = useState('')
  const [showLunaPanel, setShowLunaPanel] = useState(true) // Panneau Luna ouvert par défaut
  const [showOverview, setShowOverview] = useState(false)
  const [showStructureSelector, setShowStructureSelector] = useState(false)
  const [showStructureView, setShowStructureView] = useState(false)
  
  // État local pour les pages (plus flexible)
  const [pages, setPages] = useState<StoryPageLocal[]>([
    { id: '1', title: '', content: '' }
  ])
  
  // Chapitres (synchronisés avec le store)
  const [chapters, setChapters] = useState<Chapter[]>([])
  // Navigation par spread (paire de pages) comme un vrai livre
  const [currentSpread, setCurrentSpread] = useState(0)
  // État pour savoir quelle page est zoomée (null = vue double page)
  const [currentZoomedPage, setCurrentZoomedPage] = useState<'left' | 'right' | null>(null)
  
  // Calcul des indices de pages pour le spread courant
  const leftPageIndex = currentSpread * 2
  const rightPageIndex = currentSpread * 2 + 1
  const totalSpreads = Math.ceil(pages.length / 2)
  
  const locale = 'fr' // TODO: get from context
  
  const labels = {
    fr: {
      title: 'Mon Atelier d\'Histoires',
      subtitle: 'Crée des histoires magiques',
      newStory: 'Nouvelle histoire',
      continue: 'Continuer',
      previous: 'Mes histoires',
      titlePlaceholder: 'Le titre de ton histoire...',
      addPage: 'Nouvelle page',
      overview: 'Vue d\'ensemble',
      pages: 'pages',
    },
    en: {
      title: 'My Story Workshop',
      subtitle: 'Create magical stories',
      newStory: 'New story',
      continue: 'Continue',
      previous: 'My stories',
      titlePlaceholder: 'Your story title...',
      addPage: 'New page',
      overview: 'Overview',
      pages: 'pages',
    },
    ru: {
      title: 'Моя Мастерская',
      subtitle: 'Создавай волшебные истории',
      newStory: 'Новая история',
      continue: 'Продолжить',
      previous: 'Мои истории',
      titlePlaceholder: 'Название истории...',
      addPage: 'Новая страница',
      overview: 'Обзор',
      pages: 'страниц',
    },
  }
  
  const t = labels[locale]

  // Référence pour tracker l'ID de l'histoire chargée
  const loadedStoryIdRef = useRef<string | null>(null)
  
  // Initialiser avec une histoire existante (seulement quand on change d'histoire)
  useEffect(() => {
    if (currentStory && currentStory.id !== loadedStoryIdRef.current) {
      console.log('Loading NEW story:', currentStory.title, 'pages:', currentStory.pages, 'chapters:', currentStory.chapters)
      loadedStoryIdRef.current = currentStory.id
      setStoryTitle(currentStory.title)
      
      if (currentStory.pages && currentStory.pages.length > 0) {
        setPages(currentStory.pages.map((p) => ({
          id: p.id,
          title: p.title || '',
          content: p.content || '',
          image: p.image,
          chapter: 1,
          chapterId: p.chapterId,
          style: DEFAULT_STYLE,
        })))
      } else {
        // Si pas de pages, créer une page vide
        setPages([{ id: '1', title: '', content: '', chapter: 1, style: DEFAULT_STYLE }])
      }
      
      // Charger les chapitres depuis le store
      if (currentStory.chapters && currentStory.chapters.length > 0) {
        setChapters(currentStory.chapters.map(c => ({
          id: c.id,
          title: c.title,
          type: c.type,
          color: c.color,
        })))
      } else {
        setChapters([])
      }
      
      setCurrentSpread(0)
      setShowStructureSelector(false)
    } else if (!currentStory) {
      loadedStoryIdRef.current = null
    }
  }, [currentStory])

  const handleAddPage = () => {
    const newPage: StoryPageLocal = {
      id: Math.random().toString(36).substring(2, 9),
      title: '',
      content: '',
      chapter: 1,
    }
    const newPages = [...pages, newPage]
    setPages(newPages)
    // Aller au spread contenant la nouvelle page (dernière page)
    setCurrentSpread(Math.floor((newPages.length - 1) / 2))
    
    // Sauvegarder dans le store
    if (currentStory) {
      updateStoryPages(currentStory.id, newPages.map(p => ({
        id: p.id,
        stepIndex: 0,
        content: p.content,
        image: p.image,
        order: 0,
        chapterId: p.chapterId,
        title: p.title,
      })))
    }
  }

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) return // Garder au moins une page
    const newPages = pages.filter((_, i) => i !== index)
    setPages(newPages)
    // Ajuster le spread si nécessaire
    const newTotalSpreads = Math.ceil(newPages.length / 2)
    if (currentSpread >= newTotalSpreads) {
      setCurrentSpread(Math.max(0, newTotalSpreads - 1))
    }
    
    // Sauvegarder dans le store
    if (currentStory) {
      updateStoryPages(currentStory.id, newPages.map(p => ({
        id: p.id,
        stepIndex: 0,
        content: p.content,
        image: p.image,
        order: 0,
        chapterId: p.chapterId,
        title: p.title,
      })))
    }
  }

  // Modifie le contenu de la page principale (droite si existe, sinon gauche)
  const handleContentChange = (content: string) => {
    const idx = pages[rightPageIndex] ? rightPageIndex : leftPageIndex
    const newPages = [...pages]
    if (pages[idx]) {
      newPages[idx] = { ...newPages[idx], content }
    setPages(newPages)
    
    // Sauvegarder dans le store
    if (currentStory) {
        updateStoryPage(currentStory.id, idx, content, newPages[idx].image)
      }
    }
  }

  const handleTitleChange = (title: string) => {
    const idx = pages[rightPageIndex] ? rightPageIndex : leftPageIndex
    const newPages = [...pages]
    if (pages[idx]) {
      newPages[idx] = { ...newPages[idx], title }
    setPages(newPages)
    }
  }

  const handleStyleChange = (style: TextStyle) => {
    const idx = pages[rightPageIndex] ? rightPageIndex : leftPageIndex
    const newPages = [...pages]
    if (pages[idx]) {
      newPages[idx] = { ...newPages[idx], style }
    setPages(newPages)
    }
  }

  const handleSelectStructure = (structure: StoryStructure) => {
    // Créer l'histoire dans le store
    const newStory = createStory(storyTitle, structure)
    setCurrentStory(newStory)
    
    // Créer les pages locales selon le template
    const template = STORY_TEMPLATES[structure]
    if (structure === 'free') {
      setPages([{ id: '1', title: '', content: '', chapter: 1, style: DEFAULT_STYLE }])
    } else {
      const newPages: StoryPageLocal[] = template.steps.map((step, index) => ({
        id: Math.random().toString(36).substring(2, 9),
        title: step.title[locale],
        content: '',
        chapter: 1,
        style: DEFAULT_STYLE,
      }))
      setPages(newPages)
    }
    setShowStructureSelector(false)
    setCurrentSpread(0)
  }

  // Pages du spread courant
  const leftPage = pages[leftPageIndex]
  const rightPage = pages[rightPageIndex]

  // Vue : pas d'histoire en cours (on vérifie currentStory et non storyTitle pour éviter 
  // de quitter cette vue dès qu'on tape une lettre dans le titre)
  if (!currentStory && !showStructureSelector) {
  return (
    <div className="h-full flex flex-col">
      {/* En-tête */}
      <motion.header 
          className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-4xl text-aurora-300 mb-2 flex items-center gap-3">
          <Feather className="w-8 h-8" />
            {t.title}
        </h1>
          <p className="text-midnight-300">{t.subtitle}</p>
      </motion.header>

      {/* Contenu */}
      <div className="flex-1 glass rounded-3xl p-8">
          <motion.div 
            className="h-full flex flex-col items-center justify-center text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-aurora-500/20 to-stardust-500/20 flex items-center justify-center mb-6 floating">
              <BookOpen className="w-12 h-12 text-aurora-400" />
            </div>
            
            {/* Input titre */}
            <div className="w-full max-w-md mb-6">
              <input
                type="text"
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                placeholder={t.titlePlaceholder}
                className="w-full text-center text-2xl font-display bg-transparent border-b-2 border-midnight-700 focus:border-aurora-500 text-white placeholder-midnight-600 py-2 outline-none transition-colors"
              />
            </div>

            <motion.button
              onClick={() => storyTitle.trim() && setShowStructureSelector(true)}
              disabled={!storyTitle.trim()}
              className={cn(
                'btn-magic flex items-center gap-2 text-lg py-4 px-8',
                !storyTitle.trim() && 'opacity-50 cursor-not-allowed'
              )}
              whileHover={storyTitle.trim() ? { scale: 1.05 } : {}}
              whileTap={storyTitle.trim() ? { scale: 0.95 } : {}}
            >
              <Plus className="w-5 h-5" />
              {t.newStory}
            </motion.button>

            {/* Histoires précédentes */}
            {stories.length > 0 && (
              <div className="mt-12 w-full max-w-lg">
                <h3 className="text-sm uppercase tracking-wider text-midnight-400 mb-4">
                  {t.previous}
                </h3>
                <div className="space-y-2">
                  {stories.slice(0, 5).map((story) => (
                    <motion.div
                      key={story.id}
                      className="w-full p-4 rounded-xl bg-midnight-900/30 hover:bg-midnight-800/30 text-left transition-colors flex items-center gap-3 group"
                      whileHover={{ x: 5 }}
                    >
                      <button
                      onClick={() => {
                        setCurrentStory(story)
                        setStoryTitle(story.title)
                      }}
                        className="flex-1 flex items-center gap-3"
                    >
                      <Book className="w-4 h-4 text-aurora-400" />
                        <span className="flex-1 truncate text-white">{story.title}</span>
                      <span className="text-xs text-midnight-400">
                        {story.pages.length} {t.pages}
                      </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(locale === 'fr' 
                            ? `Supprimer "${story.title}" ?` 
                            : locale === 'en' 
                            ? `Delete "${story.title}"?` 
                            : `Удалить "${story.title}"?`)) {
                            deleteStory(story.id)
                          }
                        }}
                        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-midnight-500 hover:text-red-400 transition-all"
                        title={locale === 'fr' ? 'Supprimer' : locale === 'en' ? 'Delete' : 'Удалить'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    )
  }

  // Vue : sélection structure
  if (showStructureSelector) {
    return (
          <div className="h-full flex flex-col">
        <motion.header className="mb-6">
          <button
            onClick={() => setShowStructureSelector(false)}
            className="text-midnight-400 hover:text-white transition-colors flex items-center gap-2 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour
          </button>
          <h1 className="font-display text-2xl text-white">{storyTitle}</h1>
        </motion.header>
        
        <div className="flex-1 glass rounded-3xl p-8">
          <StructureSelector onSelect={handleSelectStructure} locale={locale} />
          </div>
      </div>
    )
  }

  // Vue : écriture (version compacte - livre maximisé)
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ZONE PRINCIPALE - Livre + Luna + Onglets */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Sous-zone : Livre + Luna */}
        <div className="flex-1 flex gap-1 min-h-0 overflow-hidden">
        {/* ZONE CENTRALE - Livre maximisé */}
          <div className="flex-1 min-w-0 overflow-hidden">
          {leftPage && (
            <WritingArea
              page={rightPage || leftPage}
              pageIndex={rightPage ? rightPageIndex : leftPageIndex}
            chapters={chapters}
              onContentChange={handleContentChange}
              onTitleChange={handleTitleChange}
              onStyleChange={handleStyleChange}
            onChapterChange={(chapterId) => {
                const idx = rightPage ? rightPageIndex : leftPageIndex
              const newPages = pages.map((p, i) => 
                  i === idx ? { ...p, chapterId } : p
              )
              setPages(newPages)
              if (currentStory) {
                updateStoryPages(currentStory.id, newPages.map(p => ({
                  id: p.id,
                  stepIndex: 0,
                  content: p.content,
                  image: p.image,
                  order: 0,
                  chapterId: p.chapterId,
                  title: p.title,
                })))
              }
            }}
            onCreateChapter={(title) => {
              const colors = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b']
              const newChapter: Chapter = {
                id: Date.now().toString(),
                title,
                type: 'custom',
                color: colors[chapters.length % colors.length],
              }
              setChapters(prev => [...prev, newChapter])
              if (currentStory) {
                addStoryChapter(currentStory.id, {
                  id: newChapter.id,
                  title: newChapter.title,
                  type: newChapter.type,
                  color: newChapter.color,
                })
              }
                const idx = rightPage ? rightPageIndex : leftPageIndex
              const newPages = pages.map((p, i) => 
                  i === idx ? { ...p, chapterId: newChapter.id } : p
              )
              setPages(newPages)
              if (currentStory) {
                updateStoryPages(currentStory.id, newPages.map(p => ({
                  id: p.id,
                  stepIndex: 0,
                  content: p.content,
                  image: p.image,
                  order: 0,
                  chapterId: p.chapterId,
                  title: p.title,
                })))
              }
            }}
            onImageAdd={() => {/* TODO */}}
              locale={locale}
              // Navigation par spread (2 pages à la fois)
              onPrevPage={() => setCurrentSpread(Math.max(0, currentSpread - 1))}
            onNextPage={() => {
                if (currentSpread >= totalSpreads - 1) {
                  // Ajouter 2 pages pour le prochain spread
                  handleAddPage()
                  handleAddPage()
                } else {
                  setCurrentSpread(currentSpread + 1)
                }
              }}
              hasPrevPage={currentSpread > 0}
            hasNextPage={true}
            totalPages={pages.length}
              // Page gauche du spread
              leftPage={leftPage}
              leftPageIndex={leftPageIndex}
              onLeftContentChange={(content) => {
                if (leftPage) {
                  const newPages = pages.map((p, i) => 
                    i === leftPageIndex ? { ...p, content } : p
                  )
                  setPages(newPages)
                  if (currentStory) {
                    updateStoryPages(currentStory.id, newPages.map(p => ({
                      id: p.id,
                      stepIndex: 0,
                      content: p.content,
                      image: p.image,
                      order: 0,
                      chapterId: p.chapterId,
                      title: p.title,
                    })))
                  }
                }
              }}
              // Header intégré
              storyTitle={storyTitle}
              onStoryTitleChange={setStoryTitle}
              onBack={() => {
                setStoryTitle('')
                setPages([{ id: '1', title: '', content: '', chapter: 1 }])
                setCurrentSpread(0)
                setCurrentStory(null)
              }}
              onShowStructure={() => setShowStructureView(true)}
              onShowOverview={() => setShowOverview(true)}
              onZoomChange={setCurrentZoomedPage}
            />
        )}
        </div>

          {/* Panneau Luna */}
          <AnimatePresence mode="wait">
            <LunaSidePanel
              isOpen={showLunaPanel}
              onToggle={() => setShowLunaPanel(!showLunaPanel)}
              pageContent={rightPage?.content || ''}
              pageTitle={rightPage?.title || ''}
              pageNumber={rightPageIndex + 1}
              totalPages={pages.length}
              locale={locale}
            />
          </AnimatePresence>
        </div>
        
        {/* BARRE SOUS LE LIVRE - Onglets de pages centrés par rapport au livre */}
        <div className={cn(
          "flex items-center justify-center gap-4 py-3 flex-shrink-0 transition-all",
          showLunaPanel ? "pr-[320px]" : "pr-12" // Compenser la largeur du panneau Luna
        )}>
          {/* Onglets de pages (groupés par spread) */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {pages.map((page, index) => {
              const chapter = chapters.find(c => c.id === page.chapterId)
              const spreadOfPage = Math.floor(index / 2)
              const isLeftOfSpread = index % 2 === 0
              
              // En mode zoom, seule la page zoomée est active
              // En mode double page, les deux pages du spread sont actives
              const isActive = currentZoomedPage !== null
                ? (currentZoomedPage === 'left' && index === leftPageIndex) || (currentZoomedPage === 'right' && index === rightPageIndex)
                : (index === leftPageIndex || index === rightPageIndex)
              
              return (
                <button
                  key={page.id}
                  onClick={() => setCurrentSpread(spreadOfPage)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-sm transition-all',
                    // Arrondi selon position dans le spread (complet si zoom)
                    currentZoomedPage !== null 
                      ? 'rounded-xl'
                      : (isLeftOfSpread ? 'rounded-l-xl' : 'rounded-r-xl'),
                    // Highlight si page active
                    isActive
                      ? 'bg-aurora-500/20 text-white border border-aurora-500/30'
                      : 'text-midnight-400 hover:bg-midnight-800/50 hover:text-white'
                  )}
                >
                    <span className="font-semibold">{index + 1}</span>
                  {/* Point de couleur du chapitre */}
                  {chapter && (
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: chapter.color }}
                      title={chapter.title}
                    />
                  )}
                  {/* Point rose si contenu (et pas de chapitre) */}
                  {!chapter && page.content && (
                    <div className="w-2 h-2 rounded-full bg-aurora-400" />
                  )}
                </button>
              )
            })}
            <button
              onClick={() => {
                handleAddPage()
                handleAddPage()
              }}
              className="p-2 rounded-xl text-midnight-500 hover:text-aurora-400 hover:bg-midnight-800/30 transition-all"
              title="Ajouter 2 pages"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {/* Compteur de spreads */}
          <span className="text-sm text-midnight-400 font-medium">
            {currentSpread + 1} / {totalSpreads}
          </span>
        </div>
      </div>
      
      {/* Vue d'ensemble */}
      <AnimatePresence>
        {showOverview && (
          <Overview
            pages={pages}
            currentPage={rightPageIndex}
            onPageSelect={(index) => setCurrentSpread(Math.floor(index / 2))}
            onClose={() => setShowOverview(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Vue structure */}
      <AnimatePresence>
        {showStructureView && (
          <StructureView
            pages={pages}
            chapters={chapters}
            currentPage={rightPageIndex}
            storyStructure={currentStory?.structure}
            onPageSelect={(index) => setCurrentSpread(Math.floor(index / 2))}
            onAddChapter={(chapter) => {
              setChapters(prev => [...prev, chapter])
              // Sauvegarder dans le store
              if (currentStory) {
                addStoryChapter(currentStory.id, {
                  id: chapter.id,
                  title: chapter.title,
                  type: chapter.type,
                  color: chapter.color,
                })
              }
            }}
            onDeleteChapter={(chapterId) => {
              setChapters(prev => prev.filter(c => c.id !== chapterId))
              // Retirer l'assignation des pages de ce chapitre
              const newPages = pages.map(p => 
                p.chapterId === chapterId ? { ...p, chapterId: undefined } : p
              )
              setPages(newPages)
              // Sauvegarder dans le store
              if (currentStory) {
                deleteStoryChapter(currentStory.id, chapterId)
              }
            }}
            onAssignPageToChapter={(pageIndex, chapterId) => {
              const newPages = pages.map((p, i) => 
                i === pageIndex ? { ...p, chapterId } : p
              )
              setPages(newPages)
              // Sauvegarder dans le store
              if (currentStory) {
                updateStoryPages(currentStory.id, newPages.map(p => ({
                  id: p.id,
                  stepIndex: 0,
                  content: p.content,
                  image: p.image,
                  order: 0,
                  chapterId: p.chapterId,
                  title: p.title,
                })))
              }
            }}
            onClose={() => setShowStructureView(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
