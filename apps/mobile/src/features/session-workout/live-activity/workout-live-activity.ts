import type { WorkoutOngoingActivityProps } from "./workout-ongoing-activity.types";

export {
  WORKOUT_LIVE_ACTIVITY_NAME,
  type WorkoutLiveActivityProps,
  type WorkoutOngoingActivityProps,
} from "./workout-ongoing-activity.types";

if (__DEV__) {
  console.log("[LiveActivity] fallback module loaded");
}

export function syncWorkoutLiveActivity(_props: WorkoutOngoingActivityProps) {
  if (__DEV__) {
    console.log("[LiveActivity] syncWorkoutLiveActivity()");
  }

  return Promise.resolve();
}

export function endWorkoutLiveActivity(_finalProps?: WorkoutOngoingActivityProps) {
  return Promise.resolve();
}

export const syncWorkoutLiveUpdate = syncWorkoutLiveActivity;
export const endWorkoutLiveUpdate = endWorkoutLiveActivity;
export const syncWorkoutOngoingActivity = syncWorkoutLiveActivity;
export const endWorkoutOngoingActivity = endWorkoutLiveActivity;
