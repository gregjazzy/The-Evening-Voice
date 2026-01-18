# 🌙 La Voix du Soir - Concept

## Vision

Application créative pour enfants permettant de créer des **livres-disques numériques 2.0** - une expérience immersive mêlant lecture, création et technologie.

---

## Les 5 Modes

### 📔 Journal
Le journal intime de l'enfant avec son ami(e) IA (nom personnalisé).
- Écrire ses pensées, secrets, rêves
- Enregistrer des messages vocaux
- Ajouter des photos
- Discuter avec l'IA (bienveillante)
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

**Aide IA intégrée :**
- Chat avec l'IA pour conseils d'écriture
- Les 5 Questions Magiques (Qui, Quoi, Où, Quand, Et alors)
- Guidage visuel : l'IA fait clignoter les boutons pour guider l'enfant

**Output** : Un livre avec des pages qu'on tourne, exportable en PDF, imprimable.

---

### 🎨 Studio
L'atelier de création d'assets avec l'IA.
- Générer des images (Flux 1 Pro via fal.ai)
- Générer des vidéos (Kling 2.1 via fal.ai)
- Générer des voix (ElevenLabs via fal.ai)
- Bibliothèque d'assets réutilisables

---

### 🎬 Montage
Création d'un **livre-disque numérique 2.0**.

Inspiré des livres-disques d'antan (Marlène Jobert, Disney...) mais augmenté avec les technologies modernes.

| Élément | Description |
|---------|-------------|
| 📖 Pages | Importées depuis le mode Écriture |
| 🎙️ Voix | Narration (enfant, parent, ou IA) |
| 🎵 Musique | Ambiance sonore de fond |
| 🔊 Effets | Sons d'ambiance (orage, oiseaux, magie...) |
| ⏱️ Timing | Synchronisation phrase par phrase |
| 🎬 Vidéos | Optionnel - clips animés pour enrichir |

**Deux vues :**
- **Cartes** : Vue simplifiée pour enregistrer/générer les voix
- **Timeline** : Vue avancée avec rubans pour ajuster timing et effets

**Aide IA intégrée :**
- Chat IA dans les deux vues
- Guidage pour enregistrement et synchronisation
- L'IA explique chaque ruban de la Timeline

**Output** : Un livre-disque interactif avec audio synchronisé.

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

| Méthode | Compatible avec | Intégration |
|---------|-----------------|-------------|
| 🍎 **AirPlay** | Apple TV, TV/projecteurs AirPlay 2 | Natif macOS |
| 📺 **Chromecast** | Chromecast, Android TV, Google TV | SDK JavaScript |
| 🔌 **HDMI** | Tout écran/projecteur (câble) | Plein écran + 2ème écran |
| 📡 **DLNA/UPnP** | Smart TV (Samsung, LG, Sony...) | Librairie JS |
| 🏠 **Domotique pro** | Crestron, Control4, Savant... | API selon système |

---

## L'IA-Amie

### Personnalisation

À la première utilisation, l'enfant :
1. **Donne son prénom** → L'IA l'utilisera pour personnaliser
2. **Nomme son IA** → Choix parmi suggestions ou nom libre
3. **Choisit la voix** → Parmi les voix premium du navigateur

### Voix par défaut activée

L'assistant vocal IA est **toujours activé par défaut** :
- L'IA parle automatiquement ses réponses
- L'enfant peut dicter ses messages au micro
- Vitesse de parole adaptée aux enfants (ralentie)

### Guidage visuel

L'IA peut faire **clignoter des éléments** de l'interface pour guider l'enfant :
```
"Pour ajouter une image, clique sur le bouton qui clignote !"
→ Le bouton 📷 se met à briller
```

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
└──────┬──────┘           │
       │                  ├─ Vue Cartes : enregistrer/générer voix
       │                  └─ Vue Timeline : ajuster timing + effets
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

### IA & Création (via fal.ai)
- Gemini 2.0 Flash (IA-Amie - assistant)
- Flux 1 Pro (génération d'images)
- Kling 2.1 (génération de vidéos)
- ElevenLabs (voix IA narration)
- AssemblyAI (transcription voix enregistrées)

### Diffusion & Projection
- AirPlay (natif macOS → Apple TV, TV compatibles)
- Google Cast SDK (Chromecast, Android TV)
- DLNA/UPnP (Smart TV génériques)
- Multi-écran natif (HDMI, écrans externes)

### Domotique
- HomeKit (Philips Hue, HomePod, etc.)
- Extensible vers Crestron, Control4, Savant si besoin

---

## Évolutions Futures (fal.ai)

Grâce à fal.ai, de nouvelles fonctionnalités sont envisageables :

| Fonctionnalité | Modèle fal.ai | Description |
|----------------|---------------|-------------|
| 🎭 **Voix de personnages** | ElevenLabs Voice Design | Créer des voix (sorcière, dragon...) |
| 👄 **Lip-sync** | Sync Labs | Faire parler les personnages |
| 🎵 **Musique générée** | MusicGen | Musique d'ambiance sur mesure |
| 🔊 **Effets sonores** | AudioLDM | Bruitages personnalisés |
| 🎨 **Coloriage IA** | Flux ControlNet | Transformer dessins en illustrations |
