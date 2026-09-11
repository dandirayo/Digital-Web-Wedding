-- Occasio clean-install baseline for the Basic product flow.
-- This migration intentionally precedes the existing hardening migration.
-- It creates the complete relational foundation without publishing anything
-- or granting anonymous access to private client/guest data.

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.app_role as enum ('owner', 'client', 'staff');
create type public.event_status as enum ('draft', 'active', 'completed', 'archived');
create type public.rsvp_status as enum ('pending', 'attending', 'declined');
create type public.package_tier as enum ('silver', 'gold', 'platinum');
create type public.template_category as enum ('standard', 'unique', 'custom');
create type public.media_type as enum ('photo', 'video', 'audio');
create type public.media_category as enum ('cover', 'bride', 'groom', 'prewedding', 'gallery', 'map', 'document', 'payment_proof');
create type public.lead_status as enum ('new', 'contacted', 'qualified', 'converted', 'lost');
create type public.conversation_status as enum ('open', 'closed');
create type public.offer_status as enum ('draft', 'sent', 'accepted', 'rejected', 'expired');
create type public.order_status as enum (
  'awaiting_deposit',
  'onboarding',
  'in_production',
  'client_review',
  'awaiting_final_payment',
  'ready_to_publish',
  'published',
  'completed',
  'cancelled'
);
create type public.invoice_status as enum ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'void');
create type public.payment_status as enum ('submitted', 'verified', 'rejected', 'refunded');
create type public.content_version_status as enum ('draft', 'internal_review', 'client_review', 'approved', 'published', 'superseded');
create type public.approval_decision as enum ('approved', 'changes_requested');
create type public.task_status as enum ('todo', 'in_progress', 'blocked', 'done');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  role public.app_role not null default 'client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category public.template_category not null default 'standard',
  description text not null default '',
  thumbnail_url text not null default '',
  preview_url text not null default '',
  min_package public.package_tier not null default 'silver',
  is_active boolean not null default true,
  config_json jsonb not null default '{}'::jsonb check (jsonb_typeof(config_json) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug public.package_tier not null unique,
  version integer not null default 1 check (version > 0),
  price text not null,
  price_numeric numeric(12,2) not null check (price_numeric >= 0),
  description text not null default '',
  features jsonb not null default '[]'::jsonb check (jsonb_typeof(features) = 'array'),
  max_guests integer not null check (max_guests > 0),
  max_revisions integer not null check (max_revisions >= 0),
  duration_months integer not null check (duration_months > 0),
  includes_tablet boolean not null default false,
  includes_crew integer not null default 0 check (includes_crew >= 0),
  includes_live_gallery boolean not null default false,
  includes_photo_booth boolean not null default false,
  includes_qr_checkin boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  whatsapp text not null,
  email text,
  event_date date,
  event_type text not null default 'Pernikahan',
  source text not null default 'website',
  notes text not null default '',
  status public.lead_status not null default 'new',
  assigned_to uuid references public.profiles(id) on delete set null,
  converted_client_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  subject text not null default 'Konsultasi Occasio',
  status public.conversation_status not null default 'open',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  client_message_id uuid not null default gen_random_uuid(),
  body text not null check (char_length(trim(body)) between 1 and 5000),
  message_type text not null default 'text' check (message_type in ('text', 'system', 'brief', 'offer')),
  created_at timestamptz not null default now(),
  unique (conversation_id, client_message_id)
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  client_id uuid references public.profiles(id) on delete restrict,
  conversation_id uuid references public.conversations(id) on delete set null,
  offer_number text not null unique,
  version integer not null default 1 check (version > 0),
  status public.offer_status not null default 'draft',
  currency text not null default 'IDR' check (currency ~ '^[A-Z]{3}$'),
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  total numeric(12,2) generated always as (greatest(subtotal - discount, 0)) stored,
  scope_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(scope_snapshot) = 'object'),
  valid_until date,
  sent_at timestamptz,
  accepted_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.offer_items (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) generated always as (quantity * unit_price) stored,
  sort_order integer not null default 0
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  offer_id uuid unique references public.offers(id) on delete set null,
  client_id uuid not null references public.profiles(id) on delete restrict,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  status public.order_status not null default 'awaiting_deposit',
  package_id uuid references public.packages(id) on delete restrict,
  package_snapshot jsonb not null check (jsonb_typeof(package_snapshot) = 'object'),
  add_on_snapshot jsonb not null default '[]'::jsonb check (jsonb_typeof(add_on_snapshot) = 'array'),
  agreed_total numeric(12,2) not null check (agreed_total >= 0),
  deposit_required numeric(12,2) not null check (deposit_required >= 0 and deposit_required <= agreed_total),
  target_publish_at timestamptz,
  confirmed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  invoice_number text not null unique,
  status public.invoice_status not null default 'draft',
  currency text not null default 'IDR' check (currency ~ '^[A-Z]{3}$'),
  amount numeric(12,2) not null check (amount > 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0 and amount_paid <= amount),
  due_at timestamptz,
  issued_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  status public.payment_status not null default 'submitted',
  bank_reference text,
  proof_storage_path text,
  submitted_at timestamptz not null default now(),
  verified_by uuid references public.profiles(id) on delete restrict,
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'verified' and verified_by is not null and verified_at is not null)
    or status <> 'verified'
  )
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  client_id uuid references public.profiles(id) on delete restrict,
  order_id uuid unique references public.orders(id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  couple_name text not null,
  template_id uuid references public.templates(id) on delete restrict,
  package_id uuid references public.packages(id) on delete restrict,
  package_tier public.package_tier not null default 'silver',
  event_date timestamptz not null,
  venue text not null default '',
  status public.event_status not null default 'draft',
  is_published boolean not null default false,
  published_at timestamptz,
  expires_at timestamptz,
  published_content_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_published = false) or (status = 'active' and published_at is not null)),
  check (expires_at is null or expires_at > created_at)
);

create table public.event_content (
  event_id uuid primary key references public.events(id) on delete cascade,
  greeting text not null default '',
  bride_name text not null default '',
  bride_photo_url text not null default '',
  bride_parent text not null default '',
  groom_name text not null default '',
  groom_photo_url text not null default '',
  groom_parent text not null default '',
  akad_time timestamptz,
  akad_venue text not null default '',
  resepsi_time timestamptz,
  resepsi_venue text not null default '',
  love_story jsonb not null default '[]'::jsonb check (jsonb_typeof(love_story) = 'array'),
  bank_accounts jsonb not null default '[]'::jsonb check (jsonb_typeof(bank_accounts) = 'array'),
  music_url text not null default '',
  custom_css text not null default '',
  updated_at timestamptz not null default now()
);

create table public.event_content_versions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  version integer not null check (version > 0),
  status public.content_version_status not null default 'draft',
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  approved_at timestamptz,
  published_at timestamptz,
  unique (event_id, version),
  unique (event_id, id)
);

alter table public.events
  add constraint events_published_content_version_fkey
  foreign key (id, published_content_version_id)
  references public.event_content_versions(event_id, id)
  deferrable initially deferred;

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  content_version_id uuid not null references public.event_content_versions(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  actor_role public.app_role not null,
  decision public.approval_decision not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table public.event_assignments (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assignment_role text not null check (assignment_role in ('manager', 'editor', 'support', 'checkin')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id, assignment_role),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  title text not null,
  description text not null default '',
  status public.task_status not null default 'todo',
  assigned_to uuid references public.profiles(id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (order_id is not null or event_id is not null),
  check ((status = 'done' and completed_at is not null) or status <> 'done')
);

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  phone text not null default '',
  pax_limit integer not null default 1 check (pax_limit > 0),
  rsvp_status public.rsvp_status not null default 'pending',
  pax_confirmed integer not null default 0 check (pax_confirmed >= 0 and pax_confirmed <= pax_limit),
  qr_code text not null default '',
  invitation_token_hash text unique,
  token_expires_at timestamptz,
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rsvp_submissions (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  status public.rsvp_status not null,
  pax_confirmed integer not null check (pax_confirmed >= 0),
  idempotency_key uuid not null,
  submitted_at timestamptz not null default now(),
  unique (guest_id, idempotency_key)
);

create table public.checkin_logs (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  checked_in_by uuid references public.profiles(id) on delete restrict,
  pax integer not null check (pax > 0),
  method text not null check (method in ('qr', 'search', 'manual_override')),
  idempotency_key uuid not null,
  checked_in_at timestamptz not null default now(),
  unique (event_id, idempotency_key)
);

create table public.wishes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_id uuid references public.guests(id) on delete set null,
  guest_name text not null,
  message text not null check (char_length(trim(message)) between 1 and 2000),
  is_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  type public.media_type not null default 'photo',
  url text not null,
  storage_path text,
  alt_text text not null default '',
  category public.media_category not null default 'gallery',
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.live_gallery (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  photo_url text not null,
  storage_path text,
  caption text not null default '',
  uploaded_by uuid references public.profiles(id) on delete set null,
  is_visible boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

-- Foreign-key and frequent-filter indexes. PostgreSQL does not create these
-- automatically for referencing columns.
create index leads_assigned_to_idx on public.leads(assigned_to);
create index leads_status_created_at_idx on public.leads(status, created_at desc);
create index conversation_members_user_id_idx on public.conversation_members(user_id);
create index messages_conversation_created_at_idx on public.messages(conversation_id, created_at desc);
create index offers_client_id_idx on public.offers(client_id);
create index offers_lead_id_idx on public.offers(lead_id);
create index offer_items_offer_id_idx on public.offer_items(offer_id);
create index orders_client_id_idx on public.orders(client_id);
create index orders_owner_status_idx on public.orders(owner_id, status);
create index invoices_order_id_idx on public.invoices(order_id);
create index payments_invoice_id_idx on public.payments(invoice_id);
create index events_owner_id_idx on public.events(owner_id);
create index events_client_id_idx on public.events(client_id);
create index events_order_id_idx on public.events(order_id);
create index events_published_slug_idx on public.events(slug) where is_published = true and status = 'active';
create index event_content_versions_event_status_idx on public.event_content_versions(event_id, status);
create index approvals_event_id_idx on public.approvals(event_id);
create index approvals_content_version_id_idx on public.approvals(content_version_id);
create index event_assignments_user_id_idx on public.event_assignments(user_id);
create index tasks_order_id_idx on public.tasks(order_id);
create index tasks_event_id_idx on public.tasks(event_id);
create index tasks_assigned_status_idx on public.tasks(assigned_to, status);
create index guests_event_id_idx on public.guests(event_id);
create index guests_event_name_idx on public.guests(event_id, name);
create index rsvp_submissions_guest_id_idx on public.rsvp_submissions(guest_id);
create index checkin_logs_guest_id_idx on public.checkin_logs(guest_id);
create index checkin_logs_event_checked_at_idx on public.checkin_logs(event_id, checked_in_at desc);
create index wishes_event_visible_idx on public.wishes(event_id, created_at desc) where is_visible = true;
create index media_event_category_idx on public.media(event_id, category, sort_order);
create index live_gallery_event_created_idx on public.live_gallery(event_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);
create index audit_logs_actor_id_idx on public.audit_logs(actor_id);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role public.app_role;
begin
  requested_role := case
    when new.raw_app_meta_data ->> 'role' in ('owner', 'client', 'staff')
      then (new.raw_app_meta_data ->> 'role')::public.app_role
    else 'client'::public.app_role
  end;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_app_meta_data ->> 'full_name', ''),
    new.email,
    requested_role
  );
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;
revoke execute on function private.set_updated_at() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger templates_set_updated_at before update on public.templates for each row execute function private.set_updated_at();
create trigger packages_set_updated_at before update on public.packages for each row execute function private.set_updated_at();
create trigger leads_set_updated_at before update on public.leads for each row execute function private.set_updated_at();
create trigger conversations_set_updated_at before update on public.conversations for each row execute function private.set_updated_at();
create trigger offers_set_updated_at before update on public.offers for each row execute function private.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute function private.set_updated_at();
create trigger invoices_set_updated_at before update on public.invoices for each row execute function private.set_updated_at();
create trigger payments_set_updated_at before update on public.payments for each row execute function private.set_updated_at();
create trigger events_set_updated_at before update on public.events for each row execute function private.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks for each row execute function private.set_updated_at();
create trigger guests_set_updated_at before update on public.guests for each row execute function private.set_updated_at();
create trigger wishes_set_updated_at before update on public.wishes for each row execute function private.set_updated_at();
create trigger media_set_updated_at before update on public.media for each row execute function private.set_updated_at();

-- RLS is enabled on every table in the exposed public schema.
alter table public.profiles enable row level security;
alter table public.templates enable row level security;
alter table public.packages enable row level security;
alter table public.leads enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.offers enable row level security;
alter table public.offer_items enable row level security;
alter table public.orders enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.events enable row level security;
alter table public.event_content enable row level security;
alter table public.event_content_versions enable row level security;
alter table public.approvals enable row level security;
alter table public.event_assignments enable row level security;
alter table public.tasks enable row level security;
alter table public.guests enable row level security;
alter table public.rsvp_submissions enable row level security;
alter table public.checkin_logs enable row level security;
alter table public.wishes enable row level security;
alter table public.media enable row level security;
alter table public.live_gallery enable row level security;
alter table public.audit_logs enable row level security;

-- Catalog is public read-only; management requires a server-authorized owner.
create policy templates_select_all on public.templates for select to anon, authenticated using (is_active = true);
create policy templates_all_owner on public.templates for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');
create policy packages_select_all on public.packages for select to anon, authenticated using (is_active = true);
create policy packages_all_owner on public.packages for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

create policy profiles_select_own_or_owner on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');
create policy profiles_insert_own on public.profiles for insert to authenticated
with check (id = (select auth.uid()));
create policy profiles_update_own_or_owner on public.profiles for update to authenticated
using (id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check (id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

-- Owner-managed CRM. Client access begins only after membership/ownership exists.
create policy leads_owner_all on public.leads for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

create policy conversations_member_select on public.conversations for select to authenticated
using (
  (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
  or exists (
    select 1 from public.conversation_members member
    where member.conversation_id = conversations.id and member.user_id = (select auth.uid())
  )
);
create policy conversations_owner_write on public.conversations for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');
create policy conversation_members_self_select on public.conversation_members for select to authenticated
using (user_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');
create policy conversation_members_owner_write on public.conversation_members for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');
create policy messages_member_select on public.messages for select to authenticated
using (
  (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
  or exists (
    select 1 from public.conversation_members member
    where member.conversation_id = messages.conversation_id and member.user_id = (select auth.uid())
  )
);
create policy messages_member_insert on public.messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1 from public.conversation_members member
    where member.conversation_id = messages.conversation_id and member.user_id = (select auth.uid())
  )
);

create policy offers_client_or_owner_select on public.offers for select to authenticated
using (client_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');
create policy offers_owner_write on public.offers for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');
create policy offer_items_offer_access on public.offer_items for select to authenticated
using (exists (
  select 1 from public.offers offer_row
  where offer_row.id = offer_items.offer_id
    and (offer_row.client_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));
create policy offer_items_owner_write on public.offer_items for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

create policy orders_client_or_owner_select on public.orders for select to authenticated
using (client_id = (select auth.uid()) or owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');
create policy orders_owner_write on public.orders for all to authenticated
using (owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check (owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

create policy invoices_order_access on public.invoices for select to authenticated
using (exists (
  select 1 from public.orders order_row
  where order_row.id = invoices.order_id
    and (order_row.client_id = (select auth.uid()) or order_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));
create policy invoices_owner_write on public.invoices for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');
create policy payments_invoice_access on public.payments for select to authenticated
using (exists (
  select 1 from public.invoices invoice_row
  join public.orders order_row on order_row.id = invoice_row.order_id
  where invoice_row.id = payments.invoice_id
    and (order_row.client_id = (select auth.uid()) or order_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));
create policy payments_client_submit on public.payments for insert to authenticated
with check (
  submitted_by = (select auth.uid()) and status = 'submitted'
  and exists (
    select 1 from public.invoices invoice_row
    join public.orders order_row on order_row.id = invoice_row.order_id
    where invoice_row.id = payments.invoice_id and order_row.client_id = (select auth.uid())
  )
);
create policy payments_owner_update on public.payments for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

create policy events_select_client_or_owner on public.events for select to authenticated
using (client_id = (select auth.uid()) or owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');
create policy events_select_published_anon on public.events for select to anon
using (status = 'active' and is_published = true and (expires_at is null or expires_at > now()));
create policy events_insert_owner on public.events for insert to authenticated
with check (owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');
create policy events_update_client_or_owner on public.events for update to authenticated
using (owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check (owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

create policy event_content_select_access on public.event_content for select to authenticated
using (exists (
  select 1 from public.events event_row where event_row.id = event_content.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));
create policy event_content_select_public on public.event_content for select to anon
using (exists (
  select 1 from public.events event_row where event_row.id = event_content.event_id
  and event_row.status = 'active' and event_row.is_published = true and (event_row.expires_at is null or event_row.expires_at > now())
));
create policy event_content_insert_access on public.event_content for insert to authenticated
with check (exists (
  select 1 from public.events event_row where event_row.id = event_content.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));
create policy event_content_update_access on public.event_content for update to authenticated
using (exists (
  select 1 from public.events event_row where event_row.id = event_content.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
))
with check (exists (
  select 1 from public.events event_row where event_row.id = event_content.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));
create policy event_content_delete_access on public.event_content for delete to authenticated
using (exists (
  select 1 from public.events event_row where event_row.id = event_content.event_id
  and (event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));

create policy content_versions_event_select on public.event_content_versions for select to authenticated
using (exists (
  select 1 from public.events event_row where event_row.id = event_content_versions.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));
create policy content_versions_public_select on public.event_content_versions for select to anon
using (exists (
  select 1 from public.events event_row where event_row.id = event_content_versions.event_id
  and event_row.published_content_version_id = event_content_versions.id
  and event_row.status = 'active' and event_row.is_published = true and (event_row.expires_at is null or event_row.expires_at > now())
));
create policy content_versions_draft_insert on public.event_content_versions for insert to authenticated
with check (
  created_by = (select auth.uid()) and status = 'draft'
  and exists (
    select 1 from public.events event_row where event_row.id = event_content_versions.event_id
    and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
  )
);
create policy content_versions_draft_update on public.event_content_versions for update to authenticated
using (created_by = (select auth.uid()) and status = 'draft')
with check (created_by = (select auth.uid()) and status = 'draft');

create policy approvals_event_select on public.approvals for select to authenticated
using (exists (
  select 1 from public.events event_row where event_row.id = approvals.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));
create policy approvals_actor_insert on public.approvals for insert to authenticated
with check (
  actor_id = (select auth.uid())
  and exists (
    select 1 from public.events event_row where event_row.id = approvals.event_id
    and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
  )
);

create policy assignments_user_or_owner_select on public.event_assignments for select to authenticated
using (user_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');
create policy assignments_owner_write on public.event_assignments for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

create policy tasks_event_access on public.tasks for select to authenticated
using (
  assigned_to = (select auth.uid())
  or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
  or exists (select 1 from public.orders order_row where order_row.id = tasks.order_id and order_row.client_id = (select auth.uid()))
  or exists (select 1 from public.events event_row where event_row.id = tasks.event_id and event_row.client_id = (select auth.uid()))
);
create policy tasks_owner_or_assignee_write on public.tasks for all to authenticated
using (assigned_to = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check (assigned_to = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

create policy guests_select_by_event_access on public.guests for select to authenticated
using (exists (
  select 1 from public.events event_row where event_row.id = guests.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
    or exists (select 1 from public.event_assignments assignment where assignment.event_id = event_row.id and assignment.user_id = (select auth.uid())))
));
create policy guests_insert_by_event_access on public.guests for insert to authenticated
with check (exists (
  select 1 from public.events event_row where event_row.id = guests.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));
create policy guests_update_by_event_access on public.guests for update to authenticated
using (exists (
  select 1 from public.events event_row where event_row.id = guests.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
))
with check (exists (
  select 1 from public.events event_row where event_row.id = guests.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));
create policy guests_delete_by_event_access on public.guests for delete to authenticated
using (exists (
  select 1 from public.events event_row where event_row.id = guests.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));

create policy rsvp_submissions_event_access on public.rsvp_submissions for select to authenticated
using (exists (
  select 1 from public.guests guest_row join public.events event_row on event_row.id = guest_row.event_id
  where guest_row.id = rsvp_submissions.guest_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));
create policy checkin_logs_event_access on public.checkin_logs for select to authenticated
using (exists (
  select 1 from public.events event_row where event_row.id = checkin_logs.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
    or exists (select 1 from public.event_assignments assignment where assignment.event_id = event_row.id and assignment.user_id = (select auth.uid())))
));

create policy wishes_select_by_event_access on public.wishes for select to authenticated
using (exists (
  select 1 from public.events event_row where event_row.id = wishes.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));
create policy wishes_select_public on public.wishes for select to anon
using (is_visible = true and exists (
  select 1 from public.events event_row where event_row.id = wishes.event_id
  and event_row.status = 'active' and event_row.is_published = true and (event_row.expires_at is null or event_row.expires_at > now())
));
create policy wishes_insert_authenticated on public.wishes for insert to authenticated
with check (exists (
  select 1 from public.events event_row where event_row.id = wishes.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));
create policy wishes_update_by_event_access on public.wishes for update to authenticated
using (exists (
  select 1 from public.events event_row where event_row.id = wishes.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
))
with check (exists (
  select 1 from public.events event_row where event_row.id = wishes.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));
create policy wishes_delete_by_event_access on public.wishes for delete to authenticated
using (exists (
  select 1 from public.events event_row where event_row.id = wishes.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));

create policy media_select_access on public.media for select to authenticated
using (exists (
  select 1 from public.events event_row where event_row.id = media.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));
create policy media_select_public on public.media for select to anon
using (is_published = true and exists (
  select 1 from public.events event_row where event_row.id = media.event_id
  and event_row.status = 'active' and event_row.is_published = true and (event_row.expires_at is null or event_row.expires_at > now())
));
create policy media_insert_access on public.media for insert to authenticated
with check (exists (
  select 1 from public.events event_row where event_row.id = media.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));
create policy media_update_access on public.media for update to authenticated
using (exists (
  select 1 from public.events event_row where event_row.id = media.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
))
with check (exists (
  select 1 from public.events event_row where event_row.id = media.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));
create policy media_delete_access on public.media for delete to authenticated
using (exists (
  select 1 from public.events event_row where event_row.id = media.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));

create policy live_gallery_select_anon on public.live_gallery for select to anon
using (is_visible = true and exists (
  select 1 from public.events event_row where event_row.id = live_gallery.event_id
  and event_row.status = 'active' and event_row.is_published = true and (event_row.expires_at is null or event_row.expires_at > now())
));
create policy live_gallery_select_event_access on public.live_gallery for select to authenticated
using (exists (
  select 1 from public.events event_row where event_row.id = live_gallery.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));
create policy live_gallery_insert_authenticated on public.live_gallery for insert to authenticated
with check (exists (
  select 1 from public.events event_row where event_row.id = live_gallery.event_id
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
    or exists (select 1 from public.event_assignments assignment where assignment.event_id = event_row.id and assignment.user_id = (select auth.uid())))
));

create policy audit_logs_owner_select on public.audit_logs for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

-- Explicit Data API privileges: new Supabase projects no longer auto-expose
-- public tables. RLS remains the row-level authorization boundary.
revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.templates, public.packages, public.events, public.event_content,
  public.event_content_versions, public.wishes, public.media, public.live_gallery to anon;

grant select on all tables in schema public to authenticated;
grant insert, update, delete on public.templates, public.packages, public.leads,
  public.conversations, public.conversation_members, public.offers, public.offer_items,
  public.orders, public.invoices, public.events, public.event_content,
  public.event_content_versions, public.event_assignments, public.tasks, public.guests,
  public.wishes, public.media, public.live_gallery to authenticated;
grant insert on public.messages, public.payments, public.approvals to authenticated;
grant update on public.payments to authenticated;
grant update (full_name, phone, updated_at) on public.profiles to authenticated;

-- Private Storage buckets. Public delivery will use authorized/signed access;
-- draft media and payment evidence are never anonymous objects.
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('event-media', 'event-media', false, 52428800),
  ('payment-proofs', 'payment-proofs', false, 10485760)
on conflict (id) do nothing;

create policy event_media_select on storage.objects for select to authenticated
using (
  bucket_id = 'event-media'
  and exists (
    select 1 from public.events event_row
    where event_row.id::text = (storage.foldername(name))[1]
      and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
  )
);
create policy event_media_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'event-media'
  and exists (
    select 1 from public.events event_row
    where event_row.id::text = (storage.foldername(name))[1]
      and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
  )
);
create policy event_media_update on storage.objects for update to authenticated
using (bucket_id = 'event-media' and exists (
  select 1 from public.events event_row where event_row.id::text = (storage.foldername(name))[1]
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
))
with check (bucket_id = 'event-media' and exists (
  select 1 from public.events event_row where event_row.id::text = (storage.foldername(name))[1]
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));
create policy event_media_delete on storage.objects for delete to authenticated
using (bucket_id = 'event-media' and exists (
  select 1 from public.events event_row where event_row.id::text = (storage.foldername(name))[1]
  and (event_row.client_id = (select auth.uid()) or event_row.owner_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
));

create policy payment_proofs_select on storage.objects for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
);
create policy payment_proofs_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy payment_proofs_update on storage.objects for update to authenticated
using (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy payment_proofs_delete on storage.objects for delete to authenticated
using (bucket_id = 'payment-proofs' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'));
