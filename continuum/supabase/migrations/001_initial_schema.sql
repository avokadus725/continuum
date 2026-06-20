-- ============================================================
-- Continuum – Initial Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create type user_role as enum ('student', 'admin');

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'student',
  full_name   text,
  avatar_url  text,
  bio         text,
  language    text not null default 'uk',
  xp          integer not null default 0,
  level       integer not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- TOPICS
-- ============================================================
create table topics (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  icon        text,
  slug        text unique not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- MATERIALS (навчальні матеріали)
-- ============================================================
create type material_type as enum ('article', 'video', 'link', 'interactive');

create table materials (
  id          uuid primary key default uuid_generate_v4(),
  topic_id    uuid references topics(id) on delete set null,
  title       text not null,
  content     text,
  url         text,
  type        material_type not null default 'article',
  is_published boolean not null default false,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- TASKS (практичні завдання)
-- ============================================================
create type task_type as enum ('single_choice', 'multiple_choice', 'text', 'code');
create type difficulty as enum ('beginner', 'intermediate', 'advanced');

create table tasks (
  id           uuid primary key default uuid_generate_v4(),
  topic_id     uuid references topics(id) on delete set null,
  title        text not null,
  description  text not null,
  type         task_type not null default 'single_choice',
  difficulty   difficulty not null default 'beginner',
  xp_reward    integer not null default 10,
  is_published boolean not null default false,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Варіанти відповідей (для single_choice / multiple_choice)
create table task_options (
  id         uuid primary key default uuid_generate_v4(),
  task_id    uuid not null references tasks(id) on delete cascade,
  text       text not null,
  is_correct boolean not null default false,
  order_num  integer not null default 0
);

-- ============================================================
-- STUDENT PROGRESS
-- ============================================================
create table student_progress (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references profiles(id) on delete cascade,
  task_id      uuid not null references tasks(id) on delete cascade,
  is_correct   boolean not null,
  score        integer not null default 0,
  answer       text,           -- збережена відповідь
  attempt_num  integer not null default 1,
  completed_at timestamptz not null default now(),
  unique(user_id, task_id, attempt_num)
);

-- ============================================================
-- NOTES (нотатки)
-- ============================================================
create table notes (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null default 'Нотатка',
  content     text,
  topic_id    uuid references topics(id) on delete set null,
  material_id uuid references materials(id) on delete set null,
  task_id     uuid references tasks(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- COLLECTIONS (підбірки матеріалів)
-- ============================================================
create table collections (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  title      text not null,
  created_at timestamptz not null default now()
);

create table collection_materials (
  collection_id uuid not null references collections(id) on delete cascade,
  material_id   uuid not null references materials(id) on delete cascade,
  added_at      timestamptz not null default now(),
  primary key (collection_id, material_id)
);

-- ============================================================
-- ACHIEVEMENTS (гейміфікація)
-- ============================================================
create table achievements (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text not null,
  icon        text,
  xp_reward   integer not null default 50,
  condition   jsonb  -- { "type": "tasks_completed", "threshold": 10 }
);

create table user_achievements (
  user_id        uuid not null references profiles(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  earned_at      timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- ============================================================
-- COMMENTS
-- ============================================================
create table comments (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  material_id uuid references materials(id) on delete cascade,
  task_id     uuid references tasks(id) on delete cascade,
  parent_id   uuid references comments(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (
    (material_id is not null and task_id is null) or
    (material_id is null and task_id is not null)
  )
);

-- ============================================================
-- REACTIONS
-- ============================================================
create type reaction_type as enum ('like', 'helpful', 'fire');

create table reactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  material_id uuid references materials(id) on delete cascade,
  comment_id  uuid references comments(id) on delete cascade,
  type        reaction_type not null default 'like',
  created_at  timestamptz not null default now(),
  check (
    (material_id is not null and comment_id is null) or
    (material_id is null and comment_id is not null)
  )
);

-- Unique: один юзер – одна реакція одного типу на матеріал або коментар
create unique index reactions_material_unique
  on reactions(user_id, material_id, type)
  where material_id is not null;

create unique index reactions_comment_unique
  on reactions(user_id, comment_id, type)
  where comment_id is not null;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create type notification_type as enum ('new_task', 'achievement', 'recommendation', 'comment_reply');

create table notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       notification_type not null,
  title      text not null,
  body       text,
  is_read    boolean not null default false,
  meta       jsonb,           -- додаткові дані (task_id, achievement_id тощо)
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table notes enable row level security;
alter table student_progress enable row level security;
alter table collections enable row level security;
alter table collection_materials enable row level security;
alter table user_achievements enable row level security;
alter table comments enable row level security;
alter table reactions enable row level security;
alter table notifications enable row level security;

-- Profiles: users see their own, admins see all
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Notes: only owner
create policy "Users manage own notes"
  on notes for all using (auth.uid() = user_id);

-- Progress: only owner
create policy "Users manage own progress"
  on student_progress for all using (auth.uid() = user_id);

-- Collections: only owner
create policy "Users manage own collections"
  on collections for all using (auth.uid() = user_id);

create policy "Users manage own collection_materials"
  on collection_materials for all using (
    auth.uid() = (select user_id from collections where id = collection_id)
  );

-- Achievements: read for all authenticated
create policy "Authenticated users view achievements"
  on user_achievements for select using (auth.uid() = user_id);

-- Comments: read for all authenticated, write own
create policy "Authenticated users view comments"
  on comments for select using (auth.uid() is not null);

create policy "Users create own comments"
  on comments for insert with check (auth.uid() = user_id);

create policy "Users update own comments"
  on comments for update using (auth.uid() = user_id);

-- Reactions
create policy "Authenticated users view reactions"
  on reactions for select using (auth.uid() is not null);

create policy "Users manage own reactions"
  on reactions for all using (auth.uid() = user_id);

-- Notifications: only owner
create policy "Users view own notifications"
  on notifications for select using (auth.uid() = user_id);

create policy "Users update own notifications"
  on notifications for update using (auth.uid() = user_id);
