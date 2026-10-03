export const progressPoseAutoCaptureConfig = {
  holdDurationMs: 750,
  cooldownDurationMs: 1500,
  entryThresholds: {
    pose: 0.88,
    framing: 0.84,
    visibility: 0.75,
    overall: 0.86,
  },
  cancellationThresholds: {
    pose: 0.78,
    framing: 0.72,
    visibility: 0.6,
    overall: 0.76,
  },
} as const;
