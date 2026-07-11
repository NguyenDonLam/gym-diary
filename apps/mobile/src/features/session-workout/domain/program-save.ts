import type { ExerciseProgram } from "@/src/features/program-exercise/domain/type";
import type { SetProgram } from "@/src/features/program-set/domain/type";
import type {
  WorkoutProgram,
  ProgramColor,
} from "@/src/features/program-workout/domain/type";
import type { SessionExercise } from "@/src/features/session-exercise/domain/types";
import type { SessionSet } from "@/src/features/session-set/domain/types";
import type { SessionWorkout } from "./types";
import { generateId } from "@/src/lib/id";
import { normalizeRestSeconds } from "../../program-set/domain/rest";

type ProgramChangeResult = {
  program: WorkoutProgram;
  changed: boolean;
};

function sortByOrder<T extends { orderIndex: number }>(rows: T[]) {
  return rows.slice().sort((a, b) => a.orderIndex - b.orderIndex);
}

function cleanText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}

function hasSessionSetWork(set: SessionSet) {
  if (set.isWarmup) return false;
  if (set.isCompleted) return true;
  if (set.quantity != null) return true;
  return cleanText(set.loadValue) != null;
}

function shouldApplySetToProgram(set: SessionSet) {
  return set.isCompleted && !set.isWarmup;
}

function getProgramSetFields(set: SessionSet, fallback?: SetProgram) {
  const sessionLoadValue = cleanText(set.loadValue);

  return {
    targetQuantity:
      set.quantity ?? set.targetQuantity ?? fallback?.targetQuantity ?? null,
    restSeconds: normalizeRestSeconds(set.restSeconds ?? fallback?.restSeconds),
    loadUnit:
      sessionLoadValue != null ? set.loadUnit : fallback?.loadUnit ?? set.loadUnit,
    loadValue: sessionLoadValue ?? fallback?.loadValue ?? null,
    targetRpe: set.rpe ?? fallback?.targetRpe ?? null,
  };
}

function setFieldsChanged(next: ReturnType<typeof getProgramSetFields>, prev: SetProgram) {
  return (
    next.targetQuantity !== prev.targetQuantity ||
    next.restSeconds !== prev.restSeconds ||
    next.loadUnit !== prev.loadUnit ||
    next.loadValue !== prev.loadValue ||
    next.targetRpe !== prev.targetRpe
  );
}

function sessionSetToProgramSet(input: {
  set: SessionSet;
  exerciseProgramId: string;
  orderIndex: number;
  now: Date;
  fallback?: SetProgram;
}): SetProgram {
  const fields = getProgramSetFields(input.set, input.fallback);

  return {
    id: generateId(),
    exerciseProgramId: input.exerciseProgramId,
    orderIndex: input.orderIndex,
    targetQuantity: fields.targetQuantity,
    restSeconds: fields.restSeconds,
    loadUnit: fields.loadUnit,
    loadValue: fields.loadValue,
    targetRpe: fields.targetRpe,
    note: input.set.note ?? input.fallback?.note ?? null,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

function sessionExerciseToProgramExercise(input: {
  sessionExercise: SessionExercise;
  workoutProgramId: string;
  orderIndex: number;
  now: Date;
}): ExerciseProgram | null {
  const exerciseId = input.sessionExercise.exerciseId;
  if (!exerciseId) return null;

  const exerciseProgramId = generateId();
  const sets = sortByOrder(input.sessionExercise.sets ?? [])
    .filter(hasSessionSetWork)
    .map((set, index) =>
      sessionSetToProgramSet({
        set,
        exerciseProgramId,
        orderIndex: index + 1,
        now: input.now,
        fallback: set.setProgram,
      }),
    );

  return {
    id: exerciseProgramId,
    exerciseId,
    workoutProgramId: input.workoutProgramId,
    quantityUnit: input.sessionExercise.quantityUnit,
    exercise: undefined,
    orderIndex: input.orderIndex,
    note: input.sessionExercise.note ?? null,
    sets,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

function getFallbackProgramName(session: SessionWorkout) {
  const rawName = cleanText(session.name);
  if (rawName) return rawName;

  const date = session.startedAt;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `Session ${yyyy}-${mm}-${dd}`;
}

export function buildProgramFromSession(
  session: SessionWorkout,
  now: Date,
): WorkoutProgram {
  const programId = generateId();

  const exercises = sortByOrder(session.exercises ?? []).reduce<
    ExerciseProgram[]
  >((acc, sessionExercise) => {
    const programExercise = sessionExerciseToProgramExercise({
      sessionExercise,
      workoutProgramId: programId,
      orderIndex: acc.length + 1,
      now,
    });

    if (programExercise) acc.push(programExercise);
    return acc;
  }, []);

  return {
    id: programId,
    name: getFallbackProgramName(session),
    description: null,
    folderId: null,
    color: (session.color ?? "neutral") as ProgramColor,
    createdAt: now,
    updatedAt: now,
    exercises,
  };
}

export function applySessionChangesToProgram(
  source: WorkoutProgram,
  session: SessionWorkout,
  now: Date,
): ProgramChangeResult {
  let changed = false;

  const sessionExercisesByProgramId = new Map(
    (session.exercises ?? [])
      .filter((ex) => ex.exerciseProgramId)
      .map((ex) => [ex.exerciseProgramId!, ex]),
  );

  const sourceExerciseIds = new Set(source.exercises.map((ex) => ex.id));

  const nextExercises = sortByOrder(source.exercises).map((programExercise) => {
    const sessionExercise = sessionExercisesByProgramId.get(programExercise.id);
    if (!sessionExercise) return programExercise;

    let exerciseChanged = false;
    const sourceSetIds = new Set(programExercise.sets.map((set) => set.id));
    const sessionSets = sortByOrder(sessionExercise.sets ?? []);
    const applicableSetsByProgramId = new Map(
      sessionSets
        .filter((set) => set.setProgramId && shouldApplySetToProgram(set))
        .map((set) => [set.setProgramId!, set]),
    );

    const nextSets = sortByOrder(programExercise.sets).map((programSet) => {
      const sessionSet = applicableSetsByProgramId.get(programSet.id);
      if (!sessionSet) return programSet;

      const fields = getProgramSetFields(sessionSet, programSet);
      if (!setFieldsChanged(fields, programSet)) return programSet;

      changed = true;
      exerciseChanged = true;

      return {
        ...programSet,
        ...fields,
        updatedAt: now,
      };
    });

    const addedSets = sessionSets
      .filter(
        (set) =>
          hasSessionSetWork(set) &&
          (!set.setProgramId || !sourceSetIds.has(set.setProgramId)),
      )
      .map((set, index) =>
        sessionSetToProgramSet({
          set,
          exerciseProgramId: programExercise.id,
          orderIndex: nextSets.length + index + 1,
          now,
          fallback: set.setProgram,
        }),
      );

    if (addedSets.length > 0) {
      changed = true;
      exerciseChanged = true;
    }

    if (!exerciseChanged) return programExercise;

    return {
      ...programExercise,
      updatedAt: now,
      sets: [...nextSets, ...addedSets],
    };
  });

  const addedExercises = sortByOrder(session.exercises ?? []).reduce<
    ExerciseProgram[]
  >((acc, sessionExercise) => {
    if (
      sessionExercise.exerciseProgramId &&
      sourceExerciseIds.has(sessionExercise.exerciseProgramId)
    ) {
      return acc;
    }

    const programExercise = sessionExerciseToProgramExercise({
      sessionExercise,
      workoutProgramId: source.id,
      orderIndex: nextExercises.length + acc.length + 1,
      now,
    });

    if (programExercise) acc.push(programExercise);
    return acc;
  }, []);

  if (addedExercises.length > 0) changed = true;

  if (!changed) return { program: source, changed: false };

  return {
    program: {
      ...source,
      updatedAt: now,
      exercises: [...nextExercises, ...addedExercises],
    },
    changed: true,
  };
}

export function cloneProgramAsNew(
  source: WorkoutProgram,
  now: Date,
  name = `${source.name} copy`,
): WorkoutProgram {
  const programId = generateId();

  return {
    ...source,
    id: programId,
    name,
    createdAt: now,
    updatedAt: now,
    exercises: sortByOrder(source.exercises).map((exercise, exIndex) => {
      const exerciseProgramId = generateId();

      return {
        ...exercise,
        id: exerciseProgramId,
        workoutProgramId: programId,
        orderIndex: exIndex + 1,
        createdAt: now,
        updatedAt: now,
        sets: sortByOrder(exercise.sets).map((set, setIndex) => ({
          ...set,
          id: generateId(),
          exerciseProgramId,
          orderIndex: setIndex + 1,
          createdAt: now,
          updatedAt: now,
        })),
      };
    }),
  };
}
