export type TemplateExerciseRow = {
  id: string; // UUID
  workout_template_id: string;
  exercise_id: string;
  order_index: number;
  notes: string | null;
  created_at: string; // ISO
  updated_at: string; // ISO
};
