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

export interface ProgressPoseDetector {
  detectFromFrame(frame: unknown): DetectedPose | null;
  dispose(): void;
}

export type ProgressPoseDetectorFactory =
  () => Promise<ProgressPoseDetector | null>;
