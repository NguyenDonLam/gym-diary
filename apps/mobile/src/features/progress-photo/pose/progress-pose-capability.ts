import type {
  ProgressPoseCapability,
  ProgressPoseCapabilityProvider,
} from "./progress-pose-capability.types";

export type { ProgressPoseCapability };

export const getProgressPoseCapability: ProgressPoseCapabilityProvider =
  async () => ({
    available: false,
    reason: "Pose matching is not supported on this platform.",
  });
