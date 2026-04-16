import type { StanceAngleConfig } from "./types";

/**
 * Reference angle configs for each practicable stance technique.
 *
 * MediaPipe Pose landmark indices:
 *   11: left shoulder   12: right shoulder
 *   23: left hip        24: right hip
 *   25: left knee       26: right knee
 *   27: left ankle      28: right ankle
 */
export const STANCE_ANGLES: Record<string, StanceAngleConfig> = {
  "horse-stance": {
    techniqueId: "horse-stance",
    angles: [
      {
        label: "Left Knee",
        landmarks: [23, 25, 27],
        target: 90,
        tolerance: 15,
        feedback_low: "Sink lower into your horse stance",
        feedback_high: "Don't over-bend — keep thighs parallel",
      },
      {
        label: "Right Knee",
        landmarks: [24, 26, 28],
        target: 90,
        tolerance: 15,
        feedback_low: "Sink lower into your horse stance",
        feedback_high: "Don't over-bend — keep thighs parallel",
      },
      {
        label: "Torso",
        landmarks: [12, 24, 26], // placeholder — evaluated via isTorsoLean
        target: 0,
        tolerance: 10,
        feedback_low: "Straighten your back",
        feedback_high: "Leaning too far back",
        isTorsoLean: true,
      },
    ],
  },

  "bow-stance": {
    techniqueId: "bow-stance",
    angles: [
      {
        label: "Front Knee",
        landmarks: [23, 25, 27],
        target: 90,
        tolerance: 15,
        feedback_low: "Bend your front knee more",
        feedback_high: "Knee too far forward",
      },
      {
        label: "Back Knee",
        landmarks: [24, 26, 28],
        target: 175,
        tolerance: 10,
        feedback_low: "Straighten your back leg",
        feedback_high: "Back leg is fine",
      },
    ],
  },

  "empty-stance": {
    techniqueId: "empty-stance",
    angles: [
      {
        label: "Back Knee",
        landmarks: [24, 26, 28],
        target: 100,
        tolerance: 15,
        feedback_low: "Sit deeper on your back leg",
        feedback_high: "Too deep — keep control",
      },
    ],
  },

  "crouch-stance": {
    techniqueId: "crouch-stance",
    angles: [
      {
        label: "Bent Knee",
        landmarks: [23, 25, 27],
        target: 45,
        tolerance: 10,
        feedback_low: "Go deeper into the squat",
        feedback_high: "Rising too high",
      },
      {
        label: "Extended Knee",
        landmarks: [24, 26, 28],
        target: 175,
        tolerance: 10,
        feedback_low: "Straighten your extended leg fully",
        feedback_high: "Extended leg is fine",
      },
    ],
  },

  "rest-stance": {
    techniqueId: "rest-stance",
    angles: [
      {
        label: "Front Knee",
        landmarks: [23, 25, 27],
        target: 60,
        tolerance: 15,
        feedback_low: "Cross deeper",
        feedback_high: "Too low",
      },
      {
        label: "Rear Knee",
        landmarks: [24, 26, 28],
        target: 60,
        tolerance: 15,
        feedback_low: "Cross deeper",
        feedback_high: "Too low",
      },
    ],
  },
};
