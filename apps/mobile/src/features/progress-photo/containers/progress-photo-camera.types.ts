import type { DetectedPose } from "../pose/progress-pose-detector.types";

export type CapturedProgressPhoto = {
  sourceUri: string;
  capturedAt: Date;
  shutterTimestampMs: number;
  imageWidth: number;
  imageHeight: number;
  pose: DetectedPose | null;
};

export type ProgressPhotoCameraContainerProps = {
  onCancel: () => void;
  onCaptured: (capture: CapturedProgressPhoto) => Promise<void>;
};
