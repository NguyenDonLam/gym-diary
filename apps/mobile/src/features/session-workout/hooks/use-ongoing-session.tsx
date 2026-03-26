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
import { workoutProgramRepository } from "@/src/features/program-workout/data/workout-program-repository";
import { SessionWorkoutFactory } from "../domain/factory";
import { useExerciseStats } from "../../exercise-stats/hooks/use-exercise-stats";
import { exerciseStatRepository } from "../../exercise-stats/data/repository";
import { ExerciseStat } from "../../exercise-stats/domain/types";
import { ExerciseStatFactory } from "../../exercise-stats/domain/factory";
import { statService } from "../../history/services/stat-service";

const KEY = "ongoing";
const LB_TO_KG = 0.45359237;

type Aggregate = ScoreAggregateV1<SessionSet, SessionExercise, SessionWorkout>;

type OngoingSessionContextValue = {
  mutationVersion: number;
  bumpMutationVersion: () => void;

  ongoingSession: SessionWorkout | null;
  startSession: (programId?: string) => Promise<SessionWorkout>;
  endSession: () => Promise<void>;
  discardSession: () => Promise<void>;
  refresh: () => Promise<void>;

  aggregate: Aggregate | null;
  getContextForSet: (set: SessionSet) => StrengthScoreContext;
};

const OngoingSessionContext = createContext<OngoingSessionContextValue | null>(
  null,
);

function createAggregate(
  session: SessionWorkout,
  lookupExerciseStat: Record<string, ExerciseStat>,
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
    (s) => 10 - (s.rpe ?? 10),
  );

  let agg: Aggregate | null = null;

  const exerciseStrategy = new ExerciseMeanScoreStrategy<
    SessionExercise,
    SessionSet
  >(
    (s) => {
      const v = agg?.getSetScore(s.id);
      return v !== undefined ? v : s.e1rm;
    },
    (s) => s.isCompleted,
  );

  const workoutStrategy = new WorkoutNormalizedScoreStrategy<
    SessionWorkout,
    SessionExercise,
    SessionSet
  >(
    (exSession, allSets) =>
      allSets.filter((s) => s.sessionExerciseId === exSession.id),
    (exSession) => {
      const hit = lookupExerciseStat[exSession.exerciseId ?? ""];

      return {
        baselineExerciseStrengthScore:
          hit?.baselineExerciseStrengthScore ?? null,
      };
    },
    (exSession) => {
      const v = agg?.getExerciseScore(exSession.id);
      return v !== undefined ? v : exSession.strengthScore;
    },
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
    null,
  );
  const { lookupExerciseStat } = useExerciseStats();
  const [mutationVersion, setMutationVersion] = useState(0);

  const bumpMutationVersion = useCallback(() => {
    setMutationVersion((v) => v + 1);
  }, []);

  const aggregate = useMemo<Aggregate | null>(() => {
    if (!ongoingSession) return null;
    return createAggregate(ongoingSession, lookupExerciseStat);
  }, [ongoingSession, lookupExerciseStat]);

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
      bumpMutationVersion();
      setOngoingSession(session);

      return session;
    },
    [setOngoingId, bumpMutationVersion],
  );

  const syncCompletedSessionBackToProgram = useCallback(
    async (session: SessionWorkout, now: Date) => {
      const sourceProgramId = session.sourceProgramId;
      if (!sourceProgramId) return;

      const program = await workoutProgramRepository.get(sourceProgramId);
      if (!program) return;

      let changed = false;

      const updatedProgram = {
        ...program,
        updatedAt: now,
        exercises: (program.exercises ?? []).map((programExercise) => {
          const sessionExercise = (session.exercises ?? []).find(
            (ex) => ex.exerciseProgramId === programExercise.id,
          );

          if (!sessionExercise) return programExercise;

          let exerciseChanged = false;

          const updatedSets = (programExercise.sets ?? []).map((programSet) => {
            const sessionSet = (sessionExercise.sets ?? []).find(
              (s) =>
                s.setProgramId === programSet.id &&
                s.isCompleted &&
                !s.isWarmup,
            );

            if (!sessionSet) return programSet;

            const hasLoadValue =
              sessionSet.loadValue != null &&
              sessionSet.loadValue.trim() !== "";
            const hasTargetRpe = sessionSet.rpe != null;
            const hasQuantity = sessionSet.quantity != null;

            const nextLoadUnit = hasLoadValue
              ? sessionSet.loadUnit
              : programSet.loadUnit;

            const nextLoadValue = hasLoadValue
              ? sessionSet.loadValue
              : programSet.loadValue;

            const nextTargetRpe = hasTargetRpe
              ? sessionSet.rpe
              : programSet.targetRpe;

            const nextTargetQuantity = hasQuantity
              ? sessionSet.quantity
              : programSet.targetQuantity;

            const didChange =
              nextLoadUnit !== programSet.loadUnit ||
              nextLoadValue !== programSet.loadValue ||
              nextTargetRpe !== programSet.targetRpe ||
              nextTargetQuantity !== programSet.targetQuantity;

            if (!didChange) return programSet;

            changed = true;
            exerciseChanged = true;

            return {
              ...programSet,
              loadUnit: nextLoadUnit,
              loadValue: nextLoadValue,
              targetRpe: nextTargetRpe,
              targetQuantity: nextTargetQuantity,
              updatedAt: now,
            };
          });

          if (!exerciseChanged) return programExercise;

          return {
            ...programExercise,
            updatedAt: now,
            sets: updatedSets,
          };
        }),
      };

      if (!changed) return;

      await workoutProgramRepository.save(updatedProgram);
    },
    [],
  );

  const endSession = useCallback(async () => {
    if (!ongoingSession) return;

    if (!aggregate) {
      const now = new Date();

      const endedNoScores = SessionWorkoutFactory.create({
        ...ongoingSession,
        status: "completed",
        endedAt: now,
        updatedAt: now,
      });

      await sessionWorkoutRepository.save(endedNoScores);
      await syncCompletedSessionBackToProgram(ongoingSession, now);

      await statService.updateProgramStat(endedNoScores.id);
      await statService.updateExerciseStat(endedNoScores.id);

      setOngoingSession(endedNoScores);
      bumpMutationVersion();
      await setOngoingId(null);
      return;
    }

    const now = new Date();

    const ended = SessionWorkoutFactory.create({
      ...ongoingSession,
      status: "completed",
      endedAt: now,
      updatedAt: now,
      strengthScore: aggregate.getWorkoutScore(),
      strengthScoreVersion: aggregate.version,
      exercises: (ongoingSession.exercises ?? []).map((ex) => ({
        ...ex,
        updatedAt: now,
        strengthScore: aggregate.getExerciseScore(ex.id) ?? null,
        strengthScoreVersion: aggregate.version,
        sets: undefined,
      })),
    });

    await sessionWorkoutRepository.save(ended);
    await syncCompletedSessionBackToProgram(ongoingSession, now);

    await statService.updateProgramStat(ended.id);
    await statService.updateExerciseStat(ended.id);

    setOngoingSession(ended);

    for (const exSession of ended.exercises ?? []) {
      const exerciseId = exSession.exerciseId;
      if (!exerciseId) continue;

      const v = aggregate.getExerciseScore(exSession.id);
      if (v == null || !Number.isFinite(v)) continue;

      const prevStat = await exerciseStatRepository.get(exerciseId);
      if (prevStat?.baselineExerciseStrengthScore != null) continue;

      const updatedStat: ExerciseStat = {
        ...(prevStat ?? ExerciseStatFactory.create({ exerciseId })),
        exerciseId,
        baselineExerciseStrengthScore: v,
        baselineSetE1rm: prevStat?.baselineSetE1rm ?? null,
        updatedAt: now,
      };

      await exerciseStatRepository.save(updatedStat);
    }

    await setOngoingId(null);
    bumpMutationVersion();
  }, [
    ongoingSession,
    aggregate,
    setOngoingId,
    bumpMutationVersion,
    syncCompletedSessionBackToProgram,
  ]);

  const discardSession = useCallback(async () => {
    if (!ongoingId) {
      await setOngoingId(null);
      setOngoingSession(null);
      return;
    }

    if (!ongoingSession) return;

    const discarded: SessionWorkout = SessionWorkoutFactory.create({
      ...ongoingSession,
      status: "discarded",
      endedAt: new Date(),
      updatedAt: new Date(),
    });

    await sessionWorkoutRepository.save(discarded);
    await setOngoingId(null);
    setOngoingSession(null);
  }, [ongoingId, ongoingSession, setOngoingId]);

  function getContextForSet(set: SessionSet): StrengthScoreContext {
    const exSession =
      ongoingSession?.exercises?.find(
        (ex) => ex.id === set.sessionExerciseId,
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
        mutationVersion,
        bumpMutationVersion,
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
      "useOngoingSession must be used within OngoingSessionProvider",
    );
  }
  return ctx;
}
