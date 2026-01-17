# 🌙 La Voix du Soir

> Application magique de création de livres-disques numériques pour enfants, avec une IA-Amie personnalisable.

![Version](https://img.shields.io/badge/version-4.0.0-purple)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-orange)
![Electron](https://img.shields.io/badge/Electron-Desktop-blue)

---

## ✨ Présentation

**La Voix du Soir** est une application iPad/Desktop conçue pour les enfants. Elle offre un espace créatif où ils peuvent :

- ✍️ Écrire des histoires magiques avec structures narratives
- 🎨 Apprendre à créer des prompts IA (Midjourney/Runway) progressivement
- 🎬 Assembler des livres-disques interactifs avec timeline
- 🎭 Présenter leurs créations en mode Théâtre immersif + export vidéo HD
- 📖 Publier un vrai livre imprimé (via Gelato) ou PDF

Le tout accompagné par une **IA-Amie** dont l'enfant choisit le nom lors de sa première connexion ! 🌟

---

## 📊 État du Projet (Janvier 2026)

### Modes Disponibles

| Mode | État | Description |
|------|------|-------------|
| ✍️ **Écriture** | ✅ Complet | Création de livres avec chapitres, décorations, fonds |
| 🎨 **Studio** | ✅ Complet | Apprentissage progressif du prompting (5 niveaux) |
| 🎬 **Montage** | ✅ Complet | Timeline "Rubans Magiques" + 98 sons |
| 🎭 **Théâtre** | ✅ Complet | Lecteur immersif + export MP4 HD |
| 📖 **Publier** | ✅ Complet | Publication via Gelato + export PDF |
| 🤝 **Collab** | ✅ Complet | Création à distance parent/enfant (WebRTC) |

### Fonctionnalités Clés

| Fonctionnalité | État | Notes |
|----------------|------|-------|
| IA-Amie personnalisable | ✅ | Nom choisi via dialogue interactif |
| Guidage visuel IA | ✅ | L'IA peut faire clignoter des boutons |
| Éditeur livre ouvert | ✅ | 2 pages côte à côte |
| Décorations premium | ✅ | 60+ ornements SVG |
| Timeline Montage v2 | ✅ | Drag & drop, zoom, effets |
| Bibliothèque sons | ✅ | 98 fichiers (ambiances, effets, musiques) |
| Background removal | ✅ | Supprimer les fonds d'images |
| Synchronisation Supabase | ✅ | Auto-save debounced |
| Export PDF | ✅ | 300 DPI, qualité impression |
| Export MP4 | ✅ | Via Mux, qualité 4K |
| Administration multi-famille | ✅ | Gestion des clients + clés API |
| Sélecteur voix IA | ✅ | Choix parmi voix système |
| Sélecteur voix narration | ✅ | 21 voix ElevenLabs |
| Mode hors-ligne | ✅ | Fallbacks intelligents |
| Responsive iPad | ✅ | Interface adaptative |
| Mode multi-langue | ✅ | FR, EN, RU |

---

## 🎯 Flux de Production

```
📝 Écriture → 🎨 Studio → 🎬 Montage → 🎭 Théâtre
   (texte)    (assets)    (assemblage)  (lecture)
                              ↓
                     📖 Publier / Export
                   (livre imprimé / PDF / MP4)
```

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

## 👥 Administration Multi-Famille

### Pour le développeur (Super Admin)

- Gérer **toutes** les familles clientes
- Configurer les **clés API** (ElevenLabs, Gemini, Midjourney, Runway)
- Voir les **statistiques** et créations

### Pour les parents (dans l'app)

- **Membres** : Ajouter/supprimer enfants, invitations par email
- **Créations** : Voir les histoires et montages des enfants
- **Configuration** : Modifier les clés API (avec garde-fous)

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
| **Gemini 2.0 Flash** | IA conversationnelle |
| **ElevenLabs** | Voix narration premium |
| **Mux** | Export vidéo HD |
| **Gelato API** | Print-on-demand |
| **Cloudflare R2** | Stockage vidéos |
| **Web Speech API** | TTS voix IA |
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

# GEMINI (obligatoire)
GOOGLE_GEMINI_API_KEY=votre-clé-gemini

# ELEVENLABS (narration)
ELEVENLABS_API_KEY=xxx

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
```

---

## 🔑 Configuration Super Admin

Pour vous configurer en tant que Super Admin :

1. Créer un compte sur l'app
2. Dans Supabase SQL Editor :
```sql
INSERT INTO super_admins (user_id, name)
VALUES ('VOTRE_USER_ID', 'Admin');
```
3. Rafraîchir l'app → Bouton "Admin" apparaît dans la sidebar

---

## 📁 Base de données Supabase

### Tables principales

| Table | Description |
|-------|-------------|
| `profiles` | Utilisateurs (enfants, mentors, parents) |
| `stories` | Histoires créées (mode Écriture) |
| `montage_projects` | Projets de montage (timeline) |
| `studio_progress` | Progression pédagogique Studio |
| `families` | Familles clientes |
| `family_config` | Clés API et voix par famille |
| `family_members` | Membres (parent/enfant) + invitations |
| `super_admins` | Administrateurs système |

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

### v4.0.0 (17 janvier 2026)

**Administration Multi-Famille**
- ✅ Super Admin Panel (gestion de toutes les familles)
- ✅ Parent Panel (membres, créations, configuration)
- ✅ Invitations par email
- ✅ Clés API dynamiques par famille

**Voix & Audio**
- ✅ 21 voix ElevenLabs (7 par langue)
- ✅ Sélecteur voix IA avec test
- ✅ Sélecteur voix narration avec aperçu
- ✅ Bibliothèque 98 sons intégrée
- ✅ Mode hors-ligne avec fallbacks

**Exports**
- ✅ Export PDF 300 DPI
- ✅ Export MP4 via Mux (4K)

**UX/UI**
- ✅ Welcome sequence interactive pour nom IA
- ✅ Guidage visuel (highlight boutons)
- ✅ Timeline playhead fluide
- ✅ Responsive iPad
- ✅ Animations polish (20+ nouvelles)
- ✅ Composants UI premium (8 nouveaux)

**Technique**
- ✅ Connexion Studio → Montage → Théâtre
- ✅ Upload cloud (Supabase + R2)
- ✅ Sync Supabase (montages, progression)
- ✅ Background removal (client-side)
- ✅ Sécurité Electron renforcée
- ✅ Suppression useLayoutStore (code mort)

### v3.4.0 (17 janvier 2026)
- ✅ Studio UX refonte complète
- ✅ Détection par mots-clés
- ✅ IA connectée au guide

### v3.3.0 (16 janvier 2026)
- ✅ Studio pédagogique avec 5 niveaux
- ✅ Stratégie voix (Apple TTS + ElevenLabs)
- ✅ IA personnalisable

---

## 📄 Licence

Projet privé - Tous droits réservés

---

<p align="center">
  Fait avec 💜 pour les petites créatrices d'histoires
</p>
