import type { WeddingEvent } from "@/lib/types";

type ReadinessItem = {
  label: string;
  done: boolean;
};

export function getEventReadiness(event: WeddingEvent) {
  const items: ReadinessItem[] = [
    { label: "Status publish", done: event.status === "active" || event.status === "completed" },
    { label: "Daftar tamu", done: event.guestCount > 0 },
    { label: "RSVP masuk", done: event.rsvpYes + event.rsvpNo > 0 },
    { label: "Ucapan tampil", done: event.wishCount > 0 },
    { label: "Check-in siap", done: event.checkInCount > 0 || event.packageTier !== "silver" },
  ];
  const done = items.filter((item) => item.done).length;
  const score = Math.round((done / items.length) * 100);

  return {
    score,
    items,
    label: score >= 80 ? "Siap dijalankan" : score >= 50 ? "Perlu dilengkapi" : "Masih draft",
  };
}

export function EventReadiness({ event }: { event: WeddingEvent }) {
  const readiness = getEventReadiness(event);

  return (
    <div className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a6a3a]">
            Readiness
          </div>
          <div className="mt-1 text-sm font-semibold">{readiness.label}</div>
        </div>
        <div className="text-2xl font-semibold">{readiness.score}%</div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eadfd2]">
        <div className="h-full rounded-full bg-[#9a6a3a]" style={{ width: `${readiness.score}%` }} />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {readiness.items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs text-[#6b6056]">
            <span
              className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold ${
                item.done ? "bg-emerald-50 text-emerald-700" : "bg-white text-[#9a6a3a]"
              }`}
            >
              {item.done ? "OK" : "-"}
            </span>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
