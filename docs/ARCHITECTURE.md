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
BookMode.tsx
├── useSpeechRecognition()      # Hook custom pour la dictée vocale
│
├── CONFIGURATION
│   ├── FONTS (6 polices)
│   ├── FONT_SIZES (S/M/L)
│   ├── COLORS (6 couleurs)
│   ├── LINE_SPACINGS (tight/normal/relaxed)
│   └── OFFSET_STEP (8px)
│
├── COMPOSANTS
│   ├── PageTab                  # Onglet de page
│   ├── Overview                 # Vue miniatures
│   ├── FormatBar                # Barre de formatage complète
│   │   ├── Sélecteur police
│   │   ├── Tailles (S/M/L)
│   │   ├── Gras / Italique
│   │   ├── Alignement (←/▣/→)
│   │   ├── Décalage position (←→ + ↑↓)
│   │   └── Couleurs
│   ├── WritingArea              # Zone d'écriture
│   │   ├── Textarea stylisé
│   │   ├── Bouton Dicter 🎙️
│   │   └── Bouton Image
│   ├── LunaSidePanel            # Panneau Luna latéral
│   │   ├── Toggle voix 🔊
│   │   ├── Chat historique
│   │   ├── Bouton "Luna, lis ma page"
│   │   └── Input + Micro
│   └── StructureSelector        # Choix structure narrative
│
└── ÉTAT
    ├── pages: StoryPageLocal[]
    ├── currentPageIndex: number
    ├── storyTitle: string
    └── showLunaPanel: boolean
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

interface StoryPageLocal {
  id: string
  title: string
  content: string
  image?: string
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

### Points d'attention

- **Sauvegarde** : À chaque caractère tapé (pourrait être optimisé avec debounce)
- **STT** : Utilise des ressources (micro actif)
- **TTS iOS** : Nécessite interaction utilisateur avant

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
