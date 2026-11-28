-- Shared icon library metadata. The catalog is public to read because the
-- picker is used by every account; only the Glassday owner account can write.
create table if not exists public.workspace_icon_catalog (
  singleton text primary key default 'global' check (singleton = 'global'),
  categories jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.workspace_icon_catalog enable row level security;
grant select on public.workspace_icon_catalog to anon, authenticated;
grant insert, update on public.workspace_icon_catalog to authenticated;

drop policy if exists "public can read workspace icon catalog"
  on public.workspace_icon_catalog;
create policy "public can read workspace icon catalog"
  on public.workspace_icon_catalog
  for select
  to anon, authenticated
  using (true);

drop policy if exists "glassday admin can insert workspace icon catalog"
  on public.workspace_icon_catalog;
create policy "glassday admin can insert workspace icon catalog"
  on public.workspace_icon_catalog
  for insert
  to authenticated
  with check (auth.uid() = '6ea53e71-c011-4e45-ae96-235e5cb9c735'::uuid);

drop policy if exists "glassday admin can update workspace icon catalog"
  on public.workspace_icon_catalog;
create policy "glassday admin can update workspace icon catalog"
  on public.workspace_icon_catalog
  for update
  to authenticated
  using (auth.uid() = '6ea53e71-c011-4e45-ae96-235e5cb9c735'::uuid)
  with check (auth.uid() = '6ea53e71-c011-4e45-ae96-235e5cb9c735'::uuid);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workspace-icon-uploads',
  'workspace-icon-uploads',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public can view workspace icon uploads"
  on storage.objects;
create policy "public can view workspace icon uploads"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'workspace-icon-uploads');

drop policy if exists "glassday admin can upload workspace icons"
  on storage.objects;
create policy "glassday admin can upload workspace icons"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'workspace-icon-uploads'
    and auth.uid() = '6ea53e71-c011-4e45-ae96-235e5cb9c735'::uuid
  );

drop policy if exists "glassday admin can delete workspace icons"
  on storage.objects;
create policy "glassday admin can delete workspace icons"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'workspace-icon-uploads'
    and auth.uid() = '6ea53e71-c011-4e45-ae96-235e5cb9c735'::uuid
  );
