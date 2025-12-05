// src/features/exercise/domain/factory.ts
import type { Exercise } from "@packages/exercise";
import { generateId } from "@/src/lib/id";

export type ExerciseFactoryCreateInput = {
  id?: string;
  name: string;
};

export class ExerciseFactory {
  create(input: ExerciseFactoryCreateInput): Exercise {
    const now = new Date();
    const name = input.name.trim();

    return {
      id: input.id ?? generateId(),
      name,
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
}

export const exerciseFactory = new ExerciseFactory();