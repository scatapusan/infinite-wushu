export type Module = {
  id: string;
  title_zh: string;
  title_pinyin: string;
  title_en: string;
  description: string | null;
  sort_order: number;
  category: string | null;
};

export type Lesson = {
  id: string;
  module_id: string;
  title_zh: string;
  title_pinyin: string;
  title_en: string;
  description: string | null;
  sort_order: number;
  chinese_level: number;
};

export type Technique = {
  id: string;
  lesson_id: string;
  chinese: string;
  pinyin: string;
  english: string;
  description: string | null;
  key_points: string[];
  common_mistakes: string[];
  sort_order: number;
  video_url: string | null;
  reference_angles: Record<string, unknown> | null;
};

export type QuizQuestion = {
  id: string;
  lesson_id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  sort_order: number;
};

// Client-safe version with correct_index stripped
export type QuizQuestionPublic = Omit<QuizQuestion, "correct_index">;

export type LessonStatus = "locked" | "available" | "in_progress" | "completed";

export type UserProgress = {
  id: string;
  user_id: string;
  lesson_id: string;
  status: LessonStatus;
  quiz_score: number | null;
  quiz_attempts: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LessonWithStatus = Lesson & {
  derivedStatus: LessonStatus;
  quiz_score: number | null;
  quiz_attempts: number;
  prerequisite_label?: string;
};

export type ModuleWithProgress = Module & {
  lessons: LessonWithStatus[];
  completedCount: number;
  totalCount: number;
  unlocked: boolean;
};
