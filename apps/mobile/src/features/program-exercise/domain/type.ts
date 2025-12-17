import { Exercise } from "@packages/exercise";
import { SetProgram, SetProgramFormData } from "../../program-set/domain/type";
import { WorkoutProgram } from "../../program-workout/domain/type";

export type ExerciseProgram = {
  id: string;
  exerciseId: string;
  workoutProgramId: string;
  workoutProgram?: WorkoutProgram;
  exercise?: Exercise;
  orderIndex: number; // 1, 2, 3, ...
  note: string | null;
  sets: SetProgram[];
  createdAt: Date;
  updatedAt: Date;
};

export type ExerciseProgramFormData = {
  id: string; // local UUID for the form
  exerciseId: string | null; // canonical exercise id if selected
  isCustom: boolean; // true if using custom name
  sets: SetProgramFormData[];
};
