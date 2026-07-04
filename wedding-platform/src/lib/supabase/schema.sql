-- Initial schema plan for Occasio.
-- Run this later in Supabase SQL Editor or convert it into migrations.

create type public.app_role as enum ('owner', 'client');
create type public.event_status as enum ('draft', 'active', 'completed', 'archived');
create type public.rsvp_status as enum ('pending', 'attending', 'declined');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'client',
  created_at timestamptz not null default now()
);

create table public.events (
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

create table public.guests (
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

create table public.wishes (
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
