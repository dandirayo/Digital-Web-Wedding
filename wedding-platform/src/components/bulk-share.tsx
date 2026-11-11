"use client";

import { useState } from "react";
import { WorkspaceDialog } from "./workspace-dialog";
import type { Guest, WeddingEvent } from "@/lib/types";

type BulkShareProps = {
  event: WeddingEvent;
  guests: Guest[];
  messageTemplate: string;
  onShared?: (guestIds: string[]) => void;
};

export function BulkShare({ event, guests, messageTemplate, onShared }: BulkShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const getGuestLink = (guest: Guest) => {
    return `${window.location.origin}/wedding/${event.slug}?g=${guest.qrCode}`;
  };

  const getWhatsappLink = (guest: Guest) => {
    const formattedDate = event.eventDate
      ? new Date(event.eventDate).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";
    
    const message = messageTemplate
      .replace(/\$\{guest\.name\}/g, guest.name)
      .replace(/\$\{event\.coupleName\}/g, event.coupleName)
      .replace(/\$\{formattedDate\}/g, formattedDate)
      .replace(/\$\{event\.venue\}/g, event.venue)
      .replace(/\$\{invitationLink\}/g, getGuestLink(guest));
      
    return `https://wa.me/${guest.phone}?text=${encodeURIComponent(message)}`;
  };

  const toggleAll = () => {
    if (selectedIds.size === guests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(guests.map((g) => g.id)));
    }
  };

  const toggleGuest = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectedGuests = guests.filter((g) => selectedIds.has(g.id));

  const handleCopyAll = async () => {
    const text = selectedGuests
      .map((g) => `${g.name}: ${getGuestLink(g)}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
    alert("Links copied to clipboard!");
  };

  const handleExportCSV = () => {
    const headers = "Nama,Phone,Link\n";
    const rows = selectedGuests
      .map((g) => `${g.name},${g.phone || ""},${getGuestLink(g)}`)
      .join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guests_${event.slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleSendWA = async () => {
    if (selectedGuests.length === 0) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    const sharedIds: string[] = [];

    for (let i = 0; i < selectedGuests.length; i++) {
      const guest = selectedGuests[i];
      if (guest.phone) {
        window.open(getWhatsappLink(guest), "_blank");
        sharedIds.push(guest.id);
      }
      setProgress(((i + 1) / selectedGuests.length) * 100);
      
      if (i < selectedGuests.length - 1) {
        await delay(1500);
      }
    }

    if (onShared && sharedIds.length > 0) {
      onShared(sharedIds);
    }
    
    setIsProcessing(false);
    setProgress(0);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 items-center justify-center rounded-md border border-[#e0d4c7] bg-white px-4 text-sm font-semibold text-[#241f1a] transition hover:bg-[#fffaf4]"
      >
        📋 Bagikan Banyak
      </button>
    <WorkspaceDialog open={isOpen} onClose={() => setIsOpen(false)} closeDisabled={isProcessing} title="Bagikan link undangan">
        <div className="grid gap-2 sm:grid-cols-3">
          <button
            onClick={handleCopyAll}
            disabled={selectedIds.size === 0 || isProcessing}
            className="flex-1 rounded-md bg-[#f7f3ed] py-2 text-sm font-semibold text-[#241f1a] disabled:opacity-50"
          >
            📋 Copy Semua Link
          </button>
          <button
            onClick={handleExportCSV}
            disabled={selectedIds.size === 0 || isProcessing}
            className="flex-1 rounded-md bg-[#f7f3ed] py-2 text-sm font-semibold text-[#241f1a] disabled:opacity-50"
          >
            📊 Export CSV
          </button>
          <button
            onClick={handleSendWA}
            disabled={selectedIds.size === 0 || isProcessing}
            className="flex-1 rounded-md bg-[#241f1a] py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            📱 Kirim via WA
          </button>
        </div>

        {isProcessing && (
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#f7f3ed]">
            <div
              className="h-full bg-[#9a6a3a] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="mt-4 max-h-96 overflow-auto rounded-md border border-[#e0d4c7]">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="sticky top-0 bg-[#f7f3ed]">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua tamu"
                    checked={guests.length > 0 && selectedIds.size === guests.length}
                    onChange={toggleAll}
                    disabled={isProcessing}
                  />
                </th>
                <th className="px-4 py-3 font-semibold text-[#756a60]">Nama</th>
                <th className="px-4 py-3 font-semibold text-[#756a60]">No. HP</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => (
                <tr key={guest.id} className="border-t border-[#eadfd2]">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Pilih ${guest.name}`}
                      checked={selectedIds.has(guest.id)}
                      onChange={() => toggleGuest(guest.id)}
                      disabled={isProcessing}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-[#241f1a]">{guest.name}</td>
                  <td className="px-4 py-3 text-[#6b6056]">{guest.phone || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </WorkspaceDialog>
    </>
  );
}
