# 📋 Handover - La Voix du Soir

> Document de passation complet pour la prochaine session de développement

**Date** : 18 janvier 2026  
**Version** : 5.0.0  
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

## ✅ Ce qui est FAIT (Session 18 janvier - v5.0)

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

### 3. 🎙️ Narration IA (ElevenLabs)

| Fonctionnalité | Description |
|----------------|-------------|
| **21 voix** | 7 par langue (FR, EN, RU) |
| **Timestamps** | Synchronisation mot par mot |
| **Timeline** | Phrases manipulables comme voix enregistrées |
| **Sélecteur** | Modal avec aperçu audio |

**Voix françaises :**
- `kwhMCf63M8O3rCfnQ3oQ` - Femme française
- `FvmvwvObRqIHojkEGh5N` - Jeune française
- `1wg2wOjdEWKA7yQD8Kca` - Homme âgé
- `5Qfm4RqcAer0xoyWtoHC` - Jeune garçon
- `M9RTtrzRACmbUzsEMq8p` - Grand-mère

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
├── image/route.ts            # → fal.ai Flux 1 Pro
├── video/route.ts            # → fal.ai Kling 2.1
├── voice/
│   ├── route.ts              # → fal.ai ElevenLabs
│   └── narration/route.ts    # + timestamps ✨ NOUVEAU
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
| **Voix de personnages** | ElevenLabs Voice Design | Moyen | ⭐⭐⭐⭐⭐ |
| **Lip-sync vidéo** | Sync Labs | Moyen | ⭐⭐⭐⭐⭐ |
| **Musique générée** | MusicGen | Faible | ⭐⭐⭐⭐ |
| **Effets sonores IA** | AudioLDM | Faible | ⭐⭐⭐ |
| **Coloriage dessins** | Flux ControlNet | Moyen | ⭐⭐⭐ |

### Voix de Personnages (Recommandé)

L'enfant pourrait assigner une voix différente par phrase :
- Presets : Sorcière, Dragon, Princesse, Robot...
- Création libre via Patrick (Voice Design)
- Stockage dans `phraseTimings[].voiceType`

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
