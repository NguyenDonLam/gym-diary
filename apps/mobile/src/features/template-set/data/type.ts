// src/features/template-set/data/type.ts

import { LoadUnit } from "../domain/type";

export type TemplateSetRow = {
  id: string; // UUID
  template_exercise_id: string;
  order_index: number;
  target_reps: number | null;
  load_unit: LoadUnit;
  load_value: string | null; // numeric-as-text or label (e.g. "60", "green")
  target_rpe: number | null;
  notes: string | null;
  created_at: string; // ISO
  updated_at: string; // ISO
};
