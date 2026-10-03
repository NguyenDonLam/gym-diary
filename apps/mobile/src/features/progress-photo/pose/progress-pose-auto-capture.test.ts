import assert from "node:assert/strict";
import test from "node:test";

import { progressPoseAutoCaptureConfig as config } from "./progress-pose-auto-capture.config";
import {
  createAutoCaptureMachine,
  updateAutoCaptureMachine,
} from "./progress-pose-auto-capture";
import type { PoseMatchResult } from "./progress-pose-comparison.types";

function match(score: number): PoseMatchResult {
  return {
    poseScore: score,
    framingScore: score,
    visibilityScore: score,
    overallScore: score,
    stabilityEligible: score >= 0.8,
    commonLandmarkCount: 17,
    instructions: score >= 0.8 ? ["hold_still"] : ["adjust_pose"],
  };
}

test("remains disabled until the user opts in", () => {
  const machine = updateAutoCaptureMachine(createAutoCaptureMachine(), {
    type: "match",
    timestampMs: 1000,
    match: match(1),
  });

  assert.equal(machine.state, "disabled");
  assert.equal(machine.captureRequested, false);
});

test("requests one capture after a continuous timestamp-driven hold", () => {
  let machine = updateAutoCaptureMachine(createAutoCaptureMachine(), {
    type: "set_enabled",
    enabled: true,
  });
  machine = updateAutoCaptureMachine(machine, {
    type: "match",
    timestampMs: 1000,
    match: match(1),
  });
  assert.equal(machine.state, "holding");

  machine = updateAutoCaptureMachine(machine, {
    type: "match",
    timestampMs: 1375,
    match: match(1),
  });
  assert.equal(machine.holdProgress, 0.5);
  assert.equal(machine.captureRequested, false);

  machine = updateAutoCaptureMachine(machine, {
    type: "match",
    timestampMs: 1750,
    match: match(1),
  });
  assert.equal(machine.state, "capturing");
  assert.equal(machine.captureRequested, true);

  const duplicateFrame = updateAutoCaptureMachine(machine, {
    type: "match",
    timestampMs: 1850,
    match: match(1),
  });
  assert.strictEqual(duplicateFrame, machine);
});

test("hysteresis keeps holding below entry but above cancellation", () => {
  let machine = updateAutoCaptureMachine(createAutoCaptureMachine(true), {
    type: "match",
    timestampMs: 1000,
    match: match(1),
  });
  machine = updateAutoCaptureMachine(machine, {
    type: "match",
    timestampMs: 1200,
    match: match(0.8),
  });

  assert.equal(machine.state, "holding");
  assert.ok(machine.holdProgress > 0);
});

test("falling below cancellation thresholds resets the hold", () => {
  let machine = updateAutoCaptureMachine(createAutoCaptureMachine(true), {
    type: "match",
    timestampMs: 1000,
    match: match(1),
  });
  machine = updateAutoCaptureMachine(machine, {
    type: "match",
    timestampMs: 1300,
    match: match(0.5),
  });

  assert.equal(machine.state, "searching");
  assert.equal(machine.holdStartedAtMs, null);
  assert.equal(machine.holdProgress, 0);
});

test("cooldown prevents another hold until its configured duration ends", () => {
  let machine = updateAutoCaptureMachine(createAutoCaptureMachine(true), {
    type: "capture_completed",
    timestampMs: 2000,
  });
  machine = updateAutoCaptureMachine(machine, {
    type: "match",
    timestampMs: 2000 + config.cooldownDurationMs - 1,
    match: match(1),
  });
  assert.equal(machine.state, "cooldown");

  machine = updateAutoCaptureMachine(machine, {
    type: "match",
    timestampMs: 2000 + config.cooldownDurationMs,
    match: match(1),
  });
  assert.equal(machine.state, "holding");
  assert.equal(machine.captureRequested, false);
});

test("cancellation and disabling clear pending capture state", () => {
  let machine = updateAutoCaptureMachine(createAutoCaptureMachine(true), {
    type: "match",
    timestampMs: 1000,
    match: match(1),
  });
  machine = updateAutoCaptureMachine(machine, { type: "cancel" });
  assert.equal(machine.state, "searching");
  assert.equal(machine.captureRequested, false);

  machine = updateAutoCaptureMachine(machine, {
    type: "set_enabled",
    enabled: false,
  });
  assert.equal(machine.state, "disabled");
  assert.equal(machine.enabled, false);
});
