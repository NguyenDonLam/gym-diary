import assert from "node:assert/strict";
import test from "node:test";

import type {
  ProgressPhoto,
  ProgressPhotoAlignment,
  ProgressPhotoPoseData,
} from "../types";
import { progressPhotoComparisonConfig as config } from "./progress-photo-comparison.config";
import {
  getProgressPhotoViewportSize,
  getProgressPhotoViewportTransform,
  progressPhotoComparisonMapper,
} from "./progress-photo-comparison.mapper";

function assertClose(actual: number, expected: number, tolerance = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

const poseData: ProgressPhotoPoseData = {
  model: "test",
  modelVersion: 1,
  landmarks: [],
  imageWidth: 1200,
  imageHeight: 1600,
  overallConfidence: 0.9,
};

function createPhoto(
  id: string,
  overrides: Partial<ProgressPhoto> = {},
): ProgressPhoto {
  return {
    id,
    uri: `file:///${id}.jpg`,
    capturedAt: new Date("2026-07-01T10:00:00.000Z"),
    poseGroupId: "group",
    referencePhotoId: null,
    poseData,
    alignment: null,
    ...overrides,
  };
}

function createAlignment(
  referencePhotoId: string,
  overrides: Partial<ProgressPhotoAlignment> = {},
): ProgressPhotoAlignment {
  return {
    referencePhotoId,
    translateX: 0.04,
    translateY: -0.03,
    scale: 1.08,
    rotationRadians: 0.04,
    confidence: 0.9,
    version: 1,
    ...overrides,
  };
}

test("maps a reference image to the fixed comparison basis", () => {
  const reference = createPhoto("reference", {
    alignment: createAlignment("reference", {
      translateX: 0,
      translateY: 0,
      scale: 1,
      rotationRadians: 0,
      confidence: 1,
    }),
  });

  const [viewModel] = progressPhotoComparisonMapper.fromPhotos([reference]);

  assert.equal(viewModel.alignmentState, "reference");
  assert.equal(viewModel.referencePhotoId, "reference");
  assert.deepEqual(viewModel.renderTransform, {
    translateX: 0,
    translateY: 0,
    scale: 1,
    rotationRadians: 0,
  });
});

test("maps a successfully aligned image against its existing reference", () => {
  const reference = createPhoto("reference");
  const current = createPhoto("current", {
    referencePhotoId: reference.id,
    alignment: createAlignment(reference.id),
    poseData: { ...poseData, imageWidth: 3024, imageHeight: 4032 },
  });

  const [, viewModel] = progressPhotoComparisonMapper.fromPhotos([
    reference,
    current,
  ]);

  assert.equal(viewModel.alignmentState, "aligned");
  assert.equal(viewModel.alignmentStatusLabel, "Aligned to reference");
  assert.equal(viewModel.referencePhotoId, reference.id);
  assert.deepEqual(viewModel.renderTransform, {
    translateX: 0.04,
    translateY: -0.03,
    scale: 1.08,
    rotationRadians: 0.04,
  });
});

test("falls back to original framing without alignment metadata", () => {
  const photo = createPhoto("manual", {
    poseGroupId: null,
    poseData: null,
  });

  const [viewModel] = progressPhotoComparisonMapper.fromPhotos([photo]);

  assert.equal(viewModel.alignmentState, "unaligned");
  assert.equal(viewModel.renderTransform, null);
});

test("identifies low-confidence alignment without disabling it", () => {
  const reference = createPhoto("reference");
  const current = createPhoto("current", {
    referencePhotoId: reference.id,
    alignment: createAlignment(reference.id, {
      confidence: config.lowConfidenceThreshold - 0.01,
    }),
  });

  const [, viewModel] = progressPhotoComparisonMapper.fromPhotos([
    reference,
    current,
  ]);

  assert.equal(viewModel.alignmentState, "low_confidence");
  assert.notEqual(viewModel.renderTransform, null);
});

test("falls back when the stored reference photo is missing", () => {
  const current = createPhoto("current", {
    referencePhotoId: "deleted-reference",
    alignment: createAlignment("deleted-reference"),
  });

  const [viewModel] = progressPhotoComparisonMapper.fromPhotos([current]);

  assert.equal(viewModel.alignmentState, "missing_reference");
  assert.equal(viewModel.referencePhotoId, "deleted-reference");
  assert.equal(viewModel.renderTransform, null);
});

test("uses a fixed aspect viewport across available widths and device rotation", () => {
  const portrait = getProgressPhotoViewportSize(358);
  const landscape = getProgressPhotoViewportSize(700);

  assert.equal(portrait.width / portrait.height, config.viewportAspectRatio);
  assert.equal(landscape.width, config.maximumViewportWidth);
  assert.equal(landscape.width / landscape.height, config.viewportAspectRatio);
});

test("converts an origin-based transform to a center-based viewport transform", () => {
  const identity = getProgressPhotoViewportTransform(
    {
      translateX: 0,
      translateY: 0,
      scale: 1,
      rotationRadians: 0,
    },
    300,
    400,
  );

  assert.deepEqual(identity, {
    translateX: 0,
    translateY: 0,
    scale: 1,
    rotation: "0rad",
  });

  const translated = getProgressPhotoViewportTransform(
    {
      translateX: 0.1,
      translateY: -0.05,
      scale: 1,
      rotationRadians: 0,
    },
    300,
    400,
  );

  assertClose(translated.translateX, 30);
  assertClose(translated.translateY, -20);
});
