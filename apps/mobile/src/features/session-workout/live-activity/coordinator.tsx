import { useEffect, useMemo, useRef, useState } from "react";

import type { SessionExercise } from "@/src/features/session-exercise/domain/types";
import type { SessionSet } from "@/src/features/session-set/domain/types";

import { useOngoingSession } from "../hooks/use-ongoing-session";
import { useRestTimer } from "../hooks/use-rest-timer";
import {
  endWorkoutOngoingActivity,
  syncWorkoutOngoingActivity,
  type WorkoutOngoingActivityProps,
} from "./workout-live-activity";

type NextSetSnapshot = {
  exerciseName: string | null;
  quantity: number | string | null;
  quantityUnit: string | null;
  loadValue: number | string | null;
  loadUnit: string | null;
  setIndex: number | null;
  totalSetCount: number | null;
};

type SessionSetProgress = {
  completedSetCount: number;
  totalSetCount: number;
};

type LastSetSnapshot = {
  exerciseName: string | null;
  quantity: number | string | null;
  loadValue: number | string | null;
  loadUnit: string | null;
  setIndex: number | null;
  totalSetCount: number | null;
  deltaText: string | null;
};

function sortByOrder<T extends { orderIndex: number }>(rows: T[] | undefined) {
  return (rows ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
}

function getExpectedQuantity(set: SessionSet) {
  return set.quantity ?? set.targetQuantity ?? set.setProgram?.targetQuantity ?? null;
}

function getExpectedLoadValue(set: SessionSet) {
  return set.loadValue ?? set.setProgram?.loadValue ?? null;
}

function getCompletedQuantity(set: SessionSet) {
  return set.quantity ?? getExpectedQuantity(set);
}

function getCompletedLoadValue(set: SessionSet) {
  return set.loadValue ?? getExpectedLoadValue(set);
}

function findNextSetSnapshot(
  exercises: SessionExercise[] | undefined,
  anchorSetId: string | null | undefined,
): NextSetSnapshot | null {
  const orderedSets = sortByOrder(exercises).flatMap((exercise) => {
    const sets = sortByOrder(exercise.sets);
    return sets.map((set, index) => ({
      exercise,
      set,
      setIndex: index + 1,
      totalSetCount: sets.length,
    }));
  });

  if (orderedSets.length === 0) return null;

  const anchorIndex = anchorSetId
    ? orderedSets.findIndex(({ set }) => set.id === anchorSetId)
    : -1;
  const searchStartIndex = anchorIndex >= 0 ? anchorIndex + 1 : 0;

  const next =
    orderedSets
      .slice(searchStartIndex)
      .find(({ set }) => set.isCompleted !== true) ??
    orderedSets.find(({ set }) => set.isCompleted !== true) ??
    null;

  if (!next) return null;

  return {
    exerciseName: next.exercise.exerciseName ?? null,
    quantity: getExpectedQuantity(next.set),
    quantityUnit: next.exercise.quantityUnit,
    loadValue: getExpectedLoadValue(next.set),
    loadUnit: next.set.loadUnit ?? null,
    setIndex: next.setIndex,
    totalSetCount: next.totalSetCount,
  };
}

function findLastCompletedSetSnapshot(
  exercises: SessionExercise[] | undefined,
): LastSetSnapshot | null {
  const orderedSets = sortByOrder(exercises).flatMap((exercise) => {
    const sets = sortByOrder(exercise.sets);
    return sets.map((set, index) => ({
      exercise,
      set,
      setIndex: index + 1,
      totalSetCount: sets.length,
    }));
  });

  const lastCompleted = orderedSets
    .filter(({ set }) => set.isCompleted === true)
    .at(-1);

  if (!lastCompleted) return null;

  return {
    exerciseName: lastCompleted.exercise.exerciseName ?? null,
    quantity: getCompletedQuantity(lastCompleted.set),
    loadValue: getCompletedLoadValue(lastCompleted.set),
    loadUnit: lastCompleted.set.loadUnit ?? null,
    setIndex: lastCompleted.setIndex,
    totalSetCount: lastCompleted.totalSetCount,
    deltaText: null,
  };
}

function getSessionSetProgress(
  exercises: SessionExercise[] | undefined,
): SessionSetProgress {
  const sets = (exercises ?? []).flatMap((exercise) => exercise.sets ?? []);

  return {
    completedSetCount: sets.filter((set) => set.isCompleted === true).length,
    totalSetCount: sets.length,
  };
}

export function WorkoutLiveActivityCoordinator() {
  const { ongoingSession } = useOngoingSession();
  const { activeTimer, completedTimer, clearCompletedTimer } = useRestTimer();
  const lastSyncedSessionIdRef = useRef<string | null>(null);
  const lastLoggedCompletedTimerIdRef = useRef<string | null>(null);
  const [liveActivityNowMs, setLiveActivityNowMs] = useState(() => Date.now());

  useEffect(() => {
    setLiveActivityNowMs(Date.now());
  }, [activeTimer?.id, activeTimer?.endsAtMs, completedTimer?.completedAtMs]);

  const props = useMemo<WorkoutOngoingActivityProps | null>(() => {
    if (!ongoingSession || ongoingSession.status !== "in_progress") {
      return null;
    }

    const completedRestTimer =
      completedTimer &&
      (!completedTimer.sessionId ||
        completedTimer.sessionId === ongoingSession.id)
        ? completedTimer
        : null;

    const restTimer =
      activeTimer &&
      activeTimer.endsAtMs > liveActivityNowMs &&
      (!activeTimer.sessionId || activeTimer.sessionId === ongoingSession.id)
        ? activeTimer
        : null;
    const nextSet = findNextSetSnapshot(
      ongoingSession.exercises,
      restTimer?.setId ?? activeTimer?.setId ?? completedRestTimer?.setId ?? null,
    );
    const lastSet = findLastCompletedSetSnapshot(ongoingSession.exercises);
    const sessionSetProgress = getSessionSetProgress(ongoingSession.exercises);

    return {
      sessionId: ongoingSession.id,
      sessionName: ongoingSession.name?.trim() || "Workout",
      sessionStartedAtMs: ongoingSession.startedAt.getTime(),
      restStartedAtMs: restTimer?.startedAtMs ?? null,
      restEndsAtMs: restTimer?.endsAtMs ?? null,
      restTimerFinished: completedRestTimer !== null,
      restTimerFinishedAtMs: completedRestTimer?.completedAtMs ?? null,
      restExerciseName: restTimer?.exerciseName ?? null,
      restSetIndex: restTimer?.setIndex ?? null,
      nextExerciseName: nextSet?.exerciseName ?? null,
      nextSetQuantity: nextSet?.quantity ?? null,
      nextSetQuantityUnit: nextSet?.quantityUnit ?? null,
      nextSetLoadValue: nextSet?.loadValue ?? null,
      nextSetLoadUnit: nextSet?.loadUnit ?? null,
      nextSetIndex: nextSet?.setIndex ?? null,
      nextSetTotalCount: nextSet?.totalSetCount ?? null,
      completedSetCount: sessionSetProgress.completedSetCount,
      sessionTotalSetCount: sessionSetProgress.totalSetCount,
      lastExerciseName: lastSet?.exerciseName ?? null,
      lastSetQuantity: lastSet?.quantity ?? null,
      lastSetLoadValue: lastSet?.loadValue ?? null,
      lastSetLoadUnit: lastSet?.loadUnit ?? null,
      lastSetIndex: lastSet?.setIndex ?? null,
      totalSetCount: lastSet?.totalSetCount ?? null,
      lastSetDeltaText: lastSet?.deltaText ?? null,
    };
  }, [activeTimer, completedTimer, liveActivityNowMs, ongoingSession]);

  useEffect(() => {
    if (!props) {
      if (completedTimer) {
        clearCompletedTimer();
      }

      if (lastSyncedSessionIdRef.current) {
        lastSyncedSessionIdRef.current = null;
        void endWorkoutOngoingActivity();
      }
      return;
    }

    lastSyncedSessionIdRef.current = props.sessionId;

    if (
      completedTimer &&
      props.restTimerFinished &&
      lastLoggedCompletedTimerIdRef.current !== completedTimer.id
    ) {
      lastLoggedCompletedTimerIdRef.current = completedTimer.id;
      console.log("[LiveActivity] rest timer finished", {
        timerId: completedTimer.id,
        sessionId: completedTimer.sessionId,
        setId: completedTimer.setId,
        exerciseName: completedTimer.exerciseName,
        setIndex: completedTimer.setIndex,
        completedAtMs: completedTimer.completedAtMs,
      });
    }

    void syncWorkoutOngoingActivity(props);

    if (completedTimer) {
      clearCompletedTimer();
    }
  }, [clearCompletedTimer, completedTimer, props]);

  return null;
}
