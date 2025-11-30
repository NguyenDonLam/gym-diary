import {
  TemplateExercise,
  TemplateExerciseFormData,
} from "../../template-exercise/domain/type";

export type TemplateWorkout = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  exercises: TemplateExercise[];
};

export type TemplateWorkoutFormData = {
  name: string;
  description: string;
  exercises: TemplateExerciseFormData[];
};
