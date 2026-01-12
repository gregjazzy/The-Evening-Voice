'use client'

import { useMemo } from 'react'

/**
 * Fond étoilé qui ne re-render pas quand le parent change
 * Les positions sont calculées une seule fois
 */
export function StarsBackground({ count = 50 }: { count?: number }) {
  // Générer les positions une seule fois avec useMemo
  const stars = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${seededRandom(i * 3) * 100}%`,
      top: `${seededRandom(i * 7 + 1) * 100}%`,
      delay: `${seededRandom(i * 11 + 2) * 3}s`,
      duration: `${2 + seededRandom(i * 13 + 3) * 2}s`,
    }))
  }, [count])

  return (
    <div className="stars-background" aria-hidden="true">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            left: star.left,
            top: star.top,
            animationDelay: star.delay,
            animationDuration: star.duration,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Générateur pseudo-aléatoire basé sur une seed
 * Retourne toujours la même valeur pour la même seed
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

