import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Server-side Supabase client factory for RSCs, route handlers, and server actions.
// The try/catch around setAll is required because RSCs cannot mutate cookies;
// middleware keeps the session cookies fresh so swallowing the RSC error is safe.
export function createServerSupabase() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from RSC — Next disallows mutating cookies there.
            // Middleware already refreshes the session, so this is safe to ignore.
          }
        },
      },
    }
  );
}
