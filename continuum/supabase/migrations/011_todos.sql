-- Personal to-dos for the Today panel
create table todos (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  title      text not null,
  done       boolean not null default false,
  created_at timestamptz not null default now()
);

alter table todos enable row level security;

create policy "Users manage own todos"
  on todos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
