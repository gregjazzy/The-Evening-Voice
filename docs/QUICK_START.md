# 🚀 Guide de Démarrage Rapide

## En 5 minutes chrono !

### 1️⃣ Installer les dépendances

```bash
cd lavoixdusoir
npm install
```

### 2️⃣ Configurer les variables d'environnement

Copier `env.example` vers `.env.local` et remplir :

```bash
cp env.example .env.local
```

**Clés essentielles :**

```bash
# Supabase (obligatoire)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# fal.ai (images, vidéos, voix IA)
FAL_API_KEY=xxx

# Gemini (chat IA)
GOOGLE_GEMINI_API_KEY=xxx

# AssemblyAI (transcription voix)
ASSEMBLYAI_API_KEY=xxx
```

### 3️⃣ Configurer Supabase

1. Va sur https://supabase.com/dashboard/project/xxx/sql/new
2. Copie-colle le contenu de `supabase/schema-clean.sql`
3. Clique sur **Run**
4. (Optionnel) Applique les migrations dans `supabase/migrations/`

### 4️⃣ Lancer l'app

#### Version Web (navigateur/iPad)
```bash
npm run dev
```

#### Version Desktop (Electron)
```bash
npm run dev:electron
```

### 5️⃣ Ouvrir dans le navigateur

👉 http://localhost:3000

### 6️⃣ Première connexion

**Compte admin existant :**
| | |
|---|---|
| Email | `admin@admin.com` |
| Mot de passe | `admin123` |
| Rôle | Mentor |

---

## 🎯 Les 5 Modes

| Mode | Sidebar | Description |
|------|---------|-------------|
| 📔 **Journal** | Icône livre | Écrire son journal intime |
| ✍️ **Écriture** | Icône stylo | Créer des histoires |
| 🎨 **Studio** | Icône palette | Générer des images/vidéos IA |
| 📐 **Montage** | Icône règle | Créer le livre-disque (audio + timing) |
| 🎭 **Théâtre** | Icône masques | Présenter ses créations |

---

## 🤖 L'IA-Amie

### Première utilisation

À la première connexion, l'enfant personnalise son IA :
1. **Son prénom** → L'IA l'utilisera
2. **Nom de l'IA** → Choix libre (Étoile, Lune, etc.)
3. **Voix de l'IA** → Parmi les voix premium du navigateur

### Fonctionnalités

| Icône | Fonction |
|-------|----------|
| 🔊 | Toggle voix IA (activé par défaut) |
| 🎙️ | Parler à l'IA (micro) |
| 💬 | Envoyer un message texte |

### Guidage visuel

L'IA peut faire **clignoter des boutons** pour guider l'enfant !

```
"Pour ajouter une image, clique sur le bouton qui clignote !"
→ Le bouton 📷 brille pendant 6 secondes
```

---

## ✍️ Mode Écriture

### Créer une histoire

1. Cliquer sur **✍️ Écriture** dans la sidebar
2. Entrer un **titre** pour l'histoire
3. Choisir une **structure narrative** :
   - 📖 Conte Classique (5-8 pages)
   - 🗺️ Aventure (6-10 pages)
   - 🧩 Problème-Solution (4-6 pages)
   - 📔 Journal Illustré (3-5 pages)
   - 🔄 La Boucle (4-6 pages)
   - 🎨 Libre (illimité)

### Interface

```
┌────────────────────────────────────────────────────────────────┐
│  [Onglets]  Page 1 | Page 2 | Page 3 | +                       │
├────────────────────────────────────┬───────────────────────────┤
│                                    │  💜 [Nom IA]   🔊         │
│  [Barre de formatage]              │                           │
│                                    │  Chat avec l'IA           │
│  ┌──────────────────────────────┐  │                           │
│  │ Zone d'écriture              │  │  [📖 Lis ma page!]        │
│  │                              │  │                           │
│  ├──────────────────────────────┤  │                           │
│  │ [🎙️][📷][🖼️][🎨]            │  │  [Écrire...] 🎙️ 💬       │
│  └──────────────────────────────┘  └───────────────────────────┘
└────────────────────────────────────────────────────────────────┘
```

### Barre d'outils page

| Icône | Fonction |
|-------|----------|
| 🎙️ | Dicter du texte |
| 📷 | Ajouter une image |
| 🖼️ | Fond de page |
| 🎨 | Décorations premium |

---

## 🎬 Mode Montage

### Vue Cartes (simple)

Pour chaque scène :
1. **Ma voix** → Enregistrer sa propre voix
2. **IA raconte** → Générer une voix ElevenLabs

L'IA est disponible pour aider (chat sur le côté).

### Vue Timeline (avancée)

Rubans disponibles :
- 📝 **Structure** : Phrases synchronisées
- 🖼️ **Médias** : Images et vidéos
- 🎵 **Musique** : Ambiance de fond
- 🔊 **Sons** : Effets sonores
- 💡 **Lumières** : Scénario HomeKit
- ✨ **Déco** : Décorations animées
- 🎬 **Anim** : Animations
- 🌟 **Effets** : Effets visuels

**Aide IA :** Bouton flottant (déplaçable) en haut à droite.

---

## 🖥️ Version Desktop (Electron)

### Lancer en développement

```bash
npm run dev:electron
```

### Builder l'application

```bash
npm run build:electron
```

### Voix macOS requises

Installer dans **Réglages > Accessibilité > Contenu énoncé > Voix système** :

| Voix | Langue |
|------|--------|
| Audrey (Enhanced) | Français |
| Samantha | Anglais (déjà installée) |
| Milena (Enhanced) | Russe |

---

## 🔧 Configuration Admin

### Se configurer en Super Admin

1. Créer un compte sur l'app
2. Dans Supabase SQL Editor :
```sql
INSERT INTO super_admins (user_id, name)
VALUES ('VOTRE_USER_ID', 'Admin');
```
3. Rafraîchir l'app → Bouton "Admin" apparaît dans la sidebar

### Clés API par famille

Les familles peuvent avoir leurs propres clés API :
1. Super Admin → Créer une famille
2. Configurer les clés dans l'interface admin
3. Les clés sont utilisées automatiquement pour cette famille

---

## 🆘 Problèmes courants

### "Port 3000 is in use"

```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Le micro ne fonctionne pas

- **Chrome/Edge/Safari** : Supporté ✅
- **Firefox** : Non supporté ❌
- Vérifie que le site a la permission d'accéder au micro

### L'IA ne parle pas

**Sur Electron (macOS)** :
```bash
say -v 'Audrey (Enhanced)' "Test"
```
Si ça ne marche pas, installe la voix (voir section Electron).

**Sur Web/iPad** :
- Le navigateur doit supporter Web Speech API
- Safari et Chrome sont supportés
- Vérifie que le volume n'est pas à zéro

### La voix IA est trop rapide

La vitesse a été réduite pour les enfants. Si toujours trop rapide, c'est un problème de voix système.

### L'histoire ne se sauvegarde pas

- Les histoires sont sauvegardées automatiquement
- Vérifie la connexion Supabase dans la console

### Les animations de guidage ne s'arrêtent pas

Les animations s'arrêtent après 6 secondes. Si ça persiste :
- Rafraîchir la page
- Vérifier la console pour erreurs

---

## 📞 Support

Consulte la documentation complète :
- `README.md` - Vue d'ensemble
- `docs/ARCHITECTURE.md` - Architecture technique
- `docs/HANDOVER.md` - Guide de passation complet
- `docs/API.md` - Documentation API
