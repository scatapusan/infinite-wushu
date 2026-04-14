import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function LandingHero() {
  return (
    <main className="relative flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="font-chinese text-2xl font-bold text-gold">
            武学
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-wide text-cyan">
              WuXue
            </span>
            <span className="text-[10px] font-medium tracking-wider text-foreground/40">
              by Infinite Wushu
            </span>
          </div>
        </div>
        <Link
          href="/login"
          className="text-sm font-semibold text-foreground/70 transition hover:text-cyan"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="max-w-xl space-y-8">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan/70">
              Infinite Wushu
            </p>
            <h1 className="font-chinese text-6xl font-bold leading-none text-gold sm:text-7xl">
              武学
            </h1>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Learn Wushu, step by step.
            </h2>
            <p className="text-base text-foreground/60">
              A progressive curriculum from <span className="text-zh">步型</span>{" "}
              <span className="text-pinyin">(bùxíng, stances)</span> to forms and
              weapons. English first, with Chinese woven in lesson by lesson.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/login?mode=signup" className="btn-gold w-full sm:w-auto">
              Create account
            </Link>
            <Link href="/login" className="btn-ghost w-full sm:w-auto">
              Sign in
            </Link>
          </div>

          <div>
            <Link
              href="/demo"
              className="text-sm text-foreground/40 transition hover:text-foreground/70 underline underline-offset-4"
            >
              Preview without an account →
            </Link>
          </div>

          <div className="pt-4">
            <a
              href="https://www.facebook.com/infinitewushu/about"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/20"
            >
              Follow Infinite Wushu on Facebook
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 text-center text-xs text-foreground/40">
        Built for the Infinite Wushu community.
      </footer>
    </main>
  );
}
