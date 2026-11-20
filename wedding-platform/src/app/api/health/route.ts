import { NextResponse } from "next/server";
import { database } from "@/lib/backend/server";
import { uploadDir } from "@/lib/backend/uploads.mjs";
import { accessSync, constants, existsSync } from "node:fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pemeriksaan kesehatan untuk pemantau uptime dan reverse proxy. Tidak membuka data apa pun:
// hanya status database dan folder unggahan.
export async function GET() {
    const checks = { database: false, uploads: false };
    try {
        database().prepare("SELECT 1").get();
        checks.database = true;
    }
    catch {
        checks.database = false;
    }
    try {
        // Folder dibuat saat unggahan pertama; belum ada bukan berarti rusak, tetapi kalau ada harus bisa ditulis.
        if (existsSync(uploadDir()))
            accessSync(uploadDir(), constants.W_OK);
        checks.uploads = true;
    }
    catch {
        checks.uploads = false;
    }
    const ok = checks.database && checks.uploads;
    return NextResponse.json({ ok, checks, time: new Date().toISOString() }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
