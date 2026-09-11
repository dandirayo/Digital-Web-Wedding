begin;

create extension if not exists pgtap with schema extensions;
select plan(13);

select has_table('public', 'orders', 'orders exists in a clean baseline');
select has_table('public', 'event_content_versions', 'versioned content exists');
select has_table('public', 'audit_logs', 'audit log exists');
select has_table('public', 'payments', 'payment verification records exist');

-- Auth identities are inserted as postgres. The auth trigger creates profiles
-- from server-controlled app_metadata.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@test.local', '', '{"role":"owner","full_name":"Owner"}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'client-a@test.local', '', '{"role":"client","full_name":"Client A"}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'client-b@test.local', '', '{"role":"client","full_name":"Client B"}', '{}', now(), now());

insert into public.packages (
  id, name, slug, price, price_numeric, max_guests, max_revisions, duration_months
)
values ('10000000-0000-0000-0000-000000000001', 'Basic', 'silver', 'Rp799rb', 799000, 500, 2, 3);

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
