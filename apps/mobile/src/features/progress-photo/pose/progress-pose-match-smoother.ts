import { progressPoseGuidanceConfig as config } from "./progress-pose-guidance.config";
import type {
  PoseAdjustmentInstruction,
  PoseMatchResult,
} from "./progress-pose-comparison.types";

export type SmoothedPoseMatchState = {
  result: PoseMatchResult;
  displayedInstruction: PoseAdjustmentInstruction;
  pendingInstruction: PoseAdjustmentInstruction;
  pendingInstructionCount: number;
};

function smooth(previous: number, current: number) {
  return (
    previous * (1 - config.scoreSmoothingAlpha) +
    current * config.scoreSmoothingAlpha
  );
}

export function updateSmoothedPoseMatch(
  previous: SmoothedPoseMatchState | null,
  current: PoseMatchResult,
): SmoothedPoseMatchState {
  const currentInstruction = current.instructions[0] ?? "adjust_pose";

  if (!previous || current.failureReason) {
    return {
      result: current,
      displayedInstruction: currentInstruction,
      pendingInstruction: currentInstruction,
      pendingInstructionCount: 1,
    };
  }

  const isSamePendingInstruction =
    currentInstruction === previous.pendingInstruction;
  const pendingInstructionCount = isSamePendingInstruction
    ? previous.pendingInstructionCount + 1
    : 1;
  const displayedInstruction =
    currentInstruction === previous.displayedInstruction ||
    pendingInstructionCount >= config.instructionConfirmationFrames
      ? currentInstruction
      : previous.displayedInstruction;

  return {
    result: {
      ...current,
      poseScore: smooth(previous.result.poseScore, current.poseScore),
      framingScore: smooth(previous.result.framingScore, current.framingScore),
      visibilityScore: smooth(
        previous.result.visibilityScore,
        current.visibilityScore,
      ),
      overallScore: smooth(previous.result.overallScore, current.overallScore),
      instructions: [
        displayedInstruction,
        ...current.instructions.filter(
          (instruction) => instruction !== displayedInstruction,
        ),
      ],
    },
    displayedInstruction,
    pendingInstruction: currentInstruction,
    pendingInstructionCount,
  };
}
