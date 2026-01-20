# 📋 Handover - La Voix du Soir

> Document de passation complet pour la prochaine session de développement

**Date** : 20 janvier 2026  
**Version** : 5.3.0  
**État** : Production-Ready ✅ (PublishMode complet)

---

## 🎯 Vision Produit

> **Lire `docs/CONCEPT.md` pour la vision complète**

### Résumé

Application pour **enfants de 8 ans** permettant de créer des **livres-disques numériques 2.0** - inspirés des livres-disques d'antan (Marlène Jobert, Disney) mais augmentés avec IA et domotique.

**Cliente** : Commande spéciale avec budget non limité.

### Les 5 Modes

| Mode | Fonction | État |
|------|----------|------|
| ✍️ **Écriture** | Création du livre STATIQUE (texte, images, décos) | ✅ Complet |
| 🎨 **Studio** | Apprentissage progressif du prompting (Nano Banana/Kling) | ✅ Complet |
| 🎬 **Montage** | Création du LIVRE-DISQUE (timeline, effets, sync) | ✅ Complet |
| 🎭 **Théâtre** | Lecteur immersif + export vidéo HD | ✅ Complet |
| 📖 **Publier** | Publication livre imprimé via Gelato + PDF | ✅ Complet |

### Flux Logique

```
📝 Écriture → 🎨 Studio → 🎬 Montage → 🎭 Théâtre
   (texte)    (assets)    (assemblage)  (lecture)
      ↓                        ↓
   "Terminer"              📖 Publier
   mon histoire           + Export MP4/PDF
```

---

## ✅ Ce qui est FAIT (Session 20 janvier - v5.2)

### 1. 🎨 Studio - Migration vers Nano Banana Pro

Le modèle de génération d'images a été changé pour **Nano Banana Pro** (fal.ai).

| Aspect | Avant | Maintenant |
|--------|-------|------------|
| **Modèle** | Flux 1 Pro | Nano Banana Pro |
| **Français** | Traduit vers EN | Compris nativement ✅ |
| **Qualité native** | 1024px | 2048px |
| **Prix** | ~$0.05/image | ~$0.03/image |
| **Upscale** | Systématique | Format "book" (3:4) uniquement |

**Fichiers modifiés :**
```
src/lib/ai/fal.ts              # generateImageNanoBanana()
src/app/api/ai/image/route.ts  # Modèle par défaut = nano-banana
```

### 2. 💬 Studio - Validation IA du Contenu

La validation des champs texte passe maintenant par l'IA dans le chat.

| Ancien comportement | Nouveau comportement |
|---------------------|----------------------|
| Validation client (regex) | IA valide via `/api/ai/chat` |
| Message générique | IA confirme et annonce l'étape suivante |
| Double message après validation | Un seul message (flag `justValidated`) |

**Flux :**
```
Enfant tape "toupie jaune avec des ailes"
    ↓
Texte envoyé au chat [VALIDATION]
    ↓
IA valide avec enthousiasme
    ↓
Étape suivante s'affiche
```

### 3. 🔗 Liaison Histoire/Assets

Tous les assets (images, vidéos) sont maintenant liés à `currentStory.id`.

```typescript
// Avant
addImportedAsset({ ..., projectId: currentProject?.id })

// Maintenant
addImportedAsset({ ..., projectId: currentStory?.id })
```

**Impact :**
- Chaque histoire a sa propre galerie d'assets
- Les assets sont filtrés par `story_id` dans les composants

### 4. 🚫 Blocage Studio/Montage sans Histoire

Les modes Studio et Montage sont **bloqués** si aucune histoire n'a de titre.

**Dans `Sidebar.tsx` :**
```typescript
const canAccessStudioMontage = currentStory?.title?.trim();

// Si pas de titre → désactivé + tooltip
```

### 5. 📚 Sélecteur d'Histoire (Sidebar)

Ajout d'un **sélecteur d'histoire** dans la sidebar sous le logo.

| Fonctionnalité | Description |
|----------------|-------------|
| **Dropdown** | Liste des histoires existantes |
| **Création** | Option "+ Nouvelle histoire" |
| **Visuel** | Indicateur de l'histoire active |
| **Persistance** | `setCurrentStory()` dans `useAppStore` |

**Fichier :** `src/components/navigation/Sidebar.tsx`

### 6. ✅ Bouton "Terminer mon Histoire"

Ajout d'un bouton dans **BookMode** pour marquer une histoire comme terminée.

| Élément | Description |
|---------|-------------|
| **Bouton** | "Terminer mon histoire 🎉" |
| **Modal** | Célébration avec confettis |
| **Actions** | → Studio (créer images) ou → Montage (créer vidéos) |
| **État** | `story.isComplete = true` |

**Fichier :** `src/components/modes/BookMode.tsx`

### 7. 🎬 Vidéos - Boutons Effets/Caméra

Ajout de boutons visuels pour les effets vidéo et mouvements de caméra.

**Effets disponibles :**
- Aucun, Ralenti, Accéléré, Boucle, Fondu, Inversé

**Mouvements caméra :**
- Statique, Zoom avant, Zoom arrière, Panoramique, Travelling

**Fichier :** `src/components/studio/PromptBuilder.tsx`

### 8. 📝 Documentation Mise à Jour

- `docs/ARCHITECTURE.md` → Ajout section Studio Mode détaillée
- `public/tutorials/SCREENSHOTS_A_CAPTURER.md` → Screenshots fal.ai

### 9. 📖 PublishMode - Complet

Le mode Publication est maintenant **entièrement fonctionnel** :

| Fonctionnalité | Description |
|----------------|-------------|
| **Upload PDF Supabase** | API `/api/upload/pdf` + bucket 'pdfs' |
| **Vérification DPI réelle** | Charge images et calcule les DPI |
| **Upscale IA automatique** | Real-ESRGAN via `/api/ai/upscale` |
| **UI 6 étapes** | Histoire → Format → Couverture → Aperçu → Qualité → Commande |

**Nouveaux fichiers :**
```
src/app/api/upload/pdf/route.ts        # Upload PDF
src/app/api/ai/upscale/route.ts        # Upscale images
supabase/migrations/20260120_add_pdfs_bucket.sql  # Bucket + policies
```

**Modifications :**
- `src/store/usePublishStore.ts` → `uploadPdfToSupabase()`, vérification DPI réelle
- `src/lib/export/pdf.ts` → `checkImageQuality()` fonction
- `src/components/modes/PublishMode.tsx` → UI upload, indicateurs progression, upscale

---

## ✅ PUBLISH MODE - COMPLET

### État Actuel

| Composant | État | Fichier |
|-----------|------|---------|
| Store | ✅ | `src/store/usePublishStore.ts` |
| API Gelato Quote | ✅ | `src/app/api/gelato/quote/route.ts` |
| API Gelato Order | ✅ | `src/app/api/gelato/order/route.ts` |
| Client Gelato | ✅ | `src/lib/gelato/client.ts` |
| Types Gelato | ✅ | `src/lib/gelato/types.ts` |
| Export PDF | ✅ | `src/lib/export/pdf.ts` |
| **Upload PDF** | ✅ | `src/app/api/upload/pdf/route.ts` |
| **Upscale Images** | ✅ | `src/app/api/ai/upscale/route.ts` |
| UI PublishMode | ✅ | `src/components/modes/PublishMode.tsx` |

### ✅ RÉSOLU : PDF accessible par Gelato

Le PDF est maintenant automatiquement uploadé vers Supabase Storage après génération :

```typescript
// Flux complet implémenté :
// 1. Générer le PDF localement
const result = await exportToPDF(story, format, cover)

// 2. Upload vers Supabase Storage (bucket 'pdfs')
const pdfUrl = await uploadPdfToSupabase(result.blob, story, userId)
// → URL publique : https://xxx.supabase.co/storage/v1/object/public/pdfs/{userId}/{filename}.pdf

// 3. Commander via Gelato avec l'URL publique
await placeGelatoOrder() // Utilise pdfUrl du store
```

### Fonctionnalités Implémentées

| Fonctionnalité | Description |
|----------------|-------------|
| **Upload PDF Supabase** | API route + bucket 'pdfs' avec policies |
| **Vérification DPI réelle** | Charge les images et calcule les DPI |
| **Upscale IA** | Real-ESRGAN via fal.ai pour images basse résolution |
| **UI complète** | Progression génération + upload, aperçu images low-DPI |
| **Flux intégré** | Depuis Écriture → Publication Gelato |

### Architecture Complète

```
┌─────────────────────────────────────────────────────────────┐
│  FLUX PUBLISH MODE (IMPLÉMENTÉ)                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Sélection histoire                                      │
│     └─→ Filtre histoires avec min 4 pages                  │
│                                                             │
│  2. Sélection format (Carré 21cm, A5, A4...)               │
│     └─→ usePublishStore.setFormat()                        │
│                                                             │
│  3. Design couverture                                       │
│     ├─→ Titre, sous-titre, auteur                          │
│     ├─→ Image de couverture (depuis Studio/Histoire)       │
│     └─→ Résumé 4ème de couverture                          │
│                                                             │
│  4. Aperçu                                                  │
│     └─→ Preview pages du livre                             │
│                                                             │
│  5. Vérification qualité ✨                                │
│     ├─→ Parcourir story.pages                              │
│     ├─→ Pour chaque image: checkImageQuality()             │
│     ├─→ Afficher images < 200 DPI avec détails             │
│     └─→ Bouton "Améliorer tout" → upscale via fal.ai       │
│                                                             │
│  6. Génération + Upload PDF ✨                              │
│     ├─→ exportToPDF() → Blob                               │
│     ├─→ POST /api/upload/pdf → Supabase Storage            │
│     └─→ Retourne URL publique dans pdfUrl                  │
│                                                             │
│  7. Devis Gelato                                            │
│     ├─→ POST /api/gelato/quote                             │
│     └─→ { price, currency, estimatedDelivery }             │
│                                                             │
│  8. Commande Gelato                                         │
│     ├─→ Saisie adresse livraison                           │
│     ├─→ POST /api/gelato/order avec pdfUrl                 │
│     └─→ { orderId, trackingUrl }                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Nouveaux Fichiers Créés

```
src/app/api/upload/pdf/route.ts        # Upload PDF vers Supabase
src/app/api/ai/upscale/route.ts        # Upscale images via Real-ESRGAN
supabase/migrations/20260120_add_pdfs_bucket.sql  # Bucket + policies
```

### Spécifications Impression (300 DPI)

| Format | Dimensions (mm) | Pixels requis |
|--------|-----------------|---------------|
| A5 | 148 × 210 | 1748 × 2480 |
| A4 | 210 × 297 | 2480 × 3508 |
| Carré 21cm | 210 × 210 | 2480 × 2480 |

### Configuration Bucket Supabase

Le bucket `pdfs` doit être créé avec :
- **Public** : Oui (pour accès Gelato)
- **Limite taille** : 50MB
- **Types MIME** : `application/pdf` uniquement

Exécuter la migration : `supabase/migrations/20260120_add_pdfs_bucket.sql`

---

## 📁 Structure des Fichiers Clés

### Services IA

```
src/lib/ai/
├── fal.ts              # Service unifié fal.ai (Nano Banana, Kling, Real-ESRGAN)
├── gemini.ts           # Chat IA (prompts par mode) + traduction
├── elevenlabs.ts       # Voix (IDs, helpers) - via fal.ai
└── prompting-pedagogy.ts # Logique pédagogique Studio
```

### Stores

```
src/store/
├── useAppStore.ts            # stories[], currentStory, userName, aiName
├── useStudioStore.ts         # currentKit, importedAssets, savedKits
├── useStudioProgressStore.ts # level, creations, completedSteps
├── usePublishStore.ts        # format, pdfUrl, gelatoOrder
├── useMontageStore.ts        # scenes, timeline, narration
└── useHighlightStore.ts      # Guidage visuel IA
```

### Composants Studio

```
src/components/studio/
├── StudioAIChat.tsx     # Chat avec validation IA
├── PromptBuilder.tsx    # Construction du prompt + génération
├── StudioGuide.tsx      # Guide pédagogique
└── AssetDropzone.tsx    # Galerie d'assets par histoire
```

### API Routes

```
src/app/api/
├── ai/
│   ├── chat/route.ts         # Chat Gemini + validation
│   ├── image/route.ts        # → Nano Banana Pro
│   ├── video/route.ts        # → Kling 2.1
│   └── moderate/route.ts     # Modération contenu
├── upload/
│   └── video/route.ts        # Upload vidéo R2
├── gelato/
│   ├── quote/route.ts        # Devis impression
│   └── order/route.ts        # Commande impression
```

### Upload Media

```typescript
// Hook centralisé pour upload (images → Supabase, vidéos → R2)
src/hooks/useMediaUpload.ts

// Usage:
const { uploadFromUrl, isUploading } = useMediaUpload();
const result = await uploadFromUrl(tempUrl, {
  type: 'image',  // ou 'video'
  storyId: currentStory.id,
  name: 'mon-image.png'
});
```

---

## 🔧 Configuration

### Variables d'environnement (`.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# fal.ai (images, vidéos, voix IA)
FAL_API_KEY=xxx

# Google AI (chat)
GOOGLE_GEMINI_API_KEY=xxx

# AssemblyAI (transcription)
ASSEMBLYAI_API_KEY=xxx

# Gelato (publication)
GELATO_API_KEY=xxx
GELATO_TEST_MODE=true

# Cloudflare R2 (vidéos)
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=lavoixdusoir-videos
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

---

## 📊 Récapitulatif de l'État

| Composant | État | Notes |
|-----------|------|-------|
| Mode Écriture | ✅ | + bouton "Terminer" |
| Mode Studio | ✅ | → Nano Banana Pro + Kling 2.1 |
| Mode Montage | ✅ | + chat IA + narration |
| Mode Théâtre | ✅ | Lecture + export MP4 |
| Mode Publier | ✅ | **Upload PDF Supabase + Upscale IA** |
| **Liaison Story/Assets** | ✅ | `story_id` partout |
| **Sélecteur histoire** | ✅ | Sidebar |
| **Blocage sans histoire** | ✅ | Studio/Montage |
| Sync Supabase | ✅ | Debounce 2s |
| Assets cloud | ✅ | Supabase + R2 |
| **Upload PDF** | ✅ | Bucket 'pdfs' pour Gelato |
| **Vérification DPI** | ✅ | checkImageQuality() réel |
| **Upscale images** | ✅ | Real-ESRGAN via fal.ai |

---

## 💡 Notes pour le Prochain Dev

### Priorités

1. **🟡 Tests E2E PublishMode** - Vérifier le flux complet en production
2. **🟡 Gestion erreurs Gelato** - Améliorer les messages d'erreur
3. **🟡 Tracking commande** - Afficher le statut de livraison

### Points d'Attention

1. **L'enfant cible a 8 ans** → Tout doit être simple
2. **Budget illimité** → Pas d'hésitation sur les services payants
3. **currentStory, pas currentProject** → Assets liés à l'histoire
4. **Nano Banana Pro** → Comprend le français, pas besoin de traduire
5. **useMediaUpload hook** → Utiliser pour tout upload media
6. **Bucket 'pdfs'** → Doit être créé via migration SQL avant utilisation

### Code Pattern - Flux PublishMode

```typescript
// 1. Générer le PDF
const result = await exportToPDF(story, format, cover, { includeBleed: true })

// 2. Uploader vers Supabase (automatique via UI)
const pdfUrl = await uploadPdfToSupabase(result.blob, story, userId)

// 3. Commander via Gelato
const order = await placeGelatoOrder() // Utilise pdfUrl du store
```

### Vérification DPI des Images

```typescript
// Vérifie la qualité d'une image pour l'impression
const quality = await checkImageQuality(imageUrl, printWidthMm, printHeightMm)

if (!quality.isOk) {
  // Upscale via Real-ESRGAN
  const upscaled = await fetch('/api/ai/upscale', {
    method: 'POST',
    body: JSON.stringify({ imageUrl, scale: 2 })
  })
}
```

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

## 🎯 Prochaines Étapes Suggérées

Le PublishMode est maintenant **complet** ! Voici les améliorations possibles :

### Tests Production

```bash
# 1. Créer le bucket 'pdfs' dans Supabase
# Aller dans Supabase Dashboard > Storage > New bucket
# Nom: pdfs, Public: true, Size limit: 50MB

# 2. Ou exécuter la migration SQL
supabase db push supabase/migrations/20260120_add_pdfs_bucket.sql
```

### Améliorations Futures

1. **Tracking des commandes** - Afficher le statut Gelato en temps réel
2. **Historique des commandes** - Liste des livres commandés
3. **Mode cadeau** - Adresse de livraison différente
4. **Coupon réduction** - Intégration codes promo Gelato

### Fichiers Clés PublishMode

```
src/components/modes/PublishMode.tsx   # UI complète 6 étapes
src/store/usePublishStore.ts           # Store avec upload PDF
src/lib/export/pdf.ts                  # Génération + checkImageQuality
src/app/api/upload/pdf/route.ts        # Upload PDF Supabase
src/app/api/ai/upscale/route.ts        # Upscale images Real-ESRGAN
src/app/api/gelato/quote/route.ts      # Devis Gelato
src/app/api/gelato/order/route.ts      # Commande Gelato
```

---

**Application complète !** 🌙✨ Tous les modes sont fonctionnels :
- ✍️ Écriture → 🎨 Studio → 🎬 Montage → 🎭 Théâtre → 📖 Publier
