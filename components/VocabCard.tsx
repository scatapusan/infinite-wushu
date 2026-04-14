import Link from "next/link";
import type { VocabWord } from "@/lib/vocab-data";
import { VOCAB_CATEGORIES } from "@/lib/vocab-data";
import SpeakButton from "@/components/SpeakButton";

type Props = {
  word: VocabWord;
};

export default function VocabCard({ word }: Props) {
  const tint =
    VOCAB_CATEGORIES.find((c) => c.value === word.category)?.tint ??
    "bg-white/[0.03] border-white/15";

  const inner = (
    <article
      className={`rounded-card-md border p-5 transition hover:border-cyan/40 ${tint}`}
    >
      <div className="flex items-start gap-1.5">
        <p className="text-zh text-4xl font-bold text-gold">{word.chinese}</p>
        <SpeakButton text={word.chinese} className="mt-1.5" />
      </div>
      <p className="mt-2 text-pinyin text-sm">{word.pinyin}</p>
      <p className="mt-1 text-sm font-semibold text-foreground/90">
        {word.english}
      </p>
      {word.relatedTechniqueName && word.relatedModuleId && word.relatedLessonId && (
        <p className="mt-3 text-[10px] uppercase tracking-[0.15em] text-cyan/60">
          See in: {word.relatedTechniqueName}
        </p>
      )}
    </article>
  );

  if (word.relatedModuleId && word.relatedLessonId) {
    return (
      <Link
        href={`/demo/learn/${word.relatedModuleId}/${word.relatedLessonId}`}
        className="block"
      >
        {inner}
      </Link>
    );
  }

  return <div>{inner}</div>;
}
