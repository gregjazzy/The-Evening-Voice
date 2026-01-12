# 📋 Handover - La Voix du Soir

> Document de passation complet pour la prochaine session de développement

**Date** : 12 janvier 2026  
**Version** : 1.5.1  
**État** : Mode Écriture avec vue livre ouvert, zoom, alignement texte sur lignes CORRIGÉ

---

## 🎯 Contexte du Projet

**Client** : Ultra-premium (top 40 fortunes mondiales)  
**Utilisateurs** : 2 enfants de 8 ans + 1 mentor  
**Langues** : Français, Anglais, Russe

### Ce qu'est l'app

Application Electron/Web/iPad pour enfants permettant de :
- Écrire un journal intime (photos, audio, images IA)
- Créer des histoires illustrées avec structures narratives
- Apprendre le prompting avec Luna (IA-Amie)

### Objectifs pédagogiques de Luna

1. **Créer ensemble** : Aider à l'écriture (journal, histoires)
2. **Rendre autonome** : Enseigner le prompting
3. **Ne JAMAIS faire à la place** : Guider par des questions

---

## ✅ Ce qui a été fait (Session du 12 janvier 2026)

### Alignement Texte sur Lignes - CORRIGÉ ✨

**Problème résolu** : Le texte était au-dessus des lignes au lieu d'être SUR les lignes

**Solution technique** :
```typescript
// Nouveau pattern des lignes (aligné avec la baseline du texte)
backgroundImage: 'repeating-linear-gradient(
  transparent, 
  transparent 24px, 
  rgba(139, 115, 85, 0.15) 24px, 
  rgba(139, 115, 85, 0.15) 25px
)'
backgroundSize: '100% 32px'  // Même hauteur que lineHeight

// Zone texte
lineHeight: '32px'
paddingTop: '0'  // Texte et lignes démarrent au même point
```

**Résultat** : Le texte repose maintenant directement SUR les lignes du cahier, comme dans un vrai cahier d'écriture !

### Modifications appliquées

| Zone | Avant | Après |
|------|-------|-------|
| Pattern lignes | `transparent 31px, ligne 31-32px` | `transparent 24px, ligne 24-25px` |
| Padding texte | `pt-[22px]` puis `pt-[8px]` | `pt-0` |
| Position lignes | `top-[22px]` | `top-0` |
| backgroundSize | - | `100% 32px` |

---

## ✅ Ce qui a été fait (Sessions précédentes - 11 janvier 2026)

### Vue Livre Ouvert
- [x] **2 pages côte à côte** comme un vrai livre ouvert
- [x] **Reliure centrale** avec effet visuel réaliste
- [x] **Numéros de pages** en bas (impair à gauche, pair à droite)
- [x] **Flèches de navigation** sur les côtés pour tourner les pages
- [x] **Ratio 2:3** respecté pour chaque page (format livre standard)
- [x] **Taille ajustable** : 780px de hauteur max avec marges

### Mode Zoom
- [x] **Bouton œil** en haut à droite de la page pour agrandir
- [x] **Page unique agrandie** pour écrire confortablement
- [x] **Titre du chapitre** affiché en haut
- [x] **Navigation** entre pages en mode zoom
- [x] **Bouton X** pour fermer et revenir au livre ouvert

### Sélecteur de Taille (Style Word)
- [x] **Tailles numériques** : 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72
- [x] **Boutons +/-** pour ajuster rapidement
- [x] **Menu déroulant** avec toutes les tailles disponibles
- [x] **Palette de couleurs** pour colorer le texte sélectionné

### Gestion des Chapitres
- [x] **Sélecteur de chapitre** sur chaque page
- [x] **Créer un nouveau chapitre** depuis le sélecteur
- [x] **Affichage du chapitre** sur la page (Introduction, Développement, etc.)
- [x] **Persistance** des chapitres dans le store

### Sidebar Pages
- [x] **Liste des pages** dans une sidebar à gauche
- [x] **Titre de l'histoire** éditable dans la sidebar
- [x] **Indicateur de chapitre** sur chaque page (P.1 Introduction, etc.)
- [x] **Bouton + Nouvelle** pour ajouter des pages

---

## 📁 Fichiers clés modifiés

### BookMode.tsx - Structure complète

```
src/components/modes/BookMode.tsx (~1600 lignes)
├── États principaux
│   ├── currentPageIndex        # Page actuelle
│   ├── isZoomed                # Mode zoom actif
│   ├── showToolbar             # Barre d'outils flottante
│   └── chapters                # Liste des chapitres
│
├── Vue Livre Ouvert
│   ├── PAGE GAUCHE             # Infos chapitre + sélecteur
│   ├── RELIURE CENTRALE        # Effet visuel
│   └── PAGE DROITE             # Zone d'écriture avec lignes
│       ├── Lignes de cahier    # Background repeating-linear-gradient
│       ├── Marge rouge         # Position left-10
│       └── Zone éditable       # contentEditable
│
├── Mode Zoom
│   ├── Page unique agrandie
│   ├── Titre chapitre en haut
│   ├── Lignes de cahier alignées
│   └── Navigation en bas
│
├── FormatBar
│   ├── Sélecteur police (6 fonts)
│   ├── Sélecteur taille (numérique)
│   ├── Gras / Italique
│   ├── Alignement (3 options)
│   ├── Espacement lignes
│   ├── Décalage (espaces/retours)
│   └── Couleurs (palette)
│
└── LunaSidePanel
    ├── Chat avec historique
    ├── Toggle voix
    ├── Bouton "Luna, lis ma page"
    └── Micro pour parler
```

### Styles CSS des lignes (NOUVEAU - Corrigé)

```css
/* Lignes de cahier - ALIGNÉES avec le texte */
backgroundImage: 'repeating-linear-gradient(
  transparent, 
  transparent 24px, 
  rgba(139, 115, 85, 0.15) 24px, 
  rgba(139, 115, 85, 0.15) 25px
)'
backgroundSize: '100% 32px'  /* Cycle de 32px = lineHeight du texte */

/* Conteneur des lignes */
className: 'absolute inset-x-10 top-0 bottom-12'

/* Zone texte */
className: 'flex-1 px-10 pt-0 pb-12 overflow-y-auto'
style: { lineHeight: '32px', fontSize: '1.25rem' }
```

**Explication** : 
- Le pattern fait 32px de haut (comme la lineHeight)
- La ligne apparaît à 24px dans chaque cycle de 32px
- Cela correspond à ~75% de la lineHeight, soit la position de la baseline
- Texte et lignes démarrent tous les deux à `top: 0` et `padding-top: 0`

---

## 🎨 Interface Mode Écriture - Layout Final

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [< Retour]  Titre histoire                      2 pages • 4 chap.            │
├─────────────┬────────────────────────────────────────────────────────────────┤
│ PAGES       │                                                                │
│ ┌─────────┐ │      ┌─────────────────┬────┬─────────────────┐               │
│ │ P.1     │ │   <  │ PAGE GAUCHE     │ || │ PAGE DROITE     │  >            │
│ │ Intro   │ │      │                 │ || │                 │               │
│ ├─────────┤ │      │  📖 Intro       │ || │ ─────────────── │               │
│ │ P.2     │ │      │  Page 1         │ || │ Il était une    │               │
│ │ Dév.    │ │      │                 │ || │ fois...         │               │
│ └─────────┘ │      │  [Chapitre ▼]   │ || │ ─────────────── │               │
│             │      │                 │ || │ ─────────────── │               │
│ + Nouvelle  │      │     — 1 —       │ || │ 20 mots [🎙️][📷]│               │
│             │      └─────────────────┴────┴─────────────────┘               │
│ [≡][⊞]      │                       [Outils]    1/2                          │
└─────────────┴────────────────────────────────────────────────────────────────┘
```

### Mode Zoom (clic sur l'œil)

```
┌────────────────────────────────────────────────────┐
│                                   [X]              │
│              Introduction                          │
│  ───────────────────────────────────────────────   │
│  Il était une fois une histoire fabuleuse qui      │  ← Texte SUR la ligne
│  ───────────────────────────────────────────────   │
│  commençait par une belle journée ensoleillée.     │  ← Texte SUR la ligne
│  ───────────────────────────────────────────────   │
│  Les oiseaux chantaient dans les arbres.           │  ← Texte SUR la ligne
│  ───────────────────────────────────────────────   │
│                                                    │
│  20 mots                          [🎙️] [📷]       │
│                  — Page 1 —                        │
├────────────────────────────────────────────────────┤
│           [<]      1 / 2      [>]                  │
└────────────────────────────────────────────────────┘
```

---

## 🔧 Détails techniques - Alignement Lignes

### Calcul de l'alignement

```
lineHeight: 32px
fontSize: ~20px (1.25rem)

Baseline position = ~75% of lineHeight = 24px

Pattern des lignes:
  - 0 à 24px : transparent
  - 24 à 25px : ligne visible (1px)
  - 25 à 32px : transparent
  → Cycle de 32px qui se répète

Résultat: La ligne est à 24px, la baseline du texte est à ~24px
→ Le texte repose exactement SUR la ligne ✓
```

### TextStyle (format de chaque page)

```typescript
interface TextStyle {
  fontFamily: string           // Ex: "'Merriweather', serif"
  fontSize: number             // Ex: 18 (pixels)
  color: string                // Ex: '#ffffff'
  isBold: boolean
  isItalic: boolean
  textAlign: 'left' | 'center' | 'right'
  lineSpacing: 'tight' | 'normal' | 'relaxed'
}
```

### Tailles de police disponibles

```typescript
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]
const DEFAULT_SIZE = 18  // pixels
```

---

## 🚀 Ce qui reste à faire

### Priorité Haute
| Tâche | Notes |
|-------|-------|
| Bouton Image | Actuellement TODO - implémenter upload ou génération IA |
| Export PDF | Exporter les histoires en PDF |
| Tests utilisateur | Faire tester par les enfants |

### Priorité Moyenne
| Tâche | Notes |
|-------|-------|
| Vue Structure | Améliorer la visualisation des chapitres |
| Drag & drop pages | Réorganiser les pages par glisser-déposer |
| Mémoire Luna cross-sessions | Se souvenir des préférences |

### Priorité Basse
| Tâche | Notes |
|-------|-------|
| Mode hors-ligne | Sync quand connexion retrouvée |
| App Windows | Version Electron Windows |
| Animations page turn | Animation 3D pour tourner les pages |

---

## 🐛 Bugs connus / Points d'attention

1. **Alignement lignes** : Maintenant correctement calibré pour fontSize 1.25rem (20px) et lineHeight 32px. Si on change ces valeurs, il faut ajuster le pattern (la ligne doit être à 75% de la lineHeight)
2. **Speech Recognition** : Ne fonctionne pas sur Firefox
3. **TTS sur iOS** : Peut nécessiter une interaction utilisateur avant de fonctionner
4. **Mode zoom** : Le contenu est synchronisé via useEffect sur `[isZoomed, page.id]`

---

## 🔑 Identifiants

| | |
|---|---|
| **Admin** | admin@admin.com / admin123 |
| **Supabase Project ID** | frufyxrhpqxhnawmrhru |
| **Gemini API Key** | AIzaSyBEnnVE4Hvl2dLbmpITvg7WDEVH64K5SYs |

---

## 🚀 Pour démarrer

```bash
# Installer
npm install

# Dev (web)
npm run dev

# Dev (Electron)
npm run dev:electron

# Tester :
# 1. Aller sur localhost:3000
# 2. Cliquer sur "Écriture"
# 3. Sélectionner/créer une histoire
# 4. Voir le livre ouvert avec 2 pages
# 5. Cliquer sur l'œil pour zoomer
# 6. Écrire sur les lignes du cahier
# 7. Le texte doit reposer SUR les lignes (pas au-dessus)
```

---

## 📚 Documentation

- `README.md` - Vue d'ensemble
- `docs/ARCHITECTURE.md` - Architecture technique
- `docs/QUICK_START.md` - Guide de démarrage
- `docs/API.md` - Documentation API
- `docs/HANDOVER.md` - Ce document

---

## 📝 Résumé des changements de cette session (12 janvier 2026)

**Problème corrigé** : L'utilisateur a signalé que le texte était au-dessus des lignes du cahier au lieu d'être dessus.

**Solution appliquée** :
1. Modification du pattern des lignes : `transparent 24px, ligne 24-25px` au lieu de `transparent 31px, ligne 31-32px`
2. Ajout de `backgroundSize: '100% 32px'` pour synchroniser avec la lineHeight
3. Padding-top du texte mis à 0 pour aligner texte et lignes au même point de départ
4. Les conteneurs de lignes commencent aussi à `top-0`

**Résultat** : Le texte repose maintenant parfaitement SUR les lignes, tant en vue livre ouvert qu'en mode zoom.

---

**Bon courage pour la suite !** 🌙✨
