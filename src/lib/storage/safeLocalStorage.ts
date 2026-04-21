import type { PersistStorage, StorageValue } from 'zustand/middleware'
import { notify } from '@/store/useNotificationStore'

/**
 * Wrapper localStorage défensif pour Zustand persist.
 *
 * Comportement :
 * 1. Avant chaque écriture, on retire les URLs `data:` (base64) qui font
 *    exploser le quota en quelques assets.
 * 2. Si le navigateur lève quand même QuotaExceededError, on supprime la
 *    clé existante (le cache local n'est qu'une optimisation, la source de
 *    vérité est Supabase) et on retente. Échec → on prévient l'utilisateur
 *    sans perdre de données : Supabase a déjà tout.
 *
 * Usage :
 *   persist(creator, { name: 'ma-cle', storage: safeLocalStorage<MyState>() })
 */

type Json = unknown

function isQuotaError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { name?: string; code?: number; message?: string }
  return (
    e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    e.code === 22 ||
    e.code === 1014 ||
    (typeof e.message === 'string' && e.message.toLowerCase().includes('quota'))
  )
}

/**
 * Parcours récursif : remplace toute string commençant par "data:" par "".
 * Les data URLs base64 peuvent peser plusieurs MB chacune.
 */
function stripDataUrls(value: Json): Json {
  if (typeof value === 'string') {
    return value.startsWith('data:') ? '' : value
  }
  if (Array.isArray(value)) {
    return value.map(stripDataUrls)
  }
  if (value && typeof value === 'object') {
    const out: Record<string, Json> = {}
    for (const [k, v] of Object.entries(value as Record<string, Json>)) {
      out[k] = stripDataUrls(v)
    }
    return out
  }
  return value
}

let warnedOnce = false

export function safeLocalStorage<T>(): PersistStorage<T> {
  return {
    getItem: (name) => {
      try {
        const raw = localStorage.getItem(name)
        if (!raw) return null
        return JSON.parse(raw) as StorageValue<T>
      } catch {
        return null
      }
    },

    setItem: (name, value) => {
      const cleaned = stripDataUrls(value as unknown as Json)
      const serialized = JSON.stringify(cleaned)

      try {
        localStorage.setItem(name, serialized)
        return
      } catch (err) {
        if (!isQuotaError(err)) throw err
      }

      // Quota dépassé même après avoir retiré les data URLs.
      // Le cache local n'est qu'une optim — la source de vérité est Supabase.
      // On vide la clé courante et on retente : si la version "fresh" tient,
      // on continue ; sinon on abandonne sans bloquer l'app.
      try {
        localStorage.removeItem(name)
        localStorage.setItem(name, serialized)
        return
      } catch (err) {
        if (!isQuotaError(err)) throw err
      }

      // Dernier recours : on alerte l'utilisateur une seule fois (pas de spam
      // de toasts à chaque touche tapée). Aucune perte : Supabase reste OK.
      if (!warnedOnce) {
        warnedOnce = true
        notify.warning(
          'Cache local plein',
          "Tes données restent sauvegardées en ligne, mais le cache du navigateur est saturé. Vide les données du site dans Safari pour accélérer le chargement."
        )
      }
    },

    removeItem: (name) => {
      try {
        localStorage.removeItem(name)
      } catch {
        // ignore
      }
    },
  }
}
