# 🌙 La Voix du Soir - Concept

## Vision

Application créative pour enfants permettant de créer des **livres-disques numériques 2.0** - une expérience immersive mêlant lecture, création et technologie.

---

## Les 5 Modes

### 📔 Journal
Le journal intime de l'enfant avec Luna, sa copine IA.
- Écrire ses pensées, secrets, rêves
- Enregistrer des messages vocaux
- Ajouter des photos
- Discuter avec Luna (IA bienveillante)
- Sélectionner son humeur du jour

---

### ✍️ Écriture
Création du **livre STATIQUE** - comme un scrapbook premium.

| Élément | Description |
|---------|-------------|
| 📝 Texte | L'histoire avec styles, polices, couleurs |
| 🖼️ Images | Photos, images IA, avec cadres et positions |
| ✨ Décorations | Stickers luxueux (dorés, floraux, royaux...) |
| 🎨 Fonds | Images de fond des pages |
| 📐 Mise en page | Disposition des éléments |

**Output** : Un livre avec des pages qu'on tourne, exportable en PDF, imprimable.

---

### 🎨 Studio
L'atelier de création d'assets avec l'IA.
- Générer des images (Midjourney)
- Générer des vidéos (Runway)
- Générer des voix (ElevenLabs)
- Bibliothèque d'assets réutilisables

---

### 🎬 Montage
Création d'un **livre-disque numérique 2.0**.

Inspiré des livres-disques d'antan (Marlène Jobert, Disney...) mais augmenté avec les technologies modernes.

| Élément | Description |
|---------|-------------|
| 📖 Pages | Importées depuis le mode Écriture |
| 🎙️ Voix | Narration (enfant, parent, ou IA Luna) |
| 🎵 Musique | Ambiance sonore de fond |
| 🔊 Effets | Sons d'ambiance (orage, oiseaux, magie...) |
| ⏱️ Timing | Synchronisation page par page |
| 🎬 Vidéos | Optionnel - clips animés pour enrichir |

**Interface** : Comme Filmora mais ultra simplifié pour enfant.

**Output** : Un livre-disque interactif avec audio synchronisé (et vidéo optionnelle).

---

### 🎭 Théâtre
Le **lecteur/player** de la création finale.
- Lecture du livre-disque créé en mode Montage
- Pages qui défilent au rythme de la narration
- Musique et effets sonores synchronisés
- **Lumières HomeKit synchronisées** (ambiance immersive dans la chambre)
- **Multi-diffusion** vers l'écran/projecteur de son choix
- Mode "histoire du soir" parfait

#### 📺 Diffusion flexible

L'app s'adapte à l'équipement existant - pas besoin d'acheter du matériel spécifique.

**Bouton "Projeter sur..."** avec options :

| Méthode | Compatible avec | Intégration |
|---------|-----------------|-------------|
| 🍎 **AirPlay** | Apple TV, TV/projecteurs AirPlay 2 | Natif macOS |
| 📺 **Chromecast** | Chromecast, Android TV, Google TV | SDK JavaScript |
| 🔌 **HDMI** | Tout écran/projecteur (câble) | Plein écran + 2ème écran |
| 📡 **DLNA/UPnP** | Smart TV (Samsung, LG, Sony...) | Librairie JS |
| 🏠 **Domotique pro** | Crestron, Control4, Savant... | API selon système |

```
┌─────────────────────────────────┐
│  📺 Projeter sur...             │
│                                 │
│  ○ AirPlay - Salon Apple TV     │
│  ○ AirPlay - Chambre Emma       │
│  ○ Chromecast - Projecteur      │
│  ○ Plein écran (cet appareil)   │
│  ○ Écran externe (HDMI)         │
│                                 │
│  [ Lancer la projection ]       │
└─────────────────────────────────┘
```

#### 📽️ Scénarios de projection

**Chambre avec projecteur plafond :**
- Projection au plafond, l'enfant regarde depuis son lit

**Chambre avec TV :**
- AirPlay/Cast vers la TV murale

**Salon familial :**
- Sur la grande TV, toute la famille regarde ensemble

**N'importe où :**
- Mode plein écran sur iPad/Mac, casque audio

L'enfant s'endort en regardant son histoire projetée, bercé par la narration et la musique, avec les lumières de la chambre qui suivent l'ambiance... ✨

---

## Workflow Typique

```
┌─────────────┐
│   Studio    │  ← Créer les assets IA (images, voix, vidéos)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Écriture   │  ← Composer le livre (texte, images, décos)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Montage   │  ← Ajouter audio + timing (livre-disque)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Théâtre   │  ← Lire l'histoire avec immersion totale
└─────────────┘
```

---

## Différence clé : Écriture vs Montage

| Aspect | Écriture | Montage |
|--------|----------|---------|
| **Nature** | STATIQUE | DYNAMIQUE |
| **Métaphore** | Scrapbook | Filmora simplifié |
| **Contenu** | Texte, images, décos | Audio, timing, (vidéos) |
| **Output** | Livre (pages) | Livre-disque (expérience) |
| **Inspiration** | Livre illustré classique | Livre-disque vinyle/cassette |

---

## Expérience Immersive (Théâtre + HomeKit + Projection)

Quand l'enfant lance son histoire en mode Théâtre :
1. 📺 **Projection** sur l'écran de son choix (AirPlay, Chromecast, HDMI, TV...)
2. 💡 Les **lumières HomeKit** s'adaptent à l'ambiance (nuit → bleu doux, forêt → vert...)
3. 🎙️ La **voix** raconte l'histoire
4. 📖 Les **pages** tournent automatiquement
5. 🎵 La **musique** crée l'atmosphère
6. → **Magie de l'histoire du soir** ✨

### Setup chambre - Flexible selon équipement existant

```
┌─────────────────────────────────────┐
│          PLAFOND / MUR              │
│     ┌──────────────────┐            │
│     │  📽️ Projection   │  ← Projecteur, TV, ou écran existant
│     │  de l'histoire   │    (AirPlay, Chromecast, HDMI...)
│     └──────────────────┘            │
│                                     │
│  💡 Lumières      💡 Lumières       │  ← HomeKit ou autre domotique
│     connectées       connectées     │
│                                     │
│         🛏️ Lit enfant               │
│                                     │
│              📱 iPad/Mac            │
│          (contrôle principal)       │
└─────────────────────────────────────┘
```

**L'app s'adapte à l'infrastructure existante** - aucun achat spécifique requis.

---

## Public Cible

- **Enfants** : 4-10 ans (création guidée, interface simple)
- **Parents/Mentors** : Supervision, aide, partage du moment
- **Mode Collab** : Parent et enfant créent ensemble à distance

---

## Technologies

### Core
- Next.js 14 + TypeScript
- Electron (app desktop macOS)
- Supabase (auth, DB, storage)
- Cloudflare R2 (vidéos)

### IA & Création
- Gemini 2.0 Flash (Luna - assistant IA)
- Midjourney (génération d'images)
- ElevenLabs (voix IA)
- Runway (génération de vidéos)

### Diffusion & Projection
- AirPlay (natif macOS → Apple TV, TV compatibles)
- Google Cast SDK (Chromecast, Android TV)
- DLNA/UPnP (Smart TV génériques)
- Multi-écran natif (HDMI, écrans externes)

### Domotique
- HomeKit (Philips Hue, HomePod, etc.)
- Extensible vers Crestron, Control4, Savant si besoin
