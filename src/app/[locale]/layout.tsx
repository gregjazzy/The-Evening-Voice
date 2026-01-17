import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { I18nProvider, type Locale } from '@/lib/i18n/context'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { ClientLayout } from '@/components/ClientLayout'
import '../globals.css'

// Import statique des messages
import frMessages from '../../../messages/fr.json'
import enMessages from '../../../messages/en.json'
import ruMessages from '../../../messages/ru.json'

// Locales supportées
const locales = ['fr', 'en', 'ru'] as const

const messagesMap: Record<Locale, typeof frMessages> = {
  fr: frMessages,
  en: enMessages,
  ru: ruMessages,
}

export const metadata: Metadata = {
  title: 'La Voix du Soir ✨',
  description: 'Un espace magique pour écrire, créer et rêver',
}

// Générer les pages statiques pour chaque locale
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params

  // Valider que la locale est supportée
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  // Récupérer les messages
  const messages = messagesMap[locale as Locale] || messagesMap.fr

  return (
    <I18nProvider locale={locale as Locale} messages={messages}>
      <AuthProvider>
        <ClientLayout>
          {children}
        </ClientLayout>
      </AuthProvider>
    </I18nProvider>
  )
}
