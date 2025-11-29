import { TemplateSet } from "../../template-set/domain/type";


export type TemplateExercise = {
  id: string;
  exerciseId: string;
  orderIndex: number; // 1, 2, 3, ...
  notes: string | null;
  sets: TemplateSet[];
};
