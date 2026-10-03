import assert from "node:assert/strict";
import test from "node:test";

import type {
  ProgressPhoto,
  ProgressPhotoAlignment,
  ProgressPhotoPoseData,
} from "../types";
import { progressPhotoPersistenceMapper } from "./progress-photo-persistence.mapper";

const poseData: ProgressPhotoPoseData = {
  model: "test-pose-model",
  modelVersion: 1,
  landmarks: [
    { name: "left_shoulder", x: 0.4, y: 0.3, confidence: 0.95 },
    { name: "right_shoulder", x: 0.6, y: 0.3, confidence: 0.94 },
  ],
  imageWidth: 1200,
  imageHeight: 1600,
  overallConfidence: 0.945,
};

const alignment: ProgressPhotoAlignment = {
  referencePhotoId: "reference-photo",
  translateX: 0.02,
  translateY: -0.03,
  scale: 1.04,
  rotationRadians: 0.01,
  confidence: 0.9,
  version: 1,
};

test("loads legacy photos with null pose and alignment metadata", () => {
  const photo = progressPhotoPersistenceMapper.fromStored({
    id: "legacy-photo",
    uri: "file:///legacy.jpg",
    capturedAt: "2026-07-29T08:00:00.000Z",
  });

  assert.deepEqual(photo, {
    id: "legacy-photo",
    uri: "file:///legacy.jpg",
    capturedAt: new Date("2026-07-29T08:00:00.000Z"),
    poseGroupId: null,
    referencePhotoId: null,
    poseData: null,
    alignment: null,
    automaticAlignment: null,
    alignmentStatus: "unavailable",
  });
});

test("round trips valid pose and alignment metadata", () => {
  const photo: ProgressPhoto = {
    id: "matched-photo",
    uri: "file:///matched.jpg",
    capturedAt: new Date("2026-07-29T09:00:00.000Z"),
    poseGroupId: "pose-group",
    referencePhotoId: "reference-photo",
    poseData,
    alignment,
    automaticAlignment: alignment,
    alignmentStatus: "automatic",
  };

  const stored = progressPhotoPersistenceMapper.toStored(photo);

  assert.deepEqual(progressPhotoPersistenceMapper.fromStored(stored), photo);
});

test("preserves a manual alignment and its automatic reset baseline", () => {
  const manualAlignment = {
    ...alignment,
    translateX: 0.08,
    scale: 1.1,
  };
  const photo: ProgressPhoto = {
    id: "manual-photo",
    uri: "file:///manual.jpg",
    capturedAt: new Date("2026-07-29T09:30:00.000Z"),
    poseGroupId: "pose-group",
    referencePhotoId: "reference-photo",
    poseData,
    alignment: manualAlignment,
    automaticAlignment: alignment,
    alignmentStatus: "manual",
  };

  assert.deepEqual(
    progressPhotoPersistenceMapper.fromStored(
      progressPhotoPersistenceMapper.toStored(photo),
    ),
    photo,
  );
});

test("keeps a valid photo while discarding malformed optional metadata", () => {
  const photo = progressPhotoPersistenceMapper.fromStored({
    id: "corrupt-metadata-photo",
    uri: "file:///photo.jpg",
    capturedAt: "2026-07-29T10:00:00.000Z",
    poseGroupId: 42,
    referencePhotoId: false,
    poseData: { ...poseData, overallConfidence: Number.NaN },
    alignment: { ...alignment, scale: Number.POSITIVE_INFINITY },
  });

  assert.equal(photo?.poseGroupId, null);
  assert.equal(photo?.referencePhotoId, null);
  assert.equal(photo?.poseData, null);
  assert.equal(photo?.alignment, null);
});
