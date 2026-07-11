import * as Notifications from "expo-notifications";
import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

import {
  WORKOUT_LIVE_ACTIVITY_NAME,
  type WorkoutLiveActivityProps,
  type WorkoutOngoingActivityProps,
} from "./workout-ongoing-activity.types";

export { WORKOUT_LIVE_ACTIVITY_NAME };
export type { WorkoutLiveActivityProps, WorkoutOngoingActivityProps };

type WorkoutLiveUpdateNativeModule = {
  startOrUpdateWorkoutLiveUpdate(
    props: WorkoutOngoingActivityProps,
  ): Promise<void>;
  endWorkoutLiveUpdate(
    finalProps?: WorkoutOngoingActivityProps,
  ): Promise<void>;
};

const WorkoutLiveUpdateModule =
  requireOptionalNativeModule<WorkoutLiveUpdateNativeModule>(
    "WorkoutLiveUpdate",
  );

let liveUpdateQueue = Promise.resolve();
let notificationPermissionRequest: Promise<boolean> | null = null;

function runLiveUpdateTask(task: () => Promise<void>) {
  liveUpdateQueue = liveUpdateQueue.then(task).catch((error) => {
    console.warn("[WorkoutLiveUpdate] task failed", error);
  });

  return liveUpdateQueue;
}

function canUseWorkoutLiveUpdates() {
  return Platform.OS === "android" && WorkoutLiveUpdateModule != null;
}

async function ensureNotificationPermission() {
  const currentPermission = await Notifications.getPermissionsAsync();

  if (currentPermission.granted) return true;
  if (currentPermission.canAskAgain === false) return false;

  notificationPermissionRequest ??= Notifications.requestPermissionsAsync()
    .then((permission) => permission.granted)
    .finally(() => {
      notificationPermissionRequest = null;
    });

  return notificationPermissionRequest;
}

export function syncWorkoutLiveUpdate(props: WorkoutOngoingActivityProps) {
  if (__DEV__) {
    console.log("[WorkoutLiveUpdate] syncWorkoutLiveUpdate()");
  }

  const nativeModule = WorkoutLiveUpdateModule;

  if (!canUseWorkoutLiveUpdates() || nativeModule == null) {
    return Promise.resolve();
  }

  return runLiveUpdateTask(async () => {
    const hasNotificationPermission = await ensureNotificationPermission();

    if (!hasNotificationPermission) {
      console.warn("[WorkoutLiveUpdate] notification permission denied");
      return;
    }

    await nativeModule.startOrUpdateWorkoutLiveUpdate(props);
  });
}

export function endWorkoutLiveUpdate(finalProps?: WorkoutOngoingActivityProps) {
  const nativeModule = WorkoutLiveUpdateModule;

  if (!canUseWorkoutLiveUpdates() || nativeModule == null) {
    return Promise.resolve();
  }

  return runLiveUpdateTask(() =>
    nativeModule.endWorkoutLiveUpdate(finalProps),
  );
}

export const syncWorkoutLiveActivity = syncWorkoutLiveUpdate;
export const endWorkoutLiveActivity = endWorkoutLiveUpdate;
export const syncWorkoutOngoingActivity = syncWorkoutLiveUpdate;
export const endWorkoutOngoingActivity = endWorkoutLiveUpdate;
