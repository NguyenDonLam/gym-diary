// src/features/session-workout/context/ongoing-session.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { AppState, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { StrengthScoreContext } from "@gym-diary/strength-score/strategies";
import {
  ExerciseMeanScoreStrategy,
  ScoreAggregateV1,
  SetE1rmScoreStrategy,
  WorkoutNormalizedScoreStrategy,
} from "@gym-diary/strength-score/strategies";

import type { SessionExercise } from "@/src/features/session-exercise/domain/types";
import type { SessionSet } from "@/src/features/session-set/domain/types";
import type { SessionWorkout } from "../domain/types";

import { sessionWorkoutRepository } from "@/src/features/session-workout/data/repository";
import { workoutProgramRepository } from "@/src/features/program-workout/data/workout-program-repository";
import { SessionWorkoutFactory } from "../domain/factory";
import { WorkoutProgramFactory } from "../../program-workout/domain/factory";
import { saveProgramFormDraft } from "../../program-workout/data/program-form-draft-store";
import { useExerciseStats } from "../../exercise-stats/hooks/use-exercise-stats";
import { exerciseStatRepository } from "../../exercise-stats/data/repository";
import { ExerciseStat } from "../../exercise-stats/domain/types";
import { ExerciseStatFactory } from "../../exercise-stats/domain/factory";
import { statService } from "../../history/services/stat-service";
import {
  applySessionChangesToProgram,
  buildProgramFromSession,
  cloneProgramAsNew,
} from "../domain/program-save";
import { notifyWorkoutAutoEnded } from "../notifications/auto-end-notification";

const KEY = "ongoing";
const AUTO_END_AFTER_KEY = "settings:auto-end-workout-after-minutes";
const DEFAULT_AUTO_END_AFTER_MINUTES = 20;
const LAST_INTERACTION_KEY = "ongoing:last-interaction-at";
const LAST_INTERACTION_PERSIST_INTERVAL_MS = 15_000;
const LB_TO_KG = 0.45359237;
const MAX_TIMEOUT_MS = 2_147_483_647;

type Aggregate = ScoreAggregateV1<SessionSet, SessionExercise, SessionWorkout>;
export type AutoEndAfterMinutes = number | false;
type EndSessionOptions = {
  endedAt?: Date;
};

export type EndSessionProgramAction =
  | "none"
  | "update-source-program"
  | "save-as-new-program";

export type FinishProgramSavePrompt =
  | { kind: "none" }
  | { kind: "one-off" }
  | { kind: "program-changed"; programName: string };

export type FinishProgramDraftRoute =
  | { kind: "new"; draftKey: string }
  | { kind: "edit"; programId: string; draftKey: string };

type OngoingSessionContextValue = {
  mutationVersion: number;
  bumpMutationVersion: () => void;

  ongoingSession: SessionWorkout | null;
  startSession: (programId?: string) => Promise<SessionWorkout>;
  endSession: (options?: EndSessionOptions) => Promise<void>;
  getFinishProgramSavePrompt: () => Promise<FinishProgramSavePrompt>;
  createFinishProgramDraft: (
    programAction: Exclude<EndSessionProgramAction, "none">,
  ) => Promise<FinishProgramDraftRoute | null>;
  discardSession: () => Promise<void>;
  refresh: () => Promise<void>;
  autoEndAfterMinutes: AutoEndAfterMinutes;
  setAutoEndAfterMinutes: (value: AutoEndAfterMinutes) => Promise<void>;
  recordUserInteraction: () => void;

  aggregate: Aggregate | null;
  getContextForSet: (set: SessionSet) => StrengthScoreContext;
};

const OngoingSessionContext = createContext<OngoingSessionContextValue | null>(
  null,
);

function parseAutoEndAfterMinutes(
  raw: string | null,
): AutoEndAfterMinutes {
  if (raw == null) return DEFAULT_AUTO_END_AFTER_MINUTES;
  if (raw === "false") return false;

  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return false;

  return parsed;
}

function normalizeAutoEndAfterMinutes(
  value: AutoEndAfterMinutes,
): AutoEndAfterMinutes {
  if (value === false) return false;
  if (!Number.isFinite(value) || value <= 0) return false;
  return value;
}

function serializeAutoEndAfterMinutes(value: AutoEndAfterMinutes): string {
  return value === false ? "false" : String(value);
}

function createAggregate(
  session: SessionWorkout,
  lookupExerciseStat: Record<string, ExerciseStat>,
): Aggregate {
  const quantityUnitByExerciseSessionId = new Map(
    (session.exercises ?? []).map((ex) => [ex.id, ex.quantityUnit]),
  );

  const setStrategy = new SetE1rmScoreStrategy<SessionSet>(
    (s) => {
      if (quantityUnitByExerciseSessionId.get(s.sessionExerciseId) === "time") {
        return null;
      }

      if (s.loadUnit === "band" || s.loadUnit === "custom") return null;

      if (s.loadValue == null) return null;
      const t = s.loadValue.trim();
      if (t === "") return null;

      const raw = Number.parseFloat(t);
      if (!Number.isFinite(raw) || raw <= 0) return null;

      if (s.loadUnit === "lb") return raw * LB_TO_KG;
      return raw;
    },
    (s) =>
      quantityUnitByExerciseSessionId.get(s.sessionExerciseId) === "time"
        ? null
        : s.quantity,
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
  const [autoEndAfterMinutes, setAutoEndAfterMinutesState] =
    useState<AutoEndAfterMinutes>(DEFAULT_AUTO_END_AFTER_MINUTES);
  const autoEndAfterMinutesRef = useRef<AutoEndAfterMinutes>(
    DEFAULT_AUTO_END_AFTER_MINUTES,
  );
  const ongoingSessionRef = useRef<SessionWorkout | null>(null);
  const lastInteractionAtRef = useRef(Date.now());
  const lastInteractionPersistedAtRef = useRef(0);
  const autoEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoEndInFlightRef = useRef(false);
  const runAutoEndCheckRef = useRef<() => void>(() => {});
  const endSessionRef = useRef<
    (options?: EndSessionOptions) => Promise<void>
  >(async () => {});

  const bumpMutationVersion = useCallback(() => {
    setMutationVersion((v) => v + 1);
  }, []);

  const aggregate = useMemo<Aggregate | null>(() => {
    if (!ongoingSession) return null;
    return createAggregate(ongoingSession, lookupExerciseStat);
  }, [ongoingSession, lookupExerciseStat]);

  useEffect(() => {
    autoEndAfterMinutesRef.current = autoEndAfterMinutes;
  }, [autoEndAfterMinutes]);

  useEffect(() => {
    ongoingSessionRef.current = ongoingSession;
  }, [ongoingSession]);

  const clearAutoEndTimer = useCallback(() => {
    if (!autoEndTimerRef.current) return;
    clearTimeout(autoEndTimerRef.current);
    autoEndTimerRef.current = null;
  }, []);

  const scheduleAutoEndTimer = useCallback(() => {
    clearAutoEndTimer();

    const minutes = autoEndAfterMinutesRef.current;
    if (minutes === false || !ongoingSessionRef.current) return;

    const thresholdMs = minutes * 60_000;
    const idleMs = Date.now() - lastInteractionAtRef.current;
    const delayMs = Math.max(0, thresholdMs - idleMs);

    autoEndTimerRef.current = setTimeout(
      () => runAutoEndCheckRef.current(),
      Math.min(delayMs, MAX_TIMEOUT_MS),
    );
  }, [clearAutoEndTimer]);

  const persistLastInteractionAt = useCallback(
    async (time: number, force = false) => {
      if (
        !force &&
        time - lastInteractionPersistedAtRef.current <
          LAST_INTERACTION_PERSIST_INTERVAL_MS
      ) {
        return;
      }

      lastInteractionPersistedAtRef.current = time;

      try {
        await AsyncStorage.setItem(LAST_INTERACTION_KEY, String(time));
      } catch (e) {
        console.warn("[ongoing-session] failed to persist interaction", e);
      }
    },
    [],
  );

  const clearStoredLastInteraction = useCallback(async () => {
    clearAutoEndTimer();
    lastInteractionPersistedAtRef.current = 0;

    try {
      await AsyncStorage.removeItem(LAST_INTERACTION_KEY);
    } catch (e) {
      console.warn("[ongoing-session] failed to clear interaction", e);
    }
  }, [clearAutoEndTimer]);

  const setAutoEndAfterMinutes = useCallback(
    async (value: AutoEndAfterMinutes) => {
      const normalized = normalizeAutoEndAfterMinutes(value);
      setAutoEndAfterMinutesState(normalized);
      autoEndAfterMinutesRef.current = normalized;

      try {
        await AsyncStorage.setItem(
          AUTO_END_AFTER_KEY,
          serializeAutoEndAfterMinutes(normalized),
        );
      } catch (e) {
        console.warn("[ongoing-session] failed to persist auto-end setting", e);
      }

      scheduleAutoEndTimer();
    },
    [scheduleAutoEndTimer],
  );

  const recordUserInteraction = useCallback(() => {
    if (!ongoingId && !ongoingSessionRef.current) return;

    const now = Date.now();
    lastInteractionAtRef.current = now;
    void persistLastInteractionAt(now);
    scheduleAutoEndTimer();
  }, [ongoingId, persistLastInteractionAt, scheduleAutoEndTimer]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [storedAutoEndAfter, storedLastInteraction] = await Promise.all([
          AsyncStorage.getItem(AUTO_END_AFTER_KEY),
          AsyncStorage.getItem(LAST_INTERACTION_KEY),
        ]);

        if (cancelled) return;

        const parsedAutoEndAfter = parseAutoEndAfterMinutes(storedAutoEndAfter);
        setAutoEndAfterMinutesState(parsedAutoEndAfter);
        autoEndAfterMinutesRef.current = parsedAutoEndAfter;

        const parsedLastInteraction = Number.parseInt(
          storedLastInteraction ?? "",
          10,
        );

        if (Number.isFinite(parsedLastInteraction) && parsedLastInteraction > 0) {
          lastInteractionAtRef.current = parsedLastInteraction;
          lastInteractionPersistedAtRef.current = parsedLastInteraction;
        }
      } catch (e) {
        console.warn("[ongoing-session] failed to load auto-end setting", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
    if (id === null) {
      ongoingSessionRef.current = null;
      setOngoingSession(null);
    }

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

      const now = Date.now();
      lastInteractionAtRef.current = now;
      await persistLastInteractionAt(now, true);

      await setOngoingId(session.id);
      bumpMutationVersion();
      setOngoingSession(session);
      ongoingSessionRef.current = session;
      scheduleAutoEndTimer();

      return session;
    },
    [
      setOngoingId,
      bumpMutationVersion,
      persistLastInteractionAt,
      scheduleAutoEndTimer,
    ],
  );

  const getLatestOngoingSession = useCallback(async () => {
    if (!ongoingSession?.id) return ongoingSession;

    const latest = await sessionWorkoutRepository.get(ongoingSession.id);
    return latest ?? ongoingSession;
  }, [ongoingSession]);

  const getFinishProgramSavePrompt = useCallback(async () => {
    const session = await getLatestOngoingSession();
    if (!session) return { kind: "none" } as const;

    if (!session.sourceProgramId) return { kind: "one-off" } as const;

    const program = await workoutProgramRepository.get(session.sourceProgramId);
    if (!program) return { kind: "none" } as const;

    const { changed } = applySessionChangesToProgram(
      program,
      session,
      new Date(),
    );

    if (!changed) return { kind: "none" } as const;

    return {
      kind: "program-changed",
      programName: program.name,
    } as const;
  }, [getLatestOngoingSession]);

  const createFinishProgramDraft = useCallback(
    async (
      action: Exclude<EndSessionProgramAction, "none">,
    ): Promise<FinishProgramDraftRoute | null> => {
      const session = await getLatestOngoingSession();
      if (!session) return null;

      const now = new Date();

      if (!session.sourceProgramId) {
        if (action !== "save-as-new-program") return null;

        const program = buildProgramFromSession(session, now);
        const draftKey = await saveProgramFormDraft(
          WorkoutProgramFactory.formFromDomain(program),
        );
        return { kind: "new", draftKey };
      }

      const sourceProgram = await workoutProgramRepository.get(
        session.sourceProgramId,
      );
      if (!sourceProgram) return null;

      const { program: updatedProgram } = applySessionChangesToProgram(
        sourceProgram,
        session,
        now,
      );

      if (action === "update-source-program") {
        const draftKey = await saveProgramFormDraft(
          WorkoutProgramFactory.formFromDomain(updatedProgram),
        );
        return {
          kind: "edit",
          programId: sourceProgram.id,
          draftKey,
        };
      }

      if (action === "save-as-new-program") {
        const program = cloneProgramAsNew(
          updatedProgram,
          now,
          `${sourceProgram.name} copy`,
        );
        const draftKey = await saveProgramFormDraft(
          WorkoutProgramFactory.formFromDomain(program),
        );
        return { kind: "new", draftKey };
      }

      return null;
    },
    [getLatestOngoingSession],
  );

  const endSession = useCallback(async (options?: EndSessionOptions) => {
    if (!ongoingSession) return;

    const sessionForFinish = await getLatestOngoingSession();
    if (!sessionForFinish) return;

    const now = new Date();
    const requestedEndedAt = options?.endedAt ?? now;
    const startedAt = sessionForFinish.startedAt;
    const endedAt = new Date(
      Math.max(startedAt.getTime(), requestedEndedAt.getTime()),
    );

    if (!aggregate) {
      const endedNoScores = SessionWorkoutFactory.create({
        ...sessionForFinish,
        status: "completed",
        endedAt,
        updatedAt: now,
      });

      await sessionWorkoutRepository.save(endedNoScores);

      await statService.updateProgramStat(endedNoScores.id);
      await statService.updateExerciseStat(endedNoScores.id);

      setOngoingSession(endedNoScores);
      bumpMutationVersion();
      await setOngoingId(null);
      await clearStoredLastInteraction();
      return;
    }

    const ended = SessionWorkoutFactory.create({
      ...sessionForFinish,
      status: "completed",
      endedAt,
      updatedAt: now,
      strengthScore: aggregate.getWorkoutScore(),
      strengthScoreVersion: aggregate.version,
      exercises: (sessionForFinish.exercises ?? []).map((ex) => ({
        ...ex,
        updatedAt: now,
        strengthScore: aggregate.getExerciseScore(ex.id) ?? null,
        strengthScoreVersion: aggregate.version,
        sets: undefined,
      })),
    });

    await sessionWorkoutRepository.save(ended);

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
    await clearStoredLastInteraction();
    bumpMutationVersion();
  }, [
    ongoingSession,
    aggregate,
    setOngoingId,
    bumpMutationVersion,
    getLatestOngoingSession,
    clearStoredLastInteraction,
  ]);

  useEffect(() => {
    endSessionRef.current = endSession;
  }, [endSession]);

  const runAutoEndCheck = useCallback(() => {
    void (async () => {
      const minutes = autoEndAfterMinutesRef.current;
      if (minutes === false || !ongoingSessionRef.current) return;
      if (autoEndInFlightRef.current) return;

      const thresholdMs = minutes * 60_000;
      const now = Date.now();
      const idleMs = now - lastInteractionAtRef.current;

      if (idleMs < thresholdMs) {
        scheduleAutoEndTimer();
        return;
      }

      autoEndInFlightRef.current = true;

      try {
        await endSessionRef.current({
          endedAt: new Date(now - thresholdMs),
        });
        await notifyWorkoutAutoEnded(minutes);
      } catch (e) {
        console.warn("[ongoing-session] failed to auto-end session", e);
      } finally {
        autoEndInFlightRef.current = false;
      }
    })();
  }, [scheduleAutoEndTimer]);

  useEffect(() => {
    runAutoEndCheckRef.current = runAutoEndCheck;
  }, [runAutoEndCheck]);

  useEffect(() => {
    scheduleAutoEndTimer();
    return clearAutoEndTimer;
  }, [
    ongoingSession?.id,
    autoEndAfterMinutes,
    scheduleAutoEndTimer,
    clearAutoEndTimer,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        runAutoEndCheckRef.current();
        return;
      }

      if (ongoingSessionRef.current) {
        void persistLastInteractionAt(lastInteractionAtRef.current, true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [persistLastInteractionAt]);

  const discardSession = useCallback(async () => {
    if (!ongoingId) {
      await setOngoingId(null);
      await clearStoredLastInteraction();
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
    await clearStoredLastInteraction();
    setOngoingSession(null);
  }, [ongoingId, ongoingSession, setOngoingId, clearStoredLastInteraction]);

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
        getFinishProgramSavePrompt,
        createFinishProgramDraft,
        discardSession,
        refresh,
        autoEndAfterMinutes,
        setAutoEndAfterMinutes,
        recordUserInteraction,
        aggregate,
        getContextForSet,
        mutationVersion,
        bumpMutationVersion,
      }}
    >
      <View style={{ flex: 1 }} onTouchStart={recordUserInteraction}>
        {children}
      </View>
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
