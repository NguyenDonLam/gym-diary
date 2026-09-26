import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

import type {
  CreateProgressPhotoInput,
  ProgressPhoto,
  UpdateProgressPhotoAlignmentInput,
  UpdateProgressPhotoPoseMetadataInput,
} from "../types";
import { progressPhotoPersistenceMapper } from "./progress-photo-persistence.mapper";
import {
  deleteProgressPhoto,
  updateProgressPhotoAlignment,
  updateProgressPhotoPoseMetadata,
} from "./progress-photo-records";

const STORAGE_KEY = "progress-photos";
const PHOTO_DIRECTORY_NAME = "progress-photos";

async function readAll(): Promise<ProgressPhoto[]> {
  const serialized = await AsyncStorage.getItem(STORAGE_KEY);
  if (!serialized) return [];

  const parsed: unknown = JSON.parse(serialized);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map(progressPhotoPersistenceMapper.fromStored)
    .filter((row): row is ProgressPhoto => row !== null)
    .sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());
}

async function persist(photos: ProgressPhoto[]) {
  const rows = photos.map(progressPhotoPersistenceMapper.toStored);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

async function copyToDocumentStorage(sourceUri: string, id: string) {
  if (Platform.OS === "web") return sourceUri;

  const directory = new Directory(Paths.document, PHOTO_DIRECTORY_NAME);
  directory.create({ idempotent: true, intermediates: true });

  const source = new File(sourceUri);
  const extension = source.extension || ".jpg";
  const destination = new File(directory, `${id}${extension}`);

  await source.copy(destination);
  return destination.uri;
}

export const progressPhotoRepository = {
  getAll: readAll,

  async delete(id: string): Promise<ProgressPhoto[]> {
    const currentPhotos = await readAll();
    const photo = currentPhotos.find((item) => item.id === id);
    const remainingPhotos = deleteProgressPhoto(currentPhotos, id);
    if (
      photo &&
      Platform.OS !== "web" &&
      !remainingPhotos.some((item) => item.uri === photo.uri)
    ) {
      const directory = new Directory(Paths.document, PHOTO_DIRECTORY_NAME);
      const file = new File(photo.uri);
      // Only delete a managed file, never the original in a library or another directory.
      if (file.parentDirectory.uri === directory.uri && file.exists) {
        file.delete();
      }
    }
    await persist(remainingPhotos);
    return remainingPhotos;
  },

  async create(input: CreateProgressPhotoInput): Promise<ProgressPhoto> {
    const uri = await copyToDocumentStorage(input.sourceUri, input.id);
    const alignment = input.alignment ?? null;
    const alignmentStatus = alignment
      ? input.alignmentStatus === "manual"
        ? "manual"
        : "automatic"
      : "unavailable";
    const photo: ProgressPhoto = {
      id: input.id,
      uri,
      capturedAt: input.capturedAt,
      poseGroupId: input.poseGroupId ?? null,
      referencePhotoId: input.referencePhotoId ?? null,
      poseData: input.poseData ?? null,
      alignment,
      automaticAlignment:
        input.automaticAlignment ??
        (alignmentStatus === "automatic" ? alignment : null),
      alignmentStatus,
    };

    const photos = await readAll();
    await persist([photo, ...photos]);

    return photo;
  },

  async updatePoseMetadata(
    input: UpdateProgressPhotoPoseMetadataInput,
  ): Promise<ProgressPhoto | null> {
    const currentPhotos = await readAll();
    const { photos, updatedPhoto } = updateProgressPhotoPoseMetadata(
      currentPhotos,
      input,
    );

    if (!updatedPhoto) return null;

    await persist(photos);
    return updatedPhoto;
  },

  async updateAlignment(
    input: UpdateProgressPhotoAlignmentInput,
  ): Promise<ProgressPhoto | null> {
    const currentPhotos = await readAll();
    const { photos, updatedPhoto } = updateProgressPhotoAlignment(
      currentPhotos,
      input,
    );

    if (!updatedPhoto) return null;

    await persist(photos);
    return updatedPhoto;
  },
};
