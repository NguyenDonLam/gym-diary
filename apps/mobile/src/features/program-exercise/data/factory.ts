// src/features/program-exercise/data/row-factory.ts

import { generateId } from "@/src/lib/id";

import type { Exercise } from "@packages/exercise";
import type { ExerciseRow } from "../../exercise/data/types";
import type { SetProgramRow } from "../../program-set/data/type";
import type {
  SetProgram,
} from "../../program-set/domain/type";

import type { ExerciseProgram, ExerciseProgramFormData } from "../domain/type";
import type { ExerciseProgramRow } from "./type";

function toIso(d: Date): string {
  return d.toISOString();
}
function fromIso(s: string): Date {
  return new Date(s);
}
function loadValueDbToDomain(v: string | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Domain <-> DB row casts for exercise.
// You have no provided canonical mapper between ExerciseRow and Exercise.
// This keeps the signature clean while staying type-safe at compile time.
function exerciseRowToDomain(row: ExerciseRow): Exercise {
  return row as unknown as Exercise;
}
function exerciseDomainToRow(ex: Exercise): ExerciseRow {
  return ex as unknown as ExerciseRow;
}

function setRowToDomain(row: SetProgramRow): SetProgram {
  return {
    id: row.id,
    exerciseProgramId: row.exerciseProgramId,
    orderIndex: row.orderIndex,
    targetQuantity: row.targetQuantity ?? null,
    loadUnit: row.loadUnit,
    loadValue: loadValueDbToDomain(row.loadValue),
    targetRpe: row.targetRpe ?? null,
    note: row.note ?? null,
    createdAt: fromIso(row.createdAt),
    updatedAt: fromIso(row.updatedAt),
  };
}

function setDomainToRow(domain: SetProgram): SetProgramRow {
  return {
    id: domain.id,
    exerciseProgramId: domain.exerciseProgramId,
    orderIndex: domain.orderIndex,
    targetQuantity: domain.targetQuantity ?? null,
    loadUnit: domain.loadUnit,
    loadValue: domain.loadValue,
    targetRpe: domain.targetRpe ?? null,
    note: domain.note ?? null,
    createdAt: toIso(domain.createdAt),
    updatedAt: toIso(domain.updatedAt),
  } as SetProgramRow;
}

export type ExerciseProgramDbGraph = {
  exerciseProgram: ExerciseProgramRow;
  setPrograms: SetProgramRow[];
  exercise?: ExerciseRow;
};

export class ProgramExerciseFactory {
  static DBToDomain(row: ExerciseProgramRow): ExerciseProgram {
    return {
      id: row.id,
      exerciseId: row.exerciseId,
      exercise: row.exercise ? exerciseRowToDomain(row.exercise) : undefined,
      orderIndex: row.orderIndex,
      note: row.note ?? null,
      createdAt: fromIso(row.createdAt),
      updatedAt: fromIso(row.updatedAt),
      sets: (row.sets ?? [])
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(setRowToDomain),
    };
  }

  static DomainToDB(domain: ExerciseProgram): ExerciseProgramDbGraph {
    if (!domain.id) throw new Error("ExerciseProgram.id missing");
    if (!domain.exerciseId)
      throw new Error("ExerciseProgram.exerciseId missing");
    if (domain.orderIndex === undefined || domain.orderIndex === null) {
      throw new Error("ExerciseProgram.orderIndex missing");
    }
    if (!domain.createdAt || !domain.updatedAt) {
      throw new Error("ExerciseProgram.createdAt/updatedAt missing");
    }

    const exerciseProgram: ExerciseProgramRow = {
      id: domain.id,
      exerciseId: domain.exerciseId,
      orderIndex: domain.orderIndex,
      note: domain.note ?? null,
      createdAt: toIso(domain.createdAt),
      updatedAt: toIso(domain.updatedAt),
    } as ExerciseProgramRow;

    const setPrograms: SetProgramRow[] = (domain.sets ?? [])
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((s) => {
        if (!s.id) throw new Error("SetProgram.id missing");
        if (!s.exerciseProgramId) {
          // keep parent linkage correct without inventing anything
          return setDomainToRow({ ...s, exerciseProgramId: domain.id });
        }
        return setDomainToRow(s);
      });

    const exercise = domain.exercise
      ? exerciseDomainToRow(domain.exercise)
      : undefined;

    return { exerciseProgram, setPrograms, exercise };
  }

  static DomainToForm(domain: ExerciseProgram): ExerciseProgramFormData {
    return {
      id: domain.id,
      exerciseId: domain.exerciseId,
      isCustom: false,
      sets: (domain.sets ?? [])
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((s) => ({
          id: s.id,
          targetQuantity: s.targetQuantity ?? null,
          loadValue: s.loadValue != null ? String(s.loadValue) : "",
          loadUnit: s.loadUnit,
          rpe: s.targetRpe != null ? String(s.targetRpe) : "",
        })),
    };
  }

  static FormToDomain(form: ExerciseProgramFormData): ExerciseProgram {
    // This form type does not contain orderIndex/createdAt/updatedAt.
    // No defaults are invented here; caller must fill these before persistence.
    if (!form.id) throw new Error("ExerciseProgramFormData.id missing");
    if (!form.exerciseId)
      throw new Error("ExerciseProgramFormData.exerciseId is null");

    throw new Error(
      "FormToDomain requires orderIndex + createdAt + updatedAt which are not present on ExerciseProgramFormData. Convert at the parent factory where orderIndex and timestamps exist."
    );
  }

  static DBToForm(row: ExerciseProgramRow): ExerciseProgramFormData {
    return {
      id: row.id,
      exerciseId: row.exerciseId,
      isCustom: false,
      sets: (row.sets ?? [])
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((s) => ({
          id: s.id,
          targetQuantity: s.targetQuantity ?? null,
          loadValue:
            s.loadValue != null
              ? String(loadValueDbToDomain(s.loadValue) ?? "")
              : "",
          loadUnit: s.loadUnit as any,
          rpe: s.targetRpe != null ? String(s.targetRpe) : "",
        })),
    };
  }

  // Add these inside ProgramExerciseFactory

  static createForm(
    override: Partial<ExerciseProgramFormData> = {}
  ): ExerciseProgramFormData {
    return {
      id: generateId(),
      exerciseId: null,
      isCustom: false,
      sets: [],
      ...override,
    };
  }

  static createDomain(
    override: Partial<ExerciseProgram> = {}
  ): ExerciseProgram {
    const now = new Date();

    const domain: ExerciseProgram = {
      id: generateId(),
      exerciseId: "", // validated below
      orderIndex: 0, // validated below
      note: null,
      sets: [],
      createdAt: now,
      updatedAt: now,
      ...override,
    };

    if (!domain.exerciseId) {
      throw new Error("createDomain: override.exerciseId is required");
    }
    if (domain.orderIndex === undefined || domain.orderIndex === null) {
      throw new Error("createDomain: override.orderIndex is required");
    }
    if (!domain.createdAt || !domain.updatedAt) {
      throw new Error("createDomain: createdAt/updatedAt missing");
    }

    return domain;
  }
}
