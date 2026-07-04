import Link from "next/link";

const roles = [
  {
    title: "Client",
    description: "Untuk pasangan yang ingin mengelola konten undangan, tamu, RSVP, QR, dan ucapan.",
    href: "/client/dashboard",
    email: "client@occasio.app",
  },
  {
    title: "Owner",
    description: "Untuk pemilik Occasio/studio yang memantau semua event dan progres klien.",
    href: "/owner/dashboard",
    email: "owner@occasio.app",
  },
];

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
            Login ini masih demo frontend. Struktur UI-nya sudah disiapkan untuk
            email/password Supabase Auth, role redirect, dan session management.
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
        <div className="w-full max-w-3xl">
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
              Login demo
            </div>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Pilih workspace.</h2>
            <p className="mt-3 text-sm leading-6 text-[#6b6056]">
              Klik salah satu tombol masuk untuk membuka dashboard sesuai role. Nanti
              setelah backend aktif, form ini akan memvalidasi user dari Supabase.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {roles.map((role) => (
              <article key={role.title} className="rounded-md border border-[#e0d4c7] bg-white p-6 shadow-[0_18px_48px_rgba(82,57,38,0.08)]">
                <div className="inline-flex rounded-full bg-[#efe5d8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#9a6a3a]">
                  {role.title}
                </div>
                <h3 className="mt-5 text-2xl font-semibold">{role.title} Dashboard</h3>
                <p className="mt-3 min-h-16 text-sm leading-6 text-[#6b6056]">{role.description}</p>

                <div className="mt-6 space-y-3">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#756a60]">Email</span>
                    <input
                      className="mt-2 h-11 w-full rounded-md border border-[#e0d4c7] bg-[#fffaf4] px-3 text-sm outline-none transition focus:border-[#9a6a3a]"
                      defaultValue={role.email}
                      readOnly
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#756a60]">Password</span>
                    <input
                      className="mt-2 h-11 w-full rounded-md border border-[#e0d4c7] bg-[#fffaf4] px-3 text-sm outline-none transition focus:border-[#9a6a3a]"
                      defaultValue="demo-password"
                      type="password"
                      readOnly
                    />
                  </label>
                </div>

                <Link
                  href={role.href}
                  className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white transition hover:bg-[#3a3129]"
                >
                  Masuk sebagai {role.title}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
