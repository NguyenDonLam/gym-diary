import assert from "node:assert/strict";
import test from "node:test";

import type {
  ProgressPhoto,
  ProgressPhotoAlignment,
  ProgressPhotoPoseData,
} from "../types";
import { progressPhotoComparisonConfig as config } from "./progress-photo-comparison.config";
import {
  formatProgressPhotoElapsedTime,
  getProgressPhotoPairCandidates,
  getProgressPhotoPairNavigation,
  getProgressPhotoViewportSize,
  getProgressPhotoViewportTransform,
  progressPhotoComparisonMapper,
  selectDefaultProgressPhotoPairId,
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
    automaticAlignment: null,
    alignmentStatus: "unavailable",
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

test("identifies a manually adjusted alignment", () => {
  const reference = createPhoto("reference");
  const current = createPhoto("current", {
    referencePhotoId: reference.id,
    alignment: createAlignment(reference.id),
    automaticAlignment: createAlignment(reference.id, {
      translateX: 0.01,
    }),
    alignmentStatus: "manual",
  });

  const [, viewModel] = progressPhotoComparisonMapper.fromPhotos([
    reference,
    current,
  ]);

  assert.equal(viewModel.alignmentState, "manual");
  assert.equal(viewModel.alignmentStatusLabel, "Manually aligned");
  assert.notEqual(viewModel.automaticRenderTransform, null);
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

test("offers comparison candidates only from the selected pose group", () => {
  const selected = createPhoto("selected", {
    capturedAt: new Date("2026-07-20T10:00:00.000Z"),
  });
  const sameGroup = createPhoto("same-group", {
    capturedAt: new Date("2026-07-10T10:00:00.000Z"),
  });
  const otherGroup = createPhoto("other-group", {
    poseGroupId: "other",
  });
  const ungrouped = createPhoto("ungrouped", {
    poseGroupId: null,
    poseData: null,
  });
  const viewModels = progressPhotoComparisonMapper.fromPhotos([
    selected,
    sameGroup,
    otherGroup,
    ungrouped,
  ]);

  assert.deepEqual(
    getProgressPhotoPairCandidates(viewModels, selected.id).map(
      (photo) => photo.id,
    ),
    [sameGroup.id],
  );
  assert.deepEqual(
    getProgressPhotoPairCandidates(viewModels, ungrouped.id),
    [],
  );
});

test("defaults to the closest earlier photo in the pose group", () => {
  const selected = createPhoto("selected", {
    capturedAt: new Date("2026-07-20T10:00:00.000Z"),
  });
  const oldest = createPhoto("oldest", {
    capturedAt: new Date("2026-07-01T10:00:00.000Z"),
  });
  const closestEarlier = createPhoto("closest-earlier", {
    capturedAt: new Date("2026-07-18T10:00:00.000Z"),
  });
  const newer = createPhoto("newer", {
    capturedAt: new Date("2026-07-25T10:00:00.000Z"),
  });
  const viewModels = progressPhotoComparisonMapper.fromPhotos([
    selected,
    oldest,
    closestEarlier,
    newer,
  ]);

  assert.equal(
    selectDefaultProgressPhotoPairId(viewModels, selected.id),
    closestEarlier.id,
  );
});

test("navigates comparison photos chronologically within the pose group", () => {
  const selected = createPhoto("selected", {
    capturedAt: new Date("2026-07-20T10:00:00.000Z"),
  });
  const first = createPhoto("first", {
    capturedAt: new Date("2026-07-01T10:00:00.000Z"),
  });
  const second = createPhoto("second", {
    capturedAt: new Date("2026-07-10T10:00:00.000Z"),
  });
  const third = createPhoto("third", {
    capturedAt: new Date("2026-07-15T10:00:00.000Z"),
  });
  const viewModels = progressPhotoComparisonMapper.fromPhotos([
    selected,
    third,
    first,
    second,
  ]);

  assert.deepEqual(
    getProgressPhotoPairNavigation(viewModels, selected.id, second.id),
    {
      previousPhotoId: first.id,
      nextPhotoId: third.id,
    },
  );
});

test("formats the elapsed time between both selected photos", () => {
  const start = new Date("2026-07-01T10:00:00.000Z").getTime();

  assert.equal(
    formatProgressPhotoElapsedTime(start, start + 90 * 60_000),
    "2 hours apart",
  );
  assert.equal(
    formatProgressPhotoElapsedTime(start, start + 14 * 86_400_000),
    "14 days apart",
  );
});
