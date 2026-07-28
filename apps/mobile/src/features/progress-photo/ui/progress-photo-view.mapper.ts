import type { ProgressPhoto } from "../types";

export type ProgressPhotoViewModel = {
  id: string;
  uri: string;
  dateLabel: string;
  timeLabel: string;
  accessibilityLabel: string;
};

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export const progressPhotoViewMapper = {
  fromPhoto(photo: ProgressPhoto): ProgressPhotoViewModel {
    const dateLabel = formatDate(photo.capturedAt);

    return {
      id: photo.id,
      uri: photo.uri,
      dateLabel,
      timeLabel: formatTime(photo.capturedAt),
      accessibilityLabel: `View photo from ${dateLabel}`,
    };
  },

  fromPhotos(photos: ProgressPhoto[]): ProgressPhotoViewModel[] {
    return photos.map(progressPhotoViewMapper.fromPhoto);
  },
};
