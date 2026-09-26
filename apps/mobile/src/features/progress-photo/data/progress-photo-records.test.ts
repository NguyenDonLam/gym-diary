import assert from "node:assert/strict";
import test from "node:test";

import type {
  ProgressPhoto,
  ProgressPhotoAlignment,
  ProgressPhotoPoseData,
} from "../types";
import {
  deleteProgressPhoto,
  updateProgressPhotoAlignment,
  updateProgressPhotoPoseMetadata,
} from "./progress-photo-records";

test("deleting a reference clears dependent alignments but keeps photos and pose data", () => {
  const reference = { ...createPhoto(), id: "reference-photo" };
  const dependent = {
    ...createPhoto(),
    referencePhotoId: reference.id,
    poseData,
    poseGroupId: "group",
  };
  const unrelated = {
    ...createPhoto(),
    id: "unrelated",
    alignment: null,
    automaticAlignment: null,
  };
  const result = deleteProgressPhoto(
    [reference, dependent, unrelated],
    reference.id,
  );
  assert.deepEqual(
    result.map((photo) => photo.id),
    ["photo", "unrelated"],
  );
  assert.equal(result[0].alignment, null);
  assert.equal(result[0].automaticAlignment, null);
  assert.equal(result[0].alignmentStatus, "unavailable");
  assert.equal(result[0].poseData, poseData);
  assert.equal(result[0].poseGroupId, "group");
  assert.equal(result[1], unrelated);
  assert.equal(dependent.alignment, existingAlignment);
});

test("deleting an automatic baseline preserves alignment to a different reference", () => {
  const photo = {
    ...createPhoto(),
    alignment: { ...existingAlignment, referencePhotoId: "other" },
    alignmentStatus: "manual" as const,
  };
  const [result] = deleteProgressPhoto([photo], "reference-photo");
  assert.equal(result.alignment, photo.alignment);
  assert.equal(result.alignmentStatus, "manual");
  assert.equal(result.automaticAlignment, null);
});

test("deleting the final photo returns an empty collection and retries are safe", () => {
  assert.deepEqual(deleteProgressPhoto([createPhoto()], "photo"), []);
  assert.deepEqual(deleteProgressPhoto([], "photo"), []);
  const photo = createPhoto();
  assert.equal(deleteProgressPhoto([photo], "unknown")[0], photo);
});

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
