import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: req });

  // If env vars aren't set yet (Phase A skeleton), no-op.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project")) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          req.cookies.set(name, value)
        );
        response = NextResponse.next({ request: req });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Always getUser() — NOT getSession() — so cookies are refreshed
  // against the Supabase auth server on every protected request.
  let user: unknown = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  const { pathname } = req.nextUrl;

  if (!user && pathname.startsWith("/learn")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return response;
}

export const config = {
  // Deliberately excludes "/" so the public landing page renders for anon visitors.
  matcher: ["/learn/:path*", "/login"],
};
