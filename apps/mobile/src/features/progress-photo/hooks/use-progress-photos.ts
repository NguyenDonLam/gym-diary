import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { progressPhotoRepository } from "../data/repository";
import type { CreateProgressPhotoInput, ProgressPhoto } from "../types";

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
