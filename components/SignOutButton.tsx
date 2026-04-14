"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase-browser";

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-foreground/70 transition hover:border-gold/40 hover:text-gold disabled:opacity-50"
    >
      <LogOut size={12} />
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
