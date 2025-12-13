// src/features/program-set/data/row-factory.ts

import { generateId } from "@/src/lib/id";

import type { SetProgramRow } from "./type";
import type { SetProgram, SetProgramFormData } from "../domain/type";

function toIso(d: Date): string {
  return d.toISOString();
}
function fromIso(s: string): Date {
  return new Date(s);
}

function parseNumberOrNull(v: string): number | null {
  const t = (v ?? "").trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function loadValueDbToDomain(
  v: string | null | undefined
): number | string | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
}

function loadValueDomainToDb(
  v: number | string | null | undefined
): string | null {
  if (v == null) return null;
  return typeof v === "number" ? String(v) : v;
}

export class SetProgramFactory {
  static DBToDomain(row: SetProgramRow): SetProgram {
    return {
      id: row.id,
      exerciseProgramId: row.exerciseProgramId,
      orderIndex: row.orderIndex,
      targetQuantity: row.targetQuantity ?? null,
      loadUnit: row.loadUnit as any,
      loadValue: loadValueDbToDomain(row.loadValue),
      targetRpe: row.targetRpe ?? null,
      note: row.note ?? null,
      createdAt: fromIso(row.createdAt),
      updatedAt: fromIso(row.updatedAt),
    };
  }

  static DomainToDB(domain: SetProgram): SetProgramRow {
    if (!domain.id) throw new Error("SetProgram.id missing");
    if (!domain.exerciseProgramId)
      throw new Error("SetProgram.exerciseProgramId missing");
    if (domain.orderIndex === undefined || domain.orderIndex === null) {
      throw new Error("SetProgram.orderIndex missing");
    }
    if (!domain.createdAt || !domain.updatedAt) {
      throw new Error("SetProgram.createdAt/updatedAt missing");
    }

    return {
      id: domain.id,
      exerciseProgramId: domain.exerciseProgramId,
      orderIndex: domain.orderIndex,
      targetQuantity: domain.targetQuantity ?? null,
      loadUnit: domain.loadUnit as any,
      loadValue: loadValueDomainToDb(domain.loadValue),
      targetRpe: domain.targetRpe ?? null,
      note: domain.note ?? null,
      createdAt: toIso(domain.createdAt),
      updatedAt: toIso(domain.updatedAt),
    } as SetProgramRow;
  }

  static DomainToForm(domain: SetProgram): SetProgramFormData {
    return {
      id: domain.id,
      targetQuantity: domain.targetQuantity ?? null,
      loadUnit: domain.loadUnit,
      loadValue: domain.loadValue == null ? "" : String(domain.loadValue),
      rpe: domain.targetRpe == null ? "" : String(domain.targetRpe),
    };
  }

  static FormToDomain(form: SetProgramFormData): SetProgram {
    throw new Error("form does not have exerciseProgramId");
  }

  static DBToForm(row: SetProgramRow): SetProgramFormData {
    return {
      id: row.id,
      targetQuantity: row.targetQuantity ?? null,
      loadUnit: row.loadUnit as any,
      loadValue:
        row.loadValue == null ? "" : String(loadValueDbToDomain(row.loadValue)),
      rpe: row.targetRpe == null ? "" : String(row.targetRpe),
    };
  }

  static createForm(
    override: Partial<SetProgramFormData> = {}
  ): SetProgramFormData {
    return {
      id: generateId(),
      targetQuantity: null,
      loadUnit: "kg",
      loadValue: "",
      rpe: "",
      ...override,
    };
  }

  static createDomain(override: Partial<SetProgram> = {}): SetProgram {
    const now = new Date();

    const domain: SetProgram = {
      id: generateId(),
      exerciseProgramId: "",
      orderIndex: 0,
      targetQuantity: null,
      loadUnit: "kg",
      loadValue: null,
      targetRpe: null,
      note: null,
      createdAt: now,
      updatedAt: now,
      ...override,
    };

    if (!domain.exerciseProgramId) {
      throw new Error("createDomain: override.exerciseProgramId is required");
    }
    if (domain.orderIndex === undefined || domain.orderIndex === null) {
      throw new Error("createDomain: override.orderIndex is required");
    }
    if (!domain.createdAt || !domain.updatedAt) {
      throw new Error("createDomain: createdAt/updatedAt missing");
    }

    return domain;
  }

  static createRow(override: Partial<SetProgramRow> = {}): SetProgramRow {
    const nowIso = new Date().toISOString();

    const row: SetProgramRow = {
      id: generateId(),
      exerciseProgramId: "" as any,
      orderIndex: 0 as any,
      targetQuantity: null,
      loadUnit: "kg" as any,
      loadValue: null,
      targetRpe: null,
      note: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      ...override,
    };

    if (!row.exerciseProgramId) {
      throw new Error("createRow: override.exerciseProgramId is required");
    }
    if (row.orderIndex === undefined || row.orderIndex === null) {
      throw new Error("createRow: override.orderIndex is required");
    }
    if (!row.createdAt || !row.updatedAt) {
      throw new Error("createRow: createdAt/updatedAt missing");
    }

    return row;
  }
}
