import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

function readLocalEnvironment() {
  const output = execSync("supabase status -o env", {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const values = Object.fromEntries(
    output
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Z_]+)="(.*)"$/))
      .filter(Boolean)
      .map((match) => [match[1], match[2]]),
  );

  if (!values.API_URL || !values.SERVICE_ROLE_KEY) {
    throw new Error("Supabase lokal belum siap. Jalankan `supabase start` terlebih dahulu.");
  }
  if (!/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(values.API_URL)) {
    throw new Error("Seed dibatalkan: target bukan Supabase lokal.");
  }
  return values;
}

const local = readLocalEnvironment();
const supabase = createClient(local.API_URL, local.SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const accounts = [
  { email: "owner@occasio.local", password: "OccasioOwner123!", fullName: "Owner Occasio", role: "owner" },
  { email: "client@occasio.local", password: "OccasioClient123!", fullName: "Client Demo", role: "client" },
];

async function ensureAccount(account) {
  const created = await supabase.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    app_metadata: { role: account.role, full_name: account.fullName },
    user_metadata: { full_name: account.fullName },
  });
  const alreadyExists = created.error?.message.toLowerCase().includes("already");
  if (created.error && !alreadyExists) throw created.error;

  let user = created.data.user;
  if (!user) {
    const listed = await supabase.auth.admin.listUsers();
    if (listed.error) throw listed.error;
    user = listed.data.users.find((candidate) => candidate.email === account.email);
  }
  if (!user) throw new Error(`Akun ${account.email} tidak ditemukan.`);

  const updated = await supabase.auth.admin.updateUserById(user.id, {
    password: account.password,
    email_confirm: true,
    app_metadata: { role: account.role, full_name: account.fullName },
    user_metadata: { full_name: account.fullName },
  });
  if (updated.error) throw updated.error;

  const profile = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: account.fullName,
    email: account.email,
    role: account.role,
  });
  if (profile.error) throw profile.error;
  return user.id;
}

async function main() {
  const ownerId = await ensureAccount(accounts[0]);
  const clientId = await ensureAccount(accounts[1]);

  const packageResult = await supabase.from("packages").select("id").eq("slug", "silver").single();
  if (packageResult.error) throw packageResult.error;
  const templateResult = await supabase.from("templates").select("id").eq("slug", "classic-elegant").single();
  if (templateResult.error) throw templateResult.error;

  const eventResult = await supabase
    .from("events")
    .upsert(
      {
        owner_id: ownerId,
        client_id: clientId,
        slug: "sheila-yoga",
        couple_name: "Sheila & Yoga",
        template_id: templateResult.data.id,
        package_id: packageResult.data.id,
        package_tier: "silver",
        event_date: "2026-12-27T10:00:00+07:00",
        venue: "Grand Ballroom Jakarta",
        status: "draft",
        is_published: false,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (eventResult.error) throw eventResult.error;
  const eventId = eventResult.data.id;

  const contentResult = await supabase.from("event_content").upsert(
    {
      event_id: eventId,
      greeting: "Dengan penuh sukacita kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu.",
      bride_name: "Sheila",
      groom_name: "Yoga",
      akad_venue: "Grand Ballroom Jakarta",
      resepsi_venue: "Grand Ballroom Jakarta",
    },
    { onConflict: "event_id" },
  );
  if (contentResult.error) throw contentResult.error;

  const deleteGuests = await supabase.from("guests").delete().eq("event_id", eventId);
  if (deleteGuests.error) throw deleteGuests.error;
  const deleteWishes = await supabase.from("wishes").delete().eq("event_id", eventId);
  if (deleteWishes.error) throw deleteWishes.error;

  const guestResult = await supabase.from("guests").insert([
    { event_id: eventId, name: "Reza Pramudita", phone: "081234567890", pax_limit: 2, rsvp_status: "attending", pax_confirmed: 2, qr_code: "SY-REZA-8K2" },
    { event_id: eventId, name: "Dewi Lestari", phone: "081234567891", pax_limit: 1, rsvp_status: "pending", pax_confirmed: 0, qr_code: "SY-DEWI-9LA" },
    { event_id: eventId, name: "Bagas Putra", phone: "081234567892", pax_limit: 1, rsvp_status: "declined", pax_confirmed: 0, qr_code: "SY-BAGAS-1QP" },
  ]);
  if (guestResult.error) throw guestResult.error;

  const wishResult = await supabase.from("wishes").insert([
    { event_id: eventId, guest_name: "Reza", message: "Semoga lancar sampai hari H dan menjadi keluarga sakinah.", is_visible: true },
    { event_id: eventId, guest_name: "Dewi", message: "Doa terbaik untuk kalian berdua.", is_visible: true },
  ]);
  if (wishResult.error) throw wishResult.error;

  console.log("Fixture lokal Occasio siap.");
  console.log("Owner : owner@occasio.local / OccasioOwner123!");
  console.log("Client: client@occasio.local / OccasioClient123!");
  console.log("Event : Sheila & Yoga (draft)");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
