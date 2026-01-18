CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  owner_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS family_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  elevenlabs_key TEXT,
  midjourney_key TEXT,
  runway_key TEXT,
  gemini_key TEXT,
  default_narration_voice_fr TEXT,
  default_narration_voice_en TEXT,
  default_narration_voice_ru TEXT,
  default_ai_voice TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id)
);

CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child', 'guest')),
  avatar_emoji TEXT DEFAULT '👤',
  invitation_status TEXT DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'expired')),
  invitation_sent_at TIMESTAMPTZ,
  invitation_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, email)
);

CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS studio_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  image_level INTEGER DEFAULT 1 CHECK (image_level BETWEEN 1 AND 5),
  image_creations_in_level INTEGER DEFAULT 0,
  image_total_creations INTEGER DEFAULT 0,
  video_level INTEGER DEFAULT 1 CHECK (video_level BETWEEN 1 AND 5),
  video_creations_in_level INTEGER DEFAULT 0,
  video_total_creations INTEGER DEFAULT 0,
  creations JSONB DEFAULT '[]'::jsonb,
  badges JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_email ON family_members(email);
CREATE INDEX IF NOT EXISTS idx_family_config_family_id ON family_config(family_id);
CREATE INDEX IF NOT EXISTS idx_families_code ON families(code);
CREATE INDEX IF NOT EXISTS idx_studio_progress_profile_id ON studio_progress(profile_id);

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admins_families_all" ON families;
CREATE POLICY "super_admins_families_all" ON families FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "super_admins_config_all" ON family_config;
CREATE POLICY "super_admins_config_all" ON family_config FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "super_admins_members_all" ON family_members;
CREATE POLICY "super_admins_members_all" ON family_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "super_admins_view_self" ON super_admins;
CREATE POLICY "super_admins_view_self" ON super_admins FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "parents_view_own_family" ON families;
CREATE POLICY "parents_view_own_family" ON families FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM family_members WHERE family_members.family_id = families.id AND family_members.user_id = auth.uid() AND family_members.role = 'parent'));

DROP POLICY IF EXISTS "parents_view_own_config" ON family_config;
CREATE POLICY "parents_view_own_config" ON family_config FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM family_members WHERE family_members.family_id = family_config.family_id AND family_members.user_id = auth.uid() AND family_members.role = 'parent'));

DROP POLICY IF EXISTS "parents_manage_own_members" ON family_members;
CREATE POLICY "parents_manage_own_members" ON family_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM family_members AS parent_check WHERE parent_check.family_id = family_members.family_id AND parent_check.user_id = auth.uid() AND parent_check.role = 'parent'));

DROP POLICY IF EXISTS "members_view_own_family_members" ON family_members;
CREATE POLICY "members_view_own_family_members" ON family_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM family_members AS self WHERE self.family_id = family_members.family_id AND self.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage own studio progress" ON studio_progress;
CREATE POLICY "Users can manage own studio progress" ON studio_progress FOR ALL
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP TRIGGER IF EXISTS update_families_updated_at ON families;
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_family_config_updated_at ON family_config;
CREATE TRIGGER update_family_config_updated_at BEFORE UPDATE ON family_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_family_members_updated_at ON family_members;
CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON family_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS studio_progress_updated_at ON studio_progress;
CREATE TRIGGER studio_progress_updated_at BEFORE UPDATE ON studio_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION generate_family_code(family_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INT := 0;
BEGIN
  base_code := UPPER(REGEXP_REPLACE(family_name, '[^A-Za-z0-9]', '', 'g'));
  base_code := SUBSTRING(base_code FROM 1 FOR 8);
  base_code := base_code || '-' || TO_CHAR(NOW(), 'YYYY');
  final_code := base_code;
  WHILE EXISTS (SELECT 1 FROM families WHERE code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || '-' || counter;
  END LOOP;
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_family_config(p_user_id UUID)
RETURNS TABLE (
  family_id UUID,
  family_name TEXT,
  family_code TEXT,
  user_role TEXT,
  elevenlabs_key TEXT,
  midjourney_key TEXT,
  runway_key TEXT,
  gemini_key TEXT,
  default_narration_voice_fr TEXT,
  default_narration_voice_en TEXT,
  default_narration_voice_ru TEXT,
  default_ai_voice TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id AS family_id,
    f.name AS family_name,
    f.code AS family_code,
    fm.role AS user_role,
    fc.elevenlabs_key,
    fc.midjourney_key,
    fc.runway_key,
    fc.gemini_key,
    fc.default_narration_voice_fr,
    fc.default_narration_voice_en,
    fc.default_narration_voice_ru,
    fc.default_ai_voice
  FROM family_members fm
  JOIN families f ON f.id = fm.family_id
  LEFT JOIN family_config fc ON fc.family_id = f.id
  WHERE fm.user_id = p_user_id
  AND f.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
