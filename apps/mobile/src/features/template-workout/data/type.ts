export type WorkoutTemplateRow = {
  id: string; // UUID
  name: string;
  description: string | null;
  created_at: string; // ISO
  updated_at: string; // ISO
};