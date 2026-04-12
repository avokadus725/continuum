-- ============================================================
-- 1. Supabase Storage bucket for avatars
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- 2. Material slugs
-- ============================================================
alter table materials add column if not exists slug text;
create unique index if not exists materials_slug_idx on materials(slug) where slug is not null;

-- ============================================================
-- 3. Social posts
-- ============================================================
create table posts (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  content    text not null,
  url        text,
  url_title  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table posts enable row level security;

create policy "Posts are visible to all authenticated users"
  on posts for select using (auth.role() = 'authenticated');

create policy "Users create own posts"
  on posts for insert with check (auth.uid() = user_id);

create policy "Users update own posts"
  on posts for update using (auth.uid() = user_id);

create policy "Users delete own posts"
  on posts for delete using (auth.uid() = user_id);

-- Add post_id to comments
alter table comments add column if not exists post_id uuid references posts(id) on delete cascade;

-- Add post_id to reactions
alter table reactions add column if not exists post_id uuid references posts(id) on delete cascade;

-- ============================================================
-- 4. Extend notification_type enum
-- ============================================================
alter type notification_type add value if not exists 'post_reaction';
alter type notification_type add value if not exists 'post_comment';

-- Notifications RLS (if not exists)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'notifications' and policyname = 'Users see own notifications'
  ) then
    execute 'create policy "Users see own notifications" on notifications for select using (auth.uid() = user_id)';
  end if;
  if not exists (
    select 1 from pg_policies
    where tablename = 'notifications' and policyname = 'System can insert notifications'
  ) then
    execute 'create policy "System can insert notifications" on notifications for insert with check (true)';
  end if;
  if not exists (
    select 1 from pg_policies
    where tablename = 'notifications' and policyname = 'Users update own notifications'
  ) then
    execute 'create policy "Users update own notifications" on notifications for update using (auth.uid() = user_id)';
  end if;
end $$;
