-- Comments RLS
create policy "comments_select" on comments
  for select using (auth.role() = 'authenticated');

create policy "comments_insert" on comments
  for insert with check (auth.uid() = user_id);

create policy "comments_delete" on comments
  for delete using (auth.uid() = user_id);

-- Reactions RLS
create policy "reactions_select" on reactions
  for select using (auth.role() = 'authenticated');

create policy "reactions_insert" on reactions
  for insert with check (auth.uid() = user_id);

create policy "reactions_delete" on reactions
  for delete using (auth.uid() = user_id);

-- Notes RLS
create policy "notes_select" on notes
  for select using (auth.uid() = user_id);

create policy "notes_insert" on notes
  for insert with check (auth.uid() = user_id);

create policy "notes_update" on notes
  for update using (auth.uid() = user_id);

create policy "notes_delete" on notes
  for delete using (auth.uid() = user_id);
