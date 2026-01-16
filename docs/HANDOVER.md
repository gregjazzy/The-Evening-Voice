# 📋 Handover - La Voix du Soir

> Document de passation complet pour la prochaine session de développement

**Date** : 16 janvier 2026  
**Version** : 3.2.0  
**État** : IA personnalisable ✅ + Mode Publication Gelato ✅

---

## 🎯 Vision Produit (IMPORTANT)

> **Lire `docs/CONCEPT.md` pour la vision complète**

### Résumé : C'est quoi l'app ?

Application pour enfants permettant de créer des **livres-disques numériques 2.0** - inspirés des livres-disques d'antan (Marlène Jobert, Disney) mais augmentés avec IA et domotique.

### Les 5 Modes (Journal supprimé)

| Mode | Fonction | État |
|------|----------|------|
| ✍️ **Écriture** | Création du livre STATIQUE (texte, images, décos) | ✅ Complet |
| 🎨 **Studio** | Création d'assets via outils externes | ⚠️ Pont Safari |
| 🎬 **Montage** | Création du LIVRE-DISQUE (timeline, effets, sync) | ✅ Complet |
| 🎭 **Théâtre** | Lecteur immersif avec projection + lumières | ⚠️ Données non connectées |
| 📖 **Publier** | Publication livre imprimé via Gelato | ✅ Complet |

---

## 🆕 Dernières modifications (Session actuelle)

### IA Personnalisable (Plus de "Luna")
- **Nom choisi par l'enfant** à la première connexion
- **Modal `AINameModal`** avec suggestions de prénoms
- **Persistance** dans Supabase (`profiles.ai_name`)
- **Modification** possible via menu utilisateur
- **Toutes les références "Luna"** remplacées par le nom choisi

### Mode Publication (Gelato)
- **6 étapes** : Sélection → Format → Couverture → Aperçu → Qualité → Commande
- **Formats** : Carré (21×21), A5, A4
- **Couverture** : Titre, auteur, couleur de fond, image
- **API Gelato** : Devis en temps réel + passage de commande
- **Routes API** : `/api/gelato/quote` et `/api/gelato/order`

### Suppressions
- ❌ **Mode Journal** supprimé (demande cliente)
- ❌ **Référence "Luna"** supprimée partout

---

## 🔴 PROBLÈME MAJEUR : Données non connectées

### 3 systèmes de données séparés

```
Mode Écriture   →   useAppStore     →   projects[] + chapters[]
Mode Montage    →   useMontageStore →   projects[] + scenes[]
Mode Théâtre    →   useLayoutStore  →   books[] + pages[]    ← VIDE !
```

### Le flux logique devrait être

```
📝 Écriture → 🎨 Studio → 🎬 Montage → 🎭 Théâtre
   (texte)    (assets)    (assemblage)  (lecture)
```

### Ce qui fonctionne actuellement

```
Écriture ────────────────────────────→ Montage ✅ (fonctionne)
            ↓
         Studio ─ · · · · · · · · · → Montage ❓ (assets non connectés)
                                          ↓
                                      Théâtre ❌ (lit useLayoutStore qui est VIDE)
```

### Corrections nécessaires

| Tâche | Description | Effort |
|-------|-------------|--------|
| **Studio → Montage** | Ajouter "Utiliser dans Montage" pour les assets | 1h |
| **Montage → Théâtre** | Théâtre lit `useMontageStore.projects` | 2h |
| **Supprimer useLayoutStore** | N'est plus utile | 30min |

---

## 🎬 MODE MONTAGE v2 - Système "Rubans Magiques"

### Philosophie : Timeline basée sur le TEMPS

> La v2 utilise une timeline temporelle classique (en secondes) avec des "rubans" visuels pour chaque élément.

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

### Fichiers du Montage v2

```
src/
├── store/
│   └── useMontageStore.ts      # Store Zustand (~1100 lignes)
│
├── hooks/
│   └── useMontageSync.ts       # Synchronisation avec Supabase
│
├── components/
│   └── montage/
│       ├── MontageEditor.tsx   # Éditeur principal (2 vues)
│       ├── TimelineRubans.tsx  # Timeline "Rubans Magiques"
│       ├── PreviewCanvas.tsx   # Prévisualisation temps réel
│       ├── RhythmGame.tsx      # Jeu de sync phrase par phrase
│       ├── KaraokePlayer.tsx   # Affichage karaoké des phrases
│       ├── AddElementModal.tsx # Modal d'ajout d'éléments
│       ├── TrackPropertiesPanel.tsx # Panneau propriétés
│       ├── AnimationEffects.tsx    # Rendu des animations
│       └── NarrationPanel.tsx  # Enregistrement/TTS
```

---

## 📖 MODE PUBLIER - Intégration Gelato

### Fichiers de la Publication

```
src/
├── store/
│   └── usePublishStore.ts      # Store Zustand
│
├── components/
│   └── modes/
│       └── PublishMode.tsx     # Composant principal (~1500 lignes)
│
├── lib/
│   └── gelato/
│       ├── types.ts            # Types Gelato
│       ├── client.ts           # Fonctions client
│       └── index.ts            # Export
│
├── app/
│   └── api/
│       └── gelato/
│           ├── quote/route.ts  # API devis
│           └── order/route.ts  # API commande
```

### Flux de publication

1. **Sélection** : Choisir une histoire complète
2. **Format** : Carré (21×21), A5, A4
3. **Couverture** : Titre, auteur, couleur, image
4. **Aperçu** : Prévisualisation pages + couverture
5. **Qualité** : Vérifications automatiques
6. **Commande** : Devis Gelato → Paiement → Confirmation

---

## 🤖 IA PERSONNALISABLE

### Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `src/store/useAppStore.ts` | Ajout `aiName` + `setAiName` |
| `src/lib/ai/gemini.ts` | Fonctions avec paramètre `aiName` |
| `src/lib/ai/elevenlabs.ts` | Renommé `luna` → `ai_friend` |
| `src/hooks/useSupabaseSync.ts` | Sync `aiName` avec Supabase |
| `src/hooks/useAI.ts` | Passe `aiName` au chat |
| `src/app/api/ai/chat/route.ts` | Reçoit `aiName` dans le body |
| `src/components/ui/AINameModal.tsx` | Nouveau composant |
| `src/components/ui/UserMenu.tsx` | Bouton "Mon amie IA" |
| `src/components/ClientLayout.tsx` | Affiche modal première connexion |
| `messages/*.json` | Placeholder `{aiName}` + nouvelles clés |
| `supabase/schema.sql` | Colonne `ai_name` dans `profiles` |

### Migration Supabase

```sql
-- Migration à exécuter si base existante
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_name TEXT;
```

---

## 🎨 MODE STUDIO - État actuel

### ⚠️ C'est un "Pont Safari", pas un générateur

Le Studio aide à créer des prompts puis ouvre Safari vers :
- **Midjourney** (images) - Discord
- **ElevenLabs** (voix) - Site web
- **Runway** (vidéos) - Site web

L'enfant doit ensuite importer manuellement les créations via le dropzone.

### Amélioration possible

Intégrer directement l'API ElevenLabs pour la génération de voix (payant mais pratique).

---

## 🎭 MODE THÉÂTRE - État actuel

### ⚠️ Données non connectées

Le Théâtre lit `useLayoutStore.books` qui est **toujours vide** car :
- Le mode Écriture utilise `useAppStore.projects`
- Le mode Montage utilise `useMontageStore.projects`
- Rien ne remplit `useLayoutStore.books`

### Correction nécessaire

Modifier `TheaterMode.tsx` pour lire depuis `useMontageStore` :
```typescript
// Actuellement
const { books } = useLayoutStore()
const completedBooks = books.filter((b) => b.isComplete)

// Devrait être
const { projects } = useMontageStore()
const completedProjects = projects.filter((p) => p.isComplete)
```

---

## ✅ Fonctionnalités implémentées

### Mode Écriture
- [x] Vue livre ouvert (2 pages côte à côte)
- [x] Mode zoom bidirectionnel
- [x] Texte aligné sur les lignes
- [x] Gestion des chapitres
- [x] Formatage (taille, police, couleur)
- [x] Images flottantes avec rotation
- [x] Fond de page (image/vidéo avec opacité/zoom)
- [x] Décorations premium (60+ ornements SVG)
- [x] Effet de luminosité (glow)
- [x] Menu d'édition déplaçable

### Mode Montage
- [x] Timeline "Rubans Magiques" avec zoom
- [x] Drag & drop des éléments
- [x] Zones Intro/Outro redimensionnables
- [x] PreviewCanvas avec animations
- [x] RhythmGame phrase par phrase
- [x] 121 sons catégorisés
- [x] 30 animations (localisées + ambiance)
- [x] Panneau de propriétés draggable
- [x] Synchronisation Supabase debounced

### Mode Publication
- [x] 3 formats de livre (Carré, A5, A4)
- [x] Design de couverture
- [x] Prévisualisation
- [x] Vérifications qualité
- [x] Intégration API Gelato
- [x] Devis en temps réel
- [x] Passage de commande

### IA
- [x] Nom personnalisable par l'enfant
- [x] Modal de choix à la première connexion
- [x] Modification via menu utilisateur
- [x] Persistance Supabase
- [x] Prompts dynamiques avec le nom choisi

---

## 🔧 Ce qui reste à faire

### Priorité 1 : Connecter les modes

| Tâche | Description | Effort |
|-------|-------------|--------|
| **Studio → Montage** | Bouton "Utiliser dans Montage" | 1h |
| **Montage → Théâtre** | Théâtre lit useMontageStore | 2h |
| **Supprimer useLayoutStore** | N'est plus nécessaire | 30min |

### Priorité 2 : Exports

| Tâche | Description | Effort |
|-------|-------------|--------|
| **Export PDF** | Pour l'impression (300 DPI) | 4h |
| **Export MP4** | Le livre-disque en vidéo | 6h |

### Priorité 3 : Intégrations

| Service | État | Notes |
|---------|------|-------|
| **ElevenLabs TTS** | 🔧 | Intégration directe (payant) |
| **HomeKit réel** | 🔧 | Contrôle des lumières Hue |
| **AirPlay** | 🔧 | Projection vers TV |

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

### Tester l'app

1. **Écriture** : Créer une histoire avec du texte et des décos
2. **Montage** : Créer un projet, enregistrer la voix, ajouter des effets
3. **Publier** : Sélectionner l'histoire, configurer, voir le devis Gelato

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

# Gelato (publication)
GELATO_API_KEY=xxx
GELATO_TEST_MODE=true

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
| Mode Écriture | ✅ | Complet |
| Mode Studio | ⚠️ | Pont Safari (pas d'intégration directe) |
| Mode Montage | ✅ | Timeline v2 complète |
| Mode Théâtre | ⚠️ | Lit le mauvais store (vide) |
| Mode Publier | ✅ | Gelato intégré |
| IA personnalisable | ✅ | Nom choisi par l'enfant |
| Sync Supabase | ✅ | Debounced, normalisation |
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

**Bon courage pour la suite !** 🌙✨
