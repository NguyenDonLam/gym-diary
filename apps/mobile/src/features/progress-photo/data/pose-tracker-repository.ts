import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "progress-pose-name:";

export const poseTrackerRepository = {
  async getNames(): Promise<Record<string, string>> {
    const keys = (await AsyncStorage.getAllKeys()).filter((key) =>
      key.startsWith(PREFIX),
    );
    const entries = await AsyncStorage.multiGet(keys);
    return Object.fromEntries(
      entries.flatMap(([key, value]) =>
        value?.trim() ? [[key.slice(PREFIX.length), value.trim()]] : [],
      ),
    );
  },
  async rename({ id, name }: { id: string; name: string }) {
    const normalized = name.trim();
    if (!id || !normalized || normalized.length > 40)
      throw new Error("INVALID_POSE_NAME");
    await AsyncStorage.setItem(`${PREFIX}${id}`, normalized);
    return { id, name: normalized };
  },
};
