-- Occasio initial schema.
-- Safe to run multiple times in Supabase SQL Editor.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('owner', 'client');
  end if;

  if not exists (select 1 from pg_type where typname = 'event_status') then
    create type public.event_status as enum ('draft', 'active', 'completed', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'rsvp_status') then
    create type public.rsvp_status as enum ('pending', 'attending', 'declined');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'client',
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.profiles(id) on delete set null,
  slug text not null unique,
  couple_name text not null,
  package_name text not null default 'Classic',
  event_date date,
  venue text,
  status public.event_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  phone text,
  pax_limit int not null default 1,
  rsvp_status public.rsvp_status not null default 'pending',
  pax_confirmed int not null default 0,
  qr_code text not null unique,
  checked_in_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_name text not null,
  message text not null,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.guests enable row level security;
alter table public.wishes enable row level security;

drop policy if exists "profiles_select_own_or_owner" on public.profiles;
create policy "profiles_select_own_or_owner"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.profiles owner_profile
    where owner_profile.id = auth.uid()
      and owner_profile.role = 'owner'
  )
);

drop policy if exists "events_select_client_or_owner" on public.events;
create policy "events_select_client_or_owner"
on public.events for select
to authenticated
using (
  client_id = auth.uid()
  or owner_id = auth.uid()
  or exists (
    select 1 from public.profiles owner_profile
    where owner_profile.id = auth.uid()
      and owner_profile.role = 'owner'
  )
);

drop policy if exists "guests_select_by_event_access" on public.guests;
create policy "guests_select_by_event_access"
on public.guests for select
to authenticated
using (
  exists (
    select 1 from public.events event_row
    where event_row.id = guests.event_id
      and (
        event_row.client_id = auth.uid()
        or event_row.owner_id = auth.uid()
        or exists (
          select 1 from public.profiles owner_profile
          where owner_profile.id = auth.uid()
            and owner_profile.role = 'owner'
        )
      )
  )
);

drop policy if exists "wishes_select_by_event_access" on public.wishes;
create policy "wishes_select_by_event_access"
on public.wishes for select
to authenticated
using (
  exists (
    select 1 from public.events event_row
    where event_row.id = wishes.event_id
      and (
        event_row.client_id = auth.uid()
        or event_row.owner_id = auth.uid()
        or exists (
          select 1 from public.profiles owner_profile
          where owner_profile.id = auth.uid()
            and owner_profile.role = 'owner'
        )
      )
  )
);
