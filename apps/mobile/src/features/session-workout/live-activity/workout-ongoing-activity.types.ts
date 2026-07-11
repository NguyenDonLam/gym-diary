export const WORKOUT_LIVE_ACTIVITY_NAME = "WorkoutLiveActivity";

export type WorkoutOngoingActivityProps = {
  sessionId: string;
  sessionName: string;
  sessionStartedAtMs: number;
  restStartedAtMs?: number | null;
  restEndsAtMs?: number | null;
  restTimerFinished?: boolean | null;
  restTimerFinishedAtMs?: number | null;
  restExerciseName?: string | null;
  restSetIndex?: number | null;
  nextExerciseName?: string | null;
  nextSetQuantity?: number | string | null;
  nextSetQuantityUnit?: string | null;
  nextSetLoadValue?: number | string | null;
  nextSetLoadUnit?: string | null;
  nextSetIndex?: number | null;
  nextSetTotalCount?: number | null;
  completedSetCount?: number | null;
  sessionTotalSetCount?: number | null;
  lastExerciseName?: string | null;
  lastSetQuantity?: number | string | null;
  lastSetLoadValue?: number | string | null;
  lastSetLoadUnit?: string | null;
  lastSetIndex?: number | null;
  totalSetCount?: number | null;
  lastSetDeltaText?: string | null;
};

export type WorkoutLiveActivityProps = WorkoutOngoingActivityProps;
