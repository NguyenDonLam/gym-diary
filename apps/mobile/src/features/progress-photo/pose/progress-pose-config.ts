export const progressPoseConfig = {
  minimumLandmarkConfidence: 0.2,
  minimumOverallConfidence: 0.25,
  minimumVisibleLandmarkCount: 5,
  requiredTorsoLandmarkNames: [
    "left_shoulder",
    "right_shoulder",
    "left_hip",
    "right_hip",
  ],
  maximumCapturePoseAgeMs: 350,
  inferenceIntervalMs: 100,
  diagnosticsEnabled: false,
} as const;

export const progressPoseFrameOutputConfig = {
  pixelFormat: "yuv",
  enablePhysicalBufferRotation: true,
  enablePreviewSizedOutputBuffers: true,
  dropFramesWhileBusy: true,
} as const;
