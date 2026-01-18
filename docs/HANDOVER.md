# 📋 Handover - La Voix du Soir

> Document de passation complet pour la prochaine session de développement

**Date** : 18 janvier 2026  
**Version** : 4.1.0  
**État** : Production-Ready ✅

---

## 🎯 Vision Produit

> **Lire `docs/CONCEPT.md` pour la vision complète**

### Résumé

Application pour **filles de 8 ans** permettant de créer des **livres-disques numériques 2.0** - inspirés des livres-disques d'antan (Marlène Jobert, Disney) mais augmentés avec IA et domotique.

**Cliente** : Multimilliardaire avec commande spéciale. Budget non limité.

### Les 5 Modes

| Mode | Fonction | État |
|------|----------|------|
| ✍️ **Écriture** | Création du livre STATIQUE (texte, images, décos) | ✅ Complet |
| 🎨 **Studio** | Apprentissage progressif du prompting (Midjourney/Runway) | ✅ Complet |
| 🎬 **Montage** | Création du LIVRE-DISQUE (timeline, effets, sync) | ✅ Complet |
| 🎭 **Théâtre** | Lecteur immersif + export vidéo HD | ✅ Complet |
| 📖 **Publier** | Publication livre imprimé via Gelato + PDF | ✅ Complet |

### Flux Logique

```
📝 Écriture → 🎨 Studio → 🎬 Montage → 🎭 Théâtre
   (texte)    (assets)    (assemblage)  (lecture)
                              ↓
                         📖 Publier + Export MP4/PDF
```

---

## ✅ Ce qui est FAIT (Session 18 janvier)

### 🎨 Personnalisation des Phrases (Nouveau !)

Chaque phrase du texte peut maintenant être personnalisée individuellement :

| Propriété | Options | Description |
|-----------|---------|-------------|
| **Position** | Haut, Centre, Bas, Libre | Où afficher la phrase à l'écran |
| **Taille** | Petit, Moyen, Grand, Très grand | Taille de la police |
| **Couleur** | 8 prédéfinies + personnalisée | Couleur du texte |
| **Fond** | Optionnel | Couleur de fond semi-transparente |
| **Animation** | Fondu, Glissement, Zoom, Machine à écrire | Animation d'entrée |
| **Volume Audio** | 0% - 150% | Volume individuel de la phrase |

**Usage :** Cliquer sur une phrase dans la timeline → Panneau de propriétés

### 🎵 Améliorations Audio

| Fonctionnalité | Description |
|----------------|-------------|
| **Fade In/Out** | Sons et musiques supportent les fondus progressifs |
| **Volume par phrase** | Chaque phrase peut avoir son propre volume (combiné avec volume global) |
| **Synchronisation** | Volume mis à jour en temps réel pendant la lecture |

### 🔧 Corrections Timeline

| Correction | Description |
|------------|-------------|
| **Playhead scroll** | La tête de lecture suit correctement le scroll horizontal |
| **Panneau propriétés** | Visible même en mode plein écran (portal + z-index 10000) |
| **Sélection phrases** | Clic sur phrase ouvre le panneau de style (pas seulement volume narration) |

### 📦 Structure des Types (PhraseTiming)

```typescript
interface PhraseTiming {
  id: string
  text: string
  index: number
  timeRange: TimeRange        // Position sur la timeline
  audioTimeRange?: TimeRange  // Position dans l'audio original
  style?: PhraseStyle         // Style d'affichage ✨
  volume?: number             // Volume audio (0-1.5) ✨
}

interface PhraseStyle {
  position: 'top' | 'center' | 'bottom' | 'custom'
  customPosition?: { x: number; y: number }
  fontSize: 'small' | 'medium' | 'large' | 'xlarge'
  color: string
  backgroundColor?: string
  animation?: 'fade' | 'slide' | 'zoom' | 'typewriter'
}
```

---

## ✅ Ce qui est FAIT (Session 17 janvier)

### 1. 🔗 Connexion des Modes

| Connexion | État | Description |
|-----------|------|-------------|
| **Studio → Montage** | ✅ | Assets créés dans Studio visibles dans Montage |
| **Montage → Théâtre** | ✅ | Projets terminés lisibles dans Théâtre |
| **useLayoutStore** | ✅ | Supprimé (code mort) |

### 2. ☁️ Upload vers Cloud

| Type | Service | État |
|------|---------|------|
| **Images** | Supabase Storage | ✅ |
| **Audio** | Supabase Storage | ✅ |
| **Vidéos** | Cloudflare R2 | ✅ |

### 3. 📤 Exports

| Export | Service | Qualité |
|--------|---------|---------|
| **PDF** | jspdf + html2canvas | 300 DPI, impression pro |
| **MP4** | Mux | 4K, H.264, compatible tout |

### 4. 🔐 Administration Multi-Famille

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN PANEL                         │
│  (Pour vous - gère TOUTES les familles)                     │
├─────────────────────────────────────────────────────────────┤
│  🏠 Familles                                                │
│  ├── 👨‍👩‍👧‍👦 Famille Rothschild                                │
│  │   ├── 🔑 Clés API (ElevenLabs, Gemini, etc.)            │
│  │   ├── 👥 Membres (parents + enfants)                     │
│  │   └── 🎤 Voix par défaut                                 │
│  └── 👨‍👩‍👧 Famille [Autre Client]                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PARENT PANEL                              │
│  (Dans l'app - gère SA famille)                             │
├─────────────────────────────────────────────────────────────┤
│  [Membres] [✨ Créations] [Configuration]                   │
│                                                              │
│  Membres : Ajouter/supprimer enfants + invitations          │
│  Créations : Voir histoires et montages des enfants         │
│  Configuration : Modifier les clés API (avec garde-fous)    │
└─────────────────────────────────────────────────────────────┘
```

**Tables Supabase ajoutées :**
- `families` - Liste des familles clientes
- `family_config` - Clés API et voix par famille
- `family_members` - Membres (parent/enfant) + invitations
- `super_admins` - Vous (gestionnaire)

### 5. 🎵 Bibliothèque Sonore

| Type | Nombre | Taille |
|------|--------|--------|
| **Ambiances** | 16 | Nature, ville, féérie... |
| **Effets** | 70 | Super-héros, animaux, magie... |
| **Musiques** | 12 | Classique, aventure, mystère... |
| **Total** | 98 | ~143 MB (compressés MP3) |

**Organisation :**
```
public/sound/
├── ambiances/     # 16 fichiers
├── effects/       # 70 fichiers (catégorisés par thème)
└── music/         # 12 fichiers

src/lib/sounds/
├── catalog.ts     # Métadonnées complètes
└── index.ts       # Export + helpers
```

### 6. 🖼️ Background Removal

- **Bibliothèque** : `@imgly/background-removal`
- **Avantages** : Client-side, gratuit, privé
- **Intégré** : Studio (assets importés)

### 7. ✨ Guidage IA Visuel

```typescript
// L'IA peut maintenant guider visuellement !
// Dans sa réponse :
"Clique sur le bouton qui clignote ! [HIGHLIGHT:nav-montage]"

// → Le bouton "Montage" dans la sidebar va clignoter en doré
```

**Éléments highlightables :**
- `nav-book`, `nav-studio`, `nav-montage`, `nav-theater`, `nav-publish`
- `montage-add-media`, `montage-add-music`, `montage-add-sound`

### 8. 🎤 Voix Améliorées

#### IA-Amie (Chat)
- **Service** : Apple Voice (Web Speech API)
- **Avantage** : Instantané, hors-ligne, gratuit
- **Sélecteur** : L'enfant peut choisir la voix
- **Fallback** : 10 messages variés si IA indisponible

#### Narration (Histoires)
- **Service** : ElevenLabs
- **21 voix** : 7 par langue (FR, EN, RU)
- **Sélecteur** : Avec aperçu audio
- **Fallback** : Apple Voice si ElevenLabs KO

### 9. 🌐 Mode Hors-Ligne

```
┌─────────────────────────────────────────┐
│ 📵 Pas de connexion ?                   │
│                                         │
│ ✅ TTS fonctionne (Apple Voice)         │
│ ✅ Écriture fonctionne (local)          │
│ ✅ Montage fonctionne (si assets OK)    │
│                                         │
│ ⚠️ IA-Amie : Messages fallback variés   │
│ ⚠️ Génération : Impossible              │
│ ⚠️ Sync : En attente de reconnexion     │
└─────────────────────────────────────────┘
```

### 10. 🔒 Sécurité Electron

| Vulnérabilité | Correction |
|---------------|------------|
| Shell injection (exec) | → execFile/spawn |
| Clics arbitraires | → Validation x,y (0-10000) |
| Touches arbitraires | → Whitelist (flèches, entrée, espace) |
| TTS injection | → Échappement shell |
| Session mentor | → ID + expiration 1h |

### 11. 📱 Responsive iPad

- Sidebar compacte (w-20 au lieu de w-24)
- Icônes réduites
- Livre adaptatif (overflow caché, max-width)
- Breakpoint `tablet` (834px)

### 12. ✨ UI Polish

**Animations CSS :**
- `fade-in-up/down/left/right`
- `zoom-in`, `magic-loading`, `typing-dot`
- `success-pop`, `shine-effect`, `card-3d`
- `glass-premium`, `halo-focus`, `btn-sparkle`

**Composants UI :**
- `LoadingSpinner` (4 variantes)
- `LoadingScreen` (splash animé)
- `TypingIndicator`
- `Toast` (5 types + provider)
- `Button` (6 variantes)
- `Card` (6 variantes + effets)
- `Modal` (avec ConfirmModal)
- `VoiceSelector`
- `NarrationVoiceSelector`
- `AIWelcomeSequence`

### 13. 🎬 Timeline Fluide

- Tête de lecture smooth (DOM direct)
- Throttle 100ms sur state React
- Plus de saccades !

### 14. 🌟 Welcome Sequence

```
┌─────────────────────────────────────────┐
│ ✨ Bonjour !                            │
│                                         │
│ Je suis ton amie magique...             │
│ Comment veux-tu m'appeler ?             │
│                                         │
│ [Étoile] [Lune] [Fée] [Magie]          │
│                                         │
│ Ou écris le prénom que tu veux : [___]  │
└─────────────────────────────────────────┘
```

---

## 📁 Structure des Fichiers Clés

### Stores

```
src/store/
├── useAppStore.ts            # État global, histoires, préférences
├── useStudioStore.ts         # Kits de création, assets importés
├── useStudioProgressStore.ts # Progression pédagogique
├── useMontageStore.ts        # Projets montage (sync Supabase)
├── usePublishStore.ts        # Publication Gelato
├── useMentorStore.ts         # Session mentor
├── useAuthStore.ts           # Authentification
├── useHighlightStore.ts      # Guidage visuel IA ✨
└── useAdminStore.ts          # Administration multi-famille ✨
```

### Administration

```
src/
├── components/admin/
│   ├── SuperAdminPanel.tsx   # Panel super admin (vous)
│   ├── ParentAdminPanel.tsx  # Panel parent (dans l'app)
│   └── index.ts
│
├── app/api/admin/
│   └── families/
│       ├── route.ts                    # GET/POST familles
│       └── [familyId]/
│           ├── route.ts                # GET/PATCH/DELETE famille
│           ├── config/route.ts         # Clés API
│           ├── members/route.ts        # Membres
│           ├── members/[memberId]/...  # Membre spécifique
│           └── creations/route.ts      # Créations enfants
│
├── hooks/useAppConfig.ts     # Récupère config famille active
└── lib/config/
    ├── api-keys.ts           # Helpers clés API (client)
    └── server-config.ts      # Helpers clés API (serveur)
```

### Sons

```
src/lib/sounds/
├── catalog.ts    # 98 entrées avec métadonnées complètes
└── index.ts      # Exports + getSoundById/getMusicById

public/sound/
├── ambiances/    # 16 fichiers MP3
├── effects/      # 70 fichiers MP3 (catégorisés)
└── music/        # 12 fichiers MP3
```

### UI

```
src/components/ui/
├── LoadingSpinner.tsx
├── LoadingScreen.tsx
├── TypingIndicator.tsx
├── Toast.tsx
├── Button.tsx
├── Card.tsx
├── Modal.tsx
├── VoiceSelector.tsx
├── NarrationVoiceSelector.tsx
├── AIWelcomeSequence.tsx
├── Highlightable.tsx
├── RemoveBackgroundButton.tsx
└── ...
```

---

## 🔧 Configuration

### Variables d'environnement (`.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Google AI
GOOGLE_GEMINI_API_KEY=xxx

# ElevenLabs (voix premium)
ELEVENLABS_API_KEY=xxx

# Gelato (publication)
GELATO_API_KEY=xxx
GELATO_TEST_MODE=true

# Cloudflare R2 (vidéos)
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=lavoixdusoir-videos
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxx.r2.dev

# Mux (export vidéo)
MUX_TOKEN_ID=xxx
MUX_TOKEN_SECRET=xxx

# ImagineAPI (Midjourney)
IMAGINEAPI_API_KEY=xxx

# Runway (vidéos IA)
RUNWAY_API_KEY=xxx

# Luma (vidéos IA alternative)
LUMA_API_KEY=xxx
```

> ⚠️ **Note** : Ces clés sont les valeurs par défaut. En production, chaque famille peut avoir ses propres clés via l'Admin Panel.

---

## 🚀 Pour Démarrer

```bash
# Installer
npm install

# Dev (web + signaling)
npm run dev
# → http://localhost:3000

# Dev Electron
npm run dev:electron
```

### Se configurer en Super Admin

1. Créer un compte sur l'app
2. Dans Supabase SQL Editor :
```sql
INSERT INTO super_admins (user_id, name)
VALUES ('VOTRE_USER_ID', 'Admin');
```
3. Rafraîchir l'app → Bouton "Admin" apparaît dans la sidebar

---

## 📊 Récapitulatif de l'État

| Composant | État | Notes |
|-----------|------|-------|
| Mode Écriture | ✅ | Complet |
| Mode Studio | ✅ | Pédagogie + guidage IA |
| Mode Montage | ✅ | Timeline fluide + sons + **style phrases** |
| Mode Théâtre | ✅ | Lecture + export MP4 |
| Mode Publier | ✅ | Gelato + PDF |
| IA personnalisable | ✅ | Welcome sequence interactive |
| Guidage visuel IA | ✅ | Highlight UI |
| Voix IA-Amie | ✅ | Sélecteur + fallback |
| Voix narration | ✅ | 21 voix ElevenLabs |
| Sync Supabase | ✅ | Histoires, montages, progression |
| Assets cloud | ✅ | Supabase + R2 |
| Export PDF | ✅ | 300 DPI |
| Export MP4 | ✅ | Via Mux |
| Admin multi-famille | ✅ | Super Admin + Parent |
| Bibliothèque sons | ✅ | 98 fichiers |
| Background removal | ✅ | Client-side |
| Sécurité Electron | ✅ | Shell injection fixé |
| Responsive iPad | ✅ | Adaptatif |
| Mode hors-ligne | ✅ | Fallbacks |
| **Style par phrase** | ✅ | Position, taille, couleur, animation |
| **Volume par phrase** | ✅ | 0% - 150% individuel |
| **Fade audio** | ✅ | Sons et musiques |

---

## 🔧 Ce qui Reste à Faire

### Priorité 1 - Assets

| Tâche | Description | Effort |
|-------|-------------|--------|
| **Screenshots tutoriels** | 10 images pour Midjourney/Runway | 1h (manuel) |
| **Samples ElevenLabs** | 21 fichiers audio pour sélecteur voix | 1h (manuel) |

### Priorité 2 - Tests

| Tâche | Description | Effort |
|-------|-------------|--------|
| **Tests E2E** | Flux complet Écriture → Théâtre | 4h |
| **Tests Admin** | Création famille, invitation, config | 2h |

### Priorité 3 - Optionnel

| Tâche | Description | Effort |
|-------|-------------|--------|
| **Runway Gen-4** | Mettre à jour vers la dernière version | 1h |
| **HomeKit réel** | Contrôler les vraies lumières Hue | 3h |
| **Corriger TypeScript** | Quelques erreurs préexistantes | 2h |

---

## 💡 Notes pour le Prochain Dev

1. **L'enfant cible a 8 ans** → Tout doit être simple et encourageant
2. **Budget illimité** → Pas d'hésitation sur les services payants
3. **Clés API dynamiques** → Utiliser `useAppConfig()` + `getXxxApiKey(config)`
4. **Pas de "Luna"** → Le nom est choisi par l'enfant, jamais hardcodé
5. **Sons catégorisés** → Filtres par thème dans AddElementModal
6. **Highlights IA** → L'IA peut faire clignoter des boutons avec `[HIGHLIGHT:id]`
7. **Parents autonomes** → Ils peuvent modifier leurs clés API
8. **Super Admin à distance** → Vous pouvez tout configurer depuis n'importe où

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
