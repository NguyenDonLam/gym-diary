// src/features/session-workout/context/ongoing-session.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  Dispatch,
  SetStateAction,
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
import { exerciseStatRepository } from "../../exercise-stats/data/repository";
import { ExerciseStat } from "../../exercise-stats/domain/types";
import { ExerciseStatFactory } from "../../exercise-stats/domain/factory";

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
  getContextForSet: (set: SessionSet) => StrengthScoreContext;
};

const OngoingSessionContext = createContext<OngoingSessionContextValue | null>(
  null
);

const EMPTY_CTX: StrengthScoreContext = {};

function createAggregate(
  session: SessionWorkout,
  lookupExerciseStat: Record<string, ExerciseStat>
): Aggregate {
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
    (exSession, ctx) => {
      const hit = lookupExerciseStat[exSession.exerciseId ?? ""];

      console.log("[strength-score ctx] exSession.id =", exSession.id);
      console.log(
        "[strength-score ctx] lookupExerciseStat keys =",
        Object.keys(lookupExerciseStat)
      );
      console.log(
        "[strength-score ctx] lookupExerciseStat[exSession.id] =",
        hit
      );
      console.log(
        "[strength-score ctx] baselineExerciseStrengthScore =",
        hit?.baselineExerciseStrengthScore ?? null
      );

      return {
        baselineExerciseStrengthScore:
          hit?.baselineExerciseStrengthScore ?? null,
      };
    },

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
  const { lookupExerciseStat } = useExerciseStats();

  const aggregate = useMemo<Aggregate | null>(() => {
    if (!ongoingSession) return null;
    return createAggregate(ongoingSession, lookupExerciseStat);
  }, [ongoingSession]);

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
   * - compute + persist set.e1rm, exercise.strengthScore, workout.strengthScore
   * - update ExerciseStat baseline + sampleCount (incremental mean)
   * - clear ongoing
   */
  const endSession = useCallback(async () => {
    if (!ongoingSession) return;
    if (!aggregate) {
      // no aggregate => cannot reliably compute scores
      const endedNoScores: SessionWorkout = {
        ...ongoingSession,
        status: "completed",
        endedAt: new Date(),
        updatedAt: new Date(),
      };
      await sessionWorkoutRepository.save(endedNoScores);
      setOngoingSession(endedNoScores);
      await setOngoingId(null);
      return;
    }

    const now = new Date();

    // 1) build the completed snapshot with embedded scores from the EXISTING aggregate caches
    const ended: SessionWorkout = {
      ...ongoingSession,
      status: "completed",
      endedAt: now,
      updatedAt: now,
      strengthScore: aggregate.getWorkoutScore(),
      strengthScoreVersion: aggregate.version,
      exercises: (ongoingSession.exercises ?? []).map((ex) => {
        return {
          ...ex,
          updatedAt: now,
          strengthScore: aggregate.getExerciseScore(ex.id) ?? null,
          strengthScoreVersion: aggregate.version,
          sets: (ex.sets ?? []).map((set) => {
            return {
              ...set,
              updatedAt: now,
              e1rm: aggregate.getSetScore(set.id) ?? null,
              e1rmVersion: aggregate.version,
            };
          }),
        };
      }),
    };

    // 2) persist completed session (with scores)
    await sessionWorkoutRepository.save(ended);
    setOngoingSession(ended);
    for (const exSession of ended.exercises ?? []) {
      const exerciseId = exSession.exerciseId;
      if (!exerciseId) continue;

      const v = aggregate.getExerciseScore(exSession.id);
      if (v == null || !Number.isFinite(v)) continue;

      const prevStat = await exerciseStatRepository.get(exerciseId);

      const updatedStat: ExerciseStat = {
        ...(prevStat ?? ExerciseStatFactory.create({ exerciseId })),
        exerciseId,
        baselineExerciseStrengthScore: v,
        sampleCount: 1,
        baselineSetE1rm: prevStat?.baselineSetE1rm ?? null,
        updatedAt: now,
      };

      await exerciseStatRepository.save(updatedStat);
    }

    // 4) clear ongoing
    await setOngoingId(null);
  }, [ongoingSession, aggregate, setOngoingId]);

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

  function getContextForSet(set: SessionSet): StrengthScoreContext {
    const exSession =
      ongoingSession?.exercises?.find(
        (ex) => ex.id === set.sessionExerciseId
      ) ?? null;

    const exerciseId = exSession?.exerciseId ?? null;

    const baseline = exerciseId ? lookupExerciseStat[exerciseId] : undefined;

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
        getContextForSet,
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
