"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { VocabWord, VocabCategory } from "@/lib/vocab-data";
import { VOCAB_CATEGORIES } from "@/lib/vocab-data";
import VocabCard from "@/components/VocabCard";

type Props = {
  words: VocabWord[];
};

export default function VocabBrowse({ words }: Props) {
  const [category, setCategory] = useState<VocabCategory | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return words.filter((w) => {
      if (category !== "all" && w.category !== category) return false;
      if (!q) return true;
      return (
        w.chinese.toLowerCase().includes(q) ||
        w.pinyin.toLowerCase().includes(q) ||
        w.english.toLowerCase().includes(q)
      );
    });
  }, [words, category, query]);

  return (
    <div className="space-y-6">
      <div className="card-surface p-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full rounded-card-md border border-white/10 bg-white/[0.02] py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground/30 focus:border-cyan/60 focus:outline-none"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`rounded-card-sm px-3 py-1.5 text-xs font-semibold transition ${
              category === "all"
                ? "bg-cyan/15 text-cyan"
                : "text-foreground/50 hover:text-foreground/90"
            }`}
          >
            All
          </button>
          {VOCAB_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`rounded-card-sm px-3 py-1.5 text-xs font-semibold transition ${
                category === c.value
                  ? "bg-cyan/15 text-cyan"
                  : "text-foreground/50 hover:text-foreground/90"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-foreground/40">
        {filtered.length} {filtered.length === 1 ? "word" : "words"}
      </p>

      {filtered.length === 0 ? (
        <div className="card-surface p-8 text-center text-sm text-foreground/50">
          No words match your filter.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((w) => (
            <VocabCard key={w.id} word={w} />
          ))}
        </div>
      )}
    </div>
  );
}
