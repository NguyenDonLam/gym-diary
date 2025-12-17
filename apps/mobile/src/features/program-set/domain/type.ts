export type LoadUnit = "kg" | "lb" | "band" | "time" | "custom";

export type SetProgram = {
  id: string; // UUID
  exerciseProgramId: string;
  orderIndex: number; // 1, 2, 3, …
  targetQuantity: number | null;
  loadUnit: LoadUnit;
  loadValue: string | null;
  targetRpe: number | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SetProgramFormData = {
  id: string; // local UUID for the form
  targetQuantity: number | null; // raw text input
  loadUnit: LoadUnit;
  loadValue: string; // raw text input (number, color name, etc.)
  rpe: string; // raw text input
};
