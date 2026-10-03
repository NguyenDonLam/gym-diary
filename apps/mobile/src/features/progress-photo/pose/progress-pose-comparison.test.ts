import assert from "node:assert/strict";
import test from "node:test";

import {
  compareProgressPoses,
  type ComparablePose,
  type PoseComparisonLandmark,
  type PoseMatchResult,
} from "./progress-pose-comparison";

const BASE_LANDMARKS: PoseComparisonLandmark[] = [
  { name: "nose", x: 0.5, y: 0.1, confidence: 0.95 },
  { name: "left_eye", x: 0.47, y: 0.08, confidence: 0.9 },
  { name: "right_eye", x: 0.53, y: 0.08, confidence: 0.9 },
  { name: "left_ear", x: 0.43, y: 0.11, confidence: 0.9 },
  { name: "right_ear", x: 0.57, y: 0.11, confidence: 0.9 },
  { name: "left_shoulder", x: 0.38, y: 0.28, confidence: 0.95 },
  { name: "right_shoulder", x: 0.62, y: 0.28, confidence: 0.95 },
  { name: "left_elbow", x: 0.28, y: 0.42, confidence: 0.9 },
  { name: "right_elbow", x: 0.72, y: 0.36, confidence: 0.9 },
  { name: "left_wrist", x: 0.22, y: 0.58, confidence: 0.85 },
  { name: "right_wrist", x: 0.78, y: 0.24, confidence: 0.85 },
  { name: "left_hip", x: 0.42, y: 0.55, confidence: 0.95 },
  { name: "right_hip", x: 0.58, y: 0.55, confidence: 0.95 },
  { name: "left_knee", x: 0.4, y: 0.75, confidence: 0.9 },
  { name: "right_knee", x: 0.61, y: 0.72, confidence: 0.9 },
  { name: "left_ankle", x: 0.38, y: 0.95, confidence: 0.85 },
  { name: "right_ankle", x: 0.65, y: 0.91, confidence: 0.85 },
];

function pose(
  transform: (landmark: PoseComparisonLandmark) => PoseComparisonLandmark = (
    landmark,
  ) => ({ ...landmark }),
): ComparablePose {
  return { landmarks: BASE_LANDMARKS.map(transform) };
}

function transformAroundCenter(
  landmark: PoseComparisonLandmark,
  {
    translateX = 0,
    translateY = 0,
    scale = 1,
    rotationRadians = 0,
  }: {
    translateX?: number;
    translateY?: number;
    scale?: number;
    rotationRadians?: number;
  },
) {
  const centeredX = (landmark.x - 0.5) * scale;
  const centeredY = (landmark.y - 0.5) * scale;
  const cosine = Math.cos(rotationRadians);
  const sine = Math.sin(rotationRadians);

  return {
    ...landmark,
    x: 0.5 + centeredX * cosine - centeredY * sine + translateX,
    y: 0.5 + centeredX * sine + centeredY * cosine + translateY,
  };
}

function assertScoresAreNormalized(result: PoseMatchResult) {
  for (const score of [
    result.poseScore,
    result.framingScore,
    result.visibilityScore,
    result.overallScore,
  ]) {
    assert.ok(score >= 0 && score <= 1);
  }
}

test("identical poses receive perfect scores and can hold still", () => {
  const result = compareProgressPoses(pose(), pose());

  assert.equal(result.poseScore, 1);
  assert.equal(result.framingScore, 1);
  assert.equal(result.visibilityScore, 1);
  assert.equal(result.overallScore, 1);
  assert.equal(result.stabilityEligible, true);
  assert.deepEqual(result.instructions, ["hold_still"]);
});

test("translation changes framing without changing body pose", () => {
  const current = pose((landmark) =>
    transformAroundCenter(landmark, { translateX: 0.12, translateY: -0.08 }),
  );
  const result = compareProgressPoses(pose(), current);

  assert.ok(result.poseScore > 0.99);
  assert.ok(result.framingScore < 0.8);
  assert.ok(result.instructions.includes("move_left"));
  assert.ok(result.instructions.includes("move_down"));
});

test("scale changes framing without changing body pose", () => {
  const current = pose((landmark) =>
    transformAroundCenter(landmark, { scale: 0.72 }),
  );
  const result = compareProgressPoses(pose(), current);

  assert.ok(result.poseScore > 0.99);
  assert.ok(result.framingScore < 0.8);
  assert.ok(result.instructions.includes("move_closer"));
});

test("small global rotation remains a strong pose match", () => {
  const current = pose((landmark) =>
    transformAroundCenter(landmark, {
      rotationRadians: (6 * Math.PI) / 180,
    }),
  );
  const result = compareProgressPoses(pose(), current);

  assert.ok(result.poseScore > 0.98);
  assert.ok(result.framingScore > 0.8);
  assert.equal(result.failureReason, undefined);
});

test("a changed arm position lowers pose score", () => {
  const current = pose((landmark) => {
    if (landmark.name === "right_elbow") {
      return { ...landmark, x: 0.58, y: 0.43 };
    }
    if (landmark.name === "right_wrist") {
      return { ...landmark, x: 0.5, y: 0.58 };
    }
    return { ...landmark };
  });
  const result = compareProgressPoses(pose(), current);

  assert.ok(result.poseScore < 0.82);
  assert.ok(result.instructions.includes("adjust_pose"));
});

test("a missing wrist is tolerated and reduces visibility slightly", () => {
  const current = {
    landmarks: BASE_LANDMARKS.filter(
      (landmark) => landmark.name !== "left_wrist",
    ),
  };
  const result = compareProgressPoses(pose(), current);

  assert.equal(result.failureReason, undefined);
  assert.equal(result.commonLandmarkCount, 16);
  assert.ok(result.poseScore > 0.95);
  assert.ok(result.visibilityScore > 0.9 && result.visibilityScore < 1);
});

test("missing leg landmarks are compared using the remaining reliable body", () => {
  const current = {
    landmarks: BASE_LANDMARKS.filter(
      (landmark) =>
        !landmark.name.includes("knee") && !landmark.name.includes("ankle"),
    ),
  };
  const result = compareProgressPoses(pose(), current);

  assert.equal(result.failureReason, undefined);
  assert.equal(result.commonLandmarkCount, 13);
  assert.ok(result.poseScore > 0.95);
  assert.ok(result.visibilityScore > 0.7);
});

test("low-confidence points are excluded from the common landmark set", () => {
  const current = pose((landmark) =>
    landmark.name.includes("wrist")
      ? { ...landmark, confidence: 0.1 }
      : { ...landmark },
  );
  const result = compareProgressPoses(pose(), current);

  assert.equal(result.commonLandmarkCount, 15);
  assert.equal(result.failureReason, undefined);
  assert.ok(result.poseScore > 0.95);
  assert.ok(result.visibilityScore < 1);
});

test("mirrored coordinates do not swap left and right landmark identities", () => {
  const mirrored = pose((landmark) => ({
    ...landmark,
    x: 1 - landmark.x,
  }));
  const result = compareProgressPoses(pose(), mirrored);

  assert.ok(result.poseScore < 0.82);
  assert.equal(result.stabilityEligible, false);
});

test("invalid numeric data returns a clear failure", () => {
  const invalid = pose((landmark) =>
    landmark.name === "nose" ? { ...landmark, x: Number.NaN } : landmark,
  );
  const result = compareProgressPoses(pose(), invalid);

  assert.equal(result.failureReason, "invalid_current_pose");
  assert.equal(result.stabilityEligible, false);
  assertScoresAreNormalized(result);
});

test("too few common landmarks returns an insufficient visibility failure", () => {
  const current = {
    landmarks: BASE_LANDMARKS.filter((landmark) =>
      [
        "left_shoulder",
        "right_shoulder",
        "left_hip",
        "right_hip",
        "nose",
      ].includes(landmark.name),
    ),
  };
  const result = compareProgressPoses(pose(), current);

  assert.equal(result.failureReason, "insufficient_common_landmarks");
  assert.equal(result.commonLandmarkCount, 5);
  assertScoresAreNormalized(result);
});

test("a substantially different pose does not match", () => {
  const current = pose((landmark) => {
    const replacements: Record<string, { x: number; y: number }> = {
      left_elbow: { x: 0.48, y: 0.3 },
      left_wrist: { x: 0.62, y: 0.18 },
      right_elbow: { x: 0.52, y: 0.46 },
      right_wrist: { x: 0.36, y: 0.62 },
      left_knee: { x: 0.55, y: 0.72 },
      left_ankle: { x: 0.68, y: 0.86 },
      right_knee: { x: 0.44, y: 0.75 },
      right_ankle: { x: 0.3, y: 0.9 },
    };
    return replacements[landmark.name]
      ? { ...landmark, ...replacements[landmark.name] }
      : { ...landmark };
  });
  const result = compareProgressPoses(pose(), current);

  assert.ok(result.poseScore < 0.65);
  assert.ok(result.overallScore < 0.8);
  assert.equal(result.stabilityEligible, false);
  assert.ok(result.instructions.includes("adjust_pose"));
  assertScoresAreNormalized(result);
});
