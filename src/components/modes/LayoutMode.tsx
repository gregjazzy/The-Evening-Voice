'use client'

import { MontageEditor } from '@/components/montage'
import { useMontageSync } from '@/hooks/useMontageSync'
import { ModeIntroModal, useFirstVisit } from '@/components/ui/ModeIntroModal'

/**
 * Mode Montage - Création de livre-disque
 * 
 * Le texte de l'histoire est la timeline !
 * L'enfant ancre ses médias, effets et sons sur les mots.
 * 
 * Synchronisation automatique avec Supabase pour :
 * - Pages et contenu
 * - Effets de texte
 * - Médias ancrés
 * - Sons et musique
 * - Triggers de lumière
 * - Narration et timings
 */
export function LayoutMode() {
  // Active la synchronisation automatique avec Supabase
  useMontageSync()
  
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
