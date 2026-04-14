import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client for use in client components.
// Cookie-based so the session is visible to middleware and SSR.
// Placeholder fallbacks prevent the module from throwing at build/prerender time
// when env vars are not yet configured (demo mode).
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key"
);
