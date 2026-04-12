-- Link notes directly to a collection (підбірки)
alter table notes
  add column collection_id uuid references collections(id) on delete set null;
