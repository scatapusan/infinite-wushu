"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";

type Props = {
  userEmail?: string | null;
};

export default function Header({ userEmail }: Props) {
  const pathname = usePathname() ?? "";
  const isDemo = pathname.startsWith("/demo");
  const learnHref = isDemo || !userEmail ? "/demo" : "/";
  const vocabHref = "/vocab";

  const navItem = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      className={`rounded-card-sm px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] transition ${
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
    <header className="flex items-center justify-between gap-4 px-6 py-5">
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
        {navItem(learnHref, "Learn", learnActive)}
        {navItem(vocabHref, "Vocab", vocabActive)}
      </nav>

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
    </header>
  );
}
