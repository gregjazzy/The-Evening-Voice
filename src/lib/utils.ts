import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

/**
 * Transforme une URL Supabase Storage en URL de miniature redimensionnée.
 * Utilise le endpoint /render/image/ de Supabase (image transformation).
 * Pour les URLs non-Supabase (R2, blob:, data:), retourne l'URL originale.
 */
export function getThumbnailUrl(url: string, width = 200): string {
  if (!url) return url
  const supabaseObjectPattern = /\/storage\/v1\/object\/public\//
  if (supabaseObjectPattern.test(url)) {
    return url.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    ) + `?width=${width}&resize=contain&quality=75`
  }
  return url
}

export function getMoodEmoji(mood?: string): string {
  switch (mood) {
    case 'happy':
      return '✨'
    case 'sad':
      return '🌙'
    case 'excited':
      return '🎉'
    case 'calm':
      return '🌸'
    case 'dreamy':
      return '💫'
    default:
      return '⭐'
  }
}

