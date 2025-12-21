// src/features/program-set/domain/set-program-factory.ts

import type { SetProgram, SetProgramFormData } from "../domain/type";
import type { SetProgramRow } from "../data/type";

const toIso = (d: Date) => d.toISOString();
const fromIso = (s: string) => new Date(s);

export class SetProgramFactory {
  static domainFromDb(row: SetProgramRow): SetProgram {
    return {
      id: row.id,
      exerciseProgramId: row.exerciseProgramId,
      orderIndex: row.orderIndex,
      targetQuantity: row.targetQuantity ?? null,
      loadUnit: row.loadUnit,
      loadValue: row.loadValue ?? null,
      targetRpe: row.targetRpe ?? null,
      note: row.note ?? null,
      createdAt: fromIso(row.createdAt),
      updatedAt: fromIso(row.updatedAt),
    };
  }

  static dbFromDomain(domain: SetProgram): SetProgramRow {
    return {
      id: domain.id,
      exerciseProgramId: domain.exerciseProgramId,
      orderIndex: domain.orderIndex,
      targetQuantity: domain.targetQuantity ?? null,
      loadUnit: domain.loadUnit,
      loadValue: domain.loadValue ?? null,
      targetRpe: domain.targetRpe ?? null,
      note: domain.note ?? null,
      createdAt: toIso(domain.createdAt),
      updatedAt: toIso(domain.updatedAt),
      exerciseProgram: undefined,
    };
  }

  static domainFromForm(input: {
    form: SetProgramFormData;
    exerciseProgramId: string;
    orderIndex: number;
    createdAt: Date;
    updatedAt: Date;
    note?: string | null;
  }): SetProgram {
    const rpeNum = input.form.rpe.trim() === "" ? null : Number(input.form.rpe);

    return {
      id: input.form.id,
      exerciseProgramId: input.exerciseProgramId,
      orderIndex: input.orderIndex,
      targetQuantity: input.form.targetQuantity ?? null,
      loadUnit: input.form.loadUnit,
      loadValue:
        input.form.loadValue.trim() === "" ? null : input.form.loadValue,
      targetRpe: Number.isFinite(rpeNum) ? rpeNum : null,
      note: input.note ?? null,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    };
  }

  static formFromDomain(domain: SetProgram): SetProgramFormData {
    return {
      id: domain.id,
      targetQuantity: domain.targetQuantity ?? null,
      loadUnit: domain.loadUnit,
      loadValue: domain.loadValue ?? "",
      rpe: domain.targetRpe === null ? "" : String(domain.targetRpe),
    };
  }

  static dbFromForm(input: {
    form: SetProgramFormData;
    exerciseProgramId: string;
    orderIndex: number;
    createdAt: Date;
    updatedAt: Date;
    note?: string | null;
  }): SetProgramRow {
    return this.dbFromDomain(this.domainFromForm(input));
  }
}
