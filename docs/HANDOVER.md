# 📋 Handover - La Voix du Soir

> Document de passation complet pour la prochaine session de développement

**Date** : 12 janvier 2026  
**Version** : 1.7.0  
**État** : Mode Écriture avec images flottantes, styles, cadres et rotation

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

## ✅ Ce qui a été fait (Session du 12 janvier 2026 - Soir)

### 🖼️ Images Flottantes - Système Complet ✨

**Fonctionnalité principale** : Les images peuvent maintenant être placées librement sur les pages sans affecter le texte (overlay).

#### Composant `DraggableImage`

| Fonctionnalité | Comportement |
|----------------|--------------|
| **Drag & Drop** | Glisser-déposer l'image n'importe où sur la page |
| **Redimensionnement** | Poignée en bas à droite pour redimensionner |
| **Rotation libre** | Poignée de rotation (flèche enroulée) comme Word |
| **Styles d'image** | 12+ effets visuels |
| **Cadres** | 12+ styles de bordures |
| **Suppression** | Bouton X pour supprimer l'image |
| **Menus fixes** | Menus de style/cadre centrés à l'écran (lisibles même sur petites images) |

#### Styles d'image disponibles

```typescript
type ImageStyle = 
  | 'normal'       // Aucun effet
  | 'sepia'        // Effet sépia vintage
  | 'taped'        // Scotch décoratif
  | 'circle'       // Forme circulaire
  | 'heart'        // Forme cœur (polygon responsive)
  | 'cloud'        // Bords estompés (mask-image radial-gradient)
  | 'polaroid'     // Style photo instantanée
  | 'sketch'       // Effet croquis
  | 'glow'         // Lueur autour
  | 'rounded'      // Coins arrondis
  | 'neon'         // Effet néon lumineux
  | 'frost'        // Effet givré
  | 'golden'       // Teinte dorée
  | 'shadow3d'     // Ombre 3D
  | 'negative'     // Négatif photo
  | 'papercut'     // Découpage papier
  | 'watercolor'   // Aquarelle
  | 'vintage_frame'// Cadre vintage
  | 'filmstrip'    // Bande film
  | 'puzzle'       // Pièce de puzzle
  | 'torn_edge'    // Bords déchirés
  | 'stained_glass'// Vitrail
  | 'pixel_art'    // Art pixelisé
```

#### Cadres disponibles

```typescript
type FrameStyle = 
  | 'none'         // Pas de cadre
  | 'simple'       // Bordure simple noire
  | 'double'       // Double bordure
  | 'dotted'       // Pointillés
  | 'polaroid'     // Cadre polaroid blanc
  | 'taped'        // Avec scotch
  | 'wood'         // Cadre bois (border-image)
  | 'golden'       // Cadre doré (border-image)
  | 'baroque'      // Cadre baroque orné (border-image)
  | 'ornate'       // Orné coloré
  | 'romantic'     // Rose romantique
  | 'shadow3d'     // Ombre profonde
```

#### Interface StoryPage étendue

```typescript
// Dans useAppStore.ts
export interface StoryPage {
  id: string
  stepIndex: number
  content: string
  image?: string
  imagePosition?: {
    x: number
    y: number
    width: number
    height: number
    rotation: number
  }
  imageStyle?: string
  frameStyle?: string
  order: number
  chapterId?: string
  title?: string
}
```

### 🗑️ Suppression de Page

- **Bouton X** sur les onglets de page (visible sur la page active)
- **Modal de confirmation** : "Supprimer cette page ?"
- **Protection** : Impossible de supprimer la dernière page

### 🔄 Persistance des Images

**Ajouté dans le store** :
- `imagePosition` : position x, y, largeur, hauteur, rotation
- `imageStyle` : style visuel de l'image
- `frameStyle` : style du cadre

**Chargement** : Les propriétés sont récupérées au chargement de l'histoire.

---

## ⚠️ Bug Connu - Images Uploadées

### Problème
Les images uploadées depuis l'ordinateur **disparaissent au rafraîchissement**.

### Cause
`URL.createObjectURL(file)` crée des URLs `blob:` temporaires qui ne persistent pas.

### Solutions possibles (à implémenter)

1. **Base64** - Convertir l'image en data URL
   ```typescript
   const reader = new FileReader()
   reader.onload = (e) => {
     const base64 = e.target?.result as string
     onSelect(base64, type) // Au lieu de blob URL
   }
   reader.readAsDataURL(file)
   ```

2. **Supabase Storage** - Upload sur le cloud
   ```typescript
   const { data } = await supabase.storage
     .from('images')
     .upload(`stories/${storyId}/${fileName}`, file)
   const url = supabase.storage.from('images').getPublicUrl(data.path)
   ```

3. **IndexedDB** - Stockage local persistant

**Recommandation** : Base64 pour les petites images (< 5MB), Supabase pour les plus grandes.

---

## 📁 Fichiers modifiés cette session

### `src/components/modes/BookMode.tsx`

**Ajouts majeurs** :
- Composant `DraggableImage` (~400 lignes)
- Handlers : `handleImagePositionChange`, `handleImageStyleChange`, `handleImageFrameChange`, `handleImageDelete`
- Modal de confirmation de suppression de page
- Menus de style/cadre en position fixe centrée

**Structure du composant DraggableImage** :
```typescript
function DraggableImage({
  src,
  position,
  imageStyle,
  frameStyle,
  onPositionChange,
  onDelete,
  onStyleChange,
  onFrameChange,
  containerRef
}) {
  // États
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [showStyleMenu, setShowStyleMenu] = useState(false)
  const [showFrameMenu, setShowFrameMenu] = useState(false)
  
  // Handlers drag/resize/rotate
  const handleDragStart = (e) => { ... }
  const handleRotateStart = (e) => { ... }
  
  // Rendu avec styles conditionnels
  return (
    <div style={{ position: 'absolute', transform: `rotate(${position.rotation}deg)` }}>
      {/* Image avec styles */}
      {/* Contrôles (delete, style, frame, rotate) positionnés HORS du container clippé */}
      {/* Menus en position: fixed au centre de l'écran */}
    </div>
  )
}
```

### `src/store/useAppStore.ts`

**Ajouts** :
```typescript
imagePosition?: {
  x: number
  y: number
  width: number
  height: number
  rotation: number
}
imageStyle?: string
frameStyle?: string
```

### `src/components/editor/MediaPicker.tsx`

**Inchangé** - mais source du problème des URLs blob.

---

## 🎨 Interface Mode Écriture - Avec Image

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [< Retour]  Titre histoire...        [FormatBar complète]         [≡] [⊞]   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│      ┌─────────────────┬────┬─────────────────┐                             │
│   <  │ PAGE GAUCHE     │ || │ PAGE DROITE     │  >                          │
│      │ ┌─────────┐     │ || │                 │                             │
│      │ │  IMAGE  │ [X] │ || │ La suite de     │                             │
│      │ │ [🎨][📐]│     │ || │ l'histoire...   │                             │
│      │ │    ↻    │     │ || │                 │                             │
│      │ └─────────┘     │ || │                 │                             │
│      │ Il était...     │ || │                 │                             │
│      │     [👁] — 1 —  │ || │ [👁] — 2 —      │                             │
│      └─────────────────┴────┴─────────────────┘                             │
│                                                                              │
│              [•1] [•2✕] [•3] [•4] [+]                                        │
└──────────────────────────────────────────────────────────────────────────────┘

[X] = Supprimer image
[🎨] = Menu styles (sépia, cercle, cœur, nuage...)
[📐] = Menu cadres (simple, bois, doré, baroque...)
↻ = Poignée rotation (drag pour tourner)
```

---

## 🚀 Ce qui reste à faire

### Priorité Haute
| Tâche | Notes |
|-------|-------|
| **Persistance images** | Convertir blob URLs en Base64 ou Supabase Storage |
| Export PDF | Exporter les histoires en PDF avec images |
| Tests utilisateur | Faire tester par les enfants |

### Priorité Moyenne
| Tâche | Notes |
|-------|-------|
| Vidéos dans pages | Supporter les vidéos en plus des images |
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

1. **Images blob** : Les images uploadées localement disparaissent au refresh (URLs temporaires)
2. **Formatage texte** : Utilise manipulation DOM directe
3. **Speech Recognition** : Ne fonctionne pas sur Firefox
4. **TTS sur iOS** : Peut nécessiter une interaction utilisateur

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

# Tester les images :
# 1. Aller sur localhost:3000
# 2. Cliquer sur "Écriture"
# 3. Sélectionner/créer une histoire
# 4. Cliquer sur l'icône image pour ajouter une image
# 5. Glisser-déposer l'image sur la page
# 6. Tester les styles (🎨) et cadres (📐)
# 7. Tester la rotation avec la poignée
# 8. Supprimer avec le X
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

### Images flottantes
- Images positionnables librement (overlay, pas d'impact sur le texte)
- Drag & drop, redimensionnement, rotation libre
- 12+ styles visuels (sépia, cercle, cœur, nuage avec bords estompés...)
- 12+ styles de cadres (bois, doré, baroque...)
- Menus de style/cadre en position fixe (lisibles quelle que soit la taille de l'image)

### Suppression de page
- Bouton X sur les onglets de page active
- Modal de confirmation avant suppression

### Persistance
- `imagePosition`, `imageStyle`, `frameStyle` ajoutés au store
- Sauvegarde et chargement corrects

### Bug identifié
- Les images uploadées (blob URLs) ne persistent pas au refresh
- Solution à implémenter : conversion Base64 ou Supabase Storage

---

**Bon courage pour la suite !** 🌙✨
