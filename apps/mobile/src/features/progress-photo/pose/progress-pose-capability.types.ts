export type ProgressPoseCapability = {
  available: boolean;
  reason?: string;
};

export type ProgressPoseCapabilityProvider =
  () => Promise<ProgressPoseCapability>;
