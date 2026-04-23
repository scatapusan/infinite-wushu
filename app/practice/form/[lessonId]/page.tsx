import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  FORM_LESSON_IDS,
  getFormMeta,
  getFormMovements,
  isFormLesson,
} from "@/lib/pose/form-lookup";
import PracticeFormPage from "./PracticeFormPage";

type Props = {
  params: { lessonId: string };
};

export function generateStaticParams() {
  return FORM_LESSON_IDS.map((id) => ({ lessonId: id }));
}

export function generateMetadata({ params }: Props): Metadata {
  if (!isFormLesson(params.lessonId)) return {};
  const meta = getFormMeta(params.lessonId);
  return {
    title: `Practice ${meta.english} (${meta.chinese}) — WuXue`,
    description: `Guided full-form practice for ${meta.english} (${meta.pinyin}).`,
  };
}

export default function PracticeFormRoute({ params }: Props) {
  if (!isFormLesson(params.lessonId)) notFound();
  const meta = getFormMeta(params.lessonId);
  const movements = getFormMovements(params.lessonId);
  if (movements.length === 0) notFound();

  return <PracticeFormPage meta={meta} movements={movements} />;
}
