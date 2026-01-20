# 📸 Screenshots à capturer pour les tutoriels Studio

Ce dossier doit contenir les images de tutoriel pour fal.ai (niveaux 3, 4, 5).

> **Niveaux 1-2** : Génération automatique via l'API (pas besoin de tutoriel)
> **Niveaux 3-5** : L'enfant va sur fal.ai, colle le prompt, génère et télécharge

---

## 🎨 fal.ai Images - Flux Pro (5 images)

| Fichier | Description |
|---------|-------------|
| `falai-image-01-home.png` | Page d'accueil fal.ai Flux playground |
| `falai-image-02-prompt.png` | Zone de texte "prompt" mise en évidence |
| `falai-image-03-paste.png` | Prompt collé dans la zone de texte |
| `falai-image-04-run.png` | Bouton "Run" mis en évidence (bleu/violet) |
| `falai-image-05-result.png` | Image générée avec menu contextuel "Enregistrer sous..." |

**URL** : https://fal.ai/models/fal-ai/flux-pro/v1.1/playground

---

## 🎬 fal.ai Vidéos - Kling 2.1 (5 images)

| Fichier | Description |
|---------|-------------|
| `falai-video-01-home.png` | Page d'accueil fal.ai Kling playground |
| `falai-video-02-prompt.png` | Zone de texte pour le prompt vidéo |
| `falai-video-03-paste.png` | Prompt vidéo collé |
| `falai-video-04-run.png` | Bouton "Run" mis en évidence |
| `falai-video-05-result.png` | Vidéo générée avec bouton download (flèche ↓) |

**URL** : https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/text-to-video/playground

---

## 📐 Spécifications techniques

- **Format** : PNG (ou GIF animé pour montrer les clics)
- **Taille** : ~1200x800 pixels (ratio 16:9)
- **Style** : 
  - Interface claire, pas de données personnelles
  - Encadrer en rouge/jaune les zones importantes
  - Flèches pour guider le regard

---

## 🎯 Objectifs pédagogiques par niveau

### Niveau 3
- L'enfant apprend à aller sur Safari
- Découvre l'interface fal.ai
- Suit le tutoriel pas à pas

### Niveau 4  
- L'enfant devient autonome
- Moins de guidage visuel
- Peut personnaliser les paramètres

### Niveau 5
- Expert : utilisation libre
- Peut explorer d'autres modèles fal.ai
- Comprend les concepts de prompt engineering

---

## 💡 Alternative en attendant les screenshots

Le composant `TutorialGuide.tsx` affiche des placeholders descriptifs.
Tu peux aussi utiliser des GIFs animés pour montrer les interactions !

## 📁 Structure des fichiers

```
public/tutorials/
├── SCREENSHOTS_A_CAPTURER.md  (ce fichier)
├── falai-image-01-home.png
├── falai-image-02-prompt.png
├── falai-image-03-paste.png
├── falai-image-04-run.png
├── falai-image-05-result.png
├── falai-video-01-home.png
├── falai-video-02-prompt.png
├── falai-video-03-paste.png
├── falai-video-04-run.png
└── falai-video-05-result.png
```
