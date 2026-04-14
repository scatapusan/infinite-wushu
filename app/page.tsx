import { createServerSupabase } from "@/lib/supabase-server";
import LandingHero from "@/components/LandingHero";
import Dashboard from "@/components/Dashboard";
import { getDashboardData } from "@/lib/db";

// Revalidate on every request — auth state must not be cached.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // If Supabase isn't configured yet (Phase A skeleton boot), fall through to landing.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project")) {
    return <LandingHero />;
  }

  let user: { id: string; email?: string } | null = null;
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase.auth.getUser();
    user = data.user ?? null;
  } catch {
    user = null;
  }

  if (!user) {
    return <LandingHero />;
  }

  const modules = await getDashboardData(user.id);
  return <Dashboard modules={modules} userEmail={user.email ?? ""} />;
}
