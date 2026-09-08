import assert from "node:assert/strict";
import test from "node:test";

import type {
  ProgressPhoto,
  ProgressPhotoAlignment,
  ProgressPhotoPoseData,
} from "../types";
import {
  updateProgressPhotoAlignment,
  updateProgressPhotoPoseMetadata,
} from "./progress-photo-records";

const existingAlignment: ProgressPhotoAlignment = {
  referencePhotoId: "reference-photo",
  translateX: 0,
  translateY: 0,
  scale: 1,
  rotationRadians: 0,
  confidence: 1,
  version: 1,
};

const poseData: ProgressPhotoPoseData = {
  model: "test-pose-model",
  modelVersion: 1,
  landmarks: [
    { name: "left_hip", x: 0.45, y: 0.6, confidence: 0.92 },
    { name: "right_hip", x: 0.55, y: 0.6, confidence: 0.91 },
  ],
  imageWidth: 1200,
  imageHeight: 1600,
  overallConfidence: 0.915,
};

function createPhoto(): ProgressPhoto {
  return {
    id: "photo",
    uri: "file:///photo.jpg",
    capturedAt: new Date("2026-07-29T08:00:00.000Z"),
    poseGroupId: null,
    referencePhotoId: null,
    poseData: null,
    alignment: existingAlignment,
    automaticAlignment: existingAlignment,
    alignmentStatus: "automatic",
  };
}

test("updates pose metadata without changing alignment", () => {
  const original = createPhoto();
  const result = updateProgressPhotoPoseMetadata([original], {
    id: original.id,
    poseGroupId: "pose-group",
    referencePhotoId: null,
    poseData,
  });

  assert.equal(result.updatedPhoto?.poseGroupId, "pose-group");
  assert.deepEqual(result.updatedPhoto?.poseData, poseData);
  assert.deepEqual(result.updatedPhoto?.alignment, existingAlignment);
  assert.equal(original.poseData, null);
});

test("updates alignment without changing pose metadata", () => {
  const original: ProgressPhoto = {
    ...createPhoto(),
    poseGroupId: "pose-group",
    poseData,
  };
  const updatedAlignment = {
    ...existingAlignment,
    translateX: 0.04,
    confidence: 0.86,
  };
  const result = updateProgressPhotoAlignment([original], {
    id: original.id,
    alignment: updatedAlignment,
    alignmentStatus: "manual",
  });

  assert.deepEqual(result.updatedPhoto?.alignment, updatedAlignment);
  assert.deepEqual(result.updatedPhoto?.automaticAlignment, existingAlignment);
  assert.equal(result.updatedPhoto?.alignmentStatus, "manual");
  assert.equal(result.updatedPhoto?.poseGroupId, "pose-group");
  assert.deepEqual(result.updatedPhoto?.poseData, poseData);
});

test("does not modify records when the photo is missing", () => {
  const original = createPhoto();
  const result = updateProgressPhotoAlignment([original], {
    id: "missing-photo",
    alignment: null,
    alignmentStatus: "unavailable",
  });

  assert.equal(result.updatedPhoto, null);
  assert.equal(result.photos[0], original);
});

test("removes active alignment without discarding the automatic baseline", () => {
  const original = createPhoto();
  const result = updateProgressPhotoAlignment([original], {
    id: original.id,
    alignment: null,
    alignmentStatus: "unavailable",
  });

  assert.equal(result.updatedPhoto?.alignment, null);
  assert.equal(result.updatedPhoto?.alignmentStatus, "unavailable");
  assert.deepEqual(result.updatedPhoto?.automaticAlignment, existingAlignment);
});
