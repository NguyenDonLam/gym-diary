// src/features/session-set/data/row-factory.ts

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { sessionSets } from "@/db/schema";

import type { SessionSet } from "@/src/features/session-set/domain/types";
import type { TemplateSet } from "@/src/features/template-set/domain/type";
import { SessionSetRow } from "./types";

/**
 * Factory responsible ONLY for mapping between:
 *   - DB row shape (SessionSetRow)
 *   - Domain aggregate (SessionSet)
 *
 * It does not know about forms or UI.
 */
export class SessionSetRowFactory {
  /**
   * DB row + optional already-loaded templateSet -> domain aggregate.
   *
   * templateSet should be mapped by its own factory and passed in here
   * as a domain object when you actually join it.
   */
  static toDomain(row: SessionSetRow, templateSet?: TemplateSet): SessionSet {
    return {
      id: row.id,

      sessionExerciseId: row.sessionExerciseId,
      templateSetId: row.templateSetId,
      templateSet,

      orderIndex: row.orderIndex,

      reps: row.reps,
      loadUnit: row.loadUnit,
      loadValue: row.loadValue,
      rpe: row.rpe,

      isWarmup: row.isWarmup,

      note: row.note,

      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  /**
   * Domain aggregate -> DB row for the session_sets table.
   *
   * templateSet relation is NOT handled here; only templateSetId is persisted.
   */
  static fromDomain(domain: SessionSet): SessionSetRow {
    return {
      id: domain.id,

      sessionExerciseId: domain.sessionExerciseId,
      templateSetId: domain.templateSetId,

      orderIndex: domain.orderIndex,

      reps: domain.reps,
      loadUnit: domain.loadUnit,
      loadValue: domain.loadValue,
      rpe: domain.rpe,

      isWarmup: domain.isWarmup,

      note: domain.note,

      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }

  static toRow(domain: SessionSet): SessionSetRow {
    return this.fromDomain(domain);
  }

  static fromRow(row: SessionSetRow, templateSet?: TemplateSet): SessionSet {
    return this.toDomain(row, templateSet);
  }
}
