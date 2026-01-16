# 📡 Documentation API

## Endpoints

### Chat avec Luna

**POST** `/api/ai/chat`

Dialogue avec l'IA-Amie Luna. Intègre le système pédagogique pour adapter les réponses.

#### Request

```json
{
  "message": "Je veux écrire une histoire de princesse",
  "context": "book",
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
| `context` | string | `diary`, `book`, `studio`, `general` |
| `chatHistory` | array | Historique (max 10 messages) |
| `promptingProgress` | object | Progression pédagogique |

#### Response

```json
{
  "text": "Une princesse ! C'est un super début ! ✨ Elle s'appelle comment ta princesse ?",
  "sentiment": "positive",
  "suggestions": ["Décris sa robe", "Où habite-t-elle ?"],
  "tokensUsed": 45,
  "xpEarned": 15,
  "levelUp": null
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `text` | string | Réponse de Luna |
| `sentiment` | string | `positive`, `neutral`, `negative` |
| `suggestions` | array | Suggestions contextuelles |
| `xpEarned` | number | XP gagné (0, 5, 15, ou 30) |
| `levelUp` | object\|null | Si passage de niveau |

---

### Génération d'image

**POST** `/api/ai/image`

Lance une génération d'image (Midjourney).

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
  "status": "pending",
  "prompt": "A magical castle in the clouds, cartoon style..."
}
```

---

**GET** `/api/ai/image?jobId=abc123`

Vérifie le statut.

```json
{
  "id": "abc123",
  "status": "completed",
  "progress": 100,
  "imageUrl": "https://...",
  "thumbnailUrl": "https://..."
}
```

---

### Génération de voix

**POST** `/api/ai/voice`

Génère de l'audio (ElevenLabs).

```json
{
  "text": "Il était une fois...",
  "type": "narration",
  "voiceType": "narrator"
}
```

---

## Système Pédagogique

### Contextes

| Context | Comportement Luna |
|---------|-------------------|
| `diary` | Écoute, encourage, pose des questions sur les émotions |
| `book` | Guide avec les 5 Questions Magiques (Qui, Quoi, Où, Quand, Et alors) |
| `studio` | Enseigne les 5 Clés Magiques pour les images |
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

## Speech APIs (côté client)

### TTS (Text-to-Speech)

#### Electron (macOS natif)

```typescript
window.electronAPI.tts.speak("Bonjour !", "fr")
window.electronAPI.tts.stop()
```

#### Web (Web Speech API)

```typescript
const utterance = new SpeechSynthesisUtterance("Bonjour !")
utterance.lang = "fr-FR"
utterance.rate = 1.15
speechSynthesis.speak(utterance)
```

### STT (Speech-to-Text)

```typescript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const recognition = new SpeechRecognition()

recognition.lang = 'fr-FR'
recognition.continuous = true
recognition.interimResults = true

recognition.onresult = (event) => {
  const transcript = event.results[event.resultIndex][0].transcript
  // Utiliser le texte reconnu
}

recognition.start()  // Démarrer l'écoute
recognition.stop()   // Arrêter l'écoute
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

### BackgroundMedia

```typescript
interface BackgroundMedia {
  type: 'image' | 'video'
  url: string
  opacity: number   // 0-100
  x: number         // Position X en %
  y: number         // Position Y en %
  scale: number     // 0.1-3.0
}
```

### PageDecoration

```typescript
interface PageDecoration {
  id: string
  decorationId: string   // Référence vers PREMIUM_DECORATIONS
  position: {
    x: number            // Position X en %
    y: number            // Position Y en %
  }
  scale: number          // 0.2-3.0
  rotation: number       // -180 à 180
  color?: string         // Couleur override
  opacity: number        // 0.2-1.0
  flipH?: boolean        // Miroir horizontal
  flipV?: boolean        // Miroir vertical
  glowEnabled?: boolean  // Effet luminosité
  glowColor?: string     // Couleur du halo
  glowIntensity?: number // Intensité 10-100
}
```

### DecorationType

```typescript
interface DecorationType {
  id: string
  name: string
  category: 'gold' | 'floral' | 'royal' | 'celestial' | 'artistic' | 'frames'
  svg: string           // Code SVG inline
  defaultColor: string  // Couleur par défaut
}
```

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
| ElevenLabs | 10k chars/mois (free) |
| Midjourney | Variable |
| Web Speech API | Illimité (local) |

---

## Exemples cURL

### Chat (mode écriture)

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Luna, aide-moi à continuer mon histoire",
    "context": "book",
    "chatHistory": []
  }'
```

### Image

```bash
curl -X POST http://localhost:3000/api/ai/image \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Un dragon gentil style cartoon",
    "style": "cartoon",
    "ambiance": "jour"
  }'
```

---

## Notes Techniques

### Décorations Premium

Les décorations sont gérées **entièrement côté client** :
- Stockées dans le state Zustand
- Persistées dans localStorage
- Pas d'appel API nécessaire
- Les SVG sont inline dans le code

### Fond de Page

Les fonds de page (images/vidéos) sont également gérés **côté client** :
- Images via `URL.createObjectURL()` ou URLs externes
- Vidéos en lecture automatique, muette, en boucle
- Contrôles d'opacité et zoom en temps réel

### Effet Glow

L'effet de luminosité utilise CSS `filter: drop-shadow()` :

```css
filter: drop-shadow(0 0 5px #D4AF37) drop-shadow(0 0 10px #D4AF37);
```

L'intensité contrôle le rayon de l'ombre (blur radius).
