import assert from "node:assert/strict";
import test from "node:test";

import type { NormalizedPoseLandmark, ProgressPhotoPoseData } from "../types";
import { progressPhotoAlignmentConfig as config } from "./progress-photo-alignment.config";
import {
  calculateProgressPhotoAlignment,
  createIdentityProgressPhotoAlignment,
} from "./progress-photo-alignment";

const BASE_LANDMARKS: NormalizedPoseLandmark[] = [
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
  landmarks: NormalizedPoseLandmark[] = BASE_LANDMARKS,
): ProgressPhotoPoseData {
  return {
    model: "test",
    modelVersion: 1,
    landmarks,
    imageWidth: 1000,
    imageHeight: 1500,
    overallConfidence: 0.9,
  };
}

function transformLandmarks(
  landmarks: NormalizedPoseLandmark[],
  {
    translateX,
    translateY,
    scale,
    rotationRadians,
  }: {
    translateX: number;
    translateY: number;
    scale: number;
    rotationRadians: number;
  },
) {
  const cosine = Math.cos(rotationRadians);
  const sine = Math.sin(rotationRadians);

  return landmarks.map((landmark) => ({
    ...landmark,
    x: scale * (landmark.x * cosine - landmark.y * sine) + translateX,
    y: scale * (landmark.x * sine + landmark.y * cosine) + translateY,
  }));
}

function assertClose(actual: number, expected: number, tolerance = 0.001) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

test("creates an identity transform for a reference photo", () => {
  assert.deepEqual(createIdentityProgressPhotoAlignment("reference"), {
    referencePhotoId: "reference",
    translateX: 0,
    translateY: 0,
    scale: 1,
    rotationRadians: 0,
    confidence: 1,
    version: config.version,
  });
});

test("recovers a known translation, scale, and rotation", () => {
  const expected = {
    translateX: 0.015,
    translateY: -0.025,
    scale: 1.04,
    rotationRadians: 0.05,
  };
  const alignment = calculateProgressPhotoAlignment(
    "reference",
    pose(transformLandmarks(BASE_LANDMARKS, expected)),
    pose(),
  );

  assert.ok(alignment);
  assertClose(alignment.translateX, expected.translateX);
  assertClose(alignment.translateY, expected.translateY);
  assertClose(alignment.scale, expected.scale);
  assertClose(alignment.rotationRadians, expected.rotationRadians);
  assert.ok(alignment.confidence > 0.9);
});

test("remains stable with small deterministic landmark noise", () => {
  const expected = {
    translateX: -0.01,
    translateY: 0.015,
    scale: 0.96,
    rotationRadians: -0.04,
  };
  const noisyReference = transformLandmarks(BASE_LANDMARKS, expected).map(
    (landmark, index) => ({
      ...landmark,
      x: landmark.x + (index % 2 === 0 ? 0.0015 : -0.0015),
      y: landmark.y + (index % 3 === 0 ? -0.001 : 0.001),
    }),
  );
  const alignment = calculateProgressPhotoAlignment(
    "reference",
    pose(noisyReference),
    pose(),
  );

  assert.ok(alignment);
  assertClose(alignment.scale, expected.scale, 0.01);
  assertClose(alignment.rotationRadians, expected.rotationRadians, 0.01);
  assert.ok(alignment.confidence > 0.8);
});

test("fits a transform when non-torso landmarks are missing", () => {
  const retainedNames = new Set([
    "left_shoulder",
    "right_shoulder",
    "left_hip",
    "right_hip",
    "left_elbow",
    "right_elbow",
    "left_knee",
    "right_knee",
  ]);
  const current = BASE_LANDMARKS.filter((landmark) =>
    retainedNames.has(landmark.name),
  );
  const expected = {
    translateX: 0.02,
    translateY: -0.01,
    scale: 1.02,
    rotationRadians: 0.03,
  };
  const alignment = calculateProgressPhotoAlignment(
    "reference",
    pose(transformLandmarks(current, expected)),
    pose(current),
  );

  assert.ok(alignment);
  assertClose(alignment.scale, expected.scale);
  assertClose(alignment.rotationRadians, expected.rotationRadians);
});

test("rejects an extreme wrist outlier before the final fit", () => {
  const expected = {
    translateX: 0.01,
    translateY: -0.015,
    scale: 1.03,
    rotationRadians: 0.04,
  };
  const reference = transformLandmarks(BASE_LANDMARKS, expected).map(
    (landmark) =>
      landmark.name === "right_wrist"
        ? { ...landmark, x: 0.05, y: 0.95 }
        : landmark,
  );
  const alignment = calculateProgressPhotoAlignment(
    "reference",
    pose(reference),
    pose(),
  );

  assert.ok(alignment);
  assertClose(alignment.scale, expected.scale, 0.01);
  assertClose(alignment.rotationRadians, expected.rotationRadians, 0.01);
});

test("clamps scale and rotation to configured bounds", () => {
  const torso = BASE_LANDMARKS.filter(
    (landmark) =>
      landmark.name.includes("shoulder") || landmark.name.includes("hip"),
  );
  const expected = {
    translateX: -0.275,
    translateY: -0.275,
    scale: 1.55,
    rotationRadians: (18 * Math.PI) / 180,
  };
  const alignment = calculateProgressPhotoAlignment(
    "reference",
    pose(transformLandmarks(torso, expected)),
    pose(torso),
  );

  assert.ok(alignment);
  assert.equal(alignment.scale, config.maximumScale);
  assert.equal(alignment.rotationRadians, config.maximumRotationRadians);
});

test("returns no transform with too few reliable points", () => {
  const insufficient = BASE_LANDMARKS.filter((landmark) =>
    ["left_shoulder", "right_shoulder", "left_hip"].includes(landmark.name),
  );

  assert.equal(
    calculateProgressPhotoAlignment(
      "reference",
      pose(insufficient),
      pose(insufficient),
    ),
    null,
  );
});
