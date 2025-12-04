import { BaseDao } from "@/src/lib/base-dao";
import type { SQLiteDatabase } from "expo-sqlite";
import { WorkoutTemplateRow } from "./type";

export class WorkoutTemplateDao extends BaseDao<WorkoutTemplateRow> {
  constructor(db: SQLiteDatabase) {
    super(db, "workout_templates");
  }

  async insert(row: WorkoutTemplateRow): Promise<void> {
    await this.run(
      `
      INSERT INTO workout_templates
        (id, name, folder_id, color, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      row.id,
      row.name,
      row.folder_id,
      row.color,
      row.description,
      row.created_at,
      row.updated_at
    );
  }

  async update(id: string, patch: Partial<WorkoutTemplateRow>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (patch.name !== undefined) {
      fields.push("name = ?");
      values.push(patch.name);
    }

    if (patch.description !== undefined) {
      fields.push("description = ?");
      values.push(patch.description);
    }

    if (patch.folder_id !== undefined) {
      fields.push("folder_id = ?");
      values.push(patch.folder_id);
    }

    if (patch.color !== undefined) {
      fields.push("color = ?");
      values.push(patch.color);
    }

    if (patch.updated_at !== undefined) {
      fields.push("updated_at = ?");
      values.push(patch.updated_at);
    }

    if (fields.length === 0) return;

    const sql = `
    UPDATE workout_templates
    SET ${fields.join(", ")}
    WHERE id = ?
  `;

    values.push(id);
    await this.run(sql, ...values);
  }

  async delete(id: string): Promise<void> {
    await this.run(`DELETE FROM workout_templates WHERE id = ?`, id);
  }

  async findAllOrdered(): Promise<WorkoutTemplateRow[]> {
    return this.getAll<WorkoutTemplateRow>(
      `SELECT * FROM workout_templates ORDER BY created_at DESC`
    );
  }
  async findById(id: string): Promise<WorkoutTemplateRow | null> {
    const rows = await this.getAll<WorkoutTemplateRow>(
      `SELECT * FROM workout_templates WHERE id = ? LIMIT 1`,
      id
    );
    return rows[0] ?? null;
  }
}
