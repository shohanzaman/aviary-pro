-- Aviary Pro foundation schema
-- Developer: kzs
-- Cloud data only. Images are stored outside Supabase Storage (Cloudflare R2).

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.species (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.mutations (
  id uuid primary key default gen_random_uuid(),
  species_id uuid references public.species(id) on delete cascade,
  name text not null,
  is_preloaded boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(species_id, name)
);

create table if not exists public.birds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  bird_code text not null,
  name text not null,
  species_id uuid references public.species(id),
  mutation_id uuid references public.mutations(id),
  sex text check (sex in ('male','female','unknown')) default 'unknown',
  date_of_birth date,
  approximate_age_months integer check (approximate_age_months is null or approximate_age_months >= 0),
  color text,
  status text not null default 'active' check (status in ('active','sold','archived','deceased','quarantine')),
  cage_name text,
  photo_url text,
  photo_storage_key text,
  notes text,
  sold_to_customer_id uuid,
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, bird_code)
);

create table if not exists public.breeding_pairs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  pair_code text not null,
  name text not null,
  male_bird_id uuid references public.birds(id) on delete restrict,
  female_bird_id uuid references public.birds(id) on delete restrict,
  pairing_date date,
  cage_name text,
  nest_name text,
  status text not null default 'active' check (status in ('active','paused','completed','archived')),
  photo_url text,
  photo_storage_key text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, pair_code)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  mobile_number text,
  whatsapp_number text,
  delivery_address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  order_number text not null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  advance_amount numeric(12,2) not null default 0 check (advance_amount >= 0),
  due_amount numeric(12,2) generated always as (greatest(total_amount - advance_amount, 0)) stored,
  delivery_address text,
  delivery_date date,
  status text not null default 'pending' check (status in ('pending','ready','delivered','cancelled')),
  invoice_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, order_number),
  unique(owner_id, invoice_number)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  bird_id uuid references public.birds(id) on delete restrict,
  bird_name_snapshot text not null,
  species_snapshot text,
  mutation_snapshot text,
  sex_snapshot text,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  line_total numeric(12,2) generated always as (quantity * unit_price) stored
);

create index if not exists birds_owner_status_idx on public.birds(owner_id, status);
create index if not exists pairs_owner_status_idx on public.breeding_pairs(owner_id, status);
create index if not exists customers_owner_idx on public.customers(owner_id);
create index if not exists orders_owner_status_idx on public.orders(owner_id, status);
create index if not exists order_items_order_idx on public.order_items(order_id);

alter table public.profiles enable row level security;
alter table public.species enable row level security;
alter table public.mutations enable row level security;
alter table public.birds enable row level security;
alter table public.breeding_pairs enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "profiles_self_access" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "species_read" on public.species for select using (is_active = true);
create policy "mutations_read" on public.mutations for select using (is_active = true);
create policy "birds_owner_access" on public.birds for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "pairs_owner_access" on public.breeding_pairs for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "customers_owner_access" on public.customers for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "orders_owner_access" on public.orders for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "order_items_owner_access" on public.order_items for all
using (exists (select 1 from public.orders o where o.id = order_items.order_id and o.owner_id = auth.uid()))
with check (exists (select 1 from public.orders o where o.id = order_items.order_id and o.owner_id = auth.uid()));

insert into public.species (name) values
  ('Cockatiel'), ('Budgerigar'), ('Zebra Finch'), ('Forpus'), ('Lovebird'), ('Finch'), ('Parrot')
on conflict (name) do nothing;

insert into public.mutations (species_id, name, is_preloaded)
select s.id, x.name, true
from public.species s
join (values
  ('Cockatiel','Normal Grey'),('Cockatiel','Lutino'),('Cockatiel','Albino'),('Cockatiel','Pearl'),('Cockatiel','Pied'),('Cockatiel','Cinnamon'),('Cockatiel','Whiteface'),
  ('Budgerigar','Normal Green'),('Budgerigar','Blue'),('Budgerigar','Lutino'),('Budgerigar','Albino'),
  ('Zebra Finch','Normal Grey'),('Forpus','Green'),('Lovebird','Green')
) as x(species_name,name) on x.species_name=s.name
on conflict (species_id, name) do nothing;

-- Enable realtime for the primary user-owned tables.
alter publication supabase_realtime add table public.birds;
alter publication supabase_realtime add table public.breeding_pairs;
alter publication supabase_realtime add table public.customers;
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
