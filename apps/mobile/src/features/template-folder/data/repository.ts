import { eq } from "drizzle-orm";
import { BaseRepository } from "@/src/lib/base-repository";
import { db } from "@/db";
import { templateFolders } from "@/db/schema";
import {
  TemplateFolderRowFactory,
  type TemplateFolderRow,
  type NewTemplateFolderRow,
} from "./row-factory";
import { TemplateFolder } from "../domain/types";

export class TemplateFolderRepository extends BaseRepository<TemplateFolder> {
  constructor() {
    super();
  }

  async get(id: string): Promise<TemplateFolder | null> {
    const rows: TemplateFolderRow[] = await db
      .select()
      .from(templateFolders)
      .where(eq(templateFolders.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return TemplateFolderRowFactory.toDomain(row);
  }

  async getAll(): Promise<TemplateFolder[]> {
    const rows: TemplateFolderRow[] = await db
      .select()
      .from(templateFolders)
      .orderBy(templateFolders.sortIndex, templateFolders.createdAt);

    return rows.map((row) => TemplateFolderRowFactory.toDomain(row));
  }

  protected async insert(
    entity: TemplateFolder & { id?: string | null }
  ): Promise<TemplateFolder> {
    const withId: TemplateFolder = {
      ...entity,
      // if you ever call insert with missing id, enforce here
      id: entity.id ?? crypto.randomUUID(),
    };

    const row: NewTemplateFolderRow = TemplateFolderRowFactory.toRow(withId);

    await db.insert(templateFolders).values(row);

    return withId;
  }

  protected async update(
    entity: TemplateFolder & { id?: string | null }
  ): Promise<TemplateFolder> {
    if (!entity.id) {
      throw new Error("Cannot update TemplateFolder without id");
    }

    const row: NewTemplateFolderRow = TemplateFolderRowFactory.toRow(
      entity as TemplateFolder
    );

    await db
      .update(templateFolders)
      .set(row)
      .where(eq(templateFolders.id, entity.id));

    return entity as TemplateFolder;
  }

  async delete(id: string): Promise<void> {
    await db.delete(templateFolders).where(eq(templateFolders.id, id));
  }

  /**
   * Convenience creation using the factory (if you want it).
   */
  async create(name: string, sortIndex?: number): Promise<TemplateFolder> {
    const row = TemplateFolderRowFactory.create({ name, sortIndex });
    await db.insert(templateFolders).values(row);

    // `row` already has Date fields because of Drizzle timestamp_ms
    return TemplateFolderRowFactory.toDomain(row as TemplateFolderRow);
  }
}

export const templateFolderRepository = new TemplateFolderRepository();
