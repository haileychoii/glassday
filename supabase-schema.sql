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

-- Shared workspace icon library. Reading is public because everyone may use
-- the picker; writes are limited to the owner account by its immutable auth ID.
create table if not exists public.workspace_icon_catalog (
  singleton text primary key default 'global' check (singleton = 'global'),
  categories jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.workspace_icon_catalog enable row level security;
grant select on public.workspace_icon_catalog to anon, authenticated;
grant insert, update on public.workspace_icon_catalog to authenticated;

create policy "public can read workspace icon catalog"
on public.workspace_icon_catalog for select to anon, authenticated
using (true);

create policy "glassday admin can insert workspace icon catalog"
on public.workspace_icon_catalog for insert to authenticated
with check (auth.uid() = '6ea53e71-c011-4e45-ae96-235e5cb9c735'::uuid);

create policy "glassday admin can update workspace icon catalog"
on public.workspace_icon_catalog for update to authenticated
using (auth.uid() = '6ea53e71-c011-4e45-ae96-235e5cb9c735'::uuid)
with check (auth.uid() = '6ea53e71-c011-4e45-ae96-235e5cb9c735'::uuid);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workspace-icon-uploads', 'workspace-icon-uploads', true, 5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "public can view workspace icon uploads"
on storage.objects for select to anon, authenticated
using (bucket_id = 'workspace-icon-uploads');

create policy "glassday admin can upload workspace icons"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'workspace-icon-uploads'
  and auth.uid() = '6ea53e71-c011-4e45-ae96-235e5cb9c735'::uuid
);

create policy "glassday admin can delete workspace icons"
on storage.objects for delete to authenticated
using (
  bucket_id = 'workspace-icon-uploads'
  and auth.uid() = '6ea53e71-c011-4e45-ae96-235e5cb9c735'::uuid
);
