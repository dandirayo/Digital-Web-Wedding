import { NextResponse, type NextRequest } from "next/server";
export async function proxy(request: NextRequest) {
    const response = await fetch(new URL("/api/auth", request.url), { headers: { cookie: request.headers.get("cookie") || "" }, cache: "no-store" });
    const { user } = response.ok ? await response.json() : { user: null };
    const path = request.nextUrl.pathname;
    if (!user || (path.startsWith("/owner") && user.role !== "owner") || (path.startsWith("/client") && user.role !== "client") || (path.startsWith("/checkin") && user.role !== "owner")) {
        const url = request.nextUrl.clone();
        url.pathname = user ? (user.role === "owner" ? "/owner/dashboard" : "/client/dashboard") : "/login";
        url.search = "";
        return NextResponse.redirect(url);
    }
    const result = NextResponse.next();
    result.headers.set("Cache-Control", "private, no-store");
    return result;
}
export const config = { matcher: ["/owner/:path*", "/client/:path*", "/chat/:path*", "/checkin/:path*"] };
