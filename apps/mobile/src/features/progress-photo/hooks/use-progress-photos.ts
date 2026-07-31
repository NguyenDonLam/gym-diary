import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { progressPhotoRepository } from "../data/repository";
import type {
  CreateProgressPhotoInput,
  ProgressPhoto,
  UpdateProgressPhotoAlignmentInput,
  UpdateProgressPhotoPoseMetadataInput,
} from "../types";

export const progressPhotoKeys = {
  all: ["progress-photos"] as const,
};

export function useProgressPhotosQuery() {
  return useQuery({
    queryKey: progressPhotoKeys.all,
    queryFn: progressPhotoRepository.getAll,
  });
}

export function useCreateProgressPhotoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProgressPhotoInput) =>
      progressPhotoRepository.create(input),
    onSuccess: (photo) => {
      queryClient.setQueryData<ProgressPhoto[]>(
        progressPhotoKeys.all,
        (current = []) => [
          photo,
          ...current.filter((item) => item.id !== photo.id),
        ],
      );
    },
  });
}

function replaceProgressPhoto(
  current: ProgressPhoto[] | undefined,
  updatedPhoto: ProgressPhoto | null,
) {
  if (!current || !updatedPhoto) return current;

  return current.map((photo) =>
    photo.id === updatedPhoto.id ? updatedPhoto : photo,
  );
}

export function useUpdateProgressPhotoPoseMetadataMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProgressPhotoPoseMetadataInput) =>
      progressPhotoRepository.updatePoseMetadata(input),
    onSuccess: (photo) => {
      queryClient.setQueryData<ProgressPhoto[]>(
        progressPhotoKeys.all,
        (current) => replaceProgressPhoto(current, photo),
      );
    },
  });
}

export function useUpdateProgressPhotoAlignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProgressPhotoAlignmentInput) =>
      progressPhotoRepository.updateAlignment(input),
    onSuccess: (photo) => {
      queryClient.setQueryData<ProgressPhoto[]>(
        progressPhotoKeys.all,
        (current) => replaceProgressPhoto(current, photo),
      );
    },
  });
}
