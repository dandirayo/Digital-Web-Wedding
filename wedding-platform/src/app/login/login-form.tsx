"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type LoginStatus = "idle" | "loading" | "error";

function getLoginErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Login gagal. Coba lagi.";

  if (
    message.includes("NEXT_PUBLIC_SUPABASE_URL") ||
    message.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  ) {
    return "Supabase belum dikonfigurasi. Buat file .env.local, isi URL dan anon key dari Supabase, jalankan schema.sql, lalu jalankan pnpm seed:users.";
  }

  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Email atau password belum cocok. Pastikan user sudah dibuat di Supabase Auth dan password benar.";
  }

  if (message.toLowerCase().includes("profiles")) {
    return "Login berhasil, tapi role belum ditemukan. Pastikan row profiles untuk user ini sudah dibuat.";
  }

  return message;
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("client@occasio.app");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) throw new Error("User tidak ditemukan setelah login.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      if (profile?.role === "owner") {
        router.push("/owner/dashboard");
        return;
      }

      router.push("/client/dashboard");
    } catch (error) {
      setStatus("error");
      setMessage(getLoginErrorMessage(error));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-[#e0d4c7] bg-white p-6 shadow-[0_18px_48px_rgba(82,57,38,0.08)]">
      <div className="inline-flex rounded-full bg-[#efe5d8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#9a6a3a]">
        Supabase Auth
      </div>

      <h3 className="mt-5 text-2xl font-semibold">Login akun Occasio</h3>
      <p className="mt-3 text-sm leading-6 text-[#6b6056]">
        Masukkan email dan password client atau owner. Role akan dibaca dari table
        `profiles`, lalu user diarahkan ke dashboard yang sesuai.
      </p>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#756a60]">Email</span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-[#e0d4c7] bg-[#fffaf4] px-3 text-sm outline-none transition focus:border-[#9a6a3a]"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#756a60]">Password</span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-[#e0d4c7] bg-[#fffaf4] px-3 text-sm outline-none transition focus:border-[#9a6a3a]"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="Isi password akun Supabase"
            required
          />
        </label>
      </div>

      {message ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white transition hover:bg-[#3a3129] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Memproses..." : "Login"}
      </button>
    </form>
  );
}
