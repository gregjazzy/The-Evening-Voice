# 📡 Documentation API

## Endpoints

### Chat avec l'IA-Amie

**POST** `/api/ai/chat`

Dialogue avec l'IA-Amie (nom choisi par l'enfant). Intègre le système pédagogique pour adapter les réponses.

#### Request

```json
{
  "message": "Je veux écrire une histoire de princesse",
  "context": "book",
  "userName": "Emma",
  "chatHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "promptingProgress": {
    "level": "apprenti",
    "xp": 75,
    "magicKeysMastery": { "style": 2, "hero": 3, "mood": 1, "world": 0, "magic": 0 }
  }
}
```

| Param | Type | Description |
|-------|------|-------------|
| `message` | string | Message de l'utilisateur |
| `context` | string | `diary`, `book`, `studio`, `montage`, `general` |
| `userName` | string | Prénom de l'enfant (pour personnalisation) |
| `chatHistory` | array | Historique (max 10 messages) |
| `promptingProgress` | object | Progression pédagogique |

#### Response

```json
{
  "text": "Une princesse ! C'est un super début ! ✨ Elle s'appelle comment ta princesse ?",
  "sentiment": "positive",
  "suggestions": ["Décris sa robe", "Où habite-t-elle ?"],
  "highlights": ["book-add-image"],
  "tokensUsed": 45,
  "xpEarned": 15,
  "levelUp": null
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `text` | string | Réponse de l'IA |
| `sentiment` | string | `positive`, `neutral`, `negative` |
| `suggestions` | array | Suggestions contextuelles |
| `highlights` | array | IDs d'éléments UI à mettre en évidence |
| `xpEarned` | number | XP gagné (0, 5, 15, ou 30) |
| `levelUp` | object\|null | Si passage de niveau |

---

### Génération d'image (fal.ai - Flux 1 Pro)

**POST** `/api/ai/image`

Génère une image via fal.ai (Flux 1 Pro).

#### Request

```json
{
  "description": "Un château magique dans les nuages",
  "style": "cartoon",
  "ambiance": "feerique",
  "aspectRatio": "16:9"
}
```

#### Response

```json
{
  "jobId": "abc123",
  "status": "completed",
  "imageUrl": "https://fal.media/files/xxx.png"
}
```

---

### Génération de vidéo (fal.ai - Kling 2.1)

**POST** `/api/ai/video`

Génère une vidéo via fal.ai (Kling 2.1).

#### Request

```json
{
  "prompt": "Un château qui flotte dans les nuages",
  "imageUrl": "https://...",
  "duration": 5,
  "aspectRatio": "16:9"
}
```

#### Response

```json
{
  "jobId": "xyz789",
  "status": "processing"
}
```

**GET** `/api/ai/video?jobId=xyz789`

```json
{
  "id": "xyz789",
  "status": "completed",
  "videoUrl": "https://..."
}
```

---

### Génération de voix (fal.ai - ElevenLabs)

**POST** `/api/ai/voice`

Génère de l'audio via fal.ai (ElevenLabs).

```json
{
  "text": "Il était une fois...",
  "voiceId": "kwhMCf63M8O3rCfnQ3oQ",
  "language": "fr"
}
```

#### Response

```json
{
  "audioUrl": "https://...",
  "duration": 3.5
}
```

---

### Narration avec Timestamps (fal.ai - ElevenLabs)

**POST** `/api/ai/voice/narration`

Génère une narration avec timestamps par mot pour synchronisation Timeline.

#### Request

```json
{
  "text": "Il était une fois, dans une forêt enchantée.",
  "voiceId": "kwhMCf63M8O3rCfnQ3oQ",
  "language": "fr"
}
```

#### Response

```json
{
  "audioUrl": "https://...",
  "duration": 4.2,
  "wordTimings": [
    { "word": "Il", "start": 0.0, "end": 0.15 },
    { "word": "était", "start": 0.15, "end": 0.4 },
    { "word": "une", "start": 0.4, "end": 0.55 },
    { "word": "fois", "start": 0.55, "end": 0.8 }
  ]
}
```

---

### Modération de Contenu (Gemini)

**POST** `/api/ai/moderate`

Vérifie si le contenu est approprié pour un enfant de 4-10 ans via l'IA.

#### Request

```json
{
  "text": "Un dragon gentil qui mange des bonbons"
}
```

#### Response

```json
{
  "appropriate": true
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `appropriate` | boolean | `true` si contenu OK pour enfants |

#### Critères de blocage

- Gros mots et insultes (même déguisés)
- Violence graphique, armes
- Contenu sexuel ou nudité
- Drogue, alcool, tabac
- Discrimination ou haine
- Contenu effrayant pour jeunes enfants

> **Note** : Cache de 5 minutes pour éviter les appels répétés. Fail-open en cas d'erreur API.

---

### Upscaling Image (fal.ai - Real-ESRGAN)

**POST** `/api/ai/image/upscale`

Upscale une image pour l'impression (300 DPI A5 minimum).

#### Request

```json
{
  "imageUrl": "https://..."
}
```

#### Response

```json
{
  "status": "completed",
  "upscaledImageUrl": "https://...",
  "width": 3496,
  "height": 4960,
  "upscaled": true
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `upscaledImageUrl` | string | URL de l'image upscalée |
| `width` | number | Largeur en pixels |
| `height` | number | Hauteur en pixels |
| `upscaled` | boolean | `false` si déjà haute résolution |

---

### Transcription Audio (AssemblyAI)

**POST** `/api/ai/transcribe`

Transcrit un fichier audio avec timestamps par mot.

#### Request

```
Content-Type: multipart/form-data

file: [audio blob]
```

#### Response

```json
{
  "text": "Il était une fois dans une forêt enchantée",
  "words": [
    { "text": "Il", "start": 0, "end": 150 },
    { "text": "était", "start": 150, "end": 400 }
  ],
  "duration": 4200
}
```

---

## Services IA Unifiés (fal.ai)

| Service | Modèle fal.ai | Usage |
|---------|--------------|-------|
| **Images** | Flux 1 Pro | Génération d'illustrations |
| **Vidéos** | Kling 2.1 | Animation d'images |
| **Voix IA** | ElevenLabs | Narration, voix personnages |
| **Transcription** | AssemblyAI* | Synchronisation voix enregistrées |

> *AssemblyAI est utilisé directement (pas via fal.ai) pour une meilleure précision des timestamps.

---

## Système Pédagogique

### Contextes

| Context | Comportement IA |
|---------|-----------------|
| `diary` | Écoute, encourage, pose des questions sur les émotions |
| `book` | Guide avec les 5 Questions Magiques (Qui, Quoi, Où, Quand, Et alors) |
| `studio` | Enseigne les 5 Clés Magiques pour les images |
| `montage` | Guide dans la création du livre-disque (voix, timeline, effets) |
| `general` | Conversation libre |

### Calcul XP

```
basic    (< 10 mots, < 2 clés)     →  +5 XP
good     (10-20 mots, 2-3 clés)    → +15 XP
excellent (> 20 mots, 4+ clés)     → +30 XP
```

### Niveaux

| Niveau | XP requis |
|--------|-----------|
| explorer | 0 |
| apprenti | 50 |
| artiste | 150 |
| magicien | 300 |
| maitre | 500 |

---

## Guidage Visuel IA (Highlights)

L'IA peut faire clignoter des éléments UI pour guider l'enfant.

### Syntaxe dans les réponses IA

```
"Clique sur le bouton qui clignote ! [HIGHLIGHT:book-add-image]"
```

### IDs disponibles

#### Mode Écriture
- `book-text-color`, `book-lines`, `book-add-image`, `book-decorations`
- `book-font-family`, `book-font-size`, `book-bold`, `book-italic`, `book-text-align`

#### Mode Studio
- `studio-create-image`, `studio-create-video`, `studio-library`

#### Mode Montage
- `montage-record-voice`, `montage-view-cards`, `montage-view-timeline`
- `montage-timeline-structure`, `montage-timeline-media`, `montage-timeline-music`
- `montage-timeline-sound`, `montage-timeline-lights`, `montage-timeline-decoration`
- `montage-timeline-animation`, `montage-timeline-effects`

#### Navigation
- `nav-book`, `nav-studio`, `nav-montage`, `nav-theater`, `nav-publish`

---

## Speech APIs (côté client)

### TTS (Text-to-Speech)

#### Hook useTTS

```typescript
const { speak, stop, isSpeaking, isTTSAvailable, voices } = useTTS('fr')

// Parler
speak("Bonjour !")

// Arrêter
stop()
```

#### Voix prioritaires par environnement

| Environnement | Français | Anglais | Russe |
|---------------|----------|---------|-------|
| **Chrome/Safari** | Google français | Google US English | Google русский |
| **Electron/macOS** | Audrey Premium | Samantha | Milena |

#### Vitesse adaptée aux enfants

| Langue | Rate |
|--------|------|
| Français | 0.92 |
| Anglais | 0.92 |
| Russe | 0.90 |

### STT (Speech-to-Text)

```typescript
const { isListening, transcript, startListening, stopListening } = useSpeechRecognition(locale)

// Démarrer l'écoute
startListening()

// Arrêter
stopListening()
```

---

## Structures de Données Client

### StoryPage (Zustand Store)

```typescript
interface StoryPage {
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
  backgroundMedia?: BackgroundMedia
  decorations?: PageDecoration[]
  order: number
  chapterId?: string
  title?: string
}
```

### PhraseTiming (Timeline)

```typescript
interface PhraseTiming {
  id: string
  text: string
  index: number
  timeRange: TimeRange
  audioTimeRange?: TimeRange
  style?: PhraseStyle
  volume?: number
}

interface PhraseStyle {
  position: 'top' | 'center' | 'bottom' | 'custom'
  customPosition?: { x: number; y: number }
  fontSize: 'small' | 'medium' | 'large' | 'xlarge'
  color: string
  backgroundColor?: string
  animation?: 'fade' | 'slide' | 'zoom' | 'typewriter'
}
```

---

## Gestion des Clés API

### Architecture

```
┌─────────────────────────────────────────────────┐
│              API Route                          │
├─────────────────────────────────────────────────┤
│  1. getApiKeyForRequest('fal')                  │
│     ↓                                           │
│  2. Cherche clé famille dans Supabase           │
│     ↓                                           │
│  3. Fallback: process.env.FAL_API_KEY           │
└─────────────────────────────────────────────────┘
```

### Clés supportées

| Service | Variable env | Colonne Supabase |
|---------|-------------|------------------|
| **fal.ai** | `FAL_API_KEY` | `fal_key` |
| **Gemini** | `GOOGLE_GEMINI_API_KEY` | `gemini_key` |
| **AssemblyAI** | `ASSEMBLYAI_API_KEY` | `assemblyai_key` |

---

## Codes d'erreur

| Code | Description |
|------|-------------|
| 400 | Paramètres manquants ou invalides |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 429 | Rate limit atteint |
| 500 | Erreur serveur |

---

## Rate Limits

| Service | Limite |
|---------|--------|
| Gemini | 60 req/min |
| fal.ai | Variable selon plan |
| AssemblyAI | 5 req/min (free) |
| Web Speech API | Illimité (local) |

---

## Exemples cURL

### Chat (mode écriture)

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Aide-moi à continuer mon histoire",
    "context": "book",
    "userName": "Emma",
    "chatHistory": []
  }'
```

### Image (fal.ai)

```bash
curl -X POST http://localhost:3000/api/ai/image \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Un dragon gentil style cartoon",
    "style": "cartoon",
    "ambiance": "jour"
  }'
```

### Narration avec timestamps

```bash
curl -X POST http://localhost:3000/api/ai/voice/narration \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Il était une fois une princesse.",
    "voiceId": "kwhMCf63M8O3rCfnQ3oQ",
    "language": "fr"
  }'
```
