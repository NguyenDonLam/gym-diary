import { LoadUnit, TemplateSet } from "../../template-set/domain/type";


export type SessionSet = {
  id: string;

  sessionExerciseId: string;
  templateSetId: string | null;
  templateSet?: TemplateSet;

  orderIndex: number;

  reps: number | null;
  loadUnit: LoadUnit;
  loadValue: string | null;
  rpe: number | null;

  isWarmup: boolean;

  note: string | null;

  createdAt: Date;
  updatedAt: Date;
};
