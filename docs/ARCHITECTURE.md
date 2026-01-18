# 🏗️ Architecture Technique - La Voix du Soir

> Documentation technique complète de l'application

---

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                       │
│              Next.js 14 (Web/iPad) + Electron (Desktop)                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Journal │  │ Écriture │  │  Studio  │  │ Montage  │  │  Mentor  │  │
│  │  📔      │  │  ✍️      │  │  🎨      │  │  📐      │  │  👨‍🏫     │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │             │             │              │        │
│       └─────────────┴──────┬──────┴─────────────┴──────────────┘        │
│                            │                                             │
│                    ┌───────▼───────┐                                    │
│                    │   Zustand     │                                    │
│                    │   (State)     │                                    │
│                    └───────┬───────┘                                    │
└────────────────────────────┼────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┬──────────────────┐
        │                    │                    │                  │
        ▼                    ▼                    ▼                  ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Supabase    │   │    Gemini     │   │  Web Speech   │   │   Electron    │
│   (Database)  │   │    (Luna)     │   │   API         │   │   (Desktop)   │
├───────────────┤   ├───────────────┤   ├───────────────┤   ├───────────────┤
│ - Auth        │   │ - Chat        │   │ - TTS         │   │ - TTS macOS   │
│ - Profiles    │   │ - Pédagogie   │   │ - STT         │   │ - Screen      │
│ - Stories     │   │ - Prompts     │   │ (dictée)      │   │ - Control     │
│ - Realtime    │   │               │   │               │   │               │
└───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘
```

---

## Mode Écriture (BookMode)

### Architecture du composant

```
BookMode.tsx (~7000 lignes)
├── useSpeechRecognition()      # Hook custom pour la dictée vocale
│
├── CONFIGURATION
│   ├── FONTS (6 polices)
│   ├── FONT_SIZES (S/M/L)
│   ├── COLORS (6 couleurs)
│   ├── LINE_SPACINGS (tight/normal/relaxed)
│   ├── PREMIUM_DECORATIONS (60+ décorations SVG)
│   └── DECORATION_COLORS (12 couleurs)
│
├── COMPOSANTS
│   ├── PageTab                    # Onglet de page
│   ├── Overview                   # Vue miniatures
│   ├── FormatBar                  # Barre de formatage complète
│   │   ├── Sélecteur police
│   │   ├── Tailles (S/M/L)
│   │   ├── Gras / Italique
│   │   ├── Alignement (←/▣/→)
│   │   ├── Décalage position (←→ + ↑↓)
│   │   ├── Couleurs
│   │   ├── Fond de page (opacité + zoom)
│   │   └── Toggle lignes
│   ├── WritingArea                # Zone d'écriture
│   │   ├── BackgroundMedia        # Image/vidéo de fond
│   │   ├── EditableBackground     # Contrôles drag/zoom fond
│   │   ├── DraggableImage         # Images flottantes
│   │   ├── DraggableDecoration    # Décorations premium
│   │   ├── Textarea stylisé
│   │   ├── Bouton Dicter 🎙️
│   │   ├── Bouton Image 📷
│   │   ├── Bouton Fond 🖼️
│   │   └── Bouton Décorations 🎨
│   ├── DecorationPicker           # Sélecteur de décorations
│   ├── LunaSidePanel              # Panneau Luna latéral
│   │   ├── Toggle voix 🔊
│   │   ├── Chat historique
│   │   ├── Bouton "Luna, lis ma page"
│   │   └── Input + Micro
│   └── StructureSelector          # Choix structure narrative
│
└── ÉTAT
    ├── pages: StoryPageLocal[]
    ├── currentPageIndex: number
    ├── storyTitle: string
    ├── showLunaPanel: boolean
    ├── showDecorationPicker: boolean
    └── backgroundPickerTargetPage: number | null
```

### Structure de données

```typescript
interface TextStyle {
  fontFamily: string           // "'Merriweather', serif"
  fontSize: 'small' | 'medium' | 'large'
  color: string                // '#ffffff'
  isBold: boolean
  isItalic: boolean
  textAlign: 'left' | 'center' | 'right'
  lineSpacing: 'tight' | 'normal' | 'relaxed'
  horizontalOffset: number     // Décalage horizontal en px
  verticalOffset: number       // Décalage vertical en px
}

interface BackgroundMedia {
  type: 'image' | 'video'
  url: string
  opacity: number              // 0-100
  x: number                    // Position X en %
  y: number                    // Position Y en %
  scale: number                // Zoom 0.1-3.0
}

interface PageDecoration {
  id: string
  decorationId: string         // Référence vers PREMIUM_DECORATIONS
  position: { x: number; y: number }  // Position en %
  scale: number                // 0.2-3.0
  rotation: number             // -180 à 180
  color?: string               // Override couleur
  opacity: number              // 0.2-1.0
  flipH?: boolean              // Miroir horizontal
  flipV?: boolean              // Miroir vertical
  glowEnabled?: boolean        // Effet luminosité
  glowColor?: string           // Couleur du halo
  glowIntensity?: number       // 10-100
}

interface StoryPageLocal {
  id: string
  title: string
  content: string
  image?: string
  imagePosition?: ImagePosition
  imageStyle?: string
  frameStyle?: string
  backgroundMedia?: BackgroundMedia
  decorations?: PageDecoration[]
  chapter?: number
  style?: TextStyle
}
```

### Les 6 Polices

| ID | Nom | CSS Family | Usage |
|----|-----|------------|-------|
| `handwriting` | Écriture | `'Caveat', cursive` | Journal, lettres |
| `tale` | Conte | `'Cormorant Garamond', serif` | Contes classiques |
| `child` | Enfant | `'Patrick Hand', cursive` | Histoires perso |
| `book` | Livre | `'Merriweather', serif` | Romans (défaut) |
| `comic` | BD | `'Comic Neue', cursive` | Aventures |
| `magic` | Magie | `'Spectral', serif` | Fantastique |

---

## Système de Décorations Premium

### Architecture

```typescript
interface DecorationType {
  id: string
  name: string
  category: DecorationCategory
  svg: string                  // Code SVG inline
  defaultColor: string         // Couleur par défaut (#D4AF37)
}

type DecorationCategory = 
  | 'gold'      // Ornements dorés
  | 'floral'    // Floraux
  | 'royal'     // Royaux
  | 'celestial' // Célestes
  | 'artistic'  // Artistiques
  | 'frames'    // Cadres
```

### Catégories et exemples

| Catégorie | Exemples |
|-----------|----------|
| **gold** | Coin Baroque, Coin Filigrane, Séparateur Royal, Volute Dorée |
| **floral** | Branche Sakura, Rose Épanouie, Guirlande Florale, Bouquet |
| **royal** | Couronne Royale, Fleur de Lys, Blason, Sceptre, Diadème |
| **celestial** | Lune Croissant, Étoile Filante, Constellation, Soleil |
| **artistic** | Papillon, Plume Calligraphie, Cœur Orné, Encrier |
| **frames** | Cadre Doré, Cadre Parchemin, Cadre Ovale, Bannière |

### Composant DraggableDecoration

```typescript
function DraggableDecoration({
  decoration,        // PageDecoration
  decorationItem,    // DecorationType
  onPositionChange,
  onScaleChange,
  onRotationChange,
  onColorChange,
  onOpacityChange,
  onFlip,
  onDelete,
  onGlowToggle,
  onGlowColorChange,
  onGlowIntensityChange,
  containerRef
}) {
  // États
  const [isEditing, setIsEditing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [menuOffset, setMenuOffset] = useState({ x: 0, y: 0 })
  const [isDraggingMenu, setIsDraggingMenu] = useState(false)
  
  // Rendu avec Portal pour le menu
  return (
    <>
      <div /* Décoration draggable avec croix rouge */ />
      {createPortal(
        <div /* Menu d'édition flottant et déplaçable */ />,
        document.body
      )}
    </>
  )
}
```

### Effet Glow (Luminosité)

L'effet de luminosité utilise `filter: drop-shadow()` CSS :

```typescript
// Application du glow
style={{
  filter: glowEnabled
    ? `drop-shadow(0 0 ${intensity/10}px ${color}) drop-shadow(0 0 ${intensity/5}px ${color})`
    : 'none'
}}
```

---

## Speech Recognition (Dictée vocale)

### Hook useSpeechRecognition

```typescript
interface UseSpeechRecognitionReturn {
  isListening: boolean         // En cours d'écoute
  isSupported: boolean         // Navigateur supporte
  transcript: string           // Texte reconnu
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

function useSpeechRecognition(locale: string): UseSpeechRecognitionReturn
```

### Utilisation

```typescript
// Dans WritingArea - pour dicter le texte
const { isListening, transcript, startListening, stopListening } = useSpeechRecognition(locale)

useEffect(() => {
  if (!isListening && transcript) {
    onContentChange(page.content + ' ' + transcript)
    resetTranscript()
  }
}, [isListening, transcript])

// Dans LunaSidePanel - pour parler à Luna
useEffect(() => {
  if (!isListening && transcript) {
    sendToLuna(transcript)
    resetTranscript()
  }
}, [isListening, transcript])
```

### Compatibilité

| Navigateur | Support STT |
|------------|-------------|
| Chrome | ✅ Complet |
| Safari | ✅ macOS 10.14.6+, iOS 14.5+ |
| Edge | ✅ Complet |
| Firefox | ❌ Non supporté |

---

## Text-to-Speech (TTS)

### Architecture multi-plateforme

```
useTTS(locale) Hook
       │
       ├─── Electron ? ──────────► IPC → main.js → macOS `say`
       │
       └─── Web/iPad ? ─────────► Web Speech API (speechSynthesis)
```

### Voix configurées

| Plateforme | Français | Anglais | Russe |
|------------|----------|---------|-------|
| **Electron** | Audrey (Enhanced) @ 200 | Samantha @ 180 | Milena @ 170 |
| **Web** | Voix système @ 1.15x | Voix système @ 1.0x | Voix système @ 1.0x |

---

## Panneau Luna (LunaSidePanel)

### Fonctionnalités

```
┌─────────────────────────────────────┐
│  💜 Luna           🔊  ▶           │  ← Toggle voix + Réduire
├─────────────────────────────────────┤
│                                     │
│  [Messages de Luna]                 │  ← Historique du chat
│  [Messages de l'enfant]             │
│                                     │
├─────────────────────────────────────┤
│  🔍 Analyse ▼                      │  ← Menu : Page / Chapitre / Livre
├─────────────────────────────────────┤
│  [Écrire à Luna...]  [🎙️]  [💬]    │  ← Input + Micro + Envoyer
└─────────────────────────────────────┘
```

### Menu "Analyse" (Page / Chapitre / Livre)
- Message visible court pour l'enfant (ex: "Luna, lis ma page !")
- Contexte complet envoyé à Luna en coulisses (structure, cohérence, fautes légères)
- Le contenu est nettoyé du HTML avant envoi (strip)
- Options :
  - Page : structure + cohérence + petites fautes
  - Chapitre : cohérence narrative, personnages, pistes
  - Livre : arc global début/milieu/fin, cohérence des persos, améliorations

---

## State Management (Zustand)

### Store principal (useAppStore)

```typescript
interface AppState {
  // Stories
  stories: Story[]
  currentStory: Story | null
  createStory: (title: string, structure: StoryStructure) => Story
  updateStoryPage: (storyId: string, pageIndex: number, content: string, image?: string) => void
  updateStoryPages: (storyId: string, pages: StoryPage[]) => void
  setCurrentStory: (story: Story | null) => void
  
  // Progression pédagogique
  promptingProgress: PromptingProgress
  addPromptingXP: (xp: number) => void
  setPromptingLevel: (level: PromptingLevel) => void
  
  // ... autres états
}
```

### Persistance

```typescript
persist(
  (set, get) => ({ ... }),
  {
    name: 'lavoixdusoir-storage',
    partialize: (state) => ({
      stories: state.stories,
      promptingProgress: state.promptingProgress,
      // ...
    }),
  }
)
```

---

## Système Pédagogique

### Les 5 Clés Magiques (Images)

| Clé | Impact | Détection |
|-----|--------|-----------|
| 🎨 Style | 40% | `/cartoon\|dessin\|peinture\|photo/i` |
| 🦸 Héros | 25% | Sujet + description |
| 💫 Ambiance | 15% | Émotion + lumière |
| 🌍 Monde | 10% | Lieu + moment |
| ✨ Magie | 10% | Détail unique |

### Les 5 Questions Magiques (Texte)

| Question | But | Exemples Luna |
|----------|-----|---------------|
| Qui ? | Personnage | "Il s'appelle comment ?" |
| Quoi ? | Action | "Qu'est-ce qui lui arrive ?" |
| Où ? | Lieu | "C'est où exactement ?" |
| Quand ? | Moment | "C'est le jour ou la nuit ?" |
| Et alors ? | Rebondissement | "Et ensuite ?" |

---

## API Routes

### /api/ai/chat

```typescript
// POST
{
  message: string,
  context: 'diary' | 'book' | 'studio' | 'general',
  chatHistory: ChatMessage[],
  promptingProgress?: PromptingProgress
}

// Response
{
  text: string,
  sentiment: 'positive' | 'neutral' | 'negative',
  suggestions: string[],
  xpEarned?: number,
  levelUp?: { newLevel: string, message: string }
}
```

---

## Architecture Electron

### Process Principal (main.js)

```
┌─────────────────────────────────────────────────────────────────┐
│                      ELECTRON MAIN                               │
├─────────────────────────────────────────────────────────────────┤
│  IPC Handlers:                                                  │
│  ├── 'tts-speak'      → exec(`say -v '${voice}' "${text}"`)    │
│  ├── 'tts-stop'       → exec('killall say')                    │
│  ├── 'capture-screen' → desktopCapturer                        │
│  ├── 'simulate-click' → AppleScript                            │
│  └── 'simulate-key'   → AppleScript                            │
└─────────────────────────────────────────────────────────────────┘
```

### Preload (preload.js)

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  tts: {
    speak: (text, locale) => ipcRenderer.invoke('tts-speak', text, locale),
    stop: () => ipcRenderer.invoke('tts-stop'),
  },
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  simulateClick: (x, y) => ipcRenderer.send('simulate-click', x, y),
  simulateKey: (key, modifiers) => ipcRenderer.send('simulate-key', key, modifiers),
})
```

---

## Performance

### Optimisations

- **Fonts** : 6 polices Google Fonts préchargées
- **State** : Persistance sélective (Zustand localStorage)
- **TTS** : Nettoyage emojis avant synthèse
- **Chat** : Historique limité à 10 messages
- **Stars background** : useMemo pour éviter re-renders
- **Portal** : Menus de décorations rendus via Portal pour éviter clipping

### Points d'attention

- **Sauvegarde** : À chaque caractère tapé (pourrait être optimisé avec debounce)
- **STT** : Utilise des ressources (micro actif)
- **TTS iOS** : Nécessite interaction utilisateur avant
- **BookMode.tsx** : Fichier volumineux (~7000 lignes) - candidat au refactoring

---

## Sécurité

### Middleware Next.js

```typescript
if (!user && !publicRoutes.includes(pathname)) {
  redirect('/login')
}
```

### Contenu safe

- Gemini configuré pour réponses adaptées aux enfants
- Luna ne fait jamais le travail à la place de l'enfant
- Pas de contenu violent ou inapproprié
- Décorations SVG inline (pas de ressources externes)

---

## Mode Montage (Timeline Rubans)

### Concept

Le montage utilise une **timeline temporelle** (en secondes) avec des **rubans** pour chaque type d'élément. L'interface est adaptée aux enfants de 8 ans avec une vue simplifiée (Cartes) et une vue avancée (Rubans).

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MODE MONTAGE                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    VUE CARTES (Simple)                          │   │
│  │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                       │   │
│  │  │ 🎬 1  │ │ 🎬 2  │ │ 🎬 3  │ │  +   │  ← Moments/Scènes     │   │
│  │  └───────┘ └───────┘ └───────┘ └───────┘                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    VUE RUBANS (Timing)                          │   │
│  │  0s      5s      10s      15s      20s                         │   │
│  │  │       │        │        │        │                          │   │
│  │  🎥 ▹████████████████████████◃        ← Vidéo/Image           │   │
│  │  📝      |Phrase 1|Phrase 2|Phrase 3| ← Texte (ancre)          │   │
│  │  🔊   |██████████████████████████|    ← Sons                   │   │
│  │  💡  |████████████████████████████|   ← Lumières               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Principes clés

| Principe | Description |
|----------|-------------|
| **Timeline temporelle** | Tout est positionné en secondes, pas en index de mots |
| **Voix = ancre** | La durée de la voix définit la durée totale de la scène |
| **Rubans** | Chaque élément est un ruban qu'on peut glisser/étirer |
| **Karaoké phrase** | Les phrases s'illuminent une par une (pas mot par mot) |
| **Éléments obligatoires** | Texte, Voix, Média, Sons, Lumières, Effets |

### Structure de données

```typescript
// ==================== TYPES TIMELINE ====================

/**
 * Position temporelle d'un élément sur la timeline
 */
interface TimeRange {
  startTime: number      // Début en secondes
  endTime: number        // Fin en secondes
  fadeIn?: number        // Durée fondu entrée (secondes)
  fadeOut?: number       // Durée fondu sortie (secondes)
}

/**
 * Style d'affichage d'une phrase (personnalisable)
 */
interface PhraseStyle {
  position: 'top' | 'center' | 'bottom' | 'custom'
  customPosition?: { x: number; y: number }  // Si position = 'custom'
  fontSize: 'small' | 'medium' | 'large' | 'xlarge'
  color: string              // Couleur du texte (hex)
  backgroundColor?: string   // Fond optionnel (hex)
  animation?: 'fade' | 'slide' | 'zoom' | 'typewriter'
}

/**
 * Une phrase avec son timing et style
 */
interface PhraseTiming {
  id: string
  text: string              // Contenu de la phrase
  index: number             // Position dans le texte (0, 1, 2...)
  timeRange: TimeRange      // Position sur la TIMELINE (modifiable)
  audioTimeRange?: TimeRange // Timing ORIGINAL dans l'audio (immuable)
  style?: PhraseStyle       // Style d'affichage personnalisé
  volume?: number           // Volume audio (0-1.5, défaut: 1)
}

/**
 * Piste de narration (voix)
 */
interface NarrationTrack {
  id: string
  audioUrl?: string      // URL de l'audio (enregistré ou TTS)
  audioBlob?: Blob       // Blob audio pour lecture locale
  source: 'recorded' | 'tts'
  ttsVoice?: string      // Voix ElevenLabs si TTS
  duration: number       // Durée totale en secondes
  phrases: PhraseTiming[] // Timing de chaque phrase
  isSynced: boolean
  volume?: number        // Volume global narration (0-1)
}

/**
 * Un média (vidéo ou image) sur la timeline
 */
interface MediaTrack {
  id: string
  type: 'video' | 'image'
  url: string
  name: string
  timeRange: TimeRange   // Position sur la timeline
  position: {            // Position dans le canvas (%)
    x: number
    y: number
    width: number
    height: number
  }
  zIndex: number
  loop?: boolean         // Pour vidéos
  muted?: boolean        // Pour vidéos
}

/**
 * Un son sur la timeline
 */
interface SoundTrack {
  id: string
  url: string
  name: string
  type: 'sfx' | 'ambiance' | 'music'
  timeRange: TimeRange
  volume: number         // 0-1
  loop: boolean
}

/**
 * Un état de lumière sur la timeline
 */
interface LightTrack {
  id: string
  timeRange: TimeRange
  color: string          // Hex
  intensity: number      // 0-100
}

/**
 * Un effet de texte sur la timeline
 */
interface TextEffectTrack {
  id: string
  type: 'highlight' | 'glow' | 'shake' | 'scale'
  phraseIndex: number    // Quelle phrase est affectée
  timeRange: TimeRange
  color?: string
  intensity?: number
}

/**
 * Une scène (moment) dans le montage
 */
interface MontageScene {
  id: string
  title: string
  
  // Texte découpé en phrases
  text: string
  phrases: string[]      // Texte splitté en phrases
  
  // Durée totale de la scène
  duration: number       // En secondes
  
  // Pistes (rubans)
  narration: NarrationTrack
  mediaTrack: MediaTrack[]
  soundTracks: SoundTrack[]
  lightTracks: LightTrack[]
  textEffects: TextEffectTrack[]
}

/**
 * Projet de montage complet
 */
interface MontageProject {
  id: string
  storyId: string
  title: string
  scenes: MontageScene[]
  createdAt: Date
  updatedAt: Date
  isComplete: boolean
}
```

### Flux utilisateur

```
┌─────────────────────────────────────────────────────────┐
│  1. SÉLECTION HISTOIRE                                  │
│     └→ Choisir une histoire du mode Écriture           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  2. DÉCOUPAGE EN SCÈNES                                 │
│     └→ Chaque page = 1 scène par défaut                │
│     └→ Possibilité de redécouper                       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  3. POUR CHAQUE SCÈNE :                                 │
│                                                         │
│     a. VOIX (obligatoire)                               │
│        ├→ Enregistrer sa voix                          │
│        └→ OU générer TTS (ElevenLabs)                  │
│                                                         │
│     b. SYNCHRONISATION PHRASES                          │
│        └→ Jeu de rythme : 1 tap par phrase             │
│                                                         │
│     c. MÉDIA (obligatoire)                              │
│        └→ Ajouter image/vidéo depuis Studio            │
│                                                         │
│     d. ENRICHISSEMENT (vue Rubans)                      │
│        ├→ Sons d'ambiance / effets                     │
│        ├→ Scénario lumières (HomeKit)                  │
│        └→ Effets sur le texte                          │
│                                                         │
│     e. PRÉVISUALISATION                                 │
│        └→ Tester la scène complète                     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  4. THÉÂTRE                                             │
│     └→ Lecture finale avec tout synchronisé            │
└─────────────────────────────────────────────────────────┘
```

### Composants

| Composant | Rôle |
|-----------|------|
| `MontageEditor.tsx` | Éditeur principal avec vues Cartes/Rubans |
| `SceneCard.tsx` | Carte d'une scène (vue simple) |
| `TimelineRubans.tsx` | Timeline avec rubans drag & drop |
| `RhythmGame.tsx` | Jeu de sync phrase par phrase |
| `KaraokePlayer.tsx` | Lecteur karaoké phrase par phrase |
| `MediaPicker.tsx` | Sélecteur de médias depuis Studio |
| `SoundPicker.tsx` | Bibliothèque de sons |
| `LightEditor.tsx` | Éditeur de scénario lumières |

### Karaoké phrase par phrase

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│   [IMAGE/VIDÉO DE FOND]                                │
│                                                        │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ← phrase passée     │
│   (Il était une fois, dans une forêt.)                 │
│                                                        │
│   ████████████████████████████████  ← phrase active   │
│   "Une petite fille nommée Luna."   ← illuminée       │
│                                                        │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ← phrase à venir   │
│   (Elle adorait explorer les sentiers.)               │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Jeu de rythme (sync phrases)

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  🎵 Synchronise ta voix !                              │
│                                                        │
│  ▶️ [AUDIO QUI JOUE] ━━━━━━━●━━━━━━━━━━━━━━━━         │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │  ✅ "Il était une fois, dans une forêt."        │  │
│  │                                                  │  │
│  │  👉 "Une petite fille nommée Luna."      [TAP!] │  │
│  │                                                  │  │
│  │  ⏳ "Elle adorait explorer les sentiers."       │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Tape ESPACE quand tu entends le début de la phrase !  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Interface Rubans

```
┌─────────────────────────────────────────────────────────┐
│  🎬 Scène 1 : "La forêt enchantée"                      │
│                                                         │
│  ▶️ ━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━  0:07 / 0:18      │
│     0s      5s      10s      15s      20s               │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 🎥 Vidéo    ▹██████████████████████████◃         │  │
│  │ 📝 Phrases      |P1|  P2  |  P3  |               │  │
│  │ 🔊 Forêt     |██████████████████████████|        │  │
│  │ 🔊 Oiseaux        |████████|                     │  │
│  │ 💡 Bleu→Vert |████████████████████████████|      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  👆 Glisse les rubans ! Tire les bords pour ajuster !   │
│                                                         │
│  [← Cartes]                           [▶️ Prévisualiser]│
└─────────────────────────────────────────────────────────┘

Gestes :
- Glisser ruban      → Décaler dans le temps
- Tirer bord gauche  → Changer début
- Tirer bord droit   → Changer fin
- Tirer coin ▹       → Fondu entrée
- Tirer coin ◃       → Fondu sortie
```
