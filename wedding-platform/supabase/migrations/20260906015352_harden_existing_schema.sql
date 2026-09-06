-- Production hardening for the existing Occasio schema.
-- Safe to run after src/lib/supabase/schema.sql; intentionally idempotent.

-- Authorization must come from app_metadata (server-controlled), never from
-- user-editable user_metadata or a client-writable profile.role column.
drop policy if exists "profiles_select_own_or_owner" on public.profiles;
create policy "profiles_select_own_or_owner"
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
);

drop policy if exists "profiles_update_own_or_owner" on public.profiles;
create policy "profiles_update_own_or_owner"
on public.profiles for update to authenticated
using (
  id = (select auth.uid())
  or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
)
with check (
  id = (select auth.uid())
  or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
);

-- Clients may edit their display name, but never their role or identity.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant insert (id, full_name) on table public.profiles to authenticated;
grant update (full_name) on table public.profiles to authenticated;

-- Public catalog reads; only server-authorized owners may manage catalog rows.
revoke all on table public.templates, public.packages from anon, authenticated;
grant select on table public.templates, public.packages to anon, authenticated;
grant insert, update, delete on table public.templates, public.packages to authenticated;

-- Event rows are public only after the owner explicitly publishes them.
drop policy if exists "events_select_client_or_owner" on public.events;
create policy "events_select_client_or_owner"
on public.events for select to authenticated
using (
  client_id = (select auth.uid())
  or owner_id = (select auth.uid())
  or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
);

drop policy if exists "events_select_published_anon" on public.events;
create policy "events_select_published_anon"
on public.events for select to anon
using (status = 'active' and is_published = true);

drop policy if exists "events_insert_owner" on public.events;
create policy "events_insert_owner"
on public.events for insert to authenticated
with check (
  owner_id = (select auth.uid())
  or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
);

drop policy if exists "events_update_client_or_owner" on public.events;
create policy "events_update_owner"
on public.events for update to authenticated
using (
  owner_id = (select auth.uid())
  or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
)
with check (
  owner_id = (select auth.uid())
  or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
);

revoke all on table public.events from anon, authenticated;
grant select on table public.events to anon, authenticated;
grant insert, update on table public.events to authenticated;

-- Public wedding content is readable only for published active events.
drop policy if exists "event_content_select_public" on public.event_content;
create policy "event_content_select_public"
on public.event_content for select to anon
using (
  exists (
    select 1 from public.events event_row
    where event_row.id = event_content.event_id
      and event_row.status = 'active'
      and event_row.is_published = true
  )
);

revoke all on table public.event_content from anon, authenticated;
grant select on table public.event_content to anon, authenticated;
grant insert, update, delete on table public.event_content to authenticated;

drop policy if exists "media_select_public" on public.media;
create policy "media_select_public"
on public.media for select to anon
using (
  exists (
    select 1 from public.events event_row
    where event_row.id = media.event_id
      and event_row.status = 'active'
      and event_row.is_published = true
  )
);

revoke all on table public.media from anon, authenticated;
grant select on table public.media to anon, authenticated;
grant insert, update, delete on table public.media to authenticated;

-- Guest records are private. Public RSVP/check-in will use a future tokenized
-- server endpoint; the guest table itself is never exposed to anon.
drop policy if exists "guests_select_anon" on public.guests;
drop policy if exists "guests_update_anon" on public.guests;
revoke all on table public.guests from anon, authenticated;
grant select, insert, update, delete on table public.guests to authenticated;

drop policy if exists "guests_delete_by_event_access" on public.guests;
create policy "guests_delete_by_event_access"
on public.guests for delete to authenticated
using (
  exists (
    select 1 from public.events event_row
    where event_row.id = guests.event_id
      and (
        event_row.client_id = (select auth.uid())
        or event_row.owner_id = (select auth.uid())
        or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
      )
  )
);

-- Wishes can be displayed publicly only when approved and published.
drop policy if exists "wishes_insert_anon" on public.wishes;
drop policy if exists "wishes_select_public" on public.wishes;
create policy "wishes_select_public"
on public.wishes for select to anon
using (
  is_visible = true
  and exists (
    select 1 from public.events event_row
    where event_row.id = wishes.event_id
      and event_row.status = 'active'
      and event_row.is_published = true
  )
);

revoke all on table public.wishes from anon, authenticated;
grant select on table public.wishes to anon, authenticated;
grant insert, update, delete on table public.wishes to authenticated;

drop policy if exists "wishes_delete_by_event_access" on public.wishes;
create policy "wishes_delete_by_event_access"
on public.wishes for delete to authenticated
using (
  exists (
    select 1 from public.events event_row
    where event_row.id = wishes.event_id
      and (
        event_row.client_id = (select auth.uid())
        or event_row.owner_id = (select auth.uid())
        or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
      )
  )
);

-- Live gallery is public read after publish; uploads remain event-scoped.
revoke all on table public.live_gallery from anon, authenticated;
grant select on table public.live_gallery to anon, authenticated;
grant insert on table public.live_gallery to authenticated;

drop policy if exists "live_gallery_select_anon" on public.live_gallery;
create policy "live_gallery_select_anon"
on public.live_gallery for select to anon
using (
  exists (
    select 1 from public.events event_row
    where event_row.id = live_gallery.event_id
      and event_row.status = 'active'
      and event_row.is_published = true
  )
);

drop policy if exists "live_gallery_insert_authenticated" on public.live_gallery;
create policy "live_gallery_insert_event_access"
on public.live_gallery for insert to authenticated
with check (
  exists (
    select 1 from public.events event_row
    where event_row.id = live_gallery.event_id
      and (
        event_row.client_id = (select auth.uid())
        or event_row.owner_id = (select auth.uid())
        or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
      )
  )
);
