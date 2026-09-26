import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { poseTrackerRepository } from "../data/pose-tracker-repository";

const key = ["progress-pose-tracker-names"] as const;

export function usePoseTrackerNames() {
  return useQuery({ queryKey: key, queryFn: poseTrackerRepository.getNames });
}

export function useRenamePoseTracker() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: poseTrackerRepository.rename,
    onMutate: () => client.cancelQueries({ queryKey: key }),
    onSuccess: ({ id, name }) => {
      client.setQueryData<Record<string, string>>(key, (names) => ({
        ...names,
        [id]: name,
      }));
    },
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  });
}
