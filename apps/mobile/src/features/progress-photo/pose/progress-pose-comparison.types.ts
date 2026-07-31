export type PoseComparisonLandmark = {
  name: string;
  x: number;
  y: number;
  confidence: number;
};

export type ComparablePose = {
  landmarks: readonly PoseComparisonLandmark[];
};

export type PoseAdjustmentInstruction =
  | "move_left"
  | "move_right"
  | "move_up"
  | "move_down"
  | "move_closer"
  | "move_further"
  | "rotate_left"
  | "rotate_right"
  | "adjust_pose"
  | "hold_still";

export type PoseMatchFailureReason =
  | "invalid_reference_pose"
  | "invalid_current_pose"
  | "insufficient_common_landmarks"
  | "insufficient_torso_landmarks";

export type PoseMatchResult = {
  poseScore: number;
  framingScore: number;
  visibilityScore: number;
  stabilityEligible: boolean;
  overallScore: number;
  commonLandmarkCount: number;
  instructions: PoseAdjustmentInstruction[];
  failureReason?: PoseMatchFailureReason;
};
