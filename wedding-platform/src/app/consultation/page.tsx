import Link from "next/link";
import { ConsultationForm } from "@/components/consultation-form";

export default async function ConsultationPage({ searchParams }: { searchParams?: Promise<{ template?: string }> }) {
  const params = await searchParams;
  return (
    <main className="min-h-screen bg-[#f7f3ed] text-[#241f1a]">
      <header className="border-b border-[#e4d8ca] bg-[#fffaf4]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[#241f1a] text-sm font-semibold text-white">O</span>
            <span className="text-xl font-semibold">Occasio</span>
          </Link>
          <Link href="/login" className="text-sm font-semibold text-[#5a4028]">Masuk Workspace</Link>
        </div>
      </header>
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[0.7fr_1.3fr] lg:px-8 lg:py-14">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9a6a3a]">Intake konsultasi</div>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight">Mulai order dari brief yang jelas.</h1>
          <p className="mt-4 text-sm leading-7 text-[#6b6056]">Data ini menjadi titik awal tim Occasio untuk memeriksa kebutuhan, mengonfirmasi paket, lalu membuat workspace undangan Anda.</p>
          <ol className="mt-7 space-y-3 text-sm text-[#5d5146]">
            {['Brief masuk ke inbox owner', 'Tim menghubungi dan mengonfirmasi DP', 'Workspace klien dibuat', 'Konten direview lalu dipublish'].map((item, index) => (
              <li key={item} className="flex gap-3 rounded-md border border-[#e0d4c7] bg-[#fffaf4] p-3"><span className="font-semibold text-[#9a6a3a]">0{index + 1}</span><span>{item}</span></li>
            ))}
          </ol>
        </div>
        <ConsultationForm initialTemplate={params?.template || ""} />
      </section>
    </main>
  );
}
