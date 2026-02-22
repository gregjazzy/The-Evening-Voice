'use client'

import { MontageEditor } from '@/components/montage'
import { ModeIntroModal, useFirstVisit } from '@/components/ui/ModeIntroModal'

/**
 * Mode Montage - Création de livre-disque
 *
 * Le texte de l'histoire est la timeline !
 * L'enfant ancre ses médias, effets et sons sur les mots.
 *
 * Synchronisation avec Supabase gérée par useSupabaseSync (source unique).
 */
export function LayoutMode() {
  // Modale d'introduction (première visite)
  const { isFirstVisit, markAsSeen } = useFirstVisit('montage')

  return (
    <div className="h-full">
      <MontageEditor />
      
      {/* Modale d'introduction - première visite */}
      <ModeIntroModal
        mode="montage"
        isOpen={isFirstVisit}
        onClose={markAsSeen}
      />
    </div>
  )
}
