import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

if (supabaseUrl.includes("xxxxx") || supabaseUrl.includes("your-project")) {
  console.error("NEXT_PUBLIC_SUPABASE_URL masih placeholder. Ganti dengan Project URL asli dari Supabase.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { error: schemaCheckError } = await supabase.from("profiles").select("id").limit(1);

if (schemaCheckError) {
  console.error("Schema Supabase belum siap:", schemaCheckError.message);
  console.error("Buka Supabase SQL Editor, jalankan isi file src/lib/supabase/schema.sql, lalu ulangi pnpm seed:users.");
  process.exit(1);
}

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

for (const user of users) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      full_name: user.fullName,
      role: user.role,
    },
  });

  if (error && !error.message.toLowerCase().includes("already registered")) {
    console.error(`Failed creating ${user.email}:`, error.message);
    process.exitCode = 1;
    continue;
  }

  let userId = data.user?.id;

  if (!userId) {
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error(`Failed finding ${user.email}:`, listError.message);
      process.exitCode = 1;
      continue;
    }

    userId = listData.users.find((item) => item.email === user.email)?.id;
  }

  if (!userId) {
    console.error(`Could not resolve user id for ${user.email}`);
    process.exitCode = 1;
    continue;
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    full_name: user.fullName,
    role: user.role,
  });

  if (profileError) {
    console.error(`Failed upserting profile for ${user.email}:`, profileError.message);
    process.exitCode = 1;
    continue;
  }

  console.log(`${user.role}: ${user.email} / ${user.password}`);
}
