"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import Header from "@/components/Header";
import SpeakButton from "@/components/SpeakButton";
import { VOCAB_WORDS, type VocabWord } from "@/lib/vocab-data";
import { gradeWord, getDueWords } from "@/lib/vocab-progress";
import { speakChinese } from "@/lib/speech";

type Mode = "zh-en" | "en-zh";

export default function VocabReviewPage() {
  const [mode, setMode] = useState<Mode>("zh-en");
  const [queue, setQueue] = useState<VocabWord[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [loaded, setLoaded] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    const due = getDueWords(VOCAB_WORDS);
    // Shuffle lightly to mix order
    const shuffled = [...due].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setLoaded(true);
  }, []);

  // Auto-play Chinese pronunciation on reveal
  useEffect(() => {
    if (revealed && autoPlay && current) {
      speakChinese(current.chinese);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  const current = queue[index];
  const done = loaded && queue.length > 0 && index >= queue.length;
  const empty = loaded && queue.length === 0;

  const handleGrade = (passed: boolean) => {
    if (!current) return;
    gradeWord(current.id, passed);
    setSessionStats((s) => ({
      reviewed: s.reviewed + 1,
      correct: s.correct + (passed ? 1 : 0),
    }));
    setRevealed(false);
    setIndex((i) => i + 1);
  };

  const restart = () => {
    const due = getDueWords(VOCAB_WORDS);
    const shuffled = [...due].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setIndex(0);
    setRevealed(false);
    setSessionStats({ reviewed: 0, correct: 0 });
  };

  const progressPct = useMemo(() => {
    if (queue.length === 0) return 0;
    return Math.round((index / queue.length) * 100);
  }, [index, queue.length]);

  return (
    <main className="relative min-h-screen">
      <Header />

      <section className="px-6">
        <div className="mx-auto max-w-xl space-y-6">
          <Link
            href="/vocab"
            className="inline-flex items-center gap-1 text-xs text-foreground/50 transition hover:text-cyan"
          >
            <ChevronLeft size={14} />
            Browse vocab
          </Link>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan/70">
              Daily review
            </p>
            <h1 className="mt-1 text-3xl font-bold">Flashcards</h1>
          </div>

          {/* Mode toggle */}
          <div className="card-surface p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
              Direction
            </p>
            <div className="mt-2 flex gap-1 rounded-card-md border border-white/10 bg-white/[0.02] p-1">
              {(
                [
                  { v: "zh-en", label: "中 → English" },
                  { v: "en-zh", label: "English → 中" },
                ] as const
              ).map((m) => (
                <button
                  key={m.v}
                  type="button"
                  onClick={() => setMode(m.v)}
                  className={`flex-1 rounded-card-sm px-3 py-2 text-xs font-semibold transition ${
                    mode === m.v
                      ? "bg-cyan/15 text-cyan"
                      : "text-foreground/60 hover:text-foreground/90"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          {loaded && !empty && (
            <div className="flex items-center justify-between text-xs text-foreground/50">
              <span>
                {Math.min(index, queue.length)} / {queue.length} reviewed
              </span>
              <span>
                Session: {sessionStats.correct}/{sessionStats.reviewed}
              </span>
            </div>
          )}
          {loaded && !empty && (
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-gradient-to-r from-cyan to-gold transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}

          {/* Card */}
          {!loaded ? (
            <div className="card-surface p-12 text-center text-sm text-foreground/40">
              Loading…
            </div>
          ) : empty ? (
            <div className="card-surface p-12 text-center">
              <p className="text-lg font-bold">Nothing due right now</p>
              <p className="mt-2 text-sm text-foreground/50">
                Come back later or browse the full word list.
              </p>
              <Link href="/vocab" className="btn-ghost mt-6 inline-flex">
                Back to vocab
              </Link>
            </div>
          ) : done ? (
            <div className="card-surface p-10 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan/70">
                Session complete
              </p>
              <p className="mt-2 font-chinese text-5xl font-bold text-cyan">
                {sessionStats.correct}/{sessionStats.reviewed}
              </p>
              <p className="mt-2 text-sm text-foreground/60">
                Nice work. Come back tomorrow for more.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button onClick={restart} className="btn-gold">
                  <RotateCcw size={14} className="mr-2" />
                  Review again
                </button>
                <Link href="/vocab" className="btn-ghost">
                  Browse vocab
                </Link>
              </div>
            </div>
          ) : current ? (
            <div className="card-surface space-y-6 p-10 text-center">
              {mode === "zh-en" ? (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-zh text-6xl font-bold text-gold">
                      {current.chinese}
                    </p>
                    <SpeakButton text={current.chinese} className="mt-1" />
                  </div>
                  {revealed && (
                    <>
                      <p className="text-pinyin text-lg">{current.pinyin}</p>
                      <p className="text-xl font-semibold">{current.english}</p>
                    </>
                  )}
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold">{current.english}</p>
                  {!revealed && (
                    <button
                      type="button"
                      onClick={() => speakChinese(current.chinese)}
                      className="inline-flex items-center gap-1.5 rounded-card-md border border-white/10 px-3 py-1.5 text-xs text-foreground/50 transition hover:border-cyan/40 hover:text-cyan"
                    >
                      <Volume2 size={12} />
                      Listen
                    </button>
                  )}
                  {revealed && (
                    <>
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-zh text-5xl font-bold text-gold">
                          {current.chinese}
                        </p>
                        <SpeakButton text={current.chinese} className="mt-1" />
                      </div>
                      <p className="text-pinyin text-lg">{current.pinyin}</p>
                    </>
                  )}
                </>
              )}

              {!revealed ? (
                <button
                  onClick={() => setRevealed(true)}
                  className="btn-ghost w-full"
                >
                  Reveal
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleGrade(false)}
                    className="btn-crimson flex-1"
                  >
                    <X size={14} className="mr-2" />
                    Need practice
                  </button>
                  <button
                    onClick={() => handleGrade(true)}
                    className="btn-gold flex-1"
                  >
                    <Check size={14} className="mr-2" />
                    Got it
                  </button>
                </div>
              )}

              {/* Auto-play toggle */}
              <button
                type="button"
                onClick={() => setAutoPlay((v) => !v)}
                className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] transition ${
                  autoPlay ? "text-cyan/60 hover:text-cyan" : "text-foreground/30 hover:text-foreground/60"
                }`}
              >
                {autoPlay ? <Volume2 size={11} /> : <VolumeX size={11} />}
                Auto-play {autoPlay ? "on" : "off"}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <footer className="px-6 py-10 text-center text-xs text-foreground/30">
        武学 · WuXue · by Infinite Wushu
      </footer>
    </main>
  );
}
