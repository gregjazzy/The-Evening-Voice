# 🔐 Configuration des Variables d'Environnement

Ce fichier explique comment configurer les clés API nécessaires pour "La Voix du Soir".

## Étape 1 : Créer le fichier `.env.local`

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```bash
# === SUPABASE ===
# Project ID: frufyxrhpqxhnawmrhru
NEXT_PUBLIC_SUPABASE_URL=https://frufyxrhpqxhnawmrhru.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key

# === GOOGLE GEMINI AI (Luna) ===
GOOGLE_GEMINI_API_KEY=votre-cle-gemini

# === ELEVENLABS (Voix) ===
ELEVENLABS_API_KEY=votre-cle-elevenlabs
ELEVENLABS_VOICE_ID=voice-id-optionnel

# === MIDJOURNEY (Images) ===
MIDJOURNEY_API_KEY=votre-cle-imagineapi
MIDJOURNEY_API_URL=https://api.imagineapi.dev

# === RUNWAY / LUMA (Vidéos) ===
RUNWAY_API_KEY=votre-cle-runway
LUMA_API_KEY=votre-cle-luma

# === OPENAI (Optionnel) ===
OPENAI_API_KEY=votre-cle-openai

# === Configuration ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Étape 2 : Obtenir les clés API

### 📊 Supabase (Base de données & Temps réel)
1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Allez dans **Settings → API**
4. Copiez `URL` et `anon public key`
5. Exécutez le schéma SQL : `supabase/schema.sql`

### 🤖 Google Gemini (Luna, l'IA-Amie)
1. Allez sur [makersuite.google.com](https://makersuite.google.com/app/apikey)
2. Créez une clé API
3. Activez l'API Gemini si nécessaire

### 🎤 ElevenLabs (Voix/Narration)
1. Créez un compte sur [elevenlabs.io](https://elevenlabs.io)
2. Allez dans **Profile → API Key**
3. (Optionnel) Choisissez une voix dans **Voice Library** et copiez son ID

### 🎨 Midjourney via ImagineAPI
1. Créez un compte sur [imagineapi.dev](https://imagineapi.dev) (ou équivalent)
2. Récupérez votre clé API
3. Note : Midjourney n'a pas d'API officielle, on utilise un service tiers

### 🎬 Runway ML (Vidéos)
1. Créez un compte sur [runwayml.com](https://runwayml.com)
2. Allez dans **Settings → API**
3. Générez une clé API

### ✨ Luma Labs (Vidéos - Alternative)
1. Créez un compte sur [lumalabs.ai](https://lumalabs.ai)
2. Accédez à Dream Machine API
3. Récupérez votre clé

## Étape 3 : Initialiser Supabase

```bash
# Installer le CLI Supabase (si pas déjà fait)
npm install -g supabase

# Initialiser (si pas déjà fait)
supabase init

# Lier au projet distant
supabase link --project-ref frufyxrhpqxhnawmrhru

# Appliquer le schéma
supabase db push
```

### Option alternative : Exécuter le SQL manuellement

1. Va sur https://supabase.com/dashboard/project/frufyxrhpqxhnawmrhru/sql/new
2. Copie-colle le contenu de `supabase/schema.sql`
3. Clique sur "Run"

## Configuration Google pour Safari (Auto-login)

Pour que les filles puissent ouvrir Gemini/Google sans se reconnecter :

1. Sur l'iPad/Mac, connectez-vous au compte Google "Maison" dans Safari
2. Activez "Rester connecté"
3. L'app copiera automatiquement les prompts dans le presse-papier avant d'ouvrir Safari

## Coûts estimés

| Service | Plan gratuit | Notes |
|---------|-------------|-------|
| Supabase | 500 Mo, 2 Go bande passante | Suffisant pour démarrer |
| Gemini | 60 requêtes/minute | Largement suffisant |
| ElevenLabs | 10 000 caractères/mois | ~30 pages de narration |
| ImagineAPI | Variable | Environ $0.02/image |
| Runway | 125 crédits gratuits | ~25 vidéos de 5s |
| Luma | 30 générations/mois | Plan gratuit |

## Sécurité

⚠️ **Important** : Le fichier `.env.local` ne doit **JAMAIS** être commité sur Git !

Il est déjà inclus dans `.gitignore`.

