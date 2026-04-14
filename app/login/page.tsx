"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

type Mode = "signin" | "signup";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (signUpError) throw signUpError;
        setInfo(
          "Check your email for a confirmation link, then sign in below."
        );
        setMode("signin");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push("/");
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-[380px] space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-1">
            <span className="font-chinese text-4xl font-bold text-gold">
              武学
            </span>
            <span className="text-base font-bold tracking-wide text-cyan">
              WuXue
            </span>
            <span className="text-[10px] font-medium tracking-wider text-foreground/40">
              by Infinite Wushu
            </span>
          </Link>
          <p className="mt-3 text-sm text-foreground/50">
            Sign in to continue your training.
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-card-md border border-cyan/20 bg-white/[0.03] p-1">
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
                setInfo(null);
              }}
              className={`flex-1 rounded-card-sm py-2 text-sm font-semibold transition-all ${
                mode === m
                  ? "bg-cyan text-cyan-foreground"
                  : "text-foreground/50 hover:text-foreground/80"
              }`}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-card-md border border-cyan/15 bg-white/[0.03] px-4 py-3 text-sm text-foreground placeholder-foreground/30 outline-none transition focus:border-cyan/60 focus:bg-white/[0.06]"
            />
            <input
              type="password"
              required
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              className="w-full rounded-card-md border border-cyan/15 bg-white/[0.03] px-4 py-3 text-sm text-foreground placeholder-foreground/30 outline-none transition focus:border-cyan/60 focus:bg-white/[0.06]"
            />
          </div>

          {info && (
            <p className="rounded-card-md border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm text-cyan">
              {info}
            </p>
          )}
          {error && (
            <p className="rounded-card-md border border-crimson/40 bg-crimson/10 px-4 py-3 text-sm text-crimson">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full"
          >
            {loading
              ? mode === "signin"
                ? "Signing in\u2026"
                : "Creating account\u2026"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="text-center text-xs text-foreground/30">
          Your progress is private and only visible to you.
        </p>

        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-foreground/40 transition hover:text-cyan"
          >
            ← Back to landing
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
