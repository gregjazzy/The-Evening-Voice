/**
 * Données des décorations premium pour les livres
 * 
 * Ce fichier contient toutes les décorations disponibles avec leurs SVG
 * Utilisé par BookMode.tsx pour l'affichage et pdf.ts pour l'export
 */

export type DecorationCategory = 'gold' | 'floral' | 'royal' | 'celestial' | 'artistic' | 'frames'

export interface DecorationItem {
  id: string
  name: string
  category: DecorationCategory
  svg: string  // SVG inline
  defaultScale?: number
  defaultColor?: string
}

// Collection de décorations premium
export const PREMIUM_DECORATIONS: DecorationItem[] = [
  // === ORNEMENTS DORÉS ===
  {
    id: 'gold-corner-1',
    name: 'Coin Baroque',
    category: 'gold',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M0 0 Q50 0 50 50 Q50 25 25 25 Q0 25 0 0 M50 50 Q25 50 25 75 Q25 100 0 100 L0 75 Q25 75 25 50 Q25 25 50 25 Q75 25 75 50 Q75 75 50 75 L50 50" opacity="0.9"/><circle cx="35" cy="35" r="3"/><circle cx="15" cy="15" r="2"/><path d="M5 5 Q15 15 5 25" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'gold-corner-2',
    name: 'Coin Filigrane',
    category: 'gold',
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 95 C5 50 50 5 95 5"/><path d="M15 95 C15 55 55 15 95 15"/><path d="M5 85 C5 45 45 5 85 5"/><circle cx="95" cy="5" r="4" fill="currentColor"/><circle cx="5" cy="95" r="4" fill="currentColor"/><path d="M25 75 Q35 65 45 75 Q55 85 65 75" stroke-width="1.5"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'gold-divider-1',
    name: 'Séparateur Royal',
    category: 'gold',
    svg: `<svg viewBox="0 0 200 40" fill="currentColor"><path d="M0 20 H70 M130 20 H200" stroke="currentColor" stroke-width="1" fill="none"/><path d="M80 20 L90 10 L100 20 L90 30 Z"/><circle cx="100" cy="20" r="8"/><path d="M100 12 L100 8 M100 28 L100 32 M92 20 L88 20 M108 20 L112 20" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="70" cy="20" r="3"/><circle cx="130" cy="20" r="3"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'gold-ornament-1',
    name: 'Ornement Versailles',
    category: 'gold',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 5 C60 20 80 25 80 50 C80 75 60 80 50 95 C40 80 20 75 20 50 C20 25 40 20 50 5Z" opacity="0.3"/><path d="M50 15 C55 25 70 28 70 50 C70 72 55 75 50 85 C45 75 30 72 30 50 C30 28 45 25 50 15Z"/><circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="50" cy="50" r="3"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'gold-scroll-1',
    name: 'Volute Dorée',
    category: 'gold',
    svg: `<svg viewBox="0 0 100 60" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 30 Q10 10 30 10 Q50 10 50 30 Q50 50 70 50 Q90 50 90 30"/><path d="M15 30 Q15 15 30 15 Q45 15 45 30"/><circle cx="10" cy="30" r="4" fill="currentColor"/><circle cx="90" cy="30" r="4" fill="currentColor"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'gold-star',
    name: 'Étoile Dorée',
    category: 'gold',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 5 L58 38 L95 38 L65 60 L75 95 L50 72 L25 95 L35 60 L5 38 L42 38 Z"/></svg>`,
    defaultColor: '#D4AF37',
  },

  // === FLORAUX ===
  {
    id: 'floral-rose-1',
    name: 'Rose Élégante',
    category: 'floral',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><ellipse cx="50" cy="45" rx="15" ry="12" opacity="0.3"/><ellipse cx="50" cy="50" rx="12" ry="10" opacity="0.5"/><ellipse cx="50" cy="53" rx="8" ry="7" opacity="0.7"/><ellipse cx="50" cy="55" rx="5" ry="4"/><path d="M50 62 Q50 75 45 90 M50 62 Q52 75 55 88" stroke="currentColor" fill="none" stroke-width="2"/><ellipse cx="38" cy="78" rx="8" ry="4" transform="rotate(-30 38 78)" opacity="0.6"/><ellipse cx="62" cy="76" rx="8" ry="4" transform="rotate(30 62 76)" opacity="0.6"/></svg>`,
    defaultColor: '#E8B4B8',
  },
  {
    id: 'floral-branch-1',
    name: 'Branche Fleurie',
    category: 'floral',
    svg: `<svg viewBox="0 0 150 60" fill="currentColor"><path d="M10 30 Q40 25 75 30 Q110 35 140 30" stroke="currentColor" fill="none" stroke-width="2"/><circle cx="30" cy="25" r="6" opacity="0.8"/><circle cx="55" cy="22" r="5" opacity="0.6"/><circle cx="80" cy="28" r="7"/><circle cx="105" cy="24" r="5" opacity="0.7"/><circle cx="125" cy="27" r="6" opacity="0.5"/></svg>`,
    defaultColor: '#F4A4BA',
  },
  {
    id: 'floral-wreath-1',
    name: 'Couronne Florale',
    category: 'floral',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="35" stroke="currentColor" fill="none" stroke-width="3" opacity="0.3"/><circle cx="50" cy="15" r="6"/><circle cx="85" cy="50" r="6"/><circle cx="50" cy="85" r="6"/><circle cx="15" cy="50" r="6"/><circle cx="75" cy="25" r="5" opacity="0.7"/><circle cx="75" cy="75" r="5" opacity="0.7"/><circle cx="25" cy="75" r="5" opacity="0.7"/><circle cx="25" cy="25" r="5" opacity="0.7"/></svg>`,
    defaultColor: '#C9A8B4',
  },
  {
    id: 'floral-vine',
    name: 'Vigne',
    category: 'floral',
    svg: `<svg viewBox="0 0 150 60" fill="currentColor"><path d="M10 50 Q40 20 70 40 Q100 60 130 30" stroke="currentColor" fill="none" stroke-width="2"/><ellipse cx="25" cy="35" rx="8" ry="5" transform="rotate(-30 25 35)" opacity="0.6"/><ellipse cx="55" cy="30" rx="7" ry="4" transform="rotate(20 55 30)" opacity="0.6"/><ellipse cx="85" cy="45" rx="8" ry="5" transform="rotate(-15 85 45)" opacity="0.6"/><ellipse cx="115" cy="35" rx="7" ry="4" transform="rotate(25 115 35)" opacity="0.6"/></svg>`,
    defaultColor: '#228B22',
  },
  {
    id: 'floral-bouquet',
    name: 'Bouquet',
    category: 'floral',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 95 Q40 80 50 70 Q60 80 50 95" opacity="0.5"/><circle cx="50" cy="35" r="12" opacity="0.9"/><circle cx="35" cy="45" r="10" opacity="0.7"/><circle cx="65" cy="45" r="10" opacity="0.7"/><circle cx="30" cy="60" r="8" opacity="0.5"/><circle cx="70" cy="60" r="8" opacity="0.5"/><circle cx="45" cy="55" r="9" opacity="0.8"/><circle cx="55" cy="55" r="9" opacity="0.8"/><path d="M40 72 Q50 65 60 72" stroke="currentColor" fill="none" stroke-width="3"/></svg>`,
    defaultColor: '#E8B4B8',
  },

  // === ROYAUX ===
  {
    id: 'royal-crown-1',
    name: 'Couronne Royale',
    category: 'royal',
    svg: `<svg viewBox="0 0 100 80" fill="currentColor"><path d="M15 65 L20 30 L35 45 L50 20 L65 45 L80 30 L85 65 Z" opacity="0.9"/><path d="M10 65 H90 V75 H10 Z"/><circle cx="20" cy="28" r="5"/><circle cx="50" cy="15" r="6"/><circle cx="80" cy="28" r="5"/><rect x="20" y="70" width="60" height="3" opacity="0.5"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'royal-fleurdelis-1',
    name: 'Fleur de Lys',
    category: 'royal',
    svg: `<svg viewBox="0 0 80 100" fill="currentColor"><path d="M40 5 Q45 20 55 25 Q45 30 45 50 L55 50 Q55 70 40 95 Q25 70 25 50 L35 50 Q35 30 25 25 Q35 20 40 5Z"/><ellipse cx="25" cy="25" rx="8" ry="15" transform="rotate(-30 25 25)"/><ellipse cx="55" cy="25" rx="8" ry="15" transform="rotate(30 55 25)"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'royal-shield',
    name: 'Écu',
    category: 'royal',
    svg: `<svg viewBox="0 0 80 100" fill="currentColor"><path d="M10 10 H70 V50 Q70 90 40 95 Q10 90 10 50 Z" opacity="0.3"/><path d="M10 10 H70 V50 Q70 90 40 95 Q10 90 10 50 Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M40 20 L40 80" stroke="currentColor" stroke-width="2" opacity="0.5"/><path d="M20 40 H60" stroke="currentColor" stroke-width="2" opacity="0.5"/></svg>`,
    defaultColor: '#C41E3A',
  },
  {
    id: 'royal-frame',
    name: 'Cadre Royal',
    category: 'royal',
    svg: `<svg viewBox="0 0 120 80" fill="currentColor"><rect x="5" y="5" width="110" height="70" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><path d="M5 20 Q15 25 15 15 Q15 5 25 5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M115 20 Q105 25 105 15 Q105 5 95 5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 60 Q15 55 15 65 Q15 75 25 75" fill="none" stroke="currentColor" stroke-width="2"/><path d="M115 60 Q105 55 105 65 Q105 75 95 75" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="60" cy="5" r="4"/><circle cx="60" cy="75" r="4"/></svg>`,
    defaultColor: '#D4AF37',
  },

  // === CÉLESTES ===
  {
    id: 'celestial-star-1',
    name: 'Étoile Scintillante',
    category: 'celestial',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 5 L58 38 L95 38 L65 60 L75 95 L50 72 L25 95 L35 60 L5 38 L42 38 Z"/><circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/></svg>`,
    defaultColor: '#FFD700',
  },
  {
    id: 'celestial-moon-1',
    name: 'Croissant de Lune',
    category: 'celestial',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M70 10 Q30 25 30 50 Q30 75 70 90 Q40 80 40 50 Q40 20 70 10Z"/><circle cx="25" cy="30" r="2" opacity="0.6"/><circle cx="20" cy="50" r="1.5" opacity="0.4"/><circle cx="25" cy="70" r="2" opacity="0.6"/></svg>`,
    defaultColor: '#F5E6D3',
  },
  {
    id: 'celestial-sun-1',
    name: 'Soleil Radieux',
    category: 'celestial',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="20"/><path d="M50 5 L53 25 L47 25 Z M50 95 L53 75 L47 75 Z M5 50 L25 53 L25 47 Z M95 50 L75 53 L75 47 Z"/><path d="M20 20 L35 32 L32 35 Z M80 20 L68 32 L65 35 Z M20 80 L32 68 L35 65 Z M80 80 L68 68 L65 65 Z" opacity="0.7"/></svg>`,
    defaultColor: '#FFB347',
  },
  {
    id: 'celestial-stars',
    name: 'Étoiles',
    category: 'celestial',
    svg: `<svg viewBox="0 0 120 80" fill="currentColor"><circle cx="20" cy="30" r="4"/><circle cx="45" cy="15" r="3"/><circle cx="70" cy="25" r="5"/><circle cx="55" cy="50" r="3"/><circle cx="90" cy="40" r="4"/><circle cx="100" cy="60" r="3"/><path d="M20 30 L45 15 L70 25 M70 25 L55 50 M70 25 L90 40 L100 60" stroke="currentColor" fill="none" stroke-width="1" opacity="0.5"/></svg>`,
    defaultColor: '#E6E6FA',
  },

  // === ARTISTIQUES ===
  {
    id: 'artistic-butterfly-1',
    name: 'Papillon Élégant',
    category: 'artistic',
    svg: `<svg viewBox="0 0 100 80" fill="currentColor"><ellipse cx="35" cy="30" rx="25" ry="20" opacity="0.8"/><ellipse cx="65" cy="30" rx="25" ry="20" opacity="0.8"/><ellipse cx="30" cy="55" rx="15" ry="12" opacity="0.6"/><ellipse cx="70" cy="55" rx="15" ry="12" opacity="0.6"/><ellipse cx="50" cy="40" rx="4" ry="20"/><path d="M48 20 Q40 5 35 10 M52 20 Q60 5 65 10" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="35" cy="10" r="2"/><circle cx="65" cy="10" r="2"/></svg>`,
    defaultColor: '#DDA0DD',
  },
  {
    id: 'artistic-feather-1',
    name: "Plume d'Or",
    category: 'artistic',
    svg: `<svg viewBox="0 0 60 120" fill="currentColor"><path d="M30 10 Q45 30 45 60 Q45 90 30 110 Q15 90 15 60 Q15 30 30 10Z" opacity="0.3"/><path d="M30 5 Q30 60 30 115" stroke="currentColor" fill="none" stroke-width="2"/><path d="M30 20 Q40 25 42 35 M30 35 Q42 38 45 50 M30 50 Q43 52 47 65 M30 65 Q42 68 45 80 M30 80 Q38 83 40 92" stroke="currentColor" fill="none" stroke-width="1" opacity="0.6"/><path d="M30 20 Q20 25 18 35 M30 35 Q18 38 15 50 M30 50 Q17 52 13 65 M30 65 Q18 68 15 80 M30 80 Q22 83 20 92" stroke="currentColor" fill="none" stroke-width="1" opacity="0.6"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'artistic-heart-1',
    name: 'Cœur Orné',
    category: 'artistic',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 90 Q10 60 10 35 Q10 10 35 10 Q50 10 50 25 Q50 10 65 10 Q90 10 90 35 Q90 60 50 90Z"/><path d="M50 80 Q20 55 20 35 Q20 18 35 18 Q50 18 50 30" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"/></svg>`,
    defaultColor: '#DC143C',
  },

  // === CADRES ===
  {
    id: 'frame-elegant-1',
    name: 'Cadre Élégant',
    category: 'frames',
    svg: `<svg viewBox="0 0 120 80" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="5" width="110" height="70" rx="3"/><rect x="10" y="10" width="100" height="60" rx="2"/><circle cx="10" cy="10" r="3" fill="currentColor"/><circle cx="110" cy="10" r="3" fill="currentColor"/><circle cx="10" cy="70" r="3" fill="currentColor"/><circle cx="110" cy="70" r="3" fill="currentColor"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'frame-ornate-1',
    name: 'Cadre Orné',
    category: 'frames',
    svg: `<svg viewBox="0 0 120 80" fill="currentColor"><rect x="5" y="5" width="110" height="70" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><path d="M5 20 Q15 25 15 15 Q15 5 25 5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M115 20 Q105 25 105 15 Q105 5 95 5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 60 Q15 55 15 65 Q15 75 25 75" fill="none" stroke="currentColor" stroke-width="2"/><path d="M115 60 Q105 55 105 65 Q105 75 95 75" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="60" cy="5" r="4"/><circle cx="60" cy="75" r="4"/></svg>`,
    defaultColor: '#D4AF37',
  },
  {
    id: 'frame-circle-1',
    name: 'Médaillon Cadre',
    category: 'frames',
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="50" cy="5" r="4"/><circle cx="50" cy="95" r="4"/><circle cx="5" cy="50" r="4"/><circle cx="95" cy="50" r="4"/></svg>`,
    defaultColor: '#D4AF37',
  },

  // === ORNEMENTS DORÉS (suite) ===
  { id: 'gold-corner-3', name: 'Coin Art Nouveau', category: 'gold', svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M5 5 Q5 50 50 50 Q50 5 5 5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 10 Q10 45 45 45 Q45 10 10 10" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><circle cx="27" cy="27" r="6"/><path d="M15 40 Q25 30 40 15" fill="none" stroke="currentColor" stroke-width="1"/></svg>`, defaultColor: '#D4AF37' },
  { id: 'gold-divider-2', name: 'Séparateur Diamant', category: 'gold', svg: `<svg viewBox="0 0 200 30" fill="currentColor"><path d="M0 15 H80" stroke="currentColor" stroke-width="1" fill="none"/><path d="M120 15 H200" stroke="currentColor" stroke-width="1" fill="none"/><path d="M90 15 L100 5 L110 15 L100 25 Z"/><circle cx="80" cy="15" r="2"/><circle cx="120" cy="15" r="2"/><circle cx="70" cy="15" r="1.5" opacity="0.6"/><circle cx="130" cy="15" r="1.5" opacity="0.6"/></svg>`, defaultColor: '#D4AF37' },
  { id: 'gold-divider-3', name: 'Ligne Florale', category: 'gold', svg: `<svg viewBox="0 0 200 40" fill="currentColor"><path d="M0 20 H70 M130 20 H200" stroke="currentColor" stroke-width="1" fill="none"/><circle cx="100" cy="20" r="10"/><circle cx="100" cy="20" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M80 20 Q85 10 90 20 Q85 30 80 20" opacity="0.7"/><path d="M120 20 Q115 10 110 20 Q115 30 120 20" opacity="0.7"/></svg>`, defaultColor: '#D4AF37' },
  { id: 'gold-frame-corner', name: 'Coin Cadre Doré', category: 'gold', svg: `<svg viewBox="0 0 60 60" fill="currentColor"><path d="M5 55 L5 5 L55 5" fill="none" stroke="currentColor" stroke-width="3"/><path d="M10 50 L10 10 L50 10" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6"/><circle cx="5" cy="5" r="4"/><path d="M15 15 L25 15 M15 15 L15 25" stroke="currentColor" stroke-width="1.5"/></svg>`, defaultColor: '#D4AF37' },
  { id: 'gold-medallion', name: 'Médaillon Antique', category: 'gold', svg: `<svg viewBox="0 0 80 80" fill="currentColor"><circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="40" cy="40" r="28" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="40" cy="40" r="20" opacity="0.3"/><circle cx="40" cy="40" r="8"/><path d="M40 12 L40 8 M40 68 L40 72 M12 40 L8 40 M68 40 L72 40" stroke="currentColor" stroke-width="2"/></svg>`, defaultColor: '#D4AF37' },
  { id: 'gold-swirl', name: 'Spirale Élégante', category: 'gold', svg: `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2"><path d="M40 40 Q40 20 60 20 Q80 20 80 40 Q80 60 60 60 Q40 60 40 40 Q40 30 50 30 Q60 30 60 40 Q60 50 50 50 Q45 50 45 45"/><circle cx="45" cy="45" r="3" fill="currentColor"/></svg>`, defaultColor: '#D4AF37' },
  { id: 'gold-laurel', name: 'Laurier Victorieux', category: 'gold', svg: `<svg viewBox="0 0 100 60" fill="currentColor"><path d="M50 55 L50 30" stroke="currentColor" stroke-width="2" fill="none"/><ellipse cx="35" cy="45" rx="8" ry="4" transform="rotate(-45 35 45)" opacity="0.8"/><ellipse cx="65" cy="45" rx="8" ry="4" transform="rotate(45 65 45)" opacity="0.8"/><ellipse cx="30" cy="35" rx="7" ry="3.5" transform="rotate(-50 30 35)" opacity="0.7"/><ellipse cx="70" cy="35" rx="7" ry="3.5" transform="rotate(50 70 35)" opacity="0.7"/><ellipse cx="28" cy="25" rx="6" ry="3" transform="rotate(-55 28 25)" opacity="0.6"/><ellipse cx="72" cy="25" rx="6" ry="3" transform="rotate(55 72 25)" opacity="0.6"/><circle cx="50" cy="10" r="5"/></svg>`, defaultColor: '#D4AF37' },

  // === FLORAUX (suite) ===
  { id: 'floral-bouquet-1', name: 'Bouquet Raffiné', category: 'floral', svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 95 Q40 80 50 70 Q60 80 50 95" opacity="0.5"/><circle cx="50" cy="35" r="12" opacity="0.9"/><circle cx="35" cy="45" r="10" opacity="0.7"/><circle cx="65" cy="45" r="10" opacity="0.7"/><circle cx="30" cy="60" r="8" opacity="0.5"/><circle cx="70" cy="60" r="8" opacity="0.5"/><circle cx="45" cy="55" r="9" opacity="0.8"/><circle cx="55" cy="55" r="9" opacity="0.8"/><path d="M40 72 Q50 65 60 72" stroke="currentColor" fill="none" stroke-width="3"/></svg>`, defaultColor: '#E8B4B8' },
  { id: 'floral-cherry-1', name: 'Fleur de Cerisier', category: 'floral', svg: `<svg viewBox="0 0 60 60" fill="currentColor"><circle cx="30" cy="20" r="8" opacity="0.7"/><circle cx="18" cy="32" r="8" opacity="0.7"/><circle cx="42" cy="32" r="8" opacity="0.7"/><circle cx="22" cy="46" r="8" opacity="0.7"/><circle cx="38" cy="46" r="8" opacity="0.7"/><circle cx="30" cy="35" r="5"/></svg>`, defaultColor: '#FFB7C5' },
  { id: 'floral-daisy-1', name: 'Marguerite Douce', category: 'floral', svg: `<svg viewBox="0 0 80 80" fill="currentColor"><ellipse cx="40" cy="20" rx="6" ry="12" opacity="0.8"/><ellipse cx="55" cy="28" rx="6" ry="12" transform="rotate(45 55 28)" opacity="0.8"/><ellipse cx="60" cy="45" rx="6" ry="12" transform="rotate(90 60 45)" opacity="0.8"/><ellipse cx="52" cy="60" rx="6" ry="12" transform="rotate(135 52 60)" opacity="0.8"/><ellipse cx="40" cy="65" rx="6" ry="12" transform="rotate(180 40 65)" opacity="0.8"/><ellipse cx="28" cy="58" rx="6" ry="12" transform="rotate(-135 28 58)" opacity="0.8"/><ellipse cx="20" cy="42" rx="6" ry="12" transform="rotate(-90 20 42)" opacity="0.8"/><ellipse cx="28" cy="28" rx="6" ry="12" transform="rotate(-45 28 28)" opacity="0.8"/><circle cx="40" cy="42" r="10"/></svg>`, defaultColor: '#FFFACD' },
  { id: 'floral-leaves-1', name: 'Feuillage Délicat', category: 'floral', svg: `<svg viewBox="0 0 120 80" fill="currentColor"><path d="M60 70 Q60 40 60 10" stroke="currentColor" fill="none" stroke-width="2"/><ellipse cx="45" cy="25" rx="15" ry="8" transform="rotate(-30 45 25)" opacity="0.7"/><ellipse cx="75" cy="25" rx="15" ry="8" transform="rotate(30 75 25)" opacity="0.7"/><ellipse cx="40" cy="45" rx="12" ry="6" transform="rotate(-20 40 45)" opacity="0.5"/><ellipse cx="80" cy="45" rx="12" ry="6" transform="rotate(20 80 45)" opacity="0.5"/><ellipse cx="50" cy="60" rx="8" ry="4" transform="rotate(-10 50 60)" opacity="0.3"/><ellipse cx="70" cy="60" rx="8" ry="4" transform="rotate(10 70 60)" opacity="0.3"/></svg>`, defaultColor: '#7BA17B' },
  { id: 'floral-lily-1', name: 'Lys Majestueux', category: 'floral', svg: `<svg viewBox="0 0 80 100" fill="currentColor"><path d="M40 95 Q40 70 40 50" stroke="currentColor" fill="none" stroke-width="2"/><ellipse cx="40" cy="35" rx="8" ry="20" opacity="0.9"/><ellipse cx="25" cy="40" rx="6" ry="18" transform="rotate(-25 25 40)" opacity="0.7"/><ellipse cx="55" cy="40" rx="6" ry="18" transform="rotate(25 55 40)" opacity="0.7"/><ellipse cx="15" cy="50" rx="5" ry="14" transform="rotate(-40 15 50)" opacity="0.5"/><ellipse cx="65" cy="50" rx="5" ry="14" transform="rotate(40 65 50)" opacity="0.5"/><circle cx="40" cy="25" r="4" opacity="0.8"/></svg>`, defaultColor: '#FFFFFF' },
  { id: 'floral-orchid-1', name: 'Orchidée Précieuse', category: 'floral', svg: `<svg viewBox="0 0 100 80" fill="currentColor"><ellipse cx="50" cy="40" rx="20" ry="15" opacity="0.4"/><ellipse cx="35" cy="35" rx="15" ry="10" transform="rotate(-30 35 35)" opacity="0.7"/><ellipse cx="65" cy="35" rx="15" ry="10" transform="rotate(30 65 35)" opacity="0.7"/><ellipse cx="50" cy="55" rx="12" ry="8" opacity="0.8"/><circle cx="50" cy="40" r="6"/><path d="M50 63 Q50 70 50 78" stroke="currentColor" fill="none" stroke-width="2"/></svg>`, defaultColor: '#DA70D6' },
  { id: 'floral-tulip-1', name: 'Tulipe Royale', category: 'floral', svg: `<svg viewBox="0 0 60 100" fill="currentColor"><path d="M30 95 Q30 60 30 45" stroke="currentColor" fill="none" stroke-width="2"/><ellipse cx="30" cy="30" rx="15" ry="25" opacity="0.8"/><ellipse cx="20" cy="35" rx="8" ry="18" transform="rotate(-15 20 35)" opacity="0.6"/><ellipse cx="40" cy="35" rx="8" ry="18" transform="rotate(15 40 35)" opacity="0.6"/><ellipse cx="25" cy="75" rx="10" ry="5" transform="rotate(-20 25 75)" opacity="0.4"/><ellipse cx="35" cy="80" rx="8" ry="4" transform="rotate(15 35 80)" opacity="0.4"/></svg>`, defaultColor: '#FF6B6B' },
  { id: 'floral-vine-1', name: 'Vigne Grimpante', category: 'floral', svg: `<svg viewBox="0 0 150 60" fill="currentColor"><path d="M10 50 Q40 20 70 40 Q100 60 130 30" stroke="currentColor" fill="none" stroke-width="2"/><ellipse cx="25" cy="35" rx="8" ry="5" transform="rotate(-30 25 35)" opacity="0.6"/><ellipse cx="55" cy="30" rx="7" ry="4" transform="rotate(20 55 30)" opacity="0.6"/><ellipse cx="85" cy="45" rx="8" ry="5" transform="rotate(-15 85 45)" opacity="0.6"/><ellipse cx="115" cy="35" rx="7" ry="4" transform="rotate(25 115 35)" opacity="0.6"/><circle cx="40" cy="25" r="4" opacity="0.8"/><circle cx="100" cy="50" r="4" opacity="0.8"/></svg>`, defaultColor: '#228B22' },

  // === ROYAUX (suite) ===
  { id: 'royal-crest-1', name: 'Blason Noble', category: 'royal', svg: `<svg viewBox="0 0 80 100" fill="currentColor"><path d="M10 10 H70 V60 Q70 90 40 95 Q10 90 10 60 Z" opacity="0.2" stroke="currentColor" stroke-width="2"/><path d="M15 15 H65 V58 Q65 85 40 90 Q15 85 15 58 Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M40 25 L50 45 L40 55 L30 45 Z" opacity="0.8"/><circle cx="40" cy="70" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`, defaultColor: '#8B4513' },
  { id: 'royal-eagle-1', name: 'Aigle Impérial', category: 'royal', svg: `<svg viewBox="0 0 100 80" fill="currentColor"><path d="M50 20 L45 30 L55 30 Z"/><circle cx="50" cy="15" r="8"/><path d="M50 30 Q50 50 50 60" stroke="currentColor" fill="none" stroke-width="3"/><path d="M50 35 Q20 25 5 50 Q15 45 25 50 Q30 40 40 38" opacity="0.8"/><path d="M50 35 Q80 25 95 50 Q85 45 75 50 Q70 40 60 38" opacity="0.8"/><path d="M40 60 L35 75 M50 60 L50 78 M60 60 L65 75" stroke="currentColor" stroke-width="2"/></svg>`, defaultColor: '#1C1C1C' },
  { id: 'royal-key-1', name: 'Clé du Royaume', category: 'royal', svg: `<svg viewBox="0 0 40 100" fill="currentColor"><circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="20" cy="20" r="6"/><rect x="17" y="35" width="6" height="55"/><path d="M23 70 H30 M23 80 H28" stroke="currentColor" stroke-width="3"/></svg>`, defaultColor: '#D4AF37' },
  { id: 'royal-lion-1', name: 'Lion Héraldique', category: 'royal', svg: `<svg viewBox="0 0 80 100" fill="currentColor"><ellipse cx="40" cy="35" rx="20" ry="18"/><ellipse cx="40" cy="25" rx="25" ry="15" opacity="0.6"/><ellipse cx="40" cy="42" rx="8" ry="5"/><path d="M30 50 Q25 70 20 90 M50 50 Q55 70 60 90" stroke="currentColor" fill="none" stroke-width="3"/><path d="M35 55 L35 85 M45 55 L45 85" stroke="currentColor" stroke-width="3"/><path d="M55 60 Q70 70 65 90" stroke="currentColor" fill="none" stroke-width="2"/></svg>`, defaultColor: '#D4AF37' },
  { id: 'royal-orb-1', name: 'Orbe Royal', category: 'royal', svg: `<svg viewBox="0 0 80 100" fill="currentColor"><circle cx="40" cy="55" r="30"/><path d="M40 25 L40 10 M35 10 L45 10" stroke="currentColor" stroke-width="3"/><circle cx="40" cy="5" r="5"/><path d="M10 55 H70" stroke="currentColor" stroke-width="2" opacity="0.5"/><path d="M40 25 Q60 40 40 55 Q20 40 40 25" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/></svg>`, defaultColor: '#D4AF37' },
  { id: 'royal-scepter-1', name: 'Sceptre Impérial', category: 'royal', svg: `<svg viewBox="0 0 40 120" fill="currentColor"><rect x="17" y="30" width="6" height="85" rx="2"/><circle cx="20" cy="20" r="15"/><circle cx="20" cy="20" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="20" r="4"/><path d="M10 115 H30" stroke="currentColor" stroke-width="3"/><rect x="15" y="108" width="10" height="5" rx="1"/></svg>`, defaultColor: '#D4AF37' },
  { id: 'royal-shield-1', name: 'Écu Chevaleresque', category: 'royal', svg: `<svg viewBox="0 0 80 100" fill="currentColor"><path d="M10 10 H70 V50 Q70 90 40 95 Q10 90 10 50 Z" opacity="0.3"/><path d="M10 10 H70 V50 Q70 90 40 95 Q10 90 10 50 Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M40 20 L40 80" stroke="currentColor" stroke-width="2" opacity="0.5"/><path d="M20 40 H60" stroke="currentColor" stroke-width="2" opacity="0.5"/></svg>`, defaultColor: '#C41E3A' },
  { id: 'royal-tiara-1', name: 'Diadème Princesse', category: 'royal', svg: `<svg viewBox="0 0 120 60" fill="currentColor"><path d="M10 55 Q20 40 35 50 Q50 30 60 20 Q70 30 85 50 Q100 40 110 55" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="60" cy="15" r="8"/><circle cx="35" cy="40" r="5"/><circle cx="85" cy="40" r="5"/><circle cx="20" cy="48" r="4" opacity="0.7"/><circle cx="100" cy="48" r="4" opacity="0.7"/><path d="M5 55 H115" stroke="currentColor" stroke-width="3"/></svg>`, defaultColor: '#C0C0C0' },

  // === CÉLESTES (suite) ===
  { id: 'celestial-aurora', name: 'Aurore Boréale', category: 'celestial', svg: `<svg viewBox="0 0 120 80" fill="currentColor"><path d="M10 70 Q30 30 50 50 Q70 70 90 40 Q110 10 120 30" fill="none" stroke="currentColor" stroke-width="8" opacity="0.3"/><path d="M0 75 Q25 40 45 55 Q65 70 85 45 Q105 20 120 35" fill="none" stroke="currentColor" stroke-width="5" opacity="0.5"/><path d="M5 80 Q30 50 50 60 Q70 70 90 50 Q110 30 120 40" fill="none" stroke="currentColor" stroke-width="3" opacity="0.7"/></svg>`, defaultColor: '#00FF7F' },
  { id: 'celestial-comet', name: 'Comète Brillante', category: 'celestial', svg: `<svg viewBox="0 0 120 60" fill="currentColor"><circle cx="100" cy="20" r="10"/><path d="M90 25 Q50 35 10 50" stroke="currentColor" stroke-width="4" opacity="0.3"/><path d="M92 28 Q55 38 15 52" stroke="currentColor" stroke-width="2" opacity="0.5"/><circle cx="100" cy="20" r="5" opacity="0.8"/></svg>`, defaultColor: '#87CEEB' },
  { id: 'celestial-constellation-1', name: 'Constellation', category: 'celestial', svg: `<svg viewBox="0 0 120 80" fill="currentColor"><circle cx="20" cy="30" r="4"/><circle cx="45" cy="15" r="3"/><circle cx="70" cy="25" r="5"/><circle cx="55" cy="50" r="3"/><circle cx="90" cy="40" r="4"/><circle cx="100" cy="60" r="3"/><path d="M20 30 L45 15 L70 25 M70 25 L55 50 M70 25 L90 40 L100 60" stroke="currentColor" fill="none" stroke-width="1" opacity="0.5"/></svg>`, defaultColor: '#E6E6FA' },
  { id: 'celestial-eclipse', name: 'Éclipse Mystique', category: 'celestial', svg: `<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="35"/><circle cx="60" cy="45" r="30" fill="#1a1a2e"/><path d="M50 10 L50 5 M50 90 L50 95 M10 50 L5 50 M90 50 L95 50" stroke="currentColor" stroke-width="2" opacity="0.5"/><circle cx="25" cy="35" r="2" opacity="0.3"/><circle cx="30" cy="65" r="1.5" opacity="0.3"/></svg>`, defaultColor: '#FFD700' },
  { id: 'celestial-galaxy', name: 'Galaxie Spirale', category: 'celestial', svg: `<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="8"/><path d="M50 50 Q70 40 80 50 Q90 70 70 80 Q50 90 40 70 Q30 50 50 40 Q70 30 85 45" fill="none" stroke="currentColor" stroke-width="2" opacity="0.7"/><circle cx="65" cy="35" r="2" opacity="0.5"/><circle cx="80" cy="55" r="1.5" opacity="0.4"/><circle cx="60" cy="75" r="2" opacity="0.5"/><circle cx="35" cy="60" r="1.5" opacity="0.4"/></svg>`, defaultColor: '#9370DB' },
  { id: 'celestial-north-star', name: 'Étoile Polaire', category: 'celestial', svg: `<svg viewBox="0 0 80 80" fill="currentColor"><path d="M40 5 L43 35 L40 40 L37 35 Z"/><path d="M40 75 L43 45 L40 40 L37 45 Z"/><path d="M5 40 L35 43 L40 40 L35 37 Z"/><path d="M75 40 L45 43 L40 40 L45 37 Z"/><circle cx="40" cy="40" r="6"/><circle cx="40" cy="40" r="12" fill="none" stroke="currentColor" stroke-width="1" opacity="0.4"/></svg>`, defaultColor: '#FFFFFF' },
  { id: 'celestial-planet', name: 'Planète Annelée', category: 'celestial', svg: `<svg viewBox="0 0 100 80" fill="currentColor"><circle cx="50" cy="40" r="20"/><ellipse cx="50" cy="40" rx="40" ry="8" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6"/><circle cx="50" cy="40" r="20" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"/><circle cx="42" cy="35" r="3" opacity="0.3"/></svg>`, defaultColor: '#DEB887' },
  { id: 'celestial-shooting-star', name: 'Étoile Filante', category: 'celestial', svg: `<svg viewBox="0 0 120 60" fill="currentColor"><path d="M100 15 L85 20 L95 10 L80 25 L90 15 Z"/><path d="M80 25 L10 50" stroke="currentColor" stroke-width="2" opacity="0.6"/><circle cx="60" cy="35" r="2" opacity="0.4"/><circle cx="40" cy="42" r="1.5" opacity="0.3"/><circle cx="25" cy="47" r="1" opacity="0.2"/></svg>`, defaultColor: '#FFD700' },
  { id: 'celestial-sparkle', name: 'Étincelle Magique', category: 'celestial', svg: `<svg viewBox="0 0 60 60" fill="currentColor"><path d="M30 5 L32 25 L30 30 L28 25 Z"/><path d="M30 55 L32 35 L30 30 L28 35 Z"/><path d="M5 30 L25 32 L30 30 L25 28 Z"/><path d="M55 30 L35 32 L30 30 L35 28 Z"/><path d="M12 12 L25 27 L30 30 L27 25 Z" opacity="0.6"/><path d="M48 12 L33 27 L30 30 L35 25 Z" opacity="0.6"/><path d="M12 48 L27 33 L30 30 L25 35 Z" opacity="0.6"/><path d="M48 48 L33 33 L30 30 L35 35 Z" opacity="0.6"/></svg>`, defaultColor: '#FFD700' },

  // === ARTISTIQUES (suite) ===
  { id: 'artistic-dragonfly-1', name: 'Libellule Délicate', category: 'artistic', svg: `<svg viewBox="0 0 100 80" fill="currentColor"><ellipse cx="50" cy="40" rx="4" ry="25"/><circle cx="50" cy="12" r="6"/><ellipse cx="30" cy="35" rx="20" ry="8" opacity="0.5"/><ellipse cx="70" cy="35" rx="20" ry="8" opacity="0.5"/><ellipse cx="32" cy="50" rx="15" ry="6" opacity="0.4"/><ellipse cx="68" cy="50" rx="15" ry="6" opacity="0.4"/></svg>`, defaultColor: '#00CED1' },
  { id: 'artistic-hummingbird-1', name: 'Colibri Irisé', category: 'artistic', svg: `<svg viewBox="0 0 100 80" fill="currentColor"><ellipse cx="55" cy="40" rx="18" ry="15"/><circle cx="70" cy="35" r="8"/><path d="M78 35 L95 30" stroke="currentColor" stroke-width="2"/><ellipse cx="40" cy="35" rx="15" ry="8" transform="rotate(-20 40 35)" opacity="0.6"/><ellipse cx="38" cy="48" rx="12" ry="6" transform="rotate(20 38 48)" opacity="0.5"/><path d="M55 55 Q55 70 60 75 Q50 70 55 55" opacity="0.7"/></svg>`, defaultColor: '#FF1493' },
  { id: 'artistic-mask-1', name: 'Masque Vénitien', category: 'artistic', svg: `<svg viewBox="0 0 100 60" fill="currentColor"><path d="M10 30 Q30 10 50 20 Q70 10 90 30 Q70 50 50 40 Q30 50 10 30" opacity="0.8"/><ellipse cx="30" cy="28" rx="10" ry="8" fill="#1a1a2e"/><ellipse cx="70" cy="28" rx="10" ry="8" fill="#1a1a2e"/><path d="M45 35 L50 40 L55 35" fill="none" stroke="currentColor" stroke-width="2"/><path d="M0 25 Q5 20 10 30 M90 30 Q95 20 100 25" stroke="currentColor" stroke-width="2" fill="none" opacity="0.6"/></svg>`, defaultColor: '#D4AF37' },
  { id: 'artistic-music-note', name: 'Note de Musique', category: 'artistic', svg: `<svg viewBox="0 0 60 100" fill="currentColor"><ellipse cx="20" cy="80" rx="15" ry="10" transform="rotate(-20 20 80)"/><path d="M32 75 L32 15" stroke="currentColor" stroke-width="3"/><path d="M32 15 Q50 20 50 35 Q50 50 32 45" fill="currentColor"/></svg>`, defaultColor: '#1C1C1C' },
  { id: 'artistic-peacock-1', name: 'Paon Majestueux', category: 'artistic', svg: `<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="20" r="6"/><path d="M50 26 Q50 50 50 70" stroke="currentColor" fill="none" stroke-width="2"/><circle cx="30" cy="35" r="12" opacity="0.7"/><circle cx="70" cy="35" r="12" opacity="0.7"/><circle cx="20" cy="55" r="10" opacity="0.5"/><circle cx="80" cy="55" r="10" opacity="0.5"/><circle cx="35" cy="65" r="8" opacity="0.4"/><circle cx="65" cy="65" r="8" opacity="0.4"/><circle cx="30" cy="35" r="4"/><circle cx="70" cy="35" r="4"/><circle cx="20" cy="55" r="3" opacity="0.8"/><circle cx="80" cy="55" r="3" opacity="0.8"/></svg>`, defaultColor: '#1E90FF' },
  { id: 'artistic-quill-ink-1', name: 'Plume et Encrier', category: 'artistic', svg: `<svg viewBox="0 0 80 100" fill="currentColor"><path d="M55 10 Q60 30 55 60 Q50 90 45 95" fill="none" stroke="currentColor" stroke-width="2"/><path d="M55 10 Q70 15 65 25 Q60 35 55 30 Q50 25 55 10" opacity="0.7"/><ellipse cx="25" cy="85" rx="20" ry="12"/><ellipse cx="25" cy="80" rx="15" ry="8" fill="#1a1a2e"/><path d="M45 95 Q35 90 30 85" stroke="currentColor" stroke-width="1" opacity="0.5"/></svg>`, defaultColor: '#2F4F4F' },
  { id: 'artistic-ribbon-1', name: 'Ruban Soyeux', category: 'artistic', svg: `<svg viewBox="0 0 150 60" fill="currentColor"><path d="M10 30 Q30 10 50 30 Q70 50 90 30 Q110 10 130 30 Q140 40 140 50 L130 45 Q110 25 90 45 Q70 65 50 45 Q30 25 10 45 L5 40 Q5 35 10 30Z" opacity="0.8"/><path d="M10 30 Q30 10 50 30" stroke="currentColor" fill="none" stroke-width="1" opacity="0.5"/></svg>`, defaultColor: '#C41E3A' },
  { id: 'artistic-scroll-1', name: 'Parchemin Ancien', category: 'artistic', svg: `<svg viewBox="0 0 100 80" fill="currentColor"><path d="M15 15 Q10 15 10 25 L10 60 Q10 70 20 70 L85 70 Q90 70 90 60 L90 25 Q90 15 80 15" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="15" cy="20" rx="5" ry="8"/><ellipse cx="15" cy="65" rx="5" ry="8"/><path d="M25 30 H75 M25 42 H75 M25 54 H60" stroke="currentColor" stroke-width="1" opacity="0.4"/></svg>`, defaultColor: '#DEB887' },
  { id: 'artistic-swan-1', name: 'Cygne Gracieux', category: 'artistic', svg: `<svg viewBox="0 0 100 80" fill="currentColor"><path d="M30 70 Q20 60 25 45 Q30 30 45 25 Q60 20 65 30 Q70 40 60 45 Q50 50 55 40 Q60 30 50 30 Q40 30 35 40 Q30 50 35 60 Q40 70 50 70 Q70 70 85 60" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="50" cy="28" r="3"/><ellipse cx="60" cy="65" rx="25" ry="10" opacity="0.6"/></svg>`, defaultColor: '#FFFFFF' },
  { id: 'artistic-treble-clef', name: 'Clé de Sol', category: 'artistic', svg: `<svg viewBox="0 0 60 100" fill="currentColor"><path d="M30 90 Q20 85 20 75 Q20 65 30 60 Q40 55 40 45 Q40 30 30 25 Q20 20 15 30 Q10 40 20 50 Q30 60 30 75 Q30 85 25 90 Q20 95 15 90" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="30" cy="40" r="5"/><circle cx="30" cy="20" r="3"/></svg>`, defaultColor: '#D4AF37' },

  // === CADRES (suite) ===
  { id: 'frame-art-deco-1', name: 'Cadre Art Déco', category: 'frames', svg: `<svg viewBox="0 0 120 80" fill="currentColor"><rect x="5" y="5" width="110" height="70" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 5 L20 20 M115 5 L100 20 M5 75 L20 60 M115 75 L100 60" stroke="currentColor" stroke-width="2"/><rect x="15" y="15" width="90" height="50" fill="none" stroke="currentColor" stroke-width="1"/><path d="M30 5 L30 15 M60 5 L60 15 M90 5 L90 15" stroke="currentColor" stroke-width="1"/><path d="M30 75 L30 65 M60 75 L60 65 M90 75 L90 65" stroke="currentColor" stroke-width="1"/></svg>`, defaultColor: '#D4AF37' },
  { id: 'frame-baroque-1', name: 'Cadre Baroque', category: 'frames', svg: `<svg viewBox="0 0 120 80" fill="currentColor"><rect x="8" y="8" width="104" height="64" rx="2" fill="none" stroke="currentColor" stroke-width="4"/><path d="M0 20 Q8 25 8 15 Q8 5 18 0" fill="none" stroke="currentColor" stroke-width="2"/><path d="M120 20 Q112 25 112 15 Q112 5 102 0" fill="none" stroke="currentColor" stroke-width="2"/><path d="M0 60 Q8 55 8 65 Q8 75 18 80" fill="none" stroke="currentColor" stroke-width="2"/><path d="M120 60 Q112 55 112 65 Q112 75 102 80" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="60" cy="0" r="5"/><circle cx="60" cy="80" r="5"/><circle cx="0" cy="40" r="5"/><circle cx="120" cy="40" r="5"/></svg>`, defaultColor: '#D4AF37' },
  { id: 'frame-oval-1', name: 'Cadre Ovale', category: 'frames', svg: `<svg viewBox="0 0 100 80" fill="currentColor"><ellipse cx="50" cy="40" rx="45" ry="35" fill="none" stroke="currentColor" stroke-width="3"/><ellipse cx="50" cy="40" rx="38" ry="28" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="50" cy="5" r="4"/><circle cx="50" cy="75" r="4"/><path d="M20 15 Q25 20 20 25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M80 15 Q75 20 80 25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M20 55 Q25 60 20 65" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M80 55 Q75 60 80 65" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`, defaultColor: '#D4AF37' },
  { id: 'frame-ribbon-1', name: 'Cadre Ruban', category: 'frames', svg: `<svg viewBox="0 0 140 100" fill="currentColor"><rect x="20" y="15" width="100" height="70" fill="none" stroke="currentColor" stroke-width="2"/><path d="M0 25 L20 15 L20 85 L0 95 L0 70 L10 65 L10 55 L0 50 L0 25" opacity="0.8"/><path d="M140 25 L120 15 L120 85 L140 95 L140 70 L130 65 L130 55 L140 50 L140 25" opacity="0.8"/></svg>`, defaultColor: '#C41E3A' },
  { id: 'frame-shield-1', name: 'Cadre Blason', category: 'frames', svg: `<svg viewBox="0 0 80 100" fill="currentColor"><path d="M5 10 H75 V55 Q75 90 40 98 Q5 90 5 55 Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M12 17 H68 V52 Q68 82 40 90 Q12 82 12 52 Z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="40" cy="10" r="5"/></svg>`, defaultColor: '#1E3A5F' },
  { id: 'frame-victorian-1', name: 'Cadre Victorien', category: 'frames', svg: `<svg viewBox="0 0 120 80" fill="currentColor"><rect x="5" y="5" width="110" height="70" rx="5" fill="none" stroke="currentColor" stroke-width="3"/><rect x="12" y="12" width="96" height="56" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="5" cy="5" r="4"/><circle cx="115" cy="5" r="4"/><circle cx="5" cy="75" r="4"/><circle cx="115" cy="75" r="4"/><path d="M40 5 Q45 12 50 5 Q55 12 60 5 Q65 12 70 5 Q75 12 80 5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M40 75 Q45 68 50 75 Q55 68 60 75 Q65 68 70 75 Q75 68 80 75" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`, defaultColor: '#8B4513' },
]

/**
 * Trouve une décoration par son ID
 */
export function findDecorationById(id: string): DecorationItem | undefined {
  return PREMIUM_DECORATIONS.find(d => d.id === id)
}

/**
 * Convertit un SVG en data URL pour l'utiliser comme image
 */
export function svgToDataUrl(svg: string, color: string = '#D4AF37'): string {
  // Remplacer currentColor par la couleur spécifiée
  const coloredSvg = svg.replace(/currentColor/g, color)
  // Encoder en base64
  const encoded = btoa(unescape(encodeURIComponent(coloredSvg)))
  return `data:image/svg+xml;base64,${encoded}`
}
