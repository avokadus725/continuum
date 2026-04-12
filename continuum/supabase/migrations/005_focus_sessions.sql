create table focus_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references profiles(id) on delete cascade not null,
  started_at       timestamptz not null,
  ended_at         timestamptz not null,
  focus_seconds    int not null default 0,   -- чистий час роботи без перерв
  break_seconds    int not null default 0,   -- час перерв
  pomodoros_completed int not null default 0,
  mode             text not null default 'pomodoro', -- 'pomodoro' | 'custom'
  work_duration_min  int not null default 25,
  break_duration_min int not null default 5,
  status           text not null default 'completed', -- 'completed' | 'interrupted'
  created_at       timestamptz not null default now()
);

alter table focus_sessions enable row level security;

create policy "focus_sessions_select" on focus_sessions
  for select using (auth.uid() = user_id);

create policy "focus_sessions_insert" on focus_sessions
  for insert with check (auth.uid() = user_id);
