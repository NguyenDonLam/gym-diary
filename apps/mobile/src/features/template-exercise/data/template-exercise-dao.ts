import { BaseDao } from "@/src/lib/base-dao";
import type { SQLiteDatabase } from "expo-sqlite";
import { TemplateExerciseRow } from "./type";

export class TemplateExerciseDao extends BaseDao<TemplateExerciseRow> {
  constructor(db: SQLiteDatabase) {
    super(db, "template_exercises");
  }

  async insert(row: TemplateExerciseRow): Promise<void> {
    await this.run(
      `
        INSERT INTO template_exercises (
          id,
          workout_template_id,
          exercise_id,
          order_index,
          notes,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      row.id,
      row.workout_template_id,
      row.exercise_id,
      row.order_index,
      row.notes,
      row.created_at,
      row.updated_at
    );
  }

  async update(id: string, patch: Partial<TemplateExerciseRow>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (patch.workout_template_id !== undefined) {
      fields.push("workout_template_id = ?");
      values.push(patch.workout_template_id);
    }
    if (patch.exercise_id !== undefined) {
      fields.push("exercise_id = ?");
      values.push(patch.exercise_id);
    }
    if (patch.order_index !== undefined) {
      fields.push("order_index = ?");
      values.push(patch.order_index);
    }
    if (patch.notes !== undefined) {
      fields.push("notes = ?");
      values.push(patch.notes);
    }
    if (patch.updated_at !== undefined) {
      fields.push("updated_at = ?");
      values.push(patch.updated_at);
    }

    if (fields.length === 0) return;

    const sql = `
      UPDATE template_exercises
      SET ${fields.join(", ")}
      WHERE id = ?
    `;

    values.push(id);
    await this.run(sql, ...values);
  }

  async delete(id: string): Promise<void> {
    await this.run(`DELETE FROM template_exercises WHERE id = ?`, id);
  }

  async deleteByTemplateId(templateId: string): Promise<void> {
    await this.run(
      `DELETE FROM template_exercises WHERE workout_template_id = ?`,
      templateId
    );
  }

  async findById(id: string): Promise<TemplateExerciseRow | null> {
    const rows = await this.getAll<TemplateExerciseRow>(
      `SELECT * FROM template_exercises WHERE id = ? LIMIT 1`,
      id
    );
    return rows[0] ?? null;
  }

  async findByTemplateId(templateId: string): Promise<TemplateExerciseRow[]> {
    return this.getAll<TemplateExerciseRow>(
      `
        SELECT *
        FROM template_exercises
        WHERE workout_template_id = ?
        ORDER BY order_index ASC, created_at ASC
      `,
      templateId
    );
  }
}
