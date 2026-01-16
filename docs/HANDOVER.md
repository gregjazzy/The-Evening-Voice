# 📋 Handover - La Voix du Soir

> Document de passation complet pour la prochaine session de développement

**Date** : 16 janvier 2026  
**Version** : 3.1.0  
**État** : Mode Montage v2 - UX améliorée ✅ Fonctionnel

---

## 🎯 Vision Produit (IMPORTANT)

> **Lire `docs/CONCEPT.md` pour la vision complète**

### Résumé : C'est quoi l'app ?

Application pour enfants permettant de créer des **livres-disques numériques 2.0** - inspirés des livres-disques d'antan (Marlène Jobert, Disney) mais augmentés avec IA et domotique.

### Les 5 Modes

| Mode | Fonction | État |
|------|----------|------|
| 📔 **Journal** | Journal intime avec Luna (IA) | ✅ Fonctionnel |
| ✍️ **Écriture** | Création du livre STATIQUE (texte, images, décos) | ✅ Fonctionnel |
| 🎨 **Studio** | Génération d'assets IA (images, voix, vidéos) | ✅ Existe |
| 🎬 **Montage** | Création du LIVRE-DISQUE (timeline, effets, sync) | ✅ **FONCTIONNEL** |
| 🎭 **Théâtre** | Lecteur immersif avec projection + lumières | 🔧 À développer |

---

## 🆕 Dernières modifications (Session actuelle)

### UX / Navigation
- **Bouton "← Retour"** en mode Timeline pour revenir aux Cartes
- **Bouton "🏠 Home"** en mode Cartes pour fermer le projet
- **Action `closeProject()`** ajoutée au store

### Vue Cartes
- **Remplacement du panneau "Médias"** (inutile) par "📊 État de la scène" :
  - Badge de statut global (✅ Prêt / En cours)
  - État de la voix (durée enregistrée)
  - État de la synchronisation (phrases sync)
  - Compteur d'éléments dans la timeline
  - Bouton rapide vers la Timeline

### Corrections
- Phrases extensibles jusqu'à la zone Outro (plus de limite à la narration)
- Plein écran fonctionne correctement avec `createPortal`

---

## 🎬 MODE MONTAGE v2 - Système "Rubans Magiques"

### Philosophie : Timeline basée sur le TEMPS

> **CHANGEMENT MAJEUR** : La v2 utilise une timeline temporelle classique (en secondes) avec des "rubans" visuels pour chaque élément.

```
Timeline v2 "Rubans Magiques" :
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

**Avantages :**
- Plus flexible pour ajouter intro/outro
- Permet le drag & drop des éléments
- Positionnement précis en pixels
- Sous-lignes automatiques pour éléments superposés

---

## 🏗️ Architecture Montage v2

### Structure des données

```typescript
// Une scène (anciennement "page")
interface MontageScene {
  id: string
  bookPageId: string       // Lien vers la page du livre
  title: string
  text: string
  phrases: string[]        // Texte splitté en phrases
  duration: number         // Durée narration (secondes)
  introDuration: number    // 🆕 Zone intro (secondes)
  outroDuration: number    // 🆕 Zone outro (secondes)
  
  // Pistes (rubans)
  narration: NarrationTrack      // Voix + timings phrases
  mediaTracks: MediaTrack[]      // Vidéos et images
  musicTracks: MusicTrack[]      // Musique de fond
  soundTracks: SoundTrack[]      // Effets sonores
  lightTracks: LightTrack[]      // Lumières HomeKit
  decorationTracks: DecorationTrack[]  // Stickers et décorations
  animationTracks: AnimationTrack[]    // 🆕 Animations de fond
  textEffectTracks: TextEffectTrack[]  // Effets sur le texte
}

// TimeRange commun à toutes les pistes
interface TimeRange {
  startTime: number  // En secondes
  endTime: number    // En secondes
}

// Exemple : MediaTrack
interface MediaTrack {
  id: string
  url: string
  name: string
  type: 'image' | 'video'
  timeRange: TimeRange
  position: { x: number; y: number; width: number; height: number }
  opacity?: number
  fadeIn?: number
  fadeOut?: number
  zIndex?: number
}
```

### Fichiers du Montage v2

```
src/
├── store/
│   └── useMontageStore.ts      # Store Zustand (~1100 lignes)
│                               # Actions : createProject, loadProject,
│                               # closeProject, setIntroDuration, etc.
│
├── hooks/
│   └── useMontageSync.ts       # Synchronisation avec Supabase
│
├── components/
│   └── montage/
│       ├── MontageEditor.tsx   # Éditeur principal (2 vues)
│       │                       # + SceneStatusPanel (état de la scène)
│       │                       # + Boutons Retour/Home
│       ├── TimelineRubans.tsx  # Timeline "Rubans Magiques"
│       ├── PreviewCanvas.tsx   # Prévisualisation temps réel
│       ├── RhythmGame.tsx      # Jeu de sync phrase par phrase
│       ├── KaraokePlayer.tsx   # Affichage karaoké des phrases
│       ├── AddElementModal.tsx # Modal d'ajout d'éléments
│       ├── TrackPropertiesPanel.tsx # Panneau propriétés (draggable)
│       ├── AnimationEffects.tsx    # Rendu des animations
│       └── NarrationPanel.tsx  # Enregistrement/TTS
│
├── lib/
│   └── audio/
│       └── synth-sounds.ts     # Sons synthétiques (Web Audio API)
```

---

## ✅ Fonctionnalités implémentées

### 1. Vue "Cartes" (préparation)
- Liste des scènes avec aperçu
- Texte découpé en phrases numérotées
- Panel narration : enregistrement micro ou TTS
- **Panneau "État de la scène"** 🆕 :
  - Badge de statut (✅ Prêt / En cours)
  - Indicateur voix (durée enregistrée)
  - Indicateur synchronisation (nombre de phrases)
  - Compteur d'éléments (médias, sons, lumières, animations...)
  - Bouton rapide "Aller à la Timeline →"
- **Bouton Home** 🆕 : Fermer le projet et revenir à la sélection

### 2. Vue "Timeline" (montage)

- **Bouton "← Retour"** 🆕 : Revenir à la vue Cartes

#### Timeline "Rubans Magiques"
- **Règle temporelle** avec zoom (60-200 px/seconde)
- **Scroll horizontal** synchronisé (règle + pistes)
- **Tête de lecture** verticale traversant toutes les pistes
- **Clic pour repositionner** la tête de lecture
- **Sous-lignes automatiques** pour éléments superposés
- **Plein écran** via portail React

#### Pistes disponibles
| Piste | Icône | Description |
|-------|-------|-------------|
| Structure | ▶ | Intro / Narration / Outro |
| Phrases | T | Affichage karaoké synchronisé |
| Médias | 🖼 | Images et vidéos positionnables |
| Musique | 🎵 | Musique de fond avec fade |
| Sons | 🔊 | 120+ effets sonores catégorisés |
| Lumières | 💡 | Couleurs HomeKit avec noms |
| Déco | ✨ | Stickers et décorations SVG |
| Anim | 🌟 | Animations (15 localisées + 15 ambiance) |
| Effets | T | Effets texte (glow, shake, etc.) |

#### Rubans interactifs
- **Drag** : Déplacer dans le temps
- **Resize** : Tirer les bords pour ajuster la durée
- **Sélection** : Clic pour voir les propriétés
- **Suppression** : Bouton ❌

### 3. Zones Intro/Outro 🆕
- **Ajout** : Boutons `+` dans le label Structure
- **Durée par défaut** : 3 secondes
- **Redimensionnement** : Drag du bord
- **Suppression** : Bouton ❌
- Les phrases sont décalées automatiquement

### 4. PreviewCanvas 🆕
- **Prévisualisation temps réel** de la scène
- **Drag & Drop** pour positionner les éléments
- **Resize** des médias et décorations
- **Animations visuelles** (étoiles, cœurs, etc.)
- **Karaoké** : phrase active en surbrillance
- **Grille optionnelle** pour alignement
- **Plein écran** via portail React

### 5. Panneau de propriétés 🆕
- **Apparaît** quand un élément est sélectionné
- **Draggable** sur l'écran
- **Propriétés par type** :
  - Médias : position, taille, opacité, fade, z-index
  - Sons/Musique : volume, fade, loop
  - Lumières : couleur, intensité, pulse
  - Animations : position, intensité, vitesse, opacité

### 6. RhythmGame (synchronisation)
- **Phrase par phrase** (plus intuitif que mot par mot)
- L'audio joue, l'enfant tape à la fin de chaque phrase
- Enregistre les `PhraseTiming` avec startTime/endTime
- Possibilité de recommencer

### 7. Bibliothèque de sons
- **7 catégories** : Animaux, Humains, Météo, Nature, Magie, Ambiance, Actions
- **121 sons** organisés en sous-catégories
- **Sons synthétiques** via Web Audio API (fallback)

### 8. Animations
- **15 Effets Localisés** (position XY) :
  - Baguette magique, Explosion de cœurs, Étoiles, Traînée d'étincelles...
- **15 Effets Ambiance** (plein écran) :
  - Étoiles filantes, Cœurs flottants, Neige, Lucioles, Confettis...

### 9. Synchronisation Supabase
- **Chargement** automatique des projets au démarrage
- **Sauvegarde** debounced (500ms) à chaque modification
- **Normalisation** des données anciennes (migration auto)
- **Table** : `montage_projects` avec colonne `scenes` (JSONB)

### 10. Navigation améliorée 🆕

| Vue | Bouton | Action |
|-----|--------|--------|
| **Sélection** | Clic projet | Ouvrir le projet |
| **Cartes** | 🏠 Home | Fermer projet → Sélection |
| **Cartes** | Timeline | Passer en vue Timeline |
| **Timeline** | ← Retour | Revenir aux Cartes |
| **Timeline** | Cartes | Revenir aux Cartes |

**Sauvegarde** : 100% automatique (pas de bouton "Sauvegarder")

---

## 📁 Structure de la base de données

### Table `montage_projects`

```sql
CREATE TABLE montage_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scenes JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Données complètes
  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Stockage des médias

| Type | Stockage | Raison |
|------|----------|--------|
| Images | Supabase Storage | Taille modérée |
| Audio | Supabase Storage | Taille modérée |
| Vidéos | Cloudflare R2 | Gros fichiers, egress gratuit |

---

## 🎨 UI/UX

### Design
- **Thème** : Nuit étoilée (midnight-900, auroras)
- **Police** : Space Grotesk
- **Animations** : Framer Motion
- **Icônes** : Lucide React

### Accessibilité enfant
- **Emojis** pour identifier les pistes
- **Couleurs vives** par type d'élément
- **Boutons larges** pour les actions principales
- **Feedback visuel** immédiat

---

## 🔧 Ce qui reste à faire

### Priorité 1 : Mode Théâtre
- Lecteur plein écran immersif
- Projection (via AirPlay/HDMI)
- Contrôle HomeKit des lumières
- Télécommande depuis autre appareil

### Priorité 2 : Améliorations Montage
| Tâche | Description |
|-------|-------------|
| Export MP4 | Exporter le livre-disque en vidéo |
| Copier/Coller rubans | Faciliter la réutilisation |
| Templates d'effets | Packs d'effets prédéfinis |
| Undo/Redo | Historique des modifications |

### Priorité 3 : Intégrations
| Service | État | Notes |
|---------|------|-------|
| ElevenLabs TTS | 🔧 | Timings automatiques |
| HomeKit | 🔧 | Envoi commandes lumières |
| WebRTC | ✅ | Mode Collab existe |

---

## 🚀 Pour démarrer

```bash
# Installer
npm install

# Dev (web + signaling)
npm run dev
# → http://localhost:3000

# Dev Electron
npm run dev:electron
```

### Tester le mode Montage

1. Aller sur l'app → Mode **Écriture**
2. Créer une histoire avec du texte (2-3 phrases par page)
3. Passer en mode **Montage**
4. Créer un nouveau projet depuis l'histoire
5. Vue **Cartes** : Enregistrer la voix, faire le jeu de rythme
6. Vue **Timeline** : Ajouter intro/outro, médias, sons, animations
7. Prévisualiser avec le bouton **Lire**

---

## 🔑 Configuration

### Variables d'environnement (`.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Google AI (Luna)
GOOGLE_GEMINI_API_KEY=xxx

# Cloudflare R2 (vidéos)
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=lavoixdusoir-videos
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxx.r2.dev

# ElevenLabs (optionnel)
ELEVENLABS_API_KEY=xxx
```

---

## 📊 Récapitulatif de l'état

| Composant | État | Notes |
|-----------|------|-------|
| Store Montage v2 | ✅ | Scènes, pistes, closeProject() |
| Timeline Rubans | ✅ | Zoom, scroll, sous-lignes |
| PreviewCanvas | ✅ | Drag & drop, animations |
| RhythmGame | ✅ | Phrase par phrase |
| KaraokePlayer | ✅ | Affichage synchronisé |
| Zones Intro/Outro | ✅ | Redimensionnables |
| Panneau propriétés | ✅ | Draggable |
| Bibliothèque sons | ✅ | 121 sons catégorisés |
| Animations | ✅ | 30 types (localisés + ambiance) |
| Sync Supabase | ✅ | Debounced, normalisation |
| Panneau État scène | ✅ | 🆕 Remplace le panneau Médias |
| Navigation | ✅ | 🆕 Boutons Retour/Home |
| Mode Théâtre | 🔧 | **À faire** |
| Export MP4 | 🔧 | **À faire** |

---

## 📚 Documentation

| Fichier | Contenu |
|---------|---------|
| `docs/CONCEPT.md` | Vision produit |
| `docs/ARCHITECTURE.md` | Architecture technique |
| `docs/QUICK_START.md` | Guide de démarrage |
| `docs/API.md` | Documentation API |
| `docs/HANDOVER.md` | Ce document |

---

**Bon courage pour la suite !** 🌙✨
