-- Staff assignment access for G2.
-- Assigned team members can work only on events within their active assignment
-- window. Finance remains owner/client-only.

drop policy if exists events_select_client_or_owner on public.events;
create policy events_select_client_or_owner on public.events for select to authenticated
using (
  client_id = (select auth.uid())
  or owner_id = (select auth.uid())
  or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
  or exists (
    select 1
    from public.event_assignments assignment
    where assignment.event_id = events.id
      and assignment.user_id = (select auth.uid())
      and (assignment.starts_at is null or assignment.starts_at <= now())
      and (assignment.ends_at is null or assignment.ends_at > now())
  )
);

drop policy if exists event_content_select_access on public.event_content;
create policy event_content_select_access on public.event_content for select to authenticated
using (exists (
  select 1
  from public.events event_row
  where event_row.id = event_content.event_id
    and (
      event_row.client_id = (select auth.uid())
      or event_row.owner_id = (select auth.uid())
      or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
      or exists (
        select 1
        from public.event_assignments assignment
        where assignment.event_id = event_row.id
          and assignment.user_id = (select auth.uid())
          and assignment.assignment_role in ('manager', 'editor', 'support')
          and (assignment.starts_at is null or assignment.starts_at <= now())
          and (assignment.ends_at is null or assignment.ends_at > now())
      )
    )
));

drop policy if exists event_content_insert_access on public.event_content;
create policy event_content_insert_access on public.event_content for insert to authenticated
with check (exists (
  select 1
  from public.events event_row
  where event_row.id = event_content.event_id
    and (
      event_row.client_id = (select auth.uid())
      or event_row.owner_id = (select auth.uid())
      or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
      or exists (
        select 1
        from public.event_assignments assignment
        where assignment.event_id = event_row.id
          and assignment.user_id = (select auth.uid())
          and assignment.assignment_role in ('manager', 'editor', 'support')
          and (assignment.starts_at is null or assignment.starts_at <= now())
          and (assignment.ends_at is null or assignment.ends_at > now())
      )
    )
));

drop policy if exists event_content_update_access on public.event_content;
create policy event_content_update_access on public.event_content for update to authenticated
using (exists (
  select 1
  from public.events event_row
  where event_row.id = event_content.event_id
    and (
      event_row.client_id = (select auth.uid())
      or event_row.owner_id = (select auth.uid())
      or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
      or exists (
        select 1
        from public.event_assignments assignment
        where assignment.event_id = event_row.id
          and assignment.user_id = (select auth.uid())
          and assignment.assignment_role in ('manager', 'editor', 'support')
          and (assignment.starts_at is null or assignment.starts_at <= now())
          and (assignment.ends_at is null or assignment.ends_at > now())
      )
    )
))
with check (exists (
  select 1
  from public.events event_row
  where event_row.id = event_content.event_id
    and (
      event_row.client_id = (select auth.uid())
      or event_row.owner_id = (select auth.uid())
      or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
      or exists (
        select 1
        from public.event_assignments assignment
        where assignment.event_id = event_row.id
          and assignment.user_id = (select auth.uid())
          and assignment.assignment_role in ('manager', 'editor', 'support')
          and (assignment.starts_at is null or assignment.starts_at <= now())
          and (assignment.ends_at is null or assignment.ends_at > now())
      )
    )
));

drop policy if exists media_select_access on public.media;
create policy media_select_access on public.media for select to authenticated
using (exists (
  select 1
  from public.events event_row
  where event_row.id = media.event_id
    and (
      event_row.client_id = (select auth.uid())
      or event_row.owner_id = (select auth.uid())
      or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
      or exists (
        select 1
        from public.event_assignments assignment
        where assignment.event_id = event_row.id
          and assignment.user_id = (select auth.uid())
          and assignment.assignment_role in ('manager', 'editor', 'support')
          and (assignment.starts_at is null or assignment.starts_at <= now())
          and (assignment.ends_at is null or assignment.ends_at > now())
      )
    )
));

drop policy if exists media_insert_access on public.media;
create policy media_insert_access on public.media for insert to authenticated
with check (exists (
  select 1
  from public.events event_row
  where event_row.id = media.event_id
    and (
      event_row.client_id = (select auth.uid())
      or event_row.owner_id = (select auth.uid())
      or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
      or exists (
        select 1
        from public.event_assignments assignment
        where assignment.event_id = event_row.id
          and assignment.user_id = (select auth.uid())
          and assignment.assignment_role in ('manager', 'editor', 'support')
          and (assignment.starts_at is null or assignment.starts_at <= now())
          and (assignment.ends_at is null or assignment.ends_at > now())
      )
    )
));

drop policy if exists media_update_access on public.media;
create policy media_update_access on public.media for update to authenticated
using (exists (
  select 1
  from public.events event_row
  where event_row.id = media.event_id
    and (
      event_row.client_id = (select auth.uid())
      or event_row.owner_id = (select auth.uid())
      or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
      or exists (
        select 1
        from public.event_assignments assignment
        where assignment.event_id = event_row.id
          and assignment.user_id = (select auth.uid())
          and assignment.assignment_role in ('manager', 'editor', 'support')
          and (assignment.starts_at is null or assignment.starts_at <= now())
          and (assignment.ends_at is null or assignment.ends_at > now())
      )
    )
))
with check (exists (
  select 1
  from public.events event_row
  where event_row.id = media.event_id
    and (
      event_row.client_id = (select auth.uid())
      or event_row.owner_id = (select auth.uid())
      or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
      or exists (
        select 1
        from public.event_assignments assignment
        where assignment.event_id = event_row.id
          and assignment.user_id = (select auth.uid())
          and assignment.assignment_role in ('manager', 'editor', 'support')
          and (assignment.starts_at is null or assignment.starts_at <= now())
          and (assignment.ends_at is null or assignment.ends_at > now())
      )
    )
));

drop policy if exists media_delete_access on public.media;
create policy media_delete_access on public.media for delete to authenticated
using (exists (
  select 1
  from public.events event_row
  where event_row.id = media.event_id
    and (
      event_row.client_id = (select auth.uid())
      or event_row.owner_id = (select auth.uid())
      or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
      or exists (
        select 1
        from public.event_assignments assignment
        where assignment.event_id = event_row.id
          and assignment.user_id = (select auth.uid())
          and assignment.assignment_role in ('manager', 'editor', 'support')
          and (assignment.starts_at is null or assignment.starts_at <= now())
          and (assignment.ends_at is null or assignment.ends_at > now())
      )
    )
));

drop policy if exists live_gallery_insert_authenticated on public.live_gallery;
drop policy if exists live_gallery_insert_event_access on public.live_gallery;
create policy live_gallery_insert_event_access on public.live_gallery for insert to authenticated
with check (exists (
  select 1
  from public.events event_row
  where event_row.id = live_gallery.event_id
    and (
      event_row.client_id = (select auth.uid())
      or event_row.owner_id = (select auth.uid())
      or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
      or exists (
        select 1
        from public.event_assignments assignment
        where assignment.event_id = event_row.id
          and assignment.user_id = (select auth.uid())
          and assignment.assignment_role in ('manager', 'editor', 'support')
          and (assignment.starts_at is null or assignment.starts_at <= now())
          and (assignment.ends_at is null or assignment.ends_at > now())
      )
    )
));

drop policy if exists event_media_select on storage.objects;
create policy event_media_select on storage.objects for select to authenticated
using (
  bucket_id = 'event-media'
  and exists (
    select 1
    from public.events event_row
    where event_row.id::text = (storage.foldername(name))[1]
      and (
        event_row.client_id = (select auth.uid())
        or event_row.owner_id = (select auth.uid())
        or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
        or exists (
          select 1
          from public.event_assignments assignment
          where assignment.event_id = event_row.id
            and assignment.user_id = (select auth.uid())
            and assignment.assignment_role in ('manager', 'editor', 'support')
            and (assignment.starts_at is null or assignment.starts_at <= now())
            and (assignment.ends_at is null or assignment.ends_at > now())
        )
      )
  )
);

drop policy if exists event_media_insert on storage.objects;
create policy event_media_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'event-media'
  and exists (
    select 1
    from public.events event_row
    where event_row.id::text = (storage.foldername(name))[1]
      and (
        event_row.client_id = (select auth.uid())
        or event_row.owner_id = (select auth.uid())
        or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
        or exists (
          select 1
          from public.event_assignments assignment
          where assignment.event_id = event_row.id
            and assignment.user_id = (select auth.uid())
            and assignment.assignment_role in ('manager', 'editor', 'support')
            and (assignment.starts_at is null or assignment.starts_at <= now())
            and (assignment.ends_at is null or assignment.ends_at > now())
        )
      )
  )
);

drop policy if exists event_media_update on storage.objects;
create policy event_media_update on storage.objects for update to authenticated
using (
  bucket_id = 'event-media'
  and exists (
    select 1
    from public.events event_row
    where event_row.id::text = (storage.foldername(name))[1]
      and (
        event_row.client_id = (select auth.uid())
        or event_row.owner_id = (select auth.uid())
        or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
        or exists (
          select 1
          from public.event_assignments assignment
          where assignment.event_id = event_row.id
            and assignment.user_id = (select auth.uid())
            and assignment.assignment_role in ('manager', 'editor', 'support')
            and (assignment.starts_at is null or assignment.starts_at <= now())
            and (assignment.ends_at is null or assignment.ends_at > now())
        )
      )
  )
)
with check (
  bucket_id = 'event-media'
  and exists (
    select 1
    from public.events event_row
    where event_row.id::text = (storage.foldername(name))[1]
      and (
        event_row.client_id = (select auth.uid())
        or event_row.owner_id = (select auth.uid())
        or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
        or exists (
          select 1
          from public.event_assignments assignment
          where assignment.event_id = event_row.id
            and assignment.user_id = (select auth.uid())
            and assignment.assignment_role in ('manager', 'editor', 'support')
            and (assignment.starts_at is null or assignment.starts_at <= now())
            and (assignment.ends_at is null or assignment.ends_at > now())
        )
      )
  )
);

drop policy if exists event_media_delete on storage.objects;
create policy event_media_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'event-media'
  and exists (
    select 1
    from public.events event_row
    where event_row.id::text = (storage.foldername(name))[1]
      and (
        event_row.client_id = (select auth.uid())
        or event_row.owner_id = (select auth.uid())
        or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
        or exists (
          select 1
          from public.event_assignments assignment
          where assignment.event_id = event_row.id
            and assignment.user_id = (select auth.uid())
            and assignment.assignment_role in ('manager', 'editor', 'support')
            and (assignment.starts_at is null or assignment.starts_at <= now())
            and (assignment.ends_at is null or assignment.ends_at > now())
        )
      )
  )
);
