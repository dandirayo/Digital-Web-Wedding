import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/backend/server";
import { isSameOrigin } from "@/lib/backend/origin";
import { authenticate, sessionUser, logout, COOKIE, ApiError } from "@/lib/backend/database.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
    return NextResponse.json({ user: sessionUser(database(), request.cookies.get(COOKIE)?.value) }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: NextRequest) {
    if (!isSameOrigin(request))
        return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
    try {
        const { email, password } = await request.json();
        const { token, user } = authenticate(database(), email, password);
        const response = NextResponse.json({ user });
        response.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 8 * 3600 });
        return response;
    }
    catch (error) {
        return NextResponse.json({ error: error instanceof ApiError ? error.message : "Login gagal." }, { status: error instanceof ApiError ? error.status : 500 });
    }
}
export async function DELETE(request: NextRequest) {
    if (!isSameOrigin(request))
        return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
    logout(database(), request.cookies.get(COOKIE)?.value);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
    return response;
}
