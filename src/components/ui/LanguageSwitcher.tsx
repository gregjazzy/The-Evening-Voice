'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Check } from 'lucide-react'
import { useLocale } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

const locales = ['fr', 'en', 'ru'] as const
type Locale = (typeof locales)[number]

const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  ru: 'Русский',
}

const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  ru: '🇷🇺',
}

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const changeLocale = (newLocale: Locale) => {
    setIsOpen(false)
    
    // Remplacer la locale dans le pathname
    const segments = pathname.split('/')
    if (locales.includes(segments[1] as Locale)) {
      segments[1] = newLocale
    } else {
      segments.splice(1, 0, newLocale)
    }
    
    router.push(segments.join('/'))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-aurora-900/50 border border-aurora-700/50 text-aurora-200 hover:bg-aurora-800/50 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-lg">{localeFlags[locale]}</span>
        <Globe className="w-4 h-4" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 py-2 min-w-[160px] glass-card rounded-xl border border-aurora-700/50 shadow-xl z-50"
          >
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => changeLocale(loc)}
                className={cn(
                  'w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-aurora-800/50 transition-colors',
                  locale === loc && 'bg-aurora-800/30'
                )}
              >
                <span className="text-lg">{localeFlags[loc]}</span>
                <span className="text-aurora-200 flex-1">{localeNames[loc]}</span>
                {locale === loc && (
                  <Check className="w-4 h-4 text-aurora-400" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
