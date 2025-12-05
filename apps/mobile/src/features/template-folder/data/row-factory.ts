import { templateFolders } from "@/db/schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { generateId } from "@/src/lib/id";
import { TemplateFolder } from "../domain/types";

export type TemplateFolderRow = InferSelectModel<typeof templateFolders>;
export type NewTemplateFolderRow = InferInsertModel<typeof templateFolders>;

/**
 * Factory responsible ONLY for mapping between:
 *   - DB row shape (TemplateFolderRow)
 *   - Domain entity (TemplateFolder)
 *   - Creating rows for inserts
 */
export class TemplateFolderRowFactory {
  /**
   * DB row -> domain
   */
  static toDomain(row: TemplateFolderRow): TemplateFolder {
    return {
      id: row.id,
      name: row.name,
      sortIndex: row.sortIndex,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Domain -> DB row (for insert/update)
   */
  static toRow(entity: TemplateFolder): NewTemplateFolderRow {
    return {
      id: entity.id,
      name: entity.name,
      sortIndex: entity.sortIndex,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Helper for creating a brand-new folder row.
   * Returns an insert shape.
   */
  static create(input: {
    name: string;
    sortIndex?: number;
  }): NewTemplateFolderRow {
    const now = new Date();

    return {
      id: generateId(),
      name: input.name,
      sortIndex: input.sortIndex ?? 0,
      createdAt: now,
      updatedAt: now,
    };
  }
}
