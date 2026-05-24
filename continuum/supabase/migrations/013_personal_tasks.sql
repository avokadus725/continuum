-- Personal to-do items created by users themselves.
-- Distinct from admin-created quiz tasks (tasks table).

CREATE TABLE personal_tasks (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      text NOT NULL CHECK (char_length(trim(title)) > 0),
  done       boolean NOT NULL DEFAULT false,
  done_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own personal tasks"
  ON personal_tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-set done_at when marking done
CREATE OR REPLACE FUNCTION set_personal_task_done_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.done = true AND OLD.done = false THEN
    NEW.done_at = now();
  ELSIF NEW.done = false THEN
    NEW.done_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER personal_tasks_done_at
  BEFORE UPDATE ON personal_tasks
  FOR EACH ROW EXECUTE FUNCTION set_personal_task_done_at();
