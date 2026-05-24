-- Tasks inside collections (parallel to collection_materials)
create table collection_tasks (
  collection_id uuid not null references collections(id) on delete cascade,
  task_id       uuid not null references tasks(id) on delete cascade,
  added_at      timestamptz not null default now(),
  primary key (collection_id, task_id)
);

alter table collection_tasks enable row level security;

create policy "Users manage own collection tasks"
  on collection_tasks for all
  using (
    exists (
      select 1 from collections
      where collections.id = collection_tasks.collection_id
        and collections.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from collections
      where collections.id = collection_tasks.collection_id
        and collections.user_id = auth.uid()
    )
  );
