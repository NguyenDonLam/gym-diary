import assert from "node:assert/strict";
import test from "node:test";

import { updateSmoothedPoseMatch } from "./progress-pose-match-smoother";
import type {
  PoseAdjustmentInstruction,
  PoseMatchResult,
} from "./progress-pose-comparison.types";

function result(
  overallScore: number,
  instruction: PoseAdjustmentInstruction,
): PoseMatchResult {
  return {
    poseScore: overallScore,
    framingScore: overallScore,
    visibilityScore: overallScore,
    overallScore,
    stabilityEligible: false,
    commonLandmarkCount: 17,
    instructions: [instruction],
  };
}

test("smooths score changes with an exponential moving average", () => {
  const first = updateSmoothedPoseMatch(null, result(1, "hold_still"));
  const second = updateSmoothedPoseMatch(first, result(0, "hold_still"));

  assert.equal(second.result.overallScore, 0.7);
  assert.equal(second.result.poseScore, 0.7);
});

test("requires a changed instruction to remain stable for three frames", () => {
  const first = updateSmoothedPoseMatch(null, result(0.5, "move_left"));
  const second = updateSmoothedPoseMatch(first, result(0.5, "move_right"));
  const third = updateSmoothedPoseMatch(second, result(0.5, "move_right"));
  const fourth = updateSmoothedPoseMatch(third, result(0.5, "move_right"));

  assert.equal(second.displayedInstruction, "move_left");
  assert.equal(third.displayedInstruction, "move_left");
  assert.equal(fourth.displayedInstruction, "move_right");
});
