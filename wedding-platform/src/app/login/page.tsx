import Link from "next/link";
import { Database, ShieldCheck, Workflow } from "lucide-react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#f5f1eb] text-[#241f1a] lg:grid-cols-[0.94fr_1.06fr]">
      <section className="relative hidden overflow-hidden bg-[#1f1b18] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#c99b66]/15 blur-3xl" />
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#c99b66] text-sm font-bold text-[#241f1a]">
            O
          </span>
          <span className="text-2xl font-semibold">Occasio</span>
        </Link>

        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.26em] text-[#d5aa78]">
            Wedding operations
          </div>
          <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight tracking-tight">
            Satu pintu masuk untuk client dan owner.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/60">
            Satu ruang kerja untuk mengelola brief, undangan, tamu, RSVP, sampai operasional hari acara.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[{ label: "Auth", icon: ShieldCheck }, { label: "Database", icon: Database }, { label: "Workflow", icon: Workflow }].map(({ label, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <Icon className="h-5 w-5 text-[#d5aa78]" />
              <div className="mt-3 text-sm font-semibold">{label}</div>
              <div className="mt-1 text-xs text-white/45">Workspace terpadu</div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14 lg:py-16">
        <div className="w-full max-w-xl">
          <div className="lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#241f1a] text-sm font-semibold text-white">
                O
              </span>
              <span className="text-2xl font-semibold">Occasio</span>
            </Link>
          </div>

          <div className="mt-8 lg:mt-0">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9a6a3a]">
              Login
            </div>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Selamat datang kembali.</h2>
            <p className="mt-3 text-sm leading-6 text-[#6b6056]">
              Masuk sebagai owner atau client. Akses akan diarahkan otomatis berdasarkan akun Anda.
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
