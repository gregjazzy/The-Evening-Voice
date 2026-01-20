-- ===========================================
-- MIGRATION: Ajouter le bucket PDFs pour Gelato
-- Date: 2026-01-20
-- ===========================================
-- 
-- Ce bucket stocke les PDFs générés pour l'impression Gelato.
-- Les PDFs doivent être accessibles publiquement pour que Gelato
-- puisse les télécharger lors de l'impression.
--
-- Structure: pdfs/{user_id}/{story_id}.pdf

-- ===========================================
-- BUCKET: pdfs
-- PDFs générés pour l'impression
-- ===========================================

-- Créer le bucket (si le dashboard n'est pas utilisé)
-- Note: Les buckets doivent généralement être créés via le dashboard
-- Cette commande peut échouer si les permissions RLS l'empêchent
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pdfs',
  'pdfs',
  true,  -- Public pour que Gelato puisse y accéder
  52428800,  -- 50MB max (les PDFs peuvent être volumineux)
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf']::text[];

-- ===========================================
-- POLICIES pour le bucket pdfs
-- ===========================================

-- Lecture publique (requis pour Gelato)
DROP POLICY IF EXISTS "PDFs are publicly accessible" ON storage.objects;
CREATE POLICY "PDFs are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdfs');

-- Upload : utilisateurs authentifiés uniquement
DROP POLICY IF EXISTS "Authenticated users can upload PDFs" ON storage.objects;
CREATE POLICY "Authenticated users can upload PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pdfs' 
  AND auth.role() = 'authenticated'
);

-- Mise à jour : propriétaire seulement (basé sur le user_id dans le chemin)
DROP POLICY IF EXISTS "Users can update own PDFs" ON storage.objects;
CREATE POLICY "Users can update own PDFs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'pdfs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Suppression : propriétaire seulement
DROP POLICY IF EXISTS "Users can delete own PDFs" ON storage.objects;
CREATE POLICY "Users can delete own PDFs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pdfs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ===========================================
-- Commentaires
-- ===========================================
COMMENT ON POLICY "PDFs are publicly accessible" ON storage.objects IS 
  'Permet à Gelato de télécharger les PDFs pour impression';
