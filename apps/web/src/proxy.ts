import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

/**
 * Parcel proxy (formerly middleware): session refresh + route protection.
 *
 * Next.js 16 renamed `middleware.ts` to `proxy.ts` and defaults to the
 * Node.js runtime, which is why this file exports `proxy` instead of
 * `middleware`. Full Node.js APIs are available here.
 *
 * Responsibilities:
 *   1. Refresh the Supabase session cookie on every request so that
 *      expired access tokens do not break Server Component queries.
 *   2. Gate the portal (/portal/*) and admin (/admin/*) route groups
 *      behind authentication.
 *   3. Redirect non-admins away from /admin.
 *   4. Redirect already-logged-in users away from /login and /signup.
 *
 * Routes matched: everything except Next.js internals and static assets
 * (see config at the bottom of this file).
 */
export async function proxy(request: NextRequest) {
  let proxyResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          proxyResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            proxyResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ----- Gate portal and admin routes -----
  const isPortalRoute = pathname.startsWith("/portal");
  const isAdminRoute = pathname.startsWith("/admin");

  if ((isPortalRoute || isAdminRoute) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // ----- Admin-only check -----
  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // ----- Already logged in on auth pages -----
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal/dashboard";
    return NextResponse.redirect(url);
  }

  return proxyResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     *   - _next/static (Next.js static files)
     *   - _next/image (Next.js image optimizer)
     *   - favicon.ico, robots.txt, sitemap.xml
     *   - Common image file extensions
     */
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
