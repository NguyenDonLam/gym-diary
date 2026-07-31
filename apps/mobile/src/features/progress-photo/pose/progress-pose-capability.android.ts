import type {
  ProgressPoseCapability,
  ProgressPoseCapabilityProvider,
} from "./progress-pose-capability.types";

export type { ProgressPoseCapability };

export const getProgressPoseCapability: ProgressPoseCapabilityProvider =
  async () => ({
    available: false,
    reason: "Automatic pose matching is not available on Android yet.",
  });
