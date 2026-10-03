import assert from "node:assert/strict";
import test from "node:test";

import type { PoseMatchResult } from "../pose/progress-pose-comparison.types";
import { progressPoseGuidanceMapper } from "./progress-pose-guidance.mapper";

const match: PoseMatchResult = {
  poseScore: 0.9,
  framingScore: 0.85,
  visibilityScore: 0.8,
  overallScore: 0.87,
  stabilityEligible: true,
  commonLandmarkCount: 15,
  instructions: ["hold_still"],
};

test("maps a detected match into concise English guidance", () => {
  const guidance = progressPoseGuidanceMapper.fromState({
    referenceState: "ready",
    detectionStatus: "detected",
    match,
    includeRawScores: true,
  });

  assert.equal(guidance.overallLabel, "87% match");
  assert.equal(guidance.poseStatus, "Pose matched");
  assert.equal(guidance.framingStatus, "Framing matched");
  assert.equal(guidance.instruction, "Hold still");
  assert.deepEqual(guidance.rawScores, {
    pose: 0.9,
    framing: 0.85,
    visibility: 0.8,
    overall: 0.87,
  });
});

test("distinguishes no person from low-confidence pose guidance", () => {
  const noPerson = progressPoseGuidanceMapper.fromState({
    referenceState: "ready",
    detectionStatus: "no_person",
    match: null,
    includeRawScores: false,
  });
  const lowConfidence = progressPoseGuidanceMapper.fromState({
    referenceState: "ready",
    detectionStatus: "low_confidence",
    match: null,
    includeRawScores: false,
  });

  assert.equal(noPerson.poseStatus, "No person visible");
  assert.equal(lowConfidence.poseStatus, "Pose confidence is too low");
});
