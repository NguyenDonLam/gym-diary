import type { ProgressPhoto, ProgressPhotoAlignment } from "../types";
import {
  progressPhotoViewMapper,
  type ProgressPhotoViewModel,
} from "./progress-photo-view.mapper";
import { progressPhotoComparisonConfig as config } from "./progress-photo-comparison.config";

export type ProgressPhotoAlignmentState =
  | "reference"
  | "aligned"
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
  alignmentState: ProgressPhotoAlignmentState;
  alignmentStatusLabel: string;
  alignmentDetailLabel: string | null;
  renderTransform: ProgressPhotoRenderTransform | null;
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
  const alignment = photo.alignment;

  if (!alignment) {
    if (isReferencePhoto(photo)) {
      return {
        ...viewModel,
        alignmentState: "reference",
        alignmentStatusLabel: "Reference framing",
        alignmentDetailLabel: null,
        renderTransform: null,
        referencePhotoId: photo.id,
      };
    }

    return {
      ...viewModel,
      alignmentState: "unaligned",
      alignmentStatusLabel: "Original framing",
      alignmentDetailLabel: "No alignment data is available for this photo.",
      renderTransform: null,
      referencePhotoId: null,
    };
  }

  const referencePhoto = photosById.get(alignment.referencePhotoId);

  if (!referencePhoto) {
    return {
      ...viewModel,
      alignmentState: "missing_reference",
      alignmentStatusLabel: "Reference photo unavailable",
      alignmentDetailLabel: "Showing the original framing instead.",
      renderTransform: null,
      referencePhotoId: alignment.referencePhotoId,
    };
  }

  if (referencePhoto.id === photo.id) {
    return {
      ...viewModel,
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

  return {
    ...viewModel,
    alignmentState: isLowConfidence ? "low_confidence" : "aligned",
    alignmentStatusLabel: isLowConfidence
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
