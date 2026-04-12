-- ================================================================
-- reactions: add standalone UUID PK, make material_id nullable
-- ================================================================

-- 1. Add UUID id column if the table has no separate PK
ALTER TABLE reactions ADD COLUMN IF NOT EXISTS id uuid DEFAULT uuid_generate_v4();
UPDATE reactions SET id = uuid_generate_v4() WHERE id IS NULL;
ALTER TABLE reactions ALTER COLUMN id SET NOT NULL;

-- 2. Drop whatever PK exists (may include material_id)
DO $$
DECLARE pk text;
BEGIN
  SELECT conname INTO pk FROM pg_constraint
    WHERE conrelid = 'public.reactions'::regclass AND contype = 'p';
  IF pk IS NOT NULL THEN
    EXECUTE 'ALTER TABLE reactions DROP CONSTRAINT ' || quote_ident(pk);
  END IF;
END $$;

-- 3. Set id as the new primary key
ALTER TABLE reactions ADD PRIMARY KEY (id);

-- 4. Now material_id / comment_id are free to be nullable
ALTER TABLE reactions ALTER COLUMN material_id DROP NOT NULL;
ALTER TABLE reactions ALTER COLUMN comment_id  DROP NOT NULL;

-- 5. Ensure post_id column exists
ALTER TABLE reactions ADD COLUMN IF NOT EXISTS
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE;

-- 6. Fix check constraint (exactly one target must be set)
DO $$
DECLARE c text;
BEGIN
  FOR c IN SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.reactions'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE reactions DROP CONSTRAINT ' || quote_ident(c);
  END LOOP;
END $$;

ALTER TABLE reactions ADD CONSTRAINT reactions_target_check
  CHECK (num_nonnulls(material_id, comment_id, post_id) = 1);

-- 7. Unique indexes
DROP INDEX IF EXISTS reactions_material_unique;
DROP INDEX IF EXISTS reactions_comment_unique;
DROP INDEX IF EXISTS reactions_post_unique;

CREATE UNIQUE INDEX reactions_material_unique
  ON reactions(user_id, material_id, type) WHERE material_id IS NOT NULL;
CREATE UNIQUE INDEX reactions_comment_unique
  ON reactions(user_id, comment_id, type)  WHERE comment_id  IS NOT NULL;
CREATE UNIQUE INDEX reactions_post_unique
  ON reactions(user_id, post_id, type)     WHERE post_id     IS NOT NULL;

-- ================================================================
-- comments: same treatment if material_id / task_id are in PK
-- ================================================================
ALTER TABLE comments ADD COLUMN IF NOT EXISTS id uuid DEFAULT uuid_generate_v4();
UPDATE comments SET id = uuid_generate_v4() WHERE id IS NULL;
ALTER TABLE comments ALTER COLUMN id SET NOT NULL;

DO $$
DECLARE pk text;
BEGIN
  SELECT conname INTO pk FROM pg_constraint
    WHERE conrelid = 'public.comments'::regclass AND contype = 'p';
  IF pk IS NOT NULL THEN
    EXECUTE 'ALTER TABLE comments DROP CONSTRAINT ' || quote_ident(pk);
  END IF;
END $$;

ALTER TABLE comments ADD PRIMARY KEY (id);

ALTER TABLE comments ALTER COLUMN material_id DROP NOT NULL;
ALTER TABLE comments ALTER COLUMN task_id     DROP NOT NULL;
