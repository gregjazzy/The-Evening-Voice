-- Migration: Ajouter les policies RLS manquantes
--
-- PROBLÈME: schema.sql activait RLS sur story_pages, assets, chat_messages,
-- generation_jobs et mentor_sessions SANS créer de policy.
-- Résultat: toutes les opérations client (SELECT, INSERT, UPDATE, DELETE)
-- étaient bloquées silencieusement sur ces tables.
--
-- EXÉCUTER CE SCRIPT DANS L'ÉDITEUR SQL DE SUPABASE DASHBOARD

-- story_pages : CRITIQUE - contient tout le contenu des pages (texte, images, décorations)
DO $$ BEGIN
  CREATE POLICY "Users can manage own pages"
    ON story_pages FOR ALL
    USING (story_id IN (SELECT id FROM stories WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Policy "Users can manage own pages" already exists, skipping.';
END $$;

-- assets : fichiers média importés
DO $$ BEGIN
  CREATE POLICY "Users can manage own assets"
    ON assets FOR ALL
    USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Policy "Users can manage own assets" already exists, skipping.';
END $$;

-- chat_messages : historique de conversation
DO $$ BEGIN
  CREATE POLICY "Users can manage own chat"
    ON chat_messages FOR ALL
    USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Policy "Users can manage own chat" already exists, skipping.';
END $$;

-- generation_jobs : jobs de génération IA
DO $$ BEGIN
  CREATE POLICY "Users can manage own jobs"
    ON generation_jobs FOR ALL
    USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Policy "Users can manage own jobs" already exists, skipping.';
END $$;

-- mentor_sessions : sessions de mentorat
DO $$ BEGIN
  CREATE POLICY "Mentors can manage sessions"
    ON mentor_sessions FOR ALL
    USING (mentor_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Policy "Mentors can manage sessions" already exists, skipping.';
END $$;
