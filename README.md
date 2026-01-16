# 🌙 La Voix du Soir

> Une application magique de création d'histoires pour enfants, avec une IA-Amie nommée Luna.

![Version](https://img.shields.io/badge/version-1.8.0-purple)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-orange)
![Electron](https://img.shields.io/badge/Electron-Desktop-blue)

---

## ✨ Présentation

**La Voix du Soir** est une application iPad/Desktop conçue pour les enfants de 8 ans. Elle offre un espace créatif où ils peuvent :

- 📔 Écrire dans leur journal intime (avec photos, audio et images IA)
- 📖 Créer des histoires magiques avec structures narratives
- 🎨 Générer des images avec l'IA
- 🖼️ Décorer les pages avec des ornements premium
- 🎬 Assembler des livres interactifs
- 🎭 Présenter leurs créations en mode Théâtre

Le tout accompagné par **Luna**, une IA-Amie de 8 ans qui guide, encourage et enseigne l'art du prompting.

---

## 🎯 Fonctionnalités

### 5 Modes de Navigation

| Mode | Description |
|------|-------------|
| 📔 **Journal** | Espace de confidences avec photos, enregistrements vocaux, et génération d'images IA |
| ✍️ **Écriture** | Création de récits avec structures narratives, chapitres, fonds de page et décorations |
| 🎨 **Studio** | Génération d'images (Midjourney), voix (ElevenLabs), vidéos (Runway/Luma) |
| 📐 **Montage** | Assemblage de texte sur images, choix de typographies, synchronisation audio |
| 🎭 **Théâtre** | Mode immersif avec synchronisation domotique (HomeKit/Hue) |

---

## ✍️ Mode Écriture Avancé

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
│      │                 │ || │                 │                             │
│      │ [🎙️][📷][🖼️][🎨]│ || │ [🎙️][📷][🖼️][🎨]│                             │
│      │     — 1 —       │ || │     — 2 —       │                             │
│      └─────────────────┴────┴─────────────────┘                             │
│                                                                              │
│              [•1] [•2] [•3] [•4] [+]                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Fonctionnalités de l'éditeur

| Fonctionnalité | Description |
|----------------|-------------|
| **Vue livre ouvert** | 2 pages éditables côte à côte comme un vrai livre |
| **Mode zoom** | Agrandir une page (gauche ou droite) |
| **Texte sur lignes** | Écriture alignée sur les lignes du cahier |
| **Fond de page** | Image ou vidéo en arrière-plan avec opacité/zoom |
| **Décorations** | Ornements premium déplaçables avec effets |
| **Images flottantes** | Photos positionnables avec rotation et effets |

### 🖼️ Fond de Page (Nouveau ✨)

| Contrôle | Description |
|----------|-------------|
| **Type** | Image ou vidéo |
| **Opacité** | Slider 0-100% |
| **Zoom** | Slider 10-300% |
| **Position** | Drag pour déplacer |

### 🎨 Décorations Premium (Nouveau ✨)

Collection luxueuse de 60+ décorations SVG pour embellir les pages :

| Catégorie | Exemples |
|-----------|----------|
| ✨ **Ornements Dorés** | Coins baroques, volutes, séparateurs |
| 🌸 **Floraux** | Roses, sakura, guirlandes |
| 👑 **Royaux** | Couronnes, blasons, sceptres |
| ⭐ **Célestes** | Lunes, étoiles, constellations |
| 🦋 **Artistiques** | Papillons, plumes, cœurs |
| 🖼️ **Cadres** | Cadres dorés, parchemins |

#### Contrôles des décorations

| Contrôle | Range |
|----------|-------|
| **Taille** | 20-300% |
| **Rotation** | -180° à 180° |
| **Opacité** | 20-100% |
| **Couleur** | 12 couleurs premium |
| **Flip** | Miroir H/V |
| **Luminosité** | Effet glow avec couleur/intensité |
| **Menu déplaçable** | Glisser le header pour repositionner |

### Barre de Formatage

| Outil | Comportement |
|-------|--------------|
| **6 Polices** | S'applique au texte sélectionné |
| **Tailles numériques** | 8 à 72px |
| **Gras / Italique** | Toggle sans déplacer le curseur |
| **Couleurs** | Palette complète |
| **Fond de page** | Contrôles opacité/zoom |
| **Toggle lignes** | Afficher/masquer les lignes |

### Structures Narratives

| Structure | Pages | Description |
|-----------|-------|-------------|
| 📖 Conte Classique | 5-8 | Début → Problème → Aventure → Résolution → Fin |
| 🗺️ Aventure | 6-10 | Appel → Départ → Épreuves → Victoire → Retour |
| 🧩 Problème-Solution | 4-6 | Situation → Problème → Tentatives → Solution |
| 📔 Journal Illustré | 3-5 | Page par moment de la journée |
| 🔄 La Boucle | 4-6 | Retour au point de départ transformé |
| 🎨 Libre | Illimité | Sans structure imposée |

### Panneau Luna latéral

- **Chat toujours visible** pendant l'écriture
- **"📖 Luna, lis ma page !"** → Luna analyse le texte et pose des questions
- **🔊 Toggle voix** → Luna parle ses réponses
- **🎙️ Micro** → Parler à Luna au lieu de taper

### Dictée vocale

- **🎙️ Dicter** dans la zone d'écriture → Le texte s'ajoute à l'histoire
- **🎙️ Micro** dans le chat → Parler à Luna
- Supporté sur Chrome, Safari, Edge

---

## 🤖 Luna - L'IA-Amie

### Personnalité

- 💜 Enthousiaste et encourageante
- 🎨 Passionnée par les histoires et l'imagination
- 🌟 Patiente et bienveillante
- 🚫 Ne fait JAMAIS le travail à la place de l'enfant

### Mode Oral

| Mode | Comportement |
|------|--------------|
| **Écrit** | Luna répond en texte uniquement |
| **Oral** | Luna répond ET parle automatiquement |

### Voix

| Langue | Voix (macOS) | Voix (Web/iPad) |
|--------|--------------|-----------------|
| 🇫🇷 Français | Audrey (Enhanced) | Voix système FR |
| 🇬🇧 Anglais | Samantha | Voix système EN |
| 🇷🇺 Russe | Milena (Enhanced) | Voix système RU |

---

## 🎓 Système Pédagogique

### Les 5 Clés Magiques (Pour les Images)

| Clé | Impact | Question Luna |
|-----|--------|---------------|
| 🎨 **Style** | 40% | "Cartoon, peinture, ou photo ?" |
| 🦸 **Héros** | 25% | "Qui ou quoi ? Décris-le !" |
| 💫 **Ambiance** | 15% | "Quelle émotion ? Quelle lumière ?" |
| 🌍 **Monde** | 10% | "Où ça se passe ? Jour ou nuit ?" |
| ✨ **Magie** | 10% | "Quel détail rendrait l'image unique ?" |

### Les 5 Questions Magiques (Pour l'Écriture)

| Question | But |
|----------|-----|
| 👤 **Qui ?** | Définir le personnage principal |
| ❓ **Quoi ?** | L'action ou l'événement central |
| 📍 **Où ?** | Le lieu de l'histoire |
| ⏰ **Quand ?** | Le moment (jour, nuit, saison) |
| 🔄 **Et alors ?** | Le rebondissement |

### 5 Niveaux de Progression

| Niveau | Nom | XP requis |
|--------|-----|-----------|
| 1 | 🌱 Explorateur | 0 |
| 2 | ⭐ Apprenti | 50 |
| 3 | 🎨 Artiste | 150 |
| 4 | ✨ Magicien | 300 |
| 5 | 👑 Maître | 500 |

---

## 🖥️ Application Desktop (Electron)

### Fonctionnalités exclusives

| Fonctionnalité | Web/iPad | Electron |
|----------------|----------|----------|
| Toutes les fonctionnalités créatives | ✅ | ✅ |
| TTS voix natives macOS | ❌ | ✅ |
| Contrôle à distance du Mac | ❌ | ✅ |
| Partage d'écran complet | ❌ | ✅ |

---

## 🌍 Internationalisation

| Langue | Code |
|--------|------|
| 🇫🇷 Français | `fr` (défaut) |
| 🇬🇧 English | `en` |
| 🇷🇺 Русский | `ru` |

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
| **Gemini 2.0 Flash** | IA conversationnelle (Luna) |
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

# CONFIG
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ **Ne jamais commiter le fichier `.env.local`** - Il contient vos clés API privées.

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

## 🔮 Roadmap

### Fait ✅

- [x] App Electron pour desktop Mac
- [x] Contrôle à distance complet du Mac
- [x] Journal avec photos, audio, images IA
- [x] TTS macOS natif + Web Speech API
- [x] Système pédagogique (5 Clés + 5 Questions)
- [x] Mode Écriture avec onglets/chapitres
- [x] Barre de formatage complète (6 polices, tailles numériques)
- [x] Panneau Luna latéral avec chat
- [x] Dictée vocale (Speech-to-Text)
- [x] Parler à Luna (micro)
- [x] **Vue livre ouvert** (2 pages éditables côte à côte)
- [x] **Mode zoom bidirectionnel** (page gauche ou droite)
- [x] **Texte aligné sur les lignes** du cahier
- [x] **Gestion des chapitres** par page (points colorés)
- [x] **Formatage sur sélection** (taille, police, couleur)
- [x] **Images flottantes** avec rotation et styles
- [x] **Fond de page** (image/vidéo avec opacité/zoom/position)
- [x] **Décorations premium** (60+ ornements SVG)
- [x] **Effet de luminosité** (glow) pour les décorations
- [x] **Menu d'édition déplaçable**

### À venir 📋

- [ ] Export PDF des livres
- [ ] Intégration images Studio → Livre
- [ ] Mode hors-ligne avec sync
- [ ] App Electron pour Windows
- [ ] Animations décoratives

---

## 📦 Git Repository

**URL** : `https://github.com/gregjazzy/The-Evening-Voice.git`

```bash
# Cloner
git clone https://github.com/gregjazzy/The-Evening-Voice.git

# Après modifications
git add .
git commit -m "description"
git push origin main
```

---

## 📄 Licence

Projet privé - Tous droits réservés

---

<p align="center">
  Fait avec 💜 pour les petites créatrices d'histoires
</p>
