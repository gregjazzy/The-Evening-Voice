-- Migration: Passage à fal.ai comme API unifiée
-- Ajoute fal_key, garde gemini_key et assemblyai_key
-- Les anciennes clés (elevenlabs, runway, midjourney) sont dépréciées

-- Ajouter la colonne fal_key
ALTER TABLE IF EXISTS family_config 
ADD COLUMN IF NOT EXISTS fal_key TEXT;

-- Mettre à jour la fonction get_user_family_config
CREATE OR REPLACE FUNCTION get_user_family_config(p_user_id UUID)
RETURNS TABLE (
  family_id UUID,
  family_name TEXT,
  family_code TEXT,
  user_role TEXT,
  fal_key TEXT,
  gemini_key TEXT,
  assemblyai_key TEXT,
  default_narration_voice_fr TEXT,
  default_narration_voice_en TEXT,
  default_narration_voice_ru TEXT,
  default_ai_voice TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as family_id,
    f.name as family_name,
    f.code as family_code,
    fm.role::TEXT as user_role,
    fc.fal_key,
    fc.gemini_key,
    fc.assemblyai_key,
    fc.default_narration_voice_fr,
    fc.default_narration_voice_en,
    fc.default_narration_voice_ru,
    fc.default_ai_voice
  FROM family_members fm
  JOIN families f ON fm.family_id = f.id
  LEFT JOIN family_config fc ON fc.family_id = f.id
  WHERE fm.user_id = p_user_id
  AND fm.invitation_status = 'accepted'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Les anciennes colonnes (elevenlabs_key, runway_key, midjourney_key) 
-- peuvent être supprimées après vérification que tout fonctionne
-- ALTER TABLE family_config DROP COLUMN IF EXISTS elevenlabs_key;
-- ALTER TABLE family_config DROP COLUMN IF EXISTS runway_key;
-- ALTER TABLE family_config DROP COLUMN IF EXISTS midjourney_key;
