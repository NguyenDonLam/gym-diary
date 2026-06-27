import AsyncStorage from "@react-native-async-storage/async-storage";

import type { WorkoutProgramFormData } from "../domain/type";
import { generateId } from "@/src/lib/id";

const KEY_PREFIX = "program-form-draft:";

function storageKey(key: string) {
  return `${KEY_PREFIX}${key}`;
}

export async function saveProgramFormDraft(
  formData: WorkoutProgramFormData,
): Promise<string> {
  const key = generateId();
  await AsyncStorage.setItem(storageKey(key), JSON.stringify(formData));
  return key;
}

export async function consumeProgramFormDraft(
  key: string,
): Promise<WorkoutProgramFormData | null> {
  const keyToRead = storageKey(key);
  const raw = await AsyncStorage.getItem(keyToRead);
  await AsyncStorage.removeItem(keyToRead);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as WorkoutProgramFormData;
  } catch {
    return null;
  }
}
