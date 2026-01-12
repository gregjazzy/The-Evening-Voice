import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { I18nProvider, type Locale } from '@/lib/i18n/context'
import { AuthProvider } from '@/components/auth/AuthProvider'
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
    <html lang={locale}>
      <head>
        {/* Google Fonts pour typographies luxe */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Dancing+Script:wght@400;500;600;700&family=Great+Vibes&family=Nunito:wght@300;400;500;600;700&family=Parisienne&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Quicksand:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Meta pour SEO multilingue */}
        <link rel="alternate" hrefLang="fr" href="https://lavoixdusoir.app/fr" />
        <link rel="alternate" hrefLang="en" href="https://lavoixdusoir.app/en" />
        <link rel="alternate" hrefLang="ru" href="https://lavoixdusoir.app/ru" />
        <link rel="alternate" hrefLang="x-default" href="https://lavoixdusoir.app" />
      </head>
      <body className="antialiased">
        <I18nProvider locale={locale as Locale} messages={messages}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
