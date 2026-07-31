import type { ProgressPoseDetectorFactory } from "./progress-pose-detector.types";

export type {
  DetectedPose,
  PoseLandmark,
  ProgressPoseDetector,
} from "./progress-pose-detector.types";

export const createProgressPoseDetector: ProgressPoseDetectorFactory =
  async () => null;
