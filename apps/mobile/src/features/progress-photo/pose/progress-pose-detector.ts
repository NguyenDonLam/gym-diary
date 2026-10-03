import type {
  ProgressPoseDetector,
  ProgressPoseDetectorFactory,
} from "./progress-pose-detector.types";

export type {
  DetectedPose,
  PoseLandmark,
  ProgressPoseDetectionStatus,
  ProgressPoseDetector,
} from "./progress-pose-detector.types";

export const createProgressPoseDetector: ProgressPoseDetectorFactory =
  async () => null;

export const unavailableProgressPoseDetector: ProgressPoseDetector = {
  detectFromFrame: () => null,
  getLastDetectionStatus: () => "invalid",
  dispose: () => undefined,
};
