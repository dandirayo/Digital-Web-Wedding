import { NextRequest, NextResponse } from "next/server";
import { createReadStream, statSync } from "node:fs";
import { Readable } from "node:stream";
import { CONTENT_TYPES, resolveUploadPath } from "@/lib/backend/uploads.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Melayani file unggahan. Nama file berupa UUID acak; mendukung Range agar video/audio dapat diputar dan digeser.
export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string; file: string }> }) {
    const { eventId, file } = await params;
    const path = resolveUploadPath(eventId, file);
    if (!path)
        return new NextResponse("Not found", { status: 404 });
    const size = statSync(path).size;
    const type = CONTENT_TYPES[file.split(".").pop() as keyof typeof CONTENT_TYPES];
    const headers: Record<string, string> = {
        "Content-Type": type,
        "Accept-Ranges": "bytes",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Security-Policy": "default-src 'none'; sandbox",
    };
    const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") || "");
    if (range && (range[1] || range[2])) {
        let start = range[1] ? Number(range[1]) : size - Number(range[2]);
        let end = range[1] && range[2] ? Number(range[2]) : size - 1;
        start = Math.max(0, start);
        end = Math.min(size - 1, end);
        if (start > end || start >= size)
            return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
        const stream = Readable.toWeb(createReadStream(path, { start, end })) as ReadableStream;
        return new NextResponse(stream, { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) } });
    }
    const stream = Readable.toWeb(createReadStream(path)) as ReadableStream;
    return new NextResponse(stream, { status: 200, headers: { ...headers, "Content-Length": String(size) } });
}
