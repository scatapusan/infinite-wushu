"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";
import { isCoachMode } from "@/lib/coach-mode";

type Props = {
  userEmail?: string | null;
};

export default function Header({ userEmail }: Props) {
  const pathname = usePathname() ?? "";
  const isDemo = pathname.startsWith("/demo");
  const learnHref = isDemo || !userEmail ? "/demo" : "/";
  const vocabHref = "/vocab";

  const [coachMode, setCoachModeState] = useState(false);
  useEffect(() => {
    setCoachModeState(isCoachMode());
  }, []);

  const navItem = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center rounded-card-sm px-3 text-xs font-semibold uppercase tracking-[0.15em] transition active:scale-[0.97] ${
        active
          ? "bg-cyan/10 text-cyan"
          : "text-foreground/50 hover:text-foreground/90"
      }`}
    >
      {label}
    </Link>
  );

  const learnActive =
    pathname === "/" ||
    pathname === "/demo" ||
    pathname.startsWith("/learn") ||
    pathname.startsWith("/demo/learn");
  const vocabActive = pathname.startsWith("/vocab");

  return (
    <header className="safe-pt flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-5">
      <Link href={learnHref} className="flex items-center gap-3">
        <span className="font-chinese text-2xl font-bold text-gold">武学</span>
        <div className="flex flex-col leading-tight">
          <span className="text-base font-bold tracking-wide text-cyan">
            WuXue
          </span>
          <span className="text-[10px] font-medium tracking-wider text-foreground/40">
            by Infinite Wushu
          </span>
        </div>
      </Link>

      <nav className="flex items-center gap-1">
        {coachMode && (
          <span className="mr-1 rounded-card-sm border border-gold/40 bg-gold/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gold">
            Coach View
          </span>
        )}
        {navItem(learnHref, "Learn", learnActive)}
        {navItem(vocabHref, "Vocab", vocabActive)}
      </nav>

      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          aria-label="Settings"
          className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-card-sm transition active:scale-95 ${
            pathname === "/settings"
              ? "text-cyan"
              : "text-foreground/40 hover:text-foreground/80"
          }`}
        >
          <Settings size={18} />
        </Link>

        {userEmail ? (
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-foreground/50 sm:block">
              {userEmail}
            </span>
            <SignOutButton />
          </div>
        ) : (
          <div className="w-[1px]" aria-hidden />
        )}
      </div>
    </header>
  );
}
