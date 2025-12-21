import { LoadUnit } from "@/db/enums";
import { SetProgram } from "../../program-set/domain/type";

export type SessionSet = {
  id: string;

  sessionExerciseId: string;
  setProgramId: string | null;
  setProgram?: SetProgram;

  orderIndex: number;

  targetQuantity: number | null;
  loadUnit: LoadUnit;
  loadValue: string | null;
  rpe: number | null;

  isCompleted: boolean;
  isWarmup: boolean;

  note: string | null;

  e1rm: number | null;
  e1rmVersion: number;

  createdAt: Date;
  updatedAt: Date;
};
