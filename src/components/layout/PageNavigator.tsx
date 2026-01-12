'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLayoutStore } from '@/store/useLayoutStore'
import { cn } from '@/lib/utils'
import {
  Plus,
  Book,
  Stamp,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  Lock
} from 'lucide-react'

export function PageNavigator() {
  const {
    currentBook,
    currentPage,
    createPage,
    deletePage,
    setCurrentPage,
    sealPage,
    completeBook,
  } = useLayoutStore()

  const [showSealConfirm, setShowSealConfirm] = useState(false)

  if (!currentBook) return null

  const currentIndex = currentBook.pages.findIndex((p) => p.id === currentPage?.id)
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < currentBook.pages.length - 1

  const handlePrev = () => {
    if (canGoPrev) {
      setCurrentPage(currentBook.pages[currentIndex - 1].id)
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      setCurrentPage(currentBook.pages[currentIndex + 1].id)
    }
  }

  const handleSeal = () => {
    sealPage()
    setShowSealConfirm(false)
  }

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={!canGoPrev}
          className={cn(
            'p-2 rounded-lg transition-colors',
            canGoPrev 
              ? 'bg-midnight-800/50 hover:bg-midnight-700/50' 
              : 'opacity-30 cursor-not-allowed'
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-sm text-midnight-400">
            Page {currentPage ? currentPage.pageNumber : '-'} / {currentBook.pages.length}
          </p>
        </div>

        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className={cn(
            'p-2 rounded-lg transition-colors',
            canGoNext 
              ? 'bg-midnight-800/50 hover:bg-midnight-700/50' 
              : 'opacity-30 cursor-not-allowed'
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Liste des pages (miniatures) */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {currentBook.pages.map((page, index) => (
          <motion.button
            key={page.id}
            onClick={() => setCurrentPage(page.id)}
            className={cn(
              'flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden relative',
              page.id === currentPage?.id
                ? 'ring-2 ring-aurora-500'
                : 'opacity-70 hover:opacity-100'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {page.backgroundImage ? (
              <img
                src={page.backgroundImage}
                alt={`Page ${page.pageNumber}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-midnight-800 flex items-center justify-center">
                <span className="text-xs text-midnight-400">{page.pageNumber}</span>
              </div>
            )}
            
            {page.isSealed && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Lock className="w-3 h-3 text-stardust-400" />
              </div>
            )}
          </motion.button>
        ))}

        {/* Bouton nouvelle page */}
        <motion.button
          onClick={() => createPage()}
          className="flex-shrink-0 w-16 h-12 rounded-lg border-2 border-dashed border-midnight-600 flex items-center justify-center hover:border-aurora-500/50 hover:bg-aurora-500/10 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5 text-midnight-400" />
        </motion.button>
      </div>

      {/* Actions de page */}
      {currentPage && (
        <div className="space-y-2">
          {!currentPage.isSealed ? (
            <>
              {/* Bouton Sceller */}
              <motion.button
                onClick={() => setShowSealConfirm(true)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-stardust-600 to-stardust-700 text-white font-semibold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Stamp className="w-5 h-5" />
                Sceller la page
              </motion.button>

              {/* Supprimer */}
              <button
                onClick={() => deletePage(currentPage.id)}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-stardust-500/20 text-stardust-300">
              <Check className="w-5 h-5" />
              Page scellée
            </div>
          )}
        </div>
      )}

      {/* Terminer le livre */}
      {currentBook.pages.length > 0 && currentBook.pages.every((p) => p.isSealed) && !currentBook.isComplete && (
        <motion.button
          onClick={completeBook}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-aurora-600 to-dream-600 text-white font-semibold shadow-glow"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Book className="w-5 h-5" />
          Terminer le livre ✨
        </motion.button>
      )}

      {/* Modal de confirmation */}
      <AnimatePresence>
        {showSealConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div 
              className="absolute inset-0 bg-midnight-950/80 backdrop-blur-sm"
              onClick={() => setShowSealConfirm(false)}
            />
            
            <motion.div
              className="relative glass rounded-2xl p-6 max-w-sm mx-4 text-center"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-stardust-500/30 to-stardust-700/30 flex items-center justify-center">
                <Stamp className="w-8 h-8 text-stardust-400" />
              </div>
              
              <h3 className="font-display text-xl text-white mb-2">
                Sceller cette page ?
              </h3>
              <p className="text-sm text-midnight-300 mb-6">
                Une fois scellée, tu ne pourras plus la modifier. 
                Elle sera prête pour le spectacle ! ✨
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSealConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-xl bg-midnight-800/50 text-midnight-300"
                >
                  Annuler
                </button>
                <motion.button
                  onClick={handleSeal}
                  className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-stardust-600 to-stardust-700 text-white font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sceller !
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

