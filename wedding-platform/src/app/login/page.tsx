import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#f7f3ed] text-[#241f1a] lg:grid-cols-[0.92fr_1.08fr]">
      <section className="hidden border-r border-[#e0d4c7] bg-[#fffaf4] p-8 lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-[#241f1a] text-sm font-semibold text-white">
            O
          </span>
          <span className="text-2xl font-semibold">Occasio</span>
        </Link>

        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.26em] text-[#9a6a3a]">
            Secure workspace
          </div>
          <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight tracking-tight">
            Satu pintu masuk untuk client dan owner.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#6b6056]">
            Setelah Supabase aktif, client hanya masuk ke dashboard event miliknya,
            sedangkan owner masuk ke dashboard monitoring semua event.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {["Auth", "Roles", "RLS"].map((item) => (
            <div key={item} className="rounded-md border border-[#e0d4c7] bg-white p-4">
              <div className="text-sm font-semibold text-[#9a6a3a]">{item}</div>
              <div className="mt-1 text-xs text-[#756a60]">Supabase ready</div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-xl">
          <div className="lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-[#241f1a] text-sm font-semibold text-white">
                O
              </span>
              <span className="text-2xl font-semibold">Occasio</span>
            </Link>
          </div>

          <div className="mt-8 lg:mt-0">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9a6a3a]">
              Login
            </div>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Masuk ke workspace.</h2>
            <p className="mt-3 text-sm leading-6 text-[#6b6056]">
              Tidak ada preview dashboard di mode ini. Dashboard hanya bisa dibuka
              setelah akun Supabase berhasil login dan role terbaca.
            </p>
          </div>

          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
