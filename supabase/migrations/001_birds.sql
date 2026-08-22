-- Aviary Pro: Birds module
-- Run once in Supabase SQL Editor.

create table if not exists public.birds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bird_code text not null,
  name text,
  species text not null,
  mutation text,
  sex text not null default 'Unknown' check (sex in ('Male','Female','Unknown')),
  date_of_birth date,
  ring_id text,
  status text not null default 'Active' check (status in ('Active','Breeding','Sold','Deceased','Transferred')),
  purchase_price numeric(12,2) not null default 0 check (purchase_price >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, bird_code)
);

create index if not exists birds_user_id_idx on public.birds(user_id);
create index if not exists birds_species_idx on public.birds(species);
create index if not exists birds_status_idx on public.birds(status);

alter table public.birds enable row level security;

drop policy if exists "Users can view own birds" on public.birds;
drop policy if exists "Users can insert own birds" on public.birds;
drop policy if exists "Users can update own birds" on public.birds;
drop policy if exists "Users can delete own birds" on public.birds;

create policy "Users can view own birds"
  on public.birds for select
  using (auth.uid() = user_id);

create policy "Users can insert own birds"
  on public.birds for insert
  with check (auth.uid() = user_id);

create policy "Users can update own birds"
  on public.birds for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own birds"
  on public.birds for delete
  using (auth.uid() = user_id);

create or replace function public.set_birds_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists birds_set_updated_at on public.birds;
create trigger birds_set_updated_at
before update on public.birds
for each row execute function public.set_birds_updated_at();
