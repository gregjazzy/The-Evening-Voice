-- ===========================================
-- LA VOIX DU SOIR - Schéma de Base de Données
-- ===========================================

-- Extension pour les UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- TABLE: profiles
-- Profils des utilisateurs (enfants + mentors)
-- ===========================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('child', 'mentor', 'parent')),
  
  -- Progression et acquis
  missions_completed INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]'::jsonb,
  skills_unlocked JSONB DEFAULT '[]'::jsonb,
  
  -- Préférences
  preferred_voice_id TEXT,
  preferred_style TEXT DEFAULT 'magique',
  
  -- Contexte émotionnel (pour l'IA)
  emotional_context JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide par user_id
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- ===========================================
-- TABLE: stories (Livres/Histoires)
-- ===========================================
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_image_url TEXT,
  
  -- État du livre
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'published')),
  is_public BOOLEAN DEFAULT false,
  
  -- Métadonnées
  total_pages INTEGER DEFAULT 0,
  current_page INTEGER DEFAULT 1,
  
  -- Données du livre (JSON pour flexibilité)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_stories_profile_id ON stories(profile_id);
CREATE INDEX idx_stories_status ON stories(status);

-- ===========================================
-- TABLE: story_pages (Pages des histoires)
-- ===========================================
CREATE TABLE story_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  
  page_number INTEGER NOT NULL,
  title TEXT,
  
  -- Contenu de la page
  background_image_url TEXT,
  background_video_url TEXT,
  
  -- Blocs de texte (JSON array)
  text_blocks JSONB DEFAULT '[]'::jsonb,
  
  -- Couches média (JSON array)
  media_layers JSONB DEFAULT '[]'::jsonb,
  
  -- Pistes audio (JSON array)
  audio_tracks JSONB DEFAULT '[]'::jsonb,
  
  -- Ambiance pour domotique
  ambiance TEXT DEFAULT 'jour',
  light_color TEXT DEFAULT '#FFE4B5',
  light_intensity INTEGER DEFAULT 80,
  
  -- État de la page
  is_sealed BOOLEAN DEFAULT false,
  sealed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(story_id, page_number)
);

CREATE INDEX idx_story_pages_story_id ON story_pages(story_id);

-- ===========================================
-- TABLE: assets (Images, Sons, Vidéos)
-- ===========================================
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  
  -- Type et source
  type TEXT NOT NULL CHECK (type IN ('image', 'audio', 'video')),
  source TEXT NOT NULL CHECK (source IN ('midjourney', 'elevenlabs', 'runway', 'luma', 'gemini', 'upload', 'dalle')),
  
  -- URLs
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Métadonnées de génération
  prompt_used TEXT,
  generation_params JSONB DEFAULT '{}'::jsonb,
  
  -- Fichier
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  duration_seconds NUMERIC, -- Pour audio/video
  
  -- Tags pour recherche
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assets_profile_id ON assets(profile_id);
CREATE INDEX idx_assets_story_id ON assets(story_id);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_source ON assets(source);

-- ===========================================
-- TABLE: diary_entries (Journal intime)
-- ===========================================
CREATE TABLE diary_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Contenu
  content TEXT NOT NULL,
  mood TEXT CHECK (mood IN ('happy', 'sad', 'excited', 'calm', 'dreamy')),
  
  -- Audio (si dicté)
  audio_url TEXT,
  
  -- Image souvenir générée
  memory_image_url TEXT,
  memory_image_prompt TEXT,
  
  -- Réponse de l'IA
  ai_response TEXT,
  
  -- Métadonnées
  weather TEXT,
  location TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_diary_entries_profile_id ON diary_entries(profile_id);
CREATE INDEX idx_diary_entries_mood ON diary_entries(mood);
CREATE INDEX idx_diary_entries_created_at ON diary_entries(created_at DESC);

-- ===========================================
-- TABLE: chat_messages (Historique IA)
-- ===========================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Contexte
  context_type TEXT DEFAULT 'general' CHECK (context_type IN ('diary', 'book', 'studio', 'general')),
  related_entity_id UUID, -- ID du diary_entry ou story associé
  
  -- Métadonnées IA
  model_used TEXT,
  tokens_used INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_profile_id ON chat_messages(profile_id);
CREATE INDEX idx_chat_messages_context ON chat_messages(context_type);

-- ===========================================
-- TABLE: generation_jobs (Jobs de génération)
-- ===========================================
CREATE TABLE generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Type de génération
  job_type TEXT NOT NULL CHECK (job_type IN ('image', 'voice', 'video', 'music')),
  service TEXT NOT NULL, -- midjourney, elevenlabs, runway, etc.
  
  -- Paramètres
  prompt TEXT NOT NULL,
  params JSONB DEFAULT '{}'::jsonb,
  
  -- État
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0,
  
  -- Résultat
  result_url TEXT,
  result_data JSONB,
  error_message TEXT,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_generation_jobs_profile_id ON generation_jobs(profile_id);
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status);

-- ===========================================
-- TABLE: mentor_sessions (Sessions de mentorat)
-- ===========================================
CREATE TABLE mentor_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_code TEXT UNIQUE NOT NULL,
  
  mentor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Enfants connectés
  connected_children UUID[] DEFAULT '{}',
  
  -- État
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  
  -- Contrôle
  control_active BOOLEAN DEFAULT false,
  controlled_child_id UUID,
  
  -- Partage d'écran
  screen_sharing_active BOOLEAN DEFAULT false,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_mentor_sessions_code ON mentor_sessions(session_code);
CREATE INDEX idx_mentor_sessions_mentor_id ON mentor_sessions(mentor_id);

-- ===========================================
-- TABLE: realtime_state (État partagé temps réel)
-- ===========================================
CREATE TABLE realtime_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES mentor_sessions(id) ON DELETE CASCADE,
  
  -- État partagé
  current_mode TEXT,
  current_page_id UUID,
  cursor_position JSONB, -- {x, y, userId}
  
  -- Dernière mise à jour
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_realtime_state_session_id ON realtime_state(session_id);

-- ===========================================
-- TRIGGERS pour updated_at automatique
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER story_pages_updated_at
  BEFORE UPDATE ON story_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER diary_entries_updated_at
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies pour stories (accessible par owner et mentors)
CREATE POLICY "Users can manage own stories"
  ON stories FOR ALL
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Policies pour diary_entries (très privé)
CREATE POLICY "Users can manage own diary"
  ON diary_entries FOR ALL
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ===========================================
-- ENABLE REALTIME pour certaines tables
-- ===========================================
ALTER PUBLICATION supabase_realtime ADD TABLE realtime_state;
ALTER PUBLICATION supabase_realtime ADD TABLE story_pages;
ALTER PUBLICATION supabase_realtime ADD TABLE mentor_sessions;

