-- Banglalink Cloud demo — metadata schema for Supabase.
-- Run this once in your Supabase project: SQL Editor -> New query -> paste -> Run.
-- The app talks to these tables server-side using the SERVICE ROLE key, so RLS is left ON
-- with no public policies (the anon/public key cannot read or write these tables).

create table if not exists public.folders (
  id          text primary key,
  name        text not null,
  parent_id   text,
  created_at  bigint not null
);

create table if not exists public.files (
  id          text primary key,
  name        text not null,
  size        bigint not null default 0,
  type        text,
  folder_id   text not null,
  key         text not null,
  created_at  bigint not null,
  starred     boolean not null default false,
  trashed     boolean not null default false
);

create table if not exists public.shares (
  token       text primary key,
  file_id     text not null,
  permission  text not null default 'view',
  created_at  bigint not null,
  expires_at  bigint,
  revoked     boolean not null default false
);

create index if not exists files_folder_id_idx on public.files (folder_id);
create index if not exists files_trashed_idx   on public.files (trashed);
create index if not exists folders_parent_idx   on public.folders (parent_id);
create index if not exists shares_file_id_idx    on public.shares (file_id);

-- RLS on; no policies => only the service-role key (used server-side) can access. Browser cannot.
alter table public.folders enable row level security;
alter table public.files   enable row level security;
alter table public.shares  enable row level security;

-- Seed the default folders the UI expects.
insert into public.folders (id, name, parent_id, created_at) values
  ('root',     'My Drive',  null,   (extract(epoch from now())*1000)::bigint),
  ('f-photos', 'Photos',    'root', (extract(epoch from now())*1000)::bigint),
  ('f-docs',   'Documents', 'root', (extract(epoch from now())*1000)::bigint),
  ('f-work',   'Work',      'root', (extract(epoch from now())*1000)::bigint)
on conflict (id) do nothing;
