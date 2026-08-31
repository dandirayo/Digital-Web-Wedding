-- Occasio extended schema.
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

  if not exists (select 1 from pg_type where typname = 'package_tier') then
    create type public.package_tier as enum ('silver', 'gold', 'platinum');
  end if;

  if not exists (select 1 from pg_type where typname = 'template_category') then
    create type public.template_category as enum ('standard', 'unique', 'custom');
  end if;

  if not exists (select 1 from pg_type where typname = 'media_type') then
    create type public.media_type as enum ('photo', 'video', 'audio');
  end if;

  if not exists (select 1 from pg_type where typname = 'media_category') then
    create type public.media_category as enum ('cover', 'bride', 'groom', 'prewedding', 'gallery', 'map');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'client',
  created_at timestamptz not null default now()
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category public.template_category not null default 'standard',
  description text not null default '',
  thumbnail_url text not null default '',
  preview_url text not null default '',
  min_package public.package_tier not null default 'silver',
  is_active boolean not null default true,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug public.package_tier not null unique,
  price text not null,
  price_numeric int not null default 0,
  description text not null default '',
  features jsonb not null default '[]'::jsonb,
  max_guests int not null default 100,
  max_revisions int not null default 2,
  duration_months int not null default 3,
  includes_tablet boolean not null default false,
  includes_crew int not null default 0,
  includes_live_gallery boolean not null default false,
  includes_photo_booth boolean not null default false,
  includes_qr_checkin boolean not null default false,
  sort_order int not null default 0,
  is_active boolean not null default true,
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

-- Alter public.events to add new columns
alter table public.events 
  add column if not exists template_id uuid references public.templates(id) on delete set null,
  add column if not exists package_id uuid references public.packages(id) on delete set null,
  add column if not exists package_tier public.package_tier not null default 'silver',
  add column if not exists is_published boolean not null default false,
  add column if not exists published_at timestamptz,
  add column if not exists expires_at timestamptz;

create table if not exists public.event_content (
  event_id uuid primary key references public.events(id) on delete cascade,
  greeting text not null default '',
  bride_name text not null default '',
  bride_photo_url text not null default '',
  bride_parent text not null default '',
  groom_name text not null default '',
  groom_photo_url text not null default '',
  groom_parent text not null default '',
  akad_time text not null default '',
  akad_venue text not null default '',
  resepsi_time text not null default '',
  resepsi_venue text not null default '',
  love_story jsonb not null default '[]'::jsonb,
  bank_accounts jsonb not null default '[]'::jsonb,
  music_url text not null default '',
  custom_css text not null default '',
  updated_at timestamptz not null default now()
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

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  type public.media_type not null default 'photo',
  url text not null,
  alt_text text not null default '',
  category public.media_category not null default 'gallery',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.live_gallery (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  photo_url text not null,
  caption text not null default '',
  uploaded_by text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.guests enable row level security;
alter table public.wishes enable row level security;
alter table public.templates enable row level security;
alter table public.packages enable row level security;
alter table public.event_content enable row level security;
alter table public.media enable row level security;
alter table public.live_gallery enable row level security;

-- PROFILES POLICIES
drop policy if exists "profiles_select_own_or_owner" on public.profiles;
create policy "profiles_select_own_or_owner"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.profiles owner_profile
    where owner_profile.id = auth.uid()
      and owner_profile.role = 'owner'
  )
);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own_or_owner" on public.profiles;
create policy "profiles_update_own_or_owner"
on public.profiles for update to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.profiles owner_profile
    where owner_profile.id = auth.uid()
      and owner_profile.role = 'owner'
  )
)
with check (
  id = auth.uid()
  or exists (
    select 1 from public.profiles owner_profile
    where owner_profile.id = auth.uid()
      and owner_profile.role = 'owner'
  )
);

-- EVENTS POLICIES
drop policy if exists "events_select_client_or_owner" on public.events;
create policy "events_select_client_or_owner"
on public.events for select to authenticated
using (
  client_id = auth.uid()
  or owner_id = auth.uid()
  or exists (
    select 1 from public.profiles owner_profile
    where owner_profile.id = auth.uid()
      and owner_profile.role = 'owner'
  )
);

drop policy if exists "events_insert_owner" on public.events;
create policy "events_insert_owner"
on public.events for insert to authenticated
with check (
  owner_id = auth.uid()
  or exists (
    select 1 from public.profiles owner_profile
    where owner_profile.id = auth.uid()
      and owner_profile.role = 'owner'
  )
);

drop policy if exists "events_update_client_or_owner" on public.events;
create policy "events_update_client_or_owner"
on public.events for update to authenticated
using (
  client_id = auth.uid()
  or owner_id = auth.uid()
  or exists (
    select 1 from public.profiles owner_profile
    where owner_profile.id = auth.uid()
      and owner_profile.role = 'owner'
  )
)
with check (
  client_id = auth.uid()
  or owner_id = auth.uid()
  or exists (
    select 1 from public.profiles owner_profile
    where owner_profile.id = auth.uid()
      and owner_profile.role = 'owner'
  )
);

-- TEMPLATES POLICIES
drop policy if exists "templates_select_all" on public.templates;
create policy "templates_select_all" on public.templates for select using (true);

drop policy if exists "templates_all_owner" on public.templates;
create policy "templates_all_owner" on public.templates for all to authenticated using (
  exists (
    select 1 from public.profiles owner_profile
    where owner_profile.id = auth.uid()
      and owner_profile.role = 'owner'
  )
) with check (
  exists (
    select 1 from public.profiles owner_profile
    where owner_profile.id = auth.uid()
      and owner_profile.role = 'owner'
  )
);

-- PACKAGES POLICIES
drop policy if exists "packages_select_all" on public.packages;
create policy "packages_select_all" on public.packages for select using (true);

drop policy if exists "packages_all_owner" on public.packages;
create policy "packages_all_owner" on public.packages for all to authenticated using (
  exists (
    select 1 from public.profiles owner_profile
    where owner_profile.id = auth.uid()
      and owner_profile.role = 'owner'
  )
) with check (
  exists (
    select 1 from public.profiles owner_profile
    where owner_profile.id = auth.uid()
      and owner_profile.role = 'owner'
  )
);

-- EVENT CONTENT POLICIES
drop policy if exists "event_content_select_access" on public.event_content;
create policy "event_content_select_access" on public.event_content for select to authenticated using (
  exists (
    select 1 from public.events event_row
    where event_row.id = event_content.event_id
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

drop policy if exists "event_content_insert_access" on public.event_content;
create policy "event_content_insert_access" on public.event_content for insert to authenticated with check (
  exists (
    select 1 from public.events event_row
    where event_row.id = event_content.event_id
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

drop policy if exists "event_content_update_access" on public.event_content;
create policy "event_content_update_access" on public.event_content for update to authenticated using (
  exists (
    select 1 from public.events event_row
    where event_row.id = event_content.event_id
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
) with check (
  exists (
    select 1 from public.events event_row
    where event_row.id = event_content.event_id
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

drop policy if exists "event_content_delete_access" on public.event_content;
create policy "event_content_delete_access" on public.event_content for delete to authenticated using (
  exists (
    select 1 from public.events event_row
    where event_row.id = event_content.event_id
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

-- MEDIA POLICIES
drop policy if exists "media_select_access" on public.media;
create policy "media_select_access" on public.media for select to authenticated using (
  exists (
    select 1 from public.events event_row
    where event_row.id = media.event_id
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

drop policy if exists "media_insert_access" on public.media;
create policy "media_insert_access" on public.media for insert to authenticated with check (
  exists (
    select 1 from public.events event_row
    where event_row.id = media.event_id
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

drop policy if exists "media_update_access" on public.media;
create policy "media_update_access" on public.media for update to authenticated using (
  exists (
    select 1 from public.events event_row
    where event_row.id = media.event_id
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
) with check (
  exists (
    select 1 from public.events event_row
    where event_row.id = media.event_id
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

drop policy if exists "media_delete_access" on public.media;
create policy "media_delete_access" on public.media for delete to authenticated using (
  exists (
    select 1 from public.events event_row
    where event_row.id = media.event_id
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

-- LIVE GALLERY POLICIES
drop policy if exists "live_gallery_select_anon" on public.live_gallery;
create policy "live_gallery_select_anon" on public.live_gallery for select using (
  exists (
    select 1 from public.events event_row
    where event_row.id = live_gallery.event_id
      and event_row.status = 'active'
  )
);

drop policy if exists "live_gallery_insert_authenticated" on public.live_gallery;
create policy "live_gallery_insert_authenticated" on public.live_gallery for insert to authenticated with check (true);


-- GUESTS POLICIES
drop policy if exists "guests_select_by_event_access" on public.guests;
create policy "guests_select_by_event_access"
on public.guests for select to authenticated
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

drop policy if exists "guests_insert_by_event_access" on public.guests;
create policy "guests_insert_by_event_access"
on public.guests for insert to authenticated
with check (
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

drop policy if exists "guests_update_by_event_access" on public.guests;
create policy "guests_update_by_event_access"
on public.guests for update to authenticated
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
)
with check (
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

drop policy if exists "guests_select_anon" on public.guests;
create policy "guests_select_anon" on public.guests for select to anon using (true);

drop policy if exists "guests_update_anon" on public.guests;
create policy "guests_update_anon" on public.guests for update to anon using (true) with check (true);


-- WISHES POLICIES
drop policy if exists "wishes_select_by_event_access" on public.wishes;
create policy "wishes_select_by_event_access"
on public.wishes for select to authenticated
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

drop policy if exists "wishes_insert_authenticated" on public.wishes;
create policy "wishes_insert_authenticated"
on public.wishes for insert to authenticated
with check (
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

drop policy if exists "wishes_update_by_event_access" on public.wishes;
create policy "wishes_update_by_event_access"
on public.wishes for update to authenticated
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
)
with check (
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

drop policy if exists "wishes_insert_anon" on public.wishes;
create policy "wishes_insert_anon" on public.wishes for insert to anon with check (true);
