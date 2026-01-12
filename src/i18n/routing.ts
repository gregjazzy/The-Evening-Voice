/**
 * Configuration du routing i18n
 */

export const routing = {
  locales: ['fr', 'en', 'ru'] as const,
  defaultLocale: 'fr' as const,
}

export type Locale = (typeof routing.locales)[number]

