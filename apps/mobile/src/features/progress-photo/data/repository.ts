import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

import type { CreateProgressPhotoInput, ProgressPhoto } from "../types";
import { progressPhotoPersistenceMapper } from "./progress-photo-persistence.mapper";

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

  async create(input: CreateProgressPhotoInput): Promise<ProgressPhoto> {
    const uri = await copyToDocumentStorage(input.sourceUri, input.id);
    const photo: ProgressPhoto = {
      id: input.id,
      uri,
      capturedAt: input.capturedAt,
    };

    const photos = await readAll();
    await persist([photo, ...photos]);

    return photo;
  },
};
