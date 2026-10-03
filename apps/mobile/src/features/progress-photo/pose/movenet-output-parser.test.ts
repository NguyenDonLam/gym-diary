import assert from "node:assert/strict";
import test from "node:test";

import {
  MOVENET_LANDMARK_NAMES,
  parseMoveNetOutput,
  parseMoveNetOutputResult,
  type MoveNetParserOptions,
} from "./movenet-output-parser";

function createOutput(y = 0.5, x = 0.5, confidence = 0.9): number[] {
  return MOVENET_LANDMARK_NAMES.flatMap(() => [y, x, confidence]);
}

function createOptions(
  overrides: Partial<MoveNetParserOptions> = {},
): MoveNetParserOptions {
  return {
    sourceWidth: 192,
    sourceHeight: 192,
    modelWidth: 192,
    modelHeight: 192,
    orientation: "up",
    isMirrored: false,
    timestampMs: 1234,
    minimumLandmarkConfidence: 0.2,
    minimumOverallConfidence: 0.25,
    minimumVisibleLandmarkCount: 5,
    ...overrides,
  };
}

function assertClose(actual: number | undefined, expected: number) {
  assert.ok(
    actual !== undefined && Math.abs(actual - expected) < 0.000001,
    `Expected ${actual} to be close to ${expected}`,
  );
}

test("parses fixed MoveNet output into named normalized landmarks", () => {
  const output = createOutput();
  output[0] = 0.25;
  output[1] = 0.75;

  const pose = parseMoveNetOutput(output, createOptions());

  assert.equal(pose?.landmarks.length, 17);
  assert.deepEqual(pose?.landmarks[0], {
    name: "nose",
    x: 0.75,
    y: 0.25,
    confidence: 0.9,
  });
  assertClose(pose?.overallConfidence, 0.9);
  assert.equal(pose?.timestampMs, 1234);
});

test("removes contain-mode letterboxing", () => {
  const output = createOutput();
  output[0] = 0.25;
  output[1] = 0.5;

  const pose = parseMoveNetOutput(
    output,
    createOptions({ sourceWidth: 100, sourceHeight: 200 }),
  );

  assert.equal(pose?.landmarks[0]?.x, 0.5);
  assert.equal(pose?.landmarks[0]?.y, 0.25);
});

test("rotates coordinates upright and swaps source dimensions", () => {
  const output = createOutput();
  output[0] = 0.3;
  output[1] = 0.8;

  const pose = parseMoveNetOutput(
    output,
    createOptions({
      sourceWidth: 300,
      sourceHeight: 200,
      orientation: "right",
    }),
  );

  assertClose(pose?.landmarks[0]?.x, 0.2);
  assertClose(pose?.landmarks[0]?.y, 0.2);
  assert.equal(pose?.sourceWidth, 200);
  assert.equal(pose?.sourceHeight, 300);
});

test("mirrors normalized x coordinates consistently", () => {
  const output = createOutput();
  output[1] = 0.2;

  const pose = parseMoveNetOutput(output, createOptions({ isMirrored: true }));

  assertClose(pose?.landmarks[0]?.x, 0.8);
});

test("rejects non-finite output", () => {
  const output = createOutput();
  output[8] = Number.NaN;

  assert.equal(parseMoveNetOutput(output, createOptions()), null);
});

test("returns null when too few landmarks are visible", () => {
  const output = createOutput(0.5, 0.5, 0.1);

  assert.equal(parseMoveNetOutput(output, createOptions()), null);
});

test("classifies an empty model result as no visible person", () => {
  const result = parseMoveNetOutputResult(
    createOutput(0.5, 0.5, 0.01),
    createOptions(),
  );

  assert.equal(result.pose, null);
  assert.equal(result.status, "no_person");
});

test("classifies a weak model result as low confidence", () => {
  const result = parseMoveNetOutputResult(
    createOutput(0.5, 0.5, 0.15),
    createOptions(),
  );

  assert.equal(result.pose, null);
  assert.equal(result.status, "low_confidence");
});
