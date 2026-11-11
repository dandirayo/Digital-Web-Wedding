import type { NextRequest } from "next/server";

// Website publik (port berbeda) boleh memanggil endpoint publik tertentu.
// Origin yang diizinkan dapat diubah lewat OCCASIO_PUBLIC_ORIGINS (dipisah koma).
export const publicOrigins = () =>
    (process.env.OCCASIO_PUBLIC_ORIGINS || "http://127.0.0.1:4174,http://localhost:4174").split(",").map((o) => o.trim()).filter(Boolean);

export function allowedOrigin(request: NextRequest): string | null {
    const origin = request.headers.get("origin");
    if (!origin)
        return null;
    try {
        const host = new URL(origin).host;
        return publicOrigins().includes(origin) || host === request.headers.get("host") ? origin : null;
    }
    catch {
        return null;
    }
}

export const corsHeaders = (origin: string, methods: string) => ({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Cache-Control": "no-store",
});
