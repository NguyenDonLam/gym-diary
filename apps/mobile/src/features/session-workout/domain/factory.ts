// src/features/session-workout/domain/session-workout-factory.ts

import type { WorkoutProgram } from "@/src/features/program-workout/domain/type";
import { generateId } from "@/src/lib/id";

import type { SessionWorkout } from "./types";
import type { SessionExercise } from "@/src/features/session-exercise/domain/types";
import type { SessionSet } from "@/src/features/session-set/domain/types";

import type { SessionWorkoutRow } from "../data/types";
import type { SessionExerciseRow } from "@/src/features/session-exercise/data/types";
import type { SessionSetRow } from "@/src/features/session-set/data/types";

import type { SetProgramRow } from "@/src/features/program-set/data/type";
import type { SetProgram } from "@/src/features/program-set/domain/type";
import { WorkoutProgramFactory } from "../../program-workout/domain/factory";

export class SessionWorkoutFactory {
  // -----------------------------
  // Domain construction (program -> session)
  // -----------------------------
  static domainFromProgram(program: WorkoutProgram): SessionWorkout {
    const now = new Date();
    const sessionId = generateId();

    const sessionExercises: SessionExercise[] = (program.exercises ?? [])
      .slice()
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map((exProgram, exIndex) => {
        const sessionExerciseId = generateId();

        const sets: SessionSet[] = (exProgram.sets ?? [])
          .slice()
          .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
          .map((setProgram, setIndex) => ({
            id: generateId(),

            sessionExerciseId,
            setProgramId: setProgram.id,
            setProgram: setProgram,

            orderIndex: setProgram.orderIndex ?? setIndex,

            targetQuantity: null,
            quantity: null,
            loadUnit: setProgram.loadUnit,
            loadValue: setProgram.loadValue,
            rpe: setProgram.targetRpe,

            isCompleted: false,
            isWarmup: false,

            note: setProgram.note ?? null,

            e1rm: null,
            e1rmVersion: -1,

            createdAt: now,
            updatedAt: now,
          }));

        return {
          id: sessionExerciseId,
          workoutSessionId: sessionId,

          exerciseId: exProgram.exerciseId ?? null,
          quantityUnit: exProgram.quantityUnit,
          exerciseProgramId: exProgram.id,
          exerciseProgram: exProgram,

          exerciseName: exProgram.exercise?.name ?? "Unnamed Exercise",

          orderIndex: exProgram.orderIndex ?? exIndex,
          note: exProgram.note ?? null,

          strengthScore: null,
          strengthScoreVersion: -1,

          createdAt: now,
          updatedAt: now,

          sets,
        };
      });

    return {
      id: sessionId,
      name: program.name,
      color: program.color,

      startedAt: now,
      endedAt: null,

      sourceProgramId: program.id,
      sourceProgram: program,

      status: "in_progress",
      note: null,
      strengthScore: null,
      strengthScoreVersion: -1,

      createdAt: now,
      updatedAt: now,

      exercises: sessionExercises,
    };
  }

  // -----------------------------
  // DB -> Domain (FULL structure)
  // Accepts either:
  // - plain SessionWorkoutRow (no relations loaded)
  // - SessionWorkoutRow with sessionExercises/sessionSets/setProgram loaded
  // -----------------------------
  static domainFromDb(row: SessionWorkoutRow): SessionWorkout {
    if (!row.startedAt) throw new Error("workoutSessions.startedAt missing");

    const exercises: SessionExercise[] = (row.sessionExercises ?? []).map(
      (ex) => {
        const sets: SessionSet[] = (ex.sessionSets ?? []).map((s) => ({
          id: s.id,

          sessionExerciseId: s.sessionExerciseId,
          setProgramId: s.setProgramId,
          setProgram: s.setProgram
            ? SessionWorkoutFactory.setProgramDomainFromDb(s.setProgram)
            : undefined,

          orderIndex: s.orderIndex,

          targetQuantity: s.targetQuantity ?? null,
          quantity: s.quantity,
          loadUnit: s.loadUnit,
          loadValue: s.loadValue,
          rpe: s.rpe,

          isCompleted: s.isCompleted,
          isWarmup: s.isWarmup,

          note: s.note,
          e1rm: s.e1rm,
          e1rmVersion: s.e1rmVersion,

          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));

        return {
          id: ex.id,
          workoutSessionId: ex.workoutSessionId,

          exerciseId: ex.exerciseId,
          quantityUnit: ex.quantityUnit,
          exerciseProgramId: ex.exerciseProgramId,
          exerciseProgram: undefined,

          exerciseName: ex.exerciseName,

          orderIndex: ex.orderIndex,
          note: ex.note,
          strengthScore: ex.strengthScore,
          strengthScoreVersion: ex.strengthScoreVersion,

          createdAt: new Date(ex.createdAt),
          updatedAt: new Date(ex.updatedAt),

          sets,
        };
      }
    );

    return {
      id: row.id,
      name: row.name,
      color: row.color,
      status: row.status,

      startedAt: new Date(row.startedAt),
      endedAt: row.endedAt ? new Date(row.endedAt) : null,

      sourceProgramId: row.sourceProgramId ?? null,
      sourceProgram: row.sourceProgram
        ? WorkoutProgramFactory.domainFromDb(row.sourceProgram)
        : undefined,

      note: row.note,
      strengthScore: row.strengthScore,
      strengthScoreVersion: row.strengthScoreVersion,

      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),

      exercises,
      // If your domain includes sourceProgram, assign it here (no guessing):
      // sourceProgram: row.sourceProgram ?? null,
    };
  }

  // -----------------------------
  // Domain -> DB (FULL structure)
  // Returns the whole row tree for transaction insert/update.
  // -----------------------------
  static dbFromDomain(domain: SessionWorkout): {
    workout: SessionWorkoutRow;
    exercises: SessionExerciseRow[] | undefined;
    sets: SessionSetRow[] | undefined;
  } {
    const workout: SessionWorkoutRow = {
      id: domain.id,
      name: domain.name,
      color: domain.color,
      status: domain.status,

      startedAt: domain.startedAt.toISOString(),
      endedAt: domain.endedAt ? domain.endedAt.toISOString() : null,

      sourceProgramId: domain.sourceProgramId,

      note: domain.note,
      strengthScore: domain.strengthScore,
      strengthScoreVersion: domain.strengthScoreVersion,

      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };

    // If caller didn't provide exercises, don't materialize children.
    if (domain.exercises === undefined) {
      return { workout, exercises: undefined, sets: undefined };
    }

    const exercises: SessionExerciseRow[] = [];

    // Pass 1: decide how to return "sets"
    // - all sets are undefined => sets === undefined
    // - all sets are [] or undefined (and at least one is []) => sets === []
    // - otherwise => include all sets (flatten)
    let sawSetsDefined = false; // true if any ex.sets !== undefined
    let sawNonEmpty = false; // true if any ex.sets has length > 0

    for (const ex of domain.exercises ?? []) {
      if (ex.sets !== undefined) {
        sawSetsDefined = true;
        if ((ex.sets ?? []).length > 0) sawNonEmpty = true;
      }
    }

    const shouldReturnUndefinedSets = !sawSetsDefined; // all undefined
    const shouldReturnEmptySetsArray = sawSetsDefined && !sawNonEmpty; // only [] or undefined, and at least one defined (could be [])

    const setsOut: SessionSetRow[] = [];

    for (const ex of domain.exercises ?? []) {
      exercises.push({
        id: ex.id,
        workoutSessionId: ex.workoutSessionId,

        exerciseId: ex.exerciseId,
        quantityUnit: ex.quantityUnit,
        exerciseProgramId: ex.exerciseProgramId,
        exerciseName: ex.exerciseName,

        orderIndex: ex.orderIndex,
        note: ex.note,
        strengthScore: ex.strengthScore,
        strengthScoreVersion: ex.strengthScoreVersion,

        createdAt: ex.createdAt.toISOString(),
        updatedAt: ex.updatedAt.toISOString(),
      });

      // Only flatten sets when we decided to "include all sets"
      if (shouldReturnUndefinedSets || shouldReturnEmptySetsArray) continue;

      for (const s of ex.sets ?? []) {
        setsOut.push({
          id: s.id,

          sessionExerciseId: s.sessionExerciseId,
          setProgramId: s.setProgramId,

          orderIndex: s.orderIndex,

          targetQuantity: s.targetQuantity ?? null,
          quantity: s.quantity,
          loadUnit: s.loadUnit,
          loadValue: s.loadValue,
          rpe: s.rpe,

          isCompleted: s.isCompleted,
          isWarmup: s.isWarmup,

          note: s.note,
          e1rm: s.e1rm,
          e1rmVersion: s.e1rmVersion,

          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        });
      }
    }

    const sets: SessionSetRow[] | undefined = shouldReturnUndefinedSets
      ? undefined
      : shouldReturnEmptySetsArray
        ? []
        : setsOut;

    return { workout, exercises, sets };
  }

  static create(overrides?: Partial<SessionWorkout>): SessionWorkout {
    const now = new Date();
    return {
      id: generateId(),
      name: "",
      color: "neutral",
      startedAt: now,
      endedAt: null,
      status: "in_progress",
      strengthScore: null,
      strengthScoreVersion: -1,
      sourceProgramId: null,
      note: "",
      createdAt: now,
      updatedAt: now,
      exercises: [],
      ...overrides,
    };
  }

  // -----------------------------
  // Internal: SetProgramRow -> SetProgram (date fix)
  // -----------------------------
  private static setProgramDomainFromDb(row: SetProgramRow): SetProgram {
    return {
      ...(row as unknown as SetProgram),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
