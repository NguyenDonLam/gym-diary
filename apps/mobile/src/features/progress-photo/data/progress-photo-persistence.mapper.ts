import type {
  NormalizedPoseLandmark,
  ProgressPhoto,
  ProgressPhotoAlignment,
  ProgressPhotoAlignmentStatus,
  ProgressPhotoPoseData,
} from "../types";
import type { StoredProgressPhoto } from "./types";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNormalizedPoseLandmark(
  value: unknown,
): value is NormalizedPoseLandmark {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<NormalizedPoseLandmark>;

  return (
    typeof candidate.name === "string" &&
    isFiniteNumber(candidate.x) &&
    isFiniteNumber(candidate.y) &&
    isFiniteNumber(candidate.confidence)
  );
}

function isProgressPhotoPoseData(
  value: unknown,
): value is ProgressPhotoPoseData {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<ProgressPhotoPoseData>;

  return (
    typeof candidate.model === "string" &&
    isFiniteNumber(candidate.modelVersion) &&
    Array.isArray(candidate.landmarks) &&
    candidate.landmarks.every(isNormalizedPoseLandmark) &&
    isFiniteNumber(candidate.imageWidth) &&
    isFiniteNumber(candidate.imageHeight) &&
    isFiniteNumber(candidate.overallConfidence)
  );
}

function isProgressPhotoAlignment(
  value: unknown,
): value is ProgressPhotoAlignment {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<ProgressPhotoAlignment>;

  return (
    typeof candidate.referencePhotoId === "string" &&
    isFiniteNumber(candidate.translateX) &&
    isFiniteNumber(candidate.translateY) &&
    isFiniteNumber(candidate.scale) &&
    isFiniteNumber(candidate.rotationRadians) &&
    isFiniteNumber(candidate.confidence) &&
    isFiniteNumber(candidate.version)
  );
}

function nullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function isProgressPhotoAlignmentStatus(
  value: unknown,
): value is ProgressPhotoAlignmentStatus {
  return value === "automatic" || value === "manual" || value === "unavailable";
}

function isStoredProgressPhoto(value: unknown): value is StoredProgressPhoto {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<StoredProgressPhoto>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.uri === "string" &&
    typeof candidate.capturedAt === "string"
  );
}

export const progressPhotoPersistenceMapper = {
  fromStored(value: unknown): ProgressPhoto | null {
    if (!isStoredProgressPhoto(value)) return null;

    const capturedAt = new Date(value.capturedAt);
    if (Number.isNaN(capturedAt.getTime())) return null;

    const alignment = isProgressPhotoAlignment(value.alignment)
      ? value.alignment
      : null;
    const storedAlignmentStatus = isProgressPhotoAlignmentStatus(
      value.alignmentStatus,
    )
      ? value.alignmentStatus
      : null;
    const alignmentStatus: ProgressPhotoAlignmentStatus = alignment
      ? storedAlignmentStatus === "manual"
        ? "manual"
        : "automatic"
      : "unavailable";
    const automaticAlignment = isProgressPhotoAlignment(
      value.automaticAlignment,
    )
      ? value.automaticAlignment
      : alignmentStatus === "automatic"
        ? alignment
        : null;

    return {
      id: value.id,
      uri: value.uri,
      capturedAt,
      poseGroupId: nullableString(value.poseGroupId),
      referencePhotoId: nullableString(value.referencePhotoId),
      poseData: isProgressPhotoPoseData(value.poseData) ? value.poseData : null,
      alignment,
      automaticAlignment,
      alignmentStatus,
    };
  },

  toStored(photo: ProgressPhoto): StoredProgressPhoto {
    return {
      id: photo.id,
      uri: photo.uri,
      capturedAt: photo.capturedAt.toISOString(),
      poseGroupId: photo.poseGroupId,
      referencePhotoId: photo.referencePhotoId,
      poseData: photo.poseData,
      alignment: photo.alignment,
      automaticAlignment: photo.automaticAlignment,
      alignmentStatus: photo.alignmentStatus,
    };
  },
};
