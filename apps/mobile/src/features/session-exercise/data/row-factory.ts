// src/features/session-exercise/domain/session-exercise-factory.ts

import type { SessionExercise } from "@/src/features/session-exercise/domain/types";
import type { SessionSet } from "@/src/features/session-set/domain/types";
import type { ExerciseProgram } from "@/src/features/program-exercise/domain/type";

import type { SessionExerciseRow } from "@/src/features/session-exercise/data/types";
import type { SessionSetRow } from "@/src/features/session-set/data/types";
import type { ExerciseProgramRow } from "@/src/features/program-exercise/data/type";
import { SessionSetFactory } from "../../session-set/domain/factory";

export class SessionExerciseFactory {
  static domainFromDb(row: SessionExerciseRow): SessionExercise {
    const sets: SessionSet[] = (row.sessionSets ?? [])
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((s: SessionSetRow) => SessionSetFactory.domainFromDb(s));

    const exerciseProgram = row.exerciseProgram
      ? SessionExerciseFactory.exerciseProgramDomainFromDb(row.exerciseProgram)
      : undefined;

    return {
      id: row.id,

      workoutSessionId: row.workoutSessionId,

      exerciseId: row.exerciseId ?? null,
      exerciseProgramId: row.exerciseProgramId ?? null,
      exerciseProgram,

      exerciseName: row.exerciseName ?? null,

      orderIndex: row.orderIndex,

      note: row.note ?? null,

      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),

      sets,
    };
  }

  static dbFromDomain(domain: SessionExercise): SessionExerciseRow {
    return {
      id: domain.id,

      workoutSessionId: domain.workoutSessionId,

      exerciseId: domain.exerciseId ?? null,
      exerciseProgramId: domain.exerciseProgramId ?? null,

      exerciseName: domain.exerciseName ?? null,

      orderIndex: domain.orderIndex,

      note: domain.note ?? null,

      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }

  private static exerciseProgramDomainFromDb(
    row: ExerciseProgramRow
  ): ExerciseProgram {
    // Explicit mapping only.
    // Keep exactly aligned to your ExerciseProgram domain type.
    return {
      id: row.id,
      workoutProgramId: row.workoutProgramId ?? null,

      exerciseId: row.exerciseId ?? null,
      exercise: undefined,

      orderIndex: row.orderIndex,

      note: row.note ?? null,

      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),

      sets: [],
    };
  }
}
