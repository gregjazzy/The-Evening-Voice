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
│   Supabase    │   │    fal.ai     │   │  Web Speech   │   │   Electron    │
│   (Database)  │   │  (AI Unified) │   │   API         │   │   (Desktop)   │
├───────────────┤   ├───────────────┤   ├───────────────┤   ├───────────────┤
│ - Auth        │   │ - Flux 1 Pro  │   │ - TTS         │   │ - TTS macOS   │
│ - Profiles    │   │ - Kling 2.1   │   │ - STT         │   │ - Screen      │
│ - Stories     │   │ - ElevenLabs  │   │ (dictée)      │   │ - Control     │
│ - Realtime    │   │               │   │               │   │               │
└───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘
                            │
                    ┌───────▼───────┐
                    │  + Gemini     │  ← Chat IA
                    │  + AssemblyAI │  ← Transcription
                    └───────────────┘
```

---

## Services IA

### Architecture Unifiée (fal.ai)

```
┌─────────────────────────────────────────────────────────────┐
│                     fal.ai API                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │Nano Banana  │  │  Kling 2.1  │  │ ElevenLabs  │         │
│  │Pro (Images) │  │  (Vidéos)   │  │  (Voix IA)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│        │                                                    │
│        └── + Real-ESRGAN (upscale 300 DPI pour impression) │
└─────────────────────────────────────────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
   /api/ai/image      /api/ai/video    /api/ai/voice/narration
```

> **Note** : Nano Banana Pro remplace Flux 1 Pro car il comprend mieux le français.

### Services Séparés

| Service | Usage | Raison |
|---------|-------|--------|
| **Gemini** | Chat IA (assistance) | Meilleur pour dialogue |
| **AssemblyAI** | Transcription voix | Timestamps plus précis que Whisper |

### Fichier unifié : `src/lib/ai/fal.ts`

```typescript
// Génération d'images
export async function generateFalImage(prompt: string, apiKey?: string)

// Génération de vidéos
export async function generateFalVideo(imageUrl: string, prompt: string, apiKey?: string)

// Voix ElevenLabs avec timestamps
export async function generateFalElevenLabsVoice(text: string, voiceId: string, apiKey?: string)
```

---

## Mode Studio

### Vue d'ensemble

Le Studio permet de créer des images et vidéos avec un système pédagogique progressif sur 5 niveaux.

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDIO MODE                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ StudioAIChat │  │PromptBuilder │  │ StudioGuide  │       │
│  │   (Chat IA)  │  │ (Kit prompt) │  │  (Étapes)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐               │
│         ▼                 ▼                 ▼               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Niveaux 1-2 │  │ Niveaux 3-5 │  │  Tutoriels  │         │
│  │ Auto génère │  │ fal.ai web  │  │   visuels   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Système de niveaux

| Niveau | Autonomie | Interface | Génération |
|--------|-----------|-----------|------------|
| **1** | Guidé | Boutons style/ambiance | API automatique |
| **2** | Assisté | + Boutons lumière/format | API automatique |
| **3** | Semi-autonome | + Texte libre | fal.ai playground |
| **4** | Autonome | Moins de boutons | fal.ai playground |
| **5** | Expert | Prompt libre | fal.ai playground |

### Composants principaux

```
src/components/studio/
├── PromptBuilder.tsx      # Construction du prompt (kit)
├── StudioAIChat.tsx       # Chat avec Luna (validation)
├── StudioGuide.tsx        # Guide des étapes
├── AssetDropzone.tsx      # Import/galerie d'assets
├── TutorialGuide.tsx      # Tutoriels visuels fal.ai
├── SafariBridge.tsx       # Pont vers Safari (niv. 3+)
└── StudioTutorial.tsx     # Tutoriel pas à pas
```

### Flux de création (niveaux 1-2)

```
1. Enfant décrit son sujet → Chat IA valide
                              ↓
2. Sélection style/ambiance/lumière/format
                              ↓
3. Clic "Générer !" → /api/ai/image ou /api/ai/video
                              ↓
4. Nano Banana Pro génère l'image
   (+ upscale 300 DPI si format livre)
                              ↓
5. Boutons : Garder! / Supprimer / Refaire
                              ↓
6. "Garder!" → Upload Supabase (images) ou R2 (vidéos)
```

### Flux de création (niveaux 3-5)

```
1. Enfant construit son prompt avec aide IA
                              ↓
2. Clic "Copier + Ouvrir fal.ai"
   → Prompt copié dans presse-papier
   → Safari s'ouvre sur fal.ai playground
                              ↓
3. Tutoriel visuel guide l'enfant :
   - Coller le prompt (Cmd+V)
   - Cliquer sur "Run"
   - Attendre la génération
   - Télécharger le résultat
                              ↓
4. Glisser-déposer l'image/vidéo dans l'app
```

### URLs fal.ai playground

| Type | URL |
|------|-----|
| **Images** | https://fal.ai/models/fal-ai/flux-pro/v1.1/playground |
| **Vidéos** | https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/text-to-video/playground |

### Liaison avec l'histoire

Tous les assets sont liés à `currentStory.id` :
- **Local** : `useStudioStore.importedAssets[].projectId`
- **Supabase** : `assets.story_id`

```typescript
// Génération
addImportedAsset({ ..., projectId: currentStory?.id })

// Upload "Garder!"
uploadFromUrl(url, { storyId: currentStory?.id })
```

### Qualité d'impression

Pour les images destinées à l'impression (format livre 3:4) :
- Génération native ~2K
- Upscale via Real-ESRGAN → 300 DPI
- Coût : ~$0.16 par image

---

## Mode Écriture (BookMode)

### Flux utilisateur

```
1. Créer une histoire (titre + structure)
                     ↓
2. Écrire sur les pages (avec aide IA)
                     ↓
3. Ajouter images, décorations, fond
                     ↓
4. Cliquer "Terminer mon histoire" ✓
                     ↓
5. Modal de célébration 🎉
   ├── Aller dans Studio (créer des images)
   ├── Aller dans Montage (créer une vidéo)
   └── Continuer à écrire
                     ↓
6. Histoire marquée isComplete: true
```

### Architecture du composant

```
BookMode.tsx (~7000 lignes)
├── useSpeechRecognition()      # Hook custom pour la dictée vocale
├── useTTS()                    # Hook pour synthèse vocale IA
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
│   │   └── Highlightable          # Wrapper pour guidage IA
│   ├── WritingArea                # Zone d'écriture
│   │   ├── BackgroundMedia        # Image/vidéo de fond
│   │   ├── DraggableImage         # Images flottantes
│   │   ├── DraggableDecoration    # Décorations premium
│   │   └── Highlightable          # Boutons avec guidage IA
│   ├── DecorationPicker           # Sélecteur de décorations
│   └── AISidePanel                # Panneau IA latéral
│       ├── Toggle voix 🔊
│       ├── Chat historique
│       ├── Bouton "Lis ma page"
│       └── Input + Micro (Speech Recognition)
│
└── ÉTAT
    ├── pages: StoryPageLocal[]
    ├── currentPageIndex: number
    ├── autoSpeak: boolean          # IA parle automatiquement
    └── aiVoiceEnabled: boolean     # Saisie vocale activée
```

### Système de Guidage IA (Highlightable)

```typescript
// Wrapper pour éléments guidables
<Highlightable id="book-add-image">
  <button onClick={addImage}>📷 Image</button>
</Highlightable>

// L'IA peut déclencher un highlight
"Clique sur le bouton qui clignote ! [HIGHLIGHT:book-add-image]"
```

**Implémentation :**
- `useHighlightStore.ts` : Gestion des highlights actifs
- `Highlightable.tsx` : Animation glow/pulse via Framer Motion
- Durée : 6 secondes auto-stop
- Portal React pour éviter `overflow: hidden`

---

## Mode Montage

### Architecture

```
MontageEditor.tsx
├── VUE CARTES (SceneCard[])
│   ├── MontageAIChat              # Chat IA intégré
│   │   ├── useTTS() + autoSpeak
│   │   ├── useSpeechRecognition()
│   │   └── highlightMultiple()
│   ├── SceneCard                  # Carte par scène
│   │   ├── Enregistrer voix
│   │   ├── IA raconte (ElevenLabs)
│   │   └── Status synchronisation
│   └── NarrationVoiceSelectorModal
│
└── VUE TIMELINE (TimelineRubans)
    ├── TimelineAIHelp             # Aide IA flottante (Portal)
    │   ├── Drag & drop position
    │   └── z-index: 10001 (fullscreen)
    ├── Rubans
    │   ├── Structure (phrases)
    │   ├── Médias (images/vidéos)
    │   ├── Musique
    │   ├── Sons
    │   ├── Lumières (HomeKit)
    │   ├── Décorations
    │   ├── Animations
    │   └── Effets
    └── PhrasePropertiesPanel
```

### Flux Narration IA

```
1. Clic "IA raconte" → NarrationVoiceSelectorModal
                              ↓
2. Sélection voix ElevenLabs (21 voix : FR/EN/RU)
                              ↓
3. POST /api/ai/voice/narration
   └── fal.ai → ElevenLabs TTS avec timestamps
                              ↓
4. Réponse : { audioUrl, wordTimings[] }
                              ↓
5. Création PhraseTiming[] depuis wordTimings
                              ↓
6. Affichage sur Timeline (comme voix enregistrée)
```

### Flux Voix Enregistrée

```
1. Enregistrement micro (MediaRecorder)
                              ↓
2. POST /api/ai/transcribe (multipart/form-data)
   └── AssemblyAI → Transcription + timestamps
                              ↓
3. Réponse : { text, words[], duration }
                              ↓
4. Création PhraseTiming[] depuis words
                              ↓
5. Affichage sur Timeline (draggable)
```

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

### Priorité des voix

```typescript
// Web (Chrome/Safari)
const RECOMMENDED_VOICES_WEB = [
  // Français
  'Google français',
  'Microsoft Paul - French',
  // Anglais
  'Google US English',
  'Google UK English Female',
  // Russe
  'Google русский',
]

// Electron (macOS)
const RECOMMENDED_VOICES_ELECTRON = [
  // Français
  'Audrey (Enhanced)',
  'Audrey (Premium)',
  'Thomas',
  // Anglais
  'Samantha',
  'Alex',
  // Russe
  'Milena',
]
```

### Vitesse adaptée aux enfants

```typescript
const VOICE_SETTINGS = {
  'fr': { rate: 0.92, pitch: 1.05 },  // Plus lent pour enfants
  'en': { rate: 0.92, pitch: 1.0 },
  'ru': { rate: 0.90, pitch: 1.0 },
}
```

---

## Séquence d'Accueil

### Flux

```
┌─────────────────────────────────────────┐
│ 1. Prénom de l'enfant                   │
│    "Comment tu t'appelles ?"            │
│    [_____________]                       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 2. Nom de l'IA                          │
│    "Je suis ton amie magique..."        │
│    [Étoile] [Lune] [Fée] [___]          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 3. Voix de l'IA                         │
│    "Quelle voix tu préfères ?"          │
│    [🔊 Voix 1] [🔊 Voix 2] [🔊 Voix 3]  │
│    (voix premium du navigateur)         │
└─────────────────────────────────────────┘
```

### Stockage

```typescript
// useAppStore.ts
{
  userName: string,       // Prénom enfant
  aiName: string,         // Nom IA choisi
  aiVoiceId: string,      // Voix TTS choisie
  aiVoiceEnabled: boolean // Toujours true par défaut
}
```

---

## Gestion des Clés API

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Route                                 │
├─────────────────────────────────────────────────────────────┤
│  const apiKey = await getApiKeyForRequest('fal')            │
│                                                              │
│  1. Extraire familyId du token JWT                          │
│  2. SELECT fal_key FROM family_config WHERE family_id = ?   │
│  3. Si trouvé → utiliser clé famille                        │
│  4. Sinon → process.env.FAL_API_KEY (fallback admin)        │
└─────────────────────────────────────────────────────────────┘
```

### Fichiers

```
src/lib/config/
├── api-keys.ts        # Client-side helpers
└── server-config.ts   # Server-side (getApiKeyForRequest)
```

### Clés supportées

| Type | Variable env | Colonne Supabase |
|------|-------------|------------------|
| fal.ai | `FAL_API_KEY` | `fal_key` |
| Gemini | `GOOGLE_GEMINI_API_KEY` | `gemini_key` |
| AssemblyAI | `ASSEMBLYAI_API_KEY` | `assemblyai_key` |

---

## State Management (Zustand)

### Stores

```
src/store/
├── useAppStore.ts            # État global, histoires, préférences, userName
├── useStudioStore.ts         # Kits de création, assets importés
├── useStudioProgressStore.ts # Progression pédagogique (niveaux 1-5)
├── useMontageStore.ts        # Projets montage (sync Supabase)
├── usePublishStore.ts        # Publication Gelato
├── useMentorStore.ts         # Session mentor
├── useAuthStore.ts           # Authentification
├── useHighlightStore.ts      # Guidage visuel IA ✨
└── useAdminStore.ts          # Administration multi-famille
```

### Liaison des données (Story comme clé centrale)

```
                    ┌─────────────────────┐
                    │  currentStory (id)  │
                    │     useAppStore     │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  useStudioStore │  │ useMontageStore │  │ usePublishStore │
│  importedAssets │  │ MontageProject  │  │  selectedStory  │
│   └─projectId   │  │   └─storyId     │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │
         ▼                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Supabase                              │
│  assets.story_id  │  montage_projects.story_id          │
└─────────────────────────────────────────────────────────┘
```

### Sélecteur d'histoire (Sidebar)

L'utilisateur peut changer d'histoire à tout moment via le dropdown dans la sidebar :

```
┌──────────────────┐
│   📖 Mon titre   │  ← Dropdown
│        ▼         │
├──────────────────┤
│ Histoire 1    ✓  │
│ Histoire 2       │
│ ─────────────────│
│ + Nouvelle       │
└──────────────────┘
```

**Comportement :**
- Studio et Montage sont **bloqués** sans histoire
- Changer d'histoire filtre automatiquement les assets

### useHighlightStore

```typescript
interface HighlightStore {
  activeHighlights: Record<string, HighlightConfig>
  
  highlight: (elementId: string, config?: HighlightConfig) => void
  highlightMultiple: (elementIds: string[], config?: HighlightConfig) => void
  stopHighlight: (elementId: string) => void
  stopAllHighlights: () => void
  isHighlighted: (elementId: string) => boolean
}

// Auto-stop après 6 secondes
const DEFAULT_DURATION = 6000
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

---

## Sécurité

### Clés API

- **Jamais exposées côté client**
- Stockées dans Supabase `family_config` (chiffrées)
- `.env.local` pour fallback admin (gitignored)
- Récupération via API routes (server-side)

### Middleware Next.js

```typescript
if (!user && !publicRoutes.includes(pathname)) {
  redirect('/login')
}
```

### Contenu safe

- Gemini configuré pour réponses adaptées aux enfants
- L'IA ne fait jamais le travail à la place de l'enfant
- Pas de contenu violent ou inapproprié

---

## Performance

### Optimisations

- **TTS** : Nettoyage emojis avant synthèse, rate réduit
- **Highlights** : Auto-stop après 6s, cleanup animations
- **Chat** : Historique limité à 10 messages
- **Portal** : Menus et chat Timeline rendus via Portal

### Points d'attention

- **BookMode.tsx** : Fichier volumineux (~7000 lignes)
- **Safari** : Fix spécifique pour `aspect-ratio` + `flex`
- **SSR** : Web Speech API vérifié côté client uniquement
