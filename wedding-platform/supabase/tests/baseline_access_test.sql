begin;

create extension if not exists pgtap with schema extensions;
select plan(31);

select has_table('public', 'orders', 'orders exists in a clean baseline');
select has_table('public', 'event_content_versions', 'versioned content exists');
select has_table('public', 'audit_logs', 'audit log exists');
select has_table('public', 'payments', 'payment verification records exist');
select has_table('storage', 'objects', 'storage objects are available for bucket RLS tests');

-- Auth identities are inserted as postgres. The auth trigger creates profiles
-- from server-controlled app_metadata.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@test.local', '', '{"role":"owner","full_name":"Owner"}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'client-a@test.local', '', '{"role":"client","full_name":"Client A"}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'client-b@test.local', '', '{"role":"client","full_name":"Client B"}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'staff@test.local', '', '{"role":"staff","full_name":"Staff"}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'checkin@test.local', '', '{"role":"staff","full_name":"Check-in Staff"}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'expired-staff@test.local', '', '{"role":"staff","full_name":"Expired Staff"}', '{}', now(), now());

insert into public.packages (
  id, name, slug, price, price_numeric, max_guests, max_revisions, duration_months
)
values ('10000000-0000-0000-0000-000000000001', 'Basic', 'silver', 'Rp799rb', 799000, 500, 2, 3)
-- The safe catalog seed already supplies this package after a normal reset.
on conflict (id) do nothing;

insert into public.events (
  id, owner_id, client_id, slug, couple_name, package_id, package_tier,
  event_date, venue, status, is_published, published_at
)
values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'client-a-event', 'Client A Couple', '10000000-0000-0000-0000-000000000001', 'silver', now() + interval '30 days', 'Venue A', 'active', true, now()),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'client-b-draft', 'Client B Couple', '10000000-0000-0000-0000-000000000001', 'silver', now() + interval '60 days', 'Venue B', 'draft', false, null);

insert into public.guests (id, event_id, name, pax_limit)
values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Tamu A', 2),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Tamu B', 1);

insert into public.orders (
  id, order_number, client_id, owner_id, package_id, package_snapshot,
  agreed_total, deposit_required
)
values
  ('50000000-0000-0000-0000-000000000001', 'ORD-A', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '{"name":"Basic","price":799000}', 799000, 399500),
  ('50000000-0000-0000-0000-000000000002', 'ORD-B', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '{"name":"Basic","price":799000}', 799000, 399500);

insert into public.invoices (id, order_id, invoice_number, status, amount)
values
  ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'INV-A', 'issued', 399500),
  ('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'INV-B', 'issued', 399500);

insert into public.event_content (event_id, greeting, bride_name, groom_name)
values
  ('30000000-0000-0000-0000-000000000001', 'Selamat datang', 'Bride A', 'Groom A'),
  ('30000000-0000-0000-0000-000000000002', 'Draft private', 'Bride B', 'Groom B');

insert into public.event_assignments (event_id, user_id, assignment_role, starts_at, ends_at)
values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'editor', now() - interval '1 hour', now() + interval '1 day'),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'checkin', now() - interval '1 hour', now() + interval '1 day'),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006', 'editor', now() - interval '2 days', now() - interval '1 day');

insert into public.tasks (id, event_id, title, assigned_to)
values ('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Rapikan konten event A', '00000000-0000-0000-0000-000000000004');

insert into public.checkin_logs (id, guest_id, event_id, checked_in_by, pax, method, idempotency_key)
values
  ('80000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 1, 'qr', '90000000-0000-0000-0000-000000000001'),
  ('80000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', null, 1, 'qr', '90000000-0000-0000-0000-000000000002');

insert into storage.objects (id, bucket_id, name, owner, owner_id, metadata)
values ('a0000000-0000-0000-0000-000000000002', 'event-media', '30000000-0000-0000-0000-000000000002/gallery/private-b.jpg', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '{}'::jsonb);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select results_eq(
  $$ select count(*)::bigint from public.events $$,
  $$ values (1::bigint) $$,
  'anon sees only the active published event'
);
select throws_ok(
  $$ select count(*) from public.guests $$,
  '42501',
  null,
  'anon has no Data API privilege for the guest list'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated","app_metadata":{"role":"client"}}', true);
select results_eq(
  $$ select array_agg(slug order by slug) from public.events $$,
  $$ values (array['client-a-event']::text[]) $$,
  'client A sees only their event'
);
select results_eq(
  $$ select array_agg(invoice_number order by invoice_number) from public.invoices $$,
  $$ values (array['INV-A']::text[]) $$,
  'client A sees only their invoice'
);
select results_eq(
  $$ update public.guests set name = 'Blocked' where id = '40000000-0000-0000-0000-000000000002' returning name $$,
  $$ select null::text where false $$,
  'client A cannot update client B guest'
);
select results_eq(
  $$ update public.guests set name = 'Updated A' where id = '40000000-0000-0000-0000-000000000001' returning name $$,
  $$ values ('Updated A'::text) $$,
  'client A can update their own guest'
);
select throws_ok(
  $$ update public.profiles set role = 'owner' where id = '00000000-0000-0000-0000-000000000002' $$,
  '42501',
  null,
  'client cannot promote their own profile role'
);
select results_eq(
  $$ select array_agg(name order by name) from storage.objects where bucket_id = 'event-media' $$,
  $$ values (null::text[]) $$,
  'client A cannot list client B event-media object'
);
select results_eq(
  $$ insert into storage.objects (id, bucket_id, name, owner, owner_id, metadata)
     values ('b0000000-0000-0000-0000-000000000001', 'payment-proofs', '00000000-0000-0000-0000-000000000002/inv-a.jpg', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '{}'::jsonb)
     returning name $$,
  $$ values ('00000000-0000-0000-0000-000000000002/inv-a.jpg'::text) $$,
  'client A can upload their own payment proof'
);
select throws_ok(
  $$ insert into storage.objects (id, bucket_id, name, owner, owner_id, metadata)
     values ('b0000000-0000-0000-0000-000000000002', 'payment-proofs', '00000000-0000-0000-0000-000000000003/inv-b.jpg', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '{}'::jsonb)
     returning name $$,
  '42501',
  null,
  'client A cannot upload a payment proof under client B path'
);
select results_eq(
  $$ update storage.objects set version = 'v2' where bucket_id = 'payment-proofs' and name = '00000000-0000-0000-0000-000000000002/inv-a.jpg' returning version $$,
  $$ values ('v2'::text) $$,
  'client A can update their own payment proof object for upsert'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000004","role":"authenticated","app_metadata":{"role":"staff"}}', true);
select results_eq(
  $$ select array_agg(slug order by slug) from public.events $$,
  $$ values (array['client-a-event']::text[]) $$,
  'assigned production staff sees only their assigned event'
);
select results_eq(
  $$ select array_agg(bride_name order by bride_name) from public.event_content $$,
  $$ values (array['Bride A']::text[]) $$,
  'assigned production staff sees only assigned event content'
);
select results_eq(
  $$ select array_agg(title order by title) from public.tasks $$,
  $$ values (array['Rapikan konten event A']::text[]) $$,
  'assigned production staff sees their task'
);
select results_eq(
  $$ select array_agg(invoice_number order by invoice_number) from public.invoices $$,
  $$ values (null::text[]) $$,
  'staff cannot read client invoices'
);
select results_eq(
  $$ insert into public.media (event_id, type, url, storage_path, category)
     values ('30000000-0000-0000-0000-000000000001', 'photo', 'private://cover-a.jpg', '30000000-0000-0000-0000-000000000001/gallery/cover-a.jpg', 'gallery')
     returning storage_path $$,
  $$ values ('30000000-0000-0000-0000-000000000001/gallery/cover-a.jpg'::text) $$,
  'assigned production staff can add media metadata to their event'
);
select throws_ok(
  $$ insert into public.media (event_id, type, url, storage_path, category)
     values ('30000000-0000-0000-0000-000000000002', 'photo', 'private://cover-b.jpg', '30000000-0000-0000-0000-000000000002/gallery/cover-b.jpg', 'gallery')
     returning storage_path $$,
  '42501',
  null,
  'assigned production staff cannot add media metadata to another event'
);
select results_eq(
  $$ insert into storage.objects (id, bucket_id, name, owner, owner_id, metadata)
     values ('a0000000-0000-0000-0000-000000000001', 'event-media', '30000000-0000-0000-0000-000000000001/gallery/staff-a.jpg', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '{}'::jsonb)
     returning name $$,
  $$ values ('30000000-0000-0000-0000-000000000001/gallery/staff-a.jpg'::text) $$,
  'assigned production staff can upload event-media to their event path'
);
select results_eq(
  $$ update storage.objects set version = 'v2' where bucket_id = 'event-media' and name = '30000000-0000-0000-0000-000000000001/gallery/staff-a.jpg' returning version $$,
  $$ values ('v2'::text) $$,
  'assigned production staff can update event-media object for upsert'
);
select throws_ok(
  $$ insert into storage.objects (id, bucket_id, name, owner, owner_id, metadata)
     values ('a0000000-0000-0000-0000-000000000003', 'event-media', '30000000-0000-0000-0000-000000000002/gallery/staff-b.jpg', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '{}'::jsonb)
     returning name $$,
  '42501',
  null,
  'assigned production staff cannot upload event-media to another event path'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000005","role":"authenticated","app_metadata":{"role":"staff"}}', true);
select results_eq(
  $$ select array_agg(name order by name) from public.guests $$,
  $$ values (array['Updated A']::text[]) $$,
  'check-in staff sees guests for the assigned event'
);
select results_eq(
  $$ select count(*)::bigint from public.checkin_logs $$,
  $$ values (1::bigint) $$,
  'check-in staff sees check-in logs for the assigned event'
);
select throws_ok(
  $$ insert into public.media (event_id, type, url, storage_path, category)
     values ('30000000-0000-0000-0000-000000000001', 'photo', 'private://checkin.jpg', '30000000-0000-0000-0000-000000000001/gallery/checkin.jpg', 'gallery')
     returning storage_path $$,
  '42501',
  null,
  'check-in-only staff cannot add production media'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000006","role":"authenticated","app_metadata":{"role":"staff"}}', true);
select results_eq(
  $$ select count(*)::bigint from public.events $$,
  $$ values (0::bigint) $$,
  'expired staff assignment no longer grants event access'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"owner"}}', true);
select results_eq(
  $$ select count(*)::bigint from public.events $$,
  $$ values (2::bigint) $$,
  'owner sees all client events'
);
select results_eq(
  $$ select count(*)::bigint from public.invoices $$,
  $$ values (2::bigint) $$,
  'owner sees all invoices'
);
reset role;

select * from finish();
rollback;
