// features/template-workout/domain/factory.ts
import { TemplateWorkout, TemplateWorkoutFormData } from "./type";
import {
  TemplateExercise,
  TemplateExerciseFormData,
} from "@/src/features/template-exercise/domain/type";
import {
  TemplateSet,
  TemplateSetFormData,
} from "@/src/features/template-set/domain/type";
import { generateId } from "@/src/lib/id";

function parseNumberOrNull(v: string): number | null {
  const trimmed = v.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export type TemplateWorkoutFactoryDeps = {
  idGen: () => string;
  now: Date;
};

export class TemplateWorkoutFactory {
  static fromForm(
    form: TemplateWorkoutFormData,
  ): TemplateWorkout {

    const templateId = generateId();
    const exercises: TemplateExercise[] = [];

    for (let exIndex = 0; exIndex < form.exercises.length; exIndex++) {
      const ex: TemplateExerciseFormData = form.exercises[exIndex];

      if (!ex.exerciseId) {
        throw new Error(
          `TemplateWorkoutFactory: exerciseId missing at index ${exIndex}. ` +
            `Resolve/insert exercises before calling the factory.`
        );
      }

      const templateExerciseId = ex.id || generateId();

      const sets: TemplateSet[] = ex.sets.map(
        (s: TemplateSetFormData, setIndex: number) => ({
          id: s.id || generateId(),
          templateExerciseId,
          orderIndex: setIndex,
          targetReps: parseNumberOrNull(s.reps),
          loadValue: parseNumberOrNull(s.loadValue),
          loadUnit: s.loadUnit,
          targetRpe: parseNumberOrNull(s.rpe),
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      exercises.push({
        id: templateExerciseId,
        exerciseId: ex.exerciseId, // already canonical
        orderIndex: exIndex,
        notes: null,
        sets,
      });
    }

    return {
      id: templateId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      exercises,
    };
  }
}
