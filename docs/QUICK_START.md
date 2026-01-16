# 🚀 Guide de Démarrage Rapide

## En 5 minutes chrono !

### 1️⃣ Installer les dépendances

```bash
cd lavoixdusoir
npm install
```

### 2️⃣ Configurer Supabase

1. Va sur https://supabase.com/dashboard/project/frufyxrhpqxhnawmrhru/sql/new
2. Copie-colle le contenu de `supabase/schema-clean.sql`
3. Clique sur **Run**

### 3️⃣ Lancer l'app

#### Version Web (navigateur/iPad)
```bash
npm run dev
```

#### Version Desktop (Electron)
```bash
npm run dev:electron
```

### 4️⃣ Ouvrir dans le navigateur

👉 http://localhost:3000

### 5️⃣ Se connecter

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
| 🎨 **Studio** | Icône palette | Générer des images IA |
| 📐 **Montage** | Icône règle | Mettre en page |
| 🎭 **Théâtre** | Icône masques | Présenter ses créations |

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

### Interface d'écriture

```
┌────────────────────────────────────────────────────────────────┐
│  [Onglets]  Page 1 | Page 2 | Page 3 | +                       │
├────────────────────────────────────┬───────────────────────────┤
│                                    │  💜 Luna      🔊          │
│  [Barre de formatage]              │                           │
│                                    │  Chat avec Luna           │
│  ┌──────────────────────────────┐  │                           │
│  │ Zone d'écriture              │  │  [📖 Luna, lis ma page!]  │
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

## 🖼️ Fond de Page (Nouveau !)

### Ajouter un fond

1. Cliquer sur **🖼️ Fond de page** en bas de la page
2. Choisir une image ou vidéo
3. Ajuster les contrôles dans la barre d'outils :
   - **Opacité** : Slider 0-100%
   - **Zoom** : Slider 10-300%
   - **Éditer position** : Activer pour déplacer le fond à la souris

### Supprimer un fond

- Cliquer sur **🖼️** et sélectionner "Supprimer le fond"

---

## 🎨 Décorations Premium (Nouveau !)

### Ajouter une décoration

1. Cliquer sur **🎨 Décorations** en bas de la page
2. Choisir une **catégorie** :
   - ✨ Ornements Dorés
   - 🌸 Floraux
   - 👑 Royaux
   - ⭐ Célestes
   - 🦋 Artistiques
   - 🖼️ Cadres
3. Cliquer sur une décoration pour l'ajouter

### Éditer une décoration

1. **Cliquer** sur la décoration sur la page
2. Le **menu d'édition** apparaît avec :
   - Taille (20-300%)
   - Rotation (-180° à 180°)
   - Opacité (20-100%)
   - Couleur (12 choix)
   - Flip horizontal/vertical
   - **Luminosité** (effet glow)
3. **Déplacer le menu** en glissant le header (icône ✥)

### Effet de Luminosité

1. Dans le menu d'édition, activer **Luminosité**
2. Ajuster l'**intensité** avec le slider
3. Choisir la **couleur du halo**

### Déplacer une décoration

- **Cliquer-glisser** la décoration vers sa nouvelle position

### Supprimer une décoration

- Cliquer sur la **croix rouge** (visible quand la décoration est sélectionnée)
- Ou cliquer sur **Supprimer** dans le menu

---

## 📔 Mode Journal

| Icône | Action | Comment |
|-------|--------|---------|
| 🎙️ | Enregistrer sa voix | Clic → parler → re-clic |
| 📷 | Ajouter des photos | Clic → choisir fichiers |
| ✨ | Créer image IA | Clic → décrire → créer |
| 😊 | Choisir son humeur | Clic sur un emoji en haut |
| 🔊 | Mode Oral Luna | Toggle en haut du chat |

---

## 🤖 Luna - L'IA-Amie

### Activer le Mode Oral

1. Dans le chat avec Luna, toggle le bouton 🔊
2. Luna parlera automatiquement ses réponses

### Parler à Luna

1. Clique sur 🎙️ à côté du champ de texte
2. Parle ta question
3. Luna répond (en texte et/ou en voix)

### Les 5 Clés Magiques (pour les images)

| Clé | Ce que Luna enseigne |
|-----|---------------------|
| 🎨 Style | "Cartoon, peinture, photo ?" |
| 🦸 Héros | "Qui ou quoi ? Décris-le !" |
| 💫 Ambiance | "Quelle émotion ? Quelle lumière ?" |
| 🌍 Monde | "Où ? Jour ou nuit ?" |
| ✨ Magie | "Quel détail unique ?" |

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

### Luna ne parle pas

**Sur Electron (macOS)** :
```bash
say -v 'Audrey (Enhanced)' "Test"
```
Si ça ne marche pas, installe la voix (voir section Electron).

**Sur Web/iPad** :
- Le navigateur doit supporter Web Speech API
- Safari et Chrome sont supportés

### L'histoire ne se sauvegarde pas

- Les histoires sont sauvegardées automatiquement dans le navigateur (localStorage)
- Si tu changes de navigateur, les histoires ne seront pas là

### Les décorations ne s'affichent pas en mode zoom

- Ce bug a été corrigé ! Rafraîchis la page si nécessaire

### Le menu d'édition est caché

- Le menu peut être déplacé ! Glisse le header (icône ✥)

---

## 📞 Support

Consulte la documentation complète :
- `README.md` - Vue d'ensemble
- `docs/ARCHITECTURE.md` - Architecture technique
- `docs/HANDOVER.md` - Guide de passation complet
- `docs/API.md` - Documentation API
