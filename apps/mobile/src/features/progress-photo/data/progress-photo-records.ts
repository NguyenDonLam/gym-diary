import type {
  ProgressPhoto,
  UpdateProgressPhotoAlignmentInput,
  UpdateProgressPhotoPoseMetadataInput,
} from "../types";

type ProgressPhotoUpdateResult = {
  photos: ProgressPhoto[];
  updatedPhoto: ProgressPhoto | null;
};

export function deleteProgressPhoto(
  photos: ProgressPhoto[],
  id: string,
): ProgressPhoto[] {
  return photos
    .filter((photo) => photo.id !== id)
    .map((photo) => {
      const alignment =
        photo.alignment?.referencePhotoId === id ? null : photo.alignment;
      const automaticAlignment =
        photo.automaticAlignment?.referencePhotoId === id
          ? null
          : photo.automaticAlignment;
      if (
        alignment === photo.alignment &&
        automaticAlignment === photo.automaticAlignment
      )
        return photo;
      return {
        ...photo,
        alignment,
        automaticAlignment,
        alignmentStatus: alignment ? photo.alignmentStatus : "unavailable",
      };
    });
}

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
