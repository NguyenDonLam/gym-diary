// src/features/session-workout/context/ongoing-session.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { StrengthScoreContext } from "@packages/strength-score/strategies";
import {
  ExerciseMeanScoreStrategy,
  ScoreAggregateV1,
  SetE1rmScoreStrategy,
  WorkoutNormalizedScoreStrategy,
} from "@packages/strength-score/strategies";

import type { SessionExercise } from "@/src/features/session-exercise/domain/types";
import type { SessionSet } from "@/src/features/session-set/domain/types";
import type { SessionWorkout } from "../domain/types";
import { sessionWorkoutRepository } from "@/src/features/session-workout/data/repository";

const KEY = "ongoing";
const LB_TO_KG = 0.45359237;

type Aggregate = ScoreAggregateV1<SessionSet, SessionExercise, SessionWorkout>;

type OngoingSessionContextValue = {
  ongoingId: string | null;
  ongoingSession: SessionWorkout | null;
  setOngoingId: (id: string | null) => Promise<void>;
  aggregate: Aggregate | null;
};

const OngoingSessionContext = createContext<OngoingSessionContextValue | null>(
  null
);

const EMPTY_CTX: StrengthScoreContext = {};

function createAggregate(session: SessionWorkout): Aggregate {
  const setStrategy = new SetE1rmScoreStrategy<SessionSet>(
    (s) => {
      if (s.loadUnit === "band" || s.loadUnit === "custom") return null;

      if (s.loadValue == null) return null;
      const t = s.loadValue.trim();
      if (t === "") return null;

      const raw = Number.parseFloat(t);
      if (!Number.isFinite(raw) || raw <= 0) return null;

      if (s.loadUnit === "lb") return raw * LB_TO_KG;
      return raw;
    },
    (s) => s.targetQuantity,
    (s) => 10 - (s.rpe ?? 10)
  );

  const exerciseStrategy = new ExerciseMeanScoreStrategy<
    SessionExercise,
    SessionSet
  >(
    (s) => setStrategy.scoreSet(s, EMPTY_CTX),
    (s) => s.isCompleted
  );

  const workoutStrategy = new WorkoutNormalizedScoreStrategy<
    SessionWorkout,
    SessionExercise,
    SessionSet
  >(
    (exSession, allSets) =>
      allSets.filter((s) => s.sessionExerciseId === exSession.id),
    () => ({}),
    (exSession) => exSession.strengthScore
  );

  return new ScoreAggregateV1<SessionSet, SessionExercise, SessionWorkout>({
    session,
    setStrategy,
    exerciseStrategy,
    workoutStrategy,
    getSetId: (s) => s.id,
    getSetExerciseSessionId: (s) => s.sessionExerciseId,
    getExerciseSessionId: (ex) => ex.id,
  });
}

export function OngoingSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ongoingId, setOngoingIdState] = useState<string | null>(null);
  const [ongoingSession, setOngoingSession] = useState<SessionWorkout | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(KEY);
        if (!cancelled) setOngoingIdState(stored ?? null);
      } catch (e) {
        console.warn("[ongoing-session] failed to load", e);
        if (!cancelled) setOngoingIdState(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!ongoingId) {
        setOngoingSession(null);
        return;
      }

      try {
        const s = await sessionWorkoutRepository.get(ongoingId);
        if (!cancelled) setOngoingSession(s ?? null);
      } catch (e) {
        console.warn("[ongoing-session] failed to load session", e);
        if (!cancelled) setOngoingSession(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ongoingId]);

  const setOngoingId = async (id: string | null) => {
    setOngoingIdState(id);

    if (id === null) setOngoingSession(null);

    try {
      if (id) await AsyncStorage.setItem(KEY, id);
      else await AsyncStorage.removeItem(KEY);
    } catch (e) {
      console.warn("[ongoing-session] failed to persist", e);
    }
  };

  const aggregate = useMemo<Aggregate | null>(() => {
    if (!ongoingSession) return null;
    return createAggregate(ongoingSession);
  }, [ongoingSession]);

  return (
    <OngoingSessionContext.Provider
      value={{ ongoingId, ongoingSession, setOngoingId, aggregate }}
    >
      {children}
    </OngoingSessionContext.Provider>
  );
}

export function useOngoingSession() {
  const ctx = useContext(OngoingSessionContext);
  if (!ctx) {
    throw new Error(
      "useOngoingSession must be used within OngoingSessionProvider"
    );
  }
  return ctx;
}
