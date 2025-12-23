// src/features/session-workout/context/ongoing-session.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
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
// IMPORTANT: you must provide an implementation for this (whatever module you already use)
import { workoutProgramRepository } from "@/src/features/program-workout/data/workout-program-repository";
import { WorkoutProgramFactory } from "@/src/features/program-workout/domain/factory";
import { SessionWorkoutFactory } from "../domain/factory";
import { useExerciseStats } from "../../exercise-stats/hooks/use-exercise-stats";

const KEY = "ongoing";
const LB_TO_KG = 0.45359237;

type Aggregate = ScoreAggregateV1<SessionSet, SessionExercise, SessionWorkout>;

type OngoingSessionContextValue = {
  ongoingSession: SessionWorkout | null;

  // lifecycle
  startSession: (programId?: string) => Promise<SessionWorkout>;
  endSession: () => Promise<void>;
  discardSession: () => Promise<void>;

  // helpers
  refresh: () => Promise<void>;

  // scoring
  aggregate: Aggregate | null;
  getContextForSet: (set: SessionSet) => StrengthScoreContext
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
    (s) => s.quantity,
    (s) => 10 - (s.rpe ?? 10)
  );

  // two-phase: strategies can consult aggregate caches after agg is assigned
  let agg: Aggregate | null = null;

  const exerciseStrategy = new ExerciseMeanScoreStrategy<
    SessionExercise,
    SessionSet
  >(
    (s) => {
      // prefer aggregate cache (updated during upsertSet), fallback to persisted field
      const v = agg?.getSetScore(s.id);
      return v !== undefined ? v : s.e1rm;
    },
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
    (exSession) => {
      // prefer aggregate cache (updated when any set changes), fallback to persisted field
      const v = agg?.getExerciseScore(exSession.id);
      return v !== undefined ? v : exSession.strengthScore;
    }
  );

  const built = new ScoreAggregateV1<
    SessionSet,
    SessionExercise,
    SessionWorkout
  >({
    session,
    setStrategy,
    exerciseStrategy,
    workoutStrategy,
    getExerciseSessions: (s) => s.exercises ?? [],
    getSets: (s) => {
      const out: SessionSet[] = [];
      const exercises = s.exercises ?? [];
      for (const ex of exercises) {
        const sets = ex.sets ?? [];
        for (const set of sets) out.push(set);
      }
      return out;
    },
    getSetId: (s) => s.id,
    getSetExerciseSessionId: (s) => s.sessionExerciseId,
    getExerciseSessionId: (ex) => ex.id,
  });

  agg = built;
  return built;
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
  const { byExerciseId: exerciseStatByExerciseId } = useExerciseStats();

  const exerciseBaselineByExerciseId = useMemo(() => {
    const out: Record<
      string,
      { baselineExerciseStrengthScore: number | null; sampleCount?: number }
    > = {};

    for (const exerciseId of Object.keys(exerciseStatByExerciseId)) {
      const stat = exerciseStatByExerciseId[exerciseId];
      out[exerciseId] = {
        baselineExerciseStrengthScore:
          stat.baselineExerciseStrengthScore ?? null,
        sampleCount: stat.sampleCount,
      };
    }

    return out;
  }, [exerciseStatByExerciseId]);

  // load ongoing id from storage on boot
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

  const refresh = useCallback(async () => {
    if (!ongoingId) {
      setOngoingSession(null);
      return;
    }
    try {
      const s = await sessionWorkoutRepository.get(ongoingId);
      setOngoingSession(s ?? null);
    } catch (e) {
      console.warn("[ongoing-session] failed to load session", e);
      setOngoingSession(null);
    }
  }, [ongoingId]);

  // load ongoing session whenever id changes
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

  const setOngoingId = useCallback(async (id: string | null) => {
    setOngoingIdState(id);
    if (id === null) setOngoingSession(null);

    try {
      if (id) await AsyncStorage.setItem(KEY, id);
      else await AsyncStorage.removeItem(KEY);
    } catch (e) {
      console.warn("[ongoing-session] failed to persist", e);
    }
  }, []);

  /**
   * startOngoing(programId)
   * - fetch program
   * - build a new session structure
   * - persist it
   * - set as ongoing
   */
  const startSession = useCallback(
    async (programId?: string | null) => {
      let session: SessionWorkout;

      if (programId) {
        const program = await workoutProgramRepository.get(programId);
        if (!program) throw new Error("Program not found");
        session = SessionWorkoutFactory.domainFromProgram(program);
      } else {
        session = SessionWorkoutFactory.create();
      }

      await sessionWorkoutRepository.save(session);

      await setOngoingId(session.id);
      setOngoingSession(session);

      return session;
    },
    [setOngoingId]
  );

  /**
   * endSession()
   * - mark endedAt
   * - persist
   * - clear ongoing
   */
  const endSession = useCallback(async () => {
    if (!ongoingSession) return;

    const ended: SessionWorkout = {
      ...ongoingSession,
      status: "completed",
      endedAt: new Date(),
      updatedAt: new Date(),
    };

    await sessionWorkoutRepository.save(ended);
    setOngoingSession(ended);
    await setOngoingId(null);
  }, [ongoingSession, setOngoingId]);

  /**
   * discardSession()
   * - set status to discarded
   * - clear ongoing
   */
  const discardSession = useCallback(async () => {
    if (!ongoingId) {
      await setOngoingId(null);
      setOngoingSession(null);
      return;
    }
    if (!ongoingSession) return;
    const discarded: SessionWorkout = {
      ...ongoingSession,
      status: "discarded",
      endedAt: new Date(),
      updatedAt: new Date(),
    };
    await sessionWorkoutRepository.save(discarded);
    await setOngoingId(null);
    setOngoingSession(null);
  }, [ongoingId, setOngoingId]);

  const aggregate = useMemo<Aggregate | null>(() => {
    if (!ongoingSession) return null;
    return createAggregate(ongoingSession);
  }, [ongoingSession]);

function getContextForSet(set: SessionSet): StrengthScoreContext {
  const exSession =
    ongoingSession?.exercises?.find((ex) => ex.id === set.sessionExerciseId) ??
    null;

  const exerciseId = exSession?.exerciseId ?? null;

  const baseline = exerciseId
    ? exerciseBaselineByExerciseId[exerciseId]
    : undefined;

  return {
    baselineExerciseStrengthScore:
      baseline?.baselineExerciseStrengthScore ?? null,
    sampleCount: baseline?.sampleCount,
    baselineSetE1rm: null,
    baselineWorkoutStrengthScore: null,
  };
}



  return (
    <OngoingSessionContext.Provider
      value={{
        ongoingSession,
        startSession,
        endSession,
        discardSession,
        refresh,
        aggregate,
        getContextForSet
      }}
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
