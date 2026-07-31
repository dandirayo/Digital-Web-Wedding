import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const users = [
  {
    email: "owner@occasio.app",
    password: "OccasioOwner123!",
    fullName: "Owner Occasio",
    role: "owner",
  },
  {
    email: "client@occasio.app",
    password: "OccasioClient123!",
    fullName: "Client Demo",
    role: "client",
  },
];

async function ensureUser(user) {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      full_name: user.fullName,
      role: user.role,
    },
  });

  const exists =
    createError?.message.toLowerCase().includes("already registered") ||
    createError?.message.toLowerCase().includes("already been registered") ||
    createError?.message.toLowerCase().includes("already exists");

  if (createError && !exists) throw createError;

  let userId = created.user?.id;
  if (!userId) {
    const { data: listed, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    userId = listed.users.find((item) => item.email === user.email)?.id;
  }

  if (!userId) throw new Error(`Could not resolve user id for ${user.email}`);

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    password: user.password,
    email_confirm: true,
    user_metadata: {
      full_name: user.fullName,
      role: user.role,
    },
  });
  if (updateError) throw updateError;

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    full_name: user.fullName,
    role: user.role,
  });
  if (profileError) throw profileError;

  return userId;
}

async function main() {
  const { error: schemaCheckError } = await supabase.from("profiles").select("id").limit(1);
  if (schemaCheckError) {
    console.error("Schema Supabase belum siap:", schemaCheckError.message);
    console.error("Jalankan isi src/lib/supabase/schema.sql di Supabase SQL Editor, lalu ulangi command ini.");
    process.exit(1);
  }

  const ownerId = await ensureUser(users[0]);
  const clientId = await ensureUser(users[1]);

  const { data: eventRow, error: eventError } = await supabase
    .from("events")
    .upsert(
      {
        owner_id: ownerId,
        client_id: clientId,
        slug: "sheila-yoga",
        couple_name: "Sheila & Yoga",
        package_name: "Premium Digital",
        event_date: "2026-12-27",
        venue: "Grand Ballroom Jakarta",
        status: "active",
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();

  if (eventError) throw eventError;

  await supabase.from("guests").delete().eq("event_id", eventRow.id);
  await supabase.from("wishes").delete().eq("event_id", eventRow.id);

  const { error: guestError } = await supabase.from("guests").insert([
    {
      event_id: eventRow.id,
      name: "Reza Pramudita",
      phone: "081234567890",
      pax_limit: 2,
      rsvp_status: "attending",
      pax_confirmed: 2,
      qr_code: "SA-REZA-8K2",
    },
    {
      event_id: eventRow.id,
      name: "Dewi Lestari",
      phone: "081234567891",
      pax_limit: 1,
      rsvp_status: "pending",
      pax_confirmed: 0,
      qr_code: "SA-DEWI-9LA",
    },
    {
      event_id: eventRow.id,
      name: "Bagas Putra",
      phone: "081234567892",
      pax_limit: 1,
      rsvp_status: "declined",
      pax_confirmed: 0,
      qr_code: "SA-BAGAS-1QP",
    },
  ]);

  if (guestError) throw guestError;

  const { error: wishError } = await supabase.from("wishes").insert([
    {
      event_id: eventRow.id,
      guest_name: "Reza",
      message: "Semoga lancar sampai hari H dan menjadi keluarga sakinah.",
    },
    {
      event_id: eventRow.id,
      guest_name: "Maya",
      message: "Happy wedding Sheila & Yoga. Bahagia selalu!",
    },
    {
      event_id: eventRow.id,
      guest_name: "Dewi",
      message: "Doa terbaik untuk kalian berdua.",
    },
  ]);

  if (wishError) throw wishError;

  console.log("Demo backend data ready:");
  console.log("- owner@occasio.app");
  console.log("- client@occasio.app");
  console.log("- event /wedding/sheila-yoga");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
