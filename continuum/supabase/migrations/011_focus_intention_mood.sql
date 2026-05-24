-- Add intention and mood columns to focus_sessions
ALTER TABLE focus_sessions
  ADD COLUMN IF NOT EXISTS intention text,
  ADD COLUMN IF NOT EXISTS mood      smallint CHECK (mood BETWEEN 1 AND 5);
