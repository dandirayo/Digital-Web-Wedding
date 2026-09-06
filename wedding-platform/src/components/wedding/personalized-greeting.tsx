"use client";

import { Guest } from "@/lib/types";

export function PersonalizedGreeting({
  guestName,
  guestData,
  greeting,
}: {
  guestName?: string;
  guestData?: Guest | null;
  greeting: string;
}) {
  return (
    <div className="flex flex-col items-center text-center space-y-3">
      {guestName && (
        <div className="mb-2">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Kepada Yth.</p>
          <h2 className="text-2xl sm:text-3xl font-serif mt-2 capitalize">{guestName}</h2>
        </div>
      )}
      
      {guestData && (
        <div className="flex flex-wrap justify-center gap-2 mb-2">
          {guestData.rsvpStatus === 'attending' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/90 border border-white/20">
              Anda sudah RSVP ✓
            </span>
          )}
          {guestData.checkedInAt && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#9a6a3a]/20 text-[#e0d4c7] border border-[#9a6a3a]/40">
              Sudah Check-in ✓
            </span>
          )}
        </div>
      )}

      <p className="mx-auto max-w-2xl text-sm font-medium leading-7 text-white/88 sm:text-base sm:leading-8">
        {greeting}
      </p>
    </div>
  );
}
