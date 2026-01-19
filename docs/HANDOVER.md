# 📋 Handover - La Voix du Soir

> Document de passation complet pour la prochaine session de développement

**Date** : 19 janvier 2026  
**Version** : 5.1.0  
**État** : Production-Ready ✅

---

## 🎯 Vision Produit

> **Lire `docs/CONCEPT.md` pour la vision complète**

### Résumé

Application pour **enfants de 8 ans** permettant de créer des **livres-disques numériques 2.0** - inspirés des livres-disques d'antan (Marlène Jobert, Disney) mais augmentés avec IA et domotique.

**Cliente** : Commande spéciale avec budget non limité.

### Les 5 Modes

| Mode | Fonction | État |
|------|----------|------|
| ✍️ **Écriture** | Création du livre STATIQUE (texte, images, décos) | ✅ Complet |
| 🎨 **Studio** | Apprentissage progressif du prompting (Flux/Kling) | ✅ Complet |
| 🎬 **Montage** | Création du LIVRE-DISQUE (timeline, effets, sync) | ✅ Complet |
| 🎭 **Théâtre** | Lecteur immersif + export vidéo HD | ✅ Complet |
| 📖 **Publier** | Publication livre imprimé via Gelato + PDF | ✅ Complet |

### Flux Logique

```
📝 Écriture → 🎨 Studio → 🎬 Montage → 🎭 Théâtre
   (texte)    (assets)    (assemblage)  (lecture)
                              ↓
                         📖 Publier + Export MP4/PDF
```

---

## ✅ Ce qui est FAIT (Session 19 janvier - v5.1)

### 0. 🛡️ Modération IA du Contenu

L'IA-Amie (Gemini) vérifie automatiquement que le contenu entré par l'enfant est approprié.

| Fonctionnalité | Description |
|----------------|-------------|
| **Modération intelligente** | L'IA comprend le contexte (pas juste une liste de mots) |
| **Debounce 1s** | Attend que l'enfant arrête d'écrire avant de vérifier |
| **Cache 5min** | Évite les appels répétés pour le même texte |
| **Fail-open** | Si erreur API, le contenu passe (ne bloque pas l'enfant) |

#### Critères de blocage

- Gros mots et insultes (même déguisés avec * ou chiffres)
- Violence graphique, armes
- Contenu sexuel ou nudité
- Drogue, alcool, tabac
- Discrimination ou haine
- Contenu effrayant pour jeunes enfants

#### Fichiers

```
src/app/api/ai/moderate/route.ts  # POST { text } → { appropriate: boolean }
src/components/studio/PromptBuilder.tsx  # Appel avec debounce
```

#### Impact sur le flux

Si contenu inapproprié :
1. ❌ Les sections suivantes (Style, Ambiance...) ne s'affichent pas
2. ❌ Le bouton "Générer" reste désactivé
3. 📝 L'enfant doit modifier son texte

### 1. 📚 Formation Pédagogique Étendue (Studio)

La progression pédagogique a été étendue pour une formation plus complète.

#### Niveaux et créations requises

| Niveau | Créations | Cumul | Boutons visibles |
|--------|-----------|-------|------------------|
| 1 (Découverte) | 5 | 5 | Style, Ambiance, Détails, Format |
| 2 (Exploration) | 8 | 13 | Style, Ambiance, Détails, Format |
| 3 (Maîtrise) | 10 | 23 | Style, Ambiance, Détails, Format |
| 4 (Enrichissement) | 12 | 35 | ❌ Style/Ambiance, Détails, Format |
| 5 (Expert) | ∞ | - | ❌ Tout dans le texte (sauf Format) |

#### Validation au niveau 4+

L'enfant doit inclure dans son texte :
- **Niveau 4** : style + ambiance (détectés par mots-clés)
- **Niveau 5** : style + ambiance + détails

#### Aide IA progressive

Après 3 blocages consécutifs, l'IA-Amie donne des exemples plus explicites.

### 2. 🖼️ Format et Résolution Images

#### Format d'image

| Format | Ratio | Usage |
|--------|-------|-------|
| Portrait | 3:4 | Pages de livre (défaut) |
| Paysage | 16:9 | Vidéo, double pages |
| Carré | 1:1 | Médaillons, vignettes |

Le format est **toujours visible** pour les images (tous niveaux).

#### Upscaling automatique

Toutes les images sont automatiquement upscalées pour l'impression :
- **Résolution cible** : 1748×2480 px minimum (300 DPI pour A5)
- **Modèle** : Real-ESRGAN x2 via fal.ai
- **Images importées** : Upscalées si sous le seuil

```
src/app/api/ai/image/upscale/route.ts  # POST { imageUrl } → { upscaledImageUrl }
src/lib/ai/fal.ts  # upscaleImageForPrint()
```

---

## ✅ Ce qui était FAIT (Session 18 janvier - v5.0)

### 1. 🔄 Migration fal.ai (API Unifiée)

Tous les services IA passent maintenant par **fal.ai** :

| Service | Ancien | Nouveau (fal.ai) |
|---------|--------|------------------|
| **Images** | Midjourney (ImagineAPI) | Flux 1 Pro |
| **Vidéos** | Runway/Luma | Kling 2.1 |
| **Voix IA** | ElevenLabs direct | ElevenLabs via fal.ai |
| **Transcription** | AssemblyAI | AssemblyAI (conservé) |

**Fichier central** : `src/lib/ai/fal.ts`

### 2. 🎤 Chat IA dans Montage

#### Vue Cartes
- Chat IA intégré (panneau latéral)
- TTS activé par défaut
- Reconnaissance vocale (micro)
- Guidage visuel (highlights)

#### Vue Timeline
- Bouton d'aide IA flottant
- Panneau chat **draggable** (déplaçable)
- Visible même en plein écran (z-index 10001)
- Explications détaillées des rubans

### 3. 🎙️ Narration IA (ElevenLabs via fal.ai)

| Fonctionnalité | Description |
|----------------|-------------|
| **21 voix** | 7 par langue (FR, EN, RU) |
| **Timestamps** | Synchronisation mot par mot |
| **Timeline** | Phrases manipulables comme voix enregistrées |
| **Sélecteur** | Modal avec aperçu audio |

#### IDs des voix ElevenLabs

**🇫🇷 Français :**
| ID | Description |
|----|-------------|
| `kwhMCf63M8O3rCfnQ3oQ` | Femme française (narratrice) |
| `FvmvwvObRqIHojkEGh5N` | Jeune française |
| `1wg2wOjdEWKA7yQD8Kca` | Homme français âgé |
| `5Qfm4RqcAer0xoyWtoHC` | Jeune garçon français |
| `M9RTtrzRACmbUzsEMq8p` | Grand-mère française |

**🇬🇧 Anglais (UK) :**
| ID | Description |
|----|-------------|
| `RILOU7YmBhvwJGDGjNmP` | Femme britannique (narratrice) |
| `G17SuINrv2H9FC6nvetn` | Homme britannique |
| `rCmVtv8cYU60uhlsOo1M` | Jeune fille britannique |
| `kkPJzQOWz2Oz9cUaEaQd` | Vieille femme britannique |
| `ttNi9wVM8M97tsxE7PFZ` | Méchant britannique |
| `0lp4RIz96WD1RUtvEu3Q` | Grand-père anglais |

**🇷🇺 Russe :**
| ID | Description |
|----|-------------|
| `GN4wbsbejSnGSa1AzjH5` | Femme russe (narratrice) |
| `EDpEYNf6XIeKYRzYcx4I` | Jeune femme russe |
| `re2r5d74PqDzicySNW0I` | Homme russe |
| `wAGzRVkxKEs8La0lmdrE` | Homme russe intrigant |

#### Architecture Narration

```
┌─────────────────────────────────────────────────────────────┐
│  FLUX NARRATION IA                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Clic "IA raconte" dans MontageEditor                   │
│     └─→ Ouvre NarrationVoiceSelectorModal                  │
│                                                             │
│  2. Sélection voix ElevenLabs                              │
│     └─→ Aperçu audio disponible                            │
│                                                             │
│  3. POST /api/ai/voice/narration                           │
│     ├─→ Récupère texte de la scène                         │
│     ├─→ getApiKeyForRequest('fal')                         │
│     └─→ fal.ai → ElevenLabs TTS avec timestamps            │
│                                                             │
│  4. Réponse :                                               │
│     {                                                       │
│       audioUrl: "https://...",                             │
│       duration: 12.5,                                       │
│       wordTimings: [                                        │
│         { word: "Il", start: 0.0, end: 0.15 },             │
│         { word: "était", start: 0.15, end: 0.4 },          │
│         ...                                                 │
│       ]                                                     │
│     }                                                       │
│                                                             │
│  5. Création PhraseTiming[] depuis wordTimings              │
│     └─→ Groupement par phrase (ponctuation)                │
│                                                             │
│  6. Stockage dans useMontageStore                          │
│     ├─→ narrationAudio: audioUrl                           │
│     └─→ phraseTimings: PhraseTiming[]                      │
│                                                             │
│  7. Affichage sur Timeline                                  │
│     └─→ Phrases draggables (même UX que voix enregistrée)  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Fichiers concernés

```
src/lib/ai/
├── fal.ts                      # generateFalElevenLabsVoice()
└── elevenlabs.ts               # FRENCH_VOICES, ENGLISH_VOICES, RUSSIAN_VOICES

src/app/api/ai/voice/
└── narration/route.ts          # POST avec timestamps

src/components/montage/
├── MontageEditor.tsx           # handleGenerateNarration()
└── ...

src/components/ui/
└── NarrationVoiceSelector.tsx  # Sélecteur avec preview
```

### 4. ✨ Système de Guidage IA (Highlights)

```typescript
// L'IA peut guider visuellement
"Clique sur le bouton qui clignote ! [HIGHLIGHT:book-add-image]"
→ Le bouton brille pendant 6 secondes
```

**Éléments highlightables :**
- Mode Écriture : `book-text-color`, `book-add-image`, `book-decorations`, etc.
- Mode Montage : `montage-record-voice`, `montage-view-timeline`, etc.
- Timeline : `montage-timeline-structure`, `montage-timeline-media`, etc.

**Fix appliqué :** Animations s'arrêtent correctement après 6 secondes.

### 5. 🎙️ Harmonisation Assistant Vocal

| Aspect | Comportement |
|--------|--------------|
| **Défaut** | Activé au démarrage |
| **Voix** | Priorité Google (web) / Audrey (macOS) |
| **Vitesse** | Réduite (0.92) pour enfants |
| **Sync** | Paramètres partagés entre modes |

### 6. 👋 Séquence d'Accueil Complète

```
1. Prénom enfant → "Comment tu t'appelles ?"
2. Nom de l'IA → "Je suis ton amie magique, comment veux-tu m'appeler ?"
3. Voix de l'IA → "Quelle voix tu préfères ?" (voix premium du navigateur)
```

Si changement de navigateur → Redemander la voix (pas le nom).

### 7. 🔑 Gestion Centralisée des Clés API

| Clé | Variable env | Supabase |
|-----|-------------|----------|
| fal.ai | `FAL_API_KEY` | `fal_key` |
| Gemini | `GOOGLE_GEMINI_API_KEY` | `gemini_key` |
| AssemblyAI | `ASSEMBLYAI_API_KEY` | `assemblyai_key` |

**Architecture :**
```
API Route → getApiKeyForRequest('fal')
         → 1. Clé famille Supabase
         → 2. Fallback: process.env
```

### 8. 🐛 Corrections

| Bug | Fix |
|-----|-----|
| Safari double-page | Remplacement `aspect-ratio` par `calc()` |
| Highlights infinis | Suppression `AnimatePresence` + conditional render |
| TTS non dispo (Chrome) | Vérification côté client (pas SSR) |
| Voix trop rapide | Rate réduit à 0.92 |
| IA parle du "jeu de rythme" | Prompt mis à jour (sync automatique) |

---

## 📁 Structure des Fichiers Clés

### Services IA

```
src/lib/ai/
├── fal.ts              # Service unifié fal.ai ✨ NOUVEAU
├── gemini.ts           # Chat IA (prompts par mode)
├── elevenlabs.ts       # Voix (IDs, helpers) - via fal.ai
├── midjourney.ts       # (Legacy - via fal.ai maintenant)
└── video.ts            # (Legacy - via fal.ai maintenant)
```

### Configuration

```
src/lib/config/
├── api-keys.ts         # Client-side helpers
└── server-config.ts    # getApiKeyForRequest() ✨ MIS À JOUR
```

### Stores

```
src/store/
├── useAppStore.ts            # + userName, aiName, aiVoiceId
├── useHighlightStore.ts      # Guidage visuel IA ✨ MIS À JOUR
├── useAdminStore.ts          # + fal_key, assemblyai_key
└── ...
```

### Composants Montage

```
src/components/montage/
├── MontageEditor.tsx         # + MontageAIChat, TimelineAIHelp
├── MontageAIChat.tsx         # Chat IA vue Cartes ✨ NOUVEAU
└── ...

src/components/ui/
├── Highlightable.tsx         # Wrapper guidage IA ✨ MIS À JOUR
├── AIWelcomeSequence.tsx     # Séquence d'accueil ✨ MIS À JOUR
└── NarrationVoiceSelector.tsx # Sélecteur voix ElevenLabs
```

### API Routes

```
src/app/api/ai/
├── chat/route.ts             # + userName, context: montage
├── image/
│   ├── route.ts              # → fal.ai Flux 1 Pro + upscale auto
│   └── upscale/route.ts      # → fal.ai Real-ESRGAN ✨ NOUVEAU
├── video/route.ts            # → fal.ai Kling 2.1
├── voice/
│   ├── route.ts              # → fal.ai ElevenLabs
│   └── narration/route.ts    # + timestamps AssemblyAI
├── moderate/route.ts         # → Gemini (modération contenu) ✨ NOUVEAU
└── transcribe/route.ts       # AssemblyAI (conservé)
```

### Migrations SQL

```
supabase/migrations/
├── add_assemblyai_key.sql    # Ajout colonne assemblyai_key
└── migrate_to_fal_ai.sql     # fal_key + suppression anciennes clés
```

---

## 🔧 Configuration

### Variables d'environnement (`.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# fal.ai (images, vidéos, voix IA) ✨ NOUVEAU
FAL_API_KEY=xxx

# Google AI (chat)
GOOGLE_GEMINI_API_KEY=xxx

# AssemblyAI (transcription)
ASSEMBLYAI_API_KEY=xxx

# Gelato (publication)
GELATO_API_KEY=xxx
GELATO_TEST_MODE=true

# Cloudflare R2 (vidéos)
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=lavoixdusoir-videos
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxx.r2.dev

# Mux (export vidéo)
MUX_TOKEN_ID=xxx
MUX_TOKEN_SECRET=xxx
```

> ⚠️ **Clés dépréciées** : `ELEVENLABS_API_KEY`, `RUNWAY_API_KEY`, `LUMA_API_KEY`, `IMAGINEAPI_API_KEY` ne sont plus utilisées. Tout passe par `FAL_API_KEY`.

---

## 🚀 Pour Démarrer

```bash
# Installer
npm install

# Dev (web)
npm run dev
# → http://localhost:3000

# Dev Electron
npm run dev:electron
```

### Appliquer les migrations

```sql
-- Dans Supabase SQL Editor

-- 1. Ajouter fal_key
ALTER TABLE family_config ADD COLUMN IF NOT EXISTS fal_key TEXT;

-- 2. Ajouter assemblyai_key
ALTER TABLE family_config ADD COLUMN IF NOT EXISTS assemblyai_key TEXT;

-- 3. (Optionnel) Supprimer anciennes colonnes
ALTER TABLE family_config DROP COLUMN IF EXISTS elevenlabs_key;
ALTER TABLE family_config DROP COLUMN IF EXISTS runway_key;
ALTER TABLE family_config DROP COLUMN IF EXISTS midjourney_key;
```

---

## 📊 Récapitulatif de l'État

| Composant | État | Notes |
|-----------|------|-------|
| Mode Écriture | ✅ | + guidage IA visuel |
| Mode Studio | ✅ | → fal.ai (Flux 1 Pro, Kling 2.1) |
| Mode Montage | ✅ | + chat IA (Cards + Timeline) |
| Mode Théâtre | ✅ | Lecture + export MP4 |
| Mode Publier | ✅ | Gelato + PDF |
| **IA unifiée (fal.ai)** | ✅ | Images, vidéos, voix ElevenLabs |
| **Chat IA Montage** | ✅ | Vue Cartes + Timeline |
| **Narration timestamps** | ✅ | ElevenLabs word-level |
| **Guidage visuel IA** | ✅ | Highlights 6s auto-stop |
| **Séquence accueil** | ✅ | Prénom + nom IA + voix |
| **TTS adapté enfants** | ✅ | Vitesse 0.92, voix prioritaires |
| **Clés API centralisées** | ✅ | fal.ai + Gemini + AssemblyAI |
| **Modération IA** | ✅ | Gemini vérifie contenu enfants |
| **Formation étendue** | ✅ | 35 créations → niveau Expert |
| **Upscaling auto** | ✅ | 300 DPI pour impression |
| **Format images** | ✅ | Portrait/Paysage/Carré |
| Sync Supabase | ✅ | Histoires, montages, progression |
| Assets cloud | ✅ | Supabase + R2 |
| Admin multi-famille | ✅ | Super Admin + Parent |
| Bibliothèque sons | ✅ | 98 fichiers |
| Sécurité Electron | ✅ | Shell injection fixé |
| Responsive iPad | ✅ | Adaptatif |

---

## 🔮 Prochaines Évolutions Possibles

### Avec fal.ai

| Fonctionnalité | Modèle | Effort | Impact |
|----------------|--------|--------|--------|
| **Lip-sync vidéo** | Sync Labs | Moyen | ⭐⭐⭐⭐⭐ |
| **Musique générée** | MusicGen | Faible | ⭐⭐⭐⭐ |
| **Effets sonores IA** | AudioLDM | Faible | ⭐⭐⭐ |
| **Coloriage dessins** | Flux ControlNet | Moyen | ⭐⭐⭐ |

> **Note** : Les voix de personnages fantaisistes (dragon, sorcière...) ont été explorées mais présentaient des limitations (clonage ElevenLabs non disponible via fal.ai, qualité inconstante). Le système actuel utilise les 21 voix narrateur ElevenLabs préexistantes.

---

## 💡 Notes pour le Prochain Dev

1. **L'enfant cible a 8 ans** → Tout doit être simple et encourageant
2. **Budget illimité** → Pas d'hésitation sur les services payants
3. **Clés API dynamiques** → Utiliser `getApiKeyForRequest('fal')`
4. **Pas de nom IA hardcodé** → Le nom est choisi par l'enfant
5. **Highlights IA** → Utiliser `[HIGHLIGHT:id]` dans les réponses
6. **fal.ai unifié** → Tout passe par `src/lib/ai/fal.ts`
7. **AssemblyAI conservé** → Meilleure précision que Whisper pour timestamps
8. **Vitesse TTS** → 0.92 pour FR/EN, 0.90 pour RU

---

## 📚 Documentation

| Fichier | Contenu |
|---------|---------|
| `docs/CONCEPT.md` | Vision produit |
| `docs/ARCHITECTURE.md` | Architecture technique |
| `docs/QUICK_START.md` | Guide de démarrage |
| `docs/API.md` | Documentation API |
| `docs/HANDOVER.md` | Ce document |
| `README.md` | Documentation générale |

---

**Bon courage pour la suite !** 🌙✨
