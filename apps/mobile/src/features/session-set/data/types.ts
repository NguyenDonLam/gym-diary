import { sessionSets, setPrograms } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";
import { SetProgramRow } from "../../program-set/data/type";

type SessionSetRowRaw = InferSelectModel<typeof sessionSets>;

// If you also want it to be valid when you *didn't* include the relation
export type SessionSetRow = SessionSetRowRaw & {
  setProgram?: SetProgramRow | null;
};
