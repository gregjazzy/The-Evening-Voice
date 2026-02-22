# Story App - Project Instructions

## Origin
This project is a fork of "La Voix du Soir" (lavoixdusoir). Same codebase, same Supabase backend, but with a fundamentally different philosophy.

## Client Brief
- Client: billionaire parent, app for her 8-year-old daughters
- Budget: 34k
- Philosophy: **vibe coding** — children learn by doing, not by being taught
- Separate Netlify deployment (new project), same Supabase backend

## Core Principle: AI as Tool, Never as Creative Partner

The AI must NEVER:
- Suggest story ideas, characters, plot twists, or creative directions
- Propose options ("would you prefer a dragon or a cat?")
- Guide the child through frameworks (no "5 Magic Questions", no "5 Magic Keys")
- Offer unsolicited advice or feedback
- Teach proactively

The AI MUST only:
- Answer technical/interface questions when asked ("how do I change the font size?", "how do I add an image?")
- Execute what the child asks (generate image from prompt, etc.)
- Stay silent otherwise

## Writing Mode Changes
- Remove all AI creative guidance from story writing
- No story suggestions, no character ideas, no plot help
- AI only helps with tool usage questions (interface, features, how-to)
- Child writes freely with zero AI involvement in content

## Studio/Image Mode Changes
- Remove scaffolding (no "5 Magic Keys", no progressive levels 1-5)
- Child writes a free prompt -> image is generated directly
- No AI suggestions before or after generation
- If child is unhappy with result, two options:
  1. She re-prompts directly (pure vibe coding iteration)
  2. She clicks "help me understand" -> she MUST describe what disappointed her -> then AI explains why the result came out that way (gap between intention and result)
- The "help me understand" flow is ON DEMAND only, never automatic
- The child must make the effort to verbalize her disappointment before getting any explanation

## What to Keep
- All the creation tools (image generation, video, audio, decorations, text boxes, etc.)
- The book/publish pipeline (PDF export, Gelato printing)
- Theater mode, montage mode
- The full UI/UX (pages, media, backgrounds, etc.)
- Same Supabase backend, same storage

## What to Remove/Modify
- AI-Amie's creative personality (she becomes a neutral technical assistant)
- All system prompts that make AI suggest or guide creatively
- Progressive level systems (studio levels, challenge progression)
- The "5 Questions Magiques" framework
- The "5 Cles Magiques" framework
- Challenge mode (or rethink it for vibe coding approach)
- Intro modals that explain pedagogical objectives
- Any UI that forces a guided flow before the child can create

## Tech Stack
- **Framework**: Next.js 14.2.35 (App Router), TypeScript 5.4.5
- **Package manager**: npm
- **Styling**: Tailwind CSS (custom theme: midnight/stardust/aurora/dream palettes, Cormorant Garamond/Nunito/Caveat fonts)
- **State management**: Zustand with `persist` middleware + Supabase sync
- **i18n**: next-intl — locales: `fr` (default), `en`, `ru` — translations in `/messages/*.json`
- **Backend**: Supabase (auth, DB, storage, realtime)
- **AI**: Google Gemini 2.0 Flash (chat), fal.ai (Flux/Recraft/Kling images+video), ElevenLabs (TTS)
- **Deployment**: Netlify (`@netlify/plugin-nextjs`, Node 20.9.0)
- **Desktop**: Electron (macOS)
- **No test framework** — testing is manual

## Commands
```bash
npm run dev          # Next.js + WebRTC signaling server (concurrently)
npm run dev:client   # Next.js only
npm run dev:server   # WebRTC signaling server only (port 3001)
npm run build        # Production build
npm run lint         # ESLint (Next.js defaults)
npm run db:push      # Push Supabase schema
npm run db:migrate   # Run Supabase migrations
```

## Project Structure
```
src/
├── app/
│   ├── [locale]/          # i18n routes (fr/en/ru)
│   ├── api/               # API routes (see below)
│   └── auth/              # Auth callback
├── components/
│   ├── modes/             # BookMode, StudioMode, ChallengeMode, PublishMode, TheaterMode, CollabMode
│   ├── studio/            # PromptBuilder, StudioAIChat, StudioMagicKeys, AssetDropzone
│   ├── montage/           # Video montage editor, timeline, karaoke
│   ├── ui/                # Reusable components (ModeIntroModal, LevelUpModal, etc.)
│   ├── navigation/        # Sidebar
│   ├── mentor/            # WebRTC mentor
│   ├── admin/             # Admin panels
│   └── editor/            # Content editors
├── hooks/                 # Custom hooks (usePdfExport, useHomeKit, useSupabaseSync, etc.)
├── lib/
│   ├── ai/                # AI integration (gemini.ts, fal.ts, elevenlabs.ts, prompting-pedagogy.ts)
│   ├── supabase/          # Client, server, middleware, types, realtime
│   ├── export/            # PDF/video export
│   ├── gelato/            # Book printing API
│   ├── mux/               # Video encoding
│   ├── r2/                # Cloudflare R2 storage
│   └── i18n/              # i18n config
├── store/                 # Zustand stores (see below)
├── data/                  # Static data (decorations, challenge images)
└── i18n/                  # Routing config
messages/                  # Translation files (fr.json, en.json, ru.json)
supabase/                  # Config & migrations
server/                    # WebRTC signaling server (Socket.io)
electron/                  # Electron desktop app
```

## API Routes (`src/app/api/`)
- `ai/chat` — Chat with AI (Gemini), content moderation, highlight commands
- `ai/image` — Image generation (Flux/Recraft via fal.ai)
- `ai/image/upscale` — Image upscaling
- `ai/video` — Video generation (Kling via fal.ai)
- `ai/narration` — Text-to-speech (ElevenLabs)
- `ai/transcribe` — Audio transcription (AssemblyAI)
- `ai/challenge-analyze` — Challenge mode AI feedback
- `ai/voice/*` — Voice design, narration, character voices
- `story/save`, `story/delete` — Story CRUD (bypasses RLS)
- `upload/image`, `upload/video`, `upload/pdf`, `upload/presign`, `upload/from-url`, `upload/r2-proxy`
- `gelato/*` — Book printing quotes & orders
- `export/video` — Video export (Mux HD/4K)
- `admin/config`, `admin/families/*` — Admin management
- `auth/update-profile` — Profile updates

## Zustand Stores (`src/store/`)
| Store | Purpose |
|---|---|
| `useAppStore` | Stories, pages, diary, chat, assets, AI preferences |
| `useAuthStore` | Auth, session, profile (child/mentor/parent roles) |
| `useStudioStore` | Studio creation tools, PromptKit, SafariBridge |
| `useStudioProgressStore` | Studio pedagogy progression (levels 1-5, badges) |
| `usePublishStore` | Publishing workflow, PDF export, Gelato orders |
| `useMontageStore` | Video montage timeline & scenes |
| `useHighlightStore` | AI visual guidance (highlight UI elements) |
| `useMentorStore` | WebRTC mentor connection, screen sharing |
| `useChallengeProgressStore` | Challenge mode progress |
| `useNotificationStore` | Toast notifications |
| `useAdminStore` | Admin panel state |

## AI Prompts — Key Files to Modify
| File | Content | Action needed |
|---|---|---|
| `src/lib/ai/gemini.ts` (2358 lines) | All system prompts: `getBasePrompt()`, `getStudioImagePrompt()`, `getStudioVideoPrompt()`, `getWritingPrompt()` | Rewrite: remove creative personality, make neutral technical assistant |
| `src/lib/ai/prompting-pedagogy.ts` (56KB) | "5 Magic Keys" + "5 Magic Questions" frameworks, XP/leveling | Remove or gut entirely |
| `src/components/studio/PromptBuilder.tsx` (142KB) | Progressive prompt building UI with guided steps | Simplify to free-form prompt input |
| `src/components/studio/StudioAIChat.tsx` (45KB) | AI guidance chat in studio | Strip creative guidance, keep technical Q&A |
| `src/components/studio/StudioMagicKeys.tsx` (15KB) | "5 Keys" visualization | Remove |
| `src/components/modes/BookMode.tsx` (9981 lines) | Full book creation — read in chunks | Remove AI creative help |
| `src/components/modes/StudioMode.tsx` (20KB) | Studio with progressive prompting UI | Remove scaffolding, direct prompt→generate |
| `src/components/modes/ChallengeMode.tsx` (68KB) | Prompting exercises with AI feedback | Remove or rethink for vibe coding |
| `src/components/ui/ModeIntroModal.tsx` | First-visit modals explaining pedagogy | Remove pedagogical content |
| `src/components/ui/LevelUpModal.tsx` | Progression celebrations | Remove |
| `src/store/useStudioProgressStore.ts` | Level progression state | Remove or simplify |
| `src/store/useAppStore.ts` | Contains `promptingProgress` + `writingProgress` | Clean up progression fields |

## Supabase Tables
`profiles`, `stories`, `story_pages`, `montage_projects`, `studio_progress`, `studio_assets`, `challenge_progress`, `diary_entries`, `chat_messages`, `assets`, `generation_jobs`, `mentor_sessions`

## Environment Variables (see `env.example`)
- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Gemini**: `GOOGLE_GEMINI_API_KEY`
- **ElevenLabs**: `ELEVENLABS_API_KEY` + voice IDs (NARRATOR, FAIRY, DRAGON, DEFAULT)
- **Image/Video**: `FAL_API_KEY`, `MIDJOURNEY_API_KEY` (legacy)
- **Storage**: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- **Publishing**: `GELATO_API_KEY`, `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`
- **Optional**: `OPENAI_API_KEY`, `RUNWAY_API_KEY`, `LUMA_API_KEY` (legacy)

## Big Files — Read in Chunks
- `BookMode.tsx` — 9981 lines / 433KB
- `PromptBuilder.tsx` — 142KB
- `PublishMode.tsx` — 94KB
- `ChallengeMode.tsx` — 68KB
- `prompting-pedagogy.ts` — 56KB
- `StudioAIChat.tsx` — 45KB
- `TheaterMode.tsx` — 44KB
- `useMontageStore.ts` — 40KB
- `gemini.ts` — 2358 lines
