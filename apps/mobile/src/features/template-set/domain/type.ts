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


export type TemplateSetFormData = {
  id: string; // local UUID for the form
  reps: string; // raw text input
  weight: string; // raw text input
  rpe: string; // raw text input
};

