import { createServerSupabase } from "@/lib/supabase-server";
import type {
  Module,
  Lesson,
  Technique,
  QuizQuestion,
  UserProgress,
  ModuleWithProgress,
  LessonWithStatus,
  LessonStatus,
} from "@/lib/types";

// ─── Content fetchers (public tables) ─────────────────────────────────────

export async function getAllModules(): Promise<Module[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("modules")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getModule(moduleId: string): Promise<Module | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("modules")
    .select("*")
    .eq("id", moduleId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getLessonsForModule(
  moduleId: string
): Promise<Lesson[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("module_id", moduleId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getLesson(lessonId: string): Promise<Lesson | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getTechniquesForLesson(
  lessonId: string
): Promise<Technique[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("techniques")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Technique[];
}

export async function getQuizForLesson(
  lessonId: string
): Promise<QuizQuestion[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as QuizQuestion[];
}

// ─── Progress fetchers (RLS-scoped) ───────────────────────────────────────

export async function getUserProgress(
  userId: string
): Promise<UserProgress[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as UserProgress[];
}

export async function getProgressForLesson(
  userId: string,
  lessonId: string
): Promise<UserProgress | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (error) throw error;
  return data as UserProgress | null;
}

// ─── Composite reads (derivation) ─────────────────────────────────────────

/**
 * Pure derivation: given ordered modules+lessons and a progress map,
 * compute each lesson's derived status. First lesson of first module is
 * always reachable; every subsequent lesson unlocks only when the previous
 * one is completed.
 */
function deriveLessonStatuses(
  modules: Module[],
  lessonsByModule: Record<string, Lesson[]>,
  progressMap: Record<string, UserProgress>
): ModuleWithProgress[] {
  let previousCompleted = true;
  const result: ModuleWithProgress[] = [];

  for (const m of modules) {
    const lessons = lessonsByModule[m.id] ?? [];
    const withStatus: LessonWithStatus[] = [];
    let completedCount = 0;

    for (const l of lessons) {
      const row = progressMap[l.id];
      let status: LessonStatus;

      // wubuquan is always available — it's the entry point to forms and has
      // no enforced prerequisite. Other lessons follow the standard linear chain.
      if (l.id === "wubuquan") {
        status = row?.status === "completed"
          ? "completed"
          : row?.status === "in_progress"
          ? "in_progress"
          : "available";
        if (status === "completed") completedCount += 1;
        // Do NOT flip previousCompleted — the forms module sits after Basics in
        // sort_order but its own completion still needs to gate changquan-yi-lu.
        previousCompleted = status === "completed";
      } else if (row?.status === "completed") {
        status = "completed";
        previousCompleted = true;
        completedCount += 1;
      } else if (previousCompleted) {
        status = row?.status === "in_progress" ? "in_progress" : "available";
        previousCompleted = false;
      } else {
        status = "locked";
      }

      withStatus.push({
        ...l,
        derivedStatus: status,
        quiz_score: row?.quiz_score ?? null,
        quiz_attempts: row?.quiz_attempts ?? 0,
      });
    }

    const unlocked =
      withStatus.length === 0 || withStatus[0].derivedStatus !== "locked";

    result.push({
      ...m,
      lessons: withStatus,
      completedCount,
      totalCount: lessons.length,
      unlocked,
    });
  }

  return result;
}

export async function getDashboardData(
  userId: string | null
): Promise<ModuleWithProgress[]> {
  const supabase = createServerSupabase();
  const [{ data: modulesData, error: mErr }, { data: lessonsData, error: lErr }] =
    await Promise.all([
      supabase.from("modules").select("*").order("sort_order"),
      supabase.from("lessons").select("*").order("sort_order"),
    ]);
  if (mErr) throw mErr;
  if (lErr) throw lErr;

  const modules = (modulesData ?? []) as Module[];
  const lessons = (lessonsData ?? []) as Lesson[];

  const lessonsByModule: Record<string, Lesson[]> = {};
  for (const l of lessons) {
    (lessonsByModule[l.module_id] ??= []).push(l);
  }
  // Ensure each module's lessons are sorted (Postgres order is across all)
  for (const key of Object.keys(lessonsByModule)) {
    lessonsByModule[key].sort((a, b) => a.sort_order - b.sort_order);
  }

  const progressMap: Record<string, UserProgress> = {};
  if (userId) {
    const progress = await getUserProgress(userId);
    for (const p of progress) progressMap[p.lesson_id] = p;
  }

  return deriveLessonStatuses(modules, lessonsByModule, progressMap);
}

export async function getModuleWithLessonStatuses(
  userId: string | null,
  moduleId: string
): Promise<{ module: Module; lessons: LessonWithStatus[] } | null> {
  const dashboard = await getDashboardData(userId);
  const target = dashboard.find((m) => m.id === moduleId);
  if (!target) return null;
  return { module: target, lessons: target.lessons };
}

/**
 * Find the next lesson in the curriculum after a completed one.
 * Returns null if this is the final lesson of the final module.
 */
export async function getNextLessonId(
  currentLessonId: string
): Promise<{ moduleId: string; lessonId: string } | null> {
  const supabase = createServerSupabase();
  const [{ data: modulesData }, { data: lessonsData }] = await Promise.all([
    supabase.from("modules").select("*").order("sort_order"),
    supabase.from("lessons").select("*").order("sort_order"),
  ]);
  const modules = (modulesData ?? []) as Module[];
  const lessons = (lessonsData ?? []) as Lesson[];

  const ordered: Lesson[] = [];
  for (const m of modules) {
    const forModule = lessons
      .filter((l) => l.module_id === m.id)
      .sort((a, b) => a.sort_order - b.sort_order);
    ordered.push(...forModule);
  }
  const idx = ordered.findIndex((l) => l.id === currentLessonId);
  if (idx === -1 || idx === ordered.length - 1) return null;
  const next = ordered[idx + 1];
  return { moduleId: next.module_id, lessonId: next.id };
}

// ─── Mutations ────────────────────────────────────────────────────────────

export async function startLesson(
  userId: string,
  lessonId: string
): Promise<void> {
  const supabase = createServerSupabase();

  // Check if a row already exists — don't overwrite a completed status.
  const existing = await getProgressForLesson(userId, lessonId);
  if (existing && existing.status === "completed") return;
  if (existing && existing.status === "in_progress") return;

  const { error } = await supabase.from("user_progress").upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      status: "in_progress",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  );
  if (error) throw error;
}

export async function recordQuizAttempt(args: {
  userId: string;
  lessonId: string;
  score: number;
  passed: boolean;
}): Promise<UserProgress> {
  const { userId, lessonId, score, passed } = args;
  const supabase = createServerSupabase();

  const existing = await getProgressForLesson(userId, lessonId);
  const nextAttempts = (existing?.quiz_attempts ?? 0) + 1;
  const nowIso = new Date().toISOString();

  const payload = {
    user_id: userId,
    lesson_id: lessonId,
    status: (passed
      ? "completed"
      : existing?.status === "completed"
        ? "completed"
        : "in_progress") as LessonStatus,
    quiz_score: score,
    quiz_attempts: nextAttempts,
    completed_at:
      passed || existing?.status === "completed"
        ? (existing?.completed_at ?? nowIso)
        : null,
    updated_at: nowIso,
  };

  const { data, error } = await supabase
    .from("user_progress")
    .upsert(payload, { onConflict: "user_id,lesson_id" })
    .select()
    .single();
  if (error) throw error;
  return data as UserProgress;
}
