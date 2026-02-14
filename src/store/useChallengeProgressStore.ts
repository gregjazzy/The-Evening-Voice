/**
 * Store pour la progression du mode Défis
 *
 * Gère :
 * - Meilleurs scores par défi (challengeId → score)
 * - Nombre total de tentatives
 * - Déblocage des niveaux (3 défis réussis au niveau N-1 pour débloquer N)
 * - Seuils de score progressifs (50% → 60% → 70% → 70%)
 * - Synchronisation avec Supabase (profiles.challenge_progress)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ChallengeType = 'reproduce' | 'variations'

interface ChallengeProgressState {
  bestScores: Record<string, number> // challengeId → meilleur score
  totalAttempts: number
  _synced: boolean // true once loaded from server

  // Actions
  recordAttempt: (challengeId: string, score: number, userId?: string) => boolean
  isLevelUnlocked: (type: ChallengeType, level: number) => boolean
  getBestScoreForLevel: (type: ChallengeType, level: number) => number
  getSuccessCountForLevel: (type: ChallengeType, level: number) => number
  getScoreThresholdForLevel: (level: number) => number
  loadFromServer: (userId: string) => Promise<void>
  reset: () => void
}

// Number of challenges with score >= threshold to unlock next level
const REQUIRED_SUCCESSES = 3

// Progressive score thresholds per level
const SCORE_THRESHOLDS: Record<number, number> = {
  1: 50,
  2: 60,
  3: 70,
  4: 70,
  5: 70,
}

// Save to server (fire-and-forget, non-blocking)
function saveToServer(userId: string, bestScores: Record<string, number>, totalAttempts: number) {
  fetch('/api/challenge-progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, bestScores, totalAttempts }),
  }).catch(() => {
    // Silent fail — localStorage is the primary cache
  })
}

// Merge two progress states, keeping the best scores
function mergeProgress(
  local: { bestScores: Record<string, number>; totalAttempts: number },
  remote: { bestScores: Record<string, number>; totalAttempts: number }
): { bestScores: Record<string, number>; totalAttempts: number } {
  const merged: Record<string, number> = { ...remote.bestScores }
  for (const [id, score] of Object.entries(local.bestScores)) {
    merged[id] = Math.max(merged[id] ?? 0, score)
  }
  return {
    bestScores: merged,
    totalAttempts: Math.max(local.totalAttempts, remote.totalAttempts),
  }
}

export const useChallengeProgressStore = create<ChallengeProgressState>()(
  persist(
    (set, get) => ({
      bestScores: {},
      totalAttempts: 0,
      _synced: false,

      recordAttempt: (challengeId: string, score: number, userId?: string) => {
        const { bestScores, totalAttempts } = get()
        const previousBest = bestScores[challengeId] ?? 0
        const isNewRecord = score > previousBest

        const newBestScores = {
          ...bestScores,
          [challengeId]: Math.max(previousBest, score),
        }
        const newTotalAttempts = totalAttempts + 1

        set({ bestScores: newBestScores, totalAttempts: newTotalAttempts })

        // Sync to server
        if (userId) {
          saveToServer(userId, newBestScores, newTotalAttempts)
        }

        return isNewRecord
      },

      isLevelUnlocked: (type: ChallengeType, level: number) => {
        if (level <= 1) return true
        return get().getSuccessCountForLevel(type, level - 1) >= REQUIRED_SUCCESSES
      },

      getBestScoreForLevel: (type: ChallengeType, level: number) => {
        const { bestScores } = get()
        const prefix = `${type}-${level}-`

        let best = 0
        for (const [id, score] of Object.entries(bestScores)) {
          if (id.startsWith(prefix) && score > best) {
            best = score
          }
        }
        return best
      },

      getSuccessCountForLevel: (type: ChallengeType, level: number) => {
        const { bestScores } = get()
        const prefix = `${type}-${level}-`
        const threshold = SCORE_THRESHOLDS[level] ?? 70

        return Object.entries(bestScores).filter(
          ([id, score]) => id.startsWith(prefix) && score >= threshold
        ).length
      },

      getScoreThresholdForLevel: (level: number) => {
        return SCORE_THRESHOLDS[level] ?? 70
      },

      loadFromServer: async (userId: string) => {
        try {
          const res = await fetch(`/api/challenge-progress?userId=${userId}`)
          if (!res.ok) return

          const remote = await res.json()
          if (!remote.bestScores) return

          const local = get()
          const merged = mergeProgress(
            { bestScores: local.bestScores, totalAttempts: local.totalAttempts },
            remote
          )

          set({ ...merged, _synced: true })

          // If merge changed anything, push back to server
          const remoteStr = JSON.stringify(remote.bestScores)
          const mergedStr = JSON.stringify(merged.bestScores)
          if (remoteStr !== mergedStr) {
            saveToServer(userId, merged.bestScores, merged.totalAttempts)
          }
        } catch {
          // Silent fail — use localStorage data
        }
      },

      reset: () => {
        set({ bestScores: {}, totalAttempts: 0, _synced: false })
      },
    }),
    {
      name: 'lavoixdusoir-challenge-progress',
      partialize: (state) => ({
        bestScores: state.bestScores,
        totalAttempts: state.totalAttempts,
      }),
    }
  )
)
