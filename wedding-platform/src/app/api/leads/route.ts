import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/backend/server";
import { ApiError, createLead } from "@/lib/backend/database.mjs";
import { allowedOrigin, corsHeaders, publicOrigins } from "@/lib/backend/cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = (origin: string) => corsHeaders(origin, "POST, OPTIONS");

// Pembatas sederhana per alamat: 5 brief per 10 menit (memori proses, cukup untuk satu server).
const hits = new Map<string, number[]>();
function limited(key: string) {
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => now - t < 600000);
    if (recent.length >= 5) {
        hits.set(key, recent);
        return true;
    }
    hits.set(key, [...recent, now]);
    return false;
}

export async function OPTIONS(request: NextRequest) {
    const origin = allowedOrigin(request);
    return origin ? new NextResponse(null, { status: 204, headers: headers(origin) }) : new NextResponse(null, { status: 403 });
}

export async function POST(request: NextRequest) {
    const origin = allowedOrigin(request);
    if (!origin)
        return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
    try {
        const raw = await request.text();
        if (Buffer.byteLength(raw) > 20000)
            throw new ApiError("Data terlalu besar.", 413);
        const input = JSON.parse(raw);
        // Kolom jebakan untuk bot: manusia tidak melihat dan tidak mengisinya.
        if (input && typeof input === "object" && input.website)
            return NextResponse.json({ data: { received: true } }, { headers: headers(origin) });
        if (limited(request.headers.get("x-forwarded-for") || origin))
            throw new ApiError("Terlalu banyak kiriman. Coba lagi beberapa menit lagi.", 429);
        const lead = createLead(database(), input, publicOrigins().includes(origin) ? "Website Occasio" : "Management Occasio");
        return NextResponse.json({ data: { received: true, id: lead.id } }, { status: 201, headers: headers(origin) });
    }
    catch (e) {
        const known = e instanceof ApiError;
        if (!known && !(e instanceof SyntaxError))
            console.error("Lead request failed", e instanceof Error ? e.message : "unknown");
        return NextResponse.json({ error: known ? e.message : "Permintaan tidak valid." }, { status: known ? e.status : 400, headers: headers(origin) });
    }
}
