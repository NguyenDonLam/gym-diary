// src/features/template-set/data/type.ts
export type TemplateSetRow = {
  id: string; // UUID
  template_exercise_id: string;
  order_index: number;
  target_reps: number | null;
  target_weight: number | null;
  target_rpe: number | null;
  notes: string | null;
  created_at: string; // ISO
  updated_at: string; // ISO
};
