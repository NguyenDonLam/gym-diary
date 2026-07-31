import assert from "node:assert/strict";
import test from "node:test";

import { createPoseDataForCapture } from "./progress-pose-capture";
import { PROGRESS_POSE_MODEL } from "./progress-pose-model-metadata";
import type {
  DetectedPose,
  PoseLandmark,
} from "./progress-pose-detector.types";

const LANDMARK_NAMES = [
  "nose",
  "left_eye",
  "right_eye",
  "left_ear",
  "right_ear",
  "left_shoulder",
  "right_shoulder",
  "left_elbow",
  "right_elbow",
  "left_wrist",
  "right_wrist",
  "left_hip",
  "right_hip",
  "left_knee",
  "right_knee",
  "left_ankle",
  "right_ankle",
] as const;

function createLandmarks(confidence = 0.9): PoseLandmark[] {
  return LANDMARK_NAMES.map((name, index) => ({
    name,
    x: 0.25 + index * 0.02,
    y: 0.1 + index * 0.04,
    confidence,
  }));
}

function createPose(overrides: Partial<DetectedPose> = {}): DetectedPose {
  return {
    landmarks: createLandmarks(),
    overallConfidence: 0.9,
    sourceWidth: 1080,
    sourceHeight: 1920,
    timestampMs: 1_000,
    ...overrides,
  };
}

test("creates persisted pose data for a valid pose nearest the shutter", () => {
  const result = createPoseDataForCapture({
    pose: createPose(),
    shutterTimestampMs: 1_200,
    imageWidth: 3024,
    imageHeight: 4032,
  });

  assert.equal(result?.model, PROGRESS_POSE_MODEL.name);
  assert.equal(result?.modelVersion, PROGRESS_POSE_MODEL.version);
  assert.equal(result?.imageWidth, 3024);
  assert.equal(result?.imageHeight, 4032);
  assert.equal(result?.landmarks.length, 17);
});

test("rejects a stale pose", () => {
  const result = createPoseDataForCapture({
    pose: createPose(),
    shutterTimestampMs: 1_351,
    imageWidth: 3024,
    imageHeight: 4032,
  });

  assert.equal(result, null);
});

test("accepts a missing pose and saves without metadata", () => {
  const result = createPoseDataForCapture({
    pose: null,
    shutterTimestampMs: 1_200,
    imageWidth: 3024,
    imageHeight: 4032,
  });

  assert.equal(result, null);
});

test("rejects low-confidence pose data", () => {
  const result = createPoseDataForCapture({
    pose: createPose({ overallConfidence: 0.24 }),
    shutterTimestampMs: 1_200,
    imageWidth: 3024,
    imageHeight: 4032,
  });

  assert.equal(result, null);
});

test("rejects a pose when a required torso landmark is not visible", () => {
  const landmarks = createLandmarks().map((landmark) =>
    landmark.name === "left_hip" ? { ...landmark, confidence: 0.19 } : landmark,
  );
  const result = createPoseDataForCapture({
    pose: createPose({ landmarks }),
    shutterTimestampMs: 1_200,
    imageWidth: 3024,
    imageHeight: 4032,
  });

  assert.equal(result, null);
});

test("rejects a pose without enough visible landmarks", () => {
  const landmarks = createLandmarks(0.19).map((landmark) =>
    ["left_shoulder", "right_shoulder", "left_hip", "right_hip"].includes(
      landmark.name,
    )
      ? { ...landmark, confidence: 0.9 }
      : landmark,
  );
  const result = createPoseDataForCapture({
    pose: createPose({ landmarks }),
    shutterTimestampMs: 1_200,
    imageWidth: 3024,
    imageHeight: 4032,
  });

  assert.equal(result, null);
});
