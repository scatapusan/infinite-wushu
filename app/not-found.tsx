import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-chinese text-5xl font-bold text-gold">武学</p>
      <p className="mt-2 text-xs uppercase tracking-[0.3em] text-gold/60">
        WuXue
      </p>
      <h1 className="mt-8 text-3xl font-bold">Lost in the mountains</h1>
      <p className="mt-2 text-sm text-foreground/60">
        We couldn&apos;t find that page.
      </p>
      <Link href="/" className="btn-gold mt-8">
        Back to dashboard
      </Link>
    </main>
  );
}
