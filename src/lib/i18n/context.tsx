'use client'

import { createContext, useContext, ReactNode, useCallback } from 'react'

// Types
export type Locale = 'fr' | 'en' | 'ru'

interface I18nContextValue {
  locale: Locale
  messages: Record<string, any>
  t: (key: string, values?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

// Helper pour accéder aux clés imbriquées
function getNestedValue(obj: Record<string, any>, path: string): string {
  const keys = path.split('.')
  let result: any = obj
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key]
    } else {
      return path // Retourner la clé si non trouvée
    }
  }
  
  return typeof result === 'string' ? result : path
}

// Helper pour remplacer les variables
function interpolate(str: string, values?: Record<string, string | number>): string {
  if (!values) return str
  
  return str.replace(/\{(\w+)\}/g, (_, key) => {
    return values[key]?.toString() ?? `{${key}}`
  })
}

interface I18nProviderProps {
  locale: Locale
  messages: Record<string, any>
  children: ReactNode
}

export function I18nProvider({ locale, messages, children }: I18nProviderProps) {
  const t = useCallback((key: string, values?: Record<string, string | number>) => {
    const value = getNestedValue(messages, key)
    return interpolate(value, values)
  }, [messages])

  return (
    <I18nContext.Provider value={{ locale, messages, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslations(namespace?: string) {
  const context = useContext(I18nContext)
  
  if (!context) {
    throw new Error('useTranslations must be used within an I18nProvider')
  }

  const { messages, locale } = context

  return useCallback((key: string, values?: Record<string, string | number>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key
    const value = getNestedValue(messages, fullKey)
    return interpolate(value, values)
  }, [messages, namespace])
}

export function useLocale(): Locale {
  const context = useContext(I18nContext)
  
  if (!context) {
    throw new Error('useLocale must be used within an I18nProvider')
  }

  return context.locale
}

