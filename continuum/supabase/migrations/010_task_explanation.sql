-- Add explanation column to tasks (shown after answering)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS explanation text;
