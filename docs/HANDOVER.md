# 📋 Handover - La Voix du Soir

> Document de passation complet pour la prochaine session de développement

**Date** : 12 janvier 2026  
**Version** : 1.6.0  
**État** : Mode Écriture complet avec formatage texte sélectionné, zoom bidirectionnel, layout optimisé

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

## ✅ Ce qui a été fait (Session du 12 janvier 2026 - Après-midi)

### 🎨 Barre de Formatage - Refonte Complète ✨

**Fonctionnalités corrigées/ajoutées** :

| Fonctionnalité | Comportement |
|----------------|--------------|
| **Taille de police** | S'applique UNIQUEMENT à la sélection |
| **Choix de police** | S'applique UNIQUEMENT à la sélection |
| **Bold / Italic** | Fonctionnent sans déplacer le curseur |
| **Couleur** | S'applique à la sélection |
| **Détection auto** | La taille/police s'affiche selon le texte sous le curseur |
| **Multi-styles** | Fonctionne même si la sélection contient plusieurs styles |

**Boutons +/- supprimés** : L'utilisateur utilise directement le sélecteur de taille.

**Solution technique** :
```typescript
// Sauvegarde de la sélection
const savedRangeRef = useRef<{ text: string; range: Range } | null>(null)

// Application sur sélection uniquement (exemple taille)
const applyFontSize = (size: number) => {
  const selection = window.getSelection()
  if (selection && !selection.isCollapsed) {
    const range = selection.getRangeAt(0)
    const span = document.createElement('span')
    span.style.fontSize = `${size}px`
    const fragment = range.extractContents()
    span.appendChild(fragment)
    range.insertNode(span)
    // Re-sélectionner le nouveau contenu
    const newRange = document.createRange()
    newRange.selectNodeContents(span)
    selection.removeAllRanges()
    selection.addRange(newRange)
  }
}

// Détection automatique de la taille/police au curseur
useEffect(() => {
  const detectFontStyles = () => {
    const selection = window.getSelection()
    if (selection?.rangeCount > 0) {
      let node = selection.getRangeAt(0).startContainer
      while (node && node.nodeType !== Node.ELEMENT_NODE) {
        node = node.parentNode
      }
      if (node instanceof HTMLElement) {
        const style = window.getComputedStyle(node)
        setLastUsedSize(parseInt(style.fontSize))
        setDetectedFontFamily(style.fontFamily)
      }
    }
  }
  document.addEventListener('selectionchange', detectFontStyles)
  return () => document.removeEventListener('selectionchange', detectFontStyles)
}, [])
```

### 📖 Vue Livre Ouvert - 2 Pages Éditables

- **Page gauche ET droite** maintenant éditables (comme un vrai livre)
- **Zoom bidirectionnel** : Bouton œil sur les 2 pages
- **Synchronisation** : Le contenu se conserve entre zoom et vue double

### 🎯 Layout Optimisé

**Barre du haut unifiée** :
```
┌─────────────────────────────────────────────────────────────┐
│ [< Retour]  Titre de l'histoire...    [FormatBar]  [≡] [⊞] │
└─────────────────────────────────────────────────────────────┘
```

- Bouton "Retour" + Titre intégrés dans la barre d'outils
- Information "X pages • X chap." supprimée (redondante avec onglets)
- FormatBar centrée
- Boutons Structure/Overview à droite

### 📑 Indicateurs de Chapitres

- **Points colorés** sur les onglets de pages au lieu du texte
- Chaque chapitre a sa couleur distinctive
- Plus discret et intuitif

### 🔒 Sécurité - Clé API

- **Clé Gemini supprimée** de `docs/HANDOVER.md`
- **Nouvelle clé** stockée dans `.env.local` uniquement
- Le fichier `.env.local` est ignoré par Git

### 📦 Git Repository

- **Initialisé** : `git init`
- **Remote** : `https://github.com/gregjazzy/The-Evening-Voice.git`
- **Commits** :
  1. `feat: complete writing mode with formatting, zoom, optimized layout`
  2. `fix: remove exposed API key from docs`

---

## ✅ Ce qui a été fait (Sessions précédentes)

### Alignement Texte sur Lignes - CORRIGÉ ✨

**Solution technique** :
```typescript
backgroundImage: 'repeating-linear-gradient(
  transparent, 
  transparent 24px, 
  rgba(139, 115, 85, 0.15) 24px, 
  rgba(139, 115, 85, 0.15) 25px
)'
backgroundSize: '100% 32px'  // Même hauteur que lineHeight
lineHeight: '32px'
paddingTop: '0'
```

### Vue Livre Ouvert
- [x] **2 pages côte à côte** comme un vrai livre ouvert
- [x] **Reliure centrale** avec effet visuel réaliste
- [x] **Numéros de pages** en bas (impair à gauche, pair à droite)
- [x] **Flèches de navigation** sur les côtés pour tourner les pages
- [x] **Ratio 2:3** respecté pour chaque page (format livre standard)

### Mode Zoom
- [x] **Bouton œil** sur les 2 pages pour agrandir
- [x] **Page unique agrandie** pour écrire confortablement
- [x] **Titre du chapitre** affiché en haut
- [x] **Bouton œil barré** pour fermer et revenir au livre ouvert

### Sélecteur de Taille (Style Word)
- [x] **Tailles numériques** : 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72
- [x] **Menu déroulant** avec toutes les tailles disponibles
- [x] **Détection automatique** de la taille sous le curseur
- [x] **Palette de couleurs** pour colorer le texte sélectionné

### Gestion des Chapitres
- [x] **Sélecteur de chapitre** sur chaque page
- [x] **Créer un nouveau chapitre** depuis le sélecteur
- [x] **Points colorés** sur les onglets de pages
- [x] **Persistance** des chapitres dans le store

---

## 📁 Fichiers clés modifiés

### BookMode.tsx - Structure complète

```
src/components/modes/BookMode.tsx (~1800 lignes)
├── États principaux
│   ├── currentSpread             # Spread actuel (2 pages)
│   ├── zoomedPage                # 'left' | 'right' | null
│   └── chapters                  # Liste des chapitres
│
├── Vue Livre Ouvert (2 pages éditables)
│   ├── PAGE GAUCHE               # Éditable avec zoom
│   ├── RELIURE CENTRALE          # Effet visuel
│   └── PAGE DROITE               # Éditable avec zoom
│
├── Mode Zoom
│   ├── Page unique agrandie
│   ├── Synchronisation contenu   # Via exitZoom()
│   └── Bouton œil barré
│
├── FormatBar (refaite)
│   ├── Sélecteur police          # Détection auto
│   ├── Sélecteur taille          # Détection auto
│   ├── Gras / Italique           # Sans déplacement curseur
│   ├── Couleurs (palette)
│   └── savedRangeRef             # Conservation sélection
│
└── Layout optimisé
    ├── Barre unifiée (Retour + Titre + FormatBar + Boutons)
    └── Onglets pages centrés
```

### Mécanisme de formatage

```typescript
// 1. Sauvegarde de la sélection (onMouseUp/onKeyUp)
const saveSelection = useCallback(() => {
  const selection = window.getSelection()
  if (selection && !selection.isCollapsed) {
    savedRangeRef.current = {
      text: selection.toString(),
      range: selection.getRangeAt(0).cloneRange()
    }
  }
}, [])

// 2. Restauration avant formatage
const restoreSelection = () => {
  if (savedRangeRef.current) {
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(savedRangeRef.current.range)
  }
}

// 3. Application du style (exemple: taille)
const applyFontSize = (size: number) => {
  restoreSelection()
  const selection = window.getSelection()
  if (selection && !selection.isCollapsed) {
    const range = selection.getRangeAt(0)
    const span = document.createElement('span')
    span.style.fontSize = `${size}px`
    const fragment = range.extractContents()
    span.appendChild(fragment)
    range.insertNode(span)
    // Re-save la nouvelle sélection
    // ...
  }
}
```

---

## 🎨 Interface Mode Écriture - Layout Final

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [< Retour]  Titre histoire...        [FormatBar complète]         [≡] [⊞]   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│      ┌─────────────────┬────┬─────────────────┐                             │
│   <  │ PAGE GAUCHE     │ || │ PAGE DROITE     │  >                          │
│      │ (éditable)      │ || │ (éditable)      │                             │
│      │ ─────────────── │ || │ ─────────────── │                             │
│      │ Il était une    │ || │ La suite de     │                             │
│      │ fois...         │ || │ l'histoire...   │                             │
│      │ ─────────────── │ || │ ─────────────── │                             │
│      │     [👁] — 1 —  │ || │ [👁] — 2 —      │                             │
│      └─────────────────┴────┴─────────────────┘                             │
│                                                                              │
│              [•1] [•2] [•3] [•4] [+]                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Mode Zoom (clic sur l'œil)

```
┌────────────────────────────────────────────────────┐
│                                         [👁̸]       │
│              Introduction                          │
│  ───────────────────────────────────────────────   │
│  Il était une fois une histoire fabuleuse qui      │
│  ───────────────────────────────────────────────   │
│  commençait par une belle journée ensoleillée.     │
│  ───────────────────────────────────────────────   │
│                                                    │
│                  — Page 1 —                        │
├────────────────────────────────────────────────────┤
│              [•1] [•2] [•3] [•4] [+]               │
└────────────────────────────────────────────────────┘
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

1. **Formatage texte** : Utilise `document.execCommand` (deprecated mais fonctionnel) et manipulation DOM directe
2. **Speech Recognition** : Ne fonctionne pas sur Firefox
3. **TTS sur iOS** : Peut nécessiter une interaction utilisateur avant de fonctionner
4. **Synchronisation zoom** : Le contenu est synchronisé via `exitZoom()` et `useEffect` avec dépendance sur `zoomedPage`

---

## 🔑 Identifiants

> ⚠️ **Les identifiants sont dans le fichier `.env.local` (non commité)**
> Voir `env.example` pour les variables nécessaires.

Variables requises :
- `GOOGLE_GEMINI_API_KEY` - Clé API Google Gemini
- `NEXT_PUBLIC_SUPABASE_URL` - URL Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clé anonyme Supabase

---

## 🚀 Pour démarrer

```bash
# Installer
npm install

# Configurer les variables d'environnement
cp env.example .env.local
# Éditer .env.local avec vos clés

# Dev (web)
npm run dev

# Dev (Electron)
npm run dev:electron

# Tester :
# 1. Aller sur localhost:3000
# 2. Cliquer sur "Écriture"
# 3. Sélectionner/créer une histoire
# 4. Voir le livre ouvert avec 2 pages éditables
# 5. Cliquer sur l'œil pour zoomer sur une page
# 6. Sélectionner du texte et changer la taille/police/couleur
# 7. Vérifier que le formatage s'applique à la sélection uniquement
```

---

## 📦 Git

**Repository** : `https://github.com/gregjazzy/The-Evening-Voice.git`

```bash
# Cloner
git clone https://github.com/gregjazzy/The-Evening-Voice.git

# Après modifications
git add .
git commit -m "description"
git push origin main
```

---

## 📚 Documentation

- `README.md` - Vue d'ensemble
- `docs/ARCHITECTURE.md` - Architecture technique
- `docs/QUICK_START.md` - Guide de démarrage
- `docs/API.md` - Documentation API
- `docs/HANDOVER.md` - Ce document

---

## 📝 Résumé des changements de cette session

### Barre de formatage refaite
- Taille et police s'appliquent à la sélection uniquement
- Détection automatique des styles sous le curseur
- Bold/Italic/Couleur fonctionnent sans déplacer le curseur
- Boutons +/- supprimés

### Layout optimisé
- Barre du haut unifiée (Retour + Titre + FormatBar + Boutons)
- Onglets de pages centrés avec points colorés pour chapitres
- Info "X pages • X chap." supprimée (redondante)

### 2 pages éditables
- Page gauche et droite sont maintenant toutes les deux éditables
- Zoom disponible sur les 2 pages
- Synchronisation correcte entre modes

### Sécurité
- Clé API supprimée de la documentation
- Stockage sécurisé dans `.env.local`

---

**Bon courage pour la suite !** 🌙✨
