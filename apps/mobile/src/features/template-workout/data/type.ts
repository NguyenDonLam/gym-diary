import { TemplateColor } from "../domain/type";

export type WorkoutTemplateRow = {
  id: string; // UUID
  name: string;
  color: TemplateColor;
  folder_id: string | null;
  description: string | null;
  created_at: string; // ISO
  updated_at: string; // ISO
};