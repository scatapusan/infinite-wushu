import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getQuizForLesson, recordQuizAttempt } from "@/lib/db";

const PASS_THRESHOLD = 0.75;

type SubmitBody = {
  lessonId?: unknown;
  answers?: unknown;
};

export async function POST(req: Request) {
  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lessonId = typeof body.lessonId === "string" ? body.lessonId : null;
  const answers = Array.isArray(body.answers)
    ? body.answers.filter((a): a is number => typeof a === "number")
    : null;

  if (!lessonId || !answers) {
    return NextResponse.json(
      { error: "lessonId and answers[] are required" },
      { status: 400 }
    );
  }
  if (!/^[a-z0-9-]+$/.test(lessonId)) {
    return NextResponse.json({ error: "invalid lessonId" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const questions = await getQuizForLesson(lessonId);
  if (questions.length === 0) {
    return NextResponse.json({ error: "no quiz found" }, { status: 404 });
  }
  if (answers.length !== questions.length) {
    return NextResponse.json(
      { error: "answer count mismatch" },
      { status: 400 }
    );
  }

  // Server-side grading — never trust the client.
  let correctCount = 0;
  for (let i = 0; i < questions.length; i++) {
    if (answers[i] === questions[i].correct_index) correctCount += 1;
  }
  const score = correctCount / questions.length;
  const passed = score >= PASS_THRESHOLD;

  try {
    await recordQuizAttempt({
      userId: user.id,
      lessonId,
      score,
      passed,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "failed to record attempt",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    score,
    passed,
    correctCount,
    total: questions.length,
    // Per-question correctness so the client can show review UI after submit.
    results: questions.map((q, i) => ({
      questionId: q.id,
      correct: answers[i] === q.correct_index,
      correctIndex: q.correct_index,
      explanation: q.explanation,
    })),
  });
}
