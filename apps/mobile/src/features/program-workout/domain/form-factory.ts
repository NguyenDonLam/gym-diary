// features/template-workout/ui/form-factory.ts
import {
  WorkoutProgram,
  WorkoutProgramFormData,
} from "@/src/features/program-workout/domain/type";
import {
  TemplateExercise,
  TemplateExerciseFormData,
} from "@/src/features/template-exercise/domain/type";
import {
  SetProgram,
  SetProgramFormData,
} from "@/src/features/program-set/domain/type";
import { generateId } from "@/src/lib/id";

function parseNumberOrNull(v: string): number | null {
  const trimmed = v.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export class WorkoutProgramFormFactory {
  // ------------------------------------------------------------
  // createEmpty
  // ------------------------------------------------------------
  static createEmpty(): WorkoutProgramFormData {
    return {
      name: "",
      color: "neutral",
      description: "",
      folderId: null,
      exercises: [],
    };
  }

  // ------------------------------------------------------------
  // toDomain (form → domain)
  // ------------------------------------------------------------
  static toDomain(form: WorkoutProgramFormData): WorkoutProgram {
    const templateId = generateId();
    const now = new Date();

    const exercises: TemplateExercise[] = [];

    for (let exIndex = 0; exIndex < form.exercises.length; exIndex++) {
      const ex: TemplateExerciseFormData = form.exercises[exIndex];

      if (!ex.exerciseId) {
        throw new Error(
          `TemplateWorkoutFormFactory: exerciseId missing at index ${exIndex}.`
        );
      }

      const templateExerciseId = ex.id || generateId();

      const sets: SetProgram[] = ex.sets.map(
        (s: SetProgramFormData, setIndex: number) => ({
          id: s.id || generateId(),
          templateExerciseId,
          orderIndex: setIndex,
          targetReps: parseNumberOrNull(s.reps),
          loadValue: parseNumberOrNull(s.loadValue),
          loadUnit: s.loadUnit,
          targetRpe: parseNumberOrNull(s.rpe),
          notes: null,
          createdAt: now,
          updatedAt: now,
        })
      );

      exercises.push({
        id: templateExerciseId,
        exerciseId: ex.exerciseId,
        orderIndex: exIndex,
        notes: null,
        sets,
      });
    }

    return {
      id: templateId,
      name: form.name.trim(),
      color: form.color,
      folderId: form.folderId,
      description: form.description.trim() || null,
      createdAt: now,
      updatedAt: now,
      exercises,
    };
  }

  // ------------------------------------------------------------
  // fromDomain (domain → form)
  // ------------------------------------------------------------
  static fromDomain(domain: WorkoutProgram): WorkoutProgramFormData {
    return {
      name: domain.name,
      description: domain.description ?? "",
      color: domain.color,
      folderId: domain.folderId,
      exercises: domain.exercises.map((ex) => ({
        id: ex.id,
        exerciseId: ex.exerciseId,
        isCustom: false,
        sets: ex.sets.map((s) => ({
          id: s.id,
          reps: s.targetReps != null ? String(s.targetReps) : "",
          loadValue: s.loadValue != null ? String(s.loadValue) : "",
          loadUnit: s.loadUnit,
          rpe: s.targetRpe != null ? String(s.targetRpe) : "",
        })),
      })),
    };
  }

  // ------------------------------------------------------------
  // toForm (alias)
  // ------------------------------------------------------------
  static toForm(domain: WorkoutProgram): WorkoutProgramFormData {
    return this.fromDomain(domain);
  }
}
