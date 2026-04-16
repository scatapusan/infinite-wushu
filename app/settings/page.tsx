import Link from "next/link";
import { ChevronLeft, Settings } from "lucide-react";
import Header from "@/components/Header";
import CoachToggle from "@/components/CoachToggle";
import { createServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings — WuXue",
};

export default async function SettingsPage() {
  // Gracefully handle missing Supabase config (Phase A skeleton)
  let userEmail: string | null = null;
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  } catch {
    // No Supabase config — proceed without user
  }

  return (
    <main className="relative min-h-screen">
      <Header userEmail={userEmail} />

      <section className="px-6">
        <div className="mx-auto max-w-2xl space-y-8">
          <Link
            href={userEmail ? "/" : "/demo"}
            className="inline-flex items-center gap-1 text-xs text-foreground/50 transition hover:text-cyan"
          >
            <ChevronLeft size={14} />
            Back
          </Link>

          <div>
            <div className="flex items-center gap-3">
              <Settings size={20} className="text-cyan" />
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
            <p className="mt-1 text-sm text-foreground/50">
              Manage your learning preferences.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground/50">
              Role
            </h2>
            <CoachToggle />
            <p className="text-xs text-foreground/30">
              Coach Mode is stored locally. Sign in to sync your role across
              devices (coming soon).
            </p>
          </div>
        </div>
      </section>

      <footer className="px-6 py-10 text-center text-xs text-foreground/30">
        武学 · WuXue · by Infinite Wushu
      </footer>
    </main>
  );
}
