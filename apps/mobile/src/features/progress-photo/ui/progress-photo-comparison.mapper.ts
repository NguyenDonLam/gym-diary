import type {
  ProgressPhoto,
  ProgressPhotoAlignment,
  ProgressPhotoAlignmentStatus,
} from "../types";
import {
  progressPhotoViewMapper,
  type ProgressPhotoViewModel,
} from "./progress-photo-view.mapper";
import { progressPhotoComparisonConfig as config } from "./progress-photo-comparison.config";

export type ProgressPhotoAlignmentState =
  | "reference"
  | "aligned"
  | "manual"
  | "low_confidence"
  | "unaligned"
  | "missing_reference";

export type ProgressPhotoRenderTransform = {
  translateX: number;
  translateY: number;
  scale: number;
  rotationRadians: number;
};

export type ProgressPhotoViewportTransform = {
  translateX: number;
  translateY: number;
  scale: number;
  rotation: `${number}rad`;
};

export type ProgressPhotoComparisonViewModel = ProgressPhotoViewModel & {
  capturedAtMs: number;
  poseGroupId: string | null;
  alignmentState: ProgressPhotoAlignmentState;
  alignmentStatusLabel: string;
  alignmentDetailLabel: string | null;
  renderTransform: ProgressPhotoRenderTransform | null;
  automaticRenderTransform: ProgressPhotoRenderTransform | null;
  automaticAlignment: ProgressPhotoAlignment | null;
  alignmentStatus: ProgressPhotoAlignmentStatus;
  referencePhotoId: string | null;
};

function isReferencePhoto(photo: ProgressPhoto) {
  return (
    photo.poseGroupId !== null &&
    photo.referencePhotoId === null &&
    photo.poseData !== null
  );
}

function toRenderTransform(
  alignment: ProgressPhotoAlignment,
): ProgressPhotoRenderTransform {
  return {
    translateX: alignment.translateX,
    translateY: alignment.translateY,
    scale: alignment.scale,
    rotationRadians: alignment.rotationRadians,
  };
}

function mapPhoto(
  photo: ProgressPhoto,
  photosById: ReadonlyMap<string, ProgressPhoto>,
): ProgressPhotoComparisonViewModel {
  const viewModel = progressPhotoViewMapper.fromPhoto(photo);
  const comparisonViewModel = {
    ...viewModel,
    capturedAtMs: photo.capturedAt.getTime(),
    poseGroupId: photo.poseGroupId,
    automaticRenderTransform: photo.automaticAlignment
      ? toRenderTransform(photo.automaticAlignment)
      : null,
    automaticAlignment: photo.automaticAlignment
      ? { ...photo.automaticAlignment }
      : null,
    alignmentStatus: photo.alignmentStatus,
  };
  const alignment = photo.alignment;

  if (!alignment) {
    if (isReferencePhoto(photo)) {
      return {
        ...comparisonViewModel,
        alignmentState: "reference",
        alignmentStatusLabel: "Reference framing",
        alignmentDetailLabel: null,
        renderTransform: null,
        referencePhotoId: photo.id,
      };
    }

    return {
      ...comparisonViewModel,
      alignmentState: "unaligned",
      alignmentStatusLabel: "Original framing",
      alignmentDetailLabel: "No alignment data is available for this photo.",
      renderTransform: null,
      referencePhotoId: photo.referencePhotoId,
    };
  }

  const referencePhoto = photosById.get(alignment.referencePhotoId);

  if (!referencePhoto) {
    return {
      ...comparisonViewModel,
      alignmentState: "missing_reference",
      alignmentStatusLabel: "Reference photo unavailable",
      alignmentDetailLabel: "Showing the original framing instead.",
      renderTransform: null,
      referencePhotoId: alignment.referencePhotoId,
    };
  }

  if (referencePhoto.id === photo.id) {
    return {
      ...comparisonViewModel,
      alignmentState: "reference",
      alignmentStatusLabel: "Reference framing",
      alignmentDetailLabel: null,
      renderTransform: toRenderTransform(alignment),
      referencePhotoId: referencePhoto.id,
    };
  }

  const referenceDateLabel =
    progressPhotoViewMapper.fromPhoto(referencePhoto).dateLabel;
  const isLowConfidence = alignment.confidence < config.lowConfidenceThreshold;
  const isManual = photo.alignmentStatus === "manual";

  return {
    ...comparisonViewModel,
    alignmentState: isManual
      ? "manual"
      : isLowConfidence
        ? "low_confidence"
        : "aligned",
    alignmentStatusLabel: isManual
      ? "Manually aligned"
      : isLowConfidence
        ? "Alignment may be less precise"
        : "Aligned to reference",
    alignmentDetailLabel: `Reference: ${referenceDateLabel}`,
    renderTransform: toRenderTransform(alignment),
    referencePhotoId: referencePhoto.id,
  };
}

export function getProgressPhotoViewportSize(availableWidth: number) {
  const safeAvailableWidth = Number.isFinite(availableWidth)
    ? Math.max(0, availableWidth)
    : 0;
  const width = Math.min(safeAvailableWidth, config.maximumViewportWidth);

  return {
    width,
    height: width / config.viewportAspectRatio,
  };
}

export function getProgressPhotoViewportTransform(
  transform: ProgressPhotoRenderTransform,
  viewportWidth: number,
  viewportHeight: number,
): ProgressPhotoViewportTransform {
  const cosine = Math.cos(transform.rotationRadians);
  const sine = Math.sin(transform.rotationRadians);
  const centeredTranslateX =
    transform.translateX + transform.scale * (0.5 * cosine - 0.5 * sine) - 0.5;
  const centeredTranslateY =
    transform.translateY + transform.scale * (0.5 * sine + 0.5 * cosine) - 0.5;

  return {
    translateX: centeredTranslateX * viewportWidth,
    translateY: centeredTranslateY * viewportHeight,
    scale: transform.scale,
    rotation: `${transform.rotationRadians}rad`,
  };
}

export const progressPhotoComparisonMapper = {
  fromPhotos(photos: ProgressPhoto[]): ProgressPhotoComparisonViewModel[] {
    const photosById = new Map(photos.map((photo) => [photo.id, photo]));

    return photos.map((photo) => mapPhoto(photo, photosById));
  },
};

export function getProgressPhotoPairCandidates(
  photos: readonly ProgressPhotoComparisonViewModel[],
  selectedPhotoId: string | null,
) {
  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId);

  if (!selectedPhoto?.poseGroupId) {
    return [];
  }

  return photos
    .filter(
      (photo) =>
        photo.id !== selectedPhoto.id &&
        photo.poseGroupId === selectedPhoto.poseGroupId,
    )
    .sort(
      (left, right) =>
        left.capturedAtMs - right.capturedAtMs ||
        left.id.localeCompare(right.id),
    );
}

export function selectDefaultProgressPhotoPairId(
  photos: readonly ProgressPhotoComparisonViewModel[],
  selectedPhotoId: string | null,
) {
  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId);
  const candidates = getProgressPhotoPairCandidates(photos, selectedPhotoId);

  if (!selectedPhoto || candidates.length === 0) {
    return null;
  }

  const closestEarlierPhoto = candidates
    .filter((photo) => photo.capturedAtMs <= selectedPhoto.capturedAtMs)
    .at(-1);

  return closestEarlierPhoto?.id ?? candidates[0]?.id ?? null;
}

export function getProgressPhotoPairNavigation(
  photos: readonly ProgressPhotoComparisonViewModel[],
  selectedPhotoId: string | null,
  comparisonPhotoId: string | null,
) {
  const candidates = getProgressPhotoPairCandidates(photos, selectedPhotoId);
  const currentIndex = candidates.findIndex(
    (photo) => photo.id === comparisonPhotoId,
  );

  return {
    previousPhotoId:
      currentIndex > 0 ? (candidates[currentIndex - 1]?.id ?? null) : null,
    nextPhotoId:
      currentIndex >= 0 && currentIndex < candidates.length - 1
        ? (candidates[currentIndex + 1]?.id ?? null)
        : null,
  };
}

export function formatProgressPhotoElapsedTime(
  firstCapturedAtMs: number,
  secondCapturedAtMs: number,
) {
  const elapsedMs = Math.abs(secondCapturedAtMs - firstCapturedAtMs);
  const elapsedMinutes = Math.round(elapsedMs / 60_000);

  if (elapsedMinutes < 60) {
    return elapsedMinutes <= 1
      ? "Less than one minute apart"
      : `${elapsedMinutes} minutes apart`;
  }

  const elapsedHours = Math.round(elapsedMs / 3_600_000);

  if (elapsedHours < 48) {
    return `${elapsedHours} ${elapsedHours === 1 ? "hour" : "hours"} apart`;
  }

  const elapsedDays = Math.round(elapsedMs / 86_400_000);

  return `${elapsedDays} ${elapsedDays === 1 ? "day" : "days"} apart`;
}
