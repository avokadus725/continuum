-- Add is_active field to profiles
alter table profiles add column if not exists is_active boolean not null default true;

-- Admin can update any profile's is_active
create policy "admin_update_profiles" on profiles
  for update using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Collections RLS (student owns their collections)
create policy "collections_select" on collections
  for select using (auth.uid() = user_id);

create policy "collections_insert" on collections
  for insert with check (auth.uid() = user_id);

create policy "collections_update" on collections
  for update using (auth.uid() = user_id);

create policy "collections_delete" on collections
  for delete using (auth.uid() = user_id);

-- Collection materials RLS
create policy "collection_materials_select" on collection_materials
  for select using (
    exists (
      select 1 from collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

create policy "collection_materials_insert" on collection_materials
  for insert with check (
    exists (
      select 1 from collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

create policy "collection_materials_delete" on collection_materials
  for delete using (
    exists (
      select 1 from collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

-- Admin can insert/update/delete tasks and materials
create policy "admin_insert_tasks" on tasks
  for insert with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "admin_update_tasks" on tasks
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "admin_delete_tasks" on tasks
  for delete using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "admin_insert_task_options" on task_options
  for insert with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "admin_update_task_options" on task_options
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "admin_delete_task_options" on task_options
  for delete using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "admin_insert_materials" on materials
  for insert with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "admin_update_materials" on materials
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "admin_delete_materials" on materials
  for delete using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
