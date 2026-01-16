# 📋 Handover - La Voix du Soir

> Document de passation complet pour la prochaine session de développement

**Date** : 16 janvier 2026  
**Version** : 3.3.0  
**État** : Studio Pédagogique ✅ + Voix configurées ✅

---

## 🎯 Vision Produit (IMPORTANT)

> **Lire `docs/CONCEPT.md` pour la vision complète**

### Résumé : C'est quoi l'app ?

Application pour **filles de 8 ans** permettant de créer des **livres-disques numériques 2.0** - inspirés des livres-disques d'antan (Marlène Jobert, Disney) mais augmentés avec IA et domotique.

**Cliente** : Multimilliardaire avec commande spéciale. Budget non limité.

### Les 5 Modes

| Mode | Fonction | État |
|------|----------|------|
| ✍️ **Écriture** | Création du livre STATIQUE (texte, images, décos) | ✅ Complet |
| 🎨 **Studio** | Apprentissage progressif du prompting (Midjourney/Runway) | ✅ Pédagogique |
| 🎬 **Montage** | Création du LIVRE-DISQUE (timeline, effets, sync) | ✅ Complet |
| 🎭 **Théâtre** | Lecteur immersif avec projection + lumières | ⚠️ Données non connectées |
| 📖 **Publier** | Publication livre imprimé via Gelato | ✅ Complet |

### Flux Logique

```
📝 Écriture → 🎨 Studio → 🎬 Montage → 🎭 Théâtre
   (texte)    (assets)    (assemblage)  (lecture)
```

---

## 🆕 Dernières modifications (Session 16 janvier)

### 🎨 Studio Pédagogique (NOUVEAU)

**Objectif** : Apprendre aux filles à prompter ET à utiliser les outils seules, progressivement.

#### Progressions SÉPARÉES

| Parcours | Outil | Niveaux | Créations pour finir |
|----------|-------|---------|---------------------|
| 🖼️ **Images** | Midjourney | 5 | 3+5+7+10 = 25 |
| 🎬 **Vidéos** | Runway | 5 | 3+5+7+10 = 25 |

#### Les 5 Niveaux

| Niveau | Nom | Ce que fait l'enfant |
|--------|-----|---------------------|
| 1 🌱 | Je découvre | Décrit son idée + importe |
| 2 🌿 | Je participe | + Choisit style et ambiance |
| 3 ⭐ | Je m'entraîne | + Voit le prompt, colle dans Safari |
| 4 🌟 | Je sais faire | + Ouvre Safari seule, génère |
| 5 👑 | Experte | Tout seule ! |

#### Composants créés

```
src/
├── store/
│   └── useStudioProgressStore.ts    # Progressions, badges, niveaux
│
├── components/studio/
│   ├── StudioGuide.tsx              # Guide visuel étape par étape
│   ├── StudioAIChat.tsx             # IA-Amie qui guide
│   ├── StudioMagicKeys.tsx          # Les 5 Clés Magiques
│   └── StudioTutorial.tsx           # Tutoriels Midjourney/Runway
```

#### Interface à 3 panneaux

```
┌──────────────┬─────────────────────┬──────────────┐
│  IA-Amie     │   PromptBuilder     │   Guide      │
│  Chat 💬     │   + 5 Clés          │   Étapes 📋  │
│              │   + Safari Bridge   │   0/3 créa   │
│              │   + Import          │   [Aide]     │
└──────────────┴─────────────────────┴──────────────┘
```

#### Les 5 Clés Magiques

**Pour Images** :
- 🎨 Style (40%) : Dessin, photo, magique...
- 🦸 Héros (25%) : Qui ou quoi
- 💫 Ambiance (15%) : Émotion, lumière
- 🌍 Monde (10%) : Où ça se passe
- ✨ Magie (10%) : Détail unique

**Pour Vidéos** :
- 🎨 Style (30%) : Réaliste, animé...
- 🎬 Action (30%) : Qu'est-ce qui bouge
- 💫 Ambiance (15%) : Émotion
- ⏱️ Rythme (15%) : Lent, rapide
- ✨ Effet (10%) : Effet spécial

#### Système d'aide

- Bouton "J'ai besoin d'aide" à tout moment
- IA-Amie reformule les étapes difficiles
- Messages d'encouragement
- Pas de pénalité, progression bienveillante

---

### 🎙️ Stratégie Voix (CONFIGURÉE)

| Contexte | Service | Pourquoi |
|----------|---------|----------|
| **IA-Amie chat** | Apple Voice (TTS système) | 0 délai, instantané |
| **Narration histoires** | ElevenLabs | Qualité premium |
| **Fallback** | Apple Voice | Si ElevenLabs indisponible |

#### Configuration ElevenLabs

```bash
# Dans .env.local
ELEVENLABS_API_KEY=xxx

# Voice IDs (créer des voix personnalisées sur le compte client)
ELEVENLABS_VOICE_NARRATOR=xxx   # Voix principale conte
ELEVENLABS_VOICE_FAIRY=xxx      # Voix fée
ELEVENLABS_VOICE_DRAGON=xxx     # Voix dragon
ELEVENLABS_VOICE_DEFAULT=xxx    # Voix par défaut
```

#### Fichiers voix

```
src/
├── lib/
│   ├── ai/
│   │   └── elevenlabs.ts            # Service ElevenLabs + fallback
│   └── tts/
│       └── macos-tts.ts             # Apple Voice (système)
│
├── hooks/
│   └── useNarration.ts              # Hook unifié narration
│
├── app/api/ai/
│   └── narration/route.ts           # API narration avec fallback
```

#### Fonction de fallback

```typescript
// Dans elevenlabs.ts
export async function generateNarrationWithFallback(
  text: string,
  voiceType: VoiceType = 'narrator',
  locale: 'fr' | 'en' | 'ru' = 'fr'
): Promise<{ audioUrl: string; audioBlob: Blob; source: 'elevenlabs' | 'apple' }>
```

---

### 👤 IA Personnalisable

- **Nom choisi par l'enfant** à la première connexion
- **Modal `AINameModal`** avec suggestions de prénoms
- **Persistance** dans Supabase (`profiles.ai_name`)
- **Modification** possible via menu utilisateur
- **Toutes les références "Luna"** remplacées

---

### 📖 Mode Publication (Gelato)

- **6 étapes** : Sélection → Format → Couverture → Aperçu → Qualité → Commande
- **Formats** : Carré (21×21), A5, A4
- **API Gelato** : Devis en temps réel + passage de commande

---

### 🗑️ Supprimé

- ❌ **Mode Journal** (DiaryMode) retiré de l'UI
- ❌ **Référence "Luna"** supprimée partout

---

## 🔴 PROBLÈME MAJEUR : Données non connectées

### 3 systèmes de données séparés

```
Mode Écriture   →   useAppStore     →   stories[] + pages[]
Mode Montage    →   useMontageStore →   projects[] + scenes[]
Mode Théâtre    →   useLayoutStore  →   books[] + pages[]    ← VIDE !
```

### Corrections nécessaires

| Tâche | Description | Effort |
|-------|-------------|--------|
| **Studio → Montage** | Assets créés utilisables dans Montage | 1h |
| **Montage → Théâtre** | Théâtre lit `useMontageStore.projects` | 2h |
| **Supprimer useLayoutStore** | N'est plus utile | 30min |

---

## 📁 Structure des fichiers clés

### Store

```
src/store/
├── useAppStore.ts            # État global + histoires + aiName
├── useStudioStore.ts         # Kits de création (ancien)
├── useStudioProgressStore.ts # Progression pédagogique (nouveau)
├── useMontageStore.ts        # Projets montage
├── usePublishStore.ts        # Publication Gelato
├── useLayoutStore.ts         # ⚠️ À SUPPRIMER (vide)
├── useMentorStore.ts         # Session mentor
└── useAuthStore.ts           # Authentification
```

### Composants Studio

```
src/components/studio/
├── PromptBuilder.tsx         # Construction du prompt
├── SafariBridge.tsx          # Passerelles vers outils externes
├── AssetDropzone.tsx         # Import des créations
├── StudioMissionFlash.tsx    # Missions flash
├── StudioGuide.tsx           # Guide étape par étape ✨
├── StudioAIChat.tsx          # Chat IA-Amie ✨
├── StudioMagicKeys.tsx       # Les 5 Clés Magiques ✨
├── StudioTutorial.tsx        # Tutoriels Midjourney/Runway ✨
└── index.ts
```

### API

```
src/app/api/
├── ai/
│   ├── chat/route.ts         # Chat IA (reçoit aiName)
│   ├── voice/route.ts        # Génération voix
│   └── narration/route.ts    # Narration avec fallback ✨
├── gelato/
│   ├── quote/route.ts        # Devis Gelato
│   └── order/route.ts        # Commande Gelato
└── upload/route.ts           # Upload fichiers
```

---

## 🔧 Ce qui reste à faire

### Priorité 1 : Connecter les modes

| Tâche | Description | Effort |
|-------|-------------|--------|
| **Studio → Montage** | Assets importés → utilisables dans scènes | 1h |
| **Montage → Théâtre** | Projets terminés → lisibles dans Théâtre | 2h |
| **Supprimer useLayoutStore** | Code mort | 30min |

### Priorité 2 : Exports

| Tâche | Description | Effort |
|-------|-------------|--------|
| **Export PDF** | Pour l'impression (300 DPI) | 4h |
| **Export MP4** | Le livre-disque en vidéo | 6h |

### Priorité 3 : Finitions Studio

| Tâche | Description | Effort |
|-------|-------------|--------|
| **Screenshots tutoriels** | Images/GIFs pour Midjourney et Runway | 2h |
| **Tests progression** | Vérifier les passages de niveaux | 1h |

---

## 🚀 Pour démarrer

```bash
# Installer
npm install

# Dev (web + signaling)
npm run dev
# → http://localhost:3000 (ou 3004 si port occupé)

# Dev Electron
npm run dev:electron
```

### Tester l'app

1. **Écriture** : Créer une histoire avec du texte
2. **Studio** : Voir la progression à 0, cliquer sur Images/Vidéos
3. **Montage** : Créer un projet depuis une histoire
4. **Publier** : Sélectionner histoire, voir devis Gelato

---

## 🔑 Configuration

### Variables d'environnement (`.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Google AI
GOOGLE_GEMINI_API_KEY=xxx

# ElevenLabs (voix premium - optionnel)
ELEVENLABS_API_KEY=xxx
ELEVENLABS_VOICE_NARRATOR=xxx
ELEVENLABS_VOICE_FAIRY=xxx
ELEVENLABS_VOICE_DRAGON=xxx
ELEVENLABS_VOICE_DEFAULT=xxx

# Gelato (publication)
GELATO_API_KEY=xxx
GELATO_TEST_MODE=true

# Cloudflare R2 (vidéos)
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=lavoixdusoir-videos
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

---

## 📊 Récapitulatif de l'état

| Composant | État | Notes |
|-----------|------|-------|
| Mode Écriture | ✅ | Complet |
| Mode Studio | ✅ | Pédagogique avec 5 niveaux |
| Mode Montage | ✅ | Timeline v2 complète |
| Mode Théâtre | ⚠️ | Lit le mauvais store (vide) |
| Mode Publier | ✅ | Gelato intégré |
| IA personnalisable | ✅ | Nom choisi par l'enfant |
| Voix IA-Amie | ✅ | Apple Voice (0 délai) |
| Voix narration | ✅ | ElevenLabs + fallback Apple |
| Sync Supabase | ✅ | Debounced |
| Export PDF | 🔧 | À faire |
| Export MP4 | 🔧 | À faire |

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

## 💡 Notes importantes pour le prochain dev

1. **L'enfant cible a 8 ans** → Tout doit être simple et encourageant
2. **Budget illimité** → Pas d'hésitation sur les services payants
3. **Apple Voice pour le chat** → Impératif pour le 0 délai
4. **ElevenLabs pour les histoires** → Qualité premium
5. **Progression séparée** → L'enfant apprend Images ET Vidéos indépendamment
6. **useLayoutStore à supprimer** → Ne sert plus à rien

---

**Bon courage pour la suite !** 🌙✨
