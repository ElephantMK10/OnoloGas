-- Addresses table for per-user address book
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  line1 text not null,
  line2 text,
  city text,
  province text,
  postal_code text,
  country text default 'South Africa',
  lat double precision,
  lng double precision,
  place_id text,
  is_default boolean default false,
  last_used_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.addresses enable row level security;

create policy if not exists "Addresses are viewable by owner" on public.addresses
  for select using (auth.uid() = user_id);

create policy if not exists "Addresses are insertable by owner" on public.addresses
  for insert with check (auth.uid() = user_id);

create policy if not exists "Addresses are updatable by owner" on public.addresses
  for update using (auth.uid() = user_id);

create policy if not exists "Addresses are deletable by owner" on public.addresses
  for delete using (auth.uid() = user_id);

-- Optional helper to enforce single default in database (not required if app-enforced)
create or replace function public.ensure_single_default_address()
returns trigger as $$
begin
  if NEW.is_default then
    update public.addresses set is_default = false where user_id = NEW.user_id and id <> NEW.id;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_single_default_address on public.addresses;
create trigger trg_single_default_address
before insert or update on public.addresses
for each row execute procedure public.ensure_single_default_address();

-- Orders: add shipping_address_snapshot for historical accuracy
alter table public.orders add column if not exists shipping_address_snapshot jsonb;

-- Convenience view for default address
create or replace view public.user_default_address as
select distinct on (user_id) user_id,
  id,
  label,
  line1,
  line2,
  city,
  province,
  postal_code,
  country,
  lat,
  lng,
  place_id,
  is_default,
  last_used_at,
  created_at,
  updated_at
from public.addresses
order by user_id, is_default desc, last_used_at desc nulls last, updated_at desc;


