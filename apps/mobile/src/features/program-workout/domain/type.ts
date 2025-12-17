import {
  ExerciseProgram,
  ExerciseProgramFormData,
} from "../../program-exercise/domain/type";

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

export const COLOR_STRIP_MAP: Record<ProgramColor, string> = {
  neutral: "bg-neutral-400",
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
  teal: "bg-teal-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
};

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
