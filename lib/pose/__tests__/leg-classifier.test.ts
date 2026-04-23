import { describe, it, expect } from "vitest";
import type { PoseLandmark } from "../types";
import {
  classifyLegs,
  getClassifierConfig,
  LegClassifierBuffer,
  resolveBowStance,
  resolveCrouchStance,
  resolveEmptyStance,
  resolveRestStance,
  type LegClassification,
} from "../leg-classifier";

// ─── Landmark fixture builders ───────────────────────────────────────────

/**
 * Build an empty landmark array sized for MediaPipe Pose (33 landmarks).
 * Uninitialized slots have visibility 0 so the classifier treats them as missing.
 */
function blankPose(): PoseLandmark[] {
  return Array.from({ length: 33 }, () => ({
    x: 0,
    y: 0,
    z: 0,
    visibility: 0,
  }));
}

function lm(x: number, y: number, visibility = 0.95): PoseLandmark {
  return { x, y, z: 0, visibility };
}

/**
 * Build a synthetic pose in gongbu (bow stance) with the specified front leg.
 *
 * Screen coordinates are normalized to [0, 1] with +x right, +y down (standard
 * image space). The front leg has a ~90° knee; the back leg is fully extended
 * (~180°). The pelvis tilts slightly so the front-side hip is lower, matching
 * how bow stance rotates the body toward the front leg.
 */
function gongbuPose(front: "left" | "right"): PoseLandmark[] {
  const p = blankPose();
  p[11] = lm(0.42, 0.2);
  p[12] = lm(0.58, 0.2);

  if (front === "left") {
    // Front-side hip lower (rotated toward front leg).
    p[23] = lm(0.45, 0.53);
    p[24] = lm(0.55, 0.47);
    // Left leg at ~90°.
    p[25] = lm(0.23, 0.72);
    p[27] = lm(0.43, 0.92);
    // Right leg fully extended.
    p[26] = lm(0.72, 0.73);
    p[28] = lm(0.89, 0.96);
  } else {
    p[23] = lm(0.45, 0.47);
    p[24] = lm(0.55, 0.53);
    p[26] = lm(0.77, 0.72);
    p[28] = lm(0.57, 0.92);
    p[25] = lm(0.28, 0.73);
    p[27] = lm(0.11, 0.96);
  }
  p[29] = lm(p[27].x, p[27].y + 0.005);
  p[30] = lm(p[28].x, p[28].y + 0.005);
  p[31] = lm(p[27].x + 0.02, p[27].y + 0.01);
  p[32] = lm(p[28].x + 0.02, p[28].y + 0.01);
  return p;
}

/** Pubu (crouch stance): one leg deeply bent, the other fully extended horizontally. */
function pubuPose(extended: "left" | "right"): PoseLandmark[] {
  const p = blankPose();
  p[11] = lm(0.42, 0.25);
  p[12] = lm(0.58, 0.25);
  p[23] = lm(0.45, 0.65);
  p[24] = lm(0.55, 0.65);

  if (extended === "left") {
    // Extended leg (straight, out to the side)
    p[25] = lm(0.25, 0.70);
    p[27] = lm(0.05, 0.75);
    // Bent leg (deep squat, knee ~105°)
    p[26] = lm(0.70, 0.85);
    p[28] = lm(0.55, 0.95);
  } else {
    p[26] = lm(0.75, 0.70);
    p[28] = lm(0.95, 0.75);
    p[25] = lm(0.30, 0.85);
    p[27] = lm(0.45, 0.95);
  }
  p[29] = lm(p[27].x, p[27].y + 0.005);
  p[30] = lm(p[28].x, p[28].y + 0.005);
  p[31] = lm(p[27].x + 0.02, p[27].y + 0.01);
  p[32] = lm(p[28].x + 0.02, p[28].y + 0.01);
  return p;
}

/** Xubu (empty stance): back leg bent bearing weight, front leg straight, toe-touch. */
function xubuPose(front: "left" | "right"): PoseLandmark[] {
  const p = blankPose();
  p[11] = lm(0.42, 0.2);
  p[12] = lm(0.58, 0.2);

  if (front === "left") {
    // Back-side hip drops (weight-bearing).
    p[23] = lm(0.45, 0.5);
    p[24] = lm(0.55, 0.6);
    // Left front leg — STRAIGHT, reaches forward.
    p[25] = lm(0.38, 0.72);
    p[27] = lm(0.30, 0.93);
    // Right back leg — BENT ~90°, foot near hip center.
    p[26] = lm(0.72, 0.75);
    p[28] = lm(0.58, 0.92);
  } else {
    p[23] = lm(0.45, 0.6);
    p[24] = lm(0.55, 0.5);
    p[26] = lm(0.62, 0.72);
    p[28] = lm(0.70, 0.93);
    p[25] = lm(0.28, 0.75);
    p[27] = lm(0.42, 0.92);
  }
  p[29] = lm(p[27].x, p[27].y + 0.005);
  p[30] = lm(p[28].x, p[28].y + 0.005);
  p[31] = lm(p[27].x + 0.02, p[27].y + 0.01);
  p[32] = lm(p[28].x + 0.02, p[28].y + 0.01);
  return p;
}

/** Xiebu (rest stance): legs crossed, back leg's heel lifted. */
function xiebuPose(front: "left" | "right"): PoseLandmark[] {
  const p = blankPose();
  p[11] = lm(0.42, 0.25);
  p[12] = lm(0.58, 0.25);
  p[23] = lm(0.45, 0.55);
  p[24] = lm(0.55, 0.55);

  if (front === "left") {
    // Left leg = front, heel planted
    p[25] = lm(0.42, 0.75);
    p[27] = lm(0.4, 0.92);
    // Right leg = back, crossed behind, heel LIFTED
    p[26] = lm(0.5, 0.78);
    p[28] = lm(0.48, 0.9);
    // Left heel ~ planted (heel y ~ toe y)
    p[29] = lm(0.39, 0.94);
    p[31] = lm(0.42, 0.945);
    // Right heel LIFTED (heel above toe — smaller y)
    p[30] = lm(0.47, 0.88);
    p[32] = lm(0.5, 0.93);
  } else {
    p[26] = lm(0.58, 0.75);
    p[28] = lm(0.6, 0.92);
    p[25] = lm(0.5, 0.78);
    p[27] = lm(0.52, 0.9);
    p[30] = lm(0.61, 0.94);
    p[32] = lm(0.58, 0.945);
    p[29] = lm(0.53, 0.88);
    p[31] = lm(0.5, 0.93);
  }
  return p;
}

/** Ambiguous upright: legs shoulder-width, both straight, symmetric. */
function uprightSymmetric(): PoseLandmark[] {
  const p = blankPose();
  p[11] = lm(0.42, 0.2);
  p[12] = lm(0.58, 0.2);
  p[23] = lm(0.45, 0.5);
  p[24] = lm(0.55, 0.5);
  p[25] = lm(0.45, 0.72);
  p[26] = lm(0.55, 0.72);
  p[27] = lm(0.45, 0.95);
  p[28] = lm(0.55, 0.95);
  p[29] = lm(0.45, 0.955);
  p[30] = lm(0.55, 0.955);
  p[31] = lm(0.47, 0.96);
  p[32] = lm(0.57, 0.96);
  return p;
}

/** Symmetric mabu (horse stance): both legs equally bent, feet wider than shoulders. */
function mabuSymmetric(): PoseLandmark[] {
  const p = blankPose();
  p[11] = lm(0.42, 0.25);
  p[12] = lm(0.58, 0.25);
  p[23] = lm(0.45, 0.55);
  p[24] = lm(0.55, 0.55);
  // Both knees pushed down and out; feet wider
  p[25] = lm(0.35, 0.8);
  p[26] = lm(0.65, 0.8);
  p[27] = lm(0.3, 0.95);
  p[28] = lm(0.7, 0.95);
  p[29] = lm(0.3, 0.955);
  p[30] = lm(0.7, 0.955);
  p[31] = lm(0.32, 0.96);
  p[32] = lm(0.72, 0.96);
  return p;
}

// ─── Test suites ────────────────────────────────────────────────────────

describe("classifyLegs — clear gongbu", () => {
  const config = getClassifierConfig("bow-stance")!;

  it("left-forward gongbu → left=front, right=back, high confidence", () => {
    const result = classifyLegs(gongbuPose("left"), config, "bow-stance");
    expect(result.left).toBe("front");
    expect(result.right).toBe("back");
    expect(result.ambiguous).toBe(false);
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it("right-forward gongbu → right=front, left=back, high confidence", () => {
    const result = classifyLegs(gongbuPose("right"), config, "bow-stance");
    expect(result.left).toBe("back");
    expect(result.right).toBe("front");
    expect(result.ambiguous).toBe(false);
    expect(result.confidence).toBeGreaterThan(0.7);
  });
});

describe("classifyLegs — clear pubu (bent-extended)", () => {
  const config = getClassifierConfig("crouch-stance")!;

  it("left-extended pubu → left=extended, right=bent, high confidence", () => {
    const result = classifyLegs(pubuPose("left"), config, "crouch-stance");
    expect(result.left).toBe("extended");
    expect(result.right).toBe("bent");
    expect(result.ambiguous).toBe(false);
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it("right-extended pubu → right=extended, left=bent", () => {
    const result = classifyLegs(pubuPose("right"), config, "crouch-stance");
    expect(result.left).toBe("bent");
    expect(result.right).toBe("extended");
    expect(result.ambiguous).toBe(false);
  });
});

describe("classifyLegs — clear xubu (empty stance)", () => {
  const config = getClassifierConfig("empty-stance")!;

  it("left-forward xubu: left=front (the STRAIGHTER leg), right=back", () => {
    const result = classifyLegs(xubuPose("left"), config, "empty-stance");
    expect(result.left).toBe("front");
    expect(result.right).toBe("back");
    expect(result.ambiguous).toBe(false);
  });

  it("right-forward xubu: right=front, left=back", () => {
    const result = classifyLegs(xubuPose("right"), config, "empty-stance");
    expect(result.left).toBe("back");
    expect(result.right).toBe("front");
    expect(result.ambiguous).toBe(false);
  });
});

describe("classifyLegs — xiebu (rest stance, heel-lift)", () => {
  const config = getClassifierConfig("rest-stance")!;

  it("left-forward xiebu: right heel lifted → right is back", () => {
    const result = classifyLegs(xiebuPose("left"), config, "rest-stance");
    expect(result.left).toBe("front");
    expect(result.right).toBe("back");
    expect(result.ambiguous).toBe(false);
  });

  it("right-forward xiebu: left heel lifted → left is back", () => {
    const result = classifyLegs(xiebuPose("right"), config, "rest-stance");
    expect(result.left).toBe("back");
    expect(result.right).toBe("front");
    expect(result.ambiguous).toBe(false);
  });
});

describe("classifyLegs — ambiguous inputs", () => {
  it("upright symmetric pose → ambiguous, low confidence", () => {
    const result = classifyLegs(
      uprightSymmetric(),
      getClassifierConfig("bow-stance")!,
      "bow-stance",
    );
    expect(result.ambiguous).toBe(true);
    expect(result.confidence).toBeLessThan(0.7);
  });

  it("symmetric mabu in front-back config → ambiguous (cannot decide front/back)", () => {
    const result = classifyLegs(
      mabuSymmetric(),
      getClassifierConfig("bow-stance")!,
      "bow-stance",
    );
    expect(result.ambiguous).toBe(true);
  });

  it("partial occlusion: left knee has low visibility → ambiguous or low confidence", () => {
    const pose = gongbuPose("left");
    pose[25] = { ...pose[25], visibility: 0.3 }; // hide left knee
    const result = classifyLegs(
      pose,
      getClassifierConfig("bow-stance")!,
      "bow-stance",
    );
    // With knee-angle method failing, we fall back to hip-orientation + foot-position.
    // Result may be lower confidence; if any single method still votes we accept.
    // The test contract is: confidence must drop vs. fully-visible case.
    const full = classifyLegs(
      gongbuPose("left"),
      getClassifierConfig("bow-stance")!,
      "bow-stance",
    );
    expect(result.confidence).toBeLessThan(full.confidence);
  });
});

describe("LegClassifierBuffer — temporal smoothing", () => {
  const config = getClassifierConfig("bow-stance")!;

  it("locks after 10 consecutive agreeing frames with high confidence", () => {
    const buffer = new LegClassifierBuffer();
    const pose = gongbuPose("left");
    for (let i = 0; i < 10; i++) {
      buffer.push(classifyLegs(pose, config, "bow-stance"));
    }
    const snap = buffer.current();
    expect(snap.locked).toBe(true);
    expect(snap.classification?.left).toBe("front");
  });

  it("does not lock with only 5 agreeing frames", () => {
    const buffer = new LegClassifierBuffer();
    const pose = gongbuPose("left");
    for (let i = 0; i < 5; i++) {
      buffer.push(classifyLegs(pose, config, "bow-stance"));
    }
    expect(buffer.current().locked).toBe(false);
  });

  it("flickering input does not lock", () => {
    const buffer = new LegClassifierBuffer();
    const left = gongbuPose("left");
    const right = gongbuPose("right");
    for (let i = 0; i < 20; i++) {
      const pose = i % 2 === 0 ? left : right;
      buffer.push(classifyLegs(pose, config, "bow-stance"));
    }
    expect(buffer.current().locked).toBe(false);
  });

  it("unlocks after 10 sustained disagreeing frames", () => {
    const buffer = new LegClassifierBuffer();
    const left = gongbuPose("left");
    const right = gongbuPose("right");
    for (let i = 0; i < 10; i++) buffer.push(classifyLegs(left, config, "bow-stance"));
    expect(buffer.current().locked).toBe(true);
    for (let i = 0; i < 10; i++) buffer.push(classifyLegs(right, config, "bow-stance"));
    const snap = buffer.current();
    // Either the lock has flipped or has been cleared; not still left-forward.
    expect(
      !snap.locked || snap.classification?.left === "back",
    ).toBe(true);
  });

  it("reset clears the lock and buffer", () => {
    const buffer = new LegClassifierBuffer();
    const pose = gongbuPose("left");
    for (let i = 0; i < 10; i++) buffer.push(classifyLegs(pose, config, "bow-stance"));
    buffer.reset();
    expect(buffer.current().locked).toBe(false);
    expect(buffer.current().classification).toBeNull();
    expect(buffer.current().size).toBe(0);
  });

  it("ambiguous frames don't count toward unlock streak", () => {
    const buffer = new LegClassifierBuffer();
    const leftPose = gongbuPose("left");
    const symmetric = uprightSymmetric();
    for (let i = 0; i < 10; i++) buffer.push(classifyLegs(leftPose, config, "bow-stance"));
    expect(buffer.current().locked).toBe(true);
    for (let i = 0; i < 20; i++) buffer.push(classifyLegs(symmetric, config, "bow-stance"));
    // Lock should survive ambiguous frames.
    expect(buffer.current().locked).toBe(true);
  });
});

describe("stance-specific resolvers", () => {
  it("resolveBowStance returns 'left' for left-forward gongbu", () => {
    const result = resolveBowStance(gongbuPose("left"));
    expect(result.side).toBe("left");
    expect(result.ambiguous).toBe(false);
  });

  it("resolveBowStance returns 'right' for right-forward gongbu", () => {
    const result = resolveBowStance(gongbuPose("right"));
    expect(result.side).toBe("right");
    expect(result.ambiguous).toBe(false);
  });

  it("resolveBowStance returns null+ambiguous for upright", () => {
    const result = resolveBowStance(uprightSymmetric());
    expect(result.side).toBeNull();
    expect(result.ambiguous).toBe(true);
  });

  it("resolveCrouchStance returns the side with the extended leg", () => {
    const left = resolveCrouchStance(pubuPose("left"));
    expect(left.side).toBe("left");
    expect(left.ambiguous).toBe(false);

    const right = resolveCrouchStance(pubuPose("right"));
    expect(right.side).toBe("right");
    expect(right.ambiguous).toBe(false);
  });

  it("resolveEmptyStance returns the side with the straighter (front) leg", () => {
    const left = resolveEmptyStance(xubuPose("left"));
    expect(left.side).toBe("left");
    expect(left.ambiguous).toBe(false);
  });

  it("resolveRestStance returns the planted-foot side (front)", () => {
    const left = resolveRestStance(xiebuPose("left"));
    expect(left.side).toBe("left");
    expect(left.ambiguous).toBe(false);
  });
});

describe("performance", () => {
  it("classifyLegs runs in <3ms per call (averaged over 1000 iterations)", () => {
    const config = getClassifierConfig("bow-stance")!;
    const pose = gongbuPose("left");
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      classifyLegs(pose, config, "bow-stance");
    }
    const elapsed = performance.now() - start;
    const perCall = elapsed / 1000;
    expect(perCall).toBeLessThan(3);
  });
});

describe("method result breakdown", () => {
  it("includes per-method vote for debug inspection", () => {
    const result = classifyLegs(
      gongbuPose("left"),
      getClassifierConfig("bow-stance")!,
      "bow-stance",
    );
    expect(result.methodResults.length).toBeGreaterThan(0);
    // Knee-angle method should be present and confident for a clear gongbu.
    const kneeVote = result.methodResults.find((m) => m.method === "knee-angle");
    expect(kneeVote).toBeDefined();
    expect(kneeVote!.confidence).toBeGreaterThan(0.3);
  });
});

describe("contract: never returns null roles from classifyLegs", () => {
  it("always returns concrete LegRole values on both sides, even when ambiguous", () => {
    const cases: LegClassification[] = [
      classifyLegs(uprightSymmetric(), getClassifierConfig("bow-stance")!, "bow-stance"),
      classifyLegs(mabuSymmetric(), getClassifierConfig("crouch-stance")!, "crouch-stance"),
      classifyLegs(blankPose(), getClassifierConfig("empty-stance")!, "empty-stance"),
    ];
    for (const c of cases) {
      expect(["front", "back", "bent", "extended"]).toContain(c.left);
      expect(["front", "back", "bent", "extended"]).toContain(c.right);
    }
  });
});
