-- ===========================================
-- SUPABASE STORAGE POLICIES
-- La Voix du Soir - Médias
-- ===========================================
-- 
-- ARCHITECTURE HYBRIDE :
-- - Images & Audio → Supabase Storage (ce fichier)
-- - Vidéos → Cloudflare R2 (voir .env.local)
--
-- ⚠️ Exécuter ce script APRÈS avoir créé les buckets via le dashboard :
-- 1. images (public)
-- 2. audio (public)
-- (PAS de bucket videos - elles vont sur R2)

-- ===========================================
-- BUCKET: images
-- Photos, images IA, fonds de page, thumbnails
-- ===========================================

-- Lecture publique (pour afficher les images)
CREATE POLICY "Images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Upload : utilisateurs authentifiés uniquement
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- Mise à jour : propriétaire seulement
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Suppression : propriétaire seulement
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ===========================================
-- BUCKET: audio
-- Enregistrements vocaux du journal
-- ===========================================

CREATE POLICY "Audio files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

CREATE POLICY "Authenticated users can upload audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audio' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own audio"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ===========================================
-- Note sur la structure des dossiers
-- ===========================================
-- Les fichiers sont organisés par user_id :
-- images/{user_id}/{filename}
-- audio/{user_id}/{filename}
--
-- Les VIDÉOS sont sur Cloudflare R2 :
-- https://{R2_PUBLIC_URL}/videos/{user_id}/{filename}
--
-- Cela permet les policies basées sur le propriétaire.
