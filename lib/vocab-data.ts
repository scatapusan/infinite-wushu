import { DEMO_TECHNIQUES } from "@/lib/demo-data";
import type { AttributionLevel } from "@/lib/types";

export type VocabCategory =
  | "stance"
  | "hand"
  | "kick"
  | "direction"
  | "body_part"
  | "command"
  | "general";

export type VocabWord = {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  category: VocabCategory;
  relatedTechniqueId?: string;
  relatedModuleId?: string;
  relatedLessonId?: string;
  relatedTechniqueName?: string;
  /** Required — every vocabulary item must declare a trust level. */
  attribution: AttributionLevel;
  source?: string | null;
  sourceUrl?: string | null;
  sourceNotes?: string | null;
};

export const VOCAB_CATEGORIES: {
  value: VocabCategory;
  label: string;
  tint: string;
}[] = [
  { value: "stance", label: "Stances", tint: "bg-cyan/5 border-cyan/25" },
  { value: "hand", label: "Hands", tint: "bg-gold/5 border-gold/25" },
  { value: "kick", label: "Kicks", tint: "bg-crimson/5 border-crimson/25" },
  { value: "direction", label: "Directions", tint: "bg-white/[0.03] border-white/15" },
  { value: "body_part", label: "Body parts", tint: "bg-white/[0.03] border-white/15" },
  { value: "command", label: "Commands", tint: "bg-cyan/5 border-cyan/20" },
  { value: "general", label: "General", tint: "bg-white/[0.03] border-white/15" },
];

const MODULE_TO_CATEGORY: Record<string, VocabCategory> = {
  stances: "stance",
  "hand-forms": "hand",
  punches: "hand",
  kicks: "kick",
  balance: "general",
  conditioning: "general",
};

const SEED_ATTR = { attribution: "community" as const, source: "Standard wushu terminology" };

// Hand-authored seed words (commands, directions, body parts).
const SEED_WORDS: VocabWord[] = [
  // Commands
  { id: "cmd-yubei", chinese: "预备", pinyin: "yùbèi", english: "Ready / Prepare", category: "command", ...SEED_ATTR },
  { id: "cmd-kaishi", chinese: "开始", pinyin: "kāishǐ", english: "Begin", category: "command", ...SEED_ATTR },
  { id: "cmd-ting", chinese: "停", pinyin: "tíng", english: "Stop", category: "command", ...SEED_ATTR },
  { id: "cmd-shoushi", chinese: "收势", pinyin: "shōushì", english: "Closing form", category: "command", ...SEED_ATTR },
  { id: "cmd-jingli", chinese: "敬礼", pinyin: "jìnglǐ", english: "Salute / Bow", category: "command", ...SEED_ATTR },
  // Directions
  { id: "dir-zuo", chinese: "左", pinyin: "zuǒ", english: "Left", category: "direction", ...SEED_ATTR },
  { id: "dir-you", chinese: "右", pinyin: "yòu", english: "Right", category: "direction", ...SEED_ATTR },
  { id: "dir-qian", chinese: "前", pinyin: "qián", english: "Forward", category: "direction", ...SEED_ATTR },
  { id: "dir-hou", chinese: "后", pinyin: "hòu", english: "Back", category: "direction", ...SEED_ATTR },
  { id: "dir-shang", chinese: "上", pinyin: "shàng", english: "Up", category: "direction", ...SEED_ATTR },
  { id: "dir-xia", chinese: "下", pinyin: "xià", english: "Down", category: "direction", ...SEED_ATTR },
  // Body parts
  { id: "bp-quan", chinese: "拳", pinyin: "quán", english: "Fist", category: "body_part", ...SEED_ATTR },
  { id: "bp-zhang", chinese: "掌", pinyin: "zhǎng", english: "Palm", category: "body_part", ...SEED_ATTR },
  { id: "bp-tui", chinese: "腿", pinyin: "tuǐ", english: "Leg", category: "body_part", ...SEED_ATTR },
  { id: "bp-jiao", chinese: "脚", pinyin: "jiǎo", english: "Foot", category: "body_part", ...SEED_ATTR },
  { id: "bp-xi", chinese: "膝", pinyin: "xī", english: "Knee", category: "body_part", ...SEED_ATTR },
  { id: "bp-yao", chinese: "腰", pinyin: "yāo", english: "Waist", category: "body_part", ...SEED_ATTR },
  { id: "bp-jian", chinese: "肩", pinyin: "jiān", english: "Shoulder", category: "body_part", ...SEED_ATTR },
  { id: "bp-zhou", chinese: "肘", pinyin: "zhǒu", english: "Elbow", category: "body_part", ...SEED_ATTR },
];

// Map technique lesson_id back to its module id by scanning DEMO_LESSONS would require
// importing it; simpler to hard-map technique lesson IDs to module IDs here.
const LESSON_TO_MODULE: Record<string, string> = {
  "horse-bow-stance": "stances",
  "empty-crouch-stance": "stances",
  "cross-stance": "stances",
  "fist-palm-hook": "hand-forms",
  "straight-swing-punch": "punches",
  "push-chop-palm": "punches",
  "front-side-kick": "kicks",
  "crescent-kicks": "kicks",
  "snap-thrust-kick": "kicks",
  "knee-swallow-balance": "balance",
  "flexibility-foundations": "conditioning",
};

const TECHNIQUE_WORDS: VocabWord[] = Object.values(DEMO_TECHNIQUES)
  .flat()
  .map((t) => {
    const moduleId = LESSON_TO_MODULE[t.lesson_id] ?? "";
    const category = MODULE_TO_CATEGORY[moduleId] ?? "general";
    return {
      id: `tech-${t.id}`,
      chinese: t.chinese,
      pinyin: t.pinyin,
      english: t.english,
      category,
      relatedTechniqueId: t.id,
      relatedLessonId: t.lesson_id,
      relatedModuleId: moduleId,
      relatedTechniqueName: t.english,
      // Vocabulary attribution is always 'community' — these are standard wushu terms.
      // The video/content source attribution lives on the Technique itself.
      attribution: "community" as const,
      source: "Standard wushu terminology",
    };
  });

export const VOCAB_WORDS: VocabWord[] = [...TECHNIQUE_WORDS, ...SEED_WORDS];
