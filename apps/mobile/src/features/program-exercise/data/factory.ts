// src/features/program-exercise/domain/exercise-program-factory.ts

import type { Exercise } from "@packages/exercise";

import type { ExerciseProgramRow } from "../data/type";

import type { ExerciseRow } from "@/src/features/exercise/data/types";
import { ExerciseProgram, ExerciseProgramFormData } from "../domain/type";
import { exerciseFactory, ExerciseFactory } from "../../exercise/domain/factory";
import { SetProgramFactory } from "../../program-set/domain/factory";
const toIso = (d: Date) => d.toISOString();
const fromIso = (s: string) => new Date(s);

export class ExerciseProgramFactory {
  static domainFromDb(row: ExerciseProgramRow): ExerciseProgram {
    const exercise: Exercise | undefined = row.exercise
      ? exerciseFactory.domainFromDb(row.exercise)
      : undefined;

    return {
      id: row.id,
      exerciseId: row.exerciseId,
      workoutProgramId: row.workoutProgramId,

      exercise,
      quantityUnit: row.quantityUnit,

      orderIndex: row.orderIndex,
      note: row.note ?? null,

      sets: (row.sets ?? [])
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(SetProgramFactory.domainFromDb),

      createdAt: fromIso(row.createdAt),
      updatedAt: fromIso(row.updatedAt),
    };
  }

  static dbFromDomain(domain: ExerciseProgram): {
    exercisePrograms: ExerciseProgramRow[];
    setPrograms: ReturnType<typeof SetProgramFactory.dbFromDomain>[];
  } {
    const setPrograms = domain.sets
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(SetProgramFactory.dbFromDomain);

    const exercise: ExerciseRow | undefined = domain.exercise
      ? exerciseFactory.dbFromDomain(domain.exercise)
      : undefined;

    const exerciseProgram: ExerciseProgramRow = {
      id: domain.id,
      exerciseId: domain.exerciseId,
      workoutProgramId: domain.workoutProgramId,
      quantityUnit: domain.quantityUnit,
      orderIndex: domain.orderIndex,
      note: domain.note ?? null,
      createdAt: toIso(domain.createdAt),
      updatedAt: toIso(domain.updatedAt),

      // hydrated-only
      sets: undefined,
      exercise,
      workoutProgram: undefined,
    };

    return {
      exercisePrograms: [exerciseProgram],
      setPrograms,
    };
  }

  static domainFromForm(input: {
    form: ExerciseProgramFormData;
    workoutProgramId: string;
    exerciseId: string;
    orderIndex: number;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
    exercise?: Exercise;
  }): ExerciseProgram {
    return {
      id: input.form.id,
      exerciseId: input.exerciseId,
      workoutProgramId: input.workoutProgramId,
      quantityUnit: input.form.quantityUnit,
      exercise: input.exercise,

      orderIndex: input.orderIndex,
      note: input.note ?? null,

      sets: input.form.sets.map((s, i) =>
        SetProgramFactory.domainFromForm({
          form: s,
          exerciseProgramId: input.form.id,
          orderIndex: i + 1,
          createdAt: input.createdAt,
          updatedAt: input.updatedAt,
        })
      ),

      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    };
  }

  static formFromDomain(domain: ExerciseProgram): ExerciseProgramFormData {
    return {
      id: domain.id,
      exerciseId: domain.exerciseId,
      quantityUnit: domain.quantityUnit,
      isCustom: false,
      sets: domain.sets
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(SetProgramFactory.formFromDomain),
    };
  }

  static formFromDb(row: ExerciseProgramRow): ExerciseProgramFormData {
    return this.formFromDomain(this.domainFromDb(row));
  }

  static dbFromForm(input: {
    form: ExerciseProgramFormData;
    workoutProgramId: string;
    exerciseId: string;
    orderIndex: number;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return this.dbFromDomain(
      this.domainFromForm({
        form: input.form,
        workoutProgramId: input.workoutProgramId,
        exerciseId: input.exerciseId,
        orderIndex: input.orderIndex,
        note: input.note,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      })
    );
  }
}
