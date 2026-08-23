-- Aviary Pro: Breeding module
-- Run once in Supabase SQL Editor.

create table if not exists public.breeding_pairs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pair_code text not null,
  male_bird_id uuid not null references public.birds(id) on delete restrict,
  female_bird_id uuid not null references public.birds(id) on delete restrict,
  status text not null default 'Active' check (status in ('Active','Resting','Completed','Separated')),
  paired_date date not null default current_date,
  nest_number integer not null default 1 check (nest_number >= 1),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, pair_code),
  check (male_bird_id <> female_bird_id)
);

create index if not exists breeding_pairs_user_id_idx on public.breeding_pairs(user_id);
create index if not exists breeding_pairs_status_idx on public.breeding_pairs(status);

alter table public.breeding_pairs enable row level security;

drop policy if exists "Users can view own breeding pairs" on public.breeding_pairs;
drop policy if exists "Users can insert own breeding pairs" on public.breeding_pairs;
drop policy if exists "Users can update own breeding pairs" on public.breeding_pairs;
drop policy if exists "Users can delete own breeding pairs" on public.breeding_pairs;

create policy "Users can view own breeding pairs"
  on public.breeding_pairs for select using (auth.uid() = user_id);
create policy "Users can insert own breeding pairs"
  on public.breeding_pairs for insert with check (auth.uid() = user_id);
create policy "Users can update own breeding pairs"
  on public.breeding_pairs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own breeding pairs"
  on public.breeding_pairs for delete using (auth.uid() = user_id);

create or replace function public.set_breeding_pairs_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists breeding_pairs_set_updated_at on public.breeding_pairs;
create trigger breeding_pairs_set_updated_at
before update on public.breeding_pairs
for each row execute function public.set_breeding_pairs_updated_at();
