import type { ProgressPhotoAlignment, ProgressPhotoPoseData } from "../types";

export type StoredProgressPhoto = {
  id: string;
  uri: string;
  capturedAt: string;
  poseGroupId?: string | null;
  referencePhotoId?: string | null;
  poseData?: ProgressPhotoPoseData | null;
  alignment?: ProgressPhotoAlignment | null;
};
