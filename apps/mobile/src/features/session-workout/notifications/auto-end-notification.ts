import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const AUTO_END_CHANNEL_ID = "workout-auto-end";

let configured = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function formatMinutes(minutes: number) {
  const rounded = Math.max(1, Math.round(minutes));
  return `${rounded} ${rounded === 1 ? "minute" : "minutes"}`;
}

async function ensureNotificationsReady() {
  if (Platform.OS === "web") return false;

  if (Platform.OS === "android" && !configured) {
    await Notifications.setNotificationChannelAsync(AUTO_END_CHANNEL_ID, {
      name: "Workout auto end",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  configured = true;

  const existing = await Notifications.getPermissionsAsync();
  const finalStatus =
    existing.status === "granted"
      ? existing.status
      : (await Notifications.requestPermissionsAsync()).status;

  return finalStatus === "granted";
}

export async function notifyWorkoutAutoEnded(inactiveMinutes: number) {
  try {
    const ready = await ensureNotificationsReady();
    if (!ready) return;

    const minutesLabel = formatMinutes(inactiveMinutes);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Workout session ended",
        body: `No activity for ${minutesLabel}. Your workout session has been ended.`,
      },
      trigger:
        Platform.OS === "android"
          ? { channelId: AUTO_END_CHANNEL_ID }
          : null,
    });
  } catch (e) {
    console.warn("[ongoing-session] failed to send auto-end notification", e);
  }
}
