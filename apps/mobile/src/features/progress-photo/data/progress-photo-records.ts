import type {
  ProgressPhoto,
  UpdateProgressPhotoAlignmentInput,
  UpdateProgressPhotoPoseMetadataInput,
} from "../types";

type ProgressPhotoUpdateResult = {
  photos: ProgressPhoto[];
  updatedPhoto: ProgressPhoto | null;
};

export function updateProgressPhotoPoseMetadata(
  photos: ProgressPhoto[],
  input: UpdateProgressPhotoPoseMetadataInput,
): ProgressPhotoUpdateResult {
  let updatedPhoto: ProgressPhoto | null = null;

  const updatedPhotos = photos.map((photo) => {
    if (photo.id !== input.id) return photo;

    updatedPhoto = {
      ...photo,
      poseGroupId: input.poseGroupId,
      referencePhotoId: input.referencePhotoId,
      poseData: input.poseData,
    };

    return updatedPhoto;
  });

  return { photos: updatedPhotos, updatedPhoto };
}

export function updateProgressPhotoAlignment(
  photos: ProgressPhoto[],
  input: UpdateProgressPhotoAlignmentInput,
): ProgressPhotoUpdateResult {
  let updatedPhoto: ProgressPhoto | null = null;

  const updatedPhotos = photos.map((photo) => {
    if (photo.id !== input.id) return photo;

    const alignmentStatus = input.alignment
      ? input.alignmentStatus === "manual"
        ? "manual"
        : "automatic"
      : "unavailable";
    updatedPhoto = {
      ...photo,
      alignment: input.alignment,
      automaticAlignment:
        alignmentStatus === "automatic"
          ? input.alignment
          : photo.automaticAlignment,
      alignmentStatus,
    };

    return updatedPhoto;
  });

  return { photos: updatedPhotos, updatedPhoto };
}
