"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, Server } from "lucide-react";
import { signInWithPassword } from "@/lib/auth";

type LoginStatus = "idle" | "loading" | "error";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@occasio.local");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const session = await signInWithPassword(normalizedEmail, password);
      
      router.replace(session.role === "owner" ? "/owner/dashboard" : "/client/dashboard");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Login gagal. Coba lagi.");
      return;
    } finally {
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[#e0d4c7] bg-white p-6 shadow-[0_24px_70px_rgba(82,57,38,0.10)] sm:p-7">
      <div className="inline-flex items-center gap-2 rounded-full bg-[#efe5d8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#7b552f]">
        <Server className="h-3.5 w-3.5" /> Supabase Auth
      </div>

      <h3 className="mt-5 text-2xl font-semibold">Login akun Occasio</h3>
      <p className="mt-3 text-sm leading-6 text-[#6b6056]">
        Masuk menggunakan akun yang dibuat atau diundang oleh owner Occasio.
        Password diverifikasi oleh Supabase Auth.
      </p>

      {process.env.NODE_ENV === "development" ? (
      <div className="mt-5 grid gap-2 text-sm md:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            setEmail("owner@occasio.local");
            setPassword("OccasioOwner123!");
            setMessage("");
          }}
          className="rounded-md border border-[#e0d4c7] bg-[#fffaf4] px-3 py-2 text-left font-semibold text-[#5a4028] transition hover:bg-[#efe5d8]"
        >
          Pakai Owner
        </button>
        <button
          type="button"
          onClick={() => {
            setEmail("client@occasio.local");
            setPassword("OccasioClient123!");
            setMessage("");
          }}
          className="rounded-md border border-[#e0d4c7] bg-[#fffaf4] px-3 py-2 text-left font-semibold text-[#5a4028] transition hover:bg-[#efe5d8]"
        >
          Pakai Client
        </button>
      </div>
      ) : null}

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#756a60]">Email</span>
          <input
            className="mt-2 h-12 w-full rounded-xl border border-[#e0d4c7] bg-[#fffaf4] px-4 text-sm outline-none transition focus:border-[#9a6a3a]"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#756a60]">Password</span>
          <span className="relative mt-2 block">
            <input className="h-12 w-full rounded-xl border border-[#e0d4c7] bg-[#fffaf4] px-4 pr-12 text-sm outline-none transition focus:border-[#9a6a3a]" value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Masukkan password" required />
            <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-[#756a60]" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
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
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#241f1a] px-4 text-sm font-semibold text-white transition hover:bg-[#3a3129] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Memproses..." : <>Masuk ke workspace <ArrowRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
}
