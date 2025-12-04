import {
  TemplateExercise,
  TemplateExerciseFormData,
} from "../../template-exercise/domain/type";

export type TemplateColor =
  | "neutral"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "purple"
  | "pink";

export type TemplateWorkout = {
  id: string;
  name: string;
  description: string | null;
  folderId: string | null;
  color: TemplateColor;
  createdAt: Date;
  updatedAt: Date;
  exercises: TemplateExercise[];
};

export type TemplateWorkoutFormData = {
  name: string;
  description: string;
  folderId: string | null;
  color: TemplateColor;
  exercises: TemplateExerciseFormData[];
};
