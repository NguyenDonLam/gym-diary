import { TemplateExercise } from "../../template-exercise/domain/type";

export type WorkoutTemplate = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  exercises: TemplateExercise[];
};
