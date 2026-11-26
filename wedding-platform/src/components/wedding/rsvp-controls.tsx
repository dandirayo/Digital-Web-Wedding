"use client";

// Kontrol RSVP bersama untuk tema undangan: pilihan jumlah hadir dan pesan status inline
// (pengganti window.alert yang memutus pengalaman tamu).

export type Notice = { text: string; tone: "error" | "success" } | null;

export function InlineNotice({ notice, className = "" }: { notice: Notice; className?: string }) {
  if (!notice) return null;
  return (
    <p
      role={notice.tone === "error" ? "alert" : "status"}
      className={`anim-fade-up mt-3 rounded-md px-3 py-2 text-sm font-medium ${notice.tone === "error" ? "bg-rose-500/15 text-rose-500" : "bg-emerald-500/15 text-emerald-600"} ${className}`}
    >
      {notice.text}
    </p>
  );
}

/** Pilihan 1..max orang. Tidak tampil bila undangan hanya untuk satu orang. */
export function PaxSelect({ max, value, onChange, className = "", label = "Jumlah yang hadir" }: { max: number; value: number; onChange: (value: number) => void; className?: string; label?: string }) {
  if (!Number.isInteger(max) || max <= 1) return null;
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider opacity-70">{label}</span>
      <select value={value} onChange={(event) => onChange(Number(event.target.value))} className={className}>
        {Array.from({ length: max }, (_, index) => index + 1).map((count) => (
          <option key={count} value={count}>{count} orang</option>
        ))}
      </select>
    </label>
  );
}
