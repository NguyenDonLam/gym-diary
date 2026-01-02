// src/features/session-set/domain/session-set-factory.ts

import type { SessionSet } from "@/src/features/session-set/domain/types";
import type {
  SetProgram,
} from "@/src/features/program-set/domain/type";
import type { SessionSetRow } from "@/src/features/session-set/data/types";
import type { SetProgramRow } from "@/src/features/program-set/data/type";
import { generateId } from "@/src/lib/id";

export class SessionSetFactory {
  static domainFromDb(row: SessionSetRow): SessionSet {
    return {
      id: row.id,

      sessionExerciseId: row.sessionExerciseId,
      setProgramId: row.setProgramId,
      setProgram: row.setProgram
        ? SessionSetFactory.setProgramDomainFromDb(row.setProgram)
        : undefined,

      orderIndex: row.orderIndex,

      targetQuantity: row.targetQuantity ?? null,
      quantity: row.quantity,
      loadUnit: row.loadUnit,
      loadValue: row.loadValue ?? null,
      rpe: row.rpe ?? null,

      isCompleted: row.isCompleted,
      isWarmup: row.isWarmup,

      note: row.note ?? null,

      e1rm: row.e1rm,
      e1rmVersion: row.e1rmVersion,

      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  static dbFromDomain(domain: SessionSet): SessionSetRow {
    return {
      id: domain.id,

      sessionExerciseId: domain.sessionExerciseId,
      setProgramId: domain.setProgramId,

      orderIndex: domain.orderIndex,

      targetQuantity: domain.targetQuantity ?? null,
      quantity: domain.quantity,
      loadUnit: domain.loadUnit,
      loadValue: domain.loadValue ?? null,
      rpe: domain.rpe ?? null,

      isCompleted: domain.isCompleted,
      isWarmup: domain.isWarmup,

      note: domain.note ?? null,

      e1rm: domain.e1rm,
      e1rmVersion: domain.e1rmVersion,

      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }

  private static setProgramDomainFromDb(row: SetProgramRow): SetProgram {
    return {
      id: row.id,
      exerciseProgramId: row.exerciseProgramId,
      orderIndex: row.orderIndex,

      targetQuantity: row.targetQuantity ?? null,
      loadUnit: row.loadUnit,
      loadValue: row.loadValue ?? null,
      targetRpe: row.targetRpe ?? null,

      note: row.note ?? null,

      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  static create(overrides: Partial<SessionSet>): SessionSet {
    const now = new Date();

    return {
      id: generateId(),

      // must be provided via overrides
      sessionExerciseId: "",
      orderIndex: 0,

      setProgramId: null,

      targetQuantity: null,
      quantity: null,

      loadUnit: "kg",
      loadValue: null,
      rpe: 10,

      isCompleted: false,
      isWarmup: false,
      note: null,

      e1rm: null,
      e1rmVersion: 1,

      createdAt: now,
      updatedAt: now,

      ...overrides,
    };
  }
}
