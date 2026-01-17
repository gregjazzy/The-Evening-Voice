# 🎤 Samples de voix ElevenLabs à générer

Pour permettre aux utilisateurs d'écouter un extrait avant de choisir une voix, nous avons besoin de pré-générer des samples audio.

## Textes à utiliser pour les samples

### 🇫🇷 Français
```
Il était une fois, dans un royaume lointain, une princesse qui rêvait d'aventures magiques...
```

### 🇬🇧 Anglais
```
Once upon a time, in a faraway kingdom, there lived a princess who dreamed of magical adventures...
```

### 🇷🇺 Russe
```
Давным-давно, в далёком королевстве, жила-была принцесса, которая мечтала о волшебных приключениях...
```

---

## Fichiers à créer

### 🇫🇷 Français (`/fr/`)
| Fichier | Voix ElevenLabs | Description |
|---------|-----------------|-------------|
| `amelie.mp3` | Voix féminine douce | Chaleureuse pour les contes |
| `fee.mp3` | Voix féminine légère | Féerique et magique |
| `mamie.mp3` | Voix féminine âgée | Grand-mère bienveillante |
| `conteur.mp3` | Voix masculine narrative | Conteur classique |
| `magicien.mp3` | Voix masculine mystérieuse | Magicien envoûtant |
| `dragon.mp3` | Voix masculine grave | Dragon gentil |
| `papy.mp3` | Voix masculine âgée | Grand-père sage |

### 🇬🇧 Anglais (`/en/`)
| Fichier | Voix ElevenLabs | Description |
|---------|-----------------|-------------|
| `aria.mp3` | Warm female voice | Expressive storyteller |
| `fairy.mp3` | Light female voice | Magical fairy |
| `grandma.mp3` | Elderly female voice | Kind grandmother |
| `storyteller.mp3` | Male narrative voice | Classic storyteller |
| `wizard.mp3` | Mysterious male voice | Enchanting wizard |
| `dragon.mp3` | Deep male voice | Friendly dragon |
| `grandpa.mp3` | Elderly male voice | Wise grandfather |

### 🇷🇺 Russe (`/ru/`)
| Fichier | Voix ElevenLabs | Description |
|---------|-----------------|-------------|
| `natasha.mp3` | Женский тёплый голос | Душевная рассказчица |
| `feya.mp3` | Женский лёгкий голос | Волшебная фея |
| `babushka.mp3` | Женский пожилой голос | Добрая бабушка |
| `skazochnik.mp3` | Мужской голос рассказчика | Классический сказочник |
| `koldun.mp3` | Мужской таинственный голос | Загадочный колдун |
| `drakon.mp3` | Мужской глубокий голос | Дружелюбный дракон |
| `dedushka.mp3` | Мужской пожилой голос | Мудрый дедушка |

---

## Comment générer les samples

### Option 1 : Via ElevenLabs.io
1. Aller sur https://elevenlabs.io/app/speech-synthesis
2. Sélectionner la voix souhaitée
3. Coller le texte correspondant à la langue
4. Télécharger le MP3
5. Renommer et placer dans le bon dossier

### Option 2 : Via API (script automatisé)
```bash
# À implémenter : script de génération batch
npm run generate-voice-samples
```

---

## Format des fichiers
- **Format** : MP3
- **Qualité** : 128kbps minimum
- **Durée** : ~5-8 secondes par sample
- **Taille** : ~100KB par fichier

---

## Coût estimé
- 21 samples × ~200 caractères = ~4200 caractères
- Avec ElevenLabs Creator ($22/mois) : inclus dans le quota mensuel
- Total one-time : < $1 de crédits
