# 📋 Handover - La Voix du Soir

> Document de passation complet pour la prochaine session de développement

**Date** : 14 janvier 2026  
**Version** : 2.0.0  
**État** : Mode Montage en cours - Architecture posée, fonctionnalités de base OK

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
| 🎨 **Studio** | Génération d'assets IA (images, voix, vidéos) | ✅ Existe (intégrations à vérifier) |
| 🎬 **Montage** | Création du LIVRE-DISQUE (audio + timing) | 🔧 **EN COURS** |
| 🎭 **Théâtre** | Lecteur immersif avec projection + lumières | 🔧 À développer |

---

## 🎬 MODE MONTAGE - Ce qui a été fait

### Philosophie : Timeline basée sur le TEXTE

> **IMPORTANT** : Contrairement à un éditeur vidéo classique (timeline en secondes), le Montage utilise le **texte comme timeline**.

```
CLASSIQUE (Filmora, Premiere) :
[0s]────[5s]────[10s]────[15s]────[20s]────[25s]

LA VOIX DU SOIR :
[Il][était][une][fois][un][petit][dragon][qui][vivait][...]
 ↑    ↑                    ↑
 │    └─ Musique change    └─ Image apparaît
 └─ Bruitage "vent"
```

**Pourquoi ?**
- Plus intuitif pour un enfant
- Le rythme suit la voix, pas un chronomètre
- Permet de synchroniser après l'enregistrement (RhythmGame)

### Architecture des fichiers créés

```
src/
├── store/
│   └── useMontageStore.ts      # Store Zustand dédié au montage
│
├── components/
│   └── montage/
│       ├── index.ts            # Exports
│       ├── MontageEditor.tsx   # Éditeur principal
│       ├── TextTimeline.tsx    # Timeline textuelle (les mots cliquables)
│       ├── EffectsPanel.tsx    # Panneau d'effets (texte, médias, sons)
│       └── AudioMontagePanel.tsx # Panneau audio (musique, bruitages, ambiance)
```

### Le Store (`useMontageStore.ts`)

Types principaux :

```typescript
// Un projet de montage
interface MontageProject {
  id: string
  storyId: string          // Lien vers l'histoire (mode Écriture)
  title: string
  pages: MontagePage[]
  createdAt: Date
  updatedAt: Date
}

// Une page de montage
interface MontagePage {
  id: string
  text: string             // Texte nettoyé (sans HTML)
  words: string[]          // Texte splitté en mots
  narration: NarrationTrack
  textEffects: TextEffect[]
  mediaTriggers: MediaTrigger[]
  soundTriggers: SoundTrigger[]
  musicTrack?: MusicTrack
  lightTriggers: LightTrigger[]
}

// Ancrage sur les mots
interface MediaTrigger {
  appearAtWord: number     // -1 = avant le texte
  disappearAtWord?: number // undefined = reste jusqu'à la fin
  // ...
}
```

**Fonctionnalités clés du store :**
- ✅ `stripHtml()` : Nettoie le HTML importé de l'Écriture
- ✅ Migration automatique des anciens projets (au chargement)
- ✅ Sélection multi-mots (`selectedWordIndex` + `selectedWordEndIndex`)
- ✅ CRUD pour tous les types (effets, médias, sons, lumières)

### Fonctionnalités implémentées

#### 1. TextTimeline ✅
- Affiche le texte mot par mot
- Chaque mot est cliquable
- **Shift+Clic** pour sélectionner une plage de mots
- Indicateurs visuels des ancres (points colorés sous les mots)
- Marqueurs "Avant" et "Après" le texte

#### 2. Sélection de projet ✅
- Liste des projets de montage existants
- Création depuis une histoire existante (mode Écriture)
- Suppression de projets

#### 3. Effets sur le texte ✅
- 8 types : highlight, glow, fadeIn, fadeOut, scale, shake, colorChange, typewriter
- Application sur un mot OU une plage de mots
- Interface avec emojis pour les enfants

#### 4. Images & Vidéos ✅
- Upload de fichiers
- Ancrage sur les mots (apparaît au mot X, disparaît au mot Y)
- Opacité réglable
- Options vidéo : loop, muted

#### 5. Panneau Audio ✅
- **Musique** : Upload + segments avec changement à certains mots
- **Bruitages** : Sons ponctuels ancrés sur des mots
- **Ambiance** : Sons continus (forêt, pluie, mer...)
- Pour chaque son : volume, fade in/out, loop, début/fin

#### 6. Enregistrement vocal ✅
- Utilise MediaRecorder API
- Timer pendant l'enregistrement
- Lecture de l'enregistrement
- Suppression pour recommencer
- Message d'erreur si micro bloqué

---

## 🔧 CE QUI RESTE À FAIRE (Montage)

### Priorité 1 : Synchronisation voix/texte

Le bouton **"Synchroniser avec le texte"** n'est pas fonctionnel.

#### Option A : RhythmGame (synchronisation manuelle)
Pour les voix enregistrées (enfant, parent).

```
┌─────────────────────────────────────────────────────────┐
│  🎮 Jeu de Rythme - Clique sur chaque mot !             │
│                                                         │
│        Il  était  une  fois  un  petit  dragon          │
│        ──                                               │
│        ↑                                                │
│   [ En attente... ]                                     │
│                                                         │
│   🔊 Audio: ▶ ─────●────────────────────────── 0:03     │
│                                                         │
│   Clique sur le mot quand tu l'entends !                │
└─────────────────────────────────────────────────────────┘
```

**À implémenter :**
1. Lecture de l'audio enregistré
2. L'enfant clique sur chaque mot quand il l'entend
3. Enregistrement des `wordTimings` (startTime, endTime)
4. Possibilité de recommencer si erreur

#### Option B : TTS avec timings (synchronisation auto)
Pour les voix IA (Luna, ElevenLabs).

**À implémenter :**
1. Appeler ElevenLabs avec l'option `with_timestamps`
2. Parser la réponse pour extraire les timings par mot
3. Stocker dans `wordTimings`

### Priorité 2 : SyncPlayer (Lecteur synchronisé)

Le lecteur qui joue le livre-disque avec tous les éléments synchronisés.

**À implémenter :**
1. Lecture de l'audio de narration
2. Mise à jour du `currentPlaybackTime`
3. Affichage du mot courant (highlight)
4. Déclenchement des effets texte au bon moment
5. Apparition/disparition des médias
6. Play/pause des sons et musique
7. (Optionnel) Envoi des commandes HomeKit

### Priorité 3 : Améliorations UX

| Tâche | Description |
|-------|-------------|
| **Preview Canvas amélioré** | Afficher les médias avec leurs effets réels |
| **Drag & Drop** | Glisser des fichiers sur les mots |
| **Position des médias** | Interface pour positionner images/vidéos sur le canvas |
| **Export** | Sauvegarder le projet finalisé |

### Priorité 4 : Intégration TTS

| Source | État | Notes |
|--------|------|-------|
| Luna (macOS TTS) | 🔧 | Utiliser `useTTS.ts` existant |
| ElevenLabs | 🔧 | Intégration existante dans `elevenlabs.ts` |
| Web Speech API | 🔧 | Fallback navigateur |

---

## 📁 Fichiers clés du projet

### Stores
| Fichier | Rôle |
|---------|------|
| `src/store/useAppStore.ts` | État global (stories, diary, chat...) |
| `src/store/useMontageStore.ts` | **État mode Montage** |
| `src/store/useLayoutStore.ts` | Ancien store Layout (plus utilisé pour le montage) |
| `src/store/useStudioStore.ts` | État mode Studio |

### Mode Montage
| Fichier | Rôle |
|---------|------|
| `src/components/montage/MontageEditor.tsx` | Composant principal |
| `src/components/montage/TextTimeline.tsx` | Timeline textuelle |
| `src/components/montage/EffectsPanel.tsx` | Effets texte + médias |
| `src/components/montage/AudioMontagePanel.tsx` | Musique + bruitages + ambiance |
| `src/components/modes/LayoutMode.tsx` | Wrapper qui affiche MontageEditor |

### Hooks utiles
| Fichier | Rôle |
|---------|------|
| `src/hooks/useMediaUpload.ts` | Upload médias (Supabase + R2) |
| `src/hooks/useTTS.ts` | Text-to-Speech |
| `src/hooks/useAI.ts` | Interactions avec Luna/Gemini |

### API Routes
| Route | Fonction |
|-------|----------|
| `src/app/api/ai/voice/route.ts` | Génération voix IA |
| `src/app/api/upload/video/route.ts` | Upload vidéo vers R2 |

---

## 💡 Points d'attention

### 1. Nettoyage HTML
Le texte importé de l'Écriture peut contenir des balises HTML (`<p>`, `<br>`, etc.).
La fonction `stripHtml()` dans `useMontageStore.ts` nettoie automatiquement.
Une migration automatique nettoie les anciens projets au chargement.

### 2. Sélection multi-mots
Pour appliquer un effet sur plusieurs mots :
1. Clic sur le premier mot
2. Shift+Clic sur le dernier mot
3. L'effet s'applique à toute la plage

### 3. Ancrage "Avant le texte"
Index `-1` = l'élément démarre avant que la narration commence.
Utile pour : musique d'intro, ambiance qui s'installe.

### 4. Persistance
Le store utilise `zustand/persist` avec localStorage.
Seuls les `projects` sont persistés, pas l'état UI.

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
2. Créer une histoire avec du texte
3. Passer en mode **Montage**
4. Créer un nouveau projet depuis l'histoire
5. Tester : sélection de mots, ajout d'effets, enregistrement vocal

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

## 📚 Documentation

| Fichier | Contenu |
|---------|---------|
| `docs/CONCEPT.md` | Vision produit (les 5 modes, livre-disque, projection) |
| `docs/ARCHITECTURE.md` | Architecture technique |
| `docs/QUICK_START.md` | Guide de démarrage |
| `docs/API.md` | Documentation API |
| `docs/HANDOVER.md` | Ce document |

---

## 🎯 Pour le prochain chat

### Objectif immédiat : RhythmGame

Créer le jeu de synchronisation pour permettre à l'enfant de cliquer sur les mots pendant que l'audio joue.

**Fichier à créer** : `src/components/montage/RhythmGame.tsx`

**Specs** :
1. Modal plein écran
2. Affiche les mots en gros
3. Highlight le mot actuel pendant la sync
4. Bouton pour démarrer l'audio
5. Détection des clics et enregistrement des timings
6. Possibilité de recommencer
7. Validation et sauvegarde

### Après le RhythmGame : SyncPlayer

**Fichier à créer** : `src/components/montage/SyncPlayer.tsx`

Le lecteur qui orchestre tout :
- Audio
- Mots qui s'illuminent
- Médias qui apparaissent/disparaissent
- Sons qui se déclenchent
- (Plus tard) Lumières HomeKit

---

## 📊 Récapitulatif de l'état

| Composant | État | Notes |
|-----------|------|-------|
| Store Montage | ✅ | Complet avec types et actions |
| TextTimeline | ✅ | Multi-select, ancres visuelles |
| EffectsPanel | ✅ | Texte, médias, sons |
| AudioMontagePanel | ✅ | Musique, bruitages, ambiance |
| Enregistrement vocal | ✅ | MediaRecorder API |
| Sélection projet | ✅ | Création, chargement, suppression |
| RhythmGame | 🔧 | **À faire** |
| SyncPlayer | 🔧 | **À faire** |
| TTS avec timings | 🔧 | À intégrer |
| HomeKit | 🔧 | À intégrer |

---

**Bon courage pour la suite !** 🌙✨

