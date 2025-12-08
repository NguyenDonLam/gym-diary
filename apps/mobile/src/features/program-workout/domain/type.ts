import { ExerciseProgram, ExerciseProgramFormData } from "../../program-exercise/domain/type";


export type ProgramColor =
  | "neutral"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "purple"
  | "pink";

export type WorkoutProgram = {
  id: string;
  name: string;
  description: string | null;
  folderId: string | null;
  color: ProgramColor;
  createdAt: Date;
  updatedAt: Date;
  exercises: ExerciseProgram[];
};

export type WorkoutProgramFormData = {
  name: string;
  description: string;
  folderId: string | null;
  color: ProgramColor;
  exercises: ExerciseProgramFormData[];
};
