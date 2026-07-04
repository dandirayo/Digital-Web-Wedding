"use client";

import { ChangeEvent, useMemo, useState } from "react";
import * as XLSX from "xlsx";

type GuestPreview = {
  name: string;
  phone: string;
  paxLimit: number;
};

function normalizeGuest(row: Record<string, unknown>): GuestPreview | null {
  const rawName = row.nama ?? row.Nama ?? row.name ?? row.Name;
  const rawPhone = row.telepon ?? row.Telepon ?? row.phone ?? row.Phone ?? row.whatsapp ?? row.Whatsapp;
  const rawPax = row.pax ?? row.PAX ?? row.pax_limit ?? row["PAX Limit"];

  const name = String(rawName ?? "").trim();
  if (!name) return null;

  const phone = String(rawPhone ?? "").trim();
  const paxLimit = Number(rawPax ?? 1);

  return {
    name,
    phone,
    paxLimit: Number.isFinite(paxLimit) && paxLimit > 0 ? paxLimit : 1,
  };
}

export function GuestExcelUpload() {
  const [fileName, setFileName] = useState("");
  const [guests, setGuests] = useState<GuestPreview[]>([]);
  const [error, setError] = useState("");

  const totalPax = useMemo(
    () => guests.reduce((sum, guest) => sum + guest.paxLimit, 0),
    [guests],
  );

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError("");
    setGuests([]);

    if (!file) return;

    try {
      setFileName(file.name);
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
        defval: "",
      });
      const parsed = rows.map(normalizeGuest).filter((guest): guest is GuestPreview => Boolean(guest));

      if (parsed.length === 0) {
        throw new Error("File terbaca, tapi tidak ada kolom nama yang valid.");
      }

      setGuests(parsed);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Gagal membaca file Excel.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="rounded-md border border-[#e0d4c7] bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Upload Excel Tamu</h2>
          <p className="mt-1 text-sm leading-6 text-[#6b6056]">
            Format kolom yang didukung: `nama`, `telepon`, dan `pax`. Setelah backend tamu aktif,
            preview ini bisa langsung disimpan ke database.
          </p>
        </div>

        <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white transition hover:bg-[#3a3129]">
          Pilih Excel
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>
      </div>

      {fileName ? (
        <div className="mt-4 rounded-md bg-[#f7f3ed] px-4 py-3 text-sm text-[#6b6056]">
          File: <span className="font-semibold text-[#241f1a]">{fileName}</span>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {guests.length > 0 ? (
        <div className="mt-5">
          <div className="mb-3 grid gap-3 md:grid-cols-3">
            <MiniSummary label="Tamu terbaca" value={String(guests.length)} />
            <MiniSummary label="Total PAX" value={String(totalPax)} />
            <MiniSummary label="Status" value="Preview" />
          </div>

          <div className="max-h-72 overflow-auto rounded-md border border-[#eadfd2]">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#f7f3ed] text-[#756a60]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold">Telepon</th>
                  <th className="px-4 py-3 font-semibold">PAX</th>
                </tr>
              </thead>
              <tbody>
                {guests.slice(0, 20).map((guest, index) => (
                  <tr key={`${guest.name}-${index}`} className="border-t border-[#eadfd2]">
                    <td className="px-4 py-3 font-medium">{guest.name}</td>
                    <td className="px-4 py-3 text-[#6b6056]">{guest.phone || "-"}</td>
                    <td className="px-4 py-3 text-[#6b6056]">{guest.paxLimit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {guests.length > 20 ? (
            <p className="mt-3 text-sm text-[#6b6056]">
              Menampilkan 20 baris pertama dari {guests.length} tamu.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MiniSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a6a3a]">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
