-- Safe local seed: catalog only. No users, passwords, events, payments,
-- or guest data are created here.

insert into public.packages (
  id, name, slug, version, price, price_numeric, description, features,
  max_guests, max_revisions, duration_months, includes_tablet,
  includes_crew, includes_live_gallery, includes_photo_booth,
  includes_qr_checkin, sort_order, is_active
)
values
  (
    '10000000-0000-0000-0000-000000000001', 'Basic', 'silver', 1,
    'Rp799rb', 799000, 'Undangan web untuk rilis pertama Occasio.',
    '["Template pilihan", "Link per tamu", "RSVP online", "Ucapan tamu", "Masa aktif 3 bulan"]'::jsonb,
    500, 2, 3, false, 0, false, false, false, 1, true
  ),
  (
    '10000000-0000-0000-0000-000000000002', 'Premium', 'gold', 1,
    'Rp1,49jt', 1490000, 'Paket QR dan check-in; belum dibuka sebelum G8 lulus.',
    '["Semua Basic", "Dashboard klien", "QR tamu dan check-in", "Galeri foto/video", "Masa aktif 6 bulan"]'::jsonb,
    1000, 5, 6, false, 0, false, false, true, 2, false
  ),
  (
    '10000000-0000-0000-0000-000000000003', 'Signature', 'platinum', 1,
    'Rp2,99jt', 2990000, 'Layanan venue; belum dijual sebelum biaya dan kapasitas disahkan.',
    '["Semua Premium", "Arah visual terbatas", "Prioritas revisi", "Rencana layanan venue", "Masa aktif 12 bulan"]'::jsonb,
    2000, 8, 12, true, 1, false, false, true, 3, false
  )
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  price_numeric = excluded.price_numeric,
  description = excluded.description,
  features = excluded.features,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.templates (
  id, name, slug, category, description, thumbnail_url, preview_url,
  min_package, is_active, config_json
)
values (
  '20000000-0000-0000-0000-000000000001',
  'Classic Elegant',
  'classic-elegant',
  'standard',
  'Template baseline yang sudah tersedia pada aplikasi.',
  '/sample-wedding.svg',
  '/wedding/sheila-yoga',
  'silver',
  true,
  '{"primaryColor":"#9a6a3a","secondaryColor":"#f7f3ed","fontFamily":"serif","darkMode":false,"sections":["hero","couple","details","gallery","wishes","rsvp"]}'::jsonb
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  thumbnail_url = excluded.thumbnail_url,
  preview_url = excluded.preview_url,
  config_json = excluded.config_json,
  is_active = excluded.is_active,
  updated_at = now();
