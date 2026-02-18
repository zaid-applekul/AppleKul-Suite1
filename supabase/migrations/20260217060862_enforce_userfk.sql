/*
  # Fix orchard RLS and FK references

  - Ensure user_id FKs reference auth.users
  - Ensure RLS policies use auth.uid()
*/

-- Fix user_id foreign keys
ALTER TABLE public.tree_tags
  DROP CONSTRAINT IF EXISTS tree_tags_user_id_fkey;
ALTER TABLE public.tree_tags
  ADD CONSTRAINT tree_tags_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.orchard_varieties
  DROP CONSTRAINT IF EXISTS orchard_varieties_user_id_fkey;
ALTER TABLE public.orchard_varieties
  ADD CONSTRAINT orchard_varieties_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.production_records
  DROP CONSTRAINT IF EXISTS production_records_user_id_fkey;
ALTER TABLE public.production_records
  ADD CONSTRAINT production_records_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Replace RLS policies to use auth.uid()
DROP POLICY IF EXISTS "tree_tags_select_own" ON public.tree_tags;
DROP POLICY IF EXISTS "tree_tags_insert_own" ON public.tree_tags;
DROP POLICY IF EXISTS "tree_tags_update_own" ON public.tree_tags;
DROP POLICY IF EXISTS "tree_tags_delete_own" ON public.tree_tags;

CREATE POLICY "tree_tags_select_own" ON public.tree_tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tree_tags_insert_own" ON public.tree_tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tree_tags_update_own" ON public.tree_tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "tree_tags_delete_own" ON public.tree_tags
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "orchard_varieties_select_own" ON public.orchard_varieties;
DROP POLICY IF EXISTS "orchard_varieties_insert_own" ON public.orchard_varieties;
DROP POLICY IF EXISTS "orchard_varieties_update_own" ON public.orchard_varieties;
DROP POLICY IF EXISTS "orchard_varieties_delete_own" ON public.orchard_varieties;

CREATE POLICY "orchard_varieties_select_own" ON public.orchard_varieties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orchard_varieties_insert_own" ON public.orchard_varieties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orchard_varieties_update_own" ON public.orchard_varieties
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "orchard_varieties_delete_own" ON public.orchard_varieties
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "production_records_select_own" ON public.production_records;
DROP POLICY IF EXISTS "production_records_insert_own" ON public.production_records;
DROP POLICY IF EXISTS "production_records_update_own" ON public.production_records;
DROP POLICY IF EXISTS "production_records_delete_own" ON public.production_records;

CREATE POLICY "production_records_select_own" ON public.production_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "production_records_insert_own" ON public.production_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "production_records_update_own" ON public.production_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "production_records_delete_own" ON public.production_records
  FOR DELETE USING (auth.uid() = user_id);
