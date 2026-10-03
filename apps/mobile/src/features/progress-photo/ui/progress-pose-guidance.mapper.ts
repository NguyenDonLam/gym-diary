import { progressPoseComparisonConfig } from "../pose/progress-pose-comparison.config";
import type {
  PoseAdjustmentInstruction,
  PoseMatchResult,
} from "../pose/progress-pose-comparison.types";
import type { ProgressPoseDetectionStatus } from "../pose/progress-pose-detector.types";

export type ProgressPoseReferenceState = "none" | "missing" | "ready";

export type ProgressPoseGuidanceViewModel = {
  overallLabel: string;
  poseStatus: string;
  framingStatus: string;
  instruction: string;
  rawScores: {
    pose: number;
    framing: number;
    visibility: number;
    overall: number;
  } | null;
};

const INSTRUCTION_LABELS: Record<PoseAdjustmentInstruction, string> = {
  move_left: "Move left",
  move_right: "Move right",
  move_up: "Move up",
  move_down: "Move down",
  move_closer: "Move closer",
  move_further: "Move further away",
  rotate_left: "Rotate left",
  rotate_right: "Rotate right",
  adjust_pose: "Adjust your pose",
  hold_still: "Hold still",
};

function unavailableGuidance(
  poseStatus: string,
  framingStatus: string,
  instruction: string,
): ProgressPoseGuidanceViewModel {
  return {
    overallLabel: "Match unavailable",
    poseStatus,
    framingStatus,
    instruction,
    rawScores: null,
  };
}

export const progressPoseGuidanceMapper = {
  fromState({
    referenceState,
    detectionStatus,
    match,
    includeRawScores,
  }: {
    referenceState: ProgressPoseReferenceState;
    detectionStatus: ProgressPoseDetectionStatus | "starting";
    match: PoseMatchResult | null;
    includeRawScores: boolean;
  }): ProgressPoseGuidanceViewModel {
    if (referenceState === "none") {
      return unavailableGuidance(
        "No saved pose reference",
        "Capture manually to create one",
        "Manual capture is ready",
      );
    }

    if (referenceState === "missing") {
      return unavailableGuidance(
        "Reference pose data is missing",
        "Choose another reference",
        "Manual capture is still available",
      );
    }

    if (detectionStatus === "starting" || detectionStatus === "skipped") {
      return unavailableGuidance(
        "Starting pose detection",
        "Keep your full body in view",
        "Stand in the camera view",
      );
    }

    if (detectionStatus === "no_person") {
      return unavailableGuidance(
        "No person visible",
        "Step fully into the frame",
        "Stand in the camera view",
      );
    }

    if (
      detectionStatus === "low_confidence" ||
      detectionStatus === "invalid" ||
      !match
    ) {
      return unavailableGuidance(
        "Pose confidence is too low",
        "Keep your torso and limbs visible",
        "Move into clearer view",
      );
    }

    return {
      overallLabel: `${Math.round(match.overallScore * 100)}% match`,
      poseStatus:
        match.poseScore >= progressPoseComparisonConfig.stabilityThresholds.pose
          ? "Pose matched"
          : "Adjust your pose",
      framingStatus:
        match.framingScore >=
        progressPoseComparisonConfig.stabilityThresholds.framing
          ? "Framing matched"
          : "Adjust your framing",
      instruction: INSTRUCTION_LABELS[match.instructions[0] ?? "adjust_pose"],
      rawScores: includeRawScores
        ? {
            pose: match.poseScore,
            framing: match.framingScore,
            visibility: match.visibilityScore,
            overall: match.overallScore,
          }
        : null,
    };
  },
};
