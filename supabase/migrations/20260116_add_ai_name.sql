-- Migration: Ajout du champ ai_name à la table profiles
-- Date: 2026-01-16
-- Description: Permet aux enfants de personnaliser le nom de leur IA-Amie

-- Ajouter la colonne ai_name si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'ai_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN ai_name TEXT;
        COMMENT ON COLUMN profiles.ai_name IS 'Nom personnalisé de l''IA choisi par l''enfant';
    END IF;
END $$;
