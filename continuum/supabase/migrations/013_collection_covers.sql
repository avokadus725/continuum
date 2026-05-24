-- ─── Continuum Collections · Schema migration ──────────────
-- Adds emoji + cover (color palette key) + description columns.

ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS emoji       TEXT NOT NULL DEFAULT '📚',
  ADD COLUMN IF NOT EXISTS cover       TEXT NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;

-- Allowed cover values (informational — enforce in app or via CHECK):
--   'default' | 'blue' | 'green' | 'amber' | 'rose' | 'violet' | 'slate'
