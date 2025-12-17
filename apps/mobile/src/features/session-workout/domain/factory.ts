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
      .map((tplEx, exIndex) => {
        const sessionExerciseId = generateId();

        const sets: SessionSet[] = (tplEx.sets ?? [])
          .slice()
          .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
          .map((tplSet, setIndex) => ({
            id: generateId(),

            sessionExerciseId,
            setProgramId: tplSet.id,
            setProgram: tplSet,

            orderIndex: tplSet.orderIndex ?? setIndex,

            targetQuantity: null,
            loadUnit: tplSet.loadUnit,
            loadValue: tplSet.loadValue,
            rpe: tplSet.targetRpe,

            isCompleted: false,
            isWarmup: false,

            note: tplSet.note ?? null,

            createdAt: now,
            updatedAt: now,
          }));

        return {
          id: sessionExerciseId,
          workoutSessionId: sessionId,

          exerciseId: tplEx.exerciseId ?? null,
          exerciseProgramId: tplEx.id,
          exerciseProgram: tplEx,

          exerciseName: tplEx.exercise?.name ?? "Unnamed Exercise",

          orderIndex: tplEx.orderIndex ?? exIndex,
          note: tplEx.note ?? null,

          createdAt: now,
          updatedAt: now,

          sets,
        };
      });

    return {
      id: sessionId,
      name: program.name,

      startedAt: now,
      endedAt: null,

      sourceTemplateId: program.id,
      sourceTemplate: program,

      status: "in_progress",
      note: null,

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
          loadUnit: s.loadUnit,
          loadValue: s.loadValue,
          rpe: s.rpe,

          isCompleted: s.isCompleted,
          isWarmup: s.isWarmup,

          note: s.note,

          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));

        return {
          id: ex.id,
          workoutSessionId: ex.workoutSessionId,

          exerciseId: ex.exerciseId,
          exerciseProgramId: ex.exerciseProgramId,
          exerciseProgram: undefined,

          exerciseName: ex.exerciseName,

          orderIndex: ex.orderIndex,
          note: ex.note,

          createdAt: new Date(ex.createdAt),
          updatedAt: new Date(ex.updatedAt),

          sets,
        };
      }
    );

    return {
      id: row.id,
      name: row.name,
      status: row.status,

      startedAt: new Date(row.startedAt),
      endedAt: row.endedAt ? new Date(row.endedAt) : null,

      sourceTemplateId: row.sourceProgramId ?? null,
      sourceTemplate: undefined,

      note: row.note,

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
    exercises: SessionExerciseRow[];
    sets: SessionSetRow[];
  } {
    const workout: SessionWorkoutRow = {
      id: domain.id,
      name: domain.name,
      status: domain.status,

      startedAt: domain.startedAt.toISOString(),
      endedAt: domain.endedAt ? domain.endedAt.toISOString() : null,

      sourceProgramId: domain.sourceTemplateId,

      note: domain.note,

      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };

    const exercises: SessionExerciseRow[] = [];
    const sets: SessionSetRow[] = [];

    for (const ex of domain.exercises ?? []) {
      exercises.push({
        id: ex.id,
        workoutSessionId: ex.workoutSessionId,

        exerciseId: ex.exerciseId,
        exerciseProgramId: ex.exerciseProgramId,
        exerciseName: ex.exerciseName,

        orderIndex: ex.orderIndex,
        note: ex.note,

        createdAt: ex.createdAt.toISOString(),
        updatedAt: ex.updatedAt.toISOString(),
      });

      for (const s of ex.sets ?? []) {
        sets.push({
          id: s.id,

          sessionExerciseId: s.sessionExerciseId,
          setProgramId: s.setProgramId,

          orderIndex: s.orderIndex,

          targetQuantity: s.targetQuantity ?? null,
          loadUnit: s.loadUnit,
          loadValue: s.loadValue,
          rpe: s.rpe,

          isCompleted: s.isCompleted,
          isWarmup: s.isWarmup,

          note: s.note,

          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        });
      }
    }

    return { workout, exercises, sets };
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
