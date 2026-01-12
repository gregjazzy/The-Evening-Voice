# 🌙 La Voix du Soir

> Une application magique de création d'histoires pour enfants, avec une IA-Amie nommée Luna.

![Version](https://img.shields.io/badge/version-1.6.0-purple)
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
- 🎬 Assembler des livres interactifs
- 🎭 Présenter leurs créations en mode Théâtre

Le tout accompagné par **Luna**, une IA-Amie de 8 ans qui guide, encourage et enseigne l'art du prompting.

---

## 🎯 Fonctionnalités

### 5 Modes de Navigation

| Mode | Description |
|------|-------------|
| 📔 **Journal** | Espace de confidences avec photos, enregistrements vocaux, et génération d'images IA |
| ✍️ **Écriture** | Création de récits avec structures narratives, chapitres et mise en forme avancée |
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
│      │ (éditable)      │ || │ (éditable)      │                             │
│      │ ─────────────── │ || │ ─────────────── │                             │
│      │ Il était une    │ || │ La suite de     │                             │
│      │ fois...         │ || │ l'histoire...   │                             │
│      │ ─────────────── │ || │ ─────────────── │                             │
│      │     [👁] — 1 —  │ || │ [👁] — 2 —      │                             │
│      └─────────────────┴────┴─────────────────┘                             │
│                                                                              │
│              [•1] [•2] [•3] [•4] [+]                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Vue Livre Ouvert

- **2 pages éditables côte à côte** comme un vrai livre
- **Reliure centrale** avec effet visuel réaliste
- **Mode zoom** : Cliquer sur l'œil pour agrandir une page (gauche OU droite)
- **Texte SUR les lignes** : Écriture alignée sur les lignes du cahier
- **Ratio 2:3** respecté (format livre standard)
- **Points colorés** sur les onglets pour indiquer les chapitres

### Barre de Formatage (Nouveau ✨)

| Outil | Comportement |
|-------|--------------|
| **6 Polices** | S'applique au texte **sélectionné uniquement** |
| **Tailles numériques** | S'applique au texte **sélectionné uniquement** |
| **Gras / Italique** | Fonctionne sans déplacer le curseur |
| **Couleurs** | Palette complète avec nuancier |
| **Détection auto** | L'indicateur affiche la taille/police du texte sous le curseur |

**Tailles disponibles** : 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72

**Polices** : Écriture, Conte, Enfant, Livre, BD, Magie

### Mode Zoom

```
┌────────────────────────────────────────────────────┐
│                                         [👁̸]       │
│              Introduction                          │
│  ───────────────────────────────────────────────   │
│  Il était une fois une histoire fabuleuse qui      │
│  ───────────────────────────────────────────────   │
│  commençait par une belle journée ensoleillée.     │
│  ───────────────────────────────────────────────   │
│                                                    │
│                  — Page 1 —                        │
├────────────────────────────────────────────────────┤
│              [•1] [•2] [•3] [•4] [+]               │
└────────────────────────────────────────────────────┘
```

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
# Version Web
npm run dev

# Version Electron
npm run dev:electron
```

---

## 🚀 Scripts disponibles

```bash
npm run dev           # App web
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
- [x] **Formatage sur sélection** (taille, police, couleur appliqués au texte sélectionné)
- [x] **Détection auto des styles** (indicateur mis à jour selon le curseur)

### À venir 📋

- [ ] Export PDF des livres
- [ ] Intégration images Studio → Livre
- [ ] Mode hors-ligne avec sync
- [ ] App Electron pour Windows

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
