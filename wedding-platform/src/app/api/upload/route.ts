import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/backend/server";
import { isSameOrigin } from "@/lib/backend/origin";
import { ApiError, COOKIE, eventAccess, requireUser, sessionUser } from "@/lib/backend/database.mjs";
import { MAX_UPLOAD_BYTES, saveUpload } from "@/lib/backend/uploads.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Unggah satu file ke sebuah event. Hanya owner atau klien pemilik event.
export async function POST(request: NextRequest) {
    if (!isSameOrigin(request))
        return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
    try {
        const db = database();
        const user = sessionUser(db, request.cookies.get(COOKIE)?.value);
        requireUser(user);
        const declared = Number(request.headers.get("content-length") || 0);
        if (declared > MAX_UPLOAD_BYTES + 1024 * 1024)
            throw new ApiError("File terlalu besar.", 413);
        const form = await request.formData();
        const eventId = form.get("eventId");
        const file = form.get("file");
        if (typeof eventId !== "string" || !(file instanceof File))
            throw new ApiError("Permintaan tidak valid.");
        eventAccess(db, eventId, user, true);
        const expect = form.get("expect");
        const saved = saveUpload(eventId, Buffer.from(await file.arrayBuffer()), undefined, typeof expect === "string" && ["photo", "audio"].includes(expect) ? expect : "");
        return NextResponse.json({ data: saved }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }
    catch (e) {
        const known = e instanceof ApiError;
        if (!known)
            console.error("Upload failed", e instanceof Error ? e.message : "unknown");
        return NextResponse.json({ error: known ? e.message : "Unggahan gagal." }, { status: known ? e.status : 500 });
    }
}
