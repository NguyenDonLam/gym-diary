// src/features/exercise/domain/factory.ts

import type { Exercise } from "@packages/exercise";
import { generateId } from "@/src/lib/id";

// You already use this row type elsewhere:
// import type { ExerciseRow } from "@/src/features/exercise/data/types";
import type { ExerciseRow } from "@/src/features/exercise/data/types";

const toIso = (d: Date) => d.toISOString();
const fromIso = (s: string) => new Date(s);

export type ExerciseFactoryCreateInput = {
  id?: string;
  name: string;
};

export class ExerciseFactory {
  // -----------------------------
  // Constructors / mutations
  // -----------------------------
  create(input: ExerciseFactoryCreateInput): Exercise {
    const now = new Date();
    const name = input.name.trim();

    return {
      id: input.id ?? generateId(),
      name,
      quantityUnit: "reps",
      createdAt: now,
      updatedAt: now,
    };
  }

  rename(exercise: Exercise, name: string): Exercise {
    const trimmed = name.trim();

    return {
      ...exercise,
      name: trimmed,
      updatedAt: new Date(),
    };
  }

  // -----------------------------
  // DB <-> Domain
  // -----------------------------
  domainFromDb(row: ExerciseRow): Exercise {
    return {
      id: row.id,
      name: row.name,
      quantityUnit: row.quantityUnit,
      createdAt: fromIso(row.createdAt),
      updatedAt: fromIso(row.updatedAt),
    };
  }

  dbFromDomain(domain: Exercise): ExerciseRow {
    return {
      id: domain.id,
      name: domain.name,
      quantityUnit: domain.quantityUnit,
      createdAt: toIso(domain.createdAt),
      updatedAt: toIso(domain.updatedAt),
    };
  }

  // -----------------------------
  // Helpers
  // -----------------------------
  normalizeName(name: string): string {
    return name.trim();
  }
}

export const exerciseFactory = new ExerciseFactory();
