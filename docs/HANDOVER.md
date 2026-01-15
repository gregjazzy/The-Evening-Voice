# 📋 Handover - La Voix du Soir

> Document de passation complet pour la prochaine session de développement

**Date** : 15 janvier 2026  
**Version** : 2.1.0  
**État** : Présentation client finalisée (22 slides), Mode Montage en cours

---

## 🎯 Contexte du Projet

**Client** : Ultra-premium (top 40 fortunes mondiales, ~10 milliards €)  
**Utilisateurs** : 2 filles de 8 ans + 1 mentor à distance  
**Langues** : Français, Anglais, Russe  
**Statut** : **VENDU** - Application commandée et payée

### Ce qu'est l'app

Application Electron/Web/iPad pour enfants permettant de :
- Écrire un journal intime (photos, audio, images IA)
- Créer des histoires illustrées avec structures narratives
- Apprendre le prompting avec Luna (IA-Amie)
- Publier des livres jusqu'à Amazon KDP

### Objectifs pédagogiques (4 piliers)

| Pilier | Description |
|--------|-------------|
| 🎓 **Maîtriser l'IA** | Prompting, Midjourney, Runway, ElevenLabs |
| ✨ **Créer & Imaginer** | Histoires, illustrations, vidéos |
| 📚 **Publier un Livre** | Jusqu'à Amazon Kindle |
| 🖥️ **Maîtriser l'Ordinateur** | Navigation, fichiers, autonomie |

---

## 🎬 PRÉSENTATION CLIENT

### Fichier : `presentation/index.html`

Présentation web style Keynote pour la cliente. **22 slides** au total.

### Lancer la présentation

```bash
cd presentation
python3 -m http.server 3003
# → http://localhost:3003
```

### Navigation
- **Flèches clavier** ← → pour naviguer
- **Points à droite** pour accès direct
- Scroll automatique **désactivé**

### Structure des slides

| # | Titre | Contenu |
|---|-------|---------|
| 1 | La Voix du Soir | Titre + tagline |
| 2 | Pour Vos Filles | **4 colonnes** : IA, Créer, Publier, Ordinateur |
| 3 | Les Objectifs | 6 objectifs avec "Comment" |
| 4 | Luna, l'Amie IA | Présentation de Luna |
| 5-6 | Luna en Action | Création d'images / Écriture |
| 7 | La Philosophie | 5 règles de Luna |
| 8 | 5 Clés Magiques | Synoptique prompting images |
| 9 | 5 Questions Magiques | Synoptique écriture |
| 10 | Parcours de Maîtrise | Niveaux (Explorateur → Maître) |
| 11 | Cinq Univers Créatifs | Les 5 modes |
| 12 | L'Expérience Théâtre | AirPlay + Philips Hue |
| 13 | L'Horizon | Amazon KDP |
| 14-15 | Prompting/Progression | Synoptiques techniques |
| 16-17 | Design Immersif | Métaphore livre, animations |
| 18 | Comment Gemini Fonctionne | Schéma conceptuel |
| 19 | Multimodal | Images, Vidéos, Voix |
| 20 | Tech Stack | Technologies utilisées |
| 21 | Fonctionnalités | Desktop, iPad, Multilingue |
| 22 | Mon Engagement | Garanties personnelles |

### Modifications récentes (session du 15 janvier)

| Changement | Détail |
|------------|--------|
| ✅ Slide 2 refaite | 4 colonnes visuelles, pas de blabla |
| ✅ Slide commercial supprimée | "Prêtes à Créer ?" (déjà vendu) |
| ✅ "Notre" → "Mon" Engagement | Personnel, pas collectif |
| ✅ 3 slides supprimées | Réduction 26 → 22 slides |

### Points d'attention pour la présentation

1. **Pas de discours commercial** — C'est vendu
2. **Émotionnel** — C'est pour ses filles, partage en famille
3. **Technique mais accessible** — Elle connaît l'IA, pas de politique
4. **Jargon technique OK** — Justifie la technicité et le prix

---

## 🎬 MODE MONTAGE - État actuel

### Philosophie : Timeline basée sur le TEXTE

> Contrairement à un éditeur vidéo classique (timeline en secondes), le Montage utilise le **texte comme timeline**.

```
CLASSIQUE (Filmora, Premiere) :
[0s]────[5s]────[10s]────[15s]────[20s]────[25s]

LA VOIX DU SOIR :
[Il][était][une][fois][un][petit][dragon][qui][vivait][...]
 ↑    ↑                    ↑
 │    └─ Musique change    └─ Image apparaît
 └─ Bruitage "vent"
```

### Fichiers du mode Montage

```
src/
├── store/
│   └── useMontageStore.ts      # Store Zustand dédié
│
├── components/
│   └── montage/
│       ├── MontageEditor.tsx   # Éditeur principal
│       ├── TextTimeline.tsx    # Timeline textuelle
│       ├── EffectsPanel.tsx    # Effets texte + médias
│       └── AudioMontagePanel.tsx # Audio (musique, bruitages)
```

### Fonctionnalités implémentées ✅

- TextTimeline (mots cliquables, Shift+Clic multi-select)
- Effets texte (8 types : highlight, glow, fadeIn, shake...)
- Images & Vidéos ancrées sur les mots
- Panneau audio (musique, bruitages, ambiance)
- Enregistrement vocal (MediaRecorder API)
- Sélection/création de projets

### À faire 🔧

| Priorité | Tâche | Description |
|----------|-------|-------------|
| 1 | **RhythmGame** | Jeu de synchronisation voix/texte |
| 2 | **SyncPlayer** | Lecteur qui orchestre tout |
| 3 | **TTS avec timings** | ElevenLabs avec timestamps |
| 4 | **HomeKit** | Commandes lumières pendant lecture |

---

## 📁 Structure du projet

```
lavoixdusoir/
├── presentation/           # 🆕 Présentation client (index.html)
├── docs/                   # Documentation
├── electron/               # App desktop Mac
├── src/
│   ├── app/               # Next.js App Router
│   ├── components/        # Composants React
│   │   ├── modes/         # Journal, Book, Studio, Layout, Theatre
│   │   ├── montage/       # Mode Montage (nouveau)
│   │   └── ...
│   ├── hooks/             # useAI, useTTS, useWebRTC...
│   ├── lib/               # Gemini, Supabase, TTS...
│   └── store/             # Zustand stores
└── supabase/              # Schémas DB
```

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

# ElevenLabs (optionnel)
ELEVENLABS_API_KEY=xxx
```

---

## 🚀 Pour démarrer

```bash
# Installer
npm install

# Dev web
npm run dev
# → http://localhost:3000

# Dev Electron
npm run dev:electron

# Présentation client
cd presentation && python3 -m http.server 3003
# → http://localhost:3003
```

---

## 📊 Récapitulatif de l'état

| Composant | État | Notes |
|-----------|------|-------|
| **Présentation client** | ✅ | 22 slides, prête |
| Mode Journal | ✅ | Fonctionnel |
| Mode Écriture | ✅ | Images flottantes, formatage |
| Mode Studio | ✅ | Intégrations IA |
| Mode Montage | 🔧 | Architecture OK, RhythmGame à faire |
| Mode Théâtre | 🔧 | À développer |

---

## 🎯 Prochaines étapes

### Pour la présentation
- ✅ **Terminée** — Prête pour la cliente

### Pour l'application
1. **RhythmGame** — Synchronisation voix/texte
2. **SyncPlayer** — Lecteur de livre-disque
3. **Export PDF** — Exporter les histoires
4. **Mode Théâtre** — Lecteur immersif

---

## 📚 Documentation

| Fichier | Contenu |
|---------|---------|
| `docs/CONCEPT.md` | Vision produit (livre-disque 2.0) |
| `docs/ARCHITECTURE.md` | Architecture technique |
| `docs/QUICK_START.md` | Guide de démarrage |
| `docs/API.md` | Documentation API |
| `docs/HANDOVER.md` | Ce document |

---

## 🔗 Git

**Repository** : `https://github.com/gregjazzy/The-Evening-Voice.git`

```bash
git clone https://github.com/gregjazzy/The-Evening-Voice.git
git add . && git commit -m "description" && git push origin main
```

---

**Bon courage pour la suite !** 🌙✨
