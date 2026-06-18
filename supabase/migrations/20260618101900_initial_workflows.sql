-- Supabase schema for DarkMedia Workflow AI
create extension if not exists "pgcrypto";

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  content text not null,
  category text not null default 'Général',
  model text default '',
  tags text[] not null default '{}',
  favorite boolean not null default false,
  usage_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workflows enable row level security;

drop policy if exists "Users can read their workflows" on public.workflows;
drop policy if exists "Users can create their workflows" on public.workflows;
drop policy if exists "Users can update their workflows" on public.workflows;
drop policy if exists "Users can delete their workflows" on public.workflows;

create policy "Users can read their workflows" on public.workflows
  for select using (auth.uid() = user_id);
create policy "Users can create their workflows" on public.workflows
  for insert with check (auth.uid() = user_id);
create policy "Users can update their workflows" on public.workflows
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their workflows" on public.workflows
  for delete using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workflows_set_updated_at on public.workflows;
create trigger workflows_set_updated_at
  before update on public.workflows
  for each row execute function public.set_updated_at();

create index if not exists workflows_user_created_idx
  on public.workflows (user_id, created_at desc);

create index if not exists workflows_tags_idx
  on public.workflows using gin (tags);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.workflows to authenticated;
