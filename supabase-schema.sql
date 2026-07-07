create table if not exists public.user_storage_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_storage_snapshots enable row level security;

create policy "users can read own snapshot"
on public.user_storage_snapshots
for select
to authenticated
using (auth.uid() = user_id);

create policy "users can insert own snapshot"
on public.user_storage_snapshots
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users can update own snapshot"
on public.user_storage_snapshots
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
