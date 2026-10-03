export type PoseLandmark = {
  name: string;
  x: number;
  y: number;
  confidence: number;
};

export type DetectedPose = {
  landmarks: PoseLandmark[];
  overallConfidence: number;
  sourceWidth: number;
  sourceHeight: number;
  timestampMs: number;
};

export type ProgressPoseDetectionStatus =
  "skipped" | "detected" | "low_confidence" | "no_person" | "invalid";

export interface ProgressPoseDetector {
  detectFromFrame(frame: unknown): DetectedPose | null;
  getLastDetectionStatus(): ProgressPoseDetectionStatus;
  dispose(): void;
}

export type ProgressPoseDetectorFactory =
  () => Promise<ProgressPoseDetector | null>;
