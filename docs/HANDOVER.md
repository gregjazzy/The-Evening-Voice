# 📋 Handover - La Voix du Soir

> Document de passation complet pour la prochaine session de développement

**Date** : 21 janvier 2026  
**Version** : 5.5.0  
**État** : Production + Electron (partiellement fonctionnel)

---

## 🎯 Vision Produit

> **Lire `docs/CONCEPT.md` pour la vision complète**

### Résumé

Application pour **enfants de 9 ans** permettant de créer des **livres-disques numériques 2.0** - inspirés des livres-disques d'antan (Marlène Jobert, Disney) mais augmentés avec IA et domotique.

**Objectif pédagogique principal** : Enseigner le **prompting** de manière ludique et progressive.

**Cliente** : Commande privée pour cliente milliardaire. Pas de gamification visible (badges, XP). Focus sur l'élégance et la pédagogie.

### Les 6 Modes

| Mode | Fonction | État |
|------|----------|------|
| ✍️ **Écriture** | Création du livre STATIQUE (texte, images, décos) | ✅ Complet |
| 🎨 **Studio** | Apprentissage progressif du prompting (Nano Banana/Kling) | ✅ Complet |
| 🏆 **Défis** | Exercices de prompting : reproduire/varier des images | ✅ Complet |
| 🎬 **Montage** | Création du LIVRE-DISQUE (timeline, effets, sync) | ✅ Complet |
| 🎭 **Théâtre** | Lecteur immersif + export vidéo HD | ✅ Complet |
| 📖 **Publier** | Publication livre imprimé via Gelato + PDF | ✅ Complet |

---

## ✅ Ce qui est FAIT (Session 21 janvier - v5.5)

### 1. 🖼️ Images des Structures d'Histoire Refaites

**Objectif** : Images premium style cinématographique pour enfants de 9 ans (pas enfantin)

**Style appliqué** :
- Inspiration Pixar/DreamWorks/Ghibli
- Couleurs riches et profondes
- Qualité cinématographique premium

**Images régénérées** :
- `structure-tale.jpg` - Conte (château magique)
- `structure-adventure.jpg` - Aventure (dirigeable steampunk)
- `structure-problem.jpg` - Problème/Solution (détective dans bibliothèque)
- `structure-free.jpg` - Libre (portail arc-en-ciel)

**Structures supprimées** :
- ❌ `journal` (journal illustré - cliente ne voulait pas de journal intime)
- ❌ `loop` (boucle)

**CSS amélioré** dans `BookMode.tsx` :
```typescript
// Suppression du blur, gradient plus subtil
style={{
  background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.4) 100%)',
}}
// Filtres pour images plus lumineuses
filter: 'brightness(1.08) saturate(1.1) contrast(1.03)'
```

**Grille 2x2** pour 4 structures :
```typescript
<div className="grid grid-cols-2 gap-12 max-w-4xl mx-auto">
```

### 2. 🗑️ Suppression d'Histoires

**Fonctionnalité ajoutée** dans `Sidebar.tsx` :
- Bouton poubelle sur chaque histoire
- Modal de confirmation avant suppression
- Suppression Supabase + locale

**Fichiers modifiés** :
- `src/components/navigation/Sidebar.tsx` - UI de suppression
- `src/store/useAppStore.ts` - `deleteStoryFromSupabase()`

### 3. 🖥️ Application Electron

**Build Electron** configuré pour charger l'URL de production :
- URL : `https://eveningvoice.netlify.app`
- Raison : Next.js API routes incompatibles avec le chargement de fichiers locaux

**Configuration** dans `electron/main.js` :
```javascript
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://eveningvoice.netlify.app'

if (isDev) {
  mainWindow.loadURL('http://localhost:3000')
} else {
  mainWindow.loadURL(PRODUCTION_URL)
}
```

**Permissions microphone** ajoutées :
- `electron/main.js` : IPC handler `request-microphone-access`
- `electron/preload.js` : Expose `electronAPI.requestMicrophoneAccess`
- `package.json` : `NSMicrophoneUsageDescription`, `NSCameraUsageDescription`

### 4. 🌐 Déploiement Netlify

**URL** : https://eveningvoice.netlify.app

**Configuration** `netlify.toml` :
```toml
[build]
  command = "npm install && npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20.9.0"
  NPM_FLAGS = "--include=dev"
```

**Variables d'environnement requises sur Netlify** :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_GEMINI_API_KEY`
- `FAL_API_KEY`
- `ELEVENLABS_API_KEY`
- (et autres selon besoins)

### 5. 🔐 Flux d'Authentification Corrigé

**Problème** : L'onboarding (dialogue avec IA pour choisir prénom) s'affichait avant l'identification.

**Correction** dans `ClientLayout.tsx` :
```typescript
// L'onboarding ne s'affiche QUE si l'utilisateur est connecté
useEffect(() => {
  if (!isInitialized || !user) {
    return // Ne rien faire si pas connecté
  }
  // ... logique onboarding
}, [isInitialized, aiName, user])
```

**Flux correct** :
1. Page de login → Identification
2. Si nouveau : Onboarding (dialogue prénom)
3. Application principale

### 6. 🔑 Mot de Passe Oublié

**Fonctionnalité ajoutée** dans `login/page.tsx` :
- Bouton "Mot de passe oublié ?" fonctionnel
- Envoie email via Supabase `resetPasswordForEmail`

---

## ⚠️ Problèmes Connus

### 1. 🖥️ Electron Crash sur macOS 26.1 (Tahoe)

**Symptôme** : L'app Electron packagée crash au lancement avec :
```
Exception Type: EXC_BREAKPOINT (SIGTRAP)
rust_png$cxxbridge1$Reader$...
Fatal process out of memory: Failed to reserve virtual memory for CodeRange
```

**Cause** : Incompatibilité entre Electron 40 et macOS 26.1 (version beta/future)
- Le décodeur PNG Rust d'Electron ne fonctionne pas correctement
- Problèmes d'allocation mémoire V8

**Tentatives échouées** :
- ❌ Downgrade Electron (28, 31, 32, 33, 39)
- ❌ V8 flags (`--max-old-space-size`, `V8VmFuture`)
- ❌ Suppression icône personnalisée
- ❌ Désactivation ASAR (`"asar": false`)

**Solution actuelle** :
- ✅ Mode développement fonctionne : `npm run dev:electron`
- ✅ Web via Netlify fonctionne : https://eveningvoice.netlify.app
- ❌ App packagée ne fonctionne pas sur macOS 26.1

**Pour la cliente** : Utiliser la version web via navigateur en attendant un fix Electron.

### 2. 🔄 Session Auth Locale

**Symptôme** : Après login en local, redirection vers page de login.

**Cause** : Le middleware Next.js vérifie les cookies Supabase, mais la session peut ne pas être correctement persistée.

**Workaround** : Utiliser la version Netlify qui gère mieux les cookies.

### 3. 📦 Import checkImageQuality

**Warning** : `checkImageQuality is not exported from '@/lib/export/pdf'`

**Status** : C'est un faux positif - la fonction EST exportée. Le cache webpack peut être corrompu.

**Fix** : `rm -rf .next && npm run dev`

---

## 📁 Structure des Fichiers Modifiés

```
electron/
├── main.js              # Chargement URL Netlify + permissions micro
├── preload.js           # Expose requestMicrophoneAccess
└── entitlements.mac.plist # Permissions macOS

src/
├── components/
│   ├── modes/
│   │   └── BookMode.tsx          # Images structures, grille 2x2
│   ├── navigation/
│   │   └── Sidebar.tsx           # Suppression histoires
│   └── ClientLayout.tsx          # Fix flux auth/onboarding
├── store/
│   └── useAppStore.ts            # deleteStoryFromSupabase
├── lib/
│   └── ai/prompting-pedagogy.ts  # Suppression journal/loop
└── app/
    └── [locale]/(auth)/login/page.tsx  # Mot de passe oublié

scripts/
└── generate-structure-images.ts  # Prompts images premium

netlify.toml                      # Config déploiement
package.json                      # Electron 40, deps TailwindCSS
next.config.mjs                   # ignoreBuildErrors, externals
```

---

## 🔧 Commandes Utiles

### Développement Local

```bash
# Serveur Next.js (web)
npm run dev

# Serveur Next.js + Electron (dev)
npm run dev:electron

# Vérifier port 3000
lsof -i:3000

# Tuer processus Next
pkill -f "next"
```

### Build Electron

```bash
# Build complet (génère .dmg)
npm run build:electron

# Nettoyer et rebuild
rm -rf dist-electron node_modules/electron && npm install && npm run build:electron

# Forcer version Electron spécifique
npm install electron@40.0.0 --save-dev
```

### Déploiement Netlify

```bash
# Push vers GitHub (auto-deploy sur Netlify)
git add -A && git commit -m "message" && git push origin main
```

### Régénérer Images Structures

```bash
npx tsx scripts/generate-structure-images.ts
```

---

## 📊 État des Composants

| Composant | État | Notes |
|-----------|------|-------|
| Mode Écriture | ✅ | 4 structures (tale, adventure, problem, free) |
| Mode Studio | ✅ | |
| Mode Défis | ✅ | |
| Mode Montage | ✅ | |
| Mode Théâtre | ✅ | |
| Mode Publier | ✅ | |
| Suppression histoires | ✅ | Avec confirmation |
| Auth/Login | ✅ | + mot de passe oublié |
| Onboarding | ✅ | Après identification uniquement |
| Web (Netlify) | ✅ | https://eveningvoice.netlify.app |
| Electron Dev | ✅ | `npm run dev:electron` |
| Electron Packaged | ❌ | Crash macOS 26.1 |

---

## 💡 Pour le Prochain Dev

### Priorités

1. **Fix Electron** : Attendre mise à jour Electron compatible macOS 26.1, ou tester sur macOS 15.x
2. **Session Auth** : Investiguer persistance session Supabase en local
3. **Tests** : Ajouter tests pour flux critiques

### Variables .env.local Requises

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://frufyxrhpqxhnawmrhru.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# IA
GOOGLE_GEMINI_API_KEY=xxx
FAL_API_KEY=xxx
ELEVENLABS_API_KEY=xxx

# (voir env.example pour la liste complète)
```

### Si Erreurs 500 Supabase

1. Vérifier clés API dans `.env.local`
2. Vérifier quota Supabase
3. Vérifier RLS policies
4. `rm -rf .next && npm run dev`

### Si Electron Ne Démarre Pas

1. Vérifier que Next.js tourne sur :3000 d'abord
2. `npm run dev:electron` (pas `npm run build:electron`)
3. Sur macOS 26.1 : utiliser version web

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

**Bonne continuation !** 🌙✨

Flux complet :
```
✍️ Écriture → 🎨 Studio → 🏆 Défis → 🎬 Montage → 🎭 Théâtre → 📖 Publier
```

**Version web fonctionnelle** : https://eveningvoice.netlify.app
