import type { ProgressPhoto, ProgressPhotoPoseData } from "../types";

export type ProgressPhotoCameraReference = {
  id: string;
  poseGroupId: string;
  uri: string;
  dateLabel: string;
  accessibilityLabel: string;
  poseData: ProgressPhotoPoseData | null;
};

export function selectDefaultProgressPhotoCameraReferenceId(
  references: readonly ProgressPhotoCameraReference[],
) {
  return (
    references.find((reference) => reference.poseData)?.id ??
    references[0]?.id ??
    null
  );
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const progressPhotoCameraReferenceMapper = {
  fromPhotos(photos: ProgressPhoto[]): ProgressPhotoCameraReference[] {
    return photos.flatMap((photo) => {
      if (!photo.poseGroupId || photo.referencePhotoId !== null) return [];

      const dateLabel = formatDate(photo.capturedAt);

      return [
        {
          id: photo.id,
          poseGroupId: photo.poseGroupId,
          uri: photo.uri,
          dateLabel,
          accessibilityLabel: `Use photo from ${dateLabel} as pose reference`,
          poseData: photo.poseData,
        },
      ];
    });
  },
};
