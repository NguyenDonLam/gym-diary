import type { DetectedPose } from "../pose/progress-pose-detector.types";
import type { ProgressPhotoCameraReference } from "../ui/progress-photo-camera-reference.mapper";

export type CapturedProgressPhoto = {
  sourceUri: string;
  capturedAt: Date;
  shutterTimestampMs: number;
  imageWidth: number;
  imageHeight: number;
  pose: DetectedPose | null;
  poseGroupId: string | null;
  referencePhotoId: string | null;
};

export type ProgressPhotoCameraContainerProps = {
  references: ProgressPhotoCameraReference[];
  onCancel: () => void;
  onCaptured: (capture: CapturedProgressPhoto) => Promise<void>;
};
