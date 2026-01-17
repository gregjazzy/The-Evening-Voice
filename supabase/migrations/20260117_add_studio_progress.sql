-- ===========================================
-- Migration: Ajouter table studio_progress
-- ===========================================
-- IDEMPOTENT: Peut être relancée sans erreur

-- Table pour stocker la progression pédagogique du Studio
CREATE TABLE IF NOT EXISTS studio_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Progression Images (Midjourney)
  image_level INTEGER DEFAULT 1 CHECK (image_level BETWEEN 1 AND 5),
  image_creations_in_level INTEGER DEFAULT 0,
  image_total_creations INTEGER DEFAULT 0,
  
  -- Progression Vidéos (Runway)
  video_level INTEGER DEFAULT 1 CHECK (video_level BETWEEN 1 AND 5),
  video_creations_in_level INTEGER DEFAULT 0,
  video_total_creations INTEGER DEFAULT 0,
  
  -- Historique des créations (JSON array)
  creations JSONB DEFAULT '[]'::jsonb,
  
  -- Badges obtenus (JSON array)
  badges JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index (idempotent)
CREATE INDEX IF NOT EXISTS idx_studio_progress_profile_id ON studio_progress(profile_id);

-- RLS (idempotent - ALTER TABLE ne crée pas d'erreur si déjà activé)
ALTER TABLE studio_progress ENABLE ROW LEVEL SECURITY;

-- Policy (idempotent avec DROP IF EXISTS)
DROP POLICY IF EXISTS "Users can manage own studio progress" ON studio_progress;
CREATE POLICY "Users can manage own studio progress"
  ON studio_progress FOR ALL
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Trigger (idempotent avec DROP IF EXISTS)
DROP TRIGGER IF EXISTS studio_progress_updated_at ON studio_progress;
CREATE TRIGGER studio_progress_updated_at
  BEFORE UPDATE ON studio_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
