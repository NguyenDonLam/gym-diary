import type { ProgressPhotoPoseData } from "../types";
import type {
  DetectedPose,
  PoseLandmark,
} from "./progress-pose-detector.types";
import { progressPoseConfig } from "./progress-pose-config";
import { PROGRESS_POSE_MODEL } from "./progress-pose-model-metadata";

export type ProgressPoseCaptureCandidate = {
  pose: DetectedPose | null;
  shutterTimestampMs: number;
  imageWidth: number;
  imageHeight: number;
};

function isFiniteNormalizedLandmark(
  landmark: PoseLandmark,
): landmark is PoseLandmark {
  return (
    typeof landmark.name === "string" &&
    Number.isFinite(landmark.x) &&
    landmark.x >= 0 &&
    landmark.x <= 1 &&
    Number.isFinite(landmark.y) &&
    landmark.y >= 0 &&
    landmark.y <= 1 &&
    Number.isFinite(landmark.confidence) &&
    landmark.confidence >= 0 &&
    landmark.confidence <= 1
  );
}

export function isDetectedPoseValidForCapture(
  pose: DetectedPose | null,
): pose is DetectedPose {
  if (
    !pose ||
    !Number.isFinite(pose.timestampMs) ||
    !Number.isFinite(pose.overallConfidence) ||
    pose.overallConfidence < progressPoseConfig.minimumOverallConfidence
  ) {
    return false;
  }

  if (
    pose.landmarks.length !== PROGRESS_POSE_MODEL.landmarkCount ||
    !pose.landmarks.every(isFiniteNormalizedLandmark)
  ) {
    return false;
  }

  const landmarksByName = new Map(
    pose.landmarks.map((landmark) => [landmark.name, landmark]),
  );
  if (landmarksByName.size !== pose.landmarks.length) return false;

  const visibleLandmarkCount = pose.landmarks.filter(
    (landmark) =>
      landmark.confidence >= progressPoseConfig.minimumLandmarkConfidence,
  ).length;
  if (visibleLandmarkCount < progressPoseConfig.minimumVisibleLandmarkCount) {
    return false;
  }

  return progressPoseConfig.requiredTorsoLandmarkNames.every((name) => {
    const landmark = landmarksByName.get(name);
    return (
      landmark !== undefined &&
      landmark.confidence >= progressPoseConfig.minimumLandmarkConfidence
    );
  });
}

export function createPoseDataForCapture({
  pose,
  shutterTimestampMs,
  imageWidth,
  imageHeight,
}: ProgressPoseCaptureCandidate): ProgressPhotoPoseData | null {
  if (
    !isDetectedPoseValidForCapture(pose) ||
    !Number.isFinite(shutterTimestampMs) ||
    !Number.isFinite(imageWidth) ||
    imageWidth <= 0 ||
    !Number.isFinite(imageHeight) ||
    imageHeight <= 0
  ) {
    return null;
  }

  const poseAgeMs = shutterTimestampMs - pose.timestampMs;
  if (poseAgeMs < 0 || poseAgeMs > progressPoseConfig.maximumCapturePoseAgeMs) {
    return null;
  }

  return {
    model: PROGRESS_POSE_MODEL.name,
    modelVersion: PROGRESS_POSE_MODEL.version,
    landmarks: pose.landmarks.map((landmark) => ({ ...landmark })),
    imageWidth,
    imageHeight,
    overallConfidence: pose.overallConfidence,
  };
}
