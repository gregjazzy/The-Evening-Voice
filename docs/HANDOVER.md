# 📋 Handover - La Voix du Soir

> Document de passation complet pour la prochaine session de développement

**Date** : 20 janvier 2026  
**Version** : 5.2.0  
**État** : Production-Ready ✅ (PublishMode en cours)

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
| 📖 **Publier** | Publication livre imprimé via Gelato + PDF | ⚠️ En cours |

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

---

## ⚠️ PUBLISH MODE - À COMPLÉTER

### État Actuel

| Composant | État | Fichier |
|-----------|------|---------|
| Store | ✅ | `src/store/usePublishStore.ts` |
| API Gelato Quote | ✅ | `src/app/api/gelato/quote/route.ts` |
| API Gelato Order | ✅ | `src/app/api/gelato/order/route.ts` |
| Client Gelato | ✅ | `src/lib/gelato/client.ts` |
| Types Gelato | ✅ | `src/lib/gelato/types.ts` |
| Export PDF | ⚠️ | `src/lib/export/pdf.ts` |
| UI PublishMode | ⚠️ | `src/components/modes/PublishMode.tsx` |

### 🔴 PROBLÈME CRITIQUE : PDF pas accessible par Gelato

```
Actuellement:
  generatePDF() → blob: URL (local)
  
Requis par Gelato:
  PDF sur URL publique (https://...)
```

**Solution à implémenter :**
```typescript
// 1. Générer le PDF
const pdfBlob = await generatePDF(story);

// 2. Upload vers Supabase Storage
const pdfUrl = await uploadToSupabase('pdfs', `${story.id}.pdf`, pdfBlob);

// 3. Passer l'URL publique à Gelato
await createGelatoOrder({ pdfUrl, ... });
```

### 📋 Tâches PublishMode

| Tâche | Priorité | Effort | Description |
|-------|----------|--------|-------------|
| **Upload PDF vers Supabase** | 🔴 HAUTE | Moyen | Permettre à Gelato d'accéder au PDF |
| **Vérification DPI images** | 🟠 Moyenne | Faible | Vérifier que toutes les images sont en 300 DPI |
| **Upscale auto si nécessaire** | 🟠 Moyenne | Faible | Utiliser Real-ESRGAN si image trop petite |
| **Design couverture complet** | 🟡 Basse | Élevé | Dos + 4ème de couverture |
| **Preview avant commande** | 🟡 Basse | Moyen | Aperçu du livre final |

### Architecture Cible

```
┌─────────────────────────────────────────────────────────────┐
│  FLUX PUBLISH MODE                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Sélection format (A5, A4, Carré)                       │
│     └─→ usePublishStore.setFormat()                        │
│                                                             │
│  2. Vérification qualité                                    │
│     ├─→ Parcourir story.pages                              │
│     ├─→ Pour chaque image: vérifier dimensions             │
│     └─→ Si < 300 DPI → upscale via fal.ai                  │
│                                                             │
│  3. Génération PDF                                          │
│     ├─→ src/lib/export/pdf.ts                              │
│     ├─→ Inclure couverture + pages + images                │
│     └─→ Générer Blob                                        │
│                                                             │
│  4. Upload PDF vers Supabase Storage  ⬅️ À FAIRE           │
│     ├─→ POST /api/upload/pdf                                │
│     └─→ Retourne URL publique                              │
│                                                             │
│  5. Devis Gelato                                            │
│     ├─→ POST /api/gelato/quote                             │
│     └─→ { price, currency, estimatedDelivery }             │
│                                                             │
│  6. Commande Gelato                                         │
│     ├─→ POST /api/gelato/order                             │
│     ├─→ { pdfUrl, format, address }                        │
│     └─→ { orderId, trackingUrl }                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fichiers à Modifier/Créer

```
src/lib/export/pdf.ts              # Améliorer génération PDF
src/app/api/upload/pdf/route.ts    # CRÉER - Upload PDF Supabase
src/components/modes/PublishMode.tsx  # Compléter UI
src/store/usePublishStore.ts       # Ajouter pdfUrl après upload
```

### Configuration Gelato

```typescript
// Formats supportés (src/lib/gelato/types.ts)
export const FORMAT_TO_GELATO_UID = {
  'A5': 'photobook_hc_a5_pf',      // Couverture rigide A5 portrait
  'A4': 'photobook_hc_a4_pf',      // Couverture rigide A4 portrait
  'square': 'photobook_hc_sq_210', // Couverture rigide carré 21cm
};
```

### Spécifications Impression (300 DPI)

| Format | Dimensions (mm) | Pixels requis |
|--------|-----------------|---------------|
| A5 | 148 × 210 | 1748 × 2480 |
| A4 | 210 × 297 | 2480 × 3508 |
| Carré 21cm | 210 × 210 | 2480 × 2480 |

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
| Mode Publier | ⚠️ | **PDF local → Upload Supabase** |
| **Liaison Story/Assets** | ✅ | `story_id` partout |
| **Sélecteur histoire** | ✅ | Sidebar |
| **Blocage sans histoire** | ✅ | Studio/Montage |
| Sync Supabase | ✅ | Debounce 2s |
| Assets cloud | ✅ | Supabase + R2 |

---

## 💡 Notes pour le Prochain Dev

### Priorités

1. **🔴 Upload PDF vers Supabase** - Critique pour Gelato
2. **🟠 Vérification DPI** - Qualité impression
3. **🟡 Preview livre** - UX avant commande

### Points d'Attention

1. **L'enfant cible a 8 ans** → Tout doit être simple
2. **Budget illimité** → Pas d'hésitation sur les services payants
3. **currentStory, pas currentProject** → Assets liés à l'histoire
4. **Nano Banana Pro** → Comprend le français, pas besoin de traduire
5. **useMediaUpload hook** → Utiliser pour tout upload media

### Code Pattern - Upload PDF

```typescript
// À implémenter dans src/app/api/upload/pdf/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as Blob;
  const storyId = formData.get('storyId') as string;
  
  // Upload vers Supabase Storage bucket 'pdfs'
  const { data, error } = await supabase.storage
    .from('pdfs')
    .upload(`${storyId}.pdf`, file, {
      contentType: 'application/pdf',
      upsert: true
    });
  
  // Récupérer URL publique
  const { data: { publicUrl } } = supabase.storage
    .from('pdfs')
    .getPublicUrl(`${storyId}.pdf`);
  
  return NextResponse.json({ pdfUrl: publicUrl });
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

## 🎯 Commande pour Démarrer PublishMode

Pour la prochaine session, utiliser ce prompt :

```
Configure PublishMode pour l'impression Gelato :

1. Créer /api/upload/pdf pour uploader le PDF vers Supabase Storage
2. Modifier generatePDF() pour uploader automatiquement après génération
3. Ajouter vérification DPI des images avant génération PDF
4. Compléter l'UI de PublishMode avec les étapes :
   - Choix format (A5/A4/Carré)
   - Vérification qualité (images 300 DPI)
   - Génération + upload PDF
   - Devis Gelato
   - Adresse livraison
   - Confirmation commande

Fichiers clés :
- src/lib/export/pdf.ts
- src/store/usePublishStore.ts
- src/components/modes/PublishMode.tsx
- src/app/api/upload/pdf/route.ts (à créer)
```

---

**Bon courage pour la suite !** 🌙✨
