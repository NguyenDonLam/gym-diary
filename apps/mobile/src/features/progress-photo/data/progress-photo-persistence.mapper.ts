import type { ProgressPhoto } from "../types";
import type { StoredProgressPhoto } from "./types";

function isStoredProgressPhoto(value: unknown): value is StoredProgressPhoto {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<StoredProgressPhoto>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.uri === "string" &&
    typeof candidate.capturedAt === "string"
  );
}

export const progressPhotoPersistenceMapper = {
  fromStored(value: unknown): ProgressPhoto | null {
    if (!isStoredProgressPhoto(value)) return null;

    const capturedAt = new Date(value.capturedAt);
    if (Number.isNaN(capturedAt.getTime())) return null;

    return {
      id: value.id,
      uri: value.uri,
      capturedAt,
    };
  },

  toStored(photo: ProgressPhoto): StoredProgressPhoto {
    return {
      id: photo.id,
      uri: photo.uri,
      capturedAt: photo.capturedAt.toISOString(),
    };
  },
};
