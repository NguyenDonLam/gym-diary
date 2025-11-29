// src/features/workoutTemplate/domain/TemplateSet.ts

export type TemplateSet = {
  id: string; // UUID
  templateExerciseId: string;
  orderIndex: number; // 1, 2, 3,…
  targetReps: number | null;
  targetWeight: number | null;
  targetRpe: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};
