import { TemplateSet, TemplateSetFormData } from "../../template-set/domain/type";


export type TemplateExercise = {
  id: string;
  exerciseId: string;
  orderIndex: number; // 1, 2, 3, ...
  notes: string | null;
  sets: TemplateSet[];
};

export type TemplateExerciseFormData = {
  id: string; // local UUID for the form
  exerciseId: string | null; // canonical exercise id if selected
  isCustom: boolean; // true if using custom name
  sets: TemplateSetFormData[];
};
