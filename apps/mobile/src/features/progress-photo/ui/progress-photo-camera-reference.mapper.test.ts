import assert from "node:assert/strict";
import test from "node:test";

import type { ProgressPhoto, ProgressPhotoPoseData } from "../types";
import {
  progressPhotoCameraReferenceMapper,
  selectDefaultProgressPhotoCameraReferenceId,
} from "./progress-photo-camera-reference.mapper";

const poseData: ProgressPhotoPoseData = {
  model: "test",
  modelVersion: 1,
  landmarks: [],
  imageWidth: 100,
  imageHeight: 200,
  overallConfidence: 0.9,
};

function photo(
  id: string,
  overrides: Partial<ProgressPhoto> = {},
): ProgressPhoto {
  return {
    id,
    uri: `file:///${id}.jpg`,
    capturedAt: new Date("2026-01-01T00:00:00.000Z"),
    poseGroupId: null,
    referencePhotoId: null,
    poseData: null,
    alignment: null,
    ...overrides,
  };
}

test("maps only root photos belonging to pose groups as references", () => {
  const references = progressPhotoCameraReferenceMapper.fromPhotos([
    photo("valid-root", { poseGroupId: "group-a", poseData }),
    photo("missing-pose-root", { poseGroupId: "group-b" }),
    photo("later-photo", {
      poseGroupId: "group-a",
      referencePhotoId: "valid-root",
      poseData,
    }),
    photo("legacy-photo"),
  ]);

  assert.deepEqual(
    references.map((reference) => reference.id),
    ["valid-root", "missing-pose-root"],
  );
});

test("defaults to the most recent reference with pose data", () => {
  const references = progressPhotoCameraReferenceMapper.fromPhotos([
    photo("newest-missing", { poseGroupId: "group-b" }),
    photo("newest-valid", { poseGroupId: "group-a", poseData }),
    photo("older-valid", { poseGroupId: "group-c", poseData }),
  ]);

  assert.equal(
    selectDefaultProgressPhotoCameraReferenceId(references),
    "newest-valid",
  );
});
