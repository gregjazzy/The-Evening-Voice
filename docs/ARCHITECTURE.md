# 🏗️ Architecture Technique - La Voix du Soir

> Documentation technique complète de l'application (v5.4.0)

---

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                       │
│              Next.js 14 (Web/iPad) + Electron (Desktop)                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Écriture │  │  Studio  │  │  Défis   │  │ Montage  │  │ Théâtre  │  │
│  │  ✍️      │  │  🎨      │  │  🏆      │  │  📐      │  │  🎭      │  │
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
│   Supabase    │   │    fal.ai     │   │    Gemini     │   │   Electron    │
│   (Database)  │   │  (AI Unified) │   │   (Chat+Vision)│   │   (Desktop)   │
├───────────────┤   ├───────────────┤   ├───────────────┤   ├───────────────┤
│ - Auth        │   │ - Nano Banana │   │ - Chat IA     │   │ - TTS macOS   │
│ - Profiles    │   │ - Kling 2.1   │   │ - Analyse img │   │ - Screen      │
│ - Stories     │   │ - ElevenLabs  │   │ - Modération  │   │ - Control     │
│ - Storage     │   │ - Real-ESRGAN │   │               │   │               │
└───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘
```

---

## Les 6 Modes

| Mode | Composant | Description |
|------|-----------|-------------|
| ✍️ Écriture | `BookMode.tsx` | Création de livres (texte, images, décos) |
| 🎨 Studio | `StudioMode.tsx` | Apprentissage progressif du prompting |
| 🏆 Défis | `ChallengeMode.tsx` | Exercices pratiques de prompting |
| 🎬 Montage | `LayoutMode.tsx` | Timeline avec audio et effets |
| 🎭 Théâtre | `TheaterMode.tsx` | Lecteur immersif |
| 📖 Publier | `PublishMode.tsx` | Export PDF et impression Gelato |

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
| **Gemini** | Chat IA + Vision (analyse images) | Meilleur pour dialogue et analyse |
| **AssemblyAI** | Transcription voix | Timestamps plus précis que Whisper |

### Fichier unifié : `src/lib/ai/fal.ts`

```typescript
// Génération d'images
export async function generateFalImage(prompt: string, apiKey?: string)

// Génération de vidéos
export async function generateFalVideo(imageUrl: string, prompt: string, apiKey?: string)

// Voix ElevenLabs avec timestamps
export async function generateFalElevenLabsVoice(text: string, voiceId: string, apiKey?: string)

// Upscale pour impression
export async function upscaleImageForPrint(options: { imageUrl: string, scale?: number })
```

---

## Mode Défis (Challenge Mode)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   CHALLENGE MODE                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ Challenge Cards  │  │  User Workspace  │                 │
│  │ (12 défis)       │  │  (génération)    │                 │
│  └────────┬─────────┘  └────────┬─────────┘                 │
│           │                     │                            │
│           ▼                     ▼                            │
│  ┌──────────────────────────────────────────┐               │
│  │          Gemini Vision Analysis          │               │
│  │  /api/ai/challenge-analyze               │               │
│  │  - Compare images (target vs generated)  │               │
│  │  - Score 0-100                           │               │
│  │  - Strengths / Weaknesses / Advice       │               │
│  └──────────────────────────────────────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Types de Défis

| Type | Description | Objectif pédagogique |
|------|-------------|---------------------|
| **Reproduire** | Deviner le prompt d'une image | Comprendre la structure des prompts |
| **Variations** | Modifier une image selon consigne | Maîtriser les paramètres (style, ambiance...) |

### Stockage des Images

Les images de défis sont pré-générées et stockées dans Supabase :

```
images/challenges/
├── reproduce-rainbow/variant-1.png
├── reproduce-castle/variant-1.png
├── variation-dragon/variant-1.png
└── ...
```

### API Challenge Analyze

```typescript
// POST /api/ai/challenge-analyze
{
  targetImageUrl: string,      // Image originale
  generatedImageUrl: string,   // Image de l'enfant
  targetPrompt: string,        // Prompt original (anglais)
  userPrompt: string,          // Prompt de l'enfant
  originalPromptFr: string,    // Indice donné à l'enfant
  difficulty: string           // easy/medium/hard
}

// Réponse
{
  score: number,               // 0-100
  strengths: string[],         // Points forts
  weaknesses: string[],        // Axes d'amélioration
  advice: string               // Conseil personnalisé
}
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
   ⚠️ Message d'erreur visible si échec (v5.4.0)
```

---

## Modales d'Introduction

Chaque mode affiche une modale à la première visite pour expliquer son objectif.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                SYSTÈME DE MODALES INTRO                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  useHasVisitedMode(mode)                                    │
│  └── localStorage: mode_intro_seen_{mode}                   │
│                                                              │
│  ModeIntroModal                                             │
│  └── MODE_CONTENT[mode]                                     │
│      ├── title, subtitle, description                       │
│      ├── objectifs[] (3 par mode)                           │
│      ├── icon (Lucide)                                      │
│      └── gradient (Tailwind)                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Fichiers

```
src/hooks/useHasVisitedMode.ts        # Hook localStorage
src/components/ui/ModeIntroModal.tsx  # Composant modale
```

### Usage dans un mode

```typescript
import { useHasVisitedMode } from '@/hooks/useHasVisitedMode'
import { ModeIntroModal } from '@/components/ui/ModeIntroModal'

function MyMode() {
  const hasVisited = useHasVisitedMode('mymode')
  
  return (
    <>
      {/* Contenu du mode */}
      <ModeIntroModal 
        isOpen={!hasVisited} 
        onClose={() => {}} 
        mode="mymode" 
      />
    </>
  )
}
```

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

---

## Mode Montage

### Architecture

```
MontageEditor.tsx
├── VUE CARTES (SceneCard[])
│   ├── MontageAIChat              # Chat IA intégré
│   ├── SceneCard                  # Carte par scène
│   └── NarrationVoiceSelectorModal
│
└── VUE TIMELINE (TimelineRubans)
    ├── TimelineAIHelp             # Aide IA flottante
    └── Rubans
        ├── Structure (phrases)
        ├── Médias (images/vidéos)
        ├── Musique
        ├── Sons
        ├── Lumières (HomeKit)
        ├── Décorations
        ├── Animations
        └── Effets
```

---

## Mode Théâtre

### Synchronisation Temporelle

Le mode Théâtre filtre tous les éléments selon leur `timeRange` :

```typescript
// Filtrage des médias visibles
const visibleMedia = scene.mediaTracks.filter(media => {
  const start = media.timeRange?.start ?? 0
  const end = media.timeRange?.end ?? sceneDuration
  return currentTime >= start && currentTime < end
})

// Idem pour décorations, animations, etc.
```

---

## State Management (Zustand)

### Stores

```
src/store/
├── useAppStore.ts            # État global, histoires, préférences
├── useStudioStore.ts         # Kits de création, assets importés
├── useStudioProgressStore.ts # Progression pédagogique (niveaux 1-5)
├── useMontageStore.ts        # Projets montage (sync Supabase)
├── usePublishStore.ts        # Publication Gelato
├── useAuthStore.ts           # Authentification + user/profile
├── useHighlightStore.ts      # Guidage visuel IA
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

---

## API Routes

### Structure

```
src/app/api/
├── ai/
│   ├── chat/route.ts              # Chat Gemini
│   ├── image/route.ts             # → Nano Banana Pro
│   ├── video/route.ts             # → Kling 2.1
│   ├── moderate/route.ts          # Modération contenu
│   ├── upscale/route.ts           # Real-ESRGAN (300 DPI)
│   └── challenge-analyze/route.ts # Gemini Vision (défis)
├── upload/
│   ├── video/route.ts             # Upload vidéo R2
│   └── pdf/route.ts               # Upload PDF Supabase
├── gelato/
│   ├── quote/route.ts             # Devis impression
│   └── order/route.ts             # Commande impression
└── voice/
    └── narration/route.ts         # ElevenLabs TTS
```

---

## Sécurité

### Gestion des erreurs d'upload

Depuis v5.4.0, le bouton "Garder" dans le Studio :
- Vérifie que `user` existe avant l'upload
- Affiche un toast d'erreur visible si échec
- Ne ferme pas l'aperçu si l'upload échoue

```typescript
// Avant : échec silencieux
} catch (error) {
  console.error('Erreur sauvegarde:', error)
}
setGeneratedAsset(null) // Fermait toujours !

// Après : feedback utilisateur
if (!user) {
  showToast('Tu dois être connecté...', 'error')
  return
}
if (result) {
  showToast('Image sauvegardée !', 'success')
  setGeneratedAsset(null) // Ferme SEULEMENT si succès
} else {
  showToast('Erreur lors de la sauvegarde...', 'error')
}
```

### Clés API

- **Jamais exposées côté client**
- Stockées dans Supabase `family_config` (chiffrées)
- `.env.local` pour fallback admin (gitignored)
- Récupération via API routes (server-side)

---

## Performance

### Optimisations

- **Challenge Mode** : Images pré-générées dans Supabase (chargement instantané)
- **TTS** : Nettoyage emojis avant synthèse, rate réduit
- **Highlights** : Auto-stop après 6s, cleanup animations
- **Chat** : Historique limité à 10 messages
- **Portal** : Menus et modales rendus via Portal

### Points d'attention

- **BookMode.tsx** : Fichier volumineux (~7000 lignes)
- **Safari** : Fix spécifique pour `aspect-ratio` + `flex`
- **SSR** : Web Speech API vérifié côté client uniquement
- **Session Supabase** : Peut expirer, toujours vérifier avant upload
