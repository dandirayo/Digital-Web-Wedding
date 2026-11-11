import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/backend/server";
import { publicSite } from "@/lib/backend/database.mjs";
import { allowedOrigin, corsHeaders } from "@/lib/backend/cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Data publik untuk website statis: pengaturan situs, paket, dan template aktif.
export async function OPTIONS(request: NextRequest) {
    const origin = allowedOrigin(request);
    return origin ? new NextResponse(null, { status: 204, headers: corsHeaders(origin, "GET, OPTIONS") }) : new NextResponse(null, { status: 403 });
}

export async function GET(request: NextRequest) {
    const origin = allowedOrigin(request);
    if (!origin)
        return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
    try {
        return NextResponse.json({ data: publicSite(database()) }, { headers: corsHeaders(origin, "GET, OPTIONS") });
    }
    catch (e) {
        console.error("Public site request failed", e instanceof Error ? e.message : "unknown");
        return NextResponse.json({ error: "Permintaan gagal." }, { status: 500, headers: corsHeaders(origin, "GET, OPTIONS") });
    }
}
