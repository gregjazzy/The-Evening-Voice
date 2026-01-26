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
