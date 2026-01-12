CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('child', 'mentor', 'parent')),
  missions_completed INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]'::jsonb,
  skills_unlocked JSONB DEFAULT '[]'::jsonb,
  preferred_voice_id TEXT,
  preferred_style TEXT DEFAULT 'magique',
  emotional_context JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);

CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_image_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'published')),
  is_public BOOLEAN DEFAULT false,
  total_pages INTEGER DEFAULT 0,
  current_page INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_stories_profile_id ON stories(profile_id);
CREATE INDEX idx_stories_status ON stories(status);

CREATE TABLE story_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  title TEXT,
  background_image_url TEXT,
  background_video_url TEXT,
  text_blocks JSONB DEFAULT '[]'::jsonb,
  media_layers JSONB DEFAULT '[]'::jsonb,
  audio_tracks JSONB DEFAULT '[]'::jsonb,
  ambiance TEXT DEFAULT 'jour',
  light_color TEXT DEFAULT '#FFE4B5',
  light_intensity INTEGER DEFAULT 80,
  is_sealed BOOLEAN DEFAULT false,
  sealed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, page_number)
);

CREATE INDEX idx_story_pages_story_id ON story_pages(story_id);

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'audio', 'video')),
  source TEXT NOT NULL CHECK (source IN ('midjourney', 'elevenlabs', 'runway', 'luma', 'gemini', 'upload', 'dalle')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  prompt_used TEXT,
  generation_params JSONB DEFAULT '{}'::jsonb,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  duration_seconds NUMERIC,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assets_profile_id ON assets(profile_id);
CREATE INDEX idx_assets_story_id ON assets(story_id);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_source ON assets(source);

CREATE TABLE diary_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mood TEXT CHECK (mood IN ('happy', 'sad', 'excited', 'calm', 'dreamy')),
  audio_url TEXT,
  memory_image_url TEXT,
  memory_image_prompt TEXT,
  ai_response TEXT,
  weather TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_diary_entries_profile_id ON diary_entries(profile_id);
CREATE INDEX idx_diary_entries_mood ON diary_entries(mood);
CREATE INDEX idx_diary_entries_created_at ON diary_entries(created_at DESC);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  context_type TEXT DEFAULT 'general' CHECK (context_type IN ('diary', 'book', 'studio', 'general')),
  related_entity_id UUID,
  model_used TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_profile_id ON chat_messages(profile_id);
CREATE INDEX idx_chat_messages_context ON chat_messages(context_type);

CREATE TABLE generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('image', 'voice', 'video', 'music')),
  service TEXT NOT NULL,
  prompt TEXT NOT NULL,
  params JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0,
  result_url TEXT,
  result_data JSONB,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_generation_jobs_profile_id ON generation_jobs(profile_id);
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status);

CREATE TABLE mentor_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_code TEXT UNIQUE NOT NULL,
  mentor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  connected_children UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  control_active BOOLEAN DEFAULT false,
  controlled_child_id UUID,
  screen_sharing_active BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_mentor_sessions_code ON mentor_sessions(session_code);
CREATE INDEX idx_mentor_sessions_mentor_id ON mentor_sessions(mentor_id);

CREATE TABLE realtime_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES mentor_sessions(id) ON DELETE CASCADE,
  current_mode TEXT,
  current_page_id UUID,
  cursor_position JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_realtime_state_session_id ON realtime_state(session_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER stories_updated_at BEFORE UPDATE ON stories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER story_pages_updated_at BEFORE UPDATE ON story_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER diary_entries_updated_at BEFORE UPDATE ON diary_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own stories" ON stories FOR ALL USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own pages" ON story_pages FOR ALL USING (story_id IN (SELECT id FROM stories WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));
CREATE POLICY "Users can manage own assets" ON assets FOR ALL USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own diary" ON diary_entries FOR ALL USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own chat" ON chat_messages FOR ALL USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own jobs" ON generation_jobs FOR ALL USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Mentors can manage sessions" ON mentor_sessions FOR ALL USING (mentor_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE realtime_state;
ALTER PUBLICATION supabase_realtime ADD TABLE story_pages;
ALTER PUBLICATION supabase_realtime ADD TABLE mentor_sessions;

