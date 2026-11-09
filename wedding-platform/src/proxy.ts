import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/owner", "/client", "/chat"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const demoRole = request.cookies.get("occasio_demo_role")?.value;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request });
  let claims: Record<string, unknown> | undefined = undefined;

  if (supabaseUrl && supabasePublicKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabasePublicKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet, cacheHeaders) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
            Object.entries(cacheHeaders || {}).forEach(([name, value]) => response.headers.set(name, value));
          },
        },
      });

      const { data } = await supabase.auth.getClaims();
      claims = data?.claims as Record<string, unknown> | undefined;
    } catch {
      // Supabase server unavailable, rely on demo session
    }
  }

  const appMetadata = claims?.app_metadata as Record<string, unknown> | undefined;
  const role = (appMetadata?.role as string) || demoRole;

  if (!role && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if (pathname.startsWith("/owner") && role !== "owner") {
    const target = request.nextUrl.clone();
    target.pathname = role === "client" ? "/client/dashboard" : "/login";
    return NextResponse.redirect(target);
  }

  if (pathname.startsWith("/client") && role !== "client") {
    const target = request.nextUrl.clone();
    target.pathname = role === "owner" ? "/owner/dashboard" : "/login";
    return NextResponse.redirect(target);
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/owner/:path*", "/client/:path*", "/chat/:path*"],
};
