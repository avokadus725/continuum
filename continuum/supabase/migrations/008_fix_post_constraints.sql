-- ============================================================
-- Fix CHECK constraints to allow post_id on comments/reactions
-- ============================================================

-- Drop existing CHECK constraint on comments (Postgres names it 'comments_check')
DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint
    WHERE conrelid = 'public.comments'::regclass AND contype = 'c' LIMIT 1;
  IF c IS NOT NULL THEN
    EXECUTE 'ALTER TABLE comments DROP CONSTRAINT ' || quote_ident(c);
  END IF;
END $$;

-- New constraint: exactly one of material_id, task_id, post_id must be non-null
ALTER TABLE comments ADD CONSTRAINT comments_target_check
  CHECK (num_nonnulls(material_id, task_id, post_id) = 1);

-- Drop existing CHECK constraint on reactions
DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint
    WHERE conrelid = 'public.reactions'::regclass AND contype = 'c' LIMIT 1;
  IF c IS NOT NULL THEN
    EXECUTE 'ALTER TABLE reactions DROP CONSTRAINT ' || quote_ident(c);
  END IF;
END $$;

-- New constraint: exactly one of material_id, comment_id, post_id must be non-null
ALTER TABLE reactions ADD CONSTRAINT reactions_target_check
  CHECK (num_nonnulls(material_id, comment_id, post_id) = 1);

-- Unique index: one reaction per type per user per post
CREATE UNIQUE INDEX IF NOT EXISTS reactions_post_unique
  ON reactions(user_id, post_id, type)
  WHERE post_id IS NOT NULL;
