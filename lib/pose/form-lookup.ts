import { DEMO_TECHNIQUES } from "@/lib/demo-data";
import type { Technique } from "@/lib/types";
import type { SequencedMovement } from "./form-flow-machine";

/**
 * Lesson IDs that have a guided-form practice carousel available.
 * Keys must exist in `DEMO_TECHNIQUES` and every movement must have
 * `sort_order` defined. Non-scored movements have `stance_ref === null`.
 */
export const FORM_LESSON_IDS = ["wubuquan"] as const;
export type FormLessonId = (typeof FORM_LESSON_IDS)[number];

export type FormLessonMeta = {
  lessonId: FormLessonId;
  english: string;
  chinese: string;
  pinyin: string;
  description: string;
};

const FORM_META: Record<FormLessonId, FormLessonMeta> = {
  wubuquan: {
    lessonId: "wubuquan",
    english: "Five-Step Fist",
    chinese: "五步拳",
    pinyin: "Wǔ Bù Quán",
    description:
      "A short foundational form linking horse, bow, empty, crouch, and rest stances with punches, palm strikes, and a kick.",
  },
};

export function isFormLesson(id: string): id is FormLessonId {
  return (FORM_LESSON_IDS as readonly string[]).includes(id);
}

export function getFormMeta(id: FormLessonId): FormLessonMeta {
  return FORM_META[id];
}

/**
 * Return the sequenced movements for a form lesson, sorted by sort_order.
 * Returns an empty array if no techniques are populated for the lessonId.
 */
export function getFormMovements(lessonId: string): SequencedMovement[] {
  const techniques: Technique[] = DEMO_TECHNIQUES[lessonId] ?? [];
  return techniques
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((t) => ({
      id: t.id,
      sequence: t.sort_order,
      english: t.english,
      chinese: t.chinese,
      pinyin: t.pinyin,
      description: t.description,
      keyPoints: t.key_points ?? [],
      stanceRef: t.stance_ref ?? null,
      source: t.source ?? null,
      attribution: t.attribution ?? null,
    }));
}
