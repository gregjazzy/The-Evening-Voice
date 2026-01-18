-- Migration: Ajouter la colonne assemblyai_key à family_config
-- Cette colonne stocke la clé API AssemblyAI pour la transcription vocale

ALTER TABLE IF EXISTS family_config 
ADD COLUMN IF NOT EXISTS assemblyai_key TEXT;

-- Mettre à jour la fonction get_user_family_config si elle existe
-- pour retourner la nouvelle colonne
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
    fc.elevenlabs_key,
    fc.midjourney_key,
    fc.runway_key,
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
