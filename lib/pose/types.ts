export type PoseLandmark = {
  x: number;
  y: number;
  z: number;
  visibility: number;
};

export type AngleSpec = {
  label: string;
  /** [a, vertex, c] MediaPipe landmark indices — angle measured at vertex */
  landmarks: [number, number, number];
  target: number;
  tolerance: number;
  feedback_low: string;
  feedback_high: string;
  /** Special handling flag for torso lean measurement */
  isTorsoLean?: boolean;
};

export type StanceAngleConfig = {
  techniqueId: string;
  angles: AngleSpec[];
};

export type AngleResult = {
  label: string;
  current: number;
  target: number;
  tolerance: number;
  /** Signed: negative = below target, positive = above target */
  delta: number;
  status: "green" | "yellow" | "red";
  feedback: string | null;
};

export type StanceEvaluation = {
  angles: AngleResult[];
  score: number;
  overallFeedback: string;
};

export type BodyPartStatus = {
  name: string;
  visible: boolean;
};

export type BodyVisibility = {
  ready: boolean;
  parts: BodyPartStatus[];
};

export type PracticeAttempt = {
  techniqueId: string;
  score: number;
  angles: Record<string, number>;
  duration: number;
  timestamp: number;
};
