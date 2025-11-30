// src/features/template-set/data/template-set-dao.ts
import { BaseDao } from "@/src/lib/base-dao";
import type { SQLiteDatabase } from "expo-sqlite";
import type { TemplateSetRow } from "./type";

export class TemplateSetDao extends BaseDao<TemplateSetRow> {
  constructor(db: SQLiteDatabase) {
    super(db, "template_sets");
  }

  async insert(row: TemplateSetRow): Promise<void> {
    await this.run(
      `
        INSERT INTO template_sets (
          id,
          template_exercise_id,
          order_index,
          target_reps,
          target_weight,
          target_rpe,
          notes,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      row.id,
      row.template_exercise_id,
      row.order_index,
      row.target_reps,
      row.target_weight,
      row.target_rpe,
      row.notes,
      row.created_at,
      row.updated_at
    );
  }

  async update(id: string, patch: Partial<TemplateSetRow>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (patch.order_index !== undefined) {
      fields.push("order_index = ?");
      values.push(patch.order_index);
    }
    if (patch.target_reps !== undefined) {
      fields.push("target_reps = ?");
      values.push(patch.target_reps);
    }
    if (patch.target_weight !== undefined) {
      fields.push("target_weight = ?");
      values.push(patch.target_weight);
    }
    if (patch.target_rpe !== undefined) {
      fields.push("target_rpe = ?");
      values.push(patch.target_rpe);
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
      UPDATE template_sets
      SET ${fields.join(", ")}
      WHERE id = ?
    `;

    values.push(id);
    await this.run(sql, ...values);
  }

  async delete(id: string): Promise<void> {
    await this.run(`DELETE FROM template_sets WHERE id = ?`, id);
  }

  async deleteByTemplateExerciseId(templateExerciseId: string): Promise<void> {
    await this.run(
      `DELETE FROM template_sets WHERE template_exercise_id = ?`,
      templateExerciseId
    );
  }

  async deleteByTemplateId(templateId: string): Promise<void> {
    // clean all sets for all exercises under a template
    await this.run(
      `
        DELETE FROM template_sets
        WHERE template_exercise_id IN (
          SELECT id
          FROM template_exercises
          WHERE workout_template_id = ?
        )
      `,
      templateId
    );
  }

  async findByTemplateExerciseId(
    templateExerciseId: string
  ): Promise<TemplateSetRow[]> {
    return this.getAll<TemplateSetRow>(
      `
        SELECT *
        FROM template_sets
        WHERE template_exercise_id = ?
        ORDER BY order_index ASC, created_at ASC
      `,
      templateExerciseId
    );
  }
}
