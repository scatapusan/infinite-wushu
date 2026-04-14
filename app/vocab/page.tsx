import Link from "next/link";
import { Play } from "lucide-react";
import Header from "@/components/Header";
import VocabBrowse from "@/components/VocabBrowse";
import { VOCAB_WORDS } from "@/lib/vocab-data";

export default function VocabPage() {
  return (
    <main className="relative min-h-screen">
      <Header />

      <section className="px-6">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan/70">
                Vocabulary
              </p>
              <h1 className="mt-1 text-3xl font-bold">Wushu words</h1>
              <p className="mt-1 text-sm text-foreground/60">
                Every Chinese term you&apos;ve encountered — and a few essentials for
                the training floor.
              </p>
            </div>
            <Link href="/vocab/review" className="btn-gold">
              <Play size={14} className="mr-2" />
              Start review
            </Link>
          </div>

          <VocabBrowse words={VOCAB_WORDS} />
        </div>
      </section>

      <footer className="px-6 py-10 text-center text-xs text-foreground/30">
        武学 · WuXue · by Infinite Wushu
      </footer>
    </main>
  );
}
