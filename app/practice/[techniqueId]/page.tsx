import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getTechniqueById,
  PRACTICABLE_IDS,
} from "@/lib/pose/technique-lookup";
import PracticePage from "./PracticePage";

type Props = {
  params: { techniqueId: string };
};

export function generateStaticParams() {
  return PRACTICABLE_IDS.map((id) => ({ techniqueId: id }));
}

export function generateMetadata({ params }: Props): Metadata {
  const technique = getTechniqueById(params.techniqueId);
  if (!technique) return {};
  return {
    title: `Practice ${technique.english} (${technique.chinese}) — WuXue`,
    description: `Real-time pose detection practice for ${technique.english} (${technique.pinyin}).`,
  };
}

export default function PracticeRoute({ params }: Props) {
  const technique = getTechniqueById(params.techniqueId);
  if (!technique) notFound();

  return <PracticePage technique={technique} lessonId={technique.lesson_id} />;
}
