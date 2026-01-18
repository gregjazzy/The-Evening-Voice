/**
 * Bibliothèque de sons pour le montage
 * 
 * Organise les fichiers audio en catégories:
 * - Music: Musiques de fond
 * - Ambiances: Sons d'ambiance en boucle
 * - Effects: Effets sonores courts
 */

// =============================================================================
// TYPES
// =============================================================================

export type SoundCategory = 'animaux' | 'nature' | 'humain' | 'objets' | 'magie' | 'combat' | 'feerique'
export type SoundMood = 'joyeux' | 'triste' | 'suspense' | 'calme' | 'epique'
export type SoundTheme = 'contes' | 'aventure' | 'nature' | 'ville' | 'superheroes'
export type SoundType = 'music' | 'ambiance' | 'effect'

export interface Sound {
  id: string
  name: string
  file: string
  type: SoundType
  category?: SoundCategory
  mood?: SoundMood
  theme?: SoundTheme
  emoji: string
  duration?: number // en secondes (optionnel)
}

// =============================================================================
// LABELS POUR L'UI
// =============================================================================

export const CATEGORY_LABELS: Record<SoundCategory, { label: string; emoji: string }> = {
  animaux: { label: 'Animaux', emoji: '🐾' },
  nature: { label: 'Nature', emoji: '🌿' },
  humain: { label: 'Humain', emoji: '👤' },
  objets: { label: 'Objets', emoji: '📦' },
  magie: { label: 'Magie', emoji: '✨' },
  combat: { label: 'Combat', emoji: '⚔️' },
  feerique: { label: 'Féerique', emoji: '🧚' },
}

export const MOOD_LABELS: Record<SoundMood, { label: string; emoji: string }> = {
  joyeux: { label: 'Joyeux', emoji: '😊' },
  triste: { label: 'Triste', emoji: '😢' },
  suspense: { label: 'Suspense', emoji: '😰' },
  calme: { label: 'Calme', emoji: '😌' },
  epique: { label: 'Épique', emoji: '🔥' },
}

export const THEME_LABELS: Record<SoundTheme, { label: string; emoji: string }> = {
  contes: { label: 'Contes', emoji: '📖' },
  aventure: { label: 'Aventure', emoji: '🗺️' },
  nature: { label: 'Nature', emoji: '🌲' },
  ville: { label: 'Ville', emoji: '🏙️' },
  superheroes: { label: 'Super-héros', emoji: '🦸' },
}

// =============================================================================
// MUSIQUES
// =============================================================================

export const MUSIC_SOUNDS: Sound[] = [
  // Classique & Calme
  { id: 'cello-suite', name: 'Cello Suite (Bach)', file: '/sound/music/cello-suite-no-1-in-g-major-bwv-1007.mp3', type: 'music', mood: 'calme', emoji: '🎻' },
  { id: 'chopin-nocturne', name: 'Nocturne (Chopin)', file: '/sound/music/chopin-nocturne-op9-3.mp3', type: 'music', mood: 'calme', emoji: '🎹' },
  { id: 'ambiance-tranquille', name: 'Ambiance Tranquille', file: '/sound/music/ambiance-tranquille.mp3', type: 'music', mood: 'calme', emoji: '🌙' },
  
  // Joyeux
  { id: 'joyeux', name: 'Musique Joyeuse', file: '/sound/music/joyeux.mp3', type: 'music', mood: 'joyeux', emoji: '🎉' },
  { id: 'tres-joyeux', name: 'Très Joyeux', file: '/sound/music/tres-joyeux.mp3', type: 'music', mood: 'joyeux', emoji: '🎊' },
  
  // Contes & Féerique
  { id: 'feerique', name: 'Musique Féerique', file: '/sound/music/fe-e-rique.mp3', type: 'music', mood: 'calme', theme: 'contes', emoji: '🧚' },
  { id: 'conte-fee-suspense', name: 'Conte de Fées (Suspense)', file: '/sound/music/conte-fee-suspense.mp3', type: 'music', mood: 'suspense', theme: 'contes', emoji: '🏰' },
  
  // Suspense & Aventure
  { id: 'grave-suspense', name: 'Suspense Grave', file: '/sound/music/grave-suspense.mp3', type: 'music', mood: 'suspense', emoji: '😱' },
  { id: 'aventure-epique', name: 'Aventure Épique', file: '/sound/music/aventure-suspense-epique.mp3', type: 'music', mood: 'epique', theme: 'aventure', emoji: '⚔️' },
  
  // Super-héros
  { id: 'super-hero-theme', name: 'Thème Super-héros', file: '/sound/music/superheroes/super-hero-theme.mp3', type: 'music', mood: 'epique', theme: 'superheroes', emoji: '🦸' },
  { id: 'fight-music', name: 'Musique de Combat', file: '/sound/music/superheroes/fight-music.mp3', type: 'music', mood: 'epique', theme: 'superheroes', emoji: '💥' },
  { id: 'superhero-suspense', name: 'Super-héros Suspense', file: '/sound/music/superheroes/superhero-music-suspens.mp3', type: 'music', mood: 'suspense', theme: 'superheroes', emoji: '🦹' },
]

// =============================================================================
// AMBIANCES
// =============================================================================

export const AMBIANCE_SOUNDS: Sound[] = [
  // Nature
  { id: 'bruissement-feuilles', name: 'Bruissement de feuilles', file: '/sound/ambiances/bruissement-feuilles.mp3', type: 'ambiance', category: 'nature', emoji: '🍃' },
  { id: 'eau-qui-coule', name: 'Eau qui coule', file: '/sound/ambiances/eau-qui-coule.mp3', type: 'ambiance', category: 'nature', emoji: '💧' },
  { id: 'petite-pluie', name: 'Petite pluie', file: '/sound/ambiances/petite-pluie.mp3', type: 'ambiance', category: 'nature', emoji: '🌧️' },
  { id: 'grosse-pluie', name: 'Grosse pluie', file: '/sound/ambiances/groose-pluie.mp3', type: 'ambiance', category: 'nature', emoji: '⛈️' },
  { id: 'vent-fort', name: 'Vent fort', file: '/sound/ambiances/vent-fort.mp3', type: 'ambiance', category: 'nature', emoji: '💨' },
  { id: 'tempete', name: 'Tempête', file: '/sound/ambiances/tempete.mp3', type: 'ambiance', category: 'nature', emoji: '🌪️' },
  { id: 'tonnerre-orage', name: 'Tonnerre & Orage', file: '/sound/ambiances/tonnerre-orage.mp3', type: 'ambiance', category: 'nature', emoji: '⚡' },
  { id: 'mer-tempete', name: 'Mer en tempête', file: '/sound/ambiances/mer-tempete.mp3', type: 'ambiance', category: 'nature', emoji: '🌊' },
  
  // Ambiances spéciales
  { id: 'ambiance-mystere', name: 'Ambiance Mystérieuse', file: '/sound/ambiances/ambiance-mystere.mp3', type: 'ambiance', mood: 'suspense', emoji: '🔮' },
  { id: 'ambiance-mysterieuse', name: 'Mystère Profond', file: '/sound/ambiances/ambiance-mysterieuse.mp3', type: 'ambiance', mood: 'suspense', emoji: '👁️' },
  { id: 'ambiance-village', name: 'Ambiance de Village', file: '/sound/ambiances/ambiance-village.mp3', type: 'ambiance', theme: 'ville', emoji: '🏘️' },
  { id: 'bruit-feerique', name: 'Ambiance Féerique', file: '/sound/ambiances/bruit-feerique.mp3', type: 'ambiance', category: 'feerique', emoji: '✨' },
  
  // Ville
  { id: 'sirene-ville', name: 'Sirène de ville', file: '/sound/ambiances/sirene-ville.mp3', type: 'ambiance', theme: 'ville', emoji: '🚨' },
  { id: 'applaudissements', name: 'Applaudissements', file: '/sound/ambiances/applaudissements-foule.mp3', type: 'ambiance', category: 'humain', emoji: '👏' },
]

// =============================================================================
// EFFETS SONORES
// =============================================================================

export const EFFECT_SOUNDS: Sound[] = [
  // Animaux
  { id: 'aboiement-chien', name: 'Aboiement de chien', file: '/sound/effects/aboiement-chien.mp3', type: 'effect', category: 'animaux', emoji: '🐕' },
  { id: 'miaulement-chat', name: 'Miaulement de chat', file: '/sound/effects/miaulement-chat.mp3', type: 'effect', category: 'animaux', emoji: '🐱' },
  { id: 'grognement-loup', name: 'Grognement de loup', file: '/sound/effects/grognement-loup.mp3', type: 'effect', category: 'animaux', emoji: '🐺' },
  { id: 'rugissement-lion', name: 'Rugissement de lion', file: '/sound/effects/rugissement-lyon.mp3', type: 'effect', category: 'animaux', emoji: '🦁' },
  { id: 'cri-elephant', name: 'Cri d\'éléphant', file: '/sound/effects/cri-elephant.mp3', type: 'effect', category: 'animaux', emoji: '🐘' },
  { id: 'vaches-meugle', name: 'Vache meugle', file: '/sound/effects/vaches-meugle.mp3', type: 'effect', category: 'animaux', emoji: '🐄' },
  { id: 'grenouille', name: 'Grenouille croasse', file: '/sound/effects/grenouille-croasse.mp3', type: 'effect', category: 'animaux', emoji: '🐸' },
  { id: 'gallop-cheval', name: 'Galop de cheval', file: '/sound/effects/gallop-cheval.mp3', type: 'effect', category: 'animaux', emoji: '🐴' },
  { id: 'cri-baleines', name: 'Chant de baleines', file: '/sound/effects/cri-baleines.mp3', type: 'effect', category: 'animaux', emoji: '🐋' },
  
  // Oiseaux
  { id: 'cri-chouette', name: 'Cri de chouette', file: '/sound/effects/cri-de-chouette.mp3', type: 'effect', category: 'animaux', emoji: '🦉' },
  { id: 'cri-chouette-2', name: 'Chouette (variante)', file: '/sound/effects/cri-2-chouette.mp3', type: 'effect', category: 'animaux', emoji: '🦉' },
  { id: 'cri-aigle', name: 'Cri d\'aigle', file: '/sound/effects/cri-aigle.mp3', type: 'effect', category: 'animaux', emoji: '🦅' },
  { id: 'cri-coq', name: 'Cri de coq', file: '/sound/effects/cri-coq.mp3', type: 'effect', category: 'animaux', emoji: '🐓' },
  { id: 'cris-mouettes', name: 'Cris de mouettes', file: '/sound/effects/cris-mouettes.mp3', type: 'effect', category: 'animaux', emoji: '🕊️' },
  
  // Dinosaures & Créatures
  { id: 'cri-raptor', name: 'Cri de raptor', file: '/sound/effects/cri-raptor.mp3', type: 'effect', category: 'animaux', emoji: '🦖' },
  { id: 'cri-raptor-2', name: 'Raptor (variante)', file: '/sound/effects/cri-2-raptor.mp3', type: 'effect', category: 'animaux', emoji: '🦖' },
  { id: 'petit-dinosaure', name: 'Petit dinosaure', file: '/sound/effects/bruit-petit-dinosaure.mp3', type: 'effect', category: 'animaux', emoji: '🦕' },
  { id: 'oiseau-prehistorique', name: 'Oiseau préhistorique', file: '/sound/effects/oiseau-prehistorique.mp3', type: 'effect', category: 'animaux', emoji: '🦤' },
  
  // Humains
  { id: 'enfant-rit', name: 'Enfant qui rit', file: '/sound/effects/enfant-rit.mp3', type: 'effect', category: 'humain', emoji: '😄' },
  { id: 'rire-femme', name: 'Rire de femme', file: '/sound/effects/rire-femme.mp3', type: 'effect', category: 'humain', emoji: '😂' },
  { id: 'homme-pleure', name: 'Homme pleure', file: '/sound/effects/homme-pleure.mp3', type: 'effect', category: 'humain', emoji: '😢' },
  { id: 'cri-surprise', name: 'Cri de surprise', file: '/sound/effects/cri-suprise.mp3', type: 'effect', category: 'humain', emoji: '😮' },
  { id: 'homme-cours', name: 'Homme qui court', file: '/sound/effects/homme-cours.mp3', type: 'effect', category: 'humain', emoji: '🏃' },
  { id: 'pas-dehors', name: 'Pas dehors', file: '/sound/effects/pas-dehors.mp3', type: 'effect', category: 'humain', emoji: '👣' },
  { id: 'pas-neige', name: 'Pas dans la neige', file: '/sound/effects/pas-neige.mp3', type: 'effect', category: 'humain', emoji: '🦶' },
  { id: 'pas-geant', name: 'Pas de géant', file: '/sound/effects/bruits-de-pas-geant.mp3', type: 'effect', category: 'humain', emoji: '🦶' },
  
  // Objets & Actions
  { id: 'porte-grince', name: 'Porte qui grince', file: '/sound/effects/porte-grince.mp3', type: 'effect', category: 'objets', emoji: '🚪' },
  { id: 'papier-froisse', name: 'Papier froissé', file: '/sound/effects/papier-froisse.mp3', type: 'effect', category: 'objets', emoji: '📄' },
  { id: 'chute-metal', name: 'Chute d\'objet métallique', file: '/sound/effects/chute-objet-metallique.mp3', type: 'effect', category: 'objets', emoji: '🔩' },
  { id: 'bruit-marteau', name: 'Coup de marteau', file: '/sound/effects/bruit-marteau.mp3', type: 'effect', category: 'objets', emoji: '🔨' },
  { id: 'bruit-outils', name: 'Bruits d\'outils', file: '/sound/effects/bruit-outils.mp3', type: 'effect', category: 'objets', emoji: '🔧' },
  { id: 'bruit-ordinateur', name: 'Bruit d\'ordinateur', file: '/sound/effects/bruit-ordinateur.mp3', type: 'effect', category: 'objets', emoji: '💻' },
  { id: 'coup-hache', name: 'Coup de hache', file: '/sound/effects/cout-hache.mp3', type: 'effect', category: 'objets', emoji: '🪓' },
  { id: 'coup-hache-2', name: 'Coup de hache (variante)', file: '/sound/effects/cout-hache-2.mp3', type: 'effect', category: 'objets', emoji: '🪓' },
  
  // Combat & Action
  { id: 'coup-poing', name: 'Coup de poing', file: '/sound/effects/coup-de-poing.mp3', type: 'effect', category: 'combat', emoji: '👊' },
  { id: 'explosion', name: 'Explosion', file: '/sound/effects/explosion.mp3', type: 'effect', category: 'combat', emoji: '💥' },
  
  // Magie & Science-fiction
  { id: 'teleportation', name: 'Téléportation', file: '/sound/effects/teleportation.mp3', type: 'effect', category: 'magie', emoji: '✨' },
  { id: 'courant-electrique', name: 'Courant électrique', file: '/sound/effects/courant-electric.mp3', type: 'effect', category: 'magie', emoji: '⚡' },
  { id: 'porte-spatial', name: 'Porte spatiale', file: '/sound/effects/ouverture-porte-spatial.mp3', type: 'effect', category: 'magie', emoji: '🌀' },
  
  // === SUPER-HÉROS ===
  // Actions
  { id: 'punch', name: 'Coup de poing (héros)', file: '/sound/effects/superheroes/punch.mp3', type: 'effect', category: 'combat', theme: 'superheroes', emoji: '👊' },
  { id: 'metal-clash', name: 'Choc métallique', file: '/sound/effects/superheroes/metal-clash.mp3', type: 'effect', category: 'combat', theme: 'superheroes', emoji: '⚔️' },
  { id: 'fight-metal-clash', name: 'Combat métallique', file: '/sound/effects/superheroes/fifght-metal-clash.mp3', type: 'effect', category: 'combat', theme: 'superheroes', emoji: '🗡️' },
  { id: 'shield-clash', name: 'Choc de bouclier', file: '/sound/effects/superheroes/shield-clash.mp3', type: 'effect', category: 'combat', theme: 'superheroes', emoji: '🛡️' },
  { id: 'explosion-hero', name: 'Explosion héroïque', file: '/sound/effects/superheroes/explosion.mp3', type: 'effect', category: 'combat', theme: 'superheroes', emoji: '💥' },
  { id: 'glass-shatter', name: 'Verre brisé', file: '/sound/effects/superheroes/glass-shatter.mp3', type: 'effect', category: 'combat', theme: 'superheroes', emoji: '🪟' },
  
  // Pouvoirs
  { id: 'laser-shot', name: 'Tir laser', file: '/sound/effects/superheroes/laser-shot.mp3', type: 'effect', category: 'magie', theme: 'superheroes', emoji: '🔫' },
  { id: 'tir-laser', name: 'Laser (variante)', file: '/sound/effects/superheroes/tir-laser.mp3', type: 'effect', category: 'magie', theme: 'superheroes', emoji: '💫' },
  { id: 'electric-shock', name: 'Choc électrique', file: '/sound/effects/superheroes/electric-shock.mp3', type: 'effect', category: 'magie', theme: 'superheroes', emoji: '⚡' },
  { id: 'energy-hum', name: 'Énergie vibrante', file: '/sound/effects/superheroes/energy-hum.mp3', type: 'effect', category: 'magie', theme: 'superheroes', emoji: '🔮' },
  { id: 'power-rumble', name: 'Grondement de puissance', file: '/sound/effects/superheroes/power-rumble.mp3', type: 'effect', category: 'magie', theme: 'superheroes', emoji: '💪' },
  { id: 'teleport-woosh', name: 'Téléportation', file: '/sound/effects/superheroes/teleport-woosh.mp3', type: 'effect', category: 'magie', theme: 'superheroes', emoji: '✨' },
  
  // Mouvements
  { id: 'cape-swoosh', name: 'Cape qui vole', file: '/sound/effects/superheroes/cape-swoosh.mp3', type: 'effect', category: 'humain', theme: 'superheroes', emoji: '🦸' },
  { id: 'jet-flight', name: 'Vol à réaction', file: '/sound/effects/superheroes/jet-flight.mp3', type: 'effect', category: 'humain', theme: 'superheroes', emoji: '🚀' },
  { id: 'vol-supersonique', name: 'Vol supersonique', file: '/sound/effects/superheroes/vol-supersonique.mp3', type: 'effect', category: 'humain', theme: 'superheroes', emoji: '💨' },
  { id: 'speed-whistle', name: 'Sifflement de vitesse', file: '/sound/effects/superheroes/speed-whistle.mp3', type: 'effect', category: 'humain', theme: 'superheroes', emoji: '⚡' },
  { id: 'powerful-jump', name: 'Saut puissant', file: '/sound/effects/superheroes/powerful-jump.mp3', type: 'effect', category: 'humain', theme: 'superheroes', emoji: '🦘' },
  { id: 'heavy-landing', name: 'Atterrissage lourd', file: '/sound/effects/superheroes/heavy-landing.mp3', type: 'effect', category: 'humain', theme: 'superheroes', emoji: '💥' },
  { id: 'running-steps', name: 'Pas de course', file: '/sound/effects/superheroes/running-steps.mp3', type: 'effect', category: 'humain', theme: 'superheroes', emoji: '🏃' },
  
  // Voix & Réactions
  { id: 'hero-shout', name: 'Cri de héros', file: '/sound/effects/superheroes/hero-shout.mp3', type: 'effect', category: 'humain', theme: 'superheroes', emoji: '🗣️' },
  { id: 'hero-shout-2', name: 'Cri de héros (variante)', file: '/sound/effects/superheroes/hero-shout2.mp3', type: 'effect', category: 'humain', theme: 'superheroes', emoji: '📣' },
  { id: 'victory-shout', name: 'Cri de victoire', file: '/sound/effects/superheroes/victory-shout.mp3', type: 'effect', category: 'humain', theme: 'superheroes', emoji: '🎉' },
  { id: 'crowd-cheer', name: 'Foule en liesse', file: '/sound/effects/superheroes/crowd-cheer.mp3', type: 'effect', category: 'humain', theme: 'superheroes', emoji: '👏' },
  { id: 'applause', name: 'Applaudissements', file: '/sound/effects/superheroes/applause.mp3', type: 'effect', category: 'humain', theme: 'superheroes', emoji: '👏' },
  { id: 'heartbeat', name: 'Battement de cœur', file: '/sound/effects/superheroes/heartbeat.mp3', type: 'effect', category: 'humain', theme: 'superheroes', emoji: '❤️' },
  
  // Effets divers
  { id: 'bruit-radar', name: 'Bruit de radar', file: '/sound/effects/superheroes/bruit-radar.mp3', type: 'effect', category: 'objets', theme: 'superheroes', emoji: '📡' },
  { id: 'bell-ring', name: 'Sonnerie', file: '/sound/effects/superheroes/bell-ring.mp3', type: 'effect', category: 'objets', theme: 'superheroes', emoji: '🔔' },
  { id: 'chain-clink', name: 'Cliquetis de chaînes', file: '/sound/effects/superheroes/chain-clink.mp3', type: 'effect', category: 'objets', theme: 'superheroes', emoji: '⛓️' },
  { id: 'projectile-whistle', name: 'Sifflement de projectile', file: '/sound/effects/superheroes/projectile-whistle.mp3', type: 'effect', category: 'combat', theme: 'superheroes', emoji: '🎯' },
  { id: 'thunder-rumble', name: 'Grondement de tonnerre', file: '/sound/effects/superheroes/thunder-rumble.mp3', type: 'effect', category: 'nature', theme: 'superheroes', emoji: '⛈️' },
  { id: 'wind-howl', name: 'Hurlement du vent', file: '/sound/effects/superheroes/wind-howl.mp3', type: 'effect', category: 'nature', theme: 'superheroes', emoji: '🌬️' },
]

// =============================================================================
// COLLECTIONS COMBINÉES
// =============================================================================

export const ALL_SOUNDS: Sound[] = [
  ...MUSIC_SOUNDS,
  ...AMBIANCE_SOUNDS,
  ...EFFECT_SOUNDS,
]

// Fonctions utilitaires
export const getSoundsByCategory = (category: SoundCategory): Sound[] => {
  return ALL_SOUNDS.filter(s => s.category === category)
}

export const getSoundsByMood = (mood: SoundMood): Sound[] => {
  return ALL_SOUNDS.filter(s => s.mood === mood)
}

export const getSoundsByTheme = (theme: SoundTheme): Sound[] => {
  return ALL_SOUNDS.filter(s => s.theme === theme)
}

export const getSoundsByType = (type: SoundType): Sound[] => {
  return ALL_SOUNDS.filter(s => s.type === type)
}

export const getSoundById = (id: string): Sound | undefined => {
  return ALL_SOUNDS.find(s => s.id === id)
}
