import type { ProgressPhoto } from "../types";

export type ProgressPoseTrackerViewModel = {
  id: string | null;
  label: string;
  photoCount: number;
  referencePhotoId: string | null;
};

// Trackers are derived from persisted group IDs, not from a second cache.
export function mapProgressPoseTrackers(
  photos: readonly ProgressPhoto[],
  names: Readonly<Record<string, string>> = {},
): ProgressPoseTrackerViewModel[] {
  const groups = new Map<string, ProgressPhoto[]>();
  const chronological = [...photos].sort(
    (a, b) =>
      a.capturedAt.getTime() - b.capturedAt.getTime() ||
      a.id.localeCompare(b.id),
  );
  for (const photo of chronological) {
    if (!photo.poseGroupId) continue;
    const group = groups.get(photo.poseGroupId) ?? [];
    group.push(photo);
    groups.set(photo.poseGroupId, group);
  }
  const trackers: ProgressPoseTrackerViewModel[] = [...groups].map(
    ([id, group], index) => ({
      id,
      label: names[id]?.trim() || `Pose ${index + 1}`,
      photoCount: group.length,
      referencePhotoId:
        group.find(
          (photo) => photo.referencePhotoId === null && photo.poseData !== null,
        )?.id ?? null,
    }),
  );
  const ungrouped = photos.filter((photo) => photo.poseGroupId === null);
  if (ungrouped.length) {
    trackers.push({
      id: null,
      label: "Other photos",
      photoCount: ungrouped.length,
      referencePhotoId: null,
    });
  }
  return trackers;
}
