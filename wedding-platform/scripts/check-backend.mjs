import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function printStatus(label, ok, detail = "") {
  console.log(`${ok ? "OK" : "FAIL"} ${label}${detail ? ` - ${detail}` : ""}`);
}

printStatus("NEXT_PUBLIC_SUPABASE_URL", Boolean(supabaseUrl));
printStatus("NEXT_PUBLIC_SUPABASE_ANON_KEY", Boolean(anonKey));
printStatus("SUPABASE_SERVICE_ROLE_KEY", Boolean(serviceRoleKey));

if (!supabaseUrl || !anonKey) {
  process.exit(1);
}

try {
  const host = new URL(supabaseUrl).host;
  const dns = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: anonKey,
    },
  });
  printStatus("Supabase REST reachable", true, `${host} returned ${dns.status}`);
} catch (error) {
  printStatus("Supabase REST reachable", false, error.cause?.code || error.message);
  process.exit(1);
}

if (!serviceRoleKey) process.exit(0);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { error: profilesError } = await supabase.from("profiles").select("id").limit(1);
printStatus("profiles table", !profilesError, profilesError?.message);

const { error: eventsError } = await supabase.from("events").select("id").limit(1);
printStatus("events table", !eventsError, eventsError?.message);

const { error: guestsError } = await supabase.from("guests").select("id").limit(1);
printStatus("guests table", !guestsError, guestsError?.message);

const { error: wishesError } = await supabase.from("wishes").select("id").limit(1);
printStatus("wishes table", !wishesError, wishesError?.message);

if (profilesError || eventsError || guestsError || wishesError) {
  process.exit(1);
}
