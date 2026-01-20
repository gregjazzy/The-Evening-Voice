# 🌙 La Voix du Soir

> Application magique de création de livres-disques numériques pour enfants, avec une IA-Amie personnalisable et **apprentissage progressif du prompting**.

![Version](https://img.shields.io/badge/version-5.4.0-purple)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-orange)
![Electron](https://img.shields.io/badge/Electron-Desktop-blue)

---

## ✨ Présentation

**La Voix du Soir** est une application iPad/Desktop conçue pour les enfants. Elle offre un espace créatif où ils peuvent :

- ✍️ Écrire des histoires magiques avec structures narratives
- 🎨 Apprendre à créer des prompts IA (Nano Banana/Kling) progressivement
- 🏆 S'entraîner au prompting avec des défis interactifs
- 🎬 Assembler des livres-disques interactifs avec timeline
- 🎭 Présenter leurs créations en mode Théâtre immersif + export vidéo HD
- 📖 Publier un vrai livre imprimé (via Gelato) ou PDF

Le tout accompagné par une **IA-Amie** dont l'enfant choisit le nom lors de sa première connexion ! 🌟

**Objectif pédagogique principal** : Enseigner le **prompting** de manière ludique et progressive.

---

## 📊 État du Projet (Janvier 2026)

### Modes Disponibles

| Mode | État | Description |
|------|------|-------------|
| ✍️ **Écriture** | ✅ Complet | Création de livres avec chapitres, décorations, fonds |
| 🎨 **Studio** | ✅ Complet | Apprentissage progressif du prompting (5 niveaux) |
| 🏆 **Défis** | ✅ **NOUVEAU** | Exercices de prompting : reproduire/varier des images |
| 🎬 **Montage** | ✅ Complet | Timeline "Rubans Magiques" + 98 sons |
| 🎭 **Théâtre** | ✅ Complet | Lecteur immersif + export MP4 HD |
| 📖 **Publier** | ✅ Complet | Publication via Gelato + export PDF |
| 🤝 **Collab** | ✅ Complet | Création à distance parent/enfant (WebRTC) |

### Fonctionnalités Clés

| Fonctionnalité | État | Notes |
|----------------|------|-------|
| IA-Amie personnalisable | ✅ | Nom choisi via dialogue interactif |
| Guidage visuel IA | ✅ | L'IA peut faire clignoter des boutons |
| **Modales d'introduction** | ✅ | Chaque mode s'explique à la 1ère visite |
| Éditeur livre ouvert | ✅ | 2 pages côte à côte |
| Décorations premium | ✅ | 60+ ornements SVG |
| Timeline Montage v2 | ✅ | Drag & drop, zoom, effets |
| Bibliothèque sons | ✅ | 98 fichiers (ambiances, effets, musiques) |
| **Challenge Mode** | ✅ | 12 défis de prompting avec analyse IA |
| Synchronisation Supabase | ✅ | Auto-save debounced |
| Export PDF | ✅ | 300 DPI, qualité impression |
| Export MP4 | ✅ | Via Mux, qualité 4K |
| Administration multi-famille | ✅ | Gestion des clients + clés API |
| Mode multi-langue | ✅ | FR, EN, RU |

---

## 🎯 Flux de Production

```
📝 Écriture → 🎨 Studio → 🏆 Défis → 🎬 Montage → 🎭 Théâtre
   (texte)    (assets)   (pratique)  (assemblage)  (lecture)
                              ↓
                     📖 Publier / Export
                   (livre imprimé / PDF / MP4)
```

---

## 🎓 Pédagogie du Prompting

L'application enseigne le prompting via **trois systèmes complémentaires** :

### Mode Écriture : 5 Questions Magiques

| Question | Description |
|----------|-------------|
| **QUI ?** | Le personnage principal |
| **QUOI ?** | Ce qu'il fait |
| **OÙ ?** | Le lieu de l'action |
| **QUAND ?** | Le moment (jour, nuit, saison) |
| **ET PUIS ?** | Ce qui se passe ensuite |

### Mode Studio : 5 Clés Magiques

| Clé | Description |
|-----|-------------|
| 🎨 **Style** | Dessin, photo, anime, aquarelle... |
| 🦸 **Héros** | Le sujet principal de l'image |
| 🌈 **Ambiance** | L'atmosphère (joyeux, mystérieux...) |
| 🌍 **Monde** | Le décor, l'environnement |
| ✨ **Magie** | Les effets spéciaux |

### Mode Défis : Exercices Pratiques

| Exercice | Description |
|----------|-------------|
| **Reproduire l'image** | Deviner le prompt d'une image générée |
| **Variations** | Créer une variation selon une consigne |

---

## 🎨 Mode Studio - Apprentissage Progressif

Le Studio est un **parcours pédagogique** pour apprendre à créer des prompts IA.

### Les 5 Niveaux

| Niveau | Nom | Ce que l'enfant fait |
|--------|-----|---------------------|
| 1 🌱 | Je découvre | Décrit son idée (boutons visibles) |
| 2 🌿 | Je participe | + Choisit style et ambiance |
| 3 ⭐ | Je m'entraîne | Décrit TOUT dans son texte (boutons masqués) |
| 4 🌟 | Je sais faire | + Ouvre Safari seule |
| 5 👑 | Experte | Autonomie totale |

### Guidage Intelligent

- **IA-Amie** connectée au guide, suggère ce qui manque
- **Détection par mots-clés** (niveau 3+) pour validation automatique
- **Surbrillance** des éléments à compléter
- **Guide à droite** avec étapes qui se cochent automatiquement

---

## 🏆 Mode Défis - Exercices de Prompting

### Types de défis

| Type | Description | Niveaux |
|------|-------------|---------|
| **Reproduire** | Deviner le prompt d'une image | Facile, Moyen, Difficile |
| **Variations** | Modifier une image selon consigne | Facile, Moyen, Difficile |

### Fonctionnalités

- **12 défis** avec images pré-générées (chargement instantané)
- **Indices progressifs** pour aider l'enfant
- **Analyse IA** : Gemini Vision compare les résultats
- **Score** : 0-100 avec points forts et conseils

---

## 🎬 Mode Montage - Timeline "Rubans Magiques"

```
┌─────────────────────────────────────────────────────────────────────┐
│ Structure  │🎬 Intro 3s│  📖 Narration (16.9s)           │🎬 Outro│
├─────────────────────────────────────────────────────────────────────┤
│ Phrases    │           │ Phrase 1 │ Phrase 2 │ Phrase 3 │          │
├─────────────────────────────────────────────────────────────────────┤
│ Médias     │     [▶ Video d'intro           ]                      │
├─────────────────────────────────────────────────────────────────────┤
│ Musique    │[♫ Musique de fond                                     ]│
├─────────────────────────────────────────────────────────────────────┤
│ Sons       │                    [🔔 Carillon]                       │
├─────────────────────────────────────────────────────────────────────┤
│ Lumières   │        [💡 Magique 60%                                ]│
├─────────────────────────────────────────────────────────────────────┤
│ Anim       │    [✨ Étoiles]          [💖 Cœurs qui s'envolent]     │
└─────────────────────────────────────────────────────────────────────┘
```

### Bibliothèque Sonore Intégrée

| Type | Nombre | Exemples |
|------|--------|----------|
| **Ambiances** | 16 | Forêt, pluie, plage, fête foraine... |
| **Effets** | 70 | Super-héros, animaux, magie, combat... |
| **Musiques** | 12 | Classique, aventure, mystère, féérique... |

---

## 🛠️ Stack Technique

| Technologie | Usage |
|-------------|-------|
| **Next.js 14** | Framework React (App Router) |
| **TypeScript** | Typage statique |
| **Tailwind CSS** | Styles |
| **Framer Motion** | Animations |
| **Zustand** | State management |
| **Supabase** | Base de données + Auth + Storage |
| **Gemini 2.0 Flash** | IA conversationnelle + Vision |
| **fal.ai** | Images (Nano Banana), Vidéos (Kling), Voix (ElevenLabs) |
| **Mux** | Export vidéo HD |
| **Gelato API** | Print-on-demand |
| **Cloudflare R2** | Stockage vidéos |
| **Electron** | Application desktop Mac |
| **WebRTC** | Communication peer-to-peer |

---

## 📦 Installation

### Prérequis

- Node.js 18+
- npm
- Compte Supabase
- Clés API (voir ci-dessous)

### 1. Cloner le projet

```bash
git clone https://github.com/gregjazzy/The-Evening-Voice.git
cd lavoixdusoir
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
SUPABASE_SERVICE_ROLE_KEY=xxx

# FAL.AI (images, vidéos, voix)
FAL_API_KEY=xxx

# GEMINI (chat IA + Vision)
GOOGLE_GEMINI_API_KEY=xxx

# ASSEMBLYAI (transcription)
ASSEMBLYAI_API_KEY=xxx

# GELATO (publication)
GELATO_API_KEY=xxx
GELATO_TEST_MODE=true

# CLOUDFLARE R2 (vidéos)
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=lavoixdusoir-videos
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxx.r2.dev

# MUX (export vidéo)
MUX_TOKEN_ID=xxx
MUX_TOKEN_SECRET=xxx

# CONFIG
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ **Ne jamais commiter le fichier `.env.local`**

### 4. Lancer l'application

```bash
# Version Web (Next.js + Signaling Server)
npm run dev

# Version Electron
npm run dev:electron
```

---

## 🚀 Scripts disponibles

```bash
npm run dev           # App web + signaling server
npm run dev:client    # App web uniquement
npm run dev:electron  # App Electron
npm run build         # Build web
npm run build:electron # Build app Electron
npm run lint          # Vérifier le code

# Challenge Mode
npx tsx scripts/generate-challenge-images.ts  # Régénérer images défis
```

---

## 📁 Base de données Supabase

### Tables principales

| Table | Description |
|-------|-------------|
| `profiles` | Utilisateurs (enfants, mentors, parents) |
| `stories` | Histoires créées (mode Écriture) |
| `montage_projects` | Projets de montage (timeline) |
| `studio_progress` | Progression pédagogique Studio |
| `assets` | Images et médias générés |
| `families` | Familles clientes |
| `family_config` | Clés API et voix par famille |

### Buckets Storage

| Bucket | Contenu |
|--------|---------|
| `images` | Images générées et importées |
| `audio` | Fichiers audio (narration) |
| `pdfs` | PDFs générés pour impression |
| `images/challenges` | Images pré-générées pour défis |

---

## 📚 Documentation

| Fichier | Contenu |
|---------|---------|
| `docs/CONCEPT.md` | Vision produit |
| `docs/ARCHITECTURE.md` | Architecture technique |
| `docs/QUICK_START.md` | Guide de démarrage |
| `docs/API.md` | Documentation API |
| `docs/HANDOVER.md` | Document de passation complet |

---

## 🔮 Changelog récent

### v5.4.0 (20 janvier 2026)

**Challenge Mode**
- ✅ Mode "Défis" avec 12 exercices de prompting
- ✅ Deux types : Reproduire l'image / Variations
- ✅ Analyse IA via Gemini Vision (score, conseils)
- ✅ Images pré-générées (chargement instantané)

**Modales d'Introduction**
- ✅ Chaque mode s'explique à la première visite
- ✅ Objectifs pédagogiques adaptés aux enfants
- ✅ Design élégant avec animations

**Bug Fixes**
- ✅ Fix sauvegarde images : message d'erreur visible si échec
- ✅ Fix Theater Mode : synchronisation médias corrigée

### v5.3.0 (20 janvier 2026)

**PublishMode Complet**
- ✅ Upload PDF vers Supabase Storage
- ✅ Vérification DPI réelle des images
- ✅ Upscale IA automatique (Real-ESRGAN)
- ✅ Intégration Gelato complète

### v5.2.0 (20 janvier 2026)

**Studio Améliorations**
- ✅ Migration vers Nano Banana Pro (comprend le français)
- ✅ Validation IA du contenu dans le chat
- ✅ Liaison Histoire/Assets automatique

---

## 📄 Licence

Projet privé - Tous droits réservés

---

<p align="center">
  Fait avec 💜 pour les petites créatrices d'histoires
</p>
