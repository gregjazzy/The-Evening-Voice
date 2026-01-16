# 🌙 La Voix du Soir

> Une application magique de création de livres-disques numériques pour enfants, avec une IA-Amie personnalisable.

![Version](https://img.shields.io/badge/version-3.2.0-purple)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-orange)
![Electron](https://img.shields.io/badge/Electron-Desktop-blue)

---

## ✨ Présentation

**La Voix du Soir** est une application iPad/Desktop conçue pour les enfants. Elle offre un espace créatif où ils peuvent :

- ✍️ Écrire des histoires magiques avec structures narratives
- 🎨 Créer des assets (images, voix, vidéos) au Studio
- 🎬 Assembler des livres-disques interactifs avec timeline
- 🎭 Présenter leurs créations en mode Théâtre immersif
- 📖 Publier un vrai livre imprimé (via Gelato)

Le tout accompagné par une **IA-Amie** dont l'enfant choisit le nom lors de sa première connexion ! 🌟

---

## 📊 État du Projet (Janvier 2026)

### Modes Disponibles

| Mode | État | Description |
|------|------|-------------|
| ✍️ **Écriture** | ✅ Complet | Création de livres avec chapitres, décorations, fonds |
| 🎨 **Studio** | ⚠️ Partiel | Assistant de prompts (pont vers outils externes) |
| 🎬 **Montage** | ✅ Complet | Timeline "Rubans Magiques" avec effets |
| 🎭 **Théâtre** | ⚠️ Partiel | Lecteur basique (données non connectées) |
| 📖 **Publier** | ✅ Complet | Publication via Gelato (print-on-demand) |
| 🤝 **Collab** | ✅ Complet | Création à distance parent/enfant (WebRTC) |

### Fonctionnalités Clés

| Fonctionnalité | État | Notes |
|----------------|------|-------|
| IA-Amie personnalisable | ✅ | L'enfant choisit le nom de son IA |
| Éditeur livre ouvert | ✅ | 2 pages côte à côte |
| Décorations premium | ✅ | 60+ ornements SVG |
| Timeline Montage v2 | ✅ | Drag & drop, zoom, effets |
| Synchronisation Supabase | ✅ | Auto-save debounced |
| Intégration Gelato | ✅ | Devis + commande |
| Mode multi-langue | ✅ | FR, EN, RU |

---

## 🎯 Flux de Production

```
📝 Écriture → 🎨 Studio → 🎬 Montage → 🎭 Théâtre
   (texte)    (assets)    (assemblage)  (lecture)
                              ↓
                         📖 Publier
                       (livre imprimé)
```

### Détail du flux

| Étape | Mode | Ce qu'on fait |
|-------|------|---------------|
| 1 | **Écriture** | Écrire l'histoire, les chapitres, ajouter les décos |
| 2 | **Studio** | Créer les illustrations, voix, vidéos (via outils externes) |
| 3 | **Montage** | Assembler texte + assets + effets sonores + timeline |
| 4 | **Théâtre** | Regarder/écouter le résultat final avec lumières |
| 5 | **Publier** | Commander un vrai livre imprimé |

---

## 🔧 Ce qui reste à faire

### Priorité 1 - Connexion des données

| Tâche | Description | Effort |
|-------|-------------|--------|
| **Studio → Montage** | Les assets créés doivent être utilisables dans le Montage | 1h |
| **Montage → Théâtre** | Le Théâtre doit lire les projets terminés du Montage | 2h |

### Priorité 2 - Améliorations

| Tâche | Description | Effort |
|-------|-------------|--------|
| **Export PDF** | Générer un PDF haute qualité pour l'impression | 4h |
| **Export MP4** | Exporter le livre-disque en vidéo | 6h |
| **HomeKit réel** | Contrôler les vraies lumières Hue | 3h |
| **Projection AirPlay** | Envoyer vers TV/écran externe | 2h |

### Priorité 3 - Optionnel

| Tâche | Description | Effort |
|-------|-------------|--------|
| **ElevenLabs intégré** | Générer les voix directement (API payante) | 2h |
| **Undo/Redo** | Historique des modifications | 3h |

---

## 🏗️ Architecture

### Stores (Zustand)

| Store | Usage |
|-------|-------|
| `useAppStore` | État global, projets d'écriture, chapitres |
| `useMontageStore` | Projets de montage, scènes, timeline |
| `usePublishStore` | État de publication, Gelato |
| `useStudioStore` | Kits de création, prompts |
| `useAuthStore` | Authentification, profils |
| `useMentorStore` | Mode collaboration |

### Structure des fichiers

```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── [locale]/          # Pages localisées
│   └── api/               # Routes API
│       ├── ai/            # Chat, image, voice, video
│       ├── gelato/        # Quote, order
│       └── upload/        # Upload vidéos
├── components/
│   ├── modes/             # BookMode, StudioMode, MontageEditor, TheaterMode, PublishMode
│   ├── montage/           # Timeline, Preview, RhythmGame...
│   ├── studio/            # PromptBuilder, SafariBridge...
│   └── ui/                # Composants réutilisables
├── hooks/                 # useAI, useSupabaseSync, useMontageSync...
├── lib/
│   ├── ai/                # Gemini, ElevenLabs, prompts
│   ├── gelato/            # Client API Gelato
│   └── supabase/          # Client, types
├── store/                 # Zustand stores
└── messages/              # Traductions (fr, en, ru)
```

---

## 🤖 IA-Amie Personnalisable

### Fonctionnement

1. **Première connexion** : Modal pour choisir le nom de l'IA
2. **Modification** : Menu utilisateur → "Mon amie IA"
3. **Persistance** : Sauvegardé dans Supabase (`profiles.ai_name`)

### Personnalité de l'IA

- 💜 Enthousiaste et encourageante
- 🎨 Passionnée par les histoires et l'imagination
- 🌟 Patiente et bienveillante
- 🚫 Ne fait JAMAIS le travail à la place de l'enfant

### Modes de communication

| Mode | Comportement |
|------|--------------|
| **Écrit** | L'IA répond en texte uniquement |
| **Oral** | L'IA répond ET parle automatiquement (TTS) |

---

## ✍️ Mode Écriture

### Interface Livre Ouvert

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [< Retour]  Titre histoire...        [FormatBar complète]         [≡] [⊞]   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│      ┌─────────────────┬────┬─────────────────┐                             │
│   <  │ PAGE GAUCHE     │ || │ PAGE DROITE     │  >                          │
│      │ ╔═════════════╗ │ || │ ┌─────┐         │                             │
│      │ ║ 🖼️ FOND    ║ │ || │ │ 👑  │         │                             │
│      │ ║ (image/    ║ │ || │ │DÉCOR│         │                             │
│      │ ║  vidéo)    ║ │ || │ └─────┘         │                             │
│      │ ╚═════════════╝ │ || │                 │                             │
│      │ Il était une    │ || │ La suite de     │                             │
│      │ fois...         │ || │ l'histoire...   │                             │
│      │     — 1 —       │ || │     — 2 —       │                             │
│      └─────────────────┴────┴─────────────────┘                             │
│              [•1] [•2] [•3] [•4] [+]                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| **Vue livre ouvert** | 2 pages éditables côte à côte |
| **Mode zoom** | Agrandir page gauche ou droite |
| **Texte sur lignes** | Écriture alignée sur les lignes |
| **Fond de page** | Image/vidéo avec opacité/zoom |
| **Décorations** | 60+ ornements premium déplaçables |
| **Images flottantes** | Photos avec rotation et effets |

### 🎨 Décorations Premium

| Catégorie | Exemples |
|-----------|----------|
| ✨ **Ornements Dorés** | Coins baroques, volutes, séparateurs |
| 🌸 **Floraux** | Roses, sakura, guirlandes |
| 👑 **Royaux** | Couronnes, blasons, sceptres |
| ⭐ **Célestes** | Lunes, étoiles, constellations |
| 🦋 **Artistiques** | Papillons, plumes, cœurs |

---

## 🎬 Mode Montage

### Timeline "Rubans Magiques"

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
        0s        3s        6s        9s       12s       15s      19s
```

### Pistes disponibles

| Piste | Icône | Description |
|-------|-------|-------------|
| Structure | ▶ | Intro / Narration / Outro |
| Phrases | T | Affichage karaoké synchronisé |
| Médias | 🖼 | Images et vidéos positionnables |
| Musique | 🎵 | Musique de fond avec fade |
| Sons | 🔊 | 120+ effets sonores catégorisés |
| Lumières | 💡 | Couleurs HomeKit |
| Déco | ✨ | Stickers et décorations |
| Anim | 🌟 | 30 animations (localisées + ambiance) |

---

## 🎨 Mode Studio

### ⚠️ Fonctionnement actuel

Le mode Studio est un **assistant de prompts** qui aide à créer du contenu via des outils externes :

| Outil | Usage | Intégration |
|-------|-------|-------------|
| **Midjourney** | Images | Copie prompt → ouvre Discord |
| **ElevenLabs** | Voix | Copie prompt → ouvre le site |
| **Runway** | Vidéos | Copie prompt → ouvre le site |

**Workflow** :
1. L'enfant construit son prompt (style, ambiance, sujet)
2. Le prompt est copié dans le presse-papier
3. Safari s'ouvre sur l'outil choisi
4. L'enfant colle et génère
5. Il importe l'asset créé via le dropzone

---

## 📖 Mode Publier

### Intégration Gelato (Print-on-Demand)

| Étape | Description |
|-------|-------------|
| 1. **Sélection** | Choisir l'histoire à publier |
| 2. **Format** | Carré, A5 ou A4 |
| 3. **Couverture** | Titre, auteur, couleur, image |
| 4. **Aperçu** | Prévisualisation du livre |
| 5. **Qualité** | Vérification automatique |
| 6. **Commande** | Devis Gelato + paiement |

### Formats disponibles

| Format | Dimensions | Prix indicatif |
|--------|------------|----------------|
| Carré | 21×21 cm | ~15€ |
| A5 | 14.8×21 cm | ~12€ |
| A4 | 21×29.7 cm | ~18€ |

---

## 🌍 Internationalisation

| Langue | Code | État |
|--------|------|------|
| 🇫🇷 Français | `fr` | ✅ Complet |
| 🇬🇧 English | `en` | ✅ Complet |
| 🇷🇺 Русский | `ru` | ✅ Complet |

---

## 🛠️ Stack Technique

| Technologie | Usage |
|-------------|-------|
| **Next.js 14** | Framework React (App Router) |
| **TypeScript** | Typage statique |
| **Tailwind CSS** | Styles |
| **Framer Motion** | Animations |
| **Zustand** | State management |
| **Supabase** | Base de données + Auth + Realtime |
| **Gemini 2.0 Flash** | IA conversationnelle |
| **Gelato API** | Print-on-demand |
| **Web Speech API** | TTS & STT navigateur |
| **Electron** | Application desktop Mac |
| **WebRTC** | Communication peer-to-peer |

---

## 📦 Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase
- Clé API Google Gemini
- (Optionnel) Clé API Gelato

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

# GEMINI (obligatoire)
GOOGLE_GEMINI_API_KEY=votre-clé-gemini

# GELATO (optionnel - pour publication)
GELATO_API_KEY=votre-clé-gelato
GELATO_TEST_MODE=true

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
```

---

## 🔑 Identifiants Admin

| | |
|---|---|
| **Email** | `admin@admin.com` |
| **Mot de passe** | `admin123` |

---

## 📁 Base de données Supabase

### Tables principales

| Table | Description |
|-------|-------------|
| `profiles` | Utilisateurs (enfants, mentors, parents) |
| `stories` | Histoires créées (mode Écriture) |
| `montage_projects` | Projets de montage (timeline) |

### Colonnes `profiles` importantes

| Colonne | Type | Description |
|---------|------|-------------|
| `ai_name` | TEXT | Nom personnalisé de l'IA |
| `emotional_context` | JSONB | Contexte émotionnel pour l'IA |
| `role` | TEXT | `child`, `mentor`, `parent` |

---

## 📚 Documentation

| Fichier | Contenu |
|---------|---------|
| `docs/CONCEPT.md` | Vision produit |
| `docs/ARCHITECTURE.md` | Architecture technique |
| `docs/QUICK_START.md` | Guide de démarrage |
| `docs/API.md` | Documentation API |
| `docs/HANDOVER.md` | Document de passation |

---

## 🔮 Changelog récent

### v3.2.0 (Janvier 2026)
- ✅ Mode Publication avec Gelato
- ✅ Nom de l'IA personnalisable (plus de "Luna" en dur)
- ✅ Modal de choix du nom à la première connexion
- ❌ Suppression du mode Journal (demande cliente)

### v3.1.0
- ✅ Mode Montage v2 "Rubans Magiques"
- ✅ Zones Intro/Outro
- ✅ PreviewCanvas avec animations
- ✅ RhythmGame phrase par phrase

### v3.0.0
- ✅ Vue livre ouvert (2 pages)
- ✅ Décorations premium (60+)
- ✅ Fond de page (image/vidéo)

---

## 📄 Licence

Projet privé - Tous droits réservés

---

<p align="center">
  Fait avec 💜 pour les petites créatrices d'histoires
</p>
